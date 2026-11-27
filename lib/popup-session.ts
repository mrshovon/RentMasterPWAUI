// =============================================================================
// "Shown once per app open" for announcement and login banners.
//
// sessionStorage is per TAB SESSION: it survives reloads and in-app navigation in that tab, and is
// cleared when the tab is closed. That is exactly the requested lifetime — closing the browser and
// coming back is a new app open, but hopping between Home, Help and Billing is not.
//
// The version is the popup set's `updatedAt`, so when the admin edits or reorders the banners the
// new list shows once again in the same session. A React ref cannot do this: it dies on every full
// page load, which is why the modal used to reappear after visiting Help and coming back.
// =============================================================================

export type PopupKind = "announcement" | "login";

const PREFIX = "bari360-popup:";

export function popupVersion(next: { updatedAt?: string; items: { id: string }[] }): string {
  return next.updatedAt || next.items.map((i) => i.id).join(",");
}

function keyFor(kind: PopupKind, version: string): string {
  return `${PREFIX}${kind}:${version}`;
}

export function wasPopupShown(kind: PopupKind, version: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(keyFor(kind, version)) === "1";
  } catch {
    return false;
  }
}

export function markPopupShown(kind: PopupKind, version: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(keyFor(kind, version), "1");
  } catch {
    /* private mode / storage disabled — the ref in the gate still prevents repeats in-mount */
  }
}
