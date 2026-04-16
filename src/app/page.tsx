"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, MapPin, Search, Activity, Target, Zap, Globe, Info, ShieldCheck, Database, Copy, Check, Sliders, Filter, Sparkles, AlertTriangle } from "lucide-react";
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
    <div className="min-h-full bg-background px-3 pt-6 md:pt-8 md:px-10 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-1.5 mb-1 text-primary font-black text-[9px] uppercase tracking-[0.2em]">
            <Activity size={10} className={clsx(isHunting && "animate-pulse")} />
            System: {isHunting ? "Active" : "Idle"}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1 leading-tight tracking-tighter">
            Gorilla <span className="text-primary">Engine</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold max-w-lg">
            High-efficiency B2B data extraction for growth teams.
          </p>
        </motion.div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          {userData?.plan === "free" && (
             <div className="flex flex-col px-3 border-r border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Runs Left</span>
                <span className="text-base font-black text-emerald-600">{runsRemaining}/2</span>
             </div>
          )}
          <div className="flex flex-col px-3 border-r border-slate-100">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leads</span>
            <span className="text-base font-black text-primary">{stats.leads}</span>
          </div>
          <div className="flex flex-col px-3">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Scanned</span>
            <span className="text-base font-black text-slate-900">{stats.scanned}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="premium-card p-4"
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Target size={12} className="text-primary" />
                Target Scope
              </h2>
              <div className="relative">
                <AnimatePresence>
                  {showFilterHint && !showFilters && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute right-full mr-4 whitespace-nowrap z-50 pointer-events-none"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-primary text-white text-[9px] font-black py-1.5 px-3 rounded-full shadow-lg shadow-primary/20 animate-bounce tracking-widest uppercase">
                          Unlock Pro Targeting
                        </div>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="text-primary"
                        >
                          <Sliders size={16} strokeWidth={3} className="rotate-90" />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleFilterClick}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    showFilters
                      ? "bg-primary text-white border-primary shadow-primary/20"
                      : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                  )}
                >
                  <Sliders size={12} className={clsx(showFilters ? "text-white" : "text-primary")} />
                  {showFilters ? "Close Filters" : "Filter Settings"}
                  {filters.enabled && !showFilters && (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Filter settings */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4 space-y-3"
                >
                  <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Template</span>
                      <div className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-md uppercase">{activeTemplate}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {templates.map(t => (
                        <button
                          key={t.name}
                          onClick={() => applyTemplate(t)}
                          className={clsx(
                            "p-2 rounded-xl border text-left transition-all",
                            activeTemplate === t.name
                              ? "bg-white border-primary shadow-sm ring-1 ring-primary/20"
                              : "bg-white/40 border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={clsx("scale-75", activeTemplate === t.name ? "text-primary" : "text-slate-400")}>{t.icon}</span>
                            <span className="text-[8px] font-black uppercase text-slate-700">{t.name}</span>
                          </div>
                          <p className="text-[7px] text-slate-400 leading-tight line-clamp-1">{t.desc}</p>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/50">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={clsx(
                          "w-8 h-4 rounded-full relative transition-all",
                          filters.enabled ? "bg-primary" : "bg-slate-200"
                        )}>
                          <motion.div
                            animate={{ x: filters.enabled ? 16 : 0 }}
                            className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                          />
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={filters.enabled}
                          onChange={(e) => setFilters(prev => ({ ...prev, enabled: e.target.checked }))}
                        />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Apply Active Profile</span>
                      </label>

                      {filters.enabled && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2.5 p-3 bg-white rounded-xl border border-slate-100 shadow-sm mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Min Rating: <span className="text-primary font-black ml-1">{filters.minRating}★</span></span>
                            <input
                              type="range" min="0" max="5" step="0.1"
                              value={filters.minRating}
                              onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                              className="w-20 h-1 accent-primary rounded-lg appearance-none bg-slate-100 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Min Reviews:</span>
                            <input
                              type="number"
                              value={filters.minReviews}
                              onChange={(e) => setFilters(prev => ({ ...prev, minReviews: parseInt(e.target.value) || 0 }))}
                              className="w-12 bg-slate-50 border border-slate-200 rounded px-1 text-[9px] font-bold text-center"
                            />
                          </div>
                          <hr className="border-slate-50" />
                          <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-[8px] font-bold text-slate-500 uppercase group-hover:text-slate-700 transition-colors">Has No Website</span>
                            <input
                              type="checkbox"
                              checked={filters.requireNoWebsite}
                              onChange={(e) => setFilters(prev => ({ ...prev, requireNoWebsite: e.target.checked }))}
                              className="w-3 h-3 accent-primary cursor-pointer"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-[8px] font-bold text-slate-500 uppercase group-hover:text-slate-700 transition-colors">Phone Required</span>
                            <input
                              type="checkbox"
                              checked={filters.requirePhone}
                              onChange={(e) => setFilters(prev => ({ ...prev, requirePhone: e.target.checked }))}
                              className="w-3 h-3 accent-primary cursor-pointer"
                            />
                          </label>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Workflow Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { name: "B2B Outreach", icon: <Globe size={10} />, cat: "Software Companies", g: 50 },
                { name: "Local B2C", icon: <MapPin size={10} />, cat: "Restaurants", g: 100 },
                { name: "Freelance Gig", icon: <Zap size={10} />, cat: "Interior Designers", g: 25 },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setCategory(p.cat);
                    setGoal(p.g.toString());
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all"
                >
                  {p.icon}
                  {p.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Target State</label>
                  <div className="relative group">
                    <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <select
                      value={selectedStateCode}
                      onChange={(e) => {
                        setSelectedStateCode(e.target.value);
                        setSelectedDistrict("");
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="">State</option>
                      {STATES.map((s) => (
                        <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                  <div className="relative group">
                    <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedStateCode}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-primary transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="">District</option>
                      {districts.map((d: string) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Area / Locality (Optional)</label>
                <div className="relative group">
                  <Target size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Vaishali, Malviya Nagar"
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative group">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Goal</label>
                  <div className="relative group">
                    <Zap size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="number"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isHunting ? handleStopRequest : startHunt}
                className={clsx(
                  "w-full py-2.5 rounded-xl flex items-center justify-center font-black text-sm shadow-lg transition-all duration-300 mt-2",
                  isHunting
                    ? "bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 shadow-rose-500/10"
                    : "btn-primary hover:shadow-xl hover:shadow-primary/30"
                )}
              >
                {isHunting ? (
                  <>
                    <Pause size={20} className="mr-3 fill-current" />
                    Terminate Sequence
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" size={20} className="mr-3" />
                    Initialize Engine
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
            <Info size={18} className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              Selecting a specific <strong>Area</strong> rather than just a district results in 3x faster extraction and higher data accuracy for metropolitan targets.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2rem] bg-[#0A0A0B] border-4 border-slate-800 flex-1 flex flex-col overflow-hidden min-h-[550px] shadow-[0_0_50px_rgba(0,0,0,0.3)]"
          >
            {/* Terminal Header - Professional Density */}
            <div className="px-4 py-3 border-b-2 border-slate-800 flex items-center justify-between bg-[#131315]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-100 tracking-[0.2em] font-mono flex items-center gap-2">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  ROOT@GORILLA-CORE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyLogs}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[8px] font-black uppercase tracking-widest rounded transition-all border border-slate-700 shadow-sm"
                >
                  {copied ? "COPIED" : "LOGS"}
                </button>
                {isHunting && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* Terminal Content - Fast Density */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-snug custom-scrollbar bg-black/40">
              <AnimatePresence initial={false}>
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-700 space-y-2">
                    <Activity size={32} className="opacity-10" />
                    <p className="text-[8px] uppercase tracking-[0.3em] font-black opacity-30">Awaiting Cycle...</p>
                  </div>
                ) : (
                  [...logs].map((log, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={clsx(
                          "mb-1.5 flex gap-2 font-mono",
                          isLatest ? "text-cyan-400 font-bold" :
                            log.type === "success" ? "text-purple-400" :
                              log.type === "success-bold" ? "text-pink-400 font-bold border-l-2 border-pink-500 pl-2 my-2" :
                                log.type === "error" ? "text-rose-400" :
                                  "text-emerald-500/80"
                        )}
                      >
                        <span className="shrink-0 opacity-40 text-[8px]">[{log.time}]</span>
                        <span className="break-words">{log.msg}</span>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>

            {/* Terminal Footer - Very Visible */}
            <div className="px-6 py-4 border-t-2 border-slate-800 bg-[#131315] text-[11px] text-slate-400 font-black flex justify-between font-mono tracking-widest">
              <span className="flex items-center gap-2">
                <span className="text-emerald-500">➜</span>
                ROOT@GORILLA-ENGINE:~#
              </span>
              <span className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                STABLE CONNECTION
              </span>
            </div>
          </motion.div>
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
              <div className="absolute top-0 left-0 w-full h-2 bg-primary-gradient" />

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                  <ShieldCheck size={40} strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">Gorilla Scraper</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Premium B2B Lead Hunting Engine</p>

                <p className="text-slate-500 text-sm mb-8 px-4">
                  Successfully secured <span className="text-primary font-bold">{stats.leads} leads</span>. Data has been encrypted and synced to the secure vault.
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
                    className="py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-primary transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2"
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
      {/* Termination Guard Modal */}

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
              <div className="absolute top-0 left-0 w-full h-2 bg-primary-gradient" />
              
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-amber-100/50">
                <AlertTriangle size={40} strokeWidth={1.5} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">FREE TIER LIMIT</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed px-4 font-medium">
                Free sessions are capped at <span className="text-primary font-black">10 leads</span>. You requested {goal}. 
                Would you like to upgrade for unlimited extraction or continue with the free cap?
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-primary shadow-xl shadow-slate-900/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap size={18} fill="currentColor" /> UPGRADE TO PRO
                </button>
                <button
                  onClick={() => {
                    setGoal("10");
                    setShowLimitModal(false);
                    // startHunt(); // Optionally restart hunt with 10
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
