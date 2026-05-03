-- GeoVerify.in Supabase Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create employees table
CREATE TABLE public.employees (
    id uuid references auth.users on delete cascade not null primary key,
    name text not null,
    email text unique not null,
    role text not null default 'employee' check (role in ('employee', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.employees enable row level security;
create policy "Users can view their own profile" on employees for select using (auth.uid() = id);
create policy "Admins can view all profiles" on employees for select using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
);

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

-- 2. Create attendance table
CREATE TABLE public.attendance (
    id uuid default gen_random_uuid() primary key,
    employee_id uuid references public.employees(id) on delete cascade not null,
    date date not null,
    photo_url text not null,
    latitude double precision not null,
    longitude double precision not null,
    status text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(employee_id, date)
);

-- Enable RLS
alter table public.attendance enable row level security;
create policy "Users can view their own attendance" on attendance for select using (auth.uid() = employee_id);
create policy "Users can insert their own attendance" on attendance for insert with check (auth.uid() = employee_id);
create policy "Admins can view all attendance" on attendance for select using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
);

-- 3. Create holidays table
CREATE TABLE public.holidays (
    id uuid default gen_random_uuid() primary key,
    date date unique not null,
    name text not null
);

-- Enable RLS
alter table public.holidays enable row level security;
create policy "Anyone can view holidays" on holidays for select using (true);

-- 4. Create office_settings table
CREATE TABLE public.office_settings (
    id uuid default gen_random_uuid() primary key,
    latitude double precision not null,
    longitude double precision not null,
    allowed_radius double precision not null default 100
);

-- Enable RLS
alter table public.office_settings enable row level security;
create policy "Anyone can view office settings" on office_settings for select using (true);
create policy "Admins can update office settings" on office_settings for all using (
    exists (select 1 from employees where id = auth.uid() and role = 'admin')
);

-- 5. Create storage bucket for attendance photos
insert into storage.buckets (id, name, public) values ('attendance_photos', 'attendance_photos', true);
create policy "Anyone can view photos" on storage.objects for select using ( bucket_id = 'attendance_photos' );
create policy "Users can upload photos" on storage.objects for insert with check (
    bucket_id = 'attendance_photos' and auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Initial Admin Seed (optional)
-- Note: Replace with actual auth.user id after signup
-- insert into public.employees (id, name, email, role) values ('admin-uuid', 'Admin', 'admin@geoverify.in', 'admin');
