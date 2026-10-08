# Privacy Policy — LoveSpark CWS Filler

**Last updated:** 2026-06-20

LoveSpark CWS Filler is a developer tool that fills the Chrome Web Store
dashboard from a local `cws-listing.json` file you choose. It is privacy-first
and local-only.

## What it stores
Nothing. The extension has no `storage` permission and keeps no state between
sessions. The `cws-listing.json` you load is read in memory and discarded when
you close the panel.

## What it transmits
Nothing. Zero data is sent anywhere. There is no network code, no analytics, no
telemetry, and no remote endpoints.

## Permissions
The extension declares **no permissions**. It runs a content script only on
`https://chrome.google.com/webstore/devconsole/*` (your own CWS dashboard) to
render the helper panel and fill form fields you have already opened.

## Host access
The content-script match (`chrome.google.com/webstore/devconsole/*`) is used
solely to draw the helper UI and fill the listing form on your own developer
dashboard. It does not read or transmit page content for any other purpose.

## Third-party services
None.

## Children's privacy
This is a developer tool and is not directed at children. It collects no data
from anyone.

## Contact
Issues: https://github.com/Joona-t/lovespark-extensions/issues

## Verification
Open source — read every line at
https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-cws-filler
