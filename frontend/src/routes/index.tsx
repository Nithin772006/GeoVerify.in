import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { Background3D } from '../components/ui/Background3D';

const AppLayout = lazy(() =>
  import('../components/layout/AppLayout').then((module) => ({ default: module.AppLayout })),
);
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Attendance = lazy(() => import('../pages/attendance/Attendance'));
const Employees = lazy(() => import('../pages/employees/Employees'));
const Leave = lazy(() => import('../pages/leave/Leave'));
const Holidays = lazy(() => import('../pages/holidays/Holidays'));
const Reports = lazy(() => import('../pages/reports/Reports'));
const Settings = lazy(() => import('../pages/settings/Settings'));

function RouteLoader() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Background3D variant="auth" />
      <div className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm" />
      <div className="relative z-10 rounded-[30px] border border-white/10 bg-white/10 px-10 py-8 shadow-[0_25px_60px_rgba(15,23,42,0.32)] backdrop-blur-2xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-white/75">Loading workspace module...</p>
      </div>
    </div>
  );
}

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute permissionModule="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute permissionModule="attendance">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute permissionModule="leave">
                <Leave />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin permissionModule="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute requireAdmin permissionModule="attendance">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute requireAdmin permissionModule="employees">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leave"
            element={
              <ProtectedRoute requireAdmin permissionModule="leave">
                <Leave />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/holidays"
            element={
              <ProtectedRoute requireAdmin permissionModule="holidays">
                <Holidays />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin permissionModule="reports">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin permissionModule="settings">
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/attendance" replace />} />
        <Route path="*" element={<Navigate to="/attendance" replace />} />
      </Routes>
    </Suspense>
  );
};
