
define(function() {
	
	function create(f, x, y) {
		var row;
		var column;
		var box;
		var choiceCount = f.n();
		var choices = f.newSetOfValues();
		var value;
		var out = {
			id: "Cell(" + x + "," + y + ")",
			field: () => f,
			row: () => {
				row = f.rows[y];
				out.row = () => row;
				return row;
			},
			column: () => {
				column = f.columns[x];
				out.column = () => column;
				return column;
			},
			box:() => {
				box = f.boxes[
					Math.floor(x / f.boxW()) 
					+ Math.floor(y / f.boxH()) * f.boxH()
				];
				out.box = () => box;
				return box;
			},
			forEachGroup: cb => {
				row = out.row();
				column = out.column();
				box = out.box();
				out.forEachGroup = cb => {
					cb(row);
					cb(column);
					cb(box);
				};
				return out.forEachGroup(cb);
			},
			choiceCount: () => choices.size,
			forEachChoice: cb => choices.forEach(cb),
			hasChoice: v => choices.has(v),
			get isFixated() { return out.value !== undefined; },
			set isFixated(_) { throw "getter only"; },
			get canBeFixated() { return !out.isFixated && (out.choiceCount() == 1); },
			set canBeFixated(_) { throw "getter only"; },
			get isLastCandidate() {
				return [...choices].some(
					v => [out.row(), out.column(), out.box()].some(
						g => g.candidates(v).size == 1
					)
				);
			},
			set isLastCandidate(_) { throw "getter only"; },
			removeChoice: v => {
				if (choices.delete(v)) {
					out.forEachGroup(g => g.removeCandidate(out, v));
					if (out.canBeFixated) {
						let u = [...choices].pop();
						f.todos.add(out.id + ": last choice " + u);
					}
				}
			},
			get value() { return value; },
			set value(v) {
				if (value === undefined) {
					if ((v >= 0) && (v < f.n())) {
						if (out.hasChoice(v)) {
							value = v;
							out.forEachChoice(u => { 
								if (u != v) {
									out.removeChoice(u);
								}
							});
							out.forEachGroup(g => {
								g.candidates(v).forEach(c => {
									if (c !== out)
										c.removeChoice(v);
								})
							});
						} else {
							throw out.id + ": " + v 
								+ " (\"" + f.symbol(v) + "\")"
								+ " not in choices "
								+ [...choices].map(u => f.symbol(u))
							;
						}
					} else {
						throw "not a value: " + v;
					}
				} else if (value != v) {
					throw out.id + ": cannot set to " + v 
						+ " - already set to " + value;
				}
			}
		};
		return out;
	}

	return {
		create: (field, x, y) => create(field, x, y),
	};
});
