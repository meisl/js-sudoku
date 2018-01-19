require(["scripts/Datatype", "scripts/Data_Maybe"], (Datatype, Maybe) => {
	const { test, todo, skip, module } = QUnit;

	const { isDatatype, isDatactor, isDatavalue } = Datatype;
	const { None, Some } = Maybe;

	module("Maybe", () => { // ------------------------------------------
		
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

		test("ctors", function (assert) {
			assert.hasDatactor(Maybe, "None", 0);
			assert.hasDatactor(Maybe, "Some", 1);
		});

	}); // end module "Maybe"
}); // end require