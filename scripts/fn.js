define([], () => {

	const id = function id(x) { return x };

	const typeofIs   = function typeofIs(tpStr, x) { return (typeof x) === tpStr }

	const isBoolean  = function isBoolean(x)  { return typeofIs("boolean", x) }
	const isNumber   = function isNumber(x)   { return typeofIs("number", x) }
	const isString   = function isString(x)   { return typeofIs("string", x) };
	const isSymbol   = function isSymbol(x)   { return typeofIs("symbol", x) };
	const isObject   = function isObject(x)   { return typeofIs("object", x) };
	const isArray    = function isArray(x)    { return Array.isArray(x) };
	const isFunction = function isFunction(x) { return typeofIs("function", x) };

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

	const memoize = function (f) {
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

