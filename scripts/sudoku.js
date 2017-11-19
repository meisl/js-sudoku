
define(["./group"], function(group) {
	
	function create(options) {
		if (options && options.box) {
			
			var boxW = options.box[0];
			var boxH = options.box[1];
			var n = boxW * boxH; // cells per group = nr of rows = nr of cols = nr of boxes
			var symbols = new Array(n);
			var values  = {};
			var rows = new Array(n);
			var columns = new Array(n);
			var boxes = new Array(n);
			var out = {
				n:         () => n,
				cellCount: () => n*n,
				symbol:    v => symbols[v],
				value:     s => values[s],
				cell:      (x,y) => rows[y].cell(x)
			};
			for (var i = 0; i < n; i++) {
				rows[i]    = group.createRow(out)
				columns[i] = group.createColumn(out)
				boxes[i]   = group.createBox(out)
			}
			out.rows = rows;
			out.columns = columns;
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
			throw "missing/bad options"
		}
	}

	return {
		create: create
	};
});


/*
 Elektor 558
 +---------+---------+
 | 0 - 4 - | - - - - |
 | - - - 3 | - 7 1 - |
 | - - - E | - D - 2 |
 | - - - 2 | - 3 E 5 |
 +---------+---------+
 | F - - - | C - D 6 |
 | 9 - A - | 5 F 0 - |
 | - - 2 - | - - - - |
 | - 5 6 - | - 8 B E |
 +---------+---------+
 
 
 0 4      
    3  71 
    E  D 2
    2  3E5
*/