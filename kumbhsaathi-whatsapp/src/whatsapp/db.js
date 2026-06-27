const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required");
    }
    const connectionString = process.env.DATABASE_URL.replace(/[?&]sslmode=require\b/, "");
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function createLiveCase(report) {
  if (useRestOnly()) {
    const liveCase = await restInsert("live_cases", liveCasePayload(report));
    await recordLiveCaseCreated(liveCase, report);
    return liveCase;
  }

  const query = `
    insert into live_cases (
      source, source_detail, case_type, status, priority, missing_person_name, gender, age_band,
      state, district, language, last_seen_location, zone_name, reporter_mobile,
      physical_description, raw_report, structured_data, private_verification_clues, risk_flags
    )
    values (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14,
      $15, $16, $17::jsonb, $18::jsonb, $19::text[]
    )
    returning *
  `;
  const values = [
    report.source,
    report.source_detail,
    report.case_type,
    report.status,
    report.priority,
    report.missing_person_name,
    report.gender,
    report.age_band,
    report.state,
    report.district,
    report.language,
    report.last_seen_location,
    report.zone_name,
    report.reporter_mobile,
    report.physical_description,
    report.raw_report,
    JSON.stringify(report.structured_data || {}),
    JSON.stringify(report.private_verification_clues || []),
    report.risk_flags || [],
  ];
  try {
    const result = await getPool().query(query, values);
    const liveCase = result.rows[0];
    await recordLiveCaseCreated(liveCase, report);
    return liveCase;
  } catch (error) {
    console.warn(`Postgres create live case failed, trying Supabase REST: ${error.message}`);
    const liveCase = await restInsert("live_cases", liveCasePayload(report));
    await recordLiveCaseCreated(liveCase, report);
    return liveCase;
  }
}

async function createCaseUpdate({ caseId, officialCaseId, updateType, note, actor, metadata }) {
  const payload = {
    case_id: caseId || null,
    official_case_id: officialCaseId || null,
    update_type: updateType,
    note: note || null,
    actor: actor || null,
    metadata: metadata || {},
  };
  if (useRestOnly()) {
    return restInsert("case_updates", payload);
  }

  try {
    const result = await getPool().query(
      `
      insert into case_updates(case_id, official_case_id, update_type, note, actor, metadata)
      values ($1, $2, $3, $4, $5, $6::jsonb)
      returning *
      `,
      [payload.case_id, payload.official_case_id, payload.update_type, payload.note, payload.actor, JSON.stringify(payload.metadata)]
    );
    return result.rows[0];
  } catch (error) {
    console.warn(`Postgres case update failed, trying Supabase REST: ${error.message}`);
    return restInsert("case_updates", payload);
  }
}

async function createTrustCheck(report, reporterMobile) {
  const result = await getPool().query(
    `
    insert into trust_check_reports (
      source, reporter_mobile, raw_message, extracted_phone, extracted_upi_vpa,
      extracted_payee_name, extracted_amount, claimed_entity_name, risk_level, reasons
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[])
    returning *
    `,
    [
      report.source,
      reporterMobile || null,
      report.raw_message,
      report.extracted_phone,
      report.extracted_upi_vpa,
      report.extracted_payee_name,
      report.extracted_amount,
      report.claimed_entity_name,
      report.risk_level,
      report.reasons || [],
    ]
  );
  const trustReport = result.rows[0];
  await audit({
    actor: "whatsapp_saathi",
    action: "created_trust_check_report",
    entityType: "trust_check_report",
    entityId: trustReport.id,
    piiAccessed: false,
    metadata: { risk_level: report.risk_level, reasons: report.reasons || [] },
  });
  return trustReport;
}

