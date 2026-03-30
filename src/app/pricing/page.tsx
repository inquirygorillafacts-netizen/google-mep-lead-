"use client";

import React, { useState, useEffect } from "react";
import { Check, Shield, Zap, Rocket, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import clsx from "clsx";

const plans = [
  {
    name: "Starter",
    price: "999",
    leads: "1,000 Leads",
    features: ["Basic Data Extraction", "CSV Export", "Email Support", "1 Device Login"],
    icon: <Zap className="w-6 h-6 text-white text-opacity-90" fill="currentColor" />,
    bgClass: "bg-blue-500 shadow-blue-500/30",
  },
  {
    name: "Growth",
    price: "2,499",
    leads: "5,000 Leads",
    features: ["Advanced Filtering", "Instant WhatsApp Search", "Priority Support", "3 Device Logins", "Verified Badge"],
    icon: <Rocket className="w-6 h-6 text-white text-opacity-90" />,
    bgClass: "bg-purple-500 shadow-purple-500/30",
    popular: true,
  },
  {
    name: "Pro",
    price: "4,999",
    leads: "Unlimited Leads",
    features: ["Unlimited Extractions", "API Access", "Dedicated Account Manager", "Unlimited Devices", "Custom Reports"],
    icon: <Star className="w-6 h-6 text-white text-opacity-90" />,
    bgClass: "bg-amber-500 shadow-amber-500/30",
  },
];

export default function PricingPage() {
  const { user, userData } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    // We handle the UI feedback via the global PaymentStatusModal component
    // which listens to these query parameters. No need for browser alerts.
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus) {
      // Logic to clear URL if needed, or just let the Modal handle it
      // window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  const handlePayment = async (planName: string, amount: string) => {
    if (!user) {
      alert("Please login first to subscribe.");
      return;
    }

    setLoadingPlan(planName);
    
    try {
      // 1. Generate Transaction ID
      const txnid = `txn_${Date.now()}_${Math.floor(Math.random() * 100)}`;
      const numericAmount = amount.replace(/,/g, '');

      // 2. Fetch Hash from our backend
      const response = await fetch('/api/payu/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          productinfo: `${planName} Plan - LeadGorilla`,
          firstname: user?.displayName || "User",
          email: user?.email || "test@leadgorilla.com",
          phone: "9999999999", // Mock phone or user's phone
          txnid,
          userId: user.uid,
          planName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate hash");
      }

      // 3. Create a form dynamically and submit to PayU Environment
      const form = document.createElement("form");
      form.setAttribute("action", data.action);
      form.setAttribute("method", "POST");
      form.style.display = "none";

      const inputs = {
        key: data.key,
        txnid: txnid,
        amount: numericAmount,
        productinfo: `${planName} Plan - LeadGorilla`,
        firstname: user?.displayName || "User",
        email: user?.email || "test@leadgorilla.com",
        phone: userData?.phone || "9999999999",
        surl: data.surl,
        furl: data.furl,
        hash: data.hash,
        udf1: user.uid,
        udf2: planName
      };

      Object.entries(inputs).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", key);
        input.setAttribute("value", value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error("Payment initiation failed:", error);
      alert("Failed to initiate payment. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-10 md:pt-16 px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50 to-transparent -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-400/10 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-400/10 blur-[100px] rounded-full -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          {/* User Status Header */}
          {userData && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={clsx(
                "inline-flex flex-wrap items-center justify-center gap-4 px-6 py-4 rounded-3xl border mb-8 transition-all shadow-sm",
                isExpired ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-slate-100 text-slate-700"
              )}
            >
              <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isExpired ? "bg-rose-100 text-rose-600" : "bg-blue-50 text-blue-600"
                )}>
                  {isExpired ? <AlertCircle size={16} /> : <Rocket size={16} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none mb-1">Current Plan</p>
                  <p className="text-sm font-black uppercase tracking-tight">
                    {userData.plan === "free" ? "Free Tier" : userData.plan}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isExpired ? "bg-rose-100 text-rose-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 leading-none mb-1">Status</p>
                  <p className="text-sm font-black tracking-tight">
                    {userData.plan === "free" 
                      ? "Permanent Access" 
                      : isExpired 
                        ? "PLAN EXPIRED" 
                        : `${daysRemaining} Days Remaining`}
                  </p>
                </div>
              </div>

              {isExpired && (
                <div className="w-full mt-2 pt-2 border-t border-rose-100 flex items-center justify-center gap-2 text-[10px] font-bold">
                  <AlertCircle size={12} />
                  Sequence terminated. Please renew to continue lead extraction.
                </div>
              )}
            </motion.div>
          )}

          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-900"
          >
            Flexible plans to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Scale Fast</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg max-w-2xl mx-auto font-medium"
          >
            Choose the perfect engine tier for your outreach. Over 500+ businesses rely on LeadGorilla.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col p-8 rounded-[2rem] bg-white transition-all duration-300 hover:-translate-y-2
                ${plan.popular 
                  ? "border-2 border-primary shadow-2xl z-10 scale-105" 
                  : "border border-slate-100 shadow-xl shadow-slate-200/50"}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-primary-light text-white text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full shadow-lg uppercase">
                  Most Popular Choice
                </div>
              )}

              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-[1.25rem] flex items-center justify-center ${plan.bgClass}`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">{plan.leads}</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                  <span className="text-slate-500 font-bold ml-1">/mo</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 text-slate-600 font-medium text-sm">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                      <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

                <button
                  disabled={loadingPlan === plan.name}
                  onClick={() => handlePayment(plan.name, plan.price)}
                  className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 
                    ${plan.popular 
                      ? "bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/30" 
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"} disabled:opacity-70 active:scale-95`}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    "Select " + plan.name + " Plan"
                  )}
                </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm">
            <Shield className="w-5 h-5 text-emerald-500 fill-emerald-50" />
            <span className="text-slate-500 text-sm font-medium">Secured with 256-bit encryption by </span>
            <span className="font-black text-slate-800 tracking-tight">PayU</span>
          </div>
        </div>
      </div>
    </div>
  );
}
