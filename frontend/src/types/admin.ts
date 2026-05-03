export type EmployeeRole = 'admin' | 'employee';
export type EmployeeStatus = 'active' | 'inactive';
export type AttendanceStatus = 'Present' | 'Late';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type PermissionModule =
  | 'dashboard'
  | 'attendance'
  | 'employees'
  | 'leave'
  | 'holidays'
  | 'reports'
  | 'settings';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string | null;
  job_title: string | null;
  phone: string | null;
  status: EmployeeStatus;
  created_at: string;
}

export interface EmployeeFormValues {
  name: string;
  email: string;
  password?: string;
  role: EmployeeRole;
  department: string;
  job_title: string;
  phone: string;
  status: EmployeeStatus;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  status: AttendanceStatus;
  created_at: string;
  employees: Pick<Employee, 'name' | 'email' | 'department' | 'job_title' | 'role' | 'status'> | null;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  created_at: string;
  employees: Pick<Employee, 'name' | 'email' | 'department' | 'job_title'> | null;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface OfficeSettings {
  id: string;
  latitude: number;
  longitude: number;
  allowed_radius: number;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  company_policies: string;
  workday_start: string;
  workday_end: string;
  check_in_open: string;
  late_after: string;
  timezone: string;
  updated_at: string;
  updated_by: string | null;
}

export interface RolePermission {
  id?: string;
  role: EmployeeRole;
  module: PermissionModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
  updated_at?: string;
}

export type PermissionMap = Record<PermissionModule, RolePermission>;

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardTrendPoint {
  date: string;
  checkedIn: number;
  late: number;
}

export interface DepartmentAttendancePoint {
  department: string;
  checkedIn: number;
  late: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
}

export interface DashboardData {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  lateToday: number;
  pendingLeaves: number;
  attendanceRate: number;
  trendData: DashboardTrendPoint[];
  departmentData: DepartmentAttendancePoint[];
  leaveStatusData: DistributionPoint[];
}

export interface ReportsData {
  attendanceTrend: DashboardTrendPoint[];
  lateByDepartment: Array<{
    department: string;
    late: number;
    onTime: number;
  }>;
  leaveDistribution: DistributionPoint[];
  attendanceRate: number;
  lateRate: number;
  approvedLeaves: number;
  totalAttendance: number;
}

export interface AdminSettingsBundle {
  companySettings: CompanySettings | null;
  officeSettings: OfficeSettings | null;
  rolePermissions: RolePermission[];
}
