// gamma.js - Gamma((alpha=shape, beta=rate)) interactive widget, left edge pinned at 0.
import jStat from "./vendor/jstat.esm.js";
import { createWidget, fmt } from "./base.js";

const A_MIN = 0.01;
const A_MAX = 400;
// q75 at fixed mean peaks at this alpha and is monotonic decreasing for
// alpha >= A_RES (m-independent, since inv(q, alpha, m/alpha) = m * inv(q, alpha, 1/alpha)).
const A_RES = 0.965;
// q75 / mean at the peak and at the narrowest (A_MAX), both m-independent.
const Q75_PEAK = jStat.gamma.inv(0.75, A_RES, 1 / A_RES);
const Q75_FLOOR = jStat.gamma.inv(0.75, A_MAX, 1 / A_MAX);

const mean = (p) => p.alpha / p.beta;
const scale = (p) => 1 / p.beta; // jStat gamma is (shape, scale)

// q25 is monotonic increasing with alpha (0 -> m): bisect the full range.
function solveQ25(q, target, m) {
  const f = (a) => jStat.gamma.inv(q, a, m / a) - target;
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
// A_RES then falls back toward ~1.03*m. So the mapping is two monotonic
// branches: "rising" [A_MIN, A_RES] (q75 in [~0, Q75_PEAK*m], including below
// the mean) and "falling" [A_RES, A_MAX] (q75 in [Q75_FLOOR*m, Q75_PEAK*m]).
// We bisect one branch at a time, picking the branch the CURRENT alpha is on
// (hysteresis) so the drag is continuous and never flips mid-drag; we only
// switch when the current branch can no longer reach the target.
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
  const f = (a) => jStat.gamma.inv(q, a, m / a) - target;
  const peak = Q75_PEAK * m;
  if (target >= peak) return A_RES; // above the reachable peak -> widest (freeze at peak)
  const floor = Q75_FLOOR * m;
  const onFalling = aCur >= A_RES;
  // rising branch is increasing in alpha (dir +1); falling branch is
  // decreasing (dir -1). Prefer the current branch; else the rising branch
  // (which reaches everything from ~0 up to the peak).
  if (onFalling && target >= floor) {
    return bisectQ75(f, A_RES, A_MAX, -1);
  }
  return bisectQ75(f, A_MIN, A_RES, 1);
}

function translateAtShape(p, x, d) {
  // at fixed shape alpha, the mean is alpha/beta, so beta = alpha / x.
  // Keep the mean a small fraction above the current view's left edge (0.01 of
  // the visible span) so it can never collapse to ~0 and squish the axis into
  // a microscopic range; the user can still push it near (not onto) 0.
  const a = p.alpha;
  const span = d ? Math.max(d[1] - d[0], 1e-9) : 1;
  const m = Math.max(x, 0.01 * span);
  return { alpha: a, beta: a / m };
}

function shapeAtFixedMean(p, q, x) {
  // reshape around the CURRENT mean while keeping it fixed (like Beta's kappa)
  const m = mean(p);
  const xc = Math.max(x, 1e-6);
  const a = q === 0.25 ? solveQ25(q, xc, m) : solveQ75(q, xc, m, p.alpha);
  return { alpha: a, beta: a / m };
}

const F = {
  name: "gamma",
  label: "Gamma",
  defaults: { alpha: 2, beta: 2 },
  support: () => [0, null], // left edge pinned at 0
  bounds(p) {
    const m = mean(p);
    const sd = Math.sqrt(p.alpha) / p.beta;
    return [0, m + 5.2 * sd];
  },
  integ(p) {
    const m = mean(p);
    const sd = Math.sqrt(p.alpha) / p.beta;
    return [0, m + 9 * sd];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return jStat.gamma.pdf(x, p.alpha, scale(p));
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at: (p) => mean(p),
      chip: () => "mean",
      drag: (p, x, d) => translateAtShape(p, x, d),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.gamma.inv(0.25, p.alpha, scale(p)),
      chip: () => "q25",
      drag: (p, x) => shapeAtFixedMean(p, 0.25, x),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.gamma.inv(0.75, p.alpha, scale(p)),
      chip: () => "q75",
      drag: (p, x) => shapeAtFixedMean(p, 0.75, x),
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag mean to translate \u2022 drag q25/q75 to reshape around the mean \u2022 alpha=${fmt(p.alpha)} beta=${fmt(p.beta)}`;
  },
};

export default createWidget(F, { pins: "left" });
