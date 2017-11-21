
define(["./cell", "./group"], function(cell, group) {
	
	function create(options) {
		if (options && options.box) {
			
			var boxW = options.box[0];
			var boxH = options.box[1];
			var n = boxW * boxH; // cells per group = nr of rows = nr of cols = nr of boxes
			var rows = new Array(n);
			var columns = new Array(n);
			var boxes = new Array(n);
			var symbols = new Array(n);
			var values  = {};
			var out = {
				n:         () => n,
				boxW:      () => boxW,
				boxH:      () => boxH,
				cellCount: () => n*n,
				symbol:    v => symbols[v],
				value:     s => values[s],
				cell:      (x,y) => rows[y].cell(x),
				forEachCell: cb => {
					for (var y = 0; y < n; y++) {
						for (var x = 0; x < n; x++) {
							cb(out.cell(x, y), x, y);
						}
					}
				}
			};
			
			var cells;
			var x, y;
			var row, column, box;
			for (y = 0; y < n; y++) {
				cells = new Array(n);
				row = group.create(out, cells);
				for (x = 0; x < n; x++) {
					cells[x] = cell.create(out, x, y);
				}
				rows[y] = row;
			}
			out.rows = rows;
			for (x = 0; x < n; x++) {
				cells = new Array(n);
				column = group.create(out, cells);
				for (y = 0; y < n; y++) {
					cells[y] = out.cell(x, y);
				}
				columns[x] = column;
			}
			out.columns = columns;
			
			i = 0;
			for (var by = 0; by < boxW; by++) { // boxW = n/boxH
				for (var bx = 0; bx < boxH; bx++) { // boxH = n/boxW
					cells = new Array(n);
					box = group.create(out, cells);
					boxes[i++] = box;
					var k = 0;
					for (y = by*boxH; y < (by+1)*boxH; y++) {
						for (x = bx*boxW; x < (bx+1)*boxW; x++) {
							cells[k++] = out.cell(x, y);
						}
					}
				}
			}
			out.boxes = boxes;
			
			symbols = new Array(n);
			if (options.symbols) {
				for (var i=0; i < n; i++) {
					symbols[i] = options.symbols[i];
					values[options.symbols[i]] = i;
				}
			} else {
			
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