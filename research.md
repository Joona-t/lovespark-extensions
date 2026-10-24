# Published screenshot extensions — source audit

The final scope is the 16 extension projects marked Published – public in the supplied Chrome Web Store screenshot whose source was located. `scripts/published-scope.cjs` is the explicit allowlist used by the browser and manifest checks.

The screenshot's Retro Pink browser theme has no located source and is excluded. Read Aloud, both Are You Cooked? listings and Pink Anti-Doomscroll are drafts; Sponsor Skip is rejected. These listings and all projects absent from the screenshot are excluded from the final changes.

Fifteen scoped projects are in the consolidated repository. Link Cleaner was recovered from its archived upstream repository at commit `37597b19568b789ba65a98e155d0f3151029fcc4`; it is distinct from UTM Stripper. Source versions differ from some store versions, so testing describes this checkout, not the installed store binaries. Published status is taken from the supplied screenshot.

Actual unpacked extensions are loaded into a disposable Chromium profile using the repository's documented extension-debugging workflow. Website/API fixtures isolate content-script regressions from changes to external services. Existing adblock unit tests and scoped manifest/resource checks supplement browser tests.

References: https://playwright.dev/docs/chrome-extensions and https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle. The external `ls-check`, LoveSpark scripts/docs and automation-log helper were unavailable; the Atlas URL could not be read. None is claimed as passed.
