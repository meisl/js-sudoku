define(["./fn", "./Datatype", "./Data_Maybe"], (fn, Datatype, Maybe) => { with (fn) {

	const __Env_prototype = Object.freeze(Object.create(null, {
		[Symbol.toStringTag]: { value: "Env" }
	}));
	const __Env_empty = Object.freeze(Object.create(__Env_prototype));

	function isEnv(x) {
		if (!fn.isObject(x) || (x === null))
			return false;
		const proto = Object.getPrototypeOf(x);
		return (proto === __Env_prototype)
			? true
			: isEnv(proto);
	}
	
	const __Env_lookup = (name, env) => {
		if (env === Env.empty)
			return Maybe.None
		const res = env[name];
		return (res !== (void 0)) // TODO: what about storing "undefined"?
			? Maybe.Some(res)
			: __Env_lookup(name, Object.getPrototypeOf(env));
	}

	const Env = {
		isEnv: isEnv,
		empty: __Env_empty,
		// lookup :: Str -> Env -> Maybe Any
		lookup: (name, env) => {
			if (!isString(name))
				throw new TypeError("Env.lookup: not a string: " + stringify(name));
			if (!isEnv(env))
				throw new TypeError("Env.lookup: not an Env: " + stringify(env));
			return __Env_lookup(name, env);

		},
		// extend :: Str -> Any -> Env -> Env
		extend: (name, val, env) => {
			if (!isString(name))
				throw new TypeError("Env.extend: not a string: " + stringify(name));
			if (!isEnv(env))
				throw new TypeError("Env.extend: not an Env: " + stringify(env));
			return Object.create(env, {
				[name]: { value: val, enumerable: true }
			});
		}
	}


	return Env;
} /* end with(fn) */ });