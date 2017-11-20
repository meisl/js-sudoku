
define(function() {
	
	function create(r) {
		var row = r;
		var column;
		var box;
		var out = {
			field: row.field,
			forEachGroup: cb => {
				cb(row);
				cb(column);
				cb(box);
			},
			initColumn: col => {
				column = col;
				out.initColumn = undef;
				return out;
			}
		};
		return out;
	}

	return {
		create: row => create(row),
	};
});
