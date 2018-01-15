define(["./fn", "./Datatype"], (fn, Datatype) => { with (fn) {

	const Pattern = new Datatype("Pattern", {
		Any: {},
	});
	
	return Pattern;
} /* end with(fn) */ });