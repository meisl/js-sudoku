require(["scripts/sudoku"], (sudoku) => {
	const { test, todo, skip, module } = QUnit;

	function* range(lo, hi) {
		if (typeof lo == "string") {
			lo = lo.charCodeAt(0);
			hi = hi.charCodeAt(0);
			while (lo <= hi) yield String.fromCharCode(lo++);
		} else {
			while (lo <= hi) yield lo++;
		}
	}

	module("sudoku-coords", () => { // -------------------------------------------------------------
		test("accessing cells via field[coord]", function (assert) {
			const s = sudoku.create({ box: [4, 4]});
			const xs = "ABCDEFGHIJKLMNOP";
			for (let y = 0; y < s.n(); y++) {
				let cy = (y + 1) + "";
				for (let x = 0; x < s.n(); x++) {
					const cx = xs[x];
					const c = cx + cy;
					assert.same(s[c], s.cell(x,y), 
						"cell (" + x + ", " + y + ") should be addressable via ." + c);
				}
			}
		});

		module(".fromXcoord", () => { // -------------------------------------------------------------
			test("with valid arg", function (assert) {
				function doTest(boxW, boxH, xs) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";
					assert.equal(xs.length, n,
						prefix + "testing all " + n + " valid x-coords");
					for (let x = 0; x < n; x++) {
						let cx = xs[x];
						assert.equal(s.fromXcoord(cx), x, 
							prefix + "should map x-coord \"" + cx + "\" to x-index " + x);
					}
				}
				doTest(2, 4, [...range("A", "H")]);
				doTest(6, 6, [...range("A", "Z"), ...range("a", "j")]);
			});

			test("with invalid arg", function (assert) {
				let s, xs;
				function doTest(boxW, boxH, xs) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";
					assert.throws( () => s.fromXcoord(), prefix + "with no arg");
					assert.throws( () => s.fromXcoord(undefined), prefix + "with undefined");
					assert.throws( () => s.fromXcoord(null), prefix + "with null");
					assert.throws( () => s.fromXcoord({}), prefix + "with an object");
					assert.throws( () => s.fromXcoord(["A"]), prefix + "with an array");
					assert.throws( () => s.fromXcoord(""), prefix + "with empty string");
					assert.throws( () => s.fromXcoord("AB"), prefix + "with string longer than 1 char");
					assert.throws( () => s.fromXcoord(3.1415), prefix + "with a non-integer number");
					for (let x = 0; x < n; x++) {
						let cx = xs[x];
						assert.throws( () => s.fromXcoord(cx), /invalid/, 
							prefix + "with x-coord out of range: " + cx);
					}
				}
				doTest(2, 4, [
					...range("I", "Z"), ...range("a", "z"), ..."[\\]^_`",
					...range("0", "9"), ...range(0, 9)
				]);
				doTest(6, 6, [
										...range("k", "z"), ..."[\\]^_`",
					...range("0", "9"), ...range(0, 9)
				]);
			});
		}); // end module ".fromXcoord"

		module(".fromYcoord", () => { // -------------------------------------------------------------
			test("with invalid arg", function (assert) {
				function doTest(boxW, boxH, ys) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";
					assert.equal(ys.length, n, 
						prefix + "testing all " + n + " valid y-coords");
					for (let y = 0; y < n; y++) {
						let cy = ys[y];
						assert.equal(s.fromYcoord(cy), y, 
							prefix + "should map y-coord \"" + cy + "\" to y-index " + y);
					}
				}
				doTest(2, 4, [...range(1, 8)]);
				doTest(6, 6, [...range(1, 36)]);
			});
			test("with invalid arg", function (assert) {
				function doTest(boxW, boxH, ys) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";
					assert.throws( () => s.fromYcoord(), prefix + "with no arg");
					assert.throws( () => s.fromYcoord(undefined), prefix + "with undefined");
					assert.throws( () => s.fromYcoord(null), prefix + "with null");
					assert.throws( () => s.fromYcoord({}), prefix + "with an object");
					assert.throws( () => s.fromYcoord(["A"]), prefix + "with an array");
					assert.throws( () => s.fromYcoord(""), prefix + "with empty string");
					assert.throws( () => s.fromYcoord("AB"), prefix + "with string longer than 1 char");
					assert.throws( () => s.fromYcoord(3.1415), prefix + "with a non-integer number");
					for (let y = 0; y < n; y++) {
						let cy = ys[y];
						assert.throws( () => s.fromYcoord(cy), /invalid/, 
							prefix + "with y-coord out of range: " + cy);
					}
				}
				doTest(2, 4, [
					...range("A", "Z"), ...range("a", "z"), ..."[\\]^_`",
					"0", "9", 0, ...range(9, 49)
				]);
				doTest(6, 6, [
					...range("A", "Z"), ...range("a", "z"), ..."[\\]^_`",
					"0", "9", 0, ...range(37, 49)
				]);
			});
		}); // end module ".fromYcoord"

		module(".toXcoord", () => { // -------------------------------------------------------------
			test("with valid arg", function (assert) {
				function doTest(boxW, boxH, xs) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";

					assert.equal(xs.length, n, prefix + "testing all " + n + " valid x-indices");
					for (let x = 0; x < n; x++) {
						let cx = xs[x];
						assert.equal(s.toXcoord(x), cx, 
							prefix + "should map x-index " + x + " to x-coord \"" + cx + "\"");
					}
				}
				doTest(2, 4, [...range("A", "H")]);
				doTest(7, 7, [...range("A", "Z"), ...range("a", "w")]);
			});

			test("with invalid arg", function (assert) {
				function doTest(boxW, boxH, xs) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";
					assert.throws( () => s.toXcoord(), prefix + "with no arg");
					assert.throws( () => s.toXcoord(undefined), prefix + "with undefined");
					assert.throws( () => s.toXcoord(null), prefix + "with null");
					assert.throws( () => s.toXcoord({}), prefix + "with an object");
					assert.throws( () => s.toXcoord(["A"]), prefix + "with an array");
					assert.throws( () => s.toXcoord(""), prefix + "with empty string");
					assert.throws( () => s.toXcoord("AB"), prefix + "with string longer than 1 char");
					assert.throws( () => s.toXcoord(3.1415), prefix + "with a non-integer number");

					for (let x = 0; x < xs.length; x++) {
						let i = xs[x];
						assert.throws( () => s.toXcoord(i), /invalid/, 
							prefix + "with x-index out of range: " + i);
					}
				}
				doTest(2, 4, [...range(-9, -1), ...range(8, 64), 
							..."[\\]^_`", ...range("A", "Z"), ...range("a", "z"),
							...range("0", "9")
				]);
				doTest(7, 7, [...range(-50, -1), ...range(50, 64), 
							..."[\\]^_`", ...range("A", "Z"), ...range("a", "z"),
							...range("0", "9")
				]);
			});
		}); // end module ".toXcoord"

		module(".toYcoord", () => { // -------------------------------------------------------------
			test("class method, with valid arg", function (assert) {
				for (let y = 0; y < 25; y++) {
					let cy = (y + 1) + "";
					assert.equal(sudoku.toYcoord(y), cy, 
						"should map y=" + y + " to \"" + cy + "\"");
				}
			});

			test("with valid arg", function (assert) {
				function doTest(boxW, boxH, ys) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";

					assert.equal(ys.length, n, prefix + "testing all " + n + " valid y-indices");
					for (let y = 0; y < n; y++) {
						let cy = ys[y];
						assert.equal(s.toYcoord(y), cy, 
							prefix + "should map y-index " + y + " to y-coord \"" + cy + "\"");
					}
				}
				doTest(2, 4, [...range(1,  8)]);
				doTest(7, 7, [...range(1, 49)]);
			});

			test("with invalid arg", function (assert) {
				function doTest(boxW, boxH, ys) {
					let s = sudoku.create({ box: [boxW, boxH] });
					let n = boxW * boxH;
					let prefix = boxW + "x" + boxH + ": ";
					assert.throws( () => s.toYcoord(), prefix + "with no arg");
					assert.throws( () => s.toYcoord(undefined), prefix + "with undefined");
					assert.throws( () => s.toYcoord(null), prefix + "with null");
					assert.throws( () => s.toYcoord({}), prefix + "with an object");
					assert.throws( () => s.toYcoord(["A"]), prefix + "with an array");
					assert.throws( () => s.toYcoord(""), prefix + "with empty string");
					assert.throws( () => s.toYcoord("AB"), prefix + "with string longer than 1 char");
					assert.throws( () => s.toYcoord(3.1415), prefix + "with a non-integer number");

					for (let y = 0; y < ys.length; y++) {
						let i = ys[y];
						assert.throws( () => s.toYcoord(i), /invalid/, 
							prefix + "with y-index out of range: " + i);
					}
				}

				doTest(2, 4, [...range(-9, -1), ...range(8, 64), 
							..."[\\]^_`", ...range("A", "Z"), ...range("a", "z"),
							...range("0", "9")
				]);
				doTest(7, 7, [...range(-50, -1), ...range(50, 64), 
							..."[\\]^_`", ...range("A", "Z"), ...range("a", "z"),
							...range("0", "9")
				]);
			});
		}); // end module ".toYcoord"
	}); // end module "sudoku-coords"

}); // end require