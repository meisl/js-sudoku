define(["./fn"], (fn) => {
	
	const nilIt = Object.create(null, {
		[Symbol.toStringTag]: { value: "NilIt" },
		append: { value: it => it }
	});


	function* values() {
		let cont = this,
			value;
		while (true) {
			({ value, cont } = cont());
			if (cont === undefined) return;
			yield value;
		}
	}

	function makeIterable(cont) {
		cont[Symbol.iterator] = values;
		return cont;
	}

	const EOL = { cont: void 0, done: true };

	function _nil(cont) {
		//return cont ? cont() : EOL;
		return EOL;
	}
	makeIterable(_nil);
	_nil.append = c => c;	//	makeAppend(_nil); //	


	class LazyList {
		static get construct() {
			return (...args) => Reflect.construct(this, args);
		}
		constructor(destructure) {
			this.destructure = destructure;
		}
		concat(suffix) {
			if (suffix === nilObj) return this;
			/*
			const prefix = this;
			let res = new LazyList(() => {
				let e = prefix.destructure();
				if (e === EOL) {
					// prefix.concat = Nil.concat;
					// prefix.destructure = Nil.destructure;
					return suffix.destructure();
				}
				return { value: e.value, cont: e.cont.concat(suffix) };
			});
			*/
			const res = new Concat(this, suffix);
			return res;
		}
		cons(x)      { return new Cons(x, this)    }
		mapMany(f)   { return new MapMany(f, this) }
		map(f)       { return this.mapMany(x => nilObj.cons(f(x)))}
		skipUntil(p) {
			/*
			let foundOne = false;
			return this.mapMany(x => (foundOne = (foundOne || p(x)))
				? new Single(x)
				: nilObj
			);
			*/
			return new SkipUntil(p, this);
		}
		filter(p)    {
			return new Filter(p, this);
			//return this.mapMany(x => p(x) ? nilObj.cons(f(x)) : nilObj)
		}
		// filter p xs = mapMany (\x.if (p x) then (cons x nil) else nil) xs
	
		get isSingle() {
			return !this.isEmpty && this.tail.isEmpty;
		}

		get head() {
			this.isEmpty; // trigger memoization
			return this.head;
		}
		get tail() {
			this.isEmpty; // trigger memoization
			return this.tail;
		}

		get expr() {
			if (typeof this.getExpr !== "function")
				throw { msg: "fuck", thisVal: this };
			return this.getExpr();
		}

		set(props) {
			for (const key in props) {
				let v = props[key];
				if ((typeof v === "function") && (key !== "getExpr")) {
					props[key] = { get: v, configurable: true };
				} else {
					props[key] = { value: v };
				}
			}
			Object.defineProperties(this, props);
		}

		*[Symbol.iterator]() {
			let cont = this,
				value;
			while (true) {
				({ value, cont } = cont.destructure());
				if (cont === undefined) return;
				yield value;
			}			
		}
	}

	class Concat extends LazyList {
		constructor(prefix, suffix) {
			super(() => {
				let e = prefix.destructure();
				if (e === EOL) {
					// prefix.concat = Nil.concat;
					// prefix.destructure = Nil.destructure;
					return suffix.destructure();
				}
				return { value: e.value, cont: e.cont.concat(suffix) };
			});
			this.prefix = prefix;
			this.suffix = suffix;
		}
		get isEmpty() {
			const { prefix, suffix } = this;
			if (prefix.isEmpty) {
				if (suffix.isEmpty) {
					this.set({
						isEmpty: true,
						getExpr: nilObj.getExpr,
						head:    throw_head_on_empty,
						tail:    throw_tail_on_empty
					});
				} else {
					this.set({
						isEmpty: false,
						getExpr: () => suffix.getExpr(),
						head: function () {
							const head = suffix.head;
							this.set({ head });
							return head;
						},
						tail: function () {
							const tail = suffix.tail;
							this.set({ tail });
							return tail;
						}
					});
				}
			} else {
				this.set({
					isEmpty: false,
					head: function () {
						const head = prefix.head;
						this.set({ head, getExpr: Cons.getExpr });
						return head;
					},
					tail: function () {
						const tail = prefix.tail.concat(suffix);
						this.set({ tail, getExpr: Cons.getExpr });
						return tail;
					}
				});
			}
			return this.isEmpty;
		}
		getExpr() {
			return "(" + this.prefix.expr + " +++ " + this.suffix.expr + ")"
		}
	}

	class Cons extends LazyList {
		constructor(head, tail) {
			super(() => ({ value: head, cont: tail }));
			this.set({ head, tail });
			//this.head = head;
			//this.tail = tail;
		}
		/*
		// concat []     ys = ys
		// concat xs     [] = xs
		// concat (x:xs) ys = x:(concat xs ys)
		concat(suffix) {
			if (suffix === nilObj) return this;
			//const { value, cont } = this.destructure();
			//return new Cons(value, cont.tail.concat(suffix));
			return this.tail.concat(suffix).cons(this.head);
		}
		*/
		getExpr() {
			const { head, tail } = this;
			const headExpr = (head instanceof LazyList)
				? head.expr
				: head + ""
			;
			let res;
			if (tail.getExpr === nilObj.getExpr) {
				res = "[" + headExpr + "]";
			} else {
				let tailExpr = tail.getExpr();
				if ((tail.getExpr === Cons.getExpr)
					&& tailExpr.startsWith("[")
					&& tailExpr.endsWith("]")
				) {
					res = "[" + headExpr + "," + tailExpr.substr(1);
				} else {
					res = headExpr + ":(" + tailExpr + ")";
				}
			}
			return res;
		}
		get isSingle() {
			return this.tail.isEmpty;
		}
	}
	Object.defineProperties(Cons.prototype, {
		isEmpty: { value: false        }
	});
	Cons.getExpr = Cons.prototype.getExpr; // convenience


	class MapMany extends LazyList {
		constructor(f, xs) {
			super(() => {
				const e = xs.destructure();
				if (e === EOL) {
					// this.concat = Nil.concat;
					// this.destructure = Nil.destructure;
					 return EOL;
				}
				const { value, cont } = e;
				const expanded = f(value).concat(new MapMany(f, cont));
				const res = expanded.destructure();
				if (res === EOL) {
					// this.concat = Nil.concat;
					// this.destructure = Nil.destructure;
				} else {
					// this.destructure = () => res;
					// this.concat = suffix => res.concat(suffix)
				}
				return res;
			});
			this.f = f;
			this.xs = xs;
		}
	}
	Object.defineProperties(MapMany.prototype, {
		isEmpty: { enumerable: true, get: function () {
			const { f, xs } = this; // assuming we have stored the args f and xs
			let res;
			for (let xs = this.xs; !(res = xs.isEmpty); xs = xs.tail) {
				let ys = f(xs.head);
				if (!(res = ys.isEmpty)) {
					let head = ys.head;
					let tail = ys.tail.concat(xs.tail.mapMany(f));
					// memoize this.isEmpty, this.head, this.tail
					break;
				}
			}
			//this.head must throw
			//this.tail must throw
			//this.empty == true;
			//this.concat == id
			return true;
		} },
	});

	class SkipUntil extends LazyList {
		constructor(p, xs) {
			super(() => {
				while (true) {
					let e = xs.destructure();
					if (e === EOL) {
						return EOL;
					}
					if (p(e.value)) {
						//this.head = e.value;
						//this.tail = e.cont;
						//this.destructure = () => e
						//this.concat = suffix => this.concat(suffix).cons(e.value)
						return e;
					}
				}
			});
			this.p = p;
			this.xs = xs;
		}
	}

	class Filter extends LazyList {
		constructor(p, xs) {
			super(() => {
				let e = new SkipUntil(p, xs).destructure();
				if (e === EOL) {
					return EOL;
				}
				let { value, cont } = e;
				return { value: value, cont: cont.filter(p) };
			});
			this.p = p;
			this.xs = xs;
		}
		// isEmpty (filter p [])   = true
		// isEmpty (filter p x:xs) = (!(p x)) || isEmpty (filter p xs)
		get evaluated()   { return undefined }
		set evaluated(ys) {
			function updateEvaluated(zs) {
				Object.defineProperties(this, {
					evaluated: {
						get: function () {
							let ys = zs;
							while (ys.evaluated && (ys.evaluated != ys))
								ys = ys.evaluated;
							if (ys !== zs)
								this.evaluated = ys;
							return ys;
						},
						set: updateEvaluated,
						configurable: true
					},
				});
			}
			updateEvaluated.call(this, ys);
		}
		get xxxhead() {
			while (true) {
				if (this.evaluated) {
					const res = this.evaluated.head;
					Object.defineProperty(this, "head", {
						value: res
					});
					return res;
				}
				if (this.isEmpty)
					throw_head_on_empty();
			}
		}		
		get xxxtail() {
			while (true) {
				if (this.evaluated) {
					const res = this.evaluated.tail;
					Object.defineProperty(this, "tail", {
						value: res
					});
					return res;
				}
				if (this.isEmpty)
					throw_tail_on_empty();
			}
		}
		get isEmpty() {
			/*
			if (this.evaluated) {
				const res = this.evaluated.isEmpty;
				Object.defineProperty(this, "isEmpty", {
					value: res
				});
				return res;
			}
			*/
			let { p, xs } = this;
			while (true) {
				if (xs.isEmpty) {
					//this.evaluated = nilObj;
					this.set({
						isEmpty: true,
						getExpr: nilObj.getExpr,
						head:    throw_head_on_empty,
						tail:    throw_tail_on_empty
					});
					/*
					Object.defineProperties(this, {
						isEmpty: { value: true },
						head:    { get: throw_head_on_empty },
						tail:    { get: throw_tail_on_empty },
						expr:    { value: "[]" }
					});
					*/
					return true;
				}
				let x = xs.head;
				if (p(x)) {
					//this.evaluated = xs.tail.filter(p).cons(x);
					this.set({
						isEmpty: false,
						getExpr: Cons.getExpr,
						head:    x,
						tail:    function () {
							const tail = xs.tail.filter(p);
							this.set({ tail });
							return tail;
						}
					});
					/*
					Object.defineProperties(this, {
						isEmpty: { value: false },
						head:    { value: x },
						tail:    { value: xs.tail.filter(p) },
						expr:    Object.getOwnPropertyDescriptor(Cons.prototype, "expr")
						//expr:    { get: function () {
						//	return this.head + ":" + this.tail.expr;
						//} }
					});
					*/
					return false;
				}
				xs = xs.tail;			
			}
		}
		getExpr() {
			/*
			if (this.evaluated) {
				Object.defineProperty(this, "expr", {
					get: function () { return this.evaluated.expr }
				});
				return this.evaluated.expr;
			}
			*/
			let pExpr = this.p.expr;
			if (!pExpr) {
				pExpr = this.p.name || "(" + this.p.toString() + ")";
			}
			return "(filter " + pExpr + " " + this.xs.expr + ")"
		}
	}

	const emptyIteratorOut = { value: void 0, done: true };
	const iteratorDone = function iteratorDone() {
		return emptyIteratorOut;
	};
	const emptyIterator = Object.create(
		{ [Symbol.toStringTag]: "EmptyIterator" },
		{ next: { value: iteratorDone, enumerable: true }
		}
	);
	const getEmptyIterator = function getEmptyIterator() {
		return emptyIterator;
	};

	const throw_head_on_empty = function throw_head_on_empty() {
		throw new Error("no head in empty list");
	}

	const throw_tail_on_empty = function throw_tail_on_empty() {
		throw new Error("no tail in empty list");
	}

	const nilProto = Object.create(LazyList.prototype, {
		[Symbol.toStringTag]: { value: "LazyNil" },
	})
	const nilObj = Object.create(nilProto, {
		isEmpty:	 { value: true },
		head:        { get: throw_head_on_empty, enumerable: true },
		tail:        { get: throw_tail_on_empty },

		cons:        { value: x => new Cons(x, nilObj) },
		concat:      { value: fn.id },

		isSingle:	 { value: false },
		
		mapMany:     { value: fn.returnThis },
		map:         { value: fn.returnThis },
		skipUntil:   { value: fn.returnThis },
		filter:      { value: fn.returnThis },

		toString:    { value: () => "[]" },
		getExpr: { value: () => "[]" },
		[Symbol.iterator]: { value: getEmptyIterator },
		[Symbol.for("blah")]: { get: () => {
			throw new Error("asdfasdf") 
		}, enumerable: true },


		destructure: { value: () => EOL },
	});
	const success = Reflect.defineProperty(LazyList, "nil", {
		value: nilObj, enumerable: true, writable: false, configurable: false
	});






	function _cons(x, tail) {
		const out = () => ({ value: x, cont: tail });
		//out.append = c => _cons(x, tail.append(c));
		out.append = makeAppend(out);
		return makeIterable(out);
	}


	function _single(x) {
		//return c => ({ value: x, cont: c || _nil });
		/*
		function singleton (c) {
			return { value: x, cont: c || _nil };
		}
		return makeIterable(singleton);
		*/
		const out = _cons(x, _nil);
		return out;
	}

	function append(prefix, suffix) {
		if (suffix === _nil || suffix === undefined) return prefix;
		if (prefix === _nil) return suffix;
		return makeIterable(cont => prefix(append(suffix, cont)));
	}

	function cons(x, cont) {
		return append(_single(x), cont);
		//return c2 => ({ value: x, cont: append(cont, c2) })
	}

	function mapMany(f, xs) {
		return (xs === _nil)
			? _nil
			: makeIterable(c2 => {
				const { value, cont } = xs();
				const ys = append(f(value), mapMany(f, cont));
				return ys(c2);
			})
	}
	
	function _mapMany(f, xs) {
		if (xs === _nil) return _nil;
		/*
		const step = () => {
			console.log("accessing xs: " + xs);
			const e = xs();
			if (e === EOL) return EOL;
			const { value, cont } = e;
			const expanded = f(value).append(_mapMany(f, cont));
			return expanded();
		};
		const out = makeIterable(step);
		*/
		const out = makeStep(xs, _nil, (v,c) => 
			f(v).append(_mapMany(f, c))()
		);
		/*
		out.append = suffix => {
			if (suffix === _nil) return out;

			//return makeIterable(() => {
			//	const e = out();
			//	if (e === EOL) return suffix();
			//	const { value, cont } = e;
			//	return { value: value, cont: cont.append(suffix) };
			//});

			return makeStep(out, suffix,
				(v,c) => ({ value: v, cont: c.append(suffix) })
			);
		};
		*/
		out.append = makeAppend(out);
		return out;
	}

	function makeStep(inner, onEOL, onElem) {
		const out = () => {
			const e = inner();
			return (e === EOL)
				? onEOL()
				: onElem(e.value, e.cont);
		};
		return makeIterable(out);
	}

	function makeAppend(inner) {
		return suffix => {
			return (suffix === _nil)
				? inner
				: makeStep(inner, suffix,
					(v,c) => {
						return { value: v, cont: c.append(suffix) };
					}
				)
		}
	}

	function _filter(p, xs) {
		return _mapMany(x => p(x) ? _single(x) : _nil, xs);
	};

	function _map(f, xs) {
		return _mapMany(x => _single(f(x)), xs);
	};

	function filter(p, xs) {
		//return mapMany(x => p(x) ? _single(x) : _nil, xs);
		if (xs === _nil) return _nil;
		let cont = xs;
		const step = c => {
			let value;
			({value, cont} = cont());
			if (cont === undefined) {
				return _nil(c);
			}
			if (p(value))
				return { value: value, cont: cont === _nil ? _nil : step };
			//return filter(p, cont)(c); // tail-call optimization needed!
			return step(c);
		};
		return makeIterable(step);
	}

	function asIterable(it) {
		return {
			*[Symbol.iterator]() {
				let value, cont = it;
				while (cont !== _nil) {
					({ value, cont } = cont());
					yield value;
				}
			}
		}
	}

	const _singleton = x => {
		const it = singletonIt(x);
		return () => it;
	}

	const nil = Object.create(LazyList.prototype, {
		it: { value: () => nilIt, enumerable: true },
	});

	class Singleton extends LazyList {
		constructor(x) {
			const it = singletonIt(x);
			super(() => it);
		}
	}

	const singletonIt = function singletonIt(value) {
		const itOut = { value: value, cont: nilIt };
		const it = () => itOut;
		it.append = suffixIt => {
			return () => ({ value: value, cont: suffixIt });
		};
		return it;
	}


	const appendIt = function appendIt(cont, suff) {
		if (cont === nilIt) return suff;
		if (suff === nilIt) return cont;
		const step = () => {
			let value;
			({ value, cont } = cont());
			return { value: value, cont: cont === nilIt ? suff : step };
		};
		return step;
	}

	return Object.create(null, {
		nil:  { value: LazyList.nil   },
		cons: { value: Cons.construct },
		single: { value: _single },
		//asIterable: { value: asIterable },
		//append: { value: append },
		mapMany: { value: _mapMany },
		filter: { value: _filter },
		map: { value: _map },
		LazyList: { value: LazyList },
	});

});
