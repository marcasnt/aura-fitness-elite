-- Activar Realtime para las tablas principales de la app
-- Ejecutar esto en el SQL Editor de Supabase

begin;
  -- Suscripciones en tiempo real
  alter publication supabase_realtime add table messages;
  alter publication supabase_realtime add table workout_logs;
  alter publication supabase_realtime add table profiles;
commit;

-- Verificar que las tablas están en la publicación
select * from pg_publication_tables where pubname = 'supabase_realtime';
