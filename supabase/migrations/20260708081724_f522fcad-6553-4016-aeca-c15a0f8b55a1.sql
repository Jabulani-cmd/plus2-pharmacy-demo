
alter table public.shared_orders
  add column if not exists driver_id text,
  add column if not exists driver_auth_id uuid,
  add column if not exists accepted_at text,
  add column if not exists collected_at text,
  add column if not exists driver_lat numeric,
  add column if not exists driver_lng numeric,
  add column if not exists driver_heading numeric;

create table if not exists public.driver_notifications (
  id uuid primary key default gen_random_uuid(),
  driver_auth_id uuid not null,
  order_id text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.driver_notifications to anon, authenticated;
grant all on public.driver_notifications to service_role;

alter table public.driver_notifications enable row level security;

drop policy if exists "open_driver_notifications" on public.driver_notifications;
create policy "open_driver_notifications"
  on public.driver_notifications
  for all to anon, authenticated
  using (true) with check (true);

create table if not exists public.staff_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  title text not null,
  body text not null,
  kind text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.staff_notifications to anon, authenticated;
grant all on public.staff_notifications to service_role;

alter table public.staff_notifications enable row level security;

drop policy if exists "open_staff_notifications" on public.staff_notifications;
create policy "open_staff_notifications"
  on public.staff_notifications
  for all to anon, authenticated
  using (true) with check (true);

do $$ begin
  begin
    alter publication supabase_realtime add table public.driver_notifications;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.staff_notifications;
  exception when duplicate_object then null; end;
end $$;
