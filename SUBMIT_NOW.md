# GovLens · Submit-Now Guide

The zip is built. This file is everything you need to push it through the Chrome Web Store. Read top-to-bottom.

---

## Files you'll be uploading

| File | Where it lives | Used for |
|---|---|---|
| `govlens-v2.1.0.zip` | `/home/ankursinha/Documents/GitHub/GovLens/` | The extension upload |
| `site/assets/store/01-translate.png` | (this repo) | Screenshot 1 |
| `site/assets/store/02-navigate.png` | (this repo) | Screenshot 2 |
| `site/assets/store/03-search.png` | (this repo) | Screenshot 3 |
| `site/assets/store/promo-440x280.png` | (this repo) | Small promo tile |
| `site/privacy.html` | needs to be **live on the web** | Privacy policy URL |

---

## Pre-submit (must do once, in this order)

### 1. Make the privacy policy URL live (≈ 5 min)
The Web Store form will reject submissions without a working privacy-policy URL.

```
Repository → Settings → Pages
  Source: GitHub Actions
```

Then push your repo. The workflow at `.github/workflows/pages.yml` will auto-deploy `site/`. Once green, your privacy policy lives at:

```
https://<your-github-username>.github.io/GovLens/privacy.html
```

Verify in a browser before continuing.

### 2. Verify the zip
Double-click `govlens-v2.1.0.zip` and confirm `manifest.json` is at the root (NOT inside a subfolder). If it's inside a folder, rebuild with:

```bash
cd govlens-extension
zip -r ../govlens-v2.1.0.zip . -x "*.DS_Store" -x "*.git*"
```

### 3. (Optional but strongly recommended) Take real screenshots
The mockups in `site/assets/store/` will pass review, but real captures convert better. To replace them:
1. Load the unpacked extension (`chrome://extensions` → Developer mode → Load unpacked → pick `govlens-extension/`)
2. Visit `incometax.gov.in` → open side panel → take a screenshot of each tab (Translate, Navigate, Search)
3. Crop to 1280×800 (use any image editor)
4. Replace the three PNGs in `site/assets/store/`

Skip this step if you want to ship today — the mockups are accurate.

---

## Submission flow (Chrome Web Store dashboard)

Go to: **https://chrome.google.com/webstore/devconsole/**

### Click [+ NEW ITEM]

Upload `govlens-v2.1.0.zip`.

### Fill these fields

#### Listing → Store Listing tab

**Title**
```
GovLens — Universal Gov Portal Reader
```

**Summary** (132 char limit)
```
Translate any government portal into your language. See the page map. Search across languages, jump to the exact match.
```

**Description** (paste the long version from `STORE_LISTING.md` → "Detailed description" block)

**Category**: Productivity (primary)

**Language**: English

#### Listing → Graphic Assets tab

| Asset | Source file |
|---|---|
| Store icon (128×128) | `govlens-extension/icons/icon128.png` |
| Screenshot 1 | `site/assets/store/01-translate.png` |
| Screenshot 2 | `site/assets/store/02-navigate.png` |
| Screenshot 3 | `site/assets/store/03-search.png` |
| Small promo tile (440×280) | `site/assets/store/promo-440x280.png` |

Caption suggestions for screenshots:
1. "Translate any gov portal in one click — Hindi, Tamil, Bengali, and 22+ more"
2. "See the entire page map: sections, forms, documents, nav"
3. "Search in your language. Jump to the exact match."

#### Privacy practices tab

**Single purpose statement**
```
GovLens helps users read government portals (.gov.in, .gov.uk, .gov, .europa.eu, etc.) by providing translation, navigation, and search overlays. Single purpose: make these portals easier to use.
```

**Permission justifications** (paste from `STORE_LISTING.md` → "Permission justifications" section). Each permission has its own field; copy the matching block.

**Data usage disclosures**
- Personally identifiable info: **No**
- Health info: **No**
- Financial info: **No**
- Authentication info: **Yes** — user's optional API key, local only
- Personal communications: **No**
- Location: **No**
- Web history: **No**
- User activity: **No**
- Website content: **Yes** — gov page text is read locally; sent to AI engines only on user action

**Data handling certifications** — tick all three:
- [x] We do not sell or transfer user data to third parties (except as noted)
- [x] We do not use data for purposes unrelated to the single purpose
- [x] We do not use data for credit/lending decisions

**Privacy policy URL**
```
https://<your-github-username>.github.io/GovLens/privacy.html
```
(Replace `<your-github-username>` with your actual GitHub username. Verify it loads first.)

#### Distribution tab

**Visibility**: Public
**Distribution regions**: All
**Pricing**: Free

### Click SAVE DRAFT then SUBMIT FOR REVIEW.

Review usually 3–7 days for a first submission.

---

## After submitting

While waiting:
- **Keep checking your developer email** for the review verdict — Google sends it to whatever email is on the developer account.
- If they reject, the rejection email lists exactly which permission/policy/asset failed. Most common rejections are: privacy policy not loading, screenshots showing other people's IP/branding, vague permission justifications. Our `STORE_LISTING.md` is built to pre-empt all three.

When approved:
- Pin the live store URL into your `site/index.html` (replace the "Install via Developer mode" copy with a "Get on Chrome Web Store" button).
- Tag a GitHub release with `v2.1.0`.

---

## Post-launch checklist (you can do these in the first week, not blocking)

- [ ] Run `SMOKE_TEST.md` against the 5 portals listed there (you can do this with the live extension after reviewers approve)
- [ ] Watch the Chrome Web Store dashboard for the first user reviews — respond to anything ≤ 3 stars within 48h
- [ ] Add a **Get on Chrome Web Store** button to `site/index.html`
- [ ] Add a one-line "Featured on GovLens" mention in this repo's main README
- [ ] If usage takes off, set up a basic GitHub issue template for bug reports

---

## Things I (Claude) was unable to do for you

Just to be transparent about the gap:

- **I could not actually load the extension into a real Chrome and click around.** All my testing was static code review. Real-browser bugs may surface.
- **I could not take real screenshots from a real running extension.** The PNGs in `site/assets/store/` are mockups generated with PIL. They visually match the UI but are not captures of the live thing.
- **I could not push your repo to GitHub or enable Pages on your behalf.** That requires your credentials.
- **I could not test the on-device AI APIs (Translator/Summarizer)** — those depend on your Chrome version and OS. Your machine might support them; the extension gracefully falls back to Google Translate if not.

If anything breaks on first install, the most likely culprit is one of:
1. The unauth Google `gtx` translation endpoint — has been stable for 8+ years but is unofficial; if it dies, the extension still works on-device or with an Anthropic key
2. The Anthropic model ID `claude-haiku-4-5-20251001` — verify it's still available in your console; if Anthropic deprecated it, swap to `claude-haiku-4-5` (alias) in `sidepanel.js`
3. The `chrome.scripting.executeScript({ func })` serialization for `analyseSite` — should work since the function is self-contained

---

## TL;DR — what to do RIGHT NOW

1. Push the repo. Enable GitHub Pages. Verify `https://<you>.github.io/GovLens/privacy.html` loads.
2. Open `https://chrome.google.com/webstore/devconsole/` → [+ NEW ITEM] → upload `govlens-v2.1.0.zip`.
3. Paste the listing copy from `STORE_LISTING.md` into each field.
4. Upload the screenshots from `site/assets/store/`.
5. Set the privacy policy URL.
6. Click SUBMIT.

You're done. Refresh the dashboard in 3–7 days for the verdict.
