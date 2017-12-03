require(["scripts/sequence"], function(Sequence) {

	QUnit.module("sequence");

    function basicTest(assert, sq, expectedIterator, expectedLength) {
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

        let actualLength = -1;
        let expElem;
        do {
            expElem = expectedIterator.next();
            let e1 = it1.next();
            let e2 = it2.next();
            assert.strictEqual(e1.value, expElem.value, ".value (1)");
            assert.strictEqual(e1.done,  expElem.done,  ".done (1)");
            
            assert.strictEqual(e2.value, expElem.value, ".value (2)");
            assert.strictEqual(e2.done,  expElem.done,  ".done (2)");
            actualLength++;
        } while (!expElem.done);

        assert.equal(sq.length, expectedLength, "sequence.length");
        assert.equal(sq.size,   expectedLength, "sequence.size");
    }
    
    QUnit.test("from empty Array", function(assert) {
        let inner = [];
        let s = new Sequence(inner);
        basicTest(assert, s, inner[Symbol.iterator](), 0);

        inner.push(1984);
        assert.equal(inner.length, 1, "underlying array was pushed");
        assert.equal(s.length, 1, "sequence.length after mutating underlying iterable");
    });

    QUnit.test("from singleton Array", function(assert) {
        let inner = [42];
        let s = new Sequence(inner);
        basicTest(assert, s, inner[Symbol.iterator](), 1);

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
        basicTest(assert, s, inner[Symbol.iterator](), 3);

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
            let expected = [...inner].map(mapFn)[Symbol.iterator]();

            basicTest(assert, s, expected, 3);
        });
    }

    test_map("from Array", [2, 1, 3], x => x + 1);
    test_map("from Array, using index arg in callback", [2, 1, 3], (x,i) => i + ": " + x);


    function test_forEach(title, inner, thisValue) {
        QUnit.test(".forEach " + title + " args.length=" + arguments.length, function(assert) {
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

});