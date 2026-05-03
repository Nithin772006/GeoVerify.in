-- Run this in Supabase SQL Editor to support Leave Management

create or replace function public.handle_new_employee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.employees (id, name, email, role)
    values (
        new.id,
        coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
        new.email,
        'employee'
    )
    on conflict (id) do update
    set
        name = excluded.name,
        email = excluded.email;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_employee();

create or replace function public.can_claim_first_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select
        auth.uid() is not null
        and exists (select 1 from public.employees where id = auth.uid())
        and not exists (select 1 from public.employees where role = 'admin');
$$;

create or replace function public.claim_first_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    current_uid uuid := auth.uid();
    claimed_profile public.employees%rowtype;
begin
    if current_uid is null then
        raise exception 'Authentication required';
    end if;

    perform pg_advisory_xact_lock(hashtext('public.claim_first_admin'));

    if exists (select 1 from public.employees where role = 'admin') then
        if exists (select 1 from public.employees where id = current_uid and role = 'admin') then
            return jsonb_build_object(
                'claimed', false,
                'message', 'This account is already an admin.'
            );
        end if;

        raise exception 'An admin account already exists.';
    end if;

    update public.employees
    set role = 'admin'
    where id = current_uid
    returning * into claimed_profile;

    if claimed_profile.id is null then
        raise exception 'Employee profile not found for current user.';
    end if;

    return jsonb_build_object(
        'claimed', true,
        'message', 'Admin access granted.',
        'user_id', claimed_profile.id,
        'email', claimed_profile.email
    );
end;
$$;

grant execute on function public.can_claim_first_admin() to authenticated;
grant execute on function public.claim_first_admin() to authenticated;

insert into public.employees (id, name, email, role)
select
    id,
    coalesce(nullif(raw_user_meta_data->>'name', ''), split_part(email, '@', 1)),
    email,
    'employee'
from auth.users
on conflict (id) do nothing;

CREATE TABLE public.leave_requests (
    id uuid default gen_random_uuid() primary key,
    employee_id uuid references public.employees(id) on delete cascade not null,
    start_date date not null,
    end_date date not null,
    reason text not null,
    status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.leave_requests enable row level security;
create policy "Users can view their own leave requests" on leave_requests for select using (auth.uid() = employee_id);
create policy "Users can insert their own leave requests" on leave_requests for insert with check (auth.uid() = employee_id);
create policy "Users can delete their own pending leave requests" on leave_requests for delete using (auth.uid() = employee_id and status = 'Pending');
create policy "Admins can view all leave requests" on leave_requests for select using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
);
create policy "Admins can update all leave requests" on leave_requests for update using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
);
