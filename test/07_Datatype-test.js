require(["scripts/fn", "scripts/Datatype"], (fn, Datatype) => {
	const { test, todo, skip, module } = QUnit;

	const { isDatatype, isDatactor, isDatavalue } = Datatype;

	module("Datatype", () => { // ------------------------------------------
		
		QUnit.assert.hasDatactor = function (datatype, ctorName, ctorArity) {
			if (!(datatype instanceof Datatype))
				throw new TypeError("assert.hasDatactor: invalid datatype " + datatype);
			if (typeof ctorName !== "string")
				throw new TypeError("assert.hasDatactor: invalid ctorName " + ctorName);
			if (!Number.isInteger(ctorArity) || ctorArity < 0)
				throw new TypeError("assert.hasDatactor: invalid ctorArity " + ctorArity);
			
			const ctor = datatype[ctorName];
			this.same(ctor.datatype, datatype,
				datatype.name + "." + ctorName + ".datatype");
			this.same(ctor.name, ctorName,
				datatype.name + "." + ctorName + ".name");
			this.same(ctor.length, ctorArity,
				datatype.name + "." + ctorName + ".length");

		};

		module("new", () => { // ------------------------------------------
			test("without any args", function (assert) {
				assert.throws(() => new Datatype(), /invalid/,
					"new Datatype() should throw");
			});
			test("without ctor defs arg", function (assert) {
				assert.throws(() => new Datatype("Foo"), /invalid/, 
					"new Datatype('Foo') should throw");
			});
			test("with empty ctor defs obj", function (assert) {
				assert.throws(() => new Datatype("Foo", {}), /invalid/, 
					"new Datatype('Foo', {}) should throw");
			});
		}); // end module "new"


		module("ctors .toString()", () => { // ------------------------------------------
			test("nullary", function (assert) {
				const D = new Datatype("D", {
					Foo: {},
					Bar: {},
				});
				assert.same(D.Foo.toString(), "Foo", "Foo");
				assert.same(D.Bar.toString(), "Bar", "Bar");
			});
			test("unary", function (assert) {
				const D = new Datatype("D", {
					Foo: { x: _ => true },
					Bar: { y: _ => true },
				});
				assert.same(D.Foo.toString(), "D.Foo(x){...}");
				assert.same(D.Bar.toString(), "D.Bar(y){...}");
			});
			test("binary", function (assert) {
				const D = new Datatype("D", {
					Foo: { 
						y: _ => true, // let's have 'em not alphabetically
						x: _ => true,
					},
				});
				assert.same(D.Foo.toString(), "D.Foo(y,x){...}");
			});
		}); // end module "ctors .toString()"

		module("datavalues", () => { // ------------------------------------------
			test("nullary ctors", function (assert) {
				const D = new Datatype("D", {
					Foo: {},
					Bar: {},
				});
				assert.same(D.name, "D", ".name");
				assert.hasDatactor(D, "Foo", 0);
				assert.hasDatactor(D, "Bar", 0);

				assert.notEqual(D.Foo, D.Bar, "ctors are not the same thing");

				assert.same(D.Foo.datactor, D.Foo, 
					"nullary ctor .Foo is its own (singleton) value");
				assert.same(D.Bar.datactor, D.Bar, 
					"nullary ctor .Foo is its own (singleton) value");

				assert.same(D[Symbol.toStringTag], 
					//"D", 
					"Datatype",
					//"Data D",
					"D[Symbol.toStringTag]");
				assert.same(D.Foo[Symbol.toStringTag], "D.Foo",
					"D.Foo[Symbol.toStringTag]");
				assert.same(D.Bar[Symbol.toStringTag], "D.Bar",
					"D.Bar[Symbol.toStringTag]");
			});
			test("unary ctor", function (assert) {
				const D = new Datatype("D", {
					Nullary: {},
					Unary: { z: () => true },
					
				});
				assert.same(D.name, "D", ".name");
				assert.hasDatactor(D, "Unary", 1);

				let vUnary, desc;
				/*
				assert.throws(() => new D.Unary(42), /new/,
					"calling unary ctor with new should throw");
				*/
				vUnary = D.Unary(42);
				desc = "D.Unary *value*";

				assert.notPropEqual(D.Unary(5), vUnary, 
					"calling unary ctor with different arg must return different thing");
				assert.same(vUnary.z, 42, 
					"provided arg stored in the data value: .z")
				assert.same(vUnary[0], 42, 
					"provided arg is also accessible via index: [0]")
				
				assert.same(vUnary.datatype, D,
					desc + ": .datatype");
				assert.same(vUnary.datactor, D.Unary,
					desc + ": .datactor");

				assert.same(vUnary[Symbol.toStringTag], "D.Unary",
					desc + ": [Symbol.toStringTag]");
				assert.same(vUnary.toString(), "Unary 42",
					desc + ": .toString()");
				
				vUnary = D.Unary(D.Nullary);
				desc = "D.Unary(D.Nullary)";
				assert.same(vUnary.toString(), "Unary Nullary",
					desc + ": .toString()");
				
				vUnary = D.Unary(D.Unary(42));
				desc = "D.Unary(D.Unary(42))";
				assert.same(vUnary.toString(), "Unary (Unary 42)",
					desc + ": .toString()");
			});
			test("binary ctor", function (assert) {
				const D = new Datatype("D", {
					Binary: {
						x: () => true,
						y: () => true,
					},
				});
				assert.same(D.name, "D", ".name");
				assert.hasDatactor(D, "Binary", 2);

				let vBinary, desc;
				/*
				assert.throws(() => new D.Unary(42), /new/,
					"calling unary ctor with new should throw");
				*/
				vBinary = D.Binary(1,2);
				desc = "D.Binary *value*";

				assert.notPropEqual(D.Binary(2,1), vBinary, 
					"calling binary ctor with different args must return different thing");
				assert.same(vBinary.x, 1, 
					"provided arg stored in the data value: .x")
				assert.same(vBinary[0], 1, 
					"provided arg is also accessible via index: [0]")
				
				assert.same(vBinary.y, 2, 
					"provided arg stored in the data value: .y")
				assert.same(vBinary[1], 2, 
					"provided arg is also accessible via index: [1]")
				
				assert.same(vBinary.datatype, D,
					desc + ": .datatype");
				assert.same(vBinary.datactor, D.Binary,
					desc + ": .datactor");
				assert.same(vBinary[Symbol.toStringTag], "D.Binary",
					desc + ": [Symbol.toStringTag]");
				assert.same(vBinary.toString(), "Binary 1 2",
					desc + ": .toString()");
				
				vBinary = D.Binary(D.Binary(1,2), D.Binary(3,4));
				desc = "D.Binary(D.Binary(1,2), D.Binary(3,4))";
				assert.same(vBinary.toString(), 
					"Binary (Binary 1 2) (Binary 3 4)",
					desc + ": .toString()");
			});
		
			test("ctor test: .isXYZ", function (assert) {
				const Dat = new Datatype("Dat", {
					C0: {},
					C1: { x: () => true },
					C2: { a: () => true, b: () => true },
				});
				let v, desc;

				v = Dat.C0;
				desc = "Dat.C0";
				assert.same(v.isC0, true,  desc + ".isC0");
				assert.same(v.isC1, false, desc + ".isC1");
				assert.same(v.isC2, false, desc + ".isC2");

				v = Dat.C1(42);
				desc = "Dat.C1(42)";
				assert.same(v.isC0, false, desc + ".isC0");
				assert.same(v.isC1, true,  desc + ".isC1");
				assert.same(v.isC2, false, desc + ".isC2");

				v = Dat.C2("a", "b");
				desc = "Dat.C2('a', 'b')";
				assert.same(v.isC0, false, desc + ".isC0");
				assert.same(v.isC1, false, desc + ".isC1");
				assert.same(v.isC2, true,  desc + ".isC2");
				
			});

		}); // end module "datavalues"

		module("isDatatype", () => { // ------------------------------------------
			test("bogus arg", function (assert) {
				assert.same(isDatatype(),          false, "none");
				assert.same(isDatatype(undefined), false, "undefined");
				assert.same(isDatatype(""),        false, "empty string");
				assert.same(isDatatype("foo"),     false, "'foo'");
				assert.same(isDatatype(NaN),       false, "NaN");
				assert.same(isDatatype(4711),      false, "4711");
				assert.same(isDatatype(function (x) { return x }),  false, "function");
				assert.same(isDatatype(() => 42),  false, "arrow function");
			});
			test("reasonable arg", function (assert) {
				assert.same(isDatatype(null), false);
				assert.same(isDatatype({}), false);
				assert.same(isDatatype(Datatype), false,
					"class Datatype itself is NOT a Datatype");
				
				const Foo = new Datatype("Foo", {
					C0: {},
					C1: { arg: a => true }
				});
				assert.same(isDatatype(Foo), true);
				assert.same(isDatatype(Foo.C0), false);
				
				assert.same(isDatatype(Foo.C1), false);
				const v1 = Foo.C1("x");
				const v2 = Foo.C1("y");
				assert.same(isDatatype(v1), false);
				assert.same(isDatatype(v2), false);
			});
		}); // end module "isDatatype"

		module("isDatactor", () => { // ------------------------------------------
			test("bogus arg", function (assert) {
				assert.same(isDatactor(),          false, "none");
				assert.same(isDatactor(undefined), false, "undefined");
				assert.same(isDatactor(""),        false, "empty string");
				assert.same(isDatactor("foo"),     false, "'foo'");
				assert.same(isDatactor(NaN),       false, "NaN");
				assert.same(isDatactor(4711),      false, "4711");
				assert.same(isDatactor(function (x) { return x }),  false, "function");
				assert.same(isDatactor(() => 42),  false, "arrow function");
			});
			test("reasonable arg", function (assert) {
				assert.same(isDatactor(null), false);
				assert.same(isDatactor({}), false);
				assert.same(isDatactor(Datatype), false,
					"class Datatype itself is NOT a Datactor");
				
				const Foo = new Datatype("Foo", {
					C0: {},
					C1: { arg: a => true },
					C2: {
						x: x => true,
						y: y => true,
					}
				});
				assert.same(isDatactor(Foo), false, 
					"Datatype instance is NOT a datactor");
				assert.same(isDatactor(Foo.C0), true, "nullary ctor " + Foo.C0);
				
				assert.same(isDatactor(Foo.C1), true, "unary ctor " + Foo.C1);
				const v1a = Foo.C1("x");
				const v1b = Foo.C1("y");
				assert.same(isDatactor(v1a), false);
				assert.same(isDatactor(v1b), false);
			});
		}); // end module "isDatactor"

		module("isDatavalue", () => { // ------------------------------------------
			test("bogus arg", function (assert) {
				assert.same(isDatavalue(),          false, "none");
				assert.same(isDatavalue(undefined), false, "undefined");
				assert.same(isDatavalue(""),        false, "empty string");
				assert.same(isDatavalue("foo"),     false, "'foo'");
				assert.same(isDatavalue(NaN),       false, "NaN");
				assert.same(isDatavalue(4711),      false, "4711");
				assert.same(isDatavalue(function (x) { return x }),  false, "function");
				assert.same(isDatavalue(() => 42),  false, "arrow function");
			});
			test("reasonable arg", function (assert) {
				assert.same(isDatavalue(null), false);
				assert.same(isDatavalue({}), false);
				assert.same(isDatavalue(Datatype), false,
					"class Datatype itself is NOT a Datactor");
				
				const Foo = new Datatype("Foo", {
					C0: {},
					C1: { arg: a => true },
					C2: {
						x: x => true,
						y: y => true,
					}
				});
				assert.same(isDatavalue(Foo), false, 
					"Datatype instance is NOT a datactor");
				assert.same(isDatavalue(Foo.C0), true, 
					"nullary ctor " + Foo.C0 + " is ALSO a datavalue");
				
				assert.same(isDatavalue(Foo.C1), false,
					"unary ctor " + Foo.C1 + " itself is NOT a datavalue");
				const v1a = Foo.C1("x");
				const v1b = Foo.C1("y");
				assert.same(isDatavalue(v1a), true);
				assert.same(isDatavalue(v1b), true);
			});
		}); // end module "isDatavalue"

		module("ctor args check", () => { // ------------------------------------------
			todo("too few", () => { // ------------------------------------------
			}); // end module "too few"
			
			todo("too many", () => { // ------------------------------------------
			}); // end module "too many"
			
			function spy(f) {
				const res = function (...args) {
					const rec = {
						args: args
					};
					res.calls.push(rec);
					let returned;
					returned = f(...args);
					rec.returned = returned;
					return returned;
				};
				Object.defineProperties(res, {
					name:  { value: f.name },
					calls: { value: [] },
				})
				return res;
			}

			test("provided test fns", function (assert) {
				const test_a = spy(() => true);
				const test_x = spy(() => true);
				const test_y = spy(fn.isString);
				const D = new Datatype("D", {
					C1: { arg: test_a },
					C2: {
						x: test_x,
						y: test_y,
					}
				});

				D.C1(42);
				assert.same(test_a.calls.length, 1, "C1(42) ~> test_a call count");
				assert.propEqual(test_a.calls[0].args, [42],
					"C1(42) ~> test_a args at call 0"
				);

				D.C2(42, "five");
				assert.same(test_x.calls.length, 1, "C2(42, 'five') ~> test_x call count");
				assert.propEqual(test_x.calls[0].args, [42],
					"C2(42, 'five') ~> test_x args at call 0"
				);
				assert.same(test_y.calls.length, 1, "C2(42, 'five') ~> test_y call count");
				assert.propEqual(test_y.calls[0].args, ["five"],
					"C2(42, 'five') ~> test_y args at call 0"
				);

				assert.throws(() => D.C2(4711, 5), /invalid.+y.+isString.+5/, 
					"C2(4711, 5) should throw because of 2nd arg");
				// do NOT require 1st test fn to have been called!
				assert.same(test_y.calls.length, 2, "C2(42, 5) ~> test_y call count");
				assert.propEqual(test_y.calls[1].args, [5],
					"C2(42, 5) ~> test_y args at call 1"
				);

			});

		}); // end module "ctor args check"
		
		module("(simple) pattern matching", () => { // ------------------------------------------
			skip("blah", function (assert) {
				
			}); // end module "too few"
		}); // end module "(simple) pattern matching"

	}); // end module "Datatype"
}); // end require