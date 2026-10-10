-- Endurecimiento (9 oct 2026), según el Security Advisor de Supabase:
-- 1. La vista inventario_completo era SECURITY DEFINER y el rol anon podía leerla.
-- 2. n8n_chat_histories no tenía RLS (n8n entra como postgres y no se ve afectado).
alter view public.inventario_completo set (security_invoker = true);
revoke all on public.inventario_completo from anon;
revoke insert, update, delete, truncate, references, trigger on public.inventario_completo from authenticated;

alter table public.n8n_chat_histories enable row level security;
revoke all on public.n8n_chat_histories from anon, authenticated;
