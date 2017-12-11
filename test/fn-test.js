require(["scripts/fn"], (fn) => {
    const { test, todo, skip, module } = QUnit;

    module("fn", () => { // ----------------------------------------
		test("module object", function (assert) {
			assert.same(Object.getPrototypeOf(fn), null, "has null __proto__");
		});

        test("returnThis called via .call", function (assert) {
            const thisValue = {};
            assert.same(fn.returnThis.call(thisValue), thisValue, 
                "thisValue.call(x) === x");
            assert.same(fn.returnThis.call(thisValue, "foo"), thisValue, 
                "thisValue.call(x, 'foo') === x");
        });

        test("returnThis called as method", function (assert) {
            assert.same(fn.returnThis(), fn, "fn.thisValue() === fn");
            assert.same(fn.returnThis("foo"), fn, "fn.thisValue('foo') === fn");

            const o = { f: fn.returnThis };
            assert.same(o.f(), o, "o.thisValue() === o");
            assert.same(o.f("foo"), o, "o.thisValue('foo') === o");
        });

        skip("returnThis called \"freely\"", function (assert) {
            const f = fn.returnThis;
            assert.same(f(), this, "thisValue() === this");
            assert.same(f("bar"), this, "thisValue('bar') === this");
        });

    }); // end module "fn"

}); // end require