
-- Restrict profiles SELECT to self or admin
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- Restrict integrations SELECT to admins
DROP POLICY IF EXISTS integrations_read_all ON public.integrations;
CREATE POLICY integrations_read_admin ON public.integrations
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Restrict files SELECT to uploader or admin
DROP POLICY IF EXISTS files_read_all ON public.files;
CREATE POLICY files_read_own_or_admin ON public.files
  FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

-- Restrict team_members SELECT to members of same team or admin
DROP POLICY IF EXISTS team_members_read_all ON public.team_members;
CREATE POLICY team_members_read_same_team ON public.team_members
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
  );

-- Revoke EXECUTE on SECURITY DEFINER functions from authenticated (still callable via RLS policies as they're used server-side/in policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM authenticated, anon, public;
-- Policies use these functions; policy evaluation runs as the function owner context via SECURITY DEFINER, so revoking direct EXECUTE is safe.

-- Enable leaked password protection
-- (Note: This is set via Supabase Auth config, not SQL. Handled separately.)
