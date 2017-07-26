/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';

	const flowStack = [], flowCount = {};

	return {
		advice: name => ({
			before: () => {
				flowStack.push(name);
				flowCount[name] = (flowCount[name] || 0) + 1;
			},
			after: () => {
				--flowCount[name];
				flowStack.pop();
			}
		}),
		inFlowOf: name => flowCount[name],
		getStack: () => flowStack,
		getCount: () => flowCount
	};
});
