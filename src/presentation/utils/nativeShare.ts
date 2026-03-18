/**
 * Share a URL using native share sheet (Capacitor) or clipboard fallback (web).
 * Returns true if shared successfully.
 */
export async function nativeShare(options: {
  title?: string;
  text?: string;
  url: string;
}): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share(options);
      return true;
    }
  } catch {
    // Not native or user cancelled
  }

  // Web fallback: try Web Share API, then clipboard
  try {
    if (navigator.share) {
      await navigator.share(options);
      return true;
    }
  } catch {
    // User cancelled or not supported
  }

  // Final fallback: clipboard
  try {
    await navigator.clipboard.writeText(options.url);
    return true;
  } catch {
    return false;
  }
}
