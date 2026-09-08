// halfnormal.js - HalfNormal((sigma)) interactive widget, left edge pinned at 0.
// The curve is a folded Normal(0, sigma): pdf(x) = 2*normal.pdf(x, 0, sigma).
// A single square sits at 1 sigma (the Normal widget's +1σ handle); drag it to
// re-set sigma.
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const SIG_MIN = 1e-6;
const SIG_MAX = 1e6;

const F = {
  name: "halfnormal",
  label: "HalfNormal",
  defaults: { sigma: 1 },
  support() {
    return [0, null]; // left edge pinned at 0
  },
  bounds(p) {
    return [0, 5.2 * p.sigma];
  },
  integ(p) {
    return [0, 6.5 * p.sigma];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return 2 * jStat.normal.pdf(x, 0, p.sigma);
  },
  handles: [
    {
      kind: "spread",
      icon: "sq",
      color: "#f97316",
      lineCls: "mstd",
      at(p) { return p.sigma; },
      chip() { return "1\u03c3"; },
      drag(p, x) {
        return { sigma: Math.min(SIG_MAX, Math.max(SIG_MIN, Math.abs(x))) };
      },
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag the 1\u03c3 square to reshape \u2022 sigma=${fmt(p.sigma)}`;
  },
};

export default createWidget(F, { pins: "left" });