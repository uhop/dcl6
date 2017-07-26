/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
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
