# Silent Failure Audit — Rewire Brain v2.4.0

**Date:** 2026-05-09
**Auditor:** error-handling-auditor (LoveSpark CSO lens)
**Scope:** background.js, image-blur.js, image-blur-main.js, content.js, blocked.js, onboarding.js, popup.js, dashboard.js, options.js
**Final Verdict:** **CRITICAL** — multiple P0 silent failures in the NSFW image blur pipeline that result in unblurred NSFW reaching the user. The "broken-state fallback" pattern (the v2.4.0 bug pattern) is alive in `image-blur-main.js`. UI handlers also degrade silently when storage or messaging fails. Ship-blocking issues are F-1, F-2, F-5.

---

## Severity legend

- **P0** — User-visible safety/security failure (NSFW leaks through, bypass slips, blocked URL gets followed).
- **P1** — Data loss, corrupted streak/XP, or storage write that the user thinks succeeded.
- **P2** — Degraded UX (silent UI failure, stale state, confusing affordances).

---

## Findings

### F-1 — `image-blur-main.js:139-150` — **THE v2.4.0 BUG IS STILL HERE.** Bare `catch{}` removes pre-blur and lets NSFW through. **[P0]**

**Code:**

```js
// image-blur-main.js, lines 137-150
img.classList.add('rb-blur-pending');

try {
  const shouldBlur = await classify(img);
  img.classList.remove('rb-blur-pending');
  if (shouldBlur) {
    img.classList.add('rb-blur');
    wrapImage(img);
    document.dispatchEvent(new CustomEvent('rb-image-blurred'));
  }
} catch {
  img.classList.remove('rb-blur-pending');   // strips pre-blur on ANY error
}
```

**Failure scenario (the actual cause of "silently fails on Twitter/DDG"):**

1. Twitter / DDG serve images from a foreign origin (`pbs.twimg.com`, `external-content.duckduckgo.com`) without `crossorigin="anonymous"` on the `<img>`.
2. NSFWJS internally calls `tf.browser.fromPixels(img)` which reads the `<img>` into a canvas.
3. Reading an unflagged cross-origin image into a canvas throws `SecurityError: tainted canvas`.
4. The `catch{}` swallows the error AND removes `rb-blur-pending` — the user now sees the **unblurred original**.
5. There is no log, no telemetry, no fallback blur. From the user's point of view, the extension simply does not protect Twitter/DDG/Reddit images. This matches the reported regression precisely.

**Hidden errors that this catch silently eats:**

- `SecurityError` (tainted canvas — the dominant case on Twitter, DDG, Reddit, Imgur hotlinks).
- `OperationError` from TFJS WebGL backend on low-VRAM devices.
- `TypeError` if `model.classify` returns malformed predictions.
- `Error: NSFWJS bundle did not register` from `getModel()` (network/CSP failure loading the bundle).
- Any future TFJS deprecation throw.

All of these currently produce identical observable behavior: pre-blur lifted, NSFW visible, no user-facing signal.

**Fix recommendation:**

```js
} catch (err) {
  // FAIL-SAFE: keep the blur on. Never lift pre-blur on classification failure.
  console.warn('[Rewire Brain] classify failed for', img.src, '— keeping safety blur:', err);
  img.classList.remove('rb-blur-pending');
  img.classList.add('rb-blur');           // permanent blur on any error
  wrapImage(img);
  // Still notify so the user sees stats incrementing — proves blur is working,
  // even when classification can't run.
  document.dispatchEvent(new CustomEvent('rb-image-blurred'));
}
```

This is the canonical "fail-closed" pattern for safety software. The cost (false positives on safe images) is acceptable for a porn blocker; the alternative (false negatives) defeats the entire product.

A second, complementary fix: set `img.crossOrigin = 'anonymous'` *before* the image loads, but this requires DOM manipulation before the page paints — out of scope for `document_idle`. Fail-closed catch is the correct primary fix.

---

### F-2 — `image-blur.js:14-22` — `chrome.storage.local.get` failure silently disables blur sitewide. **[P0]**

**Code:**

```js
// image-blur.js, lines 14-22
let settings;
try {
  settings = await chrome.storage.local.get([
    'imageBlurEnabled', 'imageBlurSensitivity', 'imageBlurThreshold',
  ]);
} catch {
  return;     // bridge bails. Main-world classifier waits 5s then exits.
}
```

