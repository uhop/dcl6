/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl'], function (module, unit, dcl) {
	'use strict';

	// tests

	unit.add(module, [
		function test_get_super (t) {
			const A = dcl(null, Base => class extends Base {
					constructor () {
						super();
						this.__value = 0;
					}
					get value () { return this.__value; }
				}),
				B = dcl(A, Base => class extends Base {
					static get [dcl.directives] () {
						return {
							value: {
								get: {
									around: function (sup) {
										return function () {
											return sup.call(this) + 1;
										};
									}
								}
							}
						};
					}
				}),
				C = dcl(B, Base => class extends Base {
					get value () { return 42; }
				});

			const a = new A(), b = new B(), c = new C();

			eval(t.TEST('a.value === 0'));
			eval(t.TEST('b.value === 1'));
			eval(t.TEST('c.value === 42'));

			a.__value = b.__value = c.__value = 3;

			eval(t.TEST('a.value === 3'));
			eval(t.TEST('b.value === 4'));
			eval(t.TEST('c.value === 42'));
		},
		function test_set_super (t) {
			const A = dcl(null, Base => class extends Base {
					constructor () {
						super();
						this.__value = 0;
					}
					set value (x) { this.__value = x; }
				}),
				B = dcl(A, Base => class extends Base {
					static get [dcl.directives] () {
						return {
							value: {
								set: {
									around: function (sup) {
										return function (x) {
											sup.call(this, x + 1);
										};
									}
								}
							}
						};
					}
				}),
				C = dcl(B, Base => class extends Base {
					set value (x) { this.__value = 42; }
				});

			const a = new A(), b = new B(), c = new C();

			a.value = 5;
			eval(t.TEST('a.__value === 5'));

			b.value = 5;
			eval(t.TEST('b.__value === 6'));

			c.value = 5;
			eval(t.TEST('c.__value === 42'));
		},
		function test_get_set_super (t) {
			const A = dcl(null, Base => class extends Base {
					constructor () {
						super();
						this.__value = 0;
					}
					get value ()  { return this.__value; }
					set value (x) { this.__value = x; }
				}),
				B = dcl(A, Base => class extends Base {
					static get [dcl.directives] () {
						return {
							value: {
								get: {
									around: function (sup) {
										return function () {
											return sup.call(this) + 1;
										};
									}
								},
								set: {
									around: function (sup) {
										return function (x) {
											sup.call(this, x + 1);
										};
									}
								}
							}
						};
					}
				}),
				C = dcl(B, Base => class extends Base {
					get value ()  { return 42; }
					set value (x) { this.__value = 42; }
				});

			const a = new A(), b = new B(), c = new C();

			eval(t.TEST('a.value === 0 && a.__value === 0'));
			a.value = 5;
			eval(t.TEST('a.value === 5 && a.__value === 5'));

			eval(t.TEST('b.value === 1 && b.__value === 0'));
			b.value = 5;
			eval(t.TEST('b.value === 7 && b.__value === 6'));

			eval(t.TEST('c.value === 42 && c.__value === 0'));
			c.value = 5;
			eval(t.TEST('c.value === 42 && c.__value === 42'));
		},
		{
			test: function test_get_side_advices (t) {
				const A = dcl(null, Base => class extends Base {
						constructor () {
							super();
							this.__value = 0;
						}
						static get [dcl.directives] () {
							return {
								value: {
									get: {
										before: function () { t.info('Ab'); },
										around: function (sup) {
											return function () { return this.__value; };
										},
										after:  function () { t.info('Aa'); }
									}
								}
							};
						}
					}),
					B = dcl(A, Base => class extends Base {
						static get [dcl.directives] () {
							return {
								value: {
									get: {
										before: function () { t.info('Bb'); },
										around: function (sup) {
											return function () { return sup.call(this) + 1; };
										},
										after:  function () { t.info('Ba'); }
									}
								}
							};
						}
					}),
					C = dcl(B, Base => class extends Base {
						get value () { return 42; }
					});

				const a = new A(), b = new B(), c = new C();

				t.info('read a');
				t.info(a.value + '');
				t.info('read b');
				t.info(b.value + '');
				t.info('read c');
				t.info(c.value + '');
			},
			logs: [
				'read a', 'Ab', 'Aa', '0',
				'read b', 'Bb', 'Ab', 'Aa', 'Ba', '1',
				'read c', 'Bb', 'Ab', 'Aa', 'Ba', '42'
			]
		},
		{
			test: function test_set_side_advices (t) {
				const A = dcl(null, Base => class extends Base {
						constructor () {
							super();
							this.__value = 0;
						}
						static get [dcl.directives] () {
							return {
								value: {
									set: {
										before: function () { t.info('Ab'); },
										around: function (sup) {
											return function (x) { this.__value = x; };
										},
										after:  function () { t.info('Aa'); }
									}
								}
							};
						}
					}),
					B = dcl(A, Base => class extends Base {
						static get [dcl.directives] () {
							return {
								value: {
									set: {
										before: function () { t.info('Bb'); },
										around: function (sup) {
											return function (x) { sup.call(this, x + 1); };
										},
										after:  function () { t.info('Ba'); }
									}
								}
							};
						}
					}),
					C = dcl(B, Base => class extends Base {
						set value (x) { this.__value = 42; }
					});

				const a = new A(), b = new B(), c = new C();

				t.info('write a');
				a.value = 5;
				t.info(a.__value + '');
				t.info('write b');
				b.value = 5;
				t.info(b.__value + '');
				t.info('write c');
				c.value = 5;
				t.info(c.__value + '');
			},
			logs: [
				'write a', 'Ab', 'Aa', '5',
				'write b', 'Bb', 'Ab', 'Aa', 'Ba', '6',
				'write c', 'Bb', 'Ab', 'Aa', 'Ba', '42'
			]
		},
		{
			test: function test_get_set_side_advices (t) {
				const A = dcl(null, Base => class extends Base {
						constructor () {
							super();
							this.__value = 0;
						}
						static get [dcl.directives] () {
							return {
								value: {
									get: {
										before: function () { t.info('Abg'); },
										around: function (sup) {
											return function () { return this.__value; };
										},
										after:  function () { t.info('Aag'); }
									},
									set: {
										before: function () { t.info('Ab'); },
										around: function (sup) {
											return function (x) { this.__value = x; };
										},
										after:  function () { t.info('Aa'); }
									}
								}
							};
						}
					}),
					B = dcl(A, Base => class extends Base {
						static get [dcl.directives] () {
							return {
								value: {
									get: {
										before: function () { t.info('Bbg'); },
										around: function (sup) {
											return function () { return sup.call(this) + 1; };
										},
										after:  function () { t.info('Bag'); }
									},
									set: {
										before: function () { t.info('Bb'); },
										around: function (sup) {
											return function (x) { sup.call(this, x + 1); };
										},
										after:  function () { t.info('Ba'); }
									}
								}
							};
						}
					}),
					C = dcl(B, Base => class extends Base {
						get value () { return 42; }
						set value (x) { this.__value = 42; }
					});

				const a = new A(), b = new B(), c = new C();

				t.info('read a');
				t.info(a.value + '');
				t.info(a.__value + '');
				t.info('write a');
				a.value = 5;
				t.info(a.value + '');
				t.info(a.__value + '');

				t.info('read b');
				t.info(b.value + '');
				t.info(b.__value + '');
				t.info('write b');
				b.value = 5;
				t.info(b.value + '');
				t.info(b.__value + '');

				t.info('read c');
				t.info(c.value + '');
				t.info(c.__value + '');
				t.info('write c');
				c.value = 5;
				t.info(c.value + '');
				t.info(c.__value + '');
			},
			logs: [
				'read a', 'Abg', 'Aag', '0', '0',
				'write a', 'Ab', 'Aa', 'Abg', 'Aag', '5', '5',
				'read b', 'Bbg', 'Abg', 'Aag', 'Bag', '1', '0',
				'write b', 'Bb', 'Ab', 'Aa', 'Ba', 'Bbg', 'Abg', 'Aag', 'Bag', '7', '6',
				'read c', 'Bbg', 'Abg', 'Aag', 'Bag', '42', '0',
				'write c', 'Bb', 'Ab', 'Aa', 'Ba', 'Bbg', 'Abg', 'Aag', 'Bag', '42', '42'
			]
		},
		function test_get_in_super_chain (t) {
			const A = dcl(null, Base => class extends Base {
					get m () {
						return this.up ? this.m3 : this.m2;
					}
					m2 (x) {
						return 2 * x;
					}
					m3 (x) {
						return 3 * x;
					}
				}),
				B = dcl(A, Base => class extends Base {
					m (x) {
						return super.m(x);
					}
					static get [dcl.directives] () {
						return {
							m: {
								around: function (sup) {
									return function (x) {
										if (sup) {
											return sup.call(this, x + 1);
										}
										return 0;
									};
								}
							}
						};
					}
				});

			const a = new A(), b = new B();

			eval(t.TEST('a.m(5) === 10'));
			a.up = true;
			eval(t.TEST('a.m(5) === 15'));

			eval(t.TEST('b.m(5) === 12'));
			b.up = true;
			eval(t.TEST('b.m(5) === 18'));
		},
		function test_super_in_get_chain (t) {
			const A = dcl(null, Base => class extends Base {
					m (x) {
						return x + 1;
					}
				}),
				B = dcl(A, Base => class extends Base {
					get m () { return super.m; }
					static get [dcl.directives] () {
						return {
							m: {
								get: {
									around: function (sup) {
										return function () {
											if (sup) {
												return function (x) {
													return sup.call(this).call(this, 2 * x);
												};
											}
											return function (x) {
												return x + 2;
											};
										};
									}
								}
							}
						};
					}
				});

			const a = new A(), b = new B();

			eval(t.TEST('a.m(5) === 6'));
			eval(t.TEST('b.m(5) === 11'));
		},
		{
			test: function test_get_super_side_advices (t) {
				const A = dcl(null, Base => class extends Base {
						static get [dcl.directives] () {
							return {
								m: {
									before: function (x) {
										t.info('A.m:before - ' + x);
									},
									after: function (_, x) {
										t.info('A.m:after - ' + x);
									},
									around: function (sup) {
										return function (x) {
											t.info('A.m:around - ' + x);
											return x + 1;
										};
									}
								}
							};
						}
					}),
					B = dcl(A, Base => class extends Base {
						get m () { return super.m; }
						static get [dcl.directives] () {
							return {
								m: {
									get: {
										before: function (x) {
											t.info('B.m:before');
										},
										after: function (_, x) {
											t.info('B.m:after');
										},
										around: function (sup) {
											return function () {
												t.info('B.m:around');
												return function (x) {
													return sup.call(this).call(this, x + 1);
												};
											};
										}
									}
								}
							};
						}
					}),
					C = dcl(B, Base => class extends Base {
						m (x) { return super.m(x); }
						static get [dcl.directives] () {
							return {
								m: {
									before: function (x) {
										t.info('C.m:before - ' + x);
									},
									after: function (_, x) {
										t.info('C.m:after - ' + x);
									},
									around: function (sup) {
										return function (x) {
											t.info('C.m:around - ' + x);
											return sup.call(this, x + 1);
										};
									}
								}
							};
						}
					});

				const a = new A(), b = new B(), c = new C();

				t.info('A');
				t.info('Result: ' + a.m(5));

				t.info('B');
				t.info('Result: ' + b.m(5));

				t.info('C');
				t.info('Result: ' + c.m(5));
			},
			logs: [
				'A', 'A.m:before - 5', 'A.m:around - 5', 'A.m:after - 6', 'Result: 6',
				'B', 'B.m:before', 'B.m:around', 'B.m:after', 'A.m:around - 6', 'Result: 7',
				'C', 'B.m:before', 'C.m:before - 5', 'A.m:before - 5',
					'C.m:around - 5', 'B.m:around', 'A.m:around - 7',
					'A.m:after - 8', 'C.m:after - 8', 'B.m:after', 'Result: 8'
			]
		}
	]);

	return {};
});
