define(["./fn"], (fn) => {

	const { isString, isObject, isFunction, stringify } = fn;

	function isDatatype(x) {
		return x instanceof Datatype;
	}

	function isDatactor(x) {
		if (isObject(x) && (x !== null)) {
			const dt = x.datatype;
			const n = x.length;
			return isDatatype(dt)
				&& (n === 0)
				&& (dt[x.name] === x)
			;
		} else if (isFunction(x)) {
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
		return isObject(x) && (x !== null) && isDatactor(x.datactor);
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
							+ (isDatavalue(arg) && (arg.datactor.length > 0)
								? "(" + arg.toString() + ")"
								: stringify(arg)
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
						ctor.checkArgs(args);
						let res = Object.create(prototype);
						Object.assign(res, args);
						/*
						argNames.forEach((prop, i) => {
							//res[prop] = args[i]
							res[i] = arg[i];
						});
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
					ctor.checkArgs = function checkArgs(args) {
						const n = this.length;
						this.parameters.forEach((argName, i) => {
							const arg = args[i];
							const test = ctorDef[argName];
							if (!test(arg)) {
								const tag = this.prototype[Symbol.toStringTag];
								throw new TypeError(
									tag + " invalid " + argName
									+ ": !(" + stringify(test) 
									+ " " + stringify(arg) + ")"
								);
							}
						});
					};					
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


	function isList(v) {
		return isDatavalue(v) && (v.datatype === List);
	}
	const List = new Datatype("List", {
		Nil: {},
		Cons: {
			head: x => true,
			tail: isList
		}
	});
	function _List_length (xs, acc) {
		return (xs.datactor === List.Nil)
			? acc
			: _List_length(xs.tail, acc + 1);	// tail-recursive
	}
	List.length = function (xs) {
		if (!isList(xs))
			throw new TypeError("List.length: not a list: " + xs);
		return _List_length(xs, 0);
	}
/*
	const SimplePattern = new Datatype("Pattern", {
		Any:   {},
		Const: { value: v => !Number.isNaN(v) },
		Var:   { name: name => isString(name) && (name !== "") },
		Data:  {
			ctor: Datatype.isDatactor,
			args: function (args) {
				return isList(args); //&& (List.length(args) === this.ctor.length);
			}
		},
	});
	SimplePattern.match = function (pat, env, val) { // returns a Maybe Env
		switch (pat.datactor) {
			case SimplePattern.Any:
				return Maybe.Some(env);
				break;
			case SimplePattern.Const:
				return (val === pat.value)
					? Maybe.Some(env)
					: Maybe.None;
				break;
			case SimplePattern.Var:
				const name = pat.name;
				const lookedup = Env.lookup(name, env);
				switch (lookedup.datactor) {
					case Maybe.None:
						return SimplePattern.match(
							pat,
							Env.extend(name, lookedup, env),
							val
						);
						break;
					case Maybe.Some:
						return SimplePattern.match(
							SimplePattern.Const(lookedup.value),
							env,
							val
						);
						break;
			}
			throw new TypeError("SimplePattern.match(Var): "
				+ "not a Maybe: " + lookedup
			);
		}
		throw new TypeError("SimplePattern.match: "
			+ "not a SimplePattern: " + pat
		);
	};

*/



/* todo
	// type Cont a c = a -> Env -> c


	// type Pattern a c = (Cont a c) -> c -> a -> Env -> c
	//                  = (Cont a c) -> c -> (Cont a c)

	const patChain = (p, q) => cT => cF => (x, e) => p(cT)(q(cT))

	// patChoice = (Pattern a c) -> (Pattern a c) -> (Pattern a c)
	patChoice = (p, q) => (cT, cF) =>
		p(cT, q(cT, cF))
	;

	// type Clause a c = (Pattern a c) -> a -> c

	// mkClause :: (Pattern a c) -> (Cont a c) -> (Clause a c)
	// \p cT.\pElse x.(p cT (\x e.)) x
*/


	// type Cont a c = a -> Env -> c
	// type Pattern a c = (Cont a c) -> (Cont a c) -> (Cont a c)

	// patAny :: Pattern a c
	const patAny = (cT, cF) => (x, e) => {
		console.log(stringify(x) + " ~> TRUE");
		return cT(x, e);
	};
	patAny.toString = () => "_";

	// patConst :: a -> Pattern a c
	const patConst = v => {
		const res = (cT, cF) => (x, e) => {
			console.log(stringify(x) + "=?=" + stringify(v));
			return (x === v) ? cT(x, e) : cF(x, e)
		};
		res.toString = () => stringify(v);
		return res;
	};

	const emptyEnv = {};

	// patVar :: Str -> Pattern a c
	const patVar = name => {
		const res = (cT, cF) => (x, e) => {
			console.log("var " + name + " ~? " + stringify(x)
				+ "; e: " + QUnit.dump.parse(e)
			);
			const v = e[name];
			if (v !== undefined) {
				return (x === v) ? cT(x, e) : cF(x, e);
			}
			const newEnv = Object.create(e, { [name]: { value: x, enumerable: true }});
			return cT(x, newEnv);
		};
		res.toString = () => name;
		return res;
	};

	// patProp :: Key -> (Pattern b c) -> (Pattern a c)
	const patProp = (key, p) => {
		const res = (cT, cF) => (x, e) => 
			p((_, e2) => cT(x, e2), () => cF(x, e))(x[key], e)
		;
		res.toString = p.toString;
		return res;
	};
	
	// patChain :: (Pattern a c) -> (Pattern a c) -> (Pattern a c)
	//const patChain = (p, q) => (cT, cF) => p(q(cT, cF), cF)
	const patChain = (p, q) => {
		const res = (cT, cF) => (x, e) => {
			const onFail = () => cF(x, e);
			return p(q(cT, onFail), onFail)(x, e);
		};
		res.toString = () => p.toString() + " " + q.toString();
		return res;
	};

	// patData :: DataCtor -> [Pattern b c] -> (Pattern a c)
	const patData = (ctor, ...argPatterns) => {
		const n = ctor.length;
		if (argPatterns.length !== n)
			throw "wrong arity " + n + " !== " + argPatterns.length;
		const patCtor = patProp("datactor", patConst(ctor))
		if (n === 0) {
			patCtor.toString = () => ctor.name;
			return patCtor;
		}
		let res;
		/*
		let res = argPatterns.reduce(
			(acc, pat, i) => patChain(acc, patProp(i, pat)),
			patCtor
		);
		*/
		let i = n - 1;
		let pat = argPatterns[i];
		let chained = patProp(i, pat);
		let str = " " + pat.toString() + ")";
		while (i > 0) {
			i--;
			const pat = argPatterns[i];
			str = " " + pat.toString() + str;
			chained = patChain(patProp(i, pat), chained);
		}
		chained = patChain(patCtor, chained);
		//str = "(" + ctor.name + str;
		const inner_toString = chained.toString;
		res = chained;
		//res = (cT, cF) => (x, e) => chained(cT, (x2, _) => cF(x, e))(x, e);
		
		res.toString = () => "(" + inner_toString() + ")";
		return res;
	};

	// patChoice = (Pattern a c) -> (Pattern a c) -> (Pattern a c)
	// Note: this is different from pushClause, as it deals only with
	//       Patterns, NO right-hand-sides.
	const patChoice = (p, q) => (cT, cF) => (x, e) =>
		p(cT, () => q(cT, cF)(x, e))(x, e)
	;

	// catchAll :: a -> c
	const catchAll = x => {
		throw "inexhaustive patterns: " + stringify(x)
	};


	// pushClause :: (Pattern a c) -> (Env -> c) -> (a -> c) -> (a -> c)
	const pushClause = (pat, rhs, onFail) => x =>
		pat(
			(_, e) => rhs(e),
			(_, _e) => onFail(x)
		)(x, emptyEnv);
	/*
	const pushClause = (pat, rhs, subsequentClauses) =>
		(x, e) => pat(
			(x2, e2) => rhs(e2), 
			(_x, _e) => subsequentClauses(x, e)
		)(x, e);
	*/
	/*
	const pushClause = (pat, rhs, subsequentClauses) =>
		(x, e) => pat(
			(x2, e2) => () => rhs(e2), 
			() => subsequentClauses(x, e)
		)(x, e);
	*/

	const pNil = patData(List.Nil);
	const pSingle = patData(List.Cons, patVar("x"), pNil);
	const pMore = patData(List.Cons, patVar("x"), patVar("xs"));
	const pComplicated = patData(List.Cons,
		pSingle, pNil
	);

	const clauses = [
		[pSingle, e => "matched " + pSingle + ": " + QUnit.dump.parse(e)],
		[pMore,   e => "matched " + pMore + ": " + QUnit.dump.parse(e)],
	].reduceRight(
		(acc, clause) => pushClause(...clause, acc),
		catchAll
	);

	const match = v => {
		let res = clauses(v, emptyEnv);
		console.log(res);
		return res;
	};

	match(List.Cons(4, List.Cons(5, List.Nil)));
	match(List.Cons(5, List.Nil));
	//match(List.Nil);

	Datatype.pattern = {
		patAny,
		patConst: c => {
			if (isDatavalue(c) || isDatactor(c))
				throw "invalid const pattern - use patData(..) instead";
			return patConst(c);
		},
		patVar,
		patData: (ctor, ...argPatterns) => {
			if (!isDatactor(ctor))
				throw new TypeError("not a datactor: " + stringify(ctor));
			return patData(ctor, ...argPatterns);
		},
		catchAll,
		pushClause,
	};

	return Datatype;
});