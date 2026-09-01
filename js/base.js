// base.js - shared scaffold for modist interactive distribution widgets.
// This module has NO runtime imports: a per-family module (normal.js, beta.js,
// gamma.js) imports createWidget and their jStat family math, then esbuild
// bundles everything into a single self-contained ESM delivered via anywidget's
// `_esm` field (which is served as a Blob URL, so it must not contain imports).

const W = 660;
const H = 360;
const M_L = 8;
const M_R = 8;
const M_T = 46;
const M_B = 44;
const HIT_W = 24; // hit-zone width per handle (stacked handles are split into slices)
// vertical dial track band: begins below the top-right button row so the knob is
// always grabbable; drags and rendering share this mapping so the knob tracks
// the cursor exactly.
const DIAL_TOP = M_T + 40;
const DIAL_BOT = H - M_B - 6;
const DIAL_HIT_W = 36; // full-band slider thumb width on a y-only dial

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function elNS(tag, parent, attrs) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}

function ticks(d) {
  const span = d[1] - d[0];
  const raw = span / 10;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const sn = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  const step = sn * mag;
  const prec = Math.max(0, -Math.floor(Math.log10(step)));
  const out = [];
  for (let i = Math.ceil(d[0] / step - 1e-9) || 0; i * step <= d[1] + 1e-9 && out.length < 14; i++) {
    out.push(Math.round(i * step * 10 ** prec) / 10 ** prec);
  }
  return out;
}

function integrate(lo, hi, fn, N) {
  N = N || 400;
  const dx = (hi - lo) / N;
  const step = (i) => (i % 2 ? 4 : 2);
  let s = fn(lo) + fn(hi);
  for (let i = 1; i < N; i++) s += step(i) * fn(lo + i * dx);
  return (s * dx) / 3;
}

let uidCounter = 0;

export function fmt(x, dp) {
  dp = dp === undefined ? 3 : dp;
  if (!isFinite(x)) return "\u2013";
  // normalize signed/tiny zeros so we never render "-0" or "-1.00e-9" for what
  // is effectively the origin (e.g. a tick computed as -0 via Math.ceil(-1e-9))
  if (x === 0 || Math.abs(x) < 5e-14) return "0";
  const a = Math.abs(x);
  if (a >= 1e5) return x.toExponential(2);
  if (a < 1e-3) return x.toExponential(2);
  return (Math.round(x * 10 ** dp) / 10 ** dp).toLocaleString("en-US", {
    maximumFractionDigits: dp,
  });
}

