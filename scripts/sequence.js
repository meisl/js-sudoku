define(["./fn"], function(fn) {

	function Sequence(iterable) {
	    this[Symbol.iterator] = () => iterable[Symbol.iterator]();
        this.inner = iterable;
	}

	const singletonSeq = elem => new Sequence([elem]);

		             
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
		get values() { return this[Symbol.iterator]() },
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
        	if (typeof f !== "function") {
        		throw "invalid mapping function: " + f;
        	}
        	const inner = this;
			let a = Object.create(inner, {
				inner:    { value: inner },
				[Symbol.iterator]: {
					value: function* () {
						let innerIt = inner[Symbol.iterator]();
						let e = innerIt.next();
						while (!e.done) {
							yield* f(e.value);
							e = innerIt.next();
						};
						/*
						for (let x of inner) {
							yield* f(x);
						}
						*/
					}
				}
			});
			/*
			let b = makeTransformedSeq(this, f, 
				(origNext, g) => {
					let e;
					let subIt;
					let subE = { done: true };
					const next = () => {
						while (subE.done) {
							if (!e) {
								e = origNext();
								if (e.done)
									return e;
							}
							subIt = e.value[Symbol.iterator]();
							subE = subIt.next();
						}
						????
					};
					return next;
				},
				"mapManyFn"
			);
			*/
			return a;
        },
        cons: function (elem) {
        	const inner = this;
			return Object.create(inner, {
				inner:     { value: inner },
				consedVal: { value: elem },
				[Symbol.iterator]: {
					value: function () {
						const it = inner[Symbol.iterator]();
						const origNext = it.next.bind(it);
						let first = true;
						const newNext = () => {
							if (first) {
								first = false;
								return {
									value: elem,
									done:  false
								}
							} else {
								return origNext();
							}
						};
						it.next = newNext;
						if (it.next !== newNext)
							throw "unable to overwrite .next";
						return it;
					}
				},
			});
        },
        snoc: function (elem) {
        	const inner = this;
			return Object.create(inner, {
				inner:     { value: inner },
				snocedVal: { value: elem },
				[Symbol.iterator]: {
					value: function* () {
						yield* inner[Symbol.iterator]();
						yield elem;
					}
				},
			});
        },
        
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
        },
        toString: function () {
        	function f(x) {
        		if (Array.isArray(x)) {
        			return "[" + x.map(f).join(",") + "]"
        		} else if (x instanceof Set) {
        			return "Set{" + new seq(x).toString() + "}"
        		} else {
        			let out = x.toString();
        			if (out == "[object Object]") {
        				out = "{";
        				let first = true;
						for (let prop in x) {
							if (first) {
								first = false;
							} else {
								out += ", ";
							}
							out += prop + ": " + f(x[prop]);
						}
						out += "}";
        			}
       				return out;
        		}
        	}
        	return "<" + [...this.map(f)].join(",") + ">";
        },
        get str() { return this.toString(); }
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
		},
		length: { value: 0 },
		skip:	{ value: fn.returnThis },
		take:	{ value: fn.returnThis },
		filter:	{ value: fn.returnThis },
		map:	{ value: fn.returnThis },
		mapMany:{ value: fn.returnThis },
		cons:	{ value: singletonSeq },
		snoc:	{ value: singletonSeq },
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

