require(["scripts/fn", "scripts/Datatype", "scripts/expr"], (fn, Datatype, Expr) => {
	const { test, todo, skip, module } = QUnit;
	const { isDatavalue } = Datatype;


	const isExpr = Expr.isExpr;

	const Const = Expr.const;
	const Var   = Expr.var;
	const App   = Expr.app;
	const If    = Expr.if;

/*
	const isExpr = v => isDatavalue(v) && (v.datatype === Expr);

	Expr = new Datatype("Expr", {
		Const: { value: v => !Number.isNaN(v) }, 
		Var:   { name:  n => typeof n === "string" },
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

	const { Const, Var, App, If } = Expr;
*/


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
	}

	module("Expr", () => { // ------------------------------------------
		const mkDesc = (desc,v) => desc + "(" + QUnit.dump.parse(v) + ")";

		module(".Var", () => { // ------------------------------------------
			const validArgs = [
				"_", "a", "b", "foo",
				"__", "_0", "_bar",
			];
			const invalidArgs = [
				true, false,
				0, 1, -1, 42,
				NaN, undefined,
				null, {},
				[],
				() => 42,
				//Symbol.iterator,	// TODO: does throw but only because Symbol cannot be converted to String
				Const(5),
				"", " ", "-", "0", "1", "-a", 
				"foo.bar", "foo-bar", "foo bar", 
				"foo\tbar", "foo\n", "foo\rbar", "foo\r\nbar", "foo\n\rbar",
				"()", "<>", "[]", "{}",
			];

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
					assert.same(act(v), exp, describe(v));
				});
			});
			test("argument checking", function (assert) {
				const describe = v => mkDesc("Var", v) + " should throw";
				const act = construct;
				invalidArgs.forEach(v => {
					assert.throws(() => act(v), /invalid/, describe(v));
				});
			});

			test(".parse(...)", function (assert) {
				const describe = v => mkDesc(".parse", v);
				const expect = Var;
				const act = Expr.parse;
				validArgs.forEach(v => {
					const desc = describe(v);
					const expected = expect(v);
					const actual = act(v);

					assert.dataEqual(actual, expected, desc);
				});
			});
		}); // end module ".var"

		module(".Const", () => { // ------------------------------------------
			const bools = [true, false];
			const numbers = [-1, 0, 1, 42, 3.1415];
			const strings = ["", "foo", "\"bar\"", "a b c"];
				
			const validArgs = [
				...bools, ...numbers, ...strings,
				null, undefined, {},
				Symbol.iterator,
				x => x + 1,
			];
			const invalidArgs = [NaN];

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
						const exp = "Const " + QUnit.dump.parse(v);
						assert.same(act(v), exp, describe(v));
					});
				});
			}) // end module ".toString"

			test("argument checking", function (assert) {
				const describe = v => mkDesc("Const", v) + " should throw";
				const act = construct;
				invalidArgs.forEach(v => {
					assert.throws(() => act(v), /invalid/, describe(v));
				});
			});

			module(".parse", () => {  // ------------------------------------------
				const describe = v => mkDesc(".parse", v);
				const expect = Const;
				const act = Expr.parse;
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

			}); // end module ".const"

		}); // end module ".const"

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
			module(".parse", () => { // ------------------------------------------
				const describe = v => mkDesc(".parse", v);
				const act = Expr.parse;
				const expect = v => App(Var(v[0]), Const(v[1]));
				test("[aVar,aConst]", function (assert) {
					let v = ["f", 42];
					const desc = describe(v);
					const expected = expect(v);
					const actual = act(v);
					assert.isApp(actual, desc);
					assert.deepEqual(actual, expected, desc);
				});			
				test("[aVar,aConst,aConst]", function (assert) {
					let v = ["f", 42, 5];
					assert.deepEqual(
						act(v),
						App(App(Var("f"), Const(42)), Const(5)),
						describe(v)
					);
				});
				test("[aVar,[aVar,aConst]]", function (assert) {
					let v = ["f", ["g", 5]];
					assert.deepEqual(
						act(v),
						App(Var("f"), App(Var("g"), Const(5))),
						describe(v)
					);
				});
				test("[aExpr,aConst]", function (assert) {
					function aFunction(x) {
						return x;
					}
					let v = [Const(aFunction), 42];
					assert.deepEqual(
						act(v),
						App(Const(aFunction), Const(42)),
						describe(v)
					);
				});
				test("[Fn,Const]", function (assert) {
					function aFunction(x) {
						return x;
					}
					let v = [aFunction, 42];
					assert.deepEqual(
						act(v),
						App(Const(aFunction), Const(42)),
						describe(v)
					);
				});
			}); // end module ".parse"
			
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
					exp = "App (Const namedFn) (Const 42)";
					assert.same(x.toString(), exp);
					
					x = App(Const(anonFn), Const(42));
					exp = "App (Const ?) (Const 42)";
					assert.same(x.toString(), exp);
					
					x = App(Const(arrowFn), Const(42));
					exp = "App (Const ?) (Const 42)";
					assert.same(x.toString(), exp);
				});
			}); // end module ".toString"
		}); // end module ".app"

		module(".if", () => { // ------------------------------------------
			test("Expr.if", function (assert) {
				let c, t, e, x, desc;

				c = Expr.var("cond");
				t = Expr.const("then");
				e = Expr.const("else");
				x = Expr.if(c).then(t).else(e);
				desc = "(If (Var 'cond') (Const 'then') (Const 'else'))"

				assert.isIf(x, desc);
				assert.same(x.condX, c, desc + ".condX");
				assert.same(x.thenX, t, desc + ".thenX");
				assert.same(x.elseX, e, desc + ".elseX");
			});
		}); // end module ".if"

	}); // end module "Expr"
}); // end require