"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Info
} from "lucide-react";
import { INDIA_STATES, WORK_KEYWORDS } from "@/lib/india-districts";

interface Lead {
  name: string;
  phone: string;
  website: string;
}

export default function OwnerBulkPage() {
  // Config
  const [selectedState, setSelectedState] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(WORK_KEYWORDS[0]);
  
  // State
  const [districts, setDistricts] = useState<string[]>([]);
  const [currentDistrictIndex, setCurrentDistrictIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [collectedLeads, setCollectedLeads] = useState<Lead[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalFound: 0,
    skipped: 0,
    moneySaved: 0, // Mock calculation: $0.017 per Details call
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stateObj = INDIA_STATES.find(s => s.state === selectedState);
    setDistricts(stateObj ? stateObj.districts : []);
    setCurrentDistrictIndex(-1);
    setIsProcessing(false);
  }, [selectedState]);

  const startProcessing = async () => {
    if (!selectedState || isProcessing) return;
    setIsProcessing(true);
    
    // Start from wherever we left off or from 0
    let startIndex = currentDistrictIndex === -1 ? 0 : currentDistrictIndex;
    
    for (let i = startIndex; i < districts.length; i++) {
        if (!isProcessing && i !== startIndex) break; // Check if paused
        setCurrentDistrictIndex(i);
        await processDistrict(districts[i]);
    }
    
    setIsProcessing(false);
    if (currentDistrictIndex === districts.length - 1) {
        alert("State processing complete!");
    }
  };

  const processDistrict = async (district: string) => {
    return new Promise<void>((resolve) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const url = "/api/scrape/bulk";
        const body = JSON.stringify({
            category: selectedCategory,
            state: selectedState,
            district: district
        });

        fetch(url, {
            method: "POST",
            body,
            signal: controller.signal
        }).then(async (response) => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                resolve();
                return;
            }

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.replace("data: ", ""));
                            
                            if (data.lead) {
                                setCollectedLeads(prev => [data.lead, ...prev].slice(0, 50)); // Keep last 50 in UI
                                setStats(prev => ({ 
                                    ...prev, 
                                    totalFound: prev.totalFound + 1 
                                }));
                            }

                            if (data.stats) {
                                setStats(prev => ({
                                    ...prev,
                                    skipped: prev.skipped + (data.stats.skippedCounter || 0),
                                    moneySaved: (prev.skipped + (data.stats.skippedCounter || 0)) * 1.5 // 1.5 Rupees approx
                                }));
                            }

                            if (data.complete) {
                                resolve();
                            }
                        } catch (e) {
                            console.error("JSON Parse Error", e);
                        }
                    }
                }
            }
        }).catch(err => {
            console.error("Fetch Error:", err);
            resolve();
        });
    });
  };

  const handleDownload = () => {
    const headers = ["Name", "Phone", "Website"];
    const csvContent = [
        headers.join(","),
        ...collectedLeads.map(l => `"${l.name}","${l.phone}","${l.website}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${selectedState}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">
        {/* Top Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-orange-600/10 rounded-xl text-orange-600 shadow-sm">
              <Zap size={20} className="fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">Lead Extractor <span className="text-orange-600">Beta</span></h1>
                <span className="px-2 py-0.5 bg-slate-200 border border-slate-300 rounded-md text-[10px] font-bold text-slate-600">V2.5 SPECIFIC</span>
              </div>
              <p className="text-slate-500 text-[11px] font-medium uppercase tracking-tight">State-wide Hyper-Mining Dashboard for Professionals</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
             <button 
                onClick={startProcessing}
                disabled={!selectedState || isProcessing}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-extrabold text-xs transition-all ${
                    isProcessing ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-95"
                }`}
              >
                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Play fill="currentColor" size={14} />}
                {isProcessing ? "Mining..." : "Start Sequence"}
              </button>
              
              <button 
                onClick={() => setIsProcessing(false)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 text-slate-600"
                title="Pause"
              >
                <Pause fill="currentColor" size={14} />
              </button>
              
              <div className="w-px h-6 bg-slate-200 mx-1" />

              <button 
                onClick={handleDownload}
                disabled={collectedLeads.length === 0}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-30 transition-all font-mono"
              >
                <Download size={14} />
                CSV
              </button>
          </div>
        </div>

        {/* Stats Row - Light Mode */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Extraction Yield", value: stats.totalFound, icon: Target, color: "text-blue-600", bg: "bg-blue-600/10" },
            { label: "Existing (Skipped)", value: stats.skipped, icon: History, color: "text-slate-400", bg: "bg-slate-100" },
            { label: "Est. Savings", value: `₹${stats.moneySaved.toFixed(0)}`, icon: AlertTriangle, color: "text-emerald-600", bg: "bg-emerald-600/10" },
            { 
              label: `District: ${districts[currentDistrictIndex] || "Idle"}`, 
              value: `${currentDistrictIndex + 1}/${districts.length}`, 
              icon: MapPin, 
              color: "text-orange-600", 
              bg: "bg-orange-600/10",
              progress: ((currentDistrictIndex + 1) / (districts.length || 1)) * 100
            }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black tracking-tight text-slate-900">{stat.value}</h3>
                        {stat.progress !== undefined && (
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${stat.progress}%` }} />
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Settings */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 p-5 rounded-[1.5rem] shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Sliders size={14} className="text-blue-600" />
                    Mining Config
                </h4>
                
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Target State</label>
                        <select 
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700"
                        >
                            <option value="">Select State</option>
                            {INDIA_STATES.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Work Keyword</label>
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-600 transition-all text-xs font-bold text-slate-700"
                        >
                            {WORK_KEYWORDS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer group">
                        <span className="text-[11px] font-bold text-slate-600">No-Website ONLY</span>
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 accent-orange-600 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.checked) setCollectedLeads(prev => prev.filter(l => !l.website));
                            }}
                        />
                    </div>

                    <div className="p-3.5 bg-blue-600/5 border border-blue-600/10 rounded-xl relative overflow-hidden">
                        <p className="text-[10px] text-blue-600 font-bold leading-relaxed relative z-10">
                            Automatic iteration enabled for <span className="font-black">{districts.length} districts</span>. 
                            Potential yield: <span className="font-black">~{districts.length * 40} leads</span>.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-[1.5rem] shadow-lg border border-white/10 relative overflow-hidden text-white">
                <h4 className="text-sm font-black mb-1 relative z-10 text-white">Safe-Export Engine</h4>
                <p className="text-[10px] text-blue-100/80 mb-4 font-medium relative z-10 leading-tight">Batch formatting for WhatsApp API.</p>
                <button 
                    onClick={handleDownload}
                    className="w-full bg-white text-blue-700 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-md active:scale-95"
                >
                    <Download size={14} />
                    Download CSV
                </button>
            </div>
          </div>

          {/* Right Panel: Feed */}
          <div className="lg:col-span-9">
            <div className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm flex flex-col min-h-[calc(100vh-280px)] max-h-[calc(100vh-280px)] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isProcessing ? "bg-orange-500 animate-pulse" : "bg-slate-300"}`} />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            Global Feed
                            <span className="text-slate-300 text-[10px]">/</span>
                            <span className="text-slate-400 font-mono text-[10px] lowercase">{districts[currentDistrictIndex] || "standby"}</span>
                        </h4>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20">
                    {collectedLeads.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 grayscale opacity-60">
                             <div className="relative mb-6">
                                <Search size={64} className="text-slate-200" />
                                <MapPin size={24} className="absolute -bottom-2 -right-2 text-slate-300" />
                             </div>
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Scanner Offline</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {collectedLeads.map((lead, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all group relative overflow-hidden">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-orange-600/5 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shrink-0">
                                            <Play size={10} fill="currentColor" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[12px] text-slate-800 truncate group-hover:text-blue-700 transition-colors capitalize">{lead.name}</p>
                                            <div className="flex items-center gap-4 mt-0.5">
                                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold font-mono">
                                                    <Phone size={10} className="text-slate-400" />
                                                    {lead.phone}
                                                </span>
                                                {lead.website && (
                                                    <span className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-black uppercase tracking-tighter">
                                                        <Globe size={10} />
                                                        Web
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 pl-2">
                                        <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-md uppercase tracking-widest border border-blue-100">
                                            SAVED
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
