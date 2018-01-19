require([
	"scripts/fn",
	"scripts/Datatype",
	"scripts/Data_Maybe",
	"scripts/Env"
], (fn, Datatype, Maybe, Env) => {
	const { test, todo, skip, module } = QUnit;

	const { isDatatype, isDatactor, isDatavalue } = Datatype;
	const { None, Some } = Maybe;
	const { isEnv, empty, lookup, extend } = Env;

	module("Env", () => { // ------------------------------------------

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

		module(".isEnv", () => { // ------------------------------------------
			test("with no arg", function (assert) {
				assert.same(isEnv(), false, 
					"Env.isEnv() should return false");
			});
			test("with non-Env arg", function (assert) {
				const nonEnvs = [
					null,
					{},
					"", "foo",
					true, false,
					Object.create(null),
					(void 0), undefined,
					() => "qmbl",
				];
				nonEnvs.forEach(e => {
					assert.same(isEnv(e), false, 
						"Env.isEnv(" + QUnit.dump.parse(e) + ") should return false");
				})

			});
			test("with Env.empty", function (assert) {
				assert.same(isEnv(empty), true, 
					"Env.isEnv(Env.empty) should return true");
			});
		}); // end module ".isEnv"

		module("(bare) .extend", () => { // ------------------------------------------
			todo("with invalid args", function (assert) {
			});
			test("Env.empty", function (assert) {
				const x = extend("x", 5, empty);
				assert.same(isEnv(x), true,
					'Env.extend("x", 5, Env.empty) is an Env');
			});
			test("non-empty Env", function (assert) {
				const x = extend("x", 5, empty);
				const x_y = extend("y", 4711, x);
				assert.same(isEnv(x_y), true,
					'extending with a new binding yields a another Env');
				
				const x_shadowed = extend("x", 4711, x);
				assert.same(isEnv(x_shadowed), true,
					'shadowing: extending with a binding to existing name yields a another Env');
			});
		}); // end module ".extend"
		
		module(".lookup", () => { // ------------------------------------------
			todo("with invalid args", function (assert) {
			});
			test("in Env.empty", function (assert) {
				const act = name => lookup(name, Env.empty);
				const describe = name => "lookup(" + QUnit.dump.parse(name)
					+ ", Env.empty) should return false";
				const names = [
					"",
					"x", "_",
					"foobar", "foo-bar",
					"0", "1", "2",
				];
				names.forEach(name =>
					assert.same(act(name), None, describe(name))
				);
			});
			test("in extended Env", function (assert) {
				const x = extend("x", 5, empty);
				assert.dataEqual(lookup("y", x), None,
					"looking up non-existing name 'y'");
				assert.dataEqual(lookup("x", x), Some(5),
					"lookup 'x' bound at level 0");

				const xy = extend("y", 4711, x);
				assert.dataEqual(lookup("y", xy), Some(4711),
					"lookup 'y' bound at level 0");
				assert.dataEqual(lookup("x", xy), Some(5),
					"lookup 'x' bound at level 1");

				const x_shadowed = extend("x", 4711, x);
				assert.dataEqual(lookup("x", x_shadowed), Some(4711),
					"lookup 'x' shadowed at level 0");
				assert.dataEqual(lookup("x", xy), Some(5),
					"lookup 'x' in parent Env");

				const xyz = extend("z", "foo", xy);
				assert.dataEqual(lookup("y", xyz), Some(4711),
					"lookup 'y' bound at level 1");
				assert.dataEqual(lookup("x", xyz), Some(5),
					"lookup 'x' bound at level 2");
			});
		}); // end module ".lookup"


	}); // end module "Env"
}); // end require