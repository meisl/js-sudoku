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

	const err = msg => { throw msg };

	const errUnbound = name => err("unbound var " + stringify(name));

	// An Env ("environment") is a fn that takes a string and *maybe* returns
	// a value. So Env :: Str -> Maybe a, where Maybe is a data type with two
	// ctors: None | Some a.
	// Now, let's' represent the data type Maybe as a *function* f which takes
	// two other fns cNone and cSome and does the following:
	// - if f is to represent a None value: applies cNone to ()
	// - if f is to represent a Some x value: applies cSome to x
	// If we require both, cNone and cSome to have the same return type, we get
	// type Maybe_CPS a c = (() -> c) -> (a -> c) -> c
	// and
	// type Env_CPS c = Str -> Maybe_CPS Any c
	//                = Str -> (() -> c) -> (Any -> c) -> c
	const Env = {
		empty: // :: Env
			(key, cNone, cSome) => cNone(),
		return: // :: Str -> Any -> Env
			(key, val) => Env.addBinding(key, val, Env.empty),
		addBinding: // :: Str -> Any -> Env -> Env
			// addBinding k v e = (return k v) >>= \_.e
			// addBinding k v = extend (return k v)
			// addBinding k = extend ° (return k)
			// addBinding k v e = \k' cN cS.if (k' = k) then (cS v) (e k cN cS k)
			(key, val, e) => 
				(k, cNone, cSome) => k === key ? cSome(val) : e(k, cNone, cSome),
		lookup: // :: Str -> Env -> (Any -> c) -> (() -> c) -> c
			(key, e, cSome, cNone) =>
				e(key, cNone, cSome),
		extend: // :: Env -> Env -> Env
			// = \e1 e2.\k cN cS.lookup k e1 cS \_.lookup k e2 cS cN
			// = \e1 e2.\k cN cS.e1 k (\_.e2 k cN cS) cS
			(e1, e2) =>
				(k, cN, cS) => e1(k, () => e2(k, cN, cS), cS),
		bind: // :: Env -> (() -> Env) -> Env
			(e, f) => Env.extend(e, f()),
		get: // :: Env -> Str -> c ; or error if key is not bound
			// \e k.e k (\_.err "unbound '" + k + "'") \x.x
			(e, key) => Env.lookup(
				key,
				e,
				fn.id,
				() => errUnbound(key)
			),
	};

