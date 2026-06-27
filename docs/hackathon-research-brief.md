# Kumbh Saathi Research & Product Brief

Date: 2026-06-27

## Core Thesis

**Kumbh Saathi** is a WhatsApp-first, booth-assisted, cross-center missing-person system for Kumbh Mela 2027.

It solves the real failure described in the official dataset README: lost-and-found centers do not cross-search each other. A found person registered at Center A can be invisible to a family searching at Center B. Kumbh Saathi closes that gap using a unified searchable registry, messy-report cleanup, duplicate detection, spatial triage, volunteer workflows, and privacy-safe handover.

The additional trust/safety angle is **Trust Check**: a realistic accommodation/payment-message triage tool. It does not claim to detect fake UPI transactions. It checks messages, screenshots, QR/UPI links, and booking claims against available verified lists and repeated reports, then routes suspicious cases to official help.

## Judging Criteria Fit

- **Deployability:** web/PWA surfaces for command centers, booths, volunteers, and WhatsApp. No exotic hardware required.
- **Real-world fit:** directly addresses cross-center search, duplicate reports, elderly/child vulnerability, incomplete reports, and overloaded locations.
- **UX:** WhatsApp for villagers/families, Saathi Didi avatar for booth users, large-button iPad flow for volunteers helping no-phone users.
- **System design:** handles messy records, missing names/mobiles, duplicate reports, offline queues, and spatial triage.
- **Responsible data:** PII minimization, role-based views, private verification clues, audit logs, and deletion/anonymization after closure.

## Official Data Backbone

Use the official data package from:

`https://github.com/SumeetGDoshi/claude-impact-labs-data`

Local copied files:

- `data/Synthetic_Missing_Persons_2500.csv`
- `data/CCTV_Locations.csv`
- `data/Zone_Boundaries.csv`
- `data/Police_Stations.csv`
- `data/Chokepoints_Parking.csv`
- `data/CCTV Dataset.kml`
- `data/Police Stations.kml`
- `data/nashik_kumbh_chokepoints_parking_map.kml`

### 1. Synthetic Missing Persons

`Synthetic_Missing_Persons_2500.csv` contains 2,500 fake missing-person records.

Fields:

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

Observed counts from the file:

- 2,500 total records.
- 2,150 reunited.
- 210 pending.
- 73 transferred to hospital.
- 67 unresolved.
- 202 marked duplicate reports.
- 371 records have no name.
- 492 records have no reporter mobile.
- Largest age band: `61-70` with 697 records.

Use this for:

- command-center stats
- cross-center search
- duplicate detection
- vulnerability triage
- messy-data handling
- reporting-center comparison
- resolution-time analytics

### 2. CCTV Locations

`CCTV_Locations.csv` contains 1,280 camera coordinates.

Fields:

- `camera_id`
- `longitude`
- `latitude`

Important boundary: there is **no footage**. Use this only for:

- nearest-camera context
- camera-density coverage
- blind-spot analysis
- "request manual review from camera C123" workflow

Do not claim face recognition, live video analytics, or CCTV matching.

### 3. Zone Boundaries

`Zone_Boundaries.csv` contains 32 administrative zone centroids.

Fields:

- `zone_name`
- `centroid_lat`
- `centroid_lng`
- `approx_boundary_points`

Use this for:

- zone heatmaps
- pending/unresolved case density
- high-risk/vulnerable-case clustering
- volunteer routing context
- overload alerts

### 4. Police Stations

`Police_Stations.csv` contains 14 police station coordinates.

Use this for:

- nearest escalation point
- unsafe claimant routing
- child/vulnerable adult signoff
- Trust Check escalation

### 5. Chokepoints / Parking / Transfer Nodes

`Chokepoints_Parking.csv` contains 85 mapped mobility points:

- 26 traffic chokepoints
- 11 transfer nodes
- 3 no-vehicle pressure zones
- 30 parking points
- 10 outer parking points
- 5 parking belts

Use this for:

- separation-risk context
- crowd-pressure overlays
- "last seen near chokepoint" triage
- volunteer dispatch planning

The KML version, `nashik_kumbh_chokepoints_parking_map.kml`, has richer map descriptions than the CSV. It includes operational context such as category, project/status notes, risk level, sources, and explanatory notes. Use it to enrich the command center with high-risk/very-high-risk chokepoint context.

### 6. KML Map Layers

KML files are map-ready geospatial files used by Google Earth, QGIS, Google Maps imports, and web map conversion tools.

Provided KML files:

- `CCTV Dataset.kml`
- `Police Stations.kml`
- `nashik_kumbh_chokepoints_parking_map.kml`

Use these for:

- map overlays in the command center
- converting to GeoJSON for Leaflet/Mapbox/deck.gl if needed
- richer popup/context details for chokepoints
- Google Earth fallback/demo layer if needed

Important boundary: KML still contains location/map data, not CCTV footage. Do not claim face recognition, footage analysis, or live surveillance.

## Product Surfaces

### 1. WhatsApp Saathi

Primary citizen interface.

