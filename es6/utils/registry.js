import m0 from "../dcl";import m1 from "../advise";export default (function(_,f){return f(m0,m1);})
(['../dcl', '../advise'], function (dcl, advise) {
	'use strict';

	let registry = {};

	// register all named classes automatically
	advise.after(dcl, '_makeCtr', (_, ctr) => {
		const name = ctr && (ctr[dcl.declaredClass] || ctr.prototype[dcl.declaredClass]);
		if (typeof name == 'string') {
			registry[name] = ctr;
		}
	});

	return {
		get: function (name) { return registry[name]; },
		has: function (name) { return Object.prototype.hasOwnProperty.call(registry, name); },
		delete: function (name) { return delete registry[name]; },
		keys: function () {
			return Object.keys(registry).filter(function (name) {
				return Object.prototype.hasOwnProperty.call(registry, name);
			});
		},
		clear: function () { registry = {}; }
	};
});
