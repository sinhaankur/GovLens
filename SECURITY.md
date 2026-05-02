# Security Policy

## Reporting a vulnerability

Found a security issue in GovLens? Don't open a public issue. Instead:

1. **Email** the address listed on [@sinhaankur's GitHub profile](https://github.com/sinhaankur)
2. **OR** use [GitHub's private vulnerability reporting](https://github.com/sinhaankur/GovLens/security/advisories/new) (preferred — keeps a paper trail)

Include:
- What the vulnerability is
- How to reproduce it (steps, sample input, the gov site URL where you saw it)
- The impact you think it has
- Any suggested fix (optional)

You'll get an acknowledgement within 48 hours. Most issues are triaged in the same week.

## Scope

In scope:
- Code in `govlens-extension/` (the extension itself)
- The GitHub Pages site at `sinhaankur.github.io/GovLens`

Out of scope:
- Bugs in upstream services (Anthropic, Google Translate) — report those to the respective vendors
- Bugs in the gov sites GovLens is reading — those are the government's responsibility
- DoS attacks against your own browser (the extension runs in your browser; you control its resources)

## What counts as a security issue

The honest framing: GovLens has a small attack surface because it does almost nothing.

**Things I would treat as security issues:**
- A way to make GovLens send page text or the API key somewhere other than `api.anthropic.com` / `translate.googleapis.com`
- A way to make GovLens execute remote code (eval, dynamic script injection)
- An XSS via translation output or jargon tooltip that lets a malicious gov page run code in the extension's context
- Any way the extension reads or writes data outside its declared `host_permissions`
- Bypass of the form-save exclusion list (passwords, OTPs, captchas being saved)

**Things I would NOT treat as security issues:**
- "GovLens reads page text" — that's its job. Disclosed in the privacy policy.
- "I gave my API key to a stranger" — your operational security, not ours
- "The Anthropic API saw my page text" — disclosed; user opted in by adding a key

## Disclosure timeline

- **0 days:** Report received, acknowledged.
- **1–14 days:** Triage and reproduction. May ask for more info.
- **14–30 days:** Fix developed.
- **30 days max:** Fix released as a new Web Store version.
- **Post-release:** Public advisory published on GitHub Security tab. Reporter credited (unless they prefer anonymity).

For critical issues that are actively exploitable, expect faster turnaround.

## Bounty

GovLens is a free, single-maintainer open-source project. There's no bug bounty programme. Public credit and a mention in the changelog are what we offer. Reasonable.
