QUnit.module("QUnit-ext"); // ---------------------------------------------------------

QUnit.test("assert.same is a synonym for assert.strictEqual", function(assert) {
	const orig = assert.strictEqual;
	const strictEqual_calls = [];
	const pushResult_calls = [];
	const pushResult_logger = {
		pushResult: function () {
			pushResult_calls.push({
				thisValue: this,
				arguments: arguments
			});
		}
	};

	function interceptIt() {
		assert.strictEqual = function () {
			const result = orig.apply(pushResult_logger, arguments);
			strictEqual_calls.push({
				thisValue: this,
				arguments: arguments,
				result:    result
			});
			return result;
		};
	}
	function repairIt() {
		assert.strictEqual = orig;
	}

	const o = {};
	const message = "foobar";
	let c0;
	
	// act (passing)
	interceptIt();
	assert.same(o, o, message);
	repairIt();

	// assert
	assert.strictEqual(strictEqual_calls.length, 1, ".strictEqual callCount");
	c = strictEqual_calls[0];
	assert.strictEqual(c.thisValue, assert, "1st .strictEqual call: thisValue");
	assert.strictEqual(c.arguments.length, 3, "1st .strictEqual call: arguments.length");
	assert.strictEqual(c.arguments[0], o, "1st .strictEqual call: arguments[0] (actual)");
	assert.strictEqual(c.arguments[1], o, "1st .strictEqual call: arguments[1] (expected)");
	assert.strictEqual(c.arguments[2], message, "1st .strictEqual call: arguments[2] (message)");

	assert.strictEqual(pushResult_calls.length, 1, "pushResult callCount");
	c = pushResult_calls[0];
	assert.strictEqual(c.arguments.length, 1, 
		"1st .pushResult call: arguments.length");
	assert.strictEqual(c.arguments[0].result, true,
		"1st .pushResult call: arguments[0].result");
	assert.strictEqual(c.arguments[0].actual, o,
		"1st .pushResult call: arguments[0].actual");
	assert.strictEqual(c.arguments[0].expected, o,
		"1st .pushResult call: arguments[0].expected");
	assert.strictEqual(c.arguments[0].message, message,
		"1st .pushResult call: arguments[0].message");


	const p = { some: "other object" };
	// act (failing)
	interceptIt();
	assert.same(o, p, message);
	repairIt();

	// assert
	assert.strictEqual(strictEqual_calls.length, 2, ".strictEqual callCount");
	c = strictEqual_calls[1];
	assert.strictEqual(c.thisValue, assert, "2nd .strictEqual call: thisValue");
	assert.strictEqual(c.arguments.length, 3, "2nd .strictEqual call: arguments.length");
	assert.strictEqual(c.arguments[0], o, "2nd .strictEqual call: arguments[0] (actual)");
	assert.strictEqual(c.arguments[1], p, "2nd .strictEqual call: arguments[1] (expected)");
	assert.strictEqual(c.arguments[2], message, "2nd .strictEqual call: arguments[2] (length)");

	assert.strictEqual(pushResult_calls.length, 2, "pushResult callCount");
	c = pushResult_calls[1];
	assert.strictEqual(c.arguments.length, 1, 
		"2nd .pushResult call: arguments.length");
	assert.strictEqual(c.arguments[0].result, false,
		"2nd .pushResult call: arguments[0].result");
	assert.strictEqual(c.arguments[0].actual, o,
		"2nd .pushResult call: arguments[0].actual");
	assert.strictEqual(c.arguments[0].expected, p,
		"2nd .pushResult call: arguments[0].expected");
	assert.strictEqual(c.arguments[0].message, message,
		"2nd .pushResult call: arguments[0].message");
	
});
