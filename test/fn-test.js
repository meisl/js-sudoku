require(["scripts/fn"], (fn) => {
    const { test, todo, skip, module } = QUnit;

    module("fn", () => { // ----------------------------------------
		test("module object", function (assert) {
			assert.same(Object.getPrototypeOf(fn), null, "has null __proto__");
		});

        test("returnThis called via .call", function (assert) {
            const thisValue = {};
            assert.same(fn.returnThis.call(thisValue), thisValue, 
                "returnThis.call(x) === x");
            assert.same(fn.returnThis.call(thisValue, "foo"), thisValue, 
                "returnThis.call(x, 'foo') === x");
        });

        test("returnThis called as method", function (assert) {
            assert.same(fn.returnThis(), fn, "fn.returnThis() === fn");
            assert.same(fn.returnThis("foo"), fn, "fn.returnThis('foo') === fn");

            const o = { f: fn.returnThis };
            assert.same(o.f(), o, "o.returnThis() === o");
            assert.same(o.f("foo"), o, "o.returnThis('foo') === o");
        });

        skip("returnThis called \"freely\"", function (assert) {
            const f = fn.returnThis;
            const thisValue = this;
            assert.same(f(), thisValue, "returnThis() === this");
            assert.same(f("bar"), thisValue, "returnThis('bar') === this");
        });

    }); // end module "fn"

}); // end require