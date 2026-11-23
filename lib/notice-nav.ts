// =============================================================================
// Open a clickable notice's destination.
//
// Each dashboard keeps its active tab in the URL hash (lib/use-tab.ts). When the notice already
// points at the page the user is on, changing the hash alone switches tabs without a reload;
// the hashchange listener in useTabState picks it up. A different page needs a real navigation
// (and a leading '/' so the service-worker openWindow case resolves against the app origin).
// =============================================================================

export function openNoticeTarget(url: string): void {
  if (typeof window === "undefined" || !url) return;
  const [path, hash] = url.split("#");
  if (window.location.pathname === path && hash) {
    window.location.hash = hash;
    return;
  }
  window.location.assign(url);
}
