// content.js – GovLens content script
// Runs on .gov.in / .nic.in pages. Provides:
//  • Floating retro search toolbar (in-page Ctrl+F-style)
//  • Jargon term highlighting + tooltip
//  • Form draft auto-save and restore
//  • JUMP_TO_MATCH listener (from side panel) — scrolls to and pulses the exact
//    Nth occurrence of the user's query.

(function () {
  if (window.__govlensLoaded) return;
  window.__govlensLoaded = true;

  // ───────────────────────── prefs ─────────────────────────
  const PREFS = { jargon: true, formSave: true, toolbar: true };
  let booted = false;
  function bootOnce() { if (!booted) { booted = true; boot(); } }

  // Try to read prefs; fall back to defaults if storage isn't reachable.
  try {
    chrome.storage.local.get(['govlensJargon','govlensFormSave','govlensToolbar'], (p) => {
      if (p) {
        if (p.govlensJargon === false) PREFS.jargon = false;
        if (p.govlensFormSave === false) PREFS.formSave = false;
        if (p.govlensToolbar === false) PREFS.toolbar = false;
      }
      bootOnce();
    });
  } catch (_) {
    bootOnce();
  }
  // Safety net: if the storage callback never fires, boot anyway after 800ms.
  setTimeout(bootOnce, 800);

  function boot() {
    if (PREFS.toolbar) injectToolbar();
    if (PREFS.jargon) setTimeout(highlightJargon, 600);
    if (PREFS.formSave) setupFormDraft();
    setupJumpListener();
  }

  // ───────────────────────── toolbar ─────────────────────────
  function injectToolbar() {
    const bar = document.createElement('div');
    bar.id = 'govlens-toolbar';
    bar.innerHTML = `
      <div id="govlens-bar">
        <span class="gl-brand">GL</span>
        <input type="text" id="gl-search" placeholder="Search this page…" />
        <button id="gl-prev" title="Previous">↑</button>
        <button id="gl-next" title="Next">↓</button>
        <span id="gl-count"></span>
        <button id="gl-close" title="Close">✕</button>
      </div>`;
    document.body.appendChild(bar);

    let matches = [];
    let current = -1;

    const search = document.getElementById('gl-search');
    search.addEventListener('input', debounce(runSearch, 250));
    document.getElementById('gl-prev').addEventListener('click', () => navigate(-1));
    document.getElementById('gl-next').addEventListener('click', () => navigate(1));
    document.getElementById('gl-close').addEventListener('click', () => {
      bar.style.display = 'none';
      clearHighlights();
    });

    function runSearch() {
      clearHighlights();
      const q = search.value.trim();
      if (q.length < 2) { setCount(''); return; }
      matches = highlightAllOccurrences(q, document.body);
      current = matches.length ? 0 : -1;
      if (current >= 0) {
        matches[0].classList.add('gl-active');
        matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setCount(matches.length ? `${current + 1} / ${matches.length}` : 'No results');
    }

    function navigate(dir) {
      if (!matches.length) return;
      matches[current]?.classList.remove('gl-active');
      current = (current + dir + matches.length) % matches.length;
      const m = matches[current];
      m.classList.add('gl-active');
      m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setCount(`${current + 1} / ${matches.length}`);
    }

    function setCount(t) { document.getElementById('gl-count').textContent = t; }
  }

  // Walk DOM, wrap each occurrence of q in <mark class="gl-mark">
  function highlightAllOccurrences(q, root) {
    const found = [];
    const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','INPUT','TEXTAREA']);
    const ql = q.toLowerCase();
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const lower = text.toLowerCase();
        if (!lower.includes(ql)) return;
        const frag = document.createDocumentFragment();
        let i = 0;
        while (i < text.length) {
          const at = lower.indexOf(ql, i);
          if (at === -1) {
            frag.appendChild(document.createTextNode(text.slice(i)));
            break;
          }
          if (at > i) frag.appendChild(document.createTextNode(text.slice(i, at)));
          const mark = document.createElement('mark');
          mark.className = 'gl-mark';
          mark.textContent = text.slice(at, at + q.length);
          frag.appendChild(mark);
          found.push(mark);
          i = at + q.length;
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP.has(node.tagName)) return;
        if (node.id === 'govlens-toolbar') return;
        if (node.classList?.contains('gl-jargon-tip')) return;
        Array.from(node.childNodes).forEach(walk);
      }
    }
    walk(root);
    return found;
  }

  function clearHighlights() {
    document.querySelectorAll('.gl-mark').forEach(m => {
      const t = document.createTextNode(m.textContent);
      m.parentNode.replaceChild(t, m);
    });
    document.body.normalize();
  }

  // ───────────────────────── jump-to-match (from side panel) ─────────────────────────
  function setupJumpListener() {
    chrome.runtime?.onMessage?.addListener?.((msg, sender, respond) => {
      if (msg?.type === 'JUMP_TO_MATCH') {
        jumpToOccurrence(msg.query, msg.occurrenceIndex);
        respond?.({ ok: true });
      } else if (msg?.type === 'SHOW_TOOLBAR') {
        const t = document.getElementById('govlens-toolbar');
        if (t) { t.style.display = 'block'; document.getElementById('gl-search').focus(); }
        respond?.({ ok: true });
      }
    });
    // Fallback path (executeScript injection)
    window.addEventListener('govlens-jump', (e) => {
      jumpToOccurrence(e.detail.query, e.detail.occurrenceIndex);
    });
  }

  function jumpToOccurrence(query, targetIndex) {
    if (!query) return;
    // Re-walk to find the Nth occurrence and wrap exactly that hit
    const ql = query.toLowerCase();
    const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME']);
    let occurrence = 0, foundEl = null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
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
          // Found the target. Wrap and bail.
          const before = text.slice(0, from);
          const match = text.slice(from, from + query.length);
          const after = text.slice(from + query.length);
          const span = document.createElement('span');
          span.appendChild(document.createTextNode(before));
          const mark = document.createElement('mark');
          mark.className = 'gl-mark gl-active gl-jump-pulse';
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
      // Auto-clear pulse after 4s, but keep mark for visibility
      setTimeout(() => foundEl.classList.remove('gl-jump-pulse'), 4000);
      setTimeout(() => {
        if (foundEl.isConnected) {
          const t = document.createTextNode(foundEl.textContent);
          foundEl.parentNode.replaceChild(t, foundEl);
        }
      }, 12000);
    }
  }

  // ───────────────────────── jargon explainer ─────────────────────────
  function highlightJargon() {
    // Pick the dictionary for the region of the current page, not the user's.
    const region = window.GOVLENS_REGIONS?.detectRegion?.(location.href);
    const J  = region && window.GOVLENS_JARGON_DICT_FOR ? window.GOVLENS_JARGON_DICT_FOR(region.code) : window.GOVLENS_JARGON;
    const re = region && window.GOVLENS_JARGON_REGEX_FOR ? window.GOVLENS_JARGON_REGEX_FOR(region.code) : window.GOVLENS_JARGON_REGEX;
    if (!J || !re) return;
    const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','INPUT','TEXTAREA','SELECT','OPTION','CODE','PRE']);

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text || text.length < 2) return;
        re.lastIndex = 0;
        if (!re.test(text)) return;
        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0, m;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const term = m[1];
          const info = J[term];
          if (info) {
            const span = document.createElement('span');
            span.className = 'gl-jargon';
            span.textContent = term;
            span.dataset.full = info.full;
            span.dataset.desc = info.desc;
            span.tabIndex = 0;
            frag.appendChild(span);
          } else {
            frag.appendChild(document.createTextNode(term));
          }
          last = m.index + term.length;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP.has(node.tagName)) return;
        if (node.id === 'govlens-toolbar' || node.classList?.contains('gl-jargon')) return;
        if (node.classList?.contains('gl-jargon-tip')) return;
        Array.from(node.childNodes).forEach(walk);
      }
    }
    walk(document.body);

    // Single shared tooltip
    const tip = document.createElement('div');
    tip.className = 'gl-jargon-tip';
    tip.style.display = 'none';
    document.body.appendChild(tip);

    document.body.addEventListener('mouseover', (e) => {
      const t = e.target.closest?.('.gl-jargon');
      if (!t) return;
      tip.innerHTML = `<div class="gl-jt-term">${escapeHtml(t.textContent)} — ${escapeHtml(t.dataset.full)}</div>
                      <div class="gl-jt-desc">${escapeHtml(t.dataset.desc)}</div>`;
      tip.style.display = 'block';
      const r = t.getBoundingClientRect();
      tip.style.left = Math.min(window.innerWidth - 320, r.left + window.scrollX) + 'px';
      tip.style.top = (r.bottom + window.scrollY + 6) + 'px';
    });
    document.body.addEventListener('mouseout', (e) => {
      if (e.target.closest?.('.gl-jargon')) tip.style.display = 'none';
    });
  }

  // ───────────────────────── form draft auto-save ─────────────────────────
  function setupFormDraft() {
    const KEY = 'govlens-draft:' + location.origin + location.pathname;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}

    // Restore notice if anything was saved
    if (Object.keys(saved).length) showRestoreBanner(saved);

    document.addEventListener('input', debounce((e) => {
      const el = e.target;
      if (!el || !el.matches?.('input, textarea, select')) return;
      if (el.type === 'password' || el.type === 'hidden' || el.type === 'file') return;
      // Skip search/login inputs by heuristic
      if (/captcha|password|otp/i.test(el.name || '') || /captcha|otp/i.test(el.id || '')) return;
      const sel = fieldSelector(el);
      if (!sel) return;
      let store = {};
      try { store = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}
      if (el.type === 'checkbox' || el.type === 'radio') {
        store[sel] = { type: el.type, checked: el.checked };
      } else {
        store[sel] = { type: el.type || 'text', value: el.value };
      }
      try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {}
    }, 400));
  }

  function showRestoreBanner(saved) {
    const n = document.createElement('div');
    n.className = 'gl-restore-banner';
    n.innerHTML = `
      <span><b>GovLens:</b> Found a saved draft from this form.</span>
      <button id="gl-restore-yes">RESTORE</button>
      <button id="gl-restore-no">DISMISS</button>
      <button id="gl-restore-x">✕</button>
    `;
    document.body.appendChild(n);

    n.querySelector('#gl-restore-yes').addEventListener('click', () => {
      for (const sel in saved) {
        try {
          const el = document.querySelector(sel);
          if (!el) continue;
          const v = saved[sel];
          if (v.type === 'checkbox' || v.type === 'radio') {
            el.checked = !!v.checked;
          } else {
            el.value = v.value;
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (_) {}
      }
      n.remove();
    });
    n.querySelector('#gl-restore-no').addEventListener('click', () => {
      // Soft-delete: move to a trash key with a 30-second undo window.
      const KEY  = 'govlens-draft:'      + location.origin + location.pathname;
      const TRSH = 'govlens-draft-trash:' + location.origin + location.pathname;
      try {
        const stored = localStorage.getItem(KEY);
        if (stored) {
          localStorage.setItem(TRSH, stored);
          localStorage.removeItem(KEY);
        }
      } catch (_) {}
      n.remove();
      showUndoToast(saved, KEY, TRSH);
    });
    n.querySelector('#gl-restore-x').addEventListener('click', () => n.remove());
  }

  // 30-second undo toast after dismissing a draft. Mis-clicking DISMISS no
  // longer destroys the user's typed-in form data.
  function showUndoToast(savedDraft, KEY, TRSH) {
    const toast = document.createElement('div');
    toast.className = 'gl-undo-toast';
    toast.innerHTML = `
      <span>Draft cleared.</span>
      <button id="gl-undo-yes">UNDO</button>
      <span class="gl-undo-bar"><span></span></span>
    `;
    document.body.appendChild(toast);

    const fill = toast.querySelector('.gl-undo-bar > span');
    requestAnimationFrame(() => { fill.style.width = '100%'; });

    let cleared = false;
    const cleanup = () => { try { localStorage.removeItem(TRSH); } catch (_) {} };

    const undoBtn = toast.querySelector('#gl-undo-yes');
    undoBtn.addEventListener('click', () => {
      if (cleared) return;
      cleared = true;
      try {
        const trashed = localStorage.getItem(TRSH);
        if (trashed) {
          localStorage.setItem(KEY, trashed);
          localStorage.removeItem(TRSH);
        }
      } catch (_) {}
      toast.remove();
      // Re-show the restore banner so the user can immediately recover.
      try { showRestoreBanner(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
    });

    setTimeout(() => {
      if (!cleared) cleanup();
      toast.remove();
    }, 30000);
  }

  function fieldSelector(el) {
    if (el.id) return '#' + cssEscape(el.id);
    if (el.name) return `${el.tagName.toLowerCase()}[name="${cssEscape(el.name)}"]`;
    return null;
  }
  function cssEscape(s) { return String(s).replace(/(["\\])/g, '\\$1'); }

  // ───────────────────────── utils ─────────────────────────
  function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }
  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
