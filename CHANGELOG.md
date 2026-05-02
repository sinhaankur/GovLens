# Changelog

All notable changes to GovLens are documented in this file. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [Semantic Versioning](https://semver.org/).

## [2.1.2] — 2026-05-02

### Fixed
- **Critical**: language picker dropdown was being clipped by parent stacking contexts. Animated cards (`gl-card-in` keyframe with `animation-fill-mode: both`) leave `transform` set permanently, which makes any descendant `position: fixed` element resolve relative to the card instead of the viewport. The popover now portals to `document.body` on init, escaping all transformed ancestors.
- Outside-click handler updated to check both `root.contains` and `pop.contains` since the popover is no longer a descendant of the picker root.

### Added
- Spring-overshoot hover treatment on score-history rows (`padding-left` + `translateX` + active-state scale).

## [2.1.1] — 2026-05-02

### Fixed
- Language picker popover was clipped behind sibling cards due to `z-index: 20` colliding with stacking contexts created by card animations.
- Popover was squeezed into a narrow grid cell (the third column of `lang-row`) when the picker shared horizontal space with the source-language chip.

### Changed
- **Restructured `lang-row`** into a top "lang-source-row" (chip + arrow + "TRANSLATE TO" label) plus the picker on its own full-width row beneath.
- **Popover repositioning logic**: `position: absolute → position: fixed` with JS-driven `top`/`left`/`width`/`maxHeight` from the trigger's `getBoundingClientRect`. Auto-flips above when there's no room below; clamps height to visible viewport.
- **Trigger button**: real brutalist shadow + spring hover/active states. Arrow rotates 180° on expand via spring curve.
- **Popover entrance**: opacity + Y-translate + scale, 0.32s, `cubic-bezier(0.34, 1.56, 0.64, 1)`. `transform-origin` switches based on flip direction.
- **List item entrance**: first 8 rows stagger-fade in with 20ms gaps (Framer Motion-style cascade).

## [2.1.0] — 2026-05-02

### Added
- **Searchable language picker** — type to filter 100+ languages by code, English name, native script, or hint. Recent picks appear at the top.
- **Indian sub-regional & tribal languages** — Bhojpuri, Awadhi, Magahi, Maithili, Chhattisgarhi, Marwari, Haryanvi, Bundeli, Kumaoni, Garhwali, Hindko, Tulu, Kodava, Bhili, Saurashtra, Gondi, Kurukh, Mundari, Ho, Kharia, Mizo, Khasi, Kokborok, Garo, Dimasa, Karbi, Hmar, Ladakhi, Lepcha, Sikkimese, Balti, Torwali, Naga languages, Adi, Apatani.
- **Bihar/Jharkhand languages** — Angika, Bajjika, Khortha, Surjapuri, Tharu, Pali.
- **Historic-script support** — Kaithi (𑂍𑂶𑂘𑂲) and Tirhuta (𑒞𑒱𑒩𑒯𑒳𑒞𑒰) for older Bhojpuri/Magahi/Maithili documents. Routes through Anthropic with a transliterate-then-translate prompt.
- **Bhojpuri/Awadhi/Magahi/Maithili/Marathi source detection** — vocabulary-based heuristic distinguishes Devanagari Indian languages instead of treating all as Hindi.
- **Score history** — last 50 scores persisted in `chrome.storage.local`. History view shows deltas vs previous score on the same URL.
- **Predicted-engine indicator** — shows which engine will answer (`On-device AI` / `Google Translate` / `Anthropic Cloud`) before the user clicks Translate.
- **Soft-delete drafts with undo** — clicking DISMISS on the form-restore banner now triggers a 30-second undo toast instead of hard-deleting the saved draft.
- **Empty-state launchpad** — non-gov sites now show 12 example portals across 6 countries with click-to-launch instead of a dead "visit a gov site" message.
- **Keyboard navigation** — full ARIA tablist pattern (←/→ / Home/End / Enter), Esc closes the Settings drawer.
- **`aria-live` engine status** — engine changes announced to screen readers.

### Changed
- Manifest description trimmed to 114 chars (under 132 limit).
- Engine cascade — translate.googleapis.com added as middle tier between on-device and Anthropic. Free, no API key.
- Cross-language search query now correctly translated *to* the page's language (was hitting `pageData.lang → pageData.lang` no-op).
- `translatePage` and `translateSelection` no longer show the API-key wall when Google Translate is available.
- `restoreOriginal` now unwraps every translation `<span data-gl-tx-id>` so the page DOM is byte-for-byte identical to pre-translation.

### Fixed
- Jump-to-match fallback was dispatching a `govlens-jump` event after a fresh executeScript injection — but the listener for that event lived in `content.js`, which is exactly what wasn't loaded. Replaced with a self-contained `jumpInline` function.
- `content.js` boot was gated on `chrome.storage` callback firing; added try/catch + 800ms safety timer.

## [2.0.0] — 2026-05-01

### Added
- **Side panel rebuild** — primary UI moved from popup to `chrome.sidePanel`.
- **Three pillars**: Translate / Navigate / Search.
- **Universal translation** with 3-engine cascade (on-device → Google → Anthropic BYOK).
- **Navigation map** — sections, forms, downloadable docs, nav menus, breadcrumbs.
- **Cross-language search with jump-and-pulse** — click a result, exact occurrence pulses red for 4 seconds.
- **8-axis usability score** — readability, navigation, accessibility, form usability, multilingual support, content clarity, mobile-friendly, trust.
- **25+ countries supported** — `.gov.in`, `.nic.in`, `.gov.uk`, `.gov`, `.mil`, `.gc.ca`, `.canada.ca`, `.gov.au`, `.govt.nz`, `.europa.eu`, `.gouv.fr`, `.bund.de`, `.gob.es`, `.gob.mx`, `.gob.cl`, `.gob.pe`, `.gob.ar`, `.gov.br`, `.gov.it`, `.go.jp`, `.lg.jp`, `.gov.cn`, `.gov.sg`, `.gov.za`, `.gov.pk`, `.gov.bd`, `.gov.lk`, `.gov.np`, `.gov.ie`.
- **Region-aware jargon dictionaries** — IN full (~80 terms), UK starter (~17), US starter (~26).
- **Form auto-save** — every keystroke saved locally, restore banner on session timeout.
- **Neobrutalist UI** — thick black borders, hard 4px shadows, no border-radius, DM Sans + Space Mono, red/yellow/blue palette.
- **Framer Motion-style animations** — spring overshoot, cascading staggers, `prefers-reduced-motion` respected.

[2.1.2]: https://github.com/sinhaankur/GovLens/releases/tag/v2.1.2
[2.1.1]: https://github.com/sinhaankur/GovLens/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/sinhaankur/GovLens/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/sinhaankur/GovLens/releases/tag/v2.0.0
