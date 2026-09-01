// normal.js - Normal((mu, sigma)) interactive widget.
import jStat from "./vendor/jstat.esm.js";
import { createWidget, fmt } from "./base.js";

const TAU = 2 * Math.PI;

const F = {
  name: "normal",
  label: "Normal",
  defaults: { mu: 0, sigma: 1 },
  support() {
    return [null, null]; // unbounded
  },
  bounds(p) {
    return [p.mu - 5.2 * p.sigma, p.mu + 5.2 * p.sigma];
  },
  integ(p) {
    return [p.mu - 6 * p.sigma, p.mu + 6 * p.sigma];
  },
  pdf(p, x) {
    const z = (x - p.mu) / p.sigma;
    return Math.exp(-0.5 * z * z) / (p.sigma * Math.sqrt(TAU));
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) { return p.mu; },
      chip() { return "mean"; },
      drag(p, x) { return { mu: x }; },
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#f97316",
      lineCls: "mstd",
      at(p) { return p.mu - p.sigma; },
      chip() { return "\u22121\u03c3"; },
      drag(p, x) { return { sigma: Math.abs(x - p.mu) }; },
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#f97316",
      lineCls: "mstd",
      at(p) { return p.mu + p.sigma; },
      chip() { return "+1\u03c3"; },
      drag(p, x) { return { sigma: Math.abs(x - p.mu) }; },
    },
  ],
  tip(p) {
    return `${F.label} \u2022 drag mean line to reposition \u2022 drag \u25a0 to reshape \u2022 mu=${fmt(p.mu)} sigma=${fmt(p.sigma)}`;
  },
};

export default createWidget(F, { pins: "none" });
