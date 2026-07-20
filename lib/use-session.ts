"use client";

import { useEffect, useState } from "react";
import {
  getStoredSession, setStoredSession, clearSession, ensureValidToken,
  type StoredSession,
} from "./api-service";

export type SessionProfile = StoredSession;

export function useSessionGuard(allowedRole?: "owner" | "tenant" | "admin") {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = getStoredSession();
    if (!stored) {
      // No session found -> redirect to the gateway entry route.
      window.location.href = "/";
      return;
    }
    // Role mismatch security check.
    if (allowedRole && stored.role !== allowedRole) {
      window.location.href = "/";
      return;
    }
    setSession(stored);
    setCheckingSession(false);
    // Proactively renew the access token so a long-open dashboard doesn't drift into 401s.
    void ensureValidToken();
  }, [allowedRole]);

  const login = (role: "owner" | "tenant" | "admin", userId: string, name: string) => {
    setStoredSession({ role, userId, name });
    window.location.href = `/${role}`;
  };

  const logout = () => {
    clearSession();
    window.location.href = "/";
  };

  return { session, checkingSession, login, logout };
}