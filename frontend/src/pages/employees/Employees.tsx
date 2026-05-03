import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Search, ShieldCheck, Trash2, UserRoundCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { Skeleton } from '../../components/common/Skeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { useRealtimeInvalidation } from '../../hooks/useRealtimeInvalidation';
import {
  createEmployee,
  deleteEmployee,
  getEmployeeDepartments,
  getEmployees,
  getFriendlyError,
  updateEmployee,
} from '../../services/modules/admin';
import type { Employee, EmployeeFormValues } from '../../types/admin';

const PAGE_SIZE = 8;

const createInitialForm = (): EmployeeFormValues & { password: string } => ({
  name: '',
  email: '',
  password: '',
  role: 'employee',
  department: 'General',
  job_title: '',
  phone: '',
  status: 'active',
});

function SummaryCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tint: string;
}) {
  return (
    <GlassPanel glow="blue" contentClassName="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/30">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </GlassPanel>
  );
}

function EmployeeCard({
  employee,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = employee.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleRing = employee.role === 'admin' ? 'border-cyan-400/30 shadow-[0_0_30px_rgba(0,212,255,0.12)]' : 'border-emerald-400/25 shadow-[0_0_30px_rgba(0,184,150,0.12)]';

  return (
    <GlassPanel glow={employee.role === 'admin' ? 'blue' : 'emerald'} contentClassName="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border bg-white/[0.04] text-lg font-semibold text-white ${roleRing}`}>
            {initials}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{employee.name}</div>
            <div className="text-sm text-white/46">{employee.email}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/55 transition hover:bg-white/[0.08] hover:text-cyan-200"
            aria-label={`Edit ${employee.name}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-white/55 transition hover:bg-white/[0.08] hover:text-rose-300"
            aria-label={`Delete ${employee.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <StatusBadge label={employee.role} />
        <StatusBadge label={employee.status || 'active'} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/8 bg-black/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/28">Department</div>
          <div className="mt-2 font-semibold text-white">{employee.department || 'General'}</div>
          <div className="mt-1 text-sm text-white/42">{employee.job_title || 'No job title'}</div>
        </div>
        <div className="rounded-[20px] border border-white/8 bg-black/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/28">Contact</div>
          <div className="mt-2 font-semibold text-white">{employee.phone || 'No phone set'}</div>
          <div className="mt-1 text-sm text-white/42">Added {new Date(employee.created_at).toLocaleDateString()}</div>
        </div>
      </div>
    </GlassPanel>
  );
}

export default function Employees() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState(createInitialForm());
  const deferredSearch = useDeferredValue(search);

  useRealtimeInvalidation(
    'employees-live',
    [{ table: 'employees', queryKeys: [['employees'], ['employee-departments'], ['admin-dashboard']] }],
    true,
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, department, roleFilter, statusFilter]);

  const { data: employeesPage, isLoading } = useQuery({
    queryKey: ['employees', page, deferredSearch, department, roleFilter, statusFilter],
    queryFn: () =>
      getEmployees({
        page,
        pageSize: PAGE_SIZE,
        search: deferredSearch,
        department,
        role: roleFilter,
        status: statusFilter,
      }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['employee-departments'],
    queryFn: getEmployeeDepartments,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      toast.success('Employee created successfully.');
      setIsModalOpen(false);
      setForm(createInitialForm());
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-departments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to create employee.'));
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ employeeId, values }: { employeeId: string; values: EmployeeFormValues }) =>
      updateEmployee(employeeId, values),
    onSuccess: () => {
      toast.success('Employee updated successfully.');
      setIsModalOpen(false);
      setEditingEmployee(null);
      setForm(createInitialForm());
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-departments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to update employee.'));
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success('Employee removed successfully.');
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-departments'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Failed to delete employee.'));
    },
  });

  const employees = employeesPage?.data ?? [];
  const totalEmployees = employeesPage?.count ?? 0;
  const adminCount = employees.filter((employee) => employee.role === 'admin').length;
  const activeCount = employees.filter((employee) => employee.status === 'active').length;

  const openCreateModal = () => {
    setEditingEmployee(null);
    setForm(createInitialForm());
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
      department: employee.department || 'General',
      job_title: employee.job_title || '',
      phone: employee.phone || '',
      status: employee.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingEmployee) {
      updateEmployeeMutation.mutate({
        employeeId: editingEmployee.id,
        values: form,
      });
      return;
    }

    createEmployeeMutation.mutate({
      ...form,
      password: form.password,
    });
  };

  const isSaving = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Employees"
        description="Searchable employee card grid with role and status controls."
        stats={[
          { label: 'Total', value: `${totalEmployees}` },
          { label: 'Admins', value: `${adminCount}` },
        ]}
        actions={
          <button type="button" onClick={openCreateModal} className="glass-button-primary">
            <Plus className="h-4 w-4" />
            Add employee
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Visible" value={employees.length} icon={Users} tint="text-cyan-200" />
        <SummaryCard label="Admins" value={adminCount} icon={ShieldCheck} tint="text-amber-300" />
        <SummaryCard label="Active" value={activeCount} icon={UserRoundCheck} tint="text-emerald-300" />
        <SummaryCard label="Teams" value={departments.length} icon={Users} tint="text-white" />
      </div>

      <GlassPanel glow="blue" contentClassName="p-5">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(3,minmax(0,0.6fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
            <input
              type="search"
              placeholder="Search by name, email, department, or title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="glass-input pl-10"
            />
          </div>

          <select value={department} onChange={(event) => setDepartment(event.target.value)} className="glass-select">
            <option value="all">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="glass-select">
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="glass-select">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </GlassPanel>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-[28px]" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState title="No employees found" description="Try adjusting the current filters." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={() => openEditModal(employee)}
              onDelete={() => {
                if (window.confirm(`Delete ${employee.name}? This removes their auth account too.`)) {
                  deleteEmployeeMutation.mutate(employee.id);
                }
              }}
            />
          ))}
        </div>
      )}

      <Pagination page={employeesPage?.page ?? 1} totalPages={employeesPage?.totalPages ?? 1} onPageChange={setPage} />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit employee' : 'Add employee'}
        description={
          editingEmployee
            ? 'Update employee details, access level, and active state.'
            : 'Create a new employee account.'
        }
      >
        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label className="glass-label" htmlFor="employee-name">
              Full name
            </label>
            <input
              id="employee-name"
              required
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="glass-input"
            />
          </div>

          <div>
            <label className="glass-label" htmlFor="employee-email">
              Email
            </label>
            <input
              id="employee-email"
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="glass-input"
            />
          </div>

          <div>
            <label className="glass-label" htmlFor="employee-password">
              {editingEmployee ? 'Reset password' : 'Temporary password'}
            </label>
            <input
              id="employee-password"
              required={!editingEmployee}
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="glass-input"
            />
            <p className="glass-helper mt-2">
              {editingEmployee ? 'Leave blank to keep the current password.' : 'Share securely after creation.'}
            </p>
          </div>

          <div>
            <label className="glass-label" htmlFor="employee-department">
              Department
            </label>
            <input
              id="employee-department"
              required
              type="text"
              value={form.department}
              onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
              className="glass-input"
            />
          </div>

          <div>
            <label className="glass-label" htmlFor="employee-job-title">
              Job title
            </label>
            <input
              id="employee-job-title"
              type="text"
              value={form.job_title}
              onChange={(event) => setForm((current) => ({ ...current, job_title: event.target.value }))}
              className="glass-input"
            />
          </div>

          <div>
            <label className="glass-label" htmlFor="employee-phone">
              Phone
            </label>
            <input
              id="employee-phone"
              type="text"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="glass-input"
            />
          </div>

          <div>
            <label className="glass-label" htmlFor="employee-role">
              Role
            </label>
            <select
              id="employee-role"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value as EmployeeFormValues['role'] }))
              }
              className="glass-select"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="glass-label" htmlFor="employee-status">
              Status
            </label>
            <select
              id="employee-status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as EmployeeFormValues['status'] }))
              }
              className="glass-select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 lg:col-span-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="glass-button-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="glass-button-primary disabled:opacity-60">
              {isSaving ? 'Saving...' : editingEmployee ? 'Save changes' : 'Create employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
