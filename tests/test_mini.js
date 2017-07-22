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
		function test_si (t) {
			const A = dcl(null, Named('A'));
			const B = dcl(A, Named('B'));
			const C = dcl(B, Named('C'));

			eval(t.TEST('getNames(A) === "A"'));
			eval(t.TEST('getNames(B) === "A,B"'));
			eval(t.TEST('getNames(C) === "A,B,C"'));
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
