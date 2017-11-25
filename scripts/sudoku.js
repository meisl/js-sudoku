
define(["./cell", "./group"], function(cell, group) {
	
	function create(options) {
		if (options && options.box) {
			
			var boxW = options.box[0];
			var boxH = options.box[1];
			var n = boxW * boxH; // cells per group = nr of rows = nr of cols = nr of boxes
			var rows = new Array(n);
			var columns = new Array(n);
			var boxes = new Array(n);
			var values2symbols = {};
			var symbols2values = new Array(n);
			var out = {
				n:         () => n,
				boxW:      () => boxW,
				boxH:      () => boxH,
				cellCount: () => n*n,
				cell:      (x,y) => rows[y].cell(x),
				forEachCell: cb => {
					for (var y = 0; y < n; y++) {
						for (var x = 0; x < n; x++) {
							cb(out.cell(x, y), x, y);
						}
					}
				},
				symbol:    v => symbols2values[v],
				value:     s => values2symbols[s],
				newSetOfValues: () => new Set(symbols2values.keys()),
				stringify: cellCb => {
					if (cellCb === undefined) {
						cellCb = c => {
							let v = c.value;
							return (v === undefined)
								? "-"
								: out.symbol(v);
						};
					}
					var hSep = "+" + "-".repeat(boxW * 2 + 1);
					hSep = hSep.repeat(boxH) + "+\n";
					var result = hSep;
					var y = 0;
					for (let by = 0; by < boxW; by++) {
						for (let y0 = 0; y0 < boxH; y0++) {
							let x = 0;
							for (let bx = 0; bx < boxH; bx++) {
								result += "| ";
								for (let x0 = 0; x0 < boxW; x0++) {
									result += cellCb(out.cell(x, y)) + " ";
									x++;
								}
							}
							result += "|\n";
							y++;
						}
						result += hSep;
					}
					return result;
				}
			};
			
			var cells;
			var x, y;
			var row, column, box;
			
			for (y = 0; y < n; y++) {
				cells = new Array(n);
				for (x = 0; x < n; x++) {
					cells[x] = cell.create(out, x, y);
				}
				row = group.create(out, cells);
				rows[y] = row;
			}
			out.rows = rows;
			
			for (x = 0; x < n; x++) {
				cells = new Array(n);
				for (y = 0; y < n; y++) {
					cells[y] = out.cell(x, y);
				}
				column = group.create(out, cells);
				columns[x] = column;
			}
			out.columns = columns;
			
			i = 0;
			for (var by = 0; by < boxW; by++) { // boxW = n/boxH
				for (var bx = 0; bx < boxH; bx++) { // boxH = n/boxW
					cells = new Array(n);
					var k = 0;
					for (y = by*boxH; y < (by+1)*boxH; y++) {
						for (x = bx*boxW; x < (bx+1)*boxW; x++) {
							cells[k++] = out.cell(x, y);
						}
					}
					box = group.create(out, cells);
					boxes[i++] = box;
				}
			}
			out.boxes = boxes;
			
			symbols2values = new Array(n);
			if (options.symbols) {
				for (var i = 0; i < n; i++) {
					symbols2values[i] = options.symbols[i];
					values2symbols[options.symbols[i]] = i;
				}
			} else {
				for (var i = 0; i < n; i++) {
					symbols2values[i] = i;
					values2symbols[i] = i;
				}
			}
			
			return out;
		} else {
			throw "sudoku.create: missing/bad options"
		}
	}

	return {
		create: create,
		parse: s => {
			var boxW, boxH, n, options, result;
			var lines = s.split("\n");
			var hSep = lines[0];
			var t = hSep.split("+");
			boxH = t.length - 2;
			boxW = (t[1].length - 1)/2;
			n = boxW * boxH;
			
			var symbols = new Set();
			
			lines.filter(line => line.startsWith("|"))
				.forEach(line => {
					line.split(/[- +|\r\n]/)
						.filter(ch => ch != "")
						.forEach(ch => symbols.add(ch));
					;
				})
			;
			if (symbols.size > n) {
				throw "too many symbols found: " + [...symbols];
			}
			let ch = 1;
			while (symbols.size < n) {
				while (symbols.has(ch + "")) {
					if (ch < 9) {
						ch++;
					} else if (ch == 9) {
						ch = "A"
					} else {
						ch = String.fromCharCode(ch.charCodeAt(0) + 1);
					}
				}
				symbols.add(ch + "");
			}

			options = { box: [boxW, boxH], symbols: [...symbols] };
			result = create(options);
			
			let y = 0;
			lines.filter(line => line.startsWith("|"))
				.forEach(line => {
					let x = 0;
					line.split(/[| \r\n]+/)
						.filter(ch => ch != "")
						.forEach(ch => {
							if (symbols.has(ch)) {
								result.cell(x, y).value = result.value(ch);
							}
							x++;
						});
					;
					y++;
				})
			;
			
			return result;
		}

	};
});


/*
 Elektor 558
 +---------+---------+---------+---------+
 | 0 - 4 - | - - - - | - - - D | F 3 7 E |
 | - - - 3 | - 7 1 - | - - - - | - - - 9 |
 | - - - E | - D - 2 | 1 F 6 3 | - 4 - 5 |
 | - - - 2 | - 3 E 5 | - - - B | C - - 6 |
 +---------+---------+---------+---------+
 | F - - - | C - D 6 | - - 5 - | 7 9 - 4 |
 | 9 - A - | 5 F 0 - | B C - E | - 1 - - |
 | - - 2 - | * * * * | * - 3 - | - E - - |
 | - 5 6 - | - 8 B E | - - 1 - | - 8 - - |
 +---------+---------+---------+---------+
 | - - 7 - | - - - 4 | 9 - - A | E 8 - - |
 | D A - - | - - - - | 0 - 2 5 | 1 - 4 - |
 | - E - 9 | 8 A - - | 6 - B - | 2 5 F - |
 | - 4 - - | 6 E - - | - - F 8 | - - - - |
 +---------+---------+---------+---------+
 | - 0 9 - | - 5 - - | - - - - | D F 8 - |
 | - - D C | - - - F | 3 5 0 - | - - - 7 |
 | 4 - - F | B 2 C - | A - - - | - - - - |
 | 6 7 - - | - - 4 - | - - D F | - - - 1 |
 +---------+---------+---------+---------+

 empty 4x4
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+

 empty 3x3
 +-------+-------+-------+
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 +-------+-------+-------+
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 +-------+-------+-------+
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 +-------+-------+-------+

*/