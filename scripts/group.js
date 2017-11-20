
define(["./cell"], function(cell) {
	
	function createGroup(s, cells) {
		var out = {
			field: () => s,
			cell:  i => cells[i],
		};
		return out;
	}
	
	function createRow(s) {
		var n = s.n();
		var cells = new Array(n);
		var row = createGroup(s, cells);
		for (var i = 0; i < n; i++) {
			cells[i] = cell.create(row);
		}
		return row;
	}

	return {
		createRow:    s => createRow(s),
		createColumn: s => createGroup(s),
		createBox:    s => createGroup(s),
	};
});
