create extension if not exists pg_trgm;

create table if not exists official_missing_persons (
  case_id text primary key,
  reported_at timestamp,
  missing_person_name text,
  gender text,
  age_band text,
  state text,
  district text,
  language text,
  last_seen_location text,
  reporting_center text,
  reporter_mobile text,
  physical_description text,
  status text,
  resolution_hours numeric,
  is_duplicate_report boolean default false,
  remarks text,
  search_text text generated always as (
    lower(
      coalesce(case_id, '') || ' ' ||
      coalesce(missing_person_name, '') || ' ' ||
      coalesce(gender, '') || ' ' ||
      coalesce(age_band, '') || ' ' ||
      coalesce(state, '') || ' ' ||
      coalesce(district, '') || ' ' ||
      coalesce(language, '') || ' ' ||
      coalesce(last_seen_location, '') || ' ' ||
      coalesce(reporting_center, '') || ' ' ||
      coalesce(physical_description, '') || ' ' ||
      coalesce(status, '') || ' ' ||
      coalesce(remarks, '')
    )
  ) stored
);

create table if not exists cctv_locations (
  camera_id text primary key,
  longitude double precision not null,
  latitude double precision not null
);

create table if not exists zone_boundaries (
  zone_name text primary key,
  centroid_lat double precision not null,
  centroid_lng double precision not null,
  approx_boundary_points integer
);

create table if not exists police_stations (
  station_name text primary key,
  longitude double precision not null,
  latitude double precision not null
);

create table if not exists chokepoints_parking (
  location_name text primary key,
  category text not null,
  longitude double precision not null,
  latitude double precision not null,
  risk_level text,
  project_status text,
  source_url text,
  note text,
  kml_description text
);

create table if not exists live_cases (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual',
  source_detail text,
  external_case_id text,
  reported_at timestamptz not null default now(),
  case_type text not null default 'missing' check (case_type in ('missing', 'found')),
  status text not null default 'open',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  missing_person_name text,
  gender text,
  age_band text,
  state text,
  district text,
  language text,
  last_seen_location text,
  zone_name text references zone_boundaries(zone_name),
  reporter_mobile text,
  physical_description text,
  raw_report text,
  structured_data jsonb not null default '{}'::jsonb,
  private_verification_clues jsonb not null default '[]'::jsonb,
  risk_flags text[] not null default '{}',
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists duplicate_reviews (
  id uuid primary key default gen_random_uuid(),
  primary_case_id text not null,
  candidate_case_id text not null,
  primary_source text not null default 'official',
  candidate_source text not null default 'official',
  score integer not null check (score between 0 and 100),
  reasons text[] not null default '{}',
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'merged', 'not_duplicate')),
  reviewer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references live_cases(id) on delete cascade,
  official_case_id text references official_missing_persons(case_id),
  title text not null,
  description text,
  assigned_to text,
  status text not null default 'new' check (status in ('new', 'accepted', 'en_route', 'on_scene', 'completed', 'escalated', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  zone_name text references zone_boundaries(zone_name),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists case_updates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references live_cases(id) on delete cascade,
  official_case_id text references official_missing_persons(case_id),
  update_type text not null,
  note text,
  actor text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists cctv_review_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references live_cases(id) on delete cascade,
  official_case_id text references official_missing_persons(case_id),
  camera_id text references cctv_locations(camera_id),
  requested_by text,
  status text not null default 'requested' check (status in ('requested', 'in_review', 'completed', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verified_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('accommodation', 'vendor', 'helpdesk', 'transport')),
  display_name text not null,
  official_id text,
  phone text,
  upi_vpa text,
  website text,
  zone_name text references zone_boundaries(zone_name),
  verification_status text not null default 'verified' check (verification_status in ('verified', 'revoked', 'pending')),
  created_at timestamptz not null default now()
);

create table if not exists trust_check_reports (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'whatsapp',
  reporter_mobile text,
  raw_message text,
  extracted_phone text,
  extracted_upi_vpa text,
  extracted_payee_name text,
  extracted_amount numeric,
  claimed_entity_name text,
  risk_level text not null default 'unverified' check (risk_level in ('verified', 'unverified', 'high_concern')),
  reasons text[] not null default '{}',
  matched_verified_entity uuid references verified_entities(id),
  status text not null default 'open' check (status in ('open', 'escalated', 'closed')),
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  entity_type text not null,
  entity_id text,
  pii_accessed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_official_missing_search_trgm on official_missing_persons using gin (search_text gin_trgm_ops);
create index if not exists idx_official_missing_status on official_missing_persons(status);
create index if not exists idx_official_missing_age on official_missing_persons(age_band);
create index if not exists idx_official_missing_center on official_missing_persons(reporting_center);
create index if not exists idx_official_missing_duplicate on official_missing_persons(is_duplicate_report);
create index if not exists idx_live_cases_status on live_cases(status);
create index if not exists idx_live_cases_zone on live_cases(zone_name);
create index if not exists idx_live_cases_priority on live_cases(priority);
create index if not exists idx_tasks_status on volunteer_tasks(status);
create index if not exists idx_trust_check_risk on trust_check_reports(risk_level);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_live_cases_updated_at on live_cases;
create trigger trg_live_cases_updated_at before update on live_cases
for each row execute function set_updated_at();

drop trigger if exists trg_duplicate_reviews_updated_at on duplicate_reviews;
create trigger trg_duplicate_reviews_updated_at before update on duplicate_reviews
for each row execute function set_updated_at();

drop trigger if exists trg_volunteer_tasks_updated_at on volunteer_tasks;
create trigger trg_volunteer_tasks_updated_at before update on volunteer_tasks
for each row execute function set_updated_at();

drop trigger if exists trg_trust_check_reports_updated_at on trust_check_reports;
create trigger trg_trust_check_reports_updated_at before update on trust_check_reports
for each row execute function set_updated_at();

create or replace function mask_phone(phone text)
returns text
language sql
stable
as $$
  select case
    when phone is null or length(trim(phone)) < 5 then null
    else left(phone, 4) || repeat('*', greatest(length(phone) - 7, 0)) || right(phone, 3)
  end;
$$;

create or replace function haversine_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
as $$
  select 6371 * 2 * asin(
    sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians((lng2 - lng1) / 2)), 2)
    )
  );
