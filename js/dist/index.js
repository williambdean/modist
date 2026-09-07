// js/dist/index.js - standalone client-side entry for JS-only consumers.
// Wraps the four anywidget front-end modules with a tiny reactive model so they
// render outside anywidget/marimo hosts, and injects the shared styles once.
// Bundled to dist/modist.js (built by build.js); exported as named factories:
//
//   import { beta } from "https://williambdean.github.io/modist/latest/modist.js";
//   const w = beta(document.getElementById("prior"), { alpha: 1, beta: 3 });
//   w.onChange((p) => console.log(p));
//   w.set({ alpha: 2 });      // redraws + notifies
//   w.params;                 // { alpha: 2, beta: 3 }
//   w.reset();                // back to family defaults
//   w.destroy();              // clear the container (framework unmount)
//
// CSS uses only var() fallbacks (no host theme required), so the widget renders
// correctly on any page; the stylesheet is injected once per document.
import styleText from "__modist_css__";
import normalWidget from "../normal.js";
import betaWidget from "../beta.js";
import gammaWidget from "../gamma.js";
import studenttWidget from "../studentt.js";

const FAMILIES = {
  normal: { widget: normalWidget, defaults: { mu: 0, sigma: 1 } },
  beta: { widget: betaWidget, defaults: { alpha: 2, beta: 2 } },
  gamma: { widget: gammaWidget, defaults: { alpha: 2, beta: 2 } },
  studentt: { widget: studenttWidget, defaults: { mu: 0, sigma: 1, nu: 5 } },
};

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-modist", "");
  style.textContent = styleText;
  (document.head || document.documentElement).appendChild(style);
}

// Minimal anywidget model contract (get/set/on/save_changes) - the same surface
// anywidget hosts provide. base.js redraws on "change:<trait>" events, and
// save_changes is the notification point the widget calls after a drag/reset.
function makeModel(initial) {
  const values = { ...initial };
  const listeners = new Map();
  return {
    values,
    get: (k) => values[k],
    set: (k, v) => {
      values[k] = v;
    },
    on: (event, fn) => {
      const bucket = listeners.get(event) || [];
      bucket.push(fn);
      listeners.set(event, bucket);
    },
    save_changes: () => {
      const snapshot = { ...values };
      for (const fns of listeners.values()) for (const fn of fns) fn(snapshot);
    },
    _listeners: listeners,
  };
}

function instantiate(family, el, params, name) {
  injectStyles();
  if (!el || typeof el.appendChild !== "function") {
    throw new TypeError(
      `modist.${name}: expected an element to mount into, got ${String(el)}`
    );
  }
  const { widget, defaults } = FAMILIES[family];
  const model = makeModel({ ...defaults, ...(params || {}) });
  widget.render({ model, el });
  return {
    el,
    // live snapshot: a fresh object on each read (consumers can't mutate state)
    get params() {
      return { ...model.values };
    },
    set(partial) {
      let changed = false;
      for (const k of Object.keys(partial || {})) {
        if (!(k in model.values)) continue;
        if (partial[k] !== model.values[k]) {
          model.set(k, partial[k]);
          changed = true;
        }
      }
      if (changed) model.save_changes();
      return this;
    },
    reset() {
      return this.set(defaults);
    },
    onChange(fn) {
      const bucket = model._listeners.get("__modist") || [];
      bucket.push(fn);
      model._listeners.set("__modist", bucket);
      return () => {
        const b = model._listeners.get("__modist");
        if (!b) return;
        const i = b.indexOf(fn);
        if (i >= 0) b.splice(i, 1);
      };
    },
    destroy() {
      el.replaceChildren();
    },
  };
}

export function normal(el, params) {
  return instantiate("normal", el, params, "normal");
}
export function beta(el, params) {
  return instantiate("beta", el, params, "beta");
}
export function gamma(el, params) {
  return instantiate("gamma", el, params, "gamma");
}
export function studentT(el, params) {
  return instantiate("studentt", el, params, "studentT");
}