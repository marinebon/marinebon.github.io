/* ============================================================================
   MBON network globe — vanilla JS port for the Hugo site.
   Reads node data from <script id="mbon-regions" type="application/json">,
   renders a rotating Earth (real continents via d3-geo + world-atlas) with
   observation nodes and faint project footprints. Pairs with .node-chip
   buttons and a [data-node-card] detail panel.
   ========================================================================== */
(function () {
  function loadDeps() {
    if (window.__mbonGlobeDeps) return window.__mbonGlobeDeps;
    var loadScript = function (src) {
      return new Promise(function (res, rej) {
        var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    };
    window.__mbonGlobeDeps = (async function () {
      if (!window.d3 || !window.d3.geoOrthographic) await loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js');
      if (!window.topojson) await loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js');
      var world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json').then(function (r) { return r.json(); });
      return { d3: window.d3, land: window.topojson.feature(world, world.objects.land) };
    })();
    return window.__mbonGlobeDeps;
  }

  function initGlobe(root) {
    var dataEl = document.getElementById('mbon-regions');
    if (!dataEl) return;
    var regions = JSON.parse(dataEl.textContent);
    if (typeof regions === 'string') regions = JSON.parse(regions);
    var canvas = root.querySelector('canvas');
    var loading = root.querySelector('.globe-loading');
    var ctx = canvas.getContext('2d');
    var st = { rot: -90, target: null, hot: null, dpr: 1, w: 0, h: 0, active: regions[0] && regions[0].id };
    var tilt = 16;

    function setActive(id, spin) {
      st.active = id;
      var reg = regions.find(function (r) { return r.id === id; });
      if (spin && reg) st.target = reg.lng;
      // chips
      document.querySelectorAll('.node-chip[data-node-id]').forEach(function (c) {
        c.classList.toggle('is-active', c.getAttribute('data-node-id') === id);
      });
      // detail panel
      if (reg) {
        var card = document.querySelector('[data-node-card]');
        if (card) {
          var f = function (name) { return card.querySelector('[data-node-field="' + name + '"]'); };
          if (f('name')) f('name').textContent = reg.name;
          if (f('blurb')) f('blurb').textContent = reg.blurb || '';
          if (f('coord')) f('coord').textContent =
            Math.abs(reg.lat).toFixed(1) + '\u00b0 ' + (reg.lat >= 0 ? 'N' : 'S') + ' \u00b7 ' +
            Math.abs(reg.lng).toFixed(1) + '\u00b0 ' + (reg.lng >= 0 ? 'E' : 'W');
          var link = card.querySelector('[data-node-link]');
          if (link && reg.url) link.setAttribute('href', reg.url);
        }
      }
    }

    document.querySelectorAll('.node-chip[data-node-id]').forEach(function (c) {
      c.addEventListener('click', function () { setActive(c.getAttribute('data-node-id'), true); });
    });

    loadDeps().then(function (deps) {
      var d3 = deps.d3, land = deps.land, graticule = d3.geoGraticule10();
      if (loading) loading.style.display = 'none';

      function resize() {
        var r = root.getBoundingClientRect();
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        st.dpr = dpr; st.w = r.width; st.h = r.height;
        canvas.width = r.width * dpr; canvas.height = r.height * dpr;
        canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      }
      resize();
      new ResizeObserver(resize).observe(root);
      setActive(st.active, false);

      function draw() {
        var dpr = st.dpr, W = st.w, H = st.h;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var cx = W / 2, cy = H / 2;
        var R = Math.min(W, H) / 2 - Math.min(W, H) * 0.07;

        if (st.target != null) {
          var dlt = st.target - st.rot;
          while (dlt > 180) dlt -= 360; while (dlt < -180) dlt += 360;
          if (Math.abs(dlt) < 0.3) { st.rot = st.target; st.target = null; } else st.rot += dlt * 0.08;
        } else if (!drag.on) st.rot += 0.085;
        if (st.rot > 180) st.rot -= 360; if (st.rot < -180) st.rot += 360;

        var proj = d3.geoOrthographic().translate([cx, cy]).scale(R).clipAngle(90).rotate([-st.rot, -tilt]);
        var path = d3.geoPath(proj, ctx);
        var center = [st.rot, tilt];

        var glow = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.3);
        glow.addColorStop(0, 'rgba(56,167,187,0)'); glow.addColorStop(0.62, 'rgba(56,167,187,0.16)'); glow.addColorStop(1, 'rgba(56,167,187,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, 7); ctx.fill();

        var sphere = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
        sphere.addColorStop(0, '#0a4f7a'); sphere.addColorStop(0.55, '#01375f'); sphere.addColorStop(1, '#04182a');
        ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = sphere; ctx.fill();

        ctx.beginPath(); path(graticule); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(116,200,214,0.13)'; ctx.stroke();

        ctx.beginPath(); path(land); ctx.fillStyle = '#0e5c84'; ctx.fill();
        ctx.lineWidth = 0.7; ctx.strokeStyle = 'rgba(174,226,234,0.30)'; ctx.stroke();

        regions.forEach(function (reg) {
          var isA = reg.id === st.active;
          var isHot = reg.id === st.hot;
          var cen = (reg.fcenter && reg.fcenter.length === 2) ? reg.fcenter : [reg.lng, reg.lat];
          var circle = d3.geoCircle().center(cen).radius(reg.footprint || 7)();
          ctx.beginPath(); path(circle);
          ctx.fillStyle = isA ? 'rgba(242,104,63,0.20)' : isHot ? 'rgba(255,220,50,0.18)' : 'rgba(56,167,187,0.12)'; ctx.fill();
          ctx.lineWidth = (isA || isHot) ? 1.4 : 1;
          ctx.strokeStyle = isA ? 'rgba(242,104,63,0.65)' : isHot ? 'rgba(255,220,50,0.75)' : 'rgba(116,200,214,0.32)'; ctx.stroke();
        });

        ctx.beginPath(); path({ type: 'Sphere' }); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(174,226,234,0.5)'; ctx.stroke();

        var t = performance.now() / 1000;
        regions.forEach(function (reg) {
          var dist = d3.geoDistance([reg.lng, reg.lat], center);
          reg._sx = reg._sy = null;
          if (dist >= Math.PI / 2) return;
          var p = proj([reg.lng, reg.lat]); if (!p) return;
          var isA = reg.id === st.active, isHot = reg.id === st.hot;
          var a = 0.35 + 0.65 * Math.cos(dist);
          var color = isA ? '242,104,63' : isHot ? '255,220,50' : '255,255,255';
          var rad = (isA || isHot) ? 5 : 3.2;
          if (isA) {
            var pulse = (Math.sin(t * 3) + 1) / 2;
            ctx.beginPath(); ctx.arc(p[0], p[1], rad + 4 + pulse * 7, 0, 7);
            ctx.fillStyle = 'rgba(242,104,63,' + (0.22 * (1 - pulse)) + ')'; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(p[0], p[1], rad + 2.5, 0, 7); ctx.fillStyle = 'rgba(' + color + ',' + (0.2 * a) + ')'; ctx.fill();
          ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, 7); ctx.fillStyle = 'rgba(' + color + ',' + a + ')'; ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(4,19,31,' + (0.45 * a) + ')'; ctx.stroke();
          reg._sx = p[0]; reg._sy = p[1];
        });

        ctx.font = '600 12px "IBM Plex Mono", monospace';
        var hot = regions.find(function (r) { return r.id === st.hot && r.id !== st.active; });
        if (hot && hot._sx != null) {
          var hlabel = hot.name.toUpperCase();
          var htw = ctx.measureText(hlabel).width;
          var hlx = hot._sx + 12, hly = hot._sy - 12;
          ctx.beginPath(); ctx.moveTo(hot._sx, hot._sy); ctx.lineTo(hlx, hly - 4);
          ctx.strokeStyle = 'rgba(255,220,50,0.6)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = 'rgba(4,19,31,0.82)'; ctx.beginPath(); ctx.roundRect(hlx - 4, hly - 15, htw + 12, 22, 5); ctx.fill();
          ctx.fillStyle = '#ffdc32'; ctx.fillText(hlabel, hlx + 4, hly);
        }
        var act = regions.find(function (r) { return r.id === st.active; });
        if (act && act._sx != null) {
          var label = act.name.toUpperCase();
          var tw = ctx.measureText(label).width;
          var lx = act._sx + 12, ly = act._sy - 12;
          ctx.beginPath(); ctx.moveTo(act._sx, act._sy); ctx.lineTo(lx, ly - 4);
          ctx.strokeStyle = 'rgba(242,104,63,0.6)'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = 'rgba(4,19,31,0.82)'; ctx.beginPath(); ctx.roundRect(lx - 4, ly - 15, tw + 12, 22, 5); ctx.fill();
          ctx.fillStyle = '#eaf3f7'; ctx.fillText(label, lx + 4, ly);
        }
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);

      function hit(ev) {
        var r = canvas.getBoundingClientRect();
        // a fingertip is coarser than a mouse pointer, so widen the tap target
        var tol = ev.pointerType && ev.pointerType !== 'mouse' ? 26 : 16;
        var mx = ev.clientX - r.left, my = ev.clientY - r.top, found = null, best = tol;
        regions.forEach(function (reg) {
          if (reg._sx == null) return;
          var dd = Math.hypot(reg._sx - mx, reg._sy - my);
          if (dd < best) { best = dd; found = reg; }
        });
        return found;
      }

      var drag = { on: false, id: null, x0: 0, rot0: 0, moved: false, touch: false };

      /* pointer events cover mouse, touch and pen with one code path; the
         canvas is touch-action:pan-y so horizontal drags come to us while
         vertical swipes still scroll the page (browser fires pointercancel). */
      function endDrag() {
        if (drag.touch) st.hot = null;
        drag.on = false; drag.id = null; drag.touch = false;
        canvas.style.cursor = 'grab';
      }

      canvas.addEventListener('pointerdown', function (ev) {
        if (drag.on) return;                       // ignore extra fingers (e.g. pinch)
        drag.on = true; drag.id = ev.pointerId; drag.x0 = ev.clientX; drag.rot0 = st.rot;
        drag.moved = false; drag.touch = ev.pointerType !== 'mouse';
        st.target = null;
        // capture keeps the drag alive when the finger/cursor leaves the canvas
        try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
        canvas.style.cursor = 'grabbing';
      });
      canvas.addEventListener('pointermove', function (ev) {
        if (drag.on) {
          if (ev.pointerId !== drag.id) return;
          var dx = ev.clientX - drag.x0;
          if (Math.abs(dx) > (drag.touch ? 8 : 3)) drag.moved = true;
          var R = Math.min(st.w, st.h) / 2 - Math.min(st.w, st.h) * 0.07;
          st.rot = drag.rot0 - dx * 90 / R;
          st.hot = null;
          canvas.style.cursor = 'grabbing';
        } else if (ev.pointerType === 'mouse') {
          var f = hit(ev); st.hot = f ? f.id : null; canvas.style.cursor = f ? 'pointer' : 'grab';
        }
      });
      canvas.addEventListener('pointerup', function (ev) {
        if (!drag.on || ev.pointerId !== drag.id) return;
        if (!drag.moved) { var f = hit(ev); if (f) setActive(f.id, true); }
        endDrag();
      });
      // vertical page scroll or a system gesture steals the pointer
      canvas.addEventListener('pointercancel', function (ev) {
        if (drag.on && ev.pointerId === drag.id) endDrag();
      });
      canvas.addEventListener('pointerleave', function (ev) {
        if (ev.pointerType === 'mouse' && !drag.on) { st.hot = null; }
      });
    }).catch(function () { /* offline: leave loading text */ });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-mbon-globe]').forEach(initGlobe);
  });
})();
