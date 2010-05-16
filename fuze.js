/**
 * Inspired by http://github.com/willconant/flow-js, http://github.com/creationix/experiments/blob/master/step.js
 * @todo try/catch?
 *
 */


(function() {
    var slice = Array.prototype.slice;
    var EventEmitter = require('events').EventEmitter;
    var Fuze = function() {
        this.emitter = new EventEmitter;
    };

    Fuze.prototype = {
        onError: function(callback, clear) {
            clear && this.emitter.removeAllListeners('err');
            this.emitter.addListener('err', callback);
        },
        
        eos: function() {
            // let me know what 'next' should be
        },

        chain: function() {
            var chain = slice.call(arguments), fuze = this, step = 0, emitter = new EventEmitter;
            function next() {
                if (chain.length <= 0) {
                    return;
                }
                step++; // where we stay
                var link = chain.shift(), func, funcThis, funcArgs;
                if (typeof link == 'function') {
                    // link is a function, just call
                    func = link;
                    funcThis = next;
                    funcArgs = arguments;
                } else if (Array.isArray(link)) {
                    var args = slice.call(arguments);
                    if (typeof link[0] === 'number') {
                        // the index of the argument, which should be used as funcThis
                        funcThis = args[link.shift()];
                    }
                    if (typeof link[0] === 'string') {
                        // call function by name
                        // assume 'this' of the function is the first argument if not set yet
                        funcThis = funcThis || args[0];
                        func = funcThis && funcThis[link[0]];
                        if (typeof func !== 'function')
                            throw new Error('function not exists or it\'s not a function');
                    } else {
                        throw new Error('bad definition');
                    }

                    if (func.length !== 0 && func.length === link.length) {
                        // if you omit one argument, we assume it's the last one,
                        // where should be a callback function, which should be the next link in chain,
                        // use default error handling method provided by Fuze
                        link.push(next.eos);
                    }
                    var last = link.pop();
                    switch(last) {
                        case fuze:
                            link.push(next);
                            break;
                        case fuze.eos:
                            link.push(next.eos);
                            break;
                        default:
                            link.push(last);
                            break;
                    }
                    
                    // call it with the rest of link's elements as the function's arguments
                    funcArgs = link.slice(1);
                }
                try {
                    // call
                    func.apply(funcThis, funcArgs);
                } catch(e) {
                    // emit error
                    emit(step, e);
                }
            }
            function emit(step, e) {
                fuze.emitter.emit('err', step, e); // fuze level
                emitter.emit('err', step, e); // chain level
            }
            next.eos = function(err) {
                if (err)
                    emit(step, err);
                else
                    next.apply(next, slice.call(arguments, 1));
            }
            var rf = function() {
                next.apply(next, arguments);
            }
            rf.onError = function(callback, clear) {
                clear && emitter.removeAllListeners('err');
                emitter.addListener('err', callback);
                return rf;
            }
            return rf;
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