import m0 from "../dcl";export default (function(_,f){return f(m0);})
(['../dcl'], function (dcl) {
	'use strict';

	const Counter = new dcl(null, Base => class extends Base {
		static get [dcl.declaredClass] () { return 'dcl/advices/counter/Counter'; }
		constructor () {
			super();
			this.reset();
		}
		reset () {
			this.calls = this.errors = 0;
		}
		advice () {
			return {
				before: () => {
					++this.calls;
				},
				after: (args, result) => {
					if (result instanceof Error) {
						++this.errors;
					}
				}
			};
		}
	});

	return () => new Counter;
});
