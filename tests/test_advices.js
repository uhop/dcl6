/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl', '../advise', '../advices/counter', '../advices/flow',
	'../advices/time', '../advices/memoize', '../advices/trace'],
function (module, unit, dcl, advise, counter, flow, time, memoize, trace) {
	'use strict';

	const Ackermann = dcl(null, Base => class extends Base {
		static get [dcl.declaredClass] () { return 'Ackermann'; }
		m0 (n) {
			return n + 1;
		}
		n0 (m) {
			return this.a(m - 1, 1);
		}
		a (m, n) {
			if (m == 0) {
				return this.m0(n);
			}
			if (n == 0) {
				return this.n0(m);
			}
			return this.a(m - 1, this.a(m, n - 1));
		}
	});

	// tests

	unit.add(module, [
		function test_counter(t){
			const x = new Ackermann();

			const counterM0 = counter();
			advise(x, 'm0', counterM0.advice());

			const counterN0 = counter();
			advise(x, 'n0', counterN0.advice());

			const counterA = counter();
			advise(x, 'a', counterA.advice());

			x.a(3, 2);

			eval(t.TEST("counterM0.calls  === 258"));
			eval(t.TEST("counterM0.errors === 0"));
			eval(t.TEST("counterN0.calls  === 26"));
			eval(t.TEST("counterN0.errors === 0"));
			eval(t.TEST("counterA .calls  === 541"));
			eval(t.TEST("counterA .errors === 0"));
		},
		{
			test: function test_flow(t){
				// our advised version:
				const AdvisedAckermann = dcl(Ackermann, Base => class extends Base {
						static get [dcl.declaredName] () { return 'AdvisedAckermann'; }
						static get [dcl.directives] () {
							return {
								m0: flow.advice('m0'),
								n0: flow.advice('n0'),
								a:  flow.advice('a')
							};
						}
					});

				// our instrumented version:
				const InstrumentedAckermann = dcl(AdvisedAckermann, Base => class extends Base {
						static get [dcl.declaredClass] () { return 'InstrumentedAckermann'; }
						static get [dcl.directives] () {
							return {
								m0: {
									around: function (sup) {
										return function (n) {
											t.info('a() called: ' + (flow.inFlowOf('a') || 0));
											t.info('n0() called: ' + (flow.inFlowOf('n0') || 0));
											const stack = flow.getStack();
											const previous = stack[stack.length - 2] || '(none)';
											t.info('m0() called from: ' + previous);
											return sup.call(this, n);
										};
									}
								}
							};
						}
					});

				const x = new InstrumentedAckermann;
				x.a(1, 1);
			},
			logs: [
				{text: 'a() called: 3'},
				{text: 'n0() called: 1'},
				{text: 'm0() called from: a'},
				{text: 'a() called: 2'},
				{text: 'n0() called: 0'},
				{text: 'm0() called from: a'}
			]
		},
		function test_memoize(t){
			// TODO: redirect console to ice

			if(console.time && console.timeEnd){
				const x = new Ackermann();

				advise(x, 'a', time('x.a'));

				x.a(3, 3);
				x.a(3, 3);

				const y = new Ackermann();

				advise(y, 'm0', memoize.advice('m0'));
				advise(y, 'n0', memoize.advice('n0'));
				advise(y, 'a',  memoize.advice('a', function (self, args) {
					return args[0] + '-' + args[1];
				}));

				advise(y, 'a', time('y.a'));

				y.a(3, 3);
				y.a(3, 3);
			}
		},
		function test_trace(t){
			// TODO: redirect console to ice

			// our instance:
			const x = new Ackermann();

			advise(x, 'm0', trace('m0', true));
			advise(x, 'n0', trace('n0', true));
			advise(x, 'a',  trace('a',  true));

			x.a(1, 1);
		}
	]);

	return {};
});
