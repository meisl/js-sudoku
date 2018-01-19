require(["scripts/fn", "scripts/Datatype", "scripts/expr"], (fn, Datatype, Expr) => {
	const { test, todo, skip, module } = QUnit;
	const { isDatavalue } = Datatype;

	let isExpr, Const, Var, App, If;

	const old = 0;

	if (old) {
		isExpr = Expr.isExpr;
		Const = Expr.const;
		Var   = Expr.var;
		App   = Expr.app;
		If    = (...args) => new Expr.dataCtors.If(...args);
	} else {
		isExpr = v => isDatavalue(v) && (v.datatype === Expr);
		function isValidVarName(n) {
			return fn.isString(n) && /^[_a-zA-Z][_a-zA-Z0-9]*$/g.test(n);
		}
		Expr = new Datatype("Expr", {
			Const: { value: v => !Number.isNaN(v) }, 
			Var:   { name:  isValidVarName },
			App: {
				f: isExpr,
				x: isExpr,
			},
			If: {
				condX: isExpr,
				thenX: isExpr,
				elseX: isExpr,
			}
		});
		Expr.make = function (v) {
			if (isExpr(v)) return v;
			if (fn.isString(v)) {
				if (v === "")
					throw "cannot create Expr from empty string ''";
				let i = v.indexOf(".");
				if (i >= 0)
					throw "NYI: accessor syntax in '" + v + "'";
				return new Var(v);
			}
			if (fn.isArray(v)) {
				if (v.length < 2)
					throw "cannot create Expr from array with less than 2 elems: "
						+ "[" + v + "]";
				return v.map(Expr.make).reduce((f, a) => App(f, a));
			}
			if (fn.isObject(v)) {
				throw "cannot create Expr from object " + v;
			}
			return Const(v);
		};
		({ Const, Var, App, If } = Expr);
	}

	extendAssert();
	runTests();

	function extendAssert() {
		QUnit.assert.isExpr = function (actual, desc) {
			let message, expected, result;
			if (!desc) desc = "...";
			message  = ".isExpr(" + desc + ")";
			expected = "an Expr instance";

			result = isExpr(actual);
			if (result) {
				const ctor = actual.datactor;
				if (!fn.isObject(ctor) && !fn.isFunction(ctor)) {
					result = false;
					actual = ctor;
					message = desc + ".datactor should be Object or Function";
				} else {

				}
			}

			this.pushResult({ result, actual, expected, message });
		};

		// make assertions .isConst, .isVar, .isApp, .isIf
		const ctorTests = ["isConst", "isVar", "isApp", "isIf"];
		ctorTests.forEach(asserted => {
			QUnit.assert[asserted] = function (value, desc) {
				this.isExpr(value, desc);
				ctorTests.forEach(current => {
					const expected = (current === asserted);
					this.same(value[current], expected,
						desc + "." + current + " should be " + expected);
				});
			}
		});

		QUnit.assert.dataEqual = function (actual, expected, description) {
			if ((typeof actual !== "object") || (actual === null))
				throw new TypeError("assert.dataEqual: arg actual is not a data value: "
					+ QUnit.dump.parse(actual));
			if ((typeof expected !== "object") || (expected === null))
				throw new TypeError("assert.dataEqual: arg expected is not a data value: "
					+ QUnit.dump.parse(expected));

			this.same(actual.datactor, expected.datactor, 
				description + ".datactor should be " + expected.datactor
			);
			this.deepEqual(actual, expected, description + " properties");		
		};
	} // end function extendAssert

	function runTests() {
	module("Expr", () => { // ------------------------------------------
		const mkDesc = (desc,v) => desc + "(" 
			+ (fn.isString(v) ? fn.toStrLiteral(v) : QUnit.dump.parse(v))
			+ ")"
		;
		const bools = [true, false];
		const numbers = [-1, 0, 1, 42, 3.1415];
		const strings = [
			"", "foo", "a b c", "\"bar\"", 
			"\r", "\n", "\r\n",
			"\t"
		];
		const functions = [
			function namedFn(x) { return x },
			function (x) { return x},
			x => x,
			x => x + 1,
		];
		const testArgs = {
			Var: {
				validArgs: [
					"_", "a", "b", "foo",
					"__", "_0", "_bar",
				],
				invalidArgs: [
					...bools,
					...numbers,
					...functions,
					NaN, undefined,
					null, {},
					[],
					//Symbol.iterator,	// TODO: does throw but only because Symbol cannot be converted to String
					Const(5),
					"", " ", "-", "0", "1", "-a", 
					"foo.bar", "foo-bar", "foo bar", 
					"foo\tbar", "foo\n", "foo\rbar", "foo\r\nbar", "foo\n\rbar",
					"()", "<>", "[]", "{}",
				],
			},
			Const: {
				validArgs: [
					...bools, ...numbers, ...strings, ...functions,
					null, undefined, {},
					Symbol.iterator,
				],
				invalidArgs: [NaN],
			},
			App: {
				validArgs: [],
				invalidArgs: [],
			},
			If: {
				validArgs: [],
				invalidArgs: [],
			},
		};

		module(".Var", () => { // ------------------------------------------
			const { validArgs, invalidArgs } = testArgs.Var;

			let construct = Var;
			
			test("ctor test: .isVar", function (assert) {
				validArgs.forEach(v => {
					assert.isVar(construct(v), mkDesc("Var", v));
				});
			});
			test("stored args: .name", function (assert) {
				const describe = v => mkDesc("Var", v) + ".name";
				const act = v => construct(v).name;
				validArgs.forEach(v => {
					assert.same(act(v), v, describe(v));
				});
			});
			test(".toString", function (assert) {
				const describe = v => mkDesc("Var", v) + ".toString()";
				const act = v => construct(v).toString();
				validArgs.forEach(v => {
					const exp = 'Var "' + v + '"';
					const actual = act(v);
					assert.same(actual, exp, describe(v));
				});
			});

		}); // end module ".var"

		module(".Const", () => { // ------------------------------------------
			const { validArgs, invalidArgs } = testArgs.Const;
			let construct = Const;

			test("ctor test: .isConst", function (assert) {
				const describe = v => mkDesc("Const", v);
				const act = v => construct(v);
				validArgs.forEach(v => {
					assert.isConst(act(v), describe(v));
				});
			});
			test("stored args: .value", function (assert) {
				const describe = v => mkDesc("Const", v) + ".value";
				const act = v => construct(v).value;
				validArgs.forEach(v => {
					assert.same(act(v), v, describe(v));
				});
			});

			module(".toString", () => { // ------------------------------------------
				const describe = v => mkDesc("Const", v) + ".toString()";
				const act = v => Const(v).toString();
				test("bool arg", function (assert) {
					bools.forEach(v => {
						const exp = "Const " + v;
						assert.same(act(v), exp, describe(v));
					});
				});
				test("number arg", function (assert) {
					numbers.forEach(v => {
						const exp = "Const " + v;
						assert.same(act(v), exp, describe(v));
					});
				});
				test("string arg", function (assert) {
					strings.forEach(v => {
						const exp = "Const " + fn.toStrLiteral(v);
						assert.same(act(v), exp, describe(v));
					});
				});
				test("function arg", function (assert) {
					function namedFn(x) {
						return x;
					}
					const anonFn = function (x) {
						return x;
					};
					const arrowFn = x => x;

					const act = v => Const(v).toString();

					assert.same(act(namedFn), "Const namedFn",
						"Const(function namedFn() {...}).toString()");
					assert.same(act(anonFn), "Const ?",
						"Const(function (){...}).toString()");
					assert.same(act(arrowFn), "Const ?",
						"Const(x => ...).toString()");
				});
				test("Symbol arg", function (assert) {
					const v = Symbol.iterator;
					const act = v => Const(v).toString();
					assert.same(act(v), "Const " + v.toString(),
						"Const(Symbol.iterator).toString()");

				});
			}) // end module ".toString"

		}); // end module ".Const"

		module(".App", () => { // ------------------------------------------
			test("Expr.App", function (assert) {
				let f, a, x, desc;

				f = Var("f");
				a = Const(42);
				x = App(f, a);
				desc = "(App (Var 'f') (Const 42))"

				assert.isApp(x, desc);
				assert.same(x.f, f, desc + ".f");
				assert.same(x.x, a, desc + ".x");
			});
						
			module(".toString", () => { // ------------------------------------------
				test("[Var,Const]", function (assert) {
					const x   = App(Var("f"), Const(42));
					const exp = 'App (Var "f") (Const 42)';
					assert.same(x.toString(), exp);
				});
				test("[Var,Const,Const]", function (assert) {
					const x   = App(App(Var("f"), Const(42)), Const(5));
					const exp = 'App (App (Var "f") (Const 42)) (Const 5)';
					assert.same(x.toString(), exp);
				});
				test("[Var,[Var,Const]]", function (assert) {
					const x   = App(Var("f"), App(Var("g"), Const(5)));
					const exp = 'App (Var "f") (App (Var "g") (Const 5))';
					assert.same(x.toString(), exp);
				});
				test("[Fn,Const]", function (assert) {
					function namedFn(x) {
						return x;
					}
					const anonFn = function (x) {
						return x;
					};
					const arrowFn = x => x;
					let x, exp;
					
					x = App(Const(namedFn), Const(42));
					exp = "App (" + Const(namedFn).toString() + ") (Const 42)";
					assert.same(x.toString(), exp);
					
					x = App(Const(anonFn), Const(42));
					exp = "App (" + Const(anonFn).toString() + ") (Const 42)";
					assert.same(x.toString(), exp);
					
					x = App(Const(arrowFn), Const(42));
					exp = "App (" + Const(arrowFn).toString() + ") (Const 42)";
					assert.same(x.toString(), exp);
				});
			}); // end module ".toString"
		}); // end module ".app"

		module(".If", () => { // ------------------------------------------
			test("Expr.if", function (assert) {
				let c, t, e, x, desc;

				c = Var("cond");
				t = Const("then");
				e = Const("else");
				x = If(c, t, e);
				desc = "(If (Var 'cond') (Const 'then') (Const 'else'))"

				assert.isIf(x, desc);
				assert.same(x.condX, c, desc + ".condX");
				assert.same(x.thenX, t, desc + ".thenX");
				assert.same(x.elseX, e, desc + ".elseX");
			});
		}); // end module ".if"




		module(".make", () => { // ------------------------------------------
			const describe = v => mkDesc(".make", v);
			const act = Expr.make;

			test("Expr arg: should simply be returned", function (assert) {
				const vars = testArgs.Var.validArgs.map(s => Var(s));
				const consts = testArgs.Const.validArgs.map(v => Const(v));
				const apps = [
					App(Var("f"), Const(42)),
					App(Const(x => x + 1), Const(0)),
				];
				const ifs = [
					If(Var("condition"), Const(false), Const(true)),
				];

				const exprs = [...vars, ...consts, ...apps, ...ifs];
				exprs.forEach(x => {
					assert.same(act(x), x, 
						"arg: " + x.toString());
				});
			});
			test("string arg: interpret as Var", function (assert) {
				const expect = Var;
				let v;
		
				v = "";
				assert.throws(() => act(v), /empty/, describe(v) + " should throw");

				testArgs.Var.validArgs.forEach(v => {
					const desc = describe(v);
					const expected = expect(v);
					const actual = act(v);

					assert.dataEqual(actual, expected, desc);
				});
			});
			module("interpret as Const", () => {  // ------------------------------------------
				const expect = Const;
				function doTests(which, values) {
					test(which, function (assert) {
						values.forEach(v => {
							const desc     = describe(v);
							const expected = expect(v);
							const actual   = act(v);
							assert.dataEqual(actual, expected, desc);
						});
					});
				}

				doTests("bool arg", bools);
				doTests("number arg", numbers);
				// Note: plain strings are parsed as Vars
				doTests("function arg", functions);

			}); // end module "interpret as Const"
			
			test("object arg: should throw", function (assert) {
				[	{},
					null,
				].forEach( v =>
					assert.throws(() => act(v), /cannot/, describe(v))
				);
			});
			
			module("array arg: interpret as App", () => { // ------------------------------------------
				/*
				const expect = arr => {
					const n = arr.length - 1;
					return App(
						(n === 1) 
							? Expr.make(arr[0])
							: expect(arr.slice(0, n)),
						Expr.make(arr[n])
					);
				};
				*/

				test("fewer than 2 elems should throw", function (assert) {
					[[], ["f"]].forEach( v =>
						assert.throws(() => act(v), /cannot/, describe(v))
					);
				});
				test("[aVar,aConst]", function (assert) {
					let v = ["f", 42];
					const expected = App(Var("f"), Const(42));
					assert.dataEqual(act(v), expected, describe(v));
				});			
				test("[aVar,aConst,aConst]", function (assert) {
					let v = ["f", 42, 5];
					const expected = App(App(Var("f"), Const(42)), Const(5));
					assert.dataEqual(act(v), expected, describe(v));
				});
				test("[aVar,[aVar,aConst]]", function (assert) {
					let v = ["f", ["g", 5]];
					const expected = App(Var("f"), App(Var("g"), Const(5)));
					assert.dataEqual(act(v), expected, describe(v));
				});
				test("[aExpr,aConst]", function (assert) {
					function aFunction(x) {
						return x;
					}
					let v = [Const(aFunction), 42];
					const expected = App(Const(aFunction), Const(42));
					assert.dataEqual(act(v), expected, describe(v));
				});
				test("[Fn,Const]", function (assert) {
					function aFunction(x) {
						return x;
					}
					let v = [aFunction, 42];
					const expected = App(Const(aFunction), Const(42));
					assert.dataEqual(act(v), expected, describe(v));
				});
			}); // end module "array arg"
		}); // end module ".make"

		module("arguments checking", () => { // ------------------------------------------
			test("Var", function (assert) {
				const describe = v => mkDesc("Var", v) + " should throw";
				const act = Var;
				testArgs.Var.invalidArgs.forEach(v => {
					assert.throws(() => act(v), /invalid/, describe(v));
				});
			});
			test("Const", function (assert) {
				const describe = v => mkDesc("Const", v) + " should throw";
				const act = Const;
				testArgs.Const.invalidArgs.forEach(v => {
					assert.throws(() => act(v), /invalid/, describe(v));
				});
			});
			
		}); // end module ".arguments checking"

	}); // end module "Expr"
	} // end function runTests
}); // end require