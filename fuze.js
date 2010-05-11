/**
 * Inspired by http://github.com/willconant/flow-js, http://github.com/creationix/experiments/blob/master/step.js
 *
 */


(function() {
    var Fuze = function() {
        this.emitter = new EventEmitter;
    };
    var slice = Array.prototype.slice;
    var EventEmitter = require('events').EventEmitter;

    Fuze.prototype = {
        eos: function(err) {
            if (err) 
                this.emit('err', err)
            else
                this.apply(this, slice.call(arguments, 1));
        },

        defEos: function(fn) {
            this.eos = fn;
        },

        onError: function(callback) {
            this.emitter.addListener('err', callback);
        },

        chain2: function() {
            var chain = slice.call(arguments);
            var fuze = this;
            var step = 0;
            function next() {
                if (chain.length <= 0) {
                    return;
                }
                step++; // where we stay
                var link = chain.shift();
                if (typeof link == 'function') {
                    // link is a function, just call
                    link.apply(next, arguments);
                } else if (link instanceof Array) {
                    var args = slice.call(arguments), funcThis;
                    if (typeof link[0] === 'number') {
                        // the index of the argument, which should be used as funcThis
                        funcThis = args[link.shift()];
                    }
                    if (typeof link[0] === 'string') {
                        // call function by name
                        // assume 'this' of the function is the first argument if not set yet
                        funcThis = funcThis || args[0];
                        var func = funcThis[link[0]];
                        if (typeof func !== 'function')
                            throw new Error('function not exists or it\'s not a function');
                    } else {
                        throw new Error('bad definition');
                    }

                    if (func.length === link.length) {
                        // if you omit one argument, we assume it's the last one,
                        // where should be a callback function, which should be the next link in chain,
                        // use default error handling method provided by Fuze
                        link.push(next.eos);
                    }
                    if (func.length == link.length - 1) {
                        // we have all we need to feed the function,
                        // call it with the rest of link's elements as the function's arguments
                        try {
                            func.apply(funcThis, link.slice(1));
                        } catch(e) {
                            // emit error
                            fuze.emitter.emit('err', step, e);
                        }
                    } else {
                        throw new Error('Number of arguments not match your function definition, wrap your code if you want to use dynamic argument list');
                    }

                }
            }
            next.emit = fuze.emitter.emit;// @todo any better way?
            next.eos = function() {
                fuze.eos.apply(next, arguments);
            }
            return function() {
                next.apply(next, arguments);
            }
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