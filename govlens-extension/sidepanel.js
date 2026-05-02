// sidepanel.js – GovLens side panel logic
// Three pillars: Translate / Navigate (IA) / Search-and-jump
// State + UI is driven from the active tab via chrome.scripting.executeScript.

// Region detection lives in regions.js, loaded as a <script> in sidepanel.html.
// Falls back to a noop check if unavailable so the side panel still loads.
const isGovUrl = (u) => !!(window.GOVLENS_REGIONS?.isGovUrl?.(u));
const detectRegion = (u) => window.GOVLENS_REGIONS?.detectRegion?.(u) || null;

const LANG_NAMES = {
  en: 'English',

  // India — 22 scheduled official
  hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi',
  gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', or: 'Odia',
  as: 'Assamese', ur: 'Urdu', sa: 'Sanskrit', ks: 'Kashmiri', ne: 'Nepali',
  kok: 'Konkani', mai: 'Maithili', sd: 'Sindhi', brx: 'Bodo', doi: 'Dogri',
  mni: 'Manipuri (Meitei)', sat: 'Santali',

  // India — Hindi-belt regional (non-scheduled)
  bho: 'Bhojpuri', awa: 'Awadhi', mag: 'Magahi', hne: 'Chhattisgarhi',
  raj: 'Rajasthani', mwr: 'Marwari', bgc: 'Haryanvi', bns: 'Bundeli',
  kfy: 'Kumaoni', gbm: 'Garhwali', hno: 'Hindko',

  // India — Bihar / Jharkhand
  anp: 'Angika', bjj: 'Bajjika', kxl: 'Khortha', sjp: 'Surjapuri',
  the: 'Tharu', pi: 'Pali',

  // Historic scripts — handled with special prompts (transliterate then translate)
  kthi: 'Kaithi script (Bhojpuri/Magahi/Maithili in old documents — transliterate to Devanagari then translate)',
  tirh: 'Tirhuta script (Maithili in old documents — transliterate to Devanagari then translate)',
  ne_dv: 'Devanagari transliteration (Romanise or convert script)',

  // India — Western & Southern
  tcy: 'Tulu', kfa: 'Kodava', bhb: 'Bhili', saz: 'Saurashtra',
  bfq: 'Badaga', tdd: 'Toda',

  // India — Tribal & Adivasi
  gon: 'Gondi', kru: 'Kurukh', unr: 'Mundari', hoc: 'Ho',
  khr: 'Kharia', mjt: 'Sauria Paharia',
  njo: 'Ao Naga', njm: 'Angami Naga', nlj: 'Nyishi',
  adi: 'Adi', apt: 'Apatani',

  // India — North-East
  lus: 'Mizo', kha: 'Khasi', trp: 'Kokborok', grt: 'Garo',
  njz: 'Nyishi', dim: 'Dimasa', mjw: 'Karbi', hii: 'Hmar',

  // India — Himalayan
  lbj: 'Ladakhi', lep: 'Lepcha', sip: 'Sikkimese', bft: 'Balti',
  trw: 'Torwali', bsh: 'Kashmiri Pahari',

  // South Asia neighbours
  si: 'Sinhala', dv: 'Dhivehi', dz: 'Dzongkha', my: 'Burmese',

  // International
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
  ru: 'Russian', ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay',
  tr: 'Turkish', fa: 'Persian', he: 'Hebrew', sw: 'Swahili'
};

// Engines that vary in coverage need a "best effort" hint:
// many sub-regional Indian languages have no on-device or Google support.
// In that case the cascade falls through to Anthropic, which can handle any
// natural language via prompt. We surface this in the engine predictor.
const LIKELY_BUILTIN_OR_GOOGLE = new Set([
  'en','hi','bn','ta','te','mr','gu','kn','ml','pa','or','as','ur','ne','si',
  'sd','sa','mai','kok','sat','dv',
  'es','fr','de','it','pt','ru','ar','zh','ja','ko','th','vi','id','ms','tr','fa','he','sw'
]);

const $ = (id) => document.getElementById(id);

let activeTab = null;
let pageData = null;        // last extracted IA + sample text
let lastSearchHits = [];    // latest search results

// ───────────────────────── boot ─────────────────────────
async function init() {
  await loadPrefs();
  bindUI();
  probeBuiltinAI();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;
  await refreshForTab();

  // Re-extract when the active tab changes URL
  chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (tabId === activeTab?.id && change.status === 'complete') {
      activeTab = tab;
      refreshForTab();
    }
  });
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    activeTab = await chrome.tabs.get(tabId);
    refreshForTab();
  });
}

async function refreshForTab() {
  if (!activeTab) return;
  const url = activeTab.url || '';
  const gov = isGovUrl(url);
  const region = detectRegion(url);
  $('statusDot').classList.toggle('active', gov);
  $('statusDot').classList.toggle('inactive', !gov);
  $('statusText').textContent = gov && region
    ? `${region.label} gov site`
    : (gov ? 'Gov site detected' : 'Non-gov site');

  if (!gov) {
    $('detectedLang').textContent = 'Lang: —';
    $('srcLangChip').textContent = '— NOT A GOV SITE —';
    showLaunchpad();
    return;
  }

  // If user hasn't picked a target language yet, default to the first language
  // that ISN'T this gov's primary language — so an Indian on a UK gov site
  // sees "translate to Hindi" pre-selected.
  await maybeAutoPickTarget(region);

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: extractEverything,
    });
    pageData = result;
    renderIA(result);
    const langName = LANG_NAMES[result.lang] || result.lang.toUpperCase();
    $('detectedLang').textContent = 'Lang: ' + langName;
    $('srcLangChip').textContent = langName.toUpperCase();
    updateEnginePrediction();
  } catch (e) {
    console.error('extract failed', e);
    $('srcLangChip').textContent = '— PAGE BLOCKED —';
    setEmptyIA('Could not read page. Try refreshing.');
  }
}

