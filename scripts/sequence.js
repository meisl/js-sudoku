
define(function() {

	function Sequence(iterable) {
	    this[Symbol.iterator] = () => iterable[Symbol.iterator]();
        this.inner = iterable;
	}

	function makeGetIterator(inner, cb, makeTransformedNext) {
		return () => {
			let it = inner[Symbol.iterator]();
			let origNext = it.next.bind(it);
			it.next = makeTransformedNext(origNext, cb);
			return it;
		};
	}

	function makeTransformedSeq(inner, cb, makeTransformedNext, cbName) {
		return Object.create(inner, {
			inner:    { value: inner },
			[cbName]: { value: cb },
			[Symbol.iterator]: {
				value: makeGetIterator(inner, cb, makeTransformedNext)
			},
		});
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
			return makeTransformedSeq(this, cb, makeNextMap, "mapFn");
        },
        filter: function (cb) {
        	if (arguments.length == 2) {
        		cb = cb.bind(arguments[1])
        	}
			return makeTransformedSeq(this, cb, makeNextFilter, "filterFn");
        },
        cons: function (elem) {
        	const inner = this;
			return Object.create(inner, {
				inner:    { value: inner },
				[Symbol.iterator]: {
					value: function () {
						let it = inner[Symbol.iterator]();
						let origNext = it.next.bind(it);
						let index = 0;
						it.next = () => {
							if (index++ === 0) {
								return {
									value: elem,
									done:  false
								}
							} else {
								return origNext();
							}
						}
						return it;
					}
				},
			});
        },
        first: function () {
        	let e = this[Symbol.iterator]().next();
        	if (e.done)
        		throw "no first element in empty sequence";
        	return e.value;
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