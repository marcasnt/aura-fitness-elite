import { createClient } from '@supabase/supabase-js';
import type { User, RoutineDay, Exercise, WorkoutLog, Message } from '../types/fitness';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ─── Helper: Log detallado de errores de Supabase ───
const logSupabaseError = (context: string, error: any) => {
  console.error(`[Supabase Error :: ${context}]`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
};

// ─── Storage: Subir avatar ───
export const uploadAvatarToStorage = async (userId: string, base64Image: string): Promise<string> => {
  // Convertir base64 a Blob
  const response = await fetch(base64Image);
  const blob = await response.blob();
  const fileExt = blob.type.split('/')[1] || 'png';
  const fileName = `${userId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
};

// ─── Mappers: Supabase snake_case → App camelCase ───

const mapProfile = (row: any): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  avatar: row.avatar,
  selfieUrl: row.selfie_url,
  goal: row.goal,
  phone: row.phone,
  streak: row.streak ?? 0,
  adherenceRate: row.adherence_rate ?? 100,
  weightHistory: row.weight_history ?? [],
  monthlyFee: row.monthly_fee ?? 0,
  nextPaymentDate: row.next_payment_date ?? '',
  paymentStatus: row.payment_status ?? 'pending',
  paymentHistory: row.payment_history ?? [],
});

const mapRoutine = (row: any): RoutineDay => ({
  id: row.id,
  clientId: row.client_id,
  name: row.name,
  description: row.description,
  isActive: row.is_active,
  createdAt: row.created_at?.split('T')[0] ?? '',
  exercises: (row.exercises ?? []).map((ex: any) => ({
    id: ex.id,
    name: ex.name,
    category: ex.category,
    sets: ex.sets,
    reps: ex.reps,
    weight: ex.weight,
    restTime: ex.rest_time,
    notes: ex.notes,
    imageUrl: ex.image_url,
  })) as Exercise[],
});

const mapLog = (row: any): WorkoutLog => ({
  id: row.id,
  clientId: row.client_id,
  routineDayId: row.routine_id ?? '',
  routineName: row.routine_name ?? '',
  date: row.workout_date,
  durationMinutes: row.duration_minutes,
  exercises: row.exercises ?? [],
  feelingScore: row.feeling_score,
  coachNotes: row.coach_notes,
});

const mapMessage = (row: any): Message => ({
  id: row.id,
  senderId: row.sender_id,
  receiverId: row.receiver_id,
  content: row.content,
  timestamp: row.created_at,
  isRead: row.is_read,
});

// ─── Profiles ───

export const getProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return mapProfile(data);
};

export const getAllClients = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProfile);
};

export const getAllProfiles = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProfile);
};

export const getCoachProfile = async (): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'coach')
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
};

export const createClientProfile = async (payload: {
  email: string;
  password: string;
  name: string;
  goal?: string;
  phone?: string;
  monthlyFee: number;
  nextPaymentDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  avatar?: string;
  selfieUrl?: string;
}) => {
  // 1. Crear usuario en Auth — pasamos todos los datos en user_metadata
  //    para que el trigger handle_new_user cree el perfil completo de una vez.
  // 1. Crear usuario en Auth — SOLO email y password, sin metadata
  //    para evitar errores 500 del trigger en Supabase.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No se pudo crear el usuario');

  // 2. Subir imagen a Storage si es base64 (evita pasar base64 gigante por RPC)
  let avatarUrl = payload.avatar;
  let selfieUrl = payload.selfieUrl;
  if (payload.selfieUrl && payload.selfieUrl.startsWith('data:')) {
    try {
      const publicUrl = await uploadAvatarToStorage(authData.user.id, payload.selfieUrl);
      avatarUrl = publicUrl;
      selfieUrl = publicUrl;
    } catch (e: any) {
      console.error('Error subiendo avatar a Storage:', e);
      // Si falla el upload, usar avatar por defecto
      avatarUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&q=80&w=200`;
      selfieUrl = '';
    }
  }

  // 3. Crear/actualizar perfil completo via RPC (solo URLs cortas, no base64)
  const { error: rpcError } = await supabase.rpc('upsert_client_by_coach', {
    client_id: authData.user.id,
    client_email: payload.email,
    client_name: payload.name,
    client_goal: payload.goal || 'Hipertrofia General',
    client_phone: payload.phone || '+34600000000',
    client_monthly_fee: payload.monthlyFee,
    client_next_payment_date: payload.nextPaymentDate,
    client_payment_status: payload.paymentStatus,
    client_avatar: avatarUrl || null,
    client_selfie_url: selfieUrl || null,
  });
  if (rpcError) throw rpcError;

  return authData.user.id;
};

export const updateProfile = async (userId: string, updates: Partial<User>) => {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.goal !== undefined) dbUpdates.goal = updates.goal;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
  if (updates.adherenceRate !== undefined) dbUpdates.adherence_rate = updates.adherenceRate;
  if (updates.weightHistory !== undefined) dbUpdates.weight_history = updates.weightHistory;
  if (updates.monthlyFee !== undefined) dbUpdates.monthly_fee = updates.monthlyFee;
  if (updates.nextPaymentDate !== undefined) dbUpdates.next_payment_date = updates.nextPaymentDate;
  if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
  if (updates.paymentHistory !== undefined) dbUpdates.payment_history = updates.paymentHistory;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
  if (updates.selfieUrl !== undefined) dbUpdates.selfie_url = updates.selfieUrl;

  const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
  if (error) throw error;
};

