// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2017 Kris Kowal under the terms of the MIT
 * license found at https://github.com/kriskowal/q/blob/v1/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
  "use strict";

  // CommonJS
  if (typeof exports === "object" && typeof module === "object") {
    module.exports = definition();

    // RequireJS
  } else if (typeof define === "function" && define.amd) {
    define(definition);

    // <script>
  } else if (typeof window !== "undefined" || typeof self !== "undefined") {
    // Prefer window over self for add-on scripts. Use self for
    // non-windowed contexts.
    var global = typeof window !== "undefined" ? window : self;

    // Get the `window` object, save the previous Q global
    // and initialize Q as a global.
    var previousQ = global.Q;
    global.Q = definition();

    // Add a noConflict function so Q can be removed from the
    // global namespace.
    global.Q.noConflict = function () {
      global.Q = previousQ;
      return this;
    };

  } else {
    throw new Error("This environment was not anticipated by Q. Please file a bug.");
  }

})(function () {
  "use strict";

  // shims
  // using Promise ponyfill for IE inside the closure
  // it will be ignored in every non-ancient browser
  var internalPromise;
  if (typeof Promise !== 'function') {
    internalPromise = promisePonyfill();
  } else {
    internalPromise = Promise;
  }

  // utilities for timeouts working in HiveJS simulation
  function internalSetTimeout(cb, ms) {
    if ((typeof Framework != "undefined") && Framework.isSimulated()) {
      return Framework.setTimeout(cb, ms);
    } else {
      return setTimeout(cb, ms);
    }
  }

  function internalClearTimeout(id) {
    if ((typeof Framework != "undefined") && Framework.isSimulated()) {
      return Framework.clearTimeout(id);
    } else {
      return clearTimeout(id);
    }
  }

  /**
  * Constructs a promise for an immediate reference, passes promises through
  * @param value immediate reference or promise
  */
  function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof internalPromise) {
      return value;
    }

    return internalPromise.resolve(value);
  }
  Q.resolve = Q;

  /**
  * Constructs a {promise, resolve, reject} object.
  *
  * `resolve` is a callback to invoke with a more resolved value for the
  * promise. To fulfill the promise, invoke `resolve` with any value that is
  * not a thenable. To reject the promise, invoke `resolve` with a rejected
  * thenable, or invoke `reject` with the reason directly. To resolve the
  * promise to another thenable, thus putting it in the same state, invoke
  * `resolve` with that other thenable.
  */
  Q.defer = defer;
  function defer() {

    var deferred = {};
    var promise = new internalPromise(function (resolve, reject) {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    deferred.promise = promise;
    return deferred;

  }

  /**
   * Returns a promise for the given value (or promised value), some
   * milliseconds after it resolved. Passes rejections immediately.
   * @param {Any*} promise
   * @param {Number} milliseconds
   * @returns a promise for the resolution of the given promise after milliseconds
   * time has elapsed since the resolution of the given promise.
   * If the given promise rejects, that is passed immediately.
   */
  Q.delay = function (object, timeout) {
    if (timeout === void 0) {
      timeout = object;
      object = void 0;
    }
    return Q(object).delay(timeout);
  };

  /**
   * Causes a promise to be rejected if it does not get fulfilled before
   * some milliseconds time out.
   * @param {Any*} promise
   * @param {Number} milliseconds timeout
   * @param {Any*} custom error message or Error object (optional)
   * @returns a promise for the resolution of the given promise if it is
   * fulfilled before the timeout, otherwise rejected.
   */
  Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
  };

  Q.promise = internalPromise
  Q.Promise = internalPromise

  Q.reject = reject
  function reject(reason) {
    return internalPromise.reject(reason);
  }

  Q.all = all
  function all(chain) {
    return internalPromise.all(chain);
  }

  Q.any = any
  function any(chain) {
    return internalPromise.any(chain);
  }

  Q.allSettled = allSettled
  function allSettled(chain) {
    return internalPromise.allSettled(chain)
  }

  Q.race = race
  function race(chain) {
    return internalPromise.race(chain)
  }

  /**
   * Provides an opportunity to observe the settling of a promise,
   * regardless of whether the promise is fulfilled or rejected.  Forwards
   * the resolution to the returned promise when the callback is done.
   * The callback can return a promise to defer completion.
   * NOTE: this behavior is different from native promises.
   * @param {Any*} promise
   * @param {Function} callback to observe the resolution of the given
   * promise, takes no arguments.
   * @returns a promise for the resolution of the given promise when
   * ``finally`` is done.
   */
  internalPromise.prototype['finally'] = function (callback) {
    return this.then(function (value) {
      return Q().then(function () {
        callback();
        return value;
      })
    },
      function (reason) {
        return Q().then(function () {
          callback();
          throw reason;
        })
      })
  }

  // extend Promise

  internalPromise.prototype.timeout = function (ms, msg) {
    var deferred = defer();
    var timeoutId = internalSetTimeout(function () {
      var error = new Error(msg ? msg : "Timed out after " + ms + " ms");
      error.code = "ETIMEDOUT";
      deferred.reject(error);
    }, ms);

    this.then(function (value) {
      internalClearTimeout(timeoutId);
      deferred.resolve(value);
    }, function (exception) {
      internalClearTimeout(timeoutId);
      deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
  }

  internalPromise.prototype.delay = function (ms) {
    var deferred = defer();
    this.then(function (value) {
      internalSetTimeout(function () {
        deferred.resolve(value);
      }, ms);
    }, function (exception) {
      deferred.reject(exception);
    });

    return deferred.promise;
  }

  internalPromise.prototype.fail = internalPromise.prototype["catch"]

  internalPromise.prototype.done = function (fulfilled, rejected) {
    var onUnhandledError = function (e) {
      setTimeout(function () { throw e }, 0)
    };

    var promise = fulfilled || rejected ?
      this.then(fulfilled, rejected) :
      this;
    promise.then(void 0, onUnhandledError)
  }

  return Q;

});

/**
 * https://www.npmjs.com/package/promise-polyfill
 */
function promisePonyfill() {
  /**
  * @this {Promise}
  */
  function finallyConstructor(callback) {
    var constructor = this.constructor;
    return this.then(
      function (value) {
        // @ts-ignore
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      },
      function (reason) {
        // @ts-ignore
        return constructor.resolve(callback()).then(function () {
          // @ts-ignore
          return constructor.reject(reason);
        });
      }
    );
  }

  function allSettled(arr) {
    var P = this;
    return new P(function (resolve, reject) {
      if (!(arr && typeof arr.length !== 'undefined')) {
        return reject(
          new TypeError(
            typeof arr +
            ' ' +
            arr +
            ' is not iterable(cannot read property Symbol(Symbol.iterator))'
          )
        );
      }
      var args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function (val) {
                res(i, val);
              },
              function (e) {
                args[i] = { status: 'rejected', reason: e };
                if (--remaining === 0) {
                  resolve(args);
                }
              }
            );
            return;
          }
        }
        args[i] = { status: 'fulfilled', value: val };
        if (--remaining === 0) {
          resolve(args);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  }

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function isArray(x) {
    return Boolean(x && typeof x.length !== 'undefined');
  }

  function noop() { }

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  /**
   * @constructor
   * @param {Function} fn
   */
  function Promise(fn) {
    if (!(this instanceof Promise))
      throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    /** @type {!number} */
    this._state = 0;
    /** @type {!boolean} */
    this._handled = false;
    /** @type {Promise|undefined} */
    this._value = undefined;
    /** @type {!Array<!Function>} */
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self)
        throw new TypeError('A promise cannot be resolved with itself.');
      if (
        newValue &&
        (typeof newValue === 'object' || typeof newValue === 'function')
      ) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function () {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  /**
   * @constructor
   */
  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(
        function (value) {
          if (done) return;
          done = true;
          resolve(self, value);
        },
        function (reason) {
          if (done) return;
          done = true;
          reject(self, reason);
        }
      );
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    // @ts-ignore
    var prom = new this.constructor(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.prototype['finally'] = finallyConstructor;

  Promise.all = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray(arr)) {
        return reject(new TypeError('Promise.all accepts an array'));
      }

      var args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(
                val,
                function (val) {
                  res(i, val);
                },
                reject
              );
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.allSettled = allSettled;

  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray(arr)) {
        return reject(new TypeError('Promise.race accepts an array'));
      }

      for (var i = 0, len = arr.length; i < len; i++) {
        Promise.resolve(arr[i]).then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn =
    // @ts-ignore
    (typeof setImmediate === 'function' &&
      function (fn) {
        // @ts-ignore
        setImmediate(fn);
      }) ||
    function (fn) {
      setTimeoutFunc(fn, 0);
    };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  return Promise;
}