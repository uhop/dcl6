/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl'], function (dcl) {
	'use strict';

	return dcl(null, Base => class extends Base {
		static get [dcl.declaredClass] () { return 'dcl/bases/Mixer'; }
		constructor (x) {
			super(x);
			Object.defineProperties(this, dcl.collectPropertyDescriptors(x));
		}
	});
});
