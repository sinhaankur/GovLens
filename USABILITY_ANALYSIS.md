# GovLens · Usability Analysis (v2.1)

A heuristic UX audit of the GovLens Chrome extension. Methodology: Nielsen's 10 heuristics + WCAG 2.2 AA + cognitive-load review. Issues are ranked **High / Medium / Low** by impact × frequency.

> **Scope.** Audit covers the side panel UI, the in-page floating toolbar, the jargon tooltip, the form-restore banner, and the Settings drawer. Does *not* cover output quality of the AI engines (Anthropic, Google Translate, Chrome built-in).

---

## TL;DR

| | Score | Headline |
|---|---|---|
| **Visibility & feedback** | 7/10 | Status strip + engine badge work; empty states are weak. |
| **User control & freedom** | 6/10 | Restore Original is one-click; Dismiss-draft has no undo. |
| **Consistency** | 9/10 | Brutalist system applied evenly. |
| **Error prevention** | 5/10 | API key validated by prefix only; no test call. Translate is destructive. |
| **Recognition vs. recall** | 8/10 | Three pillars are obvious; engine cascade is hidden. |
| **Flexibility / efficiency** | 4/10 | Zero keyboard shortcuts. No tab arrow-nav. No copy buttons. |
| **Aesthetic & minimal design** | 8/10 | Clear hierarchy, but every panel ships every option visible. |
| **Help & documentation** | 7/10 | Docs page is good. In-product help is missing. |
| **Help users recover from errors** | 6/10 | "Error: 401 invalid_api_key" is too technical. |
| **Match real world** | 8/10 | Country-coded badge + region detection grounds users in reality. |
| **Accessibility (WCAG 2.2 AA)** | 5/10 | Several blockers — see Section 4. |

**Overall: 6.6 / 10.** Strong fundamentals; concrete gaps before it deserves a 9.

---

## 1. High-impact issues (ship-blocking for a 5-star Web Store debut)