async function updateLiveCaseLocation(caseId, location, zoneName) {
  let liveCase;
  if (useRestOnly()) {
    const current = await restSelectOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`);
    liveCase = await restUpdateOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`, {
      last_seen_location: location,
      ...(zoneName ? { zone_name: zoneName } : {}),
      structured_data: {
        ...(current?.structured_data || {}),
        missing_fields: [],
      },
    });
  } else {
  try {
    const result = await getPool().query(
      `
      update live_cases
      set
        last_seen_location = $2,
        zone_name = coalesce($3, zone_name),
        structured_data = jsonb_set(
          coalesce(structured_data, '{}'::jsonb),
          '{missing_fields}',
          '[]'::jsonb,
          true
        )
      where id = $1
      returning *
      `,
      [caseId, location, zoneName || null]
    );
    liveCase = result.rows[0];
  } catch (error) {
    console.warn(`Postgres update live case location failed, trying Supabase REST: ${error.message}`);
    const current = await restSelectOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`);
    liveCase = await restUpdateOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`, {
      last_seen_location: location,
      ...(zoneName ? { zone_name: zoneName } : {}),
      structured_data: {
        ...(current?.structured_data || {}),
        missing_fields: [],
      },
    });
  }
  }
  if (liveCase) {
    await createCaseUpdate({
      caseId,
      updateType: "location_added_from_whatsapp",
      note: `Last seen location updated: ${location}`,
      actor: "whatsapp_saathi",
      metadata: { last_seen_location: location, zone_name: zoneName || null },
    });
    await audit({
      actor: "whatsapp_saathi",
      action: "updated_live_case_location",
      entityType: "live_case",
      entityId: caseId,
      piiAccessed: false,
      metadata: { last_seen_location: location, zone_name: zoneName || null },
    });
  }
  return liveCase;
}