export const deleteClientProfile = async (clientId: string) => {
  // El ON DELETE CASCADE en profiles referenciando auth.users no funciona desde cliente.
  // Eliminamos el perfil; la limpieza de auth.users debe hacerse desde Edge Function o manualmente.
  const { error } = await supabase.from('profiles').delete().eq('id', clientId);
  if (error) throw error;
};

// ─── Routines ───

export const getAllRoutines = async (): Promise<RoutineDay[]> => {
  const { data, error } = await supabase
    .from('routines')
    .select('*, exercises(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRoutine);
};

export const getRoutinesByClient = async (clientId: string): Promise<RoutineDay[]> => {
  const { data, error } = await supabase
    .from('routines')
    .select('*, exercises(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRoutine);
};

export const createRoutine = async (routine: Omit<RoutineDay, 'id' | 'createdAt' | 'exercises'>) => {
  // Usar RPC para bypass RLS (evita error 403 cuando el JWT del coach falla)
  const { data, error } = await supabase.rpc('create_routine', {
    p_client_id: routine.clientId,
    p_name: routine.name,
    p_description: routine.description || null,
    p_is_active: routine.isActive,
  });
  if (error) {
    logSupabaseError('createRoutine (RPC)', error);
    throw error;
  }
  // La RPC devuelve JSON con snake_case keys
  const row = data as any;
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at?.split('T')[0] ?? '',
    exercises: [],
  } as RoutineDay;
};

export const addExercise = async (exercise: Omit<Exercise, 'id'> & { routineId: string }) => {
  const { error } = await supabase.rpc('add_exercise', {
    p_routine_id: exercise.routineId,
    p_name: exercise.name,
    p_category: exercise.category,
    p_sets: exercise.sets,
    p_reps: exercise.reps,
    p_weight: exercise.weight,
    p_rest_time: exercise.restTime,
    p_notes: exercise.notes || null,
    p_image_url: exercise.imageUrl || null,
    p_position: 0,
  });
  if (error) {
    logSupabaseError('addExercise (RPC)', error);
    throw error;
  }
};

export const deleteExercise = async (exerciseId: string) => {
  const { error } = await supabase.rpc('delete_exercise', {
    p_exercise_id: exerciseId,
  });
  if (error) {
    logSupabaseError('deleteExercise (RPC)', error);
    throw error;
  }
};

// ─── Workout Logs ───

export const getLogsByClient = async (clientId: string): Promise<WorkoutLog[]> => {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('workout_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapLog);
};

export const getAllLogs = async (): Promise<WorkoutLog[]> => {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .order('workout_date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapLog);
};

export const createWorkoutLog = async (log: Omit<WorkoutLog, 'id'>) => {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      client_id: log.clientId,
      routine_id: log.routineDayId || null,
      routine_name: log.routineName,
      workout_date: log.date,
      duration_minutes: log.durationMinutes,
      exercises: log.exercises,
      feeling_score: log.feelingScore,
      coach_notes: log.coachNotes,
    })
    .select()
    .single();
  if (error) throw error;
  return mapLog(data);
};

// ─── Messages ───

export const getMessagesBetweenUsers = async (userA: string, userB: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`
    )
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapMessage);
};

export const getAllMessages = async (): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapMessage);
};

export const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp'>) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: msg.senderId,
      receiver_id: msg.receiverId,
      content: msg.content,
      is_read: msg.isRead,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMessage(data);
};

// ─── Payments ───

export const createPayment = async (payment: {
  client_id: string;
  amount: number;
  status: string;
  method: string;
  payment_date: string;
  notes?: string;
}) => {
  const { data, error } = await supabase.rpc('create_payment', {
    p_client_id: payment.client_id,
    p_amount: payment.amount,
    p_status: payment.status,
    p_method: payment.method,
    p_payment_date: payment.payment_date,
    p_notes: payment.notes || null,
  });
  if (error) {
    logSupabaseError('createPayment (RPC)', error);
    throw error;
  }
  return data;
};

export const getPaymentsByClient = async (clientId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
};

// ─── Realtime Subscriptions ───

export const subscribeToMessages = (userId: string, callback: (msg: Message) => void) => {
  const channel = supabase
    .channel(`messages-user-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const msg = mapMessage(payload.new);
        // Solo notificar mensajes donde el usuario actual es emisor o receptor
        if (msg.senderId === userId || msg.receiverId === userId) {
          callback(msg);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Error de canal de mensajes');
      }
      if (status === 'TIMED_OUT') {
        console.warn('[Realtime] Timeout de conexión');
      }
    });

  return channel;
};

export const subscribeToProfiles = (callback: (profile: User) => void) => {
  return supabase
    .channel('public:profiles')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      (payload) => callback(mapProfile(payload.new))
    )
    .subscribe();
};

export const subscribeToWorkoutLogs = (clientId: string, callback: (log: WorkoutLog) => void) => {
  return supabase
    .channel(`logs:${clientId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'workout_logs', filter: `client_id=eq.${clientId}` },
      (payload) => callback(mapLog(payload.new))
    )
    .subscribe();
};
