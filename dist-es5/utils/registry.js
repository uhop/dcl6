'use strict';

(function (_, f, g) {
	g = window.dcl;g = g.utils || (g.utils = {});g.registry = f(window.dcl, window.dcl.advise);
})(['../dcl', '../advise'], function (dcl, advise) {
	'use strict';

	var registry = {};

	// register all named classes automatically
	advise.after(dcl, '_makeCtr', function (_, ctr) {
		var name = ctr && (ctr[dcl.declaredClass] || ctr.prototype[dcl.declaredClass]);
		if (typeof name == 'string') {
			registry[name] = ctr;
		}
	});

	return {
		get: function get(name) {
			return registry[name];
		},
		has: function has(name) {
			return Object.prototype.hasOwnProperty.call(registry, name);
		},
		delete: function _delete(name) {
			return delete registry[name];
		},
		keys: function keys() {
			return Object.keys(registry).filter(function (name) {
				return Object.prototype.hasOwnProperty.call(registry, name);
			});
		},
		clear: function clear() {
			registry = {};
		}
	};
});