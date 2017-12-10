require(["scripts/sequence"], function(Sequence) {

    QUnit.module("sequence.empty"); // ----------------------------------------

    QUnit.test("", function(assert) {
        let s = Sequence.empty;
        assert.isIterable(s, "empty");
        assert.equal(s.length, 0, "empty.length");
        assert.all.same(s, [], "empty");
    });
        
    QUnit.test("cannot overwrite .empty", function(assert) {
        let s = Sequence.empty;        Sequence.empty = {};
        assert.same(Sequence.empty, s, 
            "empty should not be mutable");
    });

    QUnit.test(".toString", function(assert) {
        let s = Sequence.empty;
        assert.same(s.toString(), "<>");
    });

    QUnit.test(".first, .map, .filter", function(assert) {
        let s = Sequence.empty;

        assert.throws(() => s.first(), /empty/, "empty.first() should throw");

        assert.all.same(s.map(x => "" + x), [], 
            "empty.map(x => \"\" + x)");
        assert.all.same(s.filter(x => x < 0), [], 
            "empty.filter(x => x < 0)");
    });

    QUnit.todo(".map, .filter etc should return same thing", function(assert) {
        let s = Sequence.empty;
        
        assert.same(s.map(x => "" + x), s, 
            "empty.map(..) should return same thing");
        assert.same(s.filter(x => x < 0), s, 
            "empty.filter(..) should return same thing");
    });

    QUnit.test(".cons", function(assert) {
        let s = Sequence.empty;

        assert.same(s.cons(5).length, 1, "empty.cons(..).length");
        assert.all.same(s.cons(5),           [5],
            "empty.cons(5)");
        assert.all.same(s.cons(5).cons(6), [6,5],
            "empty.cons(5).cons(6)");
    });

    QUnit.test(".snoc", function(assert) {
        let s = Sequence.empty.snoc(5);
        assert.same(s.length, 1, "empty.snoc(..).length");
        assert.all.same(s,         [5],   "empty.snoc(5)");
        assert.all.same(s.snoc(6), [5,6], "empty.snoc(5).snoc(6)");
    });

    QUnit.test(".snoc.cons", function(assert) {
        let s = Sequence.empty.snoc(5).cons(6);
        assert.same(s.length, 2, "empty.snoc(5).cons(6).length");
        assert.all.same(s, [6,5], "empty.snoc(5).cons(6)");
    });

    QUnit.test(".cons.snoc", function(assert) {
        let s = Sequence.empty.cons(5).snoc(6);
        assert.same(s.length, 2, "empty.cons(5).snoc(6).length");
        assert.all.same(s, [5,6], "empty.cons(5).snoc(6)");
    });


});