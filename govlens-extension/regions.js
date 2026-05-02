// regions.js – Single source of truth for gov-domain detection + region inference.
// Loaded into both side panel and content script contexts.
//
// Each entry maps a hostname suffix (or regex test) to a region code (ISO-3166)
// plus the typical primary languages of that government's portals. The region
// drives jargon-dictionary choice and default target language.

(function () {
  const REGIONS = [
    // South Asia
    { code: 'IN', label: 'India',        match: /\.gov\.in$|\.nic\.in$|\.india\.gov\.in$/i, langs: ['hi','en','bn','ta','te','mr','gu','kn','ml','pa','or','ur','as'] },
    { code: 'PK', label: 'Pakistan',     match: /\.gov\.pk$/i, langs: ['ur','en'] },
    { code: 'BD', label: 'Bangladesh',   match: /\.gov\.bd$/i, langs: ['bn','en'] },
    { code: 'LK', label: 'Sri Lanka',    match: /\.gov\.lk$/i, langs: ['si','ta','en'] },
    { code: 'NP', label: 'Nepal',        match: /\.gov\.np$/i, langs: ['ne','en'] },

    // English-speaking
    { code: 'GB', label: 'United Kingdom', match: /\.gov\.uk$/i, langs: ['en','cy'] },
    { code: 'IE', label: 'Ireland',      match: /\.gov\.ie$/i, langs: ['en','ga'] },
    { code: 'US', label: 'United States', match: /\.gov$|\.mil$/i, langs: ['en','es'] },
    { code: 'CA', label: 'Canada',       match: /\.gc\.ca$|\.canada\.ca$/i, langs: ['en','fr'] },
    { code: 'AU', label: 'Australia',    match: /\.gov\.au$/i, langs: ['en'] },
    { code: 'NZ', label: 'New Zealand',  match: /\.govt\.nz$/i, langs: ['en','mi'] },
    { code: 'SG', label: 'Singapore',    match: /\.gov\.sg$/i, langs: ['en','zh','ms','ta'] },
    { code: 'ZA', label: 'South Africa', match: /\.gov\.za$/i, langs: ['en','af','zu'] },

    // Europe
    { code: 'EU', label: 'European Union', match: /europa\.eu$/i, langs: ['en','fr','de'] },
    { code: 'FR', label: 'France',       match: /\.gouv\.fr$/i, langs: ['fr','en'] },
    { code: 'DE', label: 'Germany',      match: /\.bund\.de$/i, langs: ['de','en'] },
    { code: 'ES', label: 'Spain',        match: /\.gob\.es$/i, langs: ['es','ca','eu','gl'] },
    { code: 'IT', label: 'Italy',        match: /\.gov\.it$/i, langs: ['it','en'] },

    // Latin America
    { code: 'MX', label: 'Mexico',       match: /\.gob\.mx$/i, langs: ['es','en'] },
    { code: 'BR', label: 'Brazil',       match: /\.gov\.br$/i, langs: ['pt','en'] },
    { code: 'CL', label: 'Chile',        match: /\.gob\.cl$/i, langs: ['es'] },
    { code: 'PE', label: 'Peru',         match: /\.gob\.pe$/i, langs: ['es','qu'] },
    { code: 'AR', label: 'Argentina',    match: /\.gob\.ar$/i, langs: ['es'] },

    // East Asia
    { code: 'JP', label: 'Japan',        match: /\.go\.jp$|\.lg\.jp$/i, langs: ['ja','en'] },
    { code: 'CN', label: 'China',        match: /\.gov\.cn$/i, langs: ['zh','en'] },
  ];

  function isGovUrl(url) {
    if (!url) return false;
    try {
      const host = new URL(url).hostname.toLowerCase();
      return REGIONS.some(r => r.match.test(host));
    } catch (_) { return false; }
  }

  function detectRegion(url) {
    if (!url) return null;
    try {
      const host = new URL(url).hostname.toLowerCase();
      for (const r of REGIONS) if (r.match.test(host)) return r;
    } catch (_) {}
    return null;
  }

  // Note: state portals in India are notoriously inconsistent. Surface a hint
  // when we can: anything matching state-name TLDs gets a sub-region tag.
  const IN_STATE_HINTS = /\.((up|mp|rj|hp|jk|tn|ka|kl|ap|ts|wb|od|br|jh|gj|mh|pb|hr|uk|ml|mz|tr|nl|sk|ar|ga|cg|dl|ch|py|an|ld|dn|dd)\.)?(gov|nic)\.in$/i;
  function indianStateHint(url) {
    if (!url) return null;
    try {
      const host = new URL(url).hostname.toLowerCase();
      const m = host.match(/^(?:[\w-]+\.)?([a-z]{2,4})\.(gov|nic)\.in$/);
      return m ? m[1].toUpperCase() : null;
    } catch (_) { return null; }
  }

  // Expose to whichever runtime is loading us
  if (typeof window !== 'undefined') {
    window.GOVLENS_REGIONS = { REGIONS, isGovUrl, detectRegion, indianStateHint };
  }
  if (typeof self !== 'undefined') {
    self.GOVLENS_REGIONS = { REGIONS, isGovUrl, detectRegion, indianStateHint };
  }
})();
