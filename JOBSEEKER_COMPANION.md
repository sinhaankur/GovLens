# GovLens · Job-Seeker Companion — Design Sketch

A *companion feature* (not a separate extension) that turns GovLens into a watcher for government employment portals. Same install, same side panel, new pillar.

---

## Why companion vs. separate

Job seekers already use the same gov portals GovLens covers — UPSC, SSC, state PSCs, NCS, employmentnews.gov.in. Forking into a second extension would force users to install two things, learn two UIs, and manage two API keys. Stay one extension; add a new tab.

---

## What it does (user-facing)

A new **🎯 JOBS** tab in the side panel. Three things:

### 1. Watch a portal
On a vacancy/notification page, click **"Watch this page"**. GovLens snapshots the visible vacancy list and adds it to a watchlist. From then on, the extension polls the page on a schedule (every N hours, configurable; default 12). When new entries appear, the user gets a notification.

### 2. Cross-portal feed
A unified list of every vacancy GovLens has seen across all watched pages. Sortable by date, organisation, deadline. Filterable by:
- **Eligibility** (10th, 12th, Graduate, Post-grad, Specific degree)
- **Age band**
- **State / location**
- **Reservation category** (Gen / OBC / SC / ST / EWS / PwD)
- **Pay scale** (Pay Level)
- **Application deadline** (closing-this-week, this-month)

### 3. Application tracker
For each vacancy the user actually applied to, GovLens lets them save:
- Reference / application number
- Closing date for objection period
- Exam date
- Result date (best estimate)

The **Quick Status Check** button hits the relevant portal's status page (where one exists) and reports back. No login automation — just a quick "yes the page returned, here's the result text" so the user doesn't have to navigate manually.

---

## Architecture

```
govlens-extension/
├── jobs/                          ← new module folder
│   ├── jobs-tab.html              ← injected into sidepanel.html as a fragment
│   ├── jobs.js                    ← UI + state machine
│   ├── parsers/
│   │   ├── upsc.js                ← portal-specific parser
│   │   ├── ssc.js
│   │   ├── ncs.js
│   │   ├── employmentnews.js
│   │   └── generic.js             ← regex-based fallback for unknown portals
│   └── watchers.js                ← scheduling, diffing, notifications
├── sidepanel.html                 ← add 4th pillar tab
├── sidepanel.js                   ← register jobs module
├── background.js                  ← chrome.alarms scheduling
└── manifest.json                  ← +alarms, +notifications permissions
```

---

## Data model

All in `chrome.storage.local`. No server.

### Watched pages
```js
{
  id: "watch_abc123",
  url: "https://upsc.gov.in/notification/...",
  title: "UPSC Civil Services 2026 Notification",
  parser: "upsc",
  schedule: { intervalHours: 12 },
  lastChecked: 1714694400000,
  lastSnapshot: { itemHashes: [...], itemCount: 47 },
  notifyOnNew: true
}
```

### Vacancies (extracted by parser)
```js
{
  id: "vac_xyz789",
  watchId: "watch_abc123",
  title: "Civil Services Examination 2026",
  organisation: "UPSC",
  postedDate: "2026-04-22",
  deadline: "2026-05-15",
  totalVacancies: 1056,
  eligibility: ["graduate", "any-discipline"],
  ageMin: 21, ageMax: 32,
  payLevel: "10",
  state: "all-india",
  applyUrl: "https://upsconline.nic.in/...",
  notificationPdf: "https://upsc.gov.in/.../notif.pdf",
  reservation: { gen: 482, obc: 287, sc: 158, st: 79, ews: 50 },
  rawText: "..."
}
```

### Applications (user-tracked)
```js
{
  id: "app_def456",
  vacancyId: "vac_xyz789",
  refNumber: "1234567890",
  appliedDate: "2026-04-30",
  examDate: null,
  notes: "...",
  statusChecks: [
    { ts: 1714780800000, statusText: "Application received", url: "..." }
  ]
}
```

---

## Parser strategy

The hard part of vacancy aggregation isn't UI — it's extracting structured data from messy government HTML. Three-tier approach:

1. **Portal-specific parsers** — for each of the top ~10 employment portals (UPSC, SSC, IBPS, RRB, state PSCs), a dedicated parser that knows the DOM. ~150 LOC each. Maintained as gov sites change.

