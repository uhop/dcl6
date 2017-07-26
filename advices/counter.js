/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
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
