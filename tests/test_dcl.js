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
		// function test_isInstanceOf (t) {
		// 	var A = dcl(null, {});
		// 	var B = dcl(null, {});
		// 	var C = dcl(null, {});
		// 	var D = dcl(null, {});
		//
		// 	var AC = dcl([A, C], {});
		// 	var BD = dcl([B, D], {});
		//
		// 	var x = new AC, y = new BD;
		//
		// 	eval(t.TEST('dcl.isInstanceOf(x, A)'));
		// 	eval(t.TEST('!dcl.isInstanceOf(x, B)'));
		// 	eval(t.TEST('dcl.isInstanceOf(x, C)'));
		// 	eval(t.TEST('!dcl.isInstanceOf(x, D)'));
		//
		// 	eval(t.TEST('!dcl.isInstanceOf(y, A)'));
		// 	eval(t.TEST('dcl.isInstanceOf(y, B)'));
		// 	eval(t.TEST('!dcl.isInstanceOf(y, C)'));
		// 	eval(t.TEST('dcl.isInstanceOf(y, D)'));
		// },
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
		}
	]);

	return {};
});
