-- User data tables for SCRAN
-- Run this in the Supabase SQL Editor after the recipes table is set up.
--
-- user_id is a device-generated UUID for now.
-- When authentication is added, replace with: auth.uid()::text

-- ── Saved recipes ─────────────────────────────────────────────────────────────

create table saved_recipes (
  id         uuid default gen_random_uuid() primary key,
  user_id    text not null,
  recipe_id  text not null references recipes(id) on delete cascade,
  saved_at   timestamptz default now(),
  unique(user_id, recipe_id)
);

alter table saved_recipes enable row level security;

create policy "Users can read their own saved recipes"
  on saved_recipes for select using (true);

create policy "Users can insert their own saved recipes"
  on saved_recipes for insert with check (true);

create policy "Users can delete their own saved recipes"
  on saved_recipes for delete using (true);

grant select, insert, delete on public.saved_recipes to anon, authenticated;

-- ── Pantry items ──────────────────────────────────────────────────────────────

create table pantry_items (
  id         uuid default gen_random_uuid() primary key,
  user_id    text not null,
  name       text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table pantry_items enable row level security;

create policy "Users can read their own pantry"
  on pantry_items for select using (true);

create policy "Users can insert into their own pantry"
  on pantry_items for insert with check (true);

create policy "Users can delete from their own pantry"
  on pantry_items for delete using (true);

grant select, insert, delete on public.pantry_items to anon, authenticated;

-- ── Shopping lists ────────────────────────────────────────────────────────────

create table shopping_lists (
  id         text primary key,
  user_id    text not null,
  name       text not null,
  created_at timestamptz default now()
);

alter table shopping_lists enable row level security;

create policy "Users can manage their own shopping lists"
  on shopping_lists for all using (true);

grant select, insert, update, delete on public.shopping_lists to anon, authenticated;

-- ── Shopping list items ───────────────────────────────────────────────────────

create table shopping_list_items (
  id          text primary key,
  list_id     text not null references shopping_lists(id) on delete cascade,
  name        text not null,
  checked     boolean default false,
  category    text,
  recipe_id   text,
  recipe_name text,
  created_at  timestamptz default now()
);

alter table shopping_list_items enable row level security;

create policy "Users can manage their own shopping list items"
  on shopping_list_items for all using (true);

grant select, insert, update, delete on public.shopping_list_items to anon, authenticated;
