'use strict';

(function (_, f, g) {
	g = window;g = g.dcl || (g.dcl = {});g = g.advices || (g.advices = {});g.flow = f();
})([], function () {
	'use strict';

	var flowStack = [],
	    flowCount = {};

	return {
		advice: function advice(name) {
			return {
				before: function before() {
					flowStack.push(name);
					flowCount[name] = (flowCount[name] || 0) + 1;
				},
				after: function after() {
					--flowCount[name];
					flowStack.pop();
				}
			};
		},
		inFlowOf: function inFlowOf(name) {
			return flowCount[name];
		},
		getStack: function getStack() {
			return flowStack;
		},
		getCount: function getCount() {
			return flowCount;
		}
	};
});