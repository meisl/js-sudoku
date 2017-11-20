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
		var s = sudoku.create({box: [3, 2]});
		var c = s.cell(0,0);
		
		assert.expect(3);
		var i = 0;
		c.forEachGroup(g => {
			assert.equal(typeof g, "object", "a cell's " + (++i) + ". group is an object");
		});
	});
});