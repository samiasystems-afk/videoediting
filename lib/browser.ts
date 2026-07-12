import fs from "node:fs";
import path from "node:path";

/**
 * Resolve a Chromium executable for Remotion.
 *
 * Remotion would normally download its own "Chrome Headless Shell", but that
 * download is blocked by the environment proxy. This environment ships a
 * preinstalled Chromium under PLAYWRIGHT_BROWSERS_PATH (e.g.
 * /opt/pw-browsers/chromium-1194/chrome-linux/chrome). We locate it dynamically
 * so the exact build number doesn't matter.
 *
 * Returns undefined if none is found, letting the caller fall back to Remotion's
 * own resolution (and surface a clear error if that also fails).
 */
export function findChromium(): string | undefined {
  const fromEnv = process.env.REMOTION_BROWSER_EXECUTABLE || process.env.CHROMIUM_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!fs.existsSync(base)) return undefined;

  const shells: string[] = [];
  const chromes: string[] = [];
  for (const entry of fs.readdirSync(base)) {
    if (!entry.startsWith("chromium")) continue;
    // Remotion drives the browser in old-headless mode, which the full `chrome`
    // binary now rejects. The standalone `headless_shell` implements exactly
    // that mode, so prefer it and fall back to `chrome` only if absent.
    shells.push(path.join(base, entry, "chrome-linux", "headless_shell"));
    chromes.push(path.join(base, entry, "chrome-linux", "chrome"));
  }
  return [...shells, ...chromes].find((c) => fs.existsSync(c));
}
