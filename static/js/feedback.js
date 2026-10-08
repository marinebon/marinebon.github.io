/* static/js/feedback.js: the site-wide feedback dialog for marinebon.org (ported from calcofi.io's
   assets/feedback.js, which ported the CalCOFI Explorer's dialog). A "Send feedback" button/link in the
   footer opens one dialog: the current view is captured (html-to-image, vendored in static/js/lib/, loaded
   on first use, no CDN), shown as a thumbnail with edit (the annotator: arrow, circle, rectangle, pen,
   text, three colours, undo, clear) and retake, and posted with the note, this page's URL, the viewport and
   the theme to the shared Ocean Metrics Apps Script endpoint (hugo.yaml params.feedback_url). The script
   files a public issue in the repo it maps the payload's `app` ("marinebon-org") to, which is
   marinebon/marinebon.github.io; its runbook is docs/feedback.md in oceanmetrics/erddap-places. With no
   endpoint configured, "Open as GitHub issue myself" (a prefilled issue, the screenshot copied to the
   clipboard) is the only path. Test an endpoint without redeploying:
   localStorage['marinebon-org.feedback_url'] = 'https://script.google.com/macros/s/.../exec'.
   Styled by static/css/feedback.css from the site's own tokens. No framework. */
(function () {
  'use strict';

  var PATHS = {   // Material Design Icons (Pictogrammers, Apache-2.0), the same glyphs the Explorer's annotator wears
    feedback: 'M20,2A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H6L2,22V4C2,2.89 2.9,2 4,2H20M4,4V17.17L5.17,16H20V4H4M6,7H18V9H6V7M6,11H15V13H6V11Z',
    arrow: 'M5,17.59L15.59,7H9V5H19V15H17V8.41L6.41,19L5,17.59Z',
    circle: 'M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
    rect: 'M4,6V19H20V6H4M18,17H6V8H18V17Z',
    pen: 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z',
    text: 'M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z',
    undo: 'M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z',
    clear: 'M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z',
    send: 'M2,21L23,12L2,3V10L17,12L2,14V21Z',
    capture: 'M19,3H15V5H19V9H21V5C21,3.89 20.1,3 19,3M19,19H15V21H19A2,2 0 0,0 21,19V15H19M5,15H3V19A2,2 0 0,0 5,21H9V19H5M3,5V9H5V5H9V3H5A2,2 0 0,0 3,5Z',
    github: 'M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z',
    check: 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z',
    close: 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z'
  };
  function icon(name) { return '<svg class="fb-i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + PATHS[name] + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // the vendored library sits in lib/ beside this script, wherever the site is served from (root or a subpath)
  var base = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/feedback\.js.*$/, '') : '/js/'; })();
  var cfg = { endpoint: '', repo: 'marinebon/marinebon.github.io', release: '', app: 'marinebon-org', label: 'feedback' };
  var VENDOR = base + 'lib/html-to-image-1.11.13.min.js';
  // the same Google Fonts stylesheet static/css/tokens/fonts.css imports; its woff2 are inlined for the capture
  var FONTS = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

  /* ── capture ────────────────────────────────────────────────────────────────────────────── */
  var libP = null, fontP = null;
  function lib() {
    if (window.htmlToImage) return Promise.resolve(window.htmlToImage);
    if (!libP) libP = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = VENDOR; s.onload = function () { ok(window.htmlToImage); }; s.onerror = function () { no(new Error('could not load the capture library')); }; document.head.appendChild(s); });
    return libP;
  }
  // the page's fonts, with the woff2 inlined, so the clone is set in the site's type rather than the system stack
  function fontCss() {
    if (!fontP) fontP = fetch(FONTS).then(function (r) { return r.text(); }).then(function (css) {
      var urls = []; css.replace(/url\("?([^")]+\.woff2)"?\)/g, function (m, u) { if (urls.indexOf(u) < 0) urls.push(u); return m; });
      return Promise.all(urls.map(function (u) {
        return fetch(new URL(u, FONTS).href).then(function (r) { return r.blob(); }).then(function (b) {
          return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok([u, String(fr.result)]); }; fr.readAsDataURL(b); });
        });
      })).then(function (pairs) { return pairs.reduce(function (s, p) { return s.split('url("' + p[0] + '")').join('url("' + p[1] + '")').split('url(' + p[0] + ')').join('url("' + p[1] + '")'); }, css); });
    }).catch(function () { return ''; });
    return fontP;
  }
  // html-to-image serializes the DOM into an SVG image and copies computed styles onto the clone — but not,
  // in practice, an SVG element's class-driven paint (the section's tokens came through as black fills). So
  // for the instant of the capture every element inside a drawing gets its computed paint as inline style,
  // removed again afterwards (a hover rule is beaten for that instant and no longer)
  var PAINT = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linejoin', 'stroke-linecap', 'opacity', 'paint-order',
               'font-size', 'font-family', 'font-weight', 'letter-spacing', 'text-transform', 'text-anchor', 'display', 'transform'];
  function stampSvg() {
    var els = Array.prototype.slice.call(document.querySelectorAll('svg:not(.fb-i) *')).filter(function (e) { return !e.closest('.fb') && e.id !== 'fb-sprite' && !e.closest('#fb-sprite'); });
    var undo = els.map(function (e) {
      var was = e.getAttribute('style'), cs = getComputedStyle(e);
      PAINT.forEach(function (p) { var v = cs.getPropertyValue(p); if (v && v !== 'none' || p === 'fill' || p === 'stroke' || p === 'display') e.style.setProperty(p, v); });
      return function () { if (was === null) e.removeAttribute('style'); else e.setAttribute('style', was); };
    });
    return function () { undo.forEach(function (f) { f(); }); };
  }
  // the viewport slice of the page at the device ratio (capped at 2), the dialog itself left out
  function capture() {
    var unstamp = null;
    return Promise.all([lib(), fontCss()]).then(function (r) {
      var h2i = r[0], css = r[1];
      unstamp = stampSvg();
      var scale = Math.min(2, window.devicePixelRatio || 1);
      var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim() || '#ffffff';
      var sx = window.scrollX || 0, sy = window.scrollY || 0;
      return h2i.toCanvas(document.body, {
        width: window.innerWidth, height: window.innerHeight, pixelRatio: scale, backgroundColor: bg, cacheBust: false,
        skipFonts: true, fontEmbedCSS: css || undefined,
        filter: function (n) { return !(n.classList && (n.classList.contains('fb') || n.classList.contains('fb-backdrop'))); },
        style: { transform: 'translate(' + (-sx) + 'px,' + (-sy) + 'px)', transformOrigin: '0 0', width: window.innerWidth + 'px' }
      });
    }).then(function (c) { if (unstamp) unstamp(); return c; }, function (e) { if (unstamp) unstamp(); throw e; });
  }
  function blobOf(c, type, q) { return new Promise(function (ok) { c.toBlob(function (b) { ok(b); }, type || 'image/png', q); }); }
  // downscale until the PNG is under ~3 MB (the upload's size); the same canvas when it already fits
  function fitBytes(c, max) {
    var cur = c, i = 0;
    function step() { return blobOf(cur).then(function (b) { if (b.size <= max || i++ >= 4) return { canvas: cur, blob: b }; var n = document.createElement('canvas'); n.width = Math.round(cur.width * 0.75); n.height = Math.round(cur.height * 0.75); n.getContext('2d').drawImage(cur, 0, 0, n.width, n.height); cur = n; return step(); }); }
    return step();
  }

  /* ── the annotator (a port of the Explorer's annotate.tsx) ──────────────────────────────── */
  var TOOLS = [['arrow', 'arrow'], ['rect', 'rectangle'], ['text', 'text']];
  var COLORS = [['#ffd60a', 'yellow'], ['#4dabf7', 'blue'], ['#ff2d95', 'hot pink']];   // read on light and dark screenshots alike
  function drawShape(ctx, s, k) {
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = 3 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 2 * k;
    var x0 = s.x0, y0 = s.y0, x1 = s.x1, y1 = s.y1;
    if (s.tool === 'pen' && s.path) { ctx.beginPath(); s.path.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); }
    else if (s.tool === 'rect') ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    else if (s.tool === 'circle') { ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.max(2, Math.abs(x1 - x0) / 2), Math.max(2, Math.abs(y1 - y0) / 2), 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (s.tool === 'arrow') {
      var a = Math.atan2(y1 - y0, x1 - x0), h = 14 * k;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - h * Math.cos(a - 0.45), y1 - h * Math.sin(a - 0.45)); ctx.lineTo(x1 - h * Math.cos(a + 0.45), y1 - h * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    } else if (s.tool === 'text' && s.text) {
      ctx.font = '600 ' + (16 * k) + 'px "IBM Plex Sans", system-ui, sans-serif'; ctx.textBaseline = 'top';
      var w = ctx.measureText(s.text).width + 10 * k;
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x0 - 5 * k, y0 - 3 * k, w, 22 * k);
      ctx.fillStyle = s.color; ctx.fillText(s.text, x0, y0);
    }
    ctx.shadowBlur = 0;
  }
  function annotator(image, onDone, onCancel) {
    var W = image.width, H = image.height, k = Math.max(1, W / 1400);
    var tool = 'arrow', color = COLORS[0][0], shapes = [], live = null, textAt = null;
    var root = document.createElement('div'); root.className = 'fb-annot';
    root.innerHTML = '<div class="fb-tools">' +
      '<span class="fb-seg" role="group" aria-label="tool">' + TOOLS.map(function (t) { return '<button type="button" data-tool="' + t[0] + '" title="' + t[1] + '" aria-label="' + t[1] + '" aria-pressed="' + (t[0] === tool) + '"' + (t[0] === tool ? ' class="on"' : '') + '>' + icon(t[0]) + '</button>'; }).join('') + '</span>' +
      '<span class="fb-seg" role="group" aria-label="colour">' + COLORS.map(function (c, i) { return '<button type="button" data-color="' + c[0] + '" title="' + c[1] + '" aria-label="' + c[1] + '" aria-pressed="' + (i === 0) + '"' + (i === 0 ? ' class="on"' : '') + '><i class="fb-dot" style="background:' + c[0] + '"></i></button>'; }).join('') + '</span>' +
      '<span class="fb-seg"><button type="button" data-act="undo" disabled title="undo">' + icon('undo') + ' undo</button><button type="button" data-act="clear" disabled title="clear">' + icon('clear') + ' clear</button></span>' +
      '<span class="fb-spacer"></span><button type="button" class="fb-btn-ghost fb-btn" data-act="cancel">Cancel</button><button type="button" class="fb-btn-primary fb-btn" data-act="done">' + icon('check') + ' Done</button></div>' +
      '<div class="fb-stage"><canvas width="' + W + '" height="' + H + '" style="cursor:crosshair;touch-action:none"></canvas></div>' +
      '<p class="fb-hint">draw on the picture: an arrow to the thing that looks wrong, a rectangle around it, a word or two · <span class="fb-n">0 marks</span></p>';
    var cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), stage = root.querySelector('.fb-stage'), n = root.querySelector('.fb-n');
    var input = null;
    function paint(extra) { ctx.clearRect(0, 0, W, H); ctx.drawImage(image, 0, 0); shapes.forEach(function (s) { drawShape(ctx, s, k); }); if (extra) drawShape(ctx, extra, k); n.textContent = shapes.length + ' mark' + (shapes.length === 1 ? '' : 's'); root.querySelector('[data-act=undo]').disabled = root.querySelector('[data-act=clear]').disabled = !shapes.length; }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
    function commitText() { if (input) { var t = input.value.trim(); if (textAt && t) shapes.push({ tool: 'text', color: color, x0: textAt.x, y0: textAt.y, x1: textAt.x, y1: textAt.y, text: t }); input.remove(); input = null; } textAt = null; paint(null); }
    cv.addEventListener('pointerdown', function (e) {
      var p = pos(e);
      if (tool === 'text') {
        e.preventDefault(); commitText(); textAt = p;
        input = document.createElement('input'); input.className = 'fb-text'; input.placeholder = 'type, then Enter';
        input.style.left = (p.x / W * 100) + '%'; input.style.top = (p.y / H * 100) + '%'; input.style.color = color; input.style.borderColor = color;
        input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') commitText(); if (ev.key === 'Escape') { input.value = ''; commitText(); } ev.stopPropagation(); });
        input.addEventListener('blur', commitText);
        stage.appendChild(input); input.focus(); return;
      }
      cv.setPointerCapture(e.pointerId);
      live = { tool: tool, color: color, x0: p.x, y0: p.y, x1: p.x, y1: p.y, path: tool === 'pen' ? [[p.x, p.y]] : null };
    });
    cv.addEventListener('pointermove', function (e) { if (!live) return; var p = pos(e); live.x1 = p.x; live.y1 = p.y; if (live.path) live.path.push([p.x, p.y]); paint(live); });
    function up() { if (!live) return; if (Math.abs(live.x1 - live.x0) + Math.abs(live.y1 - live.y0) > 3 || live.path) shapes.push(live); live = null; paint(null); }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.tool) { tool = b.dataset.tool; cv.style.cursor = tool === 'text' ? 'text' : 'crosshair'; root.querySelectorAll('[data-tool]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); }
      else if (b.dataset.color) { color = b.dataset.color; root.querySelectorAll('[data-color]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); }
      else if (b.dataset.act === 'undo') { shapes.pop(); paint(null); }
      else if (b.dataset.act === 'clear') { shapes = []; paint(null); }
      else if (b.dataset.act === 'cancel') onCancel();
      else if (b.dataset.act === 'done') { var pending = null; if (input && textAt && input.value.trim()) pending = { tool: 'text', color: color, x0: textAt.x, y0: textAt.y, x1: textAt.x, y1: textAt.y, text: input.value.trim() }; var out = document.createElement('canvas'); out.width = W; out.height = H; var oc = out.getContext('2d'); oc.drawImage(image, 0, 0); shapes.forEach(function (s) { drawShape(oc, s, k); }); if (pending) drawShape(oc, pending, k); onDone(out); }
    });
    paint(null);
    return root;
  }

  /* ── the dialog ─────────────────────────────────────────────────────────────────────────── */
  var dlg = null;
  function open() {
    if (dlg) { dlg.close(); dlg.remove(); }
    var shot = null, include = true, sending = false;
    var url = location.href, viewport = window.innerWidth + '×' + window.innerHeight, theme = document.documentElement.dataset.theme || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    dlg = document.createElement('dialog'); dlg.className = 'fb'; dlg.setAttribute('aria-labelledby', 'fb-title');
    dlg.innerHTML = '<form method="dialog" class="fb-form">' +
      '<div class="fb-head">' + icon('feedback') + '<h2 id="fb-title">Feedback</h2><button type="button" class="fb-close" aria-label="Close">' + icon('close') + '</button></div>' +
      '<div class="fb-body">' +
      '<label class="fb-f">What happened / what did you expect?<textarea rows="4" placeholder="the link on this page is broken … / this dataset looks out of date … / the globe is empty on my phone …" autofocus></textarea></label>' +
      '<label class="fb-f">Email <span class="fb-hint">optional, so we can reply; not published</span><input type="email" placeholder="you@example.org" autocomplete="email"></label>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" class="fb-hp" aria-hidden="true">' +
      '<div class="fb-shot"><div class="fb-thumb"><span class="fb-hint">capturing the view…</span></div>' +
      '<div class="fb-row"><label class="fb-row"><input type="checkbox" checked class="fb-include"> include screenshot</label>' +
      '<button type="button" class="fb-pill" data-act="edit" disabled>' + icon('pen') + ' edit</button><button type="button" class="fb-pill" data-act="retake" disabled>' + icon('capture') + ' retake</button></div></div>' +
      '<p class="fb-hint fb-sent">What is sent: your text, this page\'s URL, the viewport (' + viewport + '), the theme (' + theme + '), your browser\'s user-agent string and the screenshot, nothing else. ' +
      'It goes to the MBON team by mail and is filed as a public issue in <code>' + esc(cfg.repo) + '</code> labelled <code>' + cfg.label + '</code>. Your email, if you give one, is never part of the public issue.</p>' +
      (cfg.endpoint ? '' : '<p class="fb-hint fb-warn">The feedback endpoint is not set up yet. Use <i>Open as GitHub issue myself</i> (it copies the screenshot for you to paste).</p>') +
      '<p class="fb-hint fb-err" hidden></p></div>' +
      '<div class="fb-actions"><a class="fb-btn-ghost fb-btn fb-issue" target="_blank" rel="noopener" title="for developers: a prefilled public issue; the screenshot is copied to your clipboard to paste">' + icon('github') + ' Open as GitHub issue myself</a>' +
      '<button type="button" class="fb-btn-primary fb-btn fb-send" disabled>' + icon('send') + ' Send</button></div></form>';
    document.body.appendChild(dlg);
    var ta = dlg.querySelector('textarea'), em = dlg.querySelector('input[type=email]'), thumb = dlg.querySelector('.fb-thumb'), inc = dlg.querySelector('.fb-include');
    var bEdit = dlg.querySelector('[data-act=edit]'), bRetake = dlg.querySelector('[data-act=retake]'), bSend = dlg.querySelector('.fb-send'), aIssue = dlg.querySelector('.fb-issue'), err = dlg.querySelector('.fb-err');
    var body = dlg.querySelector('.fb-body'), form = dlg.querySelector('.fb-form');
    function issueUrl() {
      var text = ta.value.trim();
      var b = '**Page:** ' + url + '\n**Viewport / theme:** ' + viewport + ' · ' + theme + '\n\n' + (text || '_What happened / what did you expect?_') + '\n\n';
      return 'https://github.com/' + cfg.repo + '/issues/new?labels=' + cfg.label + '&body=' + encodeURIComponent(b);
    }
    function state() { bSend.disabled = !cfg.endpoint || !ta.value.trim() || sending || !shot && include && thumb.querySelector('.fb-hint'); aIssue.href = issueUrl(); }
    function showThumb() { thumb.innerHTML = ''; if (shot) { var img = document.createElement('img'); img.src = shot.toDataURL('image/jpeg', 0.7); img.alt = 'the captured view'; img.className = include ? '' : 'off'; thumb.appendChild(img); } else thumb.innerHTML = '<span class="fb-hint">no screenshot</span>'; bEdit.disabled = bRetake.disabled = !shot; state(); }
    function take() { thumb.innerHTML = '<span class="fb-hint">capturing the view…</span>'; bEdit.disabled = bRetake.disabled = true; shot = null; state();
      return capture().then(function (c) { shot = c; }).catch(function (e) { err.hidden = false; err.textContent = 'capture failed: ' + e.message; }).then(showThumb); }
    ta.addEventListener('input', state);
    inc.addEventListener('change', function () { include = inc.checked; showThumb(); });
    bRetake.addEventListener('click', function () { take(); });
    bEdit.addEventListener('click', function () {
      if (!shot) return;
      var an = annotator(shot, function (out) { shot = out; an.replaceWith(form); showThumb(); }, function () { an.replaceWith(form); });
      form.replaceWith(an);
    });
    aIssue.addEventListener('click', function () { if (shot && navigator.clipboard && window.ClipboardItem) blobOf(shot).then(function (b) { return navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); }).catch(function () {}); });
    dlg.querySelector('.fb-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { dlg.remove(); dlg = null; });
    bSend.addEventListener('click', function () {
      if (!cfg.endpoint || !ta.value.trim() || sending) return;
      sending = true; state(); bSend.innerHTML = icon('send') + ' Sending…'; err.hidden = true;
      var p = Promise.resolve(undefined);
      if (include && shot) p = fitBytes(shot, 3e6).then(function (r) { return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok(String(fr.result)); }; fr.readAsDataURL(r.blob); }); });
      p.then(function (image) {
        var payload = { app: cfg.app, kind: 'feedback', label: cfg.label, title: '', link: '', datasets: '', url: url, viewport: viewport, theme: theme,
                        text: ta.value.trim(), email: em.value.trim(), image: image, website: dlg.querySelector('.fb-hp').value, user_agent: navigator.userAgent };
        return fetch(cfg.endpoint, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, redirect: 'follow' });
      }).then(function (res) { return res.json().catch(function () { return null; }); }).then(function (j) {
        if (j && j.ok === false) throw new Error(j.error || 'the endpoint refused it');
        if (window.gtag && !navigator.webdriver) try { window.gtag('event', 'feedback', { app: cfg.app, image: !!(include && shot) }); } catch (e) {}
        body.innerHTML = '<p>' + (j ? 'Received.' : 'Sent.') + ' The MBON team gets it by mail' + (j && j.issue_url ? ' and it is public issue <a href="' + esc(j.issue_url) + '" target="_blank" rel="noopener">' + esc(j.issue_url.replace(/^https?:\/\/github\.com\//, '')) + '</a>' : '') + (j && j.id ? ' <span class="fb-hint">· id ' + esc(j.id) + '</span>' : '') + '.</p><p class="fb-hint">Thank you.</p>';
        dlg.querySelector('.fb-actions').innerHTML = '<button type="button" class="fb-btn-primary fb-btn fb-ok">Close</button>';
        dlg.querySelector('.fb-ok').addEventListener('click', function () { dlg.close(); });
      }).catch(function (e) { err.hidden = false; err.textContent = 'Not sent: ' + e.message + '. Try again, or open the issue yourself.'; })
        .then(function () { sending = false; if (bSend.isConnected) { bSend.innerHTML = icon('send') + ' Send'; state(); } });
    });
    state();
    dlg.showModal();
    take();
  }
  /* ── mount: the footer's .mbon-feedback button carries data-endpoint / data-repo / data-app; any
     [data-feedback] link also opens the dialog. An empty data-endpoint (hugo.yaml params.feedback_url
     unset) leaves only the prefilled GitHub issue. localStorage['marinebon-org.feedback_url'] overrides
     the endpoint for testing. */
  function mount() {
    var btn = document.querySelector('.mbon-feedback');
    if (btn) {
      cfg.endpoint = (btn.getAttribute('data-endpoint') || '').trim();
      try { var o = (localStorage.getItem('marinebon-org.feedback_url') || '').trim(); if (o) cfg.endpoint = o; } catch (e) {}
      cfg.repo = btn.getAttribute('data-repo') || cfg.repo; cfg.app = btn.getAttribute('data-app') || cfg.app;
      if (!/^https?:\/\//.test(cfg.endpoint)) cfg.endpoint = '';
    }
    Array.prototype.forEach.call(document.querySelectorAll('.mbon-feedback, [data-feedback]'), function (a) { if (!a.dataset.fbBound) { a.dataset.fbBound = '1'; a.addEventListener('click', function (e) { e.preventDefault(); open(); }); } });
    return !!btn;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  window.mbonFeedback = { open: open, capture: capture, mount: mount };
})();
