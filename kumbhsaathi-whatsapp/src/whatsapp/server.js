require("dotenv").config();

const express = require("express");
const path = require("path");
const { handleMessage } = require("./service");
const { getStats } = require("./db");

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../../public")));

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(message)}</Message></Response>`;
}

function normalizeInbound(input) {
  const latitude =
    input.Latitude ||
    input.latitude ||
    input.LocationLatitude ||
    input.locationLatitude ||
    input.WaLatitude ||
    input.waLatitude ||
    input.lat ||
    null;
  const longitude =
    input.Longitude ||
    input.longitude ||
    input.LocationLongitude ||
    input.locationLongitude ||
    input.WaLongitude ||
    input.waLongitude ||
    input.lng ||
    input.lon ||
    null;

  return {
    from: input.From || input.from || "whatsapp:+910000000000",
    body: input.Body || input.body || "",
    mediaUrl: input.MediaUrl0 || input.mediaUrl || null,
    latitude,
    longitude,
    locationLabel: input.Label || input.label || input.Address || input.address || null,
  };
}

app.get("/health", async (_req, res) => {
  try {
    const stats = await getStats();
    res.json({ ok: true, stats });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/whatsapp/simulate", async (req, res) => {
  try {
    const result = await handleMessage(normalizeInbound(req.body));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/webhooks/twilio/whatsapp", async (req, res) => {
  try {
    const result = await handleMessage(normalizeInbound(req.body));
    res.type("text/xml").send(twiml(result.reply));
  } catch (error) {
    res.type("text/xml").status(500).send(twiml(`Kumbh Saathi error: ${error.message}`));
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../public/whatsapp-simulator.html"));
});

app.listen(port, () => {
  console.log(`Kumbh Saathi WhatsApp bot running at http://localhost:${port}`);
  console.log(`Twilio webhook: http://localhost:${port}/webhooks/twilio/whatsapp`);
});
