-- ============================================================
-- FIX: Error 500 en profiles causado por políticas RLS
-- recursivas y subconsultas a la misma tabla.
-- ============================================================

-- 1. Función helper: verifica si el usuario actual es coach
--    SECURITY DEFINER evita problemas de recursión RLS
DROP FUNCTION IF EXISTS public.is_coach();
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coach'
  );
END;
$$;

-- Permisos para que todos puedan usar la función
GRANT EXECUTE ON FUNCTION public.is_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach() TO anon;

-- ============================================================
-- 2. POLÍTICAS profiles (sin subconsultas recursivas)
-- ============================================================

-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Coach ve todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Coach gestiona clientes" ON public.profiles;

-- SELECT: cada usuario ve su perfil; coach ve todos
CREATE POLICY "Usuarios ven su propio perfil"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Coach ve todos los perfiles"
  ON public.profiles FOR SELECT
  USING (public.is_coach());

-- UPDATE: cada usuario edita su perfil; coach edita todos
CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Coach actualiza todos los perfiles"
  ON public.profiles FOR UPDATE
  USING (public.is_coach());

-- INSERT/DELETE: solo coach
CREATE POLICY "Coach gestiona clientes insert"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_coach());

CREATE POLICY "Coach gestiona clientes delete"
  ON public.profiles FOR DELETE
  USING (public.is_coach());

-- ============================================================
-- 3. POLÍTICAS routines (usar is_coach en lugar de subconsulta)
-- ============================================================
DROP POLICY IF EXISTS "Coach puede gestionar rutinas" ON public.routines;
DROP POLICY IF EXISTS "Clientes ven sus propias rutinas" ON public.routines;

CREATE POLICY "Coach puede gestionar rutinas"
  ON public.routines FOR ALL
  USING (public.is_coach())
  WITH CHECK (public.is_coach());

CREATE POLICY "Clientes ven sus propias rutinas"
  ON public.routines FOR SELECT
  USING (client_id = auth.uid());

-- ============================================================
-- 4. POLÍTICAS exercises
-- ============================================================
DROP POLICY IF EXISTS "Coach puede gestionar ejercicios" ON public.exercises;
DROP POLICY IF EXISTS "Clientes ven ejercicios de sus rutinas" ON public.exercises;

CREATE POLICY "Coach puede gestionar ejercicios"
  ON public.exercises FOR ALL
  USING (public.is_coach());

CREATE POLICY "Clientes ven ejercicios de sus rutinas"
  ON public.exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.routines
    WHERE id = exercises.routine_id AND client_id = auth.uid()
  ));

-- ============================================================
-- 5. POLÍTICAS workout_logs
-- ============================================================
DROP POLICY IF EXISTS "Coach ve todos los logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Clientes ven sus propios logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Clientes crean sus propios logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Coach crea logs para clientes" ON public.workout_logs;

CREATE POLICY "Coach ve todos los logs"
  ON public.workout_logs FOR SELECT
  USING (public.is_coach());

CREATE POLICY "Clientes ven sus propios logs"
  ON public.workout_logs FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clientes crean sus propios logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coach crea logs para clientes"
  ON public.workout_logs FOR INSERT
  WITH CHECK (public.is_coach());

-- ============================================================
-- 6. POLÍTICAS messages
-- ============================================================
DROP POLICY IF EXISTS "Usuarios ven sus mensajes" ON public.messages;
DROP POLICY IF EXISTS "Usuarios envían mensajes" ON public.messages;

CREATE POLICY "Usuarios ven sus mensajes"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Usuarios envían mensajes"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- 7. POLÍTICAS payments
-- ============================================================
DROP POLICY IF EXISTS "Coach gestiona pagos" ON public.payments;
DROP POLICY IF EXISTS "Clientes ven sus pagos" ON public.payments;

CREATE POLICY "Coach gestiona pagos"
  ON public.payments FOR ALL
  USING (public.is_coach());

CREATE POLICY "Clientes ven sus pagos"
  ON public.payments FOR SELECT
  USING (client_id = auth.uid());
