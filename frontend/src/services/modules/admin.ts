import { format, subDays } from 'date-fns';
import api from '../api';
import { supabase } from '../supabase';
import type {
  AdminSettingsBundle,
  AttendanceRecord,
  CompanySettings,
  DashboardData,
  Employee,
  EmployeeFormValues,
  Holiday,
  LeaveRequest,
  PaginatedResult,
  ReportsData,
  RolePermission,
} from '../../types/admin';

const EMPTY_COMPANY_SETTINGS: Omit<CompanySettings, 'id' | 'updated_at' | 'updated_by'> = {
  company_name: 'GeoVerify.in',
  company_policies:
    'Employees are expected to check in from the approved office radius and submit leave requests before planned absences.',
  workday_start: '09:00:00',
  workday_end: '18:00:00',
  check_in_open: '08:00:00',
  late_after: '10:00:00',
  timezone: 'Asia/Kolkata',
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getErrorMessage(error: any, fallback: string) {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

async function fetchTableOrEmpty<T>(promise: PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>) {
  const { data, error } = await promise;

  if (error) {
    if (error.code === '42P01') {
      return [];
    }

    throw error;
  }

  return data ?? [];
}

export async function getEmployees(params: {
  page: number;
  pageSize: number;
  search: string;
  department: string;
  role: string;
  status: string;
}): Promise<PaginatedResult<Employee>> {
  const { page, pageSize, search, department, role, status } = params;
  let query = supabase.from('employees').select('*', { count: 'exact' }).order('created_at', { ascending: false });

  const term = search.trim();
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,email.ilike.%${term}%,department.ilike.%${term}%,job_title.ilike.%${term}%`,
    );
  }

  if (department !== 'all') {
    query = query.eq('department', department);
  }

  if (role !== 'all') {
    query = query.eq('role', role);
  }

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw error;
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as Employee[],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getEmployeeDepartments() {
  const { data, error } = await supabase
    .from('employees')
    .select('department')
    .not('department', 'is', null)
    .order('department');

  if (error) {
    throw error;
  }

  return [...new Set((data ?? []).map((row) => row.department).filter(Boolean))] as string[];
}

export async function createEmployee(payload: EmployeeFormValues & { password: string }) {
  await api.post('/admin/add-employee', payload);
}

export async function updateEmployee(employeeId: string, payload: EmployeeFormValues) {
  await api.patch(`/admin/employees/${employeeId}`, {
    ...payload,
    password: payload.password?.trim() ? payload.password : undefined,
  });
}

export async function deleteEmployee(employeeId: string) {
  await api.delete(`/admin/employees/${employeeId}`);
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const trendStart = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  const [employeesResponse, trendRows, todayRows, leaveRows] = await Promise.all([
    supabase.from('employees').select('id, department, status'),
    fetchTableOrEmpty<{ date: string; status: string }>(
      supabase.from('attendance').select('date, status').gte('date', trendStart),
    ),
    fetchTableOrEmpty<{ date: string; status: string; employees: { department: string | null }[] | null }>(
      supabase
        .from('attendance')
        .select('date, status, employees(department)')
        .eq('date', today),
    ),
    fetchTableOrEmpty<{ status: string }>(
      supabase.from('leave_requests').select('status'),
    ),
  ]);

  if (employeesResponse.error) {
    throw employeesResponse.error;
  }

  const employees = employeesResponse.data ?? [];
  const activeEmployees = employees.filter((employee) => (employee.status ?? 'active') === 'active').length;
  const presentToday = todayRows.filter((row) => ['Present', 'Late'].includes(row.status)).length;
  const lateToday = todayRows.filter((row) => row.status === 'Late').length;
  const pendingLeaves = leaveRows.filter((row) => row.status === 'Pending').length;

  const trendData = Array.from({ length: 7 }, (_, index) => {
    const date = format(subDays(new Date(), 6 - index), 'yyyy-MM-dd');
    const records = trendRows.filter((row) => row.date === date);

    return {
      date,
      checkedIn: records.filter((row) => ['Present', 'Late'].includes(row.status)).length,
      late: records.filter((row) => row.status === 'Late').length,
    };
  });

  const departmentData = todayRows.reduce<DashboardData['departmentData']>((accumulator, row) => {
    const department = unwrapRelation(row.employees)?.department?.trim() || 'General';
    const currentDepartment = accumulator.find((item) => item.department === department);

    if (currentDepartment) {
      currentDepartment.checkedIn += 1;
      if (row.status === 'Late') {
        currentDepartment.late += 1;
      }
      return accumulator;
    }

    accumulator.push({
      department,
      checkedIn: 1,
      late: row.status === 'Late' ? 1 : 0,
    });
    return accumulator;
  }, []);

  const leaveStatusData = ['Pending', 'Approved', 'Rejected'].map((status) => ({
    name: status,
    value: leaveRows.filter((row) => row.status === status).length,
  }));

  return {
    totalEmployees: employees.length,
    activeEmployees,
    presentToday,
    lateToday,
    pendingLeaves,
    attendanceRate: activeEmployees ? Math.round((presentToday / activeEmployees) * 100) : 0,
    trendData,
    departmentData,
    leaveStatusData,
  };
}

export async function getAttendanceRecords(filters: {
  dateFrom: string;
  dateTo: string;
  department: string;
  search: string;
}) {
  let query = supabase
    .from('attendance')
    .select('*, employees(name, email, department, job_title, role, status)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.dateFrom) {
    query = query.gte('date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('date', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const term = filters.search.trim().toLowerCase();

  return ((data ?? []) as AttendanceRecord[])
    .map((record) => ({
      ...record,
      employees: unwrapRelation(record.employees),
    }))
    .filter((record) => {
    const matchesDepartment =
      filters.department === 'all' || (record.employees?.department ?? 'General') === filters.department;
    const matchesSearch =
      !term ||
      record.employees?.name?.toLowerCase().includes(term) ||
      record.employees?.email?.toLowerCase().includes(term) ||
      record.employees?.job_title?.toLowerCase().includes(term);

    return Boolean(matchesDepartment && matchesSearch);
    });
}

export async function getAdminLeaveRequests(filters: { status: string; search: string }) {
  let query = supabase
    .from('leave_requests')
    .select('*, employees(name, email, department, job_title)')
    .order('created_at', { ascending: false });

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === '42P01') {
      return [] as LeaveRequest[];
    }

    throw error;
  }

  const term = filters.search.trim().toLowerCase();

  return ((data ?? []) as LeaveRequest[])
    .map((request) => ({
      ...request,
      employees: unwrapRelation(request.employees),
    }))
    .filter((request) => {
      if (!term) {
        return true;
      }

      return (
        request.employees?.name?.toLowerCase().includes(term) ||
        request.employees?.email?.toLowerCase().includes(term) ||
        request.reason.toLowerCase().includes(term)
      );
    });
}

export async function updateLeaveStatus(leaveId: string, status: LeaveRequest['status']) {
  const { error } = await supabase.from('leave_requests').update({ status }).eq('id', leaveId);

  if (error) {
    throw error;
  }
}

export async function getHolidays() {
  const { data, error } = await supabase.from('holidays').select('*').order('date');

  if (error) {
    throw error;
  }

  return (data ?? []) as Holiday[];
}

export async function addHoliday(payload: { date: string; name: string }) {
  const { error } = await supabase.from('holidays').insert(payload);

  if (error) {
    throw error;
  }
}

export async function removeHoliday(holidayId: string) {
  const { error } = await supabase.from('holidays').delete().eq('id', holidayId);

  if (error) {
    throw error;
  }
}

export async function getReportsData(dateRange: number): Promise<ReportsData> {
  const startDate = format(subDays(new Date(), dateRange - 1), 'yyyy-MM-dd');

  const [attendanceRows, leaveRows, employeesResponse] = await Promise.all([
    fetchTableOrEmpty<{ date: string; status: string; employees: { department: string | null }[] | null }>(
      supabase
        .from('attendance')
        .select('date, status, employees(department)')
        .gte('date', startDate),
    ),
    fetchTableOrEmpty<LeaveRequest>(
      supabase.from('leave_requests').select('status'),
    ),
    supabase.from('employees').select('id, status'),
  ]);

  if (employeesResponse.error) {
    throw employeesResponse.error;
  }

  const employees = employeesResponse.data ?? [];
  const activeEmployees = employees.filter((employee) => (employee.status ?? 'active') === 'active').length;

  const attendanceTrend = Array.from({ length: dateRange }, (_, index) => {
    const date = format(subDays(new Date(), dateRange - index - 1), 'yyyy-MM-dd');
    const entries = attendanceRows.filter((row) => row.date === date);

    return {
      date,
      checkedIn: entries.filter((row) => ['Present', 'Late'].includes(row.status)).length,
      late: entries.filter((row) => row.status === 'Late').length,
    };
  });

  const lateByDepartment = attendanceRows.reduce<ReportsData['lateByDepartment']>((accumulator, row) => {
    const department = unwrapRelation(row.employees)?.department?.trim() || 'General';
    const current = accumulator.find((item) => item.department === department);

    if (current) {
      if (row.status === 'Late') {
        current.late += 1;
      } else {
        current.onTime += 1;
      }
      return accumulator;
    }

    accumulator.push({
      department,
      late: row.status === 'Late' ? 1 : 0,
      onTime: row.status === 'Late' ? 0 : 1,
    });
    return accumulator;
  }, []);

  const leaveDistribution = ['Pending', 'Approved', 'Rejected'].map((status) => ({
    name: status,
    value: leaveRows.filter((row) => row.status === status).length,
  }));

  const checkedInCount = attendanceRows.filter((row) => ['Present', 'Late'].includes(row.status)).length;
  const lateCount = attendanceRows.filter((row) => row.status === 'Late').length;
  const possibleAttendance = activeEmployees * dateRange;

  return {
    attendanceTrend,
    lateByDepartment,
    leaveDistribution,
    attendanceRate: possibleAttendance ? Math.round((checkedInCount / possibleAttendance) * 100) : 0,
    lateRate: checkedInCount ? Math.round((lateCount / checkedInCount) * 100) : 0,
    approvedLeaves: leaveDistribution.find((item) => item.name === 'Approved')?.value ?? 0,
    totalAttendance: attendanceRows.length,
  };
}

export async function getAdminSettings(): Promise<AdminSettingsBundle> {
  const [{ data: companySettings, error: companyError }, { data: officeSettings, error: officeError }, rolePermissions] =
    await Promise.all([
      supabase.from('company_settings').select('*').limit(1).maybeSingle(),
      supabase.from('office_settings').select('*').limit(1).maybeSingle(),
      fetchTableOrEmpty<RolePermission>(
        supabase.from('role_permissions').select('*').order('role').order('module'),
      ),
    ]);

  if (companyError && companyError.code !== '42P01') {
    throw companyError;
  }

  if (officeError && officeError.code !== 'PGRST116') {
    throw officeError;
  }

  return {
    companySettings: companySettings as CompanySettings | null,
    officeSettings: officeSettings ?? null,
    rolePermissions,
  };
}

export async function saveCompanySettings(payload: Omit<CompanySettings, 'id' | 'updated_at' | 'updated_by'>) {
  const { data: authData } = await supabase.auth.getUser();
  const { data: existingRow, error: existingError } = await supabase
    .from('company_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116' && existingError.code !== '42P01') {
    throw existingError;
  }

  const value = {
    ...EMPTY_COMPANY_SETTINGS,
    ...payload,
    workday_start: normalizeTime(payload.workday_start),
    workday_end: normalizeTime(payload.workday_end),
    check_in_open: normalizeTime(payload.check_in_open),
    late_after: normalizeTime(payload.late_after),
    updated_by: authData.user?.id ?? null,
  };

  const response = existingRow?.id
    ? await supabase.from('company_settings').update(value).eq('id', existingRow.id)
    : await supabase.from('company_settings').insert(value);

  if (response.error) {
    throw response.error;
  }
}

export async function saveRolePermissions(rolePermissions: RolePermission[]) {
  const { error } = await supabase.from('role_permissions').upsert(rolePermissions, {
    onConflict: 'role,module',
  });

  if (error) {
    throw error;
  }
}

export async function saveOfficeSettings(payload: {
  latitude: number;
  longitude: number;
  allowed_radius: number;
}) {
  await api.post('/admin/set-office-location', payload);
}

export function getFriendlyError(error: unknown, fallback: string) {
  return getErrorMessage(error, fallback);
}
