// beta.js - Beta((alpha, beta)) interactive widget on the fixed [0, 1] domain.
import jStat from "./vendor/jstat.esm.js";
import { createWidget, fmt } from "./base.js";

const K_MIN = 0.02;
const K_MAX = 400;

const mean = (p) => p.alpha / (p.alpha + p.beta);
const kappa = (p) => p.alpha + p.beta;

// Find kappa in [K_MIN, K_MAX] at fixed mean mu such that
//   jStat.beta.inv(q, kappa*mu, kappa*(1-mu)) == target.
// The quantile is monotonic in kappa (concentration at the mean), so we bisect.
function solveKappa(q, target, mu) {
  const f = (k) => jStat.beta.inv(q, k * mu, k * (1 - mu)) - target;
  const dir = Math.sign(f(K_MAX) - f(K_MIN)) || 1;
  const flow = f(K_MIN) * dir;
  const fhigh = f(K_MAX) * dir;
  if (flow > 0) return K_MIN;
  if (fhigh < 0) return K_MAX;
  let lo = K_MIN;
  let hi = K_MAX;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (f(m) * dir > 0) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
}

function translateAtKappa(p, x) {
  const k = kappa(p);
  const mu = Math.min(0.999, Math.max(0.001, x));
  return { alpha: k * mu, beta: k * (1 - mu) };
}

function spreadAtKappa(p, q, x) {
  const mu = mean(p);
  const k = solveKappa(q, x, mu);
  return { alpha: k * mu, beta: k * (1 - mu) };
}

const F = {
  name: "beta",
  label: "Beta",
  defaults: { alpha: 2, beta: 2 },
  support: () => [0, 1],
  bounds: () => [0, 1],
  integ: () => [0, 1],
  pdf(p, x) {
    if (x <= 0 || x >= 1) return 0;
    return jStat.beta.pdf(x, p.alpha, p.beta);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at: (p) => mean(p),
      chip: () => "mean",
      drag: (p, x) => translateAtKappa(p, x),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.beta.inv(0.25, p.alpha, p.beta),
      chip: () => "q25",
      drag: (p, x) => spreadAtKappa(p, 0.25, x),
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => jStat.beta.inv(0.75, p.alpha, p.beta),
      chip: () => "q75",
      drag: (p, x) => spreadAtKappa(p, 0.75, x),
    },
  ],
  tip(p) {
    return `${F.label} (fixed [0,1]) \u2022 drag mean to translate \u2022 drag q25/q75 to concentrate \u2022 alpha=${fmt(p.alpha)} beta=${fmt(p.beta)}`;
  },
};

export default createWidget(F, { pins: "both" });
