require(["scripts/sudoku"], function(sudoku) {

	QUnit.module("sudoku");


	QUnit.test("create", function(assert) {
	
		assert.throws(
			function() {
				sudoku.create();
			},
			/options/,
			"throws without any argument"
		);
		assert.throws(
			function() {
				sudoku.create(7);
			},
			/options/,
			"throws with non-object argument"
		);
		var s;
		var bW, bH, n;
		
		bW = 3; bH = 3; n = bW*bH;
		s = sudoku.create({box: [bW, bH]});
		assert.equal(typeof s, "object", "returns an object");
		assert.equal(s.n(), n, ".n() = box.w * box.h");
		assert.equal(s.cellCount(), n*n, ".cellCount() = (box.w * box.h)^2");
		assert.equal(s.rows.length, n, "has box.w*box.h rows");
		assert.equal(s.columns.length, n, "has box.w*box.h columns");
		assert.equal(s.boxes.length, n, "has box.w*box.h boxes");
		
		for (var y = 0; y < n; y++) {
			for (var x = 0; x < n; x++) {
				var cell = s.cell(x, y);
				var cellStr = ".cell(" + x + ", " + y + ")"
				assert.equal(typeof cell, "object", 
					cellStr + " is an object");
				assert.strictEqual(cell.field(), s, 
					cellStr + ".field() points to sudoku instance");
			}
		}
	});

	QUnit.test(".symbol, .value", function(assert) {
		var bW = 2; var bH = 4; var n = bW*bH;
		var s = sudoku.create({
			box: [bW, bH], 
			symbols: ["1", "2", "3", "4", "5", "6", "7", "8"]
		});
		
		assert.equal(s.n(), n, ".n() = box.w * box.h");
		assert.equal(s.cellCount(), n*n, ".cellCount() = (box.w * box.h)^2");
		
		assert.equal(s.symbol(0), "1", "translates value 0 to options.symbols[0]");
		assert.equal(s.symbol(1), "2", "translates value 1 to options.symbols[1]");
		assert.equal(s.symbol(2), "3", "translates value 2 to options.symbols[2]");
		assert.equal(s.symbol(3), "4", "translates value 3 to options.symbols[3]");
		assert.equal(s.symbol(4), "5", "translates value 4 to options.symbols[4]");
		assert.equal(s.symbol(5), "6", "translates value 5 to options.symbols[5]");
		assert.equal(s.symbol(6), "7", "translates value 6 to options.symbols[6]");
		assert.equal(s.symbol(7), "8", "translates value 7 to options.symbols[7]");

		assert.equal(s.value("1"), 0, "translates options.symbols[0] to value 0");
		assert.equal(s.value("2"), 1, "translates options.symbols[1] to value 1");
		assert.equal(s.value("3"), 2, "translates options.symbols[2] to value 2");
		assert.equal(s.value("4"), 3, "translates options.symbols[3] to value 3");
		assert.equal(s.value("5"), 4, "translates options.symbols[4] to value 4");
		assert.equal(s.value("6"), 5, "translates options.symbols[5] to value 5");
		assert.equal(s.value("7"), 6, "translates options.symbols[6] to value 6");
		assert.equal(s.value("8"), 7, "translates options.symbols[7] to value 7");
	});

});