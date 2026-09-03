create extension if not exists "uuid-ossp";

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'es',
  theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  model text not null,
  options jsonb not null default '{}'::jsonb,
  revised_prompt text,
  status text not null default 'completed',
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_images (
  id uuid primary key default uuid_generate_v4(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
alter table public.generations enable row level security;
alter table public.generation_images enable row level security;

create policy "Users manage own preferences" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own generations" on public.generations
  for select using (auth.uid() = user_id);
create policy "Users manage own generations" on public.generations
  for delete using (auth.uid() = user_id);
create policy "Users read own generation images" on public.generation_images
  for select using (auth.uid() = user_id);
create policy "Users delete own generation images" on public.generation_images
  for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values
  ('generation-images', 'generation-images', false),
  ('reference-images', 'reference-images', false)
on conflict (id) do nothing;

create policy "Users read own generation files" on storage.objects
  for select using (bucket_id = 'generation-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own generation files" on storage.objects
  for delete using (bucket_id = 'generation-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users upload own reference files" on storage.objects
  for insert with check (bucket_id = 'reference-images' and (storage.foldername(name))[1] = auth.uid()::text);
