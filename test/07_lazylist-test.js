require(["scripts/lazylist"], (lzy) => {
	const { test, todo, skip, module } = QUnit;

	const { nil, single, cons, mapMany, filter, map } = lzy;

	module("lazylist", () => { // ------------------------------------------
		test("module object", function (assert) {
			assert.same(Object.getPrototypeOf(lzy), null, "has null __proto__");
		});

		module("nil", () => { // ------------------------------------------
			test(".expr & traversal", function (assert) {
				assert.same(nil.expr, "[]", "nil.expr == []");
				assert.all.same(nil, [], "[] 1st traversal");
				assert.all.same(nil, [], "[] 2nd traversal");
			});
			test(".toString()", function (assert) {
				assert.same(nil.toString(), "[]", "nil.toString() == []");
			});
			test(".isEmpty, .head, .tail", function (assert) {
				assert.same(nil.isEmpty, true, ".isEmpty");
				assert.throws( () => nil.head, /head.*empty/, ".head")
				assert.throws( () => nil.tail, /tail.*empty/, ".tail")
			});
			test(".isSingle", function (assert) {
				assert.same(nil.isSingle, false, ".isSingle");
			});
			test(".cons", function (assert) {
				let act;
				act = nil.cons(nil);
				assert.same(act.expr, "[[]]", "(cons [] []).expr == [[]]");
				assert.all.same(act, [nil], "[[]] 1st traversal");
				assert.all.same(act, [nil], "[[]] 2nd traversal");
				assert.same(act.isEmpty, false, "[[]].isEmpty");
				assert.same(act.isSingle, true, "[[]].isSingle");

				act = act.cons(nil);
				assert.same(act.expr, "[[],[]]", "(cons [[]] []).expr == [[],[]]");
				assert.all.same(act, [nil,nil], "[[],[]] 1st traversal");
				assert.all.same(act, [nil,nil], "[[],[]] 2nd traversal");
				assert.same(act.isEmpty, false, "[[],[]].isEmpty");
				assert.same(act.isSingle, false, "[[],[]].isSingle");
			});
			test(".concat/'+++'", function (assert) {
				let act, desc;
				act = nil.concat(nil);
				desc = "([] +++ [])";
				assert.same(act.expr, "[]", "(concat [] []).expr == " + desc)
				assert.same(act, nil, desc + " 1st traversal");
				assert.same(act, nil, desc + " 2nd traversal");
				assert.same(act.expr, "[]", desc + ".expr after 2nd traversal");
				assert.same(act.isEmpty, true, desc + ".isEmpty");
				act = nil.concat(nil);
				assert.same(act.expr, "[]", desc + ".expr after .isEmpty (but no traversal)");

				act = nil.cons(nil);
				desc = "[[]]";
				assert.same(act.expr, "[[]]", "(cons [] []).expr == " + desc)
				assert.all.same(act, [nil], desc + " 1st traversal");
				assert.all.same(act, [nil], desc + " 2nd traversal");
				assert.same(act.isEmpty, false, desc + ".isEmpty");
				assert.same(nil.concat(act), act, "([] +++ " + desc + ") == " + desc);
				assert.same(act.concat(nil), act, "(" + desc + " +++ []) == " + desc);

				act = nil.cons(nil).cons(nil);
				desc = "[[],[]]";
				assert.same(act.expr, "[[],[]]", "(cons [] [[]]).expr == " + desc)
				assert.same(act.isEmpty, false, desc + ".isEmpty");
				assert.all.same(act, [nil, nil], desc + " 1st traversal");
				assert.all.same(act, [nil, nil], desc + " 2nd traversal");
				assert.same(nil.concat(act), act, "([] +++ " + desc + "]) == " + desc);
				assert.same(act.concat(nil), act, "(" + desc + " +++ []) == " + desc);

				act = act.concat(act);
				desc = "([[],[]] +++ [[],[]])"
				assert.same(act.expr, desc, "(cons [] [[]]).expr == " + desc)
				assert.same(act.isEmpty, false, desc + ".isEmpty");
				assert.same(act.expr, desc, desc + ".expr after .isEmpty (but no traversal)");
				assert.same(act.head, nil, desc + ".head");
				assert.same(act.expr, "[]:(([[]] +++ [[],[]]))", desc + ".expr after .head (but no traversal)");
			});

		}); // end module "nil"

		module("cons", () => { // ------------------------------------------
			test(".expr & traversal", function (assert) {
				let act, desc;
				act = cons(42, nil);
				desc = "[42]";
				assert.same(act.expr, desc, "(cons 42 []).expr == " + desc);
				assert.same(act.isEmpty, false, desc + ".isEmpty");
				assert.all.same(act, [42], desc + " 1st traversal");
				assert.all.same(act, [42], desc + " 2nd traversal");
			});

			test(".concat/'+++'", function (assert) {
				const xs = cons(42, nil);
				let ys, desc;

				ys = xs.concat(nil);
				desc = "([42] +++ [])";
				assert.same(ys.expr, "[42]", "(cons 42 []).expr == [42]");
				assert.all.same(ys, [42], desc + "1st traversal");
				assert.all.same(ys, [42], desc + "2nd traversal");
				assert.same(ys.expr, "[42]", desc + ".expr after traversal");

				ys = xs.concat(nil);
				assert.same(ys.expr, "[42]", desc + ".expr == [42]");
				assert.same(ys.isEmpty, false, desc + ".isEmpty");
				assert.same(ys.expr, "[42]", desc + ".expr after .isEmpty (but no traversal)");
								
				ys = xs.concat(xs);
				desc = "([42] +++ [42])";
				assert.all.same(ys, [42,42], desc + " 1st traversal");
				assert.all.same(ys, [42,42], desc + " 2nd traversal");
			});

			module("cons", () => { // ------------------------------------------

				test("traversal", function (assert) {
					let xs = cons(42, cons(4711, nil));
					assert.all.same(xs, [42,4711], "cons(42,cons(4711, <>)) 1st traversal");
					assert.all.same(xs, [42,4711], "cons(42,cons(4711, <>)), 2nd traversal");
				});

				test(".concat/'+++'", function (assert) {
					const xs = cons(42, cons(4711, nil));
					let ys;
					
					ys = xs.concat(nil);
					assert.all.same(ys, [42,4711], "cons(42,cons(4711, <>)).concat(nil) 1st traversal");
					assert.all.same(ys, [42,4711], "cons(42,cons(4711, <>)).concat(nil) 2nd traversal");

					ys = xs.concat(xs);
					assert.all.same(ys, [42,4711,42,4711], "xs.concat(xs) where xs == cons(42,cons(4711, <>)); 1st traversal");
					assert.all.same(ys, [42,4711,42,4711], "xs.concat(xs) where xs == cons(42,cons(4711, <>)); 2nd traversal");
				});
			}); // end module "cons" (cons)

		}); // end module "cons"

		module("single", () => { // ------------------------------------------
			test("traversal", function (assert) {
				let xs = single(42);

				assert.isIterable(xs, "it's iterable");
				assert.all.same(xs, [42], "1st travsersal");
				assert.all.same(xs, [42], "2nd travsersal");
			});

			test(".concat/'+++'", function (assert) {
				const xs = single(42);
				let ys;
				
				ys = xs.concat(nil);
				assert.all.same(ys, [42], "<42>.concat(<>) 1st traversal");
				assert.all.same(ys, [42], "<42>.concat(<>), 2nd traversal");
				
				ys = xs.concat(xs);
				assert.all.same(ys, [42,42], "<42>.concat(<42>) 1st traversal");
				assert.all.same(ys, [42,42], "<42>.concat(<42>), 2nd traversal");
				
				ys = xs.concat(single(4711));
				assert.all.same(ys, [42,4711], "<42>.concat(<4711>) 1st traversal");
				assert.all.same(ys, [42,4711], "<42>.concat(<4711>), 2nd traversal");
			});
		}); // end module "single"

		module("cons+single", () => { // ------------------------------------------
			test("traversal", function (assert) {
				let xs = cons(3, cons(4, single(5)));

				assert.isIterable(xs, "it's iterable");
				assert.all.same(xs, [3,4,5], "1st travsersal");
				assert.all.same(xs, [3,4,5], "2nd travsersal");
			});
			todo("mapMany(single, ...)", function (assert) {
				let ys = cons(3, cons(4, single(5)));
				let xs = mapMany(single, ys);

				assert.isIterable(xs, "it's iterable");
				assert.all.same(xs, [3,4,5], "1st travsersal");
				assert.all.same(xs, [3,4,5], "2nd travsersal");
			});
		}); // end module "cons+single"


		module("class LazyLlist", () => { // ------------------------------------------
			test("foobar", function (assert) {
				let desc;
				const LazyList = lzy.LazyList;
				const nil = LazyList.nil;

				assert.same(nil.expr, "[]", "[].expr");
				assert.same(nil.isEmpty, true, "[].isEmpty");
				assert.same(nil.isSingle, false, "[].isSingle");

				let s5 = nil.cons(5);
				assert.same(s5.expr, "[5]", "(5:[]).expr");
				assert.same(s5.isEmpty, false, "(5:[]).isEmpty");
				assert.same(s5.isSingle, true, "(5:[]).isSingle");

				let t, t_expr;
				t = nil.cons(3).cons(2).cons(1);
				t_expr = t.expr;
				assert.same(t_expr, "[1,2,3]", "(1:2:3:[]).expr");

				let u, u_head, u_tail_tail;
				u = t.concat(t);
				assert.same(u.expr, "(" + t_expr + " +++ " + t_expr + ")");
				assert.same(u.isEmpty, false, "u.isEmpty");
				assert.same(u.expr, "(" + t_expr + " +++ " + t_expr + ")");
				u_head = u.head;
				assert.same(u.expr, "1:(([2,3] +++ " + t_expr + "))");
				u_tail_tail = u.tail.tail;
				assert.same(u.expr, "1:(2:(([3] +++ " + t_expr + ")))");

				let v, v_expr, w, w_head;
				v = t.concat(t);
				w = v.concat(v);
				v_expr = v.expr;
				assert.same(w.expr, "(" + v_expr + " +++ " + v_expr + ")");
				assert.same(w.isEmpty, false, "w.isEmpty");
				assert.same(w.expr, "(" + v_expr + " +++ " + v_expr + ")");
				w_head = w.head;
				v_expr = v.expr;
				assert.same(v_expr, "1:(([2,3] +++ [1,2,3]))", "v.expr");
				assert.same(w.expr, "1:((([2,3] +++ [1,2,3]) +++ " + v_expr + "))");
				
				function Kfalse(_) { return false }
				function even(x) { return (x % 2) === 0 }
				let x, x_expr, y;
				x = t.concat(t);
				x_expr = x.expr;
				assert.same(x_expr, "(" + t_expr + " +++ " + t_expr + ")");
				y = x.filter(even);
				desc = "(filter even " + x_expr + ")";
				y_expr = y.expr;
				assert.same(y_expr, desc, desc + ".expr (right after creation)");
				assert.same(y.isEmpty, false, desc + ".isEmpty");
				assert.same(y.expr, "2:((filter even ([3]" + " +++ " + t_expr + ")))",
					desc + ".expr after y.isEmpty");
				assert.all.same(y, [2,2], desc + " 1st traversal");
				assert.all.same(y, [2,2], desc + " 2nd traversal");
				assert.same(y.expr, "[2,2]",
					desc + ".expr after traversal");

				function odd(x) { return (x % 2) === 1 }
				v = u.filter(odd);
				assert.same(v.isEmpty, false, "v.isEmpty");
				v_expr = v.expr;

				assert.ok(true);
			});
		});  // end module "class LazyLlist"

	}); // end module "lazylist"
}); // end require