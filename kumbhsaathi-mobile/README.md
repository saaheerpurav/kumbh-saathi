# Kumbh Saathi Mobile

Owner: Saaheer

Expo MVP app for Kumbh Saathi.

## MVP Features

- Sends "Need Help Now" as a critical SOS with current GPS location.
- Creates mobile-origin missing-person reports using optional name, age, gender, last-seen text, report details, and current GPS location.
- Creates a matching `volunteer_tasks` row so the command center and field teams see the alert/report.
- Reports a person found only from a selected task/case, then writes a `case_updates` event with GPS metadata.
- Sends suspicious accommodation, booking, or payment messages to `trust_check_reports`.
- Reads volunteer tasks from Supabase `volunteer_tasks`.
- Also reads open `live_cases` directly, so WhatsApp and iPad booth cases appear even if no volunteer task exists yet.
- Shows linked `live_cases` context where available.
- Shows source, source detail, raw report/message, last-seen location, and reporter fields for live cases.
- Does not collect state/district in mobile because the deployment context is Nashik Kumbh. Zone should be derived later from GPS/KML boundaries, not manually entered.
- Subscribes to live task and case-update changes.
- Updates task status:
  - `new`
  - `accepted`
  - `en_route`
  - `on_scene`
  - `completed`
  - `escalated`
- Writes `case_updates` and `audit_logs` when task status changes.
- Demo mode works without Supabase anon key.

## Setup

```bash
npm install
copy .env.example .env
```

Fill:

```env
EXPO_PUBLIC_SUPABASE_URL=https://ptznwvnabmkhnahtyhjo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_VOLUNTEER_NAME=Saaheer
```

Only use the Supabase anon key here. Never use the DB connection string or service role key in Expo.

## Run

```bash
npm run start
```

Then open with Expo Go or run web:

```bash
npm run web
```
