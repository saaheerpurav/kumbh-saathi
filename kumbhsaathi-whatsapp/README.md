# Kumbh Saathi WhatsApp

Twilio-compatible WhatsApp bot plus local browser simulator.

## Responsibilities

- citizen missing-person report intake
- found-person report intake
- Trust Check message triage
- writes live reports to Supabase
- creates `live_cases`, `case_updates`, `trust_check_reports`, and `audit_logs`

## Run

CLI test without starting a server:

```bash
npm run cli -- "Meri dadi Ramkund Ghat ke paas kho gayi hai. 75 saal ki hain, green saree pehni hai, Maithili bolti hain."
```

Interactive CLI:

```bash
npm run cli
```

Server and browser simulator:

```bash
npm install
copy .env.example .env
npm run dev
```

Open:

```text
http://localhost:8787
```

Twilio webhook route:

```text
POST /webhooks/twilio/whatsapp
```

Simulator route:

```text
POST /api/whatsapp/simulate
```

## Required Env

```env
PORT=8787
DATABASE_URL=
CLI_FROM=whatsapp:+919876543210
```

`DATABASE_URL` is server-side only. Do not put it in frontend code.
