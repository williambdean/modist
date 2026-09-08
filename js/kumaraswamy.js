// kumaraswamy.js - Kumaraswamy((a, b)) interactive widget on the fixed [0, 1]
// domain. Handles: the mean dot translates at fixed b by solving a (the mean is
// monotone increasing in a); the q25/q75 squares reshape at fixed a by solving b
// in closed form (q = (1-(1-p)^(1/b))^(1/a) -> b = ln(1-p)/ln(1-q^a)).
//
// Cap note: the caps are deliberately generous (B_MAX 1e6) because Kumaraswamy
// quantiles need huge b to reach mid-scale at larger a (q25 = 0.5 at a=20 needs
// b ~ 3e5). This unlocks every visually distinct shape; beyond a ~ 22 mid-scale
// quantiles need b > 1e6 (an inherent 1/(1-(1-p)^(1/b))^(1/a) asymptote), and
// those leftovers are razor-band bumps. jStat's kumaraswamy.mean uses raw
// gammafn, which overflows at b >= 171, so the mean is computed via gammaln.
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const A_MIN = 0.02;
const A_MAX = 2000;
const B_MIN = 0.02;
const B_MAX = 1e6;
const EDGE = 0.001; // quantile/mean clamp off the [0,1] edges

// mean(a,b) = b*Gamma(1+1/a)*Gamma(b)/Gamma(1+1/a+b), evaluated in log space so
// it stays finite for b up to B_MAX (gammafn(>=171) overflows to Infinity).
const mean = (p) =>
  p.b * Math.exp(jStat.gammaln(1 + 1 / p.a) + jStat.gammaln(p.b) - jStat.gammaln(1 + 1 / p.a + p.b));

// mean(a) at fixed b is monotone increasing (0 -> 1): bisect for a.
function solveAForMean(target, b) {
  const f = (a) => jStat.kumaraswamy.mean(a, b) - target;
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

// Closed-form b for a fixed quantile q at given a: b = ln(1-p)/ln(1-q^a).
// Monotone decreasing in q (b -> 0 as q -> 1, b -> inf as q -> 0).
function solveBForQuantile(q, target, a) {
  const t = Math.min(1 - EDGE, Math.max(EDGE, target));
  const b = Math.log(1 - q) / Math.log(1 - Math.pow(t, a));
  return Math.min(B_MAX, Math.max(B_MIN, b));
}

function translateAtB(p, x) {
  const b = p.b;
  const t = Math.min(1 - EDGE, Math.max(EDGE, x));
  return { a: solveAForMean(t, b), b };
}

function reshapeAtA(p, q, x) {
  const a = p.a;
  return { a, b: solveBForQuantile(q, x, a) };
}

const F = {
  name: "kumaraswamy",
  label: "Kumaraswamy",
  defaults: { a: 2, b: 2 },
  support: () => [0, 1],
  bounds: () => [0, 1],
  integ: () => [0, 1],
  pdf(p, x) {
    if (x <= 0 || x >= 1) return 0;
    return jStat.kumaraswamy.pdf(x, p.a, p.b);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at: (p) => mean(p),
      chip: () => "mean",
      drag: (p, x) => translateAtB(p, x),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.kumaraswamy.inv(0.25, p.a, p.b),
      chip: () => "q25",
      drag: (p, x) => reshapeAtA(p, 0.25, x),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.kumaraswamy.inv(0.75, p.a, p.b),
      chip: () => "q75",
      drag: (p, x) => reshapeAtA(p, 0.75, x),
    },
  ],
  tip(p) {
    return `${F.label} (fixed [0,1]) \u2022 drag mean to translate \u2022 drag q25/q75 to reshape \u2022 a=${fmt(p.a)} b=${fmt(p.b)}`;
  },
};

export default createWidget(F, { pins: "both" });