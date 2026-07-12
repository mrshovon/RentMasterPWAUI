"use client";

import { useEffect, useState } from "react";

export interface SessionProfile {
  role: "owner" | "tenant" | "admin";
  userId: string;
  name: string;
  token?: string;
}

export function useSessionGuard(allowedRole?: "owner" | "tenant" | "admin") {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("rentmaster_session");
      if (stored) {
        const parsed: SessionProfile = JSON.parse(stored);
        
        // Role mismatch security check
        if (allowedRole && parsed.role !== allowedRole) {
          window.location.href = "/";
          return;
        }
        setSession(parsed);
      } else {
        // No session found -> redirect to gateway entry route
        window.location.href = "/";
      }
      setCheckingSession(false);
    }
  }, [allowedRole]);

  const login = (role: "owner" | "tenant" | "admin", userId: string, name: string) => {
    const profile: SessionProfile = { role, userId, name };
    localStorage.setItem("rentmaster_session", JSON.stringify(profile));
    window.location.href = `/${role}`;
  };

  const logout = () => {
    localStorage.removeItem("rentmaster_session");
    window.location.href = "/";
  };

  return { session, checkingSession, login, logout };
}