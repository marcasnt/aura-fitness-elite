-- Índices para acelerar las queries más frecuentes de la app
-- Ejecutar esto en el SQL Editor de Supabase

-- Profiles: búsqueda por rol (coach/client) y estado de pago
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON public.profiles(payment_status);

-- Routines: filtrado por cliente y rutinas activas
CREATE INDEX IF NOT EXISTS idx_routines_client_id ON public.routines(client_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON public.routines(is_active);

-- Exercises: carga por día de rutina
CREATE INDEX IF NOT EXISTS idx_exercises_routine_id ON public.exercises(routine_id);

-- Workout logs: filtrado por cliente y orden por fecha
CREATE INDEX IF NOT EXISTS idx_workout_logs_client_id ON public.workout_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_date ON public.workout_logs(workout_date DESC);

-- Messages: conversaciones y orden cronológico
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Analizar tablas para que PostgreSQL use los nuevos índices inmediatamente
ANALYZE public.profiles;
ANALYZE public.routines;
ANALYZE public.exercises;
ANALYZE public.workout_logs;
ANALYZE public.messages;
