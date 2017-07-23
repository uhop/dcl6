/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['module', 'heya-unit', '../dcl', '../mixins/Cleanup'], function (module, unit, dcl, Cleanup) {
	'use strict';

	// tests

	unit.add(module, [
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
		}
	]);

	return {};
});
