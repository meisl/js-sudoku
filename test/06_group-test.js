require(["scripts/group", "scripts/sudoku"], (group, sudoku) => {
	const { test, todo, skip, module } = QUnit;

	module("group", () => { // -------------------------------------------------
		skip("module object", function (assert) {
			assert.same(Object.getPrototypeOf(group), null, "has null __proto__");
		});

		module(".field", () => { // -------------------------------------------------
			test("row", function (assert) {
				const boxW = 3, boxH = 2;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let y = 0; y < boxW * boxH; y++) {
					assert.same(s.rows[y].field, s,
						"rows[" + y + "].field");
				}
			});

			test("column", function (assert) {
				const boxW = 3, boxH = 2;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let x = 0; x < boxW * boxH; x++) {
					assert.same(s.columns[x].field, s,
						"columns[" + x + "].field");
				}
			});

			test("box", function (assert) {
				const boxW = 3, boxH = 2;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let i = 0; i < s.n(); i++) {
					assert.equal(s.boxes[i].field, s,
						"boxes[" + i + "].field");
				}
			});
		}); // end module ".field"

		module(".id", () => { // -------------------------------------------------
			test("row", function (assert) {
				const boxW = 3, boxH = 2;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let y = 0; y < boxW * boxH; y++) {
					assert.equal(s.rows[y].id, "Row_" + s.toYcoord(y),
						"rows[" + y + "].id");
				}
			});

			test("column", function (assert) {
				const boxW = 3, boxH = 2;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let x = 0; x < boxW * boxH; x++) {
					assert.equal(s.columns[x].id, "Col_" + s.toXcoord(x),
						"columns[" + x + "].id");
				}
			});

			test("box", function (assert) {
				const boxW = 3, boxH = 2;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let i = 0; i < s.n(); i++) {
					let bx = i % boxH;
					let by = Math.trunc(i / boxH);
					assert.equal(s.boxes[i].id, "Box_" + s.toXcoord(bx) + s.toYcoord(by),
						"boxes[" + i + "].id");
				}
			});
		}); // end module ".id"

		module(".cells", () => { // -------------------------------------------------
			test("row", function (assert) {
				const boxW = 3, boxH = 2, n = boxW*boxH;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let i = 0; i < n; i++) {
					const cells = s.rows[i].cells;
					assert.isIterable(cells, ".rows[" + i + "].cells");
					assert.same(cells.length, n, ".rows[" + i + "].cells.length");
				}
			});
			test("column", function (assert) {
				const boxW = 3, boxH = 2, n = boxW*boxH;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let i = 0; i < n; i++) {
					const cells = s.columns[i].cells;
					assert.isIterable(cells, ".columns[" + i + "].cells");
					assert.same(cells.length, n, ".columns[" + i + "].cells.length");
				}
			});
			test("boxes", function (assert) {
				const boxW = 3, boxH = 2, n = boxW*boxH;
				const s = sudoku.create({box: [boxW, boxH]});
				for (let i = 0; i < n; i++) {
					const cells = s.boxes[i].cells;
					assert.isIterable(cells, ".boxes[" + i + "].cells");
					assert.same(cells.length, n, ".boxes[" + i + "].cells.length");
				}
			});
		}); // end module ".cells"

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
						assert.same(c.row, row, "row " + i
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
						assert.same(c.col, col, "col " + i
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
							assert.same(c.box, box, "box " + i 
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