-- SQL CRÍTICO: Trigger a prueba de balas + función RPC para crear perfil completo
-- Ejecutar TODO en Supabase SQL Editor de una vez

-- ============================================================
-- 1. TRIGGER BULLETPROOF (nunca falla el signup)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert mínimo; si falla por cualquier razón, no abortamos el auth signup
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), 'client');
  RETURN new;
EXCEPTION WHEN others THEN
  -- Log en consola de Supabase (Logs → Postgres)
  RAISE WARNING 'handle_new_user trigger failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. FUNCIÓN RPC: upsert_client_by_coach (crea o actualiza perfil completo)
-- ============================================================
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

-- Permisos para que el frontend pueda llamar la función
GRANT EXECUTE ON FUNCTION public.upsert_client_by_coach TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_client_by_coach TO anon;
