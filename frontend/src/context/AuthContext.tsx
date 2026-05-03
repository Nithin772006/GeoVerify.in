import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { buildPermissionMap } from '../lib/admin';
import { supabase } from '../services/supabase';
import type { EmployeeRole, PermissionMap, PermissionModule, RolePermission } from '../types/admin';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: EmployeeRole | null;
  permissions: PermissionMap | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  hasModuleAccess: (module: PermissionModule) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  permissions: null,
  loading: true,
  signOut: async () => {},
  refreshRole: async () => {},
  hasModuleAccess: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<EmployeeRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (_userId: string) => {
    try {
      // Use RPC to bypass recursive RLS policies on the employees table.
      // get_my_role() is SECURITY DEFINER so it reads the role directly.
      const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');

      let nextRole: EmployeeRole = 'employee'; // safe default

      if (!roleError && (roleData === 'admin' || roleData === 'employee')) {
        nextRole = roleData as EmployeeRole;
      } else if (roleError) {
        console.warn('get_my_role RPC failed, falling back to direct query:', roleError.message);
        // Fallback: try direct query (works if RLS recursion is fixed)
        const { data, error } = await supabase
          .from('employees')
          .select('role')
          .eq('id', _userId)
          .single();
        if (!error && (data?.role === 'admin' || data?.role === 'employee')) {
          nextRole = data.role as EmployeeRole;
        }
      }

      setRole(nextRole);

      const { data: permissionRows, error: permissionError } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', nextRole);

      if (permissionError && permissionError.code !== '42P01') {
        // Permissions table error — use built-in defaults
        setPermissions(buildPermissionMap(nextRole, []));
      } else {
        setPermissions(buildPermissionMap(nextRole, (permissionRows ?? []) as RolePermission[]));
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole('employee');
      setPermissions(buildPermissionMap('employee', []));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshRole = async () => {
    if (!user) {
      setRole(null);
      setPermissions(null);
      return;
    }

    setLoading(true);
    await fetchRole(user.id);
  };

  const hasModuleAccess = (module: PermissionModule) => {
    if (!role) {
      // Not yet resolved — deny until role is loaded
      return false;
    }

    if (!permissions) {
      // Role is known but permissions haven't loaded yet — use defaults
      const defaults = buildPermissionMap(role, []);
      return defaults[module]?.can_view ?? false;
    }

    return permissions[module]?.can_view ?? false;
  };

  return (
    <AuthContext.Provider
      value={{ session, user, role, permissions, loading, signOut, refreshRole, hasModuleAccess }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
