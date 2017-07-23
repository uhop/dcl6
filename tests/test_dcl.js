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
		}
		// function test_postscript2 (t) {
		// 	var A = dcl(null, {
		// 		constructor: dcl.advise({
		// 			around: function (sup) {
		// 				return function () {
		// 					if (!this.a) { this.a = ''; }
		// 					this.a += 'A';
		// 				};
		// 			},
		// 			after: function () {
		// 				this.postscript();
		// 			}
		// 		}),
		// 		postscript: function () {
		// 			if (!this.a) { this.a = ''; }
		// 			this.a += 'P';
		// 		}
		// 	});
		//
		// 	var B = dcl(null, {
		// 		constructor: function () {
		// 			if (!this.a) { this.a = ''; }
		// 			this.a += 'B';
		// 		}
		// 	});
		//
		// 	var C = dcl(null, {
		// 		constructor: function () {
		// 			if (!this.a) { this.a = ''; }
		// 			this.a += 'C';
		// 		}
		// 	});
		//
		// 	var x = new (dcl(A, {}));
		// 	eval(t.TEST('x.a === "AP"'));
		//
		// 	var y = new (dcl([A, B], {}));
		// 	eval(t.TEST('y.a === "ABP"'));
		//
		// 	var z = new (dcl([A, B, C], {}));
		// 	eval(t.TEST('z.a === "ABCP"'));
		//
		// 	var m = new (dcl([B, A], {}));
		// 	eval(t.TEST('m.a === "AP"'));
		//
		// 	var n = new (dcl([C, A, B], {}));
		// 	eval(t.TEST('n.a === "ABP"'));
		// },
		// function test_advise (t) {
		// 	var A = dcl(null, {
		// 		m1: dcl.advise({
		// 			after: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Aa';
		// 			}
		// 		})
		// 	});
		// 	var B = dcl(null, {
		// 		m1: dcl.advise({
		// 			before: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Bb';
		// 			}
		// 		})
		// 	});
		// 	var C = dcl(null, {
		// 		m1: dcl.superCall(function (sup) {
		// 			return function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Cfb';
		// 				if (sup) {
		// 					sup.apply(this, arguments);
		// 				}
		// 				this.a += 'Cfa';
		// 			};
		// 		})
		// 	});
		// 	var D = dcl(null, {
		// 		m1: dcl.advise({
		// 			before: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Db';
		// 			},
		// 			around: function (sup) {
		// 				return function () {
		// 					if (!this.a) { this.a = ''; }
		// 					this.a += 'Dfb';
		// 					if (sup) {
		// 						sup.apply(this, arguments);
		// 					}
		// 					this.a += 'Dfa';
		// 				};
		// 			},
		// 			after: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Da';
		// 			}
		// 		})
		// 	});
		// 	var E = dcl(null, {
		// 		m1: function () {
		// 			if (!this.a) { this.a = ''; }
		// 			this.a += 'E';
		// 		}
		// 	});
		//
		// 	var x = new (dcl([E, A, B, C, D], {}));
		// 	x.m1();
		// 	eval(t.TEST('x.a === "DbBbDfbCfbECfaDfaAaDa"'));
		//
		// 	var y = new (dcl([A, B, C, D, E], {}));
		// 	y.m1();
		// 	eval(t.TEST('y.a === "DbBbEAaDa"'));
		// },
		// function test_advise2 (t) {
		// 	var A = dcl(null, {
		// 		m1: dcl.advise({
		// 			before: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Ab';
		// 			},
		// 			after: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Aa';
		// 			}
		// 		})
		// 	});
		// 	var B = dcl(null, {
		// 		m1: dcl.advise({
		// 			before: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Bb';
		// 			},
		// 			after: function () {
		// 				if (!this.a) { this.a = ''; }
		// 				this.a += 'Ba';
		// 			}
		// 		})
		// 	});
		//
		// 	var x = new (dcl([A, B], {}));
		// 	x.m1();
		// 	eval(t.TEST('x.a === "BbAbAaBa"'));
		//
		// 	var y = new (dcl([B, A], {}));
		// 	y.m1();
		// 	eval(t.TEST('y.a === "AbBbBaAa"'));
		// }
	]);

	return {};
});
