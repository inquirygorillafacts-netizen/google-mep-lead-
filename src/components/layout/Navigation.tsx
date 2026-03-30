"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Layers, MessageSquare, CreditCard, Wallet, UserCircle2, ChevronRight, LogOut, Search, Database, MessageCircle, User, Command, Zap } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Hunter", path: "/", icon: Compass, color: "text-blue-500", key: "h" },
  { name: "CRM", path: "/crm", icon: UserCircle2, color: "text-indigo-500", key: "c" },
  { name: "Vault", path: "/vault", icon: Layers, color: "text-purple-500", key: "v" },
  { name: "Campaigns", path: "/campaigns", icon: MessageSquare, color: "text-green-500", key: "m" },
  { name: "Profile", path: "/profile", icon: User, color: "text-slate-500", key: "p" },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logOut } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let gPressed = false;
    let gTimeout: any = null;

    const down = (e: KeyboardEvent) => {
      // Ctrl+K for Palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
        return;
      }

      // 'G' then [Key] navigation
      // Only trigger if not in an input/textarea
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      if (e.key.toLowerCase() === "g" && !isCommandPaletteOpen && !isInput) {
        gPressed = true;
        clearTimeout(gTimeout);
        gTimeout = setTimeout(() => { gPressed = false; }, 800); // 800ms window
        return;
      }

      if (gPressed && !isCommandPaletteOpen && !isInput) {
        const item = navItems.find(n => n.key === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          router.push(item.path);
          gPressed = false;
          handleVibrate();
        }
      }

      if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => {
      document.removeEventListener("keydown", down);
      clearTimeout(gTimeout);
    };
  }, [isCommandPaletteOpen, router]);

  const handleVibrate = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Hide navigation on login page
  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile Bottom Navigation (Native iOS Style - Denser) */}
      <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white/90 backdrop-blur-xl border-t border-slate-200/50 md:hidden flex justify-around items-center z-[90] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={handleVibrate}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              {/* Liquid Active Background */}
              {isActive && (
                <motion.div
                  layoutId="liquid-nav-bubble"
                  className="absolute bg-[#007AFF]/8 rounded-lg w-10 h-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.85 }}
                className={clsx(
                  "relative z-10 flex flex-col items-center justify-center transition-all duration-300",
                  isActive ? "text-[#007AFF] translate-y-0.5" : "text-slate-400"
                )}
              >
                <Icon 
                  size={isActive ? 24 : 22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={clsx("transition-all duration-300", !isActive && "opacity-75")} 
                />
                
                <AnimatePresence>
                  {!isActive && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[9px] font-medium mt-1 tracking-tight opacity-75"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar (Premium Denser Style) */}
      <nav className="hidden md:flex flex-col w-52 h-screen bg-white border-r border-slate-100 px-2 py-5 relative">
        <div className="mb-8 px-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shadow-sm">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-black tracking-tighter text-slate-900">
            LeadGorilla
          </h1>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={handleVibrate}
                className={clsx(
                  "group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "bg-slate-50 text-slate-900 font-bold"
                    : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className={clsx(
                    "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200",
                    isActive ? "bg-white shadow-sm" : "bg-transparent group-hover:bg-white group-hover:shadow-sm"
                  )}>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={clsx(
                        "transition-transform",
                        isActive ? "text-primary scale-105" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                  </div>
                  <span className="text-[13px] font-medium">{item.name}</span>
                </div>
                
                {isActive ? (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full"
                  />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black text-slate-300 uppercase px-1.5 py-0.5 rounded border border-slate-100">
                      {item.key}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom User Section */}
        <div className="mt-auto pt-6 border-t border-slate-100 px-2 space-y-2">
          {user ? (
            <>
              <Link href="/profile" onClick={handleVibrate} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                  <img src={user.photoURL || "/default-avatar.png"} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-black text-slate-900 truncate">{user.displayName || "User"}</p>
                  <p className="text-[10px] text-slate-500 truncate">Account Active</p>
                </div>
              </Link>
              <button 
                onClick={logOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg shadow-blue-500/20 group">
              <User size={20} />
              <span className="font-bold flex-1">Login to SaaS</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </nav>

      {/* Command Palette Backdrop */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandPaletteOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="text-slate-400" size={18} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type a command or search..."
                  className="w-full text-sm font-bold outline-none placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-black text-slate-400 uppercase">
                  ESC
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none">
                <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Quick Navigation
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-primary group-hover:shadow-sm transition-all")}>
                        <item.icon size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">G then {item.key}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black">↑↓</kbd>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black">⏎</kbd>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Select</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  LeadGorilla Pro v2.1
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Shortcut FAB (Desktop only) */}
      <div className="hidden md:block fixed bottom-6 right-6 z-[80] group">
        <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 w-56">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Active Shortcuts</h4>
            <div className="space-y-2.5">
              {[
                { k: "Ctrl+K", d: "Command Palette" },
                { k: "Ctrl+Enter", d: "Start/Stop Engine" },
                { k: "Esc", d: "Close Modal" },
                { k: "G then C", d: "Go to CRM" },
              ].map(s => (
                <div key={s.k} className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{s.d}</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-black text-primary">{s.k}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-slate-50 shadow-lg transition-all active:scale-90">
          <Command size={18} />
        </button>
      </div>
    </>
  );
}
