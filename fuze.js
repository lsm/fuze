/**
 * Inspired by http://github.com/willconant/flow-js, http://github.com/creationix/experiments/blob/master/step.js
 *
 */

(function() {
    var Fuze = function() {};
    var slice = Array.prototype.slice;
    var eos = function(err) {
        if (err) throw err;
        this.apply(this, slice.call(arguments, 1));
    }

    Fuze.prototype = {
        defEos: function(fn) {
            eos = fn;
        },

        chain: function() {
            var chains = slice.call(arguments);
            function next() {
                if (chains.length <= 0) {
                    return;
                }
                var fn = chains.shift();
                fn.apply(next, arguments);
            }
            next.eos = function() {
                eos.apply(next, arguments);
            }
            return function() {
                next.apply(next, arguments);
            }
        }    
    }
    if (module !== undefined && "exports" in module) {
        module.exports = Fuze;
    }
})();