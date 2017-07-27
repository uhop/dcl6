(function(_,f,g){g=window.dcl;g=g.advices||(g.advices={});g.counter=f(window.dcl);})
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
