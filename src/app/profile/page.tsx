"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserIcon, LogOut, CreditCard, ChevronRight, ShieldCheck, Zap, Mail, Crown, Settings, Bell, CircleHelp, Moon, Sun, CheckCircle2, Download, X, Phone, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { usePWA } from "@/context/PWAContext";

export default function ProfilePage() {
  const { user, userData, logOut } = useAuth();
  const router = useRouter();
  const { installPWA, isInstallable } = usePWA();
  
  const getDaysRemaining = () => {
    if (!userData?.expiryDate) return null;
    const expiry = new Date(userData.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining === 0 && userData?.plan !== "free";
  
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showEditName, setShowEditName] = useState(false);
  const [tempName, setTempName] = useState(user?.displayName || "");
  const [editSuccess, setEditSuccess] = useState(false);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

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
                    <img 
                      src={user.photoURL} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
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

            <div 
              onClick={() => router.push("/pricing")}
              className={clsx(
                "rounded-2xl p-4 border mb-6 group cursor-pointer transition-all shadow-sm",
                isExpired 
                  ? "bg-rose-50 border-rose-100 hover:bg-rose-100" 
                  : "bg-slate-50 border-slate-100 hover:bg-slate-900 hover:text-white"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors">Workspace Status</span>
                <span className={clsx(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                  userData?.plan === "free" ? "text-blue-500 bg-blue-50" : 
                  isExpired ? "text-rose-500 bg-rose-100" : "text-primary bg-primary/10"
                )}>
                  {userData?.plan === "free" ? "Free" : isExpired ? "Expired" : "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between font-black text-sm">
                <div className="flex items-center gap-2">
                  <Crown size={18} className={isExpired ? "text-rose-400" : "text-primary"} />
                  <span className="capitalize">{userData?.plan || "Free"} Plan</span>
                </div>
                <span className="text-[10px] opacity-60">
                  {userData?.plan === "free" ? "Permanent" : isExpired ? "Renew Now" : `${daysRemaining}d left`}
                </span>
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
                <button
                  onClick={() => setShowHelpDrawer(true)}
                  className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CircleHelp size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Help<br/>Center</span>
                </button>

                {/* PWA Install */}
                {isInstallable && (
                  <button
                    onClick={installPWA}
                    className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-all active:scale-95 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Download size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black text-blue-700 text-center leading-tight">Install<br/>LeadGorilla</span>
                  </button>
                )}

                {/* Guide Button - Highlighted */}
                <button
                  onClick={() => router.push("/guide")}
                  className="p-3 bg-primary/10 rounded-2xl border-2 border-primary/20 shadow-lg shadow-primary/5 flex flex-col items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all active:scale-95 group relative overflow-hidden"
                >
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white flex items-center justify-center rounded-bl-xl">
                    <Zap size={10} fill="currentColor" className="animate-pulse" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <BookOpen size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black text-primary group-hover:text-white text-center leading-tight uppercase tracking-widest">Mastery<br/>Guide</span>
                </button>

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

      <AnimatePresence>
        {showHelpDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpDrawer(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-[60] shadow-2xl safe-area-bottom md:max-w-md md:mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-none mb-2">Help & Support</h3>
                  <p className="text-slate-500 text-sm font-medium">How would you like to connect?</p>
                </div>
                <button 
                  onClick={() => setShowHelpDrawer(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <a
                  href="tel:8302806913"
                  className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Phone size={24} fill="currentColor" className="opacity-20 absolute" />
                    <Phone size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-blue-900">Call Us</span>
                    <span className="text-xs font-bold text-blue-600/80">+91 8302806913</span>
                  </div>
                  <ChevronRight size={18} className="ml-auto text-blue-300" />
                </a>

                <a
                  href="https://wa.me/918302806913"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 bg-green-50 rounded-2xl border border-green-100 hover:bg-green-100 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white text-green-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <MessageSquare size={24} fill="currentColor" className="opacity-20 absolute" />
                    <MessageSquare size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-green-900">WhatsApp Support</span>
                    <span className="text-xs font-bold text-green-600/80">Instant Chat</span>
                  </div>
                  <ChevronRight size={18} className="ml-auto text-green-300" />
                </a>
              </div>

              <div className="mt-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Available 10 AM - 7 PM</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeaderNameDisplay({ name, isEditing, onEdit, onCancel, onSave, tempName, setTempName }: any) {
  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-2 mb-1 px-4">
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
