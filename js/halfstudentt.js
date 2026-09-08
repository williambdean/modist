// halfstudentt.js - HalfStudentT((nu, sigma)) interactive widget, left edge
// pinned at 0, mirroring studentt.js but folded to the positive half-axis:
// pdf(x) = 2 t_nu(x/sigma)/sigma. The center dot sits at the median
// sigma*t_{nu}(0.75); drag it to re-set the scale at the current nu. The tails
// dial changes nu (fat tails when dragged up).
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const NU_MIN = 2.01;
const NU_MAX = 50;
const SIG_MIN = 1e-6;
const SIG_MAX = 1e6;

function t75(nu) {
  return jStat.studentt.inv(0.75, nu);
}
// right-tail view width, normalized so nu -> infty reproduces the
// HalfNormal view width (5.2 sigma)
const TAIL_FACTOR = 5.2 / 1.96;
function tBounds(p) {
  return TAIL_FACTOR * p.sigma * jStat.studentt.inv(0.975, p.nu);
}

const F = {
  name: "halfstudentt",
  label: "HalfStudentT",
  defaults: { nu: 5, sigma: 1 },
  support() {
    return [0, null]; // left edge pinned at 0
  },
  bounds(p) {
    return [0, tBounds(p)];
  },
  integ(p) {
    return [0, 1.15 * tBounds(p)];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return 2 * jStat.studentt.pdf(x / p.sigma, p.nu) / p.sigma;
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) { return p.sigma * t75(p.nu); },
      chip() { return "median"; },
      drag(p, x, y, d) {
        const span = (d ? d[1] - d[0] : 1) || 1;
        const xc = Math.max(x, 0.01 * span);
        const sigma = xc / t75(p.nu);
        return { sigma: Math.min(SIG_MAX, Math.max(SIG_MIN, sigma)) };
      },
    },
    {
      kind: "tails",
      icon: "dial",
      color: "#8b5cf6",
      axes: ["y"],
      // dial position: top (0) = fat tails (low nu), bottom (1) = near-Normal
      yOf(p) {
        return (p.nu - NU_MIN) / (NU_MAX - NU_MIN);
      },
      chip() { return "tails"; },
      drag(p, x, y) {
        return { nu: NU_MIN + y * (NU_MAX - NU_MIN) };
      },
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag median \u25cf to translate \u2022 drag the tails dial up for fatter, down for thinner \u2022 nu=${fmt(p.nu)} sigma=${fmt(p.sigma)}`;
  },
};

export default createWidget(F, { pins: "left" });