// ───────────────────────── injected: extract everything ─────────────────────────
function extractEverything() {
  // Language detection: prefer <html lang>, fall back to script analysis
  const htmlLang = (document.documentElement.lang || '').toLowerCase().split('-')[0];
  function detectScript(s) {
    if (!s) return 'en';
    const counts = {
      hi: 0, bn: 0, ta: 0, te: 0, mr: 0, gu: 0, kn: 0, ml: 0, pa: 0, or: 0, ur: 0, en: 0
    };
    for (let i = 0; i < Math.min(s.length, 4000); i++) {
      const c = s.charCodeAt(i);
      if (c >= 0x0900 && c <= 0x097F) counts.hi++;
      else if (c >= 0x0980 && c <= 0x09FF) counts.bn++;
      else if (c >= 0x0B80 && c <= 0x0BFF) counts.ta++;
      else if (c >= 0x0C00 && c <= 0x0C7F) counts.te++;
      else if (c >= 0x0A80 && c <= 0x0AFF) counts.gu++;
      else if (c >= 0x0C80 && c <= 0x0CFF) counts.kn++;
      else if (c >= 0x0D00 && c <= 0x0D7F) counts.ml++;
      else if (c >= 0x0A00 && c <= 0x0A7F) counts.pa++;
      else if (c >= 0x0B00 && c <= 0x0B7F) counts.or++;
      else if (c >= 0x0600 && c <= 0x06FF) counts.ur++;
      else if (c >= 0x41 && c <= 0x7A) counts.en++;
    }
    let best = 'en', max = 0;
    for (const k in counts) if (counts[k] > max) { max = counts[k]; best = k; }
    // Hindi vs Marathi share Devanagari — treat as hi unless html lang says otherwise
    return best;
  }
  const sample = (document.body?.innerText || '').slice(0, 8000);
  let lang = htmlLang && htmlLang.length === 2 ? htmlLang : detectScript(sample);

  // Refine Devanagari detection: Hindi vs Bhojpuri/Awadhi/Magahi/Maithili/
  // Marathi/Bundeli share a script. Score each by signature words. The
  // highest-scoring above a small threshold wins; otherwise default to Hindi.
  // Heuristic only — not perfect but gives a useful first guess.
  if (lang === 'hi') {
    const text = ' ' + sample.toLowerCase().replace(/\s+/g, ' ') + ' ';
    const SIG = {
      bho: ['बानी','हमरा','तोहार','बाटे','होखे','करेला','भइल','रहल','बा ','नइखे','देखहीं','चलल','रउआ','हम'],
      awa: ['हौ ','हौं','कहयो','जात ','है ','भयो','रहयो','सुनो','पारा','चलो','कउनो','केतना','मोहि'],
      mag: ['हियो','हलिये','हलए','हलियो','गेलिये','हीं','हे ','कहलक','देखलक','गेलइ'],
      mai: ['अछि','छथि','छलाह','यैह','यौ ','सै','छै','भेल','कएल','लेल','हरि','गेलाह'],
      mr:  ['आहे','होत','केला','गेला','मला','तुला','त्याला','अगदी','कारण'],
      bns: ['पंदान','का खा','कोनो','कैसें','खात ','हुयो','खूब'],
      raj: ['है के','म्हारो','थारो','हो रियो','कर रियो','छ ','मेला','खासरो','होगो','गयो थो'],
    };
    const scored = {};
    for (const code in SIG) {
      let count = 0;
      for (const w of SIG[code]) {
        // Match on word boundary or surrounding spaces — tolerates inflection
        const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const m = text.match(re);
        if (m) count += m.length;
      }
      scored[code] = count;
    }
    // Pick the highest-scoring if it crosses a small threshold (avoids
    // false-positives when Hindi pages happen to use a few shared words).
    let best = 'hi', bestCount = 3;
    for (const code in scored) if (scored[code] > bestCount) { best = code; bestCount = scored[code]; }
    lang = best;
  }

  // Sections (h1-h4, in order)
  const sections = [];
  document.querySelectorAll('h1,h2,h3,h4').forEach((h, idx) => {
    const text = (h.innerText || '').trim();
    if (text && text.length > 1 && text.length < 200) {
      sections.push({ tag: h.tagName, text, index: idx });
    }
  });

  // Forms with field counts
  const forms = [];
  document.querySelectorAll('form').forEach((f, i) => {
    const inputs = f.querySelectorAll('input, select, textarea').length;
    const labelEl = f.querySelector('legend, h1, h2, h3, h4, label');
    const heading = labelEl ? labelEl.innerText.trim().slice(0, 80) : `Form ${i + 1}`;
    forms.push({ index: i, heading, fields: inputs, action: f.action || '' });
  });

  // Documents (PDFs, DOCs, XLSs, ZIPs)
  const docs = [];
  const seenDocs = new Set();
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    if (seenDocs.has(href)) return;
    const m = href.match(/\.(pdf|docx?|xlsx?|pptx?|zip|rar)(\?.*)?(#.*)?$/i);
    if (!m) return;
    seenDocs.add(href);
    docs.push({
      href,
      type: m[1].toLowerCase(),
      label: (a.innerText || a.title || a.getAttribute('aria-label') || href).trim().slice(0, 100)
    });
  });

  // Navigation menus
  const navs = [];
  document.querySelectorAll('nav, [role="navigation"], .menu, .navbar, .navigation').forEach((n, i) => {
    const links = Array.from(n.querySelectorAll('a[href]')).slice(0, 30).map(a => ({
      href: a.href,
      text: (a.innerText || a.title || '').trim().slice(0, 80)
    })).filter(l => l.text);
    if (links.length >= 2) {
      navs.push({ index: i, label: n.getAttribute('aria-label') || `Menu ${i + 1}`, links });
    }
  });

  // Breadcrumbs
  const breadcrumbs = [];
  const bcRoot = document.querySelector('[class*="breadcrumb" i], [aria-label*="breadcrumb" i], nav.breadcrumb, ol.breadcrumb');
  if (bcRoot) {
    bcRoot.querySelectorAll('a, span, li').forEach(el => {
      const t = (el.innerText || '').trim();
      if (t && t.length < 60 && !t.includes('\n')) breadcrumbs.push(t);
    });
  }

  // All links (for stats)
  const linksCount = document.querySelectorAll('a[href]').length;
  const wordsCount = sample.trim().split(/\s+/).filter(w => w).length;

  return {
    title: document.title,
    url: location.href,
    lang,
    sections: sections.slice(0, 80),
    forms,
    docs: docs.slice(0, 60),
    navs: navs.slice(0, 8),
    breadcrumbs: Array.from(new Set(breadcrumbs)).slice(0, 8),
    linksCount,
    wordsCount,
    sample
  };
}

// ───────────────────────── render IA ─────────────────────────
function renderIA(d) {
  $('statHeadings').textContent = d.sections.length;
  $('statForms').textContent = d.forms.length;
  $('statDocs').textContent = d.docs.length;
  $('statLinks').textContent = d.linksCount;

  // Breadcrumbs
  const bc = $('iaBreadcrumbs');
  if (!d.breadcrumbs.length) {
    bc.innerHTML = '<div class="empty">No breadcrumbs found</div>';
  } else {
    bc.innerHTML = d.breadcrumbs.map(t =>
      `<div class="ia-item"><span class="ia-tag nav">›</span><span class="ia-text">${esc(t)}</span></div>`
    ).join('');
  }

  // Sections
  const sec = $('iaSections');
  if (!d.sections.length) {
    sec.innerHTML = '<div class="empty">No sections found</div>';
  } else {
    sec.innerHTML = d.sections.map(s => {
      const cls = s.tag.toLowerCase();
      return `<div class="ia-item" data-jump-heading="${s.index}">
        <span class="ia-tag ${cls}">${s.tag}</span>
        <span class="ia-text">${esc(s.text)}</span>
      </div>`;
    }).join('');
    sec.querySelectorAll('[data-jump-heading]').forEach(el => {
      el.addEventListener('click', () => jumpToHeading(parseInt(el.dataset.jumpHeading, 10)));
    });
  }

  // Forms
  const fr = $('iaForms');
  if (!d.forms.length) {
    fr.innerHTML = '<div class="empty">No forms on this page</div>';
  } else {
    fr.innerHTML = d.forms.map(f => `
      <div class="ia-item" data-jump-form="${f.index}">
        <span class="ia-tag form">FORM</span>
        <span class="ia-text">
          ${esc(f.heading)}
          <div class="ia-sub">${f.fields} fields${f.action ? ' · ' + esc(f.action.slice(0, 60)) : ''}</div>
        </span>
      </div>`).join('');
    fr.querySelectorAll('[data-jump-form]').forEach(el => {
      el.addEventListener('click', () => jumpToForm(parseInt(el.dataset.jumpForm, 10)));
    });
  }

  // Docs
  const dc = $('iaDocs');
  if (!d.docs.length) {
    dc.innerHTML = '<div class="empty">No documents linked</div>';
  } else {
    dc.innerHTML = d.docs.map(doc => {
      const tag = doc.type === 'pdf' ? 'pdf' : 'doc';
      return `<div class="ia-item" data-open="${escAttr(doc.href)}">
        <span class="ia-tag ${tag}">${doc.type.toUpperCase()}</span>
        <span class="ia-text">${esc(doc.label)}<div class="ia-sub">${esc(doc.href)}</div></span>
      </div>`;
    }).join('');
    dc.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', () => chrome.tabs.create({ url: el.dataset.open }));
    });
  }

  // Nav
  const nv = $('iaNav');
  if (!d.navs.length) {
    nv.innerHTML = '<div class="empty">No nav menus detected</div>';
  } else {
    nv.innerHTML = d.navs.map(n => `
      <div class="ia-item" data-toggle="nav-${n.index}">
        <span class="ia-tag nav">NAV</span>
        <span class="ia-text">${esc(n.label)} <span class="ia-sub">${n.links.length} links</span></span>
      </div>
      <div class="nav-children" id="nav-${n.index}" style="display:none;">
        ${n.links.map(l => `
          <div class="ia-item" data-open="${escAttr(l.href)}" style="padding-left:32px;">
            <span class="ia-tag">→</span>
            <span class="ia-text">${esc(l.text)}<div class="ia-sub">${esc(l.href)}</div></span>
          </div>
        `).join('')}
      </div>
    `).join('');
    nv.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        const child = document.getElementById(el.dataset.toggle);
        if (child) child.style.display = child.style.display === 'none' ? 'block' : 'none';
      });
    });
    nv.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.create({ url: el.dataset.open });
      });
    });
  }
}

