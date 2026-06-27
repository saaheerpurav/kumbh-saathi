# Ojayit iPad Booth Web App Brief

Date: 2026-06-27

Owner: Ojayit

Scope: iPad booth web app only.

Do not build WhatsApp, mobile app, command center, or PPT in this task.

## Goal

Build a dead-simple booth web app for **Kumbh Saathi** where a pilgrim or booth volunteer taps a mic button, speaks to Saathi Didi, and the app submits a structured `live_cases` row into Supabase.

This is not an always-on assistant. For the MVP:

1. User taps one big mic button.
2. User speaks one report.
3. Azure STT transcribes it.
4. OpenAI extracts intent/details and generates a short reply in the user's language.
5. App creates a live case in Supabase if it is a missing/found/help report.
6. Avatar speaks the reply.
7. Case instantly appears in command center and volunteer mobile app.

## Source Repo To Integrate

Use Saaheer's existing avatar repo:

```text
https://github.com/saaheerpurav/ai-avatar
```

The repo is currently a FastAPI + single-page browser app:

- `main.py`: FastAPI server, `/stt-ws`, `/chat`, `/ice-token`, serves `index.html`
- `index.html`: browser UI, WebRTC avatar video, mic capture, Web Audio streaming
- `requirements.txt`: FastAPI, Uvicorn, Azure Speech SDK, requests, dotenv

Keep this architecture. Do not rebuild avatar from scratch.

## Recommended Folder

Build in:

```text
kumbhsaathi/kumbhsaathi-ipad
```

Either:

- copy the avatar repo files into `kumbhsaathi-ipad`, or
- keep the repo as a source reference and recreate the same FastAPI structure inside `kumbhsaathi-ipad`.

Expected final files:

```text
kumbhsaathi-ipad/
  main.py
  index.html
  requirements.txt
  .env
  README.md
```

## Environment Variables

Use these in `kumbhsaathi-ipad/.env`:

```env
SPEECH_KEY=<azure-speech-key>
AZURE_SPEECH_KEY=<azure-speech-key>
SPEECH_REGION=eastus2
AZURE_SPEECH_ENDPOINT=https://saaheer-2797-resource.cognitiveservices.azure.com/

OPENAI_API_KEY=<openai-api-key>
OPENAI_MODEL=gpt-4o-mini

SUPABASE_URL=https://ptznwvnabmkhnahtyhjo.supabase.co
SUPABASE_ANON_KEY=<supabase-publishable-key>

BOOTH_ID=Ramkund Booth 1
BOOTH_SOURCE=saathi_didi_booth
```

Use only the Supabase anon/publishable key in this app.

## Core UX

Make the first screen the actual booth experience.

Required controls:

- large avatar video area
- one large mic button
- live transcript text
- extracted case summary after submission
- status text: idle, listening, processing, submitted, error
- reset/new report button

Do not make a landing page.

Do not add complex navigation for MVP.

Do not keep the microphone always running. It should start only when the mic button is clicked and stop when Azure returns the final transcript.

## Required User Flow

### Idle

Show avatar connected or connecting.

Button:

```text
Tap to speak
```

### Listening

When tapped:

- open `/stt-ws`
- stream mic audio to Azure STT
- show partial transcript live
- disable duplicate mic taps while recording

### Final Transcript

When Azure returns a final transcript:

- close the WebSocket
- send transcript to backend endpoint `/booth-intake`
- show "Processing..."

### Backend Intake

Backend calls OpenAI with the transcript and returns:

- short avatar reply
- detected language
- whether a case was created
- live case id if created
- extracted case fields

### Avatar Reply

Frontend sends the reply text into Azure avatar TTS, same as the current avatar repo.

### Submitted

If a case was created, show:

```text
Case submitted
Source: Saathi Didi Booth
Case type: missing/found/help
Last seen: ...
Priority: ...
```

Keep it simple. The detailed operations happen in command center and mobile app.

## OpenAI Agent Behavior

The booth agent should behave like the WhatsApp agent, but booth-facing.

It must understand multilingual, messy speech transcripts from Indian pilgrims.

Support:

- Hindi, Marathi, Gujarati, Bengali, Odia, Punjabi
- Tamil, Telugu, Kannada, Malayalam
- Urdu
- English
- Hinglish and romanized Indian languages
- broken speech, panic, partial sentences, rural phrasing

Allowed intents:

- `missing_person`
- `found_person`
- `help`
- `trust_check`
- `nearest_police`
- `unclear`

For MVP, only create `live_cases` for:

