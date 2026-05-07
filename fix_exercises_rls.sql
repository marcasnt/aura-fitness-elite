-- ============================================================
-- FIX: Política RLS de exercises no permite INSERT
-- FOR ALL USING no cubre INSERT sin WITH CHECK
-- ============================================================

-- 1. Eliminar política vieja (solo tenía USING, sin WITH CHECK)
DROP POLICY IF EXISTS "Coach puede gestionar ejercicios" ON public.exercises;

-- 2. Crear política nueva con USING y WITH CHECK
CREATE POLICY "Coach puede gestionar ejercicios"
  ON public.exercises FOR ALL
  USING (public.is_coach())
  WITH CHECK (public.is_coach());

-- 3. Asegurar que la política de clientes siga funcionando
DROP POLICY IF EXISTS "Clientes ven ejercicios de sus rutinas" ON public.exercises;
CREATE POLICY "Clientes ven ejercicios de sus rutinas"
  ON public.exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.routines
    WHERE id = exercises.routine_id AND client_id = auth.uid()
  ));