function setEmptyIA(msg) {
  $('statHeadings').textContent = '0';
  $('statForms').textContent = '0';
  $('statDocs').textContent = '0';
  $('statLinks').textContent = '0';
  ['iaBreadcrumbs', 'iaSections', 'iaForms', 'iaDocs', 'iaNav'].forEach(id => {
    $(id).innerHTML = `<div class="empty">${esc(msg)}</div>`;
  });
}

// H5 fix — first-run launchpad with example portals so non-gov visitors aren't
// stuck. Replaces the generic "visit a gov site" empty state.
const EXAMPLE_PORTALS = [
  // India
  { region: '🇮🇳 India',  name: 'Income Tax',     url: 'https://www.incometax.gov.in/' },
  { region: '🇮🇳 India',  name: 'EPFO',           url: 'https://www.epfindia.gov.in/' },
  { region: '🇮🇳 India',  name: 'Passport',       url: 'https://www.passportindia.gov.in/' },
  { region: '🇮🇳 India',  name: 'India.gov.in',   url: 'https://www.india.gov.in/' },
  // UK
  { region: '🇬🇧 UK',     name: 'GOV.UK',         url: 'https://www.gov.uk/' },
  { region: '🇬🇧 UK',     name: 'HMRC',           url: 'https://www.gov.uk/government/organisations/hm-revenue-customs' },
  // USA
  { region: '🇺🇸 USA',    name: 'IRS',            url: 'https://www.irs.gov/' },
  { region: '🇺🇸 USA',    name: 'SSA',            url: 'https://www.ssa.gov/' },
  // Canada
  { region: '🇨🇦 Canada', name: 'Canada.ca',      url: 'https://www.canada.ca/' },
  // Australia
  { region: '🇦🇺 AU',     name: 'Australia.gov',  url: 'https://www.australia.gov.au/' },
  // EU
  { region: '🇪🇺 EU',     name: 'europa.eu',      url: 'https://european-union.europa.eu/' },
  // France
  { region: '🇫🇷 France', name: 'service-public', url: 'https://www.service-public.fr/' },
];

function showLaunchpad() {
  $('statHeadings').textContent = '0';
  $('statForms').textContent = '0';
  $('statDocs').textContent = '0';
  $('statLinks').textContent = '0';

  // The Sections list becomes the launchpad — most prominent place users see.
  const sec = $('iaSections');
  sec.innerHTML = `
    <div class="launchpad">
      <div class="launchpad-title">GovLens activates on government portals.</div>
      <div class="launchpad-sub">Try one of these 25+ supported countries:</div>
      <div class="launchpad-grid">
        ${EXAMPLE_PORTALS.map(p => `
          <div class="launchpad-card" data-launch="${escAttr(p.url)}">
            <div class="lp-region">${esc(p.region)}</div>
            <div class="lp-name">${esc(p.name)}</div>
          </div>
        `).join('')}
      </div>
      <div class="launchpad-foot">
        Anything ending in <code>.gov.in</code>, <code>.gov.uk</code>, <code>.gov</code>, <code>.canada.ca</code>, <code>.gov.au</code>, <code>.europa.eu</code>, <code>.gouv.fr</code>, <code>.bund.de</code>, etc. will activate the side panel.
      </div>
    </div>`;
  sec.querySelectorAll('[data-launch]').forEach(el => {
    el.addEventListener('click', () => chrome.tabs.update({ url: el.dataset.launch }));
  });

  // Other IA panels: brief empty state, less prominent.
  ['iaBreadcrumbs', 'iaForms', 'iaDocs', 'iaNav'].forEach(id => {
    $(id).innerHTML = `<div class="empty">Activates on a gov page</div>`;
  });
}

// ───────────────────────── jump-to actions ─────────────────────────
async function jumpToHeading(idx) {
  if (!activeTab) return;
  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: (i) => {
      const hs = document.querySelectorAll('h1,h2,h3,h4');
      if (hs[i]) {
        hs[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        hs[i].classList.add('govlens-flash');
        setTimeout(() => hs[i].classList.remove('govlens-flash'), 1800);
      }
    },
    args: [idx]
  });
}
async function jumpToForm(idx) {
  if (!activeTab) return;
  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: (i) => {
      const fs = document.querySelectorAll('form');
      if (fs[i]) {
        fs[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        fs[i].classList.add('govlens-flash');
        setTimeout(() => fs[i].classList.remove('govlens-flash'), 1800);
      }
    },
    args: [idx]
  });
}

// ───────────────────────── search + jump-and-highlight ─────────────────────────
async function doSearch() {
  const queryRaw = $('searchInput').value.trim();
  if (!queryRaw) return;
  const cross = $('crossLangSearch').checked;
  let query = queryRaw;

  $('searchMeta').textContent = 'Searching…';
  $('searchResults').innerHTML = '';

  if (cross && pageData && pageData.lang !== 'en') {
    const apiKey = await getApiKey();
    try {
      $('searchMeta').textContent = `Translating query to ${LANG_NAMES[pageData.lang] || pageData.lang}…`;
      // The query is in the user's language (assume English by default).
      // The 4th arg overrides the source so on-device/Google know what to translate FROM.
      query = await translateText(queryRaw, pageData.lang, apiKey, 'en');
    } catch (e) { /* fall back to original query */ }
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: scanForMatches,
    args: [query]
  });

  lastSearchHits = result || [];
  if (!lastSearchHits.length) {
    $('searchMeta').textContent = `0 matches for "${esc(queryRaw)}"`;
    $('searchResults').innerHTML = '<div class="empty">No matches found</div>';
    return;
  }

  $('searchMeta').textContent = `${lastSearchHits.length} match${lastSearchHits.length === 1 ? '' : 'es'} for "${esc(queryRaw)}"${query !== queryRaw ? ' → "' + esc(query) + '"' : ''}`;
  $('searchResults').innerHTML = lastSearchHits.map((h, i) => `
    <div class="result-item" data-hit="${i}">
      <div class="r-title"><span class="r-tag">#${i + 1}</span>${esc(h.section || 'Page content')}</div>
      <div class="r-ctx">${highlightCtx(h.context, query)}</div>
      <div class="r-jump">▶ JUMP TO MATCH</div>
    </div>
  `).join('');
  $('searchResults').querySelectorAll('[data-hit]').forEach(el => {
    el.addEventListener('click', () => jumpToMatch(parseInt(el.dataset.hit, 10), query));
  });
}