- `missing_person`
- `found_person`
- urgent `help`

Do not expose official missing-person search results to the booth user.

Do not expose CCTV locations to the booth user.

Do not claim face recognition, CCTV analysis, or fake UPI detection.

## OpenAI Prompt Requirements

Use a strong system prompt similar to WhatsApp:

```text
You are Saathi Didi, the voice/avatar intake agent for a Kumbh Mela help booth.

You speak to Indian pilgrims, many of whom may be elderly, rural, stressed, low-literacy, multilingual, or speaking in broken phrases.

Your job is to understand one spoken transcript and create a structured JSON intake result.

Reply in the same language/script/style as the user.

If someone is missing, found, separated, injured, unconscious, drowning, dead, confused, abandoned, elderly, or a child, classify correctly and create a case.

Ask at most one follow-up question only if last seen location is missing.

Do not ask for state/district. This is Nashik Kumbh.

Do not include database details, case IDs, flags, or internal operational text in the spoken reply.

Return only valid JSON.
```

Required JSON shape:

```json
{
  "intent": "missing_person|found_person|help|trust_check|nearest_police|unclear",
  "confidence": 0.0,
  "should_create_case": true,
  "reply_language": "English or Hindi Devanagari or Hinglish Roman etc.",
  "spoken_reply": "short user-facing reply in same language",
  "case": {
    "case_type": "missing|found",
    "priority": "low|medium|high|critical",
    "missing_person_name": null,
    "gender": "Male|Female|Unknown|null",
    "age_band": "0-12|13-17|18-40|41-60|61-70|71-80|80+|null",
    "language": null,
    "last_seen_location": null,
    "physical_description": null,
    "risk_flags": [],
    "missing_fields": []
  }
}
```

## Supabase Insert Contract

When `should_create_case` is true, insert into `live_cases`.

Use this shape:

```py
payload = {
    "source": os.getenv("BOOTH_SOURCE", "saathi_didi_booth"),
    "source_detail": os.getenv("BOOTH_ID", "iPad Booth"),
    "case_type": extracted["case"]["case_type"],
    "status": "open",
    "priority": extracted["case"]["priority"] or "medium",
    "missing_person_name": extracted["case"]["missing_person_name"],
    "gender": extracted["case"]["gender"] or "Unknown",
    "age_band": extracted["case"]["age_band"],
    "state": None,
    "district": None,
    "language": extracted["case"]["language"] or extracted["reply_language"],
    "last_seen_location": extracted["case"]["last_seen_location"],
    "zone_name": None,
    "reporter_mobile": None,
    "physical_description": extracted["case"]["physical_description"] or transcript,
    "raw_report": transcript,
    "structured_data": {
        "openai_extracted": True,
        "intake_channel": "avatar_booth",
        "reply_language": extracted["reply_language"],
        "missing_fields": extracted["case"]["missing_fields"],
        "booth_id": os.getenv("BOOTH_ID", "iPad Booth")
    },
    "private_verification_clues": [],
    "risk_flags": extracted["case"]["risk_flags"] or []
}
```

After insert, also insert into `case_updates`:

```py
{
    "case_id": live_case_id,
    "update_type": "created_from_saathi_didi_booth",
    "note": "Case created from Saathi Didi booth avatar.",
    "actor": os.getenv("BOOTH_ID", "iPad Booth"),
    "metadata": {
        "source": "saathi_didi_booth"
    }
}
```

Also call `create_audit_log` RPC:

```py
{
    "p_actor": os.getenv("BOOTH_ID", "iPad Booth"),
    "p_action": "created_live_case_from_avatar_booth",
    "p_entity_type": "live_case",
    "p_entity_id": live_case_id,
    "p_pii_accessed": False,
    "p_metadata": {
        "source": "saathi_didi_booth"
    }
}
```

## Supabase REST Helper

Fastest implementation: use Supabase REST from Python `requests`.

Headers:

```py
headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}
```

Insert:

```py
requests.post(
    f"{SUPABASE_URL}/rest/v1/live_cases",
    headers=headers,
    json=payload,
    timeout=15
)
```

RPC:

```py
requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/create_audit_log",
    headers=headers,
    json=rpc_payload,
    timeout=15
)
```

## Backend Endpoints

Keep existing avatar endpoints:

- `GET /`
- `GET /ice-token`
- `WS /stt-ws`

Replace or extend `/chat` with:

### `POST /booth-intake`

Request:

```json
{
  "transcript": "mera beta ramkund ghat ke paas kho gaya"
}
```

Response:

