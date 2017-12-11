require(["scripts/fn"], function(fn) {

    QUnit.module("fn"); // ----------------------------------------

    QUnit.test("returnThis", function (assert) {
        assert.isFunction(fn.returnThis, "fn.returnThis");
        assert.same(fn.returnThis("foo"), fn, "fn.thisValue('foo') === fn");
        const thisValue = {};
        assert.same(fn.returnThis.call(thisValue), thisValue, "thisValue.call(x) === x");
        const f = fn.returnThis;
        assert.same(f(), this, "thisValue() === this");
        assert.same(f("bar"), this, "thisValue('bar') === this");
    });
});