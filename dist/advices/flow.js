(function(_,f,g){g=window;g=g.dcl||(g.dcl={});g=g.advices||(g.advices={});g.flow=f();})
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
