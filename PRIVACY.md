# GovLens — Privacy Policy

**Last updated:** 2 May 2026

---

## TL;DR

**GovLens does not collect, transmit, or store any data on any GovLens server.** We don't have a server. There is no analytics, no tracking, no telemetry. The extension runs entirely inside your browser. Page text only leaves your device when *you* click Translate, Summarise, or Explain — and only if you've opted in to a cloud engine. Form drafts and your optional Anthropic API key are stored in your browser's local storage and are wiped when you uninstall.

---

## 1. What information GovLens handles

GovLens reads and processes the following on your device:

1. **The text content of the page you're viewing**, when you have a `.gov.in`, `.gov.uk`, `.gov`, `.canada.ca`, `.gov.au`, `.europa.eu` (or any other supported government TLD) page open and the side panel is open. Used to extract sections, forms, links, and to power search/translation.
2. **Form field values you type** on government pages, when "Auto-save form drafts" is enabled. Used to restore lost work after session timeouts. Excludes: passwords, OTPs, captchas, file inputs, and any field whose name/id matches those patterns.
3. **Your selected target language, recent language picks, score history, and feature toggles**, stored in `chrome.storage.local`.
4. **Your Anthropic API key (if you provide one)**, stored in `chrome.storage.local` and only sent in outbound HTTPS requests to `api.anthropic.com`.

---

## 2. About your API key

The Anthropic API key is **optional**. Most users will not need one because the extension uses your browser's built-in on-device AI by default (Chrome 138+) and falls back to the free Google Translate endpoint.

If you choose to provide a key:

| | |
|---|---|
| **Where it lives** | In `chrome.storage.local` on your device. We have no access to it. |
| **Where it's sent** | Only in the `x-api-key` header of HTTPS calls to `api.anthropic.com`. |
| **When it's used** | Only when you click Translate / Summarise / Explain and the on-device AI cannot fulfil the request. |
| **How to remove** | Settings (⚙) → clear the field and save. Or uninstall the extension — all storage is wiped. |

---

## 3. What gets sent over the network

The extension makes outbound HTTPS calls **only when you trigger an action that needs cloud AI**. The only two destinations:

- **`translate.googleapis.com`** — free fallback translation when on-device AI is unavailable. Sends only the text being translated and the source/target language codes. No API key, no account, no cookies. You can disable this in Settings. Google's handling is governed by their [privacy policy](https://policies.google.com/privacy).
- **`api.anthropic.com`** — premium fallback when both on-device AI and Google fail (or higher-quality output is requested). Sends a system prompt + the page text or selection, with your API key in the header. Returns the AI response. Anthropic's handling is governed by their [privacy policy](https://www.anthropic.com/legal/privacy).

When your browser's built-in AI is used (the default), **no network calls are made at all**. Translation runs entirely on your device.

---

## 4. Form auto-save

If "Auto-save form drafts" is enabled (default ON), keystrokes into form fields are saved to `localStorage` on the gov page itself, keyed by URL. This means:

- **Stored locally.** Drafts never leave your device.
- **Excluded fields.** Passwords, OTPs, captcha responses, file uploads, and any input whose name/id matches those patterns are never saved.
- **Per-site.** Drafts are scoped to the gov site's origin and path.
- **Soft-delete with undo.** When you click DISMISS on the restore banner, the draft moves to a trash key with a 30-second undo window before final deletion.

You can clear all drafts at any time by clearing your browser's storage for that site, or by uninstalling the extension.

---

## 5. Why each Chrome permission is requested

| Permission | Reason |
|---|---|
| `activeTab` | Read and modify the gov page you're currently viewing — only when you interact with the extension. |
| `scripting` | Run small functions on the page to extract sections / forms / docs and apply translations. |
| `storage` | Save your preferences and (optional) API key in `chrome.storage.local` — local to your browser. |
| `tabs` | Detect the URL of the active tab so the extension knows it's a gov site. |
| `sidePanel` | Show the GovLens UI in Chrome's side panel. |
| Host permissions for `*.gov.in`, `*.gov.uk`, `*.gov`, etc. | Run the content script on government sites only — never on any other website. |
| Host permission for `translate.googleapis.com` | Free fallback translation when on-device AI doesn't support a language pair. No API key required. |
| Host permission for `api.anthropic.com` | Send premium AI requests when the user opts in by providing an API key. |

---

## 6. Third parties

Only Anthropic and Google, and only the text you choose to send when you click a cloud AI action:

- **No analytics provider** (Google Analytics, PostHog, Mixpanel, Sentry, etc.) — we use none.
- **No advertising network.**
- **No CDN that could log requests** — JavaScript is bundled into the extension itself.

---

## 7. Remote code

GovLens does **not** execute remote code. All JavaScript that runs is bundled inside the extension package and reviewed by Chrome at install time. Outbound HTTPS responses (translations, summaries) return JSON data, which is rendered as text content — never evaluated as code, never inserted as HTML, never executed.

No `eval()`, no `new Function()`, no `document.write` of remote content, no dynamic script tag injection, no remote configuration files.

---

## 8. Data we do NOT collect

For complete clarity:

- ❌ No personally identifiable information
- ❌ No health information
- ❌ No financial or payment information (we read page text but never extract or transmit payment data)
- ❌ No personal communications
- ❌ No location data
- ❌ No web browsing history
- ❌ No user activity tracking
- ❌ No biometric data

The only authentication-like information we touch is the user's optional Anthropic API key, stored locally and used only for the user's own outbound API calls.

---

## 9. Children's privacy

GovLens is not directed at children under 13 and does not knowingly collect personal information from children.

---

## 10. Changes to this policy

This policy may update. Material changes will be reflected here with a new "Last updated" date at the top. The version of this policy in effect for any user is the one displayed in the GovLens repo at the time of their last extension update.

---

## 11. Contact

Open an issue on [GitHub](https://github.com/sinhaankur/GovLens/issues), or email the address listed on the [project's GitHub profile](https://github.com/sinhaankur).

---

**Project:** GovLens — Universal Government Portal Reader
**Repository:** https://github.com/sinhaankur/GovLens
**Not affiliated with any government.** GovLens is an independent, free, open-source project.
