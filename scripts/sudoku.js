define(["./cell", "./group", "./sequence"], (cell, group, seq) => {
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
		const n = boxW * boxH;
		Object.defineProperties(this, {
			boxW: { value: boxW },
			boxH: { value: boxH },
			n:    { value: n },
			nsq:  { value: n*n },
		});
	}
	
	let xIdx2coord = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."abcdefghijklmnopqrstuvwxyz"];
	let xCoord2idx = {};
	xIdx2coord.forEach( (cx, x) => xCoord2idx[cx] = x);

	let yIdx2coord = xIdx2coord.map( (cx, i) => (i + 1) + "");
	let yCoord2idx = {};
	yIdx2coord.forEach( (cy, y) => yCoord2idx[cy] = y);
	

	let p = Field.prototype = {
		fromXcoord: function (cx) {
			if (typeof cx == "string") {
				let x = xCoord2idx[cx];
				if (x >= 0 && x < this.n())
					return x;
			}
			throw "invalid x coord \"" + cx + "\"";
		},
		toXcoord: function (x) {
			if (typeof x == "number") {
				if (Math.trunc(x) == x && x >= 0 && x < this.n())
					return xIdx2coord[x];
			}
			throw "invalid x index " + x;
		},
		fromYcoord: function (cy) {
			if ((typeof cy == "string") || (typeof cy == "number")) {
				let y = yCoord2idx[cy];
				if (y >= 0 && y < this.n())
					return y;
			}
			throw "invalid y coord \"" + cy + "\"";
		},
		toYcoord: function (y) {
			if (typeof y == "number") {
				if (Math.trunc(y) == y && y >= 0 && y < this.n())
					return yIdx2coord[y];
			}
			throw "invalid y index " + y;
		},
		toCoord: function(x,y) {
			return this.toXcoord(x) + toYcoord(y)
		},
		
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
		if (!(options && options.box))
			throw "sudoku.create: missing/bad options";

		const boxW = options.box[0];
		const boxH = options.box[1];
		const n = boxW * boxH; // cells per group = nr of rows = nr of cols = nr of boxes
		let rows = new Array(n);
		let columns = new Array(n);
		let boxes = new Array(n);
		const todos = [];
		//const cells = new Array(n*n);

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
			do_fp: function () {
				let n;
				do {
					n = todos.length;
					this.do();
				} while (n < todos.length);
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
				let done = 0;
				let fixatable = 0;
				let missing = 0;
				console.log(out.stringify(c => {
					if (c.isFixated) {
						done++;
						return String.fromCharCode(c.value + "a".charCodeAt(0));
					} else if (c.canBeFixated) {
						fixatable++;
						return "/";
					} else if (c.isLastCandidate) {
						fixatable++;
						return "\\";
					} else {
						//return " ";
						//return "-";
						missing++;
						return c.choiceCount();
					}
				}));
				console.log(""
					+ "// fix: " + done + " + " + fixatable
					+ ", missing: " + missing
					+ " (ttl: " + out.cellCount() + ")"
				);
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
		const values = seq.range(0, n - 1);

		class Rectangular extends group {
			static get field() { return out; }
			constructor(x, y) {
				super();
				this.x = x;
				this.y = y;
			}

			// memoize on instances?
			get w()     { return this.constructor.w;     }
			get h()     { return this.constructor.h;     }
			get id() {
				const {x, y, w, h, field} = this;
				let id = this.constructor.name + "_";
				if (h !== 1) id += field.toXcoord(x);
				if (w !== 1) id += field.toYcoord(y);
				return id;
			}
			toString() { return this.id; }
		}
		Object.defineProperties(Rectangular.prototype, {
			field: { value: out, enumerable: true }
		});

		class Row extends Rectangular {
			static get w() { return this.n; }
			static get h() { return 1; }
			constructor(y) {
				super(0, y);
			}
			*cellIterator() {
				const {y, n, field} = this,
				      yOffset = y * n,
				      hi = yOffset + n;
				for (let i = yOffset, x = 0; i < hi; i++, x++) {
					const c = cell.create(field, x, y);
					yield c;
					//yield field.toCoord(x, y);
				}
				/*
				return seq.range(yOffset, yOffset + n - 1)
					.map(i => field.toCoord(i % n, Math.trunc(i / n)))
				;
				*/
			}
		}

		class Col extends Rectangular {
			static get w() { return 1; }
			static get h() { return this.n; }
			constructor(x) {
				super(x, 0);
			}
			*cellIterator() {
				const {x, n, field} = this,
				      hi = n * n;
				for (let i = x, y = 0; i < hi; i += n, y++) {
					const c = field.cell(x, y);
					yield c;
				}
				/*
				return seq.iterate(x, i => i + n)
					.take(n)
					.map(i => field.toCoord(x, Math.trunc(i / n)))
				;
				*/
			}
		}

		class Box extends Rectangular {
			static get w() { return this.field.boxW() }
			static get h() { return this.field.boxH() }
			static get construct() {
				const C = this,
				      h = C.h;
				const ctor = i => new C(i % h, Math.trunc(i / h));
				return ctor;
			}
			cellIterator() {
				const {x, y, w, h, n, field} = this,
				      tlX = x * w, // x-coord of top-left cell
				      tlY = y * h, // y-coord of top-left cell
				      tlI = tlX + tlY * n;
				let ys = seq.iterate(tlI, cy => cy + n).take(h);
				let is = ys.mapMany(cy => seq.iterate(cy, i => i + 1).take(w));
				let cs = is.map(i => {
					const cx = i % n,
					      cy = Math.trunc(i / n);
					const c = field.cell(cx, cy);
					return c;
				});

				return cs[Symbol.iterator]();
			}
		}

		out.rows =    rows =    [...values.map(Row.construct)];
		out.columns = columns = [...values.map(Col.construct)];
		out.boxes =   boxes =   [...values.map(Box.construct)];

		return out;
	}

	function parseRow(params, y, line) {
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

	const parse = s => {
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
		console.log(result.stringify());

		return result;
	}

	return Object.create(null, {
		create:     { value:create },
		parse:      { value:parse },
		fromXcoord: { value: fromXcoord },
		fromYcoord: { value: fromYcoord },
		toXcoord:   { value: toXcoord },
		toYcoord:   { value: toYcoord },
	});
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