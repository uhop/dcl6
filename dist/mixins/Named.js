(function(_,f,g){g=window.dcl;g=g.mixins||(g.mixins={});g.Named=f(window.dcl);})
(['../dcl'], function (dcl) {
	'use strict';

	return name => Base => class extends Base {
		static get [dcl.declaredClass] () { return name; }
	};
});
