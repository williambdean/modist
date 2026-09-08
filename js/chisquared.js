// chisquared.js - ChiSquared((nu)) interactive widget, left edge pinned at 0.
// A single center dot sits at the mean (nu); drag it to re-set the degrees of
// freedom.
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const NU_MIN = 0.25;
const NU_MAX = 200;

const F = {
  name: "chisquared",
  label: "ChiSquared",
  defaults: { nu: 3 },
  support() {
    return [0, null]; // left edge pinned at 0
  },
  bounds(p) {
    return [0, p.nu + 5.2 * Math.sqrt(2 * p.nu)];
  },
  integ(p) {
    return [0, p.nu + 8 * Math.sqrt(2 * p.nu)];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return jStat.chisquare.pdf(x, p.nu);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) { return p.nu; },
      chip() { return "mean"; },
      drag(p, x, y, d) {
        const span = (d ? d[1] - d[0] : 1) || 1;
        const xc = Math.max(x, 0.01 * span);
        return { nu: Math.min(NU_MAX, Math.max(NU_MIN, xc)) };
      },
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag the mean line to change the degrees of freedom \u2022 nu=${fmt(p.nu)}`;
  },
};

export default createWidget(F, { pins: "left" });