Why: villagers and families may not install or learn a new app during Kumbh, but they already use WhatsApp.

Realistic implementation:

- Demo as a WhatsApp-style simulator first.
- Production path: Twilio WhatsApp or Meta WhatsApp Cloud API.
- Accept text, voice transcript, photo, and shared location.
- Return case ID, follow-up questions, status updates, and nearest help guidance.

Features:

- "I lost someone"
- "I found someone"
- "Check my case"
- "Send photo/location"
- "Check booking/message" via Trust Check

### 2. Saathi Didi Avatar

Your existing AI-powered female live avatar becomes the accessibility layer.

Role:

- booth/iPad assistant for elderly, confused, low-literacy, or no-phone users
- asks one question at a time
- supports Indian languages such as Hindi, Marathi, Bhojpuri, and English
- converts conversation into structured intake fields

Important framing: Saathi Didi is the user interface, not the whole product. The backend registry, search, duplicate detection, and routing are the system.

### 3. iPad / Booth Mode

For lost-and-found centers and volunteers helping people in person.

Features:

- large buttons
- voice/text/photo intake
- missing-field prompts
- public announcement draft
- private verification clues
- claimant checklist
- print/loudspeaker-ready output

This is the fallback for pilgrims with no phone.

### 4. Volunteer Mobile PWA

For field workers and volunteers.

Realistic implementation:

- responsive web app / PWA
- offline queue with IndexedDB or localStorage
- sync when connection returns

Features:

- assigned cases
- zone context
- nearest police station
- nearest chokepoint / transfer node
- escort checklist
- status update: found, reunited, hospital, police escalation, unresolved
- masked PII by default

### 5. Web Command Center

For officials and control-room operators.

Features:

- 2,500-record dashboard
- search across all centers
- duplicate candidate queue
- vulnerability queue: child, elderly, no name, no mobile, hospital, unresolved
- 32-zone heatmap
- 1,280 CCTV point coverage view
- police station routing
- chokepoint/parking risk overlay
- Trust Check report clusters
- privacy/audit panel

## Core Features

### A. Cross-Center Search

Most important feature.

Problem: each reporting center sees only its own cases in the current failure model.

Implementation:

- Load all 2,500 records into one searchable registry.
- Search across name, gender, age band, language, state/district, last-seen location, physical description, reporting center, and remarks.
- Support fuzzy search for misspellings and vague descriptions.
- Use embeddings/semantic search if time allows; otherwise combine keyword scoring, field filters, and fuzzy matching.

Demo:

- Search from one center and find matching or relevant records from other centers.

### B. Duplicate Detection

Directly backed by the dataset: 202 records are marked `is_duplicate_report=True`.

Implementation:

- Score candidate pairs using:
  - same/similar name
  - age band
  - gender
  - language
  - state/district
  - last-seen location
  - physical description similarity
  - report time proximity
  - different reporting centers
- Show explanation for why a duplicate is suspected.

Important: do not claim perfect identity resolution. Present as "possible duplicate candidates for human review."

### C. Messy Report Cleanup

Implementation:

- Input from WhatsApp, Saathi Didi, or booth form.
- LLM converts messy multilingual report into structured fields.
- Missing critical fields become follow-up questions.

Output fields:

- name if known
- gender
- age band
- language
- origin state/district if known
- last seen
- physical description
- reporter contact if available
- risk level

### D. Vulnerability Triage

Rules:

- child: `0-12` or `13-17`
- elderly: `61-70`, `71-80`, `80+`
- high-risk missing data: no name, no mobile, vague description
- urgent status: pending, hospital transfer, unresolved

Use:

- prioritize queues
- require stronger handover checks
- escalate to police/medical/shelter

### E. Claimant Verification

Realistic framing:

- AI suggests private questions and a checklist.
- Human/police makes the final decision.
- Children, confused elderly, suspected abduction, and hospital-transfer cases require human signoff.

Implementation:

- Separate public announcement details from private verification clues.
- Generate questions from non-public details where available.
- Show verdict as "low/medium/high concern", not "AI approved identity."

### F. Spatial Triage

Use official spatial data from both CSV and KML files.

Implementation:

- Map last-seen locations to known location labels and nearest zone centroid.
- Calculate nearest police station.
- Show nearby CCTV camera count and nearest camera IDs.
- Show nearby chokepoints/parking/transfer nodes.
- Use KML layers for richer map overlays.
- Parse chokepoint KML descriptions to extract risk level/source/note if useful.
- Display zone-level pending/unresolved/vulnerable case density.

This helps officials answer:

- where are separations clustering?
- where is coverage thin?
- where should volunteers be sent?
- which police station should handle escalation?

### G. Offline-First Field Workflow

Implementation:

- Volunteer PWA stores new cases/status changes locally.
- Each offline action gets a local temporary ID.
- Sync queue sends updates when online.
- Command center shows "pending sync" state.

Demo can simulate network loss with a toggle.

### H. Trust Check

This replaces the earlier overbroad "Scam Shield" idea.

Realistic definition:

