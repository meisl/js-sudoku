require(["scripts/sequence"], (seq) => {
	const { test, todo, skip, module } = QUnit;

	module("seq.empty", () => { // ----------------------------------------
		test("module object", function (assert) {
			assert.isObject(seq.empty, "seq.empty");
		});

		test("", function(assert) {
			let s = seq.empty;
			assert.isIterable(s, "empty");
			assert.same(s.length, 0, "empty.length");
			assert.all.same(s, [], "empty");
		});

		test("cannot overwrite .empty", function(assert) {
			let s = seq.empty;
			seq.empty = {};
			assert.same(seq.empty, s, 
				"empty should not be mutable");
		});

		test(".toString", function(assert) {
			let s = seq.empty;
			assert.same(s.toString(), "<>");
		});

		module(".nth", () => {
			todo("with valid arg", function(assert) {
				let s = seq.empty;
				assert.throws(() => s.nth(), /invalid/, "empty.nth() should throw");
				assert.throws(() => s.nth("foo"), /invalid/, "empty.nth() should throw");
				assert.throws(() => s.nth(-1), /invalid/, "empty.nth(-1) should throw");
			});
			todo("with invalid arg", function(assert) {
				let s = seq.empty;
				assert.throws(() => s.nth(0), /empty/, "empty.nth(0) should throw");
				assert.throws(() => s.nth(1), /empty/, "empty.nth(1) should throw");
			});
		}); // end module ".nth"

		test(".head", function(assert) {
			let s = seq.empty;
			assert.throws(() => s.head, /empty/, "empty.head should throw");
		});

		test(".skip, .take, .filter, .map, .mapMany return same thing", function(assert) {
			let s = seq.empty;

			assert.same(s.skip(0), s, "empty.skip(0) should return same thing");
			assert.same(s.skip(1), s, "empty.skip(1) should return same thing");
			assert.same(s.skip(2), s, "empty.skip(2) should return same thing");

			assert.same(s.take(0), s, "empty.take(0) should return same thing");
			assert.same(s.take(1), s, "empty.take(1) should return same thing");
			assert.same(s.take(2), s, "empty.take(2) should return same thing");

			assert.same(s.filter(x => x < 0), s, 
				"empty.filter(..) should return same thing");
			assert.same(s.map(x => "" + x), s, 
				"empty.map(..) should return same thing");
			assert.same(s.mapMany(x => [x, x]), s, 
				"empty.mapMany(..) should return same thing");
		});

		test(".cons", function(assert) {
			let s = seq.empty;

			assert.same(s.cons(5).length, 1, "empty.cons(..).length");
			assert.all.same(s.cons(5),           [5],
				"empty.cons(5)");
			assert.all.same(s.cons(5).cons(6), [6,5],
				"empty.cons(5).cons(6)");
		});

		test(".snoc", function(assert) {
			let s = seq.empty.snoc(5);
			assert.same(s.length, 1, "empty.snoc(..).length");
			assert.all.same(s,         [5],   "empty.snoc(5)");
			assert.all.same(s.snoc(6), [5,6], "empty.snoc(5).snoc(6)");
		});

		test(".snoc.cons", function(assert) {
			let s = seq.empty.snoc(5).cons(6);
			assert.same(s.length, 2, "empty.snoc(5).cons(6).length");
			assert.all.same(s, [6,5], "empty.snoc(5).cons(6)");
		});

		test(".cons.snoc", function(assert) {
			let s = seq.empty.cons(5).snoc(6);
			assert.same(s.length, 2, "empty.cons(5).snoc(6).length");
			assert.all.same(s, [5,6], "empty.cons(5).snoc(6)");
		});
	}); // end module "seq.empty"

}); // end require