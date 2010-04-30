/**
 * Inspired by http://github.com/willconant/flow-js, http://github.com/creationix/experiments/blob/master/step.js
 *
 */

(function() {
    var Fuze = function() {};
    var slice = Array.prototype.slice;

    Fuze.prototype = {
        eos: function(err) {
            if (err) throw err;
            this.apply(this, slice.call(arguments, 1));
        },

        defEos: function(fn) {
            this.eos = fn;
        },

        chain: function() {
            var chains = slice.call(arguments);
            var fuze = this;
            function next() {
                if (chains.length <= 0) {
                    return;
                }
                var fn = chains.shift();
                fn.apply(next, arguments);
            }

            next.eos = function() {
                fuze.eos.apply(next, arguments);
            }
            return function() {
                next.apply(next, arguments);
            }
        },

        times: function(time, fn, callback) {
            // @todo async/sync
            return function () {
                var args = slice.call(arguments);
                var share = {
                    counter: 0,
                    callback: function() {
                        share.counter += 1;
                        callback.apply(share, arguments)
                    }
                };
                for (var i=0; i < time; i++ ) {
                    share.idx = i;
                    fn.apply(share, args);
                }
            }
        }
    }
    if (module !== undefined && "exports" in module) {
        module.exports = Fuze;
    }
})();