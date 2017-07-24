/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl'], function (module, unit, dcl) {
	'use strict';

	// tests

	unit.add(module, [
		{
			test: function test_simple (t) {
				function A (x) { t.info('A: ' + x); }
				A.prototype = {
					m: function (x) { t.info('A.m: ' + x); }
				};

				const a = new A(1);
				a.m(2);

				const B = dcl(A, Base => class extends Base {
						constructor (x) {
							super(x);
							t.info('B: ' + x);
						}
						m (x) {
							t.info('B.m: ' + x);
						}
					});

				const b = new B(3);
				b.m(4);
			},
			logs: [
				{text: 'A: 1'},
				{text: 'A.m: 2'},
				{text: 'A: 3'},
				{text: 'B: 3'},
				{text: 'B.m: 4'}
			]
		},
		{
			test: function test_superCall (t) {
				function A (x) { t.info('A: ' + x); }
				A.prototype = {
					m: function (x) { t.info('A.m: ' + x); }
				};

				const a = new A(1);
				a.m(2);

				const B = dcl(A, Base => class extends Base {
						constructor (x) {
							super(x);
							t.info('B: ' + x);
						}
						static get [dcl.directives] () {
							return {
								m: {
									around: function (sup) {
										return function (x) {
											t.info('B.m before: ' + x);
											sup.apply(this, arguments);
											t.info('B.m middle: ' + x);
											sup.call(this, x + 1);
											t.info('B.m after: ' + x);
										};
									}
								}
							};
						}
					});

				const b = new B(3);
				b.m(4);
			},
			logs: [
				{text: 'A: 1'},
				{text: 'A.m: 2'},
				{text: 'A: 3'},
				{text: 'B: 3'},
				{text: 'B.m before: 4'},
				{text: 'A.m: 4'},
				{text: 'B.m middle: 4'},
				{text: 'A.m: 5'},
				{text: 'B.m after: 4'}
			]
		},
		function test_superCall_int(t){
			function A (x) {}
			A.prototype = {
				toString: function (x) { return '[object A]'; }
			};

			const b = new (dcl(A, Base => class extends Base {
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
			eval(t.TEST('b.toString() === "PRE-[object A]-POST"'));
		}
	]);

	return {};
});
