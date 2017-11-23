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

	QUnit.test(".candidates / .removeCandidate", function(assert) {
		// must test overlapping groups separately
		testGroupKind(s => s.rows);
		testGroupKind(s => s.columns);
		testGroupKind(s => s.boxes);
		
		function testGroupKind(chooseGroups) {
			var boxW = 3;
			var boxH = 2;
			var s = sudoku.create({box: [boxW, boxH]});
			var n = s.n();
			var values = s.newSetOfValues();
			chooseGroups(s).forEach(g => {
				var k = n - 1; // index of candidate to remove (later)
				values.forEach(v => {
					cs = g.candidates(v);
					assert.equal(cs.size, n,
						".candidates(" + v + ").size should be " + n);
					var i = 0; // candidate index
					var toRemove;
					cs.forEach(c => {
						assert.ok(c.hasChoice(v), 
							c.id + " as a candidate for " + v 
							+ " should have choice " + v);
						if (i == k) {
							toRemove = c;
						}
						i++;
					});
					
					g.removeCandidate(toRemove, v);
					
					// removeCandidate necessitates update of candidate's choices:
					assert.notOk(toRemove.hasChoice(v), "after removeCandidate(" 
						+ toRemove.id + ", " + v + "): " + toRemove.id 
						+ ".hasChoice(" + v + ") should be false");
					toRemove.forEachGroup(h => {
						assert.notOk(g.hasCandidate(toRemove, v),
							+ toRemove.id + " should not be a candidate for " + v
							+ "in group " + h + " anymore");
					});

					cs = g.candidates(v);
					assert.equal(cs.size, n - 1,
						".candidates(" + v + ").size after removeCandidate(" 
						+ toRemove.id + ", " + v + ") should be " + (n-1));
					cs.forEach(c => {
						assert.ok(c.hasChoice(v), "after removeCandidate(" 
							+ toRemove.id + ", " + v + "): "
							+ c.id + " as a candidate for " + v 
							+ " should have choice " + v);
					});
					k--;
				});
			});
		}
		
	});
	
});