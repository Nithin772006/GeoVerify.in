import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Search, ShieldCheck, Trash2, UserRoundCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
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
        eyebrow="People Grid"
        title="Manage your workforce roster"
        description="Create employee accounts, update role assignments, and keep the directory clean with searchable, paginated data."
        stats={[
          { label: 'Total', value: `${totalEmployees}` },
          { label: 'Visible admins', value: `${adminCount}` },
        ]}
        actions={
          <button type="button" onClick={openCreateModal} className="glass-button-primary">
            <Plus className="h-4 w-4" />
            Add employee
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
        <GlassPanel glow="blue" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Visible employees</div>
          <div className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-950 dark:text-white">
            <Users className="h-7 w-7 text-cyan-600 dark:text-cyan-300" />
            {employees.length}
          </div>
        </GlassPanel>
        <GlassPanel glow="amber" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Admins on this page</div>
          <div className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-950 dark:text-white">
            <ShieldCheck className="h-7 w-7 text-amber-500 dark:text-amber-300" />
            {adminCount}
          </div>
        </GlassPanel>
        <GlassPanel glow="emerald" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Active on this page</div>
          <div className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-950 dark:text-white">
            <UserRoundCheck className="h-7 w-7 text-emerald-500 dark:text-emerald-300" />
            {activeCount}
          </div>
        </GlassPanel>
        <GlassPanel glow="blue" contentClassName="p-5">
          <div className="text-sm text-slate-500 dark:text-slate-300/45">Departments</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{departments.length}</div>
        </GlassPanel>
      </div>

      <GlassPanel glow="blue" contentClassName="p-5">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(3,minmax(0,0.6fr))]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
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

      <GlassPanel glow="emerald" contentClassName="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/55 bg-white/60 dark:border-white/8 dark:bg-white/5">
              <tr className="text-slate-500 dark:text-slate-300/45">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/45 dark:divide-white/6">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4" colSpan={6}>
                      <Skeleton className="h-14 w-full rounded-2xl" />
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <div className="text-center text-sm text-slate-500 dark:text-slate-300/55">
                      No employees match the current filters.
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="transition hover:bg-white/35 dark:hover:bg-white/4">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-950 dark:text-white">{employee.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300/45">{employee.email}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-300/45">
                        Added {new Date(employee.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {employee.department || 'General'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300/45">
                        {employee.job_title || 'No job title'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge label={employee.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge label={employee.status || 'active'} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-300/55">
                      {employee.phone || 'No phone set'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(employee)}
                          className="rounded-2xl border border-white/55 bg-white/72 p-2 text-slate-500 transition hover:text-cyan-600 dark:border-white/10 dark:bg-white/5 dark:text-white/55 dark:hover:text-cyan-300"
                          aria-label={`Edit ${employee.name}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${employee.name}? This removes their auth account too.`)) {
                              deleteEmployeeMutation.mutate(employee.id);
                            }
                          }}
                          disabled={deleteEmployeeMutation.isPending}
                          className="rounded-2xl border border-white/55 bg-white/72 p-2 text-slate-500 transition hover:text-rose-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white/55 dark:hover:text-rose-300"
                          aria-label={`Delete ${employee.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <Pagination page={employeesPage?.page ?? 1} totalPages={employeesPage?.totalPages ?? 1} onPageChange={setPage} />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit employee profile' : 'Add new employee'}
        description={
          editingEmployee
            ? 'Update directory details, role assignments, and activation state.'
            : 'Create a new auth account and seed the employee record in Supabase.'
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
              Email address
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
              {editingEmployee ? 'Reset password (optional)' : 'Temporary password'}
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
              {editingEmployee
                ? 'Leave blank to keep the current password.'
                : 'Share this securely with the employee after creation.'}
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
