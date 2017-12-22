define(["./fn"], (fn) => {

	const fromGeneratorFn = f =>
		Object.create(Sequence.prototype, {
			[Symbol.iterator]: { value: f }
		});

	function Sequence(iterable) {
		this[Symbol.iterator] = () => iterable[Symbol.iterator]();
		this.inner = iterable;
	}

	Sequence.prototype = {
		[Symbol.toStringTag]: "Sequence",
		get values() { return this[Symbol.iterator]() },
		get length() {
			return [...this].length;
		},
		get size() {
			return this.length;
		},
		head: function () {
			for (let x of this)
				return x;
			throw ".head(): no first element in empty sequence";
		},
		/*
		get tail() { // cannot implement this in a consistent way
			// for sequences that are views of mutable things like array, set
			// Reason: .tail should fail early on an empty sequence, but
			// the underlying mutable thing might *become* empty only later
		},
		*/
		filter: function (cb) {
			if (arguments.length == 2)
				cb = cb.bind(arguments[1]);
			const inner = this;
			return fromGeneratorFn(function* () {
				let i = 0;
				for (let x of inner)
					if (cb(x, i++)) yield x;
			});
		},
		map: function (cb) {
			if (arguments.length == 2)
				cb = cb.bind(arguments[1]);
			const inner = this;
			return fromGeneratorFn(function* () {
				let i = 0;
				for (let x of inner)
					yield cb(x, i++);
			});
		},
		mapMany: function (f) {
			if (typeof f !== "function")
				throw "invalid mapping function: " + f;
			const inner = this;
			return fromGeneratorFn(function* () {
				for (let x of inner)
					yield* f(x);
			});
		},
		cons: function (elem) {
			const inner = this;
			return fromGeneratorFn(function* () {
				yield elem;
				yield* inner;
			});
		},
		snoc: function (elem) {
			const inner = this;
			return fromGeneratorFn(function* () {
				yield* inner;
				yield elem;
			});
		},
		skip: function (n) {
			if (fn.insist_nonNegativeInt(n) === 0)
				return this;
			return this.filter((_, i) => i >= n);
		},
		take: function (n) {
			if (fn.insist_nonNegativeInt(n) === 0) {
				return emptySequence;
			}
			return this.filter((_, i) => i < n);
		},
		append: function (suffix) {
			const prefix = this;
			console.log(this + ".append(..)")
			return (suffix === emptySequence)
				? prefix
				: fromGeneratorFn(function* () {
					yield* prefix;
					yield* suffix;
				});
		},
		forEach: function (cb, thisValue) {
			let i = 0;
			for (let x of this)
				cb.call(thisValue, x, i++);
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
		get str() { return this.toString(); },
	};

	function SingletonSequence() {
	}
	SingletonSequence.prototype = Object.create(Sequence.prototype, {
		[Symbol.iterator]: {
			value: function* () { yield this.head() }
		},
		[Symbol.toStringTag]: {
			value: "SingletonSequence"
		},
		length: { value: 1 },
		skip:	{ value: function (n) {
			return (fn.insist_nonNegativeInt(n) === 0)
				? this
				: emptySequence;
		} },
		take:	{ value: function (n) {
			return (fn.insist_nonNegativeInt(n) === 0)
				? emptySequence
				: this;
		} },
		append:	{ value: function (s) {
			return (s === emptySequence)
				? this
				: s.cons(this.head());
		} },
	});

	const singletonSeq = elem => Object.create(SingletonSequence.prototype, {
		head:   { value: () => elem }
	});

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
		[Symbol.toStringTag]: {
			//get: function () { return "EmptySequence"; }
			value: "EmptySequence"
		},
		length: { value: 0 },
		skip:	{ value: function (n) { fn.insist_nonNegativeInt(n); return this } },
		take:	{ value: function (n) { fn.insist_nonNegativeInt(n); return this } },
		filter:	{ value: fn.returnThis },
		map:	{ value: fn.returnThis },
		mapMany:{ value: fn.returnThis },
		append: { value: fn.id },
		cons:	{ value: singletonSeq },
		snoc:	{ value: singletonSeq },
	});

	const single_emptySeq = singletonSeq(emptySequence);

	return Object.create(null, {
		empty:     { value: emptySequence },
		singleton: { value: singletonSeq },
		create:    { value: iterable => new Sequence(iterable) },
		fromGeneratorFn: { value: fromGeneratorFn },
		ctor: { value: Sequence }
	});
});

