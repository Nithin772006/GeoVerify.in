import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Radar, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PageHeader } from '../../components/ui/PageHeader';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import { DEFAULT_ROLE_PERMISSIONS, mergeRolePermissions, MODULE_LABELS } from '../../lib/admin';
import {
  getAdminSettings,
  getFriendlyError,
  saveCompanySettings,
  saveOfficeSettings,
  saveRolePermissions,
} from '../../services/modules/admin';
import type { EmployeeRole, RolePermission } from '../../types/admin';

function normalizeTimeForInput(value: string) {
  return value?.slice(0, 5) || '';
}

function PermissionToggle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="glass-toggle"
      data-checked={checked}
      aria-pressed={checked}
      aria-label={label}
    >
      <span className="glass-toggle-thumb" />
    </button>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [companyForm, setCompanyForm] = useState({
    company_name: 'GeoVerify.in',
    company_policies: '',
    workday_start: '09:00',
    workday_end: '18:00',
    check_in_open: '08:00',
    late_after: '10:00',
    timezone: 'Asia/Kolkata',
  });
  const [officeForm, setOfficeForm] = useState({
    latitude: '',
    longitude: '',
    allowed_radius: '',
  });
  const [permissions, setPermissions] = useState<RolePermission[]>([
    ...DEFAULT_ROLE_PERMISSIONS.admin,
    ...DEFAULT_ROLE_PERMISSIONS.employee,
  ]);

  useRealtimeInvalidation(
    'settings-live',
    [
      { table: 'company_settings', queryKeys: [['admin-settings']] },
      { table: 'office_settings', queryKeys: [['admin-settings']] },
      { table: 'role_permissions', queryKeys: [['admin-settings']] },
    ],
    true,
  );

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: getAdminSettings,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.companySettings) {
      setCompanyForm({
        company_name: data.companySettings.company_name,
        company_policies: data.companySettings.company_policies,
        workday_start: normalizeTimeForInput(data.companySettings.workday_start),
        workday_end: normalizeTimeForInput(data.companySettings.workday_end),
        check_in_open: normalizeTimeForInput(data.companySettings.check_in_open),
        late_after: normalizeTimeForInput(data.companySettings.late_after),
        timezone: data.companySettings.timezone,
      });
    }

    if (data.officeSettings) {
      setOfficeForm({
        latitude: data.officeSettings.latitude.toString(),
        longitude: data.officeSettings.longitude.toString(),
        allowed_radius: data.officeSettings.allowed_radius.toString(),
      });
    }

    const mergedPermissions = [
      ...mergeRolePermissions('admin', data.rolePermissions.filter((permission) => permission.role === 'admin')),
      ...mergeRolePermissions('employee', data.rolePermissions.filter((permission) => permission.role === 'employee')),
    ];
    setPermissions(mergedPermissions);
  }, [data]);

  const companyMutation = useMutation({
    mutationFn: () => saveCompanySettings(companyForm),
    onSuccess: () => {
      toast.success('Company policies and work hours saved.');
      void queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to save company settings.'));
    },
  });

  const officeMutation = useMutation({
    mutationFn: () =>
      saveOfficeSettings({
        latitude: Number(officeForm.latitude),
        longitude: Number(officeForm.longitude),
        allowed_radius: Number(officeForm.allowed_radius),
      }),
    onSuccess: () => {
      toast.success('Office perimeter updated.');
      void queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to save office settings.'));
    },
  });

  const permissionsMutation = useMutation({
    mutationFn: () => saveRolePermissions(permissions),
    onSuccess: () => {
      toast.success('Role permissions saved.');
      void queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to save role permissions.'));
    },
  });

  const permissionGroups = useMemo(
    () => ({
      admin: mergeRolePermissions('admin', permissions.filter((permission) => permission.role === 'admin')),
      employee: mergeRolePermissions('employee', permissions.filter((permission) => permission.role === 'employee')),
    }),
    [permissions],
  );

  const radiusPreview = Math.min(220, Math.max(68, Number(officeForm.allowed_radius || 0)));

  const togglePermission = (
    role: EmployeeRole,
    module: RolePermission['module'],
    field: keyof Pick<
      RolePermission,
      'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_approve' | 'can_export'
    >,
  ) => {
    setPermissions((current) =>
      current.map((permission) =>
        permission.role === role && permission.module === module
          ? { ...permission, [field]: !permission[field] }
          : permission,
      ),
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin Settings"
        title="Control policies, permissions, and work-hour rules"
        description="Configure geofence settings, adjust attendance timing, and manage database-driven role permissions from one control plane."
        stats={[
          { label: 'Company', value: companyForm.company_name || 'GeoVerify.in' },
          { label: 'Timezone', value: companyForm.timezone || 'Asia/Kolkata' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassPanel glow="blue" contentClassName="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-600 dark:text-cyan-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Company policies</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
                Set the official policy text, attendance window, and working-day schedule that the backend enforces.
              </p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              companyMutation.mutate();
            }}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="glass-label" htmlFor="company-name">
                Company name
              </label>
              <input
                id="company-name"
                type="text"
                value={companyForm.company_name}
                onChange={(event) => setCompanyForm((current) => ({ ...current, company_name: event.target.value }))}
                className="glass-input"
              />
            </div>

            <div>
              <label className="glass-label" htmlFor="company-policies">
                Company policies
              </label>
              <textarea
                id="company-policies"
                rows={6}
                value={companyForm.company_policies}
                onChange={(event) =>
                  setCompanyForm((current) => ({ ...current, company_policies: event.target.value }))
                }
                className="glass-textarea"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="glass-label" htmlFor="workday-start">
                  Workday start
                </label>
                <input
                  id="workday-start"
                  type="time"
                  value={companyForm.workday_start}
                  onChange={(event) =>
                    setCompanyForm((current) => ({ ...current, workday_start: event.target.value }))
                  }
                  className="glass-input"
                />
              </div>
              <div>
                <label className="glass-label" htmlFor="workday-end">
                  Workday end
                </label>
                <input
                  id="workday-end"
                  type="time"
                  value={companyForm.workday_end}
                  onChange={(event) => setCompanyForm((current) => ({ ...current, workday_end: event.target.value }))}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="glass-label" htmlFor="check-in-open">
                  Check-in opens
                </label>
                <input
                  id="check-in-open"
                  type="time"
                  value={companyForm.check_in_open}
                  onChange={(event) =>
                    setCompanyForm((current) => ({ ...current, check_in_open: event.target.value }))
                  }
                  className="glass-input"
                />
              </div>
              <div>
                <label className="glass-label" htmlFor="late-after">
                  Mark late after
                </label>
                <input
                  id="late-after"
                  type="time"
                  value={companyForm.late_after}
                  onChange={(event) => setCompanyForm((current) => ({ ...current, late_after: event.target.value }))}
                  className="glass-input"
                />
              </div>
            </div>

            <div>
              <label className="glass-label" htmlFor="company-timezone">
                Timezone
              </label>
              <input
                id="company-timezone"
                type="text"
                value={companyForm.timezone}
                onChange={(event) => setCompanyForm((current) => ({ ...current, timezone: event.target.value }))}
                className="glass-input"
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={companyMutation.isPending} className="glass-button-primary disabled:opacity-60">
                <Save className="h-4 w-4" />
                {companyMutation.isPending ? 'Saving...' : 'Save company settings'}
              </button>
            </div>
          </form>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel glow="emerald" contentClassName="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-600 dark:text-emerald-300">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Office perimeter</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
                  Set the approved office coordinates and allowed radius for attendance capture.
                </p>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                officeMutation.mutate();
              }}
              className="mt-6 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  type="number"
                  step="any"
                  value={officeForm.latitude}
                  onChange={(event) => setOfficeForm((current) => ({ ...current, latitude: event.target.value }))}
                  className="glass-input"
                  placeholder="Latitude"
                />
                <input
                  required
                  type="number"
                  step="any"
                  value={officeForm.longitude}
                  onChange={(event) => setOfficeForm((current) => ({ ...current, longitude: event.target.value }))}
                  className="glass-input"
                  placeholder="Longitude"
                />
              </div>

              <input
                required
                type="number"
                value={officeForm.allowed_radius}
                onChange={(event) => setOfficeForm((current) => ({ ...current, allowed_radius: event.target.value }))}
                className="glass-input"
                placeholder="Allowed radius in meters"
              />

              <div className="mt-8 flex items-center justify-center">
                <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/15 via-white/65 to-emerald-400/10 dark:from-cyan-400/10 dark:via-white/4 dark:to-emerald-400/10">
                  <div
                    className="absolute rounded-full border border-cyan-400/40 bg-cyan-400/8"
                    style={{ width: radiusPreview, height: radiusPreview }}
                  />
                  <div
                    className="absolute rounded-full border border-emerald-400/25"
                    style={{ width: Math.max(44, radiusPreview * 0.58), height: Math.max(44, radiusPreview * 0.58) }}
                  />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-[0_16px_40px_rgba(14,165,233,0.35)]">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={officeMutation.isPending} className="glass-button-primary disabled:opacity-60">
                  <Radar className="h-4 w-4" />
                  {officeMutation.isPending ? 'Saving...' : 'Save office settings'}
                </button>
              </div>
            </form>
          </GlassPanel>

          <GlassPanel glow="amber" contentClassName="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-amber-600 dark:text-amber-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Policy reminder</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300/62">
                  Check-in timing uses the company settings above. Geofence radius should reflect the real office footprint to avoid false negatives near the building edge.
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel glow="blue" contentClassName="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300/45">
              Role Permissions
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              Database-driven access control matrix
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/62">
              Toggle module-level access for each role. These values are loaded by the frontend before routes render.
            </p>
          </div>

          <button
            type="button"
            onClick={() => permissionsMutation.mutate()}
            disabled={permissionsMutation.isPending}
            className="glass-button-primary disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {permissionsMutation.isPending ? 'Saving...' : 'Save permissions'}
          </button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {(['admin', 'employee'] as EmployeeRole[]).map((role) => (
            <div key={role} className="rounded-[28px] border border-white/55 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 text-lg font-semibold capitalize text-slate-950 dark:text-white">{role}</div>

              <div className="space-y-3">
                {permissionGroups[role].map((permission) => (
                  <div
                    key={`${permission.role}-${permission.module}`}
                    className="rounded-[22px] border border-white/45 bg-white/72 p-4 dark:border-white/8 dark:bg-slate-950/40"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-slate-950 dark:text-white">
                          {MODULE_LABELS[permission.module]}
                        </div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300/45">
                          {permission.module}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {(
                        [
                          ['can_view', 'View'],
                          ['can_create', 'Create'],
                          ['can_edit', 'Edit'],
                          ['can_delete', 'Delete'],
                          ['can_approve', 'Approve'],
                          ['can_export', 'Export'],
                        ] as const
                      ).map(([field, label]) => (
                        <div key={field} className="flex items-center justify-between gap-3 rounded-2xl border border-white/45 bg-white/70 px-3 py-3 dark:border-white/8 dark:bg-white/5">
                          <span className="text-sm text-slate-600 dark:text-slate-300/65">{label}</span>
                          <PermissionToggle
                            checked={permission[field]}
                            onToggle={() => togglePermission(role, permission.module, field)}
                            label={`${label} permission for ${role} ${permission.module}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
