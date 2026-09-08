/*! modist v0.6.0 - MIT (c) 2026 Will Dean - https://github.com/williambdean/modist
 * Bundled: jstat v1.9.6 (MIT) - Copyright (c) 2013 jStat
 * https://github.com/jstat/jstat - https://opensource.org/licenses/MIT */

// js/base.js
var W = 660;
var H = 360;
var M_L = 8;
var M_R = 8;
var M_T = 46;
var M_B = 44;
var HIT_W = 24;
var DIAL_TOP = M_T + 40;
var DIAL_BOT = H - M_B - 6;
var DIAL_HIT_W = 36;
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
  const nice = (raw) => {
    if (!(raw > 0)) return 1;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const sn = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
    return sn * mag;
  };
  const step = nice(span / 9);
  const p = Math.max(0, -Math.floor(Math.log10(step)));
  let len;
  if (Math.abs(span) >= 1) {
    const d2 = Math.floor(Math.log10(Math.abs(span))) + 1;
    len = d2 + Math.floor((d2 - 1) / 3);
  } else {
    len = 2 + p;
  }
  const damp = p >= 6 ? 0.45 : p >= 5 ? 0.55 : p >= 4 ? 0.7 : p >= 3 ? 0.85 : 1;
  const target = Math.max(4, Math.min(12, Math.round(644 / (11.7 * len) * damp)));
  const major = nice(span / target);
  const div = target >= 9 ? 1 : target >= 7 ? 2 : 4;
  const minor = major / div;
  const prec = Math.max(0, -Math.floor(Math.log10(major)));
  const build = (s, extend, p2) => {
    const out = [];
    let i = (Math.ceil(d[0] / s - 1e-9) || 0) - (extend ? 1 : 0);
    const hi = d[1] + (extend ? s : 0) + 1e-9;
    for (; i * s <= hi && out.length < 100; i++) {
      const v = i * s;
      out.push(p2 === null ? v : Math.round(v * 10 ** p2) / 10 ** p2);
    }
    return out;
  };
  return {
    major: build(major, false, prec),
    minor: build(minor, true, null),
    prec
  };
}
function integrate(lo, hi, fn, N) {
  N = N || 400;
  const dx = (hi - lo) / N;
  const step = (i) => i % 2 ? 4 : 2;
  let s = fn(lo) + fn(hi);
  for (let i = 1; i < N; i++) s += step(i) * fn(lo + i * dx);
  return s * dx / 3;
}
var uidCounter = 0;
function fmt(x, dp) {
  dp = dp === void 0 ? 3 : dp;
  if (!isFinite(x)) return "\u2013";
  if (x === 0 || Math.abs(x) < 5e-14) return "0";
  const a = Math.abs(x);
  if (a >= 1e12) return x.toExponential(2);
  if (a < 5 * 10 ** (-dp - 1)) return x.toExponential(2);
  return (Math.round(x * 10 ** dp) / 10 ** dp).toLocaleString("en-US", {
    maximumFractionDigits: dp
  });
}
function createWidget(F2, opts) {
  const {
    pins = "none",
    // "none" | "left" | "both"
    nMesh = 400,
    // how the view is adjusted after a drag ends:
    //   "fit"    grow to contain a straying curve AND shrink when the curve
    //            occupies less than SHRINK_FRAC of the view (default)
    //   "expand" only grow (previous behavior)
    //   "none"   never adjust after a drag
    fit = "fit"
  } = opts || {};
  const SHRINK_FRAC = 0.3;
  return {
    render({ model, el }) {
      const uid = `md-${++uidCounter}`;
      const gradId = `${uid}-fill`;
      const root = document.createElement("div");
      root.className = "mroot";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.aspectRatio = `${W} / ${H}`;
      root.appendChild(svg);
      const defs = elNS("defs", svg);
      const grad = elNS("linearGradient", defs, {
        id: gradId,
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1"
      });
      elNS("stop", grad, { offset: "0%", "stop-color": "var(--m-acc)", "stop-opacity": "0.55" });
      elNS("stop", grad, { offset: "100%", "stop-color": "var(--m-acc)", "stop-opacity": "0.06" });
      const tip = document.createElement("div");
      tip.className = "mtip";
      root.appendChild(tip);
      el.appendChild(root);
      const traitNames = Object.keys(F2.defaults);
      const getParams = () => {
        const p = {};
        for (const k of traitNames) p[k] = model.get(k);
        return p;
      };
      const setParams = (newVals, why) => {
        for (const k of traitNames) {
          if (k in newVals && newVals[k] !== model.get(k)) model.set(k, newVals[k]);
        }
        model.save_changes(why);
      };
      let view = null;
      function support(p) {
        const s = F2.support(p);
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
        setDomain(F2.bounds(p)[0], F2.bounds(p)[1]);
      }
      function fitTargetAfterDrag(p) {
        const cur = currentDomain();
        const b = F2.bounds(p);
        if (b[0] < cur[0] || b[1] > cur[1]) {
          return [Math.min(cur[0], b[0]), Math.max(cur[1], b[1])];
        }
        if (fit === "fit") {
          const curSpan = cur[1] - cur[0];
          const bSpan = b[1] - b[0];
          if (bSpan < curSpan * SHRINK_FRAC) return b.slice();
        }
        return null;
      }
      let drag = null;
      let dragDomain = null;
      let panDrag = null;
      let zoomAccum = 0;
      let hoverIdx = null;
      function currentDomain() {
        return dragDomain || view.slice();
      }
      const base = H - M_B;
      const plotW = W - M_L - M_R;
      const plotH = base - M_T;
      function xt(x, d) {
        return M_L + (x - d[0]) / (d[1] - d[0]) * plotW;
      }
      function xInv(px, d) {
        return d[0] + (px - M_L) / plotW * (d[1] - d[0]);
      }
      function yt(y, peak) {
        return M_T + (1 - y / peak) * plotH;
      }
      function mesh(p, d) {
        const n = nMesh;
        const xs = [];
        const ys = [];
        for (let i = 0; i <= n; i++) {
          const x = d[0] + i / n * (d[1] - d[0]);
          xs.push(x);
          ys.push(F2.pdf(p, x));
        }
        let peak = 0;
        for (let i = 1; i < n; i++) peak = Math.max(peak, ys[i]);
        if (!(peak > 0) || !isFinite(peak)) peak = 1;
        return { xs, ys, peak };
      }
      function yFrac(py) {
        return clamp((py - M_T) / plotH, 0, 1);
      }
      function applyDrag(e) {
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const py = (e.clientY - rect.top) / rect.height * H;
        const d0 = dragDomain || currentDomain();
        const x = xInv(clamp(px, M_L, W - M_R), d0);
        const p = getParams();
        const axes = drag.handle.axes || ["x"];
        const yOnly = axes.length === 1 && axes[0] === "y";
        const y = yOnly ? clamp((py - DIAL_TOP) / (DIAL_BOT - DIAL_TOP), 0, 1) : yFrac(py);
        let fx = x;
        let fy = y;
        if (!axes.includes("x")) fx = drag.startX;
        if (!axes.includes("y")) fy = drag.startY;
        const next = drag.handle.drag(p, fx, fy, d0);
        setParams(next, "drag");
      }
      function panHit(e) {
        const rect = svg.getBoundingClientRect();
        const py = (e.clientY - rect.top) / rect.height * H;
        return py >= base - 8 && py <= base + 24;
      }
      svg.addEventListener("pointerdown", (e) => {
        if (!panHit(e)) return;
        cancelAnim();
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        panDrag = { id: e.pointerId, startPx: px, startLo: currentDomain()[0] };
      });
      svg.addEventListener("pointermove", (e) => {
        if (!panDrag || panDrag.id !== e.pointerId) return;
        const d0 = currentDomain();
        const span = d0[1] - d0[0];
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const dData = (px - panDrag.startPx) / plotW * span;
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
      svg.addEventListener("wheel", (e) => {
        e.preventDefault();
        cancelAnim();
        zoomAccum += e.deltaY;
        if (Math.abs(zoomAccum) < 90) return;
        const dir = Math.sign(zoomAccum);
        zoomAccum = 0;
        const d0 = currentDomain();
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const cx = xInv(clamp(px, M_L, W - M_R), d0);
        const f = dir < 0 ? 1 / 1.18 : 1.18;
        setDomain(cx - (cx - d0[0]) * f, cx + (d0[1] - cx) * f);
        draw();
      }, { passive: false });
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
        if (moved > 4) return;
        const center = F2.handles.find((h) => h.kind === "center");
        if (!center) return;
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const x = xInv(clamp(px, M_L, W - M_R), currentDomain());
        setParams(center.drag(getParams(), x, 0.5, currentDomain()), "click");
      });
      const attachDrag = (g, handle) => {
        g.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          cancelAnim();
          dragDomain = currentDomain();
          const rect = svg.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width * W;
          const py = (e.clientY - rect.top) / rect.height * H;
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
        const target = fitTargetAfterDrag(getParams());
        if (target) animateView(target);
      };
      svg.addEventListener("pointerup", endDrag);
      svg.addEventListener("pointercancel", endDrag);
      const draw = () => redraw("view");
      const FIT_MS = 300;
      const EASE = (t) => 1 - Math.pow(1 - t, 3);
      const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      let anim = null;
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
        if (!drag && (cause === "init" || cause === "param")) {
          cancelAnim();
          ensureFit(p);
        }
        const dd = currentDomain();
        while (svg.lastChild && svg.lastChild !== defs) svg.removeChild(svg.lastChild);
        const { major, minor, prec } = ticks(dd);
        for (const x of minor) {
          elNS("line", svg, { class: "mgrid", x1: xt(x, dd), y1: M_T, x2: xt(x, dd), y2: base });
        }
        for (const x of major) {
          elNS("line", svg, { class: "mgridm", x1: xt(x, dd), y1: M_T, x2: xt(x, dd), y2: base });
          const t = elNS("text", svg, { class: "mtick", x: xt(x, dd), y: H - 12, "text-anchor": "middle" });
          t.textContent = fmt(x, prec);
        }
        elNS("line", svg, { class: "maxis", x1: M_L, y1: base, x2: W - M_R, y2: base });
        elNS("rect", svg, { class: "mpan", x: M_L, y: base - 6, width: plotW, height: 16, rx: 4 });
        const panTip = elNS("text", svg, { class: "mpantip", x: M_L + 5, y: base - 9 });
        panTip.textContent = "\u2194 drag axis to pan";
        const { xs, ys, peak } = mesh(p, dd);
        const [il, ih] = F2.integ(p);
        const norm = integrate(il, ih, (x) => F2.pdf(p, x));
        const pts = xs.map((x, i) => [xt(x, dd), yt(clamp(ys[i], 0, peak), peak)]);
        const area = elNS("path", svg, { class: "marea" });
        area.setAttribute("fill", `url(#${gradId})`);
        let ad = `M ${xt(dd[0], dd)},${base}`;
        ad += pts.map((pt) => ` L ${pt[0]},${pt[1]}`).join("");
        ad += ` L ${xt(dd[1], dd)},${base} Z`;
        area.setAttribute("d", ad);
        const line = elNS("path", svg, { class: "mline" });
        line.setAttribute("d", pts.map((pt, i) => i === 0 ? `M ${pt[0]},${pt[1]}` : `L ${pt[0]},${pt[1]}`).join(""));
        const chipEls = [];
        const markerEls = [];
        const raiseMarker = (i) => {
          if (markerEls[i]) svg.appendChild(markerEls[i]);
        };
        const orderMarkers = () => {
          for (const g of markerEls) if (g) svg.appendChild(g);
        };
        const hitLayer = elNS("g", svg, { class: "mhitlayer" });
        const isY = (i) => {
          const a = F2.handles[i].axes;
          return a && a.length === 1 && a[0] === "y";
        };
        const hxOf = F2.handles.map(
          (h, i) => isY(i) ? null : clamp(xt(h.at(p), dd), M_L, W - M_R)
        );
        const zones = new Array(F2.handles.length);
        const idx = [...F2.handles.keys()].filter((i) => hxOf[i] != null).sort((a, b) => hxOf[a] - hxOf[b] || a - b);
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
            for (const i of group) {
              zones[i] = { x, w: step };
              x += step;
            }
          }
          zi = zj;
        }
        const chipW = [];
        const overlap = new Array(F2.handles.length).fill(false);
        for (let i = 0; i < F2.handles.length; i++) {
          const h = F2.handles[i];
          if (isY(i)) {
            const yf = clamp(h.yOf ? h.yOf(p) : 0.5, 0, 1);
            const yPx = DIAL_TOP + yf * (DIAL_BOT - DIAL_TOP);
            const trackX = W - M_R - 20;
            const g2 = elNS("g", svg, { class: "mhandle mdial" });
            markerEls[i] = g2;
            elNS("line", g2, { class: "mdialtrack", x1: trackX, y1: DIAL_TOP, x2: trackX, y2: DIAL_BOT });
            elNS("line", g2, { class: "mdialref", x1: M_L, y1: yPx, x2: W - M_R, y2: yPx });
            elNS("rect", g2, { x: trackX - 9, y: yPx - 7, width: 18, height: 14, rx: 4, class: "mdialknob" });
            elNS("line", g2, { x1: trackX - 5, y1: yPx, x2: trackX + 5, y2: yPx, class: "mdialgrip" });
            const chip2 = elNS("g", svg, { class: "mchipgroup", transform: `translate(${trackX}, ${M_T + 30})` });
            const txt2 = elNS("text", chip2, { class: "mlabeltxt", "text-anchor": "middle", "dominant-baseline": "central" });
            txt2.textContent = h.chip(p);
            const bb2 = txt2.getBBox();
            elNS("rect", chip2, { x: bb2.x - 6, y: bb2.y - 4, width: bb2.width + 12, height: bb2.height + 8, rx: 7, class: "mchip", fill: h.color });
            chip2.appendChild(txt2);
            chipEls[i] = chip2;
            chipW[i] = 0;
            const hr2 = elNS("rect", hitLayer, { class: "mhity", x: trackX - DIAL_HIT_W / 2, y: DIAL_TOP, width: DIAL_HIT_W, height: DIAL_BOT - DIAL_TOP });
            hr2.addEventListener("pointerenter", () => {
              hoverIdx = i;
              applyHandleState();
            });
            hr2.addEventListener("pointerleave", () => {
              if (hoverIdx === i) hoverIdx = null;
              applyHandleState();
            });
            attachDrag(hr2, h);
            continue;
          }
          const hx = hxOf[i];
          const hy = yt(clamp(F2.pdf(p, h.at(p)), 0, peak), peak);
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
          const chip = elNS("g", svg, { class: "mchipgroup", transform: `translate(${hx}, ${M_T - 18})` });
          const txt = elNS("text", chip, { class: "mlabeltxt", "text-anchor": "middle", "dominant-baseline": "central" });
          txt.textContent = h.chip(p);
          const bb = txt.getBBox();
          elNS("rect", chip, { x: bb.x - 6, y: bb.y - 4, width: bb.width + 12, height: bb.height + 8, rx: 7, class: "mchip", fill: h.color });
          chip.appendChild(txt);
          chipEls[i] = chip;
          chipW[i] = bb.width / 2 + 6;
          const lineG = elNS("g", svg);
          elNS("line", lineG, { class: h.lineCls, x1: hx, y1: M_T, x2: hx, y2: base });
          elNS("line", lineG, { class: "mstem", x1: hx, y1: M_T, x2: hx, y2: base, opacity: 0 });
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
        for (let i = 0; i < F2.handles.length; i++) {
          for (let j = i + 1; j < F2.handles.length; j++) {
            if (hxOf[i] == null || hxOf[j] == null) continue;
            if (Math.abs(hxOf[i] - hxOf[j]) < chipW[i] + chipW[j]) {
              overlap[i] = overlap[j] = true;
            }
          }
        }
        function applyHandleState() {
          for (let i = 0; i < F2.handles.length; i++) {
            const h = F2.handles[i];
            const active = drag && drag.handle === h;
            chipEls[i].classList.toggle("mchip-dim", overlap[i] && hoverIdx !== i && !active);
          }
          if (drag) {
            const di = F2.handles.indexOf(drag.handle);
            if (di >= 0) raiseMarker(di);
          } else if (hoverIdx != null && hoverIdx >= 0) {
            raiseMarker(hoverIdx);
          } else {
            orderMarkers();
          }
        }
        applyHandleState();
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
          g.addEventListener("click", (e) => {
            e.stopPropagation();
            zm(f);
          });
          elNS("rect", g, { x: cx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mzoombtn" });
          const t = elNS("text", g, { class: "mzoomtxt", x: cx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
          t.textContent = label;
          return g;
        };
        zbtn("\u2212", 0, 1.4);
        zbtn("+", 27, 1 / 1.4);
        const reset = () => {
          const d2 = {};
          for (const k of traitNames) d2[k] = F2.defaults[k];
          setParams(d2, "reset");
        };
        const rbtn = elNS("g", svg, { class: "mreset", cursor: "pointer" });
        const rcx = W - M_R - 54 - 30;
        rbtn.addEventListener("click", (e) => {
          e.stopPropagation();
          reset();
        });
        elNS("rect", rbtn, { x: rcx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mresetbtn" });
        const rt = elNS("text", rbtn, { class: "mresetxt", x: rcx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
        rt.textContent = "\u21BA";
        const fitView = () => animateView(F2.bounds(getParams()));
        const fbtn = elNS("g", svg, { class: "mfit", cursor: "pointer" });
        const fcx = rcx - 30;
        fbtn.addEventListener("click", (e) => {
          e.stopPropagation();
          fitView();
        });
        elNS("rect", fbtn, { x: fcx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mfitbtn" });
        const ft = elNS("text", fbtn, { class: "mfitxt", x: fcx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
        ft.textContent = "\u26F6";
        tip.textContent = F2.tip(p, { norm, peak });
        root.appendChild(tip);
      }
      for (const k of traitNames) model.on(`change:${k}`, () => redraw("param"));
      if (!view) {
        ensureFit(getParams());
        redraw("init");
      } else {
        redraw("param");
      }
    }
  };
}

// js/logistic.js
var LN3 = Math.log(3);
var SD_FACTOR = Math.PI / Math.sqrt(3);
var S_MIN = 1e-6;
var S_MAX = 1e6;
var F = {
  name: "logistic",
  label: "Logistic",
  defaults: { mu: 0, s: 1 },
  support() {
    return [null, null];
  },
  bounds(p) {
    const w = 5.2 * SD_FACTOR * p.s;
    return [p.mu - w, p.mu + w];
  },
  integ(p) {
    const w = 7.5 * SD_FACTOR * p.s;
    return [p.mu - w, p.mu + w];
  },
  pdf(p, x) {
    const z = (x - p.mu) / p.s;
    const e = Math.exp(-z);
    return e / (p.s * (1 + e) ** 2);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) {
        return p.mu;
      },
      chip() {
        return "mean";
      },
      drag(p, x) {
        return { mu: x };
      }
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#f97316",
      lineCls: "mstd",
      at(p) {
        return p.mu + LN3 * p.s;
      },
      chip() {
        return "q75";
      },
      drag(p, x) {
        const s = Math.max(S_MIN, Math.min(S_MAX, Math.abs(x - p.mu) / LN3));
        return { s };
      }
    }
  ],
  tip(p) {
    return `${F.label} \u2022 drag mean to shift \u2022 drag q75 to reshape \u2022 mu=${fmt(p.mu)} s=${fmt(p.s)}`;
  }
};
var logistic_default = createWidget(F, { pins: "none" });
export {
  logistic_default as default
};
