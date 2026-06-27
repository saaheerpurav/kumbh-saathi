# Kumbh Saathi

Kumbh Saathi is a missing-person and field-response system for Kumbh Mela operations. It connects villager-friendly intake channels with organiser command tools and volunteer response workflows.

## What This Repo Contains

- `kumbhsaathi-whatsapp`: WhatsApp Saathi bot with Twilio webhook support, multilingual OpenAI intake, Supabase live case creation, WhatsApp location handling, and nearest police location sharing.
- `kumbhsaathi-mobile`: Expo React Native volunteer app for live cases, tasks, missing reports, emergency alerts, official case search, maps, and reporter calling.
- `kumbhsaathi-ipad`: Saathi Didi iPad booth web app using Azure Speech avatar, speech-to-text, OpenAI extraction, and Supabase live case submission.
- `kumbhsaathi-command-center`: Next.js web command center for official dataset search, live cases, spatial context, vulnerable queues, maps, tasks, and operations monitoring.
- `kumbhsaathi-shared`: Supabase schema, seed/data scripts, official datasets, KML-derived spatial data, and shared backend documentation.
- `docs`: teammate briefs, planning notes, PPT guidance, and implementation handoffs.

## System Flow

1. A pilgrim reports a missing or found person through WhatsApp or the Saathi Didi booth.
2. OpenAI extracts structured details from messy multilingual text or speech.
3. A `live_cases` row is created in Supabase.
4. The command center sees the case in real time.
5. The volunteer mobile app receives the case or assigned task.
6. Volunteers update status or mark a person found from the field.
7. Case updates and audit logs keep the system traceable.

## Data Sources

The system uses the organiser-provided datasets:

- 2,500 synthetic missing-person records
- 1,280 CCTV locations
- 32 zone boundaries
- police station locations
- chokepoints and parking locations

The public WhatsApp bot does not expose official case records or CCTV locations. Those datasets are used inside the command center and volunteer workflows for operational context.

## Responsible Data Boundaries

- Public WhatsApp users can report cases and request simple help.
- Official missing-person search is internal to volunteers and organisers.
- CCTV data is used only as location coverage context.
- The system does not claim face recognition, automated CCTV footage analysis, or fake UPI transaction detection.
- Sensitive details should stay inside operator and volunteer tools.

## Local Setup

Each app has its own setup.

### WhatsApp Bot

```powershell
cd kumbhsaathi-whatsapp
npm install
npm run dev
```

Default webhook:

```text
http://localhost:8787/webhooks/twilio/whatsapp
```

### Mobile Volunteer App

```powershell
cd kumbhsaathi-mobile
npm install
npm start
```

### iPad Booth

```powershell
cd kumbhsaathi-ipad
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Command Center

```powershell
cd kumbhsaathi-command-center
npm install
npm run dev
```

## Environment

Local `.env` files are intentionally not committed. Use each subproject's `.env.example` or README as the starting point.

Frontend-safe Supabase publishable keys can be used in browser and mobile apps. Do not commit database passwords or service-role keys.

## Main Backend Tables

- `live_cases`
- `volunteer_tasks`
- `case_updates`
- `official_missing_persons`
- `trust_check_reports`
- `audit_logs`
- `cctv_locations`
- `police_stations`
- `zone_boundaries`
- `chokepoints_parking`

## Demo Path

1. Send a WhatsApp missing-person report.
2. Watch the live case appear in the mobile app and command center.
3. Search official records in the mobile app or command center.
4. Ask WhatsApp for the nearest police station and share location.
5. Use the iPad booth to create a voice-based live case.
6. Mark the case found from the volunteer app.

## Team Ownership

- Saaheer: WhatsApp bot, mobile app, iPad booth integration, deployment.
- Ojayit: command center website and iPad booth web implementation.
- Prem: presentation and pitch materials.
