-- Actualizar el trigger para que cree el perfil COMPLETO desde raw_user_meta_data
-- Ejecutar esto en el SQL Editor de Supabase

-- Borrar trigger anterior y recrearlo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, name, role,
    goal, phone, monthly_fee, next_payment_date,
    payment_status, avatar, selfie_url, streak, adherence_rate
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    'client',
    COALESCE(new.raw_user_meta_data->>'goal', 'Hipertrofia General'),
    COALESCE(new.raw_user_meta_data->>'phone', '+34600000000'),
    COALESCE((new.raw_user_meta_data->>'monthly_fee')::numeric, 0),
    COALESCE(new.raw_user_meta_data->>'next_payment_date', CURRENT_DATE::text),
    COALESCE(new.raw_user_meta_data->>'payment_status', 'pending'),
    new.raw_user_meta_data->>'avatar',
    new.raw_user_meta_data->>'selfie_url',
    0,
    100
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