// Injected: scan DOM, return [{section, context, matchPath}] indexed by occurrence
function scanForMatches(query) {
  const q = query.toLowerCase();
  const hits = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (p.closest && p.closest('#govlens-toolbar')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let node, occurrenceIndex = 0;
  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    const lower = text.toLowerCase();
    let from = 0;
    while ((from = lower.indexOf(q, from)) !== -1) {
      // Find nearest heading
      let el = node.parentElement, section = '';
      while (el && el !== document.body) {
        if (/^H[1-6]$/.test(el.tagName)) { section = (el.innerText || '').trim().slice(0, 80); break; }
        const prev = el.previousElementSibling;
        if (prev && /^H[1-6]$/.test(prev.tagName)) { section = (prev.innerText || '').trim().slice(0, 80); break; }
        el = el.parentElement;
      }
      const start = Math.max(0, from - 60);
      const end = Math.min(text.length, from + query.length + 60);
      const context = (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
      hits.push({ section, context, occurrenceIndex });
      occurrenceIndex++;
      from += query.length;
      if (hits.length >= 100) return hits;
    }
  }
  return hits;
}

async function jumpToMatch(hitIndex, query) {
  const hit = lastSearchHits[hitIndex];
  if (!hit || !activeTab) return;
  await chrome.tabs.update(activeTab.id, { active: true });

  // Try the message channel first (fast — content script does the work).
  // If it fails (content.js not loaded), inject a self-contained jumper.
  try {
    await chrome.tabs.sendMessage(activeTab.id, {
      type: 'JUMP_TO_MATCH',
      query,
      occurrenceIndex: hit.occurrenceIndex
    });
  } catch (_) {
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: jumpInline,
      args: [query, hit.occurrenceIndex]
    });
  }
}

// Self-contained jump-to-occurrence — used when content.js isn't loaded.
// Injected into the page via chrome.scripting.executeScript.
function jumpInline(query, targetIndex) {
  if (!query) return;
  const ql = query.toLowerCase();
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME']);
  let occurrence = 0, foundEl = null;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest && p.closest('#govlens-toolbar')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    const lower = text.toLowerCase();
    let from = 0;
    while ((from = lower.indexOf(ql, from)) !== -1) {
      if (occurrence === targetIndex) {
        const before = text.slice(0, from);
        const match = text.slice(from, from + query.length);
        const after = text.slice(from + query.length);
        const span = document.createElement('span');
        span.appendChild(document.createTextNode(before));
        const mark = document.createElement('mark');
        mark.style.cssText = 'background:#d61b1b !important;color:#fff !important;outline:2px solid #0d0d0d !important;padding:0 2px;';
        mark.textContent = match;
        span.appendChild(mark);
        span.appendChild(document.createTextNode(after));
        node.parentNode.replaceChild(span, node);
        foundEl = mark;
        break;
      }
      occurrence++;
      from += query.length;
    }
    if (foundEl) break;
  }
  if (foundEl) {
    foundEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      if (foundEl.isConnected) {
        const t = document.createTextNode(foundEl.textContent);
        foundEl.parentNode.replaceChild(t, foundEl);
      }
    }, 12000);
  }
}

// ───────────────────────── translation (BYOK Anthropic) ─────────────────────────
async function translatePage() {
  const apiKey = await getApiKey();
  const target = getSelectedTargetLang();
  const src = pageData?.lang || 'en';
  // Try in order: on-device → Google (if enabled) → Anthropic. Only show the
  // API-key wall if all three are unavailable.
  const builtinOk = await isBuiltinTranslateAvailable(src, target);
  const googleOk = await isGoogleEnabled();
  if (!builtinOk && !googleOk && !apiKey) { showApiKeyMissing(); return; }

  $('translateStatus').style.display = 'block';
  $('tsText').textContent = 'Collecting page text…';
  $('tsFill').style.width = '5%';

  // Collect translatable text nodes from the page
  const [{ result: chunks }] = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: collectTranslatableChunks,
  });

  if (!chunks?.length) {
    $('tsText').textContent = 'Nothing to translate';
    setTimeout(() => { $('translateStatus').style.display = 'none'; }, 2000);
    return;
  }

  const total = chunks.length;
  let done = 0;
  const batchSize = 25;

  for (let i = 0; i < total; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    $('tsText').textContent = `Translating ${i + 1}–${Math.min(i + batchSize, total)} / ${total}…`;
    try {
      const translated = await translateBatch(batch.map(c => c.text), target, apiKey);
      const replacements = batch.map((c, j) => ({ id: c.id, text: translated[j] || c.text }));
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: applyTranslations,
        args: [replacements]
      });
    } catch (e) {
      console.error('translate batch failed', e);
      $('tsText').textContent = 'Error: ' + (e.message || 'translation failed');
      return;
    }
    done += batch.length;
    $('tsFill').style.width = (done / total * 100) + '%';
  }

  $('tsText').textContent = `✓ Translated ${total} segments to ${LANG_NAMES[target] || target}`;
  $('restoreOriginalBtn').style.display = 'block';
}

function collectTranslatableChunks() {
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','CODE','PRE','INPUT','TEXTAREA','SELECT','OPTION']);
  const chunks = [];
  let counter = 0;

  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent;
      if (t && t.trim().length >= 2 && /\S{2,}/.test(t)) {
        const id = 'gl-tx-' + (counter++);
        // Wrap text node so we can replace it later by id
        const span = document.createElement('span');
        span.dataset.glTxId = id;
        span.dataset.glTxOriginal = t;
        span.textContent = t;
        node.parentNode.replaceChild(span, node);
        chunks.push({ id, text: t.trim() });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP.has(node.tagName) || node.id === 'govlens-toolbar') return;
      if (node.dataset && node.dataset.glTxId) return;
      Array.from(node.childNodes).forEach(visit);
    }
  }
  visit(document.body);
  return chunks;
}

function applyTranslations(replacements) {
  for (const r of replacements) {
    const el = document.querySelector(`[data-gl-tx-id="${r.id}"]`);
    if (el) {
      el.textContent = r.text;
      el.classList.add('govlens-translated');
    }
  }
}

async function restoreOriginal() {
  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: () => {
      // Replace each wrapper span with its original text node so the page DOM
      // is byte-for-byte the same as before translation.
      document.querySelectorAll('[data-gl-tx-id]').forEach(el => {
        const orig = el.dataset.glTxOriginal ?? el.textContent;
        if (el.parentNode) {
          el.parentNode.replaceChild(document.createTextNode(orig), el);
        }
      });
    }
  });
  $('translateStatus').style.display = 'none';
  $('restoreOriginalBtn').style.display = 'none';
}

