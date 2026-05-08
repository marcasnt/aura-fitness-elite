-- ============================================================
-- FIX RLS COACH: Diagnóstico y corrección para error 403 en rutines
-- Ejecutar en Supabase SQL Editor si el coach no puede crear rutinas
-- ============================================================

-- --------------------------------------------------
-- 1. DIAGNÓSTICO: Verificar rol del coach
-- --------------------------------------------------
SELECT id, email, name, role, created_at
FROM public.profiles
WHERE email = 'marcasnt@gmail.com';

-- Si la columna 'role' dice 'client', ejecuta esto:
-- UPDATE public.profiles SET role = 'coach', name = 'Coach Marcus' WHERE email = 'marcasnt@gmail.com';

-- --------------------------------------------------
-- 2. DIAGNÓSTICO: Verificar función is_coach()
-- --------------------------------------------------
SELECT proname, prosrc, proowner::regrole
FROM pg_proc
WHERE proname = 'is_coach';

-- --------------------------------------------------
-- 3. DIAGNÓSTICO: Verificar policies de routines
-- --------------------------------------------------
SELECT policyname, cmd, qual::text, with_check::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'routines';

-- --------------------------------------------------
-- 4. FIX ALTERNATIVO: Si is_coach() falla, usar email directo
--    (Descomenta y ejecuta SOLO si el diagnóstico muestra que is_coach falla)
-- --------------------------------------------------

-- 4a. Eliminar policies viejas de routines
-- DROP POLICY IF EXISTS "Coach gestiona rutinas" ON public.routines;
-- DROP POLICY IF EXISTS "Clientes ven sus rutinas" ON public.routines;

-- 4b. Crear policies usando email del coach (más robusto, sin recursión)
-- NOTA: Reemplaza 'marcasnt@gmail.com' si tu email de coach es diferente
-- CREATE POLICY "Coach gestiona rutinas"
--   ON public.routines FOR ALL
--   USING (auth.email() = 'marcasnt@gmail.com')
--   WITH CHECK (auth.email() = 'marcasnt@gmail.com');

-- CREATE POLICY "Clientes ven sus rutinas"
--   ON public.routines FOR SELECT
--   USING (client_id = auth.uid());

-- --------------------------------------------------
-- 5. FIX ALTERNATIVO 2: Usar UUID directo del coach
--    (Más seguro que email, descomenta y reemplaza el UUID)
-- --------------------------------------------------

-- 5a. Obtén primero el UUID real de tu coach:
-- SELECT id FROM public.profiles WHERE email = 'marcasnt@gmail.com';

-- 5b. Luego reemplaza 'UUID-AQUI' con el UUID real y descomenta:
-- DROP POLICY IF EXISTS "Coach gestiona rutinas" ON public.routines;
-- CREATE POLICY "Coach gestiona rutinas"
--   ON public.routines FOR ALL
--   USING (auth.uid() = 'UUID-AQUI')
--   WITH CHECK (auth.uid() = 'UUID-AQUI');

-- --------------------------------------------------
-- 6. FIX SUPER ROBUSTO: Combinación de ambos (email + uuid fallback)
-- --------------------------------------------------
-- DROP POLICY IF EXISTS "Coach gestiona rutinas" ON public.routines;
-- CREATE POLICY "Coach gestiona rutinas"
--   ON public.routines FOR ALL
--   USING (
--     auth.email() = 'marcasnt@gmail.com'
--     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
--   )
--   WITH CHECK (
--     auth.email() = 'marcasnt@gmail.com'
--     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
--   );

-- --------------------------------------------------
-- 7. LIMPIEZA: Asegurar que RLS esté habilitado y no haya policies duplicadas
-- --------------------------------------------------
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

-- Eliminar cualquier policy huérfana de routines (si existe)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'routines'
      AND policyname NOT IN ('Coach gestiona rutinas', 'Clientes ven sus rutinas')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.routines', pol.policyname);
    RAISE NOTICE 'Dropped orphan policy: %', pol.policyname;
  END LOOP;
END $$;
