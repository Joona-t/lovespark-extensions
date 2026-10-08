/**
 * lovespark.ts — LoveSpark-native browser extensions that gstack does not have.
 *
 * 1. contrast-sample: real-DOM WCAG 2.1 contrast ratio (matches audit-contrast.py)
 * 2. theme-cycle: snapshot all 4 themes (retro / dark / beige / slate)
 * 3. mascot-check: verify Sparky mascot presence + alt text (CLAUDE.md rule #3)
 */

import type { Page, Locator } from "playwright";
import type {
  ContrastSampleResult,
  MascotCheckResult,
  ThemeSnapshot,
} from "./types";
import { mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ── Contrast math (ported from audit-contrast.py) ─────────────────────

function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(
  fg: [number, number, number],
  bg: [number, number, number],
): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

function parseRgb(s: string): [number, number, number] | null {
  // "rgb(255, 0, 128)" or "rgba(255, 0, 128, 0.5)"
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [parseInt(m[1]!, 10), parseInt(m[2]!, 10), parseInt(m[3]!, 10)];
  return null;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function compositeOnBg(
  fgRgba: [number, number, number, number],
  bg: [number, number, number],
): [number, number, number] {
  const [r, g, b, a] = fgRgba;
  return [
    Math.round(r * a + bg[0] * (1 - a)),
    Math.round(g * a + bg[1] * (1 - a)),
    Math.round(b * a + bg[2] * (1 - a)),
  ];
}

function parseRgba(s: string): [number, number, number, number] | null {
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  return [
    parseInt(m[1]!, 10),
    parseInt(m[2]!, 10),
    parseInt(m[3]!, 10),
    m[4] !== undefined ? parseFloat(m[4]) : 1,
  ];
}

// ── Contrast sample ────────────────────────────────────────────────────

/**
 * Pull computed fg/bg from two elements (or fg-element + ancestor bg),
 * walk up the DOM to find the first opaque background, alpha-composite
 * the fg onto it, then return the WCAG contrast ratio.
 */
export async function contrastSample(
  fgLocator: Locator,
  bgLocator: Locator | null,
): Promise<ContrastSampleResult> {
  const fgRaw = await fgLocator.evaluate((el: Element) => {
    const cs = getComputedStyle(el);
    return cs.color;
  });

  // If no explicit bg locator, walk up to first opaque ancestor background
  const bgRaw = bgLocator
    ? await bgLocator.evaluate((el: Element) => getComputedStyle(el).backgroundColor)
    : await fgLocator.evaluate((el: Element) => {
        let cur: Element | null = el;
        while (cur) {
          const cs = getComputedStyle(cur);
          const bg = cs.backgroundColor;
          const m = bg.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*([\d.]+))?/);
          const alpha = m && m[1] !== undefined ? parseFloat(m[1]) : 1;
          if (alpha >= 0.999 && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
          cur = cur.parentElement;
        }
        return "rgb(255, 255, 255)";
      });

  const fgRgba = parseRgba(fgRaw);
  const bg = parseRgb(bgRaw);
  if (!fgRgba || !bg) {
    throw new Error(
      `contrast-sample: could not parse fg=${JSON.stringify(fgRaw)} bg=${JSON.stringify(bgRaw)}. ` +
        `Remedy: ensure both elements have inline-computable colors (getComputedStyle returns rgb/rgba).`,
    );
  }
  const fg = fgRgba[3] >= 0.999 ? ([fgRgba[0], fgRgba[1], fgRgba[2]] as [number, number, number]) : compositeOnBg(fgRgba, bg);
  const ratio = contrastRatio(fg, bg);
  return {
    ratio: Math.round(ratio * 100) / 100,
    passes_aa_normal: ratio >= 4.5,
    passes_aa_large: ratio >= 3.0,
    passes_aaa_normal: ratio >= 7.0,
    fg_rgb: fg,
    bg_rgb: bg,
    fg_hex: rgbToHex(fg),
    bg_hex: rgbToHex(bg),
  };
}

// ── Theme cycle ────────────────────────────────────────────────────────

const LOVESPARK_THEMES = ["retro", "dark", "beige", "slate"] as const;

/**
 * For each LoveSpark theme: set body[data-theme] or body.theme-*, wait for repaint,
 * screenshot, log. Returns paths. Assumes a LoveSpark extension popup with standard
 * theme class convention.
 */
export async function themeCycle(page: Page, runId: string): Promise<ThemeSnapshot[]> {
  const outDir = join(homedir(), ".lovespark", "browse-logs", "theme-snapshots", runId);
  mkdirSync(outDir, { recursive: true });

  const snapshots: ThemeSnapshot[] = [];
  for (const theme of LOVESPARK_THEMES) {
    await page.evaluate((t) => {
      const body = document.body;
      // Convention: LoveSpark themes are applied via class="theme-<name>"
      body.classList.remove("theme-retro", "theme-dark", "theme-beige", "theme-slate");
      body.classList.add(`theme-${t}`);
      body.setAttribute("data-theme", t);
    }, theme);
    // Wait for any CSS transitions
    await page.waitForTimeout(300);
    const screenshot_path = join(outDir, `${theme}.png`);
    await page.screenshot({ path: screenshot_path, fullPage: false });
    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    snapshots.push({ theme, screenshot_path, viewport });
  }
  return snapshots;
}

// ── Mascot check ───────────────────────────────────────────────────────

/**
 * CLAUDE.md rule #3: every LoveSpark UI must include the Sparky mascot.
 * Look for <img> with alt containing "sparky" OR src containing "mascot|sparky".
 * Return presence + visibility + remedy if missing.
 */
export async function mascotCheck(page: Page): Promise<MascotCheckResult> {
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .filter((img) => /sparky/i.test(img.alt) || /sparky|mascot/i.test(img.src))
      .map((img) => {
        const rect = img.getBoundingClientRect();
        const cs = getComputedStyle(img);
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          cs.display !== "none" &&
          cs.visibility !== "hidden" &&
          parseFloat(cs.opacity) > 0;
        return { src: img.src, alt: img.alt, visible };
      });
  });

  if (images.length === 0) {
    return {
      present: false,
      count: 0,
      visible: false,
      images: [],
      remedy:
        "CLAUDE.md rule #3 requires Sparky in every UI. Add an <img> with alt containing 'Sparky', " +
        "or src referencing mascot.png. See Assets & Docs/mascot.png.",
    };
  }
  const visible = images.some((i) => i.visible);
  return {
    present: true,
    count: images.length,
    visible,
    images,
    remedy: visible
      ? undefined
      : "Sparky <img> found but not visible (display:none, zero size, or opacity 0). Make it render.",
  };
}
