-- GeoVerify.in Admin Panel Upgrade
-- Run this after the original supabase_setup.sql and update.sql scripts.

alter table public.employees add column if not exists department text;
alter table public.employees add column if not exists job_title text;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists status text;

update public.employees
set
    department = coalesce(nullif(department, ''), 'General'),
    job_title = coalesce(job_title, ''),
    status = coalesce(nullif(status, ''), 'active');

alter table public.employees alter column department set default 'General';
alter table public.employees alter column status set default 'active';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'employees_status_check'
    ) then
        alter table public.employees
        add constraint employees_status_check
        check (status in ('active', 'inactive'));
    end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

create table if not exists public.company_settings (
    id uuid default gen_random_uuid() primary key,
    company_name text not null default 'GeoVerify.in',
    company_policies text not null default '',
    workday_start time not null default '09:00',
    workday_end time not null default '18:00',
    check_in_open time not null default '08:00',
    late_after time not null default '10:00',
    timezone text not null default 'Asia/Kolkata',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_by uuid references public.employees(id)
);

create unique index if not exists company_settings_singleton_idx on public.company_settings ((true));
alter table public.company_settings enable row level security;

drop policy if exists "Admins can view company settings" on public.company_settings;
create policy "Admins can view company settings"
on public.company_settings
for select
using (
    exists (
        select 1 from public.employees
        where id = auth.uid() and role = 'admin'
    )
);

drop policy if exists "Admins can manage company settings" on public.company_settings;
create policy "Admins can manage company settings"
on public.company_settings
for all
using (
    exists (
        select 1 from public.employees
        where id = auth.uid() and role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.employees
        where id = auth.uid() and role = 'admin'
    )
);

drop trigger if exists set_company_settings_updated_at on public.company_settings;
create trigger set_company_settings_updated_at
before update on public.company_settings
for each row execute procedure public.touch_updated_at();

insert into public.company_settings (
    company_name,
    company_policies,
    workday_start,
    workday_end,
    check_in_open,
    late_after,
    timezone
)
select
    'GeoVerify.in',
    'Employees are expected to check in from the approved office radius and submit leave requests before planned absences.',
    '09:00',
    '18:00',
    '08:00',
    '10:00',
    'Asia/Kolkata'
where not exists (select 1 from public.company_settings);

create table if not exists public.role_permissions (
    id uuid default gen_random_uuid() primary key,
    role text not null check (role in ('admin', 'employee')),
    module text not null,
    can_view boolean not null default false,
    can_create boolean not null default false,
    can_edit boolean not null default false,
    can_delete boolean not null default false,
    can_approve boolean not null default false,
    can_export boolean not null default false,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(role, module)
);

alter table public.role_permissions enable row level security;

drop policy if exists "Users can view their role permissions" on public.role_permissions;
create policy "Users can view their role permissions"
on public.role_permissions
for select
using (
    exists (
        select 1
        from public.employees
        where id = auth.uid()
          and public.employees.role = public.role_permissions.role
    )
);

drop policy if exists "Admins can manage role permissions" on public.role_permissions;
create policy "Admins can manage role permissions"
on public.role_permissions
for all
using (
    exists (
        select 1 from public.employees
        where id = auth.uid() and role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.employees
        where id = auth.uid() and role = 'admin'
    )
);

drop trigger if exists set_role_permissions_updated_at on public.role_permissions;
create trigger set_role_permissions_updated_at
before update on public.role_permissions
for each row execute procedure public.touch_updated_at();

insert into public.role_permissions (
    role,
    module,
    can_view,
    can_create,
    can_edit,
    can_delete,
    can_approve,
    can_export
)
values
    ('admin', 'dashboard', true, true, true, true, false, true),
    ('admin', 'attendance', true, true, true, true, false, true),
    ('admin', 'employees', true, true, true, true, false, true),
    ('admin', 'leave', true, true, true, true, true, true),
    ('admin', 'holidays', true, true, true, true, false, false),
    ('admin', 'reports', true, true, true, true, false, true),
    ('admin', 'settings', true, true, true, true, false, false),
    ('employee', 'dashboard', true, false, false, false, false, false),
    ('employee', 'attendance', true, true, false, false, false, false),
    ('employee', 'leave', true, true, false, true, false, false),
    ('employee', 'holidays', false, false, false, false, false, false),
    ('employee', 'reports', false, false, false, false, false, false),
    ('employee', 'settings', false, false, false, false, false, false)
on conflict (role, module) do update
set
    can_view = excluded.can_view,
    can_create = excluded.can_create,
    can_edit = excluded.can_edit,
    can_delete = excluded.can_delete,
    can_approve = excluded.can_approve,
    can_export = excluded.can_export;

drop policy if exists "Admins can manage holidays" on public.holidays;
create policy "Admins can manage holidays"
on public.holidays
for all
using (
    exists (
        select 1 from public.employees
        where id = auth.uid() and role = 'admin'
    )
)
with check (
    exists (
        select 1 from public.employees
        where id = auth.uid() and role = 'admin'
    )
);
