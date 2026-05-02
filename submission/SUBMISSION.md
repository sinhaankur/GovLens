# GovLens · Chrome Web Store Submission Guide

Single source of truth for both **first-time submissions** and **version updates**.

> **Current package:** `govlens-v2.1.2.zip` (this folder)
> **Manifest version:** `2.1.2` · **Description length:** 114 chars (under 132 limit)

---

## Pick your path

| Situation | Jump to |
|---|---|
| First time submitting GovLens | **Path A — First Submission** |
| Already submitted, uploading a new version | **Path B — Version Update** |
| Resubmitting after a rejection | **Path B — Version Update** (then check rejection email for specific field fixes) |

---

# 📂 What's in this folder

| File | Web Store form slot | Required? |
|---|---|---|
| `govlens-v2.1.2.zip` | **Package** upload (top of form) | ✅ Required |
| `store-icon-128.png` | **Store icon** (128×128) | ✅ Required |
| `screenshot-1-translate.png` | **Screenshots** slot 1 (1280×800) | ✅ At least one required |
| `screenshot-2-navigate.png` | **Screenshots** slot 2 | Recommended |
| `screenshot-3-search.png` | **Screenshots** slot 3 | Recommended |
| `promo-tile-440x280.png` | **Small promo tile** | Optional |
| `marquee-1400x560.png` | **Marquee promo tile** | Optional (but boosts visibility) |

---

# Path A — First Submission

## Pre-flight (do once, before opening the Web Store form)

### A1. Verify the privacy policy URL loads
Open this in a fresh browser tab:
```
https://github.com/sinhaankur/GovLens/blob/main/PRIVACY.md
```
You should see a formatted privacy policy. If yes ✅, this is your privacy policy URL.

*(If you later enable GitHub Pages, you can switch to `https://sinhaankur.github.io/GovLens/privacy.html`.)*

### A2. Set publisher contact email
Account-level — required before any item can be published.

1. Open: **https://chrome.google.com/webstore/devconsole/account**
2. Find **Publisher contact email** → enter an email you can check
3. Click Save
4. Open the verification email Google sends → click **Verify Contact Email**
5. Refresh the dashboard

You only do this once per developer account, ever.

---

## Step 1 — Create the item

Dev Console → **+ NEW ITEM** → drop in `govlens-v2.1.2.zip` → wait for it to parse.

---

## Step 2 — Fill the Store Listing tab

### Title (auto-pulled, do not edit)
```
GovLens – Universal Government Portal Reader
```

### Summary (auto-pulled, do not edit)
```
Read any government portal in your language. Translation, page map, cross-language search. Works in 25+ countries.
```

### Description (paste this)

```
GovLens turns government portals into something you can actually read.

It works on any country's government website - Indian gov.in, UK gov.uk, US gov, Canadian gc.ca, EU europa.eu, Australian gov.au, plus 20 more. The moment you land on one, a side panel opens with four tools.

TRANSLATE the page into your language. 100+ languages supported, including Indian regional ones most translators ignore - Bhojpuri, Awadhi, Magahi, Maithili, Tulu, Mizo, Khasi, Bodo, Santali, and even historic Kaithi and Tirhuta scripts for old documents. No account needed. Uses your browser's built-in AI by default and falls back to free Google Translate. An optional Anthropic API key gives premium quality but is not required.

NAVIGATE the page structure. Every section heading, every form (with field count), every downloadable PDF, every navigation menu - all listed in one panel. Click anything to jump straight to it with a flash highlight.

SEARCH across languages. Type your query in any language. GovLens translates it to the page's language, finds the matches, and shows you each one with the section it came from. Click any result to scroll to that exact occurrence on the page - the page pulses red on the match for four seconds so your eye finds it instantly.

SCORE the page. A 0 to 100 usability grade across eight axes - accessibility, navigation, readability, form usability, multilingual support, content clarity, mobile-friendliness, trust signals. Surfaces top issues with concrete fixes. Useful as a sniff test before you spend an hour fighting with a bad portal.

Plus quality-of-life extras. Hover any acronym (PAN, GSTIN, HMRC, NIN, SSN, FAFSA, EPF, NHS, IRS) for a plain English explanation. Every keystroke into a government form is auto-saved locally - if your session times out, restore your draft with one click. Floating in-page search bar. Searchable language picker that lets you filter 100+ languages by name, native script, or code.

Why you would install this:
- You speak a language the government site does not support
- You are filing taxes, applying for a passport, or checking a scheme and the form keeps timing you out
- You are stuck deciphering bureaucratic acronyms
- You cannot find the actual application page in a maze of menus
- You are a non-native speaker who needs forms simplified
- You are an accessibility user trying to use sites that do not follow basic web standards

Privacy first. Zero analytics. Zero tracking. No GovLens server exists. Your API key, if you add one, stays in your browser only. Form drafts stay in your browser. Translation runs on your machine when possible.

Open source. Free forever. Not affiliated with any government.
```

