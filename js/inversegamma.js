// inversegamma.js - InverseGamma((alpha=shape, beta=scale)) interactive widget,
// left edge pinned at 0. pymc uses the (alpha, beta) scale convention: mean =
// beta / (alpha - 1). Note this is beta-as-scale, unlike Gamma's rate.
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const A_MIN = 1.05; // mean = beta/(alpha-1) -> keep finite; alpha < 1 has no mean
const A_MAX = 400;
// q75 at fixed mean peaks at this alpha and is monotonic decreasing for
// alpha >= A_RES (m-independent, since inv(q, alpha, m*(alpha-1)) =
// m * inv(q, alpha, alpha-1)).
const A_RES = 4.94;
// q75 / mean at the peak and at the narrowest (A_MAX), both m-independent.
const Q75_PEAK = jStat.invgamma.inv(0.75, A_RES, A_RES - 1);
const Q75_FLOOR = jStat.invgamma.inv(0.75, A_MAX, A_MAX - 1);

const mean = (p) => p.beta / (p.alpha - 1);
const scale = (p) => p.beta; // jStat invgamma is (shape, scale)

// q25 is monotonic increasing with alpha (0 -> ~0.97*m): bisect the full range.
function solveQ25(q, target, m) {
  const f = (a) => jStat.invgamma.inv(q, a, (a - 1) * m) - target;
  const flow = f(A_MIN);
  const fhigh = f(A_MAX);
  if (flow > 0) return A_MIN;
  if (fhigh < 0) return A_MAX;
  let lo = A_MIN;
  let hi = A_MAX;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// q75 at fixed mean is NON-monotonic in alpha: it rises from ~0 to a peak at
// A_RES (~1.187*m) then falls back toward ~1.033*m (same structure as gamma).
// Two monotonic branches: "rising" [A_MIN, A_RES] and "falling" [A_RES, A_MAX].
// We bisect one branch at a time, picking the branch the CURRENT alpha is on
// (hysteresis) so the drag is continuous and never flips mid-drag.
function bisectQ75(f, lo, hi, dir) {
  const flow = f(lo) * dir;
  const fhigh = f(hi) * dir;
  if (flow > 0) return lo;
  if (fhigh < 0) return hi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) * dir > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
function solveQ75(q, target, m, aCur) {
  const f = (a) => jStat.invgamma.inv(q, a, (a - 1) * m) - target;
  const peak = Q75_PEAK * m;
  if (target >= peak) return A_RES; // above the reachable peak -> widest (freeze at peak)
  const floor = Q75_FLOOR * m;
  const onFalling = aCur >= A_RES;
  if (onFalling && target >= floor) {
    return bisectQ75(f, A_RES, A_MAX, -1);
  }
  return bisectQ75(f, A_MIN, A_RES, 1);
}

function translateAtShape(p, x, d) {
  // at fixed shape alpha, the mean is beta/(alpha-1), so beta = m*(alpha-1).
  // Keep the mean a small fraction above the current view's left edge (0.01 of
  // the visible span) so it can never collapse to ~0 and squish the axis.
  const a = p.alpha;
  const span = d ? Math.max(d[1] - d[0], 1e-9) : 1;
  const m = Math.max(x, 0.01 * span);
  return { alpha: a, beta: m * (a - 1) };
}

function shapeAtFixedMean(p, q, x) {
  // reshape around the CURRENT mean while keeping it fixed
  const m = mean(p);
  const xc = Math.max(x, 1e-6);
  const a = q === 0.25 ? solveQ25(q, xc, m) : solveQ75(q, xc, m, p.alpha);
  return { alpha: a, beta: (a - 1) * m };
}

const BOUNDS_Q = 0.99;
const INTEG_Q = 0.9995;

const F = {
  name: "inversegamma",
  label: "InverseGamma",
  defaults: { alpha: 3, beta: 1 },
  support: () => [0, null], // left edge pinned at 0
  // sd is infinite for alpha <= 2, so use a quantile-based right edge.
  bounds(p) {
    return [0, 1.02 * jStat.invgamma.inv(BOUNDS_Q, p.alpha, p.beta)];
  },
  integ(p) {
    return [0, 1.05 * jStat.invgamma.inv(INTEG_Q, p.alpha, p.beta)];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return jStat.invgamma.pdf(x, p.alpha, scale(p));
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at: (p) => mean(p),
      chip: () => "mean",
      drag: (p, x, y, d) => translateAtShape(p, x, d),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.invgamma.inv(0.25, p.alpha, scale(p)),
      chip: () => "q25",
      drag: (p, x) => shapeAtFixedMean(p, 0.25, x),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.invgamma.inv(0.75, p.alpha, scale(p)),
      chip: () => "q75",
      drag: (p, x) => shapeAtFixedMean(p, 0.75, x),
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag mean to translate \u2022 drag q25/q75 to reshape at fixed mean \u2022 alpha=${fmt(p.alpha)} beta=${fmt(p.beta)}`;
  },
};

export default createWidget(F, { pins: "left" });