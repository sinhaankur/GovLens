# GovLens

> **The bureaucratic web, finally readable.** A Chrome extension that overlays a universal reader on top of any country's government portals.

[![Pages](https://github.com/sinhaankur/GovLens/actions/workflows/pages.yml/badge.svg)](https://github.com/sinhaankur/GovLens/actions/workflows/pages.yml)

🌍 **Live site:** [sinhaankur.github.io/GovLens](https://sinhaankur.github.io/GovLens/) · 📚 **Guide:** [docs.html](https://sinhaankur.github.io/GovLens/docs.html) · 🔒 **Privacy:** [privacy.html](https://sinhaankur.github.io/GovLens/privacy.html)

---

## What it does

Three pillars — all in one Chrome side panel that activates on `.gov.in`, `.gov.uk`, `.gov`, `.canada.ca`, `.gov.au`, `.europa.eu`, `.gouv.fr`, and 25+ more government TLDs.

| Pillar | What it does |
|---|---|
| 🌐 **Translate** | Auto-detect page language. Translate the whole page or a selection into 100+ languages — including 80+ regional / Adivasi / North-East Indian languages and historic Kaithi & Tirhuta scripts. |
| 🗺 **Navigate** | Expose every page section, form, downloadable doc, and nav menu in one panel. Click anything → page scrolls there with a flash highlight. |
| 🔍 **Search** | Cross-language search — type your query in any language. Click any result → page scrolls to the *exact* Nth occurrence and pulses red for 4 seconds. |
| 📊 **Score** | Lighthouse-style 0–100 grade for any gov page across 8 axes. History tracks improvements over time. |

Plus: jargon explainer, form auto-save with undo, AI summarise, retro floating Ctrl+F bar.

---

## Install

### From source (developer mode)

```bash
git clone https://github.com/sinhaankur/GovLens.git
cd GovLens
```

1. Open `chrome://extensions`
2. Toggle **Developer mode** on (top-right)
3. Click **Load unpacked** → select the `govlens-extension/` folder
4. Pin the GL icon to your toolbar
5. Visit any `.gov.in`, `.gov.uk`, `.gov`, etc. page → click GL

### From Chrome Web Store

*Submission in review. Link will be added once approved.*

---

## How translation works without an API key

GovLens has a 3-tier engine cascade:

1. **🟢 On-device AI** (Chrome 138+) — free, private, runs entirely on your machine
2. **🟡 Google Translate** (free, internet) — covers the long tail of common languages
3. **🔵 Anthropic Claude** (BYOK paid) — premium quality, handles transliteration of historic scripts (Kaithi, Tirhuta), works for any language via prompt

The side panel shows a **Predicted engine** badge before you click — so you always know which one will answer. Most users never need an API key.

---

## Features

### Region-aware
Detects which country's government you're on — India, UK, US, EU, France, Germany, Brazil, Japan, etc. — and adapts the jargon dictionary, the country-code badge, and the default target language accordingly.

### India-specific depth
- Full jargon dictionary (PAN, GSTIN, PMJAY, NCLT, FEMA, CGHS, EPF, 80+ terms)
- 100+ Indian languages including all 22 scheduled (Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Sanskrit, Kashmiri, Nepali, Konkani, Maithili, Sindhi, Bodo, Dogri, Manipuri, Santali)
- Plus regional non-scheduled (Bhojpuri, Awadhi, Magahi, Chhattisgarhi, Marwari, Haryanvi, Kumaoni, Garhwali, Hindko)
- Plus Bihar/Jharkhand (Angika, Bajjika, Khortha, Surjapuri, Tharu, Pali)
- Plus Tribal/Adivasi (Gondi, Kurukh, Mundari, Ho, Naga languages)
- Plus North-East (Mizo, Khasi, Kokborok, Garo, Karbi)
- Plus Himalayan (Ladakhi, Lepcha, Sikkimese, Balti)
- **Plus Kaithi & Tirhuta historic scripts** for older documents — AI transliterates to Devanagari then translates

### Searchable language picker
Type to filter 100+ languages by code (`bho`), English name (`Bhojpuri`), native script (`भोजपुरी`), or hint text (`~150M speakers`). Recent picks appear at the top.

### Privacy-first
- No analytics, no tracking, no GovLens server
- Form drafts stay in your browser
- Translation runs on-device by default
- API key (if used) sent only to `api.anthropic.com`

### Accessibility
- Full keyboard nav (arrow-key tabs, Esc closes drawer)
- `aria-live` announcements for engine changes
- Respects `prefers-reduced-motion`
- WCAG 2.2 AA targeted (gaps documented in `USABILITY_ANALYSIS.md`)

---

## Repository layout

```
.
├── govlens-extension/     ← The Chrome extension
│   ├── manifest.json
│   ├── sidepanel.{html,css,js}      Main UI (3 pillars + score)
│   ├── content.js                   In-page work (jargon, forms, jumps)
│   ├── background.js                Service worker (badge + side panel)
│   ├── regions.js                   Gov-domain detection (25+ countries)
│   ├── jargon.js                    Per-region acronym dictionaries
│   ├── langpicker.js                Searchable language combobox
│   ├── scoring.js                   8-axis page-grade analyser
│   ├── overlay.css                  In-page CSS (toolbar, tooltips, pulse)
│   └── icons/
├── site/                  ← GitHub Pages site (auto-deployed)
│   ├── index.html         Marketing landing
│   ├── docs.html          Visual user guide
│   ├── privacy.html       Privacy policy
│   ├── styles.css, docs.css, main.js
│   └── assets/store/      Web Store screenshots
├── submission/            ← Web Store upload package (gitignored zip)
├── .github/workflows/
│   └── pages.yml          Auto-deploy site on push
├── USABILITY_ANALYSIS.md  UX audit
├── SMOKE_TEST.md          Pre-submit manual test plan
├── STORE_LISTING.md       Web Store listing copy
├── JOBSEEKER_COMPANION.md Future-feature design doc
├── SUBMIT_NOW.md          Submission walkthrough
└── README.md              You are here
```

---

## Roadmap

- [x] v2.0 — Side panel rebuild, 3 engines, region-aware
- [x] v2.1 — Searchable picker, score history, 100+ languages, audit fixes
- [ ] v2.2 — Predicted-engine UX polish, real Translator API model-download progress
- [ ] v2.3 — Job-seeker companion (see [JOBSEEKER_COMPANION.md](./JOBSEEKER_COMPANION.md))
- [ ] v3.0 — Shadow-DOM translation overlay (no page DOM mutation)

---

## License

MIT. Use it, fork it, ship it.

---

## Disclaimer

GovLens is **not affiliated** with any government. It is an independent, free, open-source project built to make public-sector portals more accessible.
