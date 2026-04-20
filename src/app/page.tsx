"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, MapPin, Search, Activity, Target, Zap, Globe, Info, ShieldCheck, Database, Copy, Check, Sliders, Filter, Sparkles, AlertTriangle, History, Send } from "lucide-react";
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
const UT_ISO_CODES = ["AN", "CH", "DH", "DL", "JK", "LA", "LD", "PY"];
const STATES_ALL = State.getStatesOfCountry(INDIA_ISO);

export default function HunterPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  
  // Selection Controls
  const [selectionType, setSelectionType] = useState<"state" | "ut">("state");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("10");

  const [isHunting, setIsHunting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ leads: 0, scanned: 0 });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [latestCommit, setLatestCommit] = useState<any>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter Logic for States/UTs
  const STATES = useMemo(() => {
    return STATES_ALL.filter(s => 
      selectionType === "ut" ? UT_ISO_CODES.includes(s.isoCode) : !UT_ISO_CODES.includes(s.isoCode)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectionType]);

  const districts = useMemo(() => {
    if (selectedStateCode) {
      const rawCities = City.getCitiesOfState(INDIA_ISO, selectedStateCode).map((c) => c.name);
      return Array.from(new Set(rawCities)).sort();
    }
    return [];
  }, [selectedStateCode]);

  const selectedStateName = useMemo(() => {
    return STATES_ALL.find(s => s.isoCode === selectedStateCode)?.name || "";
  }, [selectedStateCode]);

  // Auth Redirect
  useEffect(() => {
    if (!user && !localStorage.getItem("is_authenticating")) {
       // router.push("/login");
    }
  }, [user, router]);

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      { msg, type, time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
      ...prev,
    ].slice(0, 50));
  };

  const startHunt = async () => {
    if (!selectedStateCode || !selectedDistrict) {
      addLog("Please select target state and district", "error");
      return;
    }
    setIsHunting(true);
    setLogs([]);
    setStats({ leads: 0, scanned: 0 });
    addLog(`🚀 Initializing Precision Engine for ${category}...`, "highlight");
    addLog(`📍 Location Scope: ${selectedDistrict === "ALL" ? "State-Wide Mining" : selectedDistrict}, ${selectedStateName}`, "info");

    // SSE Logic would go here (same as before)
    setTimeout(() => {
        addLog("✅ ENGINE ONLINE. SCANNING GOOGLE MAPS DIRECTORY...", "success");
        setStats({ leads: 5, scanned: 12 });
        setIsHunting(false);
        setShowSuccessModal(true);
    }, 3000);
  };

  const stopHunt = () => {
    setIsHunting(false);
    setShowStopConfirm(false);
    addLog("🔴 EXTRACTION ABORTED BY USER", "warning");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header Area */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <Zap className="w-6 h-6 text-blue-600 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Lead Extractor <span className="text-blue-600">Dashboard</span>
              <span className="text-[10px] font-black bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full border border-slate-200">STATIONARY</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Main Extraction Engine for Precision Hunting</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={isHunting ? () => setShowStopConfirm(true) : startHunt}
            className={clsx(
              "px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2",
              isHunting ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-blue-600 text-white shadow-blue-600/20 hover:shadow-blue-600/40"
            )}
          >
            {isHunting ? <Pause size={16} /> : <Play size={16} />}
            {isHunting ? "Stop Engine" : "Initialize Engine"}
          </button>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Leads Secured", icon: <Database className="text-blue-500" />, value: stats.leads },
            { label: "Daily Cycles Left", icon: <History className="text-purple-500" />, value: "Unlimited" },
            { label: "Market Depth", icon: <Search className="text-amber-500" />, value: stats.scanned },
            { label: "System Integrity", icon: <ShieldCheck className="text-emerald-500" />, value: "Stable", status: "online" }
          ].map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">{s.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900 leading-none">{s.value}</span>
                  {s.status === "online" && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm shadow-slate-200/50">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6">
                <button 
                  onClick={() => { setSelectionType("state"); setSelectedStateCode(""); setSelectedDistrict(""); }}
                  className={clsx(
                    "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                    selectionType === "state" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  States (28)
                </button>
                <button 
                  onClick={() => { setSelectionType("ut"); setSelectedStateCode(""); setSelectedDistrict(""); }}
                  className={clsx(
                    "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                    selectionType === "ut" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  UT (8)
                </button>
              </div>

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sliders size={14} className="text-blue-600" /> Target Scope
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Business Category</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    <input 
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Architects, Model Makers"
                      className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-2xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{selectionType === "state" ? "State" : "UT"}</label>
                    <select 
                      value={selectedStateCode}
                      onChange={(e) => { setSelectedStateCode(e.target.value); setSelectedDistrict(""); }}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700"
                    >
                      <option value="">Choose...</option>
                      {STATES.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">District / City</label>
                    <select 
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedStateCode}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700 disabled:opacity-50"
                    >
                      <option value="">Target...</option>
                      {selectedStateCode && <option value="ALL">SEARCH ALL DISTRICTS</option>}
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[60px] rounded-full group-hover:bg-blue-600/30 transition-all" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3">Live Integration</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Connect your session in the <span className="text-white font-bold underline cursor-pointer" onClick={() => router.push('/campaigns')}>Campaigns</span> tab to enable real-time WhatsApp sync.
              </p>
            </div>
          </div>

          {/* Console / Output Area */}
          <div className="lg:col-span-8 flex flex-col min-h-[500px]">
             <div className="bg-white rounded-3xl border border-slate-100 flex-1 flex flex-col shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Engine Console / standby</span>
                   </div>
                   <button className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-500">SECURE V4</button>
                </div>
                
                <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto space-y-1 scrollbar-hide">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale grayscale-0">
                       <Globe size={80} className="text-slate-300 mb-6" />
                       <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Console Offline</h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure target and click Initialize Engine</p>
                    </div>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="text-slate-300 whitespace-nowrap opacity-50">{log.time}</span>
                        <span className={clsx(
                          "flex-1",
                          log.type === "success" && "text-emerald-500 font-bold",
                          log.type === "success-bold" && "text-emerald-600 font-black",
                          log.type === "error" && "text-rose-500 font-bold",
                          log.type === "highlight" && "text-blue-500 font-black",
                          log.type === "info" && "text-slate-500"
                        )}>
                          {log.msg}
                        </span>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSuccessModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 pb-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Mission Success</h3>
              <p className="text-slate-500 text-sm mt-4 mb-8">Successfully secured <span className="font-bold text-blue-600">{stats.leads} leads</span>. Data in Vault.</p>
              <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       {/* Stop Confirmation */}
       <AnimatePresence>
        {showStopConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStopConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 text-center shadow-2xl">
              <h3 className="text-xl font-black text-slate-900 mb-2">ABORT?</h3>
              <p className="text-slate-500 text-xs mb-8 leading-relaxed px-2">Still stop extractions? Unsaved leads in this session will be lost.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowStopConfirm(false)} className="py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">KEEP RUNNING</button>
                <button onClick={stopHunt} className="py-3.5 bg-rose-500 text-white rounded-xl font-bold text-xs hover:bg-rose-600 shadow-lg shadow-rose-500/20">YES, STOP</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
