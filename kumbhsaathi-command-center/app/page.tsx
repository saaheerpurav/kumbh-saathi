"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  CommandCenterStats,
  LiveCase,
  TrustCheckReport,
  AuditLog,
  ZoneSummary,
  NavSection,
} from "@/lib/types";

import Sidebar from "@/components/Sidebar";
import StatsGrid from "@/components/StatsGrid";
import SearchPanel from "@/components/SearchPanel";
import LiveCasesQueue from "@/components/LiveCasesQueue";
import LiveCaseDetail from "@/components/LiveCaseDetail";
import VulnerableQueue from "@/components/VulnerableQueue";
import ZoneSummaryPanel from "@/components/ZoneSummaryPanel";
import FullMapView from "@/components/FullMapView";
import TrustCheckPanel from "@/components/TrustCheckPanel";
import AuditLogPanel from "@/components/AuditLogPanel";

export default function CommandCenter() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");

  // Stats
  const [stats, setStats] = useState<CommandCenterStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Live data collections
  const [liveCases, setLiveCases] = useState<LiveCase[]>([]);
  const [newLiveCaseIds, setNewLiveCaseIds] = useState<Set<string>>(new Set());
  const [trustReports, setTrustReports] = useState<TrustCheckReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  // Map: case selected from map pin
  const [mapSelectedCase, setMapSelectedCase] = useState<LiveCase | null>(null);

  // Alert banner
  const [alert, setAlert] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await supabase.rpc("command_center_stats");
      if (data) setStats(data as CommandCenterStats);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadZones = useCallback(async () => {
    setZonesLoading(true);
    try {
      const { data } = await supabase.rpc("zone_spatial_summary");
      if (data) setZones(data as ZoneSummary[]);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    const [liveRes, trustRes, auditRes] = await Promise.all([
      supabase.from("live_cases").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(200),
      supabase.from("trust_check_reports").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (liveRes.data) setLiveCases(liveRes.data as LiveCase[]);
    if (trustRes.data) setTrustReports(trustRes.data as TrustCheckReport[]);
    if (auditRes.data) setAuditLogs(auditRes.data as AuditLog[]);
  }, []);

  useEffect(() => {
    loadStats();
    loadZones();
    loadInitialData();

    const channel = supabase
      .channel("command-center-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_cases" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const c = payload.new as LiveCase;
          setLiveCases((prev) => [c, ...prev]);
          setNewLiveCaseIds((prev) => new Set([...prev, c.id]));
          setAlert(`⚡ New live case: ${c.missing_person_name || "Unknown"} via ${c.source}`);
          setTimeout(() => setAlert(null), 6000);
          loadStats();
          loadZones();
        } else if (payload.eventType === "UPDATE") {
          setLiveCases((prev) => prev.map((x) => x.id === (payload.new as LiveCase).id ? payload.new as LiveCase : x));
        } else if (payload.eventType === "DELETE") {
          setLiveCases((prev) => prev.filter((x) => x.id !== (payload.old as LiveCase).id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trust_check_reports" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTrustReports((prev) => [payload.new as TrustCheckReport, ...prev]);
          loadStats();
        } else if (payload.eventType === "UPDATE") {
          setTrustReports((prev) => prev.map((x) => x.id === (payload.new as TrustCheckReport).id ? payload.new as TrustCheckReport : x));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        setAuditLogs((prev) => [payload.new as AuditLog, ...prev.slice(0, 99)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadStats, loadZones, loadInitialData]);

  // Clear "new" badge after 30s
  useEffect(() => {
    if (newLiveCaseIds.size === 0) return;
    const t = setTimeout(() => setNewLiveCaseIds(new Set()), 30000);
    return () => clearTimeout(t);
  }, [newLiveCaseIds]);

  const handleTrustUpdate = (id: string, changes: Partial<TrustCheckReport>) => {
    setTrustReports((prev) => prev.map((r) => r.id === id ? { ...r, ...changes } : r));
  };

  // Case selected from map pin → jump to live cases detail view
  const handleMapCaseSelect = (c: LiveCase) => {
    setMapSelectedCase(c);
    setActiveSection("live-cases");
  };

  const openLiveCount = liveCases.filter((c) => c.status === "open").length;
  const trustHighCount = trustReports.filter((r) => r.risk_level === "high_concern" && r.status === "open").length;

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <StatsGrid stats={stats} loading={statsLoading} onRefresh={loadStats} />;
      case "search":
        return <SearchPanel />;
      case "live-cases":
        if (mapSelectedCase) {
          return (
            <div>
              <button className="neo-btn bg-black text-white text-xs px-3 py-2 mb-4" onClick={() => setMapSelectedCase(null)}>
                ← Back to Live Cases
              </button>
              <LiveCaseDetail liveCase={mapSelectedCase} onClose={() => setMapSelectedCase(null)} />
            </div>
          );
        }
        return <LiveCasesQueue cases={liveCases} newIds={newLiveCaseIds} />;
      case "vulnerable":
        return <VulnerableQueue />;
      case "map":
        return (
          <FullMapView
            liveCases={liveCases}
            zones={zones}
            onSelectCase={handleMapCaseSelect}
          />
        );
      case "zones":
        return <ZoneSummaryPanel zones={zones} loading={zonesLoading} />;
      case "trust-check":
        return <TrustCheckPanel reports={trustReports} onUpdate={handleTrustUpdate} />;
      case "audit":
        return <AuditLogPanel logs={auditLogs} loading={false} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        active={activeSection}
        onChange={(s) => { setMapSelectedCase(null); setActiveSection(s); }}
        liveCaseCount={openLiveCount}
        trustHighCount={trustHighCount}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b-2 border-black bg-white px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-400">Kumbh Saathi · Command Center</div>
            <div className="text-xs font-medium text-orange-500 italic">kumbh ke saath bhi, kumbh ke baad bhi</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-green-700">Realtime Active</span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alert && (
          <div className="border-b-2 border-orange-500 bg-orange-500 text-white px-6 py-2 text-sm font-black flex items-center justify-between flex-shrink-0">
            <span>{alert}</span>
            <button className="border border-white px-2 py-0.5 text-xs" onClick={() => setAlert(null)}>×</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-black/30">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
