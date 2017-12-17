require(["scripts/sequence"], (seq) => {
	const { test, todo, skip, module } = QUnit;

	module("seq.singleton", () => { // ----------------------------------------
		test("module object", function (assert) {
			assert.isFunction(seq.singleton, "seq.singleton");
		});

		test("", function(assert) {
			let s = seq.singleton(42);
			assert.isIterable(s, "singleton");
			assert.same(s.length, 1, "singleton.length");
			assert.all.same(s, [42], "singleton");
		});

		test("cannot overwrite .singleton", function(assert) {
			let s = seq.singleton;
			seq.singleton = {};
			assert.same(seq.singleton, s, 
				"singleton should not be mutable");
		});

		test(".toString", function(assert) {
			let s = seq.singleton(42);
			assert.same(s.toString(), "<42>");
		});

		test(".length", function(assert) {
			let s = seq.singleton(42);
			assert.same(s.length, 1, "singleton(..).length");
		});

		module(".nth", () => {
			todo("with invalid arg", function(assert) {
				let s = seq.singleton(42);
				assert.throws(() => s.nth(), /invalid/, "singleton(..).nth() should throw");
				assert.throws(() => s.nth("foo"), /invalid/, "singleton(..).nth('foo') should throw");
				assert.throws(() => s.nth(-1), /invalid/, "singleton(..).nth(-1) should throw");
			});
			todo("with valid arg", function(assert) {
				let s = seq.singleton(42);
				assert.same(s.nth(0), 42, "singleton(..).nth(0)");
				assert.throws(() => s.nth(1), /singleton/, "singleton(..).nth(1) should throw");
				assert.throws(() => s.nth(2), /singleton/, "singleton(..).nth(2) should throw");
			});
		}); // end module ".nth"

		test(".head()", function(assert) {
			let s = seq.singleton(42);
			assert.same(s.head(), 42, "singleton(..).head()");
		});

		module(".skip", () => { // ----------------------------------------
			test("with valid n", function(assert) {
				let s = seq.singleton(42);

				assert.same(s.skip(0), s, "singleton(..).skip(0) should return same thing");
				assert.same(s.skip(+0), s, "singleton(..).skip(+0) should return same thing");
				assert.same(s.skip(-0), s, "singleton(..).skip(-0) should return same thing");
				assert.same(s.skip(1), seq.empty, "singleton(..).skip(1) should return empty");
				assert.same(s.skip(2), seq.empty, "singleton(..).skip(2) should return empty");
			});
			
			test("with invalid n", function(assert) {
				let s = seq.singleton(42);

				assert.throws(() => s.skip(NaN), /invalid/, 
					"singleton(..).skip(NaN) should throw");
			});
		}); // end module ".skip"

		module(".take", () => { // ----------------------------------------
			test("with valid n", function(assert) {
				let s = seq.singleton(42);

				assert.same(s.take(0), seq.empty, "singleton(..).take(0) should return empty");
				assert.same(s.take(+0), seq.empty, "singleton(..).take(+0) should return empty");
				assert.same(s.take(-0), seq.empty, "singleton(..).take(-0) should return empty");
				assert.same(s.take(1), s, "singleton(..).take(1) should return same thing");
				assert.same(s.take(2), s, "singleton(..).take(2) should return same thing");
			});
			
			test("with invalid n", function(assert) {
				let s = seq.singleton(42);

				assert.throws(() => s.take(NaN), /invalid/, 
					"singleton(..).take(NaN) should throw");
			});
		}); // end module ".take"

		skip(".filter, .map, .mapMany", function(assert) {
			let s = seq.singleton(42);

			assert.same(s.filter(x => x < 0), s, 
				"singleton(..).filter(..) should return same thing");
			assert.same(s.map(x => "" + x), s, 
				"singleton(..).map(..) should return same thing");
			assert.same(s.mapMany(x => [x, x]), s, 
				"singleton(..).mapMany(..) should return same thing");
		});

		test(".cons", function(assert) {
			let s = seq.singleton(42);

			assert.same(s.cons(5).length, 2, "singleton(..).cons(..).length");
			assert.all.same(s.cons(5),           [5,42],
				"singleton(..).cons(5)");
			assert.all.same(s.cons(5).cons(6), [6,5,42],
				"singleton(..).cons(5).cons(6)");
		});

		test(".snoc", function(assert) {
			let s = seq.singleton(42).snoc(5);
			assert.same(s.length, 2, "singleton(..).snoc(..).length");
			assert.all.same(s,         [42,5],   "singleton(..).snoc(5)");
			assert.all.same(s.snoc(6), [42,5,6], "singleton(..).snoc(5).snoc(6)");
		});

		test(".snoc.cons", function(assert) {
			let s = seq.singleton(42).snoc(5).cons(6);
			assert.same(s.length, 3, "singleton(..).snoc(5).cons(6).length");
			assert.all.same(s, [6,42,5], "singleton(..).snoc(5).cons(6)");
		});

		test(".cons.snoc", function(assert) {
			let s = seq.singleton(42).cons(5).snoc(6);
			assert.same(s.length, 3, "singleton(..).cons(5).snoc(6).length");
			assert.all.same(s, [5,42,6], "singleton(..).cons(5).snoc(6)");
		});
	}); // end module "seq.empty"

}); // end require