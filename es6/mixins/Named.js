import m0 from "../dcl";export default (function(_,f){return f(m0);})
(['../dcl'], function (dcl) {
	'use strict';

	return name => Base => class extends Base {
		static get [dcl.declaredClass] () { return name; }
	};
});
