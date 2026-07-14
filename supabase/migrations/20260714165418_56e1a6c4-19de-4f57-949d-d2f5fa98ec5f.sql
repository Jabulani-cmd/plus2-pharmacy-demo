alter table public.prescriptions
  add column if not exists dispatcher_notes text,
  add column if not exists printed_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists assigned_at timestamptz;