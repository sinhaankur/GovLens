# GovLens · Pre-submission Smoke Test

Manual checklist to run before submitting to the Chrome Web Store. Five portals, each chosen to exercise a different combination of features. Total time: ~25 minutes.

> **Setup:** Load the unpacked extension from `govlens-extension/`. Pin the GL icon. Optional: paste an Anthropic API key in Settings — leave it blank for the first pass to validate the on-device + Google fallback works for the typical user.

---

## Test 1 — Income Tax (form-heavy, English)

**URL:** https://www.incometax.gov.in/iec/foportal/

**Why this portal:** Most-visited central portal. Mostly English. Has both static info pages and authenticated form flows. Good first test.

**Checklist:**
- [ ] Toolbar GL icon shows green ✓ badge
- [ ] Click GL → side panel opens on right
- [ ] Status strip says **"Gov site detected"** with green dot
- [ ] **Navigate tab** populates within 2 sec — shows non-zero counts for sections / forms / docs / links
- [ ] Click any section in the page-sections list → page scrolls + heading flashes red
- [ ] Click any PDF in the docs list → opens in new tab
- [ ] **Translate tab** → click `📝 SUMMARISE PAGE` → coherent summary appears within 5 sec
- [ ] Hover any acronym on the page (PAN, TDS, ITR) → yellow tooltip with full form + plain-English explanation
- [ ] Floating GL search bar visible bottom-right; type "deduction" → matches highlight in yellow

**Expected engine badge:** `On-device AI` if Chrome 138+ supports the Summarizer API on your machine; otherwise `—` until you cloud-translate.

---

## Test 2 — EPFO (central, deep nav, mixed lang)

**URL:** https://www.epfindia.gov.in/site_en/index.php

**Why this portal:** Notoriously tangled navigation, multiple language variants, lots of `<nav>` blocks. Tests the IA extraction's nav-detection.

**Checklist:**
- [ ] Navigate tab → **NAV MENUS** section shows ≥ 3 detected menus
- [ ] Click any menu row → it expands to show child links
- [ ] Click any child link → opens in new tab to that EPFO sub-page
- [ ] **Stats row**: `Links` count > 100
- [ ] Switch to https://www.epfindia.gov.in/site_hi/ (Hindi version) → status strip shows `Lang: HI`
- [ ] Translate tab → target = English → click **TRANSLATE PAGE**
- [ ] Page text replaces in-place. Layout intact (logos, tables, columns)
- [ ] Engine badge in status strip flashes to whichever engine answered
- [ ] Click **↩ RESTORE ORIGINAL** → page returns to Hindi exactly

---

## Test 3 — A state portal (regional script translation)

**URL:** https://kerala.gov.in/  *(or any state portal you prefer — tn.gov.in, karnataka.gov.in, mp.gov.in)*

**Why this portal:** State portals are the hardest case — often regional-language-only with poor markup. Real test of the translation cascade.

**Checklist:**
- [ ] Status strip detects the language correctly (Malayalam → `LANG: ML`, Tamil → `TA`, etc.)
- [ ] If on-device AI doesn't have that pair, status flips to `Google Translate` after a translate attempt
- [ ] Translate page → 80%+ of visible text replaced with target language
- [ ] **Search tab** → tick `Cross-language search` → type a query in English (e.g. "scheme")
- [ ] Search meta line shows `5 matches for "scheme" → "<translated query>"`
- [ ] Click result #3 → tab focuses, page scrolls, exact match pulses red for ~4s

> **Acceptance:** at least 60% of segments translate readably. Some prosody loss is expected from any free engine. If quality is low, set an Anthropic key and rerun — quality should jump noticeably.

---

## Test 4 — Passport / SSC application form (form auto-save)

**URL:** https://www.passportindia.gov.in/AppOnlineProject/welcomeLink  *or*  https://ssc.gov.in/ (any active application)

**Why this portal:** Form auto-save is the hardest feature to validate without actually submitting. This is the ONLY way to test it.

