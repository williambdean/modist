// logistic.js - Logistic((mu, s=scale)) interactive widget.
// jStat has no logistic, so the pdf is the closed form e^z/(s(1+e^z)^2). The
// center dot sits at the mean (mu); the q75 square at mu + s*ln(3) (logit(0.75)
// = ln 3).
import { createWidget, fmt } from "./base.js";

const LN3 = Math.log(3);
const SD_FACTOR = Math.PI / Math.sqrt(3); // sd = pi*s/sqrt(3)
const S_MIN = 1e-6;
const S_MAX = 1e6;

const F = {
  name: "logistic",
  label: "Logistic",
  defaults: { mu: 0, s: 1 },
  support() {
    return [null, null]; // unbounded
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
      at(p) { return p.mu; },
      chip() { return "mean"; },
      drag(p, x) { return { mu: x }; },
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#f97316",
      lineCls: "mstd",
      at(p) { return p.mu + LN3 * p.s; },
      chip() { return "q75"; },
      drag(p, x) {
        const s = Math.max(S_MIN, Math.min(S_MAX, Math.abs(x - p.mu) / LN3));
        return { s };
      },
    },
  ],
  tip(p) {
    return `${F.label} \u2022 drag mean to shift \u2022 drag q75 to reshape \u2022 mu=${fmt(p.mu)} s=${fmt(p.s)}`;
  },
};

export default createWidget(F, { pins: "none" });