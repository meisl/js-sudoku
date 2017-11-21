
define(function() {
	
	function create(r) {
		var row = r;
		var column;
		var box;
		var out = {
			field: row.field,
			row:    () => row,
			column: () => column,
			box:    () => box,
			forEachGroup: cb => {
				cb(row);
				cb(column);
				cb(box);
			},
			initColumn: c => {
				column = c;
				out.initColumn = undefined;
				return out;
			},
			initBox: b => {
				box = b;
				out.initBox = undefined;
				return out;
			}
		};
		return out;
	}

	return {
		create: row => create(row),
	};
});
