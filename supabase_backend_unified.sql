-- ============================================================
-- AURA ELITE FITNESS — Schema Completo y Unificado para Supabase
-- Ejecuta TODO este SQL en el SQL Editor de Supabase (Query nueva)
-- ============================================================

-- --------------------------------------------------
-- 0. LIMPIAR POLICIES VIEJAS (evitar duplicados)
-- --------------------------------------------------
DROP POLICY IF EXISTS "Profiles son visibles para todos los usuarios autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Coach puede crear profiles de clientes" ON public.profiles;
DROP POLICY IF EXISTS "Coach puede actualizar perfiles de clientes" ON public.profiles;
DROP POLICY IF EXISTS "Coach puede eliminar perfiles de clientes" ON public.profiles;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Coach ve todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Coach gestiona clientes" ON public.profiles;
DROP POLICY IF EXISTS "Coach actualiza todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Coach gestiona clientes insert" ON public.profiles;
DROP POLICY IF EXISTS "Coach gestiona clientes delete" ON public.profiles;

DROP POLICY IF EXISTS "Coach puede gestionar rutinas" ON public.routines;
DROP POLICY IF EXISTS "Clientes ven sus propias rutinas" ON public.routines;

DROP POLICY IF EXISTS "Coach puede gestionar ejercicios" ON public.exercises;
DROP POLICY IF EXISTS "Clientes ven ejercicios de sus rutinas" ON public.exercises;

DROP POLICY IF EXISTS "Coach ve todos los logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Clientes pueden crear sus propios logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Clientes pueden ver sus propios logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Clientes crean sus propios logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Coach crea logs para clientes" ON public.workout_logs;
DROP POLICY IF EXISTS "Clientes ven sus propios logs" ON public.workout_logs;

DROP POLICY IF EXISTS "Coach puede ver y enviar mensajes" ON public.messages;
DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes" ON public.messages;
DROP POLICY IF EXISTS "Coach puede marcar mensajes como leídos" ON public.messages;
DROP POLICY IF EXISTS "Usuarios ven sus mensajes" ON public.messages;
DROP POLICY IF EXISTS "Usuarios envían mensajes" ON public.messages;

DROP POLICY IF EXISTS "Coach puede gestionar pagos" ON public.payments;
DROP POLICY IF EXISTS "Clientes ven sus pagos" ON public.payments;

DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated delete" ON storage.objects;

-- --------------------------------------------------
-- 1. EXTENSIONES ÚTILES
-- --------------------------------------------------
create extension if not exists "uuid-ossp";

-- --------------------------------------------------
-- 2. TABLAS
-- --------------------------------------------------

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text not null,
  role text not null default 'client' check (role in ('coach', 'client')),
  avatar text,
  selfie_url text,
  goal text default 'Hipertrofia General',
  phone text,
  streak integer default 0,
  adherence_rate integer default 100,
  weight_history jsonb default '[]'::jsonb,
  monthly_fee numeric(10,2) default 120,
  next_payment_date date,
  payment_status text default 'pending' check (payment_status in ('paid', 'pending', 'overdue')),
  payment_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- routines
CREATE TABLE IF NOT EXISTS public.routines (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- exercises
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid default gen_random_uuid() primary key,
  routine_id uuid references public.routines(id) on delete cascade not null,
  name text not null,
  category text default 'Chest',
  sets integer default 4,
  reps text default '10-12',
  weight numeric(10,2) default 20,
  rest_time integer default 90,
  notes text,
  image_url text,
  position integer default 0,
  created_at timestamptz default now()
);

-- workout_logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete set null,
  routine_name text,
  workout_date date not null,
  duration_minutes integer default 60,
  exercises jsonb default '[]'::jsonb,
  feeling_score integer default 5,
  coach_notes text,
  created_at timestamptz default now()
);

-- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  status text default 'pending' check (status in ('paid', 'pending', 'overdue', 'refunded')),
  method text default '',
  payment_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- --------------------------------------------------
-- 3. FUNCIONES AUXILIARES
-- --------------------------------------------------

-- updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$ LANGUAGE plpgsql;

-- is_coach (evita recursión RLS)
DROP FUNCTION IF EXISTS public.is_coach() CASCADE;
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

-- handle_new_user (trigger bulletproof)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), 'client');
  RETURN new;
EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user trigger failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- upsert_client_by_coach (RPC para crear/actualizar perfil completo)
CREATE OR REPLACE FUNCTION public.upsert_client_by_coach(
  client_id uuid,
  client_email text,
  client_name text,
  client_goal text DEFAULT 'Hipertrofia General',
  client_phone text DEFAULT '+34600000000',
  client_monthly_fee numeric DEFAULT 0,
  client_next_payment_date text DEFAULT NULL,
  client_payment_status text DEFAULT 'pending',
  client_avatar text DEFAULT NULL,
  client_selfie_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, name, role,
    goal, phone, monthly_fee, next_payment_date,
    payment_status, avatar, selfie_url, streak, adherence_rate
  )
  VALUES (
    client_id, client_email, client_name, 'client',
    client_goal, client_phone, client_monthly_fee,
    CASE WHEN client_next_payment_date IS NOT NULL AND client_next_payment_date <> ''
         THEN client_next_payment_date::date
         ELSE CURRENT_DATE
    END,
    client_payment_status, client_avatar, client_selfie_url, 0, 100
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    goal = EXCLUDED.goal,
    phone = EXCLUDED.phone,
    monthly_fee = EXCLUDED.monthly_fee,
    next_payment_date = EXCLUDED.next_payment_date,
    payment_status = EXCLUDED.payment_status,
    avatar = EXCLUDED.avatar,
    selfie_url = EXCLUDED.selfie_url;
END;
$$;

-- update_client_by_coach (RPC alternativo para actualizar)
CREATE OR REPLACE FUNCTION public.update_client_by_coach(
  client_id uuid,
  client_name text DEFAULT NULL,
  client_goal text DEFAULT NULL,
  client_phone text DEFAULT NULL,
  client_avatar text DEFAULT NULL,
  client_selfie_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    name = COALESCE(client_name, name),
    goal = COALESCE(client_goal, goal),
    phone = COALESCE(client_phone, phone),
    avatar = COALESCE(client_avatar, avatar),
    selfie_url = COALESCE(client_selfie_url, selfie_url)
  WHERE id = client_id AND role = 'client';
END;
$$;

-- --------------------------------------------------
-- 4. TRIGGERS
-- --------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_routines ON public.routines;
CREATE TRIGGER set_updated_at_routines
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------
-- 5. ÍNDICES
-- --------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON public.profiles(payment_status);
CREATE INDEX IF NOT EXISTS idx_routines_client_id ON public.routines(client_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON public.routines(is_active);
CREATE INDEX IF NOT EXISTS idx_exercises_routine_id ON public.exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_client_id ON public.workout_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_date ON public.workout_logs(workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);

-- Analizar tablas
ANALYZE public.profiles;
ANALYZE public.routines;
ANALYZE public.exercises;
ANALYZE public.workout_logs;
ANALYZE public.messages;
ANALYZE public.payments;

-- --------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Usuarios ven su propio perfil"
  ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Coach ve todos los perfiles"
  ON public.profiles FOR SELECT USING (public.is_coach());

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Coach actualiza todos los perfiles"
  ON public.profiles FOR UPDATE USING (public.is_coach());

CREATE POLICY "Coach inserta clientes"
  ON public.profiles FOR INSERT WITH CHECK (public.is_coach());

CREATE POLICY "Coach elimina clientes"
  ON public.profiles FOR DELETE USING (public.is_coach());

-- ROUTINES
CREATE POLICY "Coach gestiona rutinas"
  ON public.routines FOR ALL
  USING (public.is_coach()) WITH CHECK (public.is_coach());

CREATE POLICY "Clientes ven sus rutinas"
  ON public.routines FOR SELECT USING (client_id = auth.uid());

-- EXERCISES
CREATE POLICY "Coach gestiona ejercicios"
  ON public.exercises FOR ALL
  USING (public.is_coach()) WITH CHECK (public.is_coach());

CREATE POLICY "Clientes ven ejercicios de sus rutinas"
  ON public.exercises FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE id = exercises.routine_id AND client_id = auth.uid()
    )
  );

-- WORKOUT_LOGS
CREATE POLICY "Coach ve todos los logs"
  ON public.workout_logs FOR SELECT USING (public.is_coach());

CREATE POLICY "Clientes ven sus logs"
  ON public.workout_logs FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clientes crean sus logs"
  ON public.workout_logs FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Coach crea logs"
  ON public.workout_logs FOR INSERT WITH CHECK (public.is_coach());

-- MESSAGES
CREATE POLICY "Usuarios ven sus mensajes"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_coach());

CREATE POLICY "Usuarios envian mensajes"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- PAYMENTS
CREATE POLICY "Coach gestiona pagos"
  ON public.payments FOR ALL USING (public.is_coach());

CREATE POLICY "Clientes ven sus pagos"
  ON public.payments FOR SELECT USING (client_id = auth.uid());

-- --------------------------------------------------
-- 7. STORAGE (Avatares)
-- --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar public read"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Avatar authenticated upload"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatar authenticated update"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Avatar authenticated delete"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- --------------------------------------------------
-- 8. REALTIME
-- --------------------------------------------------
-- Usamos DO $$ para evitar error si las tablas ya están en la publicación
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'messages already in supabase_realtime';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_logs;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'workout_logs already in supabase_realtime';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'profiles already in supabase_realtime';
  END;
END $$;

-- --------------------------------------------------
-- 9. PERMISOS
-- --------------------------------------------------
GRANT EXECUTE ON FUNCTION public.is_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach() TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_client_by_coach TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_client_by_coach TO anon;
GRANT EXECUTE ON FUNCTION public.update_client_by_coach TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_by_coach TO anon;

-- --------------------------------------------------
-- 10. SEED DATA (Opcional: descomenta y ejecuta con el UUID real de tu coach)
-- --------------------------------------------------
-- IMPORTANTE: Reemplaza 'TU-COACH-UUID-AQUI' con el UUID real del coach desde Auth → Users
-- INSERT INTO public.profiles (id, email, name, role, monthly_fee, payment_status)
-- VALUES ('TU-COACH-UUID-AQUI', 'marcasnt@gmail.com', 'Coach Marcus', 'coach', 0, 'paid')
-- ON CONFLICT (id) DO NOTHING;
