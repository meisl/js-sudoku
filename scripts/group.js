
define(["./cell"], function(cell) {
	
	function createGroup(s) {
		var n = s.n();
		var cells = new Array(n);
		var out = {
			field: () => s,
			cell:  i => cells[i]
		};
		for (var i = 0; i < n; i++) {
			var c = cell.create(s);
			cells[i] = c;
		}
		return out;
	}
	
	function createRow(s) {
		return createGroup(s);
	}

	return {
		createRow:    s => createGroup(s),
		createColumn: s => createGroup(s),
		createBox:    s => createGroup(s),
	};
});
