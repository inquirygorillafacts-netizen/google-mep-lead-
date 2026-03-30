"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
  deferredPrompt: any;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  installPWA: () => Promise<void>;
  isInstallable: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hasDismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!hasDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      // Fallback for non-supported browsers (like Safari)
      window.alert("To install: Tap the 'Share' icon and then 'Add to Home Screen' 📱");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the PWA install");
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  return (
    <PWAContext.Provider value={{ 
      deferredPrompt, 
      showInstallBanner, 
      setShowInstallBanner, 
      installPWA,
      isInstallable: !!deferredPrompt 
    }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
