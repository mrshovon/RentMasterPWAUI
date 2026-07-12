"use client";

import { useEffect, useState } from "react";

// Keeps the active dashboard tab in the URL hash (e.g. #properties) so a reload
// stays on the same page instead of snapping back to the default tab.
// Returns [tab, setTab] — setTab updates both state and the hash.
export function useTabState(defaultTab: string) {
  const [tab, setTab] = useState(defaultTab);

  // On mount, adopt whatever tab the hash points at (survives reloads / deep links).
  useEffect(() => {
    const readHash = () => {
      const h = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      setTab(h || defaultTab);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (key: string) => {
    setTab(key);
    if (typeof window !== "undefined") {
      // replaceState updates the hash without adding a history entry or firing hashchange.
      window.history.replaceState(null, "", `#${key}`);
    }
  };

  return [tab, navigate] as const;
}
