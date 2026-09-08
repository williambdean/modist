// weibull.js - Weibull((alpha=shape, beta=scale)) interactive widget, left edge
// pinned at 0. The center dot sits at the median beta*(ln 2)^(1/alpha); drag it
// to re-set the scale at the current shape. The tails dial changes the shape
// (alpha), fattening the tail when dragged up (small alpha).
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const A_MIN = 0.4;
const A_MAX = 6;
const B_MIN = 1e-6;
const B_MAX = 1e6;
const LN2 = Math.LN2;

const mean = (p) => p.beta * jStat.gammafn(1 + 1 / p.alpha);
const sd = (p) => {
  const g1 = jStat.gammafn(1 + 1 / p.alpha);
  const g2 = jStat.gammafn(1 + 2 / p.alpha);
  return p.beta * Math.sqrt(g2 - g1 * g1);
};
const median = (p) => p.beta * Math.pow(LN2, 1 / p.alpha);

const F = {
  name: "weibull",
  label: "Weibull",
  defaults: { alpha: 2, beta: 1 },
  support() {
    return [0, null]; // left edge pinned at 0
  },
  bounds(p) {
    return [0, mean(p) + 5.2 * sd(p)];
  },
  integ(p) {
    return [0, mean(p) + 8 * sd(p)];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return jStat.weibull.pdf(x, p.beta, p.alpha);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) { return median(p); },
      chip() { return "median"; },
      drag(p, x, y, d) {
        const span = (d ? d[1] - d[0] : 1) || 1;
        const xc = Math.max(x, 0.01 * span);
        const beta = xc / Math.pow(LN2, 1 / p.alpha);
        return { beta: Math.min(B_MAX, Math.max(B_MIN, beta)) };
      },
    },
    {
      kind: "tails",
      icon: "dial",
      color: "#8b5cf6",
      axes: ["y"],
      // dial position: top (0) = fat tails (small alpha), bottom (1) = tight
      yOf(p) {
        return (p.alpha - A_MIN) / (A_MAX - A_MIN);
      },
      chip() { return "shape"; },
      drag(p, x, y) {
        return { alpha: A_MIN + y * (A_MAX - A_MIN) };
      },
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag median to translate \u2022 drag the shape dial up for fatter tails, down for thinner \u2022 alpha=${fmt(p.alpha)} beta=${fmt(p.beta)}`;
  },
};

export default createWidget(F, { pins: "left" });