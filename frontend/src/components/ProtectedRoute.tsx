import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Background3D } from './ui/Background3D';
import type { PermissionModule } from '../types/admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  permissionModule?: PermissionModule;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  permissionModule,
}: ProtectedRouteProps) {
  const { session, role, loading, hasModuleAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Background3D variant="auth" />
        <div className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm" />
        <div className="relative z-10 rounded-[30px] border border-white/10 bg-white/[0.06] px-10 py-8 shadow-[0_25px_60px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="mx-auto h-10 w-10 rounded-full border-4 border-cyan-400 border-t-transparent"
          />
          <p className="mt-4 text-sm font-medium text-white/60">Loading workspace</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (permissionModule && !hasModuleAccess(permissionModule)) {
    const fallbackRoute =
      role === 'admin'
        ? [
            { module: 'dashboard' as const, path: '/admin/dashboard' },
            { module: 'attendance' as const, path: '/admin/attendance' },
            { module: 'employees' as const, path: '/admin/employees' },
            { module: 'leave' as const, path: '/admin/leave' },
            { module: 'holidays' as const, path: '/admin/holidays' },
            { module: 'reports' as const, path: '/admin/reports' },
            { module: 'settings' as const, path: '/admin/settings' },
          ].find((route) => hasModuleAccess(route.module))?.path
        : [
            { module: 'dashboard' as const, path: '/dashboard' },
            { module: 'attendance' as const, path: '/attendance' },
            { module: 'leave' as const, path: '/leave' },
          ].find((route) => hasModuleAccess(route.module))?.path;

    if (fallbackRoute && fallbackRoute !== location.pathname) {
      return <Navigate to={fallbackRoute} replace />;
    }

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 text-center">
        <Background3D variant="auth" />
        <div className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm" />
        <div className="relative z-10 max-w-lg rounded-[30px] border border-white/10 bg-white/[0.06] px-8 py-8 shadow-[0_25px_60px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
          <h1 className="text-2xl font-semibold text-white">Permission required</h1>
          <p className="mt-3 text-sm leading-6 text-white/58">
            This module is locked for your current role.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
