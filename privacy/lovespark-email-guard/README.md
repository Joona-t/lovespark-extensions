# LoveSpark Email Guard

Blocks invisible tracking pixels in Gmail, Outlook & Yahoo Mail. See who's tracking your email opens.

Part of the [LoveSpark Suite](https://github.com/Joona-t) — free, open-source browser extensions for a calmer internet.

## What It Does

Two-layer protection:

1. **Network level** — declarativeNetRequest rules block image requests to 65+ known tracking pixel services before they leave your browser
2. **Heuristic scanner** — content script detects tracking pixels the network rules missed (1x1 images, hidden beacons, self-hosted trackers) and replaces them with a local transparent image

A small shield badge appears on emails that contained trackers.

## Supported Email Clients

- Gmail (mail.google.com)
- Outlook.com / Office 365
- Yahoo Mail

## Tracking Services Blocked (65+)

- **Email marketing:** Mailchimp, Mandrill, HubSpot, Campaign Monitor, Brevo, GetResponse, ConvertKit, ActiveCampaign, Postmark, Litmus
- **Sales tools:** Yesware, Mailtrack, Streak, Mixmax, Outreach, SalesHandy, SalesLoft, Boomerang
- **CRM:** Close, Groove, Snov.io, Customer.io, Drip, MailTag, NetHunt
- **Marketing automation:** Emarsys, Klaviyo, MailerLite, AWeber, Constant Contact, SparkPost, Sailthru, Iterable
- **Enterprise:** Superhuman, SendGrid, Mailjet, Salesforce/ExactTarget
- **Other:** GitHub, Zendesk, Return Path, and more

## Permissions

Only two permissions requested:

- `declarativeNetRequest` — block tracking pixel requests at the network level
- `storage` — save your stats and preferences locally

Host permissions scoped to 5 webmail domains only — the extension does NOT run on the whole internet.

## Install

- [Chrome Web Store](#)
- [Firefox Add-ons](#)

## Privacy

- Zero data collection
- No analytics or telemetry
- Only runs on webmail sites
- All processing happens locally
- Open source (MIT)

## License

MIT
