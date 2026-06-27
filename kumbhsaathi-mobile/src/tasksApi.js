import { demoTasks } from "./demoData";
import { hasSupabaseConfig, supabase, volunteerName } from "./supabase";

export const taskStatuses = ["new", "accepted", "en_route", "on_scene", "completed", "escalated"];

const liveCaseFields = `
  id,
  source,
  source_detail,
  case_type,
  status,
  priority,
  missing_person_name,
  gender,
  age_band,
  language,
  last_seen_location,
  zone_name,
  reporter_mobile,
  physical_description,
  raw_report,
  structured_data,
  risk_flags,
  reported_at,
  created_at,
  updated_at
`;

function sourceLabel(source) {
  if (source === "whatsapp") return "WhatsApp";
  if (source === "ipad_booth" || source === "booth") return "Booth";
  if (source === "mobile_app") return "Mobile";
  return source || "Live";
}

function taskFromLiveCase(liveCase) {
  const typeLabel = liveCase.case_type === "found" ? "found-person" : "missing-person";
  return {
    id: `case-${liveCase.id}`,
    case_id: liveCase.id,
    title: `${sourceLabel(liveCase.source)} ${typeLabel} report`,
    description: liveCase.raw_report || liveCase.physical_description || "Live case reported to Kumbh Saathi.",
    assigned_to: null,
    status: liveCase.status || "open",
    priority: liveCase.priority || "medium",
    zone_name: liveCase.zone_name,
    created_at: liveCase.created_at || liveCase.reported_at,
    live_case: liveCase,
    is_live_case_only: true,
  };
}

export async function loadTasks() {
  if (!hasSupabaseConfig) {
    return { tasks: demoTasks, demoMode: true };
  }

  const { data: volunteerTasks, error: taskError } = await supabase
    .from("volunteer_tasks")
    .select(
      `
      *,
      live_case:live_cases (
        ${liveCaseFields}
      )
    `
    )
    .or(`assigned_to.eq.${volunteerName},assigned_to.is.null`)
    .not("status", "in", '("completed","cancelled")')
    .order("created_at", { ascending: false })
    .limit(50);

  if (taskError) throw taskError;

  const { data: liveCases, error: liveCaseError } = await supabase
    .from("live_cases")
    .select(liveCaseFields)
    .not("status", "in", '("found","closed","resolved","cancelled")')
    .order("created_at", { ascending: false })
    .limit(100);

  if (liveCaseError) throw liveCaseError;

  const linkedCaseIds = new Set((volunteerTasks || []).map((task) => task.case_id).filter(Boolean));
  const liveCaseTasks = (liveCases || [])
    .filter((liveCase) => !linkedCaseIds.has(liveCase.id))
    .map(taskFromLiveCase);

  return { tasks: [...liveCaseTasks, ...(volunteerTasks || [])], demoMode: false };
}

export function subscribeToTaskChanges(onChange) {
  if (!hasSupabaseConfig) return () => {};

  const channel = supabase
    .channel("mobile-volunteer-tasks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "volunteer_tasks" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "live_cases" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "case_updates" },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function updateTaskStatus(task, nextStatus) {
  if (task.is_live_case_only) {
    throw new Error("Create or select an assigned task before changing workflow status.");
  }

  if (!hasSupabaseConfig || String(task.id).startsWith("demo-")) {
    return { ...task, status: nextStatus };
  }

  const { data, error } = await supabase
    .from("volunteer_tasks")
    .update({ status: nextStatus })
    .eq("id", task.id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("case_updates").insert({
    case_id: task.case_id || null,
    official_case_id: task.official_case_id || null,
    update_type: `volunteer_${nextStatus}`,
    note: `${volunteerName} marked task ${nextStatus.replace(/_/g, " ")}.`,
    actor: volunteerName,
    metadata: { task_id: task.id, status: nextStatus },
  });

  await supabase.rpc("create_audit_log", {
    p_actor: volunteerName,
    p_action: "updated_volunteer_task",
    p_entity_type: "volunteer_task",
    p_entity_id: task.id,
    p_pii_accessed: false,
    p_metadata: { status: nextStatus },
  });

  return data;
}

export async function reportTaskFound(task, gpsLocation) {
  if (!hasSupabaseConfig || String(task.id).startsWith("demo-")) {
    return { ...task, status: "completed" };
  }

  if (task.is_live_case_only) {
    const caseId = task.case_id || task.live_case?.id;

    if (caseId) {
      await supabase.from("live_cases").update({ status: "found" }).eq("id", caseId);
    }

    await supabase.from("case_updates").insert({
      case_id: caseId || null,
      official_case_id: null,
      update_type: "person_found_by_mobile",
      note: `${volunteerName} reported this live case as found.`,
      actor: volunteerName,
      metadata: { live_case_only: true, gps: gpsLocation },
    });

    await supabase.rpc("create_audit_log", {
      p_actor: volunteerName,
      p_action: "reported_live_case_found",
      p_entity_type: "live_case",
      p_entity_id: caseId,
      p_pii_accessed: true,
      p_metadata: { case_id: caseId, gps: gpsLocation },
    });

    return { ...task, status: "completed" };
  }

  const { data, error } = await supabase
    .from("volunteer_tasks")
    .update({ status: "completed" })
    .eq("id", task.id)
    .select()
    .single();

  if (error) throw error;

  if (task.case_id) {
    await supabase.from("live_cases").update({ status: "found" }).eq("id", task.case_id);
  }

  await supabase.from("case_updates").insert({
    case_id: task.case_id || null,
    official_case_id: task.official_case_id || null,
    update_type: "person_found_by_mobile",
    note: `${volunteerName} reported this selected case as found.`,
    actor: volunteerName,
    metadata: { task_id: task.id, gps: gpsLocation },
  });

  await supabase.rpc("create_audit_log", {
    p_actor: volunteerName,
    p_action: "reported_selected_case_found",
    p_entity_type: "volunteer_task",
    p_entity_id: task.id,
    p_pii_accessed: true,
    p_metadata: { task_id: task.id, case_id: task.case_id || null, official_case_id: task.official_case_id || null },
  });

  return data;
}
