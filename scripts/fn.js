define([], () => {

	const id = function id(x) { return x };
	
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

	return Object.create(null, {
		id: { value: id },
		returnThis: { value: returnThis },
		insist_nonNegativeInt: { value: insist_nonNegativeInt },
		getDescriptors: { value: getDescriptors },
		memoize: { value: memoize }
	});
});

