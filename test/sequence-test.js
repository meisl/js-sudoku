require(["scripts/sequence"], function(Sequence) {

	QUnit.module("sequence");

    function basicTest(assert, sq, expected) {
        if (!Array.isArray(expected)) {
            throw "need expected values as an Array - got typeof " + expected;
        }
        assert.equal(typeof sq[Symbol.iterator], "function", 
            "typeof new Sequence([..])[Symbol.iterator]");
        let it1 = sq[Symbol.iterator]();
        assert.equal(typeof it1, "object", 
            "typeof returned iterator (1): " + it1);
        assert.equal(typeof it1.next, "function", 
            "typeof returned iterator's .next method' (1): " + it1.next);
        
        let it2 = sq[Symbol.iterator]();
        assert.equal(typeof it2, "object", 
            "typeof returned iterator (2): " + it2);
        assert.equal(typeof it2.next, "function", 
            "typeof returned iterator's .next method' (2): " + it2.next);

        assert.notStrictEqual(it1, it2, "should return new iterator on each call");

        let expectedLength = expected.length;
        assert.equal(sq.length, expectedLength, "sequence.length");
        assert.equal(sq.size,   expectedLength, "sequence.size");

        let expectedIterator = expected[Symbol.iterator]();
        let expElem;
        let index = 0;
        do {
            expElem = expectedIterator.next();
            let e1 = it1.next();
            let e2 = it2.next();
            assert.strictEqual(e1.value, expElem.value, ".value @ index" + index + " (a)");
            assert.strictEqual(e1.done,  expElem.done,  ".done @ index" + index + " (a)");
            
            assert.strictEqual(e2.value, expElem.value, ".value @ index" + index + " (b)");
            assert.strictEqual(e2.done,  expElem.done,  ".done @ index" + index + " (b)");
            index++;
        } while (!expElem.done);

    }
    
    QUnit.test("from empty Array", function(assert) {
        let inner = [];
        let s = new Sequence(inner);
        basicTest(assert, s, inner);

        inner.push(1984);
        assert.equal(inner.length, 1, "underlying array was pushed");
        assert.equal(s.length, 1, "sequence.length after mutating underlying iterable");
    });

    QUnit.test("from singleton Array", function(assert) {
        let inner = [42];
        let s = new Sequence(inner);
        basicTest(assert, s, inner);

        inner.push(1984);
        assert.equal(inner.length, 2, "underlying array was pushed");
        assert.equal(s.length, 2, "sequence.length after mutating underlying iterable");

        inner.shift();
        assert.equal(inner.length, 1, "underlying array was shifted");
        assert.equal(s.length, 1, "sequence.length after mutating underlying iterable");

    });

    QUnit.test("from larger Array", function(assert) {
        let inner = [2,1,3];
        let s = new Sequence(inner);
        basicTest(assert, s, inner);

        inner.push(1984);
        assert.equal(inner.length, 4, "underlying array was pushed");
        assert.equal(s.length, 4, "sequence.length after mutating underlying iterable");

        inner.shift();
        assert.equal(inner.length, 3, "underlying array was shifted");
        assert.equal(s.length, 3, "sequence.length after mutating underlying iterable");

    });

    function test_map(title, inner, mapFn) {
        QUnit.test(".map " + title, function(assert) {
            let s = new Sequence(inner).map(mapFn);
            let expected = [...inner].map(mapFn);

            basicTest(assert, s, expected);
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

        basicTest(assert, s, expected);
    });

    function test_filter(title, inner, predicateFn) {
        QUnit.test(".filter " + title, function(assert) {
            let s = new Sequence(inner).filter(predicateFn);
            let expected = [...inner].filter(predicateFn);

            basicTest(assert, s, expected);
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

        basicTest(assert, s, expected);
    });


    QUnit.module("sequence.forEach()");

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
            assert.equal(actual.length, expected.length, 
                "callback should have been called " + expected.length + " times");
            
            expected.forEach( (exp, i) => {
                let act = actual[i];
                assert.strictEqual(act.this, exp.this, "call #" + i + ": thisValue");
                assert.strictEqual(act.value, exp.value, "call #" + i + ": 1st arg (value)");
                assert.strictEqual(act.index, exp.index, "call #" + i + ": 2nd arg (index)");
            });
        });
    }

    test_forEach("from Array", [2, 1, 3]);
    test_forEach("from Array, with thisValue = undefined", ["2", { foo: 1}, 3], undefined);
    test_forEach("from Array, with thisValue = some object", ["2", { foo: 1}, 3], { i_am_this: {}});


    QUnit.module("sequence.first()");

    QUnit.test("from singleton Array", function(assert){
        let s = new Sequence([42]);
        assert.equal(s.first(), 42, "should return the (only) value");
    });

    QUnit.test("from larger Array", function(assert){
        let s = new Sequence([42, 7, 5]);
        assert.equal(s.first(), 42, "should return the first value");
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
        assert.equal(s.first(), -6);
    });

    QUnit.test("from mapped (initially empty) Array", function(assert){
        let s = new Sequence([]).map(x => x + 1);
        assert.throws( () => s.first(), /empty/, "should throw");
    });
    
    QUnit.test("from mapped Array", function(assert){
        let s = new Sequence([42, -6, -5, 72]).map(x => x + 1);
        assert.equal(s.first(), 43);
    });

    QUnit.test("from mapped, then filtered Array (then empty)", function(assert){
        let s = new Sequence([42, -1, 0, 6]).map(x => x + 1).filter(x => x < 0);
        assert.throws( () => s.first(), /empty/, "should throw");
    });

    QUnit.test("from mapped, then filtered Array (then non-empty)", function(assert){
        let s = new Sequence([42, -1, 0, -6, -5, 72]).map(x => x + 1).filter(x => x < 0);
        assert.equal(s.first(), -5);
    });


    QUnit.module("sequence.cons()");

    QUnit.test("from empty Array", function(assert) {
        let s = new Sequence([]).cons(42);
        basicTest(assert, s, [42]);
    });

    QUnit.test("from non-empty Array", function(assert) {
        let s = new Sequence([74, 4711]).cons(42);
        basicTest(assert, s, [42, 74, 4711]);
    });


});