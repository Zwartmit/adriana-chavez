import { supabase } from "./client";
import type { Rol } from "./types";

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserRol(): Promise<Rol | null> {
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();

  return data?.rol ?? null;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
