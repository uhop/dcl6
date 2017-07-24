/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	return Base => class extends Base {
		static get [dcl.declaredClass] () { return 'dcl/bases/Replacer'; }
		constructor (...args) {
			super(...args);
			if (typeof args[0] == 'object' || typeof args[0] == 'function') {
				const props = dcl.collectPropertyDescriptors(args[0]);
				Object.keys(props).forEach(name => {
					if (name in this) {
						Object.defineProperty(this, name, props[name]);
					}
				});
			}
		}
	};
});
