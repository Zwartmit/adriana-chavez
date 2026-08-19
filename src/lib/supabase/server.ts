// Para uso futuro en SSR o API routes
// TanStack Start soporta server functions — este cliente se usará allí
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createServerSupabaseClient(cookies: Record<string, string>) {
  return createServerClient<Database>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
        setAll: () => {}, // Se implementa en Antigravity
      },
    },
  );
}