async function translateSelection() {
  const apiKey = await getApiKey();
  const target = getSelectedTargetLang();
  const src = pageData?.lang || 'en';
  const builtinOk = await isBuiltinTranslateAvailable(src, target);
  const googleOk = await isGoogleEnabled();
  if (!builtinOk && !googleOk && !apiKey) { showApiKeyMissing(); return; }

  const [{ result: sel }] = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: () => window.getSelection()?.toString() || ''
  });

  if (!sel || sel.length < 2) {
    showAi('TRANSLATION', 'Select some text on the page first.');
    return;
  }
  showAi('TRANSLATION', '… translating selected text …');
  try {
    const translated = await translateText(sel, target, apiKey);
    showAi(`TRANSLATION → ${LANG_NAMES[target] || target}`, translated);
  } catch (e) {
    showAi('ERROR', e.message || 'Translation failed');
  }
}

// ───────────────────────── engine: built-in first, Anthropic fallback ─────────────────────────

let __engineLast = ''; // 'builtin' | 'google' | 'anthropic'
function engineLabel() {
  return __engineLast === 'builtin'   ? 'On-device AI' :
         __engineLast === 'google'    ? 'Google Translate' :
         __engineLast === 'anthropic' ? 'Anthropic Cloud' : '—';
}

// ── Google Translate (free, unauthenticated gtx endpoint) ──
async function googleTranslate(text, src, target) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: src || 'auto',
    tl: target,
    dt: 't',
    q: text
  });
  const res = await fetch('https://translate.googleapis.com/translate_a/single?' + params.toString());
  if (!res.ok) throw new Error('Google Translate ' + res.status);
  const json = await res.json();
  // json[0] is an array of [translated_chunk, original_chunk, ...] tuples
  const chunks = Array.isArray(json?.[0]) ? json[0] : [];
  return chunks.map(c => c?.[0] ?? '').join('');
}

async function isGoogleEnabled() {
  const { govlensGoogle } = await chrome.storage.local.get(['govlensGoogle']);
  return govlensGoogle !== false; // default ON
}

async function isBuiltinTranslateAvailable(src, target) {
  if (typeof self.Translator === 'undefined') return false;
  try {
    const av = await self.Translator.availability({ sourceLanguage: src, targetLanguage: target });
    return av === 'available' || av === 'downloadable' || av === 'downloading';
  } catch (_) { return false; }
}

async function builtinTranslate(text, src, target, onProgress) {
  const t = await self.Translator.create({
    sourceLanguage: src,
    targetLanguage: target,
    monitor(m) { m.addEventListener('downloadprogress', (e) => onProgress?.(e.loaded)); }
  });
  try { return await t.translate(text); }
  finally { t.destroy?.(); }
}

// Special target codes that don't map to any translation engine — they need
// AI-tier processing with a custom prompt (script transliteration).
const TRANSLITERATION_TARGETS = {
  kthi:  { name: 'Kaithi script content',  instr: 'The user has chosen Kaithi-script handling. The input may be Bhojpuri, Magahi, or Maithili written in Kaithi script (𑂀–𑂾). Step 1: transliterate the Kaithi to standard Devanagari. Step 2: translate the Devanagari to fluent English. Output BOTH labelled as "DEVANAGARI:" and "ENGLISH:".' },
  tirh:  { name: 'Tirhuta script content', instr: 'The user has chosen Tirhuta-script handling. The input is Maithili written in Tirhuta script (𑒀–𑒺). Step 1: transliterate the Tirhuta to standard Devanagari. Step 2: translate the Devanagari to fluent English. Output BOTH labelled as "DEVANAGARI:" and "ENGLISH:".' },
  ne_dv: { name: 'Devanagari ↔ Latin',     instr: 'The user wants romanised transliteration. Convert any Devanagari content to ITRANS-style Latin transliteration. Preserve numbers and named entities verbatim. Output ONLY the romanised text — no English translation, no notes.' },
};

async function translateText(text, target, apiKey, srcOverride) {
  // srcOverride lets callers (e.g. cross-language search) say "this text is in X,
  // not the page's language". When omitted, we fall back to pageData.lang.
  const src = srcOverride || (pageData?.lang) || 'en';

  // Special-case: transliteration targets always go to Anthropic (no other
  // engine handles Kaithi / Tirhuta).
  if (TRANSLITERATION_TARGETS[target]) {
    if (!apiKey) throw new Error(`${TRANSLITERATION_TARGETS[target].name} needs an Anthropic API key — Settings → AI Engines.`);
    const sys = TRANSLITERATION_TARGETS[target].instr;
    const out = await callClaude(apiKey, sys, text, 1500);
    __engineLast = 'anthropic'; updateEngineBadge();
    return out.trim();
  }

  // 1. On-device built-in AI (free, private)
  if (await isBuiltinTranslateAvailable(src, target)) {
    try {
      const out = await builtinTranslate(text, src, target);
      __engineLast = 'builtin'; updateEngineBadge();
      return out.trim();
    } catch (_) {}
  }
  // Cascade through English if direct on-device pair unavailable
  if (src !== 'en' && target !== 'en') {
    if (await isBuiltinTranslateAvailable(src, 'en') &&
        await isBuiltinTranslateAvailable('en', target)) {
      try {
        const en = await builtinTranslate(text, src, 'en');
        const out = await builtinTranslate(en, 'en', target);
        __engineLast = 'builtin'; updateEngineBadge();
        return out.trim();
      } catch (_) {}
    }
  }

  // 2. Google Translate (free, requires internet)
  if (await isGoogleEnabled()) {
    try {
      const out = await googleTranslate(text, src, target);
      if (out && out.trim()) {
        __engineLast = 'google'; updateEngineBadge();
        return out.trim();
      }
    } catch (_) {}
  }

  // 3. Anthropic (BYOK, paid, highest quality)
  if (!apiKey) throw new Error('All free engines failed. Add an Anthropic API key in Settings for premium translation.');
  const targetName = LANG_NAMES[target] || target;
  const sys = `You are a translator. Translate user input into ${targetName}. Preserve tone, named entities, numbers, dates. Output ONLY the translation — no preamble, no notes.`;
  const out = await callClaude(apiKey, sys, text, 1200);
  __engineLast = 'anthropic'; updateEngineBadge();
  return out.trim();
}

async function translateBatch(texts, target, apiKey, onProgress) {
  const src = (pageData?.lang) || 'en';

  // 1. On-device built-in (no batch API; translate sequentially)
  if (await isBuiltinTranslateAvailable(src, target)) {
    try {
      const t = await self.Translator.create({
        sourceLanguage: src, targetLanguage: target,
        monitor(m) { m.addEventListener('downloadprogress', e => onProgress?.(e.loaded)); }
      });
      try {
        const out = [];
        for (const s of texts) out.push(await t.translate(s));
        __engineLast = 'builtin'; updateEngineBadge();
        return out;
      } finally { t.destroy?.(); }
    } catch (_) {}
  }

  // 2. Google Translate — concatenate inputs with a unique separator, send as
  //    one request, split on response. Reduces request count drastically.
  if (await isGoogleEnabled()) {
    try {
      const SEP = '\n||GOVLENS||\n';
      const joined = texts.join(SEP);
      const translated = await googleTranslate(joined, src, target);
      const parts = translated.split(/\s*\|\|\s*GOVLENS\s*\|\|\s*/);
      if (parts.length === texts.length) {
        __engineLast = 'google'; updateEngineBadge();
        return parts;
      }
      // Fallback: translate one by one (slower but reliable)
      const out = [];
      for (const s of texts) out.push(await googleTranslate(s, src, target));
      __engineLast = 'google'; updateEngineBadge();
      return out;
    } catch (_) {}
  }

  // 3. Anthropic
  if (!apiKey) throw new Error('All free engines failed. Add an Anthropic API key in Settings.');
  const targetName = LANG_NAMES[target] || target;
  const sys = `You translate JSON arrays of strings into ${targetName}. Input: a JSON array of strings. Output: a JSON array of strings of the same length, each translated. Preserve numbers, dates, IDs, named entities verbatim. Output ONLY valid JSON.`;
  const out = await callClaude(apiKey, sys, JSON.stringify(texts), 4000);
  try {
    const arr = JSON.parse(out.match(/\[[\s\S]*\]/)?.[0] || out);
    if (Array.isArray(arr) && arr.length === texts.length) {
      __engineLast = 'anthropic'; updateEngineBadge();
      return arr;
    }
  } catch (_) {}
  return texts;
}