### H1 — Engine cascade is invisible until *after* the user clicks
**Heuristic:** Visibility of system status (#1).

The user has no way to predict which engine will answer their click. `On-device AI / Google Translate / Anthropic Cloud` only appears in the engine badge *after* a translation completes. Two side-effects:

- A user who's worried about privacy can't tell if Google or Anthropic *would* be hit before they trigger it.
- A user with no API key doesn't know whether their click is going to "just work" or fall through to an error.

**Fix.** Show *predicted* engine ahead of time. On the Translate tab, under the language row, render: `Will use: <badge>` updated reactively as the user changes target language. If the prediction is "Anthropic Cloud" but no key is set, show a yellow inline warning with `[ADD KEY]` button.

**Effort:** ~30 LOC in `sidepanel.js`. Reuses `isBuiltinTranslateAvailable` + `isGoogleEnabled` already there.

---

### H2 — Translation is destructive without preview
**Heuristic:** Error prevention (#5).

Clicking **TRANSLATE PAGE** on a 50-segment page rewrites every visible text node. Restore is one click and works cleanly (audit fixed the wrapper-span bug), but the user commits to a full rewrite without seeing a single translated sentence first.

For long pages with 500+ segments, a botched translation (rare but possible: API outage mid-batch, rate limit, source-lang misdetection) leaves the page in a half-state until they hit Restore.

**Fix.** Two-part:
1. **Translate first segment as a preview** — translate just the page `<h1>` first, show it in a small card "Preview: …", offer **CONTINUE** or **CANCEL**.
2. **Sample-mode toggle** — let the user translate just the first 20% of the page, evaluate quality, then commit.

**Effort:** ~60 LOC. Worth it.

---

### H3 — No copy / share for AI output
**Heuristic:** Flexibility & efficiency (#7).

Summary, plain-English explanation, and translated selection appear inside `aiOutCard`. The user can select-and-copy, but no button. On a long summary they'll often want to:
- Copy to clipboard
- Share a screenshot
- Re-run with a different language

None of those are one-click.

**Fix.** Three small icon buttons in the card header: 📋 copy / 🔄 re-run / 🌐 re-translate output to another language. ~40 LOC.

---

### H4 — "Dismiss draft" is final with no undo
**Heuristic:** User control & freedom (#3).

The form-restore banner has a `DISMISS` button that hard-deletes the saved draft via `localStorage.removeItem`. If the user mis-clicks, hours of typed form data are gone with no recovery.

**Fix.** Soft-delete pattern. On dismiss, move the draft to a `govlens-draft-trash:<url>` key with a 30-second timer to fully delete. Show a yellow toast: `Draft cleared — UNDO`. After 30 seconds, hard-delete.

**Effort:** ~25 LOC in `content.js`.

---

### H5 — Empty states do not teach
**Heuristic:** Help & documentation (#10).

When the user clicks GL on a non-gov site, the side panel shows: `Visit any government portal — works in 25+ countries.` That's the only signal. They can't:

- Click to open an example portal
- See *which* 25 countries are supported
- Get to the docs

**Fix.** Empty state should be a teaching moment. Show:
- A 2-column grid of 8-12 example portal logos / domain names (clickable)
- "Show all 25+ supported countries →" link to docs
- A "Try GovLens on this page" pseudo-button that grays out for non-gov sites with a tooltip explaining why

**Effort:** ~80 LOC for empty-state component + a small JSON of example portals. Highest leverage for first-time users.

---

## 2. Medium-impact issues

### M1 — Engine status not announced to assistive tech
**Heuristic:** Accessibility.

The engine badge uses `class` to switch color (green / yellow / blue) and changes `textContent`. Screen readers won't announce the change because there's no `aria-live` region.

**Fix.** Wrap the status-strip section in `<div role="status" aria-live="polite">`. Two-line change.

---

### M2 — No keyboard tab navigation
**Heuristic:** Flexibility & efficiency.

Three pillar tabs (`Translate / Navigate / Search`) require a click. Standard tablist pattern needs **←/→** arrow nav and **Home/End** keys. Settings drawer doesn't close on **Esc**.

**Fix.** Add `keydown` listeners + `role="tab"` / `role="tablist"` / `aria-selected`. Already half-marked-up; finish the pattern. ~40 LOC.

---

### M3 — Long translations have no progress feedback per-batch
**Heuristic:** Visibility of system status.

`translatePage` shows `Translating 26–50 / 247…` and a progress bar. But on a slow network with batch 5/10 stalled, the user has no way to:
- See which batch is stalled
- Cancel
- Switch engine mid-flight

**Fix.** Add a `[CANCEL]` button next to the progress bar. Implement an `AbortController` passed into `callClaude` / `googleTranslate` / `builtinTranslate`. ~50 LOC.

---

### M4 — Jargon tooltip is hover-only
**Heuristic:** Match real world / accessibility.

The tooltip fires on `mouseover`. Touch devices get nothing — Chrome does run on tablets. Keyboard users with `tabindex=0` on `.gl-jargon` (which we set!) *can* focus the term but no `focus` listener fires the tooltip.

**Fix.** Add `focus`/`blur` handlers identical to the hover ones. Two lines.

---

### M5 — Search panel doesn't enforce minimum query length
**Heuristic:** Error prevention.

Side-panel search runs on whatever the user types and hits GO. Single-character queries return 100+ noisy hits. The in-page floating toolbar has a 2-char minimum; the side panel does not.

**Fix.** `if (queryRaw.length < 2) { setMeta('Type at least 2 characters'); return; }` Five lines.

---

### M6 — API-key validation is shallow
**Heuristic:** Error prevention / error recovery.

Save Key button only checks the prefix `sk-ant-`. The user with an expired/revoked/typo'd key won't know until they trigger their first cloud translation, which then fails with a 401. The error message at that point is `Error: API 401: {"error":"invalid_api_key"...}` — technical and unfriendly.

**Fix.** On Save, fire a 1-token test call. If it fails, show a friendly error inline: `Key looks invalid — Anthropic returned 401. Check the dashboard.` ~20 LOC.

---

### M7 — Color-contrast yellow-on-white in tooltips is borderline
**Accessibility.**

`.gl-jargon` text uses inherited color over a `rgba(255,217,26,0.55)` background. On white-background pages this passes contrast for typical body text, but on yellow-themed gov sites the term becomes near-invisible. Computed contrast is page-dependent.

**Fix.** Force `.gl-jargon` text color to `#0d0d0d` regardless. One CSS line.

---

### M8 — Translation modifies DOM in ways the underlying site might watch
**Heuristic:** Error prevention.

`collectTranslatableChunks` wraps every text node in a `<span data-gl-tx-id>`. Some gov sites use mutation observers or specific CSS selectors (`p > strong + em`) that break when wrappers are added. The user sees layout glitches; the cause is hidden.

**Fix.** Two-stage:
1. **Detect** — after translation, count the number of *layout shifts* via `LayoutShift` performance entries. If high, surface a yellow note: `This page may not handle in-place translation well — try Translate Selection.`
2. **Long-term** — investigate using the CSS Custom Highlight API or `attachShadow` for translation overlays instead of DOM mutation.

**Effort:** Detection ~25 LOC; long-term solution is a v3 project.

---

## 3. Low-impact issues

| # | Issue | Fix |
|---|---|---|
| L1 | "+ CUSTOM…" target language input persists even after dropdown changes | Hide on any non-custom selection |
| L2 | No way to mark a draft as "submitted" — drafts pile up across visits | Auto-clear after successful form submission detection |
| L3 | Search results have no per-result "open in new tab to anchor" option | Append URL hash anchor on jump |
| L4 | Settings drawer height grows with toggles; could overflow on small screens | Make it scrollable; cap at 70vh |
| L5 | Engine probe runs once on init; doesn't re-probe if Chrome later downloads a model | Re-probe when `Translator.create` succeeds |
| L6 | Floating toolbar position fixed bottom-right — may overlap site CTAs there | Make it draggable; remember position |
| L7 | No confirmation when toggling Auto-save off — risk of losing unsaved draft | Brief warning toast |
| L8 | Stat cards in Navigate show count "47" with no unit; hover or label could clarify | Tooltip on hover |
| L9 | Animations don't respect `prefers-contrast: more` (only `prefers-reduced-motion`) | Add high-contrast media query |
| L10 | All errors collapse into the same "ERROR" label | Categorize: NETWORK, AUTH, RATE-LIMIT, INVALID-INPUT |

---

## 4. WCAG 2.2 AA gaps

A focused check, not exhaustive.

| Criterion | Status | Note |
|---|---|---|
| **1.1.1 Non-text content** | ⚠ Partial | Side panel uses emoji as icons — fine for sighted users, screen readers will read "speaking head"-style names. Add `aria-label` on emoji-only buttons. |
| **1.3.1 Info & relationships** | ⚠ Partial | Tabs use `role="tab"` but the panels are missing `aria-labelledby`. |
| **1.4.3 Contrast (minimum)** | ✓ Mostly | Body text and buttons pass. Yellow `.gl-jargon` background needs explicit dark text (M7). |
| **1.4.10 Reflow** | ✓ | Side panel handles narrow widths. |
| **2.1.1 Keyboard** | ✗ Fail | Tabs not keyboard-navigable. Settings drawer doesn't trap focus when open. Close-on-Esc missing. |
| **2.4.3 Focus order** | ⚠ Partial | Drawer opens but focus doesn't move to the first focusable element inside. |
| **2.4.7 Focus visible** | ✓ | Browser default focus rings preserved. |
| **3.3.1 Error identification** | ⚠ Partial | Errors shown but not associated with the offending input via `aria-describedby`. |
| **3.3.3 Error suggestion** | ⚠ Partial | Anthropic 401 error doesn't say *what to do*. |
| **4.1.2 Name, role, value** | ⚠ Partial | Engine badge changes value silently — needs `aria-live`. |

**Quick-win bundle:** ~3 hours of work would get this to broadly-AA-compliant — it's all small, mechanical fixes. The big items are the three keyboard-navigation gaps and the live-region announcements.

---

## 5. Cognitive load on first run

A new user opens GovLens for the first time on `incometax.gov.in`. Here's the load.

| Step | What they see | Cognitive load |
|---|---|---|
| 0. Click GL icon | Side panel opens. Header, status, three tabs. | **Low.** Brand obvious. |
| 1. Status strip | "India gov site · On-device AI · Lang: EN" | **Medium.** Two acronyms, one badge state. They don't know what "On-device AI" means yet. |
| 2. Tabs | 🌐 / 🗺 / 🔍 + labels | **Low.** Icons + labels do good work. |
| 3. Translate panel | 8 visible cards: lang row, primary CTA, secondary CTA, restore (hidden), status (hidden), api-key-missing (hidden), quick tools (2 buttons), output (hidden) | **High.** Too many options for first run. |
| 4. They click Translate Page | Status card unfolds; progress bar fills. | **Low.** Action → feedback. |
| 5. Page text replaces | Layout intact; visible "Restored" button | **Medium.** They wonder if anything else changed (CSS? JS state?). |

**Key insight:** the Translate panel is currently a *power-user* layout. A new user only needs the language row + the primary CTA. Everything else (selection translate, summarise, explain, restore) should be **progressive disclosure** — shown only after the user completes a first translation.

**Fix.** Two-mode panel:
- **First-run / minimal:** big language row + huge TRANSLATE PAGE button. Nothing else.
- **After first translation:** the rest fades in.

A onboarding tour (3 tooltips) would also help, but adds maintenance cost. Progressive disclosure is cheaper.

---

## 6. Information architecture review

**The three pillars are correct.** Translate / Navigate / Search map cleanly to the three things users want to do on a gov site (read, find, look up). No reorganization recommended.

**The Settings drawer is overloaded.** Currently has: AI engines info, API key, default language, three feature toggles, About. It's becoming a junk drawer. Suggest splitting into:
- **Quick settings** (top of drawer): default lang, engine toggle
- **Account** (collapsible): API key
- **Advanced** (collapsible): jargon, form-save, toolbar toggles
- **About** (collapsible): version, links

Reduces scroll, restores hierarchy.

---

## 7. Recommendations — prioritized roadmap

### Sprint 1 (do before Web Store submission — ~1 day)
1. H1 — predicted engine
2. H4 — soft-delete drafts with undo
3. H5 — empty state with example portals
4. M1 — `aria-live` on engine badge
5. M2 — keyboard tab nav + Esc closes drawer
6. M5 — minimum 2-char search
7. M7 — fix jargon contrast

### Sprint 2 (post-launch polish — ~1 day)
1. H2 — translation preview
2. H3 — copy/re-run buttons on AI output
3. M3 — abortable translation
4. M4 — focus-trigger jargon tooltip
5. Settings drawer reorg (section 6)

### Sprint 3 (research-backed)
1. H2 alt — sample-mode translation (translate first 20%)
2. M8 long-term — DOM-safe translation via shadow overlay
3. New-user progressive-disclosure mode

---

## 8. What's already done well

Worth calling out — not everything's broken.

- **Brutalist system is consistent and unique.** No "yet another extension" feeling.
- **Engine cascade architecture is well-designed.** Three tiers, transparent, opt-out per engine.
- **Region-awareness is rare and useful.** Most "translate" extensions are domain-agnostic and feel generic. Country code in the badge is clever.
- **Form auto-save is a real differentiator.** Almost no one does this for gov forms.
- **Animations match the brand.** Spring physics on chunky brutalist UI shouldn't work but somehow does.
- **Privacy story is genuinely strong.** No analytics, BYOK, on-device fallback, transparent permission disclosures.
- **Documentation is unusually thorough for a v1 extension.** Docs page + privacy page + smoke test + listing prep.

---

## 9. How this audit was conducted

- **Static review** of all extension files: `manifest.json`, `sidepanel.{html,css,js}`, `content.js`, `overlay.css`, `regions.js`, `jargon.js`, `background.js`.
- **Heuristic walkthrough** simulating three personas: (a) first-time user on Indian gov site, (b) returning user with Anthropic key, (c) accessibility user (keyboard-only, screen reader).
- **WCAG 2.2 AA pass** against principle/criterion list.
- **Cognitive-walkthrough** of the first-run flow.

Not covered (would require a real install + screen-reader rig):
- Actual screen-reader announcements (NVDA / JAWS / VoiceOver)
- Real-keyboard tab order with Chrome's `Tab` cycle
- Performance under load on slow devices
- Telemetry on actual user behaviour (we have none, by design)

A full empirical study with 5 users on 3 different gov portals would surface 1.5–2× the issues identified here. Recommend running one before v3.
