"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";

const publicRoutes = ["/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-primary">
        <ShieldCheck size={48} className="mb-4 animate-pulse" />
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg text-primary"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Authenticating</p>
      </div>
    );
  }

  // Prevent flash of protected content while redirecting
  if (!user && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
