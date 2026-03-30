"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X, RefreshCcw } from "lucide-react";
import clsx from "clsx";

export default function PaymentStatusModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<"success" | "failed" | null>(null);
  const [txnid, setTxnid] = useState<string | null>(null);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const id = searchParams.get("txnid");
    
    if (paymentStatus === "success") {
      setStatus("success");
      setTxnid(id);
    } else if (paymentStatus === "failed") {
      setStatus("failed");
      setTxnid(id);
    }
  }, [searchParams]);

  const handleDismiss = () => {
    setStatus(null);
    // Remove query params to prevent reopening on refresh
    router.replace(window.location.pathname, { scroll: false });
  };

  const handleTryAgain = () => {
    handleDismiss();
    router.push("/pricing");
  };

  const today = new Date();
  const expiry = new Date();
  expiry.setDate(today.getDate() + 30); // Default to 30 days for now

  return (
    <AnimatePresence>
      {status && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 z-[10000] backdrop-blur-md"
            onClick={handleDismiss}
          />

          {/* Centered Modal */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto"
            >
              <div className={clsx(
                "h-2 w-full",
                status === "success" ? "bg-emerald-500" : "bg-rose-500"
              )} />

              <div className="px-8 pt-10 pb-10">
                <div className="flex justify-center mb-8 relative">
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className={clsx(
                      "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10",
                      status === "success" ? "bg-emerald-50 text-emerald-500 shadow-emerald-500/20" : "bg-rose-50 text-rose-500 shadow-rose-500/20"
                    )}
                  >
                    {status === "success" ? <CheckCircle2 size={48} strokeWidth={1.5} /> : <XCircle size={48} strokeWidth={1.5} />}
                  </motion.div>
                  
                  {status === "success" && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full"
                    />
                  )}
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                    {status === "success" ? "Payment Success!" : "Transaction Failed"}
                  </h3>
                  <p className="text-slate-500 font-medium px-4">
                    {status === "success" 
                      ? "Welcome to the elite tier. Your engine is now fully unleashed." 
                      : "We couldn't process your payment. Your cards were not charged."}
                  </p>
                </div>

                {status === "success" ? (
                  <div className="space-y-4 mb-10">
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Plan</span>
                        <span className="text-sm font-black text-primary px-3 py-1 bg-primary/5 rounded-full">Growth Engine</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activation</span>
                          <span className="text-sm font-bold text-slate-900">{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Until</span>
                          <span className="text-sm font-bold text-slate-900">{expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDismiss}
                      className="w-full bg-slate-900 hover:bg-primary text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
                    >
                      Enter Workspace
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 text-center">
                      <p className="text-rose-600 font-black text-xs uppercase tracking-widest mb-1">Safety First</p>
                      <p className="text-rose-400 text-[11px] font-medium leading-relaxed">
                        If any amount was deducted, it will be automatically refunded within 24-48 hours.
                      </p>
                      {txnid && <p className="text-slate-400 mt-4 text-[9px] font-mono opacity-60">ID: {txnid}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleDismiss}
                        className="py-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                      >
                        CLOSE
                      </button>
                      <button
                        onClick={handleTryAgain}
                        className="py-4 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                      >
                        <RefreshCcw size={14} />
                        RETRY NOW
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">BharatPWA Security Protocol</p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
