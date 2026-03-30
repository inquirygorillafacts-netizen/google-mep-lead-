import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/context/AuthContext";
import OnboardingSlides from "@/components/OnboardingSlides";
import AuthGuard from "@/components/auth/AuthGuard";
import { Navigation } from "@/components/layout/Navigation";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PaymentStatusModal from "@/components/PaymentStatusModal";
import { PWAProvider } from "@/context/PWAContext";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "LeadGorilla Pro - Lead Gen",
  description: "Premium B2B Lead Hunting Engine",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BharatPWA",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f2f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex h-[100dvh] overflow-hidden bg-[--background] text-[--foreground]" suppressHydrationWarning>
        <AuthProvider>
          <PWAProvider>
            <AuthGuard>
              <ServiceWorkerRegistration />
              <PWAInstallPrompt />
              <Suspense fallback={null}>
                <PaymentStatusModal />
              </Suspense>
              <OnboardingSlides />
              <Navigation />
              {/* Main Content Area */}
              <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative bg-slate-50">
                {children}
              </main>
            </AuthGuard>
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
