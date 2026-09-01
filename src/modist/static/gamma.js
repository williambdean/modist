// js/vendor/jstat.esm.js
var F = Object.create;
var K = Object.defineProperty;
var Y = Object.getOwnPropertyDescriptor;
var D = Object.getOwnPropertyNames;
var X = Object.getPrototypeOf;
var M = Object.prototype.hasOwnProperty;
var S = (h, u) => () => (u || h((u = { exports: {} }).exports, u), u.exports);
var j = (h, u, f, q) => {
  if (u && typeof u == "object" || typeof u == "function") for (let p of D(u)) !M.call(h, p) && p !== f && K(h, p, { get: () => u[p], enumerable: !(q = Y(u, p)) || q.enumerable });
  return h;
};
var rr = (h, u, f) => (f = h != null ? F(X(h)) : {}, j(u || !h || !h.__esModule ? K(f, "default", { value: h, enumerable: true }) : f, h));
var B = S((Z, $) => {
  (function(h, u) {
    typeof Z == "object" ? $.exports = u() : typeof define == "function" && define.amd ? define(u) : h.jStat = u();
  })(Z, function() {
    var h = (function(u, f) {
      var q = Array.prototype.concat, p = Array.prototype.slice, w = Object.prototype.toString;
      function d(a, t) {
        var c = a > t ? a : t;
        return u.pow(10, 17 - ~~(u.log(c > 0 ? c : -c) * u.LOG10E));
      }
      var i = Array.isArray || function(t) {
        return w.call(t) === "[object Array]";
      };
      function r(a) {
        return w.call(a) === "[object Function]";
      }
      function n(a) {
        return typeof a == "number" ? a - a === 0 : false;
      }
      function e(a) {
        return q.apply([], a);
      }
      function o() {
        return new o._init(arguments);
      }
      o.fn = o.prototype, o._init = function(t) {
        if (i(t[0])) if (i(t[0][0])) {
          r(t[1]) && (t[0] = o.map(t[0], t[1]));
          for (var c = 0; c < t[0].length; c++) this[c] = t[0][c];
          this.length = t[0].length;
        } else this[0] = r(t[1]) ? o.map(t[0], t[1]) : t[0], this.length = 1;
        else if (n(t[0])) this[0] = o.seq.apply(null, t), this.length = 1;
        else {
          if (t[0] instanceof o) return o(t[0].toArray());
          this[0] = [], this.length = 1;
        }
        return this;
      }, o._init.prototype = o.prototype, o._init.constructor = o, o.utils = { calcRdx: d, isArray: i, isFunction: r, isNumber: n, toVector: e }, o._random_fn = u.random, o.setRandom = function(t) {
        if (typeof t != "function") throw new TypeError("fn is not a function");
        o._random_fn = t;
      }, o.extend = function(t) {
        var c, g;
        if (arguments.length === 1) {
          for (g in t) o[g] = t[g];
          return this;
        }
        for (c = 1; c < arguments.length; c++) for (g in arguments[c]) t[g] = arguments[c][g];
        return t;
      }, o.rows = function(t) {
        return t.length || 1;
      }, o.cols = function(t) {
        return t[0].length || 1;
      }, o.dimensions = function(t) {
        return { rows: o.rows(t), cols: o.cols(t) };
      }, o.row = function(t, c) {
        return i(c) ? c.map(function(g) {
          return o.row(t, g);
        }) : t[c];
      }, o.rowa = function(t, c) {
        return o.row(t, c);
      }, o.col = function(t, c) {
        if (i(c)) {
          var g = o.arange(t.length).map(function() {
            return new Array(c.length);
          });
          return c.forEach(function(_, k) {
            o.arange(t.length).forEach(function(R) {
              g[R][k] = t[R][_];
            });
          }), g;
        }
        for (var y = new Array(t.length), b = 0; b < t.length; b++) y[b] = [t[b][c]];
        return y;
      }, o.cola = function(t, c) {
        return o.col(t, c).map(function(g) {
          return g[0];
        });
      }, o.diag = function(t) {
        for (var c = o.rows(t), g = new Array(c), y = 0; y < c; y++) g[y] = [t[y][y]];
        return g;
      }, o.antidiag = function(t) {
        for (var c = o.rows(t) - 1, g = new Array(c), y = 0; c >= 0; c--, y++) g[y] = [t[y][c]];
        return g;
      }, o.transpose = function(t) {
        var c = [], g, y, b, _, k;
        for (i(t[0]) || (t = [t]), y = t.length, b = t[0].length, k = 0; k < b; k++) {
          for (g = new Array(y), _ = 0; _ < y; _++) g[_] = t[_][k];
          c.push(g);
        }
        return c.length === 1 ? c[0] : c;
      }, o.map = function(t, c, g) {
        var y, b, _, k, R;
        for (i(t[0]) || (t = [t]), b = t.length, _ = t[0].length, k = g ? t : new Array(b), y = 0; y < b; y++) for (k[y] || (k[y] = new Array(_)), R = 0; R < _; R++) k[y][R] = c(t[y][R], y, R);
        return k.length === 1 ? k[0] : k;
      }, o.cumreduce = function(t, c, g) {
        var y, b, _, k, R;
        for (i(t[0]) || (t = [t]), b = t.length, _ = t[0].length, k = g ? t : new Array(b), y = 0; y < b; y++) for (k[y] || (k[y] = new Array(_)), _ > 0 && (k[y][0] = t[y][0]), R = 1; R < _; R++) k[y][R] = c(k[y][R - 1], t[y][R]);
        return k.length === 1 ? k[0] : k;
      }, o.alter = function(t, c) {
        return o.map(t, c, true);
      }, o.create = function(t, c, g) {
        var y = new Array(t), b, _;
        for (r(c) && (g = c, c = t), b = 0; b < t; b++) for (y[b] = new Array(c), _ = 0; _ < c; _++) y[b][_] = g(b, _);
        return y;
      };
      function s() {
        return 0;
      }
      o.zeros = function(t, c) {
        return n(c) || (c = t), o.create(t, c, s);
      };
      function l() {
        return 1;
      }
      o.ones = function(t, c) {
        return n(c) || (c = t), o.create(t, c, l);
      }, o.rand = function(t, c) {
        return n(c) || (c = t), o.create(t, c, o._random_fn);
      };
      function v(a, t) {
        return a === t ? 1 : 0;
      }
      o.identity = function(t, c) {
        return n(c) || (c = t), o.create(t, c, v);
      }, o.symmetric = function(t) {
        var c = t.length, g, y;
        if (t.length !== t[0].length) return false;
        for (g = 0; g < c; g++) for (y = 0; y < c; y++) if (t[y][g] !== t[g][y]) return false;
        return true;
      }, o.clear = function(t) {
        return o.alter(t, s);
      }, o.seq = function(t, c, g, y) {
        r(y) || (y = false);
        var b = [], _ = d(t, c), k = (c * _ - t * _) / ((g - 1) * _), R = t, z;
        for (z = 0; R <= c && z < g; z++, R = (t * _ + k * _ * z) / _) b.push(y ? y(R, z) : R);
        return b;
      }, o.arange = function(t, c, g) {
        var y = [], b;
        if (g = g || 1, c === f && (c = t, t = 0), t === c || g === 0) return [];
        if (t < c && g < 0) return [];
        if (t > c && g > 0) return [];
        if (g > 0) for (b = t; b < c; b += g) y.push(b);
        else for (b = t; b > c; b += g) y.push(b);
        return y;
      }, o.slice = /* @__PURE__ */ (function() {
        function a(c, g, y, b) {
          var _, k = [], R = c.length;
          if (g === f && y === f && b === f) return o.copy(c);
          if (g = g || 0, y = y || c.length, g = g >= 0 ? g : R + g, y = y >= 0 ? y : R + y, b = b || 1, g === y || b === 0) return [];
          if (g < y && b < 0) return [];
          if (g > y && b > 0) return [];
          if (b > 0) for (_ = g; _ < y; _ += b) k.push(c[_]);
          else for (_ = g; _ > y; _ += b) k.push(c[_]);
          return k;
        }
        function t(c, g) {
          var y, b;
          if (g = g || {}, n(g.row)) {
            if (n(g.col)) return c[g.row][g.col];
            var _ = o.rowa(c, g.row);
            return y = g.col || {}, a(_, y.start, y.end, y.step);
          }
          if (n(g.col)) {
            var k = o.cola(c, g.col);
            return b = g.row || {}, a(k, b.start, b.end, b.step);
          }
          b = g.row || {}, y = g.col || {};
          var R = a(c, b.start, b.end, b.step);
          return R.map(function(z) {
            return a(z, y.start, y.end, y.step);
          });
        }
        return t;
      })(), o.sliceAssign = function(t, c, g) {
        var y, b;
        if (n(c.row)) {
          if (n(c.col)) return t[c.row][c.col] = g;
          c.col = c.col || {}, c.col.start = c.col.start || 0, c.col.end = c.col.end || t[0].length, c.col.step = c.col.step || 1, y = o.arange(c.col.start, u.min(t.length, c.col.end), c.col.step);
          var _ = c.row;
          return y.forEach(function(R, z) {
            t[_][R] = g[z];
          }), t;
        }
        if (n(c.col)) {
          c.row = c.row || {}, c.row.start = c.row.start || 0, c.row.end = c.row.end || t.length, c.row.step = c.row.step || 1, b = o.arange(c.row.start, u.min(t[0].length, c.row.end), c.row.step);
          var k = c.col;
          return b.forEach(function(R, z) {
            t[R][k] = g[z];
          }), t;
        }
        return g[0].length === f && (g = [g]), c.row.start = c.row.start || 0, c.row.end = c.row.end || t.length, c.row.step = c.row.step || 1, c.col.start = c.col.start || 0, c.col.end = c.col.end || t[0].length, c.col.step = c.col.step || 1, b = o.arange(c.row.start, u.min(t.length, c.row.end), c.row.step), y = o.arange(c.col.start, u.min(t[0].length, c.col.end), c.col.step), b.forEach(function(R, z) {
          y.forEach(function(A, I) {
            t[R][A] = g[z][I];
          });
        }), t;
      }, o.diagonal = function(t) {
        var c = o.zeros(t.length, t.length);
        return t.forEach(function(g, y) {
          c[y][y] = g;
        }), c;
      }, o.copy = function(t) {
        return t.map(function(c) {
          return n(c) ? c : c.map(function(g) {
            return g;
          });
        });
      };
      var m = o.prototype;
      return m.length = 0, m.push = Array.prototype.push, m.sort = Array.prototype.sort, m.splice = Array.prototype.splice, m.slice = Array.prototype.slice, m.toArray = function() {
        return this.length > 1 ? p.call(this) : p.call(this)[0];
      }, m.map = function(t, c) {
        return o(o.map(this, t, c));
      }, m.cumreduce = function(t, c) {
        return o(o.cumreduce(this, t, c));
      }, m.alter = function(t) {
        return o.alter(this, t), this;
      }, (function(a) {
        for (var t = 0; t < a.length; t++) (function(c) {
          m[c] = function(g) {
            var y = this, b;
            return g ? (setTimeout(function() {
              g.call(y, m[c].call(y));
            }), this) : (b = o[c](this), i(b) ? o(b) : b);
          };
        })(a[t]);
      })("transpose clear symmetric rows cols dimensions diag antidiag".split(" ")), (function(a) {
        for (var t = 0; t < a.length; t++) (function(c) {
          m[c] = function(g, y) {
            var b = this;
            return y ? (setTimeout(function() {
              y.call(b, m[c].call(b, g));
            }), this) : o(o[c](this, g));
          };
        })(a[t]);
      })("row col".split(" ")), (function(a) {
        for (var t = 0; t < a.length; t++) (function(c) {
          m[c] = function() {
            return o(o[c].apply(null, arguments));
          };
        })(a[t]);
      })("create zeros ones rand identity".split(" ")), o;
    })(Math);
    return (function(u, f) {
      var q = u.utils.isFunction;
      function p(i, r) {
        return i - r;
      }
      function w(i, r, n) {
        return f.max(r, f.min(i, n));
      }
      u.sum = function(r) {
        for (var n = 0, e = r.length; --e >= 0; ) n += r[e];
        return n;
      }, u.sumsqrd = function(r) {
        for (var n = 0, e = r.length; --e >= 0; ) n += r[e] * r[e];
        return n;
      }, u.sumsqerr = function(r) {
        for (var n = u.mean(r), e = 0, o = r.length, s; --o >= 0; ) s = r[o] - n, e += s * s;
        return e;
      }, u.sumrow = function(r) {
        for (var n = 0, e = r.length; --e >= 0; ) n += r[e];
        return n;
      }, u.product = function(r) {
        for (var n = 1, e = r.length; --e >= 0; ) n *= r[e];
        return n;
      }, u.min = function(r) {
        for (var n = r[0], e = 0; ++e < r.length; ) r[e] < n && (n = r[e]);
        return n;
      }, u.max = function(r) {
        for (var n = r[0], e = 0; ++e < r.length; ) r[e] > n && (n = r[e]);
        return n;
      }, u.unique = function(r) {
        for (var n = {}, e = [], o = 0; o < r.length; o++) n[r[o]] || (n[r[o]] = true, e.push(r[o]));
        return e;
      }, u.mean = function(r) {
        return u.sum(r) / r.length;
      }, u.meansqerr = function(r) {
        return u.sumsqerr(r) / r.length;
      }, u.geomean = function(r) {
        var n = r.map(f.log), e = u.mean(n);
        return f.exp(e);
      }, u.median = function(r) {
        var n = r.length, e = r.slice().sort(p);
        return n & 1 ? e[n / 2 | 0] : (e[n / 2 - 1] + e[n / 2]) / 2;
      }, u.cumsum = function(r) {
        return u.cumreduce(r, function(n, e) {
          return n + e;
        });
      }, u.cumprod = function(r) {
        return u.cumreduce(r, function(n, e) {
          return n * e;
        });
      }, u.diff = function(r) {
        var n = [], e = r.length, o;
        for (o = 1; o < e; o++) n.push(r[o] - r[o - 1]);
        return n;
      }, u.rank = function(i) {
        var r, n = [], e = {};
        for (r = 0; r < i.length; r++) {
          var o = i[r];
          e[o] ? e[o]++ : (e[o] = 1, n.push(o));
        }
        var s = n.sort(p), l = {}, v = 1;
        for (r = 0; r < s.length; r++) {
          var o = s[r], m = e[o], a = v, t = v + m - 1, c = (a + t) / 2;
          l[o] = c, v += m;
        }
        return i.map(function(g) {
          return l[g];
        });
      }, u.mode = function(r) {
        var n = r.length, e = r.slice().sort(p), o = 1, s = 0, l = 0, v = [], m;
        for (m = 0; m < n; m++) e[m] === e[m + 1] ? o++ : (o > s ? (v = [e[m]], s = o, l = 0) : o === s && (v.push(e[m]), l++), o = 1);
        return l === 0 ? v[0] : v;
      }, u.range = function(r) {
        return u.max(r) - u.min(r);
      }, u.variance = function(r, n) {
        return u.sumsqerr(r) / (r.length - (n ? 1 : 0));
      }, u.pooledvariance = function(r) {
        var n = r.reduce(function(o, s) {
          return o + u.sumsqerr(s);
        }, 0), e = r.reduce(function(o, s) {
          return o + s.length;
        }, 0);
        return n / (e - r.length);
      }, u.deviation = function(i) {
        for (var r = u.mean(i), n = i.length, e = new Array(n), o = 0; o < n; o++) e[o] = i[o] - r;
        return e;
      }, u.stdev = function(r, n) {
        return f.sqrt(u.variance(r, n));
      }, u.pooledstdev = function(r) {
        return f.sqrt(u.pooledvariance(r));
      }, u.meandev = function(r) {
        for (var n = u.mean(r), e = [], o = r.length - 1; o >= 0; o--) e.push(f.abs(r[o] - n));
        return u.mean(e);
      }, u.meddev = function(r) {
        for (var n = u.median(r), e = [], o = r.length - 1; o >= 0; o--) e.push(f.abs(r[o] - n));
        return u.median(e);
      }, u.coeffvar = function(r) {
        return u.stdev(r) / u.mean(r);
      }, u.quartiles = function(r) {
        var n = r.length, e = r.slice().sort(p);
        return [e[f.round(n / 4) - 1], e[f.round(n / 2) - 1], e[f.round(n * 3 / 4) - 1]];
      }, u.quantiles = function(r, n, e, o) {
        var s = r.slice().sort(p), l = [n.length], v = r.length, m, a, t, c, g, y;
        for (typeof e > "u" && (e = 3 / 8), typeof o > "u" && (o = 3 / 8), m = 0; m < n.length; m++) a = n[m], t = e + a * (1 - e - o), c = v * a + t, g = f.floor(w(c, 1, v - 1)), y = w(c - g, 0, 1), l[m] = (1 - y) * s[g - 1] + y * s[g];
        return l;
      }, u.percentile = function(r, n, e) {
        var o = r.slice().sort(p), s = n * (o.length + (e ? 1 : -1)) + (e ? 0 : 1), l = parseInt(s), v = s - l;
        return l + 1 < o.length ? o[l - 1] + v * (o[l] - o[l - 1]) : o[l - 1];
      }, u.percentileOfScore = function(r, n, e) {
        var o = 0, s = r.length, l = false, v, m;
        for (e === "strict" && (l = true), m = 0; m < s; m++) v = r[m], (l && v < n || !l && v <= n) && o++;
        return o / s;
      }, u.histogram = function(r, n) {
        n = n || 4;
        var e = u.min(r), o = (u.max(r) - e) / n, s = r.length, l = [], v;
        for (v = 0; v < n; v++) l[v] = 0;
        for (v = 0; v < s; v++) l[f.min(f.floor((r[v] - e) / o), n - 1)] += 1;
        return l;
      }, u.covariance = function(r, n) {
        var e = u.mean(r), o = u.mean(n), s = r.length, l = new Array(s), v;
        for (v = 0; v < s; v++) l[v] = (r[v] - e) * (n[v] - o);
        return u.sum(l) / (s - 1);
      }, u.corrcoeff = function(r, n) {
        return u.covariance(r, n) / u.stdev(r, 1) / u.stdev(n, 1);
      }, u.spearmancoeff = function(i, r) {
        return i = u.rank(i), r = u.rank(r), u.corrcoeff(i, r);
      }, u.stanMoment = function(r, n) {
        for (var e = u.mean(r), o = u.stdev(r), s = r.length, l = 0, v = 0; v < s; v++) l += f.pow((r[v] - e) / o, n);
        return l / r.length;
      }, u.skewness = function(r) {
        return u.stanMoment(r, 3);
      }, u.kurtosis = function(r) {
        return u.stanMoment(r, 4) - 3;
      };
      var d = u.prototype;
      (function(i) {
        for (var r = 0; r < i.length; r++) (function(n) {
          d[n] = function(e, o) {
            var s = [], l = 0, v = this;
            if (q(e) && (o = e, e = false), o) return setTimeout(function() {
              o.call(v, d[n].call(v, e));
            }), this;
            if (this.length > 1) {
              for (v = e === true ? this : this.transpose(); l < v.length; l++) s[l] = u[n](v[l]);
              return s;
            }
            return u[n](this[0], e);
          };
        })(i[r]);
      })("cumsum cumprod".split(" ")), (function(i) {
        for (var r = 0; r < i.length; r++) (function(n) {
          d[n] = function(e, o) {
            var s = [], l = 0, v = this;
            if (q(e) && (o = e, e = false), o) return setTimeout(function() {
              o.call(v, d[n].call(v, e));
            }), this;
            if (this.length > 1) {
              for (n !== "sumrow" && (v = e === true ? this : this.transpose()); l < v.length; l++) s[l] = u[n](v[l]);
              return e === true ? u[n](u.utils.toVector(s)) : s;
            }
            return u[n](this[0], e);
          };
        })(i[r]);
      })("sum sumsqrd sumsqerr sumrow product min max unique mean meansqerr geomean median diff rank mode range variance deviation stdev meandev meddev coeffvar quartiles histogram skewness kurtosis".split(" ")), (function(i) {
        for (var r = 0; r < i.length; r++) (function(n) {
          d[n] = function() {
            var e = [], o = 0, s = this, l = Array.prototype.slice.call(arguments), v;
            if (q(l[l.length - 1])) {
              v = l[l.length - 1];
              var m = l.slice(0, l.length - 1);
              return setTimeout(function() {
                v.call(s, d[n].apply(s, m));
              }), this;
            } else {
              v = void 0;
              var a = function(c) {
                return u[n].apply(s, [c].concat(l));
              };
            }
            if (this.length > 1) {
              for (s = s.transpose(); o < s.length; o++) e[o] = a(s[o]);
              return e;
            }
            return a(this[0]);
          };
        })(i[r]);
      })("quantiles percentileOfScore".split(" "));
    })(h, Math), (function(u, f) {
      u.gammaln = function(p) {
        var w = 0, d = [76.18009172947146, -86.50532032941678, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -5395239384953e-18], i = 1.000000000190015, r, n, e;
        for (e = (n = r = p) + 5.5, e -= (r + 0.5) * f.log(e); w < 6; w++) i += d[w] / ++n;
        return f.log(2.5066282746310007 * i / r) - e;
      }, u.loggam = function(p) {
        var w, d, i, r, n, e, o, s = [0.08333333333333333, -0.002777777777777778, 7936507936507937e-19, -5952380952380952e-19, 8417508417508418e-19, -0.001917526917526918, 0.00641025641025641, -0.02955065359477124, 0.1796443723688307, -1.3924322169059];
        if (w = p, o = 0, p == 1 || p == 2) return 0;
        for (p <= 7 && (o = f.floor(7 - p), w = p + o), d = 1 / (w * w), i = 2 * f.PI, n = s[9], e = 8; e >= 0; e--) n *= d, n += s[e];
        if (r = n / w + 0.5 * f.log(i) + (w - 0.5) * f.log(w) - w, p <= 7) for (e = 1; e <= o; e++) r -= f.log(w - 1), w -= 1;
        return r;
      }, u.gammafn = function(p) {
        var w = [-1.716185138865495, 24.76565080557592, -379.80425647094563, 629.3311553128184, 866.9662027904133, -31451.272968848367, -36144.413418691176, 66456.14382024054], d = [-30.8402300119739, 315.35062697960416, -1015.1563674902192, -3107.771671572311, 22538.11842098015, 4755.846277527881, -134659.9598649693, -115132.2596755535], i = false, r = 0, n = 0, e = 0, o = p, s, l, v, m;
        if (p > 171.6243769536076) return 1 / 0;
        if (o <= 0) if (m = o % 1 + 36e-17, m) i = (o & 1 ? -1 : 1) * f.PI / f.sin(f.PI * m), o = 1 - o;
        else return 1 / 0;
        for (v = o, o < 1 ? l = o++ : l = (o -= r = (o | 0) - 1) - 1, s = 0; s < 8; ++s) e = (e + w[s]) * l, n = n * l + d[s];
        if (m = e / n + 1, v < o) m /= v;
        else if (v > o) for (s = 0; s < r; ++s) m *= o, o++;
        return i && (m = i / m), m;
      }, u.gammap = function(p, w) {
        return u.lowRegGamma(p, w) * u.gammafn(p);
      }, u.lowRegGamma = function(p, w) {
        var d = u.gammaln(p), i = p, r = 1 / p, n = r, e = w + 1 - p, o = 1 / 1e-30, s = 1 / e, l = s, v = 1, m = -~(f.log(p >= 1 ? p : 1 / p) * 8.5 + p * 0.4 + 17), a;
        if (w < 0 || p <= 0) return NaN;
        if (w < p + 1) {
          for (; v <= m; v++) r += n *= w / ++i;
          return r * f.exp(-w + p * f.log(w) - d);
        }
        for (; v <= m; v++) a = -v * (v - p), e += 2, s = a * s + e, o = e + a / o, s = 1 / s, l *= s * o;
        return 1 - l * f.exp(-w + p * f.log(w) - d);
      }, u.factorialln = function(p) {
        return p < 0 ? NaN : u.gammaln(p + 1);
      }, u.factorial = function(p) {
        return p < 0 ? NaN : u.gammafn(p + 1);
      }, u.combination = function(p, w) {
        return p > 170 || w > 170 ? f.exp(u.combinationln(p, w)) : u.factorial(p) / u.factorial(w) / u.factorial(p - w);
      }, u.combinationln = function(p, w) {
        return u.factorialln(p) - u.factorialln(w) - u.factorialln(p - w);
      }, u.permutation = function(p, w) {
        return u.factorial(p) / u.factorial(p - w);
      }, u.betafn = function(p, w) {
        if (!(p <= 0 || w <= 0)) return p + w > 170 ? f.exp(u.betaln(p, w)) : u.gammafn(p) * u.gammafn(w) / u.gammafn(p + w);
      }, u.betaln = function(p, w) {
        return u.gammaln(p) + u.gammaln(w) - u.gammaln(p + w);
      }, u.betacf = function(p, w, d) {
        var i = 1e-30, r = 1, n = w + d, e = w + 1, o = w - 1, s = 1, l = 1 - n * p / e, v, m, a, t;
        for (f.abs(l) < i && (l = i), l = 1 / l, t = l; r <= 100 && (v = 2 * r, m = r * (d - r) * p / ((o + v) * (w + v)), l = 1 + m * l, f.abs(l) < i && (l = i), s = 1 + m / s, f.abs(s) < i && (s = i), l = 1 / l, t *= l * s, m = -(w + r) * (n + r) * p / ((w + v) * (e + v)), l = 1 + m * l, f.abs(l) < i && (l = i), s = 1 + m / s, f.abs(s) < i && (s = i), l = 1 / l, a = l * s, t *= a, !(f.abs(a - 1) < 3e-7)); r++) ;
        return t;
      }, u.gammapinv = function(p, w) {
        var d = 0, i = w - 1, r = 1e-8, n = u.gammaln(w), e, o, s, l, v, m, a;
        if (p >= 1) return f.max(100, w + 100 * f.sqrt(w));
        if (p <= 0) return 0;
        for (w > 1 ? (m = f.log(i), a = f.exp(i * (m - 1) - n), v = p < 0.5 ? p : 1 - p, s = f.sqrt(-2 * f.log(v)), e = (2.30753 + s * 0.27061) / (1 + s * (0.99229 + s * 0.04481)) - s, p < 0.5 && (e = -e), e = f.max(1e-3, w * f.pow(1 - 1 / (9 * w) - e / (3 * f.sqrt(w)), 3))) : (s = 1 - w * (0.253 + w * 0.12), p < s ? e = f.pow(p / s, 1 / w) : e = 1 - f.log(1 - (p - s) / (1 - s))); d < 12; d++) {
          if (e <= 0) return 0;
          if (o = u.lowRegGamma(w, e) - p, w > 1 ? s = a * f.exp(-(e - i) + i * (f.log(e) - m)) : s = f.exp(-e + i * f.log(e) - n), l = o / s, e -= s = l / (1 - 0.5 * f.min(1, l * ((w - 1) / e - 1))), e <= 0 && (e = 0.5 * (e + s)), f.abs(s) < r * e) break;
        }
        return e;
      }, u.erf = function(p) {
        var w = [-1.3026537197817094, 0.6419697923564902, 0.019476473204185836, -0.00956151478680863, -946595344482036e-18, 366839497852761e-18, 42523324806907e-18, -20278578112534e-18, -1624290004647e-18, 130365583558e-17, 15626441722e-18, -85238095915e-18, 6529054439e-18, 5059343495e-18, -991364156e-18, -227365122e-18, 96467911e-18, 2394038e-18, -6886027e-18, 894487e-18, 313092e-18, -112708e-18, 381e-18, 7106e-18, -1523e-18, -94e-18, 121e-18, -28e-18], d = w.length - 1, i = false, r = 0, n = 0, e, o, s, l;
        for (p < 0 && (p = -p, i = true), e = 2 / (2 + p), o = 4 * e - 2; d > 0; d--) s = r, r = o * r - n + w[d], n = s;
        return l = e * f.exp(-p * p + 0.5 * (w[0] + o * r) - n), i ? l - 1 : 1 - l;
      }, u.erfc = function(p) {
        return 1 - u.erf(p);
      }, u.erfcinv = function(p) {
        var w = 0, d, i, r, n;
        if (p >= 2) return -100;
        if (p <= 0) return 100;
        for (n = p < 1 ? p : 2 - p, r = f.sqrt(-2 * f.log(n / 2)), d = -0.70711 * ((2.30753 + r * 0.27061) / (1 + r * (0.99229 + r * 0.04481)) - r); w < 2; w++) i = u.erfc(d) - n, d += i / (1.1283791670955126 * f.exp(-d * d) - d * i);
        return p < 1 ? d : -d;
      }, u.ibetainv = function(p, w, d) {
        var i = 1e-8, r = w - 1, n = d - 1, e = 0, o, s, l, v, m, a, t, c, g, y, b;
        if (p <= 0) return 0;
        if (p >= 1) return 1;
        for (w >= 1 && d >= 1 ? (l = p < 0.5 ? p : 1 - p, v = f.sqrt(-2 * f.log(l)), t = (2.30753 + v * 0.27061) / (1 + v * (0.99229 + v * 0.04481)) - v, p < 0.5 && (t = -t), c = (t * t - 3) / 6, g = 2 / (1 / (2 * w - 1) + 1 / (2 * d - 1)), y = t * f.sqrt(c + g) / g - (1 / (2 * d - 1) - 1 / (2 * w - 1)) * (c + 5 / 6 - 2 / (3 * g)), t = w / (w + d * f.exp(2 * y))) : (o = f.log(w / (w + d)), s = f.log(d / (w + d)), v = f.exp(w * o) / w, m = f.exp(d * s) / d, y = v + m, p < v / y ? t = f.pow(w * y * p, 1 / w) : t = 1 - f.pow(d * y * (1 - p), 1 / d)), b = -u.gammaln(w) - u.gammaln(d) + u.gammaln(w + d); e < 10; e++) {
          if (t === 0 || t === 1) return t;
          if (a = u.ibeta(t, w, d) - p, v = f.exp(r * f.log(t) + n * f.log(1 - t) + b), m = a / v, t -= v = m / (1 - 0.5 * f.min(1, m * (r / t - n / (1 - t)))), t <= 0 && (t = 0.5 * (t + v)), t >= 1 && (t = 0.5 * (t + v + 1)), f.abs(v) < i * t && e > 0) break;
        }
        return t;
      }, u.ibeta = function(p, w, d) {
        var i = p === 0 || p === 1 ? 0 : f.exp(u.gammaln(w + d) - u.gammaln(w) - u.gammaln(d) + w * f.log(p) + d * f.log(1 - p));
        return p < 0 || p > 1 ? false : p < (w + 1) / (w + d + 2) ? i * u.betacf(p, w, d) / w : 1 - i * u.betacf(1 - p, d, w) / d;
      }, u.randn = function(p, w) {
        var d, i, r, n, e;
        if (w || (w = p), p) return u.create(p, w, function() {
          return u.randn();
        });
        do
          d = u._random_fn(), i = 1.7156 * (u._random_fn() - 0.5), r = d - 0.449871, n = f.abs(i) + 0.386595, e = r * r + n * (0.196 * n - 0.25472 * r);
        while (e > 0.27597 && (e > 0.27846 || i * i > -4 * f.log(d) * d * d));
        return i / d;
      }, u.randg = function(p, w, d) {
        var i = p, r, n, e, o, s, l;
        if (d || (d = w), p || (p = 1), w) return l = u.zeros(w, d), l.alter(function() {
          return u.randg(p);
        }), l;
        p < 1 && (p += 1), r = p - 1 / 3, n = 1 / f.sqrt(9 * r);
        do {
          do
            s = u.randn(), o = 1 + n * s;
          while (o <= 0);
          o = o * o * o, e = u._random_fn();
        } while (e > 1 - 0.331 * f.pow(s, 4) && f.log(e) > 0.5 * s * s + r * (1 - o + f.log(o)));
        if (p == i) return r * o;
        do
          e = u._random_fn();
        while (e === 0);
        return f.pow(e, 1 / i) * r * o;
      }, (function(q) {
        for (var p = 0; p < q.length; p++) (function(w) {
          u.fn[w] = function() {
            return u(u.map(this, function(d) {
              return u[w](d);
            }));
          };
        })(q[p]);
      })("gammaln gammafn factorial factorialln".split(" ")), (function(q) {
        for (var p = 0; p < q.length; p++) (function(w) {
          u.fn[w] = function() {
            return u(u[w].apply(null, arguments));
          };
        })(q[p]);
      })("randn".split(" "));
    })(h, Math), (function(u, f) {
      (function(i) {
        for (var r = 0; r < i.length; r++) (function(n) {
          u[n] = function e(o, s, l) {
            return this instanceof e ? (this._a = o, this._b = s, this._c = l, this) : new e(o, s, l);
          }, u.fn[n] = function(e, o, s) {
            var l = u[n](e, o, s);
            return l.data = this, l;
          }, u[n].prototype.sample = function(e) {
            var o = this._a, s = this._b, l = this._c;
            return e ? u.alter(e, function() {
              return u[n].sample(o, s, l);
            }) : u[n].sample(o, s, l);
          }, (function(e) {
            for (var o = 0; o < e.length; o++) (function(s) {
              u[n].prototype[s] = function(l) {
                var v = this._a, m = this._b, a = this._c;
                return !l && l !== 0 && (l = this.data), typeof l != "number" ? u.fn.map.call(l, function(t) {
                  return u[n][s](t, v, m, a);
                }) : u[n][s](l, v, m, a);
              };
            })(e[o]);
          })("pdf cdf inv".split(" ")), (function(e) {
            for (var o = 0; o < e.length; o++) (function(s) {
              u[n].prototype[s] = function() {
                return u[n][s](this._a, this._b, this._c);
              };
            })(e[o]);
          })("mean median mode variance".split(" "));
        })(i[r]);
      })("beta centralF cauchy chisquare exponential gamma invgamma kumaraswamy laplace lognormal noncentralt normal pareto studentt weibull uniform binomial negbin hypgeom poisson triangular tukey arcsine".split(" ")), u.extend(u.beta, { pdf: function(r, n, e) {
        return r > 1 || r < 0 ? 0 : n == 1 && e == 1 ? 1 : n < 512 && e < 512 ? f.pow(r, n - 1) * f.pow(1 - r, e - 1) / u.betafn(n, e) : f.exp((n - 1) * f.log(r) + (e - 1) * f.log(1 - r) - u.betaln(n, e));
      }, cdf: function(r, n, e) {
        return r > 1 || r < 0 ? (r > 1) * 1 : u.ibeta(r, n, e);
      }, inv: function(r, n, e) {
        return u.ibetainv(r, n, e);
      }, mean: function(r, n) {
        return r / (r + n);
      }, median: function(r, n) {
        return u.ibetainv(0.5, r, n);
      }, mode: function(r, n) {
        return (r - 1) / (r + n - 2);
      }, sample: function(r, n) {
        var e = u.randg(r);
        return e / (e + u.randg(n));
      }, variance: function(r, n) {
        return r * n / (f.pow(r + n, 2) * (r + n + 1));
      } }), u.extend(u.centralF, { pdf: function(r, n, e) {
        var o, s, l;
        return r < 0 ? 0 : n <= 2 ? r === 0 && n < 2 ? 1 / 0 : r === 0 && n === 2 ? 1 : 1 / u.betafn(n / 2, e / 2) * f.pow(n / e, n / 2) * f.pow(r, n / 2 - 1) * f.pow(1 + n / e * r, -(n + e) / 2) : (o = n * r / (e + r * n), s = e / (e + r * n), l = n * s / 2, l * u.binomial.pdf((n - 2) / 2, (n + e - 2) / 2, o));
      }, cdf: function(r, n, e) {
        return r < 0 ? 0 : u.ibeta(n * r / (n * r + e), n / 2, e / 2);
      }, inv: function(r, n, e) {
        return e / (n * (1 / u.ibetainv(r, n / 2, e / 2) - 1));
      }, mean: function(r, n) {
        return n > 2 ? n / (n - 2) : void 0;
      }, mode: function(r, n) {
        return r > 2 ? n * (r - 2) / (r * (n + 2)) : void 0;
      }, sample: function(r, n) {
        var e = u.randg(r / 2) * 2, o = u.randg(n / 2) * 2;
        return e / r / (o / n);
      }, variance: function(r, n) {
        if (!(n <= 4)) return 2 * n * n * (r + n - 2) / (r * (n - 2) * (n - 2) * (n - 4));
      } }), u.extend(u.cauchy, { pdf: function(r, n, e) {
        return e < 0 ? 0 : e / (f.pow(r - n, 2) + f.pow(e, 2)) / f.PI;
      }, cdf: function(r, n, e) {
        return f.atan((r - n) / e) / f.PI + 0.5;
      }, inv: function(i, r, n) {
        return r + n * f.tan(f.PI * (i - 0.5));
      }, median: function(r) {
        return r;
      }, mode: function(r) {
        return r;
      }, sample: function(r, n) {
        return u.randn() * f.sqrt(1 / (2 * u.randg(0.5))) * n + r;
      } }), u.extend(u.chisquare, { pdf: function(r, n) {
        return r < 0 ? 0 : r === 0 && n === 2 ? 0.5 : f.exp((n / 2 - 1) * f.log(r) - r / 2 - n / 2 * f.log(2) - u.gammaln(n / 2));
      }, cdf: function(r, n) {
        return r < 0 ? 0 : u.lowRegGamma(n / 2, r / 2);
      }, inv: function(i, r) {
        return 2 * u.gammapinv(i, 0.5 * r);
      }, mean: function(i) {
        return i;
      }, median: function(r) {
        return r * f.pow(1 - 2 / (9 * r), 3);
      }, mode: function(r) {
        return r - 2 > 0 ? r - 2 : 0;
      }, sample: function(r) {
        return u.randg(r / 2) * 2;
      }, variance: function(r) {
        return 2 * r;
      } }), u.extend(u.exponential, { pdf: function(r, n) {
        return r < 0 ? 0 : n * f.exp(-n * r);
      }, cdf: function(r, n) {
        return r < 0 ? 0 : 1 - f.exp(-n * r);
      }, inv: function(i, r) {
        return -f.log(1 - i) / r;
      }, mean: function(i) {
        return 1 / i;
      }, median: function(i) {
        return 1 / i * f.log(2);
      }, mode: function() {
        return 0;
      }, sample: function(r) {
        return -1 / r * f.log(u._random_fn());
      }, variance: function(i) {
        return f.pow(i, -2);
      } }), u.extend(u.gamma, { pdf: function(r, n, e) {
        return r < 0 ? 0 : r === 0 && n === 1 ? 1 / e : f.exp((n - 1) * f.log(r) - r / e - u.gammaln(n) - n * f.log(e));
      }, cdf: function(r, n, e) {
        return r < 0 ? 0 : u.lowRegGamma(n, r / e);
      }, inv: function(i, r, n) {
        return u.gammapinv(i, r) * n;
      }, mean: function(i, r) {
        return i * r;
      }, mode: function(r, n) {
        if (r > 1) return (r - 1) * n;
      }, sample: function(r, n) {
        return u.randg(r) * n;
      }, variance: function(r, n) {
        return r * n * n;
      } }), u.extend(u.invgamma, { pdf: function(r, n, e) {
        return r <= 0 ? 0 : f.exp(-(n + 1) * f.log(r) - e / r - u.gammaln(n) + n * f.log(e));
      }, cdf: function(r, n, e) {
        return r <= 0 ? 0 : 1 - u.lowRegGamma(n, e / r);
      }, inv: function(i, r, n) {
        return n / u.gammapinv(1 - i, r);
      }, mean: function(i, r) {
        return i > 1 ? r / (i - 1) : void 0;
      }, mode: function(r, n) {
        return n / (r + 1);
      }, sample: function(r, n) {
        return n / u.randg(r);
      }, variance: function(r, n) {
        if (!(r <= 2)) return n * n / ((r - 1) * (r - 1) * (r - 2));
      } }), u.extend(u.kumaraswamy, { pdf: function(r, n, e) {
        return r === 0 && n === 1 ? e : r === 1 && e === 1 ? n : f.exp(f.log(n) + f.log(e) + (n - 1) * f.log(r) + (e - 1) * f.log(1 - f.pow(r, n)));
      }, cdf: function(r, n, e) {
        return r < 0 ? 0 : r > 1 ? 1 : 1 - f.pow(1 - f.pow(r, n), e);
      }, inv: function(r, n, e) {
        return f.pow(1 - f.pow(1 - r, 1 / e), 1 / n);
      }, mean: function(i, r) {
        return r * u.gammafn(1 + 1 / i) * u.gammafn(r) / u.gammafn(1 + 1 / i + r);
      }, median: function(r, n) {
        return f.pow(1 - f.pow(2, -1 / n), 1 / r);
      }, mode: function(r, n) {
        if (r >= 1 && n >= 1 && r !== 1 && n !== 1) return f.pow((r - 1) / (r * n - 1), 1 / r);
      }, variance: function() {
        throw new Error("variance not yet implemented");
      } }), u.extend(u.lognormal, { pdf: function(r, n, e) {
        return r <= 0 ? 0 : f.exp(-f.log(r) - 0.5 * f.log(2 * f.PI) - f.log(e) - f.pow(f.log(r) - n, 2) / (2 * e * e));
      }, cdf: function(r, n, e) {
        return r < 0 ? 0 : 0.5 + 0.5 * u.erf((f.log(r) - n) / f.sqrt(2 * e * e));
      }, inv: function(i, r, n) {
        return f.exp(-1.4142135623730951 * n * u.erfcinv(2 * i) + r);
      }, mean: function(r, n) {
        return f.exp(r + n * n / 2);
      }, median: function(r) {
        return f.exp(r);
      }, mode: function(r, n) {
        return f.exp(r - n * n);
      }, sample: function(r, n) {
        return f.exp(u.randn() * n + r);
      }, variance: function(r, n) {
        return (f.exp(n * n) - 1) * f.exp(2 * r + n * n);
      } }), u.extend(u.noncentralt, { pdf: function(r, n, e) {
        var o = 1e-14;
        return f.abs(e) < o ? u.studentt.pdf(r, n) : f.abs(r) < o ? f.exp(u.gammaln((n + 1) / 2) - e * e / 2 - 0.5 * f.log(f.PI * n) - u.gammaln(n / 2)) : n / r * (u.noncentralt.cdf(r * f.sqrt(1 + 2 / n), n + 2, e) - u.noncentralt.cdf(r, n, e));
      }, cdf: function(r, n, e) {
        var o = 1e-14, s = 200;
        if (f.abs(e) < o) return u.studentt.cdf(r, n);
        var l = false;
        r < 0 && (l = true, e = -e);
        for (var v = u.normal.cdf(-e, 0, 1), m = o + 1, a = m, t = r * r / (r * r + n), c = 0, g = f.exp(-e * e / 2), y = f.exp(-e * e / 2 - 0.5 * f.log(2) - u.gammaln(3 / 2)) * e; c < s || a > o || m > o; ) a = m, c > 0 && (g *= e * e / (2 * c), y *= e * e / (2 * (c + 1 / 2))), m = g * u.beta.cdf(t, c + 0.5, n / 2) + y * u.beta.cdf(t, c + 1, n / 2), v += 0.5 * m, c++;
        return l ? 1 - v : v;
      } }), u.extend(u.normal, { pdf: function(r, n, e) {
        return f.exp(-0.5 * f.log(2 * f.PI) - f.log(e) - f.pow(r - n, 2) / (2 * e * e));
      }, cdf: function(r, n, e) {
        return 0.5 * (1 + u.erf((r - n) / f.sqrt(2 * e * e)));
      }, inv: function(i, r, n) {
        return -1.4142135623730951 * n * u.erfcinv(2 * i) + r;
      }, mean: function(i) {
        return i;
      }, median: function(r) {
        return r;
      }, mode: function(i) {
        return i;
      }, sample: function(r, n) {
        return u.randn() * n + r;
      }, variance: function(i, r) {
        return r * r;
      } }), u.extend(u.pareto, { pdf: function(r, n, e) {
        return r < n ? 0 : e * f.pow(n, e) / f.pow(r, e + 1);
      }, cdf: function(r, n, e) {
        return r < n ? 0 : 1 - f.pow(n / r, e);
      }, inv: function(r, n, e) {
        return n / f.pow(1 - r, 1 / e);
      }, mean: function(r, n) {
        if (!(n <= 1)) return n * f.pow(r, n) / (n - 1);
      }, median: function(r, n) {
        return r * (n * f.SQRT2);
      }, mode: function(r) {
        return r;
      }, variance: function(i, r) {
        if (!(r <= 2)) return i * i * r / (f.pow(r - 1, 2) * (r - 2));
      } }), u.extend(u.studentt, { pdf: function(r, n) {
        return n = n > 1e100 ? 1e100 : n, 1 / (f.sqrt(n) * u.betafn(0.5, n / 2)) * f.pow(1 + r * r / n, -((n + 1) / 2));
      }, cdf: function(r, n) {
        var e = n / 2;
        return u.ibeta((r + f.sqrt(r * r + n)) / (2 * f.sqrt(r * r + n)), e, e);
      }, inv: function(i, r) {
        var n = u.ibetainv(2 * f.min(i, 1 - i), 0.5 * r, 0.5);
        return n = f.sqrt(r * (1 - n) / n), i > 0.5 ? n : -n;
      }, mean: function(r) {
        return r > 1 ? 0 : void 0;
      }, median: function() {
        return 0;
      }, mode: function() {
        return 0;
      }, sample: function(r) {
        return u.randn() * f.sqrt(r / (2 * u.randg(r / 2)));
      }, variance: function(r) {
        return r > 2 ? r / (r - 2) : r > 1 ? 1 / 0 : void 0;
      } }), u.extend(u.weibull, { pdf: function(r, n, e) {
        return r < 0 || n < 0 || e < 0 ? 0 : e / n * f.pow(r / n, e - 1) * f.exp(-f.pow(r / n, e));
      }, cdf: function(r, n, e) {
        return r < 0 ? 0 : 1 - f.exp(-f.pow(r / n, e));
      }, inv: function(i, r, n) {
        return r * f.pow(-f.log(1 - i), 1 / n);
      }, mean: function(i, r) {
        return i * u.gammafn(1 + 1 / r);
      }, median: function(r, n) {
        return r * f.pow(f.log(2), 1 / n);
      }, mode: function(r, n) {
        return n <= 1 ? 0 : r * f.pow((n - 1) / n, 1 / n);
      }, sample: function(r, n) {
        return r * f.pow(-f.log(u._random_fn()), 1 / n);
      }, variance: function(r, n) {
        return r * r * u.gammafn(1 + 2 / n) - f.pow(u.weibull.mean(r, n), 2);
      } }), u.extend(u.uniform, { pdf: function(r, n, e) {
        return r < n || r > e ? 0 : 1 / (e - n);
      }, cdf: function(r, n, e) {
        return r < n ? 0 : r < e ? (r - n) / (e - n) : 1;
      }, inv: function(i, r, n) {
        return r + i * (n - r);
      }, mean: function(r, n) {
        return 0.5 * (r + n);
      }, median: function(r, n) {
        return u.mean(r, n);
      }, mode: function() {
        throw new Error("mode is not yet implemented");
      }, sample: function(r, n) {
        return r / 2 + n / 2 + (n / 2 - r / 2) * (2 * u._random_fn() - 1);
      }, variance: function(r, n) {
        return f.pow(n - r, 2) / 12;
      } });
      function q(i, r, n, e) {
        for (var o = 0, s = 1, l = 1, v = 1, m = 0, a = 0, t; f.abs((l - a) / l) > e; ) a = l, t = -(r + m) * (r + n + m) * i / (r + 2 * m) / (r + 2 * m + 1), o = l + t * o, s = v + t * s, m = m + 1, t = m * (n - m) * i / (r + 2 * m - 1) / (r + 2 * m), l = o + t * l, v = s + t * v, o = o / v, s = s / v, l = l / v, v = 1;
        return l / r;
      }
      u.extend(u.binomial, { pdf: function(r, n, e) {
        return e === 0 || e === 1 ? n * e === r ? 1 : 0 : u.combination(n, r) * f.pow(e, r) * f.pow(1 - e, n - r);
      }, cdf: function(r, n, e) {
        var o, s = 1e-10;
        if (r < 0) return 0;
        if (r >= n) return 1;
        if (e < 0 || e > 1 || n <= 0) return NaN;
        r = f.floor(r);
        var l = e, v = r + 1, m = n - r, a = v + m, t = f.exp(u.gammaln(a) - u.gammaln(m) - u.gammaln(v) + v * f.log(l) + m * f.log(1 - l));
        return l < (v + 1) / (a + 2) ? o = t * q(l, v, m, s) : o = 1 - t * q(1 - l, m, v, s), f.round((1 - o) * (1 / s)) / (1 / s);
      } }), u.extend(u.negbin, { pdf: function(r, n, e) {
        return r !== r >>> 0 ? false : r < 0 ? 0 : u.combination(r + n - 1, n - 1) * f.pow(1 - e, r) * f.pow(e, n);
      }, cdf: function(r, n, e) {
        var o = 0, s = 0;
        if (r < 0) return 0;
        for (; s <= r; s++) o += u.negbin.pdf(s, n, e);
        return o;
      } }), u.extend(u.hypgeom, { pdf: function(r, n, e, o) {
        if (r !== r | 0) return false;
        if (r < 0 || r < e - (n - o)) return 0;
        if (r > o || r > e) return 0;
        if (e * 2 > n) return o * 2 > n ? u.hypgeom.pdf(n - e - o + r, n, n - e, n - o) : u.hypgeom.pdf(o - r, n, n - e, o);
        if (o * 2 > n) return u.hypgeom.pdf(e - r, n, e, n - o);
        if (e < o) return u.hypgeom.pdf(r, n, o, e);
        for (var s = 1, l = 0, v = 0; v < r; v++) {
          for (; s > 1 && l < o; ) s *= 1 - e / (n - l), l++;
          s *= (o - v) * (e - v) / ((v + 1) * (n - e - o + v + 1));
        }
        for (; l < o; l++) s *= 1 - e / (n - l);
        return f.min(1, f.max(0, s));
      }, cdf: function(r, n, e, o) {
        if (r < 0 || r < e - (n - o)) return 0;
        if (r >= o || r >= e) return 1;
        if (e * 2 > n) return o * 2 > n ? u.hypgeom.cdf(n - e - o + r, n, n - e, n - o) : 1 - u.hypgeom.cdf(o - r - 1, n, n - e, o);
        if (o * 2 > n) return 1 - u.hypgeom.cdf(e - r - 1, n, e, n - o);
        if (e < o) return u.hypgeom.cdf(r, n, o, e);
        for (var s = 1, l = 1, v = 0, m = 0; m < r; m++) {
          for (; s > 1 && v < o; ) {
            var a = 1 - e / (n - v);
            l *= a, s *= a, v++;
          }
          l *= (o - m) * (e - m) / ((m + 1) * (n - e - o + m + 1)), s += l;
        }
        for (; v < o; v++) s *= 1 - e / (n - v);
        return f.min(1, f.max(0, s));
      } }), u.extend(u.poisson, { pdf: function(r, n) {
        return n < 0 || r % 1 !== 0 || r < 0 ? 0 : f.pow(n, r) * f.exp(-n) / u.factorial(r);
      }, cdf: function(r, n) {
        var e = [], o = 0;
        if (r < 0) return 0;
        for (; o <= r; o++) e.push(u.poisson.pdf(o, n));
        return u.sum(e);
      }, mean: function(i) {
        return i;
      }, variance: function(i) {
        return i;
      }, sampleSmall: function(r) {
        var n = 1, e = 0, o = f.exp(-r);
        do
          e++, n *= u._random_fn();
        while (n > o);
        return e - 1;
      }, sampleLarge: function(r) {
        var n = r, e, o, s, l, v, m, a, t, c, g;
        for (l = f.sqrt(n), v = f.log(n), a = 0.931 + 2.53 * l, m = -0.059 + 0.02483 * a, t = 1.1239 + 1.1328 / (a - 3.4), c = 0.9277 - 3.6224 / (a - 2); ; ) {
          if (o = f.random() - 0.5, s = f.random(), g = 0.5 - f.abs(o), e = f.floor((2 * m / g + a) * o + n + 0.43), g >= 0.07 && s <= c) return e;
          if (!(e < 0 || g < 0.013 && s > g) && f.log(s) + f.log(t) - f.log(m / (g * g) + a) <= -n + e * v - u.loggam(e + 1)) return e;
        }
      }, sample: function(r) {
        return r < 10 ? this.sampleSmall(r) : this.sampleLarge(r);
      } }), u.extend(u.triangular, { pdf: function(r, n, e, o) {
        return e <= n || o < n || o > e ? NaN : r < n || r > e ? 0 : r < o ? 2 * (r - n) / ((e - n) * (o - n)) : r === o ? 2 / (e - n) : 2 * (e - r) / ((e - n) * (e - o));
      }, cdf: function(r, n, e, o) {
        return e <= n || o < n || o > e ? NaN : r <= n ? 0 : r >= e ? 1 : r <= o ? f.pow(r - n, 2) / ((e - n) * (o - n)) : 1 - f.pow(e - r, 2) / ((e - n) * (e - o));
      }, inv: function(r, n, e, o) {
        return e <= n || o < n || o > e ? NaN : r <= (o - n) / (e - n) ? n + (e - n) * f.sqrt(r * ((o - n) / (e - n))) : n + (e - n) * (1 - f.sqrt((1 - r) * (1 - (o - n) / (e - n))));
      }, mean: function(r, n, e) {
        return (r + n + e) / 3;
      }, median: function(r, n, e) {
        if (e <= (r + n) / 2) return n - f.sqrt((n - r) * (n - e)) / f.sqrt(2);
        if (e > (r + n) / 2) return r + f.sqrt((n - r) * (e - r)) / f.sqrt(2);
      }, mode: function(r, n, e) {
        return e;
      }, sample: function(r, n, e) {
        var o = u._random_fn();
        return o < (e - r) / (n - r) ? r + f.sqrt(o * (n - r) * (e - r)) : n - f.sqrt((1 - o) * (n - r) * (n - e));
      }, variance: function(r, n, e) {
        return (r * r + n * n + e * e - r * n - r * e - n * e) / 18;
      } }), u.extend(u.arcsine, { pdf: function(r, n, e) {
        return e <= n ? NaN : r <= n || r >= e ? 0 : 2 / f.PI * f.pow(f.pow(e - n, 2) - f.pow(2 * r - n - e, 2), -0.5);
      }, cdf: function(r, n, e) {
        return r < n ? 0 : r < e ? 2 / f.PI * f.asin(f.sqrt((r - n) / (e - n))) : 1;
      }, inv: function(i, r, n) {
        return r + (0.5 - 0.5 * f.cos(f.PI * i)) * (n - r);
      }, mean: function(r, n) {
        return n <= r ? NaN : (r + n) / 2;
      }, median: function(r, n) {
        return n <= r ? NaN : (r + n) / 2;
      }, mode: function() {
        throw new Error("mode is not yet implemented");
      }, sample: function(r, n) {
        return (r + n) / 2 + (n - r) / 2 * f.sin(2 * f.PI * u.uniform.sample(0, 1));
      }, variance: function(r, n) {
        return n <= r ? NaN : f.pow(n - r, 2) / 8;
      } });
      function p(i) {
        return i / f.abs(i);
      }
      u.extend(u.laplace, { pdf: function(r, n, e) {
        return e <= 0 ? 0 : f.exp(-f.abs(r - n) / e) / (2 * e);
      }, cdf: function(r, n, e) {
        return e <= 0 ? 0 : r < n ? 0.5 * f.exp((r - n) / e) : 1 - 0.5 * f.exp(-(r - n) / e);
      }, mean: function(i) {
        return i;
      }, median: function(i) {
        return i;
      }, mode: function(i) {
        return i;
      }, variance: function(i, r) {
        return 2 * r * r;
      }, sample: function(r, n) {
        var e = u._random_fn() - 0.5;
        return r - n * p(e) * f.log(1 - 2 * f.abs(e));
      } });
      function w(i, r, n) {
        var e = 12, o = 6, s = -30, l = -50, v = 60, m = 8, a = 3, t = 2, c = 3, g = [0.9815606342467192, 0.9041172563704749, 0.7699026741943047, 0.5873179542866175, 0.3678314989981802, 0.1252334085114689], y = [0.04717533638651183, 0.10693932599531843, 0.16007832854334622, 0.20316742672306592, 0.2334925365383548, 0.24914704581340277], b = i * 0.5;
        if (b >= m) return 1;
        var _ = 2 * u.normal.cdf(b, 0, 1, 1, 0) - 1;
        _ >= f.exp(l / n) ? _ = f.pow(_, n) : _ = 0;
        var k;
        i > a ? k = t : k = c;
        for (var R = b, z = (m - b) / k, A = R + z, I = 0, E = n - 1, V = 1; V <= k; V++) {
          for (var U = 0, P = 0.5 * (A + R), N = 0.5 * (A - R), L = 1; L <= e; L++) {
            var O, T;
            o < L ? (O = e - L + 1, T = g[O - 1]) : (O = L, T = -g[O - 1]);
            var G = N * T, x = P + G, Q = x * x;
            if (Q > v) break;
            var W2 = 2 * u.normal.cdf(x, 0, 1, 1, 0), C = 2 * u.normal.cdf(x, i, 1, 1, 0), H2 = W2 * 0.5 - C * 0.5;
            H2 >= f.exp(s / E) && (H2 = y[O - 1] * f.exp(-(0.5 * Q)) * f.pow(H2, E), U += H2);
          }
          U *= 2 * N * n / f.sqrt(2 * f.PI), I += U, R = A, A += z;
        }
        return _ += I, _ <= f.exp(s / r) ? 0 : (_ = f.pow(_, r), _ >= 1 ? 1 : _);
      }
      function d(i, r, n) {
        var e = 0.322232421088, o = 0.099348462606, s = -1, l = 0.588581570495, v = -0.342242088547, m = 0.531103462366, a = -0.204231210125, t = 0.10353775285, c = -453642210148e-16, g = 0.0038560700634, y = 0.8832, b = 0.2368, _ = 1.214, k = 1.208, R = 1.4142, z = 120, A = 0.5 - 0.5 * i, I = f.sqrt(f.log(1 / (A * A))), E = I + ((((I * c + a) * I + v) * I + s) * I + e) / ((((I * g + t) * I + m) * I + l) * I + o);
        n < z && (E += (E * E * E + E) / n / 4);
        var V = y - b * E;
        return n < z && (V += -_ / n + k * E / n), E * (V * f.log(r - 1) + R);
      }
      u.extend(u.tukey, { cdf: function(r, n, e) {
        var o = 1, s = n, l = 16, v = 8, m = -30, a = 1e-14, t = 100, c = 800, g = 5e3, y = 25e3, b = 1, _ = 0.5, k = 0.25, R = 0.125, z = [0.9894009349916499, 0.9445750230732326, 0.8656312023878318, 0.755404408355003, 0.6178762444026438, 0.45801677765722737, 0.2816035507792589, 0.09501250983763744], A = [0.027152459411754096, 0.062253523938647894, 0.09515851168249279, 0.12462897125553388, 0.14959598881657674, 0.16915651939500254, 0.18260341504492358, 0.1894506104550685];
        if (r <= 0) return 0;
        if (e < 2 || o < 1 || s < 2) return NaN;
        if (!Number.isFinite(r)) return 1;
        if (e > y) return w(r, o, s);
        var I = e * 0.5, E = I * f.log(e) - e * f.log(2) - u.gammaln(I), V = I - 1, U = e * 0.25, P;
        e <= t ? P = b : e <= c ? P = _ : e <= g ? P = k : P = R, E += f.log(P);
        for (var N = 0, L = 1; L <= 50; L++) {
          for (var O = 0, T = (2 * L - 1) * P, G = 1; G <= l; G++) {
            var x, Q;
            v < G ? (x = G - v - 1, Q = E + V * f.log(T + z[x] * P) - (z[x] * P + T) * U) : (x = G - 1, Q = E + V * f.log(T - z[x] * P) + (z[x] * P - T) * U);
            var W2;
            if (Q >= m) {
              v < G ? W2 = r * f.sqrt((z[x] * P + T) * 0.5) : W2 = r * f.sqrt((-(z[x] * P) + T) * 0.5);
              var C = w(W2, o, s), H2 = C * A[x] * f.exp(Q);
              O += H2;
            }
          }
          if (L * P >= 1 && O <= a) break;
          N += O;
        }
        if (O > a) throw new Error("tukey.cdf failed to converge");
        return N > 1 && (N = 1), N;
      }, inv: function(i, r, n) {
        var e = 1, o = r, s = 1e-4, l = 50;
        if (n < 2 || e < 1 || o < 2) return NaN;
        if (i < 0 || i > 1) return NaN;
        if (i === 0) return 0;
        if (i === 1) return 1 / 0;
        var v = d(i, o, n), m = u.tukey.cdf(v, r, n) - i, a;
        m > 0 ? a = f.max(0, v - 1) : a = v + 1;
        for (var t = u.tukey.cdf(a, r, n) - i, c, g = 1; g < l; g++) {
          c = a - t * (a - v) / (t - m), m = t, v = a, c < 0 && (c = 0, t = -i), t = u.tukey.cdf(c, r, n) - i, a = c;
          var y = f.abs(a - v);
          if (y < s) return c;
        }
        throw new Error("tukey.inv failed to converge");
      } });
    })(h, Math), (function(u, f) {
      var q = Array.prototype.push, p = u.utils.isArray;
      function w(d) {
        return p(d) || d instanceof u;
      }
      u.extend({ add: function(i, r) {
        return w(r) ? (w(r[0]) || (r = [r]), u.map(i, function(n, e, o) {
          return n + r[e][o];
        })) : u.map(i, function(n) {
          return n + r;
        });
      }, subtract: function(i, r) {
        return w(r) ? (w(r[0]) || (r = [r]), u.map(i, function(n, e, o) {
          return n - r[e][o] || 0;
        })) : u.map(i, function(n) {
          return n - r;
        });
      }, divide: function(i, r) {
        return w(r) ? (w(r[0]) || (r = [r]), u.multiply(i, u.inv(r))) : u.map(i, function(n) {
          return n / r;
        });
      }, multiply: function(i, r) {
        var n, e, o, s, l, v, m, a;
        if (i.length === void 0 && r.length === void 0) return i * r;
        if (l = i.length, v = i[0].length, m = u.zeros(l, o = w(r) ? r[0].length : v), a = 0, w(r)) {
          for (; a < o; a++) for (n = 0; n < l; n++) {
            for (s = 0, e = 0; e < v; e++) s += i[n][e] * r[e][a];
            m[n][a] = s;
          }
          return l === 1 && a === 1 ? m[0][0] : m;
        }
        return u.map(i, function(t) {
          return t * r;
        });
      }, outer: function(i, r) {
        return u.multiply(i.map(function(n) {
          return [n];
        }), [r]);
      }, dot: function(i, r) {
        w(i[0]) || (i = [i]), w(r[0]) || (r = [r]);
        for (var n = i[0].length === 1 && i.length !== 1 ? u.transpose(i) : i, e = r[0].length === 1 && r.length !== 1 ? u.transpose(r) : r, o = [], s = 0, l = n.length, v = n[0].length, m, a; s < l; s++) {
          for (o[s] = [], m = 0, a = 0; a < v; a++) m += n[s][a] * e[s][a];
          o[s] = m;
        }
        return o.length === 1 ? o[0] : o;
      }, pow: function(i, r) {
        return u.map(i, function(n) {
          return f.pow(n, r);
        });
      }, exp: function(i) {
        return u.map(i, function(r) {
          return f.exp(r);
        });
      }, log: function(i) {
        return u.map(i, function(r) {
          return f.log(r);
        });
      }, abs: function(i) {
        return u.map(i, function(r) {
          return f.abs(r);
        });
      }, norm: function(i, r) {
        var n = 0, e = 0;
        for (isNaN(r) && (r = 2), w(i[0]) && (i = i[0]); e < i.length; e++) n += f.pow(f.abs(i[e]), r);
        return f.pow(n, 1 / r);
      }, angle: function(i, r) {
        return f.acos(u.dot(i, r) / (u.norm(i) * u.norm(r)));
      }, aug: function(i, r) {
        var n = [], e;
        for (e = 0; e < i.length; e++) n.push(i[e].slice());
        for (e = 0; e < n.length; e++) q.apply(n[e], r[e]);
        return n;
      }, inv: function(i) {
        for (var r = i.length, n = i[0].length, e = u.identity(r, n), o = u.gauss_jordan(i, e), s = [], l = 0, v; l < r; l++) for (s[l] = [], v = n; v < o[0].length; v++) s[l][v - n] = o[l][v];
        return s;
      }, det: function d(i) {
        if (i.length === 2) return i[0][0] * i[1][1] - i[0][1] * i[1][0];
        for (var r = 0, n = 0; n < i.length; n++) {
          for (var e = [], o = 1; o < i.length; o++) {
            e[o - 1] = [];
            for (var s = 0; s < i.length; s++) s < n ? e[o - 1][s] = i[o][s] : s > n && (e[o - 1][s - 1] = i[o][s]);
          }
          var l = n % 2 ? -1 : 1;
          r += d(e) * i[0][n] * l;
        }
        return r;
      }, gauss_elimination: function(i, r) {
        var n = 0, e = 0, o = i.length, s = i[0].length, l = 1, v = 0, m = [], a, t, c, g;
        for (i = u.aug(i, r), a = i[0].length, n = 0; n < o; n++) {
          for (t = i[n][n], e = n, g = n + 1; g < s; g++) t < f.abs(i[g][n]) && (t = i[g][n], e = g);
          if (e != n) for (g = 0; g < a; g++) c = i[n][g], i[n][g] = i[e][g], i[e][g] = c;
          for (e = n + 1; e < o; e++) for (l = i[e][n] / i[n][n], g = n; g < a; g++) i[e][g] = i[e][g] - l * i[n][g];
        }
        for (n = o - 1; n >= 0; n--) {
          for (v = 0, e = n + 1; e <= o - 1; e++) v = v + m[e] * i[n][e];
          m[n] = (i[n][a - 1] - v) / i[n][n];
        }
        return m;
      }, gauss_jordan: function(i, r) {
        var n = u.aug(i, r), e = n.length, o = n[0].length, s = 0, l, v, m;
        for (v = 0; v < e; v++) {
          var a = v;
          for (m = v + 1; m < e; m++) f.abs(n[m][v]) > f.abs(n[a][v]) && (a = m);
          var t = n[v];
          for (n[v] = n[a], n[a] = t, m = v + 1; m < e; m++) for (s = n[m][v] / n[v][v], l = v; l < o; l++) n[m][l] -= n[v][l] * s;
        }
        for (v = e - 1; v >= 0; v--) {
          for (s = n[v][v], m = 0; m < v; m++) for (l = o - 1; l > v - 1; l--) n[m][l] -= n[v][l] * n[m][v] / s;
          for (n[v][v] /= s, l = e; l < o; l++) n[v][l] /= s;
        }
        return n;
      }, triaUpSolve: function(i, r) {
        var n = i[0].length, e = u.zeros(1, n)[0], o, s = false;
        return r[0].length != null && (r = r.map(function(l) {
          return l[0];
        }), s = true), u.arange(n - 1, -1, -1).forEach(function(l) {
          o = u.arange(l + 1, n).map(function(v) {
            return e[v] * i[l][v];
          }), e[l] = (r[l] - u.sum(o)) / i[l][l];
        }), s ? e.map(function(l) {
          return [l];
        }) : e;
      }, triaLowSolve: function(i, r) {
        var n = i[0].length, e = u.zeros(1, n)[0], o, s = false;
        return r[0].length != null && (r = r.map(function(l) {
          return l[0];
        }), s = true), u.arange(n).forEach(function(l) {
          o = u.arange(l).map(function(v) {
            return i[l][v] * e[v];
          }), e[l] = (r[l] - u.sum(o)) / i[l][l];
        }), s ? e.map(function(l) {
          return [l];
        }) : e;
      }, lu: function(i) {
        var r = i.length, n = u.identity(r), e = u.zeros(i.length, i[0].length), o;
        return u.arange(r).forEach(function(s) {
          e[0][s] = i[0][s];
        }), u.arange(1, r).forEach(function(s) {
          u.arange(s).forEach(function(l) {
            o = u.arange(l).map(function(v) {
              return n[s][v] * e[v][l];
            }), n[s][l] = (i[s][l] - u.sum(o)) / e[l][l];
          }), u.arange(s, r).forEach(function(l) {
            o = u.arange(s).map(function(v) {
              return n[s][v] * e[v][l];
            }), e[s][l] = i[o.length][l] - u.sum(o);
          });
        }), [n, e];
      }, cholesky: function(i) {
        var r = i.length, n = u.zeros(i.length, i[0].length), e;
        return u.arange(r).forEach(function(o) {
          e = u.arange(o).map(function(s) {
            return f.pow(n[o][s], 2);
          }), n[o][o] = f.sqrt(i[o][o] - u.sum(e)), u.arange(o + 1, r).forEach(function(s) {
            e = u.arange(o).map(function(l) {
              return n[o][l] * n[s][l];
            }), n[s][o] = (i[o][s] - u.sum(e)) / n[o][o];
          });
        }), n;
      }, gauss_jacobi: function(i, r, n, e) {
        for (var o = 0, s = 0, l = i.length, v = [], m = [], a = [], t, c, g, y; o < l; o++) for (v[o] = [], m[o] = [], a[o] = [], s = 0; s < l; s++) o > s ? (v[o][s] = i[o][s], m[o][s] = a[o][s] = 0) : o < s ? (m[o][s] = i[o][s], v[o][s] = a[o][s] = 0) : (a[o][s] = i[o][s], v[o][s] = m[o][s] = 0);
        for (g = u.multiply(u.multiply(u.inv(a), u.add(v, m)), -1), c = u.multiply(u.inv(a), r), t = n, y = u.add(u.multiply(g, n), c), o = 2; f.abs(u.norm(u.subtract(y, t))) > e; ) t = y, y = u.add(u.multiply(g, t), c), o++;
        return y;
      }, gauss_seidel: function(i, r, n, e) {
        for (var o = 0, s = i.length, l = [], v = [], m = [], a, t, c, g, y; o < s; o++) for (l[o] = [], v[o] = [], m[o] = [], a = 0; a < s; a++) o > a ? (l[o][a] = i[o][a], v[o][a] = m[o][a] = 0) : o < a ? (v[o][a] = i[o][a], l[o][a] = m[o][a] = 0) : (m[o][a] = i[o][a], l[o][a] = v[o][a] = 0);
        for (g = u.multiply(u.multiply(u.inv(u.add(m, l)), v), -1), c = u.multiply(u.inv(u.add(m, l)), r), t = n, y = u.add(u.multiply(g, n), c), o = 2; f.abs(u.norm(u.subtract(y, t))) > e; ) t = y, y = u.add(u.multiply(g, t), c), o = o + 1;
        return y;
      }, SOR: function(i, r, n, e, o) {
        for (var s = 0, l = i.length, v = [], m = [], a = [], t, c, g, y, b; s < l; s++) for (v[s] = [], m[s] = [], a[s] = [], t = 0; t < l; t++) s > t ? (v[s][t] = i[s][t], m[s][t] = a[s][t] = 0) : s < t ? (m[s][t] = i[s][t], v[s][t] = a[s][t] = 0) : (a[s][t] = i[s][t], v[s][t] = m[s][t] = 0);
        for (y = u.multiply(u.inv(u.add(a, u.multiply(v, o))), u.subtract(u.multiply(a, 1 - o), u.multiply(m, o))), g = u.multiply(u.multiply(u.inv(u.add(a, u.multiply(v, o))), r), o), c = n, b = u.add(u.multiply(y, n), g), s = 2; f.abs(u.norm(u.subtract(b, c))) > e; ) c = b, b = u.add(u.multiply(y, c), g), s++;
        return b;
      }, householder: function(i) {
        for (var r = i.length, n = i[0].length, e = 0, o = [], s = [], l, v, m, a, t; e < r - 1; e++) {
          for (l = 0, a = e + 1; a < n; a++) l += i[a][e] * i[a][e];
          for (t = i[e + 1][e] > 0 ? -1 : 1, l = t * f.sqrt(l), v = f.sqrt((l * l - i[e + 1][e] * l) / 2), o = u.zeros(r, 1), o[e + 1][0] = (i[e + 1][e] - l) / (2 * v), m = e + 2; m < r; m++) o[m][0] = i[m][e] / (2 * v);
          s = u.subtract(u.identity(r, n), u.multiply(u.multiply(o, u.transpose(o)), 2)), i = u.multiply(s, u.multiply(i, s));
        }
        return i;
      }, QR: (function() {
        var d = u.sum, i = u.arange;
        function r(n) {
          var e = n.length, o = n[0].length, s = u.zeros(o, o);
          n = u.copy(n);
          var l, v, m;
          for (v = 0; v < o; v++) {
            for (s[v][v] = f.sqrt(d(i(e).map(function(a) {
              return n[a][v] * n[a][v];
            }))), l = 0; l < e; l++) n[l][v] = n[l][v] / s[v][v];
            for (m = v + 1; m < o; m++) for (s[v][m] = d(i(e).map(function(a) {
              return n[a][v] * n[a][m];
            })), l = 0; l < e; l++) n[l][m] = n[l][m] - n[l][v] * s[v][m];
          }
          return [n, s];
        }
        return r;
      })(), lstsq: /* @__PURE__ */ (function() {
        function d(r) {
          r = u.copy(r);
          var n = r.length, e = u.identity(n);
          return u.arange(n - 1, -1, -1).forEach(function(o) {
            u.sliceAssign(e, { row: o }, u.divide(u.slice(e, { row: o }), r[o][o])), u.sliceAssign(r, { row: o }, u.divide(u.slice(r, { row: o }), r[o][o])), u.arange(o).forEach(function(s) {
              var l = u.multiply(r[s][o], -1), v = u.slice(r, { row: s }), m = u.multiply(u.slice(r, { row: o }), l);
              u.sliceAssign(r, { row: s }, u.add(v, m));
              var a = u.slice(e, { row: s }), t = u.multiply(u.slice(e, { row: o }), l);
              u.sliceAssign(e, { row: s }, u.add(a, t));
            });
          }), e;
        }
        function i(r, n) {
          var e = false;
          n[0].length === void 0 && (n = n.map(function(y) {
            return [y];
          }), e = true);
          var o = u.QR(r), s = o[0], l = o[1], v = r[0].length, m = u.slice(s, { col: { end: v } }), a = u.slice(l, { row: { end: v } }), t = d(a), c = u.transpose(m);
          c[0].length === void 0 && (c = [c]);
          var g = u.multiply(u.multiply(t, c), n);
          return g.length === void 0 && (g = [[g]]), e ? g.map(function(y) {
            return y[0];
          }) : g;
        }
        return i;
      })(), jacobi: function(i) {
        for (var r = 1, n = i.length, e = u.identity(n, n), o = [], s, l, v, m, a, t, c, g; r === 1; ) {
          for (t = i[0][1], m = 0, a = 1, l = 0; l < n; l++) for (v = 0; v < n; v++) l != v && t < f.abs(i[l][v]) && (t = f.abs(i[l][v]), m = l, a = v);
          for (i[m][m] === i[a][a] ? c = i[m][a] > 0 ? f.PI / 4 : -f.PI / 4 : c = f.atan(2 * i[m][a] / (i[m][m] - i[a][a])) / 2, g = u.identity(n, n), g[m][m] = f.cos(c), g[m][a] = -f.sin(c), g[a][m] = f.sin(c), g[a][a] = f.cos(c), e = u.multiply(e, g), s = u.multiply(u.multiply(u.inv(g), i), g), i = s, r = 0, l = 1; l < n; l++) for (v = 1; v < n; v++) l != v && f.abs(i[l][v]) > 1e-3 && (r = 1);
        }
        for (l = 0; l < n; l++) o.push(i[l][l]);
        return [e, o];
      }, rungekutta: function(i, r, n, e, o, s) {
        var l, v, m, a, t;
        if (s === 2) for (; e <= n; ) l = r * i(e, o), v = r * i(e + r, o + l), m = o + (l + v) / 2, o = m, e = e + r;
        if (s === 4) for (; e <= n; ) l = r * i(e, o), v = r * i(e + r / 2, o + l / 2), a = r * i(e + r / 2, o + v / 2), t = r * i(e + r, o + a), m = o + (l + 2 * v + 2 * a + t) / 6, o = m, e = e + r;
        return o;
      }, romberg: function(i, r, n, e) {
        for (var o = 0, s = (n - r) / 2, l = [], v = [], m = [], a, t, c, g, y; o < e / 2; ) {
          for (y = i(r), c = r, g = 0; c <= n; c = c + s, g++) l[g] = c;
          for (a = l.length, c = 1; c < a - 1; c++) y += (c % 2 !== 0 ? 4 : 2) * i(l[c]);
          y = s / 3 * (y + i(n)), m[o] = y, s /= 2, o++;
        }
        for (t = m.length, a = 1; t !== 1; ) {
          for (c = 0; c < t - 1; c++) v[c] = (f.pow(4, a) * m[c + 1] - m[c]) / (f.pow(4, a) - 1);
          t = v.length, m = v, v = [], a++;
        }
        return m;
      }, richardson: function(i, r, n, e) {
        function o(b, _) {
          for (var k = 0, R = b.length, z; k < R; k++) b[k] === _ && (z = k);
          return z;
        }
        for (var s = f.abs(n - i[o(i, n) + 1]), l = 0, v = [], m = [], a, t, c, g, y; e >= s; ) a = o(i, n + e), t = o(i, n), v[l] = (r[a] - 2 * r[t] + r[2 * t - a]) / (e * e), e /= 2, l++;
        for (g = v.length, c = 1; g != 1; ) {
          for (y = 0; y < g - 1; y++) m[y] = (f.pow(4, c) * v[y + 1] - v[y]) / (f.pow(4, c) - 1);
          g = m.length, v = m, m = [], c++;
        }
        return v;
      }, simpson: function(i, r, n, e) {
        for (var o = (n - r) / e, s = i(r), l = [], v = r, m = 0, a = 1, t; v <= n; v = v + o, m++) l[m] = v;
        for (t = l.length; a < t - 1; a++) s += (a % 2 !== 0 ? 4 : 2) * i(l[a]);
        return o / 3 * (s + i(n));
      }, hermite: function(i, r, n, e) {
        for (var o = i.length, s = 0, l = 0, v = [], m = [], a = [], t = [], c; l < o; l++) {
          for (v[l] = 1, c = 0; c < o; c++) l != c && (v[l] *= (e - i[c]) / (i[l] - i[c]));
          for (m[l] = 0, c = 0; c < o; c++) l != c && (m[l] += 1 / (i[l] - i[c]));
          a[l] = (1 - 2 * (e - i[l]) * m[l]) * (v[l] * v[l]), t[l] = (e - i[l]) * (v[l] * v[l]), s += a[l] * r[l] + t[l] * n[l];
        }
        return s;
      }, lagrange: function(i, r, n) {
        for (var e = 0, o = 0, s, l, v = i.length; o < v; o++) {
          for (l = r[o], s = 0; s < v; s++) o != s && (l *= (n - i[s]) / (i[o] - i[s]));
          e += l;
        }
        return e;
      }, cubic_spline: function(i, r, n) {
        for (var e = i.length, o = 0, s, l = [], v = [], m = [], a = [], t = [], c = [], g = []; o < e - 1; o++) t[o] = i[o + 1] - i[o];
        for (m[0] = 0, o = 1; o < e - 1; o++) m[o] = 3 / t[o] * (r[o + 1] - r[o]) - 3 / t[o - 1] * (r[o] - r[o - 1]);
        for (o = 1; o < e - 1; o++) l[o] = [], v[o] = [], l[o][o - 1] = t[o - 1], l[o][o] = 2 * (t[o - 1] + t[o]), l[o][o + 1] = t[o], v[o][0] = m[o];
        for (a = u.multiply(u.inv(l), v), s = 0; s < e - 1; s++) c[s] = (r[s + 1] - r[s]) / t[s] - t[s] * (a[s + 1][0] + 2 * a[s][0]) / 3, g[s] = (a[s + 1][0] - a[s][0]) / (3 * t[s]);
        for (s = 0; s < e && !(i[s] > n); s++) ;
        return s -= 1, r[s] + (n - i[s]) * c[s] + u.sq(n - i[s]) * a[s] + (n - i[s]) * u.sq(n - i[s]) * g[s];
      }, gauss_quadrature: function() {
        throw new Error("gauss_quadrature not yet implemented");
      }, PCA: function(i) {
        var r = i.length, n = i[0].length, e = 0, o, s, l = [], v = [], m = [], a = [], t = [], c = [], g = [], y = [], b = [], _ = [];
        for (e = 0; e < r; e++) l[e] = u.sum(i[e]) / n;
        for (e = 0; e < n; e++) for (g[e] = [], o = 0; o < r; o++) g[e][o] = i[o][e] - l[o];
        for (g = u.transpose(g), e = 0; e < r; e++) for (y[e] = [], o = 0; o < r; o++) y[e][o] = u.dot([g[e]], [g[o]]) / (n - 1);
        for (m = u.jacobi(y), b = m[0], v = m[1], _ = u.transpose(b), e = 0; e < v.length; e++) for (o = e; o < v.length; o++) v[e] < v[o] && (s = v[e], v[e] = v[o], v[o] = s, a = _[e], _[e] = _[o], _[o] = a);
        for (c = u.transpose(g), e = 0; e < r; e++) for (t[e] = [], o = 0; o < c.length; o++) t[e][o] = u.dot([_[e]], [c[o]]);
        return [i, v, _, t];
      } }), (function(d) {
        for (var i = 0; i < d.length; i++) (function(r) {
          u.fn[r] = function(n, e) {
            var o = this;
            return e ? (setTimeout(function() {
              e.call(o, u.fn[r].call(o, n));
            }, 15), this) : typeof u[r](this, n) == "number" ? u[r](this, n) : u(u[r](this, n));
          };
        })(d[i]);
      })("add divide multiply subtract dot pow exp log abs norm angle".split(" "));
    })(h, Math), (function(u, f) {
      var q = [].slice, p = u.utils.isNumber, w = u.utils.isArray;
      u.extend({ zscore: function() {
        var r = q.call(arguments);
        return p(r[1]) ? (r[0] - r[1]) / r[2] : (r[0] - u.mean(r[1])) / u.stdev(r[1], r[2]);
      }, ztest: function() {
        var r = q.call(arguments), n;
        return w(r[1]) ? (n = u.zscore(r[0], r[1], r[3]), r[2] === 1 ? u.normal.cdf(-f.abs(n), 0, 1) : u.normal.cdf(-f.abs(n), 0, 1) * 2) : r.length > 2 ? (n = u.zscore(r[0], r[1], r[2]), r[3] === 1 ? u.normal.cdf(-f.abs(n), 0, 1) : u.normal.cdf(-f.abs(n), 0, 1) * 2) : (n = r[0], r[1] === 1 ? u.normal.cdf(-f.abs(n), 0, 1) : u.normal.cdf(-f.abs(n), 0, 1) * 2);
      } }), u.extend(u.fn, { zscore: function(r, n) {
        return (r - this.mean()) / this.stdev(n);
      }, ztest: function(r, n, e) {
        var o = f.abs(this.zscore(r, e));
        return n === 1 ? u.normal.cdf(-o, 0, 1) : u.normal.cdf(-o, 0, 1) * 2;
      } }), u.extend({ tscore: function() {
        var r = q.call(arguments);
        return r.length === 4 ? (r[0] - r[1]) / (r[2] / f.sqrt(r[3])) : (r[0] - u.mean(r[1])) / (u.stdev(r[1], true) / f.sqrt(r[1].length));
      }, ttest: function() {
        var r = q.call(arguments), n;
        return r.length === 5 ? (n = f.abs(u.tscore(r[0], r[1], r[2], r[3])), r[4] === 1 ? u.studentt.cdf(-n, r[3] - 1) : u.studentt.cdf(-n, r[3] - 1) * 2) : p(r[1]) ? (n = f.abs(r[0]), r[2] == 1 ? u.studentt.cdf(-n, r[1] - 1) : u.studentt.cdf(-n, r[1] - 1) * 2) : (n = f.abs(u.tscore(r[0], r[1])), r[2] == 1 ? u.studentt.cdf(-n, r[1].length - 1) : u.studentt.cdf(-n, r[1].length - 1) * 2);
      } }), u.extend(u.fn, { tscore: function(r) {
        return (r - this.mean()) / (this.stdev(true) / f.sqrt(this.cols()));
      }, ttest: function(r, n) {
        return n === 1 ? 1 - u.studentt.cdf(f.abs(this.tscore(r)), this.cols() - 1) : u.studentt.cdf(-f.abs(this.tscore(r)), this.cols() - 1) * 2;
      } }), u.extend({ anovafscore: function() {
        var r = q.call(arguments), n, e, o, s, l, v, m, a;
        if (r.length === 1) {
          for (l = new Array(r[0].length), m = 0; m < r[0].length; m++) l[m] = r[0][m];
          r = l;
        }
        for (e = new Array(), m = 0; m < r.length; m++) e = e.concat(r[m]);
        for (o = u.mean(e), n = 0, m = 0; m < r.length; m++) n = n + r[m].length * f.pow(u.mean(r[m]) - o, 2);
        for (n /= r.length - 1, v = 0, m = 0; m < r.length; m++) for (s = u.mean(r[m]), a = 0; a < r[m].length; a++) v += f.pow(r[m][a] - s, 2);
        return v /= e.length - r.length, n / v;
      }, anovaftest: function() {
        var r = q.call(arguments), n, e, o, s;
        if (p(r[0])) return 1 - u.centralF.cdf(r[0], r[1], r[2]);
        var l = u.anovafscore(r);
        for (n = r.length - 1, o = 0, s = 0; s < r.length; s++) o = o + r[s].length;
        return e = o - n - 1, 1 - u.centralF.cdf(l, n, e);
      }, ftest: function(r, n, e) {
        return 1 - u.centralF.cdf(r, n, e);
      } }), u.extend(u.fn, { anovafscore: function() {
        return u.anovafscore(this.toArray());
      }, anovaftes: function() {
        var r = 0, n;
        for (n = 0; n < this.length; n++) r = r + this[n].length;
        return u.ftest(this.anovafscore(), this.length - 1, r - this.length);
      } }), u.extend({ qscore: function() {
        var r = q.call(arguments), n, e, o, s, l;
        return p(r[0]) ? (n = r[0], e = r[1], o = r[2], s = r[3], l = r[4]) : (n = u.mean(r[0]), e = u.mean(r[1]), o = r[0].length, s = r[1].length, l = r[2]), f.abs(n - e) / (l * f.sqrt((1 / o + 1 / s) / 2));
      }, qtest: function() {
        var r = q.call(arguments), n;
        r.length === 3 ? (n = r[0], r = r.slice(1)) : r.length === 7 ? (n = u.qscore(r[0], r[1], r[2], r[3], r[4]), r = r.slice(5)) : (n = u.qscore(r[0], r[1], r[2]), r = r.slice(3));
        var e = r[0], o = r[1];
        return 1 - u.tukey.cdf(n, o, e - o);
      }, tukeyhsd: function(r) {
        for (var n = u.pooledstdev(r), e = r.map(function(a) {
          return u.mean(a);
        }), o = r.reduce(function(a, t) {
          return a + t.length;
        }, 0), s = [], l = 0; l < r.length; ++l) for (var v = l + 1; v < r.length; ++v) {
          var m = u.qtest(e[l], e[v], r[l].length, r[v].length, n, o, r.length);
          s.push([[l, v], m]);
        }
        return s;
      } }), u.extend({ normalci: function() {
        var r = q.call(arguments), n = new Array(2), e;
        return r.length === 4 ? e = f.abs(u.normal.inv(r[1] / 2, 0, 1) * r[2] / f.sqrt(r[3])) : e = f.abs(u.normal.inv(r[1] / 2, 0, 1) * u.stdev(r[2]) / f.sqrt(r[2].length)), n[0] = r[0] - e, n[1] = r[0] + e, n;
      }, tci: function() {
        var r = q.call(arguments), n = new Array(2), e;
        return r.length === 4 ? e = f.abs(u.studentt.inv(r[1] / 2, r[3] - 1) * r[2] / f.sqrt(r[3])) : e = f.abs(u.studentt.inv(r[1] / 2, r[2].length - 1) * u.stdev(r[2], true) / f.sqrt(r[2].length)), n[0] = r[0] - e, n[1] = r[0] + e, n;
      }, significant: function(r, n) {
        return r < n;
      } }), u.extend(u.fn, { normalci: function(r, n) {
        return u.normalci(r, n, this.toArray());
      }, tci: function(r, n) {
        return u.tci(r, n, this.toArray());
      } });
      function d(i, r, n, e) {
        if (i > 1 || n > 1 || i <= 0 || n <= 0) throw new Error("Proportions should be greater than 0 and less than 1");
        var o = (i * r + n * e) / (r + e), s = f.sqrt(o * (1 - o) * (1 / r + 1 / e));
        return (i - n) / s;
      }
      u.extend(u.fn, { oneSidedDifferenceOfProportions: function(r, n, e, o) {
        var s = d(r, n, e, o);
        return u.ztest(s, 1);
      }, twoSidedDifferenceOfProportions: function(r, n, e, o) {
        var s = d(r, n, e, o);
        return u.ztest(s, 2);
      } });
    })(h, Math), h.models = /* @__PURE__ */ (function() {
      function u(d) {
        var i = d[0].length, r = h.arange(i).map(function(n) {
          var e = h.arange(i).filter(function(o) {
            return o !== n;
          });
          return f(h.col(d, n).map(function(o) {
            return o[0];
          }), h.col(d, e));
        });
        return r;
      }
      function f(d, i) {
        var r = d.length, n = i[0].length - 1, e = r - n - 1, o = h.lstsq(i, d), s = h.multiply(i, o.map(function(g) {
          return [g];
        })).map(function(g) {
          return g[0];
        }), l = h.subtract(d, s), v = h.mean(d), m = h.sum(s.map(function(g) {
          return Math.pow(g - v, 2);
        })), a = h.sum(d.map(function(g, y) {
          return Math.pow(g - s[y], 2);
        })), t = m + a, c = m / t;
        return { exog: i, endog: d, nobs: r, df_model: n, df_resid: e, coef: o, predict: s, resid: l, ybar: v, SST: t, SSE: m, SSR: a, R2: c };
      }
      function q(d) {
        var i = u(d.exog), r = Math.sqrt(d.SSR / d.df_resid), n = i.map(function(v) {
          var m = v.SST, a = v.R2;
          return r / Math.sqrt(m * (1 - a));
        }), e = d.coef.map(function(v, m) {
          return (v - 0) / n[m];
        }), o = e.map(function(v) {
          var m = h.studentt.cdf(v, d.df_resid);
          return (m > 0.5 ? 1 - m : m) * 2;
        }), s = h.studentt.inv(0.975, d.df_resid), l = d.coef.map(function(v, m) {
          var a = s * n[m];
          return [v - a, v + a];
        });
        return { se: n, t: e, p: o, sigmaHat: r, interval95: l };
      }
      function p(d) {
        var i = d.R2 / d.df_model / ((1 - d.R2) / d.df_resid), r = function(e, o, s) {
          return h.beta.cdf(e / (s / o + e), o / 2, s / 2);
        }, n = 1 - r(i, d.df_model, d.df_resid);
        return { F_statistic: i, pvalue: n };
      }
      function w(d, i) {
        var r = f(d, i), n = q(r), e = p(r), o = 1 - (1 - r.R2) * ((r.nobs - 1) / r.df_resid);
        return r.t = n, r.f = e, r.adjust_R2 = o, r;
      }
      return { ols: w };
    })(), h.extend({ buildxmatrix: function() {
      for (var f = new Array(arguments.length), q = 0; q < arguments.length; q++) {
        var p = [1];
        f[q] = p.concat(arguments[q]);
      }
      return h(f);
    }, builddxmatrix: function() {
      for (var f = new Array(arguments[0].length), q = 0; q < arguments[0].length; q++) {
        var p = [1];
        f[q] = p.concat(arguments[0][q]);
      }
      return h(f);
    }, buildjxmatrix: function(f) {
      for (var q = new Array(f.length), p = 0; p < f.length; p++) q[p] = f[p];
      return h.builddxmatrix(q);
    }, buildymatrix: function(f) {
      return h(f).transpose();
    }, buildjymatrix: function(f) {
      return f.transpose();
    }, matrixmult: function(f, q) {
      var p, w, d, i, r;
      if (f.cols() == q.rows()) {
        if (q.rows() > 1) {
          for (i = [], p = 0; p < f.rows(); p++) for (i[p] = [], w = 0; w < q.cols(); w++) {
            for (r = 0, d = 0; d < f.cols(); d++) r += f.toArray()[p][d] * q.toArray()[d][w];
            i[p][w] = r;
          }
          return h(i);
        }
        for (i = [], p = 0; p < f.rows(); p++) for (i[p] = [], w = 0; w < q.cols(); w++) {
          for (r = 0, d = 0; d < f.cols(); d++) r += f.toArray()[p][d] * q.toArray()[w];
          i[p][w] = r;
        }
        return h(i);
      }
    }, regress: function(f, q) {
      var p = h.xtranspxinv(f), w = f.transpose(), d = h.matrixmult(h(p), w);
      return h.matrixmult(d, q);
    }, regresst: function(f, q, p) {
      var w = h.regress(f, q), d = {};
      d.anova = {};
      var i = h.jMatYBar(f, w);
      d.yBar = i;
      var r = q.mean();
      d.anova.residuals = h.residuals(q, i), d.anova.ssr = h.ssr(i, r), d.anova.msr = d.anova.ssr / (f[0].length - 1), d.anova.sse = h.sse(q, i), d.anova.mse = d.anova.sse / (q.length - (f[0].length - 1) - 1), d.anova.sst = h.sst(q, r), d.anova.mst = d.anova.sst / (q.length - 1), d.anova.r2 = 1 - d.anova.sse / d.anova.sst, d.anova.r2 < 0 && (d.anova.r2 = 0), d.anova.fratio = d.anova.msr / d.anova.mse, d.anova.pvalue = h.anovaftest(d.anova.fratio, f[0].length - 1, q.length - (f[0].length - 1) - 1), d.anova.rmse = Math.sqrt(d.anova.mse), d.anova.r2adj = 1 - d.anova.mse / d.anova.mst, d.anova.r2adj < 0 && (d.anova.r2adj = 0), d.stats = new Array(f[0].length);
      for (var n = h.xtranspxinv(f), e, o, s, l = 0; l < w.length; l++) e = Math.sqrt(d.anova.mse * Math.abs(n[l][l])), o = Math.abs(w[l] / e), s = h.ttest(o, q.length - f[0].length - 1, p), d.stats[l] = [w[l], e, o, s];
      return d.regress = w, d;
    }, xtranspx: function(f) {
      return h.matrixmult(f.transpose(), f);
    }, xtranspxinv: function(f) {
      var q = h.matrixmult(f.transpose(), f), p = h.inv(q);
      return p;
    }, jMatYBar: function(f, q) {
      var p = h.matrixmult(f, q);
      return new h(p);
    }, residuals: function(f, q) {
      return h.matrixsubtract(f, q);
    }, ssr: function(f, q) {
      for (var p = 0, w = 0; w < f.length; w++) p += Math.pow(f[w] - q, 2);
      return p;
    }, sse: function(f, q) {
      for (var p = 0, w = 0; w < f.length; w++) p += Math.pow(f[w] - q[w], 2);
      return p;
    }, sst: function(f, q) {
      for (var p = 0, w = 0; w < f.length; w++) p += Math.pow(f[w] - q, 2);
      return p;
    }, matrixsubtract: function(f, q) {
      for (var p = new Array(f.length), w = 0; w < f.length; w++) {
        p[w] = new Array(f[w].length);
        for (var d = 0; d < f[w].length; d++) p[w][d] = f[w][d] - q[w][d];
      }
      return h(p);
    } }), h.jStat = h, h;
  });
});
var J = rr(B());
var er = J.default ?? J;

