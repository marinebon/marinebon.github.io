/* ============================================================================
   MBON unified tag filter + search — vanilla JS, one module, two backends.

   Rendered by layouts/partials/tag-filter.html. A single [data-tag-filter] root
   carries a free-text box + a "Filter by tag" dropdown of colorized pills
   (grouped by facet prefix, sorted by value) + a row of removable chips. Every
   selected tag AND the free text are combined with AND.

     mode "dom"      show/hide the page's server-rendered [data-filter-item] cards
                     (each carries data-tags="facet.Value facet.Value …"); free
                     text is a substring match over the card's text.
     mode "pagefind" query Pagefind across all content and render result cards;
                     free text is the Pagefind query. Pagefind ANDs within a facet
                     by default, so {facet:[a,b]} means a AND b.

   Facet order and friendly labels come from the build-time JSON config
   (.tag-filter__config) sourced from data/tags.yaml.
   ========================================================================== */
(function () {
  function init() {
    var root = document.querySelector('[data-tag-filter]');
    if (!root) return;

    var cfg;
    try { cfg = JSON.parse(root.querySelector('.tag-filter__config').textContent); }
    catch (e) { return; }

    var mode  = cfg.mode || 'dom';
    var noun  = cfg.noun || 'results';
    var order = cfg.facetOrder || [];
    var FLABEL = cfg.facetLabels || {};
    var VLABEL = cfg.valueLabels || {};
    var BASE = (cfg.base || '/').replace(/\/+$/, '');

    var textEl   = root.querySelector('.tag-filter__text');
    var addBtn   = root.querySelector('.tag-filter__add-btn');
    var panel    = root.querySelector('.tag-filter__panel');
    var panelQ   = root.querySelector('.tag-filter__panel-search');
    var panelBody = root.querySelector('.tag-filter__panel-body');
    var chipsEl  = root.querySelector('.tag-filter__chips');
    var clearEl  = root.querySelector('.tag-filter__clear');
    var countEl  = root.querySelector('.tag-filter__count');
    var statusEl = root.querySelector('.tag-filter__status');   // pagefind only
    var resultsEl = root.querySelector('.tag-filter__results'); // pagefind only
    // quick-filter pills above a grouped list (partials/tag-pills.html) — same
    // selection state as the dropdown, so the two always agree
    var quickPills = [].slice.call(document.querySelectorAll('[data-quick-filter]'));

    // selected filters, in add order: [{facet, value}]
    var selected = [];
    // universe of pills: facet -> [value, …]
    var available = {};
    var debounce = null;

    /* ---- label + escape helpers ------------------------------------------ */
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function humanize(v) {
      if (/^\d+$/.test(v)) return v;
      return v.split('-').map(function (w) {
        return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      }).join(' ');
    }
    function valueLabel(facet, value) {
      return VLABEL[facet + '.' + value] || humanize(value);
    }
    function facetLabel(facet) {
      return FLABEL[facet] || (facet.charAt(0).toUpperCase() + facet.slice(1));
    }
    // Deterministic fallback color for a facet with no --facet-<name> CSS token, so a
    // newly-introduced tag prefix still gets consistent, distinct colored pills.
    function genColor(name) {
      var h = 0;
      for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
      return 'hsl(' + (h % 360) + ', 42%, 42%)';
    }
    // Every facet in play gets a --facet-<name> custom property: honor the one defined in
    // CSS (manual override); auto-assign genColor() for any facet that lacks one.
    function ensureColors() {
      var cs = getComputedStyle(document.documentElement);
      facetList().forEach(function (facet) {
        if (!cs.getPropertyValue('--facet-' + facet).trim()) {
          document.documentElement.style.setProperty('--facet-' + facet, genColor(facet));
        }
      });
    }
    // pill/chip color is driven entirely by --facet-<name> (set inline so it works even
    // when no .tag--<name> CSS rule exists for a new facet)
    function pillClass(facet) { return 'tag tag--' + facet; }
    function pillStyle(facet) { return 'style="--_c:var(--facet-' + esc(facet) + ')"'; }
    // facets to show, in registry order, then any extra facet found only in the content
    function facetList() {
      var list = order.slice();
      Object.keys(available).forEach(function (f) { if (list.indexOf(f) === -1) list.push(f); });
      return list;
    }

    /* ---- selection state -------------------------------------------------- */
    function isSelected(facet, value) {
      return selected.some(function (s) { return s.facet === facet && s.value === value; });
    }
    function addSel(facet, value) {
      if (!isSelected(facet, value)) selected.push({ facet: facet, value: value });
    }
    function removeSel(facet, value) {
      selected = selected.filter(function (s) { return !(s.facet === facet && s.value === value); });
    }

    /* ---- dropdown of available pills, grouped by facet -------------------- */
    function renderPanel() {
      var q = (panelQ.value || '').toLowerCase().trim();
      var html = '';
      facetList().forEach(function (facet) {
        var vals = (available[facet] || []).filter(function (v) {
          if (isSelected(facet, v)) return false;
          if (!q) return true;
          return (facetLabel(facet) + ' ' + valueLabel(facet, v)).toLowerCase().indexOf(q) !== -1;
        });
        if (!vals.length) return;
        vals.sort(function (a, b) {
          if (facet === 'year') return b.localeCompare(a, undefined, { numeric: true });
          return valueLabel(facet, a).localeCompare(valueLabel(facet, b));
        });
        html += '<div class="tag-filter__group">' +
          '<span class="tag-filter__group-label" style="color:var(--facet-' + esc(facet) + ');">' +
            esc(facetLabel(facet)) + '</span>' +
          '<div class="tag-filter__group-pills">' +
            vals.map(function (v) {
              return '<button type="button" class="' + pillClass(facet) + '" ' + pillStyle(facet) + ' role="option"' +
                ' data-facet="' + esc(facet) + '" data-value="' + esc(v) + '">' +
                esc(valueLabel(facet, v)) + '</button>';
            }).join('') +
          '</div></div>';
      });
      panelBody.innerHTML = html || '<p class="tag-filter__empty-tags">No matching tags.</p>';
    }

    /* ---- selected chips --------------------------------------------------- */
    function renderChips() {
      chipsEl.innerHTML = selected.map(function (s) {
        return '<span class="tag-chip ' + pillClass(s.facet) + '" ' + pillStyle(s.facet) + '>' +
          '<span>' + esc(facetLabel(s.facet)) + ': ' + esc(valueLabel(s.facet, s.value)) + '</span>' +
          '<button type="button" aria-label="Remove ' + esc(valueLabel(s.facet, s.value)) + '"' +
          ' data-facet="' + esc(s.facet) + '" data-value="' + esc(s.value) + '">&times;</button></span>';
      }).join('');
    }
    // Clear resets everything, so show it whenever any tag OR free text is active
    function updateClear() {
      clearEl.hidden = !(selected.length || (textEl.value || '').trim());
    }
    // quick pills mirror the current selection (a tag added from the dropdown or
    // the URL lights up its pill, and vice versa)
    function renderQuick() {
      quickPills.forEach(function (b) {
        var on = isSelected(b.getAttribute('data-facet'), b.getAttribute('data-value'));
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }

    /* ---- URL sync (shareable filtered views) ----------------------------- */
    function syncUrl() {
      var params = new URLSearchParams();
      var q = (textEl.value || '').trim();
      if (q) params.set('q', q);
      order.forEach(function (facet) {
        var vals = selected.filter(function (s) { return s.facet === facet; })
                           .map(function (s) { return s.value; });
        if (vals.length) params.set(facet, vals.join(','));
      });
      var qs = params.toString();
      history.replaceState(null, '', qs ? '?' + qs : location.pathname);
    }

    /* ====================================================================== */
    /*  DOM backend                                                           */
    /* ====================================================================== */
    var cards = [];
    function domSetup() {
      cards = Array.prototype.slice.call(document.querySelectorAll('[data-filter-item]'));
      cards.forEach(function (c) {
        c._tags = (c.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean);
        c._text = (c.textContent || '').toLowerCase();
      });
      // universe = every facet.value actually present on this page
      var seen = {};
      cards.forEach(function (c) {
        c._tags.forEach(function (t) {
          var i = t.indexOf('.');
          if (i < 1) return;
          var facet = t.slice(0, i), value = t.slice(i + 1);
          var key = facet + '.' + value;
          if (seen[key]) return;
          seen[key] = true;
          (available[facet] = available[facet] || []).push(value);
        });
      });
    }
    function domApply() {
      var q = (textEl.value || '').toLowerCase().trim();
      // grouped lists repeat a card under every group it belongs to (a tool that is
      // both a Portal and an Infographic), so the tally counts distinct pages via
      // data-filter-key rather than DOM nodes
      var shown = {}, total = {};
      cards.forEach(function (card, i) {
        var key = card.getAttribute('data-filter-key') || ('#' + i);
        total[key] = 1;
        var ok = selected.every(function (s) {
          return card._tags.indexOf(s.facet + '.' + s.value) !== -1;
        }) && (!q || card._text.indexOf(q) !== -1);
        card.style.display = ok ? '' : 'none';
        if (ok) shown[key] = 1;
      });
      // multi-section lists (Events → Upcoming/Past, and the grouped Tools/Papers/
      // Datasets catalogs): hide a whole section, heading and all, once none of its
      // items are visible, and keep its heading + pill counts in step
      [].forEach.call(document.querySelectorAll('[data-filter-section]'), function (sec) {
        var vis = [].filter.call(sec.querySelectorAll('[data-filter-item]'), function (c) {
          return c.style.display !== 'none';
        }).length;
        var facet = sec.getAttribute('data-facet'), value = sec.getAttribute('data-value');
        // when the grouping facet itself is filtered (a pill / chip on tool, year,
        // portal), show only the chosen groups — otherwise picking "Infographic"
        // would still surface a "Portal" heading for a tool that is both
        var chosen = true;
        if (facet) {
          var picks = selected.filter(function (s) { return s.facet === facet; });
          chosen = !picks.length || picks.some(function (s) { return s.value === value; });
        }
        sec.style.display = (vis && chosen) ? '' : 'none';
        var cnt = sec.querySelector('[data-group-count]');
        if (cnt) cnt.textContent = vis;
        if (!facet || !value) return;
        quickPills.forEach(function (b) {
          if (b.getAttribute('data-facet') !== facet || b.getAttribute('data-value') !== value) return;
          var n = b.querySelector('.tag-pills__n');
          if (n) n.textContent = vis;
        });
      });
      var nShown = Object.keys(shown).length, nTotal = Object.keys(total).length;
      countEl.textContent = (selected.length || q)
        ? nShown + ' of ' + nTotal + ' ' + noun
        : nTotal + ' ' + noun;
      var empty = document.querySelector('[data-filter-empty]');
      if (empty) empty.style.display = nShown === 0 ? '' : 'none';
    }

    /* ====================================================================== */
    /*  Pagefind backend                                                      */
    /* ====================================================================== */
    var pf = null;
    var GROUP_LABELS = { papers: 'Papers', datasets: 'Datasets', tools: 'Tools',
      methods: 'Methods', news: 'News', events: 'Events', network: 'Network',
      'working-groups': 'Working Groups', page: 'Pages' };
    function withBase(u) {
      if (!u) return u;
      if (u.charAt(0) !== '/') u = '/' + u;
      if (BASE && u.indexOf(BASE + '/') === 0) return u;
      return BASE + u;
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function pfSetup() {
      return import(cfg.pagefindJs).then(function (mod) {
        pf = mod;
        return pf.options({ baseUrl: (cfg.base || '/') });
      }).then(function () {
        return pf.filters();
      }).then(function (f) {
        Object.keys(f || {}).forEach(function (facet) {
          available[facet] = Object.keys(f[facet]);
        });
      }).catch(function () {
        if (statusEl) statusEl.textContent = 'Search unavailable — run pagefind after build.';
      });
    }
    function pfFilters() {
      var out = {};
      selected.forEach(function (s) {
        (out[s.facet] = out[s.facet] || []).push(s.value);
      });
      return out;
    }
    function renderResult(d) {
      var m = d.meta || {};
      var type = (m.type || 'page').toLowerCase();
      var badge = m.badge || cap(type);
      var thumb = m.image
        ? '<span class="search-result__media"><img src="' + esc(m.image) + '" alt="" loading="lazy">' +
          '<span class="badge badge--solid badge--accent search-result__badge">' + esc(badge) + '</span></span>'
        : '<span class="search-result__kind">' + esc(badge) + '</span>';
      return '<li class="search-result search-result--' + esc(type) + (m.image ? ' search-result--media' : '') + '">' +
        (m.image ? thumb : '') +
        '<span class="search-result__main">' + (m.image ? '' : thumb) +
        '<a class="search-result__title" href="' + esc(withBase(d.url)) + '">' + esc(m.title) + '</a>' +
        '<p class="search-result__excerpt">' + d.excerpt + '</p></span></li>';
    }
    function pfApply() {
      if (!pf) { if (statusEl) statusEl.textContent = 'Loading…'; return; }
      var q = (textEl.value || '').trim();
      var filters = pfFilters();
      if (!q && !Object.keys(filters).length) {
        resultsEl.innerHTML = ''; if (statusEl) statusEl.textContent = ''; countEl.textContent = '';
        return;
      }
      if (statusEl) statusEl.textContent = 'Searching…';
      pf.search(q || null, { filters: filters }).then(function (res) {
        var items = res ? res.results : [];
        if (statusEl) statusEl.textContent = items.length + ' result' + (items.length === 1 ? '' : 's');
        countEl.textContent = '';
        return Promise.all(items.slice(0, 30).map(function (r) { return r.data(); }));
      }).then(function (loaded) {
        if (!loaded) return;
        var byType = {}, ord = [];
        loaded.forEach(function (d) {
          var t = ((d.meta || {}).type || 'page').toLowerCase();
          if (!byType[t]) { byType[t] = []; ord.push(t); }
          byType[t].push(d);
        });
        resultsEl.innerHTML = ord.map(function (t) {
          return '<li class="search-group"><div class="search-group__head">' +
            esc(GROUP_LABELS[t] || cap(t)) +
            '<span class="search-group__count">' + byType[t].length + '</span></div>' +
            '<ul class="search-group__list">' + byType[t].map(renderResult).join('') + '</ul></li>';
        }).join('');
      }).catch(function () {
        if (statusEl) statusEl.textContent = 'Search unavailable — run pagefind after build.';
      });
    }

    /* ---- unified apply ---------------------------------------------------- */
    function apply() { updateClear(); mode === 'pagefind' ? pfApply() : domApply(); }

    function changed() { renderChips(); renderPanel(); renderQuick(); syncUrl(); apply(); }

    /* ---- events ----------------------------------------------------------- */
    addBtn.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      addBtn.setAttribute('aria-expanded', String(open));
      if (open) { renderPanel(); panelQ.value = ''; panelQ.focus(); }
    });
    panelQ.addEventListener('input', renderPanel);
    panelQ.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { panel.hidden = true; addBtn.setAttribute('aria-expanded', 'false'); addBtn.focus(); }
      if (e.key === 'Enter') {
        var first = panelBody.querySelector('[data-facet]');
        if (first) { first.click(); e.preventDefault(); }
      }
    });
    // add a pill (panel stays open for multi-select)
    panelBody.addEventListener('click', function (e) {
      var b = e.target.closest('[data-facet]');
      if (!b) return;
      addSel(b.getAttribute('data-facet'), b.getAttribute('data-value'));
      changed();
      panelQ.focus();
    });
    // remove a chip
    chipsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-facet]');
      if (!b) return;
      removeSel(b.getAttribute('data-facet'), b.getAttribute('data-value'));
      changed();
    });
    // quick pill toggles its own tag
    quickPills.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-facet'), v = b.getAttribute('data-value');
        if (isSelected(f, v)) removeSel(f, v); else addSel(f, v);
        changed();
      });
    });
    clearEl.addEventListener('click', function () { selected = []; textEl.value = ''; changed(); });
    // close panel on outside click
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.tag-filter__add')) {
        panel.hidden = true; addBtn.setAttribute('aria-expanded', 'false');
      }
    });
    textEl.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { syncUrl(); apply(); }, 200);
    });

    /* ---- pre-select from URL (?q= and ?facet=v1,v2) ----------------------- */
    function readUrl() {
      var params = new URLSearchParams(location.search);
      var q = params.get('q');
      if (q) textEl.value = q;
      order.forEach(function (facet) {
        var raw = params.get(facet);
        if (!raw) return;
        raw.split(',').forEach(function (v) {
          v = v.trim();
          if (v) addSel(facet, v);
        });
      });
    }

    /* ---- boot ------------------------------------------------------------- */
    if (mode === 'pagefind') {
      pfSetup().then(function () {
        ensureColors(); readUrl(); renderChips(); renderPanel(); renderQuick(); apply();
      });
    } else {
      domSetup(); ensureColors(); readUrl(); renderChips(); renderPanel(); renderQuick(); apply();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
