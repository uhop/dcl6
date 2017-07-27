(function(_,f,g){g=window;g=g.dcl||(g.dcl={});g=g.advices||(g.advices={});g.time=f();})
([], function () {
	'use strict';

	let uniq = 0;

	return name => {
		let inCall = 0;
		const label = name || ('Timer #' + uniq++);
		return {
			before: () => {
				if (!(inCall++)) {
					console.time(label);
				}
			},
			after: () => {
				if (!--inCall) {
					console.timeEnd(label);
				}
			}
		};
	};
});
