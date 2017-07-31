/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl'], function (module, unit, dcl) {
	'use strict';

	// tests

	unit.add(module, [
		function test_chaining (t) {
			const A = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: 'chainBefore',
						m2: 'chainAfter'
					};
				}
			});

			const B = dcl(null, Base => class extends Base {
				m1 () {
					this.b = this.b || '';
					this.b += 'B';
				}
				m2 () {
					this.c = this.c || '';
					this.c += 'B';
				}
			});

			const C = dcl(null, Base => class extends Base {
				m1 () {
					this.b = this.b || '';
					this.b += 'C';
				}
				m2 () {
					this.c = this.c || '';
					this.c += 'C';
				}
			});

			const D = dcl(null, Base => class extends Base {
				m1 () {
					this.b = this.b || '';
					this.b += 'D';
				}
				m2 () {
					this.c = this.c || '';
					this.c += 'D';
				}
			});

			const ABCD = dcl(null, A, B, C, D);
			const x = new ABCD;
			x.m1();
			x.m2();

			eval(t.TEST('x.b === "DCB"'));
			eval(t.TEST('x.c === "BCD"'));
		},
		function test_postscript (t) {
			const A = dcl(null, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'A';
				}
				postscript () {
					this.b = 'A';
				}
				static get [dcl.directives] () {
					return {
						constructor: {
							after: function () {
								this.postscript();
							}
						}
					};
				}
			});

			const B = dcl(null, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'B';
				}
				postscript () {
					this.b = 'B';
				}
			});

			const C = dcl(null, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'C';
				}
				postscript () {
					this.b = 'C';
				}
			});

			const x = new (dcl(A));
			eval(t.TEST('x.a === "A"'));
			eval(t.TEST('x.b === "A"'));

			const y = new (dcl(A, B));
			eval(t.TEST('y.a === "AB"'));
			eval(t.TEST('y.b === "B"'));

			const z = new (dcl(A, B, C));
			eval(t.TEST('z.a === "ABC"'));
			eval(t.TEST('z.b === "C"'));
		},
		function test_postscript2 (t) {
			const A = dcl(null, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'A';
				}
				postscript () {
					this.a = this.a || '';
					this.a += 'P';
				}
				static get [dcl.directives] () {
					return {
						constructor: {
							after: function () {
								this.postscript();
							}
						}
					};
				}
			});

			const B = dcl(null, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'B';
				}
			});

			const C = dcl(null, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'C';
				}
			});

			const x = new (dcl(A));
			eval(t.TEST('x.a === "AP"'));

			const y = new (dcl(A, B));
			eval(t.TEST('y.a === "ABP"'));

			const z = new (dcl(A, B, C));
			eval(t.TEST('z.a === "ABCP"'));

			const m = new (dcl(B, A));
			eval(t.TEST('m.a === "BAP"'));

			const n = new (dcl(C, A, B));
			eval(t.TEST('n.a === "CABP"'));
		},
		function test_advise (t) {
			const A = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: {
							after: function () {
								this.a = this.a || '';
								this.a += 'Aa';
							}
						}
					};
				}
			});
			const B = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: {
							before: function () {
								this.a = this.a || '';
								this.a += 'Bb';
							}
						}
					};
				}
			});
			const C = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: {
							around: function (sup) {
								return function () {
									this.a = this.a || '';
									this.a += 'Cfb';
									sup && sup.apply(this, arguments);
									this.a += 'Cfa';
								};
							}
						}
					};
				}
			});
			const D = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: {
							before: function () {
								this.a = this.a || '';
								this.a += 'Db';
							},
							around: function (sup) {
								return function () {
									this.a = this.a || '';
									this.a += 'Dfb';
									sup && sup.apply(this, arguments);
									this.a += 'Dfa';
								};
							},
							after: function () {
								this.a = this.a || '';
								this.a += 'Da';
							}
						}
					};
				}
			});
			const E = dcl(null, Base => class extends Base {
				m1 () {
					this.a = this.a || '';
					this.a += 'E';
				}
			});

			const x = new (dcl(E, A, B, C, D));
			x.m1();
			eval(t.TEST('x.a === "DbBbDfbCfbECfaDfaAaDa"'));

			const y = new (dcl(A, B, C, D, E));
			y.m1();
			eval(t.TEST('y.a === "DbBbEAaDa"'));
		},
		function test_advise2 (t) {
			const A = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: {
							before: function () {
								this.a = this.a || '';
								this.a += 'Ab';
							},
							after: function () {
								this.a = this.a || '';
								this.a += 'Aa';
							}
						}
					};
				}
			});
			const B = dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						m1: {
							before: function () {
								this.a = this.a || '';
								this.a += 'Bb';
							},
							after: function () {
								this.a = this.a || '';
								this.a += 'Ba';
							}
						}
					};
				}
			});

			const x = new (dcl(A, B));
			x.m1();
			eval(t.TEST('x.a === "BbAbAaBa"'));

			const y = new (dcl(B, A));
			y.m1();
			eval(t.TEST('y.a === "AbBbBaAa"'));
		},
		function test_meta (t) {
			const A = Base => class extends Base { a () { return 1; } }
			const B = Base => class extends Base { b () { return 2; } }
			const C = Base => class extends Base { c () { return 3; } }
			const D = Base => class extends Base { d () { return 4; } }

			const ABC = dcl(null, A, B, C);
			eval(t.TEST('dcl.hasMixin(ABC, A)'));
			eval(t.TEST('dcl.hasMixin(ABC, B)'));
			eval(t.TEST('dcl.hasMixin(ABC, C)'));
			eval(t.TEST('!dcl.hasMixin(ABC, D)'));

			const AB = dcl(null, A, B);
			eval(t.TEST('dcl.hasMixin(AB, A)'));
			eval(t.TEST('dcl.hasMixin(AB, B)'));
			eval(t.TEST('!dcl.hasMixin(AB, C)'));
			eval(t.TEST('!dcl.hasMixin(AB, D)'));

			const AC = dcl(null, A, C);
			eval(t.TEST('dcl.hasMixin(AC, A)'));
			eval(t.TEST('!dcl.hasMixin(AC, B)'));
			eval(t.TEST('dcl.hasMixin(AC, C)'));
			eval(t.TEST('!dcl.hasMixin(AC, D)'));

			const BC = dcl(null, B, C);
			eval(t.TEST('!dcl.hasMixin(BC, A)'));
			eval(t.TEST('dcl.hasMixin(BC, B)'));
			eval(t.TEST('dcl.hasMixin(BC, C)'));
			eval(t.TEST('!dcl.hasMixin(BC, D)'));

			const CD = dcl(null, C, D);
			eval(t.TEST('!dcl.hasMixin(CD, A)'));
			eval(t.TEST('!dcl.hasMixin(CD, B)'));
			eval(t.TEST('dcl.hasMixin(CD, C)'));
			eval(t.TEST('dcl.hasMixin(CD, D)'));

			eval(t.TEST('dcl.isSubset(ABC, ABC)'));
			eval(t.TEST('dcl.isSubset(ABC, AB)'));
			eval(t.TEST('dcl.isSubset(ABC, AC)'));
			eval(t.TEST('dcl.isSubset(ABC, BC)'));
			eval(t.TEST('!dcl.isSubset(ABC, CD)'));

			eval(t.TEST('!dcl.isSubset(CD, ABC)'));
			eval(t.TEST('!dcl.isSubset(CD, AB)'));
			eval(t.TEST('!dcl.isSubset(CD, AC)'));
			eval(t.TEST('!dcl.isSubset(CD, BC)'));

			const X = function () {};

			const XABC = dcl(X, A, B, C);
			eval(t.TEST('dcl.hasMixin(XABC, A)'));
			eval(t.TEST('dcl.hasMixin(XABC, B)'));
			eval(t.TEST('dcl.hasMixin(XABC, C)'));
			eval(t.TEST('!dcl.hasMixin(XABC, D)'));

			eval(t.TEST('dcl.isSubset(XABC, ABC)'));
			eval(t.TEST('dcl.isSubset(XABC, AB)'));
			eval(t.TEST('dcl.isSubset(XABC, AC)'));
			eval(t.TEST('dcl.isSubset(XABC, BC)'));
			eval(t.TEST('!dcl.isSubset(XABC, CD)'));

			const XA = dcl(X, A);
			eval(t.TEST('dcl.isSubset(XABC, XA)'));
			eval(t.TEST('!dcl.isSubset(ABC, XA)'));
			eval(t.TEST('!dcl.isSubset(XA, ABC)'));

			const XAB = dcl(XA, B);
			const xab = new XAB;
			eval(t.TEST('xab instanceof XAB'));
			// eval(t.TEST('xab instanceof XA'));
			eval(t.TEST('xab instanceof X'));
			eval(t.TEST('xab instanceof Object'));
		},
		function test_flattenMixins (t) {
			const A = Base => class extends Base {};
			const B = Base => class extends Base {};
			const C = Base => class extends Base {};

			const X = function () {};

			const matrix = [
				dcl(X, A, B, C),
				dcl(X, A, [B, C]),
				dcl(X, [A, B], C),
				dcl(X, [A, B, C]),
				dcl(X, [[A, B, C]]),
				dcl(X, [[A], [[B]], [[[C]]]])
			];

			for (let i = 0; i < matrix.length; ++i) {
				for (let j = 0; j < matrix.length; ++j) {
					eval(t.TEST('dcl.isSubset(matrix[i], matrix[j])'));
					eval(t.TEST('dcl.isSubset(matrix[j], matrix[i])'));
				}
			}
		}
	]);

	return {};
});
