-- ============================================================
-- FIX RLS POLICIES: Crear todas las políticas que faltan
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios ven su propio perfil"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Coach ve todos los perfiles" ON public.profiles;
CREATE POLICY "Coach ve todos los perfiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Coach gestiona clientes" ON public.profiles;
CREATE POLICY "Coach gestiona clientes"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- ============================================================
-- ROUTINES (la que te falla ahora)
-- ============================================================
DROP POLICY IF EXISTS "Coach puede gestionar rutinas" ON public.routines;
CREATE POLICY "Coach puede gestionar rutinas"
  ON public.routines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS "Clientes ven sus propias rutinas" ON public.routines;
CREATE POLICY "Clientes ven sus propias rutinas"
  ON public.routines FOR SELECT
  USING (client_id = auth.uid());

-- ============================================================
-- EXERCISES
-- ============================================================
DROP POLICY IF EXISTS "Coach puede gestionar ejercicios" ON public.exercises;
CREATE POLICY "Coach puede gestionar ejercicios"
  ON public.exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS "Clientes ven ejercicios de sus rutinas" ON public.exercises;
CREATE POLICY "Clientes ven ejercicios de sus rutinas"
  ON public.exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE id = exercises.routine_id AND client_id = auth.uid()
    )
  );

-- ============================================================
-- WORKOUT_LOGS
-- ============================================================
DROP POLICY IF EXISTS "Coach ve todos los logs" ON public.workout_logs;
CREATE POLICY "Coach ve todos los logs"
  ON public.workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS "Clientes ven sus propios logs" ON public.workout_logs;
CREATE POLICY "Clientes ven sus propios logs"
  ON public.workout_logs FOR SELECT
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clientes crean sus propios logs" ON public.workout_logs;
CREATE POLICY "Clientes crean sus propios logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Coach crea logs para clientes" ON public.workout_logs;
CREATE POLICY "Coach crea logs para clientes"
  ON public.workout_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- ============================================================
-- MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "Usuarios ven sus mensajes" ON public.messages;
CREATE POLICY "Usuarios ven sus mensajes"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Usuarios envían mensajes" ON public.messages;
CREATE POLICY "Usuarios envían mensajes"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- PAYMENTS
-- ============================================================
DROP POLICY IF EXISTS "Coach gestiona pagos" ON public.payments;
CREATE POLICY "Coach gestiona pagos"
  ON public.payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

DROP POLICY IF EXISTS "Clientes ven sus pagos" ON public.payments;
CREATE POLICY "Clientes ven sus pagos"
  ON public.payments FOR SELECT
  USING (client_id = auth.uid());
