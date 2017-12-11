require([], function() {

	QUnit.assert.same = function same(v, x, m) {
		return this.strictEqual(v, x, m);
	}

	QUnit.assert.typeof = function(value, expected, what, message) {
		let actual = typeof value;

		if (message !== undefined) {
			message = what + ": " + message;
		} else if (what !== undefined) {
			message = what;
		} else if (expected !== undefined) {
			message = "";
		} else {
			throw "assert.typeof: missing expected argument";
		}
		if ({
			object:    1, 
			function:  1,
			symbol:    1,
			boolean:   1,
			number:    1,
			string:    1,
			undefined: 1
		}[expected] !== 1) {
			throw "assert.typeof: invalid expected argument " + expected;
		}
		let result = actual === expected;
		if (!result) {
			message += " / which actually is: " + value;
		} else {
			message += " is \"" + expected + "\"";
		}

		this.pushResult({
			result:   result,
			actual:   actual,
			expected: expected,
			message:  "typeof " + message
		});
	};

	QUnit.assert.isObject = function (value, what, message) {
		QUnit.assert.typeof(value, "object", what, message);
	};

	QUnit.assert.isFunction = function (value, what, message) {
		QUnit.assert.typeof(value, "function", what, message);
	};

	QUnit.assert.isSymbol = function (value, what, message) {
		QUnit.assert.typeof(value, "symbol", what, message);
	};

	QUnit.assert.isBoolean = function (value, what, message) {
		QUnit.assert.typeof(value, "boolean", what, message);
	};

	QUnit.assert.isNumber = function (value, what, message) {
		QUnit.assert.typeof(value, "number", what, message);
	};

	QUnit.assert.isString = function (value, what, message) {
		QUnit.assert.typeof(value, "string", what, message);
	};

	QUnit.assert.isIterator = function(value, what, message) {
		if (what === undefined) {
			what = "iterator";
		}
		this.isObject(value, what, message);
		this.isFunction(value.next, what + "'s .next method", message);
	};

	QUnit.assert.isIterable = function(value, what, message) {
		if (what === undefined) {
			what = "iterable";
		}
		this.isObject(value, what, message);
		this.isFunction(value[Symbol.iterator],
			what + "'s [Symbol.iterator] method", message);
		this.isIterator(value[Symbol.iterator](), 
			what + "[Symbol.iterator]()", 
			message);
	};

	function assert_all2(elemTest, elemAssertion, value, expected, what, message) {
		if (what === undefined) {
			what = "iterable";
		}
		if (message === undefined) {
			message = "";
		} else {
			message = ": " + message;
		}
		this.isIterable(value, what, message);
		let itAct = value[Symbol.iterator]();
		let itExp = expected[Symbol.iterator]();
		let eAct, eExp;
		let i = 0;
		do {
			eAct = itAct.next();
			eExp = itExp.next();
			if (eAct.done !== eExp.done) {
				this.pushResult({
					result: false,
					actual: eAct,
					expected: eExp,
					message: what + "'s iterator.next() result" 
						+ " at index " + i 
						+ " (" 
							+ (eAct.done ? "fewer" : "more")
							+ " elems than expected)"
						+ message
				});
				return;
			} else {
				let vAct = eAct.value;
				let vExp = eExp.value;
				if (!elemTest(vAct, vExp)) {
					elemAssertion.call(this, vAct, vExp,
						what + "'s iterator.next() result" 
							+ " at index " + i 
							+ message
					);
					return;
				}
			}
			i++;
		} while (!eExp.done);
		this.pushResult({
			result: true,
			actual: value,
			expected: expected,
			message: "all " + (i-1) + " elems "
				+ " of " + what + message
				+ elemAssertion.name + " as expected"
		});
	};

	QUnit.assert.all = {
		equal: assert_all2.bind(
			QUnit.assert, (a,b) => a == b,  QUnit.assert.equal
		), strictEqual: assert_all2.bind(
			QUnit.assert, (a,b) => a === b, QUnit.assert.strictEqual
		), same: assert_all2.bind(
			QUnit.assert, (a,b) => a === b, QUnit.assert.same
		),
	};

}); // end require