"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Monitor, Zap, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWA } from "@/context/PWAContext";

export default function OnboardingSlides() {
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { installPWA } = usePWA();

  const slides = [
    {
      title: "Welcome to Lead Extractor",
      description: "this is a nambr one Lead Extractor saas kreted by yogiraj",
      icon: <Zap className="w-12 h-12 text-blue-500" />,
      color: "bg-blue-500/10",
    }
  ];

  useEffect(() => {
    const lastShown = localStorage.getItem("last_onboarding_shown");
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    if (!lastShown || now - parseInt(lastShown) > ONE_HOUR) {
      setShow(true);
      localStorage.setItem("last_onboarding_shown", now.toString());
    }
  }, []);

  const handleInstall = async () => {
    await installPWA();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => setShow(false)}
      ></motion.div>

      {/* Modal Card */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <button 
          onClick={() => setShow(false)}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`p-6 rounded-3xl ${slides[currentSlide].color} mb-8`}>
                {slides[currentSlide].icon}
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              
              <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-xs mx-auto">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-10">
            {slides.map((_, i) => (
              <div 
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-8 bg-blue-600" : "w-2 bg-gray-200"}`}
              ></div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {currentSlide < slides.length - 1 ? (
              <button 
                onClick={() => setCurrentSlide(prev => prev + 1)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-3xl text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleInstall}
                  className="bg-gray-900 hover:bg-black text-white font-bold py-5 rounded-3xl text-lg shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Install Now
                </button>
                <button 
                  onClick={() => setShow(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-3xl text-lg shadow-xl shadow-blue-500/20 transition-all"
                >
                  Web Version
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
