require(["scripts/group", "scripts/sudoku"], function(group, sudoku) {

	QUnit.module("group");


	QUnit.test("assignment of cells to rows", function(assert) {
		var boxW = 3;
		var boxH = 2;
		var s = sudoku.create({box: [boxW, boxH]});
		
		for (var i = 0; i < s.n(); i++) {
			var row = s.rows[i];
			var y = i;
			for (var x = 0; x < s.n(); x++) {
				var cell = s.cell(x, y);
				assert.strictEqual(cell.row(), row, "row " + i
					+ " contains cell(" + x + ", " + y + ")");
			}
		}
	});

	QUnit.test("assignment of cells to columns", function(assert) {
		var boxW = 3;
		var boxH = 2;
		var s = sudoku.create({box: [boxW, boxH]});
		
		for (var i = 0; i < s.n(); i++) {
			var column = s.columns[i];
			var x = i;
			for (var y = 0; y < s.n(); y++) {
				var cell = s.cell(x, y);
				assert.strictEqual(cell.column(), column, "column " + i
					+ " contains cell(" + x + ", " + y + ")");
			}
		}
	});

	QUnit.test("assignment of cells to boxes", function(assert) {
		var boxW = 3;
		var boxH = 2;
		var s = sudoku.create({box: [boxW, boxH]});
		
		for (var i = 0; i < s.n(); i++) {
			var box = s.boxes[i];
			var cellXoffset = (i % boxH) * boxW;
			var cellYoffset = Math.floor(i / boxH) * boxH;
			for (var y = cellYoffset; y < cellYoffset + boxH; y++) {
				for (var x = cellXoffset; x < cellXoffset + boxW; x++) {
					var cell = s.cell(x, y);
					assert.strictEqual(cell.box(), box, "box " + i 
						+ " contains cell(" + x + ", " + y + ")");
				}
			}
		}
	});
});