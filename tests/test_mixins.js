/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl', '../mixins/Mixer', '../mixins/Replacer', '../mixins/Cleanup', '../mixins/Named'],
function (module, unit, dcl, Mixer, Replacer, Cleanup, Named) {
	'use strict';

	// tests

	unit.add(module, [
		function test_Mixer (t) {
			const f = function () {};

			const A = dcl(null, Mixer, Base => class extends Base {
				static get [dcl.declaredClass] () { return 'A'; }
				get a () { return 1; }
				get b () { return 'two'; }
				get c () { return null; }
				get d () { return f; }
			});

			const x = new A({
				a: 5,
				b: false,
				f: f
			});

			eval(t.TEST('x.a === 5'));
			eval(t.TEST('x.b === false'));
			eval(t.TEST('x.c === null'));
			eval(t.TEST('x.d === f'));
			eval(t.TEST('x.f === f'));
		},
		function test_Replacer (t) {
			const f = function () {};

			const A = dcl(null, Replacer, Base => class extends Base {
				static get [dcl.declaredClass] () { return 'A'; }
				get a () { return 1; }
				get b () { return 'two'; }
				get c () { return null; }
				get d () { return f; }
			});

			const x = new A({
				a: 5,
				b: false,
				f: f
			});

			eval(t.TEST('x.a === 5'));
			eval(t.TEST('x.b === false'));
			eval(t.TEST('x.c === null'));
			eval(t.TEST('x.d === f'));
			eval(t.TEST('!("f" in x)'));
		},
		function test_Replacer_with_mixins (t) {
			const A = dcl(null, Replacer, Base => class extends Base {
				get a () { return 0; }
			});

			const B = dcl(null, Replacer, Base => class extends Base {
				get b () { return 0; }
			});

			const C = dcl(A, B);

			const x = new C({a: 1, b: 2, c: 3});

			eval(t.TEST('x.a === 1'));
			eval(t.TEST('x.b === 2'));
			eval(t.TEST('!("c" in x)'));
		},
		function test_Cleanup (t) {
			const msgs = [];

			const A = dcl(null, Base => class extends Base {
				constructor (n) {
					super();
					this.n = n;
					msgs.push(this.n);
				}
				destroy () {
					msgs.push(-this.n);
				}
			});

			const cleanup = n => { msgs.push(-n); };

			const B = dcl(Cleanup, Base => class extends Base {
				constructor () {
					super();
					const f1 = this.pushCleanup(new A(1));
					this.f2 = this.pushCleanup(2, cleanup);
					this.pushCleanup(new A(3));
					this.pushCleanup(new A(4));
					this.removeCleanup(f1);
					f1();
					this.popCleanup();
				}
				remove2 () {
					if (this.removeCleanup(this.f2)) {
						this.f2();
						this.f2 = null;
					}
				}
				destroy () {
					msgs.push(-99);
				}
			});

			const b = new B();
			eval(t.TEST('msgs.join(",") == "1,3,4,-1,-4"'));

			b.remove2();
			eval(t.TEST('msgs.join(",") == "1,3,4,-1,-4,-2"'));

			b.remove2();
			eval(t.TEST('msgs.join(",") == "1,3,4,-1,-4,-2"'));

			b.destroy();
			eval(t.TEST('msgs.join(",") == "1,3,4,-1,-4,-2,-99,-3"'));
		},
		function test_Named (t) {
			const A = dcl(null, Named('X'));
			eval(t.TEST('A.name === "X"'));

			const B = dcl(null, Named('X'), Named('Y'));
			eval(t.TEST('B.name === "Y"'));
		}
	]);

	return {};
});
