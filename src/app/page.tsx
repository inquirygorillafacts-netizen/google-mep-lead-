"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, MapPin, Search, Activity, Target, Zap, Globe, Info, ShieldCheck, Database, Copy, Check, Sliders, Filter, Sparkles, AlertTriangle, History } from "lucide-react";
import { State, City } from "country-state-city";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface LogEntry {
  type: "info" | "success" | "error" | "warning" | "success-bold" | "highlight";
  msg: string;
  time: string;
}

const INDIA_ISO = "IN";
const STATES = State.getStatesOfCountry(INDIA_ISO);

export default function HunterPage() {
  const { user, userData } = useAuth();
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("10");

  const [isHunting, setIsHunting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ leads: 0, scanned: 0 });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [latestCommit, setLatestCommit] = useState<any>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterHint, setShowFilterHint] = useState(false);

  const getRunsRemaining = () => {
    if (userData?.plan !== "free") return "Unlimited";
    const runsToday = userData?.dailyRuns || 0;
    const remaining = 2 - runsToday;
    return remaining > 0 ? remaining : 0;
  };

  const runsRemaining = getRunsRemaining();


  useEffect(() => {
    // Show filter hint only if not already dismissed in previous sessions
    const isDismissed = localStorage.getItem("filter_hint_dismissed");
    if (!isDismissed) {
      const timer = setTimeout(() => setShowFilterHint(true), 2000); // Delayed show for impact
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFilterClick = () => {
    setShowFilters(!showFilters);
    if (!showFilters) {
      setShowFilterHint(false);
      localStorage.setItem("filter_hint_dismissed", "true");
    }
  };

  // Filter States
  const [filters, setFilters] = useState({
    minRating: 4.0,
    minReviews: 20,
    requireNoWebsite: true,
    requirePhone: true,
    enabled: false // Default all off as requested
  });

  const [activeTemplate, setActiveTemplate] = useState("Bulk Outreach");

  const templates = [
    { name: "Bulk Outreach", icon: <Activity size={14} />, desc: "Collect any lead rapidly", config: { minRating: 0, minReviews: 0, requireNoWebsite: false, requirePhone: false, enabled: false } },
    { name: "Premium Target", icon: <Sparkles size={14} />, desc: "4+ Stars, 20+ Reviews, No Web", config: { minRating: 4.0, minReviews: 20, requireNoWebsite: true, requirePhone: true, enabled: true } },
    { name: "Top Rated", icon: <Target size={14} />, desc: "Top 5% businesses only", config: { minRating: 4.7, minReviews: 100, requireNoWebsite: false, requirePhone: true, enabled: true } },
    { name: "Website Sales", icon: <Globe size={14} />, desc: "Targets with existing sites", config: { minRating: 3.5, minReviews: 10, requireNoWebsite: false, requirePhone: true, enabled: true } },
  ];

  const applyTemplate = (t: typeof templates[0]) => {
    setActiveTemplate(t.name);
    setFilters(t.config);
  };

  const logsEndRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef({ leads: 0, scanned: 0 });

  const districts = useMemo(() => {
    if (selectedStateCode) {
      return City.getCitiesOfState(INDIA_ISO, selectedStateCode).map((c) => c.name);
    }
    return [];
  }, [selectedStateCode]);

  const selectedStateName = useMemo(() => {
    return STATES.find(s => s.isoCode === selectedStateCode)?.name || "";
  }, [selectedStateCode]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      { msg, type, time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
      ...prev,
    ].slice(0, 50));
  };

  const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Keep ref in sync with state for SSE access
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const startHunt = async () => {
    if (!user) {
      addLog("Please login to initialize the engine", "error");
      return;
    }

    if (!selectedStateCode || !selectedDistrict) {
      addLog("Please select target state and district", "error");
      return;
    }

    const targetGoal = parseInt(goal) || 10;

    // Plan Validation (Frontend)
    if (userData?.plan === "free") {
      if (userData.dailyRuns >= 2) {
        addLog("❌ DAILY LIMIT EXHAUSTED: Free users are allowed 2 sessions per day.", "error");
        return;
      }
      if (targetGoal > 10) {
        setShowLimitModal(true);
        return;
      }
    }

    setIsHunting(true);
    setLogs([]);
    setStats({ leads: 0, scanned: 0 });

    addLog(`🚀 Initializing Precision Target Engine for ${category}...`, "highlight");
    addLog(`📍 Location Scope: ${selectedDistrict}, ${selectedStateName}`, "info");
    const initialLogs = [
      "Initializing Gorilla Engine v4.0.2...",
      "Establishing encrypted tunnel...",
      "Connection stabilized. Ready for target extraction.",
    ];
    initialLogs.forEach(l => addLog(l, "info"));

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          state: selectedStateName,
          district: selectedDistrict,
          goal: parseInt(goal) || 20,
          filters, // Pass user filters
          userId: user.uid
        }),
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message) {
                // If we get an error/warning about daily limits from the backend
                if (data.message.includes("DAILY LIMIT REACHED")) {
                  addLog(`⚠️ ACCESS DENIED: ${data.message} 🖕`, "error");
                  setIsHunting(false);
                  return;
                }

                if (data.message.startsWith("✅ FOUND")) {
                  setStats(prev => {
                    const newLeads = prev.leads + 1;
                    // Progress Triggers inside setter to use fresh value
                    const targetGoal = parseInt(goal) || 20;
                    const percent = (newLeads / targetGoal) * 100;
                    if (percent >= 30 && percent < 34) addLog("🕶️ [SYSTEM]: 30% INFILTRATED. DEEP SCANNING ACTIVE... 🌪️", "highlight");
                    if (percent >= 60 && percent < 64) addLog("🔥 [SYSTEM]: 60% DATA RECOVERED. SERVER OVERHEATING! 🌶️", "highlight");
                    if (percent >= 85 && percent < 89) addLog("🛸 [SYSTEM]: 85% PAYLOAD SECURED. PREPARING EXTRACTION... 🛰️", "highlight");
                    return { ...prev, leads: newLeads };
                  });
                  addLog(`💀 TARGET SNIFFED: ${data.message.split(":")[1] || "Lead Unlocked"} 🫦`, "success");
                } else if (data.message.startsWith("💾 SAVED")) {
                  addLog(`👾 DATA INJECTED: ${data.message.split(":")[1] || "Encrypted Entry"} 💉`, "success-bold");
                } else if (data.message.startsWith("❌")) {
                  addLog(`🤬 BYPASS FAILED: ${data.message.slice(2)} 🖕`, "error");
                } else {
                  addLog(`🕵️ SCANTILLATING: ${data.message} 🕵️`, "info");
                  setStats(prev => ({ ...prev, scanned: prev.scanned + 1 }));
                }
              }
              if (data.complete) {
                const asciiArt = `
+------------------------------------------+
|  🏆 COMPLETED TASK: MISSION SUCCESS       |
|  🎉 CONGRATULATIONS! DATA SECURED         |
|  💎 TOTAL LEADS SECURED: ${statsRef.current.leads}               |
|  📂 SYNCED TO VAULT SUCCESSFULLY! 🥂     |
+------------------------------------------+
                `;
                addLog(asciiArt, "success-bold");
                addLog("✨ Extraction Cycle Finalized. New Commit established in Secure Vault.", "highlight");

                // Fetch latest commit to show in modal
                setTimeout(async () => {
                  try {
                    const query = {
                      structuredQuery: {
                        from: [{ collectionId: "commits" }],
                        where: {
                          fieldFilter: {
                            field: { fieldPath: "userId" },
                            op: "EQUAL",
                            value: { stringValue: user.uid },
                          },
                        },
                        orderBy: [{ field: { fieldPath: "timestamp" }, direction: "DESCENDING" }],
                        limit: 1
                      },
                    };

                    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`, {
                      method: "POST",
                      body: JSON.stringify(query)
                    });
                    const commitData = await res.json();

                    if (Array.isArray(commitData) && commitData[0]?.document) {
                      const doc = commitData[0].document;
                      setLatestCommit({
                        id: doc.name.split("/").pop(),
                        count: statsRef.current.leads,
                        ...doc.fields
                      });
                    }
                  } catch (e) {
                    console.error("Modal fetch error:", e);
                  }
                  console.log("🏁 Triggering success modal...");
                  setShowSuccessModal(true);
                }, 1000);
              }
            } catch (e) {
              console.error("Error parsing SSE line:", e);
            }
          }
        }
      }
    } catch (e: any) {
      addLog(`Critical Engine Error: ${e.message}`, "error");
    } finally {
      setIsHunting(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (isHunting) handleStopRequest();
        else startHunt();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // Global search focus logic could go here or in layout
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHunting, selectedStateCode, selectedDistrict, category, goal]);

  const handleStopRequest = () => {
    if (isHunting) {
      setShowStopConfirm(true);
    }
  };

  const stopHunt = () => {
    setIsHunting(false);
    setShowStopConfirm(false);
    addLog("💀 SEQUENCE TERMINATED. ALL UNSAVED PROGRESS PURGED. 💀", "error");
  };

  const copyLogs = () => {
    const text = logs.map(l => `[${l.time}] ${l.msg}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">
        {/* Top Header / Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600 shadow-sm border border-blue-100">
              <Zap size={20} className="fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">Lead Extractor <span className="text-blue-600">Dashboard</span></h1>
                <span className={clsx(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                  isHunting ? "bg-emerald-50 border-emerald-200 text-emerald-600 animate-pulse" : "bg-slate-100 border-slate-200 text-slate-600"
                )}>
                  {isHunting ? "SEQUENCE ACTIVE" : "STATIONARY"}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-medium uppercase tracking-tight">Main Extraction Engine for Precision Hunting</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
             <button 
                onClick={isHunting ? handleStopRequest : startHunt}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-extrabold text-xs transition-all ${
                    isHunting 
                    ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 shadow-sm" 
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-95"
                }`}
              >
                {isHunting ? <Pause fill="currentColor" size={14} /> : <Play fill="currentColor" size={14} />}
                {isHunting ? "Terminate Cycle" : "Initialize Engine"}
              </button>
              
              <div className="w-px h-6 bg-slate-200 mx-1" />

              <button 
                onClick={copyLogs}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all font-mono"
              >
                <Activity size={14} />
                {copied ? "COPIED" : "LOGS"}
              </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Leads Secured", value: stats.leads, icon: Target, color: "text-blue-600", bg: "bg-blue-600/10" },
            { label: "Daily Cycles Left", value: `${runsRemaining}`, icon: History, color: "text-slate-400", bg: "bg-slate-100" },
            { label: "Market Depth", value: stats.scanned, icon: Search, color: "text-purple-600", bg: "bg-purple-600/10" },
            { 
              label: "System Integrity", 
              value: "Stable", 
              icon: ShieldCheck, 
              color: "text-emerald-600", 
              bg: "bg-emerald-600/10",
              indicator: true
            }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black tracking-tight text-slate-900">{stat.value}</h3>
                        {stat.indicator && (
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Settings */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 p-5 rounded-[1.5rem] shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Sliders size={14} className="text-blue-600" />
                        Target Scope
                    </h4>
                    <button onClick={handleFilterClick} className="text-[10px] font-bold text-blue-600 hover:underline">
                        {showFilters ? "Close Filters" : "Pro Settings"}
                    </button>
                </div>
                
                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                        >
                             <div className="grid grid-cols-1 gap-2">
                                {templates.map(t => (
                                    <button
                                        key={t.name}
                                        onClick={() => applyTemplate(t)}
                                        className={clsx(
                                            "flex items-center justify-between p-2 rounded-lg border text-left transition-all",
                                            activeTemplate === t.name ? "bg-white border-blue-600 shadow-sm" : "bg-transparent border-transparent opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(activeTemplate === t.name ? "text-blue-600" : "text-slate-400")}>{t.icon}</span>
                                            <span className="text-[9px] font-bold uppercase text-slate-700">{t.name}</span>
                                        </div>
                                    </button>
                                ))}
                             </div>
                             <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Apply Filter Shield</span>
                                <input 
                                    type="checkbox" 
                                    checked={filters.enabled}
                                    onChange={(e) => setFilters(prev => ({ ...prev, enabled: e.target.checked }))}
                                    className="w-3 h-3 accent-blue-600"
                                />
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">State</label>
                            <select 
                                value={selectedStateCode}
                                onChange={(e) => {
                                    setSelectedStateCode(e.target.value);
                                    setSelectedDistrict("");
                                }}
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700"
                            >
                                <option value="">State</option>
                                {STATES.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">District</label>
                            <select 
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={!selectedStateCode}
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700 disabled:opacity-50"
                            >
                                <option value="">District</option>
                                {districts.map((d: string) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Locality (Optional)</label>
                        <input 
                            type="text" 
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            placeholder="e.g. Vaishali, Jaipur"
                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Keyword</label>
                            <input 
                                type="text" 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Architects"
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Lead Goal</label>
                            <input 
                                type="number" 
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="p-3.5 bg-blue-600/5 border border-blue-600/10 rounded-xl">
                        <p className="text-[10px] text-blue-600 font-bold leading-relaxed flex items-center gap-2">
                            <Info size={12} />
                            Precision engine v4.0 is active.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-[1.5rem] shadow-lg border border-slate-700 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                <h4 className="text-sm font-black mb-1 relative z-10">Mission Shortcuts</h4>
                <div className="space-y-2 mt-4 relative z-10">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                        <span>Initiate Cycle</span>
                        <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-400 border border-slate-600">CTRL+ENTER</kbd>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                        <span>Vault Search</span>
                        <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-400 border border-slate-600">CTRL+K</kbd>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Panel: Live Feed / Logs */}
          <div className="lg:col-span-9 flex flex-col h-full gap-4">
            <div className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm flex flex-col min-h-[460px] max-h-[600px] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isHunting ? "bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]" : "bg-slate-300"}`} />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            Engine Console
                            <span className="text-slate-300 text-[10px]">/</span>
                            <span className="text-slate-400 font-mono text-[10px] lowercase">{isHunting ? "Extracting..." : "standby"}</span>
                        </h4>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            SECURE_V4
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20 font-mono text-[11px]">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 grayscale opacity-60">
                             <div className="relative mb-6">
                                <Database size={64} className="text-slate-200" />
                                <Activity size={24} className="absolute -bottom-2 -right-2 text-slate-300" />
                             </div>
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Console Offline</p>
                            <p className="text-[10px] mt-2 font-medium">Configure target and click Initialize Engine</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {logs.map((log, idx) => (
                                <div key={idx} className={clsx(
                                    "flex gap-4 p-2 rounded-lg border transition-all",
                                    log.type === "success" || log.type === "success-bold" ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                                    log.type === "error" ? "bg-rose-50 border-rose-100 text-rose-800" :
                                    log.type === "highlight" ? "bg-blue-50 border-blue-100 text-blue-800" :
                                    "bg-white border-slate-100 text-slate-600"
                                )}>
                                    <span className="shrink-0 font-bold opacity-40 text-[9px] font-mono">[{log.time}]</span>
                                    <span className="leading-relaxed font-medium capitalize break-words">{log.msg}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Quick Tips or Integration Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-600/5 border border-indigo-600/10 p-4 rounded-[1.5rem] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Info size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">PRO TIP</p>
                        <p className="text-xs font-medium text-indigo-900/70 leading-tight">Specific "Area" selection results in 3x faster extraction.</p>
                    </div>
                </div>
                <div className="bg-emerald-600/5 border border-emerald-600/10 p-4 rounded-[1.5rem] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">DATA STATUS</p>
                        <p className="text-xs font-medium text-emerald-900/70 leading-tight">Auto-Sync enabled to Secure Vault commits.</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Slide-up Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl p-8 pb-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                  <ShieldCheck size={40} strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-black text-slate-900">Mission Success</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Premium B2B Lead Hunting Engine</p>

                <p className="text-slate-500 text-sm mb-8 px-4">
                  Successfully secured <span className="text-blue-600 font-bold">{stats.leads} leads</span>. Data has been encrypted and synced to the secure vault.
                </p>

                <div className="w-full bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 flex items-center justify-between text-left">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Commit Identifier</p>
                    <p className="text-sm font-mono font-bold text-slate-700">{latestCommit?.id || "GENERATING..."}</p>
                  </div>
                  <div className="h-10 w-px bg-slate-200 mx-4" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                    <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">SECURED</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => window.location.href = `/vault?commit=${latestCommit?.id}`}
                    className="py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Database size={18} /> Open Vault
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Termination Guard Modal */}
      <AnimatePresence>
        {showStopConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowStopConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">ABORT EXTRACTION?</h3>
              <p className="text-slate-500 text-xs mb-8 leading-relaxed px-2">
                Stopping now will lose the unsaved leads in the current session. Let the engine complete for best results. Still stop?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowStopConfirm(false)}
                  className="py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                >
                  KEEP RUNNING
                </button>
                <button
                  onClick={stopHunt}
                  className="py-3.5 bg-rose-500 text-white rounded-xl font-bold text-xs hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                >
                  YES, TERMINATE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Limit Exceeded Modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLimitModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
              
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-amber-100/50">
                <AlertTriangle size={40} strokeWidth={1.5} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">FREE TIER LIMIT</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed px-4 font-medium">
                Free sessions are capped at <span className="text-blue-600 font-black">10 leads</span>. You requested {goal}. 
                Would you like to upgrade for unlimited extraction or continue with the free cap?
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap size={18} fill="currentColor" /> UPGRADE TO PRO
                </button>
                <button
                  onClick={() => {
                    setGoal("10");
                    setShowLimitModal(false);
                  }}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  CAP AT 10 & CONTINUE
                </button>
              </div>
              
              <button 
                onClick={() => setShowLimitModal(false)}
                className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-400 transition-colors"
              >
                Maybe Later
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
