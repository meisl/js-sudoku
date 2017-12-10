require(["scripts/sequence"], function(Sequence) {


	QUnit.module("sequence"); // ------------------------------------------
    
    QUnit.test("from empty Array", function(assert) {
        let inner = [];
        let s = new Sequence(inner);
        
        assert.all.same(s, inner);

        inner.push(1984);
        assert.same(inner.length, 1, "underlying array was pushed");
        assert.all.same(s, inner, "sequence after mutating underlying iterable");
    });

    QUnit.test("from singleton Array", function(assert) {
        let inner = [42];
        let s = new Sequence(inner);
        
        assert.all.same(s, inner);

        inner.push(1984);
        assert.same(inner.length, 2, "underlying array was pushed");
        assert.all.same(s, inner, "sequence after mutating underlying iterable");

        inner.shift();
        assert.same(inner.length, 1, "underlying array was shifted");
        assert.all.same(s, inner, "sequence after mutating underlying iterable");

    });

    QUnit.test("from larger Array", function(assert) {
        let inner = [2,1,3];
        let s = new Sequence(inner);
        assert.all.same(s, inner);

        inner.push(1984);
        assert.same(inner.length, 4, "underlying array was pushed");
        assert.all.same(s, inner, "sequence after mutating underlying iterable");

        inner.shift();
        assert.same(inner.length, 3, "underlying array was shifted");
        assert.all.same(s, inner, "sequence after mutating underlying iterable");
    });


    QUnit.module("sequence.toString"); // ---------------------------------------------------

    QUnit.test("from empty Array", function (assert) {
        let s = new Sequence([]);
        assert.same(s.toString(), "<>");
    });

    QUnit.test("with simple values", function (assert) {
        let s;
        s = new Sequence([42]);
        assert.same(s.toString(), "<42>");
        s = new Sequence(["abc"]);
        assert.same(s.toString(), "<abc>");
        s = new Sequence(["abc", 4711]);
        assert.same(s.toString(), "<abc,4711>");
    });

    QUnit.test("sequence of sequences", function (assert) {
        let s;
        s = new Sequence([new Sequence([]), new Sequence([1,2,3])]);
        assert.same(s.toString(), "<<>,<1,2,3>>");
        s = new Sequence([new Sequence([new Sequence([1,2,3])]), new Sequence(["a", "b", "c"])]);
        assert.same(s.toString(), "<<<1,2,3>>,<a,b,c>>");
    });

    QUnit.test("sequence of arrays", function (assert) {
        let s;
        s = new Sequence([[], [1,2,3]]);
        assert.same(s.toString(), "<[],[1,2,3]>");
        s = new Sequence([[new Sequence([1,2,3])]]);
        assert.same(s.toString(), "<[<1,2,3>]>");
    });

    QUnit.test("sequence of objects", function (assert) {
        let s;
        s = new Sequence([{ foo: "bar", x: 42 }]);
        assert.same(s.toString(), "<{foo: bar, x: 42}>");
        s = new Sequence([{ foo: "bar", x: { y: 42 } }]);
        assert.same(s.toString(), "<{foo: bar, x: {y: 42}}>",
            "should apply recursively");
        s = new Sequence([{ foo: "bar", x: { y: new Sequence([42]) }}]);
        assert.same(s.toString(), "<{foo: bar, x: {y: <42>}}>",
            "should apply recursively");
        s = new Sequence([{ foo: "bar", x: { y: [42] }}]);
        assert.same(s.toString(), "<{foo: bar, x: {y: [42]}}>",
            "should apply recursively");
    });

    QUnit.test("sequence of array of objects", function (assert) {
        let s;
        s = new Sequence([[{ foo: "bar", x: new Sequence([42]) }]]);
        assert.same(s.toString(), "<[{foo: bar, x: <42>}]>",
            "should apply recursively");
    });

    QUnit.module("sequence.map"); // ---------------------------------------------------

    function test_map(title, inner, mapFn) {
        QUnit.test(".map " + title, function(assert) {
            let s = new Sequence(inner).map(mapFn);
            let expected = [...inner].map(mapFn);

            assert.all.same(s, expected);
        });
    }

    test_map("from Array, using index arg in callback", [2, 1, 3], (x,i) => i + ": " + x);
    test_map("from Array", [2, 1, 3], x => x + 1);

    QUnit.test(".map.map from Array", function(assert) {
        let orig = [2, 1, 3];
        let f1 = x => x + 1;
        let f2 = x => x + "|" + x;
        let s = new Sequence(orig).map(f1).map(f2);
        let expected = orig.map(f1).map(f2);

        assert.all.same(s, expected);
    });


    QUnit.module("sequence.filter"); // ---------------------------------------------------

    function test_filter(title, inner, predicateFn) {
        QUnit.test(".filter " + title, function(assert) {
            let s = new Sequence(inner).filter(predicateFn);
            let expected = [...inner].filter(predicateFn);

            assert.all.same(s, expected);
        });
    }

    test_filter("from Array", [2, 1, 4], x => (x % 2) === 0);
    test_filter("from Array, all elems filtered out", [2, 1, 4], x => false);
    test_filter("from Array, consecutive elems filtered out", [2, 1, 3, 4], x => (x % 2) === 0);
    test_filter("from Array, using index arg in callback", [2, 1, 3], (x,i) => (i % 2) === 0);

    QUnit.test(".filter.filter from Array", function(assert) {
        let orig = [2, 1, 3, 4, 6, 8];
        let f1 = x => (x % 2) === 0;
        let f2 = (x, i) => (i % 2) === 0;
        let s = new Sequence(orig).filter(f1).filter(f2);
        let expected = orig.filter(f1).filter(f2);

        assert.all.same(s, expected);
    });


    QUnit.module("sequence.forEach()"); // ------------------------------------

    function test_forEach(title, inner, thisValue) {
        QUnit.test(title + " args.length=" + arguments.length, function(assert) {
            let s = new Sequence(inner);
            function makeRecordingFn(targetArray) {
                return function (v, i) {
                    targetArray.push({ this: this, value: v, index: i });
                }
            };
            // let's say it should behave like Array.prototype.forEach
            // i.e.: if thisValue parameter is passed but undefined, then `this`
            //       in the callback will be dynamically scoped (probably global object)
            let expected = [];
            if (arguments.length == 2) {
                [...inner].forEach(makeRecordingFn(expected));
            } else {
                [...inner].forEach(makeRecordingFn(expected), thisValue);
            }
            
            // act
            let actual = [];
            if (arguments.length == 2) {
                s.forEach(makeRecordingFn(actual));
            } else {
                s.forEach(makeRecordingFn(actual), thisValue);
            }
            
            // assert
            assert.same(actual.length, expected.length, 
                "callback should have been called " + expected.length + " times");
            
            expected.forEach( (exp, i) => {
                let act = actual[i];
                assert.same(act.this, exp.this, "call #" + i + ": thisValue");
                assert.same(act.value, exp.value, "call #" + i + ": 1st arg (value)");
                assert.same(act.index, exp.index, "call #" + i + ": 2nd arg (index)");
            });
        });
    }

    test_forEach("from Array", [2, 1, 3]);
    test_forEach("from Array, with thisValue = undefined", ["2", { foo: 1}, 3], undefined);
    test_forEach("from Array, with thisValue = some object", ["2", { foo: 1}, 3], { i_am_this: {}});


    QUnit.module("sequence.first()"); // ------------------------------------

    QUnit.test("from singleton Array", function(assert){
        let s = new Sequence([42]);
        assert.same(s.first(), 42, "should return the (only) value");
    });

    QUnit.test("from larger Array", function(assert){
        let s = new Sequence([42, 7, 5]);
        assert.same(s.first(), 42, "should return the first value");
    });

    QUnit.test("from empty Array", function(assert){
        let s = new Sequence([]);
        assert.throws( () => s.first(), /empty/, "should throw");
    });

    QUnit.test("from filtered Array (then empty)", function(assert){
        let s = new Sequence([42, 6]).filter(x => x < 0);
        assert.throws( () => s.first(), /empty/, "should throw");
    });

    QUnit.test("from filtered (initially empty) Array", function(assert){
        let s = new Sequence([]).filter(x => x < 0);
        assert.throws( () => s.first(), /empty/, "should throw");
    });
    
    QUnit.test("from filtered Array (then non-empty)", function(assert){
        let s = new Sequence([42, -6, -5, 72]).filter(x => x < 0);
        assert.same(s.first(), -6);
    });

    QUnit.test("from mapped (initially empty) Array", function(assert){
        let s = new Sequence([]).map(x => x + 1);
        assert.throws( () => s.first(), /empty/, "should throw");
    });
    
    QUnit.test("from mapped Array", function(assert){
        let s = new Sequence([42, -6, -5, 72]).map(x => x + 1);
        assert.same(s.first(), 43);
    });

    QUnit.test("from mapped, then filtered Array (then empty)", function(assert){
        let s = new Sequence([42, -1, 0, 6]).map(x => x + 1).filter(x => x < 0);
        assert.throws( () => s.first(), /empty/, "should throw");
    });

    QUnit.test("from mapped, then filtered Array (then non-empty)", function(assert){
        let s = new Sequence([42, -1, 0, -6, -5, 72]).map(x => x + 1).filter(x => x < 0);
        assert.same(s.first(), -5);
    });


    QUnit.module("sequence.cons()"); // ------------------------------------

    QUnit.test("from empty Array", function(assert) {
        let s = new Sequence([]).cons(42);
        assert.all.same(s, [42], "new Sequence([]).cons(42)");
    });

    QUnit.test("from non-empty Array", function(assert) {
        let s = new Sequence([74, 4711]);
        assert.all.same(s.cons(42), [42, 74, 4711],
            "new Sequence([74, 4711]).cons(42)");
    });
    

    QUnit.module("sequence.snoc()"); // ------------------------------------

    QUnit.test("from empty Array", function(assert) {
        let s = new Sequence([]).snoc(42);
        assert.all.same(s, [42], "new Sequence([]).snoc(42)");
    });

    QUnit.test("from non-empty Array", function(assert) {
        let s = new Sequence([74, 4711]);
        assert.all.same(s.snoc(42), [74, 4711, 42],
            "new Sequence([74, 4711]).snoc(42)");
    });


    QUnit.module("sequence.skip()"); // -----------------------------------

    QUnit.test("with invalid n", function(assert) {
        [[], [4711]].forEach(a => {
            let s = new Sequence([]);
            assert.throws(() => s.skip(), /invalid/, ".skip() should throw");
            assert.throws(() => s.skip(null), /invalid/, ".skip(null) should throw");
            assert.throws(() => s.skip(-1), /invalid/, ".skip(-1) should throw");
            assert.throws(() => s.skip(-42), /invalid/, ".skip(-42) should throw");
            assert.throws(() => s.skip(Number.NaN),
                /invalid/, ".skip(Number.NaN) should throw");
            assert.throws(() => s.skip(Number.POSITIVE_INFINITY), 
                /invalid/, ".skip(Number.POSITIVE_INFINITY) should throw");
            assert.throws(() => s.skip(Number.NEGATIVE_INFINITY), 
                /invalid/, ".skip(Number.NEGATIVE_INFINITY) should throw");
        });
    });

    QUnit.test("from empty Array", function(assert) {
        let s = new Sequence([]);
        assert.all.same(s.skip(0), []);
        assert.all.same(s.skip(1), []);
        assert.all.same(s.skip(2), []);
        assert.all.same(s.skip(3), []);
    });

    QUnit.test("from non-empty Array", function(assert) {
        let s = new Sequence([42, 4711]);
        assert.all.same(s.skip(0), [42, 4711]);
        assert.all.same(s.skip(1), [4711]);
        assert.all.same(s.skip(2), []);
        assert.all.same(s.skip(3), []);
    });

    QUnit.test("from empty Array, with ridiculously large n", function(assert) {
        let s = new Sequence([]);
        assert.all.same(s.skip(1 << 26), []);
    });

    QUnit.test("from non-empty Array, with ridiculously large n", function(assert) {
        let s = new Sequence([42, 4711]);
        assert.all.same(s.skip(1 << 26), []);
    });


    QUnit.module("sequence.take()"); // ----------------------------------

    QUnit.test("with invalid argument n", function(assert) {
        [[], [4711]].forEach(a => {
            let s = new Sequence([]);
            assert.throws(() => s.take(), /invalid/, ".take() should throw");
            assert.throws(() => s.take(null), /invalid/, ".take(null) should throw");
            assert.throws(() => s.take(-1), /invalid/, ".take(-1) should throw");
            assert.throws(() => s.take(-42), /invalid/, ".take(-42) should throw");
            assert.throws(() => s.take(Number.NaN),
                /invalid/, ".take(Number.NaN) should throw");
            assert.throws(() => s.take(Number.POSITIVE_INFINITY), 
                /invalid/, ".take(Number.POSITIVE_INFINITY) should throw");
            assert.throws(() => s.take(Number.NEGATIVE_INFINITY), 
                /invalid/, ".take(Number.NEGATIVE_INFINITY) should throw");
        });
    });

    QUnit.test("from empty Array", function(assert) {
        let s = new Sequence([]);
        assert.all.same(s.take(0), []);
        assert.all.same(s.take(1), []);
        assert.all.same(s.take(2), []);
        assert.all.same(s.take(3), []);

        assert.all.same(s.take(0).take(1), []);
        assert.all.same(s.take(2).take(1), []);
        assert.all.same(s.take(1).take(2), []);
    });

    QUnit.test("from non-empty Array", function(assert) {
        let s = new Sequence([42, 4711, 1974]);
        assert.all.same(s.take(0), []);
        assert.all.same(s.take(1), [42]);
        assert.all.same(s.take(2), [42, 4711]);
        assert.all.same(s.take(3), [42, 4711, 1974]);
        assert.all.same(s.take(4), [42, 4711, 1974]);

        assert.all.same(s.take(0).take(1), []);
        assert.all.same(s.take(2).take(0), []);
        assert.all.same(s.take(2).take(1), [42]);
        assert.all.same(s.take(1).take(2), [42]);
        assert.all.same(s.take(2).take(2), [42, 4711]);
    });

    QUnit.test("from empty Array, with ridiculously large n", function(assert) {
        let s = new Sequence([]);
        assert.all.same(s.take(1 << 26), []);
    });

    QUnit.test("from non-empty Array, with ridiculously large n", function(assert) {
        let s = new Sequence([42, 4711]);
        assert.all.same(s.take(1 << 26), [42, 4711]);
    });


    QUnit.module("sequence.mapMany()"); // ---------------------------------

    QUnit.test("with invalid function argument", function(assert) {
        [[], [4711]].forEach(a => {
            let s = new Sequence([]);
            assert.throws(() => s.mapMany(), /invalid/, ".mapMany() should throw");
            assert.throws(() => s.mapMany(null), /invalid/, ".mapMany(null) should throw");
            assert.throws(() => s.mapMany(-1), /invalid/, ".mapMany(-1) should throw");
            assert.throws(() => s.mapMany(-42), /invalid/, ".mapMany(-42) should throw");
        });
    });

    QUnit.test("from empty Array", function(assert) {
        let s = new Sequence([]);
        function* f(x) { 
            for (let i = 0; i < x; i++) yield x;
        }

        assert.all.same(s.mapMany(f), []);
    });

    QUnit.test("from non-empty Array with generator fn", function(assert) {
        let s = new Sequence([3,2,0,1]);
        function* f(x) { 
            for (let i = 0; i < x; i++) yield x;
        }

        assert.all.same(s.mapMany(f), [3,3,3,2,2,1]);
    });

    QUnit.test("from Array of Arrays", function(assert) {
        let parts = [[],[1,2],[],[3],[4,5]];
        let s = new Sequence(parts.map((_,i) => i));
        assert.same("" + [...s.values], "" + [0, 1, 2, 3, 4],
            "should be sequence of indices into parts");
        assert.all.same(s.mapMany(i => parts[i]), [1,2,3,4,5]);
    });


});