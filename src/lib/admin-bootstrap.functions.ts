import { createServerFn } from "@tanstack/react-start";

/**
 * DEV ONLY: ensures a default admin user and a default read-only user exist.
 * - admin@admin.com / admin123  (role: admin)
 * - user@user.com  / user123    (role: member)
 */
export const ensureDevAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const seedUser = async (
    email: string,
    password: string,
    fullName: string,
    jobTitle: string,
    role: "admin" | "member",
  ) => {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email === email);
    let userId = existing?.id;

    if (!existing) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) {
        console.error("[bootstrap] createUser", email, error);
        return { ok: false, error: error.message };
      }
      userId = data.user?.id;
    }

    if (!userId) return { ok: false, error: "no user id" };

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      job_title: jobTitle,
      status: "active",
    });

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    return { ok: true };
  };

  const admin = await seedUser(
    "admin@admin.com",
    "admin123",
    "Administrador",
    "Administrador do Sistema",
    "admin",
  );
  const user = await seedUser("user@user.com", "user123", "Usuário", "Colaborador", "member");

  return { ok: admin.ok && user.ok };
});
