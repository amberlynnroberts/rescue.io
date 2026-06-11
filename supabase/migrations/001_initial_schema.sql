-- Rescue.IO v2 — Full Schema
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type org_role as enum ('owner','admin','staff','volunteer');
create type animal_species as enum ('dog','cat','rabbit','bird','reptile','small_animal','other');
create type animal_sex as enum ('male','female','unknown');
create type animal_status as enum ('available','hold','medical','adopted','fostered','transferred','deceased','quarantine','stray_hold');
create type intake_type as enum ('stray','owner_surrender','transfer','born_in_care','other');
create type application_status as enum ('pending','reviewing','approved','denied','withdrawn');
create type quarantine_reason as enum ('new_intake','illness','bite_case','exposure','post_surgery','behavior','other');
create type quarantine_status as enum ('active','cleared','extended','euthanized');
create type medical_record_type as enum ('exam','vaccination','surgery','treatment','lab_result','dental','spay_neuter','note');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text unique not null,
  email      text,
  phone      text,
  address    text,
  city       text,
  state      text,
  zip        text,
  logo_url   text,
  plan       text not null default 'free',
  modules    text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MEMBERSHIPS
-- ============================================================
create table org_memberships (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations on delete cascade,
  user_id     uuid not null references profiles on delete cascade,
  role        org_role not null default 'staff',
  invited_by  uuid references profiles,
  accepted_at timestamptz,
  created_at  timestamptz default now(),
  unique(org_id, user_id)
);

