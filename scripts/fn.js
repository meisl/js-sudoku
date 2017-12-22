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
			for (let getKeys of [Object.getOwnPropertyNames, Object.getOwnPropertySymbols]) {
				for (let name of getKeys(o)) {
					let p = Object.getOwnPropertyDescriptor(o, name);
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

	return Object.create(null, {
		id: { value: id },
		returnThis: { value: returnThis },
		insist_nonNegativeInt: { value: insist_nonNegativeInt },
		getDescriptors: { value: getDescriptors }
	});
});

