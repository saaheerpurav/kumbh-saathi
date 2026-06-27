# Kumbh Saathi

Kumbh Saathi is a real-time missing-person response system for the Nashik Kumbh Mela. It is built for a setting where tens of millions of pilgrims may arrive, many of them elderly, multilingual, low-literacy, travelling without smartphones, and unfamiliar with complex apps.

Our core idea is simple:

> Protect the people no one is safely searching for: the abandoned elder, the unclaimed child, the person who cannot describe where they are.

## The Problem

At Kumbh scale, missing-person response fails for practical reasons:

- People report cases through different help desks, police points, volunteers, family members, and informal channels.
- Reports are messy, incomplete, emotional, duplicated, and multilingual.
- Elderly pilgrims and children often cannot provide names, phone numbers, or exact locations.
- Villagers may know WhatsApp, but not a new crisis app.
- Volunteers need actionable field tasks, not a giant spreadsheet.
- Organisers need spatial awareness across zones, CCTV coverage points, police stations, chokepoints, and live reports.
- Sensitive data must not be exposed to the public.

Kumbh Saathi turns this into one connected operating system.

## What Makes It Novel

### 1. WhatsApp-first intake for the masses

Most hackathon solutions assume users will install and learn a mobile app. Kumbh Saathi does not.

Villagers can use WhatsApp, which they already understand. They can type messy messages like:

```text
mera beta ramkund ghat ke paas kho gaya
```

The bot detects the language, extracts a missing-person case, asks at most one follow-up, and creates a live report. It also supports useful public actions like nearest police location sharing through an actual WhatsApp location pin.

### 2. Saathi Didi voice booth

For people who cannot type, the iPad booth provides a live avatar intake flow. A pilgrim taps the mic, speaks naturally, and Saathi Didi uses Azure Speech and OpenAI to create a structured live case.

This gives organisers an assisted intake channel for elderly pilgrims, rural visitors, and people who are overwhelmed in a crowd.

### 3. One shared live backend

WhatsApp, iPad booth, mobile app, and command center all sync through Supabase.

A case created from WhatsApp or the booth appears immediately in:

- command center
- volunteer app
- live case queue
- audit timeline

### 4. Volunteer field app

Volunteers do not need the full command center. They need live tasks, location context, search, and quick field updates.

The Expo mobile app shows:

- live cases from WhatsApp and booth
- volunteer tasks
- maps when GPS is available
- missing report submission
- emergency SOS
- official case search
- call reporter button when a number is available
- mark found with current location

### 5. Dataset-aware command center

The web command center uses the official data layers where they belong: inside organiser operations, not public WhatsApp.

It uses:

- official missing-person records
- CCTV location coverage
- police stations
- chokepoints and parking points
- zone boundaries
- spatial RPC functions for nearest context

It does not claim automated CCTV analysis or face recognition. CCTV is treated as operational location coverage for manual review.

## System Components

### WhatsApp Bot

Folder:

```text
kumbhsaathi-whatsapp
```

Features:

- Twilio WhatsApp webhook
- multilingual OpenAI intake
- missing and found person reporting
- urgent help flow
- WhatsApp location handling
- nearest police station as actual WhatsApp location pin
- Supabase live case sync
- public-safe CCTV and case-search boundaries

### Mobile Volunteer App

Folder:

```text
kumbhsaathi-mobile
```

Features:

- Expo React Native app
- Help and Tasks tabs
- live case feed
- volunteer task updates
- map for live case coordinates
- report missing with GPS
- emergency alert with GPS
- official case search
- hide reunited toggle
- call reporter from official records
- mark case found at current location

### iPad Booth Avatar

Folder:

```text
kumbhsaathi-ipad
```

Features:

- FastAPI backend
- Azure Speech avatar frontend
- speech-to-text WebSocket
- OpenAI booth intake extraction
- Supabase live case creation
- same shared backend as WhatsApp and mobile

### Web Command Center

Folder:

```text
kumbhsaathi-command-center
```

Features:

- Next.js command center
- official case search
- live case queue
- vulnerable case queue
- spatial command map
- CCTV, police, chokepoint, and zone overlays
- volunteer task monitor
- case detail and spatial context
- audit and operational panels

### Shared Data And Backend

Folder:

```text
kumbhsaathi-shared
```

Includes:

- Supabase schema
- seed scripts
- official CSV files
- KML files
- generated GeoJSON map layers
- spatial processing scripts

## Official Dataset Usage

Kumbh Saathi uses the provided data in realistic places:

- 2,500 messy missing-person reports power official search, vulnerable queues, status metrics, and case context.
- 1,280 CCTV locations power command center coverage maps and nearest-camera context for operators.
- 32 zone boundaries support spatial summaries and zone-level operations.
- Police station data powers both command center context and WhatsApp nearest police location.
- Chokepoint and parking data help operators understand crowd bottlenecks around a live case.

The public WhatsApp bot does not expose official missing-person records or CCTV locations.

## Responsible Data Design

Kumbh Saathi separates public, volunteer, and organiser capabilities.

Public WhatsApp users can:

- report missing or found people
- request help
- receive nearest police location

Volunteers can:

- see assigned and live field cases
- search official records for operational help
- call a reporter when the official record includes a usable number
- update case status from the field

Organisers can:

- search official records
- view spatial coverage
- inspect vulnerable queues
- assign tasks
- review audit logs

Boundaries:

- no public browsing of missing-person records
- no public CCTV locations
- no automated face recognition claim
- no fake UPI detection claim
- sensitive search remains inside volunteer and organiser tools

## Architecture

```text
WhatsApp Bot       \
Saathi Didi Booth   \
Mobile App           -> Supabase -> Command Center
Command Center      /
```

Primary tables:

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

1. Send a WhatsApp report:

```text
my child is lost
```

2. Bot asks only for last seen location.

3. Reply:

```text
near ramkund ghat
```

4. Case appears in the volunteer app and command center.

5. Search official records in the volunteer app.

6. Ask WhatsApp:

```text
nearest police station
```

7. Share WhatsApp location and receive a real police station location pin.

8. Create another case through the Saathi Didi iPad booth.

9. Mark a case found from the volunteer app.

## Local Setup

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

Local `.env` files are intentionally not committed. Use the `.env.example` files inside each subproject.

Do not commit:

- database passwords
- service role keys
- OpenAI keys
- Azure Speech keys
- Twilio auth tokens

## Judging Criteria Fit

### Deployability

The system is split into practical surfaces: WhatsApp webhook, web command center, Expo volunteer app, and FastAPI booth app. Each part can run independently and sync through Supabase.

### Real-world fit

It solves actual Kumbh failure modes: messy reports, duplicate channels, missing elders, unclaimed children, crowd zones, manual CCTV coverage, and field volunteer coordination.

### UX for elderly and multilingual users

Users can speak to Saathi Didi or message WhatsApp in natural language. They do not need to learn a new app.

### System design

Static official datasets, live reports, spatial data, volunteer tasks, and audit logs are separated but connected through a shared backend.

### Responsible data

Public channels stay simple and safe. Sensitive case search, CCTV context, and audit views stay inside operator and volunteer tools.

## Team

- Saaheer: WhatsApp bot, volunteer mobile app, iPad booth integration, deployment.
- Ojayit: command center website and iPad booth frontend integration.
- Prem: presentation and pitch materials.
