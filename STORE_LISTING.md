# GovLens — Chrome Web Store Listing Copy

Copy/paste-ready content for the Chrome Web Store submission. Last updated 1 May 2026.

---

## Item details

### Item name (45 chars max)
```
GovLens — Universal Gov Portal Reader
```

### Short description (132 chars max)
```
Translate any government portal into your language. See the page map. Search across languages, jump to the exact match.
```

### Detailed description (16,000 chars max — keep it tight)

```
GovLens turns any government portal — Indian .gov.in, UK .gov.uk, US .gov, EU, Canada, Australia, and 20+ more — into something a human can actually read.

Three things it does, all in one side panel:

🌐 UNIVERSAL TRANSLATION
Auto-detects the page language — Hindi, Tamil, Bengali, Marathi, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, Assamese, English, and more. Translate the whole page or just a selection, into any of 22+ target languages. Layout stays intact. One click to restore the original.

By default, GovLens uses your browser's built-in on-device AI (Chrome 138+) — free, private, no API key required. Add an Anthropic API key only as a fallback.

🗺 NAVIGATION SIDEBAR
Every gov page exposes its information architecture in one panel:
• All H1–H4 sections with click-to-jump
• Every form on the page with field counts and submit URLs
• All downloadable PDFs, DOCs, XLSs, ZIPs in one list
• Site nav menus (expandable)
• Breadcrumbs

Click any item — the page scrolls there with a flash highlight.

🔍 CROSS-LANGUAGE SEARCH WITH JUMP
Type your query in any language. Tick "Cross-language search" and your query is auto-translated to the page's language before searching. Each result shows the section it came from. Click any result and the page scrolls to that exact occurrence and pulses red for 4 seconds — not just the first match, the Nth match.

PLUS QUALITY-OF-LIFE EXTRAS
• Region-aware jargon explainer — hover any acronym for a plain-English explanation. India dictionary ships full (PAN, GSTIN, PMJAY, NCLT, FEMA, CGHS, EPF, 80+ terms). UK starter set (HMRC, NHS, NIN, DWP, DVLA, PAYE, VAT). USA starter set (SSN, IRS, FICA, IRA, FAFSA, SNAP, USCIS). Other regions are easy to extend.
• Form auto-save — every keystroke into a gov form is saved locally. Session timed out? Restore your draft with one click. Passwords, OTPs and captchas are never saved.
• AI summarise & explain — one-line summary, what the page is for, key actions, documents needed. Or rewrite the whole page in plain language.
• Floating retro search bar — a small Ctrl+F-style bar in the corner of every gov page.

PRIVACY-FIRST
• No analytics. No tracking. No GovLens server.
• Your API key (if you provide one) stays in your browser.
• Form drafts stay in your browser.
• Translation, when on-device, runs entirely on your machine.

Open source. Free forever. Built for the bureaucratic web.

Privacy policy: https://ankursinha.github.io/GovLens/privacy.html
User guide: https://ankursinha.github.io/GovLens/docs.html
Source: https://github.com/ankursinha/GovLens

NOT AFFILIATED with the Government of India. GovLens is an independent project.
```

### Category
**Productivity** (primary). Optional secondary: **Accessibility**.

### Language
**English** (primary). The extension UI itself is English; translation handles other languages.

---

## Privacy practices form

### Single purpose description
```
GovLens helps users read Indian government portals (.gov.in, .nic.in) by providing translation, navigation, and search overlays. Single purpose: make these portals easier to use.
```

### Permission justifications

Paste one of these into each permission's justification field on the listing.

#### `activeTab`
```
Read the URL and inject scripts into the gov portal page the user is currently viewing, only when they interact with the GovLens icon or side panel. Used to extract page structure and apply user-requested translations.
```

#### `scripting`
```
Inject small functions into gov portal pages to extract sections, forms, links, and downloadable documents; to apply in-place translations; and to scroll to and highlight search matches the user clicked. Only runs on .gov.in / .nic.in domains.
```

#### `storage`
```
Save the user's preferences (target language, feature toggles) and optional Anthropic API key in chrome.storage.local. Stored only on the user's device; never transmitted except in the user's own outbound API calls.
```

#### `tabs`
```
Detect when the active tab navigates to a .gov.in or .nic.in URL so the side panel can show the green badge and re-extract page data on navigation.
```

#### `sidePanel`
```
GovLens's primary UI is rendered in Chrome's side panel.
```

#### Host permissions for government domains (multiple country TLDs)
```
The extension's content script only runs on government websites — domains like .gov.in, .gov.uk, .gov, .gc.ca, .gov.au, .europa.eu, .gouv.fr, etc. Required to read page text for translation, search, and the navigation map. The full list is enumerated in regions.js and the manifest. Each was added because it's the verified TLD for a national or supranational government — never a generic commercial TLD.
```

#### Host permission: `https://api.anthropic.com/*`
```
When the user opts in by providing an Anthropic API key, GovLens makes HTTPS calls to api.anthropic.com to translate or summarise text that the user explicitly requests via the side panel UI. No automatic background calls.
```

### Data usage disclosures

| Question | Answer |
|---|---|
| Personally identifiable info | **No** |
| Health info | **No** |
| Financial / payment info | **No** |
| Authentication info | **Yes** — the user's optional Anthropic API key, stored locally only |
| Personal communications | **No** |
| Location | **No** |
| Web history | **No** |
| User activity | **No** |
| Website content | **Yes** — the text of the gov page is read locally; sent to Anthropic only when the user clicks a cloud AI action and has provided a key |

### Data handling certifications

Tick all that apply:

- [x] We do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] We do not use or transfer user data for purposes that are unrelated to our item's single purpose.
- [x] We do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy URL
```
https://ankursinha.github.io/GovLens/privacy.html
```

(Replace `ankursinha` with the actual GitHub username if different. Pages must be enabled and the URL must be reachable before submission.)

---

## Assets you still need to produce

The Chrome Web Store requires these images. Not blocking — but required before publish.

| Asset | Spec | Status |
|---|---|---|
| Store icon | 128 × 128 PNG | ✅ already in `/icons/` |
| Small promo tile | 440 × 280 PNG | ❌ TODO — neobrutalist with logo + tagline |
| Marquee promo (optional) | 1400 × 560 PNG | ⚪ optional |
| Screenshots | 1280 × 800 or 640 × 400 PNG, **1–5 images** | ❌ TODO — at least 3: side panel showing translate, navigate, search |

Suggested screenshot captions:
1. "Translate any gov portal in one click — Hindi, Tamil, Bengali, and 22+ more"
2. "See the entire page map: sections, forms, documents, nav"
3. "Search in your language. Jump to the exact match."

---

## Submission checklist

- [ ] $5 developer registration fee paid
- [ ] Verified developer account with publisher info
- [ ] Privacy policy live at the URL above
- [ ] Screenshots and promo tile produced
- [ ] `manifest.json` version bumped to a clean release version (e.g. `1.0.0` for Web Store debut)
- [ ] All console errors cleared on a real gov site test run
- [ ] Tested on at least 3 different gov portals (income tax, EPFO, a state portal)
- [ ] BYOK flow tested with a fresh Anthropic key
- [ ] On-device fallback tested in a browser without an API key
- [ ] README.md and `site/` updated to match the published version

---

## After publishing

- Add Web Store badge to landing page
- Update install instructions on `site/index.html` to point to the store URL
- Pin a GitHub release
- Post to r/India, r/IndianGaming, r/developersIndia, Hacker News if you're feeling brave
