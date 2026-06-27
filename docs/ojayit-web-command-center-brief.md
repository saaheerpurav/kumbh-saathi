# Ojayit Web Command Center Brief

Date: 2026-06-27

Owner: Ojayit

Scope: website / web command center only.

Do not build mobile app, iPad booth, WhatsApp bot, avatar, or PPT.

## Goal

Build the official/operator web command center for **Kumbh Saathi**.

The command center must use the shared Supabase backend so Saaheer's mobile app, iPad booth, WhatsApp bot, and avatar flows stay in sync with the website.

The website should prove the core system:

- official dataset is loaded
- all centers are searchable together
- duplicate reports can be reviewed
- vulnerable cases are prioritized
- spatial context is available from zones/CCTV/police/chokepoints
- live cases from WhatsApp/avatar/iPad/mobile appear in realtime
- volunteer task/status changes update in realtime
- audit/privacy actions are tracked

## Supabase Project

Project URL:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ptznwvnabmkhnahtyhjo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask Saaheer for anon key>
```

Use only the anon key in frontend code.

Never put database password or service-role key in frontend code.

## Main Data Tables

### `official_missing_persons`

Organizer-provided synthetic dataset. 2,500 rows.

Use for:

- dashboard stats
- search
- case details
- vulnerable queues
- duplicate context

Important fields:

- `case_id`
- `reported_at`
- `missing_person_name`
- `gender`
- `age_band`
- `state`
- `district`
- `language`
- `last_seen_location`
- `reporting_center`
- `reporter_mobile`
- `physical_description`
- `status`
- `resolution_hours`
- `is_duplicate_report`
- `remarks`

Use masked phone values from RPCs when possible.

### `live_cases`

Cases created by live app surfaces:

- WhatsApp Saathi
- Saathi Didi avatar
- iPad booth
- mobile/PWA
- manual command-center entry if needed

Important fields:

- `id`
- `source`
- `source_detail`
- `reported_at`
- `case_type`
- `status`
- `priority`
- `missing_person_name`
- `gender`
- `age_band`
- `state`
- `district`
- `language`
- `last_seen_location`
- `zone_name`
- `reporter_mobile`
- `physical_description`
- `raw_report`
- `structured_data`
- `private_verification_clues`
- `risk_flags`
- `assigned_to`
- `created_at`
- `updated_at`

Expected `source` values:

- `whatsapp`
- `saathi_didi_booth`
- `ipad_booth`
- `mobile_volunteer`
- `command_center`

### `volunteer_tasks`

Tasks assigned to mobile/PWA volunteers.

Important fields:

- `id`
- `case_id`
- `official_case_id`
- `title`
- `description`
- `assigned_to`
- `status`
- `priority`
- `zone_name`
- `due_at`
- `created_at`
- `updated_at`

Task status values:

- `new`
- `accepted`
- `en_route`
- `on_scene`
- `completed`
- `escalated`
- `cancelled`

The command center should create tasks. Saaheer's mobile app should receive/update them.

### `case_updates`

Timeline/status events for cases.

Important fields:

- `id`
- `case_id`
- `official_case_id`
- `update_type`
- `note`
- `actor`
- `metadata`
- `created_at`

Use this as the shared timeline across web/mobile/iPad/avatar/WhatsApp.

### `duplicate_reviews`

Candidate duplicate queue.

Important fields:

- `id`
- `primary_case_id`
- `candidate_case_id`
- `primary_source`
- `candidate_source`
- `score`
- `reasons`
- `review_status`
- `reviewer`
- `created_at`
- `updated_at`

Review statuses:

- `needs_review`
- `merged`
- `not_duplicate`

### `trust_check_reports`

Trust Check reports from WhatsApp/booth.

Important fields:

- `id`
- `source`
- `reporter_mobile`
- `raw_message`
- `extracted_phone`
- `extracted_upi_vpa`
- `extracted_payee_name`
- `extracted_amount`
- `claimed_entity_name`
- `risk_level`
- `reasons`
- `matched_verified_entity`
- `status`
- `assigned_to`
- `created_at`
- `updated_at`

Risk levels:

- `verified`
- `unverified`
- `high_concern`

Statuses:

- `open`
- `escalated`
- `closed`

Important: Trust Check is not fake-UPI detection. Display it as message/registry/report triage.

### `audit_logs`

System audit trail.

Important fields:

- `id`
- `actor`
- `action`
- `entity_type`
- `entity_id`
- `pii_accessed`
- `metadata`
- `created_at`

Use for:

- case viewed
- PII viewed
- task assigned
- status changed
- duplicate reviewed
- CCTV review requested
- Trust Check escalated

### Spatial Tables

Use these for case context:

- `zone_boundaries`
- `cctv_locations`
- `police_stations`
- `chokepoints_parking`

Do not claim CCTV footage or face recognition. This is location context only.

## Local KML Map Files

The `data/` folder also has KML files:

- `data/CCTV Dataset.kml`
- `data/Police Stations.kml`
- `data/nashik_kumbh_chokepoints_parking_map.kml`

Use these for map overlays and richer spatial context.

Recommended use:

- Use the generated GeoJSON files in `public/maps/`.
- Use `CCTV Dataset.kml` as the camera point layer.
- Use `Police Stations.kml` as the police point layer.
- Use `nashik_kumbh_chokepoints_parking_map.kml` as the chokepoint/parking layer.
- The chokepoint KML descriptions include richer context than the CSV, including category, risk level, source, and notes. Parse/display those details if useful.

Generated KML-derived layers:

- `public/maps/cctv.geojson`
- `public/maps/police.geojson`
- `public/maps/chokepoints.geojson`

Generated CSV-backed exact-count layers:

- `public/maps/cctv-official.geojson`, exactly 1,280 camera points
- `public/maps/police-official.geojson`, exactly 14 police stations
- `public/maps/chokepoints-official.geojson`, exactly 85 points

Use `cctv-official.geojson` when you want the map layer to match the official 1,280 camera count exactly. The KML-derived `cctv.geojson` has additional KML features and should be treated as a richer overlay, not the official count source.

Supabase enrichment:

`chokepoints_parking` now has KML-enriched fields:

- `risk_level`
- `project_status`
- `source_url`
- `note`
- `kml_description`

`nearest_chokepoints(...)` now returns those fields.

Important:

- KML is still only map/location data.
- Do not claim CCTV footage, face recognition, or automated video analysis.
- Supabase CSV tables remain the shared backend source for search/tasks/live sync.
- KML can be used client-side for visualization, or converted/imported later if needed.

## RPC Functions To Use

### `command_center_stats()`

Returns dashboard counts.

Use on first load and refresh after important events.

Example:

```ts
const { data, error } = await supabase.rpc("command_center_stats");
```

Returns keys including:

- `official_total`
- `official_reunited`
- `official_pending`
- `official_hospital`
- `official_unresolved`
- `official_duplicates`
- `official_no_name`
- `official_no_mobile`
- `official_children`
- `official_elderly`
- `live_open`
- `volunteer_open_tasks`
- `trust_high_concern`
- `zones`
- `cameras`
- `police_stations`
- `chokepoints_parking`

### `search_official_cases(q, max_rows)`

Use for cross-center search.

```ts
const { data, error } = await supabase.rpc("search_official_cases", {
  q: searchText,
  max_rows: 50,
});
```

Returns:

- case fields
- `masked_mobile`
- `risk_flags`
- `rank_score`

### `vulnerable_official_cases(max_rows)`

Use for high-priority official cases.

```ts
const { data, error } = await supabase.rpc("vulnerable_official_cases", {
  max_rows: 100,
});
```

### `zone_spatial_summary()`

Use for zone summary and coverage.

```ts
const { data, error } = await supabase.rpc("zone_spatial_summary");
```

Returns:

- `zone_name`
- `centroid_lat`
- `centroid_lng`
- `camera_count`
- `live_case_count`
- `critical_live_case_count`
- `open_task_count`

### `nearest_police(lat, lng, max_rows)`

Use for selected case spatial context.

```ts
const { data, error } = await supabase.rpc("nearest_police", {
  lat,
  lng,
  max_rows: 3,
});
```

### `nearest_cctv(lat, lng, max_rows)`

Use for selected case spatial context.

```ts
const { data, error } = await supabase.rpc("nearest_cctv", {
  lat,
  lng,
  max_rows: 8,
});
```

### `nearest_chokepoints(lat, lng, max_rows)`

Use for selected case spatial context.

```ts
const { data, error } = await supabase.rpc("nearest_chokepoints", {
  lat,
  lng,
  max_rows: 5,
});
```

Returned rows include:

- `location_name`
- `category`
- `risk_level`
- `project_status`
- `source_url`
- `note`
- `latitude`
- `longitude`
- `distance_km`

### `create_audit_log(...)`

Use whenever command-center actions happen.

```ts
await supabase.rpc("create_audit_log", {
  p_actor: "command_center",
  p_action: "assigned_volunteer_task",
  p_entity_type: "volunteer_task",
  p_entity_id: taskId,
  p_pii_accessed: false,
  p_metadata: { case_id: caseId },
});
```

### `request_manual_cctv_review(...)`

Use this when an operator requests manual review of a nearby camera location.

```ts
const { data: requestId, error } = await supabase.rpc("request_manual_cctv_review", {
  p_camera_id: "Z1-C1",
  p_requested_by: "command_center",
  p_case_id: liveCaseId ?? null,
  p_official_case_id: officialCaseId ?? null,
  p_note: "Manual CCTV location review requested. No automated footage analysis claimed.",
});
```

This inserts into `cctv_review_requests` and writes an audit log.

## Realtime Sync Requirements

Subscribe to these tables:

- `live_cases`
- `volunteer_tasks`
- `case_updates`
- `trust_check_reports`
- `audit_logs`

Example:

```ts
const channel = supabase
  .channel("command-center-live")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "live_cases" },
    (payload) => {
      // Add/update/remove live case in local state.
      // Refresh stats if needed.
    }
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "volunteer_tasks" },
    (payload) => {
      // Add/update task state.
    }
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "case_updates" },
    (payload) => {
      // Append event to selected case timeline.
    }
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "trust_check_reports" },
    (payload) => {
      // Add/update Trust Check queue.
    }
  )
  .subscribe();
