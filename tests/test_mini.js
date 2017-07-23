/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl'], function (module, unit, dcl) {
	'use strict';

	function getNames (ctr) {
		const names = [];
		dcl.iterateOverPrototypes(ctr.prototype, proto => {
			names.push(
				proto.constructor.hasOwnProperty(dcl.declaredClass) && proto.constructor[dcl.declaredClass] ||
				proto.hasOwnProperty(dcl.declaredClass) && proto[dcl.declaredClass]
			);
		});
		return names.reverse().join(',');
	}

	function Named (name) {
		return Base => class extends Base {static get [dcl.declaredClass] () { return name; }}
	}

	// tests

	unit.add(module, [
		function test_simple (t) {
			const A = dcl(null, Named('A'));
			const B = dcl(A, Named('B'));
			const C = dcl(B, Named('C'));

			eval(t.TEST('getNames(A) === "A"'));
			eval(t.TEST('getNames(B) === "A,B"'));
			eval(t.TEST('getNames(C) === "A,B,C"'));
		},
		function test_around (t) {
			const A = dcl(null, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'A';
				}
				m1 () {
					this.b = 'X';
				}
				static get [dcl.directives] () {
					return {
						m2: {
							around: function (sup) {
								return function () {
									if (sup) { sup.call(this); }
									this.c = this.c || '';
									this.c += '1';
								};
							}
						},
						m3: {
							around: function (sup) {
								return function () {
									this.d = this.d || '';
									this.d += 'M';
									if (sup) { sup.call(this); }
								};
							}
						}
					};
				}
			});

			const a = new A;
			a.m1();
			a.m2();
			a.m3();

			eval(t.TEST('a.a === "A"'));
			eval(t.TEST('a.b === "X"'));
			eval(t.TEST('a.c === "1"'));
			eval(t.TEST('a.d === "M"'));

			const B = dcl(null, A, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'B';
				}
				m1 () {
					this.b = 'Y';
				}
				static get [dcl.directives] () {
					return {
						m2: {
							around: function (sup) {
								return function () {
									if (sup) { sup.call(this); }
									this.c = this.c || '';
									this.c += '2';
								};
							}
						},
						m3: {
							around: function (sup) {
								return function () {
									this.d = this.d || '';
									this.d += 'N';
									if (sup) { sup.call(this); }
								};
							}
						}
					};
				}
			});

			const b = new B;
			b.m1();
			b.m2();
			b.m3();

			eval(t.TEST('b.a === "AB"'));
			eval(t.TEST('b.b === "Y"'));
			eval(t.TEST('b.c === "12"'));
			eval(t.TEST('b.d === "NM"'));

			const C = dcl(B, Base => class extends Base {
				constructor () {
					super();
					this.a = this.a || '';
					this.a += 'C';
				}
				m1 () {
					this.b = 'Z';
				}
				static get [dcl.directives] () {
					return {
						m2: {
							around: function (sup) {
								return function () {
									if (sup) { sup.call(this); }
									this.c = this.c || '';
									this.c += '3';
								};
							}
						},
						m3: {
							around: function (sup) {
								return function () {
									this.d = this.d || '';
									this.d += 'O';
									if (sup) { sup.call(this); }
								};
							}
						}
					};
				}
			});

			var c = new C;
			c.m1();
			c.m2();
			c.m3();

			eval(t.TEST('c.a === "ABC"'));
			eval(t.TEST('c.b === "Z"'));
			eval(t.TEST('c.c === "123"'));
			eval(t.TEST('c.d === "ONM"'));
		},
		function test_diamonds (t) {
			const A = Named('A');
			const B = Named('B');
			const C = Named('C');
			const D = Named('D');

			const ABC = dcl(null, A, B, C, Named('ABC'));
			const ADC = dcl(null, A, D, C, Named('ADC'));

			eval(t.TEST('getNames(ABC) === "A,B,C,ABC"'));
			eval(t.TEST('getNames(ADC) === "A,D,C,ADC"'));

			const ABCD1 = dcl(null, ABC, ADC, Named('ABCD1'));
			const ABCD2 = dcl(null, ADC, ABC, Named('ABCD2'));

			eval(t.TEST('getNames(ABCD1) === "A,B,D,C,ABC,ADC,ABCD1"'));
			eval(t.TEST('getNames(ABCD2) === "A,D,B,C,ADC,ABC,ABCD2"'));
		},
		function test_triangles (t) {
			const A = Named('A');
			const B = Named('B');
			const C = Named('C');

			const ABC = dcl(null, A, B, C, Named('ABC'));
			const AC  = dcl(null, A, C, Named('AC'));
			const BC  = dcl(null, B, C, Named('BC'));

			eval(t.TEST('getNames(ABC) === "A,B,C,ABC"'));
			eval(t.TEST('getNames(AC) === "A,C,AC"'));
			eval(t.TEST('getNames(BC) === "B,C,BC"'));

			const ABC1 = dcl(null, ABC, AC, Named('ABC1'));
			const ABC2 = dcl(null, AC, ABC, Named('ABC2'));

			eval(t.TEST('getNames(ABC1) === "A,B,C,ABC,AC,ABC1"'));
			eval(t.TEST('getNames(ABC2) === "A,B,C,AC,ABC,ABC2"'));

			const ABC3 = dcl(null, ABC, BC, Named('ABC3'));
			const ABC4 = dcl(null, BC, ABC, Named('ABC4'));

			eval(t.TEST('getNames(ABC3) === "A,B,C,ABC,BC,ABC3"'));
			eval(t.TEST('getNames(ABC4) === "A,B,C,BC,ABC,ABC4"'));
		},
		function test_superCall_int (t) {
			var a = new (dcl(null, Base => class extends Base {
				static get [dcl.directives] () {
					return {
						toString: {
							around: function (sup) {
								return function () {
									return 'PRE-' + sup.call(this) + '-POST';
								};
							}
						}
					};
				}
			}));
			eval(t.TEST('a.toString() === "PRE-[object Object]-POST"'));
		},
		function test_impossible (t) {
			const A = Named('A');
			const B = Named('B');

			const AB = dcl(null, A, B, Named('AB'));
			const BA = dcl(null, B, A, Named('BA'));

			let failed = false;
			try {
				const X = dcl(null, AB, BA, Named('X'));
			} catch (e) {
				failed = true;
			} finally {
				eval(t.TEST('failed'));
			}
		}
	]);

	return {};
});