### Category
**Tools**

### Language
**English (United States)**

---

## Step 3 — Drop in graphic assets (Store Listing tab continued)

| Form slot | File |
|---|---|
| Store icon (128×128) | `store-icon-128.png` |
| Screenshots #1 | `screenshot-1-translate.png` |
| Screenshots #2 | `screenshot-2-navigate.png` |
| Screenshots #3 | `screenshot-3-search.png` |
| Small promo tile (440×280) | `promo-tile-440x280.png` |
| Marquee promo tile (1400×560) | `marquee-1400x560.png` |
| Global promo video | (skip) |

---

## Step 4 — Additional fields (Store Listing tab continued)

### Homepage URL
```
https://github.com/sinhaankur/GovLens
```

### Support URL
```
https://github.com/sinhaankur/GovLens/issues
```

### Mature content
**Off** (no mature content)

### Item support visibility
**On**

---

## Step 5 — Privacy practices tab (left sidebar)

### Single purpose description
```
GovLens helps users read government portals (.gov.in, .gov.uk, .gov, .europa.eu, .gov.au, .gc.ca, etc.) by providing translation, navigation, and search overlays. Single purpose: make these portals easier to use for people who don't speak the page language or struggle with bureaucratic UX.
```

### Permission justifications

**`activeTab`**
```
Reads the URL and injects scripts into the gov portal page the user is currently viewing, only when they interact with the GovLens icon or side panel. Used to extract page structure (sections, forms, links) and apply user-requested translations. The extension never reads tabs the user is not actively using.
```

**`scripting`**
```
Injects small functions into government portal pages to extract sections, forms, links, and downloadable documents; to apply in-place translations when the user clicks Translate; and to scroll to and highlight the exact occurrence the user clicked in search results. Only runs on the government TLDs declared in host_permissions.
```

**`storage`**
```
Saves the user's preferences in chrome.storage.local: target language, default language, recent language picks, feature toggles (jargon, form-save, toolbar), score history, and an optional Anthropic API key the user provides. Form drafts are stored in localStorage on the gov page itself. All stored only on the user's device; never transmitted except in the user's own outbound API calls.
```

**`tabs`**
```
Detects when the active tab navigates to a government URL so the side panel can show the correct country-code badge and re-extract page data on navigation.
```

**`sidePanel`**
```
GovLens's primary user interface is rendered in Chrome's side panel rather than a popup. The sidePanel permission is required to register and open this panel.
```

**Host permissions**
```
The content script only runs on government websites - domains like .gov.in, .nic.in, .gov.uk, .gov, .mil, .gc.ca, .canada.ca, .gov.au, .govt.nz, .europa.eu, .gouv.fr, .bund.de, .gob.es, .gob.mx, .gob.cl, .gob.pe, .gob.ar, .gov.br, .gov.it, .go.jp, .lg.jp, .gov.cn, .gov.sg, .gov.za, .gov.pk, .gov.bd, .gov.lk, .gov.np, .gov.ie. Each TLD is the verified TLD for a national or supranational government - never a generic commercial TLD. Required to read page text for translation, search, and the navigation map.

translate.googleapis.com is used as a free translation fallback when the user's browser does not have built-in AI for a language pair. No API key, no account, no cookies.

api.anthropic.com is used only when the user opts in by providing their own Anthropic API key in Settings. No automatic background calls.
```

**Remote code use**
```
GovLens does not execute remote code. All JavaScript that runs is bundled inside the extension package and reviewed by Chrome at install time.

Outbound HTTPS calls go to translate.googleapis.com (free translation, optional, opt-out toggle) and api.anthropic.com (only when the user provides an API key). These endpoints return JSON data - translated text or AI-generated text - which is rendered as text content in the page or side panel. The returned data is never evaluated as code, never inserted as HTML, and never executed.

No eval(), new Function(), document.write of remote content, or dynamic script tag injection. No remote configuration files. No A/B testing infrastructure.
```

