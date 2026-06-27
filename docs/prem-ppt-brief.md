# Prem PPT Brief

Date: 2026-06-27

Owner: Prem

Scope: presentation deck only.

Maximum: **10 slides**.

Important writing rule: **do not use em dashes anywhere**. Use commas, colons, or short sentences instead.

## Deck Goal

The PPT should make judges understand three things quickly:

1. Kumbh has a real missing-person operations failure.
2. Kumbh Saathi solves it with a deployable multi-surface system.
3. The system uses the official dataset, works for villagers, and protects sensitive data.

Keep slides visual. Use short bullets. Do not write paragraphs.

## Design Language

Tone:

- official
- calm
- trustworthy
- civic-tech
- Indian public-service context

Visual style:

- use map screenshots, dashboard screenshots, WhatsApp mockups, booth/avatar screenshots
- use real dataset numbers as big callouts
- avoid clutter
- avoid decorative startup-style gradients
- avoid too much text
- use simple icon labels for WhatsApp, booth, volunteer, command center, police, privacy

Color direction:

- saffron or warm accent for Kumbh identity
- deep blue/navy for command center and trust
- white/light background for readability
- red/amber only for risk/alerts
- green only for resolved/safe

Typography:

- large slide titles
- short bullets
- no tiny text
- no long screenshots with unreadable labels

Each slide should be understandable in 5 to 8 seconds.

## Slide Structure

### Slide 1: Title

Title:

**Kumbh Saathi**

Subtitle:

**WhatsApp-first missing-person operations for Kumbh Mela 2027**

Visual:

- Nashik/Kumbh crowd or map image
- small row of interface icons: WhatsApp, booth, mobile, command center

Minimal text:

- Cross-center search
- Vulnerable pilgrim care
- Privacy-safe coordination

### Slide 2: The Failure

Title:

**The Real Failure: Centers Cannot See Each Other**

Key message:

At Kumbh scale, a found person at Center A may be invisible to a family searching at Center B.

Visual:

- simple diagram:
  - Center A has found person
  - Center B has searching family
  - disconnected records

Bullets:

- 80M+ pilgrims
- elderly and children are most vulnerable
- reports are messy, multilingual, incomplete
- network and crowd pressure make manual coordination fail

### Slide 3: Official Dataset We Use

Title:

**Built Around the Organizer Dataset**

Visual:

- data cards
- maybe small table or icons

Big numbers:

- 2,500 missing-person records
- 1,280 CCTV locations
- 32 zones
- 14 police stations
- 85 chokepoints and parking points

Small note:

Synthetic missing-person data, no real personal data.

### Slide 4: Product Overview

Title:

**One Shared Operations System**

Visual:

- hub-and-spoke diagram
  - Kumbh Saathi backend in center
  - WhatsApp
  - Saathi Didi booth
  - volunteer mobile PWA
  - web command center

Bullets:

- WhatsApp for families
- Saathi Didi for no-phone users
- mobile workflow for volunteers
- command center for officials
- one shared live database

### Slide 5: WhatsApp and Saathi Didi UX

Title:

**Designed for Villagers, Elderly Users, and No-Phone Pilgrims**

Visual:

- WhatsApp chat mockup
- avatar/booth screenshot or mockup

Bullets:

- voice notes, photos, location
- one question at a time
- Hindi, Marathi, Bhojpuri, English
- booth mode for people without smartphones
- simple status updates to families

### Slide 6: Command Center

Title:

**Cross-Center Search and Live Triage**

Visual:

- command center screenshot/mockup

Bullets:

- search all centers together
- duplicate review queue
- vulnerable cases queue
- live cases from WhatsApp and booth
- volunteer task status updates

Big callout:

**Closes the Center A vs Center B gap**

### Slide 7: Spatial Intelligence

Title:

**Zones, CCTV Locations, Police, and Chokepoints**

Visual:

- map layer screenshot/mockup
- zone heatmap
- CCTV/police/chokepoint icons

Bullets:

- nearest police station
- nearest camera locations
- chokepoint risk context
- zone overload alerts
- manual CCTV review requests

Important small note:

Camera locations only, no footage or face recognition.

### Slide 8: Safety and Responsible Data

Title:

**Built for Vulnerable People and Sensitive Data**

Visual:

- privacy shield / checklist / role-access diagram

Bullets:

- child and elderly cases require human signoff
- public announcements hide private clues
- phone numbers masked by default
- role-based access
- audit log for every action
- delete or anonymize after closure

Strong line:

**Kumbh Saathi protects the people no one is safely searching for.**

### Slide 9: Trust Check

Title:

**Trust Check for Suspicious Booking Messages**

Visual:

- WhatsApp forwarded message mockup
- risk result card
- command-center escalation card

Bullets:

- checks forwarded messages, screenshots, QR/UPI links
- extracts phone, UPI ID, amount, claimed hotel
- compares against verified lists and repeated reports
- flags unverified or high-concern cases
- routes to official help

Important small note:

Not bank verification. Not fake transaction detection.

### Slide 10: Closing

Title:

**Deployable at Kumbh, Reusable Beyond Kumbh**

Visual:

- final architecture/demo flow graphic

Bullets:

- uses official data
- works through familiar channels
- syncs live across teams and devices
- handles messy and offline field reality
- protects PII by design

Final line:

**Not just lost and found. Safe reunion, care, and trust at Kumbh scale.**

## Must Include

- name: Kumbh Saathi
- official dataset numbers
- WhatsApp-first UX
- Saathi Didi booth
- web command center
- volunteer mobile/PWA
- cross-center search
- duplicate detection
- spatial data usage
- privacy/responsible data
- line: "Kumbh Saathi protects the people no one is safely searching for."

## Must Not Include

- em dashes
- fake CCTV footage analysis
- face recognition claims
- fake UPI transaction detection claims
- Apple Watch app
- too much text
- long paragraphs
- claims that AI alone approves handover

## Suggested File Name

`Kumbh-Saathi-Pitch-Deck.pptx`
