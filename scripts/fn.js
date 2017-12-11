define([], () => {

	const returnThis = function returnThis() { return this };

	return Object.create(null, {
		returnThis: { value: returnThis },
	});
});

