define(["./fn"], (fn) => { with (fn) {

	const fnExpr = f => {
		const fExpr = f.expr;
		if (fExpr) return "(" + f.expr + ")";
		return f.name || "(" + f.toString() + ")";
	};


	class LazyList {
		static get construct() {
			return (...args) => Reflect.construct(this, args);
		}
		static get nil() {
			Object.defineProperty(LazyList, "nil", {
				value: nilObj, enumerable: true}
			);
			return nilObj;
		}
		static toString() {
			let name = this.name;
			if (name !== "") {
				name += " ";
			}
			const proto = Object.getPrototypeOf(this);
			if (proto === Function.prototype) {
				return super.toString();
			} else {
				let s = super.toString();
				s = " " + s.substr(s.indexOf("{"));
				return "class " + name 
					+ "extends " + proto.name + s; 
			}
		}
		static derive(name, parameters, ...body) {
			function argsToProps(args) {
				const props = {};
				let i = 0;
				for (const name of parameters) {
					props[name] = args[i++];
				}
				return props;
			}
			const res = class extends this {
				constructor(...args) {
					super(argsToProps(args));
				}
			};

			Object.defineProperties(res, {
				name:   { value: name },
				length: { value: parameters.length },
			});
			return res;
		}

		static iterate(f, x) {
			// iterate f x = cons x (iterate f (f x))
			// derive("iterate", ["f", "x"], [
			//     Cons, "x", ["iterate", "f", ["f" "x"]]
			//]);
			return new LazyList({
				isEmpty: false, // because it's an App of cons
				getExpr: function () {
					return "(iterate " + fnExpr(f) + " " + x + ")";
				},
				head: function () {
					this.set({
						head: x,
						getExpr: Cons.getExpr
					});
					return x;
				},
				tail: function () {
					const res = LazyList.iterate(f, f(x));
					this.set({
						tail: res,
						getExpr: Cons.getExpr
					})
					return res;
				},
			})
		}

		static fromArgs(...args) {
			// fromArgs args = let n = length args
			//                     f = \i.if (i >= n) then nil
			//                            else (cons (nth args i) (f (i + 1)))
			//                 in (f 0)
			// or
			// fromArgs args = let n  = length args
			//                     is = take n (iterate (\i.i+1) 0)
			//                 in (map (nth args) is)
			if (args.length === 0) return LazyList.nil;
			return new LazyList({
				i: 0,
				isEmpty: false,
				head: function () {
					const res = args[this.i];
					return res;
				},
				tail: function () {

				}
			});
		}
		constructor(props) {
			//super();
			if (props) {
				this.set(props);
			}
		}
		concat(suffix) {
			const res = (suffix === nilObj)
				? this
				: new Concat(this, suffix);
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
				throw "subclass should've implemented method getExpr";
			return this.getExpr();
		}

		set(props) {
			for (const key in props) {
				let v = props[key];
				if (key === "getExpr") {
					props[key] = { value: v, configurable: true };
				} else if (typeof v === "function") {
					props[key] = { get: v, configurable: true };
				} else {
					props[key] = { value: v };
				}
			}
			Object.defineProperties(this, props);
		}

		*[Symbol.iterator]() {
			for (let xs = this; !xs.isEmpty; xs = xs.tail)
				yield xs.head;
		}
	}

	class Concat extends LazyList {
		constructor(prefix, suffix) {
			super({ prefix, suffix });
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
			super({ head, tail });
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
			//const { head, tail } = this;
			const head = this.head;
			const tail = this.tail;
			const headExpr = (head instanceof LazyList)
				? head.expr
				: head + ""
			;
			let res;
			if (tail.getExpr === nilObj.getExpr) {
				res = "[" + headExpr + "]";
			} else {
				let tailExpr = tail.getExpr();
				if (tail.getExpr === Cons.getExpr) {
					if (tailExpr.startsWith("[") && tailExpr.endsWith("]")) {
						res = "[" + headExpr + "," + tailExpr.substr(1);
					} else {
						res = headExpr + ":" + tailExpr;
					}
				} else if (tail.getExpr === Concat.prototype.getExpr) {
					res = headExpr + ":" + tailExpr;
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
			/*
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
			*/
			super();
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
			/*
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
			*/
			super();
			this.p = p;
			this.xs = xs;
		}
	}

	class Filter extends LazyList {
		constructor(p, xs) {
			/*
			super(() => {
				let e = new SkipUntil(p, xs).destructure();
				if (e === EOL) {
					return EOL;
				}
				let { value, cont } = e;
				return { value: value, cont: cont.filter(p) };
			});
			*/
			super({
				p: () => p,
				xs: xs
			});
		}
		// isEmpty (filter p [])   = true
		// isEmpty (filter p x:xs) = (!(p x)) || isEmpty (filter p xs)
		get isEmpty() {
			let { p, xs } = this;
			while (true) {
				if (xs.isEmpty) {
					this.set({
						isEmpty: true,
						getExpr: nilObj.getExpr,
						head:    throw_head_on_empty,
						tail:    throw_tail_on_empty
					});
					return true;
				}
				let x = xs.head;
				if (p(x)) {
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
					return false;
				}
				xs = xs.tail;			
			}
		}
		getExpr() {
			return "(filter " + fnExpr(this.p) + " " + this.xs.expr + ")"
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
		[Symbol.toStringTag]: { value: "nil" },
	})
	const nilObj = Object.create(nilProto, {
		isEmpty:	 { value: true },
		head:        { get: throw_head_on_empty },
		tail:        { get: throw_tail_on_empty },

		cons:        { value: x => new Cons(x, nilObj) },
		concat:      { value: fn.id },

		isSingle:	 { value: false },
		
		mapMany:     { value: fn.returnThis },
		map:         { value: fn.returnThis },
		skipUntil:   { value: fn.returnThis },
		filter:      { value: fn.returnThis },

		toString:    { value: () => "[]" },
		getExpr:     { value: () => "[]" },
		[Symbol.iterator]: { value: getEmptyIterator },
	});


	return Object.create(null, {
		nil:  { value: LazyList.nil   },
		cons: { value: Cons.construct },
		single: { value: x => new Cons(x, nilObj) },
		//mapMany: { value: _mapMany },
		//filter: { value: _filter },
		//map: { value: _map },
		LazyList: { value: LazyList },
	});

} /* end with(fn) */ });
