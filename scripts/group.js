define(["./fn", "./sequence"], (fn, seq) => {
	const memoize = fn.memoize;

	Object.defineProperty(Object.prototype, Symbol.toStringTag, {
		get() {
			if ((this === Object.prototype) || !this.constructor)
				return "Object";
			const result = this.constructor.name || "Object";
			const proto = this.constructor.prototype;
			Reflect.defineProperty(proto, Symbol.toStringTag, {
				value: result,
				configurable: true
			});
			const p = Object.getPrototypeOf(proto);
			if (p !== null) p[Symbol.toStringTag];
			return result;
		}	
	});

	class Group {
		static get construct() {
			return (...args) => Reflect.construct(this, args);
		}
		static get className() {
			return this.name || "<anonymous>";
		}
		
		static get field() {
			throw "subclass "
				+ this.className + " should've provided a 'field' property";
		}
		static get n() { return this.field.n(); }

		get className() { return this.constructor.className; }

		get field() { return this.constructor.field; }
		get n()     { return this.constructor.n; }
		symbol(val) { return this.field.symbol(val); }
		value(sym)  { return this.field.value(sym); }
		addTodo(t)  { return this.field.addTodo(t); }

		cellIterator() {
			throw "subclass "
				+ this.className + " should've provided a 'cellIterator' method"
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

	return Group;
});
