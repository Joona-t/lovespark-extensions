/* LoveSpark CWS Filler — content script.
 * Runs on the CWS dashboard. Loads a cws-listing.json the user picks, then fills
 * the text fields it can reach by matching on accessibility label / nearby text
 * (no fixed selectors → survives Google's UI churn). Images and the category
 * dropdown stay manual (browser security / non-native menus); the panel lists
 * exactly what to drag where. A human still clicks Submit for review.
 */
(() => {
  "use strict";
  if (window.__lsCwsFiller) return;
  window.__lsCwsFiller = true;

  const CERTS = [
    "do not sell or transfer user data to third parties",
    "unrelated to my item",
    "creditworthiness",
  ];

  // ── adaptive field finding ────────────────────────────────────────────────
  function labelText(el) {
    const bits = [];
    const aria = el.getAttribute("aria-label");
    if (aria) bits.push(aria);
    const lb = el.getAttribute("aria-labelledby");
    if (lb) lb.split(/\s+/).forEach((id) => {
      const n = document.getElementById(id);
      if (n) bits.push(n.textContent);
    });
    if (el.id) {
      const f = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (f) bits.push(f.textContent);
    }
    const wrap = el.closest("label");
    if (wrap) bits.push(wrap.textContent);
    if (el.placeholder) bits.push(el.placeholder);
    // Material/Angular: the label often sits in the field container.
    const group = el.closest("[role='group'], section, fieldset, div");
    if (group) {
      const head = group.querySelector("label, legend, h1, h2, h3, h4, [class*='label'], [class*='title']");
      if (head && !head.contains(el)) bits.push(head.textContent);
    }
    return bits.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findControl(selector, needle) {
    needle = needle.toLowerCase();
    const all = [...document.querySelectorAll(selector)].filter(visible);
    // Prefer empty controls so we don't clobber something already filled.
    const matches = all.filter((c) => labelText(c).includes(needle));
    return matches.find((c) => !c.value) || matches[0] || null;
  }

  const visible = (el) => el.offsetParent !== null || el.getClientRects().length > 0;

  // React/Angular-safe value set: use the native setter, then fire input+change.
  function setValue(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillField(selector, needle, value, log) {
    if (!value) return;
    const el = findControl(selector, needle);
    if (!el) { log(`? not found: ${needle}`, "miss"); return; }
    setValue(el, value);
    log(`✓ ${needle}`, "ok");
  }

  function tickCert(needle, log) {
    const boxes = [...document.querySelectorAll("input[type=checkbox], [role=checkbox]")].filter(visible);
    const box = boxes.find((b) => labelText(b).includes(needle));
    if (!box) { log(`? cert checkbox not found: "${needle}"`, "miss"); return; }
    const checked = box.checked || box.getAttribute("aria-checked") === "true";
    if (!checked) box.click();
    log(`✓ certification: ${needle.slice(0, 28)}…`, "ok");
  }

  function fillFromListing(listing, log) {
    fillField("textarea", "description", listing.description, log);
    fillField("textarea, input[type=text]", "single purpose", listing.single_purpose, log);
    const pj = listing.permission_justifications || {};
    Object.keys(pj).forEach((perm) => fillField("textarea", perm, pj[perm], log));
    fillField("input[type=text], input[type=url], textarea", "privacy policy", listing.privacy_policy_url, log);
    CERTS.forEach((c) => tickCert(c, log));
    log("— leave every data-collection box unchecked (LoveSpark collects nothing).", "note");
  }

  // ── UI (built with createElement only; role=dialog; focus trap; Escape) ───
  let listing = null, panel = null, launcher = null, lastFocus = null;

  function el(tag, props = {}, kids = []) {
    const n = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    });
    kids.forEach((c) => n.appendChild(c));
    return n;
  }

  function statusLine(msg, kind) {
    const log = panel.querySelector("#ls-cws-log");
    log.appendChild(el("div", { class: `ls-cws-line ls-${kind}`, text: msg }));
    log.scrollTop = log.scrollHeight;
  }

  function imageChecklist(listing) {
    const a = listing.assets || {};
    const items = [];
    if (a.store_icon) items.push(`Store icon → ${a.store_icon}`);
    (a.screenshots || []).forEach((s, i) => items.push(`Screenshot ${i + 1} → ${s}`));
    if (a.promo_small) items.push(`Small promo tile → ${a.promo_small}`);
    if (a.promo_marquee) items.push(`Marquee tile → ${a.promo_marquee}`);
    items.push(`Category (set by hand) → ${listing.category || "—"}`);
    const ul = el("ul", { class: "ls-cws-checklist", "aria-label": "Drag these in by hand" });
    items.forEach((t) => ul.appendChild(el("li", { text: t })));
    return ul;
  }

  function openPanel() {
    if (panel) { panel.hidden = false; return focusFirst(); }
    lastFocus = document.activeElement;
    const title = el("h2", { id: "ls-cws-title", text: "LoveSpark CWS Filler" });
    const mascot = el("img", {
      class: "ls-cws-mascot", alt: "Sparky the LoveSpark wolf mascot",
      src: chrome.runtime.getURL("mascot.png"),
    });
    const desc = el("p", {
      id: "ls-cws-desc", class: "ls-cws-desc",
      text: "Load this extension's cws-listing.json, then fill the text fields. Review everything and click Submit yourself.",
    });
    const file = el("input", { type: "file", id: "ls-cws-file", accept: "application/json,.json", "aria-label": "Load cws-listing.json" });
    const fillBtn = el("button", { type: "button", id: "ls-cws-fill", class: "ls-cws-btn ls-cws-primary", disabled: "", text: "Fill text fields" });
    const closeBtn = el("button", { type: "button", class: "ls-cws-btn ls-cws-close", "aria-label": "Close", text: "✕" });
    const log = el("div", { id: "ls-cws-log", class: "ls-cws-log", role: "status", "aria-live": "polite" });
    const slot = el("div", { id: "ls-cws-checklist-slot" });

    panel = el("div", {
      class: "ls-cws-panel", role: "dialog", "aria-modal": "true",
      "aria-labelledby": "ls-cws-title", "aria-describedby": "ls-cws-desc",
    }, [
      el("div", { class: "ls-cws-head" }, [mascot, title, closeBtn]),
      desc, file, fillBtn, slot, log,
    ]);

    file.addEventListener("change", () => {
      const f = file.files[0];
      if (!f) return;
      f.text().then((t) => {
        try {
          listing = JSON.parse(t);
          fillBtn.disabled = false;
          log.replaceChildren();
          statusLine(`loaded: ${listing.name || f.name}`, "ok");
          slot.replaceChildren(imageChecklist(listing));
        } catch (e) {
          statusLine("✗ not valid JSON", "miss");
        }
      });
    });
    fillBtn.addEventListener("click", () => {
      if (!listing) return;
      statusLine("filling…", "note");
      fillFromListing(listing, statusLine);
      statusLine("done — review every tab, then Submit for review.", "note");
    });
    closeBtn.addEventListener("click", closePanel);
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
      if (e.key === "Tab") trapFocus(e);
    });

    document.body.appendChild(panel);
    focusFirst();
  }

  function focusFirst() { panel.querySelector("#ls-cws-file").focus(); }
  function focusables() {
    return [...panel.querySelectorAll("button, input, [tabindex]:not([tabindex='-1'])")]
      .filter((n) => !n.disabled && n.offsetParent !== null);
  }
  function trapFocus(e) {
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function closePanel() {
    if (panel) panel.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function mountLauncher() {
    launcher = el("button", {
      type: "button", class: "ls-cws-launcher",
      "aria-label": "Open LoveSpark CWS Filler", title: "LoveSpark CWS Filler",
    }, [el("img", { src: chrome.runtime.getURL("mascot.png"), alt: "", "aria-hidden": "true" })]);
    launcher.addEventListener("click", openPanel);
    document.body.appendChild(launcher);
  }

  if (document.body) mountLauncher();
  else window.addEventListener("DOMContentLoaded", mountLauncher, { once: true });
})();
