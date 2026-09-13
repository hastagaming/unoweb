create type public.project_role as enum ('owner', 'editor', 'viewer');
create type public.version_reason as enum ('autosave', 'manual', 'restore');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  platform_id text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.project_role not null default 'viewer',
  invited_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null,
  content text not null default '',
  language text not null default 'plaintext',
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  files_snapshot jsonb not null,
  created_by uuid not null references public.profiles(id),
  reason public.version_reason not null default 'autosave',
  created_at timestamptz not null default now()
);

create index idx_project_versions_project_created
  on public.project_versions (project_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger trg_files_touch before update on public.project_files
  for each row execute function public.touch_updated_at();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_project() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_files enable row level security;
alter table public.project_versions enable row level security;

create policy "profiles: read self" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: update self" on public.profiles
  for update using (id = auth.uid());

create policy "projects: members can read" on public.projects
  for select using (
    exists (select 1 from public.project_members m
      where m.project_id = id and m.user_id = auth.uid())
  );
create policy "projects: owner can insert" on public.projects
  for insert with check (owner_id = auth.uid());
create policy "projects: editor+ can update" on public.projects
  for update using (
    exists (select 1 from public.project_members m
      where m.project_id = id and m.user_id = auth.uid()
      and m.role in ('owner', 'editor'))
  );
create policy "projects: owner can delete" on public.projects
  for delete using (owner_id = auth.uid());

create policy "members: project members can read" on public.project_members
  for select using (
    exists (select 1 from public.project_members m2
      where m2.project_id = project_id and m2.user_id = auth.uid())
  );
create policy "members: owner can manage" on public.project_members
  for all using (
    exists (select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "files: members can read" on public.project_files
  for select using (
    exists (select 1 from public.project_members m
      where m.project_id = project_id and m.user_id = auth.uid())
  );
create policy "files: editor+ can write" on public.project_files
  for all using (
    exists (select 1 from public.project_members m
      where m.project_id = project_id and m.user_id = auth.uid()
      and m.role in ('owner', 'editor'))
  );

create policy "versions: members can read" on public.project_versions
  for select using (
    exists (select 1 from public.project_members m
      where m.project_id = project_id and m.user_id = auth.uid())
  );
create policy "versions: editor+ can insert" on public.project_versions
  for insert with check (
    exists (select 1 from public.project_members m
      where m.project_id = project_id and m.user_id = auth.uid()
      and m.role in ('owner', 'editor'))
  );
