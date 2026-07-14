alter table public.prescriptions
  add column if not exists updated_at timestamptz default now();

do $$ begin
  begin
    alter publication supabase_realtime add table public.prescriptions;
  exception when duplicate_object then null;
  end;
end $$;

alter table public.prescriptions disable row level security;