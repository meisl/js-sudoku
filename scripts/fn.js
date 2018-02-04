define([], () => {



	function typeofIs(tpStr, x) { return (typeof x) === tpStr }

	const isBoolean  = function isBoolean(x)  { return typeofIs("boolean", x) }
	const isNumber   = function isNumber(x)   { return typeofIs("number", x) }
	const isString   = function isString(x)   { return typeofIs("string", x) };
	const isSymbol   = function isSymbol(x)   { return typeofIs("symbol", x) };
	const isObject   = function isObject(x)   { return typeofIs("object", x) };
	const isArray    = function isArray(x)    { return Array.isArray(x) };
	
	//function isFunction(x) { return typeofIs("function", x) };
	let isFunction = x => "function" === typeof x;

	const toStrLiteral = function (s, outerQuote) {
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

	const returnThis = function returnThis() { return this };

	const insist_nonNegativeInt = n => {
		if (!Number.isInteger(n) || n < 0) {
			throw "invalid n = " + n + " - must be non-negative integer";
        }
        return n;
	};

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

	const stringify = function stringify(v) {
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
				toString: { value: function toString() { return this.name } },
			});
			return res;
		}
	}

	function curry(f) {
		if (!(f instanceof Function)) // do NOT use isFunction here!
			throw new TypeError(stringify(f) + " is not a function");
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
			toString: { value: function toString() { return this.name } },
		});
		return res;
	}

	const id = Object.defineProperty(curry(x => x), "name", { value: "id" });

	o = { foo: curry( function (a,b,c) { return [this, a, b,  c]; } ) };
	const blah = o.foo(1)(2,3);

	const f2 = curry(function foo(a,b) { return [a, b]; });
 	const f3 = curry( (a,b,c) => [a,b,c]);

	const f = curry(_ => _ => id);
	const x = f();

	const flip = curry(f => (a, b) => f(b, a));
	const compose = curry((f, g) => x => f(g(x)));
	const same = curry((a, b) => a === b);
	const opTypeOf = x => typeof x;
	//const isTypeof = compose(flip(compose, opTypeOf), same);

	const isTypeof = curry((s, x) => same(s, opTypeOf(x)));
	isFunction = isTypeof(typeof Function);

	const module = {
		curry,
		id,

		typeofIs,
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

