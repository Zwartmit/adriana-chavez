-- Mueve pg_trgm fuera de public (advertencia extension_in_public).
-- Verificado el 10 oct: ningún índice ni función propios usan pg_trgm (solo sus propias funciones gtrgm_* y similarity*).
-- Las conexiones de Supabase incluyen "extensions" en el search_path, así que similarity() y el operador % siguen resolviendo.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
-- Rollback: alter extension pg_trgm set schema public;
