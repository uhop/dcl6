'use strict';

// import dcl from '../../dcl';
const dcl = require('../../dcl');


const Destroyable = Base => class extends Base {
	static get [dcl.declaredClass]() { return 'Destroyable'; }
	static get [dcl.directives]() {
		return {
			// destroy: 'chainAfter'
			destroy: {
				chainWith: 'chainBefore',
				before: () => { console.log('destroy before: Destroyable'); },
				after:  () => { console.log('destroy after: Destroyable'); }
			},
			fake: {
				chainWith: 'chainAfter',
				before: () => { console.log('fake before: Destroyable'); },
				after:  () => { console.log('fake after: Destroyable'); }
			}
		};
	}

	destroy() { console.log('destroy: Destroyable'); }
	fake() { console.log('fake: Destroyable'); }
};


const A = dcl(null, Destroyable, Base => class extends Base {
	static get [dcl.declaredClass]() { return 'A'; }
	static get [dcl.directives]() {
		return {
			destroy: {
				chainWith: 'chainBefore',
				before: () => { console.log('destroy before: A'); },
				after:  () => { console.log('destroy after: A'); }
			},
			fake: {
				chainWith: 'chainAfter',
				before: () => { console.log('fake before: A'); },
				after:  () => { console.log('fake after: A'); }
			}
		};
	}

	destroy() { console.log('destroy: A'); }
	fake() { console.log('fake: A'); }
});

console.log(typeof A);
console.log(A);
console.log(A.name, A[dcl.declaredClass]);
console.log(Object.keys(A.prototype));
console.log(Object.getOwnPropertyNames(A.prototype));

const a = new A;
a.destroy();
a.fake();
