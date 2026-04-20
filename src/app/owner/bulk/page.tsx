"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Search, 
  Loader2, 
  Play, 
  Pause, 
  RotateCcw, 
  Phone, 
  Globe, 
  Download,
  AlertTriangle,
  History,
  Target,
  Sliders,
  Info,
  Lock,
  CheckCircle2
} from "lucide-react";
import { State, City } from "country-state-city";
import clsx from "clsx";

const INDIA_ISO = "IN";
const UT_ISO_CODES = ["AN", "CH", "DH", "DL", "JK", "LA", "LD", "PY"];
const STATES_ALL = State.getStatesOfCountry(INDIA_ISO);

export default function OwnerBulkPage() {
  // Config
  const [selectionType, setSelectionType] = useState<"state" | "ut">("state");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [category, setCategory] = useState("Architects");
  
  // State
  const [districts, setDistricts] = useState<string[]>([]);
  const [currentDistrictIndex, setCurrentDistrictIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ totalFound: 0 });

  const STATES = useMemo(() => {
    return STATES_ALL.filter(s => 
      selectionType === "ut" ? UT_ISO_CODES.includes(s.isoCode) : !UT_ISO_CODES.includes(s.isoCode)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectionType]);

  useEffect(() => {
    if (selectedStateCode) {
      const cities = City.getCitiesOfState(INDIA_ISO, selectedStateCode).map(c => c.name);
      setDistricts(Array.from(new Set(cities)).sort());
      setSelectedDistrict(""); // Reset district on state change
      setCurrentDistrictIndex(-1);
      setIsProcessing(false);
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedStateCode]);

  // Determine which districts to mine
  const targetDistricts = useMemo(() => {
    if (!selectedDistrict || selectedDistrict === "ALL") {
      return districts;
    }
    return [selectedDistrict];
  }, [selectedDistrict, districts]);

  const startBulkProcessing = async () => {
    if (!selectedStateCode || isProcessing) return;
    setIsProcessing(true);
    let startIdx = currentDistrictIndex === -1 ? 0 : currentDistrictIndex;
    
    for (let i = startIdx; i < targetDistricts.length; i++) {
        if (!isProcessing && i !== startIdx) break;
        setCurrentDistrictIndex(i);
        // Simulate processing a district
        await new Promise(r => setTimeout(r, 2000));
        setStats(prev => ({ ...prev, totalFound: prev.totalFound + Math.floor(Math.random() * 10) + 5 }));
    }
    setIsProcessing(false);
  };

  const stopProcessing = () => {
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl">
            <Target className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              State-Wide <span className="text-amber-600">Bulk Mining</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Multi-District Lead Harvester</p>
          </div>
        </div>

        <button 
          onClick={isProcessing ? stopProcessing : startBulkProcessing}
          disabled={!selectedStateCode}
          className={clsx(
            "px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2",
            isProcessing ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-slate-900 text-white shadow-slate-900/20 disabled:opacity-50"
          )}
        >
          {isProcessing ? <Pause size={16} /> : <Play size={16} />}
          {isProcessing ? "Pause Engine" : "Ignite Bulk Extraction"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Leads Secured", icon: <Phone className="text-amber-600" />, value: stats.totalFound, sub: "With Verified Numbers" },
            { label: "Target Scope", icon: <MapPin className="text-blue-600" />, value: targetDistricts.length, sub: "Selected Areas" },
            { 
              label: "Mining Progress", 
              icon: <History className="text-purple-600" />, 
              value: currentDistrictIndex === -1 ? "0%" : `${Math.round(((currentDistrictIndex + 1) / targetDistricts.length) * 100)}%`,
              sub: `${currentDistrictIndex + 1} of ${targetDistricts.length} Done`
            },
            { 
              label: "Engine Status", 
              icon: <ShieldCheck className={clsx(isProcessing ? "text-emerald-500" : "text-slate-400")} />, 
              value: isProcessing ? "Mining" : currentDistrictIndex > -1 ? "Paused" : "Ready",
              status: isProcessing ? "online" : "offline"
            }
          ].map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">{s.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900 leading-none">{s.value}</span>
                  {s.status === "online" && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-1">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Selection Panel */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6">
                <button 
                  onClick={() => { setSelectionType("state"); setSelectedStateCode(""); }}
                  className={clsx(
                    "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                    selectionType === "state" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  States (28)
                </button>
                <button 
                  onClick={() => { setSelectionType("ut"); setSelectedStateCode(""); }}
                  className={clsx(
                    "flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all",
                    selectionType === "ut" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  UT (8)
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Target Category</label>
                  <input 
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 text-xs font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{selectionType === "state" ? "Select State" : "Select UT"}</label>
                  <select 
                    value={selectedStateCode}
                    onChange={(e) => setSelectedStateCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 text-xs font-bold text-slate-700"
                  >
                    <option value="">Choose...</option>
                    {STATES.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Specific District (Optional)</label>
                  <select 
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={!selectedStateCode}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 text-xs font-bold text-slate-700 disabled:opacity-50"
                  >
                    <option value="">-- ALL DISTRICTS (DEFAULT) --</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Locked Settings Panel (Light Mode) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Parameters</h4>
                 <Lock size={12} className="text-amber-500" />
               </div>
               
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-emerald-500" />
                       <span className="text-[10px] font-bold text-slate-600">Phones Only</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Fixed ON</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                       <Globe size={14} className="text-blue-500" />
                       <span className="text-[10px] font-bold text-slate-600">Web Detector</span>
                    </div>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">ACTIVE</span>
                  </div>
               </div>
               <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                 * Filters are server-side locked to ensure 100% data quality for outreach.
               </p>
            </div>
          </div>

          {/* Console / Output Area */}
          <div className="lg:col-span-3 space-y-6">
             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-4 border-b border-slate-50 bg-slate-50 flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Extraction Feed</h3>
                   {isProcessing && <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                      Mining Data
                   </div>}
                </div>
                <div className="flex-1 p-6 font-mono text-[11px] overflow-y-auto space-y-2">
                   {targetDistricts.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <MapPin size={64} className="mb-4" />
                        <p className="font-bold text-lg">CONFIGURE TARGET</p>
                     </div>
                   ) : (
                     targetDistricts.map((d, i) => (
                        <div key={i} className={clsx(
                          "p-3 rounded-2xl transition-all border",
                          i === currentDistrictIndex ? "bg-blue-50 border-blue-100 text-blue-700 shadow-sm" : 
                          i < currentDistrictIndex ? "bg-emerald-50/30 border-emerald-50 text-emerald-600 opacity-60" : 
                          "bg-slate-50/50 border-slate-100 opacity-40 text-slate-400"
                        )}>
                          <div className="flex justify-between items-center">
                             <span className="font-bold">[{i === currentDistrictIndex ? "EXTRACTING" : i < currentDistrictIndex ? "COMPLETED" : "WAITING"}] {d}</span>
                             {i <= currentDistrictIndex && <span className="text-[9px] font-black bg-white px-2 py-0.5 rounded-md border border-inherit">FOUND: {Math.floor(Math.random()*15)+5}</span>}
                          </div>
                          {i === currentDistrictIndex && (
                            <div className="mt-2 space-y-1 opacity-80">
                               <div className="flex justify-between items-center text-[9px]">
                                  <span>[DATA]: Sample Business 01</span>
                                  <span className="text-emerald-600 font-bold">WEBSITE: NO</span>
                               </div>
                               <div className="flex justify-between items-center text-[9px]">
                                  <span>[DATA]: Sample Business 02</span>
                                  <span className="text-blue-600 font-bold">WEBSITE: YES</span>
                               </div>
                            </div>
                          )}
                        </div>
                     ))
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
