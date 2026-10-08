# VAL-CAPTURE-001: Active-site identity is reachable with least privilege

Surface: browser.
Needs: unpacked extension in Chromium; ordinary HTTP(S) and restricted browser tabs.
Behavior: `activeTab` grants temporary URL access only after popup invocation, an ordinary tab displays its canonical hostname, and a restricted/unsupported tab displays an unavailable state without enabling note mutations.
Evidence: manifest assertion excluding persistent host and `tabs` permission; annotated popup screenshots and console observations on both tab classes.
Fail: absent hostname on an ordinary page, enabled mutations without a supported hostname, silent failure, or broader persistent browsing access.
