-- ============================================================================
-- Digital Rx — database schema
--
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query),
-- then run seed_medicines.sql.
--
-- Design notes
--   * Single-doctor deployment: every row is owned by one auth user and is
--     unreachable by any other user. That is enforced by row-level security,
--     not by application code, so a leaked anon key still exposes nothing.
--   * Prescriptions store a full JSON snapshot of what was issued. Editing a
--     patient record later never rewrites history, and a reprint is byte-for-byte
--     what the patient was handed.
--   * medicine_catalog is shared and read-only; medicines holds the doctor's own
--     additions. medicines_all unions the two for search.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: prescriber identity, clinic letterhead, print calibration
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  doctor_name       text not null default '',
  qualifications    text not null default '',
  bmdc_no           text not null default '',
  clinic_name       text not null default '',
  clinic_address    text not null default '',
  clinic_phone      text not null default '',
  clinic_email      text not null default '',
  default_language  text not null default 'en' check (default_language in ('en', 'bn')),
  -- Millimetre geometry of the pre-printed hospital pad. Editable in Settings so
  -- a new pad can be calibrated without a code change.
  overlay_boxes     jsonb not null default '{
    "disease":   {"top": 85,  "left": 15,  "width": 80,  "height": 110},
    "treatment": {"top": 85,  "left": 110, "width": 85,  "height": 110},
    "diagnosis": {"top": 195, "left": 15,  "width": 180, "height": 25},
    "advice":    {"top": 220, "left": 15,  "width": 180, "height": 40}
  }'::jsonb,
  overlay_font_max  numeric not null default 11 check (overlay_font_max between 6 and 24),
  overlay_font_min  numeric not null default 9  check (overlay_font_min between 6 and 24),
  -- Monotonic prescription counter. Kept here rather than derived from
  -- max(serial) so that deleting a prescription can never hand its number to a
  -- different patient's prescription later.
  rx_counter        bigint not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create table if not exists public.patients (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(btrim(name)) > 0),
  age         text not null default '',   -- free text: "42", "6 months", "3 yr"
  sex         text check (sex in ('Male', 'Female', 'Other')),
  phone       text not null default '',
  mrn         text not null default '',
  weight      text not null default '',
  address     text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Re-running this file against an existing database must also apply columns
-- added after it was first installed: `create table if not exists` above is a
-- no-op there, but the trigger further down depends on rx_counter existing.
alter table public.profiles add column if not exists rx_counter bigint not null default 0;

create index if not exists patients_user_created_idx on public.patients (user_id, created_at desc);
create index if not exists patients_name_idx         on public.patients (user_id, lower(name));
create index if not exists patients_phone_idx        on public.patients (user_id, phone);
create unique index if not exists patients_mrn_uniq
  on public.patients (user_id, lower(mrn)) where btrim(mrn) <> '';

-- ---------------------------------------------------------------------------
-- prescriptions
-- ---------------------------------------------------------------------------
create table if not exists public.prescriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  patient_id        uuid references public.patients (id) on delete set null,
  serial            bigint not null,           -- per-doctor running number
  visit_date        date not null default current_date,
  patient_snapshot  jsonb not null default '{}'::jsonb,
  content           jsonb not null,            -- the complete RxDraft as issued
  summary           text not null default '',  -- diagnosis line, for list views
  printed_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, serial)
);

create index if not exists rx_user_date_idx    on public.prescriptions (user_id, visit_date desc, created_at desc);
create index if not exists rx_patient_idx      on public.prescriptions (patient_id, visit_date desc);

-- Bring the counter up to date on an existing database, so re-running this file
-- never re-issues a serial number that is already on paper.
update public.profiles p
   set rx_counter = greatest(
         p.rx_counter,
         coalesce((select max(r.serial) from public.prescriptions r where r.user_id = p.id), 0)
       );

-- Per-doctor serial number, taken from a counter on the profile row. The UPDATE
-- takes a row lock, so two browser tabs saving at the same moment queue rather
-- than collide, and a deleted prescription never releases its number.
create or replace function public.assign_prescription_serial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare next_val bigint;
begin
  if new.serial is null or new.serial = 0 then
    insert into public.profiles (id) values (new.user_id) on conflict (id) do nothing;
    update public.profiles
       set rx_counter = rx_counter + 1
     where id = new.user_id
    returning rx_counter into next_val;
    new.serial := next_val;
  end if;
  return new;