**Failure scenario:**

1. Service worker is asleep AND the storage layer throws (rare but possible: `Error: Extension context invalidated` after a hot-reload, or quota error during install).
2. `try/catch{ return; }` bails. `data-rb-blur` never gets set.
3. `image-blur-main.js` line 13-18 polls for the dataset attr for 5 seconds, then exits silently.
4. **Result: zero blur on the entire page.** No visual indicator the blur is off. User sees `imageBlurEnabled: true` in the popup but no images are being blurred. This is undebuggable from the user's side.

**Hidden errors:**

- `Error: Extension context invalidated.` (most common — happens on every hot-reload during dev, and on manifest updates).
- `QuotaExceededError` (not on `local`, but the polyfill could throw).
- `TypeError` if `chrome.storage` is undefined (e.g. inside an `<iframe sandbox>`).

**Fix recommendation:**

```js
let settings;
try {
  settings = await chrome.storage.local.get([...]);
} catch (err) {
  console.error('[Rewire Brain] Could not read blur settings:', err);
  // FAIL-SAFE: still enable blur with defaults so we don't regress to "off".
  settings = { imageBlurEnabled: true, imageBlurSensitivity: 'strict', imageBlurThreshold: 0.6 };
}
```

The bridge should never refuse to enable blur because storage failed — the default-on guarantee from `DEFAULTS.imageBlurEnabled = true` (background.js:42) is silently broken by this catch.

---

### F-3 — `image-blur.js:50-54` — IMAGE_BLURRED count never recorded if SW is down. **[P1]**

**Code:**

```js
document.addEventListener('rb-image-blurred', () => {
  try {
    chrome.runtime.sendMessage({ type: 'IMAGE_BLURRED' });
  } catch {}
});
```

**Failure scenario:** Service worker has been evicted (MV3 idle eviction at ~30s). `sendMessage` throws "Could not establish connection. Receiving end does not exist." `try{}catch{}` eats it. The user's `imagesBlurredCount` silently stops incrementing while blur still works visually. Stat in popup/options is wrong.

**Hidden errors:**
- `Error: Could not establish connection. Receiving end does not exist.` (SW asleep)
- `Error: Extension context invalidated.` (after manifest reload)

**Fix recommendation:** Buffer locally and flush on next successful message, or use `chrome.runtime.sendMessage(...).catch(() => sessionBuffer.push(1))`. At minimum, `console.warn` the failure so it's discoverable in DevTools. P1 because data inaccuracy, not safety regression.

---

### F-4 — `background.js:128-134` — Generic message-handler `.catch` returns `err.message` to UI, but most callers ignore it. **[P2]**

**Code:**

```js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('Message handler error:', err);
    sendResponse({ error: err.message });
  });
  return true;
});
```

**Failure scenario:** Any thrown error inside `handleMessage` is logged to the SW console (which the user never opens) and returned as `{ error: '...' }`. The popup, dashboard, options, and onboarding scripts almost universally check only `chrome.runtime.lastError` — they never test `response.error`. So if `chrome.declarativeNetRequest.updateDynamicRules` throws inside `ADD_DOMAIN`, the popup says `"added"` and the rule was never written.

Concrete instance: `popup.js:200-211` — checks `chrome.runtime.lastError` but not `res.error`. Same in `options.js:88-94`, `options.js:139-145`, `dashboard.js:148-152`.

**Fix recommendation:**

Either (a) every UI caller must test `if (res?.error)` and surface it, or (b) the message-handler error path should reject the promise so `chrome.runtime.lastError` is set on the receiver. (a) is the path of least churn.

Sample callsite fix:

```js
chrome.runtime.sendMessage({ type: 'ADD_DOMAIN', domain: val }, (res) => {
  if (chrome.runtime.lastError) { feedback.textContent = 'Error: ' + chrome.runtime.lastError.message; return; }
  if (res?.error)              { feedback.textContent = 'Error: ' + res.error; return; }
  feedback.textContent = 'Added';
  // ...
});
```

---

### F-5 — `content.js:46-51` — 500ms timeout unhides the page even if the URL **is** blocked. **[P0]**

**Code:**

```js
// content.js, lines 49-52
setTimeout(() => {
  if (style.parentNode) style.remove();
}, 500);
```

