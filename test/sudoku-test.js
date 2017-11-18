require(["scripts/sudoku"], function(sudoku) {

	QUnit.module("sudoku");


	QUnit.test("create", function(assert) {
	
		assert.throws(
			function() {
				sudoku.create();
			},
			/options/,
			"throws without options argument"
		);
		
		var s = sudoku.create({box: [3, 3]});
		assert.equal(typeof s, "object", "returns an object");
		assert.equal(s.cellCount(), 81, ".cellCount() = (box.w * box.h)^2");
		
		var s = sudoku.create({box: [2, 4]});
		assert.equal(s.cellCount(), 64, ".cellCount() = (box.w * box.h)^2");
	});

});