end;
$$;

drop trigger if exists prescriptions_serial on public.prescriptions;
create trigger prescriptions_serial
  before insert on public.prescriptions
  for each row execute function public.assign_prescription_serial();

-- ---------------------------------------------------------------------------
-- templates: a saved, reusable consultation
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(btrim(name)) > 0),
  description text not null default '',
  content     jsonb not null,
  use_count   integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists templates_user_idx on public.templates (user_id, use_count desc, name);

-- ---------------------------------------------------------------------------
-- medicines: shared catalogue + the doctor's own entries
-- ---------------------------------------------------------------------------
create table if not exists public.medicine_catalog (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  generic     text not null,
  strength    text,
  form        text,
  category    text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists medicine_catalog_uniq
  on public.medicine_catalog (lower(name), coalesce(lower(strength), ''));
create index if not exists medicine_catalog_search_idx
  on public.medicine_catalog (lower(name), lower(generic));

create table if not exists public.medicines (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  name                 text not null check (length(btrim(name)) > 0),
  generic              text not null default '',
  strength             text not null default '',
  form                 text not null default '',
  category             text not null default 'Custom',
  -- The doctor's own habitual defaults. Deliberately empty until they set them:
  -- nothing here suggests a dose, it only remembers what they themselves typed.
  default_dose         text not null default '',
  default_frequency    text not null default '',
  default_duration     text not null default '',
  default_instructions text not null default '',
  is_favorite          boolean not null default false,
  use_count            integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists medicines_user_idx on public.medicines (user_id, use_count desc, name);

-- Unified search surface. security_invoker means the caller's RLS applies to
-- the underlying tables, so a doctor sees the shared catalogue plus only their
-- own custom drugs.
create or replace view public.medicines_all
with (security_invoker = on) as
  select
    c.id, c.name, c.generic, c.strength, c.form, c.category,
    ''::text as default_dose, ''::text as default_frequency,
    ''::text as default_duration, ''::text as default_instructions,
    false as is_favorite, 0 as use_count, false as is_custom
  from public.medicine_catalog c
  union all
  select
    m.id, m.name, m.generic, m.strength, m.form, m.category,
    m.default_dose, m.default_frequency, m.default_duration, m.default_instructions,
    m.is_favorite, m.use_count, true as is_custom
  from public.medicines m;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'patients', 'prescriptions', 'templates', 'medicines'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
         for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- New signups get a profile row automatically
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, doctor_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'doctor_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.patients         enable row level security;
alter table public.prescriptions    enable row level security;
alter table public.templates        enable row level security;
alter table public.medicines        enable row level security;
alter table public.medicine_catalog enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists patients_own on public.patients;
create policy patients_own on public.patients
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists prescriptions_own on public.prescriptions;
create policy prescriptions_own on public.prescriptions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists templates_own on public.templates;
create policy templates_own on public.templates
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists medicines_own on public.medicines;
create policy medicines_own on public.medicines
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- The shared catalogue is readable by any signed-in user and writable by none.
drop policy if exists catalog_read on public.medicine_catalog;
create policy catalog_read on public.medicine_catalog
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Patient search: name / phone / MRN, newest first
-- ---------------------------------------------------------------------------
create or replace function public.search_patients(q text, lim integer default 20)
returns setof public.patients
language sql
stable
security invoker
set search_path = public
as $$
  select *
    from public.patients p
   where p.user_id = (select auth.uid())
     and (
       btrim(coalesce(q, '')) = ''
       or p.name  ilike '%' || btrim(q) || '%'
       or p.phone ilike '%' || btrim(q) || '%'
       or p.mrn   ilike '%' || btrim(q) || '%'
     )
   order by p.created_at desc
   limit greatest(1, least(coalesce(lim, 20), 100));
$$;

grant execute on function public.search_patients(text, integer) to authenticated;
