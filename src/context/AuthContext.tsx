"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { onSnapshot } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Fast-track the loading state. Once we know if the user is logged in or out,
      // we can let the app continue. UserData will sync in the background.
      setLoading(false);
      
      if (!currentUser) {
        setUserData(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync User Data in Background
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    let unsubscribeSnapshot: () => void;

    const syncUserData = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const initialData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            plan: "free",
            quota: 50,
            usedQuota: 0,
            dailyRuns: 0,
            lastRunDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            expiryDate: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, initialData);
        }

        // Setup real-time listener
        unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserData(doc.data());
          }
        });
      } catch (error) {
        console.error("Background data sync failed:", error);
      }
    };

    syncUserData();

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [user]);

  const signInWithGoogle = async () => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      // Don't log if the user cancelled or if another request took over
      if (error.code !== "auth/cancelled-popup-request" && error.code !== "auth/popup-closed-by-user") {
        console.error("Google Sign-In Error:", error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
