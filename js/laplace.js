// laplace.js - Laplace((mu, b=scale)) interactive widget.
// The center dot sits at the mean (mu); the q75 square at mu + b*ln(2) (the
// Laplace q75 is exactly one ln(2) of scale from the mean).
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const LN2 = Math.LN2;
const SD_FACTOR = Math.SQRT2; // sd = sqrt(2) b
const B_MIN = 1e-6;
const B_MAX = 1e6;

const F = {
  name: "laplace",
  label: "Laplace",
  defaults: { mu: 0, b: 1 },
  support() {
    return [null, null]; // unbounded
  },
  bounds(p) {
    const w = 5.2 * SD_FACTOR * p.b;
    return [p.mu - w, p.mu + w];
  },
  integ(p) {
    const w = 7.5 * SD_FACTOR * p.b;
    return [p.mu - w, p.mu + w];
  },
  pdf(p, x) {
    return jStat.laplace.pdf(x, p.mu, p.b);
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
      at(p) { return p.mu + LN2 * p.b; },
      chip() { return "q75"; },
      drag(p, x) {
        const b = Math.max(B_MIN, Math.min(B_MAX, Math.abs(x - p.mu) / LN2));
        return { b };
      },
    },
  ],
  tip(p) {
    return `${F.label} \u2022 drag mean to shift \u2022 drag q75 to reshape \u2022 mu=${fmt(p.mu)} b=${fmt(p.b)}`;
  },
};

export default createWidget(F, { pins: "none" });