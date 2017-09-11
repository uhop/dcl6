/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['.dcl', './advise', './mixins/Named'], function (dcl, advise, Named) {
	'use strict';

	// set up custom names
	const pname = 'prototype', cname = 'constructor';

	function DclError (message) {
		this.name = 'DclError';
		this.message = message || 'Default Message';
		this.stack = (new Error()).stack;
	}
	DclError[pname] = Object.create(Error[pname]);
	DclError[pname][cname] = DclError;

	const CycleError = dcl(DclError, Named('dcl/debug/CycleError')),
		ChainingError = dcl(DclError, Named('dcl/debug/ChainingError')),
		SuperError = dcl(DclError, Named('dcl/debug/SuperError'));

	advise.around(dcl, '_error', function (sup) {
		return function (reason) {

		};
	});

	function log (o, suppressCtor) {

	}

	dcl.log = log;
	dcl.DclError = DclError;
	dcl.CycleError = CycleError;
	dcl.ChainingError = ChainingError;
	dcl.SuperError = SuperError;

	return dcl;
});
