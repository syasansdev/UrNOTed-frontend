// Generate lightweight browser fingerprint
export function getDeviceFingerprint() {
  try {
    const nav = window.navigator;
    const scr = window.screen;

    const components = [
      nav.userAgent || "",
      nav.language || "",
      scr.colorDepth || "",
      scr.width + "x" + scr.height,
      new Date().getTimezoneOffset(),
      nav.hardwareConcurrency || "",
      nav.deviceMemory || ""
    ];

    // Create simple hash string
    const rawString = components.join("~~~");
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }

    return "DEV-FP-" + Math.abs(hash).toString(36);
  } catch (err) {
    return "DEV-FP-UNKNOWN";
  }
}
