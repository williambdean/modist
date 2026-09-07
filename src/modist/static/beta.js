/*! modist - MIT (c) 2026 Will Dean - https://github.com/williambdean/modist */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/jstat/dist/jstat.js
var require_jstat = __commonJS({
  "node_modules/jstat/dist/jstat.js"(exports, module) {
    (function(window, factory) {
      if (typeof exports === "object") {
        module.exports = factory();
      } else if (typeof define === "function" && define.amd) {
        define(factory);
      } else {
        window.jStat = factory();
      }
    })(exports, function() {
      var jStat2 = (function(Math2, undefined2) {
        var concat = Array.prototype.concat;
        var slice = Array.prototype.slice;
        var toString = Object.prototype.toString;
        function calcRdx(n, m) {
          var val = n > m ? n : m;
          return Math2.pow(
            10,
            17 - ~~(Math2.log(val > 0 ? val : -val) * Math2.LOG10E)
          );
        }
        var isArray = Array.isArray || function isArray2(arg) {
          return toString.call(arg) === "[object Array]";
        };
        function isFunction(arg) {
          return toString.call(arg) === "[object Function]";
        }
        function isNumber(num) {
          return typeof num === "number" ? num - num === 0 : false;
        }
        function toVector(arr) {
          return concat.apply([], arr);
        }
        function jStat3() {
          return new jStat3._init(arguments);
        }
        jStat3.fn = jStat3.prototype;
        jStat3._init = function _init(args) {
          if (isArray(args[0])) {
            if (isArray(args[0][0])) {
              if (isFunction(args[1]))
                args[0] = jStat3.map(args[0], args[1]);
              for (var i = 0; i < args[0].length; i++)
                this[i] = args[0][i];
              this.length = args[0].length;
            } else {
              this[0] = isFunction(args[1]) ? jStat3.map(args[0], args[1]) : args[0];
              this.length = 1;
            }
          } else if (isNumber(args[0])) {
            this[0] = jStat3.seq.apply(null, args);
            this.length = 1;
          } else if (args[0] instanceof jStat3) {
            return jStat3(args[0].toArray());
          } else {
            this[0] = [];
            this.length = 1;
          }
          return this;
        };
        jStat3._init.prototype = jStat3.prototype;
        jStat3._init.constructor = jStat3;
        jStat3.utils = {
          calcRdx,
          isArray,
          isFunction,
          isNumber,
          toVector
        };
        jStat3._random_fn = Math2.random;
        jStat3.setRandom = function setRandom(fn) {
          if (typeof fn !== "function")
            throw new TypeError("fn is not a function");
          jStat3._random_fn = fn;
        };
        jStat3.extend = function extend(obj) {
          var i, j;
          if (arguments.length === 1) {
            for (j in obj)
              jStat3[j] = obj[j];
            return this;
          }
          for (i = 1; i < arguments.length; i++) {
            for (j in arguments[i])
              obj[j] = arguments[i][j];
          }
          return obj;
        };
        jStat3.rows = function rows(arr) {
          return arr.length || 1;
        };
        jStat3.cols = function cols(arr) {
          return arr[0].length || 1;
        };
        jStat3.dimensions = function dimensions(arr) {
          return {
            rows: jStat3.rows(arr),
            cols: jStat3.cols(arr)
          };
        };
        jStat3.row = function row(arr, index) {
          if (isArray(index)) {
            return index.map(function(i) {
              return jStat3.row(arr, i);
            });
          }
          return arr[index];
        };
        jStat3.rowa = function rowa(arr, i) {
          return jStat3.row(arr, i);
        };
        jStat3.col = function col(arr, index) {
          if (isArray(index)) {
            var submat = jStat3.arange(arr.length).map(function() {
              return new Array(index.length);
            });
            index.forEach(function(ind, i2) {
              jStat3.arange(arr.length).forEach(function(j) {
                submat[j][i2] = arr[j][ind];
              });
            });
            return submat;
          }
          var column = new Array(arr.length);
          for (var i = 0; i < arr.length; i++)
            column[i] = [arr[i][index]];
          return column;
        };
        jStat3.cola = function cola(arr, i) {
          return jStat3.col(arr, i).map(function(a) {
            return a[0];
          });
        };
        jStat3.diag = function diag(arr) {
          var nrow = jStat3.rows(arr);
          var res = new Array(nrow);
          for (var row = 0; row < nrow; row++)
            res[row] = [arr[row][row]];
          return res;
        };
        jStat3.antidiag = function antidiag(arr) {
          var nrow = jStat3.rows(arr) - 1;
          var res = new Array(nrow);
          for (var i = 0; nrow >= 0; nrow--, i++)
            res[i] = [arr[i][nrow]];
          return res;
        };
        jStat3.transpose = function transpose(arr) {
          var obj = [];
          var objArr, rows, cols, j, i;
          if (!isArray(arr[0]))
            arr = [arr];
          rows = arr.length;
          cols = arr[0].length;
          for (i = 0; i < cols; i++) {
            objArr = new Array(rows);
            for (j = 0; j < rows; j++)
              objArr[j] = arr[j][i];
            obj.push(objArr);
          }
          return obj.length === 1 ? obj[0] : obj;
        };
        jStat3.map = function map(arr, func, toAlter) {
          var row, nrow, ncol, res, col;
          if (!isArray(arr[0]))
            arr = [arr];
          nrow = arr.length;
          ncol = arr[0].length;
          res = toAlter ? arr : new Array(nrow);
          for (row = 0; row < nrow; row++) {
            if (!res[row])
              res[row] = new Array(ncol);
            for (col = 0; col < ncol; col++)
              res[row][col] = func(arr[row][col], row, col);
          }
          return res.length === 1 ? res[0] : res;
        };
        jStat3.cumreduce = function cumreduce(arr, func, toAlter) {
          var row, nrow, ncol, res, col;
          if (!isArray(arr[0]))
            arr = [arr];
          nrow = arr.length;
          ncol = arr[0].length;
          res = toAlter ? arr : new Array(nrow);
          for (row = 0; row < nrow; row++) {
            if (!res[row])
              res[row] = new Array(ncol);
            if (ncol > 0)
              res[row][0] = arr[row][0];
            for (col = 1; col < ncol; col++)
              res[row][col] = func(res[row][col - 1], arr[row][col]);
          }
          return res.length === 1 ? res[0] : res;
        };
        jStat3.alter = function alter(arr, func) {
          return jStat3.map(arr, func, true);
        };
        jStat3.create = function create(rows, cols, func) {
          var res = new Array(rows);
          var i, j;
          if (isFunction(cols)) {
            func = cols;
            cols = rows;
          }
          for (i = 0; i < rows; i++) {
            res[i] = new Array(cols);
            for (j = 0; j < cols; j++)
              res[i][j] = func(i, j);
          }
          return res;
        };
        function retZero() {
          return 0;
        }
        jStat3.zeros = function zeros(rows, cols) {
          if (!isNumber(cols))
            cols = rows;
          return jStat3.create(rows, cols, retZero);
        };
        function retOne() {
          return 1;
        }
        jStat3.ones = function ones(rows, cols) {
          if (!isNumber(cols))
            cols = rows;
          return jStat3.create(rows, cols, retOne);
        };
        jStat3.rand = function rand(rows, cols) {
          if (!isNumber(cols))
            cols = rows;
          return jStat3.create(rows, cols, jStat3._random_fn);
        };
        function retIdent(i, j) {
          return i === j ? 1 : 0;
        }
        jStat3.identity = function identity(rows, cols) {
          if (!isNumber(cols))
            cols = rows;
          return jStat3.create(rows, cols, retIdent);
        };
        jStat3.symmetric = function symmetric(arr) {
          var size = arr.length;
          var row, col;
          if (arr.length !== arr[0].length)
            return false;
          for (row = 0; row < size; row++) {
            for (col = 0; col < size; col++)
              if (arr[col][row] !== arr[row][col])
                return false;
          }
          return true;
        };
        jStat3.clear = function clear(arr) {
          return jStat3.alter(arr, retZero);
        };
        jStat3.seq = function seq(min, max, length, func) {
          if (!isFunction(func))
            func = false;
          var arr = [];
          var hival = calcRdx(min, max);
          var step = (max * hival - min * hival) / ((length - 1) * hival);
          var current = min;
          var cnt;
          for (cnt = 0; current <= max && cnt < length; cnt++, current = (min * hival + step * hival * cnt) / hival) {
            arr.push(func ? func(current, cnt) : current);
          }
          return arr;
        };
        jStat3.arange = function arange(start, end, step) {
          var rl = [];
          var i;
          step = step || 1;
          if (end === undefined2) {
            end = start;
            start = 0;
          }
          if (start === end || step === 0) {
            return [];
          }
          if (start < end && step < 0) {
            return [];
          }
          if (start > end && step > 0) {
            return [];
          }
          if (step > 0) {
            for (i = start; i < end; i += step) {
              rl.push(i);
            }
          } else {
            for (i = start; i > end; i += step) {
              rl.push(i);
            }
          }
          return rl;
        };
        jStat3.slice = /* @__PURE__ */ (function() {
          function _slice(list, start, end, step) {
            var i;
            var rl = [];
            var length = list.length;
            if (start === undefined2 && end === undefined2 && step === undefined2) {
              return jStat3.copy(list);
            }
            start = start || 0;
            end = end || list.length;
            start = start >= 0 ? start : length + start;
            end = end >= 0 ? end : length + end;
            step = step || 1;
            if (start === end || step === 0) {
              return [];
            }
            if (start < end && step < 0) {
              return [];
            }
            if (start > end && step > 0) {
              return [];
            }
            if (step > 0) {
              for (i = start; i < end; i += step) {
                rl.push(list[i]);
              }
            } else {
              for (i = start; i > end; i += step) {
                rl.push(list[i]);
              }
            }
            return rl;
          }
          function slice2(list, rcSlice) {
            var colSlice, rowSlice;
            rcSlice = rcSlice || {};
            if (isNumber(rcSlice.row)) {
              if (isNumber(rcSlice.col))
                return list[rcSlice.row][rcSlice.col];
              var row = jStat3.rowa(list, rcSlice.row);
              colSlice = rcSlice.col || {};
              return _slice(row, colSlice.start, colSlice.end, colSlice.step);
            }
            if (isNumber(rcSlice.col)) {
              var col = jStat3.cola(list, rcSlice.col);
              rowSlice = rcSlice.row || {};
              return _slice(col, rowSlice.start, rowSlice.end, rowSlice.step);
            }
            rowSlice = rcSlice.row || {};
            colSlice = rcSlice.col || {};
            var rows = _slice(list, rowSlice.start, rowSlice.end, rowSlice.step);
            return rows.map(function(row2) {
              return _slice(row2, colSlice.start, colSlice.end, colSlice.step);
            });
          }
          return slice2;
        })();
        jStat3.sliceAssign = function sliceAssign(A, rcSlice, B) {
          var nl, ml;
          if (isNumber(rcSlice.row)) {
            if (isNumber(rcSlice.col))
              return A[rcSlice.row][rcSlice.col] = B;
            rcSlice.col = rcSlice.col || {};
            rcSlice.col.start = rcSlice.col.start || 0;
            rcSlice.col.end = rcSlice.col.end || A[0].length;
            rcSlice.col.step = rcSlice.col.step || 1;
            nl = jStat3.arange(
              rcSlice.col.start,
              Math2.min(A.length, rcSlice.col.end),
              rcSlice.col.step
            );
            var m = rcSlice.row;
            nl.forEach(function(n2, i) {
              A[m][n2] = B[i];
            });
            return A;
          }
          if (isNumber(rcSlice.col)) {
            rcSlice.row = rcSlice.row || {};
            rcSlice.row.start = rcSlice.row.start || 0;
            rcSlice.row.end = rcSlice.row.end || A.length;
            rcSlice.row.step = rcSlice.row.step || 1;
            ml = jStat3.arange(
              rcSlice.row.start,
              Math2.min(A[0].length, rcSlice.row.end),
              rcSlice.row.step
            );
            var n = rcSlice.col;
            ml.forEach(function(m2, j) {
              A[m2][n] = B[j];
            });
            return A;
          }
          if (B[0].length === undefined2) {
            B = [B];
          }
          rcSlice.row.start = rcSlice.row.start || 0;
          rcSlice.row.end = rcSlice.row.end || A.length;
          rcSlice.row.step = rcSlice.row.step || 1;
          rcSlice.col.start = rcSlice.col.start || 0;
          rcSlice.col.end = rcSlice.col.end || A[0].length;
          rcSlice.col.step = rcSlice.col.step || 1;
          ml = jStat3.arange(
            rcSlice.row.start,
            Math2.min(A.length, rcSlice.row.end),
            rcSlice.row.step
          );
          nl = jStat3.arange(
            rcSlice.col.start,
            Math2.min(A[0].length, rcSlice.col.end),
            rcSlice.col.step
          );
          ml.forEach(function(m2, i) {
            nl.forEach(function(n2, j) {
              A[m2][n2] = B[i][j];
            });
          });
          return A;
        };
        jStat3.diagonal = function diagonal(diagArray) {
          var mat = jStat3.zeros(diagArray.length, diagArray.length);
          diagArray.forEach(function(t, i) {
            mat[i][i] = t;
          });
          return mat;
        };
        jStat3.copy = function copy(A) {
          return A.map(function(row) {
            if (isNumber(row))
              return row;
            return row.map(function(t) {
              return t;
            });
          });
        };
        var jProto = jStat3.prototype;
        jProto.length = 0;
        jProto.push = Array.prototype.push;
        jProto.sort = Array.prototype.sort;
        jProto.splice = Array.prototype.splice;
        jProto.slice = Array.prototype.slice;
        jProto.toArray = function toArray() {
          return this.length > 1 ? slice.call(this) : slice.call(this)[0];
        };
        jProto.map = function map(func, toAlter) {
          return jStat3(jStat3.map(this, func, toAlter));
        };
        jProto.cumreduce = function cumreduce(func, toAlter) {
          return jStat3(jStat3.cumreduce(this, func, toAlter));
        };
        jProto.alter = function alter(func) {
          jStat3.alter(this, func);
          return this;
        };
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jProto[passfunc] = function(func) {
              var self = this, results;
              if (func) {
                setTimeout(function() {
                  func.call(self, jProto[passfunc].call(self));
                });
                return this;
              }
              results = jStat3[passfunc](this);
              return isArray(results) ? jStat3(results) : results;
            };
          })(funcs[i]);
        })("transpose clear symmetric rows cols dimensions diag antidiag".split(" "));
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jProto[passfunc] = function(index, func) {
              var self = this;
              if (func) {
                setTimeout(function() {
                  func.call(self, jProto[passfunc].call(self, index));
                });
                return this;
              }
              return jStat3(jStat3[passfunc](this, index));
            };
          })(funcs[i]);
        })("row col".split(" "));
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jProto[passfunc] = function() {
              return jStat3(jStat3[passfunc].apply(null, arguments));
            };
          })(funcs[i]);
        })("create zeros ones rand identity".split(" "));
        return jStat3;
      })(Math);
      (function(jStat3, Math2) {
        var isFunction = jStat3.utils.isFunction;
        function ascNum(a, b) {
          return a - b;
        }
        function clip(arg, min, max) {
          return Math2.max(min, Math2.min(arg, max));
        }
        jStat3.sum = function sum(arr) {
          var sum2 = 0;
          var i = arr.length;
          while (--i >= 0)
            sum2 += arr[i];
          return sum2;
        };
        jStat3.sumsqrd = function sumsqrd(arr) {
          var sum = 0;
          var i = arr.length;
          while (--i >= 0)
            sum += arr[i] * arr[i];
          return sum;
        };
        jStat3.sumsqerr = function sumsqerr(arr) {
          var mean2 = jStat3.mean(arr);
          var sum = 0;
          var i = arr.length;
          var tmp;
          while (--i >= 0) {
            tmp = arr[i] - mean2;
            sum += tmp * tmp;
          }
          return sum;
        };
        jStat3.sumrow = function sumrow(arr) {
          var sum = 0;
          var i = arr.length;
          while (--i >= 0)
            sum += arr[i];
          return sum;
        };
        jStat3.product = function product(arr) {
          var prod = 1;
          var i = arr.length;
          while (--i >= 0)
            prod *= arr[i];
          return prod;
        };
        jStat3.min = function min(arr) {
          var low = arr[0];
          var i = 0;
          while (++i < arr.length)
            if (arr[i] < low)
              low = arr[i];
          return low;
        };
        jStat3.max = function max(arr) {
          var high = arr[0];
          var i = 0;
          while (++i < arr.length)
            if (arr[i] > high)
              high = arr[i];
          return high;
        };
        jStat3.unique = function unique(arr) {
          var hash = {}, _arr = [];
          for (var i = 0; i < arr.length; i++) {
            if (!hash[arr[i]]) {
              hash[arr[i]] = true;
              _arr.push(arr[i]);
            }
          }
          return _arr;
        };
        jStat3.mean = function mean2(arr) {
          return jStat3.sum(arr) / arr.length;
        };
        jStat3.meansqerr = function meansqerr(arr) {
          return jStat3.sumsqerr(arr) / arr.length;
        };
        jStat3.geomean = function geomean(arr) {
          var logs = arr.map(Math2.log);
          var meanOfLogs = jStat3.mean(logs);
          return Math2.exp(meanOfLogs);
        };
        jStat3.median = function median(arr) {
          var arrlen = arr.length;
          var _arr = arr.slice().sort(ascNum);
          return !(arrlen & 1) ? (_arr[arrlen / 2 - 1] + _arr[arrlen / 2]) / 2 : _arr[arrlen / 2 | 0];
        };
        jStat3.cumsum = function cumsum(arr) {
          return jStat3.cumreduce(arr, function(a, b) {
            return a + b;
          });
        };
        jStat3.cumprod = function cumprod(arr) {
          return jStat3.cumreduce(arr, function(a, b) {
            return a * b;
          });
        };
        jStat3.diff = function diff(arr) {
          var diffs = [];
          var arrLen = arr.length;
          var i;
          for (i = 1; i < arrLen; i++)
            diffs.push(arr[i] - arr[i - 1]);
          return diffs;
        };
        jStat3.rank = function(arr) {
          var i;
          var distinctNumbers = [];
          var numberCounts = {};
          for (i = 0; i < arr.length; i++) {
            var number = arr[i];
            if (numberCounts[number]) {
              numberCounts[number]++;
            } else {
              numberCounts[number] = 1;
              distinctNumbers.push(number);
            }
          }
          var sortedDistinctNumbers = distinctNumbers.sort(ascNum);
          var numberRanks = {};
          var currentRank = 1;
          for (i = 0; i < sortedDistinctNumbers.length; i++) {
            var number = sortedDistinctNumbers[i];
            var count = numberCounts[number];
            var first = currentRank;
            var last = currentRank + count - 1;
            var rank = (first + last) / 2;
            numberRanks[number] = rank;
            currentRank += count;
          }
          return arr.map(function(number2) {
            return numberRanks[number2];
          });
        };
        jStat3.mode = function mode(arr) {
          var arrLen = arr.length;
          var _arr = arr.slice().sort(ascNum);
          var count = 1;
          var maxCount = 0;
          var numMaxCount = 0;
          var mode_arr = [];
          var i;
          for (i = 0; i < arrLen; i++) {
            if (_arr[i] === _arr[i + 1]) {
              count++;
            } else {
              if (count > maxCount) {
                mode_arr = [_arr[i]];
                maxCount = count;
                numMaxCount = 0;
              } else if (count === maxCount) {
                mode_arr.push(_arr[i]);
                numMaxCount++;
              }
              count = 1;
            }
          }
          return numMaxCount === 0 ? mode_arr[0] : mode_arr;
        };
        jStat3.range = function range(arr) {
          return jStat3.max(arr) - jStat3.min(arr);
        };
        jStat3.variance = function variance(arr, flag) {
          return jStat3.sumsqerr(arr) / (arr.length - (flag ? 1 : 0));
        };
        jStat3.pooledvariance = function pooledvariance(arr) {
          var sumsqerr = arr.reduce(function(a, samples) {
            return a + jStat3.sumsqerr(samples);
          }, 0);
          var count = arr.reduce(function(a, samples) {
            return a + samples.length;
          }, 0);
          return sumsqerr / (count - arr.length);
        };
        jStat3.deviation = function(arr) {
          var mean2 = jStat3.mean(arr);
          var arrlen = arr.length;
          var dev = new Array(arrlen);
          for (var i = 0; i < arrlen; i++) {
            dev[i] = arr[i] - mean2;
          }
          return dev;
        };
        jStat3.stdev = function stdev(arr, flag) {
          return Math2.sqrt(jStat3.variance(arr, flag));
        };
        jStat3.pooledstdev = function pooledstdev(arr) {
          return Math2.sqrt(jStat3.pooledvariance(arr));
        };
        jStat3.meandev = function meandev(arr) {
          var mean2 = jStat3.mean(arr);
          var a = [];
          for (var i = arr.length - 1; i >= 0; i--) {
            a.push(Math2.abs(arr[i] - mean2));
          }
          return jStat3.mean(a);
        };
        jStat3.meddev = function meddev(arr) {
          var median = jStat3.median(arr);
          var a = [];
          for (var i = arr.length - 1; i >= 0; i--) {
            a.push(Math2.abs(arr[i] - median));
          }
          return jStat3.median(a);
        };
        jStat3.coeffvar = function coeffvar(arr) {
          return jStat3.stdev(arr) / jStat3.mean(arr);
        };
        jStat3.quartiles = function quartiles(arr) {
          var arrlen = arr.length;
          var _arr = arr.slice().sort(ascNum);
          return [
            _arr[Math2.round(arrlen / 4) - 1],
            _arr[Math2.round(arrlen / 2) - 1],
            _arr[Math2.round(arrlen * 3 / 4) - 1]
          ];
        };
        jStat3.quantiles = function quantiles(arr, quantilesArray, alphap, betap) {
          var sortedArray = arr.slice().sort(ascNum);
          var quantileVals = [quantilesArray.length];
          var n = arr.length;
          var i, p, m, aleph, k, gamma;
          if (typeof alphap === "undefined")
            alphap = 3 / 8;
          if (typeof betap === "undefined")
            betap = 3 / 8;
          for (i = 0; i < quantilesArray.length; i++) {
            p = quantilesArray[i];
            m = alphap + p * (1 - alphap - betap);
            aleph = n * p + m;
            k = Math2.floor(clip(aleph, 1, n - 1));
            gamma = clip(aleph - k, 0, 1);
            quantileVals[i] = (1 - gamma) * sortedArray[k - 1] + gamma * sortedArray[k];
          }
          return quantileVals;
        };
        jStat3.percentile = function percentile(arr, k, exclusive) {
          var _arr = arr.slice().sort(ascNum);
          var realIndex = k * (_arr.length + (exclusive ? 1 : -1)) + (exclusive ? 0 : 1);
          var index = parseInt(realIndex);
          var frac = realIndex - index;
          if (index + 1 < _arr.length) {
            return _arr[index - 1] + frac * (_arr[index] - _arr[index - 1]);
          } else {
            return _arr[index - 1];
          }
        };
        jStat3.percentileOfScore = function percentileOfScore(arr, score, kind) {
          var counter = 0;
          var len = arr.length;
          var strict = false;
          var value, i;
          if (kind === "strict")
            strict = true;
          for (i = 0; i < len; i++) {
            value = arr[i];
            if (strict && value < score || !strict && value <= score) {
              counter++;
            }
          }
          return counter / len;
        };
        jStat3.histogram = function histogram(arr, binCnt) {
          binCnt = binCnt || 4;
          var first = jStat3.min(arr);
          var binWidth = (jStat3.max(arr) - first) / binCnt;
          var len = arr.length;
          var bins = [];
          var i;
          for (i = 0; i < binCnt; i++)
            bins[i] = 0;
          for (i = 0; i < len; i++)
            bins[Math2.min(Math2.floor((arr[i] - first) / binWidth), binCnt - 1)] += 1;
          return bins;
        };
        jStat3.covariance = function covariance(arr1, arr2) {
          var u = jStat3.mean(arr1);
          var v = jStat3.mean(arr2);
          var arr1Len = arr1.length;
          var sq_dev = new Array(arr1Len);
          var i;
          for (i = 0; i < arr1Len; i++)
            sq_dev[i] = (arr1[i] - u) * (arr2[i] - v);
          return jStat3.sum(sq_dev) / (arr1Len - 1);
        };
        jStat3.corrcoeff = function corrcoeff(arr1, arr2) {
          return jStat3.covariance(arr1, arr2) / jStat3.stdev(arr1, 1) / jStat3.stdev(arr2, 1);
        };
        jStat3.spearmancoeff = function(arr1, arr2) {
          arr1 = jStat3.rank(arr1);
          arr2 = jStat3.rank(arr2);
          return jStat3.corrcoeff(arr1, arr2);
        };
        jStat3.stanMoment = function stanMoment(arr, n) {
          var mu = jStat3.mean(arr);
          var sigma = jStat3.stdev(arr);
          var len = arr.length;
          var skewSum = 0;
          for (var i = 0; i < len; i++)
            skewSum += Math2.pow((arr[i] - mu) / sigma, n);
          return skewSum / arr.length;
        };
        jStat3.skewness = function skewness(arr) {
          return jStat3.stanMoment(arr, 3);
        };
        jStat3.kurtosis = function kurtosis(arr) {
          return jStat3.stanMoment(arr, 4) - 3;
        };
        var jProto = jStat3.prototype;
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jProto[passfunc] = function(fullbool, func) {
              var arr = [];
              var i2 = 0;
              var tmpthis = this;
              if (isFunction(fullbool)) {
                func = fullbool;
                fullbool = false;
              }
              if (func) {
                setTimeout(function() {
                  func.call(tmpthis, jProto[passfunc].call(tmpthis, fullbool));
                });
                return this;
              }
              if (this.length > 1) {
                tmpthis = fullbool === true ? this : this.transpose();
                for (; i2 < tmpthis.length; i2++)
                  arr[i2] = jStat3[passfunc](tmpthis[i2]);
                return arr;
              }
              return jStat3[passfunc](this[0], fullbool);
            };
          })(funcs[i]);
        })("cumsum cumprod".split(" "));
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jProto[passfunc] = function(fullbool, func) {
              var arr = [];
              var i2 = 0;
              var tmpthis = this;
              if (isFunction(fullbool)) {
                func = fullbool;
                fullbool = false;
              }
              if (func) {
                setTimeout(function() {
                  func.call(tmpthis, jProto[passfunc].call(tmpthis, fullbool));
                });
                return this;
              }
              if (this.length > 1) {
                if (passfunc !== "sumrow")
                  tmpthis = fullbool === true ? this : this.transpose();
                for (; i2 < tmpthis.length; i2++)
                  arr[i2] = jStat3[passfunc](tmpthis[i2]);
                return fullbool === true ? jStat3[passfunc](jStat3.utils.toVector(arr)) : arr;
              }
              return jStat3[passfunc](this[0], fullbool);
            };
          })(funcs[i]);
        })("sum sumsqrd sumsqerr sumrow product min max unique mean meansqerr geomean median diff rank mode range variance deviation stdev meandev meddev coeffvar quartiles histogram skewness kurtosis".split(" "));
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jProto[passfunc] = function() {
              var arr = [];
              var i2 = 0;
              var tmpthis = this;
              var args = Array.prototype.slice.call(arguments);
              var callbackFunction;
              if (isFunction(args[args.length - 1])) {
                callbackFunction = args[args.length - 1];
                var argsToPass = args.slice(0, args.length - 1);
                setTimeout(function() {
                  callbackFunction.call(
                    tmpthis,
                    jProto[passfunc].apply(tmpthis, argsToPass)
                  );
                });
                return this;
              } else {
                callbackFunction = void 0;
                var curriedFunction = function curriedFunction2(vector) {
                  return jStat3[passfunc].apply(tmpthis, [vector].concat(args));
                };
              }
              if (this.length > 1) {
                tmpthis = tmpthis.transpose();
                for (; i2 < tmpthis.length; i2++)
                  arr[i2] = curriedFunction(tmpthis[i2]);
                return arr;
              }
              return curriedFunction(this[0]);
            };
          })(funcs[i]);
        })("quantiles percentileOfScore".split(" "));
      })(jStat2, Math);
      (function(jStat3, Math2) {
        jStat3.gammaln = function gammaln(x) {
          var j = 0;
          var cof = [
            76.18009172947146,
            -86.50532032941678,
            24.01409824083091,
            -1.231739572450155,
            0.001208650973866179,
            -5395239384953e-18
          ];
          var ser = 1.000000000190015;
          var xx, y, tmp;
          tmp = (y = xx = x) + 5.5;
          tmp -= (xx + 0.5) * Math2.log(tmp);
          for (; j < 6; j++)
            ser += cof[j] / ++y;
          return Math2.log(2.5066282746310007 * ser / xx) - tmp;
        };
        jStat3.loggam = function loggam(x) {
          var x0, x2, xp, gl, gl0;
          var k, n;
          var a = [
            0.08333333333333333,
            -0.002777777777777778,
            7936507936507937e-19,
            -5952380952380952e-19,
            8417508417508418e-19,
            -0.001917526917526918,
            0.00641025641025641,
            -0.02955065359477124,
            0.1796443723688307,
            -1.3924322169059
          ];
          x0 = x;
          n = 0;
          if (x == 1 || x == 2) {
            return 0;
          }
          if (x <= 7) {
            n = Math2.floor(7 - x);
            x0 = x + n;
          }
          x2 = 1 / (x0 * x0);
          xp = 2 * Math2.PI;
          gl0 = a[9];
          for (k = 8; k >= 0; k--) {
            gl0 *= x2;
            gl0 += a[k];
          }
          gl = gl0 / x0 + 0.5 * Math2.log(xp) + (x0 - 0.5) * Math2.log(x0) - x0;
          if (x <= 7) {
            for (k = 1; k <= n; k++) {
              gl -= Math2.log(x0 - 1);
              x0 -= 1;
            }
          }
          return gl;
        };
        jStat3.gammafn = function gammafn(x) {
          var p = [
            -1.716185138865495,
            24.76565080557592,
            -379.80425647094563,
            629.3311553128184,
            866.9662027904133,
            -31451.272968848367,
            -36144.413418691176,
            66456.14382024054
          ];
          var q = [
            -30.8402300119739,
            315.35062697960416,
            -1015.1563674902192,
            -3107.771671572311,
            22538.11842098015,
            4755.846277527881,
            -134659.9598649693,
            -115132.2596755535
          ];
          var fact = false;
          var n = 0;
          var xden = 0;
          var xnum = 0;
          var y = x;
          var i, z, yi, res;
          if (x > 171.6243769536076) {
            return Infinity;
          }
          if (y <= 0) {
            res = y % 1 + 36e-17;
            if (res) {
              fact = (!(y & 1) ? 1 : -1) * Math2.PI / Math2.sin(Math2.PI * res);
              y = 1 - y;
            } else {
              return Infinity;
            }
          }
          yi = y;
          if (y < 1) {
            z = y++;
          } else {
            z = (y -= n = (y | 0) - 1) - 1;
          }
          for (i = 0; i < 8; ++i) {
            xnum = (xnum + p[i]) * z;
            xden = xden * z + q[i];
          }
          res = xnum / xden + 1;
          if (yi < y) {
            res /= yi;
          } else if (yi > y) {
            for (i = 0; i < n; ++i) {
              res *= y;
              y++;
            }
          }
          if (fact) {
            res = fact / res;
          }
          return res;
        };
        jStat3.gammap = function gammap(a, x) {
          return jStat3.lowRegGamma(a, x) * jStat3.gammafn(a);
        };
        jStat3.lowRegGamma = function lowRegGamma(a, x) {
          var aln = jStat3.gammaln(a);
          var ap = a;
          var sum = 1 / a;
          var del = sum;
          var b = x + 1 - a;
          var c = 1 / 1e-30;
          var d = 1 / b;
          var h = d;
          var i = 1;
          var ITMAX = -~(Math2.log(a >= 1 ? a : 1 / a) * 8.5 + a * 0.4 + 17);
          var an;
          if (x < 0 || a <= 0) {
            return NaN;
          } else if (x < a + 1) {
            for (; i <= ITMAX; i++) {
              sum += del *= x / ++ap;
            }
            return sum * Math2.exp(-x + a * Math2.log(x) - aln);
          }
          for (; i <= ITMAX; i++) {
            an = -i * (i - a);
            b += 2;
            d = an * d + b;
            c = b + an / c;
            d = 1 / d;
            h *= d * c;
          }
          return 1 - h * Math2.exp(-x + a * Math2.log(x) - aln);
        };
        jStat3.factorialln = function factorialln(n) {
          return n < 0 ? NaN : jStat3.gammaln(n + 1);
        };
        jStat3.factorial = function factorial(n) {
          return n < 0 ? NaN : jStat3.gammafn(n + 1);
        };
        jStat3.combination = function combination(n, m) {
          return n > 170 || m > 170 ? Math2.exp(jStat3.combinationln(n, m)) : jStat3.factorial(n) / jStat3.factorial(m) / jStat3.factorial(n - m);
        };
        jStat3.combinationln = function combinationln(n, m) {
          return jStat3.factorialln(n) - jStat3.factorialln(m) - jStat3.factorialln(n - m);
        };
        jStat3.permutation = function permutation(n, m) {
          return jStat3.factorial(n) / jStat3.factorial(n - m);
        };
        jStat3.betafn = function betafn(x, y) {
          if (x <= 0 || y <= 0)
            return void 0;
          return x + y > 170 ? Math2.exp(jStat3.betaln(x, y)) : jStat3.gammafn(x) * jStat3.gammafn(y) / jStat3.gammafn(x + y);
        };
        jStat3.betaln = function betaln(x, y) {
          return jStat3.gammaln(x) + jStat3.gammaln(y) - jStat3.gammaln(x + y);
        };
        jStat3.betacf = function betacf(x, a, b) {
          var fpmin = 1e-30;
          var m = 1;
          var qab = a + b;
          var qap = a + 1;
          var qam = a - 1;
          var c = 1;
          var d = 1 - qab * x / qap;
          var m2, aa, del, h;
          if (Math2.abs(d) < fpmin)
            d = fpmin;
          d = 1 / d;
          h = d;
          for (; m <= 100; m++) {
            m2 = 2 * m;
            aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1 + aa * d;
            if (Math2.abs(d) < fpmin)
              d = fpmin;
            c = 1 + aa / c;
            if (Math2.abs(c) < fpmin)
              c = fpmin;
            d = 1 / d;
            h *= d * c;
            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1 + aa * d;
            if (Math2.abs(d) < fpmin)
              d = fpmin;
            c = 1 + aa / c;
            if (Math2.abs(c) < fpmin)
              c = fpmin;
            d = 1 / d;
            del = d * c;
            h *= del;
            if (Math2.abs(del - 1) < 3e-7)
              break;
          }
          return h;
        };
        jStat3.gammapinv = function gammapinv(p, a) {
          var j = 0;
          var a1 = a - 1;
          var EPS = 1e-8;
          var gln = jStat3.gammaln(a);
          var x, err, t, u, pp, lna1, afac;
          if (p >= 1)
            return Math2.max(100, a + 100 * Math2.sqrt(a));
          if (p <= 0)
            return 0;
          if (a > 1) {
            lna1 = Math2.log(a1);
            afac = Math2.exp(a1 * (lna1 - 1) - gln);
            pp = p < 0.5 ? p : 1 - p;
            t = Math2.sqrt(-2 * Math2.log(pp));
            x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
            if (p < 0.5)
              x = -x;
            x = Math2.max(
              1e-3,
              a * Math2.pow(1 - 1 / (9 * a) - x / (3 * Math2.sqrt(a)), 3)
            );
          } else {
            t = 1 - a * (0.253 + a * 0.12);
            if (p < t)
              x = Math2.pow(p / t, 1 / a);
            else
              x = 1 - Math2.log(1 - (p - t) / (1 - t));
          }
          for (; j < 12; j++) {
            if (x <= 0)
              return 0;
            err = jStat3.lowRegGamma(a, x) - p;
            if (a > 1)
              t = afac * Math2.exp(-(x - a1) + a1 * (Math2.log(x) - lna1));
            else
              t = Math2.exp(-x + a1 * Math2.log(x) - gln);
            u = err / t;
            x -= t = u / (1 - 0.5 * Math2.min(1, u * ((a - 1) / x - 1)));
            if (x <= 0)
              x = 0.5 * (x + t);
            if (Math2.abs(t) < EPS * x)
              break;
          }
          return x;
        };
        jStat3.erf = function erf(x) {
          var cof = [
            -1.3026537197817094,
            0.6419697923564902,
            0.019476473204185836,
            -0.00956151478680863,
            -946595344482036e-18,
            366839497852761e-18,
            42523324806907e-18,
            -20278578112534e-18,
            -1624290004647e-18,
            130365583558e-17,
            15626441722e-18,
            -85238095915e-18,
            6529054439e-18,
            5059343495e-18,
            -991364156e-18,
            -227365122e-18,
            96467911e-18,
            2394038e-18,
            -6886027e-18,
            894487e-18,
            313092e-18,
            -112708e-18,
            381e-18,
            7106e-18,
            -1523e-18,
            -94e-18,
            121e-18,
            -28e-18
          ];
          var j = cof.length - 1;
          var isneg = false;
          var d = 0;
          var dd = 0;
          var t, ty, tmp, res;
          if (x < 0) {
            x = -x;
            isneg = true;
          }
          t = 2 / (2 + x);
          ty = 4 * t - 2;
          for (; j > 0; j--) {
            tmp = d;
            d = ty * d - dd + cof[j];
            dd = tmp;
          }
          res = t * Math2.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
          return isneg ? res - 1 : 1 - res;
        };
        jStat3.erfc = function erfc(x) {
          return 1 - jStat3.erf(x);
        };
        jStat3.erfcinv = function erfcinv(p) {
          var j = 0;
          var x, err, t, pp;
          if (p >= 2)
            return -100;
          if (p <= 0)
            return 100;
          pp = p < 1 ? p : 2 - p;
          t = Math2.sqrt(-2 * Math2.log(pp / 2));
          x = -0.70711 * ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);
          for (; j < 2; j++) {
            err = jStat3.erfc(x) - pp;
            x += err / (1.1283791670955126 * Math2.exp(-x * x) - x * err);
          }
          return p < 1 ? x : -x;
        };
        jStat3.ibetainv = function ibetainv(p, a, b) {
          var EPS = 1e-8;
          var a1 = a - 1;
          var b1 = b - 1;
          var j = 0;
          var lna, lnb, pp, t, u, err, x, al, h, w, afac;
          if (p <= 0)
            return 0;
          if (p >= 1)
            return 1;
          if (a >= 1 && b >= 1) {
            pp = p < 0.5 ? p : 1 - p;
            t = Math2.sqrt(-2 * Math2.log(pp));
            x = (2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t;
            if (p < 0.5)
              x = -x;
            al = (x * x - 3) / 6;
            h = 2 / (1 / (2 * a - 1) + 1 / (2 * b - 1));
            w = x * Math2.sqrt(al + h) / h - (1 / (2 * b - 1) - 1 / (2 * a - 1)) * (al + 5 / 6 - 2 / (3 * h));
            x = a / (a + b * Math2.exp(2 * w));
          } else {
            lna = Math2.log(a / (a + b));
            lnb = Math2.log(b / (a + b));
            t = Math2.exp(a * lna) / a;
            u = Math2.exp(b * lnb) / b;
            w = t + u;
            if (p < t / w)
              x = Math2.pow(a * w * p, 1 / a);
            else
              x = 1 - Math2.pow(b * w * (1 - p), 1 / b);
          }
          afac = -jStat3.gammaln(a) - jStat3.gammaln(b) + jStat3.gammaln(a + b);
          for (; j < 10; j++) {
            if (x === 0 || x === 1)
              return x;
            err = jStat3.ibeta(x, a, b) - p;
            t = Math2.exp(a1 * Math2.log(x) + b1 * Math2.log(1 - x) + afac);
            u = err / t;
            x -= t = u / (1 - 0.5 * Math2.min(1, u * (a1 / x - b1 / (1 - x))));
            if (x <= 0)
              x = 0.5 * (x + t);
            if (x >= 1)
              x = 0.5 * (x + t + 1);
            if (Math2.abs(t) < EPS * x && j > 0)
              break;
          }
          return x;
        };
        jStat3.ibeta = function ibeta(x, a, b) {
          var bt = x === 0 || x === 1 ? 0 : Math2.exp(jStat3.gammaln(a + b) - jStat3.gammaln(a) - jStat3.gammaln(b) + a * Math2.log(x) + b * Math2.log(1 - x));
          if (x < 0 || x > 1)
            return false;
          if (x < (a + 1) / (a + b + 2))
            return bt * jStat3.betacf(x, a, b) / a;
          return 1 - bt * jStat3.betacf(1 - x, b, a) / b;
        };
        jStat3.randn = function randn(n, m) {
          var u, v, x, y, q;
          if (!m)
            m = n;
          if (n)
            return jStat3.create(n, m, function() {
              return jStat3.randn();
            });
          do {
            u = jStat3._random_fn();
            v = 1.7156 * (jStat3._random_fn() - 0.5);
            x = u - 0.449871;
            y = Math2.abs(v) + 0.386595;
            q = x * x + y * (0.196 * y - 0.25472 * x);
          } while (q > 0.27597 && (q > 0.27846 || v * v > -4 * Math2.log(u) * u * u));
          return v / u;
        };
        jStat3.randg = function randg(shape, n, m) {
          var oalph = shape;
          var a1, a2, u, v, x, mat;
          if (!m)
            m = n;
          if (!shape)
            shape = 1;
          if (n) {
            mat = jStat3.zeros(n, m);
            mat.alter(function() {
              return jStat3.randg(shape);
            });
            return mat;
          }
          if (shape < 1)
            shape += 1;
          a1 = shape - 1 / 3;
          a2 = 1 / Math2.sqrt(9 * a1);
          do {
            do {
              x = jStat3.randn();
              v = 1 + a2 * x;
            } while (v <= 0);
            v = v * v * v;
            u = jStat3._random_fn();
          } while (u > 1 - 0.331 * Math2.pow(x, 4) && Math2.log(u) > 0.5 * x * x + a1 * (1 - v + Math2.log(v)));
          if (shape == oalph)
            return a1 * v;
          do {
            u = jStat3._random_fn();
          } while (u === 0);
          return Math2.pow(u, 1 / oalph) * a1 * v;
        };
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jStat3.fn[passfunc] = function() {
              return jStat3(
                jStat3.map(this, function(value) {
                  return jStat3[passfunc](value);
                })
              );
            };
          })(funcs[i]);
        })("gammaln gammafn factorial factorialln".split(" "));
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jStat3.fn[passfunc] = function() {
              return jStat3(jStat3[passfunc].apply(null, arguments));
            };
          })(funcs[i]);
        })("randn".split(" "));
      })(jStat2, Math);
      (function(jStat3, Math2) {
        (function(list) {
          for (var i = 0; i < list.length; i++) (function(func) {
            jStat3[func] = function f(a, b, c) {
              if (!(this instanceof f))
                return new f(a, b, c);
              this._a = a;
              this._b = b;
              this._c = c;
              return this;
            };
            jStat3.fn[func] = function(a, b, c) {
              var newthis = jStat3[func](a, b, c);
              newthis.data = this;
              return newthis;
            };
            jStat3[func].prototype.sample = function(arr) {
              var a = this._a;
              var b = this._b;
              var c = this._c;
              if (arr)
                return jStat3.alter(arr, function() {
                  return jStat3[func].sample(a, b, c);
                });
              else
                return jStat3[func].sample(a, b, c);
            };
            (function(vals) {
              for (var i2 = 0; i2 < vals.length; i2++) (function(fnfunc) {
                jStat3[func].prototype[fnfunc] = function(x) {
                  var a = this._a;
                  var b = this._b;
                  var c = this._c;
                  if (!x && x !== 0)
                    x = this.data;
                  if (typeof x !== "number") {
                    return jStat3.fn.map.call(x, function(x2) {
                      return jStat3[func][fnfunc](x2, a, b, c);
                    });
                  }
                  return jStat3[func][fnfunc](x, a, b, c);
                };
              })(vals[i2]);
            })("pdf cdf inv".split(" "));
            (function(vals) {
              for (var i2 = 0; i2 < vals.length; i2++) (function(fnfunc) {
                jStat3[func].prototype[fnfunc] = function() {
                  return jStat3[func][fnfunc](this._a, this._b, this._c);
                };
              })(vals[i2]);
            })("mean median mode variance".split(" "));
          })(list[i]);
        })("beta centralF cauchy chisquare exponential gamma invgamma kumaraswamy laplace lognormal noncentralt normal pareto studentt weibull uniform binomial negbin hypgeom poisson triangular tukey arcsine".split(" "));
        jStat3.extend(jStat3.beta, {
          pdf: function pdf(x, alpha, beta) {
            if (x > 1 || x < 0)
              return 0;
            if (alpha == 1 && beta == 1)
              return 1;
            if (alpha < 512 && beta < 512) {
              return Math2.pow(x, alpha - 1) * Math2.pow(1 - x, beta - 1) / jStat3.betafn(alpha, beta);
            } else {
              return Math2.exp((alpha - 1) * Math2.log(x) + (beta - 1) * Math2.log(1 - x) - jStat3.betaln(alpha, beta));
            }
          },
          cdf: function cdf(x, alpha, beta) {
            return x > 1 || x < 0 ? (x > 1) * 1 : jStat3.ibeta(x, alpha, beta);
          },
          inv: function inv(x, alpha, beta) {
            return jStat3.ibetainv(x, alpha, beta);
          },
          mean: function mean2(alpha, beta) {
            return alpha / (alpha + beta);
          },
          median: function median(alpha, beta) {
            return jStat3.ibetainv(0.5, alpha, beta);
          },
          mode: function mode(alpha, beta) {
            return (alpha - 1) / (alpha + beta - 2);
          },
          // return a random sample
          sample: function sample(alpha, beta) {
            var u = jStat3.randg(alpha);
            return u / (u + jStat3.randg(beta));
          },
          variance: function variance(alpha, beta) {
            return alpha * beta / (Math2.pow(alpha + beta, 2) * (alpha + beta + 1));
          }
        });
        jStat3.extend(jStat3.centralF, {
          // This implementation of the pdf function avoids float overflow
          // See the way that R calculates this value:
          // https://svn.r-project.org/R/trunk/src/nmath/df.c
          pdf: function pdf(x, df1, df2) {
            var p, q, f;
            if (x < 0)
              return 0;
            if (df1 <= 2) {
              if (x === 0 && df1 < 2) {
                return Infinity;
              }
              if (x === 0 && df1 === 2) {
                return 1;
              }
              return 1 / jStat3.betafn(df1 / 2, df2 / 2) * Math2.pow(df1 / df2, df1 / 2) * Math2.pow(x, df1 / 2 - 1) * Math2.pow(1 + df1 / df2 * x, -(df1 + df2) / 2);
            }
            p = df1 * x / (df2 + x * df1);
            q = df2 / (df2 + x * df1);
            f = df1 * q / 2;
            return f * jStat3.binomial.pdf((df1 - 2) / 2, (df1 + df2 - 2) / 2, p);
          },
          cdf: function cdf(x, df1, df2) {
            if (x < 0)
              return 0;
            return jStat3.ibeta(df1 * x / (df1 * x + df2), df1 / 2, df2 / 2);
          },
          inv: function inv(x, df1, df2) {
            return df2 / (df1 * (1 / jStat3.ibetainv(x, df1 / 2, df2 / 2) - 1));
          },
          mean: function mean2(df1, df2) {
            return df2 > 2 ? df2 / (df2 - 2) : void 0;
          },
          mode: function mode(df1, df2) {
            return df1 > 2 ? df2 * (df1 - 2) / (df1 * (df2 + 2)) : void 0;
          },
          // return a random sample
          sample: function sample(df1, df2) {
            var x1 = jStat3.randg(df1 / 2) * 2;
            var x2 = jStat3.randg(df2 / 2) * 2;
            return x1 / df1 / (x2 / df2);
          },
          variance: function variance(df1, df2) {
            if (df2 <= 4)
              return void 0;
            return 2 * df2 * df2 * (df1 + df2 - 2) / (df1 * (df2 - 2) * (df2 - 2) * (df2 - 4));
          }
        });
        jStat3.extend(jStat3.cauchy, {
          pdf: function pdf(x, local, scale) {
            if (scale < 0) {
              return 0;
            }
            return scale / (Math2.pow(x - local, 2) + Math2.pow(scale, 2)) / Math2.PI;
          },
          cdf: function cdf(x, local, scale) {
            return Math2.atan((x - local) / scale) / Math2.PI + 0.5;
          },
          inv: function(p, local, scale) {
            return local + scale * Math2.tan(Math2.PI * (p - 0.5));
          },
          median: function median(local) {
            return local;
          },
          mode: function mode(local) {
            return local;
          },
          sample: function sample(local, scale) {
            return jStat3.randn() * Math2.sqrt(1 / (2 * jStat3.randg(0.5))) * scale + local;
          }
        });
        jStat3.extend(jStat3.chisquare, {
          pdf: function pdf(x, dof) {
            if (x < 0)
              return 0;
            return x === 0 && dof === 2 ? 0.5 : Math2.exp((dof / 2 - 1) * Math2.log(x) - x / 2 - dof / 2 * Math2.log(2) - jStat3.gammaln(dof / 2));
          },
          cdf: function cdf(x, dof) {
            if (x < 0)
              return 0;
            return jStat3.lowRegGamma(dof / 2, x / 2);
          },
          inv: function(p, dof) {
            return 2 * jStat3.gammapinv(p, 0.5 * dof);
          },
          mean: function(dof) {
            return dof;
          },
          // TODO: this is an approximation (is there a better way?)
          median: function median(dof) {
            return dof * Math2.pow(1 - 2 / (9 * dof), 3);
          },
          mode: function mode(dof) {
            return dof - 2 > 0 ? dof - 2 : 0;
          },
          sample: function sample(dof) {
            return jStat3.randg(dof / 2) * 2;
          },
          variance: function variance(dof) {
            return 2 * dof;
          }
        });
        jStat3.extend(jStat3.exponential, {
          pdf: function pdf(x, rate) {
            return x < 0 ? 0 : rate * Math2.exp(-rate * x);
          },
          cdf: function cdf(x, rate) {
            return x < 0 ? 0 : 1 - Math2.exp(-rate * x);
          },
          inv: function(p, rate) {
            return -Math2.log(1 - p) / rate;
          },
          mean: function(rate) {
            return 1 / rate;
          },
          median: function(rate) {
            return 1 / rate * Math2.log(2);
          },
          mode: function mode() {
            return 0;
          },
          sample: function sample(rate) {
            return -1 / rate * Math2.log(jStat3._random_fn());
          },
          variance: function(rate) {
            return Math2.pow(rate, -2);
          }
        });
        jStat3.extend(jStat3.gamma, {
          pdf: function pdf(x, shape, scale) {
            if (x < 0)
              return 0;
            return x === 0 && shape === 1 ? 1 / scale : Math2.exp((shape - 1) * Math2.log(x) - x / scale - jStat3.gammaln(shape) - shape * Math2.log(scale));
          },
          cdf: function cdf(x, shape, scale) {
            if (x < 0)
              return 0;
            return jStat3.lowRegGamma(shape, x / scale);
          },
          inv: function(p, shape, scale) {
            return jStat3.gammapinv(p, shape) * scale;
          },
          mean: function(shape, scale) {
            return shape * scale;
          },
          mode: function mode(shape, scale) {
            if (shape > 1) return (shape - 1) * scale;
            return void 0;
          },
          sample: function sample(shape, scale) {
            return jStat3.randg(shape) * scale;
          },
          variance: function variance(shape, scale) {
            return shape * scale * scale;
          }
        });
        jStat3.extend(jStat3.invgamma, {
          pdf: function pdf(x, shape, scale) {
            if (x <= 0)
              return 0;
            return Math2.exp(-(shape + 1) * Math2.log(x) - scale / x - jStat3.gammaln(shape) + shape * Math2.log(scale));
          },
          cdf: function cdf(x, shape, scale) {
            if (x <= 0)
              return 0;
            return 1 - jStat3.lowRegGamma(shape, scale / x);
          },
          inv: function(p, shape, scale) {
            return scale / jStat3.gammapinv(1 - p, shape);
          },
          mean: function(shape, scale) {
            return shape > 1 ? scale / (shape - 1) : void 0;
          },
          mode: function mode(shape, scale) {
            return scale / (shape + 1);
          },
          sample: function sample(shape, scale) {
            return scale / jStat3.randg(shape);
          },
          variance: function variance(shape, scale) {
            if (shape <= 2)
              return void 0;
            return scale * scale / ((shape - 1) * (shape - 1) * (shape - 2));
          }
        });
        jStat3.extend(jStat3.kumaraswamy, {
          pdf: function pdf(x, alpha, beta) {
            if (x === 0 && alpha === 1)
              return beta;
            else if (x === 1 && beta === 1)
              return alpha;
            return Math2.exp(Math2.log(alpha) + Math2.log(beta) + (alpha - 1) * Math2.log(x) + (beta - 1) * Math2.log(1 - Math2.pow(x, alpha)));
          },
          cdf: function cdf(x, alpha, beta) {
            if (x < 0)
              return 0;
            else if (x > 1)
              return 1;
            return 1 - Math2.pow(1 - Math2.pow(x, alpha), beta);
          },
          inv: function inv(p, alpha, beta) {
            return Math2.pow(1 - Math2.pow(1 - p, 1 / beta), 1 / alpha);
          },
          mean: function(alpha, beta) {
            return beta * jStat3.gammafn(1 + 1 / alpha) * jStat3.gammafn(beta) / jStat3.gammafn(1 + 1 / alpha + beta);
          },
          median: function median(alpha, beta) {
            return Math2.pow(1 - Math2.pow(2, -1 / beta), 1 / alpha);
          },
          mode: function mode(alpha, beta) {
            if (!(alpha >= 1 && beta >= 1 && (alpha !== 1 && beta !== 1)))
              return void 0;
            return Math2.pow((alpha - 1) / (alpha * beta - 1), 1 / alpha);
          },
          variance: function variance() {
            throw new Error("variance not yet implemented");
          }
        });
        jStat3.extend(jStat3.lognormal, {
          pdf: function pdf(x, mu, sigma) {
            if (x <= 0)
              return 0;
            return Math2.exp(-Math2.log(x) - 0.5 * Math2.log(2 * Math2.PI) - Math2.log(sigma) - Math2.pow(Math2.log(x) - mu, 2) / (2 * sigma * sigma));
          },
          cdf: function cdf(x, mu, sigma) {
            if (x < 0)
              return 0;
            return 0.5 + 0.5 * jStat3.erf((Math2.log(x) - mu) / Math2.sqrt(2 * sigma * sigma));
          },
          inv: function(p, mu, sigma) {
            return Math2.exp(-1.4142135623730951 * sigma * jStat3.erfcinv(2 * p) + mu);
          },
          mean: function mean2(mu, sigma) {
            return Math2.exp(mu + sigma * sigma / 2);
          },
          median: function median(mu) {
            return Math2.exp(mu);
          },
          mode: function mode(mu, sigma) {
            return Math2.exp(mu - sigma * sigma);
          },
          sample: function sample(mu, sigma) {
            return Math2.exp(jStat3.randn() * sigma + mu);
          },
          variance: function variance(mu, sigma) {
            return (Math2.exp(sigma * sigma) - 1) * Math2.exp(2 * mu + sigma * sigma);
          }
        });
        jStat3.extend(jStat3.noncentralt, {
          pdf: function pdf(x, dof, ncp) {
            var tol = 1e-14;
            if (Math2.abs(ncp) < tol)
              return jStat3.studentt.pdf(x, dof);
            if (Math2.abs(x) < tol) {
              return Math2.exp(jStat3.gammaln((dof + 1) / 2) - ncp * ncp / 2 - 0.5 * Math2.log(Math2.PI * dof) - jStat3.gammaln(dof / 2));
            }
            return dof / x * (jStat3.noncentralt.cdf(x * Math2.sqrt(1 + 2 / dof), dof + 2, ncp) - jStat3.noncentralt.cdf(x, dof, ncp));
          },
          cdf: function cdf(x, dof, ncp) {
            var tol = 1e-14;
            var min_iterations = 200;
            if (Math2.abs(ncp) < tol)
              return jStat3.studentt.cdf(x, dof);
            var flip = false;
            if (x < 0) {
              flip = true;
              ncp = -ncp;
            }
            var prob = jStat3.normal.cdf(-ncp, 0, 1);
            var value = tol + 1;
            var lastvalue = value;
            var y = x * x / (x * x + dof);
            var j = 0;
            var p = Math2.exp(-ncp * ncp / 2);
            var q = Math2.exp(-ncp * ncp / 2 - 0.5 * Math2.log(2) - jStat3.gammaln(3 / 2)) * ncp;
            while (j < min_iterations || lastvalue > tol || value > tol) {
              lastvalue = value;
              if (j > 0) {
                p *= ncp * ncp / (2 * j);
                q *= ncp * ncp / (2 * (j + 1 / 2));
              }
              value = p * jStat3.beta.cdf(y, j + 0.5, dof / 2) + q * jStat3.beta.cdf(y, j + 1, dof / 2);
              prob += 0.5 * value;
              j++;
            }
            return flip ? 1 - prob : prob;
          }
        });
        jStat3.extend(jStat3.normal, {
          pdf: function pdf(x, mean2, std) {
            return Math2.exp(-0.5 * Math2.log(2 * Math2.PI) - Math2.log(std) - Math2.pow(x - mean2, 2) / (2 * std * std));
          },
          cdf: function cdf(x, mean2, std) {
            return 0.5 * (1 + jStat3.erf((x - mean2) / Math2.sqrt(2 * std * std)));
          },
          inv: function(p, mean2, std) {
            return -1.4142135623730951 * std * jStat3.erfcinv(2 * p) + mean2;
          },
          mean: function(mean2) {
            return mean2;
          },
          median: function median(mean2) {
            return mean2;
          },
          mode: function(mean2) {
            return mean2;
          },
          sample: function sample(mean2, std) {
            return jStat3.randn() * std + mean2;
          },
          variance: function(mean2, std) {
            return std * std;
          }
        });
        jStat3.extend(jStat3.pareto, {
          pdf: function pdf(x, scale, shape) {
            if (x < scale)
              return 0;
            return shape * Math2.pow(scale, shape) / Math2.pow(x, shape + 1);
          },
          cdf: function cdf(x, scale, shape) {
            if (x < scale)
              return 0;
            return 1 - Math2.pow(scale / x, shape);
          },
          inv: function inv(p, scale, shape) {
            return scale / Math2.pow(1 - p, 1 / shape);
          },
          mean: function mean2(scale, shape) {
            if (shape <= 1)
              return void 0;
            return shape * Math2.pow(scale, shape) / (shape - 1);
          },
          median: function median(scale, shape) {
            return scale * (shape * Math2.SQRT2);
          },
          mode: function mode(scale) {
            return scale;
          },
          variance: function(scale, shape) {
            if (shape <= 2)
              return void 0;
            return scale * scale * shape / (Math2.pow(shape - 1, 2) * (shape - 2));
          }
        });
        jStat3.extend(jStat3.studentt, {
          pdf: function pdf(x, dof) {
            dof = dof > 1e100 ? 1e100 : dof;
            return 1 / (Math2.sqrt(dof) * jStat3.betafn(0.5, dof / 2)) * Math2.pow(1 + x * x / dof, -((dof + 1) / 2));
          },
          cdf: function cdf(x, dof) {
            var dof2 = dof / 2;
            return jStat3.ibeta((x + Math2.sqrt(x * x + dof)) / (2 * Math2.sqrt(x * x + dof)), dof2, dof2);
          },
          inv: function(p, dof) {
            var x = jStat3.ibetainv(2 * Math2.min(p, 1 - p), 0.5 * dof, 0.5);
            x = Math2.sqrt(dof * (1 - x) / x);
            return p > 0.5 ? x : -x;
          },
          mean: function mean2(dof) {
            return dof > 1 ? 0 : void 0;
          },
          median: function median() {
            return 0;
          },
          mode: function mode() {
            return 0;
          },
          sample: function sample(dof) {
            return jStat3.randn() * Math2.sqrt(dof / (2 * jStat3.randg(dof / 2)));
          },
          variance: function variance(dof) {
            return dof > 2 ? dof / (dof - 2) : dof > 1 ? Infinity : void 0;
          }
        });
        jStat3.extend(jStat3.weibull, {
          pdf: function pdf(x, scale, shape) {
            if (x < 0 || scale < 0 || shape < 0)
              return 0;
            return shape / scale * Math2.pow(x / scale, shape - 1) * Math2.exp(-Math2.pow(x / scale, shape));
          },
          cdf: function cdf(x, scale, shape) {
            return x < 0 ? 0 : 1 - Math2.exp(-Math2.pow(x / scale, shape));
          },
          inv: function(p, scale, shape) {
            return scale * Math2.pow(-Math2.log(1 - p), 1 / shape);
          },
          mean: function(scale, shape) {
            return scale * jStat3.gammafn(1 + 1 / shape);
          },
          median: function median(scale, shape) {
            return scale * Math2.pow(Math2.log(2), 1 / shape);
          },
          mode: function mode(scale, shape) {
            if (shape <= 1)
              return 0;
            return scale * Math2.pow((shape - 1) / shape, 1 / shape);
          },
          sample: function sample(scale, shape) {
            return scale * Math2.pow(-Math2.log(jStat3._random_fn()), 1 / shape);
          },
          variance: function variance(scale, shape) {
            return scale * scale * jStat3.gammafn(1 + 2 / shape) - Math2.pow(jStat3.weibull.mean(scale, shape), 2);
          }
        });
        jStat3.extend(jStat3.uniform, {
          pdf: function pdf(x, a, b) {
            return x < a || x > b ? 0 : 1 / (b - a);
          },
          cdf: function cdf(x, a, b) {
            if (x < a)
              return 0;
            else if (x < b)
              return (x - a) / (b - a);
            return 1;
          },
          inv: function(p, a, b) {
            return a + p * (b - a);
          },
          mean: function mean2(a, b) {
            return 0.5 * (a + b);
          },
          median: function median(a, b) {
            return jStat3.mean(a, b);
          },
          mode: function mode() {
            throw new Error("mode is not yet implemented");
          },
          sample: function sample(a, b) {
            return a / 2 + b / 2 + (b / 2 - a / 2) * (2 * jStat3._random_fn() - 1);
          },
          variance: function variance(a, b) {
            return Math2.pow(b - a, 2) / 12;
          }
        });
        function betinc(x, a, b, eps) {
          var a0 = 0;
          var b0 = 1;
          var a1 = 1;
          var b1 = 1;
          var m9 = 0;
          var a2 = 0;
          var c9;
          while (Math2.abs((a1 - a2) / a1) > eps) {
            a2 = a1;
            c9 = -(a + m9) * (a + b + m9) * x / (a + 2 * m9) / (a + 2 * m9 + 1);
            a0 = a1 + c9 * a0;
            b0 = b1 + c9 * b0;
            m9 = m9 + 1;
            c9 = m9 * (b - m9) * x / (a + 2 * m9 - 1) / (a + 2 * m9);
            a1 = a0 + c9 * a1;
            b1 = b0 + c9 * b1;
            a0 = a0 / b1;
            b0 = b0 / b1;
            a1 = a1 / b1;
            b1 = 1;
          }
          return a1 / a;
        }
        jStat3.extend(jStat3.binomial, {
          pdf: function pdf(k, n, p) {
            return p === 0 || p === 1 ? n * p === k ? 1 : 0 : jStat3.combination(n, k) * Math2.pow(p, k) * Math2.pow(1 - p, n - k);
          },
          cdf: function cdf(x, n, p) {
            var betacdf;
            var eps = 1e-10;
            if (x < 0)
              return 0;
            if (x >= n)
              return 1;
            if (p < 0 || p > 1 || n <= 0)
              return NaN;
            x = Math2.floor(x);
            var z = p;
            var a = x + 1;
            var b = n - x;
            var s = a + b;
            var bt = Math2.exp(jStat3.gammaln(s) - jStat3.gammaln(b) - jStat3.gammaln(a) + a * Math2.log(z) + b * Math2.log(1 - z));
            if (z < (a + 1) / (s + 2))
              betacdf = bt * betinc(z, a, b, eps);
            else
              betacdf = 1 - bt * betinc(1 - z, b, a, eps);
            return Math2.round((1 - betacdf) * (1 / eps)) / (1 / eps);
          }
        });
        jStat3.extend(jStat3.negbin, {
          pdf: function pdf(k, r, p) {
            if (k !== k >>> 0)
              return false;
            if (k < 0)
              return 0;
            return jStat3.combination(k + r - 1, r - 1) * Math2.pow(1 - p, k) * Math2.pow(p, r);
          },
          cdf: function cdf(x, r, p) {
            var sum = 0, k = 0;
            if (x < 0) return 0;
            for (; k <= x; k++) {
              sum += jStat3.negbin.pdf(k, r, p);
            }
            return sum;
          }
        });
        jStat3.extend(jStat3.hypgeom, {
          pdf: function pdf(k, N, m, n) {
            if (k !== k | 0) {
              return false;
            } else if (k < 0 || k < m - (N - n)) {
              return 0;
            } else if (k > n || k > m) {
              return 0;
            } else if (m * 2 > N) {
              if (n * 2 > N) {
                return jStat3.hypgeom.pdf(N - m - n + k, N, N - m, N - n);
              } else {
                return jStat3.hypgeom.pdf(n - k, N, N - m, n);
              }
            } else if (n * 2 > N) {
              return jStat3.hypgeom.pdf(m - k, N, m, N - n);
            } else if (m < n) {
              return jStat3.hypgeom.pdf(k, N, n, m);
            } else {
              var scaledPDF = 1;
              var samplesDone = 0;
              for (var i = 0; i < k; i++) {
                while (scaledPDF > 1 && samplesDone < n) {
                  scaledPDF *= 1 - m / (N - samplesDone);
                  samplesDone++;
                }
                scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1));
              }
              for (; samplesDone < n; samplesDone++) {
                scaledPDF *= 1 - m / (N - samplesDone);
              }
              return Math2.min(1, Math2.max(0, scaledPDF));
            }
          },
          cdf: function cdf(x, N, m, n) {
            if (x < 0 || x < m - (N - n)) {
              return 0;
            } else if (x >= n || x >= m) {
              return 1;
            } else if (m * 2 > N) {
              if (n * 2 > N) {
                return jStat3.hypgeom.cdf(N - m - n + x, N, N - m, N - n);
              } else {
                return 1 - jStat3.hypgeom.cdf(n - x - 1, N, N - m, n);
              }
            } else if (n * 2 > N) {
              return 1 - jStat3.hypgeom.cdf(m - x - 1, N, m, N - n);
            } else if (m < n) {
              return jStat3.hypgeom.cdf(x, N, n, m);
            } else {
              var scaledCDF = 1;
              var scaledPDF = 1;
              var samplesDone = 0;
              for (var i = 0; i < x; i++) {
                while (scaledCDF > 1 && samplesDone < n) {
                  var factor = 1 - m / (N - samplesDone);
                  scaledPDF *= factor;
                  scaledCDF *= factor;
                  samplesDone++;
                }
                scaledPDF *= (n - i) * (m - i) / ((i + 1) * (N - m - n + i + 1));
                scaledCDF += scaledPDF;
              }
              for (; samplesDone < n; samplesDone++) {
                scaledCDF *= 1 - m / (N - samplesDone);
              }
              return Math2.min(1, Math2.max(0, scaledCDF));
            }
          }
        });
        jStat3.extend(jStat3.poisson, {
          pdf: function pdf(k, l) {
            if (l < 0 || k % 1 !== 0 || k < 0) {
              return 0;
            }
            return Math2.pow(l, k) * Math2.exp(-l) / jStat3.factorial(k);
          },
          cdf: function cdf(x, l) {
            var sumarr = [], k = 0;
            if (x < 0) return 0;
            for (; k <= x; k++) {
              sumarr.push(jStat3.poisson.pdf(k, l));
            }
            return jStat3.sum(sumarr);
          },
          mean: function(l) {
            return l;
          },
          variance: function(l) {
            return l;
          },
          sampleSmall: function sampleSmall(l) {
            var p = 1, k = 0, L = Math2.exp(-l);
            do {
              k++;
              p *= jStat3._random_fn();
            } while (p > L);
            return k - 1;
          },
          sampleLarge: function sampleLarge(l) {
            var lam = l;
            var k;
            var U, V, slam, loglam, a, b, invalpha, vr, us;
            slam = Math2.sqrt(lam);
            loglam = Math2.log(lam);
            b = 0.931 + 2.53 * slam;
            a = -0.059 + 0.02483 * b;
            invalpha = 1.1239 + 1.1328 / (b - 3.4);
            vr = 0.9277 - 3.6224 / (b - 2);
            while (1) {
              U = Math2.random() - 0.5;
              V = Math2.random();
              us = 0.5 - Math2.abs(U);
              k = Math2.floor((2 * a / us + b) * U + lam + 0.43);
              if (us >= 0.07 && V <= vr) {
                return k;
              }
              if (k < 0 || us < 0.013 && V > us) {
                continue;
              }
              if (Math2.log(V) + Math2.log(invalpha) - Math2.log(a / (us * us) + b) <= -lam + k * loglam - jStat3.loggam(k + 1)) {
                return k;
              }
            }
          },
          sample: function sample(l) {
            if (l < 10)
              return this.sampleSmall(l);
            else
              return this.sampleLarge(l);
          }
        });
        jStat3.extend(jStat3.triangular, {
          pdf: function pdf(x, a, b, c) {
            if (b <= a || c < a || c > b) {
              return NaN;
            } else {
              if (x < a || x > b) {
                return 0;
              } else if (x < c) {
                return 2 * (x - a) / ((b - a) * (c - a));
              } else if (x === c) {
                return 2 / (b - a);
              } else {
                return 2 * (b - x) / ((b - a) * (b - c));
              }
            }
          },
          cdf: function cdf(x, a, b, c) {
            if (b <= a || c < a || c > b)
              return NaN;
            if (x <= a)
              return 0;
            else if (x >= b)
              return 1;
            if (x <= c)
              return Math2.pow(x - a, 2) / ((b - a) * (c - a));
            else
              return 1 - Math2.pow(b - x, 2) / ((b - a) * (b - c));
          },
          inv: function inv(p, a, b, c) {
            if (b <= a || c < a || c > b) {
              return NaN;
            } else {
              if (p <= (c - a) / (b - a)) {
                return a + (b - a) * Math2.sqrt(p * ((c - a) / (b - a)));
              } else {
                return a + (b - a) * (1 - Math2.sqrt((1 - p) * (1 - (c - a) / (b - a))));
              }
            }
          },
          mean: function mean2(a, b, c) {
            return (a + b + c) / 3;
          },
          median: function median(a, b, c) {
            if (c <= (a + b) / 2) {
              return b - Math2.sqrt((b - a) * (b - c)) / Math2.sqrt(2);
            } else if (c > (a + b) / 2) {
              return a + Math2.sqrt((b - a) * (c - a)) / Math2.sqrt(2);
            }
          },
          mode: function mode(a, b, c) {
            return c;
          },
          sample: function sample(a, b, c) {
            var u = jStat3._random_fn();
            if (u < (c - a) / (b - a))
              return a + Math2.sqrt(u * (b - a) * (c - a));
            return b - Math2.sqrt((1 - u) * (b - a) * (b - c));
          },
          variance: function variance(a, b, c) {
            return (a * a + b * b + c * c - a * b - a * c - b * c) / 18;
          }
        });
        jStat3.extend(jStat3.arcsine, {
          pdf: function pdf(x, a, b) {
            if (b <= a) return NaN;
            return x <= a || x >= b ? 0 : 2 / Math2.PI * Math2.pow(Math2.pow(b - a, 2) - Math2.pow(2 * x - a - b, 2), -0.5);
          },
          cdf: function cdf(x, a, b) {
            if (x < a)
              return 0;
            else if (x < b)
              return 2 / Math2.PI * Math2.asin(Math2.sqrt((x - a) / (b - a)));
            return 1;
          },
          inv: function(p, a, b) {
            return a + (0.5 - 0.5 * Math2.cos(Math2.PI * p)) * (b - a);
          },
          mean: function mean2(a, b) {
            if (b <= a) return NaN;
            return (a + b) / 2;
          },
          median: function median(a, b) {
            if (b <= a) return NaN;
            return (a + b) / 2;
          },
          mode: function mode() {
            throw new Error("mode is not yet implemented");
          },
          sample: function sample(a, b) {
            return (a + b) / 2 + (b - a) / 2 * Math2.sin(2 * Math2.PI * jStat3.uniform.sample(0, 1));
          },
          variance: function variance(a, b) {
            if (b <= a) return NaN;
            return Math2.pow(b - a, 2) / 8;
          }
        });
        function laplaceSign(x) {
          return x / Math2.abs(x);
        }
        jStat3.extend(jStat3.laplace, {
          pdf: function pdf(x, mu, b) {
            return b <= 0 ? 0 : Math2.exp(-Math2.abs(x - mu) / b) / (2 * b);
          },
          cdf: function cdf(x, mu, b) {
            if (b <= 0) {
              return 0;
            }
            if (x < mu) {
              return 0.5 * Math2.exp((x - mu) / b);
            } else {
              return 1 - 0.5 * Math2.exp(-(x - mu) / b);
            }
          },
          mean: function(mu) {
            return mu;
          },
          median: function(mu) {
            return mu;
          },
          mode: function(mu) {
            return mu;
          },
          variance: function(mu, b) {
            return 2 * b * b;
          },
          sample: function sample(mu, b) {
            var u = jStat3._random_fn() - 0.5;
            return mu - b * laplaceSign(u) * Math2.log(1 - 2 * Math2.abs(u));
          }
        });
        function tukeyWprob(w, rr, cc) {
          var nleg = 12;
          var ihalf = 6;
          var C1 = -30;
          var C2 = -50;
          var C3 = 60;
          var bb = 8;
          var wlar = 3;
          var wincr1 = 2;
          var wincr2 = 3;
          var xleg = [
            0.9815606342467192,
            0.9041172563704749,
            0.7699026741943047,
            0.5873179542866175,
            0.3678314989981802,
            0.1252334085114689
          ];
          var aleg = [
            0.04717533638651183,
            0.10693932599531843,
            0.16007832854334622,
            0.20316742672306592,
            0.2334925365383548,
            0.24914704581340277
          ];
          var qsqz = w * 0.5;
          if (qsqz >= bb)
            return 1;
          var pr_w = 2 * jStat3.normal.cdf(qsqz, 0, 1, 1, 0) - 1;
          if (pr_w >= Math2.exp(C2 / cc))
            pr_w = Math2.pow(pr_w, cc);
          else
            pr_w = 0;
          var wincr;
          if (w > wlar)
            wincr = wincr1;
          else
            wincr = wincr2;
          var blb = qsqz;
          var binc = (bb - qsqz) / wincr;
          var bub = blb + binc;
          var einsum = 0;
          var cc1 = cc - 1;
          for (var wi = 1; wi <= wincr; wi++) {
            var elsum = 0;
            var a = 0.5 * (bub + blb);
            var b = 0.5 * (bub - blb);
            for (var jj = 1; jj <= nleg; jj++) {
              var j, xx;
              if (ihalf < jj) {
                j = nleg - jj + 1;
                xx = xleg[j - 1];
              } else {
                j = jj;
                xx = -xleg[j - 1];
              }
              var c = b * xx;
              var ac = a + c;
              var qexpo = ac * ac;
              if (qexpo > C3)
                break;
              var pplus = 2 * jStat3.normal.cdf(ac, 0, 1, 1, 0);
              var pminus = 2 * jStat3.normal.cdf(ac, w, 1, 1, 0);
              var rinsum = pplus * 0.5 - pminus * 0.5;
              if (rinsum >= Math2.exp(C1 / cc1)) {
                rinsum = aleg[j - 1] * Math2.exp(-(0.5 * qexpo)) * Math2.pow(rinsum, cc1);
                elsum += rinsum;
              }
            }
            elsum *= 2 * b * cc / Math2.sqrt(2 * Math2.PI);
            einsum += elsum;
            blb = bub;
            bub += binc;
          }
          pr_w += einsum;
          if (pr_w <= Math2.exp(C1 / rr))
            return 0;
          pr_w = Math2.pow(pr_w, rr);
          if (pr_w >= 1)
            return 1;
          return pr_w;
        }
        function tukeyQinv(p, c, v) {
          var p0 = 0.322232421088;
          var q0 = 0.099348462606;
          var p1 = -1;
          var q1 = 0.588581570495;
          var p2 = -0.342242088547;
          var q2 = 0.531103462366;
          var p3 = -0.204231210125;
          var q3 = 0.10353775285;
          var p4 = -453642210148e-16;
          var q4 = 0.0038560700634;
          var c1 = 0.8832;
          var c2 = 0.2368;
          var c3 = 1.214;
          var c4 = 1.208;
          var c5 = 1.4142;
          var vmax = 120;
          var ps = 0.5 - 0.5 * p;
          var yi = Math2.sqrt(Math2.log(1 / (ps * ps)));
          var t = yi + ((((yi * p4 + p3) * yi + p2) * yi + p1) * yi + p0) / ((((yi * q4 + q3) * yi + q2) * yi + q1) * yi + q0);
          if (v < vmax) t += (t * t * t + t) / v / 4;
          var q = c1 - c2 * t;
          if (v < vmax) q += -c3 / v + c4 * t / v;
          return t * (q * Math2.log(c - 1) + c5);
        }
        jStat3.extend(jStat3.tukey, {
          cdf: function cdf(q, nmeans, df) {
            var rr = 1;
            var cc = nmeans;
            var nlegq = 16;
            var ihalfq = 8;
            var eps1 = -30;
            var eps2 = 1e-14;
            var dhaf = 100;
            var dquar = 800;
            var deigh = 5e3;
            var dlarg = 25e3;
            var ulen1 = 1;
            var ulen2 = 0.5;
            var ulen3 = 0.25;
            var ulen4 = 0.125;
            var xlegq = [
              0.9894009349916499,
              0.9445750230732326,
              0.8656312023878318,
              0.755404408355003,
              0.6178762444026438,
              0.45801677765722737,
              0.2816035507792589,
              0.09501250983763744
            ];
            var alegq = [
              0.027152459411754096,
              0.062253523938647894,
              0.09515851168249279,
              0.12462897125553388,
              0.14959598881657674,
              0.16915651939500254,
              0.18260341504492358,
              0.1894506104550685
            ];
            if (q <= 0)
              return 0;
            if (df < 2 || rr < 1 || cc < 2) return NaN;
            if (!Number.isFinite(q))
              return 1;
            if (df > dlarg)
              return tukeyWprob(q, rr, cc);
            var f2 = df * 0.5;
            var f2lf = f2 * Math2.log(df) - df * Math2.log(2) - jStat3.gammaln(f2);
            var f21 = f2 - 1;
            var ff4 = df * 0.25;
            var ulen;
            if (df <= dhaf) ulen = ulen1;
            else if (df <= dquar) ulen = ulen2;
            else if (df <= deigh) ulen = ulen3;
            else ulen = ulen4;
            f2lf += Math2.log(ulen);
            var ans = 0;
            for (var i = 1; i <= 50; i++) {
              var otsum = 0;
              var twa1 = (2 * i - 1) * ulen;
              for (var jj = 1; jj <= nlegq; jj++) {
                var j, t1;
                if (ihalfq < jj) {
                  j = jj - ihalfq - 1;
                  t1 = f2lf + f21 * Math2.log(twa1 + xlegq[j] * ulen) - (xlegq[j] * ulen + twa1) * ff4;
                } else {
                  j = jj - 1;
                  t1 = f2lf + f21 * Math2.log(twa1 - xlegq[j] * ulen) + (xlegq[j] * ulen - twa1) * ff4;
                }
                var qsqz;
                if (t1 >= eps1) {
                  if (ihalfq < jj) {
                    qsqz = q * Math2.sqrt((xlegq[j] * ulen + twa1) * 0.5);
                  } else {
                    qsqz = q * Math2.sqrt((-(xlegq[j] * ulen) + twa1) * 0.5);
                  }
                  var wprb = tukeyWprob(qsqz, rr, cc);
                  var rotsum = wprb * alegq[j] * Math2.exp(t1);
                  otsum += rotsum;
                }
              }
              if (i * ulen >= 1 && otsum <= eps2)
                break;
              ans += otsum;
            }
            if (otsum > eps2) {
              throw new Error("tukey.cdf failed to converge");
            }
            if (ans > 1)
              ans = 1;
            return ans;
          },
          inv: function(p, nmeans, df) {
            var rr = 1;
            var cc = nmeans;
            var eps = 1e-4;
            var maxiter = 50;
            if (df < 2 || rr < 1 || cc < 2) return NaN;
            if (p < 0 || p > 1) return NaN;
            if (p === 0) return 0;
            if (p === 1) return Infinity;
            var x0 = tukeyQinv(p, cc, df);
            var valx0 = jStat3.tukey.cdf(x0, nmeans, df) - p;
            var x1;
            if (valx0 > 0)
              x1 = Math2.max(0, x0 - 1);
            else
              x1 = x0 + 1;
            var valx1 = jStat3.tukey.cdf(x1, nmeans, df) - p;
            var ans;
            for (var iter = 1; iter < maxiter; iter++) {
              ans = x1 - valx1 * (x1 - x0) / (valx1 - valx0);
              valx0 = valx1;
              x0 = x1;
              if (ans < 0) {
                ans = 0;
                valx1 = -p;
              }
              valx1 = jStat3.tukey.cdf(ans, nmeans, df) - p;
              x1 = ans;
              var xabs = Math2.abs(x1 - x0);
              if (xabs < eps)
                return ans;
            }
            throw new Error("tukey.inv failed to converge");
          }
        });
      })(jStat2, Math);
      (function(jStat3, Math2) {
        var push = Array.prototype.push;
        var isArray = jStat3.utils.isArray;
        function isUsable(arg) {
          return isArray(arg) || arg instanceof jStat3;
        }
        jStat3.extend({
          // add a vector/matrix to a vector/matrix or scalar
          add: function add(arr, arg) {
            if (isUsable(arg)) {
              if (!isUsable(arg[0])) arg = [arg];
              return jStat3.map(arr, function(value, row, col) {
                return value + arg[row][col];
              });
            }
            return jStat3.map(arr, function(value) {
              return value + arg;
            });
          },
          // subtract a vector or scalar from the vector
          subtract: function subtract(arr, arg) {
            if (isUsable(arg)) {
              if (!isUsable(arg[0])) arg = [arg];
              return jStat3.map(arr, function(value, row, col) {
                return value - arg[row][col] || 0;
              });
            }
            return jStat3.map(arr, function(value) {
              return value - arg;
            });
          },
          // matrix division
          divide: function divide(arr, arg) {
            if (isUsable(arg)) {
              if (!isUsable(arg[0])) arg = [arg];
              return jStat3.multiply(arr, jStat3.inv(arg));
            }
            return jStat3.map(arr, function(value) {
              return value / arg;
            });
          },
          // matrix multiplication
          multiply: function multiply(arr, arg) {
            var row, col, nrescols, sum, nrow, ncol, res, rescols;
            if (arr.length === void 0 && arg.length === void 0) {
              return arr * arg;
            }
            nrow = arr.length, ncol = arr[0].length, res = jStat3.zeros(nrow, nrescols = isUsable(arg) ? arg[0].length : ncol), rescols = 0;
            if (isUsable(arg)) {
              for (; rescols < nrescols; rescols++) {
                for (row = 0; row < nrow; row++) {
                  sum = 0;
                  for (col = 0; col < ncol; col++)
                    sum += arr[row][col] * arg[col][rescols];
                  res[row][rescols] = sum;
                }
              }
              return nrow === 1 && rescols === 1 ? res[0][0] : res;
            }
            return jStat3.map(arr, function(value) {
              return value * arg;
            });
          },
          // outer([1,2,3],[4,5,6])
          // ===
          // [[1],[2],[3]] times [[4,5,6]]
          // ->
          // [[4,5,6],[8,10,12],[12,15,18]]
          outer: function outer(A, B) {
            return jStat3.multiply(A.map(function(t) {
              return [t];
            }), [B]);
          },
          // Returns the dot product of two matricies
          dot: function dot(arr, arg) {
            if (!isUsable(arr[0])) arr = [arr];
            if (!isUsable(arg[0])) arg = [arg];
            var left = arr[0].length === 1 && arr.length !== 1 ? jStat3.transpose(arr) : arr, right = arg[0].length === 1 && arg.length !== 1 ? jStat3.transpose(arg) : arg, res = [], row = 0, nrow = left.length, ncol = left[0].length, sum, col;
            for (; row < nrow; row++) {
              res[row] = [];
              sum = 0;
              for (col = 0; col < ncol; col++)
                sum += left[row][col] * right[row][col];
              res[row] = sum;
            }
            return res.length === 1 ? res[0] : res;
          },
          // raise every element by a scalar
          pow: function pow(arr, arg) {
            return jStat3.map(arr, function(value) {
              return Math2.pow(value, arg);
            });
          },
          // exponentiate every element
          exp: function exp(arr) {
            return jStat3.map(arr, function(value) {
              return Math2.exp(value);
            });
          },
          // generate the natural log of every element
          log: function exp(arr) {
            return jStat3.map(arr, function(value) {
              return Math2.log(value);
            });
          },
          // generate the absolute values of the vector
          abs: function abs(arr) {
            return jStat3.map(arr, function(value) {
              return Math2.abs(value);
            });
          },
          // computes the p-norm of the vector
          // In the case that a matrix is passed, uses the first row as the vector
          norm: function norm(arr, p) {
            var nnorm = 0, i = 0;
            if (isNaN(p)) p = 2;
            if (isUsable(arr[0])) arr = arr[0];
            for (; i < arr.length; i++) {
              nnorm += Math2.pow(Math2.abs(arr[i]), p);
            }
            return Math2.pow(nnorm, 1 / p);
          },
          // computes the angle between two vectors in rads
          // In case a matrix is passed, this uses the first row as the vector
          angle: function angle(arr, arg) {
            return Math2.acos(jStat3.dot(arr, arg) / (jStat3.norm(arr) * jStat3.norm(arg)));
          },
          // augment one matrix by another
          // Note: this function returns a matrix, not a jStat object
          aug: function aug(a, b) {
            var newarr = [];
            var i;
            for (i = 0; i < a.length; i++) {
              newarr.push(a[i].slice());
            }
            for (i = 0; i < newarr.length; i++) {
              push.apply(newarr[i], b[i]);
            }
            return newarr;
          },
          // The inv() function calculates the inverse of a matrix
          // Create the inverse by augmenting the matrix by the identity matrix of the
          // appropriate size, and then use G-J elimination on the augmented matrix.
          inv: function inv(a) {
            var rows = a.length;
            var cols = a[0].length;
            var b = jStat3.identity(rows, cols);
            var c = jStat3.gauss_jordan(a, b);
            var result = [];
            var i = 0;
            var j;
            for (; i < rows; i++) {
              result[i] = [];
              for (j = cols; j < c[0].length; j++)
                result[i][j - cols] = c[i][j];
            }
            return result;
          },
          // calculate the determinant of a matrix
          det: function det(a) {
            if (a.length === 2) {
              return a[0][0] * a[1][1] - a[0][1] * a[1][0];
            }
            var determinant = 0;
            for (var i = 0; i < a.length; i++) {
              var submatrix = [];
              for (var row = 1; row < a.length; row++) {
                submatrix[row - 1] = [];
                for (var col = 0; col < a.length; col++) {
                  if (col < i) {
                    submatrix[row - 1][col] = a[row][col];
                  } else if (col > i) {
                    submatrix[row - 1][col - 1] = a[row][col];
                  }
                }
              }
              var sign = i % 2 ? -1 : 1;
              determinant += det(submatrix) * a[0][i] * sign;
            }
            return determinant;
          },
          gauss_elimination: function gauss_elimination(a, b) {
            var i = 0, j = 0, n = a.length, m = a[0].length, factor = 1, sum = 0, x = [], maug, pivot, temp, k;
            a = jStat3.aug(a, b);
            maug = a[0].length;
            for (i = 0; i < n; i++) {
              pivot = a[i][i];
              j = i;
              for (k = i + 1; k < m; k++) {
                if (pivot < Math2.abs(a[k][i])) {
                  pivot = a[k][i];
                  j = k;
                }
              }
              if (j != i) {
                for (k = 0; k < maug; k++) {
                  temp = a[i][k];
                  a[i][k] = a[j][k];
                  a[j][k] = temp;
                }
              }
              for (j = i + 1; j < n; j++) {
                factor = a[j][i] / a[i][i];
                for (k = i; k < maug; k++) {
                  a[j][k] = a[j][k] - factor * a[i][k];
                }
              }
            }
            for (i = n - 1; i >= 0; i--) {
              sum = 0;
              for (j = i + 1; j <= n - 1; j++) {
                sum = sum + x[j] * a[i][j];
              }
              x[i] = (a[i][maug - 1] - sum) / a[i][i];
            }
            return x;
          },
          gauss_jordan: function gauss_jordan(a, b) {
            var m = jStat3.aug(a, b);
            var h = m.length;
            var w = m[0].length;
            var c = 0;
            var x, y, y2;
            for (y = 0; y < h; y++) {
              var maxrow = y;
              for (y2 = y + 1; y2 < h; y2++) {
                if (Math2.abs(m[y2][y]) > Math2.abs(m[maxrow][y]))
                  maxrow = y2;
              }
              var tmp = m[y];
              m[y] = m[maxrow];
              m[maxrow] = tmp;
              for (y2 = y + 1; y2 < h; y2++) {
                c = m[y2][y] / m[y][y];
                for (x = y; x < w; x++) {
                  m[y2][x] -= m[y][x] * c;
                }
              }
            }
            for (y = h - 1; y >= 0; y--) {
              c = m[y][y];
              for (y2 = 0; y2 < y; y2++) {
                for (x = w - 1; x > y - 1; x--) {
                  m[y2][x] -= m[y][x] * m[y2][y] / c;
                }
              }
              m[y][y] /= c;
              for (x = h; x < w; x++) {
                m[y][x] /= c;
              }
            }
            return m;
          },
          // solve equation
          // Ax=b
          // A is upper triangular matrix
          // A=[[1,2,3],[0,4,5],[0,6,7]]
          // b=[1,2,3]
          // triaUpSolve(A,b) // -> [2.666,0.1666,1.666]
          // if you use matrix style
          // A=[[1,2,3],[0,4,5],[0,6,7]]
          // b=[[1],[2],[3]]
          // will return [[2.666],[0.1666],[1.666]]
          triaUpSolve: function triaUpSolve(A, b) {
            var size = A[0].length;
            var x = jStat3.zeros(1, size)[0];
            var parts;
            var matrix_mode = false;
            if (b[0].length != void 0) {
              b = b.map(function(i) {
                return i[0];
              });
              matrix_mode = true;
            }
            jStat3.arange(size - 1, -1, -1).forEach(function(i) {
              parts = jStat3.arange(i + 1, size).map(function(j) {
                return x[j] * A[i][j];
              });
              x[i] = (b[i] - jStat3.sum(parts)) / A[i][i];
            });
            if (matrix_mode)
              return x.map(function(i) {
                return [i];
              });
            return x;
          },
          triaLowSolve: function triaLowSolve(A, b) {
            var size = A[0].length;
            var x = jStat3.zeros(1, size)[0];
            var parts;
            var matrix_mode = false;
            if (b[0].length != void 0) {
              b = b.map(function(i) {
                return i[0];
              });
              matrix_mode = true;
            }
            jStat3.arange(size).forEach(function(i) {
              parts = jStat3.arange(i).map(function(j) {
                return A[i][j] * x[j];
              });
              x[i] = (b[i] - jStat3.sum(parts)) / A[i][i];
            });
            if (matrix_mode)
              return x.map(function(i) {
                return [i];
              });
            return x;
          },
          // A -> [L,U]
          // A=LU
          // L is lower triangular matrix
          // U is upper triangular matrix
          lu: function lu(A) {
            var size = A.length;
            var L = jStat3.identity(size);
            var R = jStat3.zeros(A.length, A[0].length);
            var parts;
            jStat3.arange(size).forEach(function(t) {
              R[0][t] = A[0][t];
            });
            jStat3.arange(1, size).forEach(function(l) {
              jStat3.arange(l).forEach(function(i) {
                parts = jStat3.arange(i).map(function(jj) {
                  return L[l][jj] * R[jj][i];
                });
                L[l][i] = (A[l][i] - jStat3.sum(parts)) / R[i][i];
              });
              jStat3.arange(l, size).forEach(function(j) {
                parts = jStat3.arange(l).map(function(jj) {
                  return L[l][jj] * R[jj][j];
                });
                R[l][j] = A[parts.length][j] - jStat3.sum(parts);
              });
            });
            return [L, R];
          },
          // A -> T
          // A=TT'
          // T is lower triangular matrix
          cholesky: function cholesky(A) {
            var size = A.length;
            var T = jStat3.zeros(A.length, A[0].length);
            var parts;
            jStat3.arange(size).forEach(function(i) {
              parts = jStat3.arange(i).map(function(t) {
                return Math2.pow(T[i][t], 2);
              });
              T[i][i] = Math2.sqrt(A[i][i] - jStat3.sum(parts));
              jStat3.arange(i + 1, size).forEach(function(j) {
                parts = jStat3.arange(i).map(function(t) {
                  return T[i][t] * T[j][t];
                });
                T[j][i] = (A[i][j] - jStat3.sum(parts)) / T[i][i];
              });
            });
            return T;
          },
          gauss_jacobi: function gauss_jacobi(a, b, x, r) {
            var i = 0;
            var j = 0;
            var n = a.length;
            var l = [];
            var u = [];
            var d = [];
            var xv, c, h, xk;
            for (; i < n; i++) {
              l[i] = [];
              u[i] = [];
              d[i] = [];
              for (j = 0; j < n; j++) {
                if (i > j) {
                  l[i][j] = a[i][j];
                  u[i][j] = d[i][j] = 0;
                } else if (i < j) {
                  u[i][j] = a[i][j];
                  l[i][j] = d[i][j] = 0;
                } else {
                  d[i][j] = a[i][j];
                  l[i][j] = u[i][j] = 0;
                }
              }
            }
            h = jStat3.multiply(jStat3.multiply(jStat3.inv(d), jStat3.add(l, u)), -1);
            c = jStat3.multiply(jStat3.inv(d), b);
            xv = x;
            xk = jStat3.add(jStat3.multiply(h, x), c);
            i = 2;
            while (Math2.abs(jStat3.norm(jStat3.subtract(xk, xv))) > r) {
              xv = xk;
              xk = jStat3.add(jStat3.multiply(h, xv), c);
              i++;
            }
            return xk;
          },
          gauss_seidel: function gauss_seidel(a, b, x, r) {
            var i = 0;
            var n = a.length;
            var l = [];
            var u = [];
            var d = [];
            var j, xv, c, h, xk;
            for (; i < n; i++) {
              l[i] = [];
              u[i] = [];
              d[i] = [];
              for (j = 0; j < n; j++) {
                if (i > j) {
                  l[i][j] = a[i][j];
                  u[i][j] = d[i][j] = 0;
                } else if (i < j) {
                  u[i][j] = a[i][j];
                  l[i][j] = d[i][j] = 0;
                } else {
                  d[i][j] = a[i][j];
                  l[i][j] = u[i][j] = 0;
                }
              }
            }
            h = jStat3.multiply(jStat3.multiply(jStat3.inv(jStat3.add(d, l)), u), -1);
            c = jStat3.multiply(jStat3.inv(jStat3.add(d, l)), b);
            xv = x;
            xk = jStat3.add(jStat3.multiply(h, x), c);
            i = 2;
            while (Math2.abs(jStat3.norm(jStat3.subtract(xk, xv))) > r) {
              xv = xk;
              xk = jStat3.add(jStat3.multiply(h, xv), c);
              i = i + 1;
            }
            return xk;
          },
          SOR: function SOR(a, b, x, r, w) {
            var i = 0;
            var n = a.length;
            var l = [];
            var u = [];
            var d = [];
            var j, xv, c, h, xk;
            for (; i < n; i++) {
              l[i] = [];
              u[i] = [];
              d[i] = [];
              for (j = 0; j < n; j++) {
                if (i > j) {
                  l[i][j] = a[i][j];
                  u[i][j] = d[i][j] = 0;
                } else if (i < j) {
                  u[i][j] = a[i][j];
                  l[i][j] = d[i][j] = 0;
                } else {
                  d[i][j] = a[i][j];
                  l[i][j] = u[i][j] = 0;
                }
              }
            }
            h = jStat3.multiply(
              jStat3.inv(jStat3.add(d, jStat3.multiply(l, w))),
              jStat3.subtract(
                jStat3.multiply(d, 1 - w),
                jStat3.multiply(u, w)
              )
            );
            c = jStat3.multiply(jStat3.multiply(jStat3.inv(jStat3.add(
              d,
              jStat3.multiply(l, w)
            )), b), w);
            xv = x;
            xk = jStat3.add(jStat3.multiply(h, x), c);
            i = 2;
            while (Math2.abs(jStat3.norm(jStat3.subtract(xk, xv))) > r) {
              xv = xk;
              xk = jStat3.add(jStat3.multiply(h, xv), c);
              i++;
            }
            return xk;
          },
          householder: function householder(a) {
            var m = a.length;
            var n = a[0].length;
            var i = 0;
            var w = [];
            var p = [];
            var alpha, r, k, j, factor;
            for (; i < m - 1; i++) {
              alpha = 0;
              for (j = i + 1; j < n; j++)
                alpha += a[j][i] * a[j][i];
              factor = a[i + 1][i] > 0 ? -1 : 1;
              alpha = factor * Math2.sqrt(alpha);
              r = Math2.sqrt((alpha * alpha - a[i + 1][i] * alpha) / 2);
              w = jStat3.zeros(m, 1);
              w[i + 1][0] = (a[i + 1][i] - alpha) / (2 * r);
              for (k = i + 2; k < m; k++) w[k][0] = a[k][i] / (2 * r);
              p = jStat3.subtract(
                jStat3.identity(m, n),
                jStat3.multiply(jStat3.multiply(w, jStat3.transpose(w)), 2)
              );
              a = jStat3.multiply(p, jStat3.multiply(a, p));
            }
            return a;
          },
          // A -> [Q,R]
          // Q is orthogonal matrix
          // R is upper triangular
          QR: (function() {
            var sum = jStat3.sum;
            var range = jStat3.arange;
            function qr2(x) {
              var n = x.length;
              var p = x[0].length;
              var r = jStat3.zeros(p, p);
              x = jStat3.copy(x);
              var i, j, k;
              for (j = 0; j < p; j++) {
                r[j][j] = Math2.sqrt(sum(range(n).map(function(i2) {
                  return x[i2][j] * x[i2][j];
                })));
                for (i = 0; i < n; i++) {
                  x[i][j] = x[i][j] / r[j][j];
                }
                for (k = j + 1; k < p; k++) {
                  r[j][k] = sum(range(n).map(function(i2) {
                    return x[i2][j] * x[i2][k];
                  }));
                  for (i = 0; i < n; i++) {
                    x[i][k] = x[i][k] - x[i][j] * r[j][k];
                  }
                }
              }
              return [x, r];
            }
            return qr2;
          })(),
          lstsq: /* @__PURE__ */ (function() {
            function R_I(A) {
              A = jStat3.copy(A);
              var size = A.length;
              var I = jStat3.identity(size);
              jStat3.arange(size - 1, -1, -1).forEach(function(i) {
                jStat3.sliceAssign(
                  I,
                  { row: i },
                  jStat3.divide(jStat3.slice(I, { row: i }), A[i][i])
                );
                jStat3.sliceAssign(
                  A,
                  { row: i },
                  jStat3.divide(jStat3.slice(A, { row: i }), A[i][i])
                );
                jStat3.arange(i).forEach(function(j) {
                  var c = jStat3.multiply(A[j][i], -1);
                  var Aj = jStat3.slice(A, { row: j });
                  var cAi = jStat3.multiply(jStat3.slice(A, { row: i }), c);
                  jStat3.sliceAssign(A, { row: j }, jStat3.add(Aj, cAi));
                  var Ij = jStat3.slice(I, { row: j });
                  var cIi = jStat3.multiply(jStat3.slice(I, { row: i }), c);
                  jStat3.sliceAssign(I, { row: j }, jStat3.add(Ij, cIi));
                });
              });
              return I;
            }
            function qr_solve(A, b) {
              var array_mode = false;
              if (b[0].length === void 0) {
                b = b.map(function(x2) {
                  return [x2];
                });
                array_mode = true;
              }
              var QR = jStat3.QR(A);
              var Q = QR[0];
              var R = QR[1];
              var attrs = A[0].length;
              var Q1 = jStat3.slice(Q, { col: { end: attrs } });
              var R1 = jStat3.slice(R, { row: { end: attrs } });
              var RI = R_I(R1);
              var Q2 = jStat3.transpose(Q1);
              if (Q2[0].length === void 0) {
                Q2 = [Q2];
              }
              var x = jStat3.multiply(jStat3.multiply(RI, Q2), b);
              if (x.length === void 0) {
                x = [[x]];
              }
              if (array_mode)
                return x.map(function(i) {
                  return i[0];
                });
              return x;
            }
            return qr_solve;
          })(),
          jacobi: function jacobi(a) {
            var condition = 1;
            var n = a.length;
            var e = jStat3.identity(n, n);
            var ev = [];
            var b, i, j, p, q, maxim, theta, s;
            while (condition === 1) {
              maxim = a[0][1];
              p = 0;
              q = 1;
              for (i = 0; i < n; i++) {
                for (j = 0; j < n; j++) {
                  if (i != j) {
                    if (maxim < Math2.abs(a[i][j])) {
                      maxim = Math2.abs(a[i][j]);
                      p = i;
                      q = j;
                    }
                  }
                }
              }
              if (a[p][p] === a[q][q])
                theta = a[p][q] > 0 ? Math2.PI / 4 : -Math2.PI / 4;
              else
                theta = Math2.atan(2 * a[p][q] / (a[p][p] - a[q][q])) / 2;
              s = jStat3.identity(n, n);
              s[p][p] = Math2.cos(theta);
              s[p][q] = -Math2.sin(theta);
              s[q][p] = Math2.sin(theta);
              s[q][q] = Math2.cos(theta);
              e = jStat3.multiply(e, s);
              b = jStat3.multiply(jStat3.multiply(jStat3.inv(s), a), s);
              a = b;
              condition = 0;
              for (i = 1; i < n; i++) {
                for (j = 1; j < n; j++) {
                  if (i != j && Math2.abs(a[i][j]) > 1e-3) {
                    condition = 1;
                  }
                }
              }
            }
            for (i = 0; i < n; i++) ev.push(a[i][i]);
            return [e, ev];
          },
          rungekutta: function rungekutta(f, h, p, t_j, u_j, order) {
            var k1, k2, u_j1, k3, k4;
            if (order === 2) {
              while (t_j <= p) {
                k1 = h * f(t_j, u_j);
                k2 = h * f(t_j + h, u_j + k1);
                u_j1 = u_j + (k1 + k2) / 2;
                u_j = u_j1;
                t_j = t_j + h;
              }
            }
            if (order === 4) {
              while (t_j <= p) {
                k1 = h * f(t_j, u_j);
                k2 = h * f(t_j + h / 2, u_j + k1 / 2);
                k3 = h * f(t_j + h / 2, u_j + k2 / 2);
                k4 = h * f(t_j + h, u_j + k3);
                u_j1 = u_j + (k1 + 2 * k2 + 2 * k3 + k4) / 6;
                u_j = u_j1;
                t_j = t_j + h;
              }
            }
            return u_j;
          },
          romberg: function romberg(f, a, b, order) {
            var i = 0;
            var h = (b - a) / 2;
            var x = [];
            var h1 = [];
            var g = [];
            var m, a1, j, k, I;
            while (i < order / 2) {
              I = f(a);
              for (j = a, k = 0; j <= b; j = j + h, k++) x[k] = j;
              m = x.length;
              for (j = 1; j < m - 1; j++) {
                I += (j % 2 !== 0 ? 4 : 2) * f(x[j]);
              }
              I = h / 3 * (I + f(b));
              g[i] = I;
              h /= 2;
              i++;
            }
            a1 = g.length;
            m = 1;
            while (a1 !== 1) {
              for (j = 0; j < a1 - 1; j++)
                h1[j] = (Math2.pow(4, m) * g[j + 1] - g[j]) / (Math2.pow(4, m) - 1);
              a1 = h1.length;
              g = h1;
              h1 = [];
              m++;
            }
            return g;
          },
          richardson: function richardson(X, f, x, h) {
            function pos(X2, x2) {
              var i2 = 0;
              var n = X2.length;
              var p;
              for (; i2 < n; i2++)
                if (X2[i2] === x2) p = i2;
              return p;
            }
            var h_min = Math2.abs(x - X[pos(X, x) + 1]);
            var i = 0;
            var g = [];
            var h1 = [];
            var y1, y2, m, a, j;
            while (h >= h_min) {
              y1 = pos(X, x + h);
              y2 = pos(X, x);
              g[i] = (f[y1] - 2 * f[y2] + f[2 * y2 - y1]) / (h * h);
              h /= 2;
              i++;
            }
            a = g.length;
            m = 1;
            while (a != 1) {
              for (j = 0; j < a - 1; j++)
                h1[j] = (Math2.pow(4, m) * g[j + 1] - g[j]) / (Math2.pow(4, m) - 1);
              a = h1.length;
              g = h1;
              h1 = [];
              m++;
            }
            return g;
          },
          simpson: function simpson(f, a, b, n) {
            var h = (b - a) / n;
            var I = f(a);
            var x = [];
            var j = a;
            var k = 0;
            var i = 1;
            var m;
            for (; j <= b; j = j + h, k++)
              x[k] = j;
            m = x.length;
            for (; i < m - 1; i++) {
              I += (i % 2 !== 0 ? 4 : 2) * f(x[i]);
            }
            return h / 3 * (I + f(b));
          },
          hermite: function hermite(X, F2, dF, value) {
            var n = X.length;
            var p = 0;
            var i = 0;
            var l = [];
            var dl = [];
            var A = [];
            var B = [];
            var j;
            for (; i < n; i++) {
              l[i] = 1;
              for (j = 0; j < n; j++) {
                if (i != j) l[i] *= (value - X[j]) / (X[i] - X[j]);
              }
              dl[i] = 0;
              for (j = 0; j < n; j++) {
                if (i != j) dl[i] += 1 / (X[i] - X[j]);
              }
              A[i] = (1 - 2 * (value - X[i]) * dl[i]) * (l[i] * l[i]);
              B[i] = (value - X[i]) * (l[i] * l[i]);
              p += A[i] * F2[i] + B[i] * dF[i];
            }
            return p;
          },
          lagrange: function lagrange(X, F2, value) {
            var p = 0;
            var i = 0;
            var j, l;
            var n = X.length;
            for (; i < n; i++) {
              l = F2[i];
              for (j = 0; j < n; j++) {
                if (i != j) l *= (value - X[j]) / (X[i] - X[j]);
              }
              p += l;
            }
            return p;
          },
          cubic_spline: function cubic_spline(X, F2, value) {
            var n = X.length;
            var i = 0, j;
            var A = [];
            var B = [];
            var alpha = [];
            var c = [];
            var h = [];
            var b = [];
            var d = [];
            for (; i < n - 1; i++)
              h[i] = X[i + 1] - X[i];
            alpha[0] = 0;
            for (i = 1; i < n - 1; i++) {
              alpha[i] = 3 / h[i] * (F2[i + 1] - F2[i]) - 3 / h[i - 1] * (F2[i] - F2[i - 1]);
            }
            for (i = 1; i < n - 1; i++) {
              A[i] = [];
              B[i] = [];
              A[i][i - 1] = h[i - 1];
              A[i][i] = 2 * (h[i - 1] + h[i]);
              A[i][i + 1] = h[i];
              B[i][0] = alpha[i];
            }
            c = jStat3.multiply(jStat3.inv(A), B);
            for (j = 0; j < n - 1; j++) {
              b[j] = (F2[j + 1] - F2[j]) / h[j] - h[j] * (c[j + 1][0] + 2 * c[j][0]) / 3;
              d[j] = (c[j + 1][0] - c[j][0]) / (3 * h[j]);
            }
            for (j = 0; j < n; j++) {
              if (X[j] > value) break;
            }
            j -= 1;
            return F2[j] + (value - X[j]) * b[j] + jStat3.sq(value - X[j]) * c[j] + (value - X[j]) * jStat3.sq(value - X[j]) * d[j];
          },
          gauss_quadrature: function gauss_quadrature() {
            throw new Error("gauss_quadrature not yet implemented");
          },
          PCA: function PCA(X) {
            var m = X.length;
            var n = X[0].length;
            var i = 0;
            var j, temp1;
            var u = [];
            var D = [];
            var result = [];
            var temp2 = [];
            var Y = [];
            var Bt = [];
            var B = [];
            var C = [];
            var V = [];
            var Vt = [];
            for (i = 0; i < m; i++) {
              u[i] = jStat3.sum(X[i]) / n;
            }
            for (i = 0; i < n; i++) {
              B[i] = [];
              for (j = 0; j < m; j++) {
                B[i][j] = X[j][i] - u[j];
              }
            }
            B = jStat3.transpose(B);
            for (i = 0; i < m; i++) {
              C[i] = [];
              for (j = 0; j < m; j++) {
                C[i][j] = jStat3.dot([B[i]], [B[j]]) / (n - 1);
              }
            }
            result = jStat3.jacobi(C);
            V = result[0];
            D = result[1];
            Vt = jStat3.transpose(V);
            for (i = 0; i < D.length; i++) {
              for (j = i; j < D.length; j++) {
                if (D[i] < D[j]) {
                  temp1 = D[i];
                  D[i] = D[j];
                  D[j] = temp1;
                  temp2 = Vt[i];
                  Vt[i] = Vt[j];
                  Vt[j] = temp2;
                }
              }
            }
            Bt = jStat3.transpose(B);
            for (i = 0; i < m; i++) {
              Y[i] = [];
              for (j = 0; j < Bt.length; j++) {
                Y[i][j] = jStat3.dot([Vt[i]], [Bt[j]]);
              }
            }
            return [X, D, Vt, Y];
          }
        });
        (function(funcs) {
          for (var i = 0; i < funcs.length; i++) (function(passfunc) {
            jStat3.fn[passfunc] = function(arg, func) {
              var tmpthis = this;
              if (func) {
                setTimeout(function() {
                  func.call(tmpthis, jStat3.fn[passfunc].call(tmpthis, arg));
                }, 15);
                return this;
              }
              if (typeof jStat3[passfunc](this, arg) === "number")
                return jStat3[passfunc](this, arg);
              else
                return jStat3(jStat3[passfunc](this, arg));
            };
          })(funcs[i]);
        })("add divide multiply subtract dot pow exp log abs norm angle".split(" "));
      })(jStat2, Math);
      (function(jStat3, Math2) {
        var slice = [].slice;
        var isNumber = jStat3.utils.isNumber;
        var isArray = jStat3.utils.isArray;
        jStat3.extend({
          // 2 different parameter lists:
          // (value, mean, sd)
          // (value, array, flag)
          zscore: function zscore() {
            var args = slice.call(arguments);
            if (isNumber(args[1])) {
              return (args[0] - args[1]) / args[2];
            }
            return (args[0] - jStat3.mean(args[1])) / jStat3.stdev(args[1], args[2]);
          },
          // 3 different paramter lists:
          // (value, mean, sd, sides)
          // (zscore, sides)
          // (value, array, sides, flag)
          ztest: function ztest() {
            var args = slice.call(arguments);
            var z;
            if (isArray(args[1])) {
              z = jStat3.zscore(args[0], args[1], args[3]);
              return args[2] === 1 ? jStat3.normal.cdf(-Math2.abs(z), 0, 1) : jStat3.normal.cdf(-Math2.abs(z), 0, 1) * 2;
            } else {
              if (args.length > 2) {
                z = jStat3.zscore(args[0], args[1], args[2]);
                return args[3] === 1 ? jStat3.normal.cdf(-Math2.abs(z), 0, 1) : jStat3.normal.cdf(-Math2.abs(z), 0, 1) * 2;
              } else {
                z = args[0];
                return args[1] === 1 ? jStat3.normal.cdf(-Math2.abs(z), 0, 1) : jStat3.normal.cdf(-Math2.abs(z), 0, 1) * 2;
              }
            }
          }
        });
        jStat3.extend(jStat3.fn, {
          zscore: function zscore(value, flag) {
            return (value - this.mean()) / this.stdev(flag);
          },
          ztest: function ztest(value, sides, flag) {
            var zscore = Math2.abs(this.zscore(value, flag));
            return sides === 1 ? jStat3.normal.cdf(-zscore, 0, 1) : jStat3.normal.cdf(-zscore, 0, 1) * 2;
          }
        });
        jStat3.extend({
          // 2 parameter lists
          // (value, mean, sd, n)
          // (value, array)
          tscore: function tscore() {
            var args = slice.call(arguments);
            return args.length === 4 ? (args[0] - args[1]) / (args[2] / Math2.sqrt(args[3])) : (args[0] - jStat3.mean(args[1])) / (jStat3.stdev(args[1], true) / Math2.sqrt(args[1].length));
          },
          // 3 different paramter lists:
          // (value, mean, sd, n, sides)
          // (tscore, n, sides)
          // (value, array, sides)
          ttest: function ttest() {
            var args = slice.call(arguments);
            var tscore;
            if (args.length === 5) {
              tscore = Math2.abs(jStat3.tscore(args[0], args[1], args[2], args[3]));
              return args[4] === 1 ? jStat3.studentt.cdf(-tscore, args[3] - 1) : jStat3.studentt.cdf(-tscore, args[3] - 1) * 2;
            }
            if (isNumber(args[1])) {
              tscore = Math2.abs(args[0]);
              return args[2] == 1 ? jStat3.studentt.cdf(-tscore, args[1] - 1) : jStat3.studentt.cdf(-tscore, args[1] - 1) * 2;
            }
            tscore = Math2.abs(jStat3.tscore(args[0], args[1]));
            return args[2] == 1 ? jStat3.studentt.cdf(-tscore, args[1].length - 1) : jStat3.studentt.cdf(-tscore, args[1].length - 1) * 2;
          }
        });
        jStat3.extend(jStat3.fn, {
          tscore: function tscore(value) {
            return (value - this.mean()) / (this.stdev(true) / Math2.sqrt(this.cols()));
          },
          ttest: function ttest(value, sides) {
            return sides === 1 ? 1 - jStat3.studentt.cdf(Math2.abs(this.tscore(value)), this.cols() - 1) : jStat3.studentt.cdf(-Math2.abs(this.tscore(value)), this.cols() - 1) * 2;
          }
        });
        jStat3.extend({
          // Paramter list is as follows:
          // (array1, array2, array3, ...)
          // or it is an array of arrays
          // array of arrays conversion
          anovafscore: function anovafscore() {
            var args = slice.call(arguments), expVar, sample, sampMean, sampSampMean, tmpargs, unexpVar, i, j;
            if (args.length === 1) {
              tmpargs = new Array(args[0].length);
              for (i = 0; i < args[0].length; i++) {
                tmpargs[i] = args[0][i];
              }
              args = tmpargs;
            }
            sample = new Array();
            for (i = 0; i < args.length; i++) {
              sample = sample.concat(args[i]);
            }
            sampMean = jStat3.mean(sample);
            expVar = 0;
            for (i = 0; i < args.length; i++) {
              expVar = expVar + args[i].length * Math2.pow(jStat3.mean(args[i]) - sampMean, 2);
            }
            expVar /= args.length - 1;
            unexpVar = 0;
            for (i = 0; i < args.length; i++) {
              sampSampMean = jStat3.mean(args[i]);
              for (j = 0; j < args[i].length; j++) {
                unexpVar += Math2.pow(args[i][j] - sampSampMean, 2);
              }
            }
            unexpVar /= sample.length - args.length;
            return expVar / unexpVar;
          },
          // 2 different paramter setups
          // (array1, array2, array3, ...)
          // (anovafscore, df1, df2)
          anovaftest: function anovaftest() {
            var args = slice.call(arguments), df1, df2, n, i;
            if (isNumber(args[0])) {
              return 1 - jStat3.centralF.cdf(args[0], args[1], args[2]);
            }
            var anovafscore = jStat3.anovafscore(args);
            df1 = args.length - 1;
            n = 0;
            for (i = 0; i < args.length; i++) {
              n = n + args[i].length;
            }
            df2 = n - df1 - 1;
            return 1 - jStat3.centralF.cdf(anovafscore, df1, df2);
          },
          ftest: function ftest(fscore, df1, df2) {
            return 1 - jStat3.centralF.cdf(fscore, df1, df2);
          }
        });
        jStat3.extend(jStat3.fn, {
          anovafscore: function anovafscore() {
            return jStat3.anovafscore(this.toArray());
          },
          anovaftes: function anovaftes() {
            var n = 0;
            var i;
            for (i = 0; i < this.length; i++) {
              n = n + this[i].length;
            }
            return jStat3.ftest(this.anovafscore(), this.length - 1, n - this.length);
          }
        });
        jStat3.extend({
          // 2 parameter lists
          // (mean1, mean2, n1, n2, sd)
          // (array1, array2, sd)
          qscore: function qscore() {
            var args = slice.call(arguments);
            var mean1, mean2, n1, n2, sd;
            if (isNumber(args[0])) {
              mean1 = args[0];
              mean2 = args[1];
              n1 = args[2];
              n2 = args[3];
              sd = args[4];
            } else {
              mean1 = jStat3.mean(args[0]);
              mean2 = jStat3.mean(args[1]);
              n1 = args[0].length;
              n2 = args[1].length;
              sd = args[2];
            }
            return Math2.abs(mean1 - mean2) / (sd * Math2.sqrt((1 / n1 + 1 / n2) / 2));
          },
          // 3 different parameter lists:
          // (qscore, n, k)
          // (mean1, mean2, n1, n2, sd, n, k)
          // (array1, array2, sd, n, k)
          qtest: function qtest() {
            var args = slice.call(arguments);
            var qscore;
            if (args.length === 3) {
              qscore = args[0];
              args = args.slice(1);
            } else if (args.length === 7) {
              qscore = jStat3.qscore(args[0], args[1], args[2], args[3], args[4]);
              args = args.slice(5);
            } else {
              qscore = jStat3.qscore(args[0], args[1], args[2]);
              args = args.slice(3);
            }
            var n = args[0];
            var k = args[1];
            return 1 - jStat3.tukey.cdf(qscore, k, n - k);
          },
          tukeyhsd: function tukeyhsd(arrays) {
            var sd = jStat3.pooledstdev(arrays);
            var means = arrays.map(function(arr) {
              return jStat3.mean(arr);
            });
            var n = arrays.reduce(function(n2, arr) {
              return n2 + arr.length;
            }, 0);
            var results = [];
            for (var i = 0; i < arrays.length; ++i) {
              for (var j = i + 1; j < arrays.length; ++j) {
                var p = jStat3.qtest(means[i], means[j], arrays[i].length, arrays[j].length, sd, n, arrays.length);
                results.push([[i, j], p]);
              }
            }
            return results;
          }
        });
        jStat3.extend({
          // 2 different parameter setups
          // (value, alpha, sd, n)
          // (value, alpha, array)
          normalci: function normalci() {
            var args = slice.call(arguments), ans = new Array(2), change;
            if (args.length === 4) {
              change = Math2.abs(jStat3.normal.inv(args[1] / 2, 0, 1) * args[2] / Math2.sqrt(args[3]));
            } else {
              change = Math2.abs(jStat3.normal.inv(args[1] / 2, 0, 1) * jStat3.stdev(args[2]) / Math2.sqrt(args[2].length));
            }
            ans[0] = args[0] - change;
            ans[1] = args[0] + change;
            return ans;
          },
          // 2 different parameter setups
          // (value, alpha, sd, n)
          // (value, alpha, array)
          tci: function tci() {
            var args = slice.call(arguments), ans = new Array(2), change;
            if (args.length === 4) {
              change = Math2.abs(jStat3.studentt.inv(args[1] / 2, args[3] - 1) * args[2] / Math2.sqrt(args[3]));
            } else {
              change = Math2.abs(jStat3.studentt.inv(args[1] / 2, args[2].length - 1) * jStat3.stdev(args[2], true) / Math2.sqrt(args[2].length));
            }
            ans[0] = args[0] - change;
            ans[1] = args[0] + change;
            return ans;
          },
          significant: function significant(pvalue, alpha) {
            return pvalue < alpha;
          }
        });
        jStat3.extend(jStat3.fn, {
          normalci: function normalci(value, alpha) {
            return jStat3.normalci(value, alpha, this.toArray());
          },
          tci: function tci(value, alpha) {
            return jStat3.tci(value, alpha, this.toArray());
          }
        });
        function differenceOfProportions(p1, n1, p2, n2) {
          if (p1 > 1 || p2 > 1 || p1 <= 0 || p2 <= 0) {
            throw new Error("Proportions should be greater than 0 and less than 1");
          }
          var pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
          var se = Math2.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
          return (p1 - p2) / se;
        }
        jStat3.extend(jStat3.fn, {
          oneSidedDifferenceOfProportions: function oneSidedDifferenceOfProportions(p1, n1, p2, n2) {
            var z = differenceOfProportions(p1, n1, p2, n2);
            return jStat3.ztest(z, 1);
          },
          twoSidedDifferenceOfProportions: function twoSidedDifferenceOfProportions(p1, n1, p2, n2) {
            var z = differenceOfProportions(p1, n1, p2, n2);
            return jStat3.ztest(z, 2);
          }
        });
      })(jStat2, Math);
      jStat2.models = /* @__PURE__ */ (function() {
        function sub_regress(exog) {
          var var_count = exog[0].length;
          var modelList = jStat2.arange(var_count).map(function(endog_index) {
            var exog_index = jStat2.arange(var_count).filter(function(i) {
              return i !== endog_index;
            });
            return ols(
              jStat2.col(exog, endog_index).map(function(x) {
                return x[0];
              }),
              jStat2.col(exog, exog_index)
            );
          });
          return modelList;
        }
        function ols(endog, exog) {
          var nobs = endog.length;
          var df_model = exog[0].length - 1;
          var df_resid = nobs - df_model - 1;
          var coef = jStat2.lstsq(exog, endog);
          var predict = jStat2.multiply(exog, coef.map(function(x) {
            return [x];
          })).map(function(p) {
            return p[0];
          });
          var resid = jStat2.subtract(endog, predict);
          var ybar = jStat2.mean(endog);
          var SSE = jStat2.sum(predict.map(function(f) {
            return Math.pow(f - ybar, 2);
          }));
          var SSR = jStat2.sum(endog.map(function(y, i) {
            return Math.pow(y - predict[i], 2);
          }));
          var SST = SSE + SSR;
          var R2 = SSE / SST;
          return {
            exog,
            endog,
            nobs,
            df_model,
            df_resid,
            coef,
            predict,
            resid,
            ybar,
            SST,
            SSE,
            SSR,
            R2
          };
        }
        function t_test(model) {
          var subModelList = sub_regress(model.exog);
          var sigmaHat = Math.sqrt(model.SSR / model.df_resid);
          var seBetaHat = subModelList.map(function(mod) {
            var SST = mod.SST;
            var R2 = mod.R2;
            return sigmaHat / Math.sqrt(SST * (1 - R2));
          });
          var tStatistic = model.coef.map(function(coef, i) {
            return (coef - 0) / seBetaHat[i];
          });
          var pValue = tStatistic.map(function(t) {
            var leftppf = jStat2.studentt.cdf(t, model.df_resid);
            return (leftppf > 0.5 ? 1 - leftppf : leftppf) * 2;
          });
          var c = jStat2.studentt.inv(0.975, model.df_resid);
          var interval95 = model.coef.map(function(coef, i) {
            var d = c * seBetaHat[i];
            return [coef - d, coef + d];
          });
          return {
            se: seBetaHat,
            t: tStatistic,
            p: pValue,
            sigmaHat,
            interval95
          };
        }
        function F_test(model) {
          var F_statistic = model.R2 / model.df_model / ((1 - model.R2) / model.df_resid);
          var fcdf = function(x, n1, n2) {
            return jStat2.beta.cdf(x / (n2 / n1 + x), n1 / 2, n2 / 2);
          };
          var pvalue = 1 - fcdf(F_statistic, model.df_model, model.df_resid);
          return { F_statistic, pvalue };
        }
        function ols_wrap(endog, exog) {
          var model = ols(endog, exog);
          var ttest = t_test(model);
          var ftest = F_test(model);
          var adjust_R2 = 1 - (1 - model.R2) * ((model.nobs - 1) / model.df_resid);
          model.t = ttest;
          model.f = ftest;
          model.adjust_R2 = adjust_R2;
          return model;
        }
        return { ols: ols_wrap };
      })();
      jStat2.extend({
        buildxmatrix: function buildxmatrix() {
          var matrixRows = new Array(arguments.length);
          for (var i = 0; i < arguments.length; i++) {
            var array = [1];
            matrixRows[i] = array.concat(arguments[i]);
          }
          return jStat2(matrixRows);
        },
        builddxmatrix: function builddxmatrix() {
          var matrixRows = new Array(arguments[0].length);
          for (var i = 0; i < arguments[0].length; i++) {
            var array = [1];
            matrixRows[i] = array.concat(arguments[0][i]);
          }
          return jStat2(matrixRows);
        },
        buildjxmatrix: function buildjxmatrix(jMat) {
          var pass = new Array(jMat.length);
          for (var i = 0; i < jMat.length; i++) {
            pass[i] = jMat[i];
          }
          return jStat2.builddxmatrix(pass);
        },
        buildymatrix: function buildymatrix(array) {
          return jStat2(array).transpose();
        },
        buildjymatrix: function buildjymatrix(jMat) {
          return jMat.transpose();
        },
        matrixmult: function matrixmult(A, B) {
          var i, j, k, result, sum;
          if (A.cols() == B.rows()) {
            if (B.rows() > 1) {
              result = [];
              for (i = 0; i < A.rows(); i++) {
                result[i] = [];
                for (j = 0; j < B.cols(); j++) {
                  sum = 0;
                  for (k = 0; k < A.cols(); k++) {
                    sum += A.toArray()[i][k] * B.toArray()[k][j];
                  }
                  result[i][j] = sum;
                }
              }
              return jStat2(result);
            }
            result = [];
            for (i = 0; i < A.rows(); i++) {
              result[i] = [];
              for (j = 0; j < B.cols(); j++) {
                sum = 0;
                for (k = 0; k < A.cols(); k++) {
                  sum += A.toArray()[i][k] * B.toArray()[j];
                }
                result[i][j] = sum;
              }
            }
            return jStat2(result);
          }
        },
        //regress and regresst to be fixed
        regress: function regress(jMatX, jMatY) {
          var innerinv = jStat2.xtranspxinv(jMatX);
          var xtransp = jMatX.transpose();
          var next = jStat2.matrixmult(jStat2(innerinv), xtransp);
          return jStat2.matrixmult(next, jMatY);
        },
        regresst: function regresst(jMatX, jMatY, sides) {
          var beta = jStat2.regress(jMatX, jMatY);
          var compile = {};
          compile.anova = {};
          var jMatYBar = jStat2.jMatYBar(jMatX, beta);
          compile.yBar = jMatYBar;
          var yAverage = jMatY.mean();
          compile.anova.residuals = jStat2.residuals(jMatY, jMatYBar);
          compile.anova.ssr = jStat2.ssr(jMatYBar, yAverage);
          compile.anova.msr = compile.anova.ssr / (jMatX[0].length - 1);
          compile.anova.sse = jStat2.sse(jMatY, jMatYBar);
          compile.anova.mse = compile.anova.sse / (jMatY.length - (jMatX[0].length - 1) - 1);
          compile.anova.sst = jStat2.sst(jMatY, yAverage);
          compile.anova.mst = compile.anova.sst / (jMatY.length - 1);
          compile.anova.r2 = 1 - compile.anova.sse / compile.anova.sst;
          if (compile.anova.r2 < 0) compile.anova.r2 = 0;
          compile.anova.fratio = compile.anova.msr / compile.anova.mse;
          compile.anova.pvalue = jStat2.anovaftest(
            compile.anova.fratio,
            jMatX[0].length - 1,
            jMatY.length - (jMatX[0].length - 1) - 1
          );
          compile.anova.rmse = Math.sqrt(compile.anova.mse);
          compile.anova.r2adj = 1 - compile.anova.mse / compile.anova.mst;
          if (compile.anova.r2adj < 0) compile.anova.r2adj = 0;
          compile.stats = new Array(jMatX[0].length);
          var covar = jStat2.xtranspxinv(jMatX);
          var sds, ts, ps;
          for (var i = 0; i < beta.length; i++) {
            sds = Math.sqrt(compile.anova.mse * Math.abs(covar[i][i]));
            ts = Math.abs(beta[i] / sds);
            ps = jStat2.ttest(ts, jMatY.length - jMatX[0].length - 1, sides);
            compile.stats[i] = [beta[i], sds, ts, ps];
          }
          compile.regress = beta;
          return compile;
        },
        xtranspx: function xtranspx(jMatX) {
          return jStat2.matrixmult(jMatX.transpose(), jMatX);
        },
        xtranspxinv: function xtranspxinv(jMatX) {
          var inner = jStat2.matrixmult(jMatX.transpose(), jMatX);
          var innerinv = jStat2.inv(inner);
          return innerinv;
        },
        jMatYBar: function jMatYBar(jMatX, beta) {
          var yBar = jStat2.matrixmult(jMatX, beta);
          return new jStat2(yBar);
        },
        residuals: function residuals(jMatY, jMatYBar) {
          return jStat2.matrixsubtract(jMatY, jMatYBar);
        },
        ssr: function ssr(jMatYBar, yAverage) {
          var ssr2 = 0;
          for (var i = 0; i < jMatYBar.length; i++) {
            ssr2 += Math.pow(jMatYBar[i] - yAverage, 2);
          }
          return ssr2;
        },
        sse: function sse(jMatY, jMatYBar) {
          var sse2 = 0;
          for (var i = 0; i < jMatY.length; i++) {
            sse2 += Math.pow(jMatY[i] - jMatYBar[i], 2);
          }
          return sse2;
        },
        sst: function sst(jMatY, yAverage) {
          var sst2 = 0;
          for (var i = 0; i < jMatY.length; i++) {
            sst2 += Math.pow(jMatY[i] - yAverage, 2);
          }
          return sst2;
        },
        matrixsubtract: function matrixsubtract(A, B) {
          var ans = new Array(A.length);
          for (var i = 0; i < A.length; i++) {
            ans[i] = new Array(A[i].length);
            for (var j = 0; j < A[i].length; j++) {
              ans[i][j] = A[i][j] - B[i][j];
            }
          }
          return jStat2(ans);
        }
      });
      jStat2.jStat = jStat2;
      return jStat2;
    });
  }
});