export function createWidget(F, opts) {
  const {
    pins = "none", // "none" | "left" | "both"
    nMesh = 400,
    // how the view is adjusted after a drag ends:
    //   "fit"    grow to contain a straying curve AND shrink when the curve
    //            occupies less than SHRINK_FRAC of the view (default)
    //   "expand" only grow (previous behavior)
    //   "none"   never adjust after a drag
    fit = "fit",
  } = opts || {};
  // shrink only when the curve is clearly much smaller than the view, so gentle
  // reshapes never re-center; this is where the expand/shrink asymmetry lived
  const SHRINK_FRAC = 0.3;

  return {
    render({ model, el }) {
      const uid = `md-${++uidCounter}`;
      const gradId = `${uid}-fill`;

      const root = document.createElement("div");
      root.className = "mroot";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      // Responsive: fill the container width and derive height from the fixed
      // aspect ratio, so the widget nests naturally inside mo.hstack / mo.vstack
      // instead of being stretched or fixed-size. No width/height attrs here.
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.aspectRatio = `${W} / ${H}`;
      root.appendChild(svg);

      const defs = elNS("defs", svg);
      const grad = elNS("linearGradient", defs, {
        id: gradId, x1: "0", y1: "0", x2: "0", y2: "1",
      });
      elNS("stop", grad, { offset: "0%", "stop-color": "var(--m-acc)", "stop-opacity": "0.55" });
      elNS("stop", grad, { offset: "100%", "stop-color": "var(--m-acc)", "stop-opacity": "0.06" });

      const tip = document.createElement("div");
      tip.className = "mtip";
      root.appendChild(tip);
      el.appendChild(root);

      const traitNames = Object.keys(F.defaults);
      const getParams = () => {
        const p = {};
        for (const k of traitNames) p[k] = model.get(k);
        return p;
      };
      const setParams = (newVals, why) => {
        // Drag handlers return only the traits they change; untouched traits
        // must be preserved (setting a missing key to undefined breaks state).
        for (const k of traitNames) {
          if (k in newVals && newVals[k] !== model.get(k)) model.set(k, newVals[k]);
        }
        model.save_changes(why);
      };

      // ---- view domain lives in a closure (no x_min/x_max traits) ----
      let view = null; // [lo, hi]

      function support(p) {
        const s = F.support(p);
        return [s[0] === null ? -Infinity : s[0], s[1] === null ? Infinity : s[1]];
      }
      function clampDomain(lo, hi) {
        let a = Math.min(lo, hi);
        let b = Math.max(lo, hi);
        if (pins === "left" || pins === "both") a = Math.max(a, 0);
        if (pins === "both") b = Math.min(b, 1);
        if (b <= a) b = a + 1e-6;
        return [a, b];
      }
      function setDomain(lo, hi) {
        const c = clampDomain(lo, hi);
        view = c;
      }
      function ensureFit(p) {
        setDomain(F.bounds(p)[0], F.bounds(p)[1]);
      }
      // After a drag, grow the view to contain a curve that strayed off screen,
      // and (when fit === "fit") shrink it back when the curve got much smaller.
      // Pure: returns the target [lo, hi] to fit to, or null when no change is
      // needed (the caller animates the resulting transition).
      function fitTargetAfterDrag(p) {
        const cur = currentDomain();
        const b = F.bounds(p);
        if (b[0] < cur[0] || b[1] > cur[1]) {
          return [Math.min(cur[0], b[0]), Math.max(cur[1], b[1])]; // grow to contain
        }
        if (fit === "fit") {
          const curSpan = cur[1] - cur[0];
          const bSpan = b[1] - b[0];
          if (bSpan < curSpan * SHRINK_FRAC) return b.slice(); // shrink to bounds
        }
        return null;
      }

      // ---- drag state (persistent on the svg so drags survive redraws) ----
      let drag = null; // { handle, id, startX, startY }
      let dragDomain = null; // frozen [lo,hi] at pointerdown
      let panDrag = null;
      let zoomAccum = 0;
      let hoverIdx = null; // index of currently hovered handle (for marker/chip emphasis)

      function currentDomain() {
        // view is persistent once drawn (set at init-fit). Dragging or panning
        // freezes dragDomain over it; we never fall back to re-fitting bounds so
        // the on-screen domain equals the drag-frozen domain and does not snap
        // when a handle is grabbed.
        return dragDomain || view.slice();
      }

      // scales
      const base = H - M_B;
      const plotW = W - M_L - M_R;
      const plotH = base - M_T;
      function xt(x, d) { return M_L + ((x - d[0]) / (d[1] - d[0])) * plotW; }
      function xInv(px, d) { return d[0] + ((px - M_L) / plotW) * (d[1] - d[0]); }
      function yt(y, peak) { return M_T + (1 - y / peak) * plotH; }

      // mesh + peak (evaluate interior, inset from pinned edges for shape spikes)
      function mesh(p, d) {
        const n = nMesh;
        const xs = [];
        const ys = [];
        for (let i = 0; i <= n; i++) {
          const x = d[0] + (i / n) * (d[1] - d[0]);
          xs.push(x);
          ys.push(F.pdf(p, x));
        }
        let peak = 0;
        for (let i = 1; i < n; i++) peak = Math.max(peak, ys[i]);
        if (!(peak > 0) || !isFinite(peak)) peak = 1;
        return { xs, ys, peak };
      }

      // ---- actions ----
      // y-fraction convention: 0 = top of the plot (M_T), 1 = bottom (base),
      // growing downward (matching pointer clientY / SVG y).
      function yFrac(py) {
        return clamp((py - M_T) / plotH, 0, 1);
      }

      function applyDrag(e) {
        const rect = svg.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const py = ((e.clientY - rect.top) / rect.height) * H;
        const d0 = dragDomain || currentDomain();
        const x = xInv(clamp(px, M_L, W - M_R), d0);
        const p = getParams();

        // y convention: x-only handles get the plot y-fraction (yFrac); y-only
        // dials get the fully absolute pointer position across the dial band
        // (0 = top), so a press/drag instantly moves the knob to the cursor.
        // Render (yOf) and drag share DIAL_TOP/DIAL_BOT via this same value.
        const axes = drag.handle.axes || ["x"];
        const yOnly = axes.length === 1 && axes[0] === "y";
        const y = yOnly ? clamp((py - DIAL_TOP) / (DIAL_BOT - DIAL_TOP), 0, 1) : yFrac(py);
        let fx = x;
        let fy = y;
        // freeze the axes the handle does NOT accept, so a labeled drag stays 1-D
        if (!axes.includes("x")) fx = drag.startX;
        if (!axes.includes("y")) fy = drag.startY;
        const next = drag.handle.drag(p, fx, fy, d0);
        setParams(next, "drag");
      }

      // pan
      function panHit(e) {
        const rect = svg.getBoundingClientRect();
        const py = ((e.clientY - rect.top) / rect.height) * H;
        return py >= base - 8 && py <= base + 24;
      }
      svg.addEventListener("pointerdown", (e) => {
        if (!panHit(e)) return;
        cancelAnim();
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        const rect = svg.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        panDrag = { id: e.pointerId, startPx: px, startLo: currentDomain()[0] };
      });
      svg.addEventListener("pointermove", (e) => {
        if (!panDrag || panDrag.id !== e.pointerId) return;
        const d0 = currentDomain();
        const span = d0[1] - d0[0];
        const rect = svg.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const dData = ((px - panDrag.startPx) / plotW) * span;
        setDomain(panDrag.startLo - dData, panDrag.startLo - dData + span);
        draw();
      });
      const endPan = (e) => {
        if (!panDrag || panDrag.id !== e.pointerId) return;
        panDrag = null;
        svg.releasePointerCapture(e.pointerId);
      };
      svg.addEventListener("pointerup", endPan);
      svg.addEventListener("pointercancel", endPan);

      // zoom (wheel) — clamp at pinned edges
      svg.addEventListener("wheel", (e) => {
        e.preventDefault();
        cancelAnim();
        zoomAccum += e.deltaY;
        if (Math.abs(zoomAccum) < 90) return;
        const dir = Math.sign(zoomAccum);
        zoomAccum = 0;
        const d0 = currentDomain();
        const rect = svg.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const cx = xInv(clamp(px, M_L, W - M_R), d0);
        const f = dir < 0 ? 1 / 1.18 : 1.18;
        setDomain(cx - (cx - d0[0]) * f, cx + (d0[1] - cx) * f);
        draw();
      }, { passive: false });

      // click-to-place: click (no drag) on the plot repositions the center line
      let downAt = null;
      svg.addEventListener("pointerdown", (e) => {
        if (panHit(e) || e.button !== 0) return;
        if (e.target.closest && e.target.closest(".mzoom, .mreset, .mfit, .mchipgroup")) return;
        downAt = { px: e.clientX, py: e.clientY, id: e.pointerId };
      });
      svg.addEventListener("pointerup", (e) => {
        if (!downAt || downAt.id !== e.pointerId) return;
        const moved = Math.hypot(e.clientX - downAt.px, e.clientY - downAt.py);
        downAt = null;
        if (moved > 4) return; // it was a drag
        const center = F.handles.find((h) => h.kind === "center");
        if (!center) return;
        const rect = svg.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const x = xInv(clamp(px, M_L, W - M_R), currentDomain());
        setParams(center.drag(getParams(), x, 0.5, currentDomain()), "click");
      });

      // handle drag
      const attachDrag = (g, handle) => {
        g.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          cancelAnim();
          dragDomain = currentDomain();
          const rect = svg.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const py = ((e.clientY - rect.top) / rect.height) * H;
          const x0 = xInv(clamp(px, M_L, W - M_R), dragDomain);
          drag = { handle, id: e.pointerId, startX: x0, startY: yFrac(py) };
          svg.setPointerCapture(e.pointerId);
          applyDrag(e);
        });
      };
      svg.addEventListener("pointermove", (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        applyDrag(e);
      });
      const endDrag = (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        drag = null;
        dragDomain = null;
        svg.releasePointerCapture(e.pointerId);
        // grow to keep a reshaped curve visible, and shrink it back when it
        // collapses far below the view (symmetric fit); glide the transition
        const target = fitTargetAfterDrag(getParams());
        if (target) animateView(target);
      };
      svg.addEventListener("pointerup", endDrag);
      svg.addEventListener("pointercancel", endDrag);

      // Re-render without forcing a re-fit (used after pan/zoom/wheel view changes)
      const draw = () => redraw("view");

      // ---- animated view transitions: fit events glide instead of jumping ----
      const FIT_MS = 300;
      const EASE = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      const REDUCED =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      let anim = null; // { from, to, start, raf }

      function cancelAnim() {
        if (anim) {
          cancelAnimationFrame(anim.raf);
          anim = null;
        }
      }
      function animateView(to, ms = FIT_MS) {
        const from = currentDomain();
        if (REDUCED || ms <= 0) {
          setDomain(to[0], to[1]);
          draw();
          return;
        }
        cancelAnim();
        anim = { from, to: to.slice(), start: performance.now(), raf: 0 };
        const step = (now) => {
          if (!anim) return;
          const t = Math.min(1, (now - anim.start) / ms);
          const e = EASE(t);
          setDomain(
            anim.from[0] + (anim.to[0] - anim.from[0]) * e,
            anim.from[1] + (anim.to[1] - anim.from[1]) * e
          );
          draw();
          if (t < 1) anim.raf = requestAnimationFrame(step);
          else anim = null;
        };
        anim.raf = requestAnimationFrame(step);
      }

      function redraw(cause) {
        const p = getParams();
        const d = currentDomain();

        // re-fit on init or on a non-drag param change; a "view" redraw (pan /
        // zoom / wheel) keeps the current domain so the curve may sit off-center
        if (!drag && (cause === "init" || cause === "param")) {
          cancelAnim();
          ensureFit(p);
        }
        const dd = currentDomain();

        while (svg.lastChild && svg.lastChild !== defs) svg.removeChild(svg.lastChild);

        for (const x of ticks(dd)) {
          elNS("line", svg, { class: "mgrid", x1: xt(x, dd), y1: M_T, x2: xt(x, dd), y2: base });
          const t = elNS("text", svg, { class: "mtick", x: xt(x, dd), y: H - 12, "text-anchor": "middle" });
          t.textContent = fmt(x, 2);
        }
        elNS("line", svg, { class: "maxis", x1: M_L, y1: base, x2: W - M_R, y2: base });
        elNS("rect", svg, { class: "mpan", x: M_L, y: base - 6, width: plotW, height: 16, rx: 4 });
        const panTip = elNS("text", svg, { class: "mpantip", x: M_L + 5, y: base - 9 });
        panTip.textContent = "\u2194 drag axis to pan";

        const { xs, ys, peak } = mesh(p, dd);

        // reference mass for the tip
        const [il, ih] = F.integ(p);
        const norm = integrate(il, ih, (x) => F.pdf(p, x));

        // pdf area + line
        const pts = xs.map((x, i) => [xt(x, dd), yt(clamp(ys[i], 0, peak), peak)]);
        const area = elNS("path", svg, { class: "marea" });
        area.setAttribute("fill", `url(#${gradId})`);
        let ad = `M ${xt(dd[0], dd)},${base}`;
        ad += pts.map((pt, i) => (i === 0 ? ` M ${pt[0]},${pt[1]}` : ` L ${pt[0]},${pt[1]}`)).join("");
        ad += ` L ${xt(dd[1], dd)},${base} Z`;
        area.setAttribute("d", ad);
        const line = elNS("path", svg, { class: "mline" });
        line.setAttribute("d", pts.map((pt, i) => (i === 0 ? `M ${pt[0]},${pt[1]}` : `L ${pt[0]},${pt[1]}`)).join(""));

        // reference lines + drag hit zones + curve markers, one pass per handle.
        // Hit zones sit on a topmost overlay so pointer events reach them even
        // when a curve marker sits at the same x. When several handles converge
        // within one zone width, their shared zone is split into equal slices so
        // every handle stays grabbable (no top-most handle hiding the others).
        // Chip labels that overlap are ghosted (dimmed) and restored on hover or
        // while the handle is being dragged; the active handle's marker is drawn
        // on top so it isn't hidden under a sibling at the same x.
        const chipEls = [];
        const markerEls = [];
        const raiseMarker = (i) => { if (markerEls[i]) svg.appendChild(markerEls[i]); };
        const orderMarkers = () => { for (const g of markerEls) if (g) svg.appendChild(g); };
        const hitLayer = elNS("g", svg, { class: "mhitlayer" });

        // pass 0: locate every handle on the x-axis (clamped to the plot).
        // y-only handles (e.g. a vertical dial) have no x anchor and are carved
        // out of the x-zone partition; they get their own horizontal zone below.
        const isY = (i) => {
          const a = F.handles[i].axes;
          return a && a.length === 1 && a[0] === "y";
        };
        const hxOf = F.handles.map((h, i) =>
          isY(i) ? null : clamp(xt(h.at(p), dd), M_L, W - M_R)
        );

        // partition the plot x-range into per-handle grab zones. Non-overlapping
        // handles keep the full centered HIT_W zone; any maximal run of handles
        // whose zones would overlap shares one union-zone split evenly, with the
        // leftmost handle on the left (matching visual order).
        const zones = new Array(F.handles.length);
        const idx = [...F.handles.keys()]
          .filter((i) => hxOf[i] != null)
          .sort((a, b) => (hxOf[a] - hxOf[b]) || (a - b));
        let zi = 0;
        while (zi < idx.length) {
          let zj = zi + 1;
          while (zj < idx.length && hxOf[idx[zj]] - hxOf[idx[zi]] < HIT_W) zj++;
          const group = idx.slice(zi, zj);
          if (group.length === 1) {
            const i = group[0];
            zones[i] = { x: hxOf[i] - HIT_W / 2, w: HIT_W };
          } else {
            const lo = clamp(hxOf[group[0]] - HIT_W / 2, M_L, W - M_R);
            const hi = clamp(hxOf[group[group.length - 1]] + HIT_W / 2, M_L, W - M_R);
            const step = Math.max((hi - lo) / group.length, 2);
            let x = lo;
            for (const i of group) { zones[i] = { x, w: step }; x += step; }
          }
          zi = zj;
        }

        // pass 1: build markers, chips, reference lines, and hit zones
        const chipW = []; // half-width of each chip (for overlap detection)
        const overlap = new Array(F.handles.length).fill(false);
        for (let i = 0; i < F.handles.length; i++) {
          const h = F.handles[i];

          // vertical dial: no x anchor; a vertical track + knob that only moves
          // up/down. The whole band is one slider track, so clicking any height
          // jumps the knob there and dragging scrubs it; the knob position and
          // the drag mapping share DIAL_TOP/DIAL_BOT, so it tracks the cursor.
          if (isY(i)) {
            const yf = clamp(h.yOf ? h.yOf(p) : 0.5, 0, 1);
            const yPx = DIAL_TOP + yf * (DIAL_BOT - DIAL_TOP);
            const trackX = W - M_R - 20;
            const g = elNS("g", svg, { class: "mhandle mdial" });
            markerEls[i] = g;
            elNS("line", g, { class: "mdialtrack", x1: trackX, y1: DIAL_TOP, x2: trackX, y2: DIAL_BOT });
            elNS("line", g, { class: "mdialref", x1: M_L, y1: yPx, x2: W - M_R, y2: yPx });
            elNS("rect", g, { x: trackX - 9, y: yPx - 7, width: 18, height: 14, rx: 4, class: "mdialknob" });
            elNS("line", g, { x1: trackX - 5, y1: yPx, x2: trackX + 5, y2: yPx, class: "mdialgrip" });

            const chip = elNS("g", svg, { class: "mchipgroup", transform: `translate(${trackX}, ${M_T + 30})` });
            const txt = elNS("text", chip, { class: "mlabeltxt", "text-anchor": "middle", "dominant-baseline": "central" });
            txt.textContent = h.chip(p);
            const bb = txt.getBBox();
            elNS("rect", chip, { x: bb.x - 6, y: bb.y - 4, width: bb.width + 12, height: bb.height + 8, rx: 7, class: "mchip", fill: h.color });
            chip.appendChild(txt);
            chipEls[i] = chip;
            chipW[i] = 0;

            // slider track: a full-band vertical hit zone centered on the track
            const hr = elNS("rect", hitLayer, { class: "mhity", x: trackX - DIAL_HIT_W / 2, y: DIAL_TOP, width: DIAL_HIT_W, height: DIAL_BOT - DIAL_TOP });
            hr.addEventListener("pointerenter", () => {
              hoverIdx = i;
              applyHandleState();
            });
            hr.addEventListener("pointerleave", () => {
              if (hoverIdx === i) hoverIdx = null;
              applyHandleState();
            });
            attachDrag(hr, h);
            continue;
          }

          const hx = hxOf[i];
          const hy = yt(clamp(F.pdf(p, h.at(p)), 0, peak), peak);
          const g = elNS("g", svg, { class: `mhandle ${h.icon}` });
          markerEls[i] = g;
          if (h.icon === "dot") {
            elNS("line", g, { class: "mstem", x1: hx, y1: hy, x2: hx, y2: base });
            elNS("circle", g, { cx: hx, cy: hy, r: 7, class: "mdot" });
          } else {
            elNS("line", g, { class: "mstem", x1: hx, y1: hy, x2: hx, y2: base });
            elNS("rect", g, { x: hx - 7, y: hy - 7, width: 14, height: 14, rx: 3, class: "msq" });
            elNS("line", g, { x1: hx - 4, y1: hy, x2: hx + 4, y2: hy, class: "msqgrip" });
          }

          // label chip (backdrop rect first, then the label text on top)
          const chip = elNS("g", svg, { class: "mchipgroup", transform: `translate(${hx}, ${M_T - 18})` });
          const txt = elNS("text", chip, { class: "mlabeltxt", "text-anchor": "middle", "dominant-baseline": "central" });
          txt.textContent = h.chip(p);
          const bb = txt.getBBox();
          elNS("rect", chip, { x: bb.x - 6, y: bb.y - 4, width: bb.width + 12, height: bb.height + 8, rx: 7, class: "mchip", fill: h.color });
          chip.appendChild(txt);
          chipEls[i] = chip;
          chipW[i] = bb.width / 2 + 6;

          // reference line drawn in its own group (below the hit zone)
          const lineG = elNS("g", svg);
          elNS("line", lineG, { class: h.lineCls, x1: hx, y1: M_T, x2: hx, y2: base });
          elNS("line", lineG, { class: "mstem", x1: hx, y1: M_T, x2: hx, y2: base, opacity: 0 });

          // hit zone on the topmost overlay: attach the handle drag
          const z = zones[i];
          const hr = elNS("rect", hitLayer, { class: "mhitline", x: z.x, y: M_T, width: z.w, height: base - M_T });
          hr.addEventListener("pointerenter", () => {
            hoverIdx = i;
            applyHandleState();
          });
          hr.addEventListener("pointerleave", () => {
            if (hoverIdx === i) hoverIdx = null;
            applyHandleState();
          });
          attachDrag(hr, h);
        }

        // symmetric chip-overlap detection (a pair overlapping → both ghost)
        for (let i = 0; i < F.handles.length; i++) {
          for (let j = i + 1; j < F.handles.length; j++) {
            if (hxOf[i] == null || hxOf[j] == null) continue;
            if (Math.abs(hxOf[i] - hxOf[j]) < chipW[i] + chipW[j]) {
              overlap[i] = overlap[j] = true;
            }
          }
        }

        // apply chip ghosting + marker emphasis for the current hover/drag state
        function applyHandleState() {
          for (let i = 0; i < F.handles.length; i++) {
            const h = F.handles[i];
            const active = drag && drag.handle === h;
            chipEls[i].classList.toggle("mchip-dim", overlap[i] && hoverIdx !== i && !active);
          }
          if (drag) {
            const di = F.handles.indexOf(drag.handle);
            if (di >= 0) raiseMarker(di);
          } else if (hoverIdx != null && hoverIdx >= 0) {
            raiseMarker(hoverIdx);
          } else {
            orderMarkers();
          }
        }
        applyHandleState();

        // zoom buttons (last so they stay on top) + tip
        const zm = (f) => {
          cancelAnim();
          const d0 = currentDomain();
          const c = (d0[0] + d0[1]) / 2;
          const span = (d0[1] - d0[0]) * f;
          setDomain(c - span / 2, c + span / 2);
          draw();
        };
        const zbtn = (label, dx, f) => {
          const g = elNS("g", svg, { class: "mzoom", cursor: "pointer" });
          const cx = W - M_R - 54 + dx;
          g.addEventListener("click", (e) => { e.stopPropagation(); zm(f); });
          elNS("rect", g, { x: cx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mzoombtn" });
          const t = elNS("text", g, { class: "mzoomtxt", x: cx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
          t.textContent = label;
          return g;
        };
        zbtn("\u2212", 0, 1.4);
        zbtn("+", 27, 1 / 1.4);

        // reset button: restore the family defaults (param redraws re-fit the view)
        const reset = () => {
          const d = {};
          for (const k of traitNames) d[k] = F.defaults[k];
          setParams(d, "reset");
        };
        const rbtn = elNS("g", svg, { class: "mreset", cursor: "pointer" });
        const rcx = W - M_R - 54 - 30;
        rbtn.addEventListener("click", (e) => { e.stopPropagation(); reset(); });
        elNS("rect", rbtn, { x: rcx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mresetbtn" });
        const rt = elNS("text", rbtn, { class: "mresetxt", x: rcx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
        rt.textContent = "\u21BA";

        // fit button: glide the view back to the curve bounds (manual re-fit)
        const fitView = () => animateView(F.bounds(getParams()));
        const fbtn = elNS("g", svg, { class: "mfit", cursor: "pointer" });
        const fcx = rcx - 30;
        fbtn.addEventListener("click", (e) => { e.stopPropagation(); fitView(); });
        elNS("rect", fbtn, { x: fcx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mfitbtn" });
        const ft = elNS("text", fbtn, { class: "mfitxt", x: fcx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
        ft.textContent = "\u26F6";

        tip.textContent = F.tip(p, { norm, peak });
        root.appendChild(tip);
      }

      for (const k of traitNames) model.on(`change:${k}`, () => redraw("param"));
      if (!view) {
        ensureFit(getParams());
        redraw("init");
      } else {
        redraw("param");
      }
    },
  };
}