**Failure scenario:**

1. User navigates to `pornhub.com`.
2. DNR fails to redirect (rare race during rule sync, or user is on a freshly-installed profile where dynamic rules haven't synced).
3. Content script at `document_start` injects the hide-style and asks the SW `CHECK_BLOCKED`.
4. SW is cold-starting. Wake-up takes 700-1200ms on slower hardware.
5. The 500ms timeout fires first, the style is removed, **page becomes visible** in its un-redirected state.
6. ~300ms later, the SW responds `{ blocked: true }` and `window.location.replace(blockedUrl)` runs — but the user has already seen 300-700ms of the unblocked page.

This is exactly the "flash of NSFW" failure mode the content script is supposed to prevent. The timeout is well-intentioned (prevents permanent hang on a dead SW), but its escape hatch defaults to "show the page" rather than "redirect to safe page".

**Hidden errors / failure modes the timeout masks:**
- SW cold-start latency on lower-tier hardware.
- `chrome.runtime.sendMessage` callback never fires (connection silently dropped).
- Storage corruption preventing `isUrlBlocked` from running.

**Fix recommendation:**

If the SW does not respond in 500ms, **fail closed**: redirect to a known-safe extension page rather than reveal the original. This matches the fail-closed posture of every other safety control in the extension.

```js
let resolved = false;
chrome.runtime.sendMessage({ type: 'CHECK_BLOCKED', url: window.location.href }, (response) => {
  resolved = true;
  if (chrome.runtime.lastError) { style.remove(); return; }   // ext context dead, can't help
  if (response?.blocked) {
    chrome.runtime.sendMessage({ type: 'SITE_BLOCKED', url: window.location.href });
    window.location.replace(chrome.runtime.getURL('blocked.html') +
      '?url=' + encodeURIComponent(window.location.href));
  } else {
    style.remove();
  }
});

setTimeout(() => {
  if (resolved) return;
  // SW did not respond. We do not know if this URL is blocked.
  // Fail-closed: redirect to a safe extension page instead of revealing.
  // (Use blocked.html with a "checking" flag, NOT inline DOM injection.)
  window.location.replace(chrome.runtime.getURL('blocked.html') +
    '?url=' + encodeURIComponent(window.location.href) + '&reason=sw_timeout');
}, 1500);  // bump from 500ms to 1500ms — SW cold start exceeds 500ms regularly
```

(Cost: false-positive interstitial on slow hardware when the URL was actually safe. Acceptable for a porn blocker. Refresh fixes it.)

Note for the implementer: do **not** rebuild blocked.html via `document.documentElement.innerHTML = ...` — that itself would be a CSP/XSS smell. Always redirect to the existing extension page.

---

### F-6 — `background.js:267-281` — `SET_REDIRECT` returns `{ error }` on bad URL, but `options.js:150-157` does not check for it. **[P2]**

**Code:**

`background.js:`
```js
case 'SET_REDIRECT': {
  const url = (message.url || '').trim();
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { error: 'Only HTTP/HTTPS URLs allowed' };
      }
    } catch {
      return { error: 'Invalid URL' };
    }
  }
  await chrome.storage.local.set({ redirectUrl: url });
  return { redirectUrl: url };
}
```

The protocol check returns early, so a `javascript:` URL is correctly rejected. The silent-failure problem is in the caller, `options.js:150-157`:

```js
chrome.runtime.sendMessage({ type: 'SET_REDIRECT', url }, () => {
  feedback.textContent = url ? 'Redirect saved' : 'Redirect cleared';
  // ...
});
```

It shows "Redirect saved" *even when background returned `{ error: 'Invalid URL' }`*. The user pastes `javascript:alert(1)`, sees the success checkmark, navigates to blocked.html, the redirect button silently never appears (because `isValidUrl` filters it again on `blocked.js:107`).

The user has no idea why their redirect URL does not work.

**Fix:** check `res?.error` in the callback and surface it.

```js
chrome.runtime.sendMessage({ type: 'SET_REDIRECT', url }, (res) => {
  if (res?.error) { feedback.textContent = res.error; return; }
  feedback.textContent = url ? 'Redirect saved' : 'Redirect cleared';
  // ...
});
```

---

### F-7 — `background.js:128-134` — Promise rejection is swallowed by `.catch` but `sendResponse` may have already fired. **[P2]**

**Code:**

```js
handleMessage(message, sender).then(sendResponse).catch(err => {
  console.error('Message handler error:', err);
  sendResponse({ error: err.message });
});
```

**Failure scenario:** If `handleMessage` resolves first (e.g. `SET_ENABLED`) and *then* something downstream throws (e.g. `syncDynamicRules` hits a quota), the `.then(sendResponse)` already ran with the OK payload. The rejection lands in the `.catch`, which calls `sendResponse({error})` a SECOND time — Chrome silently drops the second call. The error never reaches the UI. The popup shows the toggle flipped to enabled, but the rule actually wasn't synced.

This is a structural issue with `then(...).catch(...)` chained off of an async function that does more than just compute a return value. Better to:

```js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const result = await handleMessage(message, sender);
      sendResponse(result);
    } catch (err) {
      console.error('[Rewire Brain] handler error:', err);
      sendResponse({ error: err.message });
    }
  })();
  return true;
});
```

…but more importantly, `syncDynamicRules` itself should **return its outcome** so the caller can include it in the response:

```js
case 'SET_ENABLED': {
  await chrome.storage.local.set({ enabled: message.enabled });
  // ...
  try {
    await syncDynamicRules();
  } catch (err) {
    return { enabled: message.enabled, ruleSyncError: err.message };
  }
  return { enabled: message.enabled };
}
```

---

### F-8 — `background.js:439-499` `syncDynamicRules` — every storage/DNR error is unhandled. **[P1]**

**Code:** No try/catch anywhere in `syncDynamicRules`. Each of the following can throw:

- `chrome.declarativeNetRequest.getDynamicRules()` — fails if extension permissions are revoked mid-session.
- `chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules })` — fails on rule-id collision (e.g. if a static rule re-uses an ID), on `MAX_NUMBER_OF_DYNAMIC_RULES` exceeded (5,000 default), or on malformed regex.

If the user adds 5,001 custom domains, the 5,001st `updateDynamicRules` throws, background.js:496 throws, message handler catch surfaces `{ error: ... }`, popup ignores it (see F-4), user sees "added" but the domain was actually rejected.

**Fix:** wrap in try/catch and propagate:

```js
async function syncDynamicRules() {
  try {
    const data = await chrome.storage.local.get([...]);
    // ...
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: newRules });
  } catch (err) {
    console.error('[Rewire Brain] syncDynamicRules failed:', err);
    throw new Error('Could not sync block rules: ' + err.message);
  }
}
```

---

### F-9 — `background.js:565-571` `isUrlBlocked` — `catch {}` returns `false` on URL-parse failure. **[P1]**

**Code:**

```js
function isUrlBlocked(url, userDomains = [], userSubs = []) {
  try {
    const parsed = new URL(url);
    // ...
    return false;
  } catch {
    return false;
  }
}
```

**Failure scenario:** Some sites use `about:blank#blocked-here` or `data:text/html,...` URLs to host porn-adjacent content. `new URL()` throws on malformed URLs, the catch returns `false`, not blocked. The function silently treats every malformed URL as "safe."

This is arguably the right call for `data:` (already not navigable to porn at scale), but the silent-default-to-false is a class of bug worth surfacing. **At minimum log it** so the dev can see if any real-world sites are slipping through.

**Fix:**

```js
} catch (err) {
  console.warn('[Rewire Brain] Could not parse URL for blocking check:', url, err);
  return false;  // intentional fail-open for non-http URLs; logged for visibility
}
```

---

### F-10 — `image-blur-main.js:46-63` `getModel()` — only one user-facing path; if the model never registers, every classify silently fails. **[P0]**

**Code:**

```js
async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await loadScript(nsfwjsUrl);
      let tries = 0;
      while (typeof window.nsfwjs === 'undefined' && tries < 100) {
        await new Promise(r => setTimeout(r, 50));
        tries++;
      }
      if (typeof window.nsfwjs === 'undefined') {
        throw new Error('NSFWJS bundle did not register');
      }
      return window.nsfwjs.load(modelUrl);
    })();
  }
  return modelPromise;
}
```

**Failure scenario:** The site has a strict CSP `script-src 'self'` (e.g. GitHub, news sites that lock down). `loadScript(nsfwjsUrl)` adds `<script src="chrome-extension://abc/lib/nsfwjs/nsfwjs.min.js">`. Even though it is an extension URL, **strict CSP can still block it on certain sites** (Trusted Types, `require-trusted-types-for`, or sites using `script-src 'nonce-...'` with no `'unsafe-inline'` or `chrome-extension:` exception).

When the script load fails, `loadScript` rejects, `modelPromise` rejects, every subsequent `await getModel()` re-rejects, every `classify()` throws, F-1's bare catch eats it, **every image on the page is unblurred.**

Combined with F-1, this is the primary mechanism by which Twitter/DDG fail. Twitter's CSP is documented as `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.twitter.com ...` — it does NOT include `chrome-extension:`, so the script may load only because Chrome whitelists extension origins (it usually does, but Trusted Types apps can still reject).

**Fix:**

1. Detect script-load failure and surface it visibly:

```js
async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      try { await loadScript(nsfwjsUrl); }
      catch (err) {
        console.error('[Rewire Brain] NSFWJS bundle could not load (CSP?):', err);
        // Set a global flag so callers know to fail-closed
        window.__rbBlurModelFailed = true;
        throw err;
      }
      // ...
    })();
  }
  return modelPromise;
}
```

2. Whenever `__rbBlurModelFailed` is set, `processImage` should **default to permanent blur** for every qualifying image (the safest behavior on a site where the classifier is dead):

```js
async function processImage(img) {
  // ...
  if (window.__rbBlurModelFailed) {
    img.classList.remove('rb-blur-pending');
    img.classList.add('rb-blur');
    wrapImage(img);
    return;
  }
  // ...
}
```

This is opinionated: on a CSP-locked site we'd blur all images. The alternative (current behavior) is to silently un-blur all images. For a porn-blocker, false-positive blur on news sites is acceptable; false-negative blur on Twitter is the v2.4.0 bug we're trying to fix.

3. Better: ship NSFWJS via `world: "MAIN"` content_script with `js: ["lib/nsfwjs/nsfwjs.min.js"]` directly in the manifest, so it loads via Chrome's privileged content-script mechanism rather than `<script src>` injection. This sidesteps host CSP entirely. **This is the architectural fix** and would eliminate F-10 at the root.

---

### F-11 — `image-blur-main.js:118-130` — `setTimeout(..., 5000)` unblocks load but does not tell us if the image actually loaded. **[P2]**

If an image's `load`/`error` events never fire (rare — happens with `<img loading="lazy">` that gets disposed before entering viewport), the 5s timer fires and we proceed to classify with a 0×0 image, the `naturalWidth < 100` check on line 133 skips it, image is never blurred.

So the unblurred image renders if/when the lazy load eventually completes (post-classification). MutationObserver does not catch attribute changes by default (only childList), so the re-fired load never re-runs `processImage`. **Lazy-loaded images can slip the blur.**

**Fix:** observe `attributes: true, attributeFilter: ['src']` and re-run `processImage` if `dataset.rbProcessed` was set on a 0×0 image.

---

### F-12 — `blocked.js:80-84, 119-122, 138-145, 232-238` — fire-and-forget messaging, no error feedback. **[P2]**

Every `chrome.runtime.sendMessage` in `blocked.js` either omits the callback entirely (line 30, 234) or only checks the success path. If the SW is dead, **bypasses are not logged** — the bypass log will be missing entries, and the `BYPASS_RESISTED` XP for the back button will silently not award.

Most concerning: line 234-238 `LOG_BYPASS` send is fire-and-forget. The bypass actually navigates to `blockedUrl` regardless of whether the log message succeeded. **A user who bypasses while the SW is asleep will have no audit trail** — undermining the accountability story of the feature.

**Fix:** await the response before navigating, with a hard 1s timeout:

```js
document.getElementById('bypassConfirm').addEventListener('click', () => {
  const reason = document.getElementById('bypassReason').value.trim();
  let navigated = false;
  const navigate = () => {
    if (navigated) return;
    navigated = true;
    if (blockedUrl && isValidUrl(blockedUrl)) window.location.href = blockedUrl;
    else window.history.back();
  };
  chrome.runtime.sendMessage({ type: 'LOG_BYPASS', url: blockedUrl, reason }, () => {
    if (chrome.runtime.lastError) console.error('Bypass log failed:', chrome.runtime.lastError);
    navigate();
  });
  setTimeout(navigate, 1000);  // SW asleep? Navigate anyway, but logged the attempt
});
```

---

### F-13 — `onboarding.js:11-20` — ignores `chrome.runtime.lastError`, redirects to dashboard regardless. **[P1]**

```js
chrome.runtime.sendMessage({
  type: 'COMPLETE_ONBOARDING', reason, goal: '', journalTime: ''
}, () => {
  window.location.href = chrome.runtime.getURL('dashboard.html');
});
```

If `COMPLETE_ONBOARDING` failed (e.g. storage write rejected), `onboardingComplete` stays `false`. Next time the popup opens (popup.js:33), `data.onboardingComplete === false` opens onboarding *again*. **Infinite onboarding loop** if storage is broken.

**Fix:**

```js
chrome.runtime.sendMessage({...}, (res) => {
  if (chrome.runtime.lastError || res?.error) {
    document.getElementById('errorMsg').textContent =
      'Could not save your reason. Please try again.';
    return;
  }
  window.location.href = chrome.runtime.getURL('dashboard.html');
});
```

(Requires adding an `errorMsg` element to onboarding.html.)

---

### F-14 — `dashboard.js:148-152` — journal save success only displayed if `res.saved`, else **silent.** **[P1]**

```js
chrome.runtime.sendMessage({ type: 'SAVE_JOURNAL_ENTRY', date: today, text }, (res) => {
  if (res && res.saved) {
    feedback.textContent = 'Saved! +15 XP for journaling';
    setTimeout(() => { feedback.textContent = ''; }, 3000);
  }
});
```

If the message fails (SW dead, storage full, handler exception), the user clicks "Save", **nothing happens visually**, and the entry is lost. Worst when the user is venting in their journal during a relapse — the moment the feature matters most is the moment it silently fails.

**Fix:** add `chrome.runtime.lastError` and `res?.error` checks; show "Could not save — try again" feedback. Save the text in `localStorage` as a backup so a refresh does not lose the venting.

---

### F-15 — `popup.js:103-109` — toggle writes directly to `chrome.storage.local.set` without checking the result. **[P2]**

```js
document.getElementById('blurToggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ imageBlurEnabled: enabled });   // no callback
  document.getElementById('blurStatus').textContent = enabled ? '...' : '...';
});
```

If `set` fails (quota, runtime error), the UI says "Hiding NSFW" but the underlying setting was never persisted. After a SW restart the toggle reverts, and the user thinks the feature is off intermittently.

**Fix:** pass a callback, check `chrome.runtime.lastError`, and revert UI on failure.

---

### F-16 — `popup.js:294`, `options.js:35-44` — direct `chrome.storage.local.set` (settings) does not propagate to running content scripts. **[P2]**

When the user toggles `imageBlurEnabled` in popup or options, the setting is written but **content scripts already running on open tabs continue with their old in-memory `data-rb-blur` attribute.** No `chrome.tabs.sendMessage` is broadcast. Effect: user toggles blur off, but currently-open NSFW pages keep blurring; user toggles blur on, but currently-open Twitter remains unblurred until reload.

This is technically a "silent setting-doesn't-take-effect" failure rather than a catch swallowing an error, but it has the same symptom: user changes a setting, observes no effect, has no idea why.

**Fix:** broadcast a `BLUR_SETTINGS_CHANGED` message and have `image-blur.js` re-read settings + update `dataset.rbBlur` on receipt. Or document this clearly in the UI ("Refresh open tabs to apply").

---

### F-17 — `image-blur.js:10` — `if (window.location.protocol === 'chrome-extension:') return;` skips own pages, but does not skip `about:blank` iframe ancestors / `data:` documents. **[P2]**

Not directly a silent failure but a missed surface: NSFWJS attempts to classify on `about:blank` would silently fail (no images present), but on certain sites the bridge runs in `<iframe data:>` — which still has `data:` protocol. No classification happens but no log either. Low priority.

---

## Cross-cutting recommendations

1. **Adopt a project-wide `logError(category, err, context)` helper.** Every catch in production code should call it. Even if it just `console.error`s with a tag, having a single search target (`logError`) lets you grep for swallowed errors.

2. **Establish a fail-closed contract for safety code.** Any catch in image-blur, content.js, or DNR sync should default to MORE protection on error, not less. F-1 and F-5 are direct violations.

3. **Add a "diagnostics" panel to the dashboard** showing: SW alive timestamp, last storage write success, last NSFWJS model load success, count of classify-failures-in-last-hour. Surfaces the failures users cannot see today.

4. **CSP-resilient NSFWJS load.** Move NSFWJS from `<script src=>` injection to a `world: "MAIN"` content script declared in manifest (alongside `image-blur-main.js`). Eliminates F-10 entirely.

5. **Add local-only telemetry (per project rule #10 + #6 — no PII, no remote API).** Counters surfaced in the dashboard, not remote logging. Just enough to let the user see "26 classification failures on this site, blur was applied as fallback" so silent failures stop being silent.

---

## Summary table

| ID | File:line | Severity | Title |
|----|-----------|----------|-------|
| F-1 | image-blur-main.js:148 | **P0** | Bare `catch{}` removes pre-blur, NSFW renders |
| F-2 | image-blur.js:20 | **P0** | Storage failure disables blur sitewide |
| F-3 | image-blur.js:53 | P1 | IMAGE_BLURRED count silently lost when SW asleep |
| F-4 | background.js:131 + callers | P2 | `res.error` ignored by every UI caller |
| F-5 | content.js:49 | **P0** | 500ms timeout reveals page on slow SW |
| F-6 | options.js:153 | P2 | SET_REDIRECT error swallowed; "saved" lies |
| F-7 | background.js:128 | P2 | Double-`sendResponse` on async re-throw |
| F-8 | background.js:439 | P1 | `syncDynamicRules` no try/catch |
| F-9 | background.js:568 | P1 | `isUrlBlocked` catch returns `false` silently |
| F-10 | image-blur-main.js:46 | **P0** | NSFWJS load failure leaves classify dead, F-1 hides it |
| F-11 | image-blur-main.js:128 | P2 | 5s timeout proceeds even on never-loaded image |
| F-12 | blocked.js:234 | P2 | Fire-and-forget bypass log |
| F-13 | onboarding.js:13 | P1 | Onboarding redirect ignores save failure |
| F-14 | dashboard.js:144 | P1 | Journal save silently fails |
| F-15 | popup.js:105 | P2 | Storage write no-callback |
| F-16 | popup.js:294 + options.js:36 | P2 | Setting changes do not propagate to live tabs |
| F-17 | image-blur.js:10 | P2 | `data:` / iframe ancestor edge case |

**P0 count:** 4 (F-1, F-2, F-5, F-10)
**P1 count:** 5 (F-3, F-8, F-9, F-13, F-14)
**P2 count:** 8

---

## Final verdict

**CRITICAL — do not ship v2.4.0 to CWS until F-1, F-2, F-5, and F-10 are fixed.**

The Twitter/DDG silent-blur regression is fully explained by the F-1 + F-10 combo: NSFWJS `model.classify` throws (CSP block, tainted canvas, or bundle-load failure), and the bare `catch{}` strips the pre-blur and lets the image render. The fix is structural — fail closed on classifier failure, and load NSFWJS via the manifest content_script declaration so host-site CSP cannot block it.

F-5 is the second silent-NSFW vector: a 500ms content-script timeout on a slow SW reveals the original page before the redirect can fire. This was not the v2.4.0 reported bug but it lives in the same family.

The non-blur findings (F-13 onboarding loop, F-14 silent journal save, F-4 ignored handler errors) are P1/P2 quality issues — they do not leak NSFW but they erode trust in a product that has to be trustworthy to do its job.

Recommended action sequence:
1. Patch F-1 (5-line change) — restores the v2.3.x behavior immediately.
2. Patch F-2 (default-on fallback in catch) — restores the default-on guarantee.
3. Patch F-5 (timeout fail-closed + bump to 1500ms).
4. Architectural F-10 (move NSFWJS to manifest content_script) — eliminates the CSP class.
5. Then sweep through F-3 to F-17 in a follow-up commit.

After these four fixes, run the test-extension checklist on Twitter, DuckDuckGo Images, Reddit, and Bing Images. If any of the four still flash unblurred NSFW, the bug is something we have not identified yet.
