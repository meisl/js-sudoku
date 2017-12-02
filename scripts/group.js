
define(["./cell"], function(cell) {

	function Group (field, cells, id) {
		Object.defineProperty(this, "id", {
			value: id,
			enumerable: true,
			writable: false,
			configurable: false
		})
	}
	Group.prototype = {


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
		Object.defineProperty(out, "cs", {
			get: function () {
				let x = {};
				for (let v = 0; v < n; v++) {
					let cs = candidates[v];
					if (cs.size > 1) {
						x[v] = [...cs]
							.map(c => c.str)
							.join(", ")
						;
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
	
	return {
		create:  createGroup,
	};
});
