-- ============================================================
-- GeoVerify.in - Fix Admin Role Fetch (Recursive RLS Issue)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create a SECURITY DEFINER function that bypasses RLS to fetch the role.
--    This avoids the recursive RLS policy issue on the employees table.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.employees WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 2. Also fix the employees RLS to avoid recursion.
--    Replace the recursive admin policy with one using the function above.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.employees;

CREATE POLICY "Admins can view all profiles"
ON public.employees
FOR SELECT
USING (public.get_my_role() = 'admin');
