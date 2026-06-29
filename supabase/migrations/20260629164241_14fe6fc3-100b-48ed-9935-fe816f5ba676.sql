-- ============================================================
-- Driver Portal: drivers table + seed 4 driver auth accounts
-- ============================================================

-- 1) drivers table
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  vehicle text not null,
  plate text not null,
  branch text not null default '9th Ave CBD',
  off_duty boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drivers_name_idx on public.drivers (name);
create index if not exists drivers_auth_user_id_idx on public.drivers (auth_user_id);

grant select on public.drivers to anon;
grant select, insert, update, delete on public.drivers to authenticated;
grant all on public.drivers to service_role;

alter table public.drivers enable row level security;

drop policy if exists "drivers read all" on public.drivers;
create policy "drivers read all" on public.drivers
  for select using (true);

drop policy if exists "driver updates own row" on public.drivers;
create policy "driver updates own row" on public.drivers
  for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists drivers_set_updated_at on public.drivers;
create trigger drivers_set_updated_at
  before update on public.drivers
  for each row execute function public.set_updated_at();

-- 2) realtime
alter publication supabase_realtime add table public.drivers;

-- 3) seed 4 driver auth accounts + profiles + user_roles + drivers rows.
-- The handle_new_user trigger on auth.users will create profiles + a
-- user_roles row with role='customer'. We then upsert it to 'driver'.

do $$
declare
  v record;
  v_uid uuid;
begin
  for v in
    select * from (values
      ('siphamandla@kingspharmacy.co.zw', 'Siphamandla Dube',   '+263 77 334 5566', 'VW Polo',         'AEB 7790'),
      ('tatenda@kingspharmacy.co.zw',     'Tatenda Chirwa',     '+263 71 998 4421', 'Honda Fit',       'AFC 1230'),
      ('bongani@kingspharmacy.co.zw',     'Bongani Sithole',    '+263 78 661 7700', 'Toyota Hilux',    'ACJ 4821'),
      ('rudo@kingspharmacy.co.zw',        'Rudo Mhlanga',       '+263 73 220 9981', 'Mahindra Bolero', 'AGB 2287')
    ) as t(email, name, phone, vehicle, plate)
  loop
    -- skip if user already exists
    select id into v_uid from auth.users where email = v.email;

    if v_uid is null then
      v_uid := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        v_uid,
        'authenticated', 'authenticated',
        v.email,
        crypt('Driver123!', gen_salt('bf')),
        now(),
        jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
        jsonb_build_object('full_name', v.name, 'phone', v.phone),
        now(), now(),
        '', '', '', ''
      );

      insert into auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        v_uid::text,
        v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v.email, 'email_verified', true),
        'email',
        now(), now(), now()
      );
    end if;

    -- ensure profile exists with name/phone (trigger usually handles it)
    insert into public.profiles (id, full_name, phone, email)
    values (v_uid, v.name, v.phone, v.email)
    on conflict (id) do update
      set full_name = excluded.full_name,
          phone = excluded.phone,
          email = excluded.email;

    -- assign the 'driver' role (remove default 'customer' if present)
    delete from public.user_roles where user_id = v_uid and role = 'customer';
    insert into public.user_roles (user_id, role)
    values (v_uid, 'driver')
    on conflict (user_id, role) do nothing;

    -- driver row
    insert into public.drivers (auth_user_id, name, phone, vehicle, plate, branch)
    values (v_uid, v.name, v.phone, v.vehicle, v.plate, '9th Ave CBD')
    on conflict (auth_user_id) do update
      set name = excluded.name,
          phone = excluded.phone,
          vehicle = excluded.vehicle,
          plate = excluded.plate;
  end loop;
end$$;