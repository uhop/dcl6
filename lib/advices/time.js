'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (_, f) {
	return f();
}([], function () {
	'use strict';

	var uniq = 0;

	return function (name) {
		var inCall = 0;
		var label = name || 'Timer #' + uniq++;
		return {
			before: function before() {
				if (!inCall++) {
					console.time(label);
				}
			},
			after: function after() {
				if (! --inCall) {
					console.timeEnd(label);
				}
			}
		};
	};
});