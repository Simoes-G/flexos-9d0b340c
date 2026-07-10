import { createServerFn } from "@tanstack/react-start";

/**
 * DEV ONLY: ensures a default admin user exists.
 * admin@admin.com / admin123 — remove for production hardening.
 */
export const ensureDevAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const email = "admin@admin.com";
  const password = "admin123";

  // Check if user exists
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email === email);

  let userId = existing?.id;

  if (!existing) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrador" },
    });
    if (error) {
      console.error("[bootstrap] createUser", error);
      return { ok: false, error: error.message };
    }
    userId = data.user?.id;
  }

  if (!userId) return { ok: false, error: "no user id" };

  // Ensure profile
  await supabaseAdmin.from("profiles").upsert({
    id: userId,
    email,
    full_name: "Administrador",
    job_title: "Administrador do Sistema",
    status: "active",
  });

  // Ensure admin role
  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return { ok: true };
});
