define(["./Datatype"], (Datatype) => {

	const Maybe = new Datatype("Maybe", {
		None: {},
		Some: { value: () => true }
	});

	return Maybe;
});