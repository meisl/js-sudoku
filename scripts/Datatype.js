define(["./fn"], (fn) => { with (fn) {

	function isDatatype(x) {
		return x instanceof Datatype;
	}

	function isDatactor(x) {
		if (fn.isObject(x) && (x !== null)) {
			const dt = x.datatype;
			const n = x.length;
			return isDatatype(dt)
				&& (n === 0)
				&& (dt[x.name] === x)
			;
		} else if (fn.isFunction(x)) {
			const dt = x.datatype;
			const n = x.length;
			return isDatatype(dt)
				&& Number.isInteger(n) && (n > 0)
				&& (dt[x.name] === x)
			;
		}
		return false;
	}

	function isDatavalue(x) {
		return fn.isObject(x) && (x !== null) && isDatactor(x.datactor);
	}

	class Datatype {
		constructor(name, ctorsDef) {
			if (!isString(name) || (name === ""))
				throw new TypeError("Datatype: invalid name " + name);
			if (!isObject(ctorsDef))
				throw new TypeError("Datatype: invalid data ctors def " + ctorsDef);
			const ctorNames = Object.getOwnPropertyNames(ctorsDef);
			if (ctorNames.length === 0)
				throw new TypeError("Datatype: invalid data ctors def " + ctorsDef);
			const datatype = this;
			const ctors = [];
			const valuePrototype = Object.create({}, {
				datatype: { value: datatype },
				[Symbol.toStringTag]: {
					value: name
				},
				forEachArg: { value: function (cb) {
					const n = this.datactor.length;
					for (let i = 0; i < n; i++)
						cb(this[i], i);
				} },
				toString: { value: function () {
					let res = this.datactor.name;
					this.forEachArg(arg => {
						res += " "
							+ (fn.isString(arg)
								? fn.toStrLiteral(arg)
								: (isDatavalue(arg) && (arg.datactor.length > 0)
									? "(" + arg.toString() + ")"
									: "" + arg
								)
							);
					});
					return res;
				} },
			});

			for (const ctorName of ctorNames) {
				const ctorDef = ctorsDef[ctorName];
				const ctorTag = name + "." + ctorName;
				let ctor;
				if (!isObject(ctorDef)) {
					throw "invalid data ctor def " + ctorName + ": " + ctorDef
				}
				let argNames = Object.getOwnPropertyNames(ctorDef);
				if (argNames.length === 0) {
					let singletonProto = Object.create(valuePrototype);
					ctor = Object.create(singletonProto);
					Object.defineProperties(singletonProto, {
						name:                 { value: ctorName },
						parameters:           { value: argNames },
						length:               { value: 0 },
						prototype:            { value: singletonProto },
						datactor:             { value: ctor },
						[Symbol.toStringTag]: { value: ctorTag },
						toString: { value: function () {
							//return this[Symbol.toStringTag];
							return this.name;
						} },
					});
					
				} else {
					let prototype;
					ctor = function (...args) {
						let res = new.target 
							? this
							: Object.create(prototype);
						Object.assign(res, args);
						/*
						argNames.forEach((prop, i) => 
							//res[prop] = args[i]
							res[i] = args[i]
						);
						*/
						//res = Object.freeze(res);
						return res;
					};
					prototype = Object.create(valuePrototype, {
						datactor: { value: ctor },
						[Symbol.toStringTag]: {
							value: ctorTag
						},
						
					});
					const idxAccessors = argNames
						.map((n,i) => function () { return this[n]; })
						.map((f,i) => ({ get: f }))
						.reduce(
							(acc, getter, i) => { acc[i] = getter; return acc; }, 
							{}
						);
					const dtors = argNames
						.map((n,i) => {
							const desc = name + "." + n;
							const dtor = function (v) {
								if (!isObject(v))
									throw new TypeError(desc + ": not a "
										+ datatype.name + " value: " + v);
								if (v.datactor === ctor) {
									return v[i];
								}
								if (v.datatype !== datatype) {
									throw new TypeError(desc + ": not a "
										+ datatype.name + " value: " + v);
								} else {
									throw new TypeError(desc + " on " + v);
								}
							};
							Object.defineProperties(dtor, {
								name:     { value: n },
								datactor: { ctor },
								toString: { value: () => n + "(o" + ctorName + ")" },
							});
							return dtor;
						})
						.reduce((acc, f) => {
							acc[f.name] = f;
							return acc;
						}, {});
					;
					
					const nameAccessors = argNames
						.map((n,i) => ({
							name: n,
							get: function () { return this[i]; }
						}))
						.reduce(
							(acc, o) => {
								acc[o.name] = { get: o.get };
								return acc;
							}, 
							{}
						)
					;

					//Object.defineProperties(prototype, idxAccessors);
					Object.defineProperties(prototype, nameAccessors);
					
					Object.defineProperties(ctor, {
						name:       { value: ctorName },
						parameters: { value: argNames },
						prototype:  { value: prototype },
						dtors:      { value: dtors },

						datatype:   { value: datatype },
						length:     { value: argNames.length },
						toString:   { value: function () {
							return this.prototype[Symbol.toStringTag]
								+ "(" + this.parameters + "){...}"
							;
						} },
					});
				}
				ctors.push(ctor);
				Object.defineProperties(valuePrototype, {
					["is" + ctorName]: { get: function () {
						return this.datactor === ctor;
					} },
				});
				Object.defineProperty(this, ctorName, {
					value: ctor,
					enumerable: true
				});
			} // end traverse ctorNames

			Object.defineProperties(this, {
				// make name a getter so it doesn't show up in debugger's' str repr
				name:  { get: () => name },
				ctors: { value: ctors }
			});
		} // end Datatype.constructor

	}

	Object.defineProperties(Datatype, {
		isDatatype:  { value: isDatatype },
		isDatactor:  { value: isDatactor },
		isDatavalue: { value: isDatavalue },
	});


	const Pattern = new Datatype("Pattern", {
		Any:   {},
		Var:   { name: name => isString(name) && (name !== "") },
		Const: { value: v => !Number.isNaN(v) },
		Data:  { ctor: Datatype.isDatactor },
		App:   {
			fun: fun => Pattern.hasValue(fun),
			arg: arg => Pattern.hasValue(arg)
		},
		
	});
	let v = Pattern.Var("x");
	switch (v.datactor) {
		case Pattern.Any: console.log("Any");
			break;
		case Pattern.Var: console.log("Var " + v.name);
			break;
		case Pattern.Const: console.log("Const " + v.value);
			break;
	}
	//let x = X.App(X.Any, X.Const(42));

	return Datatype;
} /* end with(fn) */ });