/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	return Base => class extends Base {
		static get [dcl.declaredClass] () { return 'dcl/bases/Mixer'; }
		constructor (...args) {
			super(...args);
			if (typeof args[0] == 'object' || typeof args[0] == 'function') {
				Object.defineProperties(this, dcl.collectPropertyDescriptors(args[0]));
			}
		}
	};
});
