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
            className="fixed inset-0 bg-slate-900/60 z-[9998] backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden pb-8 max-h-[85vh] flex flex-col md:max-w-md md:mx-auto md:bottom-6 md:rounded-[2.5rem]"
          >
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <div className="px-6 pt-4 pb-4 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div className={clsx(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                  status === "success" ? "bg-green-50 text-green-500 shadow-green-500/20" : "bg-rose-50 text-rose-500 shadow-rose-500/20"
                )}>
                  {status === "success" ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                </div>
                <button onClick={handleDismiss} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-colors">
                  <X size={16} />
                </button>
              </div>

              {status === "success" ? (
                <>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Payment Successful</h3>
                  <p className="text-slate-500 font-medium mb-6">Your subscription is now active. Enjoy premium features!</p>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plan Name</span>
                      <span className="text-sm font-black text-primary">Bharat Hunter Pro</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Activation</span>
                        <span className="text-sm font-bold text-slate-900">{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expiration</span>
                        <span className="text-sm font-bold text-slate-900">{expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mb-2">
                     <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                       Enjoy for 30 Days
                     </span>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Payment Failed</h3>
                  <p className="text-slate-500 font-medium mb-6">We couldn't process your transaction this time.</p>
                  
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-8 text-center">
                    <p className="text-rose-600 font-bold text-sm">Amount Not Deducted</p>
                    <p className="text-rose-400 text-xs mt-1">If money was debited, it will be refunded within 3-5 business days.</p>
                    {txnid && <p className="text-slate-400 mt-3 text-[10px] font-mono break-all">Ref: {txnid}</p>}
                  </div>

                  <button
                    onClick={handleTryAgain}
                    className="w-full bg-slate-900 hover:bg-primary text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <RefreshCcw size={18} />
                    Try Again
                  </button>
                </>
              )}
            </div>
            
            {status === "success" && (
              <div className="px-6 pb-2">
                <button
                  onClick={handleDismiss}
                  className="w-full bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  Continue to Workspace
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
