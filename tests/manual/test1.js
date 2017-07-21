'use strict';

// import dcl from './dcl';
const dcl = require('./dcl');


const PostConstructed = Base => class extends Base {
	static get [dcl.declaredClass]() { return 'PostConstructed'; }
	static get [dcl.directives]() {
		return {
			constructor: {
				after: args => { console.log('post construction:', args); }
			}
		};
	}

	constructor() {
		super();
		console.log('ctr: PostConstructed');
	}
};


const A = dcl(null, PostConstructed, Base => class extends Base {
	static get [dcl.declaredClass]() { return 'A'; }

	constructor() {
		super();
		console.log('ctr: A');
	}
});

console.log(typeof A);
console.log(A);
console.log(A.name, A[dcl.declaredClass]);
console.log(Object.keys(A.prototype));
console.log(Object.getOwnPropertyNames(A.prototype));

const a = new A;