async function builtinSummarize(text, type) {
  if (typeof self.Summarizer === 'undefined') return null;
  try {
    const av = await self.Summarizer.availability();
    if (av === 'unavailable') return null;
    const s = await self.Summarizer.create({
      type: type || 'tldr',
      length: 'medium',
      sharedContext: 'Indian government portal page text. Reader: ordinary citizen.'
    });
    try { return await s.summarize(text); }
    finally { s.destroy?.(); }
  } catch (_) { return null; }
}

// ───────────────────────── engine prediction (H1 fix) ─────────────────────────
// Updates the "Will use:" indicator under the language row so users can see
// which engine WILL handle the translation BEFORE clicking the button.
async function updateEnginePrediction() {
  const tag = $('enginePredictTag');
  if (!tag) return;
  const target = getSelectedTargetLang();
  const src = pageData?.lang || 'en';
  const setTag = (cls, text) => {
    tag.className = 'engine-predict-tag ' + cls;
    tag.textContent = text;
  };

  // 0) Transliteration / custom targets always need Anthropic.
  if (TRANSLITERATION_TARGETS[target] || __customLangOverride) {
    const apiKey = await getApiKey();
    if (apiKey) setTag('cloud', __customLangOverride
      ? `Anthropic · custom: ${__customLangOverride}`
      : `Anthropic · ${TRANSLITERATION_TARGETS[target].name}`);
    else setTag('none', 'Needs Anthropic API key — Settings');
    return;
  }

  // 1) Built-in available?
  const builtinOk = await isBuiltinTranslateAvailable(src, target).catch(() => false);
  if (builtinOk) { setTag('on-device', 'On-device AI · free, private'); return; }

  // 2) Google enabled & target is in the LIKELY-supported set?
  const googleOk = await isGoogleEnabled();
  if (googleOk && LIKELY_BUILTIN_OR_GOOGLE.has(target)) {
    setTag('web', 'Google Translate · free, internet');
    return;
  }

  // 3) Anthropic available?
  const apiKey = await getApiKey();
  if (apiKey) { setTag('cloud', 'Anthropic · premium, your key'); return; }

  setTag('none', 'No engine — add API key in Settings');
}

async function maybeAutoPickTarget(region) {
  const stored = await chrome.storage.local.get(['govlensDefaultLang','govlensTargetTouched']);
  if (stored.govlensTargetTouched) return; // user has manually picked
  if (!region) return;
  const wanted = stored.govlensDefaultLang || 'en';
  // If the stored default IS one of the gov's primary languages, pick the
  // next-most-likely target instead. So a Hindi-default user on a Hindi gov
  // page sees Bengali / English, not "translate Hindi to Hindi".
  let pick = wanted;
  if (region.langs?.includes(wanted)) {
    pick = region.langs.find(l => l !== wanted) || 'en';
  }
  setLangPicker('targetLang', pick);
}

// Helper to update the picker (trigger label + value) via its public API.
function setLangPicker(hiddenId, code) {
  const hidden = $(hiddenId);
  if (!hidden) return;
  if (typeof hidden.lpSet === 'function') hidden.lpSet(code);
  else hidden.value = code;
}

// ───────────────────────── site score ─────────────────────────
const SCORE_HISTORY_MAX = 50;

async function runScore() {
  if (!activeTab) return;
  const btn = $('analyseBtn');
  btn.disabled = true;
  $('scoreTagline').textContent = 'Inspecting page…';

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: window.GOVLENS_ANALYSE_SITE,
    });
    if (!result) throw new Error('Empty result');

    // Persist to history & compute delta vs previous score for this URL
    const prev = await getPreviousScoreFor(result.url);
    await saveScoreToHistory(result);
    renderScore(result, prev);
    renderScoreHistory();
  } catch (e) {
    $('scoreTagline').textContent = 'Could not analyse this page: ' + (e.message || 'unknown error');
    $('scoreTagline').classList.remove('done');
  } finally {
    btn.disabled = false;
  }
}

async function getScoreHistory() {
  const { govlensScoreHistory } = await chrome.storage.local.get(['govlensScoreHistory']);
  return Array.isArray(govlensScoreHistory) ? govlensScoreHistory : [];
}

async function saveScoreToHistory(result) {
  const history = await getScoreHistory();
  // Keep only the slim fields we need to render history — full axes/issues
  // would balloon storage if user analyses many pages.
  history.unshift({
    url: result.url,
    title: result.title || '',
    overall: result.overall,
    grade: result.grade,
    timestamp: result.timestamp || Date.now()
  });
  // Cap to N most recent
  const trimmed = history.slice(0, SCORE_HISTORY_MAX);
  await chrome.storage.local.set({ govlensScoreHistory: trimmed });
}

async function getPreviousScoreFor(url) {
  const history = await getScoreHistory();
  // Find most recent entry for the same URL (excluding the one we're about
  // to add — saveScoreToHistory hasn't run yet at this point).
  return history.find(h => h.url === url) || null;
}

async function clearScoreHistory() {
  await chrome.storage.local.set({ govlensScoreHistory: [] });
  renderScoreHistory();
}

