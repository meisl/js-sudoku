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

		s.forEachCell(c => {
			assert.strictEqual(c.field(), s, 
				c.id + ": .field() returns the sudoku instance that created the cell");
			assert.notStrictEqual(c.field(), t, 
				"(make sure strictEqual knows object identity)");
		});
	});

	QUnit.test(".id", function(assert) {
		var s = sudoku.create({box: [2, 3]});
		
		for (let y = 0; y < s.n(); y++) {
			for (let x = 0; x < s.n(); x++) {
				assert.equal(s.cell(x, y).id, sudoku.toXcoord(x) + sudoku.toYcoord(y));
			}
		}
	});

	QUnit.test(".toString", function(assert) {
		var s = sudoku.create({box: [2, 3], symbols: [..."ABCDEF"]});
		
		s.forEachCell(c => {
			let choices = [];
			c.forEachChoice(v => choices.push(v));
			choicesStr = choices
				.map(v => s.symbol(v))
				.sort()
				.join(",")
			;
			assert.equal(c.toString(), 
				c.id + "{" + choicesStr + "}", c.id + "{" + choicesStr + "}");
		});
	});

	QUnit.test(".row, .column, .box", function(assert) {
		var boxW = 3;
		var boxH = 2;
		var n = boxW * boxH;
		var s = sudoku.create({box: [boxW, boxH]});
		for (var i = 0; i < s.cellCount(); i++) {
			var c = s.cell(i % n, Math.floor(i / n));
			var row = c.row();
			assert.strictEqual(row.field(), s, "cell " + i + ": "
				+ ".row().field() points to .field()");
			var column = c.column();
			assert.strictEqual(column.field(), s,  "cell " + i + ": "
				+ ".column().field() points to .field()");
			var box = c.box();
			assert.strictEqual(box.field(), s,  "cell " + i + ": "
				+ ".box().field() points to .field()");
		}
	});

	QUnit.test("enumerate groups", function(assert) {
		var s = sudoku.create({box: [3, 2]});
		s.forEachCell(c => {
			var i = 0;
			var groups = new Array(3);
			c.forEachGroup(g => {
				groups[i++] = g;
				assert.equal(typeof g, "object", 
					c.id + ": " + i + ". group is an object");
				assert.strictEqual(g.field(), c.field(),
					c.id + ": " + i + ". group's .field() points to same as cell.field()");
				for (var k = 0; k < i-1; k++) {
					assert.notStrictEqual(g, groups[k],
						c.id + ": " + i + ". group !== " + (k+1) + ". group");
				}
			});
			assert.equal(groups.length, 3, "cell belongs to 3 groups");
		});
	});

	QUnit.test(".choiceCount / .removeChoice / .forEachChoice", function(assert) {
		var s = sudoku.create({box: [2, 3]});
		var n = s.n();
		var v = 0;
		var m, k, choices;
		s.forEachCell(c => {
			m = c.choiceCount();
			assert.equal(m, n,
				c.id + ": .choiceCount() should be " + n);
			k = 0;
			choices = new Set();
			c.forEachChoice( w => {
				assert.ok((w >= 0) && (w < n), (k+1) + ". choice value is >= 0 and < " + n);
				assert.notOk(choices.has(w), 
					"no duplicate value " + w + " in " + choices);
				choices.add(w);
				k++;
			});
			assert.equal(k, m, "nr of values yielded by .forEachChoice(..) should be " + m);
			
			// now remove a value from choices
			c.removeChoice(v);
			
			m = c.choiceCount();
			assert.equal(m, n - 1,
				c.id + ": .choiceCount() after .removeChoice(" + v + ") should be " + (n-1));
			k = 0;
			choices.clear();
			c.forEachChoice( w => {
				assert.ok((w >= 0) && (w < n), (k+1) + ". choice value is >= 0 and < " + n);
				assert.notOk(choices.has(w), 
					"no duplicate value " + w + " in " + choices);
				choices.add(w);
				k++;
			});
			assert.equal(k, m, "after removeChoice(" + v 
				+ "): nr of values yielded by .forEachChoice(..) should be " + m);
			assert.notOk(choices.has(v), 
				"removed value " + v + " not anymore contained in " + choices);

			v = (v + 1) % n;
		});
	});

	QUnit.test(".hasChoice / .removeChoice", function(assert) {
		var s = sudoku.create({box: [2, 3]});
		var n = s.n();
		var v = 0;
		s.forEachCell(c => {
			for (var w = 0; w < n; w++) {
				assert.ok(c.hasChoice(w), c.id + " should have choice " + w);
			}
			c.removeChoice(v);
			for (var w = 0; w < n; w++) {
				if (w != v) {
					assert.ok(c.hasChoice(w), c.id + " should have choice " + w);
				} else {
					assert.notOk(c.hasChoice(w), c.id + " should NOT have choice " + w);
				}
			}
			c.forEachGroup(g => {
				assert.notOk(g.hasCandidate(c, v), 
					c.id + ": after removeChoice(" + v + ")"
					+ " no more candidate for value " + v 
					+ " in group " + g);
			});
			
			v = (v + 1) % n;
		});
	});


	QUnit.test(".value (set/get) / .isFixated", function(assert) {
		var s = sudoku.create({box: [2, 3]});
		var n = s.n();
		var v1, v2;
		var values = [
			0,1, 2,3, 4,5,
			2,3, 4,5, 0,1,
			4,5, 0,1, 2,3,
			
			1,2, 3,4, 5,0,
			3,4, 5,0, 1,2,
			5,0, 1,2, 3,4
		];
		var i = 0;
		s.forEachCell(c => {
			assert.ok(c.choiceCount() >= 1, 
				c.id + " needs at least 1 choices for this test: " + c.choiceCount());
			assert.strictEqual(c.value, undefined, c.id + ".value should be undefined");
			assert.notOk(c.isFixated, c.id + ".isFixated should be false");
			assert.equal(c.canBeFixated, c.choiceCount() == 1, 
				c.id + ".canBeFixated should be " + (c.choiceCount() == 1) 
				+ " (choiceCount == " + c.choiceCount() + ")");
			assert.throws( () => { c.isFixated = true; },
				".isFixated is a getter only");
			assert.throws( () => { c.isFixated = false; },
				".isFixated is a getter only");
			assert.throws( () => { c.canBeFixated = true; },
				".canBeFixated is a getter only");
			assert.throws( () => { c.canBeFixated = false; },
				".isFixated is a getter only");
			assert.throws( () => { c.value = undefined; }, /not a value/,
				"trying .value = undefined should throw");
			assert.throws( () => { c.value = -1; }, /not a value/,
				"trying .value = undefined should throw");
			assert.throws( () => { c.value = n; }, /not a value/,
				"trying .value = undefined should throw");
			
			v1 = values[i++];
			v2 = (v1 + 1) % n; // just anything != v1
			c.removeChoice(v2);
			assert.throws( () => { c.value = v2; }, /not.+choice/,
				"trying .value = x, x not a choice should throw");
			
			c.value = v1;
		
			assert.equal(c.choiceCount(), 1, 
				c.id + " should have 1 choice after setting .value = " + v1);
			assert.equal(c.value, v1, 
				c.id + " should have .value = " + v1 + " after setting .value = " + v1);
			assert.ok(c.isFixated, 
				c.id + ".isFixated should be true after setting .value = " + v1);
			assert.notOk(c.canBeFixated, 
				c.id + ".canBeFixated should be false after setting .value = " + v1);
			assert.ok(c.hasChoice(v1), 
				c.id + " still has choice " + v1 + " after setting .value = " + v1);
			c.forEachGroup(g => {
				assert.ok(g.hasCandidate(c, v1),
					"group " + g + " still has it as candidate for " + v1);
				assert.equal(g.candidates(v1).size, 1, 
					"group " + g + " has only " + c.id + " as candidate for " + v1);
			});
			
			
			c.value = v1; // setting it again to the same value is ok
			assert.throws( () => { c.value = (v1 + 1) % n; },
				"trying to re-set a cell's .value throws");
				
		});
		
		//console.log(s.stringify(d => {
		//	return (d.choiceCount() == 1 ? d.value + "/" : "?/") + d.choiceCount();
		//}));

	});
	
});