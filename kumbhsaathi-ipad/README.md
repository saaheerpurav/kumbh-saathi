# Kumbh Saathi — iPad Booth App

Saathi Didi voice intake booth for Kumbh Mela help desks.

## Setup

```powershell
cd "C:\Users\Admin\Desktop\claude hack\kumbhsaathi-ipad"
pip install -r requirements.txt
```

## Run

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open: http://localhost:8000

For iPad on same Wi-Fi: http://<laptop-local-ip>:8000

## Flow

1. Tap the orange mic button
2. Speak in any Indian language or English
3. Azure STT transcribes, OpenAI extracts intent
4. If a missing/found/help case → inserted into Supabase live_cases
5. Avatar speaks the reply
6. Case appears instantly in command center and mobile app

## Env vars

See `.env` — Azure Speech, OpenAI, Supabase anon key only.