Trust Check is an accommodation/payment-message triage and reporting feature. It does **not** detect fake bank transactions. It flags unverified or suspicious claims and routes people to official help.

Where it lives:

- WhatsApp Saathi: primary user interface
- Saathi Didi booth: assisted check by volunteer
- Command center: aggregate suspicious reports and repeated entities
- Volunteer PWA: escalation tasks only

Inputs:

- forwarded WhatsApp/SMS message
- booking screenshot
- UPI QR image or UPI intent link
- phone number
- hotel/accommodation name
- payment request text

Realistic checks:

- OCR screenshot/message text.
- Decode UPI QR or UPI intent link to extract VPA/payee name/amount/note when possible.
- Extract phone numbers, domains, UPI IDs, claimed hotel names, amounts, urgency phrases.
- Compare against an official verified accommodation/vendor list if available.
- Compare against previously reported suspicious phones/UPI IDs/domains/messages.
- Flag risk patterns:
  - urgent advance-payment pressure
  - no official booking ID
  - unofficial payment handle
  - mismatched payee name
  - requests for OTP/Aadhaar/unnecessary PII
  - repeated complaints

Outputs:

- `Verified` if it matches a verified registry.
- `Unverified` if no match is found.
- `High concern, visit official help desk` if risk patterns or repeated reports exist.

Hard boundary:

- Do not say "fake transaction detected."
- Do not say "this person is a scammer."
- Do not imply bank/NPCI verification.
- Do not replace police/cybercrime investigation.

## Responsible Data / PII Plan

PII means personally identifiable information: name, mobile number, photo, address, ID, medical details, child details, and location history.

Design rules:

- collect minimum data needed
- mask phone numbers in volunteer views
- hide sensitive child details from public announcements
- keep private verification clues out of public outputs
- role-based access: volunteer < center operator < police/admin
- audit every view/change/handover
- delete or anonymize after closure
- do not put personal data on public chains
- do not claim CCTV face recognition

## What Not To Build / Claim

- No Apple Watch app. We do not have Mac hardware/signing workflow, and it is weak for rural pilgrim UX.
- No fake CCTV video analytics. We only have camera locations.
- No fake UPI transaction detection. Trust Check is message/registry/report triage.
- No fully autonomous handover approval. Human/police signoff remains final.
- No separate native apps unless time genuinely allows. Build responsive web/PWA surfaces first.

## Recommended Demo Flow

1. Open command center with official dataset stats: 2,500 records, 202 duplicates, 371 no-name cases, 492 no-mobile cases, 32 zones, 1,280 cameras.
2. Show cross-center search: a family report at one center finds relevant records filed elsewhere.
3. Open duplicate queue: show why two reports may be the same person and require human merge.
4. Select a vulnerable elderly/child case: show missing fields, risk flags, nearest police station, nearest cameras, and chokepoint context.
5. Use WhatsApp Saathi simulator: family sends a messy Hindi voice-note transcript and optional photo/location.
6. Use Saathi Didi booth mode: avatar asks follow-up questions one at a time and creates a structured case.
7. Use volunteer mobile PWA: assigned escort/handover task with offline queue.
8. Show claimant verification: private questions + mandatory police/human signoff for vulnerable cases.
9. Optional secondary module: Trust Check analyzes a suspicious accommodation/payment message, returns "unverified/high concern", and sends it to command-center escalation.
10. End with privacy panel: masked PII, private/public field separation, audit log, deletion/anonymization policy.

## Final Pitch

"Kumbh Saathi closes the cross-center missing-person gap at Kumbh scale. Families can report through WhatsApp, no-phone pilgrims can speak to Saathi Didi at help booths, volunteers get offline mobile workflows, and officials see one privacy-safe command center using the official records, zones, CCTV locations, police stations, and chokepoints. It is built for messy data, multilingual users, vulnerable people, and real deployment."

## Source Links

- Event: https://luma.com/5426n7o6
- Official data repo: https://github.com/SumeetGDoshi/claude-impact-labs-data
- Kumbhathon: https://kumbhathon.com/
- MIT Kumbhathon city-stack: https://www.media.mit.edu/projects/mit-kumbhathon/overview/
- PIB security/lost-and-found 2025: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2090956
- Economic Times lost-and-found reunions: https://economictimes.indiatimes.com/news/india/digital-lost-and-found-centres-at-maha-kumbh-help-20000-missing-people-reunite-with-kin/articleshow/118278168.cms
- Business Standard hi-tech Khoya-paya centers: https://www.business-standard.com/india-news/hi-tech-lost-and-found-centres-at-mahakumbh-to-help-trace-missing-people-124101601342_1.html
- Economic Times Nashik 2027 planning: https://economictimes.indiatimes.com/news/india/race-against-time-authorities-gear-up-for-kumbh-mela-2027-nashik-with-holistic-infrastructure-and-technology/articleshow/131550435.cms
- Original research repo: https://github.com/hashswingingslasher/kumbh-research
- Competitor: https://github.com/callmeharshh/khoya-paya
