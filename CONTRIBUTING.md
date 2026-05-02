# Contributing to GovLens

Thanks for your interest. GovLens is small but ambitious — making government portals usable for everyone. There's plenty to do.

---

## Ways to contribute

### File a good bug report
Use the [bug report template](https://github.com/sinhaankur/GovLens/issues/new?template=bug_report.yml). The single best thing you can include: **the URL of the gov page** where the bug happens, plus what you expected vs what you saw. Screenshots help a lot.

### Suggest a feature
Use the [feature request template](https://github.com/sinhaankur/GovLens/issues/new?template=feature_request.yml). Best feature requests start with a real frustration ("I tried to file ITR-1 and X went wrong") rather than a generic ask.

### Add language support
Three layers, increasing in effort:

1. **Add a language to the picker dropdown** — append an entry to `LANGUAGES` in `govlens-extension/langpicker.js` and `LANG_NAMES` in `govlens-extension/sidepanel.js`. ~5 minutes.

2. **Add jargon for a new country/region** — add a dictionary block in `govlens-extension/jargon.js`. The regex is auto-built from dict keys. See the existing `IN`, `GB`, `US` blocks as templates.

3. **Add source-language detection for a Devanagari variant** — extend the `SIG` table in `extractEverything()` (sidepanel.js) and `scoreMultilingual()` (scoring.js). Needs ~10 signature words a native speaker would recognize.

### Add a new gov-domain TLD
Open `govlens-extension/regions.js` and append a `REGIONS` entry. Then add the matching pattern to:
- `govlens-extension/manifest.json` → `host_permissions`
- `govlens-extension/manifest.json` → `content_scripts.matches`

Submit one PR per country to keep review small.

### Improve the UX score
The 8 axes in `govlens-extension/scoring.js` are heuristics. They miss cases. PRs that add new checks (e.g. detecting AJAX-only forms, or screen-reader-incompatible captchas) are welcome.

---

## Development setup

```bash
git clone https://github.com/sinhaankur/GovLens.git
cd GovLens
```

### Load the extension locally
1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → pick the `govlens-extension/` folder
4. Visit any `.gov.in` / `.gov.uk` / `.gov` page → click the GL icon

### Edit, reload, test
The extension has no build step. Edit any file in `govlens-extension/` and click **Reload** on the entry in `chrome://extensions`. Refresh the gov page. Done.

### Run the smoke test
Before submitting a PR that touches core paths (translation / search / score), run through `SMOKE_TEST.md` against at least 2 of the 5 portals listed there.

---

## Pull request flow

1. Fork the repo
2. Create a branch: `git checkout -b feat/short-description` or `fix/short-description`
3. Make changes — keep PRs small and focused
4. Test locally (load unpacked, click around, check DevTools console for errors)
5. Open the PR using the template
6. The maintainer will respond within ~7 days. Most PRs that follow conventions land within the same week.

### What gets merged fast
- Bug fixes with a clear reproduction steps
- New language entries / jargon additions
- New gov-domain TLDs (one per PR)
- Documentation improvements
- Animation / accessibility polish

### What gets pushback
- New features without a discussion issue first
- PRs that bundle multiple unrelated changes
- Adding dependencies (we have zero, intentionally — keep it that way)
- Breaking the no-tracking / no-analytics promise
- Adding stuff that isn't on the [roadmap](./README.md#roadmap)

---

## Code style

No formal linter — but follow the existing patterns:

- 2-space indent, no semicolons-by-default... actually, semicolons used (just match what's there)
- `const` first, `let` if needed, `var` never
- Comments explain *why*, not *what* (the code itself shows what)
- Function names start with a verb (`translateText`, not `textTranslator`)
- DOM-mutating functions take elements as args; pure helpers take primitives
- No frameworks. No build step. No npm dependencies.

---

## Architecture quick reference

```
govlens-extension/
├── manifest.json     MV3 manifest, permissions, host_permissions list
├── regions.js        Gov-domain → ISO country code mapping
├── background.js     Service worker — sets badge, opens side panel
├── sidepanel.html    Side-panel UI shell
├── sidepanel.css     Neobrutal styles + Framer-style animations
├── sidepanel.js      Three pillars (Translate, Navigate, Search) + Score logic
├── content.js        In-page work — jargon highlight, form auto-save, jump-to-match
├── overlay.css       In-page CSS — toolbar, jargon tooltip, restore banner
├── jargon.js         Per-region acronym dictionaries
├── langpicker.js     Searchable language combobox + LANGUAGES master list
└── scoring.js        8-axis page-grade analyser (runs in page context)
```

Files don't import each other — they're loaded in declared order via `<script>` tags in `sidepanel.html` or via `content_scripts.js` in the manifest. Globals are namespaced as `GOVLENS_*` (e.g. `window.GOVLENS_REGIONS`, `window.GOVLENS_JARGON_BY_REGION`).

---

## What we won't accept

- Any form of analytics, telemetry, or fingerprinting
- Network calls to anywhere other than `api.anthropic.com`, `translate.googleapis.com`, or the user's currently-viewed page
- Background scraping of pages the user isn't actively viewing
- Storing data outside `chrome.storage.local` and the gov page's own `localStorage`
- Code that reads / sends `chrome.storage` data to anywhere external
- Frameworks (React, Vue, Svelte) — keep it vanilla

These keep the privacy story honest and the codebase reviewable.

---

## Code of conduct

Be kind. Disagree on ideas, not people. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

## Questions?

Open a [Discussion](https://github.com/sinhaankur/GovLens/discussions) or an [Issue](https://github.com/sinhaankur/GovLens/issues).
