require(["scripts/sudoku"], function(sudoku) {

	function* range(lo, hi) {
		if (typeof lo == "string") {
			lo = lo.charCodeAt(0);
			hi = hi.charCodeAt(0);
			while (lo <= hi) yield String.fromCharCode(lo++);
		} else {
			while (lo <= hi) yield lo++;
		}
	}

	QUnit.module("sudoku-coords");
	
	QUnit.test(".fromXcoord", function(assert) {
		function test(boxW, boxH, xs) {
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
		test(2, 4, [...range("A", "H")]);
		test(6, 6, [...range("A", "Z"), ...range("a", "j")]);
	});

	QUnit.test(".fromYcoord", function(assert) {
		function test(boxW, boxH, ys) {
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
		test(2, 4, [...range(1, 8)]);
		test(6, 6, [...range(1, 36)]);
	});
		
	QUnit.test(".fromXcoord with invalid arg", function(assert) {
		let s, xs;
		s = sudoku.create({ box: [2, 4] });
		xs = [..."IJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz[\\]^_`0123456789",
			0,1,2,3,4,5,6,7,8,9];

		assert.throws( () => s.fromXcoord(), "with no arg");
		assert.throws( () => s.fromXcoord(undefined), "with undefined");
		assert.throws( () => s.fromXcoord(null), "with null");
		assert.throws( () => s.fromXcoord({}), "with an object");
		assert.throws( () => s.fromXcoord(["A"]), "with an array");
		assert.throws( () => s.fromXcoord(""), "with empty string");
		assert.throws( () => s.fromXcoord("AB"), "with string longer than 1 char");
		assert.throws( () => s.fromXcoord(3.1415), "with a non-integer number");

		for (let x = 0; x < xs.length; x++) {
			let cx = xs[x];
			assert.throws( () => s.fromXcoord(cx), /invalid/, 
				s.boxW() + "x" + s.boxH() + ": with x-coord out of range: " + cx);
		}

		s = sudoku.create({ box: [6, 6] });
		xs = [..."klmnopqrstuvwxyz[\\]^_`0123456789",
			0,1,2,3,4,5,6,7,8,9];
		for (let x = 0; x < xs.length; x++) {
			let cx = xs[x];
			assert.throws( () => s.fromXcoord(cx), /invalid/, 
				s.boxW() + "x" + s.boxH() + ": with x-coord out of range: " + cx);
		}
	});
	
	QUnit.test(".toXcoord", function(assert) {
		let s, xs;
		s = sudoku.create({ box: [2, 4] });
		xs = "ABCDEFGH";
		assert.equal(xs.length, s.n(), "testing all " + xs.length + " valid x-indices");
		
		for (let x = 0; x < xs.length; x++) {
			let cx = xs[x];
			assert.equal(s.toXcoord(x), cx, 
				s.boxW() + "x" + s.boxH() + ": should map x=" + x + " to \"" + cx + "\"");
		}

		s = sudoku.create({ box: [7, 7] });
		xs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvw";
		assert.equal(xs.length, s.n(), "testing all " + xs.length + " valid x-indices");
		
		for (let x = 0; x < xs.length; x++) {
			let cx = xs[x];
			assert.equal(s.toXcoord(x), cx, 
				s.boxW() + "x" + s.boxH() + ": should map x=" + x + " to \"" + cx + "\"");
		}
	});
	
	QUnit.test(".toXcoord with invalid arg", function(assert) {
		let s, xs;
		s = sudoku.create({ box: [2, 4] });
		assert.throws( () => s.toXcoord(), "with no arg");
		assert.throws( () => s.toXcoord(undefined), "with undefined");
		assert.throws( () => s.toXcoord(null), "with null");
		assert.throws( () => s.toXcoord({}), "with an object");
		assert.throws( () => s.toXcoord(["A"]), "with an array");
		assert.throws( () => s.toXcoord(""), "with empty string");
		assert.throws( () => s.toXcoord("AB"), "with string longer than 1 char");
		assert.throws( () => s.toXcoord(3.1415), "with a non-integer number");

		xs = [-s.n(), -s.n() + 1, -2, -1, s.n(), s.n() + 1, NaN];
		for (let x = 0; x < xs.length; x++) {
			let i = xs[x];
			assert.throws( () => s.toXcoord(i), /invalid/, 
				s.boxW() + "x" + s.boxH() + ": with x-index out of range: " + i);
		}
		
		s = sudoku.create({ box: [7, 7] });
		xs = [-s.n(), -s.n() + 1, -2, -1, s.n(), s.n() + 1, NaN];
		for (let x = 0; x < xs.length; x++) {
			let i = xs[x];
			assert.throws( () => s.toXcoord(i), /invalid/, 
				s.boxW() + "x" + s.boxH() + ": with x-index out of range: " + i);
		}

	});


	

	
	QUnit.test(".toYcoord", function(assert) {
		for (let y = 0; y < 25; y++) {
			let cy = (y + 1) + "";
			assert.equal(sudoku.toYcoord(y), cy, 
				"should map y=" + y + " to \"" + cy + "\"");
		}
	});

	QUnit.test("accessing cells via field[coord]", function(assert) {
		let xs = "ABCDEFGHIJKLMNOP";
		let s = sudoku.create({ box: [4, 4]});
		for (let y = 0; y < s.n(); y++) {
			let cy = (y + 1) + "";
			for (let x = 0; x < s.n(); x++) {
				let cx = xs[x];
				let c = cx + cy;
				assert.strictEqual(s[c], s.cell(x,y), 
					"cell (" + x + ", " + y + ") should be addressable via ." + c);
			}
		}
		//s.A1 = "foo";
		//console.log("xxxx ");
		console.log(s);
	});

});