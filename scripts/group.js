
define(["./cell"], function(cell) {
	
	function createGroup(s, cells) {
		var n = s.n();
		var candidates = new Array(n);
		for (var i = 0; i < n; i++) {
			candidates[i] = new Set(cells);
		}
		var out = {
			field: () => s,
			cell:  i => cells[i],
			candidates: v => {
				return candidates[v];
			},
			removeCandidate: (v, c) => {
				candidates[v].delete(c);
			}
		};
		return out;
	}
	
	return {
		create:  createGroup,
	};
});