```json
{
  "reply": "Report mil gaya. Help desk check karega.",
  "intent": "missing_person",
  "case_created": true,
  "live_case_id": "uuid",
  "extracted": {
    "case_type": "missing",
    "priority": "high",
    "last_seen_location": "ramkund ghat ke paas",
    "risk_flags": []
  }
}
```

## Frontend Integration

Use the existing `index.html` avatar code.

Change the final transcript handling:

Current avatar repo sends final transcript to `/chat`.

Change it to send final transcript to `/booth-intake`.

Pseudo-flow:

```js
socket.onmessage = async (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "partial") {
    transcriptEl.textContent = msg.text;
  }

  if (msg.type === "final") {
    socket.close();
    transcriptEl.textContent = msg.text;
    statusEl.textContent = "Processing...";

    const response = await fetch("/booth-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: msg.text })
    });

    const result = await response.json();
    statusEl.textContent = result.case_created ? "Case submitted" : "Done";
    summaryEl.textContent = buildSummary(result);

    await speakWithAvatar(result.reply);
  }
};
```

Do not keep conversation state for MVP. Every mic click is one intake attempt.

## Realtime Sync Expectations

Once the booth inserts a row into `live_cases`:

- command center should show it live
- mobile app Tasks tab should show it as a live case
- source should display as Booth or Saathi Didi Booth

Set:

```text
source = saathi_didi_booth
source_detail = BOOTH_ID
```

If the mobile app source label does not recognize `saathi_didi_booth`, either:

- update mobile label mapping later, or
- use `source = booth` for demo simplicity

Preferred source:

```text
saathi_didi_booth
```

## Priority Rules

Use these simple rules from the extraction result:

- child or age band `0-12` / `13-17`: `critical`
- drowning, dead, injured, unconscious, accident, hospital: `critical`
- elderly `61-70`, `71-80`, `80+`: `high`
- missing without danger: `medium`
- found person safe with volunteer: `medium`
- generic unclear help: do not create case unless location/details imply real danger

Risk flags:

- `child`
- `elderly`
- `possible_death_or_medical_emergency`
- `no_name`
- `no_mobile`
- `avatar_booth_intake`

Always include:

```text
avatar_booth_intake
```

## Follow-Up Behavior

For MVP, avoid complex multi-turn state.

If transcript is missing last seen location:

- avatar asks one short question in same language
- do not insert yet unless it is an emergency
- show status "Need location"

If transcript has location:

- insert immediately
- avatar says report submitted

If emergency but no location:

- insert anyway with priority `critical`
- set `last_seen_location = "Booth location not specified"`
- command center can triage it

## What Not To Build Now

Do not build:

- login/auth
- always-on listening
- complex multi-turn memory
- official case search inside booth
- CCTV search inside booth
- police station lookup inside booth
- volunteer task assignment inside booth
- full admin dashboard
- payment/scam verification

Those belong to WhatsApp, mobile, or command center.

## Install And Run

From:

```powershell
cd "C:\Users\saahe\Desktop\Programming\Stuff\Hackathon 20\kumbhsaathi\kumbhsaathi-ipad"
```

Install:

```powershell
pip install -r requirements.txt
```

Run:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open:

```text
http://localhost:8000
```

For iPad on same Wi-Fi, open:

```text
http://<laptop-local-ip>:8000
```

If browser blocks mic on HTTP, use localhost for local testing or expose HTTPS with a tunnel.

## Acceptance Test

Test 1:

Speak:

```text
mera beta ramkund ghat ke paas kho gaya
```

Expected:

- transcript appears
- avatar replies in Hinglish/Roman Hindi
- `live_cases` row created
- `source = saathi_didi_booth`
- `last_seen_location` contains Ramkund ghat
- mobile app Tasks tab shows the live case
- command center Live Cases queue shows it

Test 2:

Speak:

```text
my child fell near the river
```

Expected:

- priority `critical`
- risk flags include `child` and/or `possible_death_or_medical_emergency`
- live case appears in mobile/command center

Test 3:

Speak:

```text
hello
```

Expected:

- no case created
- avatar asks how it can help or asks for missing/found details

## Final Demo Story

The iPad booth proves the organiser-assisted channel:

```text
Villager speaks naturally to Saathi Didi at a help booth.
Saathi Didi understands the language, extracts the report, creates a live case, and speaks back simply.
The same case instantly appears for command center operators and field volunteers.
```

This completes the system story:

- WhatsApp for villagers outside booths
- Saathi Didi iPad booth for in-person assisted intake
- mobile app for volunteers
- command center for organisers
