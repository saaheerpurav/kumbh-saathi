import { hasSupabaseConfig, supabase, volunteerName } from "./supabase";

function localId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function locationText(gpsLocation) {
  if (!gpsLocation) return "location unavailable";
  return `${gpsLocation.latitude.toFixed(6)}, ${gpsLocation.longitude.toFixed(6)}`;
}

export async function submitEmergencyAlert({ gpsLocation }) {
  const gpsText = locationText(gpsLocation);

  if (!hasSupabaseConfig) {
    return { id: localId("demo-sos"), demoMode: true };
  }

  const { data: liveCase, error: caseError } = await supabase
    .from("live_cases")
    .insert({
      source: "mobile_app",
      source_detail: volunteerName,
      case_type: "missing",
      priority: "critical",
      status: "open",
      last_seen_location: gpsText,
      raw_report: `Emergency SOS from ${volunteerName} at ${gpsText}.`,
      structured_data: { mobile_intent: "emergency_sos", gps: gpsLocation },
      risk_flags: ["mobile_sos", "location_attached"],
    })
    .select()
    .single();

  if (caseError) throw caseError;

  await supabase.from("volunteer_tasks").insert({
    case_id: liveCase.id,
    title: "Emergency SOS from mobile app",
    description: `Immediate help requested by ${volunteerName}. GPS: ${gpsText}.`,
    priority: "critical",
    status: "new",
  });

  await supabase.rpc("create_audit_log", {
    p_actor: volunteerName,
    p_action: "created_mobile_sos",
    p_entity_type: "live_case",
    p_entity_id: liveCase.id,
    p_pii_accessed: false,
    p_metadata: { source: "mobile_app", gps: gpsLocation },
  });

  return { id: liveCase.id, demoMode: false };
}

export async function submitMissingReport({ personName, ageBand, gender, lastSeenLocation, details, gpsLocation }) {
  const cleanName = personName.trim();
  const cleanAgeBand = ageBand.trim();
  const cleanGender = gender.trim();
  const cleanLocation = lastSeenLocation.trim();
  const cleanDetails = details.trim();
  const gpsText = locationText(gpsLocation);

  if (!hasSupabaseConfig) {
    return { id: localId("demo-missing"), demoMode: true };
  }

  const { data: liveCase, error: caseError } = await supabase
    .from("live_cases")
    .insert({
      source: "mobile_app",
      source_detail: volunteerName,
      case_type: "missing",
      priority: "high",
      status: "open",
      missing_person_name: cleanName || null,
      age_band: cleanAgeBand || null,
      gender: cleanGender || "Unknown",
      last_seen_location: cleanLocation || gpsText,
      raw_report: cleanDetails || "Mobile missing-person report",
      physical_description: cleanDetails || null,
      structured_data: {
        mobile_intent: "missing_person",
        gps: gpsLocation,
        entered_by: volunteerName,
      },
      risk_flags: gpsLocation ? ["mobile_missing_report", "location_attached"] : ["mobile_missing_report"],
    })
    .select()
    .single();

  if (caseError) throw caseError;

  await supabase.from("volunteer_tasks").insert({
    case_id: liveCase.id,
    title: "Mobile missing-person report",
    description: `${cleanName || "Unknown person"} / ${cleanAgeBand || "age unknown"} / ${
      cleanGender || "gender unknown"
    }. ${cleanDetails || "Check mobile app missing-person report."} Last seen: ${
      cleanLocation || "not provided"
    }. GPS: ${gpsText}.`,
    priority: "high",
    status: "new",
  });

  await supabase.rpc("create_audit_log", {
    p_actor: volunteerName,
    p_action: "created_mobile_missing_report",
    p_entity_type: "live_case",
    p_entity_id: liveCase.id,
    p_pii_accessed: false,
    p_metadata: { source: "mobile_app", gps: gpsLocation },
  });

  return { id: liveCase.id, demoMode: false };
}

export async function submitTrustCheck({ message }) {
  const cleanMessage = message.trim();

  if (!hasSupabaseConfig) {
    return { id: localId("demo-trust"), demoMode: true };
  }

  const { data, error } = await supabase
    .from("trust_check_reports")
    .insert({
      source: "mobile_app",
      raw_message: cleanMessage,
      risk_level: "unverified",
      reasons: ["Needs command-center review"],
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.rpc("create_audit_log", {
    p_actor: volunteerName,
    p_action: "created_mobile_trust_check",
    p_entity_type: "trust_check_report",
    p_entity_id: data.id,
    p_pii_accessed: false,
    p_metadata: { source: "mobile_app" },
  });

  return { id: data.id, demoMode: false };
}
