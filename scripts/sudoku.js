
define(function() {
	
	function create(options) {
		if (options && options.box) {
			var boxW = options.box[0];
			var boxH = options.box[1];
			var n = boxW * boxH; // cells per group = nr of rows = nr of cols = nr of boxes
			return {
				cellCount: () => n*n
			};
		} else {
			throw "missing/bad options"
		}
	}

	return {
		create: create
	};
});