async function updateLiveCaseCoordinates(caseId, latitude, longitude) {
  let liveCase;
  if (useRestOnly()) {
    const current = await restSelectOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`);
    liveCase = await restUpdateOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`, {
      last_seen_location: current?.last_seen_location || "WhatsApp shared location",
      structured_data: {
        ...(current?.structured_data || {}),
        latitude,
        longitude,
        missing_fields: [],
      },
    });
  } else {
  try {
    const result = await getPool().query(
      `
      update live_cases
      set
        last_seen_location = coalesce(last_seen_location, 'WhatsApp shared location'),
        structured_data = coalesce(structured_data, '{}'::jsonb)
          || jsonb_build_object(
            'latitude', $2::double precision,
            'longitude', $3::double precision,
            'missing_fields', '[]'::jsonb
          )
      where id = $1
      returning *
      `,
      [caseId, latitude, longitude]
    );
    liveCase = result.rows[0];
  } catch (error) {
    console.warn(`Postgres update live case coordinates failed, trying Supabase REST: ${error.message}`);
    const current = await restSelectOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`);
    liveCase = await restUpdateOne("live_cases", `id=eq.${encodeURIComponent(caseId)}`, {
      last_seen_location: current?.last_seen_location || "WhatsApp shared location",
      structured_data: {
        ...(current?.structured_data || {}),
        latitude,
        longitude,
        missing_fields: [],
      },
    });
  }
  }
  if (liveCase) {
    await createCaseUpdate({
      caseId,
      updateType: "location_coordinates_added_from_whatsapp",
      note: "User shared WhatsApp location coordinates.",
      actor: "whatsapp_saathi",
      metadata: { latitude, longitude },
    });
    await audit({
      actor: "whatsapp_saathi",
      action: "updated_live_case_coordinates",
      entityType: "live_case",
      entityId: caseId,
      piiAccessed: false,
      metadata: { latitude, longitude },
    });
  }
  return liveCase;
}

async function addImmediateHelpRequest(caseId, note, metadata = {}) {
  const update = await createCaseUpdate({
    caseId,
    updateType: "immediate_help_requested",
    note: note || "User requested immediate human help.",
    actor: "whatsapp_saathi",
    metadata,
  });
  await audit({
    actor: "whatsapp_saathi",
    action: "immediate_help_requested",
    entityType: "live_case",
    entityId: caseId,
    piiAccessed: false,
    metadata,
  });
  return update;
}

async function audit({ actor, action, entityType, entityId, piiAccessed, metadata }) {
  const params = {
    p_actor: actor,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: String(entityId || ""),
    p_pii_accessed: Boolean(piiAccessed),
    p_metadata: metadata || {},
  };
  if (useRestOnly()) {
    const result = await restRpc("create_audit_log", params);
    return result?.id || result;
  }

  try {
    const result = await getPool().query(
      "select create_audit_log($1, $2, $3, $4, $5, $6::jsonb) as id",
      [params.p_actor, params.p_action, params.p_entity_type, params.p_entity_id, params.p_pii_accessed, JSON.stringify(params.p_metadata)]
    );
    return result.rows[0]?.id;
  } catch (error) {
    console.warn(`Postgres audit failed, trying Supabase REST: ${error.message}`);
    const result = await restRpc("create_audit_log", params);
    return result?.id || result;
  }
}

async function searchOfficialCases(query, maxRows = 3) {
  if (useRestOnly()) return [];
  const result = await getPool().query("select * from search_official_cases($1, $2)", [query, maxRows]);
  return result.rows;
}

async function nearestPolice(latitude, longitude, maxRows = 1) {
  if (useRestOnly()) return [];
  const result = await getPool().query("select * from nearest_police($1, $2, $3)", [latitude, longitude, maxRows]);
  return result.rows;
}

async function getStats() {
  const result = await getPool().query("select command_center_stats() as stats");
  return result.rows[0]?.stats;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

async function recordLiveCaseCreated(liveCase, report) {
  await createCaseUpdate({
    caseId: liveCase.id,
    updateType: "created_from_whatsapp",
    note: "Case created from WhatsApp Saathi intake.",
    actor: "whatsapp_saathi",
    metadata: { source_detail: report.source_detail, risk_flags: report.risk_flags || [] },
  });
  await audit({
    actor: "whatsapp_saathi",
    action: "created_live_case",
    entityType: "live_case",
    entityId: liveCase.id,
    piiAccessed: false,
    metadata: { source: report.source, priority: report.priority },
  });
}

function liveCasePayload(report) {
  return {
    source: report.source,
    source_detail: report.source_detail,
    case_type: report.case_type,
    status: report.status,
    priority: report.priority,
    missing_person_name: report.missing_person_name,
    gender: report.gender,
    age_band: report.age_band,
    state: report.state,
    district: report.district,
    language: report.language,
    last_seen_location: report.last_seen_location,
    zone_name: report.zone_name,
    reporter_mobile: report.reporter_mobile,
    physical_description: report.physical_description,
    raw_report: report.raw_report,
    structured_data: report.structured_data || {},
    private_verification_clues: report.private_verification_clues || [],
    risk_flags: report.risk_flags || [],
  };
}

function restConfig() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required for REST fallback");
  }
  return { url: url.replace(/\/$/, ""), key };
}

function useRestOnly() {
  return String(process.env.SUPABASE_REST_ONLY || "").toLowerCase() === "true";
}

async function restRequest(path, { method = "GET", body, prefer = "return=representation" } = {}) {
  const { url, key } = restConfig();
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message || response.statusText;
    throw new Error(`Supabase REST ${response.status}: ${message}`);
  }
  return data;
}

async function restInsert(table, payload) {
  const data = await restRequest(`/rest/v1/${table}`, {
    method: "POST",
    body: payload,
    prefer: "return=representation",
  });
  return Array.isArray(data) ? data[0] : data;
}

async function restUpdateOne(table, filter, payload) {
  const data = await restRequest(`/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    body: payload,
    prefer: "return=representation",
  });
  return Array.isArray(data) ? data[0] : data;
}

async function restSelectOne(table, filter) {
  const data = await restRequest(`/rest/v1/${table}?${filter}&select=*`, {
    method: "GET",
  });
  return Array.isArray(data) ? data[0] : data;
}

async function restRpc(functionName, params) {
  return restRequest(`/rest/v1/rpc/${functionName}`, {
    method: "POST",
    body: params,
  });
}

module.exports = {
  createLiveCase,
  createTrustCheck,
  updateLiveCaseLocation,
  updateLiveCaseCoordinates,
  addImmediateHelpRequest,
  searchOfficialCases,
  nearestPolice,
  getStats,
  closePool,
};
