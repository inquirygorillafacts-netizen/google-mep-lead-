"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Chrome, ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden">
      {/* Background with animated elements */}
      <div className="absolute inset-0 bg-[#0a0a0b] z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col md:flex-row">
        {/* Left Side: Product Showcase */}
        <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-24 text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center p-1">
                <img src="/logo.png" alt="LeadGorilla" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight">LeadGorilla <span className="text-blue-500">Pro</span></span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Scale Your Business <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                With Better Leads
              </span>
            </h1>
            
            <p className="text-gray-400 text-xl max-w-lg mb-12">
              The ultimate B2B lead generation platform designed for speed, accuracy, and growth.
            </p>

            <div className="space-y-6">
              {[
                { icon: <Zap className="w-5 h-5 text-yellow-400" />, text: "Instant Data Extraction" },
                { icon: <ShieldCheck className="w-5 h-5 text-green-400" />, text: "Verified Contact Information" },
                { icon: <ArrowRight className="w-5 h-5 text-blue-400" />, text: "Automated Campaign Tools" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-gray-300">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    {item.icon}
                  </div>
                  <span className="text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Login Card */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[440px] bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
              <p className="text-gray-400">Join 500+ businesses growing with LeadGorilla</p>
            </div>

            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <Chrome className="w-6 h-6 text-red-500" />
              Continue with Google
            </button>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#121214] px-4 text-gray-500">Secure Authentication</span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                By signing in, you agree to our <br />
                <a href="#" className="text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
