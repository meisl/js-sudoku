define(["./fn", "./sequence"], (fn, seq) => {
	const memoize = fn.memoize;

	class Group {
		constructor(field, cells, id) {
			if (id !== undefined) {
				Object.defineProperty(this, "id", {
					value: id, enumerable: true
				})
			}
			if (field !== undefined) {
				Object.defineProperty(this, "field", {
					value: field, enumerable: true
				})
			}
			if (cells !== undefined) {
				Object.defineProperty(this, "cells", {
					value: cells, enumerable: true
				})
			}
		}
		get [Symbol.toStringTag]() { return "Group" }

		get n()     { return this.field.n(); }
		symbol(val) { return this.field.symbol(val); }
		value(sym)  { return this.field.value(sym); }
		addTodo(t)  { return this.field.addTodo(t); }

		toString() {
			return this.id;
		}
		cellIterator() {
			throw "subclass did not provide method cellIterator"
		}
		get cells() {
			const cellsArr = [...this.cellIterator()];
			const cellsSeq = seq.create(cellsArr);
			Object.defineProperties(this, {
				cells: { value: cellsSeq },
				cell:  { value: i => cellsArr[i] },
			});
			return cellsSeq;
		}
		cell(i) {
			return this.cells.skip(i).head();
		}
		candidates(v) {
			return this.cells.filter(c => c.hasChoice(v));
		}
		hasCandidate(c, v) {
			return this.cells
				.filter(d => (d === c) && c.hasChoice(v))
				.length > 0;
		}
		checkLastCandidate(v, act) {
			const cs = this.candidates(v);
			if (cs.length === 1) {
				const c = cs.head();
				if (!c.isFixated) {
					const todo = () => { c.value = v; };
					const desc = c.id 
						+ ":=" + this.symbol(v) 
						+ " (last candidate in " + this.id 
						+ " <- " + act
						+ ")"
					;
					todo.toString = () => desc;
					this.addTodo(todo, desc);
				}
			}
		}
		removeCandidate(c, v) {
			return c.removeChoice(v);
		}
		get cs() {
			let x = {};
			for (let v = 0; v < this.n; v++) {
				const cs = this.candidates(v);
				if (cs.size > 1) {
					x[this.field.symbol(v)] = [...cs].join(", ");
				}
			}
			return x;
		}
	};

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
/*	
	return Object.create(null, {
		create:  { value: createGroup },
		createFactory: { value: createFactory },
	});
*/


	Group.create = createGroup;
	Group.createFactory = createFactory;
	return Group;
});
