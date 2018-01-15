define(["./fn"], (fn) => { with (fn) {

	class Expr {
		static isExpr(x) {
			return x instanceof Expr;
		}
		static parse(v) {
			if (isExpr(v)) return v;
			if (isString(v)) {
				if (v === "")
					throw "cannot parse empty string ''";
				let i = v.indexOf(".");
				if (i >= 0)
					throw "NYI: accessor syntax in '" + v + "'";
				return new VarExpr(v);
			}
			if (isArray(v)) {
				if (v.length < 2)
					throw "invalid app syntax [" + v + "] - need at least 2 elems";
				return v.map(Expr.parse).reduce(Expr.app);
			}
			if (isFunction(v)) {
				return new ConstExpr(v);
			}
			if (isObject(v)) {
				throw "cannot parse object " + v;
			}
			return new ConstExpr(v);
		}

		static const(val) {
			return new ConstExpr(val);
		}
		static var(name) {
			return new VarExpr(name);
		}
		static app(f, arg) {
			return new AppExpr(f, arg);
		}
		static if(cnd) {
			const condX = Expr.parse(cnd);
			return { then: function (thn) {
				const thenX = Expr.parse(thn);
				return {
					else: function (els) {
						const elseX = Expr.parse(els)
						return new IfExpr(condX, thenX, elseX);
					}
				}
			} };
		}
		
		throwNotImplemented(which) {
			throw which + " not implemented in " + this.constructor.name;
		}

		get isConst()  { return false }
		get isVar()    { return false }
		get isApp()    { return false }
		get isIf()     { return false }

		get datactor() { return this.constructor }
	}
	
	class ConstExpr extends Expr {
		constructor(value) {
			super();
			if (Number.isNaN(value))
				throw "Const: invalid arg NaN - cannot construct ConstExpr";
			Object.assign(this, { value });
		}
		toString() {
			const v = this.value;
			if (fn.isString(v)) {
				return "Const " + QUnit.dump.parse(v);
			} else if (fn.isFunction(v)) {
				if (v.name) {
					return "Const " + v.name;
				}
				return "Const ?";
			}
			return "Const " + v;
		}
		match(v) {
			if (v === this.value) {
				return {};
			}
		}
	}
	Object.defineProperties(ConstExpr.prototype, {
		[Symbol.toStringTag]: { value: "ConstExpr", configurable: true },
		isConst: { value: true },
	});

	class VarExpr extends Expr {
		static get nameRegExp() {
			return /^[_a-zA-Z][_a-zA-Z0-9]*$/g;
		}
		static isValidName(x) {
			return isString(x) && VarExpr.nameRegExp.test(x);
		}
		constructor(name) {
			super();
			if (!VarExpr.isValidName(name))
				throw "Var: invalid variable name "
					+ (isString(name) ? "'" + name + "'" : name);
			//this.name = name;
			Object.assign(this, { name });
		}
		toString() {
			return "Var \"" + this.name + "\"";
		}
		match(v) {
			return (this.name === "_") 
				? {}
				: { [this.name]: v };
		}
	}
	Object.defineProperties(VarExpr.prototype, {
		[Symbol.toStringTag]: { value: "VarExpr", configurable: true },
		isVar: { value: true },
	});

	// Expr a = ...
	//        | App (Expr a -> b) (Expr b)
	class AppExpr extends Expr {
		constructor(f, x) {
			super();
			if (!isExpr(f))
				throw "App: invalid arg 'f' - not an Expr: " + f;
			if (!isExpr(x))
				throw "App: invalid arg 'x' - not an Expr: " + x;
			Object.assign(this, { f, x });
		}
		toString() {
			return "App (" + this.f.toString() + ") (" + this.x.toString() + ")";
		}
		match(v) {
			if (!isObject(v))
				throw new TypeError("App.match: not a data value: " + v);
			let ctor = this.f.value;
			if (v.constructor === ctor) {
				return this.x.match(v);
			} else {
				let dataType = Object.getPrototypeOf(ctor);
				if (!v instanceof dataType)
					throw new TypeError("App.match: not a " + dataType.name + ": " + v);
			}
		}
	}
	Object.defineProperties(AppExpr.prototype, {
		[Symbol.toStringTag]: { value: "AppExpr", configurable: true },
		isApp: { value: true },
	});

	class IfExpr extends Expr {
		constructor(condX, thenX, elseX) {
			super();
			Object.assign(this, { condX, thenX, elseX });
		}
		get isIf() { return true }
	}
	Object.defineProperties(IfExpr.prototype, {
		[Symbol.toStringTag]: { value: "IfExpr", configurable: true },
		isIf: { value: true },
	});

	const isExpr = Expr.isExpr;

	Object.defineProperties(Expr, {
		dataCtors: { 
			value: {
				Const: ConstExpr,
				Var:   VarExpr,
				App:   AppExpr,
				If:    IfExpr
			}
		}
	});


	return Expr;
} /* end with(fn) */ });