require(["scripts/fn"], (fn) => {
    const { test, todo, skip, module } = QUnit;

    module("fn", () => { // ----------------------------------------
		test("module object", function (assert) {
			assert.same(Object.getPrototypeOf(fn), null, "has null __proto__");
		});

		module("id", () => { // ----------------------------------------
			test("std call", function (assert) {
				assert.same(fn.id(), undefined, "id()");
				let o = {};
				assert.same(fn.id(o), o, "id(o)");
			});
		});  // end module "id"

		module("returnThis", () => { // ----------------------------------------
			test("called via .call", function (assert) {
				const thisValue = {};
				assert.same(fn.returnThis.call(thisValue), thisValue, 
					"returnThis.call(x) === x");
				assert.same(fn.returnThis.call(thisValue, "foo"), thisValue, 
					"returnThis.call(x, 'foo') === x");
			});

			test("called as method", function (assert) {
				assert.same(fn.returnThis(), fn, "fn.returnThis() === fn");
				assert.same(fn.returnThis("foo"), fn, "fn.returnThis('foo') === fn");

				const o = { f: fn.returnThis };
				assert.same(o.f(), o, "o.returnThis() === o");
				assert.same(o.f("foo"), o, "o.returnThis('foo') === o");
			});

			skip("called \"freely\"", function (assert) {
				const f = fn.returnThis;
				const thisValue = this; // test function are called bound to the test context
				assert.same(f(), thisValue, "returnThis() === this");
				assert.same(f("bar"), thisValue, "returnThis('bar') === this");
			});			
		});  // end module "returnThis"

		module("fn.insist_nonNegativeInt", () => { // ----------------------------------------
			test("with non-Int arg", function (assert) {
				assert.throws(() => fn.insist_nonNegativeInt(), /non-negative/,
					"no arg: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(null), /non-negative/,
					"null: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(undefined), /non-negative/,
					"undefined: should throw");
				assert.throws(() => fn.insist_nonNegativeInt({}), /non-negative/,
					"an object: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(3.14), /non-negative/,
					"3.14: should throw");
				assert.throws(() => fn.insist_nonNegativeInt("0"), /non-negative/,
					"'0': should throw");
				assert.throws(() => fn.insist_nonNegativeInt("1"), /non-negative/,
					"'1': should throw");
				assert.throws(() => fn.insist_nonNegativeInt(NaN), /non-negative/,
					"NaN: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_VALUE), /non-negative/,
					"Number.MIN_VALUE: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_SAFE_INTEGER), /non-negative/,
					"Number.MIN_SAFE_INTEGER: should throw");
			});
			test("with negative Int", function (assert) {
				assert.throws(() => fn.insist_nonNegativeInt(-1), /non-negative/,
					"-1: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(-42), /non-negative/,
					"-42: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_VALUE), /non-negative/,
					"Number.MIN_VALUE: should throw");
				assert.throws(() => fn.insist_nonNegativeInt(Number.MIN_SAFE_INTEGER), /non-negative/,
					"Number.MIN_SAFE_INTEGER: should throw");
			});
			test("with non-negative Int", function (assert) {
				assert.same(fn.insist_nonNegativeInt(42), 42, 
					"should return the arg");
			});
		});  // end module "fn.insist_nonNegativeInt"


        test("arrow function .bind", function (assert) {
        	let actualThis, actual;
        	const lexicalThis = this;
        	const otherThis = {};
        	const f = (() => { actual = this }).bind(otherThis);
        	f();
        	assert.same(actual, lexicalThis);
        });

		module("getDescriptors", () => { // ----------------------------------------
			test("non-existent property", function (assert) {
				const foo = () => "bar";
				const o = { };
				let act = fn.getDescriptors(foo, o);
				assert.same(act.length, 0, 
					"nr of descriptors: " + QUnit.dump.parse(act));
			});
			test("inherited from Object.prototype", function (assert) {
				const f = Object.prototype.toString;
				const o = { };
				let act = fn.getDescriptors(f, o);
				assert.same(act.length, 1, 
					"nr of descriptors: " + QUnit.dump.parse(act));
				assert.same(act[0].name, "toString", "descriptor .name");
				assert.same(act[0].value, f, "descriptor .value");
				assert.same(act[0].get, undefined, "descriptor .get")
				assert.same(act[0].set, undefined, "descriptor .set")
				assert.same(act[0].depth, 1, "descriptor .depth");
			});
			test("enumerable function on object itself", function (assert) {
				const foo = () => "bar";
				const o = { qmbl: foo };
				let act = fn.getDescriptors(foo, o);
				assert.same(act.length, 1, 
					"nr of descriptors: " + QUnit.dump.parse(act));
				assert.same(act[0].name, "qmbl", "descriptor .name");
				assert.same(act[0].value, foo, "descriptor .value");
				assert.same(act[0].get, undefined, "descriptor .get")
				assert.same(act[0].set, undefined, "descriptor .set")
				assert.same(act[0].depth, 0, "descriptor .depth");
			});
			test("enumerable function on proto of object", function (assert) {
				const foo = () => "bar";
				const p = { qmbl: foo };
				const o = Object.create(p);
				let act = fn.getDescriptors(foo, o);
				assert.same(act.length, 1,
					"nr of descriptors: " + QUnit.dump.parse(act));
				assert.same(act[0].name, "qmbl", "descriptor .name");
				assert.same(act[0].value, foo, "descriptor .value");
				assert.same(act[0].get, undefined, "descriptor .get")
				assert.same(act[0].set, undefined, "descriptor .set")
				assert.same(act[0].depth, 1, "descriptor .depth");
			});
			test("(non-enumerable) getter on object itself", function (assert) {
				const foo = () => "bar";
				const o = Object.defineProperty({}, "qmbl", { get: foo } );
				let act = fn.getDescriptors(foo, o);
				assert.same(act.length, 1, 
					"nr of descriptors: " + QUnit.dump.parse(act));
				assert.same(act[0].name, "qmbl", "descriptor .name");
				assert.same(act[0].value, undefined, "descriptor .value");
				assert.same(act[0].get, foo, "descriptor .get")
				assert.same(act[0].set, undefined, "descriptor .set")
				assert.same(act[0].depth, 0, "descriptor .depth");
			});
			test("(non-enumerable) getter on proto of proto of object", function (assert) {
				const foo = () => "bar";
				const q = Object.defineProperty({}, "qmbl", { get: foo } );
				const p = Object.create(q);
				const o = Object.create(p);
				let act = fn.getDescriptors(foo, o);
				assert.same(act.length, 1, 
					"nr of descriptors: " + QUnit.dump.parse(act));
				assert.same(act[0].name, "qmbl", "descriptor .name");
				assert.same(act[0].value, undefined, "descriptor .value");
				assert.same(act[0].get, foo, "descriptor .get")
				assert.same(act[0].set, undefined, "descriptor .set")
				assert.same(act[0].depth, 2, "descriptor .depth");
			});
			test("(non-enumerable) getter with Symbol name on proto of object", function (assert) {
				const foo = () => "bar";
				const sym = Symbol("blaha");
				const p = Object.defineProperty({}, sym, { get: foo } );
				const o = Object.create(p);
				let act = fn.getDescriptors(foo, o);
				assert.same(act.length, 1, 
					"nr of descriptors: " + QUnit.dump.parse(act));
				assert.same(act[0].name, sym, "descriptor .name");
				assert.same(act[0].value, undefined, "descriptor .value");
				assert.same(act[0].get, foo, "descriptor .get")
				assert.same(act[0].set, undefined, "descriptor .set")
				assert.same(act[0].depth, 1, "descriptor .depth");
			});
			test("same function appearing more than once, in both, object and __proto__", function (assert) {
				const f = () => "bar";
				const p = Object.create(Object.prototype, { 
					qmbl: { get: f }
				});
				const o = Object.create(p, {
					qmbl: { value: f },
					xxxx: { get: f }
				});
				let act = fn.getDescriptors(f, o);
				assert.same(act.length, 3, 
					"nr of descriptors: " + QUnit.dump.parse(act));
				assert.same(act[0].name, "qmbl", "descriptor 0 .name");
				assert.same(act[0].value, f, "descriptor 0 .value");
				assert.same(act[0].get, undefined, "descriptor 0 .get")
				assert.same(act[0].set, undefined, "descriptor 0 .set")
				assert.same(act[0].depth, 0, "descriptor 0 .depth");
				assert.same(act[1].name, "xxxx", "descriptor 1 .name");
				assert.same(act[1].value, undefined, "descriptor 1 .value");
				assert.same(act[1].get, f, "descriptor 1 .get")
				assert.same(act[1].set, undefined, "descriptor 1 .set")
				assert.same(act[1].depth, 0, "descriptor 1 .depth");
				assert.same(act[2].name, "qmbl", "descriptor 2 .name");
				assert.same(act[2].value, undefined, "descriptor 2 .value");
				assert.same(act[2].get, f, "descriptor 2 .get")
				assert.same(act[2].set, undefined, "descriptor 2 .set")
				assert.same(act[2].depth, 1, "descriptor 2 .depth");
			});
		});  // end module "fn.getDescriptors"

		module("memoize", () => { // ----------------------------------------
			test("with non-function arg", function (assert) {
				assert.throws(fn.memoize, /invalid/, "with no arg");
				assert.throws(() => fn.memoize(null), /invalid/, "with null");
				assert.throws(() => fn.memoize({}), /invalid/, "with object");
			});
			test("with non-nullary function", function (assert) {
				assert.throws(() => fn.memoize(x => x), /invalid/, "with unary fn");
			});
			test("own getter", function (assert) {
				let f_callCount = 0;
				let this_in_f;
				const f = function () { this_in_f = this; return f_callCount++; };
				const o = Object.create(null, {
					foo: { get: fn.memoize(f), configurable: true }
				});

				assert.same(f_callCount, 0, "call count before 1st access");

				let act = o.foo;
				assert.same(act, 0, "return value from 1st access");
				assert.same(f_callCount, 1, "call count after 1st access");
				assert.same(this_in_f, o, "thisValue in implementing fn");
				
				act = o.foo;
				assert.same(act, 0, "return value from 2nd access");
				assert.same(f_callCount, 1, "call count after 2nd access");
			});
			test("inherited getter", function (assert) {
				let f_callCount = 0;
				let this_in_f;
				const f = function () { this_in_f = this; return f_callCount++; };
				const p = Object.create(null, {
					foo: { get: fn.memoize(f) },
					who: { value: "parent", enumerable: true }
				});
				const o = Object.create(p, {
					who: { value: "first child", enumerable: true }
				});

				assert.same(f_callCount, 0, "call count before 1st access");
				
				let act = o.foo;
				assert.same(act, 0, "return value from 1st access");
				assert.same(f_callCount, 1, "call count after 1st access");
				assert.same(this_in_f, o, "thisValue in implementing fn");
				
				act = o.foo;
				assert.same(act, 0, "return value from 2nd access");
				assert.same(f_callCount, 1, "call count after 2nd access");
				
				// another object inherits it:
				const o2 = Object.create(p, {
					who: { value: "second child", enumerable: true }
				});
				act = o2.foo;
				assert.same(act, 1, "return value from 1st access");
				assert.same(f_callCount, 2, "call count after 1st access");
				assert.same(this_in_f, o2, "thisValue in implementing fn");
				
				act = o2.foo;
				assert.same(act, 1, "return value from 2nd access");
				assert.same(f_callCount, 2, "call count after 2nd access");
			});
			test("own method", function (assert) {
				let f_callCount = 0;
				let this_in_f;
				const f = function () { this_in_f = this; return f_callCount++; };
				const o = Object.create(null, {
					foo: { value: fn.memoize(f), configurable: true }
				});

				assert.same(f_callCount, 0, "call count before 1st access");

				let act = o.foo();
				assert.same(act, 0, "return value from 1st access");
				assert.same(f_callCount, 1, "call count after 1st access");
				assert.same(this_in_f, o, "thisValue in implementing fn");
				
				act = o.foo();
				assert.same(act, 0, "return value from 2nd access");
				assert.same(f_callCount, 1, "call count after 2nd access");
			});
			test("inherited method", function (assert) {
				let f_callCount = 0;
				let this_in_f;
				const f = function () { this_in_f = this; return f_callCount++; };
				const p = Object.create(null, {
					foo: { value: fn.memoize(f) },
					who: { value: "parent", enumerable: true }
				});
				const o = Object.create(p, {
					who: { value: "first child", enumerable: true }
				});

				assert.same(f_callCount, 0, "call count before 1st access");
				
				let act = o.foo();
				assert.same(act, 0, "return value from 1st access");
				assert.same(f_callCount, 1, "call count after 1st access");
				assert.same(this_in_f, o, "thisValue in implementing fn");
				
				act = o.foo();
				assert.same(act, 0, "return value from 2nd access");
				assert.same(f_callCount, 1, "call count after 2nd access");
				
				// another object inherits it:
				const o2 = Object.create(p, {
					who: { value: "second child", enumerable: true }
				});
				act = o2.foo();
				assert.same(act, 1, "return value from 1st access");
				assert.same(f_callCount, 2, "call count after 1st access");
				assert.same(this_in_f, o2, "thisValue in implementing fn");
				
				act = o2.foo();
				assert.same(act, 1, "return value from 2nd access");
				assert.same(f_callCount, 2, "call count after 2nd access");
			});
		});  // end module "fn.memoize"

		module("extend", () => { // ----------------------------------------
			test("called on incompatible receiver", function (assert) {
				const extend = fn.extend;
				const expErr = /incompatible receiver/

				assert.isFunction(extend);
				
				assert.throws(() => extend.call(), expErr,
					"extend.call()");
				assert.throws(() => extend.call(undefined), expErr,
					"extend.call(undefined)");
				assert.throws(() => extend.call(null), expErr,
					"extend.call(null)");
				assert.throws(() => extend.call({}), expErr,
					"extend.call({})");
				assert.throws(() => extend.call(42), expErr,
					"extend.call(42)");
				
				function F() {}; F.extend = extend;
				function G() {}
				assert.throws(() => extend.call(() => {}, G), expErr,
					"with this == a function without .prototype");

				F.prototype = undefined;
				assert.throws(() => F.extend(G), expErr,
					"with this == a function with .prototype == undefined");
				
				F.prototype = 42;
				assert.throws(() => F.extend(G), expErr,
					"with this == a function with .prototype == a number");
			});
			test("with invalid args", function (assert) {
				const extend = fn.extend;
				function f() {};
				
				assert.throws(() => extend.call(f), /missing/,
					"with no args");
				assert.throws(() => extend.call(f, undefined), /invalid.*undefined/,
					"with undefined as ctor");
				assert.throws(() => extend.call(f, null), /invalid.*null/,
					"with null as ctor");
				assert.throws(() => extend.call(f, {}), /invalid.*object/,
					"with an object as ctor");
				assert.throws(() => extend.call(f, 42), /invalid.*number/,
					"with a number as ctor");
			});
			module("F.extend(G)", function (hooks) { // module "F.extend(...)"
				hooks.before(function (assert) {
					this.extend = fn.extend;
				});
				
				function test_extend(assert, F, G, p) {
					const extend = fn.extend;

					const act = F.extend(G, p);

					assert.isFunction(act, "result");
					assert.isObject(act.prototype, "result.prototype");
					assert.same(act.prototype.constructor, G,
						"result.prototype.constructor");
					assert.same(
						Object.getPrototypeOf(act.prototype),
						F.prototype,
						"result.prototype.__proto__");
					assert.same(act.extend, extend, "result.extend");

					//return { act: act, F: F, G: G, extend: extend };
					return act;
				}

				module("F anon", function (hooks) { // module "F anon"
					hooks.beforeEach(function () {
						this.F = function () {};
						this.F.extend = fn.extend;
					});
					module("F.prototype == null", function (hooks) { // module "F.prototype == null"
						hooks.beforeEach(function () {
							this.F.prototype = null;
						});
						test("G anon", function (assert) {
							let act = test_extend(assert, this.F, function () {}),
								tag = act.prototype[Symbol.toStringTag];
							assert.same(tag, undefined,
								"act.prototype[Symbol.toStringTag]");
						});
						test("G named", function (assert) {
							let act = test_extend(assert, this.F, function G () {}),
								tag = act.prototype[Symbol.toStringTag];
							assert.same(tag, "G",
								"act.prototype[Symbol.toStringTag]");

						});				
					}); // end module "F.prototype == null"
					module("F.prototype non-null", function (hooks) { // module "F.prototype non-null"
						hooks.beforeEach(function () {
							this.F.prototype = {
								[Symbol.toStringTag]: "Foo",
								bar: 42
							};
						});
						test("G anon", function (assert) {
							let act = test_extend(assert, this.F, function () {}),
								tag = act.prototype[Symbol.toStringTag],
								expTag = "Sub-" + this.F.prototype[Symbol.toStringTag];
							assert.same(tag, expTag,
								"act.prototype[Symbol.toStringTag]"
								+ " should be derived from F.prototype's");
						});
						test("G named", function (assert) {
							let act = test_extend(assert, this.F, function G () {}),
								tag = act.prototype[Symbol.toStringTag];
							assert.same(tag, "G",
								"act.prototype[Symbol.toStringTag]");

						});				
					}); // end module "F.prototype non-null"

				}); // end module "F anon"

				module("F named", function (hooks) { // module "F named"
					hooks.beforeEach(function () {
						this.F = function F () {};
						this.F.extend = fn.extend;
					});
					module("F.prototype == null", function (hooks) { // module "F.prototype == null"
						hooks.beforeEach(function () {
							this.F.prototype = null;
						});
						test("G anon", function (assert) {
							let act = test_extend(assert, this.F, function () {}),
								tag = act.prototype[Symbol.toStringTag],
								expTag = "Sub-F";
							assert.same(tag, expTag,
								"act.prototype[Symbol.toStringTag]"
								+ " should be derived from F.name");
						});
						test("G named", function (assert) {
							let act = test_extend(assert, this.F, function G () {}),
								tag = act.prototype[Symbol.toStringTag];
							assert.same(tag, "G",
								"act.prototype[Symbol.toStringTag]");

						});				
					}); // end module "F.prototype == null"
					module("F.prototype non-null", function (hooks) { // module "F.prototype non-null"
						hooks.beforeEach(function () {
							this.F.prototype = {
								[Symbol.toStringTag]: "Foo",
								bar: 42
							};
						});
						test("G anon", function (assert) {
							let act = test_extend(assert, this.F, function () {}),
								tag = act.prototype[Symbol.toStringTag],
								expTag = "Sub-" + this.F.prototype[Symbol.toStringTag];
							assert.same(tag, expTag,
								"act.prototype[Symbol.toStringTag]"
								+ " should be derived from F.prototype's");
						});
						test("G named", function (assert) {
							let act = test_extend(assert, this.F, function G () {}),
								tag = act.prototype[Symbol.toStringTag];
							assert.same(tag, "G",
								"act.prototype[Symbol.toStringTag]");

						});
						test("with proto template", function (assert) {
							let G_calls = [],
								F_calls = [];
							const F = function F (...args) {
							      	F_calls.push({
							      		args: args.slice(0),
							      		this: this
							      	});
							      },
							      G = function G (...args) {
							      	G_calls.push({
							      		args: args.slice(0),
							      		this: this
							      	});
							      	this.super(...args);
							      },
							      p = {
							      	get super() {
							      		return Object.getPrototypeOf(
							      			Object.getPrototypeOf(this)
							      		).constructor;
							      	},
							      	bar: 4711,
							      	m: function aMethod() {}
							      };
							F.extend = fn.extend;

							let act = test_extend(assert, F, G, p),
								G_proto = act.prototype[Symbol.toStringTag];
							
							assert.same(act.prototype.bar, 4711,
								"props from act.prototype should be there");
							assert.same(act.prototype.m, p.m,
								"props from act.prototype should be there");
							
							let o1 = new act();
							assert.ok(o1 instanceof act, "(new C) instanceof C");
							assert.ok(o1 instanceof F, "(new C) instanceof F");
							assert.same(G_calls.length, 1, "G call count");
							assert.same(G_calls[0].this, o1,
								"thisValue in G was the new instance");
							assert.all.same(G_calls[0].args, [],
								"args for G as provided from outside");

							let o2 = new act("foo", "bar");
							assert.notStrictEqual(o2, o1, 
								"new C again yields new instance");
							assert.ok(o2 instanceof act, "(new C) instanceof C");
							assert.ok(o2 instanceof F, "(new C) instanceof F");
							assert.same(G_calls.length, 2, "G call count");
							assert.same(G_calls[1].this, o2,
								"thisValue in G was the new instance");
							assert.all.same(G_calls[1].args, ["foo", "bar"],
								"args for G as provided from outside");
						});				
					}); // end module "F.prototype non-null"

				}); // end module "F named"

			}); // end module "F.extend(...)"
			
		});  // end module "fn.extend"
    
    }); // end module "fn"

}); // end require