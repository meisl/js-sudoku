require(["scripts/cell", "scripts/sudoku"], (cell, sudoku) => {
	const { test, todo, skip, module } = QUnit;

	module("cell", () => { // -------------------------------------------------
		test("module object", function (assert) {
			assert.same(Object.getPrototypeOf(cell), null, "has null __proto__");
		});

		skip("create", function(assert) {
			var s = {};

			var c = cell.create(s);
			assert.isObject(c, "returns an object");
		});

		test(".field", function(assert) {
			var s = sudoku.create({box: [2, 3]});
			var t = sudoku.create({box: [2, 3]});

			s.forEachCell(c => {
				assert.same(c.field, s, 
					c.id + ": .field returns the sudoku instance that created the cell");
				assert.notStrictEqual(c.field, t, 
					"(make sure 'same'' (fka 'strictEqual')' knows object identity)");
				c.field = null;
				assert.same(c.field, s, 
					"assigning " + c.id + ": .field does nothing");
			});
		});

		test(".id / .x / .y", function(assert) {
			var s = sudoku.create({box: [2, 3]});

			for (let y = 0; y < s.n(); y++) {
				for (let x = 0; x < s.n(); x++) {
					let c = s.cell(x, y);
					assert.same(c.x, x, c.id + ".x");
					assert.same(c.y, y, c.id + ".y");
					assert.same(c.id, s.toXcoord(x) + s.toYcoord(y), c.id + ".id");
				}
			}
		});

		test(".toString", function(assert) {
			var s = sudoku.create({box: [2, 3], symbols: [..."ABCDEF"]});

			s.forEachCell(c => {
				let choices = [];
				c.forEachChoice(v => choices.push(v));
				let choicesStr = choices
					.map(v => s.symbol(v))
					.sort()
					.join(",")
				;
				assert.same(c.toString(), 
					c.id + "{" + choicesStr + "}", c.id + "{" + choicesStr + "}");
			});
		});

		test(".row, .column, .box", function(assert) {
			let s = sudoku.create({box: [3, 2]});
			s.forEachCell(c => {

				let row = c.row;
				assert.isObject(row, c.id + ".row");
				assert.same(row.field, s, 
					c.id + ".row=" + row.id + ": " + ".row.field points to .field");
				assert.same(row, s.rows[c.y],
					c.id + ".row=" + row.id + ": should be same as .field.rows[" + c.y + "]");

				let col = c.col;
				assert.isObject(col, c.id + ".col");
				assert.same(col.field, s,
					c.id + ".col=" + col.id + ": " + ".col.field points to .field");
				assert.same(col, s.columns[c.x],
					c.id + ".col=" + col.id + ": should be same as .field.columns[" + c.x + "]");

				let box = c.box;
				assert.isObject(box, c.id + ".box");
				assert.same(box.field, s,
					c.id + ".box=" + box.id + ": " + ".box.field points to .field");
				let boxX = Math.trunc(c.x / s.boxW());
				let boxY = Math.trunc(c.y / s.boxH());
				let boxIdx = boxX + boxY * s.boxH(); // there are boxH (!) boxes in a row
				assert.same(box, s.boxes[boxIdx],
					c.id + ".box=" + box.id + ": should be same as .field.boxes[" + boxIdx + "]");
			});
		});

		todo(".groups.some", function(assert) {
			let s = sudoku.create({box: [3, 2]});
			s.forEachCell(c => {
				f = c.groups.some;
				assert.isFunction(f, c.id + ".groups.function");
			});
		});

		todo(".choices.some", function(assert) {
			let s = sudoku.create({box: [3, 2]});
			s.forEachCell(c => {
				f = c.choices.some;
				assert.isFunction(f, c.id + ".choices.function");
			});
		});

		test("enumerate groups", function(assert) {
			let s = sudoku.create({box: [3, 2]});
			s.forEachCell(c => {
				assert.isIterable(c.groups, c.id + ".groups");
				let groups = new Array(3);
				let i = 0;
				c.groups.forEach(g => {
					groups[i++] = g;
					assert.isObject(g, c.id + ": " + i + ". group is an object");
					assert.same(g.field, c.field,
						c.id + ": " + i + ". group's .field points to same as cell.field");
					for (let k = 0; k < i-1; k++) {
						assert.notStrictEqual(g, groups[k],
							c.id + ": " + i + ". group !== " + (k+1) + ". group");
					}
				});
				assert.same(groups.length, 3, "cell belongs to 3 groups");
			});
		});


		test(".choiceCount / .removeChoice / .forEachChoice", function(assert) {
			var s = sudoku.create({box: [2, 3]});
			var n = s.n();
			var v = 0;
			var m, k, choices;
			s.forEachCell(c => {
				m = c.choiceCount();
				assert.same(m, n,
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
				assert.same(k, m, "nr of values yielded by .forEachChoice(..) should be " + m);

				// now remove a value from choices
				c.removeChoice(v);

				m = c.choiceCount();
				assert.same(m, n - 1,
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
				assert.same(k, m, "after removeChoice(" + v 
					+ "): nr of values yielded by .forEachChoice(..) should be " + m);
				assert.notOk(choices.has(v), 
					"removed value " + v + " not anymore contained in " + choices);

				v = (v + 1) % n;
			});
		});

		test(".hasChoice / .removeChoice", function(assert) {
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
				c.groups.forEach(g => {
					assert.notOk(g.hasCandidate(c, v), 
						c.id + ": after removeChoice(" + v + ")"
						+ " no more candidate for value " + v 
						+ " in group " + g);
				});

				v = (v + 1) % n;
			});
		});

		test(".value (set/get) / .isFixated", function(assert) {
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
				assert.same(c.value, undefined, c.id + ".value should be undefined");
				assert.notOk(c.isFixated, c.id + ".isFixated should be false");
				assert.same(c.canBeFixated, c.choiceCount() == 1, 
					c.id + ".canBeFixated should be " + (c.choiceCount() == 1) 
					+ " (choiceCount == " + c.choiceCount() + ")");
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

				assert.same(c.choiceCount(), 1, 
					c.id + " should have 1 choice after setting .value = " + v1);
				assert.same(c.value, v1, 
					c.id + " should have .value = " + v1 + " after setting .value = " + v1);
				assert.ok(c.isFixated, 
					c.id + ".isFixated should be true after setting .value = " + v1);
				assert.notOk(c.canBeFixated, 
					c.id + ".canBeFixated should be false after setting .value = " + v1);
				assert.ok(c.hasChoice(v1), 
					c.id + " still has choice " + v1 + " after setting .value = " + v1);
				c.groups.forEach(g => {
					assert.ok(g.hasCandidate(c, v1),
						g.id + " still has " + c + " as candidate for " + v1);
					assert.same(g.candidates(v1).size, 1, 
						g.id + " has only " + c + " as candidate for " + v1);
				});


				c.value = v1; // setting it again to the same value is ok
				assert.throws( () => { c.value = (v1 + 1) % n; },
					"trying to re-set a cell's .value throws");
			});

			test(".siblings", function (assert) {
				const bW = 3, bH = 3, n = bW * bH;
				const s = sudoku.create({ box: [bW, bH]});
				s.forEachCell(c => {
					assert.isIterable(c.siblings, c.id + ".siblings");
					const expSibs = new Set([
						...c.row.cells,
						...c.col.cells,
						...c.box.cells
					].filter(d => d !== c));
					const expectedLength = 3 * n // nr of cells in all groups
							- bW // minus cells counted twice in box/row
							- bH // minus cells counted twice in box/col
							- 1 // minus the cell itself
					;
					assert.same(expectedLength, expSibs.size,
						"(make sure expectedLength === size of epx. siblings)");

					assert.same(c.siblings.length, expectedLength, 
						c.id + ".siblings.length");
					assert.same((new Set(c.siblings)).size, expectedLength,
						"no duplicates in " + c.id + ".siblings");
					for (const sib of c.siblings) {
						assert.ok(expSibs.has(sib),
							sib.id + " should be sibling of " + c.id);
					}
				});
			});

		});
	}); // end module "cell"

}); // end require