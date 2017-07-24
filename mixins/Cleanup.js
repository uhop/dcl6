/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(['../dcl', './Destroyable'], function (dcl, Destroyable) {
	'use strict';

	return dcl(null, Destroyable, Base => class extends Base {
		static get [dcl.declaredClass] () { return 'dcl/mixins/Cleanup'; }
		constructor (...args) {
			super(...args);
			this.__cleanupStack = [];
		}
		pushCleanup (resource, cleanup) {
			const f = cleanup ? function () { cleanup(resource); } : function () { resource.destroy(); };
			this.__cleanupStack.push(f);
			return f;
		}
		popCleanup (dontRun) {
			if (dontRun) {
				return this.__cleanupStack.pop();
			}
			this.__cleanupStack.pop()();
		}
		removeCleanup (f) {
			for (let i = this.__cleanupStack.length - 1; i >= 0; --i) {
				if (this.__cleanupStack[i] === f) {
					this.__cleanupStack.splice(i, 1);
					return true;
				}
			}
		}
		cleanup () {
			while (this.__cleanupStack.length) {
				this.__cleanupStack.pop()();
			}
		}
		destroy () {
			this.cleanup();
		}
	});
});
