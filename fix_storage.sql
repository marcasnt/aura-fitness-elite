-- ============================================================
-- SQL para crear bucket de Storage en Supabase para avatares
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Crear bucket 'avatars' (público para lectura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede leer (ver) imágenes
CREATE POLICY "Avatar public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Política: usuarios autenticados pueden subir imágenes
CREATE POLICY "Avatar authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Política: usuarios autenticados pueden actualizar sus propias imágenes
CREATE POLICY "Avatar authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Política: usuarios autenticados pueden borrar imágenes
CREATE POLICY "Avatar authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
