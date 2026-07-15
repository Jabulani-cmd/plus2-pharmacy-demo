ALTER TABLE public.notifications RENAME COLUMN tone TO kind;
ALTER TABLE public.notifications RENAME COLUMN body TO message;