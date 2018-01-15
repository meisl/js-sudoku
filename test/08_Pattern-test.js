require(["scripts/Pattern"], (Pattern) => {
	const { test, todo, skip, module } = QUnit;

	const { Var, Const, App } = Pattern;

	module("Pattern", () => { // ------------------------------------------

		skip(".match", () => { // ------------------------------------------
			test("Var pattern", function (assert) {
				let pat = Var("z");
				let match = (p, x) => p.match(x);
				let values = [
					//undefined, null, "x", 42,
					Var("x"), 
					Const(42),
					App(Var("f"), Const(42)),
					If(Var("c")).then(Const("t")).else(Const("e"))
				];

				values.forEach(v => {
					assert.deepEqual(match(pat, v), { z: v }, 
						"pattern Var('z') matches anything, and binds the thing to 'z'"
					);
				});

				pat = Var("_");
				values.forEach(v => {
					let m = match(pat, v);
					//assert.same(QUnit.dump.parse(m), "");
					assert.deepEqual(m, {}, 
						"pattern Var('_') matches anything, but doesn't bind"
					);
				});
			});
			test("Const pattern", function (assert) {
				let match = (p, x) => p.match(x);
				let pat, matching, not_matching;

				function runTests() {
					matching.forEach(v => {
						assert.deepEqual(match(pat, v), {},
							"pattern (" + pat.toString() + ") against " + v
							+ " should match"
						);
					});
					not_matching.forEach(v => {
						assert.notOk(match(pat, v), 
							"pattern (" + pat.toString() + ") against " + v
							+ " should NOT match"
						);
					});
				}

				pat = Const(undefined);
				matching = [undefined];
				not_matching = [
					null, 42, "x", "foo",
					Const(undefined), // !
					Const(5),
					Var("x"),
					Var("_"),
					App(Var("fn"), Const(4711)),
					If(Var("c")).then(Const("t")).else(Const("e")),
				];
				runTests();

				pat = Const(42);
				matching = [42];
				not_matching = [
					null, undefined, "x", "foo",
					Const(42), // !
					Const(5),
					Var("x"),
					Var("_"),
					App(Var("fn"), Const(4711)),
					If(Var("c")).then(Const("t")).else(Const("e")),
				];
				runTests();
			});
			test("App pattern", function (assert) {
				let match = (p, x) => p.match(x);
				let pat, matching, not_matching;
				let val;

				pat = Expr.parse([Expr.dataCtors.Var, "name"]);
				val = Var("foo");
				assert.deepEqual(match(pat, val), { name: val.name },
					"pattern (" + pat.toString() + ") should match " + val);
			});
		}); // end module ".match"
		
	}); // end module "Pattern"
}); // end require