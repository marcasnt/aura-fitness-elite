-- Función RPC para que el coach actualice el perfil de un cliente recién creado
-- Ejecutar en Supabase SQL Editor

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

-- Permitir llamarla desde el frontend (RLS no aplica a funciones SECURITY DEFINER,
-- pero necesitamos un grant)
GRANT EXECUTE ON FUNCTION public.update_client_by_coach TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_by_coach TO anon;