// js/beta.js
var import_jstat = __toESM(require_jstat(), 1);

// js/base.js
var W = 660;
var H = 360;
var M_L = 8;
var M_R = 8;
var M_T = 46;
var M_B = 44;
var HIT_W = 24;
var DIAL_TOP = M_T + 40;
var DIAL_BOT = H - M_B - 6;
var DIAL_HIT_W = 36;
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
  const nice = (raw) => {
    if (!(raw > 0)) return 1;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const sn = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
    return sn * mag;
  };
  const step = nice(span / 9);
  const p = Math.max(0, -Math.floor(Math.log10(step)));
  let len;
  if (Math.abs(span) >= 1) {
    const d2 = Math.floor(Math.log10(Math.abs(span))) + 1;
    len = d2 + Math.floor((d2 - 1) / 3);
  } else {
    len = 2 + p;
  }
  const damp = p >= 6 ? 0.45 : p >= 5 ? 0.55 : p >= 4 ? 0.7 : p >= 3 ? 0.85 : 1;
  const target = Math.max(4, Math.min(12, Math.round(644 / (11.7 * len) * damp)));
  const major = nice(span / target);
  const div = target >= 9 ? 1 : target >= 7 ? 2 : 4;
  const minor = major / div;
  const prec = Math.max(0, -Math.floor(Math.log10(major)));
  const build = (s, extend, p2) => {
    const out = [];
    let i = (Math.ceil(d[0] / s - 1e-9) || 0) - (extend ? 1 : 0);
    const hi = d[1] + (extend ? s : 0) + 1e-9;
    for (; i * s <= hi && out.length < 100; i++) {
      const v = i * s;
      out.push(p2 === null ? v : Math.round(v * 10 ** p2) / 10 ** p2);
    }
    return out;
  };
  return {
    major: build(major, false, prec),
    minor: build(minor, true, null),
    prec
  };
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
  if (a >= 1e12) return x.toExponential(2);
  if (a < 5 * 10 ** (-dp - 1)) return x.toExponential(2);
  return (Math.round(x * 10 ** dp) / 10 ** dp).toLocaleString("en-US", {
    maximumFractionDigits: dp
  });
}
function createWidget(F2, opts) {
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
      const traitNames = Object.keys(F2.defaults);
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
        const s = F2.support(p);
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
        setDomain(F2.bounds(p)[0], F2.bounds(p)[1]);
      }
      function fitTargetAfterDrag(p) {
        const cur = currentDomain();
        const b = F2.bounds(p);
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
          ys.push(F2.pdf(p, x));
        }
        let peak = 0;
        for (let i = 1; i < n; i++) peak = Math.max(peak, ys[i]);
        if (!(peak > 0) || !isFinite(peak)) peak = 1;
        return { xs, ys, peak };
      }
      function yFrac(py) {
        return clamp((py - M_T) / plotH, 0, 1);
      }
      function applyDrag(e) {
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const py = (e.clientY - rect.top) / rect.height * H;
        const d0 = dragDomain || currentDomain();
        const x = xInv(clamp(px, M_L, W - M_R), d0);
        const p = getParams();
        const axes = drag.handle.axes || ["x"];
        const yOnly = axes.length === 1 && axes[0] === "y";
        const y = yOnly ? clamp((py - DIAL_TOP) / (DIAL_BOT - DIAL_TOP), 0, 1) : yFrac(py);
        let fx = x;
        let fy = y;
        if (!axes.includes("x")) fx = drag.startX;
        if (!axes.includes("y")) fy = drag.startY;
        const next = drag.handle.drag(p, fx, fy, d0);
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
        const center = F2.handles.find((h) => h.kind === "center");
        if (!center) return;
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width * W;
        const x = xInv(clamp(px, M_L, W - M_R), currentDomain());
        setParams(center.drag(getParams(), x, 0.5, currentDomain()), "click");
      });
      const attachDrag = (g, handle) => {
        g.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          cancelAnim();
          dragDomain = currentDomain();
          const rect = svg.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width * W;
          const py = (e.clientY - rect.top) / rect.height * H;
          const x0 = xInv(clamp(px, M_L, W - M_R), dragDomain);
          drag = { handle, id: e.pointerId, startX: x0, startY: yFrac(py) };
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
        const { major, minor, prec } = ticks(dd);
        for (const x of minor) {
          elNS("line", svg, { class: "mgrid", x1: xt(x, dd), y1: M_T, x2: xt(x, dd), y2: base });
        }
        for (const x of major) {
          elNS("line", svg, { class: "mgridm", x1: xt(x, dd), y1: M_T, x2: xt(x, dd), y2: base });
          const t = elNS("text", svg, { class: "mtick", x: xt(x, dd), y: H - 12, "text-anchor": "middle" });
          t.textContent = fmt(x, prec);
        }
        elNS("line", svg, { class: "maxis", x1: M_L, y1: base, x2: W - M_R, y2: base });
        elNS("rect", svg, { class: "mpan", x: M_L, y: base - 6, width: plotW, height: 16, rx: 4 });
        const panTip = elNS("text", svg, { class: "mpantip", x: M_L + 5, y: base - 9 });
        panTip.textContent = "\u2194 drag axis to pan";
        const { xs, ys, peak } = mesh(p, dd);
        const [il, ih] = F2.integ(p);
        const norm = integrate(il, ih, (x) => F2.pdf(p, x));
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
        const isY = (i) => {
          const a = F2.handles[i].axes;
          return a && a.length === 1 && a[0] === "y";
        };
        const hxOf = F2.handles.map(
          (h, i) => isY(i) ? null : clamp(xt(h.at(p), dd), M_L, W - M_R)
        );
        const zones = new Array(F2.handles.length);
        const idx = [...F2.handles.keys()].filter((i) => hxOf[i] != null).sort((a, b) => hxOf[a] - hxOf[b] || a - b);
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
        const overlap = new Array(F2.handles.length).fill(false);
        for (let i = 0; i < F2.handles.length; i++) {
          const h = F2.handles[i];
          if (isY(i)) {
            const yf = clamp(h.yOf ? h.yOf(p) : 0.5, 0, 1);
            const yPx = DIAL_TOP + yf * (DIAL_BOT - DIAL_TOP);
            const trackX = W - M_R - 20;
            const g2 = elNS("g", svg, { class: "mhandle mdial" });
            markerEls[i] = g2;
            elNS("line", g2, { class: "mdialtrack", x1: trackX, y1: DIAL_TOP, x2: trackX, y2: DIAL_BOT });
            elNS("line", g2, { class: "mdialref", x1: M_L, y1: yPx, x2: W - M_R, y2: yPx });
            elNS("rect", g2, { x: trackX - 9, y: yPx - 7, width: 18, height: 14, rx: 4, class: "mdialknob" });
            elNS("line", g2, { x1: trackX - 5, y1: yPx, x2: trackX + 5, y2: yPx, class: "mdialgrip" });
            const chip2 = elNS("g", svg, { class: "mchipgroup", transform: `translate(${trackX}, ${M_T + 30})` });
            const txt2 = elNS("text", chip2, { class: "mlabeltxt", "text-anchor": "middle", "dominant-baseline": "central" });
            txt2.textContent = h.chip(p);
            const bb2 = txt2.getBBox();
            elNS("rect", chip2, { x: bb2.x - 6, y: bb2.y - 4, width: bb2.width + 12, height: bb2.height + 8, rx: 7, class: "mchip", fill: h.color });
            chip2.appendChild(txt2);
            chipEls[i] = chip2;
            chipW[i] = 0;
            const hr2 = elNS("rect", hitLayer, { class: "mhity", x: trackX - DIAL_HIT_W / 2, y: DIAL_TOP, width: DIAL_HIT_W, height: DIAL_BOT - DIAL_TOP });
            hr2.addEventListener("pointerenter", () => {
              hoverIdx = i;
              applyHandleState();
            });
            hr2.addEventListener("pointerleave", () => {
              if (hoverIdx === i) hoverIdx = null;
              applyHandleState();
            });
            attachDrag(hr2, h);
            continue;
          }
          const hx = hxOf[i];
          const hy = yt(clamp(F2.pdf(p, h.at(p)), 0, peak), peak);
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
        for (let i = 0; i < F2.handles.length; i++) {
          for (let j = i + 1; j < F2.handles.length; j++) {
            if (hxOf[i] == null || hxOf[j] == null) continue;
            if (Math.abs(hxOf[i] - hxOf[j]) < chipW[i] + chipW[j]) {
              overlap[i] = overlap[j] = true;
            }
          }
        }
        function applyHandleState() {
          for (let i = 0; i < F2.handles.length; i++) {
            const h = F2.handles[i];
            const active = drag && drag.handle === h;
            chipEls[i].classList.toggle("mchip-dim", overlap[i] && hoverIdx !== i && !active);
          }
          if (drag) {
            const di = F2.handles.indexOf(drag.handle);
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
          for (const k of traitNames) d2[k] = F2.defaults[k];
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
        const fitView = () => animateView(F2.bounds(getParams()));
        const fbtn = elNS("g", svg, { class: "mfit", cursor: "pointer" });
        const fcx = rcx - 30;
        fbtn.addEventListener("click", (e) => {
          e.stopPropagation();
          fitView();
        });
        elNS("rect", fbtn, { x: fcx - 12, y: M_T + 4, width: 24, height: 24, rx: 6, class: "mfitbtn" });
        const ft = elNS("text", fbtn, { class: "mfitxt", x: fcx, y: M_T + 16, "text-anchor": "middle", "dominant-baseline": "central" });
        ft.textContent = "\u26F6";
        tip.textContent = F2.tip(p, { norm, peak });
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

// js/beta.js
var K_MIN = 0.02;
var K_MAX = 400;
var mean = (p) => p.alpha / (p.alpha + p.beta);
var kappa = (p) => p.alpha + p.beta;
function solveKappa(q, target, mu) {
  const f = (k) => import_jstat.default.beta.inv(q, k * mu, k * (1 - mu)) - target;
  const dir = Math.sign(f(K_MAX) - f(K_MIN)) || 1;
  const flow = f(K_MIN) * dir;
  const fhigh = f(K_MAX) * dir;
  if (flow > 0) return K_MIN;
  if (fhigh < 0) return K_MAX;
  let lo = K_MIN;
  let hi = K_MAX;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (f(m) * dir > 0) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
}
function translateAtKappa(p, x) {
  const k = kappa(p);
  const mu = Math.min(0.999, Math.max(1e-3, x));
  return { alpha: k * mu, beta: k * (1 - mu) };
}
function spreadAtKappa(p, q, x) {
  const mu = mean(p);
  const k = solveKappa(q, x, mu);
  return { alpha: k * mu, beta: k * (1 - mu) };
}
var F = {
  name: "beta",
  label: "Beta",
  defaults: { alpha: 2, beta: 2 },
  support: () => [0, 1],
  bounds: () => [0, 1],
  integ: () => [0, 1],
  pdf(p, x) {
    if (x <= 0 || x >= 1) return 0;
    return import_jstat.default.beta.pdf(x, p.alpha, p.beta);
  },
  handles: [
    {
      kind: "center",
      icon: "dot",
      color: "#0ea5e9",
      lineCls: "mmu",
      at: (p) => mean(p),
      chip: () => "mean",
      drag: (p, x) => translateAtKappa(p, x)
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => import_jstat.default.beta.inv(0.25, p.alpha, p.beta),
      chip: () => "q25",
      drag: (p, x) => spreadAtKappa(p, 0.25, x)
    },
    {
      kind: "spread",
      icon: "sq",
      color: "#8b5cf6",
      lineCls: "miqr",
      at: (p) => import_jstat.default.beta.inv(0.75, p.alpha, p.beta),
      chip: () => "q75",
      drag: (p, x) => spreadAtKappa(p, 0.75, x)
    }
  ],
  tip(p) {
    return `${F.label} (fixed [0,1]) \u2022 drag mean to translate \u2022 drag q25/q75 to concentrate \u2022 alpha=${fmt(p.alpha)} beta=${fmt(p.beta)}`;
  }
};
var beta_default = createWidget(F, { pins: "both" });
export {
  beta_default as default
};
