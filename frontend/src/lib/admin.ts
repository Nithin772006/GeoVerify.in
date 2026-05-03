import type {
  EmployeeRole,
  PermissionMap,
  PermissionModule,
  RolePermission,
} from '../types/admin';

export const PERMISSION_MODULES: PermissionModule[] = [
  'dashboard',
  'attendance',
  'employees',
  'leave',
  'holidays',
  'reports',
  'settings',
];

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  employees: 'Employees',
  leave: 'Leave',
  holidays: 'Holidays',
  reports: 'Reports',
  settings: 'Settings',
};

const createPermission = (
  role: EmployeeRole,
  module: PermissionModule,
  flags: Partial<Omit<RolePermission, 'role' | 'module'>> = {},
): RolePermission => ({
  role,
  module,
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false,
  can_approve: false,
  can_export: false,
  ...flags,
});

export const DEFAULT_ROLE_PERMISSIONS: Record<EmployeeRole, RolePermission[]> = {
  admin: [
    createPermission('admin', 'dashboard', { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }),
    createPermission('admin', 'attendance', { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }),
    createPermission('admin', 'employees', { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }),
    createPermission('admin', 'leave', { can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true }),
    createPermission('admin', 'holidays', { can_view: true, can_create: true, can_edit: true, can_delete: true }),
    createPermission('admin', 'reports', { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true }),
    createPermission('admin', 'settings', { can_view: true, can_create: true, can_edit: true, can_delete: true }),
  ],
  employee: [
    createPermission('employee', 'dashboard', { can_view: true }),
    createPermission('employee', 'attendance', { can_view: true, can_create: true }),
    createPermission('employee', 'employees'),
    createPermission('employee', 'leave', { can_view: true, can_create: true, can_delete: true }),
    createPermission('employee', 'holidays'),
    createPermission('employee', 'reports'),
    createPermission('employee', 'settings'),
  ],
};

export function mergeRolePermissions(
  role: EmployeeRole,
  permissions: RolePermission[] = [],
): RolePermission[] {
  const overrides = new Map(permissions.map((permission) => [permission.module, permission]));

  return DEFAULT_ROLE_PERMISSIONS[role].map((fallback) => ({
    ...fallback,
    ...overrides.get(fallback.module),
    role,
    module: fallback.module,
  }));
}

export function buildPermissionMap(
  role: EmployeeRole,
  permissions: RolePermission[] = [],
): PermissionMap {
  return mergeRolePermissions(role, permissions).reduce((accumulator, permission) => {
    accumulator[permission.module] = permission;
    return accumulator;
  }, {} as PermissionMap);
}