// js/base.js
var W = 660;
var H = 360;
var M_L = 8;
var M_R = 8;
var M_T = 46;
var M_B = 44;
var HIT_W = 24;
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
function elNS(tag, parent, attrs) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}
function ticks(d) {
  const span = d[1] - d[0];
  const raw = span / 10;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const sn = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  const step = sn * mag;
  const prec = Math.max(0, -Math.floor(Math.log10(step)));
  const out = [];
  for (let i = Math.ceil(d[0] / step - 1e-9) || 0; i * step <= d[1] + 1e-9 && out.length < 14; i++) {
    out.push(Math.round(i * step * 10 ** prec) / 10 ** prec);
  }
  return out;
}
function integrate(lo, hi, fn, N) {
  N = N || 400;
  const dx = (hi - lo) / N;
  const step = (i) => i % 2 ? 4 : 2;
  let s = fn(lo) + fn(hi);
  for (let i = 1; i < N; i++) s += step(i) * fn(lo + i * dx);
  return s * dx / 3;
}
var uidCounter = 0;
function fmt(x, dp) {
  dp = dp === void 0 ? 3 : dp;
  if (!isFinite(x)) return "\u2013";
  if (x === 0 || Math.abs(x) < 5e-14) return "0";
  const a = Math.abs(x);
  if (a >= 1e5) return x.toExponential(2);
  if (a < 1e-3) return x.toExponential(2);
  return (Math.round(x * 10 ** dp) / 10 ** dp).toLocaleString("en-US", {
    maximumFractionDigits: dp
  });
}
function createWidget(F3, opts) {
  const {
    pins = "none",
    // "none" | "left" | "both"
    nMesh = 400,
    // how the view is adjusted after a drag ends:
    //   "fit"    grow to contain a straying curve AND shrink when the curve
    //            occupies less than SHRINK_FRAC of the view (default)
    //   "expand" only grow (previous behavior)
    //   "none"   never adjust after a drag
    fit = "fit"
  } = opts || {};
  const SHRINK_FRAC = 0.3;
  return {
    render({ model, el }) {
      const uid = `md-${++uidCounter}`;
      const gradId = `${uid}-fill`;
      const root = document.createElement("div");
      root.className = "mroot";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.aspectRatio = `${W} / ${H}`;
      root.appendChild(svg);
      const defs = elNS("defs", svg);
      const grad = elNS("linearGradient", defs, {
        id: gradId,
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1"
      });
      elNS("stop", grad, { offset: "0%", "stop-color": "var(--m-acc)", "stop-opacity": "0.55" });
      elNS("stop", grad, { offset: "100%", "stop-color": "var(--m-acc)", "stop-opacity": "0.06" });
      const tip = document.createElement("div");
      tip.className = "mtip";
      root.appendChild(tip);
      el.appendChild(root);
      const traitNames = Object.keys(F3.defaults);
      const getParams = () => {
        const p = {};
        for (const k of traitNames) p[k] = model.get(k);
        return p;
      };
      const setParams = (newVals, why) => {
        for (const k of traitNames) {
          if (k in newVals && newVals[k] !== model.get(k)) model.set(k, newVals[k]);
        }
        model.save_changes(why);
      };
      let view = null;
      function support(p) {
        const s = F3.support(p);
        return [s[0] === null ? -Infinity : s[0], s[1] === null ? Infinity : s[1]];
      }
      function clampDomain(lo, hi) {
        let a = Math.min(lo, hi);
        let b = Math.max(lo, hi);
        if (pins === "left" || pins === "both") a = Math.max(a, 0);
        if (pins === "both") b = Math.min(b, 1);
        if (b <= a) b = a + 1e-6;
        return [a, b];
      }
      function setDomain(lo, hi) {
        const c = clampDomain(lo, hi);
        view = c;
      }
      function ensureFit(p) {
        setDomain(F3.bounds(p)[0], F3.bounds(p)[1]);
      }
      function fitTargetAfterDrag(p) {
        const cur = currentDomain();
        const b = F3.bounds(p);
        if (b[0] < cur[0] || b[1] > cur[1]) {
          return [Math.min(cur[0], b[0]), Math.max(cur[1], b[1])];
        }
        if (fit === "fit") {
          const curSpan = cur[1] - cur[0];
          const bSpan = b[1] - b[0];
          if (bSpan < curSpan * SHRINK_FRAC) return b.slice();
        }
        return null;
      }
      let drag = null;
      let dragDomain = null;
      let panDrag = null;
      let zoomAccum = 0;
      let hoverIdx = null;
      function currentDomain() {
        return dragDomain || view.slice();
      }
      const base = H - M_B;
      const plotW = W - M_L - M_R;
      const plotH = base - M_T;
      function xt(x, d) {
        return M_L + (x - d[0]) / (d[1] - d[0]) * plotW;
      }
      function xInv(px, d) {
        return d[0] + (px - M_L) / plotW * (d[1] - d[0]);
      }
      function yt(y, peak) {
        return M_T + (1 - y / peak) * plotH;
      }
      function mesh(p, d) {
        const n = nMesh;
        const xs = [];
        const ys = [];
        for (let i = 0; i <= n; i++) {
          const x = d[0] + i / n * (d[1] - d[0]);
          xs.push(x);
          ys.push(F3.pdf(p, x));
        }
        let peak = 0;
        for (let i = 1; i < n; i++) peak = Math.max(peak, ys[i]);
        if (!(peak > 0) || !isFinite(peak)) peak = 1;
        return { xs, ys, peak };
      }
      function applyDrag(e) {
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const d0 = dragDomain || currentDomain();
        const x = xInv(clamp(px, M_L, W - M_R), d0);
        const p = getParams();
        const next = drag.handle.drag(p, x, d0);
        setParams(next, "drag");
      }
      function panHit(e) {
        const rect = svg.getBoundingClientRect();
        const py = (e.clientY - rect.top) / rect.height * H;
        return py >= base - 8 && py <= base + 24;
      }
      svg.addEventListener("pointerdown", (e) => {
        if (!panHit(e)) return;
        cancelAnim();
        e.preventDefault();
        svg.setPointerCapture(e.pointerId);
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        panDrag = { id: e.pointerId, startPx: px, startLo: currentDomain()[0] };
      });
      svg.addEventListener("pointermove", (e) => {
        if (!panDrag || panDrag.id !== e.pointerId) return;
        const d0 = currentDomain();
        const span = d0[1] - d0[0];
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const dData = (px - panDrag.startPx) / plotW * span;
        setDomain(panDrag.startLo - dData, panDrag.startLo - dData + span);
        draw();
      });
      const endPan = (e) => {
        if (!panDrag || panDrag.id !== e.pointerId) return;
        panDrag = null;
        svg.releasePointerCapture(e.pointerId);
      };
      svg.addEventListener("pointerup", endPan);
      svg.addEventListener("pointercancel", endPan);
      svg.addEventListener("wheel", (e) => {
        e.preventDefault();
        cancelAnim();
        zoomAccum += e.deltaY;
        if (Math.abs(zoomAccum) < 90) return;
        const dir = Math.sign(zoomAccum);
        zoomAccum = 0;
        const d0 = currentDomain();
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const cx = xInv(clamp(px, M_L, W - M_R), d0);
        const f = dir < 0 ? 1 / 1.18 : 1.18;
        setDomain(cx - (cx - d0[0]) * f, cx + (d0[1] - cx) * f);
        draw();
      }, { passive: false });
      let downAt = null;
      svg.addEventListener("pointerdown", (e) => {
        if (panHit(e) || e.button !== 0) return;
        if (e.target.closest && e.target.closest(".mzoom, .mreset, .mfit, .mchipgroup")) return;
        downAt = { px: e.clientX, py: e.clientY, id: e.pointerId };
      });
      svg.addEventListener("pointerup", (e) => {
        if (!downAt || downAt.id !== e.pointerId) return;
        const moved = Math.hypot(e.clientX - downAt.px, e.clientY - downAt.py);
        downAt = null;
        if (moved > 4) return;
        const center = F3.handles.find((h) => h.kind === "center");
        if (!center) return;
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const x = xInv(clamp(px, M_L, W - M_R), currentDomain());
        setParams(center.drag(getParams(), x, currentDomain()), "click");
      });
      const attachDrag = (g, handle) => {
        g.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          cancelAnim();
          drag = { handle, id: e.pointerId };
          dragDomain = currentDomain();
          svg.setPointerCapture(e.pointerId);
          applyDrag(e);
        });
      };
      svg.addEventListener("pointermove", (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        applyDrag(e);
      });
      const endDrag = (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        drag = null;
        dragDomain = null;
        svg.releasePointerCapture(e.pointerId);
        const target = fitTargetAfterDrag(getParams());
        if (target) animateView(target);
      };
      svg.addEventListener("pointerup", endDrag);
      svg.addEventListener("pointercancel", endDrag);
      const draw = () => redraw("view");
      const FIT_MS = 300;
      const EASE = (t) => 1 - Math.pow(1 - t, 3);
      const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      let anim = null;
      function cancelAnim() {
        if (anim) {
          cancelAnimationFrame(anim.raf);
          anim = null;
        }
      }
      function animateView(to, ms = FIT_MS) {
        const from = currentDomain();
        if (REDUCED || ms <= 0) {
          setDomain(to[0], to[1]);
          draw();
          return;
        }
        cancelAnim();
        anim = { from, to: to.slice(), start: performance.now(), raf: 0 };
        const step = (now) => {
          if (!anim) return;
          const t = Math.min(1, (now - anim.start) / ms);
          const e = EASE(t);
          setDomain(
            anim.from[0] + (anim.to[0] - anim.from[0]) * e,
            anim.from[1] + (anim.to[1] - anim.from[1]) * e
          );
          draw();
          if (t < 1) anim.raf = requestAnimationFrame(step);
          else anim = null;
        };
        anim.raf = requestAnimationFrame(step);
      }
      function redraw(cause) {
        const p = getParams();
        const d = currentDomain();
        if (!drag && (cause === "init" || cause === "param")) {
          cancelAnim();
          ensureFit(p);
        }
        const dd = currentDomain();
        while (svg.lastChild && svg.lastChild !== defs) svg.removeChild(svg.lastChild);
        for (const x of ticks(dd)) {
          elNS("line", svg, { class: "mgrid", x1: xt(x, dd), y1: M_T, x2: xt(x, dd), y2: base });
          const t = elNS("text", svg, { class: "mtick", x: xt(x, dd), y: H - 12, "text-anchor": "middle" });
          t.textContent = fmt(x, 2);
        }
        elNS("line", svg, { class: "maxis", x1: M_L, y1: base, x2: W - M_R, y2: base });
        elNS("rect", svg, { class: "mpan", x: M_L, y: base - 6, width: plotW, height: 16, rx: 4 });
        const panTip = elNS("text", svg, { class: "mpantip", x: M_L + 5, y: base - 9 });
        panTip.textContent = "\u2194 drag axis to pan";
        const { xs, ys, peak } = mesh(p, dd);
        const [il, ih] = F3.integ(p);
        const norm = integrate(il, ih, (x) => F3.pdf(p, x));
        const pts = xs.map((x, i) => [xt(x, dd), yt(clamp(ys[i], 0, peak), peak)]);
        const area = elNS("path", svg, { class: "marea" });
        area.setAttribute("fill", `url(#${gradId})`);
        let ad = `M ${xt(dd[0], dd)},${base}`;
        ad += pts.map((pt, i) => i === 0 ? ` M ${pt[0]},${pt[1]}` : ` L ${pt[0]},${pt[1]}`).join("");
        ad += ` L ${xt(dd[1], dd)},${base} Z`;
        area.setAttribute("d", ad);
        const line = elNS("path", svg, { class: "mline" });
        line.setAttribute("d", pts.map((pt, i) => i === 0 ? `M ${pt[0]},${pt[1]}` : `L ${pt[0]},${pt[1]}`).join(""));
        const chipEls = [];
        const markerEls = [];
        const raiseMarker = (i) => {
          if (markerEls[i]) svg.appendChild(markerEls[i]);
        };
        const orderMarkers = () => {
          for (const g of markerEls) if (g) svg.appendChild(g);
        };
        const hitLayer = elNS("g", svg, { class: "mhitlayer" });
        const hxOf = F3.handles.map((h) => clamp(xt(h.at(p), dd), M_L, W - M_R));
        const zones = new Array(F3.handles.length);
        const idx = [...F3.handles.keys()].sort((a, b) => hxOf[a] - hxOf[b] || a - b);
        let zi = 0;
        while (zi < idx.length) {
          let zj = zi + 1;
          while (zj < idx.length && hxOf[idx[zj]] - hxOf[idx[zi]] < HIT_W) zj++;
          const group = idx.slice(zi, zj);
          if (group.length === 1) {
            const i = group[0];
            zones[i] = { x: hxOf[i] - HIT_W / 2, w: HIT_W };
          } else {
            const lo = clamp(hxOf[group[0]] - HIT_W / 2, M_L, W - M_R);
            const hi = clamp(hxOf[group[group.length - 1]] + HIT_W / 2, M_L, W - M_R);
            const step = Math.max((hi - lo) / group.length, 2);
            let x = lo;
            for (const i of group) {
              zones[i] = { x, w: step };
              x += step;
            }
          }
          zi = zj;
        }
        const chipW = [];
        const overlap = new Array(F3.handles.length).fill(false);
        for (let i = 0; i < F3.handles.length; i++) {
          const h = F3.handles[i];
          const hx = hxOf[i];
          const hy = yt(clamp(F3.pdf(p, h.at(p)), 0, peak), peak);
          const g = elNS("g", svg, { class: `mhandle ${h.icon}` });
          markerEls[i] = g;
          if (h.icon === "dot") {
            elNS("line", g, { class: "mstem", x1: hx, y1: hy, x2: hx, y2: base });
            elNS("circle", g, { cx: hx, cy: hy, r: 7, class: "mdot" });
          } else {
            elNS("line", g, { class: "mstem", x1: hx, y1: hy, x2: hx, y2: base });
            elNS("rect", g, { x: hx - 7, y: hy - 7, width: 14, height: 14, rx: 3, class: "msq" });
            elNS("line", g, { x1: hx - 4, y1: hy, x2: hx + 4, y2: hy, class: "msqgrip" });
          }
          const chip = elNS("g", svg, { class: "mchipgroup", transform: `translate(${hx}, ${M_T - 18})` });
          const txt = elNS("text", chip, { class: "mlabeltxt", "text-anchor": "middle", "dominant-baseline": "central" });
          txt.textContent = h.chip(p);
          const bb = txt.getBBox();
          elNS("rect", chip, { x: bb.x - 6, y: bb.y - 4, width: bb.width + 12, height: bb.height + 8, rx: 7, class: "mchip", fill: h.color });
          chip.appendChild(txt);
          chipEls[i] = chip;
          chipW[i] = bb.width / 2 + 6;
          const lineG = elNS("g", svg);
          elNS("line", lineG, { class: h.lineCls, x1: hx, y1: M_T, x2: hx, y2: base });
          elNS("line", lineG, { class: "mstem", x1: hx, y1: M_T, x2: hx, y2: base, opacity: 0 });
          const z = zones[i];
          const hr = elNS("rect", hitLayer, { class: "mhitline", x: z.x, y: M_T, width: z.w, height: base - M_T });
          hr.addEventListener("pointerenter", () => {
            hoverIdx = i;
            applyHandleState();
          });
          hr.addEventListener("pointerleave", () => {
            if (hoverIdx === i) hoverIdx = null;
            applyHandleState();
          });
          attachDrag(hr, h);
        }
        for (let i = 0; i < F3.handles.length; i++) {
          for (let j2 = i + 1; j2 < F3.handles.length; j2++) {
            if (Math.abs(hxOf[i] - hxOf[j2]) < chipW[i] + chipW[j2]) {
              overlap[i] = overlap[j2] = true;
            }
          }
        }
        function applyHandleState() {
          for (let i = 0; i < F3.handles.length; i++) {
            const h = F3.handles[i];
            const active = drag && drag.handle === h;
            chipEls[i].classList.toggle("mchip-dim", overlap[i] && hoverIdx !== i && !active);
          }
          if (drag) {
            const di = F3.handles.indexOf(drag.handle);
            if (di >= 0) raiseMarker(di);
          } else if (hoverIdx != null && hoverIdx >= 0) {
            raiseMarker(hoverIdx);
          } else {
            orderMarkers();
          }
        }
        applyHandleState();
        const zm = (f) => {
          cancelAnim();
          const d0 = currentDomain();
          const c = (d0[0] + d0[1]) / 2;
          const span = (d0[1] - d0[0]) * f;
          setDomain(c - span / 2, c + span / 2);
          draw();
        };
        const zbtn = (label, dx, f) => {
          const g = elNS("g", svg, { class: "mzoom", cursor: "pointer" });
          const cx = W - M_R - 54 + dx;
          g.addEventListener("click", (e) => {
            e.stopPropagation();
            zm(f);
          });
          elNS("rect", g, { x: cx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mzoombtn" });
          const t = elNS("text", g, { class: "mzoomtxt", x: cx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
          t.textContent = label;
          return g;
        };
        zbtn("\u2212", 0, 1.4);
        zbtn("+", 27, 1 / 1.4);
        const reset = () => {
          const d2 = {};
          for (const k of traitNames) d2[k] = F3.defaults[k];
          setParams(d2, "reset");
        };
        const rbtn = elNS("g", svg, { class: "mreset", cursor: "pointer" });
        const rcx = W - M_R - 54 - 30;
        rbtn.addEventListener("click", (e) => {
          e.stopPropagation();
          reset();
        });
        elNS("rect", rbtn, { x: rcx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mresetbtn" });
        const rt = elNS("text", rbtn, { class: "mresetxt", x: rcx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
        rt.textContent = "\u21BA";
        const fitView = () => animateView(F3.bounds(getParams()));
        const fbtn = elNS("g", svg, { class: "mfit", cursor: "pointer" });
        const fcx = rcx - 30;
        fbtn.addEventListener("click", (e) => {
          e.stopPropagation();
          fitView();
        });
        elNS("rect", fbtn, { x: fcx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mfitbtn" });
        const ft = elNS("text", fbtn, { class: "mfitxt", x: fcx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
        ft.textContent = "\u26F6";
        tip.textContent = F3.tip(p, { norm, peak });
        root.appendChild(tip);
      }
      for (const k of traitNames) model.on(`change:${k}`, () => redraw("param"));
      if (!view) {
        ensureFit(getParams());
        redraw("init");
      } else {
        redraw("param");
      }
    }
  };
}

// js/gamma.js
var A_MIN = 0.01;
var A_MAX = 400;
var A_RES = 0.965;
var Q75_PEAK = er.gamma.inv(0.75, A_RES, 1 / A_RES);
var Q75_FLOOR = er.gamma.inv(0.75, A_MAX, 1 / A_MAX);
var mean = (p) => p.alpha / p.beta;
var scale = (p) => 1 / p.beta;
function solveQ25(q, target, m) {
  const f = (a) => er.gamma.inv(q, a, m / a) - target;
  const flow = f(A_MIN);
  const fhigh = f(A_MAX);
  if (flow > 0) return A_MIN;
  if (fhigh < 0) return A_MAX;
  let lo = A_MIN;
  let hi = A_MAX;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
function bisectQ75(f, lo, hi, dir) {
  const flow = f(lo) * dir;
  const fhigh = f(hi) * dir;
  if (flow > 0) return lo;
  if (fhigh < 0) return hi;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) * dir > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
function solveQ75(q, target, m, aCur) {
  const f = (a) => er.gamma.inv(q, a, m / a) - target;
  const peak = Q75_PEAK * m;
  if (target >= peak) return A_RES;
  const floor = Q75_FLOOR * m;
  const onFalling = aCur >= A_RES;
  if (onFalling && target >= floor) {
    return bisectQ75(f, A_RES, A_MAX, -1);
  }
  return bisectQ75(f, A_MIN, A_RES, 1);
}
function translateAtShape(p, x, d) {
  const a = p.alpha;
  const span = d ? Math.max(d[1] - d[0], 1e-9) : 1;
  const m = Math.max(x, 0.01 * span);
  return { alpha: a, beta: a / m };
}
function shapeAtFixedMean(p, q, x) {
  const m = mean(p);
  const xc = Math.max(x, 1e-6);
  const a = q === 0.25 ? solveQ25(q, xc, m) : solveQ75(q, xc, m, p.alpha);
  return { alpha: a, beta: a / m };
}
var F2 = {
  name: "gamma",
  label: "Gamma",
  defaults: { alpha: 2, beta: 2 },
  support: () => [0, null],
  // left edge pinned at 0
  bounds(p) {
    const m = mean(p);
    const sd = Math.sqrt(p.alpha) / p.beta;
    return [0, m + 5.2 * sd];
  },
  integ(p) {
    const m = mean(p);
    const sd = Math.sqrt(p.alpha) / p.beta;
    return [0, m + 9 * sd];
  },
  pdf(p, x) {
    if (x <= 0) return 0;
    return er.gamma.pdf(x, p.alpha, scale(p));
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at: (p) => mean(p),
      chip: () => "mean",
      drag: (p, x, d) => translateAtShape(p, x, d)
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => er.gamma.inv(0.25, p.alpha, scale(p)),
      chip: () => "q25",
      drag: (p, x) => shapeAtFixedMean(p, 0.25, x)
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => er.gamma.inv(0.75, p.alpha, scale(p)),
      chip: () => "q75",
      drag: (p, x) => shapeAtFixedMean(p, 0.75, x)
    }
  ],
  tip(p) {
    return `${F2.label} (edge at 0) \u2022 drag mean to translate \u2022 drag q25/q75 to reshape around the mean \u2022 alpha=${fmt(p.alpha)} beta=${fmt(p.beta)}`;
  }
};
var gamma_default = createWidget(F2, { pins: "left" });
export {
  gamma_default as default
};
