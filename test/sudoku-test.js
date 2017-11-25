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
		var s, bW, bH, n;
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

	QUnit.test("enumerate cells", function(assert) {
		var s, bW, bH, n;
		bW = 3; bH = 3; n = bW*bH;
		s = sudoku.create({box: [bW, bH]});

		var i = 0;
		s.forEachCell( (c, x, y) => {
			assert.equal(x, i % n, "x coord of " + c.id);
			assert.equal(y, Math.floor(i / n), "y coord of " + c.id);
			assert.strictEqual(c, s.cell(x, y), c.id + " === .cell(" + x + ", " + y + ")");
			i++;
		});
	
	});
	
	(() => {
		function testNewSetOfValues(assert, options) {
			var s = sudoku.create(options);
			var n = s.n();
			
			var vs1 = s.newSetOfValues();
			assert.equal(vs1.size, n, "nr of .values() should be " + n);
			for (var i = 0; i < n; i++) {
				assert.ok(vs1.has(i), ".values() should contain " + i);
			}
			var vs2 = s.newSetOfValues();
			assert.notStrictEqual(vs2, vs1, "returns new Set each time");
		}
		QUnit.test(".newSetOfValues (without symbols option)", function(assert) {
			var bW = 3; var bH = 2;
			testNewSetOfValues(assert, {box: [bW, bH]});
		});
		
		QUnit.test(".newSetOfValues (with symbols option)", function(assert) {
			var bW = 3; var bH = 2;
			var symbols = ["a", "b", "c", "d", "e", "f"];
			testNewSetOfValues(assert, {box: [bW, bH], symbols: symbols});
		});
	})();

	QUnit.test(".symbol, .value (without symbols option)", function(assert) {
		var bW = 2; var bH = 4; var n = bW*bH;
		var s = sudoku.create({
			box: [bW, bH]
		});
		
		for (var v = 0; v < n; v++) {
			assert.equal(s.symbol(v), v, "translates value " + v + " to symbol" + v);
			assert.equal(s.value(v), v, "translates symbol " + v + " to value " + v);
		}
	});
	
	QUnit.test(".symbol, .value (with symbols option)", function(assert) {
		var bW = 2; var bH = 4; var n = bW*bH;
		var symbols = ["a", "b", "c", "d", "e", "f", "g", "h"];
		var s = sudoku.create({
			box: [bW, bH], 
			symbols: symbols
		});
		
		for (var v = 0; v < n; v++) {
			assert.equal(s.symbol(v), symbols[v], 
				"translates value " + v + " to symbol" + symbols[v]);
			assert.equal(s.value(symbols[v]), v, 
				"translates symbol " + symbols[v] + " to value " + v);
		}
	});
	
	QUnit.test(".stringify (without symbols option)", function(assert) {
		var bW = 2; var bH = 3; var n = bW*bH;
		var s = sudoku.create({
			box: [bW, bH]
		});
		var act;
		
		act = s.stringify();
		assert.equal(act,
			  "+-----+-----+-----+\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "+-----+-----+-----+\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "+-----+-----+-----+\n"
		);
			
		for (let v = 0; v < n; v++) {
			s.cell(v, v).value = v;
		}
		act = s.stringify();
		assert.equal(act,
			  "+-----+-----+-----+\n"
			+ "| 0 - | - - | - - |\n"
			+ "| - 1 | - - | - - |\n"
			+ "| - - | 2 - | - - |\n"
			+ "+-----+-----+-----+\n"
			+ "| - - | - 3 | - - |\n"
			+ "| - - | - - | 4 - |\n"
			+ "| - - | - - | - 5 |\n"
			+ "+-----+-----+-----+\n"
		);
	});
	
	QUnit.test(".stringify (with symbols option)", function(assert) {
		var bW = 2; var bH = 3; var n = bW*bH;
		var s = sudoku.create({
			box: [bW, bH],
			symbols: ["a", "b", "c", "d", "e", "f"],
		});
		var act;
		
		act = s.stringify();
		assert.equal(act,
			  "+-----+-----+-----+\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "+-----+-----+-----+\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "| - - | - - | - - |\n"
			+ "+-----+-----+-----+\n"
		);
			
		for (let v = 0; v < n; v++) {
			s.cell(v, v).value = v;
		}
		act = s.stringify();
		assert.equal(act,
			  "+-----+-----+-----+\n"
			+ "| a - | - - | - - |\n"
			+ "| - b | - - | - - |\n"
			+ "| - - | c - | - - |\n"
			+ "+-----+-----+-----+\n"
			+ "| - - | - d | - - |\n"
			+ "| - - | - - | e - |\n"
			+ "| - - | - - | - f |\n"
			+ "+-----+-----+-----+\n"
		);
		
		var mySymbols = ["F", "E", "D", "C", "B", "A"];
		act = s.stringify(c => {
			if (c.value !== undefined) {
				return mySymbols[c.value];
			} else {
				return "-"
			}
		});
		assert.equal(act,
			  "+-----+-----+-----+\n"
			+ "| F - | - - | - - |\n"
			+ "| - E | - - | - - |\n"
			+ "| - - | D - | - - |\n"
			+ "+-----+-----+-----+\n"
			+ "| - - | - C | - - |\n"
			+ "| - - | - - | B - |\n"
			+ "| - - | - - | - A |\n"
			+ "+-----+-----+-----+\n"
		);


		s = sudoku.create({
			box: [3, 3],
			symbols: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
		});
		n = 81;
		act = s.stringify();
		assert.equal(act,
			  "+-------+-------+-------+\n"
			+ "| - - - | - - - | - - - |\n"
			+ "| - - - | - - - | - - - |\n"
			+ "| - - - | - - - | - - - |\n"
			+ "+-------+-------+-------+\n"
			+ "| - - - | - - - | - - - |\n"
			+ "| - - - | - - - | - - - |\n"
			+ "| - - - | - - - | - - - |\n"
			+ "+-------+-------+-------+\n"
			+ "| - - - | - - - | - - - |\n"
			+ "| - - - | - - - | - - - |\n"
			+ "| - - - | - - - | - - - |\n"
			+ "+-------+-------+-------+\n"
		);
		/*
		var t = 
			  "+-------+-------+-------+\n"
			+ "| - 4 - | 8 - - | - 7 3 |\n"
			+ "| - - - | 4 6 - | - - 2 |\n"
			+ "| 8 9 1 | - - - | 6 - - |\n"
			+ "+-------+-------+-------+\n"
			+ "| - - 8 | - 5 3 | 2 - 7 |\n"
			+ "| 1 - - | 9 - 7 | - - 6 |\n"
			+ "| 9 - 3 | 2 8 - | 4 - - |\n"
			+ "+-------+-------+-------+\n"
			+ "| - - 6 | - - - | 5 2 1 |\n"
			+ "| 2 - - | - 3 8 | - - - |\n"
			+ "| 7 5 - | - - 1 | - 4 - |\n"
			+ "+-------+-------+-------+\n"
		;

		act = s.stringify();
		assert.equal(act, t);
		*/
	});
	
	QUnit.test(".parse", function(assert) {
		var t, s;
		
		t =   "+-----+-----+-----+\n"
			+ "| a - | - - | - - |\n"
			+ "| - b | - - | - - |\n"
			+ "| - - | c - | - - |\n"
			+ "+-----+-----+-----+\n"
			+ "| - - | - d | - - |\n"
			+ "| - - | - - | 1 - |\n"
			+ "| - - | - - | - - |\n"
			+ "+-----+-----+-----+\n"
		;
		symbols = ["a", "b", "c", "d", "1", "2"];
		
		s = sudoku.parse(t);
		
		assert.equal(s.n(), 6, "n");
		assert.equal(s.boxW(), 2, "boxW");
		assert.equal(s.boxH(), 3, "boxH");
		for (let v = 0; v < s.n(); v++) {
			assert.equal(s.symbol(v), symbols[v], 
				"should map value " + v + " to symbol " + symbols[v]);
		}
		
		assert.equal(s.stringify(), t, ".parse(s).stringify() should equal s");
		console.log(t);

		t = 
			  "+-------+-------+-------+\n"
			+ "| - 4 - | 8 - - | - 7 3 |\n"
			+ "| - - - | 4 6 - | - - 2 |\n"
			+ "| 8 9 1 | - - - | 6 - - |\n"
			+ "+-------+-------+-------+\n"
			+ "| - - 8 | - 5 3 | 2 - 7 |\n"
			+ "| 1 - - | 9 - 7 | - - 6 |\n"
			+ "| 9 - 3 | 2 8 - | 4 - - |\n"
			+ "+-------+-------+-------+\n"
			+ "| - - 6 | - - - | 5 2 1 |\n"
			+ "| 2 - - | - 3 8 | - - - |\n"
			+ "| 7 5 - | - - 1 | - 4 - |\n"
			+ "+-------+-------+-------+\n"
		;
		s = sudoku.parse(t);
		console.log(s.stringify(c => {
			if (c.isFixated) {
				return String.fromCharCode(c.value + 65);
			} else if (c.canBeFixated) {
				return "*";
			} else {
				//return "-"
				return c.choiceCount();
			}
		}));
	});

});