# GovLens — Universal Reader for Government Portals

A Chrome extension that overlays a universal reader on top of any country's government portals — India, UK, US, EU, Canada, Australia, New Zealand, Singapore, South Africa, France, Germany, Italy, Spain, Japan, China, Brazil, Mexico, Argentina, Chile, Peru, Pakistan, Bangladesh, Sri Lanka, Nepal, Ireland, and more. Three pillars:

1. **Universal translation** — auto-detect page language; translate to any of 22+ languages, in-place, restorable.
2. **Navigation sidebar** — page sections, forms, downloadable docs, nav menus, breadcrumbs — all click-to-jump.
3. **Cross-language search** — type a query in your language; it translates to the page's language; click any result to jump and pulse-highlight the exact match.

Plus: jargon explainer (PAN, GST, PMJAY, …), form draft auto-save, AI summarise, floating in-page search bar.

---

## Architecture

| File              | Role                                                             |
|-------------------|------------------------------------------------------------------|
| `manifest.json`   | MV3 manifest. Side panel registered. 25+ gov-domain hosts allowed. |
| `regions.js`      | Single source of truth — gov-URL detection + region inference.   |
| `background.js`   | Sets country-code badge on gov sites; opens side panel on click. |
| `sidepanel.html`  | Three-pillar UI (Translate / Navigate / Search) + Settings drawer.|
| `sidepanel.css`   | Neobrutalist styling: thick black borders, hard shadows, no radius.|
| `sidepanel.js`    | IA extraction, translate batches, search-and-jump messaging.     |
| `content.js`      | In-page work: jargon highlight, form auto-save, jump-to-match.   |
| `overlay.css`     | Floating search bar, jargon tooltip, restore banner, jump pulse. |
| `jargon.js`       | Region-keyed dictionaries (IN full, GB/US starter, others extensible). |

---

## Install (Developer mode)

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → pick this folder
3. Click the GovLens icon → ⚙ Settings → paste an Anthropic API key (`sk-ant-...`)
4. Visit any `.gov.in` site

The toolbar icon opens the side panel directly. The popup has been removed.

---

## How it works

### Translation
- Detects page language via `<html lang>` and Unicode-script analysis (Devanagari, Tamil, Bengali…).
- Walks the DOM, wraps each text node with a stable `data-gl-tx-id`, batches them to Claude Haiku.
- "Restore Original" reverts to the saved original text.

### Navigate (IA exposure)
- Extracts H1–H4 sections, all `<form>`s with field counts, every PDF/DOC/XLS, all `<nav>` blocks, breadcrumbs.
- Click any item → scrolls to it on the page and adds a pulse highlight.

### Search and jump
- Side panel walks the DOM via `TreeWalker`, returns matches indexed by `occurrenceIndex` with section context.
- Click a result → sends `JUMP_TO_MATCH` to the content script.
- Content script re-walks, finds occurrence #N, wraps it in `<mark class="gl-mark gl-active gl-jump-pulse">`, scrolls into view, and pulses for 4s.
- Optionally translates the query to the page language first.

### Local-first
- API key in `chrome.storage.local` only.
- Form drafts in `localStorage` keyed by `origin + pathname`.
- No analytics. No GovLens server. Translation calls go directly to `api.anthropic.com`.

---

## Supported domains

Currently 30+ government TLDs across 25+ countries. The full list lives in `regions.js`. Notable inclusions:

- **India** — `*.gov.in`, `*.nic.in` (covers central + every state portal)
- **UK** — `*.gov.uk`
- **USA** — `*.gov`, `*.mil`
- **Canada** — `*.gc.ca`, `*.canada.ca`
- **Australia / NZ** — `*.gov.au`, `*.govt.nz`
- **EU bodies** — `europa.eu`
- **France / Germany / Italy / Spain** — `.gouv.fr`, `.bund.de`, `.gov.it`, `.gob.es`
- **Latin America** — `.gob.mx`, `.gov.br`, `.gob.cl`, `.gob.pe`, `.gob.ar`
- **East Asia** — `.go.jp`, `.lg.jp`, `.gov.cn`, `.gov.sg`
- **South Asia** — `.gov.pk`, `.gov.bd`, `.gov.lk`, `.gov.np`
- **Africa** — `.gov.za`
- **Ireland** — `.gov.ie`

To add a country, edit the `REGIONS` array in `regions.js` and the `host_permissions` + `content_scripts.matches` arrays in `manifest.json`.

## Adding region-specific jargon

Each region has its own dictionary in `jargon.js`. India ships full (~80 terms). UK and US ship starter sets. To extend a region or add a new one:

```js
const FR = {
  CAF: { full: "Caisse d'Allocations Familiales", desc: "French family-benefits agency." },
  CNAM: { full: "Caisse nationale d'assurance maladie", desc: "National health-insurance fund." },
  // ...
};
const BY_REGION = { IN, GB, US, FR };  // add your region here
```

The regex is built automatically from dict keys.

---

## Privacy

The extension does not phone home. The only outbound call is to the Anthropic API, sent only when you click Translate / Summarise / Explain. Your API key is stored locally and never transmitted anywhere except in the `x-api-key` header to `api.anthropic.com`.

---

## Roadmap

- Chrome Web Store submission (needs privacy policy + screenshots).
- PDF text extraction in-place (pdf.js).
- Cross-portal search (multi-tab grep).
- Application status tracker (saved reference numbers, batch poll).
