# GovLens · Web Store Form — Paste Guide

Every field from the form you sent, with exact text to copy. Files in this folder match the form's drop targets one-to-one.

> **Re-upload `govlens-v2.1.0.zip` first.** The 136-char rejection you saw was a stale older zip — this folder's zip is the current one (114-char description, verified).

---

## 📂 Files in this folder

| File | Goes into form field |
|---|---|
| `govlens-v2.1.0.zip` | The package (top of the form) |
| `store-icon-128.png` | **Store icon** (128×128) |
| `screenshot-1-translate.png` | **Screenshots** slot 1 |
| `screenshot-2-navigate.png` | **Screenshots** slot 2 |
| `screenshot-3-search.png` | **Screenshots** slot 3 |
| `promo-tile-440x280.png` | **Small promo tile** (440×280) |
| `marquee-1400x560.png` | **Marquee promo tile** (1400×560) |

---

## 🟡 Product details

### Title (auto-pulled from package, do not edit)
```
GovLens – Universal Government Portal Reader
```

### Summary (auto-pulled from package, do not edit)
```
Read any government portal in your language. Translation, page map, cross-language search. Works in 25+ countries.
```

### Description (paste this — focuses on what it does + why to install)

```
Government websites are some of the worst-built sites on the internet. They're slow, in the wrong language, full of acronyms nobody explains, time you out mid-form, and bury what you actually need under five layers of menus.

GovLens fixes that. It's a side panel that activates the moment you land on any .gov page — Indian, UK, US, Canadian, EU, Australian, or any of 25+ other countries — and gives you four superpowers:

🌐 READ IT IN YOUR LANGUAGE
Auto-translate the page from whatever language it's in (Hindi, Tamil, Bengali, French, German, Spanish, Mandarin, anything) to whatever language you actually read. Works on 100+ languages including Indian regional ones most translators ignore — Bhojpuri, Awadhi, Magahi, Maithili, Marathi, Tulu, Mizo, Khasi, Bodo, Santali, plus historic Kaithi and Tirhuta scripts for old documents.

No account. No API key needed for most users. Uses your browser's built-in AI when available, falls back to Google Translate, then to your own Anthropic key for premium quality.

🗺 SEE THE WHOLE PAGE AT ONCE
The Navigate tab strips out the visual clutter and shows you what's actually on the page: every section heading, every form (with field counts), every PDF, every navigation menu. Click anything to jump straight to it.

🔍 SEARCH IN ONE LANGUAGE, JUMP TO THE EXACT WORD
Type "tax deduction" in English. The extension translates your query into the page's language, finds the 7 matches, and lets you click any result to scroll directly to it — not the first match, the exact one you clicked. The match pulses red for 4 seconds so your eye finds it instantly.

📊 GRADE THE GOV SITE ITSELF
A 0–100 usability score across 8 axes (accessibility, navigation, readability, mobile-friendliness, trust signals, etc.) with concrete fixes. Useful as a sniff test before you spend an hour fighting with a bad portal. History tracks how government sites improve (or don't) over time.

WHY YOU'D INSTALL THIS
• You speak a language the gov site doesn't support
• You're filing taxes / applying for a passport / checking a scheme and the form keeps timing you out
• You're stuck deciphering acronyms (PAN, GSTIN, HMRC, NIN, SSN, FAFSA — hover them for a plain explanation)
• You can't find the actual application page in a maze of menus
• You're a non-native speaker who needs forms simplified
• You're an accessibility user trying to use sites that don't follow basic web standards

PRIVACY
• Zero analytics. Zero tracking. No GovLens server exists.
• Your API key (if you add one) stays in your browser only.
• Form drafts stay in your browser.
• Translation runs on your machine when possible.

OPEN SOURCE. FREE FOREVER.

Not affiliated with any government — GovLens is an independent project.
```

### Category
**Tools** ← (matches what the form already shows)

### Language
**English (United States)**

---

## 🟡 Graphic assets

| Drop target | Drag this file from `submission/` |
|---|---|
| **Store icon** (128×128) | `store-icon-128.png` |
| **Screenshots** slot 1 | `screenshot-1-translate.png` |
| **Screenshots** slot 2 | `screenshot-2-navigate.png` |
| **Screenshots** slot 3 | `screenshot-3-search.png` |
| **Small promo tile** (440×280) | `promo-tile-440x280.png` |
| **Marquee promo tile** (1400×560) | `marquee-1400x560.png` |
| **Global promo video** | *Skip — optional* |

