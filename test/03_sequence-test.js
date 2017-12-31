require(["scripts/sequence"], (seq) => {
	const { test, todo, skip, module } = QUnit;

	module("seq", () => { // ------------------------------------------
		test("module object", function (assert) {
			assert.same(Object.getPrototypeOf(seq), null, "has null __proto__");
			assert.isFunction(seq.create, "seq.create");
		});

		test("from empty Array", function (assert) {
			let foo = {
				"bar": () => {}
			};
			assert.isFunction(foo.bar);

			let inner = [];
			let s = seq.create(inner);

			assert.all.same(s, inner);

			inner.push(1984);
			assert.same(inner.length, 1, "underlying array was pushed");
			assert.all.same(s, inner, "seq after mutating underlying iterable");
		});

		test("from singleton Array", function (assert) {
			let inner = [42];
			let s = seq.create(inner);

			assert.all.same(s, inner);

			inner.push(1984);
			assert.same(inner.length, 2, "underlying array was pushed");
			assert.all.same(s, inner, "seq after mutating underlying iterable");

			inner.shift();
			assert.same(inner.length, 1, "underlying array was shifted");
			assert.all.same(s, inner, "seq after mutating underlying iterable");

		});

		test("from larger Array", function (assert) {
			let inner = [2,1,3];
			let s = seq.create(inner);
			assert.all.same(s, inner);

			inner.push(1984);
			assert.same(inner.length, 4, "underlying array was pushed");
			assert.all.same(s, inner, "seq after mutating underlying iterable");

			inner.shift();
			assert.same(inner.length, 3, "underlying array was shifted");
			assert.all.same(s, inner, "seq after mutating underlying iterable");
		});

		module(".toString", () => { // ---------------------------------------------------
			test("from empty Array", function (assert) {
				let s = seq.create([]);
				assert.same(s.toString(), "<>");
			});

			test("with simple values", function (assert) {
				let s;
				s = seq.create([42]);
				assert.same(s.toString(), "<42>");
				s = seq.create(["abc"]);
				assert.same(s.toString(), "<abc>");
				s = seq.create(["abc", 4711]);
				assert.same(s.toString(), "<abc,4711>");
			});

			test("seq of seqs", function (assert) {
				let s;
				s = seq.create([seq.create([]), seq.create([1,2,3])]);
				assert.same(s.toString(), "<<>,<1,2,3>>");
				s = seq.create([seq.create([seq.create([1,2,3])]), seq.create(["a", "b", "c"])]);
				assert.same(s.toString(), "<<<1,2,3>>,<a,b,c>>");
			});

			test("seq of arrays", function (assert) {
				let s;
				s = seq.create([[], [1,2,3]]);
				assert.same(s.toString(), "<[],[1,2,3]>");
				s = seq.create([[seq.create([1,2,3])]]);
				assert.same(s.toString(), "<[<1,2,3>]>");
			});

			test("seq of objects", function (assert) {
				let s;
				s = seq.create([{ foo: "bar", x: 42 }]);
				assert.same(s.toString(), "<{foo: bar, x: 42}>");
				s = seq.create([{ foo: "bar", x: { y: 42 } }]);
				assert.same(s.toString(), "<{foo: bar, x: {y: 42}}>",
					"should apply recursively");
				s = seq.create([{ foo: "bar", x: { y: seq.create([42]) }}]);
				assert.same(s.toString(), "<{foo: bar, x: {y: <42>}}>",
					"should apply recursively");
				s = seq.create([{ foo: "bar", x: { y: [42] }}]);
				assert.same(s.toString(), "<{foo: bar, x: {y: [42]}}>",
					"should apply recursively");
			});

			test("seq of array of objects", function (assert) {
				let s;
				s = seq.create([[{ foo: "bar", x: seq.create([42]) }]]);
				assert.same(s.toString(), "<[{foo: bar, x: <42>}]>",
					"should apply recursively");
			});
		}); // end module ".toString"
		
		module(".map", () => { // ---------------------------------------------------
			function test_map(title, inner, mapFn) {
				test(".map " + title, function (assert) {
					let s = seq.create(inner).map(mapFn);
					let expected = [...inner].map(mapFn);

					assert.all.same(s, expected);
				});
			}

			test_map("from Array", [2, 1, 3], x => x + 1);
			test_map("from Array, using index arg in callback", [2, 1, 3], (x,i) => i + ": " + x);

			test(".map.map from Array", function (assert) {
				let orig = [2, 1, 3];
				let f1 = x => x + 1;
				let f2 = x => x + "|" + x;
				let s = seq.create(orig).map(f1).map(f2);
				let expected = orig.map(f1).map(f2);

				assert.all.same(s, expected);
			});
		}); // end module ".map"

		module(".filter", () => { // ---------------------------------------------------
			function test_filter(title, inner, predicateFn) {
				test(".filter " + title, function (assert) {
					let s = seq.create(inner).filter(predicateFn);
					let expected = [...inner].filter(predicateFn);

					assert.all.same(s, expected);
				});
			}

			test_filter("from Array", [2, 1, 4], x => (x % 2) === 0);
			test_filter("from Array, all elems filtered out", [2, 1, 4], x => false);
			test_filter("from Array, consecutive elems filtered out", [2, 1, 3, 4], x => (x % 2) === 0);
			test_filter("from Array, using index arg in callback", [2, 1, 3], (x,i) => (i % 2) === 0);

			test(".filter.filter from Array", function (assert) {
				let orig = [2, 1, 3, 4, 6, 8];
				let f1 = x => (x % 2) === 0;
				let f2 = (x, i) => (i % 2) === 0;
				let s = seq.create(orig).filter(f1).filter(f2);
				let expected = orig.filter(f1).filter(f2);

				assert.all.same(s, expected);
			});
		}); // end module ".filter"

		module(".forEach()", () => { // ------------------------------------
			function test_forEach(title, inner, thisValue) {
				test(title + "; " + arguments.length + " args", function (assert) {
					let s = seq.create(inner);
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
		}); // end module ".forEach"

		module(".head()", () => { // ------------------------------------
			test("from singleton Array", function (assert) {
				let s = seq.create([42]);
				assert.same(s.head(), 42, "should return the (only) value");
			});

			test("from larger Array", function (assert) {
				let s = seq.create([42, 7, 5]);
				assert.same(s.head(), 42, "should return the first value");
			});

			test("from empty Array", function (assert) {
				let s = seq.create([]);
				assert.throws( () => s.head(), /empty/, "should throw");
			});

			test("from filtered Array (then empty)", function (assert) {
				let s = seq.create([42, 6]).filter(x => x < 0);
				assert.throws( () => s.head(), /empty/, "should throw");
			});

			test("from filtered (initially empty) Array", function (assert) {
				let s = seq.create([]).filter(x => x < 0);
				assert.throws( () => s.head(), /empty/, "should throw");
			});

			test("from filtered Array (then non-empty)", function (assert) {
				let s = seq.create([42, -6, -5, 72]).filter(x => x < 0);
				assert.same(s.head(), -6);
			});

			test("from mapped (initially empty) Array", function (assert) {
				let s = seq.create([]).map(x => x + 1);
				assert.throws( () => s.head(), /empty/, "should throw");
			});

			test("from mapped Array", function (assert) {
				let s = seq.create([42, -6, -5, 72]).map(x => x + 1);
				assert.same(s.head(), 43);
			});

			test("from mapped, then filtered Array (then empty)", function (assert) {
				let s = seq.create([42, -1, 0, 6]).map(x => x + 1).filter(x => x < 0);
				assert.throws( () => s.head(), /empty/, "should throw");
			});

			test("from mapped, then filtered Array (then non-empty)", function (assert) {
				let s = seq.create([42, -1, 0, -6, -5, 72]).map(x => x + 1).filter(x => x < 0);
				assert.same(s.head(), -5);
			});
		}); // end module ".head"

		module(".cons", () => { // ------------------------------------
			test("from empty Array", function (assert) {
				let s = seq.create([]).cons(42);
				assert.all.same(s, [42], "seq.create([]).cons(42)");
			});

			test("from non-empty Array", function (assert) {
				let s = seq.create([74, 4711]);
				assert.all.same(s.cons(42), [42, 74, 4711],
					"seq.create([74, 4711]).cons(42)");
			});
		}); // end module ".cons"

		module(".snoc", () => { // ------------------------------------
			test("from empty Array", function (assert) {
				let s = seq.create([]).snoc(42);
				assert.all.same(s, [42], "seq.create([]).snoc(42)");
			});

			test("from non-empty Array", function (assert) {
				let s = seq.create([74, 4711]);
				assert.all.same(s.snoc(42), [74, 4711, 42],
					"seq.create([74, 4711]).snoc(42)");
			});
		}); // end module ".snoc"

		module(".skip", () => { // -----------------------------------
			test("with invalid n", function (assert) {
				[[], [4711]].forEach(a => {
					let s = seq.create([]);
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

			test("from empty Array", function (assert) {
				let s = seq.create([]);
				assert.all.same(s.skip(0), []);
				assert.all.same(s.skip(1), []);
				assert.all.same(s.skip(2), []);
				assert.all.same(s.skip(3), []);
			});

			test("from non-empty Array", function (assert) {
				let s = seq.create([42, 4711]);
				assert.all.same(s.skip(0), [42, 4711]);
				assert.all.same(s.skip(1), [4711]);
				assert.all.same(s.skip(2), []);
				assert.all.same(s.skip(3), []);
			});

			test("from empty Array, with ridiculously large n", function (assert) {
				let s = seq.create([]);
				assert.all.same(s.skip(1 << 26), []);
			});

			test("from non-empty Array, with ridiculously large n", function (assert) {
				let s = seq.create([42, 4711]);
				assert.all.same(s.skip(1 << 26), []);
			});
		}); // end module ".skip"

		module(".take", () => { // ----------------------------------
			test("with invalid argument n", function(assert) {
				[[], [4711]].forEach(a => {
					let s = seq.create([]);
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

			test("from empty Array", function (assert) {
				let s = seq.create([]);
				assert.all.same(s.take(0), []);
				assert.all.same(s.take(1), []);
				assert.all.same(s.take(2), []);
				assert.all.same(s.take(3), []);

				assert.all.same(s.take(0).take(1), []);
				assert.all.same(s.take(2).take(1), []);
				assert.all.same(s.take(1).take(2), []);
			});

			test("from non-empty Array", function (assert) {
				let s = seq.create([42, 4711, 1974]);
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

			test("from empty Array, with ridiculously large n", function (assert) {
				let s = seq.create([]);
				assert.all.same(s.take(1 << 26), []);
			});

			test("from non-empty Array, with ridiculously large n", function (assert) {
				let s = seq.create([42, 4711]);
				assert.all.same(s.take(1 << 26), [42, 4711]);
			});

			test("on infinite sequence", function (assert) {
				const inner = { [Symbol.iterator]: function* () {
					while (true)
						yield 42;
				} };
				const s = seq.create(inner);
				assert.same(s.take(0), seq.empty, ".take(0)");
				assert.all.same(s.take(5), [42,42,42,42,42], "take(5)");
			});
		}); // end module ".take"

		module(".mapMany", () => { // ---------------------------------
			test("with invalid function argument", function (assert) {
				[[], [4711]].forEach(a => {
					let s = seq.create([]);
					assert.throws(() => s.mapMany(), /invalid/, ".mapMany() should throw");
					assert.throws(() => s.mapMany(null), /invalid/, ".mapMany(null) should throw");
					assert.throws(() => s.mapMany(-1), /invalid/, ".mapMany(-1) should throw");
					assert.throws(() => s.mapMany(-42), /invalid/, ".mapMany(-42) should throw");
				});
			});

			test("from empty Array", function (assert) {
				let s = seq.create([]);
				function* f(x) { 
					for (let i = 0; i < x; i++) yield x;
				}

				assert.all.same(s.mapMany(f), []);
			});

			test("from non-empty Array with generator fn", function (assert) {
				let s = seq.create([3,2,0,1]);
				function* f(x) { 
					for (let i = 0; i < x; i++) yield x;
				}

				assert.all.same(s.mapMany(f), [3,3,3,2,2,1]);
			});

			test("from Array of Arrays", function (assert) {
				let parts = [[],[1,2],[],[3],[4,5]];
				let s = seq.create(parts.map((_,i) => i));
				assert.same("" + [...s.values], "" + [0, 1, 2, 3, 4],
					"should be seq of indices into parts");
				assert.all.same(s.mapMany(i => parts[i]), [1,2,3,4,5]);
			});
		}); // end module ".mapMany"

		module(".append", () => { // ---------------------------------
			test("elem traversal", function (assert) {
				let s,t;
				
				s = seq.create([1,2,3]);
				t = seq.create([4,5]);
				assert.all.same(s.append(t), [1,2,3,4,5]);
				assert.all.same(t.append(s), [4,5,1,2,3]);

				t = seq.create([]);
				assert.all.same(s.append(t), [1,2,3]);
				assert.all.same(t.append(s), [1,2,3]);

				t = seq.create([4]);
				assert.all.same(s.append(t), [1,2,3,4]);
				assert.all.same(t.append(s), [4,1,2,3]);

				s = seq.create([]);
				t = seq.create([]);
				assert.all.same(s.append(t), []);
				assert.all.same(t.append(s), []);

				t = seq.create([4]);
				assert.all.same(s.append(t), [4]);
				assert.all.same(t.append(s), [4]);
			});
		}); // end module ".append"

		module(".fromGeneratorFn", () => { // ---------------------------------
			test("elem traversal", function (assert) {
				function* f() {
					yield 1;
					yield 2;
					yield 3;
				}
				let s = seq.fromGeneratorFn(f);

				assert.all.same(s, [1,2,3], "1st traversal");
				assert.all.same(s, [1,2,3], "2nd traversal");

			});
		}); // end module "fromGeneratorFn"

		module(".iterate", () => { // -------------------------------
			test("with 1 arg", function (assert) {
				let calls = [];
				const f = function (...args) {
					calls.push({args: [...args], this: this});
					return calls.length;
				};
				let s = seq.iterate(f);
				let act = [...s.take(3)];
				assert.same(calls.length, 3, "call count");
				assert.all.same(act, [1,2,3], "values returned from fn");
				assert.all.same(calls[0].args, [], "args @ 1st call");
				assert.all.same(calls[1].args, [], "args @ 2nd call");
				assert.all.same(calls[2].args, [], "args @ 3rd call");
			});
			test("with 2 args", function (assert) {
				const calls = [],
				      f = function (...args) {
				          calls.push({args: [...args], this: this});
				          return args[0] + 1;
				      };
				let s = seq.iterate(0, f);
				let act = [...s.take(3)];
				assert.same(calls.length, 2, "call count");
				assert.all.same(calls[0].args, [0], "args @ 1st call");
				assert.all.same(calls[1].args, [1], "args @ 2nd call");
				assert.all.same(act, [0,1,2], "values in result sequence");
			});
			test("with 3 args", function (assert) {
				const calls = [],
				      f = function (...args) {
				          calls.push({args: [...args], this: this});
				          return args[0] + args[1];
				      };
				let s = seq.iterate(1, 1, f);
				let act = [...s.take(5)];
				assert.same(calls.length, 3, "call count");
				assert.all.same(calls[0].args, [1,1], "args @ 1st call");
				assert.all.same(calls[1].args, [1,2], "args @ 2nd call");
				assert.all.same(calls[2].args, [2,3], "args @ 3rd call");
				assert.all.same(act, [1,1,2,3,5], "values in result sequence");
			});
		});	// end module "iterate"

		module(".range", () => { // ---------------------------------
			test("elem traversal", function (assert) {
				let s;
				s = seq.range(0, 0);
				assert.same(s.length, 1, "range(0, 0).length");
				assert.same(s.length, 1, 
					"range(0, 0).length, again (2nd traversal!)");
				assert.all.same(s, [0]);

				s = seq.range(0, 9);
				assert.same(s.length, 10, "range(0, 9).length");
				assert.same(s.length, 10, 
					"range(0, 9).length, again (2nd traversal!)");
				assert.all.same(s, [0, 1, 2, 3, 4, 5, 6,7, 8, 9]);
				
				s = seq.range(0, -1);
				assert.same(s.length, 0, "range(0, -1).length");
				assert.same(s.length, 0, 
					"range(0, -1).length, again (2nd traversal!)");
				assert.all.same(s, []);
			});
			skip("with infinite upper bound", function (assert) {
				let s;
				s = seq.range(42, Infinity);
				assert.same(s.length, Infinity, "range(42, Infinity).length");
			});
		}); // end module "range"

	}); // end module "seq"
}); // end require