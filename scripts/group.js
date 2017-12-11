define(["./cell", "./sequence"], (cell, seq) => {

	function Group (field, cells, id) {
		Object.defineProperty(this, "id", {
			value: id,		writable: false,
							enumerable: true,
							configurable: false
		})
	}
	Group.prototype = {
		toString: function () { return this.id; },

	};

	function createGroup(field, cells, id) {
		var n = field.n();
		var candidates = new Array(n);
		for (var i = 0; i < n; i++) {
			candidates[i] = new Set(cells);
		}
		var out = new Group(field, cells, id);
		out.field = () => field;
		out.cell =  i => cells[i];
		out.candidates = v => {
			return candidates[v];
		};
		out.cells = seq.create(cells);
		Object.defineProperty(out, "cs", {
			get: function () {
				let x = {};
				for (let v = 0; v < n; v++) {
					let cs = candidates[v];
					if (cs.size > 1) {
						x[field.symbol(v)] = [...cs].join(", ");
					}
				}
				return x;
			}
		});
		out.removeCandidate = function (c, v) {
			let cs = candidates[v];
			if (candidates[v].delete(c)) {
				c.removeChoice(v);
				if (cs.size == 1) {
					let d = [...cs].pop();
					if (!d.isFixated) {
						let todo = () => { d.value = v; };
						let desc = d.id 
							+ " := " + field.symbol(v) 
							+ " (last candidate in " + id + ")";
						todo.toString = () => desc;
						field.addTodo(todo, desc);
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
		};
		out.hasCandidate = (c, v) => candidates[v].has(c);

		return out;
	}
	
	return Object.create(null, {
		create:  { value: createGroup },
	});
});