async function renderScoreHistory() {
  const history = await getScoreHistory();
  const sec = $('scoreHistorySection');
  const list = $('scoreHistory');
  if (!history.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';

  list.innerHTML = history.slice(0, 12).map((h, i) => {
    // Find the previous entry for the SAME URL (further down the list) so the
    // delta reflects "how this URL changed", not noise from cross-URL switches.
    const prevForUrl = history.slice(i + 1).find(x => x.url === h.url);
    const delta = prevForUrl ? (h.overall - prevForUrl.overall) : null;
    const deltaCls = delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    const deltaTxt = delta == null ? 'NEW' : delta > 0 ? `+${delta}` : `${delta}`;
    return `
      <div class="history-row" data-url="${escAttr(h.url)}">
        <div class="history-score ${h.grade}">${h.overall}</div>
        <div class="history-meta">
          <div class="history-title">${esc(h.title || h.url)}</div>
          <div class="history-when">${esc(timeAgo(h.timestamp))} · ${esc(shortUrl(h.url))}</div>
        </div>
        <div class="history-delta ${deltaCls}">${deltaTxt}</div>
        <div class="history-grade">${h.grade}</div>
      </div>
    `;
  }).join('');

  // Click a row → open that URL in a new tab
  list.querySelectorAll('[data-url]').forEach(el => {
    el.addEventListener('click', () => chrome.tabs.create({ url: el.dataset.url }));
  });
}

function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function shortUrl(u) {
  try { const url = new URL(u); return url.hostname + (url.pathname.length > 1 ? url.pathname.slice(0, 24) + (url.pathname.length > 24 ? '…' : '') : ''); }
  catch (_) { return u.slice(0, 40); }
}

function renderScore(r, prev) {
  // Hero
  const grade = r.grade;
  $('scoreNum').textContent = r.overall;
  $('scoreGrade').textContent = 'GRADE ' + grade;
  const circle = $('scoreCircle');
  circle.className = 'score-circle ' + grade;
  circle.style.setProperty('--pct', r.overall);

  const messages = {
    A: 'Genuinely well-built. Rare for a gov site.',
    B: 'Above average. Minor polish would push it up.',
    C: 'Mediocre. Multiple usability gaps.',
    D: 'Below average. Hard to use without help.',
    E: 'Bad. Significant accessibility & structure issues.',
    F: 'Broken-feeling. Citizens will struggle.'
  };
  const tagline = $('scoreTagline');
  let msg = messages[grade] || '';
  if (prev && prev.url === r.url) {
    const delta = r.overall - prev.overall;
    if (delta > 0) msg += ` (↑ ${delta} since ${timeAgo(prev.timestamp)})`;
    else if (delta < 0) msg += ` (↓ ${-delta} since ${timeAgo(prev.timestamp)})`;
    else msg += ` (unchanged since ${timeAgo(prev.timestamp)})`;
  }
  tagline.textContent = msg;
  tagline.classList.add('done');

  // Axes
  const wrap = $('scoreAxes');
  wrap.style.display = 'flex';
  wrap.innerHTML = Object.entries(r.axes).map(([key, a]) => {
    const pct = a.score == null ? null : Math.round(a.score);
    const cls = pct == null ? 'skipped' : (pct >= 75 ? '' : pct >= 50 ? 'medium' : 'low');
    const skipped = a.skipped ? 'skipped' : '';
    return `
      <div class="axis ${skipped}">
        <div class="axis-row">
          <span class="axis-icon">${esc(a.icon)}</span>
          <span class="axis-name">${esc(a.label)}</span>
          <span class="axis-pct">${pct == null ? '—' : pct}</span>
        </div>
        <div class="axis-bar"><div class="axis-fill ${cls}" data-w="${pct ?? 0}"></div></div>
        <div class="axis-notes">${esc(a.notes || '')}</div>
      </div>
    `;
  }).join('');
  // Animate fills
  requestAnimationFrame(() => {
    wrap.querySelectorAll('.axis-fill').forEach(el => {
      el.style.width = (el.dataset.w || 0) + '%';
    });
  });

  // Issues
  const isec = $('scoreIssuesSection');
  const ilist = $('scoreIssues');
  if (r.issues.length) {
    isec.style.display = 'block';
    ilist.innerHTML = r.issues.map(i => `
      <div class="score-issue">
        <span class="sev-tag ${i.severity}">${i.severity}</span>
        <div>
          <div class="issue-text">${esc(i.text)}</div>
          ${i.fix ? `<div class="issue-fix">→ ${esc(i.fix)}</div>` : ''}
        </div>
      </div>
    `).join('');
  } else {
    isec.style.display = 'block';
    ilist.innerHTML = '<div class="empty">No major issues detected.</div>';
  }

  $('scoreDisclaimer').style.display = 'block';
}

async function probeBuiltinAI() {
  const el = document.getElementById('builtinStatus');
  if (!el) return;
  const hasTranslator = typeof self.Translator !== 'undefined';
  const hasSummarizer = typeof self.Summarizer !== 'undefined';
  const hasDetector = typeof self.LanguageDetector !== 'undefined';
  if (!hasTranslator && !hasSummarizer) {
    el.textContent = '✗ Browser AI not detected. Use Chrome 138+ on a supported device, or add an API key below.';
    el.style.color = '#a91414';
    return;
  }
  let lines = [];
  if (hasTranslator) lines.push('✓ Translator API');
  if (hasSummarizer) lines.push('✓ Summarizer API');
  if (hasDetector) lines.push('✓ Language Detector');
  el.innerHTML = lines.join('<br>') + '<br><span style="opacity:0.6">Models download on first use.</span>';
  el.style.color = '#137b3b';
  // If on-device works, show a friendly badge in the status strip
  if (hasTranslator) {
    __engineLast = 'builtin';
    updateEngineBadge();
  }
}

function updateEngineBadge() {
  const el = document.getElementById('engineBadge');
  if (!el) return;
  const prev = el.textContent;
  const next = engineLabel();
  el.textContent = next;
  const cls = __engineLast === 'builtin'   ? 'on-device' :
              __engineLast === 'google'    ? 'web' :
              __engineLast === 'anthropic' ? 'cloud' : '';
  el.className = 'engine-badge ' + cls;
  if (prev && prev !== '—' && prev !== next) {
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 600);
  }
}

async function callClaude(apiKey, system, user, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.content?.[0]?.text || '').toString();
}

// ───────────────────────── summarise / explain ─────────────────────────
async function summarisePage() {
  if (!pageData) return;
  const apiKey = await getApiKey();
  const target = getSelectedTargetLang();
  const targetName = LANG_NAMES[target] || target;
  showAi('SUMMARY', '… reading the page …');

  // Try built-in summarizer first (English-only output usually)
  const builtin = await builtinSummarize(pageData.sample.slice(0, 8000), 'tldr');
  if (builtin) {
    let out = builtin;
    // Translate if user wants non-English
    if (target !== 'en') {
      try { out = await translateText(builtin, target, apiKey); }
      catch (_) { /* keep English */ }
    } else {
      __engineLast = 'builtin';
      updateEngineBadge();
    }
    showAi('SUMMARY · ' + engineLabel().toUpperCase(), out);
    return;
  }

  // Fall back to Anthropic
  if (!apiKey) { showApiKeyMissing(); showAi('SUMMARY', 'Add an API key in Settings to summarise.'); return; }
  const sys = `You summarise dense Indian government web pages for ordinary citizens. Reply in ${targetName}. Output: 1) ONE-LINE SUMMARY. 2) WHAT IT'S FOR (2-3 lines). 3) KEY ACTIONS the citizen can take. 4) DOCUMENTS NEEDED (if applicable). Use plain language. No bureaucratic jargon — explain any acronyms inline.`;
  try {
    const out = await callClaude(apiKey, sys, pageData.sample.slice(0, 8000), 800);
    __engineLast = 'anthropic';
    updateEngineBadge();
    showAi('SUMMARY · ' + engineLabel().toUpperCase(), out);
  } catch (e) {
    showAi('ERROR', e.message);
  }
}

async function explainPlain() {
  if (!pageData) return;
  const apiKey = await getApiKey();
  const target = getSelectedTargetLang();
  const targetName = LANG_NAMES[target] || target;
  showAi('PLAIN ENGLISH', '… simplifying …');

  // Built-in summarizer with 'plain-text' type
  const builtin = await builtinSummarize(pageData.sample.slice(0, 8000), 'key-points');
  if (builtin) {
    let out = builtin;
    if (target !== 'en') {
      try { out = await translateText(builtin, target, apiKey); } catch (_) {}
    } else {
      __engineLast = 'builtin';
      updateEngineBadge();
    }
    showAi('PLAIN VERSION · ' + engineLabel().toUpperCase(), out);
    return;
  }

  if (!apiKey) { showApiKeyMissing(); showAi('PLAIN ENGLISH', 'Add an API key in Settings.'); return; }
  const sys = `Rewrite the given Indian gov page text in extremely simple ${targetName}. Imagine you are explaining to a first-time visitor with no legal/finance background. Expand every acronym. Convert jargon to everyday words. Keep it under 250 words. Output rewritten text only.`;
  try {
    const out = await callClaude(apiKey, sys, pageData.sample.slice(0, 8000), 800);
    __engineLast = 'anthropic';
    updateEngineBadge();
    showAi('PLAIN VERSION · ' + engineLabel().toUpperCase(), out);
  } catch (e) {
    showAi('ERROR', e.message);
  }
}