### Data usage disclosures

| Question | Answer |
|---|---|
| Personally identifiable info | **No** |
| Health info | **No** |
| Financial / payment info | **No** |
| Authentication info | **Yes** (user's optional Anthropic API key, stored locally only) |
| Personal communications | **No** |
| Location | **No** |
| Web history | **No** |
| User activity | **No** |
| Website content | **Yes** (gov page text read locally; sent to AI engines only on user action) |

### Data handling certifications
Tick **all three**:
- [x] We do not sell or transfer user data to third parties, outside of approved use cases
- [x] We do not use or transfer user data for purposes that are unrelated to our item's single purpose
- [x] We do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
```
https://github.com/sinhaankur/GovLens/blob/main/PRIVACY.md
```

---

## Step 6 — Distribution tab

| Field | Value |
|---|---|
| Visibility | **Public** |
| Distribution regions | **All** |
| Pricing | **Free** |

---

## Step 7 — Save & Submit

1. Click **Save Draft** at the top right
2. Verify all error banners have cleared
3. Click **Submit for Review**
4. Wait 3–7 days for Google's verdict (email goes to your verified contact address)

---

# Path B — Version Update

You've already submitted GovLens once. This is much shorter.

## What changed in v2.1.2 (current package)

- **Critical fix**: language picker dropdown was being clipped by animated cards (CSS containing-block rule for `position: fixed` descendants of transformed ancestors). Popover now portals to `<body>` so it renders above everything.
- Score history rows get spring-overshoot hover treatment (Framer Motion-style)
- Trigger button has proper neobrutal pressed state on click
- All listing copy is unchanged

## Steps

1. Dev Console → click your **GovLens** item
2. **Package** tab on the left sidebar
3. **Upload new package** → pick `govlens-v2.1.2.zip` from this folder
4. Wait for it to parse (verify version shown is `2.1.2`)
5. Click **Save Draft**
6. Click **Submit for Review**

That's it. The store listing fields, privacy practices, screenshots, etc. are all retained from the previous submission.

> **One thing to know about updates:** if your submission was still in initial review when you upload v2.1.2, the new version replaces what reviewers see. They evaluate v2.1.2, not the older version. No penalty.

---

# Common rejection reasons (and how to recognize them)

If Google rejects, the email is always specific. Match the rejection text to one of these:

| Rejection text contains... | Likely fix |
|---|---|
| "privacy policy URL is not reachable" | Privacy URL 404'd at review time. Re-verify in incognito. |
| "permission justification is not specific enough" | Re-paste the matching block from Step 5 above — they want concrete usage, not generic statements. |
| "screenshot violates our trademark policy" | Screenshot showed a real gov site with people/branding. Use the included mockups instead. |
| "single purpose policy violation" | Description suggests multiple purposes. Trim to the one-sentence version in Step 5. |
| "remote code execution detected" | Reviewer thinks fetching from Anthropic = remote code. Paste the Step 5 "Remote code use" block — explicit "returns JSON, never evaluated as code". |
| "host permissions are too broad" | Justification needs the per-TLD breakdown from Step 5 "Host permissions". |

For any rejection, paste the email text into a chat and the fix is usually one field edit + resubmit.

---

# After publication

Once approved, the listing URL will be:
```
https://chrome.google.com/webstore/detail/<your-extension-id>/
```

You'll get the ID in the approval email.

Update these in the repo:
- [ ] Add the live store URL to `README.md`
- [ ] Replace "Install via Developer mode" copy on `site/index.html` with a "Get on Chrome Web Store" button
- [ ] Tag the release: `git tag v2.1.2 && git push origin v2.1.2`
- [ ] Optional: announce on r/india, r/developersIndia, Hacker News

---

# Quick reference

**The current zip:** `submission/govlens-v2.1.2.zip`
**Repo:** https://github.com/sinhaankur/GovLens
**Privacy policy URL:** https://github.com/sinhaankur/GovLens/blob/main/PRIVACY.md
**Dev Console:** https://chrome.google.com/webstore/devconsole/
**Account settings:** https://chrome.google.com/webstore/devconsole/account
