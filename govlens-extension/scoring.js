// scoring.js – GovLens "Site Score"
// Lighthouse-style 0-100 grade for any gov page. Pure DOM analysis — no AI,
// no network. Runs as an injected function via chrome.scripting.executeScript.
//
// Eight axes (each 0-100), weighted average → overall.
//
// All work happens in the page context — this file is loaded as a regular
// script in the side panel and exposes `analyseSite` as a function reference
// you can pass to executeScript via `func: analyseSite`.

(function () {

  // The actual scorer. Runs in the page context. Self-contained — no closures.
  function analyseSite() {
    const issues = [];
    const add = (severity, area, text, fix) => issues.push({ severity, area, text, fix });

    // ─────────────────────────── 1. Readability ───────────────────────────
    function scoreReadability() {
      const text = (document.body?.innerText || '').slice(0, 20000);
      if (!text || text.length < 200) {
        add('low', 'readability', 'Page has very little text content', 'Add a meaningful description.');
        return { score: 50, notes: 'Too little text to grade' };
      }
      // Flesch-Kincaid-style approximation
      const sentences = (text.match(/[.!?।॥]+\s/g) || []).length || 1;
      const words = text.trim().split(/\s+/).filter(Boolean);
      const avgSentenceLen = words.length / sentences;
      const longWords = words.filter(w => w.length > 9).length;
      const longRatio = longWords / Math.max(words.length, 1);

      // Ideal: ~16 words/sentence, <20% long words. Scale linearly.
      let score = 100;
      if (avgSentenceLen > 30) { score -= 35; add('high', 'readability', `Sentences average ${avgSentenceLen.toFixed(0)} words — much too long`, 'Split sentences; aim for 15-20 words.'); }
      else if (avgSentenceLen > 24) { score -= 20; add('medium', 'readability', `Sentences average ${avgSentenceLen.toFixed(0)} words — long`, 'Aim for 15-20 words.'); }
      else if (avgSentenceLen < 6) { score -= 10; }

      if (longRatio > 0.30) { score -= 25; add('medium', 'readability', `${(longRatio*100).toFixed(0)}% of words are very long`, 'Replace long, formal words with everyday alternatives.'); }
      else if (longRatio > 0.20) { score -= 12; }

      return { score: Math.max(0, score), notes: `${avgSentenceLen.toFixed(0)} avg words/sentence; ${(longRatio*100).toFixed(0)}% long words` };
    }

    // ─────────────────────────── 2. Navigation ───────────────────────────
    function scoreNavigation() {
      let score = 0;
      const reasons = [];

      const hasNav = document.querySelector('nav, [role="navigation"]');
      if (hasNav) { score += 20; reasons.push('✓ <nav>'); }
      else { add('high', 'navigation', 'No <nav> element found', 'Wrap site navigation in <nav> or role="navigation".'); }

      const hasBreadcrumb = !!document.querySelector('[class*="breadcrumb" i], [aria-label*="breadcrumb" i], nav[aria-label*="breadcrumb" i]');
      if (hasBreadcrumb) { score += 20; reasons.push('✓ breadcrumbs'); }
      else { add('medium', 'navigation', 'No breadcrumbs detected', 'Add a breadcrumb trail so users know where they are.'); }

      const hasSkip = !!document.querySelector('a[href^="#"][class*="skip" i], a[href*="main"][class*="skip" i], a[href="#main"], a[href="#content"]');
      if (hasSkip) { score += 15; reasons.push('✓ skip-link'); }
      else { add('medium', 'navigation', 'No "skip to main content" link', 'Add a visually-hidden skip link for keyboard users.'); }

      const hasMain = !!document.querySelector('main, [role="main"]');
      if (hasMain) { score += 15; reasons.push('✓ <main>'); }
      else { add('medium', 'navigation', 'No <main> element', 'Mark the primary content area with <main>.'); }

      // Heading hierarchy: count skipped levels (h1 -> h3 without h2)
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1], 10));
      const h1Count = headings.filter(l => l === 1).length;
      let skipped = 0;
      for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i-1] > 1) skipped++;
      if (h1Count === 1) { score += 15; reasons.push('✓ exactly one <h1>'); }
      else if (h1Count === 0) { add('high', 'navigation', 'No <h1> on the page', 'Every page needs one top-level heading.'); }
      else { add('low', 'navigation', `${h1Count} <h1> elements`, 'Use one <h1> per page; demote others to <h2>.'); score += 5; }

      if (skipped === 0 && headings.length > 0) { score += 15; reasons.push('✓ tidy heading hierarchy'); }
      else if (skipped > 2) { add('medium', 'navigation', `${skipped} skipped heading levels`, 'Don\'t skip levels (e.g. <h1> → <h3>).'); }

      return { score: Math.min(100, score), notes: reasons.join(' · ') || 'Few structural cues' };
    }

    // ─────────────────────────── 3. Accessibility ───────────────────────────
    function scoreAccessibility() {
      let score = 100;
      const reasons = [];

      // <html lang>
      if (!document.documentElement.lang) {
        score -= 15;
        add('high', 'accessibility', '<html> missing lang attribute', 'Set <html lang="..."> so screen readers pick the right voice.');
      } else { reasons.push(`✓ lang="${document.documentElement.lang}"`); }

      // viewport
      const vp = document.querySelector('meta[name="viewport"]');
      if (!vp) { score -= 10; add('high', 'accessibility', 'No viewport meta tag', 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.'); }

      // images alt
      const imgs = Array.from(document.querySelectorAll('img'));
      const withoutAlt = imgs.filter(i => !i.hasAttribute('alt'));
      if (imgs.length > 0) {
        const altRate = (imgs.length - withoutAlt.length) / imgs.length;
        if (altRate < 0.5)      { score -= 25; add('high',   'accessibility', `${withoutAlt.length} of ${imgs.length} images missing alt text`, 'Add descriptive alt= to every img (alt="" for purely decorative).'); }
        else if (altRate < 0.9) { score -= 12; add('medium', 'accessibility', `${withoutAlt.length} of ${imgs.length} images missing alt text`, 'Add descriptive alt= to every img.'); }
        else { reasons.push(`✓ ${imgs.length} imgs with alt`); }
      }

      // form inputs labels
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'));
      if (inputs.length > 0) {
        const labelled = inputs.filter(i => {
          if (i.getAttribute('aria-label') || i.getAttribute('aria-labelledby')) return true;
          if (i.id && document.querySelector(`label[for="${CSS.escape(i.id)}"]`)) return true;
          if (i.closest('label')) return true;
          return false;
        });
        const labRate = labelled.length / inputs.length;
        if (labRate < 0.5)      { score -= 25; add('high',   'accessibility', `${inputs.length - labelled.length} of ${inputs.length} inputs missing labels`, 'Connect every input to a <label> via id/for or aria-label.'); }
        else if (labRate < 0.9) { score -= 12; add('medium', 'accessibility', `${inputs.length - labelled.length} of ${inputs.length} inputs missing labels`, 'Connect every input to a <label>.'); }
        else { reasons.push(`✓ ${inputs.length} inputs labelled`); }
      }

      // ARIA landmarks count
      const landmarks = document.querySelectorAll('main, header, footer, nav, aside, [role="main"], [role="banner"], [role="contentinfo"], [role="navigation"], [role="complementary"]').length;
      if (landmarks < 2) { score -= 10; add('medium', 'accessibility', 'Almost no ARIA landmarks', 'Use <header>, <main>, <footer>, <nav>.'); }

      // tabindex anti-pattern
      const badTabindex = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length;
      if (badTabindex > 0) { score -= 10; add('medium', 'accessibility', `${badTabindex} elements with tabindex > 0`, 'Avoid positive tabindex; rely on natural DOM order.'); }

      return { score: Math.max(0, score), notes: reasons.join(' · ') };
    }

    // ─────────────────────────── 4. Form usability ───────────────────────────
    function scoreFormUsability() {
      const forms = document.querySelectorAll('form');
      if (forms.length === 0) {
        return { score: null, notes: 'No forms on this page', skipped: true };
      }
      let score = 100;
      const reasons = [];

      let totalInputs = 0, withAutocomplete = 0, requiredMarked = 0, hasRequired = 0;
      forms.forEach(f => {
        const ins = f.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
        totalInputs += ins.length;
        ins.forEach(i => {
          if (i.getAttribute('autocomplete')) withAutocomplete++;
          if (i.required) {
            hasRequired++;
            // check: is "required" visually indicated near the label?
            const id = i.id;
            const lab = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
            if (lab && /\*|required|requir/i.test(lab.textContent || '')) requiredMarked++;
          }
        });
      });

      if (totalInputs > 0) {
        const acRate = withAutocomplete / totalInputs;
        if (acRate < 0.2) { score -= 25; add('medium', 'form', 'Few inputs use autocomplete attributes', 'Add autocomplete="name|email|tel|street-address" so browsers can autofill.'); }
        else if (acRate < 0.6) { score -= 12; }
        else { reasons.push(`✓ ${(acRate*100).toFixed(0)}% inputs autocomplete`); }
      }
      if (hasRequired > 0 && requiredMarked / hasRequired < 0.5) {
        score -= 20;
        add('medium', 'form', 'Required fields not visually marked', 'Add a * or "required" near required field labels.');
      }

      // Check for captcha presence — accessibility & friction signal
      const hasCaptcha = !!document.querySelector('img[src*="captcha" i], [class*="captcha" i], [id*="captcha" i], iframe[src*="recaptcha"], iframe[src*="hcaptcha"]');
      if (hasCaptcha) { score -= 10; add('low', 'form', 'Page uses captchas', 'Captchas exclude accessibility users; consider alternatives.'); }

      // Check action method
      const getActions = Array.from(forms).filter(f => (f.method || 'get').toLowerCase() === 'get' &&
                                                       Array.from(f.querySelectorAll('input[type="password"]')).length > 0);
      if (getActions.length > 0) {
        score -= 30;
        add('high', 'form', 'A form sends a password over GET', 'Sensitive fields must use method="post" with HTTPS.');
      }

      return { score: Math.max(0, score), notes: `${forms.length} form${forms.length>1?'s':''}, ${totalInputs} inputs · ${reasons.join(' · ')}` };
    }

    // ─────────────────────────── 5. Multilingual ───────────────────────────
    function scoreMultilingual() {
      let score = 0;
      const reasons = [];
      const declaredLang = (document.documentElement.lang || '').toLowerCase().split('-')[0];

      if (declaredLang) { score += 30; reasons.push(`✓ lang="${declaredLang}"`); }
      else { add('high', 'multilingual', '<html lang> not set', 'Pick a primary language for the page.'); }

      // — Signature-vocabulary check —
      // Many Indian state portals declare lang="hi" (or omit it entirely) but
      // the actual content is Bhojpuri / Awadhi / Magahi / Maithili / Marathi.
      // This excludes screen-reader users (wrong voice picked) and breaks
      // browser-level translation. Score this as a high-severity issue.
      const sample = (document.body?.innerText || '').slice(0, 8000);
      const hasDeva = /[ऀ-ॿ]/.test(sample);
      if (hasDeva) {
        const text = ' ' + sample.toLowerCase().replace(/\s+/g, ' ') + ' ';
        const SIG = {
          Bhojpuri: ['बानी','हमरा','तोहार','बाटे','होखे','करेला','भइल','रहल','नइखे','रउआ'],
          Awadhi:   ['हौ ','हौं','कहयो','भयो','रहयो','पारा','मोहि','कउनो'],
          Magahi:   ['हियो','हलिये','हलए','गेलिये','कहलक','देखलक'],
          Maithili: ['अछि','छथि','छलाह','यैह','भेल','कएल','गेलाह'],
          Marathi:  ['आहे','होत','केला','गेला','मला','तुला','कारण'],
        };
        const scored = {};
        for (const variant in SIG) {
          let count = 0;
          for (const w of SIG[variant]) {
            const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const m = text.match(re);
            if (m) count += m.length;
          }
          scored[variant] = count;
        }
        // Find the variant with the most signature hits (above threshold of 3).
        let bestVariant = null, bestCount = 3;
        for (const v in scored) if (scored[v] > bestCount) { bestVariant = v; bestCount = scored[v]; }

        if (bestVariant) {
          // Map variant to its expected lang code
          const expected = { Bhojpuri:'bho', Awadhi:'awa', Magahi:'mag', Maithili:'mai', Marathi:'mr' }[bestVariant];
          // Mismatch if declared lang isn't the expected variant (or is plain "hi")
          if (declaredLang !== expected) {
            score -= 25;
            const decl = declaredLang || 'unset';
            add('high', 'multilingual',
              `Content looks like ${bestVariant} (${bestCount} signature words) but <html lang="${decl}"> says otherwise`,
              `Set <html lang="${expected}"> so screen readers and translators handle the page correctly.`
            );
          } else {
            reasons.push(`✓ ${bestVariant} content matches lang declaration`);
          }
        }
      }

      // detect language switcher links — common patterns
      const langSwitcherSelectors = [
        '[class*="lang-switch" i]', '[id*="lang-switch" i]',
        'a[href*="/hi/"]', 'a[href*="/en/"]', 'a[href*="/ta/"]',
        '[class*="language" i] a', 'select[name*="lang" i]'
      ];
      const hasLangSwitcher = langSwitcherSelectors.some(s => document.querySelector(s));
      if (hasLangSwitcher) { score += 30; reasons.push('✓ language switcher'); }
      else { add('medium', 'multilingual', 'No language switcher found', 'Provide alternates if your page exists in multiple languages.'); }

      // dir for RTL
      const lang = document.documentElement.lang || '';
      const isRTL = /^(ar|he|fa|ur|ps|sd)/i.test(lang);
      const dirSet = !!document.documentElement.dir;
      if (isRTL && !dirSet) { score -= 10; add('medium', 'multilingual', 'RTL language but dir attribute missing', 'Add dir="rtl" to <html>.'); }

      // charset
      const cs = document.querySelector('meta[charset], meta[http-equiv="Content-Type"]');
      if (cs) { score += 30; reasons.push('✓ charset declared'); }
      else { score -= 20; add('high', 'multilingual', 'No <meta charset>', 'Add <meta charset="utf-8"> as the first <head> element.'); }

      // hreflang alternates
      const hreflang = document.querySelectorAll('link[rel="alternate"][hreflang]').length;
      if (hreflang > 0) { score += 10; reasons.push(`✓ ${hreflang} hreflang alternates`); }

      return { score: Math.max(0, Math.min(100, score)), notes: reasons.join(' · ') };
    }

    // ─────────────────────────── 6. Content clarity ───────────────────────────
    function scoreContentClarity() {
      let score = 0;
      const reasons = [];

      const text = document.body?.innerText || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      if (words >= 200 && words <= 4000) { score += 30; reasons.push(`✓ ${words} words (sweet spot)`); }
      else if (words < 100) { add('medium', 'content', 'Page has very little content', 'Provide a meaningful explanation of the page purpose.'); score += 5; }
      else if (words > 6000) { add('medium', 'content', `Page is very long (${words} words)`, 'Split into multiple pages with clear hierarchy.'); score += 10; }
      else score += 22;

      const hCount = document.querySelectorAll('h1,h2,h3,h4').length;
      if (hCount >= 3) { score += 25; reasons.push(`✓ ${hCount} headings`); }
      else if (hCount >= 1) score += 15;
      else { add('high', 'content', 'No headings at all', 'Use <h1>-<h4> to give the page structure.'); }

      const pCount = document.querySelectorAll('p').length;
      if (pCount >= 3) { score += 20; reasons.push(`✓ ${pCount} paragraphs`); }
      else if (pCount >= 1) score += 10;
      else add('medium', 'content', 'No <p> elements (text in raw divs?)', 'Wrap prose in <p> for screen-reader segmentation.');

      const docLinks = Array.from(document.querySelectorAll('a[href]'))
        .filter(a => /\.(pdf|docx?|xlsx?|pptx?|zip|rar)(\?|#|$)/i.test(a.href)).length;
      if (docLinks > 50) { score += 5; add('medium', 'content', `${docLinks} downloadable docs on one page`, 'Consider splitting or providing previews.'); }
      else if (docLinks > 0) { score += 25; reasons.push(`✓ ${docLinks} docs`); }
      else score += 15;

      return { score: Math.min(100, score), notes: reasons.join(' · ') };
    }

    // ─────────────────────────── 7. Mobile-friendly ───────────────────────────
    function scoreMobile() {
      let score = 0;
      const reasons = [];

      const vp = document.querySelector('meta[name="viewport"]');
      if (vp && /width=device-width/i.test(vp.content || '')) {
        score += 50; reasons.push('✓ responsive viewport');
      } else if (vp) {
        score += 20;
        add('medium', 'mobile', 'viewport meta is present but lacks width=device-width', 'Use <meta name="viewport" content="width=device-width, initial-scale=1">.');
      } else {
        add('high', 'mobile', 'No viewport meta', 'Without it, mobile devices render the page at desktop width.');
      }

      // Fixed-width tables / wide elements
      const fixedWide = Array.from(document.querySelectorAll('table, div, section'))
        .filter(el => {
          const w = el.style.width || '';
          return /\d{3,}px/.test(w);
        }).length;
      if (fixedWide > 5) { add('medium', 'mobile', `${fixedWide} elements with hardcoded pixel widths`, 'Use percentages, max-width, or CSS grid.'); score += 10; }
      else { score += 25; reasons.push('✓ flexible widths'); }

      // Tap-target heuristic: look at button sizes
      const smallButtons = Array.from(document.querySelectorAll('button, a.btn, a.button'))
        .filter(b => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.width < 32 && r.height > 0 && r.height < 32;
        }).length;
      if (smallButtons > 5) { add('low', 'mobile', `${smallButtons} small tap targets (<32px)`, 'Tap targets should be ≥44×44px (WCAG 2.5.5).'); score += 10; }
      else { score += 25; reasons.push('✓ adequate tap targets'); }

      return { score: Math.min(100, score), notes: reasons.join(' · ') };
    }

    // ─────────────────────────── 8. Trust ───────────────────────────
    function scoreTrust() {
      let score = 0;
      const reasons = [];

      if (location.protocol === 'https:') { score += 30; reasons.push('✓ HTTPS'); }
      else { add('high', 'trust', 'Page served over HTTP', 'Government sites must serve over HTTPS.'); }

      // Last-updated heuristic — look for a date pattern in the footer or a "last updated" string
      const bodyText = document.body?.innerText || '';
      const lastUpdated = /last\s+(updated|modified|reviewed)|page\s+last|updated\s+on/i.test(bodyText);
      if (lastUpdated) { score += 25; reasons.push('✓ "last updated" present'); }
      else { add('medium', 'trust', 'No "last updated" date visible', 'Show when the page was last reviewed.'); }

      // Contact info
      const hasContact = !!document.querySelector('a[href^="mailto:"], a[href^="tel:"]') ||
                         /contact\s+us|get\s+in\s+touch|phone|helpline/i.test(bodyText.slice(0, 50000));
      if (hasContact) { score += 20; reasons.push('✓ contact info'); }
      else { add('medium', 'trust', 'No contact information visible', 'Show an email, phone, or contact form.'); }

      // Favicon
      const favicon = document.querySelector('link[rel*="icon"]');
      if (favicon) { score += 10; reasons.push('✓ favicon'); }

      // Mixed content guess: count subresources on http
      const httpResources = Array.from(document.querySelectorAll('img[src^="http://"], script[src^="http://"], link[href^="http://"]')).length;
      if (location.protocol === 'https:' && httpResources > 0) {
        score -= 15;
        add('high', 'trust', `${httpResources} http:// resources on an https page`, 'Mixed content breaks browser security; serve all over HTTPS.');
      } else { score += 15; }

      return { score: Math.max(0, Math.min(100, score)), notes: reasons.join(' · ') };
    }

    const axes = {
      readability:    { weight: 12, ...scoreReadability(),   icon: '📖', label: 'Readability' },
      navigation:     { weight: 15, ...scoreNavigation(),    icon: '🧭', label: 'Navigation' },
      accessibility:  { weight: 18, ...scoreAccessibility(), icon: '♿', label: 'Accessibility' },
      formUsability:  { weight: 10, ...scoreFormUsability(), icon: '📋', label: 'Forms' },
      multilingual:   { weight: 10, ...scoreMultilingual(),  icon: '🌐', label: 'Multilingual' },
      contentClarity: { weight: 12, ...scoreContentClarity(),icon: '✍️', label: 'Content' },
      mobile:         { weight: 12, ...scoreMobile(),        icon: '📱', label: 'Mobile' },
      trust:          { weight: 11, ...scoreTrust(),         icon: '🔒', label: 'Trust' },
    };

    // Weighted average — skip axes flagged `skipped: true` (e.g. no forms)
    let weightedTotal = 0, weightSum = 0;
    Object.values(axes).forEach(a => {
      if (a.skipped || a.score == null) return;
      weightedTotal += a.score * a.weight;
      weightSum += a.weight;
    });
    const overall = weightSum ? Math.round(weightedTotal / weightSum) : 0;
    const grade = overall >= 90 ? 'A' :
                  overall >= 80 ? 'B' :
                  overall >= 70 ? 'C' :
                  overall >= 60 ? 'D' :
                  overall >= 50 ? 'E' : 'F';

    // Sort issues by severity
    const sevOrder = { high: 0, medium: 1, low: 2 };
    issues.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

    return {
      overall,
      grade,
      url: location.href,
      title: document.title,
      axes,
      issues: issues.slice(0, 12),
      timestamp: Date.now()
    };
  }

  // Expose at module load — the side panel grabs `analyseSite` and passes it
  // to chrome.scripting.executeScript({ func: analyseSite }).
  if (typeof window !== 'undefined') {
    window.GOVLENS_ANALYSE_SITE = analyseSite;
  }
})();
