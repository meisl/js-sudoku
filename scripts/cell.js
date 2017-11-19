
define(function() {
	
	function create(s) {
		return {
			field: () => s
		};
	}

	return {
		create: s => create(s),
	};
});
