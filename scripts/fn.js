
define([], function() {

	const returnThis = function returnThis() { return this };

	return {
		returnThis: returnThis,
	};
});