```

Cleanup on page unmount:

```ts
supabase.removeChannel(channel);
```

## Required Features

### 1. Overview Stats

Use `command_center_stats()`.

Show:

- total official records
- pending
- unresolved
- hospital transfers
- duplicates
- children
- elderly
- no name
- no mobile
- live open cases
- open volunteer tasks
- high-concern Trust Check reports
- zones
- cameras
- police stations
- chokepoints/parking

### 2. Cross-Center Search

Use `search_official_cases(q, max_rows)`.

Must support:

- free-text search
- result list/table
- click result to open details
- show reporting center
- show status
- show risk flags
- show masked mobile

Purpose:

Prove that one center can find cases from all other centers.

### 3. Official Case Detail

When an official case is selected:

- display full non-sensitive record
- show masked phone
- show risk flags
- show duplicate status
- show physical description and remarks
- allow task creation for this official case
- allow CCTV manual review request if spatial context is available
- write audit log when opened

### 4. Live Cases Queue

Read from `live_cases`.

Must show cases created by:

- WhatsApp
- Saathi Didi
- iPad booth
- mobile volunteer
- command center

This is the key integration point with Saaheer's work.

When a new row appears via realtime:

- show it without page refresh
- refresh stats
- optionally create visual alert state in local UI

### 5. Assign Volunteer Task

From official case or live case, insert into `volunteer_tasks`.

For live case:

```ts
await supabase.from("volunteer_tasks").insert({
  case_id: liveCaseId,
  title,
  description,
  assigned_to,
  priority,
  zone_name,
});
```

For official case:

```ts
await supabase.from("volunteer_tasks").insert({
  official_case_id: officialCaseId,
  title,
  description,
  assigned_to,
  priority,
  zone_name,
});
```

Then write:

- `case_updates` row
- `audit_logs` row via `create_audit_log`

Mobile app will subscribe to `volunteer_tasks`.

### 6. Task Status Monitor

Read `volunteer_tasks`.

Must update live when Saaheer's mobile app changes:

- `new`
- `accepted`
- `en_route`
- `on_scene`
- `completed`
- `escalated`
- `cancelled`

When task changes, show latest status and timeline.

### 7. Duplicate Review Queue

Read `duplicate_reviews`.

For each row:

- fetch/display primary and candidate case IDs
- show score
- show reasons
- allow status update:
  - `merged`
  - `not_duplicate`
  - `needs_review`

On status update:

- update `duplicate_reviews`
- insert `case_updates` if relevant
- create audit log

### 8. Vulnerable Cases Queue

Use `vulnerable_official_cases(max_rows)`.

Show cases with:

- child
- elderly
- no name
- no mobile
- hospital transfer
- unresolved
- pending

Use `risk_flags` from RPC.

### 9. Zone Summary

Use `zone_spatial_summary()`.

Show:

- zone name
- camera count
- live case count
- critical live case count
- open task count

This should update when `live_cases` or `volunteer_tasks` changes.

### 10. Selected Case Spatial Context

For selected live case with `zone_name`:

1. Fetch zone centroid from `zone_boundaries`.
2. Call:
   - `nearest_police`
   - `nearest_cctv`
   - `nearest_chokepoints`

For selected official case:

- If exact coordinates are unavailable, use a best-effort location mapping:
  - match `last_seen_location` to known place names if available
  - otherwise let operator choose nearest zone manually

Important: CCTV is only camera location context.

If using map overlays, load the KML-derived layers alongside the Supabase spatial summaries. The Supabase RPCs should still be used for nearest-location calculations and shared case/task sync.

### 11. Manual CCTV Review Request

Use `request_manual_cctv_review(...)`.

The command center should:

- show nearest camera IDs from `nearest_cctv`
- let the operator request manual review for one camera
- call the RPC
- show the request in the case timeline or audit log

Do not claim automated CCTV/video analysis.

### 12. Trust Check Queue

Read from `trust_check_reports`.

Show:

- raw/extracted message fields
- risk level
- reasons
- status
- assigned person

Allow:

- mark escalated
- mark closed
- assign to help desk/police

On update:

- update `trust_check_reports`
- create audit log

Important: do not display Trust Check as fake transaction detection.

### 13. Audit Log

Read `audit_logs`.

Show recent actions:

- entity type
- action
- actor
- time
- whether PII was accessed

Write audit logs for command-center actions:

- viewed case details
- assigned task
- updated task
- reviewed duplicate
- requested CCTV review
- escalated Trust Check
- viewed PII/unmasked sensitive data

## Integration Contracts With Saaheer

### Saathi Didi / iPad / WhatsApp Creates Case

Saaheer's surfaces insert into `live_cases`.

Command center must subscribe and show the case instantly.

Expected insert shape:

```ts
await supabase.from("live_cases").insert({
  source: "saathi_didi_booth",
  source_detail: "Ramkund Booth 2",
  case_type: "missing",
  status: "open",
  priority: "critical",
  missing_person_name: null,
  gender: "Female",
  age_band: "71-80",
  state: "Bihar",
  district: "Nalanda",
  language: "Maithili",
  last_seen_location: "Ramkund Ghat",
  zone_name: "Zone Area 1",
  reporter_mobile: "+91...",
  physical_description: "green saree, tilak, confused",
  raw_report: "original messy text/transcript",
  structured_data: {
    intake_language: "Hindi",
    missing_fields: ["name", "exact last seen time"]
  },
  private_verification_clues: [
    "Ask about language spoken at home",
    "Ask about saree color"
  ],
  risk_flags: ["elderly", "no_name", "needs_private_verification"]
});
```

### Command Center Assigns Task

Web inserts into `volunteer_tasks`.

Mobile app receives via realtime.

### Mobile App Updates Task

Mobile updates `volunteer_tasks.status`.

Command center must update live.

Mobile may also insert `case_updates`.

### WhatsApp Trust Check

WhatsApp/booth inserts into `trust_check_reports`.

Command center must show it live.

Expected insert shape:

```ts
await supabase.from("trust_check_reports").insert({
  source: "whatsapp",
  reporter_mobile: "+91...",
  raw_message: "Forwarded booking/payment message",
  extracted_phone: "+91...",
  extracted_upi_vpa: "example@upi",
  extracted_payee_name: "Example Name",
  extracted_amount: 5000,
  claimed_entity_name: "Some Lodge",
  risk_level: "high_concern",
  reasons: ["urgent_advance_payment", "unverified_entity", "upi_name_mismatch"]
});
```

## Implementation Order

1. Connect Supabase client.
2. Load `command_center_stats()`.
3. Build cross-center search using `search_official_cases`.
4. Build live cases queue with realtime subscription.
5. Build volunteer task creation and task realtime monitor.
6. Build vulnerable cases queue.
7. Build duplicate review queue.
8. Build zone summary using `zone_spatial_summary()`.
9. Add selected-case spatial context RPCs.
10. Add Trust Check queue.
11. Add audit log read/write.

## Non-Negotiable Boundaries

- Do not claim CCTV footage analysis or face recognition.
- Do not claim fake UPI transaction detection.
- Do not expose database password or service-role key in frontend code.
- Use masked phone values unless explicitly showing police/admin access behavior.
- Treat AI matches and duplicate detection as review suggestions, not final truth.
