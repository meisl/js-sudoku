
define(["./sequence", "./fn"], (seq, fn) => {
	const memoize = fn.memoize;

	function Cell(field, x, y) {
		let choices = field.newSetOfValues();
		let choicesRO = Object.create(null, {
			size: {
				get () { return choices.size; }
			},
			has: {
				value: v => choices.has(v),
			},
			[Symbol.iterator]: {
				value: () => choices[Symbol.iterator]()
			}
		});

		Object.defineProperties(this, {
			x:  { value: x },
			y:  { value: y },
			field: { value: field },
			choices: {
				get () { 
					return choicesRO;
				},
				enumerable: true,
				configurable: false
			},
			removeChoice: {
				value: function (v, outerAct) {
					if (choices.delete(v)) {
						let act = this.id + "!=" + this.field.symbol(v);
						if (outerAct !== undefined) {
							act += " <- " + outerAct;
						}
						this.groups.forEach(g => g.checkLastCandidate(v, act));
						if (this.canBeFixated) {
							let u = [...this.choices].pop();
							let todo = () => this.value = u;
							todo.toString = () => this.id
								+ ":=" + this.field.symbol(u)
								+ " (last choice <- " + act + ")";
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
		hasChoice: function (v) { return this.choices.has(v); },
		get isFixated() {
			return this.value !== undefined
		},
		get canBeFixated() {
			return !this.isFixated && this.choices.size == 1
		},
		get isLastCandidate () {
			return [...this.choices].some(
				v => [...this.groups].some(
					g => g.candidates(v).size == 1
				)
			);
		},
	};

	Object.defineProperties(Cell.prototype, {
		id: { get: memoize(function () {
			return this.field.toCoord(this.x, this.y) 
		}) },
		row: { get: memoize(function () {
			return this.field.rows[this.y];
		}) },
		col: { get: memoize(function () {
			return this.field.columns[this.x];
		}) },
		box: { get: memoize(function () {
			const x = this.x;
			const y = this.y;
			const bW = this.field.boxW();
			const bH = this.field.boxH();
			const i = Math.trunc(x / bW) + Math.trunc(y / bH) * bH;
			return this.field.boxes[i];
		}) },
		groups: { get: memoize(function () {
			return seq.create([this.row, this.col, this.box]);
		}) },
		siblings: { get: memoize(function () {
			return seq.create(new Set(
				this.groups.mapMany(g => g.cells.filter(c => c !== this))
			));
		}) },
		throwTwiceSet: {
			value: function (newValue) {
				if (newValue !== this.value)
					throw this.id + ": cannot set to " + newValue 
						+ " - already set to " + this.value;
			}
		},
		value: {
			set (v) {
				if ((v >= 0) && (v < this.field.n())) {
					if (this.hasChoice(v)) {
						Object.defineProperty(this, "value", {
							get: () => v,
							set: this.throwTwiceSet
						});
						const act = this.id + ":=" + this.field.symbol(v);
						this.forEachChoice(u => { 
							if (u != v) {
								this.removeChoice(u, act);
							}
						});
						this.siblings.forEach(sib => sib.removeChoice(v, act));
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
			},
			enumerable: true,
			configurable: false
		},
	});

	return Object.create(null, {
		create: { value: (field, x, y) => new Cell(field, x, y) },
	});
});
