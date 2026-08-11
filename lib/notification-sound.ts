// The Bari360 notification tone, for the browser.
//
// The native app never uses any of this — there the sound is a property of the Android
// notification channel (lib/native-push.ts) and the OS plays it whatever the app is doing.
//
// In a browser there is no equivalent. `showNotification()` has no sound option, so the only way
// to make the brand tone audible on the web is to play it from a page that is actually open. That
// is what this file does, and it is why the Settings card says so out loud.

/** The user's choice. Mirrors PushSound on the backend (lib/push-send.ts). */
export type NotificationSound = "custom" | "default" | "off";
export const DEFAULT_NOTIFICATION_SOUND: NotificationSound = "custom";

/** Per-device mirror of the account-level setting, so the player never has to wait on a fetch. */
const SOUND_KEY = "rentmaster-notification-sound";

export const TONE_URL = "/brandImages/sounds/notification_tone.mp3";

export function getStoredSound(): NotificationSound {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SOUND;
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw === "custom" || raw === "default" || raw === "off" ? raw : DEFAULT_NOTIFICATION_SOUND;
  } catch {
    return DEFAULT_NOTIFICATION_SOUND;
  }
}

export function storeSound(sound: NotificationSound): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SOUND_KEY, sound); } catch { /* private mode — the fetch still wins */ }
}

// One shared element rather than a `new Audio()` per notification: browsers only lift the autoplay
// restriction on an element that has already been played from inside a user gesture, so the element
// primed by primeTone() has to be the same one that plays later.
let toneElement: HTMLAudioElement | null = null;
let primed = false;

function getTone(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!toneElement) {
    toneElement = new Audio(TONE_URL);
    toneElement.preload = "auto";
  }
  return toneElement;
}

/**
 * Play the tone. Always safe to call: a browser that refuses (no gesture yet, tab muted, missing
 * file) rejects the promise and we swallow it — a notification must never take the app down with it.
 */
export function playTone(): void {
  const audio = getTone();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => { /* autoplay blocked or no audio output — nothing to do */ });
  } catch { /* ignore */ }
}

/**
 * Unlock audio playback inside the first user gesture of the session, by playing the tone muted.
 * Without this the very first notification of a session is silently dropped by the autoplay policy.
 */
export function primeTone(): void {
  if (primed) return;
  const audio = getTone();
  if (!audio) return;
  primed = true;
  const wasMuted = audio.muted;
  audio.muted = true;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = wasMuted;
    })
    .catch(() => {
      audio.muted = wasMuted;
      primed = false; // not actually unlocked; try again on the next gesture
    });
}
