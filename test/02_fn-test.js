require(["scripts/fn"], (fn) => {
    const { test, todo, skip, module } = QUnit;

    module("fn", () => { // ----------------------------------------
		test("module object", function (assert) {
			assert.same(Object.getPrototypeOf(fn), null, "has null __proto__");
		});

		module("id", () => { // ----------------------------------------
			test("std call", function (assert) {
				assert.same(fn.id(), undefined, "id()");
				let o = {};
				assert.same(fn.id(o), o, "id(o)");
			});
		});  // end module "id"

		module("returnThis", () => { // ----------------------------------------
			test("called via .call", function (assert) {
				const thisValue = {};
				assert.same(fn.returnThis.call(thisValue), thisValue, 
					"returnThis.call(x) === x");
				assert.same(fn.returnThis.call(thisValue, "foo"), thisValue, 
					"returnThis.call(x, 'foo') === x");
			});

			test("called as method", function (assert) {
				assert.same(fn.returnThis(), fn, "fn.returnThis() === fn");
				assert.same(fn.returnThis("foo"), fn, "fn.returnThis('foo') === fn");

				const o = { f: fn.returnThis };
				assert.same(o.f(), o, "o.returnThis() === o");
				assert.same(o.f("foo"), o, "o.returnThis('foo') === o");
			});

			skip("called \"freely\"", function (assert) {
				const f = fn.returnThis;
				const thisValue = this; // test function are called bound to the test context
				assert.same(f(), thisValue, "returnThis() === this");
				assert.same(f("bar"), thisValue, "returnThis('bar') === this");
			});			
		});  // end module "returnThis"

		module("fn.insist_nonNegativeInt", () => { // ----------------------------------------
			test("with non-Int arg", function (assert) {
				assert.throws(() => fn.insist_nonNegativeInt(), /non-negative/,
					"no arg: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(null), /non-negative/,
					"null: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(undefined), /non-negative/,
					"undefined: should throw");
				assert.throws(() => fn.insist_nonNegativeInt({}), /non-negative/,
					"an object: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(3.14), /non-negative/,
					"3.14: should throw");
				assert.throws(() => fn.insist_nonNegativeInt("0"), /non-negative/,
					"'0': should throw");
				assert.throws(() => fn.insist_nonNegativeInt("1"), /non-negative/,
					"'1': should throw");
				assert.throws(() => fn.insist_nonNegativeInt(NaN), /non-negative/,
					"NaN: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_VALUE), /non-negative/,
					"Number.MIN_VALUE: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_SAFE_INTEGER), /non-negative/,
					"Number.MIN_SAFE_INTEGER: should throw");
			});
			test("with negative Int", function (assert) {
				assert.throws(() => fn.insist_nonNegativeInt(-1), /non-negative/,
					"-1: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(-42), /non-negative/,
					"-42: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_VALUE), /non-negative/,
					"Number.MIN_VALUE: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_SAFE_INTEGER), /non-negative/,
					"Number.MIN_SAFE_INTEGER: should throw");
			});
			test("with non-negative Int", function (assert) {
				assert.same(fn.insist_nonNegativeInt(42), 42, 
					"should return the arg");
			});
		});  // end module "fn.insist_nonNegativeInt"


        test("arrow function .bind", function (assert) {
        	let actualThis;
        	const lexicalThis = this;
        	const otherThis = {};
        	const f = (() => { actual = this }).bind(otherThis);
        	f();
        	assert.same(actual, lexicalThis);
        });

    }); // end module "fn"

}); // end require