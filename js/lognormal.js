// lognormal.js - LogNormal((mu, sigma)) interactive widget, left edge pinned at 0.
// mu is the log-mean (so the median is e^mu), sigma the log-sd. The center dot
// sits at the median; drag it to re-set the log-mean. The q75 square sits at
// e^(mu + sigma*z75); drag it to re-set the log-sd.
import jStat from "jstat";
import { createWidget, fmt } from "./base.js";

const Z75 = 0.6744897501960817;
const MU_MIN = -50;
const MU_MAX = 50;
const SIG_MIN = 0.02;
const SIG_MAX = 5;

const q75 = (p) => Math.exp(p.mu + Z75 * p.sigma);
// View edge where the density has descended to VIS_EPS of its peak: solving
// pdf(x) = eps*pdf(mode) gives (ln x - mu) = (Z_VIS - sigma)*sigma, which is
// bounded for every sigma (the widest view is at sigma = Z_VIS/2). The linear
// moments mean = e^(mu+sigma^2/2) and sd ~ mean*sqrt(e^(sigma^2)-1) are
// tail-dominated and grow ~ e^(sigma^2), blowing the axis to ~5e7 for the
// reported mu=1.43, sigma=3.84 while the curve sat in the first pixel.
const VIS_EPS = 0.001;
const Z_VIS = Math.sqrt(-2 * Math.log(VIS_EPS));
// When the curve collapses to a sliver (large sigma), floor the view on the
// q75 handle so the median dot and q75 square stay usable on-screen.
const HANDLE_MARGIN = 1.4;
const xmax = (p) =>
  Math.max(Math.exp(p.mu + (Z_VIS - p.sigma) * p.sigma), HANDLE_MARGIN * q75(p));

const F = {
  name: "lognormal",
  label: "LogNormal",
  defaults: { mu: 0, sigma: 1 },
  support() {
    return [0, null]; // left edge pinned at 0
  },
  bounds(p) {
    return [0, xmax(p)];
  },
  integ(p) {
    return [0, 1.3 * xmax(p)];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return jStat.lognormal.pdf(x, p.mu, p.sigma);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at(p) { return Math.exp(p.mu); },
      chip() { return "median"; },
      drag(p, x, y, d) {
        const span = (d ? d[1] - d[0] : 1) || 1;
        const xc = Math.max(x, 0.01 * span);
        return { mu: Math.min(MU_MAX, Math.max(MU_MIN, Math.log(xc))) };
      },
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#f97316",
      lineCls: "mstd",
      at(p) { return q75(p); },
      chip() { return "q75"; },
      drag(p, x, y, d) {
        const span = (d ? d[1] - d[0] : 1) || 1;
        const xc = Math.max(x, 0.01 * span);
        const sigma = (Math.log(xc) - p.mu) / Z75;
        return { sigma: Math.min(SIG_MAX, Math.max(SIG_MIN, sigma)) };
      },
    },
  ],
  tip(p) {
    return `${F.label} (edge at 0) \u2022 drag median to shift \u2022 drag q75 to reshape \u2022 mu=${fmt(p.mu)} sigma=${fmt(p.sigma)}`;
  },
};

export default createWidget(F, { pins: "left" });