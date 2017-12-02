
define(function() {

	function Cell(field, x, y) {
		let value;
		let choices = field.newSetOfValues();
		let choicesRO = {
			get size() { return choices.size; },
			has: v => choices.has(v),
			[Symbol.iterator]: () => choices[Symbol.iterator](),
		};
		Object.defineProperties(this, {
			id: {
				value: field.toCoord(x, y),
				enumerable: true,
				writable: false,
				configurable: false
			},
			x: {
				value: x,
				enumerable: true,
				writable: false,
				configurable: false
			},
			y: {
				value: y,
				enumerable: true,
				writable: false,
				configurable: false
			},
			field: {
				get () { return field; },
				enumerable: true,
				configurable: false
			},
			value: {
				get () { return value; },
				set (v) {
					if (value === undefined) {
						if ((v >= 0) && (v < this.field.n())) {
							if (this.hasChoice(v)) {
								value = v;
								this.forEachChoice(u => { 
									if (u != v) {
										this.removeChoice(u);
									}
								});
								this.forEachGroup(g => {
									g.candidates(v).forEach(c => {
										if (c !== this)
											c.removeChoice(v);
									})
								});
							} else {
								throw this + ": " + v 
									+ " (\"" + this.field.symbol(v) + "\")"
									+ " not in choices {"
									+ [...this.choices]+ "}"
									+ " ({"
									+ [...this.choices].map(u => "\"" + this.field.symbol(u) + "\"")
									+ "})"
								;
							}
						} else {
							throw "not a value: " + v;
						}
					} else if (value != v) {
						throw this.id + ": cannot set to " + v 
							+ " - already set to " + value;
					}
				},
				enumerable: true,
				configurable: false
			},
		});
		Object.defineProperties(this, {
			isFixated: {
				get () { return value !== undefined },
				enumerable: true,
				configurable: false
			},
			canBeFixated: {
				get () { return !this.isFixated && choices.size == 1 },
				enumerable: true,
				configurable: false
			},
			isLastCandidate: {
				get () {
					return [...this.choices].some(
						v => [this.row(), this.column(), this.box()].some(
							g => g.candidates(v).size == 1
						)
					);
				},
				enumerable: true,
				configurable: false
			},
			choices: {
				get () { return choicesRO },
				enumerable: true,
				configurable: false
			},
			removeChoice: {
				value: function (v) {
					if (choices.delete(v)) {
						this.forEachGroup(g => g.removeCandidate(this, v));
						if (this.canBeFixated) {
							let u = [...this.choices].pop();
							let todo = () => this.value = u;
							todo.toString = () => this.id + ":=" + this.field.symbol(v) + " (last choice)";
							this.field.addTodo(todo);
						}
					}
				},
				enumerable: true,
				configurable: false
			},
		});
		return this;
	}

	Cell.prototype = {
		row: function row() {
			let g = this.field.rows[this.y];
			Object.defineProperty(this, "row", {
				value: function () { return g; },
				enumerable: true,
				writable: false,
				configurable: false
			});
			return g;
		},
		column: function column() {
			let g = this.field.columns[this.x];
			Object.defineProperty(this, "column", {
				value: function () { return g; },
				enumerable: true,
				writable: false,
				configurable: false
			});
			return g;
		},
		box: function box() {
			let i = Math.floor(this.x / this.field.boxW()) 
				+ Math.floor(this.y / this.field.boxH()) * this.field.boxH();
			let g = this.field.boxes[i];
			Object.defineProperty(this, "box", {
				value: function () { return g; },
				enumerable: true,
				writable: false,
				configurable: false
			});
			return g;
		},
		toString: function () {
			return this.id + "{" 
				+ [...this.choices]
					.map(v => this.field.symbol(v))
					.sort()
					.join(",")
				+ "}";
		},
		choiceCount: function () { return this.choices.size; },
		forEachChoice: function (cb) { [...this.choices].forEach(cb); },
		hasChoice: function (v) { return this.choices.has(v); }

	};
	
	function create(f, x, y) {
		var out = new Cell(f, x, y);
		out.forEachGroup = cb => {
			let row = out.row();
			let column = out.column();
			let box = out.box();
			out.forEachGroup = cb => {
				cb(row);
				cb(column);
				cb(box);
			};
			return out.forEachGroup(cb);
		};
			
		return out;
	}

	return {
		create: (field, x, y) => create(field, x, y),
	};
});