-- ============================================================
-- ANIMALS
-- ============================================================
create table animals (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations on delete cascade,
  name            text,
  species         animal_species not null default 'dog',
  breed           text,
  secondary_breed text,
  mix             boolean default false,
  color           text,
  markings        text,
  sex             animal_sex default 'unknown',
  dob             date,
  age_years       int,
  age_months      int,
  weight_lbs      numeric(5,2),
  intake_type     intake_type not null,
  intake_date     date not null default current_date,
  intake_notes    text,
  intake_by       uuid references profiles,
  microchip_id    text,
  shelter_id      text,
  status          animal_status not null default 'available',
  location        text,
  altered         boolean default false,
  heartworm_pos   boolean default false,
  fiv_pos         boolean default false,
  felv_pos        boolean default false,
  outcome_date    date,
  outcome_type    text,
  outcome_notes   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- ANIMAL PHOTOS
-- ============================================================
create table animal_photos (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations on delete cascade,
  animal_id   uuid not null references animals on delete cascade,
  url         text not null,
  is_primary  boolean default false,
  caption     text,
  uploaded_by uuid references profiles,
  created_at  timestamptz default now()
);

-- ============================================================
-- DAILY OBSERVATIONS (mirrors ShelterLuv)
-- ============================================================
create type appetite_level as enum ('good','reduced','not_eating');
create type water_level as enum ('normal','reduced','not_drinking');
create type stool_type as enum ('normal','soft','diarrhea','none_observed','blood');
create type urination_type as enum ('normal','reduced','none','abnormal');
create type behavior_type as enum ('normal','lethargic','anxious','aggressive','other');

create table daily_observations (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations on delete cascade,
  animal_id       uuid not null references animals on delete cascade,
  observed_at     timestamptz not null default now(),
  observed_by     uuid references profiles,
  -- Core vitals
  appetite        appetite_level default 'good',
  water_intake    water_level default 'normal',
  stool           stool_type default 'normal',
  urination       urination_type default 'normal',
  -- Symptoms
  vomiting        boolean default false,
  coughing        boolean default false,
  sneezing        boolean default false,
  discharge       boolean default false,
  -- Physical
  temp_f          numeric(4,1),
  weight_lbs      numeric(5,2),
  -- Behavior
  behavior        behavior_type default 'normal',
  behavior_notes  text,
  -- General
  notes           text,
  flag_for_vet    boolean default false,
  -- Quarantine link (if this obs was done during quarantine rounds)
  quarantine_case_id uuid,
  created_at      timestamptz default now()
);

-- ============================================================
-- MEDICAL RECORDS
-- ============================================================
create table medical_records (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations on delete cascade,
  animal_id   uuid not null references animals on delete cascade,
  type        medical_record_type not null,
  date        date not null default current_date,
  title       text not null,
  notes       text,
  vet_name    text,
  cost        numeric(8,2),
  recorded_by uuid references profiles,
  created_at  timestamptz default now()
);

-- ============================================================
-- MEDICATIONS
-- ============================================================
create table medications (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations on delete cascade,
  animal_id     uuid not null references animals on delete cascade,
  name          text not null,
  dosage        text,
  frequency     text,
  instructions  text,
  start_date    date not null default current_date,
  end_date      date,
  active        boolean default true,
  prescribed_by text,
  created_by    uuid references profiles,
  created_at    timestamptz default now()
);

create table medication_logs (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations on delete cascade,
  medication_id uuid not null references medications on delete cascade,
  animal_id     uuid not null references animals on delete cascade,
  given_at      timestamptz not null default now(),
  given_by      uuid references profiles,
  notes         text,
  skipped       boolean default false,
  skip_reason   text
);

-- ============================================================
-- ADOPTIONS
-- ============================================================
create table adoption_applications (
  id               uuid primary key default uuid_generate_v4(),
  org_id           uuid not null references organizations on delete cascade,
  animal_id        uuid not null references animals,
  status           application_status not null default 'pending',
  applicant_name   text not null,
  applicant_email  text not null,
  applicant_phone  text,
  applicant_address text,
  answers          jsonb default '{}',
  reviewed_by      uuid references profiles,
  reviewed_at      timestamptz,
  review_notes     text,
  adopted_at       timestamptz,
  adoption_fee     numeric(8,2),
  fee_paid         boolean default false,
  contract_url     text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- FOSTERS
-- ============================================================
create table foster_families (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  address         text,
  city            text,
  state           text,
  active          boolean default true,
  notes           text,
  home_check_date date,
  created_at      timestamptz default now()
);

create table foster_placements (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations on delete cascade,
  animal_id     uuid not null references animals,
  foster_id     uuid not null references foster_families,
  placed_at     timestamptz not null default now(),
  placed_by     uuid references profiles,
  returned_at   timestamptz,
  return_reason text,
  notes         text,
  created_at    timestamptz default now()
);

-- ============================================================
-- QUARANTINE (add-on module — shares data with daily_observations)
-- ============================================================
create table quarantine_cases (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations on delete cascade,
  animal_id       uuid not null references animals,
  reason          quarantine_reason not null,
  status          quarantine_status not null default 'active',
  start_date      date not null default current_date,
  expected_end    date,
  actual_end      date,
  kennel_location text,
  notes           text,
  opened_by       uuid references profiles,
  closed_by       uuid references profiles,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- INVENTORY
-- ============================================================
create table inventory_items (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations on delete cascade,
  name          text not null,
  category      text,
  unit          text,
  quantity      numeric(8,2) not null default 0,
  low_threshold numeric(8,2),
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on animals (org_id);
create index on animals (org_id, status);
create index on animals (org_id, intake_date desc);
create index on animal_photos (animal_id);
create index on animal_photos (animal_id, is_primary);
create index on daily_observations (animal_id, observed_at desc);
create index on daily_observations (org_id, observed_at desc);
create index on medical_records (animal_id);
create index on medications (animal_id, active);
create index on quarantine_cases (org_id, status);
create index on org_memberships (user_id);
create index on org_memberships (org_id);

-- ============================================================
-- RLS
-- ============================================================
alter table organizations        enable row level security;
alter table profiles             enable row level security;
alter table org_memberships      enable row level security;
alter table animals              enable row level security;
alter table animal_photos        enable row level security;
alter table daily_observations   enable row level security;
alter table medical_records      enable row level security;
alter table medications          enable row level security;
alter table medication_logs      enable row level security;
alter table adoption_applications enable row level security;
alter table foster_families      enable row level security;
alter table foster_placements    enable row level security;
alter table quarantine_cases     enable row level security;
alter table inventory_items      enable row level security;

-- Profiles
create policy "profiles: own" on profiles for all using (auth.uid() = id);

-- Orgs
create policy "orgs: create" on organizations for insert with check (auth.uid() is not null);
create policy "orgs: read" on organizations for select using (
  exists (select 1 from org_memberships where org_memberships.org_id = organizations.id and org_memberships.user_id = auth.uid())
);
create policy "orgs: update" on organizations for update using (
  exists (select 1 from org_memberships where org_memberships.org_id = organizations.id and org_memberships.user_id = auth.uid() and org_memberships.role in ('owner','admin'))
);

-- Memberships (using security definer to avoid recursion)
create or replace function is_org_member(oid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from org_memberships where org_id = oid and user_id = auth.uid())
$$;

create policy "memberships: read" on org_memberships for select using (
  user_id = auth.uid() or is_org_member(org_id)
);
create policy "memberships: insert" on org_memberships for insert with check (user_id = auth.uid());
create policy "memberships: delete" on org_memberships for delete using (user_id = auth.uid());
create policy "memberships: update" on org_memberships for update using (user_id = auth.uid());

-- All org-scoped tables: members have full access
create policy "animals: members" on animals for all using (
  exists (select 1 from org_memberships where org_id = animals.org_id and user_id = auth.uid())
);
create policy "photos: members" on animal_photos for all using (
  exists (select 1 from org_memberships where org_id = animal_photos.org_id and user_id = auth.uid())
);
create policy "observations: members" on daily_observations for all using (
  exists (select 1 from org_memberships where org_id = daily_observations.org_id and user_id = auth.uid())
);
create policy "medical: members" on medical_records for all using (
  exists (select 1 from org_memberships where org_id = medical_records.org_id and user_id = auth.uid())
);
create policy "meds: members" on medications for all using (
  exists (select 1 from org_memberships where org_id = medications.org_id and user_id = auth.uid())
);
create policy "med_logs: members" on medication_logs for all using (
  exists (select 1 from org_memberships where org_id = medication_logs.org_id and user_id = auth.uid())
);
create policy "adoptions: members" on adoption_applications for all using (
  exists (select 1 from org_memberships where org_id = adoption_applications.org_id and user_id = auth.uid())
);
create policy "fosters: members" on foster_families for all using (
  exists (select 1 from org_memberships where org_id = foster_families.org_id and user_id = auth.uid())
);
create policy "placements: members" on foster_placements for all using (
  exists (select 1 from org_memberships where org_id = foster_placements.org_id and user_id = auth.uid())
);
create policy "quarantine: members" on quarantine_cases for all using (
  exists (select 1 from org_memberships where org_id = quarantine_cases.org_id and user_id = auth.uid())
);
create policy "inventory: members" on inventory_items for all using (
  exists (select 1 from org_memberships where org_id = inventory_items.org_id and user_id = auth.uid())
);

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_updated_at before update on organizations for each row execute function set_updated_at();
create trigger set_updated_at before update on animals for each row execute function set_updated_at();
create trigger set_updated_at before update on quarantine_cases for each row execute function set_updated_at();

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- STORAGE BUCKET for animal photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', true)
on conflict (id) do nothing;

create policy "photos: public read" on storage.objects
  for select using (bucket_id = 'animal-photos');

create policy "photos: auth upload" on storage.objects
  for insert with check (bucket_id = 'animal-photos' and auth.uid() is not null);

create policy "photos: auth delete" on storage.objects
  for delete using (bucket_id = 'animal-photos' and auth.uid() is not null);
