// cauchy.js - Cauchy((alpha=location, beta=scale)) interactive widget.
// The center dot sits at the median (alpha); the q75 square at alpha+beta
// (the Cauchy q75 is exactly one scale from the median). There is no mean, so
// the widget is median/spread driven.
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const B_MIN = 1e-6;
const B_MAX = 1e6;

const F = {
  name: "cauchy",
  label: "Cauchy",
  defaults: { alpha: 0, beta: 1 },
  support() {
    return [null, null]; // unbounded
  },
  bounds(p) {
    return [p.alpha - 5.2 * p.beta, p.alpha + 5.2 * p.beta];
  },
  integ(p) {
    return [p.alpha - 8 * p.beta, p.alpha + 8 * p.beta];
  },
  pdf(p, x) {
    return jStat.cauchy.pdf(x, p.alpha, p.beta);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) { return p.alpha; },
      chip() { return "median"; },
      drag(p, x) { return { alpha: x }; },
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#f97316",
      lineCls: "mstd",
      at(p) { return p.alpha + p.beta; },
      chip() { return "q75"; },
      drag(p, x) {
        const beta = Math.max(B_MIN, Math.min(B_MAX, Math.abs(x - p.alpha)));
        return { beta };
      },
    },
  ],
  tip(p) {
    return `${F.label} \u2022 drag median to shift \u2022 drag q75 to reshape \u2022 alpha=${fmt(p.alpha)} beta=${fmt(p.beta)}`;
  },
};

export default createWidget(F, { pins: "none" });