define(["./fn", "./sequence"], (fn, seq) => {
	const memoize = fn.memoize;

	function Group(field, cells, id) {
		Object.defineProperties(this, {
			id:    { value: id, enumerable: true  },
			field: { get: () => field, enumerable: true },
			cells: { value: seq.create(cells) }
		});
	}
	Group.prototype = Object.create(Object.prototype, {
		n: { get: function () { return this.field.n() } },
		toString: { value: function () {
			return this.id; }
		},
		cell: { value: function (i) {
			return this.cells.skip(i).head() }
		},
		candidates: { value: function (v) {
			return this.cells.filter(c => c.hasChoice(v));
		} },
		hasCandidate: { value: function (c, v) {
			return this.cells
				.filter(d => (d === c) && c.hasChoice(v))
				.length > 0;
		} },
		checkLastCandidate: { value: function (v, act) {
			const cs = this.candidates(v);
			if (cs.length === 1) {
				const c = cs.head();
				if (!c.isFixated) {
					const todo = () => { c.value = v; };
					const desc = c.id 
						+ ":=" + this.field.symbol(v) 
						+ " (last candidate in " + this.id 
						+ " <- " + act
						+ ")"
					;
					todo.toString = () => desc;
					this.field.addTodo(todo, desc);
				}
			}
		} },
		removeCandidate: { value: function (c, v) {
			return c.removeChoice(v);
		} },
		cs: { get: function () {
			let x = {};
			for (let v = 0; v < this.n; v++) {
				const cs = this.candidates(v);
				if (cs.size > 1) {
					x[this.field.symbol(v)] = [...cs].join(", ");
				}
			}
			return x;
		} },
	});

	function createGroup(field, cells, id) {
		var out = new Group(field, cells, id);
		return out;
	}
	
	return Object.create(null, {
		create:  { value: createGroup },
	});
});
