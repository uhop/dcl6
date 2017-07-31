'use strict';

(function (_, f, g) {
	g = window;g = g.dcl || (g.dcl = {});g = g.advices || (g.advices = {});g.time = f();
})([], function () {
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