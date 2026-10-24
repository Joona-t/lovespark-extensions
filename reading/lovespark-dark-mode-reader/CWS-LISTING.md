# Dark Mode Reader — CWS Listing

## Extension name

Dark Mode Reader — by LoveSpark

*(31 characters)*

## Short description

Dark mode for every website: no white flash, readable contrast, dyslexia-friendly reading layer. Free and private.

*(115 characters)*

## Category

Accessibility

## Language

English

## Detailed description

**Dark mode for every website, built so it stays readable.** Dark Mode Reader turns bright pages dark before they appear on screen. It recolours each site's own styles with contrast that meets accessibility standards, and it leaves sites that are already dark alone.

Most dark mode extensions either invert the whole page, which blurs text and turns photos into negatives, or let you drag sliders until it looks right. Dark Mode Reader takes a different approach.

- 🌙 **No white flash.** A tiny dark stylesheet paints before the page does, so opening a link at night doesn't blind you.
- 🔎 **Readable by construction.** Colours are remapped in the OKLCH colour space with lightness bands chosen so text clears the WCAG AA contrast ratio of 4.5:1 against its background.
- 🤝 **Respects sites that are already dark.** If a site has its own dark theme, the extension measures it and steps aside instead of making it worse.
- 🖼️ **Photos stay photos.** Images and video are gently dimmed, never inverted. You pick the brightness.
- 📖 **A reading layer for neurodivergent readers.** Per site, switch on the OpenDyslexic or Atkinson Hyperlegible font, comfortable 70-character lines, relaxed line spacing and clearly underlined links.
- 🎨 **Three palettes.** Noir for neutral true dark, Plum for a soft brand dark, and Warm for a sepia dark that is easy on the eyes during long reads.
- ⏰ **Schedule it.** Always on, follow your system's dark mode, or set a time window like 20:00 to 07:00.
- ⌨️ **One shortcut.** Alt+Shift+D turns it on or off for the current site.

Built for night owls, people with light sensitivity or migraines, and anyone with eye strain, ADHD or dyslexia who reads on screen all day. It is a dark theme for any website: a night mode, a dark reader and an eye-care tool in one.

**Free forever. Open source. Zero data collection.** MIT licensed. Settings live only in your browser's local storage. No accounts, no ads, no trackers, no upsell, and nothing about your browsing is ever sent anywhere.

Source code: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-dark-mode-reader

## Single-purpose justification

Dark Mode Reader has one purpose: **to make websites comfortable to read in low light by showing them in an accessible dark theme.** Every feature serves that purpose. The dark stylesheet and recolouring engine produce the dark theme. Native-dark detection avoids darkening sites that are already dark. Image dimming keeps photos comfortable in the dark theme. The palettes, schedule, per-site switch and keyboard shortcut control when and how the dark theme appears. The optional reading layer adjusts font, line length and link visibility on the same page so dark-mode reading is easier for dyslexic and low-vision readers. There are no unrelated features, no analytics and no data products.

## Per-permission justification

**storage**: Saves the user's settings (on/off, palette, photo brightness, schedule, reading-layer options) and per-site choices locally in `chrome.storage.local`, plus a session-only cache of recoloured stylesheets in `chrome.storage.session`. Nothing is stored remotely.

**scripting**: Used with `scripting.registerContentScripts` to register a small dark stylesheet that runs at `document_start`, so pages are dark before their first paint. The registration excludes sites the user turned off, and it is removed entirely when the extension is off or outside the user's schedule.

**alarms**: Fires at the start and end of the user's dark-mode time window to switch the theme on or off, and once an hour to reset the "pages darkened today" counter at local midnight.

## Host-permissions justification

**`http://*/*` and `https://*/*`**: The user expects dark mode on whatever website they open, and the dark theme has to apply before the page first paints to prevent a white flash. That requires a content script on every http and https page. The worker also uses host access to fetch the page's own cross-origin stylesheets, which the browser hides from extensions, so it can recolour them. Those requests go to the exact stylesheet URL the page already loaded, without cookies.

This permission is **not** used to read or store page text, form data or browsing history, and nothing is transmitted to LoveSpark or any third party.

## Privacy disclosure (CWS Section 5)

**Data collection categories: "Not collected" for every category.**

- Personally identifiable information: **Not collected**
- Health information: **Not collected**
- Financial and payment information: **Not collected**
- Authentication information: **Not collected**
- Personal communications: **Not collected**
- Location: **Not collected**
- Web history: **Not collected**
- User activity: **Not collected**
- Website content: **Not collected**

**Developer certifications: tick all three.**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/reading/lovespark-dark-mode-reader/PRIVACY.md

## Reviewer test instructions

This takes about 3 minutes. No account or sign-in is needed.

1. **Light site goes dark.** Open `https://en.wikipedia.org/wiki/Dark_mode`. The page appears dark with no white flash, text is light and readable, and photos are dimmed, not inverted.
2. **Popup.** Click the toolbar icon. The popup shows the Sparky mascot, the master switch, "This site: Auto / On / Off", three palettes and the reading-layer switch.
3. **Palette.** Click **Plum**, then **Warm**. The open page updates without reloading.
4. **Reading layer.** Switch **Reading layer** on. Paragraphs change to the OpenDyslexic font with shorter lines and underlined links. Switch it off again.
5. **Per-site off.** Click **Off** under "This site". The page returns to its original light look. Click **Auto** to bring dark mode back. **Alt+Shift+D** does the same toggle.
6. **Already-dark site.** With your OS in dark mode, open `https://github.com`. GitHub shows its own dark theme and the extension leaves it alone. The popup says the site is already dark.
7. **Settings.** Click **⚙ Settings**. Try the schedule options and the site list. **Reset All Data** restores the defaults.

You can confirm in DevTools that the extension sends nothing to any LoveSpark or third-party server.