$$;

create or replace function command_center_stats()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'official_total', (select count(*) from official_missing_persons),
    'official_reunited', (select count(*) from official_missing_persons where status = 'Reunited'),
    'official_pending', (select count(*) from official_missing_persons where status = 'Pending'),
    'official_hospital', (select count(*) from official_missing_persons where status = 'Transferred to hospital'),
    'official_unresolved', (select count(*) from official_missing_persons where status = 'Unresolved'),
    'official_duplicates', (select count(*) from official_missing_persons where is_duplicate_report),
    'official_no_name', (select count(*) from official_missing_persons where nullif(trim(missing_person_name), '') is null),
    'official_no_mobile', (select count(*) from official_missing_persons where nullif(trim(reporter_mobile), '') is null),
    'official_children', (select count(*) from official_missing_persons where age_band in ('0-12', '13-17')),
    'official_elderly', (select count(*) from official_missing_persons where age_band in ('61-70', '71-80', '80+')),
    'live_open', (select count(*) from live_cases where status <> 'closed'),
    'volunteer_open_tasks', (select count(*) from volunteer_tasks where status not in ('completed', 'cancelled')),
    'trust_high_concern', (select count(*) from trust_check_reports where risk_level = 'high_concern'),
    'zones', (select count(*) from zone_boundaries),
    'cameras', (select count(*) from cctv_locations),
    'police_stations', (select count(*) from police_stations),
    'chokepoints_parking', (select count(*) from chokepoints_parking)
  );
$$;

