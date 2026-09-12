"use client";

import { useEffect, useRef, useState } from "react";

// =====================================================================================
// A visible countdown that navigates when it reaches zero.
//
// For the payment result pages: the gateway drops the payer on a page whose only purpose is to
// report an outcome, and leaving them to find the button themselves is how someone ends up sitting
// in a browser tab wondering whether their plan renewed.
//
// The countdown is SHOWN rather than silent. A page that navigates itself with no warning reads as
// a bug; one that says "returning in 12s" reads as help, and the button is still there for anyone
// who does not want to wait.
// =====================================================================================

/**
 * @param href    where to go when the countdown ends.
 * @param seconds how long to wait. Ignored after the first render — a changing duration mid-count
 *                would make the number jump around.
 * @param active  false parks the timer. The return page uses this so the count starts only once
 *                the outcome is on screen, rather than expiring while a spinner is showing.
 * @returns the whole seconds remaining, or null while parked.
 */
export function useAutoReturn(href: string, seconds: number, active = true): number | null {
  const [left, setLeft] = useState<number | null>(null);
  // Read through a ref so a caller passing an inline string cannot restart the countdown on every
  // render — the same reason usePollWhileVisible keeps its callback in one (lib/use-revalidate.ts).
  const hrefRef = useRef(href);
  hrefRef.current = href;

  useEffect(() => {
    if (!active) {
      setLeft(null);
      return;
    }
    setLeft(seconds);

    // Counted from a fixed deadline rather than by decrementing: a phone that sleeps mid-count
    // stops firing intervals, and a decrementing counter would resume where it paused and sit
    // there long after the 30 seconds had actually passed.
    const deadline = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      if (remaining > 0) {
        setLeft(remaining);
        return;
      }
      clearInterval(id);
      setLeft(0);
      // replace(), not assign(): this page is a dead end, and leaving it in history means Back
      // lands the payer on a spent invoice.
      window.location.replace(hrefRef.current);
    }, 250);

    return () => clearInterval(id);
    // `seconds` is intentionally in the deps but expected to be a constant at every call site.
  }, [active, seconds]);

  return left;
}
