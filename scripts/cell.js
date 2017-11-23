
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
			get value() { return value; },
			set value(v) {
				if (value === undefined) {
					out.forEachChoice(u => { if (u != v) out.removeChoice(u) });
				} else if (value != v) {
					throw out.id + ": cannot set to " + v 
						+ " - already set to " + value;
				}
				value = v;
			},
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
			removeChoice: v => {
				if (choices.delete(v)) {
					out.forEachGroup(g => g.removeCandidate(out, v));
				}
			}
		};
		return out;
	}

	return {
		create: (field, x, y) => create(field, x, y),
	};
});
