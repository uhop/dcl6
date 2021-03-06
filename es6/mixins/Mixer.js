import m0 from "../dcl";export default (function(_,f){return f(m0);})
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
