"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Zap, ShieldCheck } from "lucide-react";
import { usePWA } from "@/context/PWAContext";

export default function PWAInstallPrompt() {
  const { showInstallBanner, setShowInstallBanner, installPWA } = usePWA();

  const handleInstall = async () => {
    await installPWA();
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  return (
    <AnimatePresence>
      {showInstallBanner && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm md:hidden"
            onClick={handleDismiss}
          />
          
          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-3xl shadow-2xl overflow-hidden md:hidden pb-safe"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <div className="px-6 pb-8 pt-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="BharatPWA" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">Install BharatPWA</h3>
                  <p className="text-sm text-slate-500">Fast, secure, and always accessible.</p>
                </div>
                <button onClick={handleDismiss} className="ml-auto w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center shrink-0">
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Lightning Fast Access</p>
                    <p className="text-xs text-slate-500">Opens instantly from your home screen.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Secure & Offline Capable</p>
                    <p className="text-xs text-slate-500">Review generated leads anywhere.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleInstall}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Download size={18} />
                  Install Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
                >
                  Continue to Web
                </button>
              </div>
            </div>
          </motion.div>

          {/* Desktop Banner alternative (Optional, keeping it mobile focused as per design prompt) */}
        </>
      )}
    </AnimatePresence>
  );
}
