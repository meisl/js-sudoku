
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
				stringify: () => {
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
									let v = out.cell(x, y).value;
									result += (v === undefined)
										? "- "
										: out.symbol(v) + " ";
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
		create: create
	};
});


/*
 Elektor 558
 +---------+---------+---------+---------+
 | 0 - 4 - | - - - - | - - - - | - - - - |
 | - - - 3 | - 7 1 - | - - - - | - - - - |
 | - - - E | - D - 2 | - - - - | - - - - |
 | - - - 2 | - 3 E 5 | - - - - | - - - - |
 +---------+---------+---------+---------+
 | F - - - | C - D 6 | - - - - | - - - - |
 | 9 - A - | 5 F 0 - | - - - - | - - - - |
 | - - 2 - | * * * * | * - - - | - - - - |
 | - 5 6 - | - 8 B E | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - - 7 - | - - - 4 | - - - - | - - - - |
 | D A - - | - - - - | - - - - | - - - - |
 | - E - 9 | 8 A - - | - - - - | - - - - |
 | - 4 - - | 6 E - - | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - 0 9 - | - - - - | - - - - | - - - - |
 | - - D C | - - - - | - - - - | - - - - |
 | 4 - - F | - - - - | - - - - | - - - - |
 | 6 7 - - | - - - - | - - - - | - - - - |
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