# LoveSpark Fingerprint Shield — Store Listing

## Name
LoveSpark Fingerprint Shield

## Category
Privacy & Security

## Short Description (132 chars max)
Protects against browser fingerprinting with imperceptible noise injection. No data collection, no tracking.

## Long Description

Even in incognito mode, websites can identify you through browser fingerprinting — a technique that combines your screen resolution, GPU, installed fonts, audio hardware, and dozens of other signals into a unique ID that follows you across the web.

LoveSpark Fingerprint Shield makes you invisible to fingerprinters.

HOW IT WORKS

Instead of blocking browser APIs (which is detectable and breaks websites), Fingerprint Shield adds imperceptible random noise to fingerprinting surfaces. Canvas renders, WebGL output, audio processing, and text measurements all return slightly different values on each visit. Your browsing experience is unchanged — but your fingerprint hash is different every time.

WHAT IT PROTECTS

- Canvas 2D fingerprinting (toDataURL, getImageData)
- WebGL fingerprinting (GPU vendor/renderer, readPixels)
- AudioContext fingerprinting (oscillator + compressor hashing)
- Font enumeration (text measurement probes)
- Screen property fingerprinting (resolution, color depth)
- Hardware fingerprinting (CPU cores, device memory)
- Battery API fingerprinting
- Media device enumeration
- Client Rects fingerprinting (DOM element dimensions)
- High-resolution timer fingerprinting

WHAT IT DOESN'T DO

- Does not block or break any website functionality
- Does not block ads or content
- Does not collect your data
- Does not require any special permissions

PRIVACY

- Zero data collection
- No accounts, no API keys, no tracking
- No analytics or telemetry
- Only permission required: storage (for your preferences)
- All processing happens locally in your browser
- Open source

Part of the LoveSpark Suite — tools that respect your attention and privacy.

## Privacy Policy URL
https://github.com/Joona-t/lovespark-extensions/blob/main/privacy/lovespark-fingerprint-shield/PRIVACY.md

## Tags
fingerprint, privacy, anti-tracking, browser fingerprinting, noise injection
