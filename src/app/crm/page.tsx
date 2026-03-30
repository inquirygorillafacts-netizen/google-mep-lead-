"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  MessageCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Database,
  Star,
  Globe,
  Send,
  User,
  Zap,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  StickyNote
} from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const FIREBASE_PROJECT_ID = "studio-3850868995-4f1cf";
const FETCH_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/spa_leads`;

const CRM_STATUSES = [
  { id: "all", label: "All Leads", icon: <Database size={14} />, color: "text-slate-500", bg: "bg-slate-50" },
  { id: "new", label: "New", icon: <Zap size={14} />, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "contacted", label: "Contacted", icon: <MessageCircle size={14} />, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "follow_up", label: "Follow Up", icon: <Clock size={14} />, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "interested", label: "Hot Lead", icon: <Star size={14} />, color: "text-green-500", bg: "bg-green-50" },
  { id: "paid", label: "Completed", icon: <CheckCircle2 size={14} />, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "rejected", label: "Lost", icon: <AlertCircle size={14} />, color: "text-rose-500", bg: "bg-rose-50" },
];

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showHighOpportunityOnly, setShowHighOpportunityOnly] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(FETCH_URL + "?pageSize=1000");
      const data = await res.json();
      if (data.documents) {
        const formatted = data.documents.map((doc: any) => ({
          id: doc.name.split("/").pop(),
          name: doc.fields.name?.stringValue || "N/A",
          phone: doc.fields.phone?.stringValue || "N/A",
          rating: doc.fields.rating?.stringValue || "0",
          reviews: doc.fields.reviews?.integerValue || "0",
          website: doc.fields.website?.stringValue || "",
          crmStatus: doc.fields.crmStatus?.stringValue || "new",
          notes: doc.fields.notes?.stringValue || "",
          address: doc.fields.address?.stringValue || "N/A",
          timestamp: doc.fields.timestamp?.timestampValue || "",
        })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLeads(formatted);
      }
    } catch (e) {
      console.error("Error fetching leads:", e);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, crmStatus: newStatus } : l));
    try {
      await fetch("/api/crm", {
        method: "PATCH",
        body: JSON.stringify({ id, crmStatus: newStatus }),
      });
    } catch (e) {
      console.error("Status update sync failed:", e);
    }
  };

  const updateNotes = async (id: string, notes: string) => {
     setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
     try {
       await fetch("/api/crm", {
         method: "PATCH",
         body: JSON.stringify({ id, notes }),
       });
     } catch (e) {
       console.error("Note update sync failed:", e);
     }
  };

  const filteredLeads = leads.filter(l => {
    const matchesTab = activeTab === "all" || l.crmStatus === activeTab;
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.phone.includes(searchTerm);
    const matchesHighOpp = !showHighOpportunityOnly || !l.website;
    return matchesTab && matchesSearch && matchesHighOpp;
  });

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  const startCampaign = () => {
    const selected = leads.filter(l => selectedLeads.has(l.id)).map(l => l.phone).join(",");
    router.push(`/campaigns?recipients=${selected}`);
  };

  return (
    <div className="min-h-full bg-slate-50/50 px-4 pt-10 md:pt-12 md:px-12 max-w-7xl mx-auto pb-32">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Freelancer CRM</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
            <Zap size={14} className="text-primary fill-primary/20" />
            Active Sales Pipeline & Lead Conversion
          </p>
        </motion.div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            />
          </div>
          <button 
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-primary shadow-sm transition-all"
          >
            {viewMode === "grid" ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {CRM_STATUSES.map(status => (
            <button
              key={status.id}
              onClick={() => setActiveTab(status.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                activeTab === status.id 
                  ? `${status.bg} ${status.color} border-current shadow-sm ring-1 ring-current/20`
                  : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
              )}
            >
              {status.icon}
              {status.label}
              <span className={clsx(
                "ml-1.5 px-1.5 py-0.5 rounded-md text-[9px]",
                activeTab === status.id ? "bg-white/50" : "bg-slate-50"
              )}>
                {leads.filter(l => status.id === "all" || l.crmStatus === status.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHighOpportunityOnly(!showHighOpportunityOnly)}
              className={clsx(
                "flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                showHighOpportunityOnly 
                  ? "bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20"
                  : "bg-white text-slate-600 border-slate-100 hover:border-slate-200"
              )}
            >
              <Globe size={16} className={clsx(showHighOpportunityOnly ? "animate-pulse" : "")} />
              {showHighOpportunityOnly ? "Targeting: No Website Only" : "Filter: Without Website"}
            </button>

            {selectedLeads.size > 0 && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={startCampaign}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                <Send size={16} />
                Run Campaign ({selectedLeads.size})
              </motion.button>
            )}
        </div>
      </div>

      {/* Leads Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
           <Zap className="w-12 h-12 text-primary animate-pulse mb-4" />
           <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Decrypting Pipeline Data...</p>
        </div>
      ) : (
        <div className={clsx(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredLeads.map((lead, idx) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              idx={idx} 
              isSelected={selectedLeads.has(lead.id)}
              onToggle={() => toggleSelect(lead.id)}
              onStatusUpdate={(status: string) => updateStatus(lead.id, status)}
              onNoteUpdate={(notes: string) => updateNotes(lead.id, notes)}
            />
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
               <Database className="mx-auto w-12 h-12 text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold">No leads found in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LeadCardProps {
  lead: any;
  idx: number;
  isSelected: boolean;
  onToggle: () => void;
  onStatusUpdate: (status: string) => void;
  onNoteUpdate: (notes: string) => void;
}

function LeadCard({ lead, idx, isSelected, onToggle, onStatusUpdate, onNoteUpdate }: LeadCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotePad, setShowNotePad] = useState(false);
  const [noteText, setNoteText] = useState(lead.notes || "");

  const activeStatus = CRM_STATUSES.find(s => s.id === lead.crmStatus) || CRM_STATUSES[1];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: idx * 0.03 }}
      className={clsx(
        "bg-white rounded-[2rem] p-6 shadow-xl border-2 transition-all relative overflow-hidden group",
        isSelected ? "border-primary bg-primary/[0.02]" : "border-transparent",
        !lead.website && "ring-1 ring-amber-500/10"
      )}
    >
       {!lead.website && (
         <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase rounded-bl-xl shadow-sm z-10">
           High Opportunity
         </div>
       )}

       {parseFloat(lead.rating) >= 4.5 && parseInt(lead.reviews) >= 50 && (
         <div className={clsx(
           "absolute top-0 px-3 py-1 text-white text-[8px] font-black uppercase rounded-br-xl shadow-sm z-10",
           lead.website ? "left-0 bg-indigo-600" : "left-0 bg-indigo-600"
         )}>
           High Value Client
         </div>
       )}

       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
             <button onClick={onToggle} className={clsx("p-1.5 rounded-lg transition-colors", isSelected ? "text-primary" : "text-slate-200 hover:text-slate-300")}>
                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
             </button>
             <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-0.5 line-clamp-1">{lead.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lead.address.split(",")[0]}</p>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 flex flex-col">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead Rating</span>
             <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-black text-slate-700">{lead.rating}</span>
                <span className="text-[10px] text-slate-400 font-bold">({lead.reviews})</span>
             </div>
          </div>
          <div className="flex-1 flex flex-col">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Web Status</span>
             {lead.website ? (
               <a href={lead.website} target="_blank" className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:underline">
                 <Globe size={12} /> View Site
               </a>
             ) : (
               <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                 <AlertCircle size={12} /> No Website
               </div>
             )}
          </div>
       </div>

       <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] font-black text-slate-700 transition-all border border-slate-100 active:scale-95"
          >
             <Phone size={14} className="text-blue-500" />
             Call Lead
          </a>
          <a
            href={`https://wa.me/${lead.phone.replace(/\+/g, '').replace(/\s/g, '')}`}
            target="_blank"
            className="flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-100 rounded-xl text-[11px] font-black text-green-700 transition-all border border-green-100 active:scale-95"
          >
             <MessageCircle size={14} />
             WhatsApp
          </a>
       </div>

       <div className="relative">
          <button 
           onClick={() => setShowStatusMenu(!showStatusMenu)}
           className={clsx(
             "w-full flex items-center justify-between p-3 rounded-2xl transition-all border",
             activeStatus.bg, activeStatus.color, "border-current/20"
           )}
          >
             <div className="flex items-center gap-2">
                {activeStatus.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{activeStatus.label}</span>
             </div>
             <ChevronDown size={14} className={clsx("transition-transform", showStatusMenu && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-20"
              >
                 {CRM_STATUSES.filter(s => s.id !== "all").map(s => (
                   <button
                    key={s.id}
                    onClick={() => {
                      onStatusUpdate(s.id);
                      setShowStatusMenu(false);
                    }}
                    className={clsx(
                      "w-full flex items-center gap-3 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      s.id === lead.crmStatus ? `${s.bg} ${s.color}` : "text-slate-500 hover:bg-slate-50"
                    )}
                   >
                     {s.icon}
                     {s.label}
                   </button>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
       </div>

       <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
          <button 
            onClick={() => setShowNotePad(!showNotePad)}
            className="text-[9px] font-black text-slate-400 uppercase hover:text-primary transition-colors flex items-center gap-2"
          >
             <StickyNote size={14} />
             {lead.notes ? "Edit Note" : "Add Note"}
          </button>
          <span className="text-[8px] font-bold text-slate-300">
            {new Date(lead.timestamp).toLocaleDateString()}
          </span>
       </div>

       <AnimatePresence>
          {showNotePad && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 overflow-hidden">
               <textarea 
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onBlur={() => onNoteUpdate(noteText)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-medium outline-none focus:border-primary transition-all h-20 placeholder:text-slate-300"
                placeholder="Type lead specific notes here..."
               />
            </motion.div>
          )}
       </AnimatePresence>
    </motion.div>
  );
}
