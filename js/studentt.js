// studentt.js - StudentT((mu, sigma, nu)) interactive widget.
// Three labeled 1-D draggables: the mean is dragged left/right (mu), the q75
// square left/right (sigma), and the tails dial up/down (nu). The dial is not
// anchored to the curve, so dragging it never slides anything sideways. The
// view is based on the 97.5% tail quantile, so heavy tails (low nu) widen the
// plot only modestly and the bulk of the distribution stays visible.
import jStat from "./vendor/jstat.esm.js";
import { createWidget, fmt } from "./base.js";

const NU_MIN = 2.01;
const NU_MAX = 50;
const NU_COLOR = "#8b5cf6";

function t75(nu) {
  return jStat.studentt.inv(0.75, nu);
}
// 97.5% quantile, normalized so nu -> infty reproduces the Normal view (1.96)
const TAIL_FACTOR = 5.2 / 1.96;
function tBounds(p) {
  return TAIL_FACTOR * p.sigma * jStat.studentt.inv(0.975, p.nu);
}

const F = {
  name: "studentt",
  label: "StudentT",
  defaults: { mu: 0, sigma: 1, nu: 5 },
  support() {
    return [null, null]; // unbounded
  },
  bounds(p) {
    const w = tBounds(p);
    return [p.mu - w, p.mu + w];
  },
  integ(p) {
    const w = tBounds(p) * 1.15;
    return [p.mu - w, p.mu + w];
  },
  pdf(p, x) {
    // standard t (0,1) scaled/shifted: t_nu(z)/sigma
    const z = (x - p.mu) / p.sigma;
    return jStat.studentt.pdf(z, p.nu) / p.sigma;
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
      at(p) { return p.mu + p.sigma * t75(p.nu); },
      chip() { return "q75"; },
      drag(p, x) {
        const t = t75(p.nu);
        return { sigma: Math.abs((x - p.mu) / t) };
      },
    },
    {
      kind: "tails",
      icon: "dial",
      color: NU_COLOR,
      axes: ["y"],
      // dial position: top (0) = low nu (fatter tails), bottom (1) = high nu
      yOf(p) {
        return (p.nu - NU_MIN) / (NU_MAX - NU_MIN);
      },
      chip() { return "tails"; },
      // absolute mapping (base.js passes the pointer height across the dial
      // band, 0 = top): dragging up fattens the tails (lower nu) immediately.
      drag(p, x, y) {
        const nu = NU_MIN + y * (NU_MAX - NU_MIN);
        return { nu: Math.min(NU_MAX, Math.max(NU_MIN, nu)) };
      },
    },
  ],
  tip(p) {
    return `${F.label} \u2022 drag mean \u25cf to shift \u2022 drag \u25a0 left/right to spread \u2022 drag the tails dial up for fatter, down for thinner \u2022 mu=${fmt(p.mu)} sigma=${fmt(p.sigma)} nu=${fmt(p.nu)}`;
  },
};

export default createWidget(F, { pins: "none" });