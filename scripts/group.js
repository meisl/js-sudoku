
define(["./cell"], function(cell) {
	
	function createGroup(s, cells) {
		var out = {
			field: () => s,
			cell:  i => cells[i],
		};
		return out;
	}
	
	return {
		create:  createGroup,
	};
});
