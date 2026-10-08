/**
 * refs.ts — ARIA ref system using Playwright 1.59's ariaSnapshot().
 *
 * Walks the ARIA YAML tree from page.locator("body").ariaSnapshot(),
 * assigns sequential refs (@e1, @e2, ...), binds each to a Locator via
 * page.getByRole(role, {name}).nth(index). No DOM mutation.
 * Gstack-pattern #2 absorbed.
 */

import type { Page, Locator } from "playwright";
import type { RefInfo } from "./types";

interface ParsedNode {
  role: string;
  name: string;
  depth: number;
  raw: string;
}

export class RefRegistry {
  private refs = new Map<string, { info: RefInfo; locator: Locator }>();

  clear(): void {
    this.refs.clear();
  }

  onNavigate(): void {
    this.clear();
  }

  /** Walk the ARIA snapshot, assign @eN refs, return annotated text + ref list. */
  async snapshot(page: Page, indexed = true): Promise<{ text: string; refs: RefInfo[] }> {
    this.clear();
    let yaml: string;
    try {
      yaml = await page.locator("body").ariaSnapshot();
    } catch (err: any) {
      return {
        text: `(ariaSnapshot failed: ${err?.message ?? err})`,
        refs: [],
      };
    }
    const nodes = parseAriaYaml(yaml);
    const refs: RefInfo[] = [];
    const roleCounters = new Map<string, number>();
    const lines: string[] = [];

    for (const node of nodes) {
      if (!indexed) {
        lines.push("  ".repeat(node.depth) + (node.name ? `${node.role} "${trunc(node.name, 60)}"` : node.role));
        continue;
      }
      // Only ref nodes that have a usable (role, name) pair.
      if (!node.name || SKIP_ROLES.has(node.role)) {
        lines.push("  ".repeat(node.depth) + node.role);
        continue;
      }
      const nth = roleCounters.get(node.role) ?? 0;
      roleCounters.set(node.role, nth + 1);
      const id = `@e${refs.length + 1}`;
      // ariaSnapshot's name computation and getByRole's accessible-name computation
      // disagree on multi-child labels like "Repos<span>161</span>" — ariaSnapshot
      // says "Repos 161", DOM says "Repos161", regex still misses. Use pure
      // role+nth addressing: stable for static pages, accurate even when the name
      // shown in snapshot differs from the live accessible name.
      const locator = page.getByRole(node.role as any).nth(nth);
      const info: RefInfo = { id, role: node.role, name: node.name };
      this.refs.set(id, { info, locator });
      refs.push(info);
      lines.push(`${"  ".repeat(node.depth)}${id} ${node.role} "${trunc(node.name, 60)}"`);
    }

    return { text: lines.join("\n"), refs };
  }

  /** Resolve @eN → Locator with staleness check. */
  async resolve(id: string): Promise<Locator | null> {
    const entry = this.refs.get(id);
    if (!entry) return null;
    try {
      const count = await entry.locator.count();
      if (count === 0) return null;
    } catch {
      return null;
    }
    return entry.locator;
  }
}

// ── ARIA YAML parser ─────────────────────────────────────────────────

const SKIP_ROLES = new Set(["generic", "none", "presentation", "RootWebArea", "WebArea", "document"]);

/**
 * Parse Playwright's ariaSnapshot YAML format. Lines look like:
 *   - heading "Welcome" [level=1]
 *   - button "Sign in"
 *   - link "Help":
 *     - /url: /help
 *   - textbox "Email" [disabled]
 *
 * We extract (role, name, depth). Attribute hints in [brackets] are ignored.
 * Lines starting with "  - /" (attributes like /url:) are skipped.
 */
function parseAriaYaml(yaml: string): ParsedNode[] {
  const out: ParsedNode[] = [];
  for (const line of yaml.split("\n")) {
    const m = line.match(/^(\s*)- (.*?)(?::)?$/);
    if (!m) continue;
    const indent = m[1]!.length;
    const body = m[2]!.trim();
    // Skip attribute lines like "/url: /help" or "text: hello"
    if (body.startsWith("/") || (!body.match(/^[a-zA-Z]/) && body.indexOf(" ") === -1)) continue;
    const depth = Math.floor(indent / 2);

    // Extract role + optional quoted name
    const rm = body.match(/^([a-zA-Z][\w-]*)(?:\s+"([^"]*)")?/);
    if (!rm) continue;
    const role = rm[1]!;
    const name = rm[2] ?? "";
    out.push({ role, name, depth, raw: body });
  }
  return out;
}

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