function showAi(label, text) {
  $('aiOutCard').style.display = 'block';
  $('aiOutLabel').textContent = label;
  $('aiOutput').textContent = text;
}

function showApiKeyMissing() {
  $('apiKeyMissing').style.display = 'block';
}

// ───────────────────────── prefs ─────────────────────────
async function getApiKey() {
  const { govlensApiKey } = await chrome.storage.local.get(['govlensApiKey']);
  return govlensApiKey || '';
}
async function loadPrefs() {
  const prefs = await chrome.storage.local.get([
    'govlensApiKey','govlensDefaultLang','govlensJargon','govlensFormSave','govlensToolbar'
  ]);
  if (prefs.govlensDefaultLang) {
    setLangPicker('targetLang',  prefs.govlensDefaultLang);
    setLangPicker('defaultLang', prefs.govlensDefaultLang);
  }
  if (prefs.govlensApiKey) {
    $('keyStatus').textContent = '✓ saved';
    $('keyStatus').className = 'key-status saved';
    $('apiKeyInput').value = '••••••••' + prefs.govlensApiKey.slice(-4);
  }
  $('optJargon').checked = prefs.govlensJargon !== false;
  $('optFormSave').checked = prefs.govlensFormSave !== false;
  $('optToolbar').checked = prefs.govlensToolbar !== false;
  if ($('optGoogle')) $('optGoogle').checked = prefs.govlensGoogle !== false;
}
async function savePrefs() {
  await chrome.storage.local.set({
    govlensDefaultLang: $('defaultLang').value,
    govlensJargon: $('optJargon').checked,
    govlensFormSave: $('optFormSave').checked,
    govlensToolbar: $('optToolbar').checked,
    govlensGoogle: $('optGoogle')?.checked !== false,
  });
}

// Custom free-text language is stored separately and overrides the picker
// when set. Cleared when the user picks any concrete language.
let __customLangOverride = '';
function getSelectedTargetLang() {
  if (__customLangOverride) return __customLangOverride;
  return $('targetLang').value || 'en';
}

// ───────────────────────── UI binds ─────────────────────────
function bindUI() {
  // Pillar tabs — full ARIA tablist pattern (click + arrow keys + Home/End).
  const tabs = Array.from(document.querySelectorAll('.pillar-tab'));
  function activateTab(t) {
    tabs.forEach(x => {
      x.classList.remove('active');
      x.setAttribute('aria-selected', 'false');
      x.tabIndex = -1;
    });
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    t.setAttribute('aria-selected', 'true');
    t.tabIndex = 0;
    const panel = $('panel-' + t.dataset.tab);
    panel.classList.remove('active');
    void panel.offsetWidth;
    requestAnimationFrame(() => panel.classList.add('active'));
  }
  tabs.forEach((t, i) => {
    t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
    t.tabIndex = t.classList.contains('active') ? 0 : -1;
    t.addEventListener('click', () => activateTab(t));
    t.addEventListener('keydown', (e) => {
      let target = null;
      if (e.key === 'ArrowRight') target = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') target = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') target = tabs[0];
      else if (e.key === 'End') target = tabs[tabs.length - 1];
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateTab(t); return; }
      if (target) { e.preventDefault(); activateTab(target); target.focus(); }
    });
  });

  // Translate — picker fires `change` on the hidden #targetLang input.
  $('targetLang').addEventListener('change', () => {
    __customLangOverride = '';     // any concrete pick clears the custom override
    chrome.storage.local.set({ govlensTargetTouched: true });
    updateEnginePrediction();
  });

  // "+ Custom language" — small inline prompt asking for any free-text language.
  const customBtn = document.getElementById('customLangBtn');
  if (customBtn) {
    customBtn.addEventListener('click', () => {
      const v = window.prompt('Translate to which language? Type any name (e.g. "Bhojpuri", "Klingon", "Tamil with formal register").');
      const trimmed = (v || '').trim();
      if (!trimmed) return;
      __customLangOverride = trimmed;
      // Reflect on the trigger label so user knows it's set
      const picker = customBtn.closest('.lang-picker');
      const label = picker?.querySelector('.lp-trigger-label');
      if (label) label.innerHTML = `<span class="lp-sel-name">Custom: ${esc(trimmed)}</span>`;
      const pop = picker?.querySelector('.lp-pop');
      pop?.classList.remove('open');
      setTimeout(() => { if (pop) pop.hidden = true; }, 150);
      picker?.querySelector('.lp-trigger')?.setAttribute('aria-expanded', 'false');
      chrome.storage.local.set({ govlensTargetTouched: true });
      updateEnginePrediction();
    });
  }
  $('translatePageBtn').addEventListener('click', translatePage);
  $('translateSelectionBtn').addEventListener('click', translateSelection);
  $('restoreOriginalBtn').addEventListener('click', restoreOriginal);
  $('summarizeBtn').addEventListener('click', summarisePage);
  $('explainBtn').addEventListener('click', explainPlain);

  // Search
  $('searchBtn').addEventListener('click', doSearch);
  $('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Score
  $('analyseBtn').addEventListener('click', runScore);
  $('clearHistoryBtn').addEventListener('click', clearScoreHistory);
  renderScoreHistory(); // load on boot so the panel isn't empty next session

  // Settings drawer
  const open = () => {
    $('settingsDrawer').classList.add('open');
    $('drawerScrim').classList.add('show');
  };
  const close = () => {
    $('settingsDrawer').classList.remove('open');
    $('drawerScrim').classList.remove('show');
  };
  $('settingsBtn').addEventListener('click', open);
  $('openSettingsFromTranslate').addEventListener('click', open);
  $('closeSettings').addEventListener('click', close);
  $('drawerScrim').addEventListener('click', close);
  // Esc closes the drawer (and the in-drawer focus is restored to the cog).
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('settingsDrawer').classList.contains('open')) {
      close();
      $('settingsBtn').focus();
    }
  });

  // API key
  $('saveKeyBtn').addEventListener('click', async () => {
    const v = $('apiKeyInput').value.trim();
    if (!v || v.startsWith('••')) return;
    if (!/^sk-ant-/.test(v)) {
      $('keyStatus').textContent = '✗ should start with sk-ant-';
      $('keyStatus').className = 'key-status error';
      return;
    }
    await chrome.storage.local.set({ govlensApiKey: v });
    $('keyStatus').textContent = '✓ saved';
    $('keyStatus').className = 'key-status saved';
    $('apiKeyInput').value = '••••••••' + v.slice(-4);
    $('apiKeyMissing').style.display = 'none';
  });

  // Prefs
  ['defaultLang','optJargon','optFormSave','optToolbar','optGoogle'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', savePrefs);
  });
}

// ───────────────────────── utils ─────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(s) { return esc(s).replace(/'/g, '&#39;'); }
function escRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function highlightCtx(text, q) {
  const re = new RegExp(`(${escRegex(q)})`, 'gi');
  return esc(text).replace(re, '<mark>$1</mark>');
}

init();