create or replace function search_official_cases(q text default '', max_rows integer default 50)
returns table (
  case_id text,
  reported_at timestamp,
  missing_person_name text,
  masked_mobile text,
  gender text,
  age_band text,
  state text,
  district text,
  language text,
  last_seen_location text,
  reporting_center text,
  physical_description text,
  status text,
  is_duplicate_report boolean,
  risk_flags text[],
  rank_score real
)
language sql
stable
as $$
  select
    m.case_id,
    m.reported_at,
    nullif(m.missing_person_name, ''),
    mask_phone(m.reporter_mobile),
    m.gender,
    m.age_band,
    m.state,
    m.district,
    m.language,
    m.last_seen_location,
    m.reporting_center,
    m.physical_description,
    m.status,
    m.is_duplicate_report,
    array_remove(array[
      case when m.age_band in ('0-12', '13-17') then 'child' end,
      case when m.age_band in ('61-70', '71-80', '80+') then 'elderly' end,
      case when nullif(trim(m.missing_person_name), '') is null then 'no_name' end,
      case when nullif(trim(m.reporter_mobile), '') is null then 'no_mobile' end,
      case when m.status = 'Transferred to hospital' then 'hospital' end,
      case when m.status = 'Unresolved' then 'unresolved' end,
      case when m.is_duplicate_report then 'possible_duplicate' end
    ], null) as risk_flags,
    case
      when coalesce(q, '') = '' then 0
      else similarity(m.search_text, lower(q))
    end as rank_score
  from official_missing_persons m
  where coalesce(q, '') = ''
     or m.search_text ilike '%' || lower(q) || '%'
     or similarity(m.search_text, lower(q)) > 0.08
  order by
    case when coalesce(q, '') = '' then m.reported_at end desc,
    similarity(m.search_text, lower(coalesce(q, ''))) desc
  limit greatest(1, least(coalesce(max_rows, 50), 200));
$$;

create or replace function vulnerable_official_cases(max_rows integer default 100)
returns table (
  case_id text,
  missing_person_name text,
  masked_mobile text,
  age_band text,
  gender text,
  language text,
  last_seen_location text,
  reporting_center text,
  status text,
  risk_flags text[]
)
language sql
stable
as $$
  select
    m.case_id,
    nullif(m.missing_person_name, ''),
    mask_phone(m.reporter_mobile),
    m.age_band,
    m.gender,
    m.language,
    m.last_seen_location,
    m.reporting_center,
    m.status,
    array_remove(array[
      case when m.age_band in ('0-12', '13-17') then 'child' end,
      case when m.age_band in ('61-70', '71-80', '80+') then 'elderly' end,
      case when nullif(trim(m.missing_person_name), '') is null then 'no_name' end,
      case when nullif(trim(m.reporter_mobile), '') is null then 'no_mobile' end,
      case when m.status = 'Transferred to hospital' then 'hospital' end,
      case when m.status = 'Unresolved' then 'unresolved' end
    ], null) as risk_flags
  from official_missing_persons m
  where m.age_band in ('0-12', '13-17', '61-70', '71-80', '80+')
     or nullif(trim(m.missing_person_name), '') is null
     or nullif(trim(m.reporter_mobile), '') is null
     or m.status in ('Transferred to hospital', 'Unresolved', 'Pending')
  order by
    case when m.status = 'Unresolved' then 0 when m.status = 'Transferred to hospital' then 1 else 2 end,
    m.reported_at desc
  limit greatest(1, least(coalesce(max_rows, 100), 300));
$$;

create or replace function nearest_police(lat double precision, lng double precision, max_rows integer default 3)
returns table (
  station_name text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
)
language sql
stable
as $$
  select
    p.station_name,
    p.latitude,
    p.longitude,
    haversine_km(lat, lng, p.latitude, p.longitude) as distance_km
  from police_stations p
  order by distance_km
  limit greatest(1, least(coalesce(max_rows, 3), 20));
$$;

create or replace function nearest_cctv(lat double precision, lng double precision, max_rows integer default 8)
returns table (
  camera_id text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
)
language sql
stable
as $$
  select
    c.camera_id,
    c.latitude,
    c.longitude,
    haversine_km(lat, lng, c.latitude, c.longitude) as distance_km
  from cctv_locations c
  order by distance_km
  limit greatest(1, least(coalesce(max_rows, 8), 50));
$$;

drop function if exists nearest_chokepoints(double precision, double precision, integer);

