// exponential.js - Exponential((lam)) interactive widget, left edge pinned at 0.
// A single center dot sits at the mean (1/lam); drag it to change the rate.
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const LAM_MIN = 1e-6;
const LAM_MAX = 1e6;

const F = {
  name: "exponential",
  label: "Exponential",
  defaults: { lam: 1 },
  support() {
    return [0, null]; // left edge pinned at 0
  },
  bounds(p) {
    const m = 1 / p.lam;
    return [0, m + 5.2 * m];
  },
  integ(p) {
    const m = 1 / p.lam;
    return [0, m + 9 * m];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return jStat.exponential.pdf(x, p.lam);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) { return 1 / p.lam; },
      chip() { return "mean"; },
      drag(p, x, y, d) {
        const span = (d ? d[1] - d[0] : 1) || 1;
        const xc = Math.max(x, 0.01 * span);
        return { lam: Math.min(LAM_MAX, Math.max(LAM_MIN, 1 / xc)) };
      },
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag the mean line to change the rate \u2022 lam=${fmt(p.lam)}`;
  },
};

export default createWidget(F, { pins: "left" });