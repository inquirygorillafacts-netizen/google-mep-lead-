"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserIcon, LogOut, CreditCard, ChevronRight, ShieldCheck, Zap, Mail, Crown, Settings, Bell, CircleHelp, Moon, Sun, CheckCircle2, Download } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePWA } from "@/context/PWAContext";

export default function ProfilePage() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const { installPWA, isInstallable } = usePWA();
  
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showEditName, setShowEditName] = useState(false);
  const [tempName, setTempName] = useState(user?.displayName || "");
  const [editSuccess, setEditSuccess] = useState(false);

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const handleSaveName = () => {
    // In a real app we'd call updateProfile(auth.currentUser, { displayName: tempName })
    // For now, mock success:
    setEditSuccess(true);
    setShowEditName(false);
    setTimeout(() => setEditSuccess(false), 3000);
  };
  return (
    <div className="min-h-full bg-background px-4 pt-10 md:pt-12 md:px-12 max-w-6xl w-full mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">Account</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your professional B2B profile</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-5 lg:col-span-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="premium-card p-6 text-center"
          >
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-primary-gradient rounded-full p-1 shadow-xl shadow-primary/20">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-primary text-3xl font-black overflow-hidden border-2 border-white">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="italic">{user?.displayName?.charAt(0) || "U"}</span>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                <Zap size={12} fill="currentColor" />
              </div>
            </div>
            
            <HeaderNameDisplay 
              name={tempName || user?.displayName || "User"} 
              isEditing={showEditName}
              onEdit={() => setShowEditName(true)}
              onCancel={() => setShowEditName(false)}
              onSave={handleSaveName}
              tempName={tempName}
              setTempName={setTempName}
            />

            {editSuccess && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-green-500 text-xs font-bold flex justify-center items-center gap-1 mb-2">
                <CheckCircle2 size={12} /> Profile Updated
              </motion.div>
            )}

            <p className="text-slate-400 text-xs font-bold flex items-center justify-center gap-1 mb-6">
              <Mail size={12} /> {user?.email || "No Email Provided"}
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 group cursor-pointer hover:bg-slate-900 hover:text-white transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors">Workspace Status</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary group-hover:text-primary-light">Enterprise</span>
              </div>
              <div className="flex items-center gap-2 font-black text-sm">
                <Crown size={18} className="text-primary" />
                BharatPWA Pro Active
              </div>
            </div>

            <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center text-sm shadow-lg hover:bg-primary transition-all active:scale-95">
              <Settings size={16} className="mr-2" /> Workspace Settings
            </button>
          </motion.div>
        </div>

          {/* Right Column: Details & Actions */}
          <div className="md:col-span-7 lg:col-span-8 space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {/* Personal Information */}
                <button
                  onClick={() => setShowEditName(true)}
                  className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserIcon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Edit<br/>Profile</span>
                </button>

                {/* Notifications */}
                <button
                  onClick={() => setNotifications(!notifications)}
                  className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 group relative"
                >
                  <div className={clsx("absolute top-2 right-2 w-2 h-2 rounded-full", notifications ? "bg-green-500 shadow-green-500/50 shadow-sm" : "bg-slate-200")} />
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bell size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Alerts<br/>{notifications ? "On" : "Off"}</span>
                </button>

                {/* Billing */}
                <button
                  onClick={() => router.push("/pricing")}
                  className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Billing &<br/>Plans</span>
                </button>
                
                {/* Theme Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {darkMode ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
                  </div>
                  <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Theme<br/>{darkMode ? "Dark" : "Light"}</span>
                </button>

                {/* Help Line */}
                <a
                  href="mailto:support@bharatpwa.com"
                  className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CircleHelp size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Help<br/>Center</span>
                </a>

                {/* PWA Install */}
                {isInstallable && (
                  <button
                    onClick={installPWA}
                    className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-all active:scale-95 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Download size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black text-blue-700 text-center leading-tight">Install<br/>BharatPWA</span>
                  </button>
                )}

                {/* Logout Section Compact */}
                <button
                  onClick={handleLogout}
                  className="p-3 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <LogOut size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black text-rose-600 text-center leading-tight">Sign<br/>Out</span>
                </button>
              </div>
            </motion.div>
          </div>
      </div>
    </div>
  );
}

function HeaderNameDisplay({ name, isEditing, onEdit, onCancel, onSave, tempName, setTempName }: any) {
  if (isEditing) {
    return (
      <div className="flexitems-center justify-center gap-2 mb-1 px-4">
        <input 
          autoFocus
          className="border-b-2 border-primary bg-transparent outline-none text-center text-xl font-black text-slate-900 w-full mb-2"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          placeholder="Enter your name"
        />
        <div className="flex gap-2 justify-center mb-2">
           <button onClick={onCancel} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
           <button onClick={onSave} className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full">Save</button>
        </div>
      </div>
    );
  }

  return (
    <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center justify-center gap-2">
      {name}
    </h2>
  );
}
