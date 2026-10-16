-- ==============================================================================
-- OdishaRank Migration: 005_admin_profiles_policy.sql
-- Explicit Row Level Security policies for Administrator access to all student profiles
-- ==============================================================================

-- 1. Ensure public.is_admin() exists and is secure
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Drop existing profiles select policies that might conflict
DROP POLICY IF EXISTS "Profiles are viewable by owner and admins" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 3. Create comprehensive SELECT policy for profiles
CREATE POLICY "Profiles are viewable by owner and admins" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  );

-- 4. Create UPDATE policy allowing admins to manage profile details
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- 5. User roles policy: Ensure admins can view and update all roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

-- 6. Ensure permissions are granted
GRANT ALL ON public.profiles TO postgres, authenticated, service_role;
GRANT ALL ON public.user_roles TO postgres, authenticated, service_role;
