/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([
	'heya-unit',
	'./test_mini',
	'./test_dcl',
	'./test_raw',
	'./test_mixins',
	'./test_accessors',
	'./test_advise'
	// './test_advices',
	// './test_advise_accessors',
	// './test_debug',
	// './test_registry'
],
function (unit) {
	'use strict';
	unit.run();
});
