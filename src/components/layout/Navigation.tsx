"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Layers, MessageSquare, CreditCard, Wallet, UserCircle2, ChevronRight, LogOut, Search, Database, MessageCircle, User } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Hunter", path: "/", icon: Compass, color: "text-blue-500" },
  { name: "CRM", path: "/crm", icon: UserCircle2, color: "text-indigo-500" },
  { name: "Vault", path: "/vault", icon: Layers, color: "text-purple-500" },
  { name: "Campaigns", path: "/campaigns", icon: MessageSquare, color: "text-green-500" },
  { name: "Profile", path: "/profile", icon: User, color: "text-slate-500" },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, logOut } = useAuth();

  const handleVibrate = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Hide navigation on login page
  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile Bottom Navigation (Native iOS Style - Liquid Circular) */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white/80 backdrop-blur-xl border-t border-slate-200/50 md:hidden flex justify-around items-center z-[90] pb-safe shadow-lg px-2">
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
                  className="absolute bg-[#007AFF]/10 rounded-full w-12 h-12"
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

      {/* Desktop Sidebar (Premium SaaS Style) */}
      <nav className="hidden md:flex flex-col w-60 h-screen bg-white border-r border-slate-100 px-3 py-6 relative">
        <div className="mb-10 px-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shadow-sm">
            <img src="/logo.png" alt="LeadGorilla Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Lead<span className="text-primary font-black">Gorilla</span>
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
                  "group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden",
                  isActive
                    ? "bg-slate-50 text-slate-900 font-semibold"
                    : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                    isActive ? "bg-white shadow-sm" : "bg-transparent group-hover:bg-white group-hover:shadow-sm"
                  )}>
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={clsx(
                        "transition-transform",
                        isActive ? "text-primary scale-110" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                  </div>
                  <span className="text-[14px]">{item.name}</span>
                </div>
                
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
                
                {isActive && <ChevronRight size={14} className="text-slate-400" />}
              </Link>
            );
          })}
        </div>

        {/* Bottom User Section */}
        <div className="mt-auto pt-6 border-t border-slate-100 px-2 space-y-2">
          {user ? (
            <>
              <Link href="/profile" onClick={handleVibrate} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                  <img src={user.photoURL || "/default-avatar.png"} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || "User"}</p>
                  <p className="text-[10px] text-slate-500 truncate">SaaS License Active</p>
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
    </>
  );
}
