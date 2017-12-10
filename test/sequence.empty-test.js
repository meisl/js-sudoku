require(["scripts/sequence"], function(Sequence) {

    QUnit.module("sequence.empty"); // ----------------------------------------

    QUnit.test("", function(assert) {
        let s = Sequence.empty;
        assert.isIterable(s, "empty");
        assert.equal(s.length, 0, "empty.length");
        assert.all.strictEqual(s, [], "empty");
    });
        
    QUnit.test("cannot overwrite .empty", function(assert) {
        let s = Sequence.empty;        Sequence.empty = {};
        assert.strictEqual(Sequence.empty, s, 
            "empty should not be mutable");
    });

    QUnit.test(".toString", function(assert) {
        let s = Sequence.empty;
        assert.equal(s.toString(), "<>");
    });

    QUnit.test(".first, .map, .filter", function(assert) {
        let s = Sequence.empty;

        assert.throws(() => s.first(), /empty/, "empty.first() should throw");

        assert.all.strictEqual(s.map(x => "" + x), [], 
            "empty.map(x => \"\" + x)");
        assert.all.strictEqual(s.filter(x => x < 0), [], 
            "empty.filter(x => x < 0)");

        //assert.all.strictEqual(s.cons(5).cons(6).snoc(7), [6,"5",7], 
        //    "empty.cons(5).cons(6)");
    });

    QUnit.todo(".map, .filter etc should return same thing", function(assert) {
        let s = Sequence.empty;
        
        assert.strictEqual(s.map(x => "" + x), s, 
            "empty.map(..) should return same thing");
        assert.strictEqual(s.filter(x => x < 0), s, 
            "empty.filter(..) should return same thing");
    });

    QUnit.test(".cons", function(assert) {
        let s = Sequence.empty;

        assert.strictEqual(s.cons(5).length, 1, "empty.cons(..).length");
        assert.all.strictEqual(s.cons(5),           [5],
            "empty.cons(5)");
        assert.all.strictEqual(s.cons(5).cons(6), [6,5],
            "empty.cons(5).cons(6)");
    });

    QUnit.test(".snoc", function(assert) {
        let s = Sequence.empty.snoc(5);
        assert.strictEqual(s.length, 1, "empty.snoc(..).length");
        assert.all.strictEqual(s,         [5],   "empty.snoc(5)");
        assert.all.strictEqual(s.snoc(6), [5,6], "empty.snoc(5).snoc(6)");
    });

    QUnit.test(".snoc.cons", function(assert) {
        let s = Sequence.empty.snoc(5).cons(6);
        assert.strictEqual(s.length, 2, "empty.snoc(5).cons(6).length");
        assert.all.strictEqual(s, [6,5], "empty.snoc(5).cons(6)");
    });

    QUnit.test(".cons.snoc", function(assert) {
        let s = Sequence.empty.cons(5).snoc(6);
        assert.strictEqual(s.length, 2, "empty.cons(5).snoc(6).length");
        assert.all.strictEqual(s, [5,6], "empty.cons(5).snoc(6)");
    });


});