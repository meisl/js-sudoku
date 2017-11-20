require(["scripts/cell", "scripts/sudoku"], function(cell, sudoku) {

	QUnit.module("cell");


	QUnit.skip("create", function(assert) {
		var s = {};
	
		var c = cell.create(s);
		assert.equal(typeof c, "object", "returns an object");
	});

	QUnit.test(".field", function(assert) {
		var s = sudoku.create({box: [2, 3]});
		var t = sudoku.create({box: [2, 3]});
		var c = s.cell(0,0);

		assert.strictEqual(c.field(), s, 
			"returns the sudoku instance that created the cell");
		assert.notStrictEqual(c.field(), t, 
			"(make sure strictEqual knows object identity)");
	});

	QUnit.test("enumerate groups", function(assert) {
		var c = sudoku.create({box: [3, 2]}).cell(0,0);
		var i = 0;
		var groups = new Array(3);
		c.forEachGroup(g => {
			groups[i++] = g;
			assert.equal(typeof g, "object", i + ". group is an object");
			assert.strictEqual(g.field(), c.field(),
				i + ". group's .field() points to same as cell.field()");
			for (var k = 0; k < i-1; k++) {
				assert.notStrictEqual(g, groups[k],
					i + ". group !== " + (k+1) + ". group");
			}
		});
		assert.equal(groups.length, 3, "cell belongs to 3 groups");
	});
});