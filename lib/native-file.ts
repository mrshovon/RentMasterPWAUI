// =============================================================================
// Saving a generated file from inside the native (Capacitor) app.
//
// WHY THIS EXISTS: the browser way of handing a user a file —
//   const url = URL.createObjectURL(blob); a.href = url; a.download = name; a.click();
// — does NOTHING in an Android WebView. The `download` attribute is ignored and `blob:`
// navigation is blocked, and neither throws, so the button just looks dead. Same story for
// window.print() and navigator.share(), none of which the WebView implements.
//
// The native equivalent is: write the bytes with @capacitor/filesystem, then hand the file to
// the system with @capacitor-community/file-opener. Both plugins are already in the app (the
// in-app updater uses them — see startUpgrade in lib/updates.ts), so this needs no new plugin
// and therefore no APK release.
// =============================================================================

export type SaveLocation = "documents" | "app storage";

/**
 * Turn a Blob into the bare base64 Filesystem.writeFile expects (no data: prefix).
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the generated file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

/**
 * Write a file inside the app and open it with the system viewer.
 *
 * Tries the public Documents folder first so the file is findable in the Files app afterwards,
 * and falls back to the app's own storage when the device refuses — on Android 10+ scoped
 * storage, writing to public Documents can be denied outright. Both locations are already
 * covered by the FileProvider in android/app/src/main/res/xml/file_paths.xml (`external-path`
 * and `cache-path`), which is what lets FileOpener hand out a content:// URI.
 *
 * Returns where it actually landed so the caller can tell the user; throws with a readable
 * message if even the fallback fails.
 */
export async function saveAndOpen(opts: {
  base64: string;
  fileName: string;
  mimeType: string;
}): Promise<SaveLocation> {
  const { base64, fileName, mimeType } = opts;
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { FileOpener } = await import("@capacitor-community/file-opener");

  const attempts: { directory: (typeof Directory)[keyof typeof Directory]; label: SaveLocation }[] = [
    { directory: Directory.Documents, label: "documents" },
    { directory: Directory.Cache, label: "app storage" },
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const written = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: attempt.directory,
        recursive: true,
      });

      // Opening is best-effort: the file IS saved at this point, and on a device with no image
      // viewer we would rather tell the user where it is than treat the whole thing as failed.
      try {
        await FileOpener.open({ filePath: written.uri, contentType: mimeType });
      } catch (openErr) {
        console.warn("[native-file] saved but could not open the file:", openErr);
      }

      return attempt.label;
    } catch (err) {
      console.warn(`[native-file] could not write to ${attempt.label}:`, err);
      lastError = err;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Could not save the file: ${lastError.message}`
      : "Could not save the file to this device.",
  );
}
