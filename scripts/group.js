
define(["./cell"], function(cell) {
	
	function createGroup(field, cells) {
		var n = field.n();
		var candidates = new Array(n);
		for (var i = 0; i < n; i++) {
			candidates[i] = new Set(cells);
		}
		var out = {
			field: () => field,
			cell:  i => cells[i],
			candidates: v => {
				return candidates[v];
			},
			removeCandidate: (c, v) => {
				let cs = candidates[v];
				if (candidates[v].delete(c)) {
					c.removeChoice(v);
					if (cs.size == 1) {
						let d = [...cs].pop();
						if (!d.isFixated) {
							field.todos.add(d.id 
								+ ": last candidate for " + v + " in " + out);
							/*
							d.forEachChoice(u => {
								if (u != v) {
									d.removeChoice(u);
								}
							});
							*/
						}
					}
				}
			},
			hasCandidate: (c, v) => candidates[v].has(c)
		};
		return out;
	}
	
	return {
		create:  createGroup,
	};
});