---

## 🟡 Additional fields

### Official URL
- Choose **Add a new site** OR leave **None** for now (you can add later after verifying domain ownership in Search Console)

### Homepage URL (paste — 0/2,048)
```
https://sinhaankur.github.io/GovLens/
```

### Support URL (paste — 0/2,048)
```
https://github.com/sinhaankur/GovLens/issues
```

### Mature content
- **No** (uncheck/leave unticked — there's no mature content)

### Item support visibility
- Set to **On** so users can find the support URL from the listing

---

## 🟡 Privacy practices tab

Switch to the Privacy practices tab on the left. Fill in:

### Single purpose statement
```
GovLens helps users read government portals (.gov.in, .gov.uk, .gov, .europa.eu, etc.) by providing translation, navigation, and search overlays. Single purpose: make these portals easier to use for people who don't speak the page language or struggle with bureaucratic UX.
```

### Permission justifications

#### activeTab
```
Read the URL and inject scripts into the gov portal page the user is currently viewing, only when they interact with the GovLens icon or side panel. Used to extract page structure and apply user-requested translations.
```

#### scripting
```
Inject small functions into gov portal pages to extract sections, forms, links, and downloadable documents; to apply in-place translations; and to scroll to and highlight search matches the user clicked. Only runs on government TLDs listed in host_permissions.
```

#### storage
```
Save the user's preferences (target language, feature toggles, recent languages, score history) and optional Anthropic API key in chrome.storage.local. Stored only on the user's device; never transmitted except in the user's own outbound API calls.
```

#### tabs
```
Detect when the active tab navigates to a government URL so the side panel can show the country code badge and re-extract page data on navigation.
```

#### sidePanel
```
GovLens's primary UI is rendered in Chrome's side panel.
```

#### Host permissions (the long list of gov TLDs + translate.googleapis.com + api.anthropic.com)
```
The extension's content script only runs on government websites — domains like .gov.in, .gov.uk, .gov, .gc.ca, .gov.au, .europa.eu, .gouv.fr, .bund.de, etc. Required to read page text for translation, search, and the navigation map. Each TLD was added because it's the verified TLD for a national or supranational government — never a generic commercial TLD.

translate.googleapis.com is used as a free translation fallback when the user's browser doesn't have built-in AI for a language pair. No API key, no account, no cookies.

api.anthropic.com is used only when the user opts in by providing their own Anthropic API key in Settings. No automatic background calls.
```

### Data usage disclosures

| Question | Answer |
|---|---|
| Personally identifiable info | **No** |
| Health info | **No** |
| Financial / payment info | **No** |
| Authentication info | **Yes** — user's optional Anthropic API key, stored locally only |
| Personal communications | **No** |
| Location | **No** |
| Web history | **No** |
| User activity | **No** |
| Website content | **Yes** — gov page text is read locally; sent to Anthropic only when the user clicks a cloud AI action and has provided a key |

### Data handling certifications (tick all three)
- [x] We do not sell or transfer user data to third parties, outside of approved use cases
- [x] We do not use or transfer user data for purposes that are unrelated to our item's single purpose
- [x] We do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
```
https://sinhaankur.github.io/GovLens/privacy.html
```

⚠️ **This URL must resolve before you submit.** Push the repo and enable Pages first (see CHECKLIST.md).

---

## 🟡 Distribution tab

- **Visibility**: Public
- **Distribution regions**: All
- **Pricing**: Free

---

## ✅ Final order of operations

1. Push the repo to GitHub
2. Repo Settings → Pages → Source = **GitHub Actions**, wait for the workflow to go green
3. In a normal browser tab, verify `https://sinhaankur.github.io/GovLens/privacy.html` loads
4. Re-upload `govlens-v2.1.0.zip` from this folder (it's the new one with the lens icon and 114-char description)
5. Drop the icon + screenshots + promo tile from this folder into the matching slots
6. Paste the description, the URLs, and the privacy fields above
7. **SAVE DRAFT** — verify everything looks right
8. **SUBMIT FOR REVIEW**
9. Wait 3–7 days for Google's verdict

You're done.
