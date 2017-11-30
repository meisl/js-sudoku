
define(["./cell", "./group"], function(cell, group) {

	
	function fromXcoord(xc) {
		return xc.charCodeAt(0) - "A".charCodeAt(0);
	}

	function fromYcoord(yc) {
		let result = Number.parseInt(yc);
		result -= 1;
		return result;
	}

	function toXcoord(x) {
		return String.fromCharCode(x + 65);
	}

	function toYcoord(y) {
		return (y + 1) + "";
	}

	function Field(boxW, boxH) {
		let n = boxW * boxH;
		Object.defineProperty(this, "boxW", {
			value: boxW,
			enumerable: true,
			writable: false,
			configurable: false
		});
		Object.defineProperty(this, "boxH", {
			value: boxH,
			enumerable: true,
			writable: false,
			configurable: false
		});
		Object.defineProperty(this, "n", {
			value: n,
			enumerable: true,
			writable: false,
			configurable: false
		});
	}
	let p = Field.prototype = {
		toCoord: (x,y) => toXcoord(x) + toYcoord(y)
	};
	function addAccessor(x, y) {
		let coord = toXcoord(x) + toYcoord(y);
		Object.defineProperty(p, coord, {
			get: function () { return this.cell(x, y);  },
			set: function (sym) {
				let val = this.value(sym);
				if (val === undefined)
					throw coord + ".setValue: not a symbol: \"" + sym + "\"";
				return (this.cell(x, y).value = val);  
			},
			enumerable: false,
			configurable: false
		});
	}
	for (let y = 0; y < 36; y++) {
		for (let x = 0; x < 36; x++) {
			addAccessor(x, y);
		}
	}
	
	function create(options) {
		if (options && options.box) {
			
			var boxW = options.box[0];
			var boxH = options.box[1];
			var n = boxW * boxH; // cells per group = nr of rows = nr of cols = nr of boxes
			var rows = new Array(n);
			var columns = new Array(n);
			var boxes = new Array(n);
			var todos = [];
			
			let values2symbols = new Array(n);
			let symbols2values = {};
			if (options.symbols) {
				for (let val = 0; val < n; val++) {
					let sym = options.symbols[val];
					values2symbols[val] = sym;
					symbols2values[sym] = val;
				}
			} else {
				for (var i = 0; i < n; i++) {
					values2symbols[i] = i;
					symbols2values[i] = i;
				}
			}

			var out = {
				n:         () => n,
				boxW:      () => boxW,
				boxH:      () => boxH,
				cellCount: () => n*n,
				cell:      (x,y) => rows[y].cell(x),
				forEachCell: cb => {
					for (var y = 0; y < n; y++) {
						for (var x = 0; x < n; x++) {
							cb(out.cell(x, y), x, y);
						}
					}
				},
				symbol:    v => values2symbols[v],
				value:     s => symbols2values[s],
				newSetOfValues: () => new Set(values2symbols.keys()),
				stringify: cellCb => {
					if (cellCb === undefined) {
						cellCb = c => {
							let v = c.value;
							return (v === undefined)
								? "-"
								: out.symbol(v);
						};
					}
					function yStr(y) {
						//return ((y + 1) + "").padStart((n+"").length, " ");
						let result = (y + 1) + "";
						return " ".repeat((n+"").length - result.length)
							+ result;
					}
					let yPad = " ".repeat(yStr(0).length + 1);
					let xCoords = yPad;
					let x = 0;
					for (let bx = 0; bx < boxH; bx++) {
						xCoords += "  ";
						for (let x0 = 0; x0 < boxW; x0++) {
							xCoords += String.fromCharCode(65 + x) + " ";
							x++;
						}
					}
					xCoords = xCoords.substring(0, xCoords.length - 1) + "\n";
					let hSep = yPad
						+ ("+" + "-".repeat(boxW * 2 + 1)).repeat(boxH)
						+ "+"
						//+ " " + yPad
						+ "\n"
					;
					let result = xCoords + hSep;
					let y = 0;
					for (let by = 0; by < boxW; by++) {
						for (let y0 = 0; y0 < boxH; y0++) {
							x = 0;
							result += yStr(y) + " ";
							for (let bx = 0; bx < boxH; bx++) {
								result += "| ";
								for (let x0 = 0; x0 < boxW; x0++) {
									result += cellCb(out.cell(x, y)) + " ";
									x++;
								}
							}
							result += "| " + yStr(y) + "\n";
							y++;
						}
						result += hSep;
					}
					result += xCoords;
					return result;
				},
				addTodo: todo => todos.push(todo),
				do: (...is) => {
					let ts;
					if (is.length == 0) {
						ts = todos;
					} else {
						ts = is.map(i => todos[i]);
					}
					ts.forEach((t, i) => {
						if (typeof t == "function") {
							t();
							todos[i] = "* " + t.toString();
						}
					});
					return out.print().printTodos();
				},
				printTodos: showDone => {
					todos.forEach((td, i) => {
						if (showDone || (typeof td == "function")) {
							console.log(i + ": " + td);
						}
					});
					return out;
				},
				print: () => {
					console.log(out.stringify(c => {
						if (c.isFixated) {
							return String.fromCharCode(c.value + "a".charCodeAt(0));
						} else if (c.canBeFixated) {
							return "/";
						} else if (c.isLastCandidate) {
							return "\\";
						} else {
							//return " ";
							//return "-";
							return c.choiceCount();
						}
					}));
					return out;
				},
				toString: () => out.stringify(),
				set: (x, y, v) => {
					out.cell(x, y).value = v;
					return out.print().printTodos();
				}
			};
			Object.setPrototypeOf(out, Field.prototype);

			var cells;
			var x, y;
			var row, column, box;
			
			for (y = 0; y < n; y++) {
				cells = new Array(n);
				for (x = 0; x < n; x++) {
					cells[x] = cell.create(out, x, y);
				}
				row = group.create(out, cells);
				rows[y] = row;
			}
			out.rows = rows;
			
			for (x = 0; x < n; x++) {
				cells = new Array(n);
				for (y = 0; y < n; y++) {
					cells[y] = out.cell(x, y);
				}
				column = group.create(out, cells);
				columns[x] = column;
			}
			out.columns = columns;
			
			i = 0;
			for (var by = 0; by < boxW; by++) { // boxW = n/boxH
				for (var bx = 0; bx < boxH; bx++) { // boxH = n/boxW
					cells = new Array(n);
					var k = 0;
					for (y = by*boxH; y < (by+1)*boxH; y++) {
						for (x = bx*boxW; x < (bx+1)*boxW; x++) {
							cells[k++] = out.cell(x, y);
						}
					}
					box = group.create(out, cells);
					boxes[i++] = box;
				}
			}
			out.boxes = boxes;
			
			
			return out;
		} else {
			throw "sudoku.create: missing/bad options"
		}
	}
	
	function parseRow(params, y, line) {
		console.log('"' + line + '"');
		let c = params.start;
		function fail(err) {
			let myErr = err + "\n\"" + line + "\"\n" 
				+ " ".repeat(c) + "^";
			console.log(params);
			console.log(myErr);
			throw myErr;
		}
		function chr(ch) {
			if (line[c++] != ch)
				fail("expected \"" + ch + "\" - found \"" + line[c-1] + "\"");
		}
		function addTodo(x, sym) {
			let str = String.fromCharCode(65 + x) + (y+1) + "<-" + sym + "";
			let todo = field => (field.cell(x, y).value = field.value(sym));
			Object.defineProperty(todo, 'name', { writable: true });
			todo.name = str
			params.todos.push(todo);
			params.todosStr.push(str);
		}
		let x = 0;
		for (let bx = 0; bx < params.boxH; bx++) {
			chr("|");
			chr(" ");
			for (let k = 0; k < params.boxW; k++) {
				let sym = line[c++].match(/([0-9A-Za-z])|[ -]/);
				if (sym) {
					if (sym[1]) { // was [0-9A-Za-z]
						params.symbols.add(sym[1]);
						if (params.symbols.size > params.n)
							fail("too many symbols found (" + [...params.symbols] + ")");
						addTodo(x, sym[1]);
					}
				} else {
					fail("expected /[- 0-9A-Za-z]/ - found \"" + line[c-1] + "\"");
				}
				chr(" ");
				x++;
			}
		}
		chr("|");
		return params;
	}

	return {
		fromXcoord: fromXcoord,
		fromYcoord: fromYcoord,
		toXcoord:   toXcoord,
		toYcoord:   toYcoord,
		create: create,
		parse: s => {
			let lines = s.split("\n");
			let lineIdx = 0;
			let match;
			while (!match) {
				if (lineIdx >= lines.length) {
					throw "expected horizontal separator \"+---..\"";
				} else {
					match = lines[lineIdx++].match(
						/^( *)((\+((?:--)+)-)\3+\+) *$/);
					if (match) {
						break;
					}
				}
			}

			let p = {
				start: match[1].length,
				hSep: match[2],
				boxW: match[4].length / 2,
				boxH: (match[2].length - 1) / match[3].length,
				symbols: new Set(),
				todos: [],
				todosStr: []
			}
			p.n = p.boxW * p.boxH;
			p.end = p.start + p.n*2 + p.boxH*2;
			
			let y = 0;
			for (let by = 0; by < p.boxW; by++) {
				for (let k = 0; k < p.boxH; k++) {
					parseRow(p, y, lines[lineIdx]);
					y++;
					lineIdx++;
				}
				// consume an hSep
				lineIdx++;
			}
			
			let ch = 1;
			while (p.symbols.size < p.n) {
				while (p.symbols.has(ch + "")) {
					if (ch < 9) {
						ch++;
					} else if (ch == 9) {
						ch = "A"
					} else {
						ch = String.fromCharCode(ch.charCodeAt(0) + 1);
					}
				}
				p.symbols.add(ch + "");
			}

			let options = { box: [p.boxW, p.boxH], symbols: [...p.symbols].sort() };
			let result = create(options);
			
			p.todos.forEach(t => t(result));
			console.log(options);
			console.log(result.stringify());
			
			return result;
		}

	};
});


/*
 

 empty 4x4
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 | - - - - | - - - - | - - - - | - - - - |
 +---------+---------+---------+---------+

 empty 3x3
 +-------+-------+-------+
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 +-------+-------+-------+
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 +-------+-------+-------+
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 | - - - | - - - | - - - |
 +-------+-------+-------+

*/