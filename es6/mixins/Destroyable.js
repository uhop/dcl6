import m0 from "../dcl";export default (function(_,f){return f(m0);})
(['../dcl'], function (dcl) {
	'use strict';

	return Base => class extends Base {
		static get [dcl.declaredClass] () { return 'dcl/mixins/Destroyable'; }
		static get [dcl.directives] () { return {destroy: 'chainBefore'}; }
	};
});
