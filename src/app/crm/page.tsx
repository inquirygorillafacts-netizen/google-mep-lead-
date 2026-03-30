"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  MessageCircle, 
  Search, 
  Filter, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Database,
  Star,
  Globe,
  Zap,
  CheckSquare,
  Square,
  StickyNote,
  Loader2,
  Trash2,
  Trash
} from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FETCH_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

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
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    setLoading(true);
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
        const formatted = data
          .filter((item: any) => item.document) 
          .map((item: any) => {
            const doc = item.document;
            return {
              id: doc.name.split("/").pop(),
              name: doc.fields.name?.stringValue || "N/A",
              phone: doc.fields.phone?.stringValue || "N/A",
              rating: doc.fields.rating?.stringValue || "0",
              reviews: doc.fields.reviews?.integerValue || "0",
              website: doc.fields.website?.stringValue || "",
              maps_url: doc.fields.maps_url?.stringValue || "",
              crmStatus: doc.fields.crmStatus?.stringValue || "new",
              notes: doc.fields.notes?.stringValue || "",
              address: doc.fields.address?.stringValue || "N/A",
              timestamp: doc.fields.timestamp?.timestampValue || "",
            };
          })
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const deleteLead = async (id: string) => {
    openConfirm(
      "Remove CRM Lead?",
      "Are you sure you want to delete this lead from your CRM? This action is permanent and will remove it from the database.",
      async () => {
        setLeads(prev => prev.filter(l => l.id !== id));
        fetch(`/api/crm?id=${id}`, { method: "DELETE" });
        closeConfirm();
      }
    );
  };

  const filteredLeads = leads.filter(l => {
    const matchesTab = activeTab === "all" || l.crmStatus === activeTab;
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.phone.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  return (
    <div className="min-h-full bg-slate-50/50 px-3 pt-6 md:pt-8 md:px-10 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1 leading-tight">CRM Pipeline</h1>
          <p className="text-slate-500 text-xs font-semibold">Manage and nurture your extracted B2B leads.</p>
        </motion.div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { label: "New Leads", count: leads.filter(l => l.crmStatus === 'new').length, color: "bg-blue-500" },
          { label: "In Progress", count: leads.filter(l => ['contacted', 'follow_up', 'interested'].includes(l.crmStatus)).length, color: "bg-purple-500" },
          { label: "Completed", count: leads.filter(l => l.crmStatus === 'paid').length, color: "bg-emerald-500" },
          { label: "Lost", count: leads.filter(l => l.crmStatus === 'rejected').length, color: "bg-rose-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-3 flex items-center gap-3 rounded-xl border border-slate-100 shadow-sm">
            <div className={clsx("w-1 h-6 rounded-full", stat.color)} />
            <div>
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
              <p className="text-sm font-black text-slate-900">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Pipeline Stage</label>
              <div className="flex flex-col gap-1">
                {CRM_STATUSES.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setActiveTab(status.id)}
                    className={clsx(
                      "text-left px-3 py-1.5 rounded-md text-[11px] font-bold transition-all capitalize flex items-center gap-2",
                      activeTab === status.id ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Filter className="text-primary" size={12} />
              Lead Repository ({filteredLeads.length})
            </h3>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs">Loading leads...</div>
            ) : (
              filteredLeads.map((lead, idx) => (
                <LeadCard 
                  key={lead.id} 
                  lead={lead} 
                  idx={idx} 
                  isSelected={selectedLeads.has(lead.id)}
                  onToggle={() => toggleSelect(lead.id)}
                  onStatusUpdate={(status: string) => updateStatus(lead.id, status)}
                  onNoteUpdate={(notes: string) => updateNotes(lead.id, notes)}
                  onDelete={() => deleteLead(lead.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* In-App Premium Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeConfirm}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{confirmModal.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{confirmModal.message}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={closeConfirm}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-600/20"
                >
                   Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
  onDelete: () => void;
}

function LeadCard({ lead, idx, isSelected, onToggle, onStatusUpdate, onNoteUpdate, onDelete }: LeadCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotePad, setShowNotePad] = useState(false);
  const [noteText, setNoteText] = useState(lead.notes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (noteText === lead.notes) return;
    
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      onNoteUpdate(noteText);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [noteText]);

  const activeStatus = CRM_STATUSES.find(s => s.id === lead.crmStatus) || CRM_STATUSES[1];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02 }}
      className={clsx(
        "bg-white rounded-xl border shadow-sm transition-all relative",
        isSelected ? "border-primary" : "border-slate-100",
        showStatusMenu && "z-50"
      )}
    >
      <div className="p-3 flex items-center gap-4">
        <button onClick={onToggle} className={clsx("p-1", isSelected ? "text-primary" : "text-slate-200")}>
          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-black text-slate-900 truncate">{lead.name}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase">{lead.address?.split(",")[0] || "No Address"}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-slate-600 font-mono">{lead.phone || "No Number"}</div>
          
          <div className="relative">
            <button 
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                activeStatus.bg, activeStatus.color, "border-current/20"
              )}
            >
              {isUpdating ? <Loader2 size={10} className="animate-spin" /> : activeStatus.label}
              <ChevronDown size={10} className={clsx("transition-transform", showStatusMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showStatusMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-30 min-w-[120px]"
                >
                  {CRM_STATUSES.filter(s => s.id !== "all").map(s => (
                    <button
                      key={s.id}
                      onClick={async () => {
                        setIsUpdating(true);
                        await onStatusUpdate(s.id);
                        setIsUpdating(false);
                        setShowStatusMenu(false);
                      }}
                      className={clsx(
                        "w-full flex items-center px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        s.id === lead.crmStatus ? `${s.bg} ${s.color}` : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotePad(!showNotePad)}
              className={clsx(
                "p-2 rounded-lg transition-all border",
                showNotePad ? "bg-primary/10 border-primary text-primary" : "bg-slate-50 border-slate-100 text-slate-400 hover:text-primary"
              )}
              title="Add Note"
            >
              <StickyNote size={14} />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all"
              title="Delete Lead"
            >
              <Trash2 size={14} />
            </button>
            <a 
              href={lead.maps_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-all"
              title="Open Google My Business Profile"
            >
              <Globe size={14} />
            </a>
            <a 
              href={`tel:${lead.phone}`}
              className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <Phone size={14} />
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showNotePad && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 border-t border-slate-50"
          >
             <div className="mt-3 relative">
              <textarea 
                autoFocus
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-medium outline-none focus:border-primary transition-all h-20 placeholder:text-slate-300"
                placeholder="Type lead specific notes here..."
              />
              <div className="absolute bottom-2 right-3 flex items-center gap-1.5 pointer-events-none">
                {saveStatus === "saving" && (
                  <>
                    <Loader2 size={10} className="animate-spin text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-primary">Saving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">Saved</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
