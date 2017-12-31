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
		[Symbol.toStringTag]: { value: "Group" },
		n: { get: function () {
			return this.field.n();
		} },
		symbol: { value: function (val) {
			return this.field.symbol(val);
		} },
		value: { value: function (sym) {
			return this.field.value(sym);
		} },
		toString: { value: function () {
			return this.id;
		} },
		cell: { value: function (i) {
			return this.cells.skip(i).head();
		} },
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

	function createFactory(field, proto) {
		const customCtor = (proto.constructor)
			? proto.constructor
			: fn.returnThis
		;
		function ctor(cells, ...args) {
			const g = Object.create(ctor.prototype);
			Object.defineProperties(g, {
				cells: {
					get: function () {
						const cellsArray = [...cells];
						const cellsSeq   = seq.create(cellsArray);
						Object.defineProperties(this, {
							cell:  { value: i => cellsArray[i] },
							cells: { value: cellsSeq },
						});
						return cellsSeq;
					}, 
					configurable: true 
				}
			});
			customCtor.apply(g, args);
			return g;
		}
		ctor.prototype = Object.create(Group.prototype, {
			field: { value: field },
		});
		Reflect.ownKeys(proto).filter(key => key !== "constructor")
			.forEach(key => {
				const desc = Reflect.getOwnPropertyDescriptor(proto, key);
				Reflect.defineProperty(ctor.prototype, key, desc);
			});
		return ctor;
	};
	
	return Object.create(null, {
		create:  { value: createGroup },
		createFactory: { value: createFactory },
	});
});
