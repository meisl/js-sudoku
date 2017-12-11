require(["scripts/group", "scripts/sudoku"], function(group, sudoku) {
	const { test, todo, skip, module } = QUnit;

	module("group", () => { // -------------------------------------------------
		module(".id", () => { // -------------------------------------------------
			test("row", function (assert) {
				let boxW = 3;
				let boxH = 2;
				let s = sudoku.create({box: [boxW, boxH]});
				for (let y = 0; y < boxW * boxH; y++) {
					assert.equal(s.rows[y].id, "Row_" + s.toYcoord(y),
						"rows[" + y + "].id");
				}
			});

			test("column", function (assert) {
				let boxW = 3;
				let boxH = 2;
				let s = sudoku.create({box: [boxW, boxH]});
				for (let x = 0; x < boxW * boxH; x++) {
					assert.equal(s.columns[x].id, "Col_" + s.toXcoord(x),
						"columns[" + x + "].id");
				}
			});

			test("box", function (assert) {
				let boxW = 3;
				let boxH = 2;
				let s = sudoku.create({box: [boxW, boxH]});
				for (let i = 0; i < s.n(); i++) {
					let bx = i % boxH;
					let by = Math.trunc(i / boxH);
					assert.equal(s.boxes[i].id, "Box_" + s.toXcoord(bx) + s.toYcoord(by),
						"boxes[" + i + "].id");
				}
			});
		}); // end module ".id"

		module("assignment of cells", () => {
			test("to rows", function(assert) {
				let boxW = 3;
				let boxH = 2;
				let s = sudoku.create({box: [boxW, boxH]});

				for (let i = 0; i < s.n(); i++) {
					let row = s.rows[i];
					let y = i;
					for (let x = 0; x < s.n(); x++) {
						let c = s.cell(x, y);
						assert.strictEqual(c.row, row, "row " + i
							+ " contains cell(" + x + ", " + y + ")");
					}
				}
			});

			test("to columns", function(assert) {
				let boxW = 3;
				let boxH = 2;
				let s = sudoku.create({box: [boxW, boxH]});

				for (let i = 0; i < s.n(); i++) {
					let col = s.columns[i];
					let x = i;
					for (let y = 0; y < s.n(); y++) {
						let c = s.cell(x, y);
						assert.strictEqual(c.col, col, "col " + i
							+ " contains cell(" + x + ", " + y + ")");
					}
				}
			});

			test("to boxes", function(assert) {
				let boxW = 3;
				let boxH = 2;
				let s = sudoku.create({box: [boxW, boxH]});

				for (let i = 0; i < s.n(); i++) {
					let box = s.boxes[i];
					let cellXoffset = (i % boxH) * boxW;
					let cellYoffset = Math.trunc(i / boxH) * boxH;
					for (let y = cellYoffset; y < cellYoffset + boxH; y++) {
						for (let x = cellXoffset; x < cellXoffset + boxW; x++) {
							let c = s.cell(x, y);
							assert.strictEqual(c.box, box, "box " + i 
								+ " contains cell(" + x + ", " + y + ")");
						}
					}
				}
			});
		}); // end module "assignment of cells"

		test(".candidates / .removeCandidate", function(assert) {
			// must test overlapping groups separately
			testGroupKind(s => s.rows);
			testGroupKind(s => s.columns);
			testGroupKind(s => s.boxes);

			function testGroupKind(chooseGroups) {
				let boxW = 3;
				let boxH = 2;
				let s = sudoku.create({box: [boxW, boxH]});
				let n = s.n();
				let values = s.newSetOfValues();
				chooseGroups(s).forEach(g => {
					let k = n - 1; // index of candidate to remove (later)
					values.forEach(v => {
						let cs = g.candidates(v);
						assert.equal(cs.size, n,
							".candidates(" + v + ").size should be " + n);
						let i = 0; // candidate index
						let toRemove;
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
						toRemove.groups.forEach(h => {
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
	}); // end module "group"

}); // end require