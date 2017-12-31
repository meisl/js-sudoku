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

	function extend(...args) {
		const tpThis = (this === null) ? "null" : typeof this;
		if (tpThis !== "function")
			throw new TypeError(
				"function extend called on incompatible receiver: "
				+ tpThis);
		const thisProto = this.prototype;
		const tpThisProto = typeof thisProto;
		if (tpThisProto !== "object")
			throw new TypeError(
				"function extend called on incompatible receiver: "
				+ "has invalid .prototype " + tpThisProto);
		if (args.length === 0)
			throw "missing ctor arg (expected a function)";
		const [ctor, proto] = args;
		const tpCtor = (ctor === null) ? "null" : typeof ctor;
		if (tpCtor !== "function")
			throw "invalid ctor arg; expected a function but got " + tpCtor;
		if (thisProto === null) {
			if (this.super !== undefined)
				throw new TypeError(
					"function extend called on incompatible receiver: "
					+ ".super should be undefined but is " + this.super);
		} else {
			if (!thisProto.hasOwnProperty("constructor")) {
				thisProto.constructor = this;
			}
			if (thisProto.constructor !== this) {
				throw new TypeError(
					"function extend called on incompatible receiver: "
					+ ".prototype.constructor should be this "
					+ "but is " + thisProto.constructor);
			}
			const thisSuper = Object.getPrototypeOf(thisProto).constructor;
			if (!this.hasOwnProperty("super")) {
				this.super = thisSuper;
			}
			if (this.super !== thisSuper) {
				throw new TypeError(
					"function extend called on incompatible receiver"
					+ ": .super should be .prototype.__proto__.constructor"
					+ " but is " + thisSuper);
			}
			if (thisProto.super === undefined) {
				Reflect.defineProperty(thisProto, "super", {
					get: function () {
						const proto = Object.getPrototypeOf(this.constructor.prototype);
						return (proto === null)
							? undefined
							: proto.constructor;
					}
				});
			}
		}
		let result = ctor;
		result.prototype = Object.create(thisProto, {
			constructor: { value: result }
		});
		let tag;
		if (ctor.name) {
			tag = ctor.name;
		} else if (thisProto !== null) {
			tag = thisProto[Symbol.toStringTag];
			if (tag)
				tag = "Sub-" + tag;
		} else if (this.name) {
			tag = "Sub-" + this.name;
		}
		if (tag) {
			Reflect.defineProperty(result.prototype, Symbol.toStringTag, {
				value: tag
			});
		}
		if (proto !== undefined) {
			for (let key of Reflect.ownKeys(proto)) {
				if (key === "constructor")
					throw "invalid prop 'constructor' on proto template";
				const desc = Reflect.getOwnPropertyDescriptor(proto, key);
				Reflect.defineProperty(ctor.prototype, key, desc);
			}
		}
		result.extend = this.extend;
		result.super = this;
		return result;
	}

	return Object.create(null, {
		id: { value: id },
		returnThis: { value: returnThis },
		insist_nonNegativeInt: { value: insist_nonNegativeInt },
		getDescriptors: { value: getDescriptors },
		memoize: { value: memoize },
		extend: { value: extend }
	});
});

