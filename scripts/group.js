
define(function() {
	
	function createGroup(s) {
		return {
			field: () => s
		};
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
