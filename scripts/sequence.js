
define(function() {

	function Sequence(iterable) {
	    this[Symbol.iterator] = () => iterable[Symbol.iterator]();
        this.inner = iterable;
	}

	Sequence.prototype = {
		get values() { return [...this] },
        get length() {
            return [...this].length;
        },
        get size() {
            return this.length;
        },
        map: function (cb) {
        	if (arguments.length == 2) {
        		cb = cb.bind(arguments[1])
        	}
			return Object.create(this, {
				inner: { value: this },
				mapFn: { value: cb },
				[Symbol.iterator]: {
					value: function () {
						let it = this.inner[Symbol.iterator]();
						let origNext = it.next.bind(it);
						it.next = makeNextMap(origNext, cb);
						return it;		
					}
				},
			});
        },
        filter: function (cb) {
        	if (arguments.length == 2) {
        		cb = cb.bind(arguments[1])
        	}
			return Object.create(this, {
				inner:    { value: this },
				filterFn: { value: cb },
				[Symbol.iterator]: {
					value: function () {
						let it = this.inner[Symbol.iterator]();
						let origNext = it.next.bind(it);
						let i = 0;
						it.next = function () {
							let e;
							do {
								e = origNext();
							} while (!e.done && !cb(e.value, i++));
							return e;
						}
						it.next = makeNextFilter(origNext, cb);
						return it;
					}
				},
			});
        },
        forEach: function (cb, thisValue) {
            let it = this[Symbol.iterator]();
            let e = it.next();
            for (let i = 0; !e.done; e = it.next()) {
                cb.call(thisValue, e.value, i++);
            }
        }
	};

	function makeNextMap(origNext, cb) {
		let i = 0;
		return () => {
			let e = origNext();
			if (!e.done) {
				e.value = cb(e.value, i++);
			}
			return e;
		};
	}

	function makeNextFilter(origNext, cb) {
		let i = 0;
		return () => {
			let e;
			do {
				e = origNext();
			} while (!e.done && !cb(e.value, i++));
			return e;
		};
	}


	return Sequence;
});