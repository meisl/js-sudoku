require(["scripts/expr"], (Expr) => {
	const { test, todo, skip, module } = QUnit;

	const Const = Expr.const;
	const Fun   = Expr.fun;
	const Var   = Expr.var;
	const App   = Expr.app;
	const If    = Expr.if;

	QUnit.assert.isExpr = function isExpr(value, desc) {
		let message, result;
		if (!desc) desc = "...";
		message = ".isExpr(" + desc + ")"

		result = value instanceof Expr;
		if (result === false) {
			this.pushResult({
				result:   false,
				actual:   value,
				expected: "an Expr instance",
				message:  message
			});
		} else {
			result = Expr.isExpr(value);
			if (result === true) {
				this.pushResult({
					result:   true,
					actual:   value,
					expected: "an Expr instance",
					message:  message
				});
			} else {
				this.pushResult({
					result:   false,
					actual:   value,
					expected: "an Expr instance",
					message:  message
				});
			}
		}
	};
	QUnit.assert.isConst = function isConst(value, desc) {
		this.isExpr(value, desc);
		this.same(value.isConst, true,  desc + ".isConst");
		this.same(value.isVar,   false, desc + ".isVar");
		this.same(value.isApp,   false, desc + ".isApp");
		this.same(value.isIf,    false, desc + ".isIf");
	};
	QUnit.assert.isVar = function isConst(value, desc) {
		this.isExpr(value, desc);
		this.same(value.isConst, false, desc + ".isConst");
		this.same(value.isVar,   true,  desc + ".isVar");
		this.same(value.isApp,   false, desc + ".isApp");
		this.same(value.isIf,    false, desc + ".isIf");
	};
	QUnit.assert.isApp = function isConst(value, desc) {
		this.isExpr(value, desc);
		this.same(value.isConst, false, desc + ".isConst");
		this.same(value.isVar,   false, desc + ".isVar");
		this.same(value.isApp,   true,  desc + ".isApp");
		this.same(value.isIf,    false, desc + ".isIf");
	};
	QUnit.assert.isIf = function isConst(value, desc) {
		this.isExpr(value, desc);
		this.same(value.isConst, false, desc + ".isConst");
		this.same(value.isVar,   false, desc + ".isVar");
		this.same(value.isApp,   false, desc + ".isApp");
		this.same(value.isIf,    true,  desc + ".isIf");
	};

	module("Expr", () => { // ------------------------------------------
		module(".var", () => { // ------------------------------------------
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
				Expr.const(5),
				"", " ", "-", "0", "1", "-a", 
				"foo.bar", "foo-bar", "foo bar", 
				"foo\tbar", "foo\n", "foo\rbar", "foo\r\nbar", "foo\n\rbar",
				"()", "<>", "[]", "{}",
			];
			function runTests(assert, construct, desc) {
				const mkDesc = v => desc + "(" + QUnit.dump.parse(v) + ")";
				validArgs.forEach(v => {
					const x    = construct(v);
					const desc = mkDesc(v);
					
					assert.isVar(x, desc);
					assert.same(x.name, v, desc + ".name");
				});
				invalidArgs.forEach(v => {
					const desc = mkDesc(v);
					assert.throws(() => construct(v), /invalid/, desc + " should throw");
				});
			}
			test("Expr.var", function (assert) {
				runTests(assert, v => Expr.var(v), "Expr.var");
			});
			test(".parse(...)", function (assert) {
				let x, desc;

				x = Expr.parse("x");
				desc = "parse('x')";
				assert.isVar(x, desc);
				assert.same(x.name, "x", desc + ".name");
			});
			test(".toString", function (assert) {
				validArgs.forEach(name => {
					const act  = Var(name).toString();
					const desc = "Var('" + name + "').toString()";
					const exp  = 'Var "' + name + '"';
					assert.same(act, exp, desc);
				});
			})
		}); // end module ".var"

		module(".const", () => { // ------------------------------------------
			const validArgs = [
				true, false,
				"", "foo", 
				0, 1, -1, 42,
				null, undefined, {},
				Symbol.iterator,
				x => x + 1,
			];
			const invalidArgs = [NaN];
			function runTests(assert, construct, desc) {
				const mkDesc = v => desc + "(" + QUnit.dump.parse(v) + ")";
				validArgs.forEach(v => {
					const x    = construct(v);
					const desc = mkDesc(v);
					assert.isConst(x, desc);
					assert.same(x.value, v, desc + ".value");
				});
				invalidArgs.forEach(v => {
					const desc = mkDesc(v);
					assert.throws(() => construct(v), /invalid/, desc + " should throw");
				});
			}
			test("create with Expr.const(...)", function (assert) {
				runTests(assert, v => Expr.const(v), "Expr.const");
			});

			const bools = [true, false];
			const numbers = [-1, 0, 1, 42, 3.1415];
			const strings = ["", "foo", "\"bar\"", "a b c"];
				
			test(".parse(...)", function (assert) {
				bools.forEach(v => {
					assert.deepEqual(
						Expr.parse(v),
						Const(v),
						"Expr.parse(" + v + ")"
					)
				});
				numbers.forEach(v => {
					assert.deepEqual(
						Expr.parse(v),
						Const(v),
						"Expr.parse(" + v + ")"
					)
				});
			});
			module(".toString", () => { // ------------------------------------------
				test("bools", function (assert) {
					bools.forEach(v => {
						const act  = Const(v).toString();
						const desc = "Const(" + v + ").toString()";
						const exp  = "Const " + v;
						assert.same(act, exp, desc);
					});
				});
				test("numbers", function (assert) {
					numbers.forEach(v => {
						const act  = Const(v).toString();
						const desc = "Const(" + v + ").toString()";
						const exp  = "Const " + v;
						assert.same(act, exp, desc);
					});
				});
				test("strings", function (assert) {
					strings.forEach(v => {
						const act  = Const(v).toString();
						const desc = "Const('" + v + "').toString()";
						const exp  = "Const " + QUnit.dump.parse(v);
						assert.same(act, exp, desc);
					});
				});
			}) // end module ".toString"
		}); // end module ".const"

		module(".app", () => { // ------------------------------------------
			test("Expr.app", function (assert) {
				let f, a, x, desc;

				f = Expr.var("f");
				a = Expr.const(42);
				x = Expr.app(f, a);
				desc = "(App (Var 'f') (Const 42))"

				assert.isApp(x, desc);
				assert.same(x.f, f, desc + ".f");
				assert.same(x.x, a, desc + ".x");
			});
			module(".parse", () => { // ------------------------------------------
				test("[Var,Const]", function (assert) {
					assert.deepEqual(
						Expr.parse(["f", 42]),
						App(Var("f"), Const(42)),
						"parse['f', 42]"
					);
				});			
				test("[Var,Const,Const]", function (assert) {
					assert.deepEqual(
						Expr.parse(["f", 42, 5]),
						App(App(Var("f"), Const(42)), Const(5)),
						"parse['f', 42, 5]"
					);
				});
				test("[Var,[Var,Const]]", function (assert) {
					assert.deepEqual(
						Expr.parse(["f", ["g", 5]]),
						App(Var("f"), App(Var("g"), Const(5))),
						"parse['f', ['g', 5]]"
					);
				});
				test("[Expr,Const]", function (assert) {
					function aFunction(x) {
						return x;
					}
					assert.deepEqual(
						Expr.parse([Const(aFunction), 42]),
						App(Const(aFunction), Const(42)),
						"parse[Expr.const(aFunction), 42]"
					);
				});
				test("[Fn,Const]", function (assert) {
					function aFunction(x) {
						return x;
					}
					assert.deepEqual(
						Expr.parse([aFunction, 42]),
						App(Const(aFunction), Const(42)),
						"parse[aFunction, 42]"
					);
				});
			}); // end module ".parse"
			
			module(".toString", () => { // ------------------------------------------
				test("[Var,Const]", function (assert) {
					const x   = Expr.parse(["f", 42]);
					//const x   = App(Var("f"), Const(42));
					const exp = 'App (Var "f") (Const 42)';
					assert.same(x.toString(), exp);
				});
				test("[Var,Const,Const]", function (assert) {
					const x   = Expr.parse(["f", 42, 5]);
					//const x   = App(App(Var("f"), Const(42)), Const(5));
					const exp = 'App (App (Var "f") (Const 42)) (Const 5)';
					assert.same(x.toString(), exp);
				});
				test("[Var,[Var,Const]]", function (assert) {
					const x   = Expr.parse(["f", ["g", 5]]);
					//const x   = App(Var("f"), App(Var("g"), Const(5)));
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
					
					x   = Expr.parse([namedFn, 42]);
					exp = "App (Const namedFn) (Const 42)";
					assert.same(x.toString(), exp);
					
					x   = Expr.parse([anonFn, 42]);
					exp = "App (Const ?) (Const 42)";
					assert.same(x.toString(), exp);
					
					x   = Expr.parse([arrowFn, 42]);
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
		}); // end module ".app"

	}); // end module "Expr"
}); // end require