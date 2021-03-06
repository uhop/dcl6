(function(_,f,g){g=window.dcl;g=g.mixins||(g.mixins={});g.Replacer=f(window.dcl);})
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
