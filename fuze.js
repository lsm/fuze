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

        bing: function() {
            var fns = slice.call(arguments);
            fns.forEach(function(fn, idx, fns) {
                
            });   
        },

        times: function(time, fn, callback) {
            return function () {
                var args = slice.call(arguments);
                //if (callback) args.push(callback);
                for (var i=0; i < time; i++ ) {
                    fn.apply({idx: i, callback: callback}, args);
                }                
            }
        }
    }
    if (module !== undefined && "exports" in module) {
        module.exports = Fuze;
    }
})();