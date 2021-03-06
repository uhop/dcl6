/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl', '../advise'], function (module, unit, dcl, advise) {
	'use strict';

	// tests

	unit.add(module, [
		function test_dclAdvise_with_advise (t) {
			'use strict';

			const A = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: {
							before: function () {
								this.a = this.a || '';
								this.a += 'b';
							},
							after: function () {
								this.a = this.a || '';
								this.a += 'a';
							}
						}
					};
				}
			});
			const B = dcl(A, Base => class extends Base {
				m1 (x) {
					this.a = this.a || '';
					this.a += x;
				}
			});

			const x = new B;
			x.m1('-');
			eval(t.TEST('x.a === "b-a"'));

			const h1 = advise(x, 'm1', {
				after: function () {
					this.a = this.a || '';
					this.a += 'A1';
				}
			});
			x.a = '';
			x.m1('-');
			eval(t.TEST('x.a === "b-aA1"'));

			const h2 = advise(x, 'm1', {
				before: function () {
					this.a = this.a || '';
					this.a += 'B1';
				}
			});
			x.a = '';
			x.m1('-');
			eval(t.TEST('x.a === "B1b-aA1"'));

			const h3 = advise(x, 'm1', {
				around: function (sup) {
					return function () {
						this.a = this.a || '';
						this.a += 'F1';
						if (sup) { sup.apply(this, arguments); }
						this.a += 'F2';
					};
				}
			});
			x.a = '';
			x.m1('-');
			eval(t.TEST('x.a === "B1bF1-F2aA1"'));

			h1.unadvise();
			x.a = '';
			x.m1('-');
			eval(t.TEST('x.a === "B1bF1-F2a"'));

			h2.unadvise();
			x.a = '';
			x.m1('-');
			eval(t.TEST('x.a === "bF1-F2a"'));

			h3.unadvise();
			x.a = '';
			x.m1('-');
			eval(t.TEST('x.a === "b-a"'));
		},
		function test_advise (t) {
			'use strict';

			const x = new (dcl(null, Base => class extends Base {
				static get [dcl.declaredClass] () { return 'XXX'; }
				constructor () {
					super();
					this.a = '';
				}
				m1 () {
					this.a += '*';
				}
			}));

			x.m1();
			eval(t.TEST('x.a === "*"'));

			const h1 = advise(x, 'm1', {
				around: function (sup) {
					return function () {
						this.a += 'b1';
						sup.call(this);
						this.a += 'a1';
					};
				}
			});

			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "b1*a1"'));

			const h2 = advise(x, 'm1', {
				around: function (sup) {
					return function () {
						this.a += 'b2';
						sup.call(this);
						this.a += 'a2';
					};
				}
			});

			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "b2b1*a1a2"'));

			const h3 = advise(x, 'm1', {
				around: function (sup) {
					return function () {
						this.a += 'b3';
						sup.call(this);
						this.a += 'a3';
					};
				}
			});

			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "b3b2b1*a1a2a3"'));

			const h4 = advise(x, 'm1', {
				around: function (sup) {
					return function () {
						this.a += 'b4';
						sup.call(this);
						this.a += 'a4';
					};
				}
			});

			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "b4b3b2b1*a1a2a3a4"'));

			h2.unadvise();
			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "b4b3b1*a1a3a4"'));

			h1.unadvise();
			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "b4b3*a3a4"'));

			h3.unadvise();
			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "b4*a4"'));

			h4.unadvise();
			x.a = '';
			x.m1();
			eval(t.TEST('x.a === "*"'));
		}
	]);

	return {};
});
