
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
        filter: function (cb) {
        	if (arguments.length == 2) {
        		cb = cb.bind(arguments[1])
        	}
			return makeTransformedSeq(this, cb, makeNextFilter, "filterFn");
        },
        map: function (cb) {
        	if (arguments.length == 2) {
        		cb = cb.bind(arguments[1])
        	}
			return makeTransformedSeq(this, cb, makeNextMap, "mapFn");
        },
        mapMany: function (f) {
        	const inner = this;
			return Object.create(inner, {
				inner:    { value: inner },
				[Symbol.iterator]: {
					value: function* () {
						let it = inner[Symbol.iterator]();
						let e = it.next();
						while (!e.done) {
							yield* f(e.value);
							e = it.next();
						};
					}
				}
			});
        },
        cons: function (elem) {
        	const inner = this;
			return Object.create(inner, {
				inner:    { value: inner },
				[Symbol.iterator]: {
					value: function () {
						const it = inner[Symbol.iterator]();
						const origNext = it.next.bind(it);
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
        // function f(cb, n, s) { const k = s.size; s.filter( (e,i) => i < k-n).forEach( (e,i) => cb(e, s.skip(i+1))) }
        skip: function (n) {
        	if (!Number.isInteger(n) || n < 0) {
        		throw "invalid n = " + n + " - must be non-negative integer";
        	} else if (n === 0) {
        		return this;
        	}
        	const inner = this;
			return Object.create(inner, {
				inner:    { value: inner },
				[Symbol.iterator]: {
					value: function () {
						const it = inner[Symbol.iterator]();
						const origNext = it.next.bind(it);
						let index = 0;
						it.next = () => {
							let e;
							do {
								e = origNext();
							} while (!e.done && (index++ < n));
							return e;
						}
						return it;
					}
				},
			});
        },
        take: function (n) {
        	if (!Number.isInteger(n) || n < 0) {
        		throw "invalid n = " + n + " - must be non-negative integer";
        	} else if (n === 0) {
        		return emptySequence;
        	}
        	const inner = this;
			return Object.create(inner, {
				inner:    { value: inner },
				[Symbol.iterator]: {
					value: function () {
						const it = inner[Symbol.iterator]();
						const origNext = it.next.bind(it);
						let index = 0;
						it.next = () => {
							let e = origNext();
							if ((index < n) && !e.done) {
								index++;
								return e;
							}
							return emptyGeneratorResult;
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

	const emptyGeneratorResult = Object.defineProperties({}, {
		value: { value: undefined,
				 enumerable: true
		},
		done: { value: true,
				enumerable: true
		}
	});
	const emptyGenerator = Object.defineProperties({}, {
		next: {
			value: () => emptyGeneratorResult,
			enumerable: true
		}
	});
	const emptySequence = Object.create(Sequence.prototype, {
		[Symbol.iterator]: {
			value: () => emptyGenerator
		}
	});
	Object.defineProperty(Sequence, "empty", {
		value: emptySequence,
		enumerable: true
	});

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