2. **Generic parser** — a regex/heuristic-based extractor that reads any page and pulls plausible fields:
   - Title: nearest `<h1>` or `<h2>`
   - Deadline: regex for `/last date|closing|deadline|apply by/i` near a date
   - Vacancies: regex for `/total\s*posts|vacancies/i` near a number
   - Eligibility: regex for `/qualification|eligibility/i` and the next 200 chars

3. **AI parser (premium)** — when neither dedicated nor generic parser succeeds, send the raw page text to Anthropic with a JSON-schema prompt. Costs a fraction of a cent per parse but fills the long tail.

Cascade: dedicated → generic → AI. Same engine pattern as translation.

---

## Watcher / scheduler

`chrome.alarms` runs every 30 minutes, picks watchers whose `lastChecked + intervalHours` has elapsed, fetches the URL via `fetch()` (same-origin), parses, diffs against last snapshot.

Diff strategy: hash the *normalised* text of each list item (title + posted date). New hashes = new vacancies. Send a `chrome.notifications.create` for each new one.

If the page requires the user to be logged in or has Cloudflare/captcha, the scheduled fetch will fail. Detect this (status 403 / captcha-page-fingerprint) and skip silently with a hint in the side panel.

---

## Eligibility filtering UX

Once vacancies have structured fields, the filter panel becomes simple. User profile (saved once, in storage):
- Education: Graduate / Post-grad / 12th
- Year of birth → derives age
- Category: Gen / OBC / SC / ST / EWS
- State preference

Each vacancy is scored against the profile:
- ✓ green if all hard requirements pass
- ⚠ yellow if borderline (age cutoff in 6 months, etc.)
- ✗ red if the user is ineligible

This is a real, hard-to-fake differentiator vs. naukri.com / shine.com — those don't filter by gov-job-specific reservation/age cutoffs.

---

## Permissions added (over current manifest)

| Permission | Why |
|---|---|
| `alarms` | Scheduled background polling |
| `notifications` | Toast when new vacancies arrive |
| `host_permissions` for the 10 covered portals | Background fetch |

No new sensitive permissions. No `webRequest`, no broad `<all_urls>`.

---

## Build phases

**MVP (1 week)**
- Jobs tab in side panel
- "Watch this page" button — generic parser only
- Watchlist table + manual refresh
- Notifications when new items appear
- Eligibility filter (off; just show all)

**v2 (1 week)**
- Three dedicated parsers: UPSC, SSC, NCS
- Eligibility filter + user profile
- Application tracker

**v3 (1 week)**
- AI parser fallback
- Quick Status Check
- Calendar export (.ics) of deadlines

---

## Risks / honest tradeoffs

1. **Parsers rot.** Gov sites redesign 1–2× per year. Each redesign breaks dedicated parsers. The generic + AI fallback mitigates this, but expect ongoing maintenance.

2. **Polling is wasteful.** Most pages don't change daily. Mitigation: respect `Last-Modified` / `ETag` headers when present; skip parse if unchanged.

3. **Notifications fatigue.** If a watched page lists 200 vacancies and they all "appear new" because the parser drift, the user gets 200 notifications. Mitigation: cap notifications to 5 per check; group as "12 new on UPSC" link.

4. **Eligibility false-positives.** Government job criteria are fiddly (different cutoffs for different posts within one notification). Conservative approach: never *hide* a vacancy from filters; only add a "✓/⚠/✗" badge. Let user decide.

5. **Login-walled portals.** Many state portals require login to see vacancies. The companion can't help here without scraping after login, which would need broader permissions and is risky. Out of scope; show a "log in to view" passthrough.

6. **Audience size.** ~25 million government job aspirants in India. But they skew toward low-spec phones / low bandwidth. A heavy Chrome extension may not be the right form factor for the median user. The right form factor is probably an Android app — the Chrome extension is the right *first* product to validate the parsers and data model.

---

## Recommendation

**Don't build this in v1.** Ship GovLens (translation + IA + search) first. Get to 1,000 active users. Watch what they actually search for in the existing search bar — if "vacancy" / "notification" / "deadline" dominate, build the companion. If not, you've validated the demand without the implementation cost.

If you do build: **start with the generic parser only**. Skip the dedicated parsers. Most of the value is in "this page changed, here's what's new" — the AI parser can fill in the structured fields. Two weeks of work for a real differentiator.
