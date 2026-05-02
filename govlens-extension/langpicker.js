// langpicker.js – searchable language picker (combobox)
// Replaces the native <select> for language selection. Supports:
//   • Type to filter by code, English name, or native script
//   • ↑/↓ to navigate, Enter to select, Esc to close
//   • Grouped display when no search; flat ranked list when searching
//   • Keeps a hidden <input id="targetLang"> so existing code works unchanged
//
// Markup contract:
//   <div class="lang-picker" data-langpicker data-default="en">
//     <button class="lp-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
//       <span class="lp-trigger-label">English</span>
//       <span class="lp-trigger-arrow">▼</span>
//     </button>
//     <input type="hidden" id="targetLang" value="en" />
//     <div class="lp-pop" role="dialog" hidden>
//       <input class="lp-search" type="text" placeholder="Search 100+ languages…" />
//       <ul class="lp-list" role="listbox"></ul>
//     </div>
//   </div>

(function () {

  // ─────────────────────────── Single source of truth ───────────────────────────
  const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', group: '' },

    // India — 22 scheduled official
    { code: 'hi',  name: 'Hindi',     native: 'हिन्दी',           group: 'India — 22 Official' },
    { code: 'bn',  name: 'Bengali',   native: 'বাংলা',            group: 'India — 22 Official' },
    { code: 'ta',  name: 'Tamil',     native: 'தமிழ்',            group: 'India — 22 Official' },
    { code: 'te',  name: 'Telugu',    native: 'తెలుగు',           group: 'India — 22 Official' },
    { code: 'mr',  name: 'Marathi',   native: 'मराठी',            group: 'India — 22 Official' },
    { code: 'gu',  name: 'Gujarati',  native: 'ગુજરાતી',          group: 'India — 22 Official' },
    { code: 'kn',  name: 'Kannada',   native: 'ಕನ್ನಡ',           group: 'India — 22 Official' },
    { code: 'ml',  name: 'Malayalam', native: 'മലയാളം',          group: 'India — 22 Official' },
    { code: 'pa',  name: 'Punjabi',   native: 'ਪੰਜਾਬੀ',           group: 'India — 22 Official' },
    { code: 'or',  name: 'Odia',      native: 'ଓଡ଼ିଆ',            group: 'India — 22 Official' },
    { code: 'as',  name: 'Assamese',  native: 'অসমীয়া',          group: 'India — 22 Official' },
    { code: 'ur',  name: 'Urdu',      native: 'اردو',              group: 'India — 22 Official' },
    { code: 'sa',  name: 'Sanskrit',  native: 'संस्कृतम्',         group: 'India — 22 Official' },
    { code: 'ks',  name: 'Kashmiri',  native: 'کٲشُر',            group: 'India — 22 Official' },
    { code: 'ne',  name: 'Nepali',    native: 'नेपाली',            group: 'India — 22 Official' },
    { code: 'kok', name: 'Konkani',   native: 'कोंकणी',           group: 'India — 22 Official' },
    { code: 'mai', name: 'Maithili',  native: 'मैथिली',            group: 'India — 22 Official' },
    { code: 'sd',  name: 'Sindhi',    native: 'سنڌي',             group: 'India — 22 Official' },
    { code: 'brx', name: 'Bodo',      native: 'बड़ो',              group: 'India — 22 Official' },
    { code: 'doi', name: 'Dogri',     native: 'डोगरी',             group: 'India — 22 Official' },
    { code: 'mni', name: 'Manipuri',  native: 'ꯃꯩꯇꯩꯂꯣꯟ',         group: 'India — 22 Official', hint: 'Meitei' },
    { code: 'sat', name: 'Santali',   native: 'ᱥᱟᱱᱛᱟᱲᱤ',          group: 'India — 22 Official' },

    // India — Hindi belt regional (non-scheduled)
    { code: 'bho', name: 'Bhojpuri',     native: 'भोजपुरी',       group: 'India — Hindi Belt', hint: '~150M speakers' },
    { code: 'awa', name: 'Awadhi',       native: 'अवधी',          group: 'India — Hindi Belt', hint: '~38M' },
    { code: 'mag', name: 'Magahi',       native: 'मगही',          group: 'India — Hindi Belt', hint: '~13M' },
    { code: 'hne', name: 'Chhattisgarhi',native: 'छत्तीसगढ़ी',     group: 'India — Hindi Belt', hint: '~18M' },
    { code: 'raj', name: 'Rajasthani',   native: 'राजस्थानी',      group: 'India — Hindi Belt', hint: 'umbrella' },
    { code: 'mwr', name: 'Marwari',      native: 'मारवाड़ी',       group: 'India — Hindi Belt', hint: '~7M' },
    { code: 'bgc', name: 'Haryanvi',     native: 'हरियाणवी',      group: 'India — Hindi Belt', hint: '~7M' },
    { code: 'bns', name: 'Bundeli',      native: 'बुंदेली',        group: 'India — Hindi Belt' },
    { code: 'kfy', name: 'Kumaoni',      native: 'कुमाऊँनी',       group: 'India — Hindi Belt' },
    { code: 'gbm', name: 'Garhwali',     native: 'गढ़वाली',        group: 'India — Hindi Belt' },
    { code: 'hno', name: 'Hindko',       native: 'हिंदको',         group: 'India — Hindi Belt' },

    // India — Bihar / Jharkhand
    { code: 'anp', name: 'Angika',     native: 'अंगिका',           group: 'India — Bihar & Jharkhand', hint: '~15M' },
    { code: 'bjj', name: 'Bajjika',    native: 'बज्जिका',          group: 'India — Bihar & Jharkhand', hint: '~20M' },
    { code: 'kxl', name: 'Khortha',    native: 'खोरठा',           group: 'India — Bihar & Jharkhand' },
    { code: 'sjp', name: 'Surjapuri',  native: 'सुरजापुरी',         group: 'India — Bihar & Jharkhand' },
    { code: 'the', name: 'Tharu',      native: 'थारू',             group: 'India — Bihar & Jharkhand', hint: 'Terai' },
    { code: 'pi',  name: 'Pali',       native: 'पालि',             group: 'India — Bihar & Jharkhand', hint: 'classical' },

    // India — West & South
    { code: 'tcy', name: 'Tulu',       native: 'ತುಳು',             group: 'India — West & South', hint: '~2M' },
    { code: 'kfa', name: 'Kodava',     native: 'ಕೊಡವ',            group: 'India — West & South' },
    { code: 'bhb', name: 'Bhili',      native: 'भीली',             group: 'India — West & South', hint: '~4.4M' },
    { code: 'saz', name: 'Saurashtra', native: 'સૌરાષ્ટ્ર',         group: 'India — West & South' },
    { code: 'bfq', name: 'Badaga',     native: 'படகா',            group: 'India — West & South' },
    { code: 'tdd', name: 'Toda',       native: 'தோடா',            group: 'India — West & South' },

    // India — Tribal & Adivasi
    { code: 'gon', name: 'Gondi',     native: 'गोंडी',             group: 'India — Tribal & Adivasi', hint: '~3M' },
    { code: 'kru', name: 'Kurukh',    native: 'कुड़ुख़',            group: 'India — Tribal & Adivasi', hint: 'Oraon' },
    { code: 'unr', name: 'Mundari',   native: 'मुंडारी',           group: 'India — Tribal & Adivasi' },
    { code: 'hoc', name: 'Ho',        native: 'हो',                group: 'India — Tribal & Adivasi' },
    { code: 'khr', name: 'Kharia',    native: 'खड़िया',            group: 'India — Tribal & Adivasi' },
    { code: 'mjt', name: 'Sauria Paharia', native: 'सौरिया पहाड़िया', group: 'India — Tribal & Adivasi' },
    { code: 'njo', name: 'Ao Naga',    native: 'Ao',                group: 'India — Tribal & Adivasi' },
    { code: 'njm', name: 'Angami Naga',native: 'Angami',            group: 'India — Tribal & Adivasi' },
    { code: 'nlj', name: 'Nyishi',     native: 'Nyishi',            group: 'India — Tribal & Adivasi' },
    { code: 'adi', name: 'Adi',        native: 'Adi',               group: 'India — Tribal & Adivasi' },
    { code: 'apt', name: 'Apatani',    native: 'Apatani',           group: 'India — Tribal & Adivasi' },

    // India — North-East
    { code: 'lus', name: 'Mizo',     native: 'Mizo ṭawng',         group: 'India — North-East', hint: '1M+' },
    { code: 'kha', name: 'Khasi',    native: 'Ka Ktien Khasi',     group: 'India — North-East', hint: '1M+' },
    { code: 'trp', name: 'Kokborok', native: 'Kokborok',           group: 'India — North-East', hint: 'Tripura' },
    { code: 'grt', name: 'Garo',     native: 'A·chik',             group: 'India — North-East' },
    { code: 'dim', name: 'Dimasa',   native: 'Dimasa',             group: 'India — North-East' },
    { code: 'mjw', name: 'Karbi',    native: 'Karbi',              group: 'India — North-East' },
    { code: 'hii', name: 'Hmar',     native: 'Hmar',               group: 'India — North-East' },

    // India — Himalayan
    { code: 'lbj', name: 'Ladakhi',         native: 'ལ་དྭགས་སྐད་',   group: 'India — Himalayan' },
    { code: 'lep', name: 'Lepcha',          native: 'ᰛᰩᰵ་ᰛᰧᰵ་',    group: 'India — Himalayan', hint: 'Sikkim' },
    { code: 'sip', name: 'Sikkimese',       native: 'Bhutia',         group: 'India — Himalayan' },
    { code: 'bft', name: 'Balti',           native: 'Balti',          group: 'India — Himalayan' },
    { code: 'trw', name: 'Torwali',         native: 'Torwali',        group: 'India — Himalayan' },
    { code: 'bsh', name: 'Kashmiri Pahari', native: 'पहाड़ी',         group: 'India — Himalayan' },

    // India — Historic scripts (transliterate first)
    { code: 'kthi',  name: 'Kaithi script',    native: '𑂍𑂶𑂘𑂲',    group: 'India — Historic Scripts', hint: 'older Bhojpuri/Magahi/Maithili docs' },
    { code: 'tirh',  name: 'Tirhuta script',   native: '𑒞𑒱𑒩𑒯𑒳𑒞𑒰', group: 'India — Historic Scripts', hint: 'older Maithili docs' },
    { code: 'ne_dv', name: 'Devanagari↔Latin', native: 'romanise',    group: 'India — Historic Scripts', hint: 'transliteration only' },

    // South Asia neighbours
    { code: 'si', name: 'Sinhala',  native: 'සිංහල',  group: 'South Asia — Neighbours' },
    { code: 'dv', name: 'Dhivehi',  native: 'ދިވެހި',  group: 'South Asia — Neighbours' },
    { code: 'dz', name: 'Dzongkha', native: 'རྫོང་ཁ', group: 'South Asia — Neighbours' },
    { code: 'my', name: 'Burmese',  native: 'ဗမာ',    group: 'South Asia — Neighbours' },

    // International
    { code: 'es', name: 'Spanish',    native: 'Español',          group: 'International' },
    { code: 'fr', name: 'French',     native: 'Français',         group: 'International' },
    { code: 'de', name: 'German',     native: 'Deutsch',          group: 'International' },
    { code: 'it', name: 'Italian',    native: 'Italiano',         group: 'International' },
    { code: 'pt', name: 'Portuguese', native: 'Português',        group: 'International' },
    { code: 'ru', name: 'Russian',    native: 'Русский',          group: 'International' },
    { code: 'ar', name: 'Arabic',     native: 'العربية',           group: 'International' },
    { code: 'zh', name: 'Chinese',    native: '中文',              group: 'International' },
    { code: 'ja', name: 'Japanese',   native: '日本語',            group: 'International' },
    { code: 'ko', name: 'Korean',     native: '한국어',            group: 'International' },
    { code: 'th', name: 'Thai',       native: 'ไทย',              group: 'International' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt',       group: 'International' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', group: 'International' },
    { code: 'ms', name: 'Malay',      native: 'Bahasa Melayu',    group: 'International' },
    { code: 'tr', name: 'Turkish',    native: 'Türkçe',            group: 'International' },
    { code: 'fa', name: 'Persian',    native: 'فارسی',             group: 'International' },
    { code: 'he', name: 'Hebrew',     native: 'עברית',             group: 'International' },
    { code: 'sw', name: 'Swahili',    native: 'Kiswahili',        group: 'International' },
  ];

  // ─────────────────────────── lookup helpers ───────────────────────────
  const BY_CODE = Object.fromEntries(LANGUAGES.map(l => [l.code, l]));
  function findByCode(code) { return BY_CODE[code]; }

  function searchLanguages(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return null; // null → caller renders grouped

    const scored = [];
    for (const lang of LANGUAGES) {
      let score = 0;
      const nameL   = lang.name.toLowerCase();
      const nativeL = (lang.native || '').toLowerCase();
      const codeL   = lang.code.toLowerCase();
      const hintL   = (lang.hint || '').toLowerCase();

      if (codeL === q)               score += 100; // exact code
      else if (codeL.startsWith(q))  score += 80;
      if (nameL === q)               score += 90;
      else if (nameL.startsWith(q))  score += 70;
      else if (nameL.includes(q))    score += 40;
      if (nativeL.includes(q))       score += 50;
      if (hintL.includes(q))         score += 20;

      if (score > 0) scored.push({ lang, score });
    }
    scored.sort((a, b) => b.score - a.score || a.lang.name.localeCompare(b.lang.name));
    return scored.map(x => x.lang);
  }

  function groupedLanguages() {
    const groups = new Map();
    for (const lang of LANGUAGES) {
      const k = lang.group || '';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(lang);
    }
    return groups;
  }

  // ─────────────────────────── recents (shared across all pickers) ───────────────────────────
  const RECENTS_KEY = 'govlensRecentLangs';
  const RECENTS_MAX = 5;
  let recentCodes = [];
  let recentsLoaded = false;
  const onRecentsChangeListeners = new Set();

  async function loadRecents() {
    if (recentsLoaded) return;
    recentsLoaded = true;
    try {
      const r = await chrome.storage?.local?.get?.([RECENTS_KEY]);
      if (Array.isArray(r?.[RECENTS_KEY])) recentCodes = r[RECENTS_KEY];
    } catch (_) {}
    onRecentsChangeListeners.forEach(fn => fn());
  }

  async function pushRecent(code) {
    if (!code || !findByCode(code)) return;
    // Move-to-front, dedupe, cap
    recentCodes = [code, ...recentCodes.filter(c => c !== code)].slice(0, RECENTS_MAX);
    try { await chrome.storage?.local?.set?.({ [RECENTS_KEY]: recentCodes }); } catch (_) {}
    onRecentsChangeListeners.forEach(fn => fn());
  }

  // ─────────────────────────── Picker component ───────────────────────────
  function initPicker(root) {
    if (root.__lpInited) return;
    root.__lpInited = true;
    loadRecents();

    const trigger = root.querySelector('.lp-trigger');
    const triggerLabel = root.querySelector('.lp-trigger-label');
    const hidden  = root.querySelector('input[type="hidden"]');
    const pop     = root.querySelector('.lp-pop');
    const search  = root.querySelector('.lp-search');
    const list    = root.querySelector('.lp-list');

    let activeIndex = -1; // index into the currently-rendered .lp-option items
    const dflt = root.dataset.default || hidden.value || 'en';

    setSelected(dflt, { silent: true });

    trigger.addEventListener('click', () => togglePop());
    document.addEventListener('mousedown', (e) => {
      if (!root.contains(e.target)) closePop();
    });
    search.addEventListener('input', () => render(search.value));
    search.addEventListener('keydown', onSearchKey);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPop();
      }
    });

    function togglePop() { pop.hidden ? openPop() : closePop(); }
    function openPop() {
      pop.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      render('');
      // focus search and animate in
      requestAnimationFrame(() => {
        pop.classList.add('open');
        search.value = '';
        search.focus();
      });
    }
    function closePop() {
      pop.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      activeIndex = -1;
      // wait for transition before hiding to avoid focus jump
      setTimeout(() => { pop.hidden = true; }, 150);
    }

    function setSelected(code, { silent } = {}) {
      const lang = findByCode(code);
      if (!lang) return;
      hidden.value = code;
      triggerLabel.innerHTML =
        `<span class="lp-sel-name">${lang.name}</span>` +
        (lang.native && lang.native !== lang.name
          ? `<span class="lp-sel-native">${lang.native}</span>`
          : '');
      if (!silent) hidden.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function render(query) {
      const filtered = searchLanguages(query);
      list.innerHTML = '';
      activeIndex = -1;

      if (filtered === null) {
        // Grouped view — RECENT group first, then the regular groups.
        const recents = recentCodes.map(findByCode).filter(Boolean);
        if (recents.length) {
          const li = document.createElement('li');
          li.className = 'lp-group lp-group-recent';
          li.textContent = '★ Recent';
          list.appendChild(li);
          for (const l of recents) list.appendChild(makeOption(l, { recent: true }));
        }
        const groups = groupedLanguages();
        for (const [groupName, langs] of groups) {
          if (groupName) {
            const li = document.createElement('li');
            li.className = 'lp-group';
            li.textContent = groupName;
            list.appendChild(li);
          }
          for (const l of langs) list.appendChild(makeOption(l));
        }
      } else if (filtered.length === 0) {
        const li = document.createElement('li');
        li.className = 'lp-empty';
        li.textContent = `No language matches "${query}"`;
        list.appendChild(li);
      } else {
        for (const l of filtered) list.appendChild(makeOption(l));
      }

      // Highlight current selection if visible
      const cur = list.querySelector(`[data-code="${hidden.value}"]`);
      if (cur) cur.classList.add('current');
    }

    function makeOption(lang, opts) {
      const li = document.createElement('li');
      li.className = 'lp-option' + (opts?.recent ? ' lp-option-recent' : '');
      li.setAttribute('role', 'option');
      li.dataset.code = lang.code;
      li.innerHTML =
        (opts?.recent ? '<span class="lp-recent-mark" aria-hidden="true">★</span>' : '') +
        `<span class="lp-name">${lang.name}</span>` +
        (lang.native && lang.native !== lang.name
          ? ` <span class="lp-native">${lang.native}</span>` : '') +
        (lang.hint ? ` <span class="lp-hint">${lang.hint}</span>` : '') +
        ` <span class="lp-code">${lang.code}</span>`;
      li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(lang); });
      return li;
    }

    function pick(lang) {
      setSelected(lang.code);
      pushRecent(lang.code); // remember for next time
      closePop();
      trigger.focus();
    }

    // Re-render if recents change while popover is open (e.g. another picker
    // updated the list).
    onRecentsChangeListeners.add(() => {
      if (!pop.hidden) render(search.value);
    });

    function onSearchKey(e) {
      const opts = list.querySelectorAll('.lp-option');
      if (e.key === 'Escape') { e.preventDefault(); closePop(); trigger.focus(); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && opts[activeIndex]) {
          pick(findByCode(opts[activeIndex].dataset.code));
        } else if (opts.length === 1) {
          pick(findByCode(opts[0].dataset.code));
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!opts.length) return;
        if (activeIndex >= 0) opts[activeIndex].classList.remove('active');
        if (e.key === 'ArrowDown') activeIndex = (activeIndex + 1) % opts.length;
        else activeIndex = (activeIndex - 1 + opts.length) % opts.length;
        opts[activeIndex].classList.add('active');
        opts[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    // Public API on the hidden input — sidepanel.js reads .value as before
    Object.defineProperty(hidden, 'lpSet', {
      value: (code) => setSelected(code),
      writable: false
    });
  }

  function initAll(scope) {
    (scope || document).querySelectorAll('.lang-picker[data-langpicker]').forEach(initPicker);
  }

  if (typeof window !== 'undefined') {
    window.GOVLENS_LANG = {
      LANGUAGES,
      findByCode,
      searchLanguages,
      groupedLanguages,
      initAll,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }
})();
