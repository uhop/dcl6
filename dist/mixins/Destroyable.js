(function(_,f,g){g=window.dcl;g=g.mixins||(g.mixins={});g.Destroyable=f(window.dcl);})
(['../dcl'], function (dcl) {
	'use strict';

	return Base => class extends Base {
		static get [dcl.declaredClass] () { return 'dcl/mixins/Destroyable'; }
		static get [dcl.directives] () { return {destroy: 'chainBefore'}; }
	};
});