create or replace function nearest_chokepoints(lat double precision, lng double precision, max_rows integer default 5)
returns table (
  location_name text,
  category text,
  risk_level text,
  project_status text,
  source_url text,
  note text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
)
language sql
stable
as $$
  select
    cp.location_name,
    cp.category,
    cp.risk_level,
    cp.project_status,
    cp.source_url,
    cp.note,
    cp.latitude,
    cp.longitude,
    haversine_km(lat, lng, cp.latitude, cp.longitude) as distance_km
  from chokepoints_parking cp
  order by distance_km
  limit greatest(1, least(coalesce(max_rows, 5), 50));
$$;

create or replace function zone_spatial_summary()
returns table (
  zone_name text,
  centroid_lat double precision,
  centroid_lng double precision,
  camera_count bigint,
  live_case_count bigint,
  critical_live_case_count bigint,
  open_task_count bigint
)
language sql
stable
as $$
  select
    z.zone_name,
    z.centroid_lat,
    z.centroid_lng,
    (select count(*) from cctv_locations c where split_part(c.camera_id, '-C', 1) = replace(z.zone_name, 'Zone Area ', 'Z')) as camera_count,
    (select count(*) from live_cases lc where lc.zone_name = z.zone_name) as live_case_count,
    (select count(*) from live_cases lc where lc.zone_name = z.zone_name and lc.priority in ('high', 'critical')) as critical_live_case_count,
    (select count(*) from volunteer_tasks vt where vt.zone_name = z.zone_name and vt.status not in ('completed', 'cancelled')) as open_task_count
  from zone_boundaries z
  order by z.zone_name;
$$;

create or replace function create_audit_log(
  p_actor text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_pii_accessed boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into audit_logs(actor, action, entity_type, entity_id, pii_accessed, metadata)
  values (p_actor, p_action, p_entity_type, p_entity_id, p_pii_accessed, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function request_manual_cctv_review(
  p_camera_id text,
  p_requested_by text default 'command_center',
  p_case_id uuid default null,
  p_official_case_id text default null,
  p_note text default 'Manual CCTV location review requested. No automated footage analysis claimed.'
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into cctv_review_requests(case_id, official_case_id, camera_id, requested_by, note)
  values (p_case_id, p_official_case_id, p_camera_id, p_requested_by, p_note)
  returning id into v_id;

  perform create_audit_log(
    p_requested_by,
    'requested_manual_cctv_review',
    'cctv_review_request',
    v_id::text,
    false,
    jsonb_build_object(
      'camera_id', p_camera_id,
      'case_id', p_case_id,
      'official_case_id', p_official_case_id
    )
  );

  return v_id;
end;
$$;

alter table official_missing_persons enable row level security;
alter table cctv_locations enable row level security;
alter table zone_boundaries enable row level security;
alter table police_stations enable row level security;
alter table chokepoints_parking enable row level security;
alter table live_cases enable row level security;
alter table duplicate_reviews enable row level security;
alter table volunteer_tasks enable row level security;
alter table case_updates enable row level security;
alter table cctv_review_requests enable row level security;
alter table verified_entities enable row level security;
alter table trust_check_reports enable row level security;
alter table audit_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'official_missing_persons', 'cctv_locations', 'zone_boundaries', 'police_stations', 'chokepoints_parking',
    'live_cases', 'duplicate_reviews', 'volunteer_tasks', 'case_updates', 'cctv_review_requests',
    'verified_entities', 'trust_check_reports', 'audit_logs'
  ]
  loop
    execute format('drop policy if exists "demo_read_%1$s" on %1$I', t);
    execute format('drop policy if exists "demo_insert_%1$s" on %1$I', t);
    execute format('drop policy if exists "demo_update_%1$s" on %1$I', t);
    execute format('create policy "demo_read_%1$s" on %1$I for select to anon, authenticated using (true)', t);
    execute format('create policy "demo_insert_%1$s" on %1$I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "demo_update_%1$s" on %1$I for update to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table live_cases;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table volunteer_tasks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table case_updates;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table trust_check_reports;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table audit_logs;
exception when duplicate_object then null;
end $$;
