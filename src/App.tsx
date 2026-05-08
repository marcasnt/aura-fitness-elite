import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, RoutineDay, WorkoutLog, Message, Exercise } from './types/fitness';
import { LoginScreen } from './components/LoginScreen';
import { CoachDashboard } from './components/CoachDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { Info, Database } from 'lucide-react';
import {
  supabase,
  getProfile,
  getAllClients,
  getAllRoutines,
  getRoutinesByClient,
  getAllLogs,
  getLogsByClient,
  getAllMessages,
  getCoachProfile,
  createClientProfile,
  updateProfile,
  deleteClientProfile,
  createRoutine,
  addExercise,
  deleteExercise as deleteExerciseDb,
  createWorkoutLog,
  createPayment,
  sendMessage as sendMessageDb,
  subscribeToMessages,
} from './lib/supabase';
import { signOut } from './lib/auth';

const hasSupabaseConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<User | null>(null);
  const [clients, setClients] = useState<User[]>([]);
  const [routines, setRoutines] = useState<RoutineDay[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSupabaseBlueprint, setShowSupabaseBlueprint] = useState(false);
  const coachIdRef = useRef<string | null>(null);

  // ─── Carga inicial y auth state ───
  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);
      // Refrescar sesión para asegurar JWT actualizado (rol, metadata, etc.)
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('[Auth] No se pudo refrescar la sesión:', refreshError.message);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
          if (profile.role === 'coach') coachIdRef.current = profile.id;
          await loadAllData(profile);
        }
      }
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Protección: si el coach creó un cliente, signUp dispara brevemente
        // una sesión del nuevo usuario. Ignorar si ya somos coach con ID distinto.
        if (coachIdRef.current && session.user.id !== coachIdRef.current) {
          return;
        }
        const profile = await getProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
          if (profile.role === 'coach') coachIdRef.current = profile.id;
          await loadAllData(profile);
        }
      } else {
        setCurrentUser(null);
        coachIdRef.current = null;
        setClients([]);
        setRoutines([]);
        setLogs([]);
        setMessages([]);
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const loadAllData = async (user: User) => {
    try {
      if (user.role === 'coach') {
        setCoach(user);
        const [c, r, l, m] = await Promise.all([
          getAllClients(),
          getAllRoutines(),
          getAllLogs(),
          getAllMessages(),
        ]);
        setClients(c);
        setRoutines(r);
        setLogs(l);
        setMessages(m);
      } else {
        const [r, l, m, coachProfile] = await Promise.all([
          getRoutinesByClient(user.id),
          getLogsByClient(user.id),
          getAllMessages(),
          getCoachProfile(),
        ]);
        setRoutines(r);
        setLogs(l);
        setMessages(m);
        if (coachProfile) setCoach(coachProfile);
      }
    } catch (e) {
      console.error('Error cargando datos de Supabase:', e);
    }
  };

  // ─── Realtime: mensajes ───
  useEffect(() => {
    if (!hasSupabaseConfig || !currentUser) return;
    const sub = subscribeToMessages(currentUser.id, (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => { sub.unsubscribe(); };
  }, [currentUser]);

  // ─── Handlers async ───
  const handleLoginSuccess = useCallback(async () => {
    if (!hasSupabaseConfig) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await getProfile(user.id);
      if (profile) {
        setCurrentUser(profile);
        await loadAllData(profile);
      }
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
    setCoach(null);
    setClients([]);
    setRoutines([]);
    setLogs([]);
    setMessages([]);
  }, []);

  const handleAddClient = async (payload: {
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
    if (!hasSupabaseConfig) return;
    try {
      await createClientProfile(payload);
      const updated = await getAllClients();
      setClients(updated);
    } catch (err: any) {
      console.error('Error creando cliente:', err);
      alert(err?.message || 'Error creando cliente. Revisa la consola.');
      throw err;
    }
  };

  const handleAddRoutineDay = async (routine: Omit<RoutineDay, 'id' | 'createdAt' | 'exercises'>) => {
    if (!hasSupabaseConfig) return;
    await createRoutine(routine);
    const updated = currentUser?.role === 'coach' ? await getAllRoutines() : await getAllRoutines();
    setRoutines(updated);
  };

  const handleAddExercise = async (routineDayId: string, exercise: Exercise) => {
    if (!hasSupabaseConfig) return;
    await addExercise({ ...exercise, routineId: routineDayId });
    const updated = currentUser?.role === 'coach' ? await getAllRoutines() : await getAllRoutines();
    setRoutines(updated);
  };

  const handleDeleteExercise = async (_routineDayId: string, exerciseId: string) => {
    if (!hasSupabaseConfig) return;
    await deleteExerciseDb(exerciseId);
    const updated = currentUser?.role === 'coach' ? await getAllRoutines() : await getAllRoutines();
    setRoutines(updated);
  };

  const handleSendMessage = async (receiverId: string, content: string) => {
    if (!currentUser || !hasSupabaseConfig) return;
    await sendMessageDb({
      senderId: currentUser.id,
      receiverId,
      content,
      isRead: false,
    });
    const updated = await getAllMessages();
    setMessages(updated);
  };

  const handleAddLog = async (log: WorkoutLog) => {
    if (!hasSupabaseConfig) return;
    await createWorkoutLog(log);
    const updated = currentUser ? await getLogsByClient(currentUser.id) : await getAllLogs();
    setLogs(updated);
  };

  const handleUpdateClientStreak = async (clientId: string, newStreak: number) => {
    if (!hasSupabaseConfig) return;
    await updateProfile(clientId, { streak: newStreak });
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, streak: newStreak } : c)));
    if (currentUser && currentUser.id === clientId) {
      setCurrentUser((prev) => (prev ? { ...prev, streak: newStreak } : null));
    }
  };

  const handleUpdateClientAvatar = async (clientId: string, avatarBase64: string) => {
    if (!hasSupabaseConfig) return;
    await updateProfile(clientId, { avatar: avatarBase64, selfieUrl: avatarBase64 });
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, selfieUrl: avatarBase64, avatar: avatarBase64 } : c)));
    if (currentUser && currentUser.id === clientId) {
      setCurrentUser((prev) => (prev ? { ...prev, selfieUrl: avatarBase64, avatar: avatarBase64 } : null));
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('⚠️ ¿Estás seguro de eliminar este atleta? Se borrarán sus datos.')) return;
    if (!hasSupabaseConfig) return;
    await deleteClientProfile(clientId);
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setRoutines((prev) => prev.filter((r) => r.clientId !== clientId));
    setLogs((prev) => prev.filter((l) => l.clientId !== clientId));
    setMessages((prev) => prev.filter((m) => m.senderId !== clientId && m.receiverId !== clientId));
  };

  const handleUpdateClientPayment = async (clientId: string, data: { nextPaymentDate: string; paymentStatus: 'paid' | 'pending' | 'overdue'; monthlyFee: number }) => {
    if (!hasSupabaseConfig) return;
    await updateProfile(clientId, {
      nextPaymentDate: data.nextPaymentDate,
      paymentStatus: data.paymentStatus,
      monthlyFee: data.monthlyFee,
    });
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, ...data } : c)));
  };

  const handleMarkPaymentPaid = async (clientId: string) => {
    if (!hasSupabaseConfig) return;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    const nextPaymentDate = nextDate.toISOString().split('T')[0];
    const newEntry = { date: today, amount: client.monthlyFee, status: 'paid' as const, method: 'Confirmado en app' };
    const newHistory = [newEntry, ...(client.paymentHistory || [])];
    try {
      // 1. Insertar en tabla payments
      await createPayment({
        client_id: clientId,
        amount: client.monthlyFee,
        status: 'paid',
        method: 'Confirmado en app',
        payment_date: today,
        notes: `Pago confirmado por coach`,
      });
      // 2. Actualizar perfil del cliente
      await updateProfile(clientId, {
        paymentStatus: 'paid',
        paymentHistory: newHistory,
        nextPaymentDate,
      });
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, paymentStatus: 'paid' as const, paymentHistory: newHistory, nextPaymentDate }
            : c
        )
      );
    } catch (err: any) {
      console.error('[handleMarkPaymentPaid] Error:', err);
      alert('Error al registrar el pago: ' + (err?.message || 'Desconocido'));
    }
  };

  const handleAddWeightEntry = async (clientId: string, weight: number) => {
    if (!hasSupabaseConfig) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const client = clients.find((c) => c.id === clientId);
    const currentHistory = client?.weightHistory || [];
    const newHistory = [{ date: dateStr, weight }, ...currentHistory];
    await updateProfile(clientId, { weightHistory: newHistory });
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, weightHistory: newHistory } : c)));
    if (currentUser && currentUser.id === clientId) {
      setCurrentUser((prev) => (prev ? { ...prev, weightHistory: newHistory } : null));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#d4f826] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col justify-between">
      <div className="flex-1">
        {!currentUser ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : currentUser.role === 'coach' ? (
          <CoachDashboard
            coach={currentUser}
            clients={clients}
            routines={routines}
            messages={messages}
            onAddClient={handleAddClient}
            onAddRoutineDay={handleAddRoutineDay}
            onAddExercise={handleAddExercise}
            onDeleteExercise={handleDeleteExercise}
            onDeleteClient={handleDeleteClient}
            onUpdateClientPayment={handleUpdateClientPayment}
            onMarkPaymentPaid={handleMarkPaymentPaid}
            onSendMessage={handleSendMessage}
            onUpdateClientAvatar={handleUpdateClientAvatar}
            onLogout={handleLogout}
          />
        ) : (
          <ClientDashboard
            client={currentUser}
            coachId={coach?.id || ''}
            routines={routines}
            logs={logs}
            messages={messages}
            onAddLog={handleAddLog}
            onSendMessage={handleSendMessage}
            onUpdateClientStreak={handleUpdateClientStreak}
            onAddWeightEntry={handleAddWeightEntry}
            onUpdateClientAvatar={handleUpdateClientAvatar}
            onLogout={handleLogout}
          />
        )}
      </div>

      <footer className="bg-[#121214] border-t border-[#1f1f23] p-4 text-center space-y-3 z-30">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#a1a1aa]">
            <Info className="w-4 h-4 text-[#d4f826]" />
            <span>
              Conectado a Supabase: <strong className="text-white">{hasSupabaseConfig ? 'SÍ' : 'NO CONFIGURADO'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSupabaseBlueprint(!showSupabaseBlueprint)}
              className="bg-[#18181b] border border-[#27272a] text-[#d4f826] hover:border-[#d4f826] px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide transition-all flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" /> {showSupabaseBlueprint ? 'OCULTAR SQL SUPABASE' : 'VER SQL SUPABASE'}
            </button>
          </div>
        </div>

        {showSupabaseBlueprint && (
          <div className="max-w-4xl mx-auto text-left bg-[#0e0e10] border border-[#27272a] rounded-xl p-4 text-[11px] font-mono text-[#a1a1aa] space-y-3 animate-fadeIn">
            <p>
              Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en tu archivo <code>.env</code>.
              El SQL completo de tablas está en <code>SUPABASE_SETUP.md</code>.
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}
