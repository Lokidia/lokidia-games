import { createClient } from "@/utils/supabase/client";

export async function signUp(email: string, password: string, pseudo: string) {
  const sb = createClient();
  const result = await sb.auth.signUp({
    email,
    password,
    options: { data: { pseudo } },
  });
  console.log("[signUp] full response:", JSON.stringify({
    user: result.data?.user ?? null,
    session: result.data?.session ? "present" : null,
    error: result.error,
  }, null, 2));
  return result;
}

export async function signIn(email: string, password: string) {
  const sb = createClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const sb = createClient();
  const { error } = await sb.auth.signOut();
  return { error };
}

export async function getUser() {
  const sb = createClient();
  const { data: { user }, error } = await sb.auth.getUser();
  return { user, error };
}