/* todo
	// type Cont a c = a -> Env -> c


	// type Pattern a c = (Cont a c) -> c -> a -> Env -> c
	//                  = (Cont a c) -> c -> (Cont a c)

	const patChain = (p, q) => cT => cF => (x, e) => p(cT)(q(cT))

	// patChoice = (Pattern a c) -> (Pattern a c) -> (Pattern a c)
	patChoice = (p, q) => (cT, cF) =>
		p(cT, q(cT, cF))
	;
*/



	// type Maybe_CPS a c = (() -> c) -> (a -> c) -> c
	// type Env_CPS c = Str -> Maybe_CPS Any c
	// type Pattern_CPS a c = a -> (Env_CPS c) -> (Maybe_CPS (Env_CPS c) c)
	// = a -> (Str -> Maybe_CPS Any c) -> (() -> c) -> (Str -> Maybe_CPS Any c -> c) -> c
	// = a -> (Str -> (() -> c) -> (Any -> c) -> c) -> (() -> c) -> (Str -> ((() -> c) -> (Any -> c) -> c) -> c) -> c


	// type Pattern a c = (Env -> c) -> (() -> c) -> Env -> a -> c

	// patAny :: Pattern a c
	// = \cT cF.\x.cT
	const patAny = (cT, cF) => (x, e) => cT(e);
	patAny.toString = () => "_";

	// patMap :: (a -> b) -> Pattern b c -> Pattern a c
	const patMap = (f, p) => {
		const res = (cT, cF) => (x, e) => p(cT, cF)(f(x), e);
		res.toString = p.isCompound
			? () => "(" + p.toString() + ")"
			: p.toString;
		return res;
	};

	// patProp :: Key -> (Pattern b c) -> (Pattern a c)
	const patProp = (key, p) => patMap(x => x[key], p);

	// patEq :: a -> Pattern a c
	// = \v cT cF x e.if (x = v) then (cT x e) else (cF x e)
	// ~ Expr.make(["v", "cT" "cF" "x", "e"], Expr.If([eq, "x", "v"], ["cT", "x", "e"], ["cT", "x", "e"]))
	const patEq = v => {
		const res = (cT, cF) => (x, e) => {
			return (x === v) ? cT(e) : cF()
		};
		res.toString = () => stringify(v);
		return res;
	};

	// patConst :: a -> Pattern a c ; a simple value (nor ctor, neither data value)
	const patConst = c => {
		if (isDatavalue(c) || isDatactor(c))
			throw "invalid const pattern - use patData(..) instead: " + stringify(c);
		return patEq(c);
	};

	// patVarIntro :: Str -> Pattern a c
	const patVarIntro = name => {
		const res = (cT, cF) => (x, e) => cT(Env.addBinding(name, x, e));
		res.toString = () => name + "!";
		return res;
	};

	// patVarLookup :: Str -> (a -> Pattern a c) -> (() -> Pattern a c) -> Pattern a c
	const patVarLookup = (name, f, cUnbound) => {
		const res = (cT, cF) => (x, e) =>
			Env.lookup(name, e, f, cUnbound)(cT, cF)(x, e);
		//const res = e => e(name, cUnbound, f)(e)
		res.toString = () => name;
		return res;
	};

	// patVar :: Str -> Pattern a c
	const patVar = name => patVarLookup(name, patEq, () => patVarIntro(name));

	// patVarGet :: Str -> (a -> Pattern a c) -> Pattern a c
	//const patVarGet = (name, f) => patVarLookup(name, patEq, () => errUnbound(name));
	const patVarGet = (name, f) => {
		const res = (cT, cF) => (x, e) =>
			patEq(Env.get(e, name))(cT, cF)(x, e);
		res.toString = () => name + "?";
		return res;
	};

	// patChain :: (Pattern a c) -> (Pattern a c) -> (Pattern a c)
	//const patChain = (p, q) => (cT, cF) => p(q(cT, cF), cF)
	const patChain = (p, q) => {
		if (p === patAny) return q;
		if (q === patAny) return p;
		const res = (cT, cF) => (x, e) => {
			return p(e2 => q(cT, cF)(x, e2), cF)(x, e);
		};
		res.toString = () => p.toString() + " " + q.toString();
		res.isCompound = true;
		return res;
	};





	// mReturn :: Pattern -> Env -> <Pattern, Env>
	// mReturn :: Pattern -> Env -> (Pattern -> Env -> c) -> c
	//const mReturn = (p, e) => [p, e];
	const mReturn = (p, e) => f => f(p, e);

	// mExtract :: <Pattern, Env> -> (Pattern -> Env -> c) -> c
	// mExtract :: ((Pattern -> Env -> c) -> c) -> (Pattern -> Env -> c) -> c
	const mExtract = (m, f) => m(f);

	// bindPatX :: Pattern -> Env -> (Env -> <Pattern, Env>) -> <Pattern, Env>
	// bindPatX :: Pattern -> Env -> (Env -> (Pattern -> Env -> c) -> c) -> (Pattern -> Env -> c) -> c
	const bindPatX = (p, e_ct) =>
		// e_ct and e_ct2 are *compile-time* envs!
		f =>
			f(e_ct)((p2, e_ct2) =>
				mReturn(patChain(p, p2), e_ct2)
			)
		;
	;
	// = \m f.m \p e_ct.f e_ct \p2 e_ct2.mReturn (patChain p p2) e_ct2
	// = \m f.m \p e_ct.f e_ct \p2.mReturn (patChain p p2)
	// = \m f.m \p e_ct.f e_ct (mReturn ° (patChain p))

	// retPropEq :: Str -> Any -> Env -> <Pattern, Env>
	// retPropEq :: Str -> Any -> Env -> (Pattern -> Env -> c) -> c
	const retPropEq = (propKey, value) =>
		e_ct => mReturn(patProp(propKey, patEq(value)), e_ct)
	;

	// retPropVar :: Str -> Str -> Env -> <Pattern, Env>
	const retPropVar = (propKey, varName) => e_ct => {
		return Env.lookup(
			varName,
			e_ct,
			_ => mReturn(
				patProp(propKey, patVarGet(varName)),
				e_ct
			),
			() => mReturn(
				patProp(propKey, patVarIntro(varName)),
				Env.addBinding(varName, 1, e_ct)
			)
		);
	};

	// retPropSub :: Str -> (<Pattern, Env> -> <Pattern, Env>) -> Env -> <Pattern, Env>
	const retPropSub = (propKey, f) => e_ct =>
		f(mReturn(patAny, e_ct))(
			(pat, e_ct2) => mReturn(patProp(propKey, pat), e_ct2)
		);


	const foo = mReturn(patProp("datactor", patEq("Ctor1")), Env.empty);

	const bar = foo(bindPatX)(retPropVar(0, "x"));

	const baz = bar(bindPatX)(retPropSub(1, m => {
		const p = m(bindPatX)(retPropEq("datactor", "Ctor2"));
		const q = p(bindPatX)(retPropEq(0, "1.0"));
		const r = q(bindPatX)(retPropVar(1, "x"));
		return r;
	}));

	const qmbl = baz(bindPatX)(retPropVar(2, "x"));

	mExtract(qmbl, (p, e_ct) => {
		console.log(p.toString());
		const cT = e => { console.log("success - e: " + e); return e; };
		const cF = () => console.log("failure");
		const match = x => p(cT, cF)(x, Env.empty);

		return;
	});


	// patData :: DataCtor -> [Pattern b c] -> (Pattern a c)
	const patData = (ctor, ...argPatterns) => {
		const n = ctor.length;
		if (argPatterns.length !== n)
			throw "wrong arity " + n + " !== " + argPatterns.length;
		const patCtor = patProp("datactor", patEq(ctor))
		if (n === 0) {
			return patCtor;
		}
		/*
		const res = argPatterns.reduce(
			(acc, pat, i) => patChain(acc, patProp(i, pat)),
			patCtor
		);
		*/
		const res = patChain(
			patCtor, 
			argPatterns
				.map((pat, i) => patProp(i, pat))
				.reduceRight((acc, pat) => patChain(pat, acc))
		);
		const inner_toString = res.toString;
		//res.toString = () => "(" + inner_toString() + ")";
		return res;
	};

	// patChoice = (Pattern a c) -> (Pattern a c) -> (Pattern a c)
	// Note: this is different from pushClause, as it deals only with
	//       Patterns, NO right-hand-sides.
	const patChoice = (p, q) => (cT, cF) => (x, e) =>
		p(cT, () => q(cT, cF)(x, e))(x, e)
	;

	// catchAll :: a -> c
	const catchAll = x => err("inexhaustive patterns: " + stringify(x));
	catchAll.toString = () => '_ -> error "inexhaustive patterns"';


	// pushClause :: (Pattern a c) -> (Env -> c) -> (a -> c) -> (a -> c)
	const pushClause = (pat, rhs, onFail) => {
		const res = x =>
			pat(
				e => rhs(new Proxy(e, { get: Env.get })),
				() => onFail(x)
			)(x, Env.empty)
		;
		res.toString = () => pat.toString() + " -> ..."
			+ "\n" + onFail.toString();
		return res;
	};


	Datatype.pattern = {
		patAny,
		patConst: patConst,
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