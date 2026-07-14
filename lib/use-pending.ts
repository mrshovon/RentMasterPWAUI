"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Tracks which row-level async action is in flight, keyed by a caller-chosen string.
 *
 * Modal forms get their pending state for free (a local `saving` flag + `<Button loading>`),
 * but actions fired straight from a table row or card — reset passcode, vacate, suspend,
 * delete — had none: the click did nothing visible until the request came back, which reads
 * as a frozen or ignored button. This gives those call sites the same feedback, and drops
 * repeat clicks while a key is still running.
 */
export function usePendingAction() {
  const [pending, setPending] = useState<string[]>([]);
  const inFlight = useRef<Set<string>>(new Set());

  const run = useCallback(async (key: string, fn: () => Promise<void>) => {
    if (inFlight.current.has(key)) return; // guard double-clicks
    inFlight.current.add(key);
    setPending((keys) => [...keys, key]);
    try {
      await fn();
    } finally {
      inFlight.current.delete(key);
      setPending((keys) => keys.filter((k) => k !== key));
    }
  }, []);

  const isPending = useCallback((key: string) => pending.includes(key), [pending]);

  return { isPending, run };
}