**Checklist:**
- [ ] Open a page with form fields — start typing in 3+ fields (name, address, etc.)
- [ ] **Do NOT submit.** Refresh the page (F5).
- [ ] Yellow restore banner appears at the top of the page
- [ ] Click **RESTORE** → all fields refill with what you typed
- [ ] Fields are filled in the right slots — name → name, address → address (verifies selector stability across reload)
- [ ] **Critical**: enter a value into the **password** or **OTP** field, refresh — those fields should NOT be restored
- [ ] Captcha fields should NOT be restored
- [ ] Click DISMISS on the banner → next refresh: no banner (draft cleared)

---

## Test 5 — india.gov.in (link-heavy, IA stress test)

**URL:** https://www.india.gov.in/

**Why this portal:** National landing portal. Hundreds of links. Many sections. Tests scan limits.

**Checklist:**
- [ ] Navigate tab populates without freezing the side panel (page may have 1000+ links)
- [ ] Stats row: `Sections` ≥ 5, `Links` shows a real count (capped at 200 internally — verify it's at the cap)
- [ ] Section list scrolls smoothly; each item clickable
- [ ] Hover over IA items → padding-left animates 4px (the spring transition)
- [ ] Switch tabs Translate ↔ Navigate ↔ Search → cards stagger-in each time (animations re-trigger correctly)
- [ ] Open Settings (⚙) → drawer slides in from right; cards stagger-in
- [ ] Toggle "Highlight jargon" off → close drawer → reload page → no yellow underlines on acronyms

---

## Cross-cutting checks (any of the above)

- [ ] Open DevTools console while interacting → **zero red errors**. Yellow warnings are fine.
- [ ] Try a non-gov site (e.g. github.com) → status strip says "Non-gov site"; Navigate tab shows empty state with "Visit a .gov.in / .nic.in site"
- [ ] On a non-gov site, the toolbar icon does NOT show the ✓ badge
- [ ] In Chrome's `chrome://extensions` → Inspect side panel → check that no `host_permissions` warnings fire
- [ ] On any gov page, hit the OS-level "View source" — confirm GovLens does not modify the page until you click Translate. Only insertions: `#govlens-toolbar`, jargon `<span class="gl-jargon">` wrappers, optional `<div class="gl-restore-banner">`.

---

## Performance sanity

- [ ] Side panel open + close: < 200ms perceived
- [ ] Navigate tab populate: < 1s on a page with ≤ 200 links
- [ ] Translate page (small page, ~50 segments): < 5s on-device, < 3s via Google
- [ ] Search → results: < 500ms
- [ ] Click result → jump-and-pulse: < 200ms

---

## Pass/fail rubric

| Result | Action |
|---|---|
| All 5 tests fully green | Ready to submit |
| 1 portal partial (e.g. translation quality) | Fine if it's an engine-quality issue, not a code bug. Document the limitation in the listing FAQ. |
| Any console errors during normal use | **Block submission.** Fix first. |
| Form auto-save fails to restore (test 4) | **Block submission.** This is the highest-trust feature; getting it wrong breaks user trust. |
| Translate doesn't restore cleanly (test 2/3) | **Block submission.** Modifying users' DOM and not undoing it is a Web Store reviewer red flag. |

---

## After all tests pass

1. Take fresh screenshots from real test runs (replace `site/assets/store/*.png` with actual captures — the generated mockups are placeholders for first submission, but real screenshots are stronger).
2. Bump `manifest.json` version to a clean release number for the Web Store debut.
3. Run through `STORE_LISTING.md` and copy each field into the Web Store form.
4. Submit. First review usually 3–7 days.

---

## Known limitations to disclose in the listing FAQ

- Iframes and shadow-DOM content are not translated.
- PDFs themselves aren't translated — only the page that links to them.
- Pages that build content via heavy client-side rendering may need a few seconds before Navigate populates.
- On-device AI requires Chrome 138+ on a supported device. Older Chrome falls back to Google Translate.
