
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
			removeCandidate: (c, v) => {
				console.log(out + ".removeCandidate(" + c.id + ", " + v + ")");
				candidates[v].delete(c);
				c.removeChoice(v);
			},
			hasCandidate: (c, v) => candidates[v].has(c)
		};
		return out;
	}
	
	return {
		create:  createGroup,
	};
});
