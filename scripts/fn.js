define([], () => {

	// make is- functions as fast as possible
	function isFunction(x) { return "function" === typeof x }
	function isBoolean(x)  { return "boolean" === typeof x }
	function isNumber(x)   { return "number" === typeof x }
	function isString(x)   { return "string" === typeof x };
	function isSymbol(x)   { return "symbol" === typeof x };
	function isObject(x)   { return "object" === typeof x };
	const isArray = Array.isArray;

	function toStrLiteral(s, outerQuote) {
		if (!isString(s))
			throw new TypeError("toStrLiteral: not a string: " + s);
		if (outerQuote === undefined)
			outerQuote = '"';
		if ((outerQuote !== undefined) && (outerQuote !== '"') && (outerQuote !== "'"))
			throw new TypeError("toStrLiteral: invalid arg outerQuote "
				+ outerQuote
			);
		let res = s
			.replace(/\\/gm, "\\\\")
			.replace(/\r/gm, "\\r")
			.replace(/\n/gm, "\\n")
			.replace(/\t/gm, "\\t")
		;
		if (outerQuote === '"') {
			res = res.replace(/\"/gm, '\\"');
		} else {
			res = res.replace(/\'/gm, "\\'");
		}
		return outerQuote + res + outerQuote;
	}

	function stringify(v) {
		if (isString(v)) {
			return toStrLiteral(v);
		} else if (isFunction(v)) {
			return (v.name !== "")
				? v.name
				: "?";
		} else if (isSymbol(v)) {
			return v.toString();
		} else if (isArray(v)) {
			return "[" + v.map(stringify).toString() + "]";
		} else {
			return "" + v;	// TODO: stringify(Object.create(null)) throws "TypeError: Cannot convert object to primitive value"
		}
	};


	function fn_toString() {
		return this.name;
	}

	function def(name, f) {
		return Object.defineProperties(f, {
			name: { value: name },
			toString: { value: fn_toString },
		});
	}

	function def_c(name, f) {
		return def(name, curry(f));
	}

	function _applyCurried(f, n, thisVal, ...boundArgs) {
		if (f.isCurried) // TODO: prove that it cannot happen
			throw "should not happen: _applyCurried on already curried " + f;
		const k = boundArgs.length;
		const m = n - k;
		if (m === 0) {
			const res = f.apply(thisVal, boundArgs);
			return (res instanceof Function) // do NOT use isFunction here!
					? curry(res)
					: res;
		} else if (m < 0) { // over-application
			const res = f.apply(thisVal, boundArgs.slice(0, n));
			return curry(res)(...boundArgs.slice(n));
		} else { // m > 0, need more args
			const res = (...moreArgs) => moreArgs.length
				? _applyCurried(f, n, thisVal, ...boundArgs, ...moreArgs)
				: _applyCurried(f, n, thisVal, ...boundArgs, void 0);
			Object.defineProperties(res, {
				length: { value: m },
				name:   { value: "curried" + m + " " + (f.name || f.toString()) },
				isCurried: { value: true },
				targetFunction: { value: f },
				toString: { value: fn_toString },
			});
			return res;
		}
	}

	function curry(f) {
		if (!(f instanceof Function)) // do NOT use isFunction here!
			throw new TypeError("curry: " + stringify(f) + " is not a function");
		if (f.isCurried) 
			return f;
		if (f.length === 0)
			throw new TypeError("cannot curry nullary or varargs function - use dummy parameter _ instead")
		const n = f.length || 1;
		const res = function (...moreArgs) {
			return moreArgs.length // bind `this` whenever first arg arrives
				? _applyCurried(f, n, this, ...moreArgs)
				: _applyCurried(f, n, this, void 0);
		};
		Object.defineProperties(res, {
			length: { value: n },
			name:   { value: "curried" + n + " " + (f.name || f.toString()) },
			isCurried: { value: true },
			targetFunction: { value: f },
			toString: { value: fn_toString },
		});
		return res;
	}

	function def_op(opName, fnName, f) {
		return def_c("(" + opName + ")", f);
	}

	const op = {
		typeof:   def_op("typeof",     null,       x => typeof x),
		isTypeof: def_op("=== typeof", null,      (t, x) => t === typeof x),
		in:       def_op("in",         null,      (k, o) => k in o),
		prop:     def_op("@",          "prop",    (k, o) => o[k]),
		same:     def_op("===",        "same",    (a, b) => a === b),
		equal:    def_op("==",         "equal",   (a, b) => a == b),
		compose:  def_op("°",          "compose", (f, g) => x => f(g(x))),
	};

	
	const returnThis = function returnThis() { return this };

	const insist_nonNegativeInt = n => {
		if (!Number.isInteger(n) || n < 0) {
			throw "invalid n = " + n + " - must be non-negative integer";
        }
        return n;
	};
	const id = def_c("id", x => x);

	o = { foo: curry( function (a,b,c) { return [this, a, b,  c]; } ) };
	const blah = o.foo(1)(2,3);

	const f2 = curry(function foo(a,b) { return [a, b]; });
 	const f3 = curry( (a,b,c) => [a,b,c]);

	const f = curry(_ => _ => id);
	const x = f();


	const getDescriptors = (f, o) => {
		const result = [];
		let depth = 0;
		while (o !== null) {
			for (const getKeys of [Object.getOwnPropertyNames, Object.getOwnPropertySymbols]) {
				for (const name of getKeys(o)) {
					const p = Object.getOwnPropertyDescriptor(o, name);
					if ((p.get === f) || (p.value === f)) {
						p.name = name;
						p.depth = depth;
						result.push(p);
					}
				}
			}
			o = Object.getPrototypeOf(o);
			depth++;
		}
		return result;
	};

	const memoize = function memoize(f) {
		if ((typeof f !== "function") || (f.length !== 0))
			throw "invalid arg - must be nullary function: " + f;
		const out = function () {
			const fResult = f.call(this);
			const ds = getDescriptors(out, this);
			if (ds.length === 0)
				throw "memoize: could not find " + out + " in " + this;
			const d = ds[0];
			if (d.get === out) {
				delete d.get;
				delete d.set;
				d.value = fResult;
				Object.defineProperty(this, d.name, d);
			} else if (d.value === out) {
				d.value = () => fResult;
				Object.defineProperty(this, d.name, d);
			}
			return fResult;
		};
		return out;
	};




	const module = {
		curry,
		def,
		def_c,
		def_op,
		op,
		id,

		//isTypeof: op.isTypeof,
		isBoolean,
		isNumber,
		isString,
		isSymbol,
		isObject,
		isArray,
		isFunction,

		toStrLiteral,

		returnThis,
		insist_nonNegativeInt,
		getDescriptors,
		memoize,

		stringify,
	};
	return module;
/*
	return Object.create(null, {
		id: { value: id },
		returnThis: { value: returnThis },
		insist_nonNegativeInt: { value: insist_nonNegativeInt },
		getDescriptors: { value: getDescriptors },
		memoize: { value: memoize },
*/
});

