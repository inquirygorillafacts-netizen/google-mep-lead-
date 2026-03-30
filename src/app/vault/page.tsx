"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Table, Phone, MapPin, Star, ShieldCheck, ExternalLink, Search, Trash2, CheckCircle2, Send, Filter, CheckSquare, Square } from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF, Lead } from "@/lib/utils/export";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";

const FIREBASE_PROJECT_ID = "studio-3850868995-4f1cf";
const FETCH_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

export default function VaultPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState<any[]>([]);
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const commitFromUrl = searchParams.get("commit");
    if (commitFromUrl) {
      setSelectedCommitId(commitFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchLeads(), fetchCommits()]);
    setLoading(false);
  };

  const fetchCommits = async () => {
    if (!user) return;
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
        },
      };

      const res = await fetch(FETCH_URL, {
        method: "POST",
        body: JSON.stringify(query),
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const formatted = data
          .filter((item: any) => item.document)
          .map((item: any) => {
            const doc = item.document;
            return {
              id: doc.name.split("/").pop(),
              category: doc.fields.category?.stringValue || "N/A",
              city: doc.fields.city?.stringValue || "N/A",
              state: doc.fields.state?.stringValue || "N/A",
              count: doc.fields.leadCount?.integerValue || "0",
              timestamp: doc.fields.timestamp?.timestampValue || "",
            };
          })
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setCommits(formatted);
        if (formatted.length > 0 && !selectedCommitId) setSelectedCommitId(formatted[0].id);
      }
    } catch (e) {
      console.error("Error fetching commits:", e);
    }
  };

  const fetchLeads = async () => {
    if (!user) return;
    try {
      const query = {
        structuredQuery: {
          from: [{ collectionId: "spa_leads" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "userId" },
              op: "EQUAL",
              value: { stringValue: user.uid },
            },
          },
        },
      };

      const res = await fetch(FETCH_URL, {
        method: "POST",
        body: JSON.stringify(query),
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const formatted: Lead[] = data
          .filter((item: any) => item.document)
          .map((item: any) => {
            const doc = item.document;
            return {
              Name: doc.fields.name?.stringValue || "N/A",
              Phone: doc.fields.phone?.stringValue || "N/A",
              Address: doc.fields.address?.stringValue || "N/A",
              Rating: doc.fields.rating?.stringValue || "N/A",
              Reviews: doc.fields.reviews?.integerValue || "0",
              EstPrice: doc.fields.est_price?.stringValue || "N/A",
              Status: doc.fields.status?.stringValue || "New",
              commitId: doc.fields.commitId?.stringValue || "legacy",
              id: doc.name.split("/").pop(),
            };
          });
        setLeads(formatted);
      }
    } catch (e) {
      console.error("Error fetching leads:", e);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: string) => {
    setLoading(true);
    // Mocking Firestore update for now
    setLeads(prev => prev.map(l => l.id === id ? { ...l, Status: newStatus } : l));
    setLoading(false);
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const deleteCommit = async (id: string) => {
    if (!confirm("Delete this entire commit batch and all its leads?")) return;
    setCommits(prev => prev.filter(c => c.id !== id));
    setLeads(prev => prev.filter(l => l.commitId !== id));
    if (selectedCommitId === id) setSelectedCommitId(null);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id as string)));
    }
  };

  const toggleSelectLead = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  const sendSelectedToCampaign = () => {
    const selectedData = leads.filter(l => selectedLeads.has(l.id as string));
    const numbers = selectedData.map(l => l.Phone).join(",");
    router.push(`/campaigns?numbers=${encodeURIComponent(numbers)}`);
  };

  const STAGES = [
    { id: "New", label: "Outreach 1" },
    { id: "Contacted", label: "Outreach 2" },
    { id: "Sample Sent", label: "Sample" },
    { id: "Payment Pending", label: "Payment" },
    { id: "Deal Closed", label: "Complete" }
  ];

  const getStageIndex = (status: string) => {
    const idx = STAGES.findIndex(s => s.id === status);
    return idx === -1 ? 0 : idx;
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.Name.toLowerCase().includes(searchTerm.toLowerCase()) || l.Phone.includes(searchTerm);
    const matchesCommit = selectedCommitId ? l.commitId === selectedCommitId : true;
    const matchesFilter = filterStatus === "All" ? true : l.Status === filterStatus;
    return matchesSearch && matchesCommit && matchesFilter;
  });

  return (
    <div className="min-h-full bg-background px-3 pt-6 md:pt-8 md:px-10 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-primary font-black text-[9px] uppercase tracking-widest">
            <ShieldCheck size={12} />
            Secure Vault
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-0.5 leading-tight">Lead Vault</h1>
          <p className="text-slate-500 text-[10px] font-bold">{leads.length} Records Verified</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
             {["All", "New", "Outreach", "Won"].map((s) => (
               <button 
                key={s}
                onClick={() => setFilterStatus(s === "Won" ? "Deal Closed" : s === "Outreach" ? "Contacted" : s)}
                className={clsx(
                  "px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all",
                  (filterStatus === s || (s === "Won" && filterStatus === "Deal Closed") || (s === "Outreach" && filterStatus === "Contacted")) ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
               >
                 {s}
               </button>
             ))}
          </div>

          <div className="relative hidden lg:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all w-48"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg font-black flex items-center text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={14} className="mr-2 text-primary" />
              Export
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                   initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                   className="absolute right-0 mt-3 w-56 glass rounded-2xl shadow-2xl border border-white/40 overflow-hidden z-20 p-2"
                >
                  <button onClick={() => { exportToCSV(leads); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white/60 rounded-xl flex items-center transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3">
                      <FileText size={16} className="text-red-500" />
                    </div>
                    CSV Spreadsheet
                  </button>
                  <button onClick={() => { exportToExcel(leads); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white/60 rounded-xl flex items-center transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mr-3">
                      <Table size={16} className="text-green-500" />
                    </div>
                    Excel (XLSX)
                  </button>
                  <button onClick={() => { exportToPDF(leads); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white/60 rounded-xl flex items-center transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
                      <FileText size={16} className="text-indigo-500" />
                    </div>
                    PDF Document
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
          />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing encrypted vault...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Selection Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {commits.map((commit, idx) => (
                <div key={commit.id} className="relative group shrink-0">
                  <button
                    onClick={() => setSelectedCommitId(commit.id)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all border",
                      selectedCommitId === commit.id 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <div className="flex flex-col items-start leading-tight">
                      <span className="opacity-60 text-[8px] uppercase tracking-tighter">#{commits.length - idx}</span>
                      <span className="truncate max-w-[100px] font-black">{commit.category}</span>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteCommit(commit.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                  >
                    <Trash2 size={8} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors shrink-0 uppercase tracking-widest"
            >
              {selectedLeads.size === filteredLeads.length && filteredLeads.length > 0 ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} />}
              All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead, i) => {
                const isSelected = selectedLeads.has(lead.id as string);
                const currentStageIdx = getStageIndex(lead.Status);

                return (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={clsx(
                      "premium-card p-4 group flex flex-col h-full bg-white transition-all border",
                      isSelected ? "border-primary ring-1 ring-primary/10" : "border-slate-100"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button 
                          onClick={() => toggleSelectLead(lead.id as string)}
                          className={clsx(
                            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all mt-0.5",
                            isSelected ? "bg-primary border-primary text-white" : "border-slate-200"
                          )}
                        >
                          {isSelected && <CheckSquare size={12} />}
                        </button>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-xs truncate leading-tight" title={lead.Name}>
                            {lead.Name}
                          </h3>
                          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                            <Star size={10} className="text-amber-400 fill-amber-400" /> {lead.Rating} • {lead.Reviews} REVS
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteLead(lead.id as string)}
                        className="w-7 h-7 rounded-lg text-rose-300 hover:text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Processing Pipeline UI */}
                    <div className="mb-6 px-1">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Processing Pipeline</p>
                        <p className="text-[9px] font-black uppercase text-primary bg-primary/5 px-1.5 py-0.5 rounded-md">
                          Stage {currentStageIdx + 1}/5
                        </p>
                      </div>
                      <div className="relative flex justify-between h-8 items-center bg-slate-50 rounded-full px-2 mt-3">
                        {/* Connecting Line */}
                        <div className="absolute left-6 right-6 h-0.5 bg-slate-200 z-0" />
                        <motion.div 
                          initial={false}
                          animate={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
                          className="absolute left-6 h-0.5 bg-primary z-0 origin-left" 
                        />
                        
                        {STAGES.map((stage, idx) => {
                          const isDone = idx <= currentStageIdx;
                          const isCurrent = idx === currentStageIdx;
                          return (
                            <button
                              key={stage.id}
                              onClick={() => updateLeadStatus(lead.id as string, stage.id)}
                              className="relative z-10 group/stage"
                              title={stage.label}
                            >
                              <div className={clsx(
                                "w-3 h-3 rounded-full transition-all duration-300 border-2",
                                isDone ? "bg-primary border-primary scale-125 shadow-[0_0_10px_rgba(37,99,235,0.3)]" : "bg-white border-slate-300 group-hover/stage:border-slate-400"
                              )} />
                              {isCurrent && (
                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-primary whitespace-nowrap uppercase tracking-tighter">
                                  {stage.label}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center text-[11px] font-bold text-slate-700">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center mr-2.5 shrink-0">
                          <Phone size={12} className="text-blue-500" />
                        </div>
                        {lead.Phone}
                      </div>
                      
                      <div className="flex items-start text-[10px] text-slate-500 leading-tight min-h-[32px]">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center mr-2.5 shrink-0">
                          <MapPin size={12} className="text-rose-500" />
                        </div>
                        <span className="line-clamp-2 mt-0.5">{lead.Address}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <a
                        href={`tel:${lead.Phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-sm"
                      >
                        <Phone size={12} /> Call Lead
                      </a>
                      <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all border border-slate-100">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredLeads.length === 0 && !loading && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                  <Search size={32} strokeWidth={1} />
                </div>
                <p className="font-bold text-slate-500">No matching leads discovered</p>
                <p className="text-xs mt-1">Try adjusting your search filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedLeads.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-[95%] max-w-xl mx-auto"
          >
            <div className="bg-slate-900 text-white rounded-2xl p-3 pr-4 flex items-center justify-between shadow-2xl border border-slate-700 backdrop-blur-md bg-slate-900/95">
              <div className="flex items-center gap-3 pl-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-black text-xs">
                  {selectedLeads.size}
                </div>
                <div>
                  <p className="font-black text-[11px] leading-tight">Selected</p>
                  <p className="text-[8px] text-slate-400 uppercase tracking-widest">Leads</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { if(confirm("Delete selected?")) { setLeads(prev => prev.filter(l => !selectedLeads.has(l.id as string))); setSelectedLeads(new Set()); }}}
                  className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={sendSelectedToCampaign}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-light transition-all shadow-lg shadow-primary/20"
                >
                  <Send size={14} />
                  Outreach
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
