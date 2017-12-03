
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
				value: field.toCoord(x, y),	writable: false,
											enumerable: true,
											configurable: false
			},
			x: {
				value: x,	writable: false,
							enumerable: true,
							configurable: false
			},
			y: {
				value: y,	writable: false,
							enumerable: true,
							configurable: false
			},
			field: {
				//get () { return field; },
				value: field, 	writable: false,
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
								this.groups.forEach(g => {
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
						v => [...this.groups].some(
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
						this.groups.forEach(g => g.removeCandidate(this, v));
						if (this.canBeFixated) {
							let u = [...this.choices].pop();
							let todo = () => this.value = u;
							todo.toString = () => this.id + " := " + this.field.symbol(v)
								+ " (last choice)";
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
		get row() {
			let g = this.field.rows[this.y];
			Object.defineProperty(this, "row", {
				value: g,	writable: false,
							enumerable: true,
							configurable: false
			});
			return g;
		},
		get col() {
			let g = this.field.columns[this.x];
			Object.defineProperty(this, "col", {
				value: g,	writable: false,
							enumerable: true,
							configurable: false
			});
			return g;
		},
		get box() {
			let i = Math.floor(this.x / this.field.boxW()) 
				+ Math.floor(this.y / this.field.boxH()) * this.field.boxH();
			let g = this.field.boxes[i];
			Object.defineProperty(this, "box", {
				value: g,	writable: false,
							enumerable: true,
							configurable: false
			});
			return g;
		},
		get groups() {
			let gsAr = [this.row, this.col, this.box];
			let gsIt = gsAr[Symbol.iterator]();
			let gs = {
				[Symbol.iterator]: () => gsIt,
				size:    gsAr.length,
				length:  gsAr.length,
				forEach: cb => gsAr.forEach(cb),
				filter:  cb => gsAr.filter(cb),
				map:     cb => gsAr.map(cb),
			};
			Object.defineProperty(this, "groups", {
				value: gs,	writable: false,
							enumerable: true,
							configurable: false
			});
			return gs;
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

	return {
		create: (field, x, y) => new Cell(field, x, y),
	};
});
