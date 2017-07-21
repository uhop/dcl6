'use strict';

// import dcl from './dcl';
const dcl = require('./dcl');


const M = Base => class extends Base {
	static get [dcl.declaredClass]() { return 'M'; }

	constructor() {
		super();
		this.__name = 'Mary';
	}

	method(x) {
		return x + this.name.length;
	}

	static get [dcl.directives]() {
		return {
			method: {
				before: (...args) => { console.log('B-MARY', args); },
				after:  (args, result) => { console.log('A-MARY', args, '=', result); }
			}
		};
	}
};

const fn1 = (...args) => { console.log('BEFORE', args); };
const fn2 = (args, result) => { console.log('AFTER', args, '=', result); };

const A = dcl(null, M, Base => class extends Base {
	static get [dcl.declaredClass]() { return 'A'; }

	constructor() {
		super();
		this.__name = 'Bob';
	}

	get name()  { return this.__name; }
	set name(n) { this.__name = n; }

	method(x) {
		return x + super.method(x);
	}

	static get [dcl.directives]() {
		return {
			method: {
				before: fn1,
				after:  fn2
			},
			name: {
				get: {
					before: fn1,
					after:  fn2
				},
				set: {
					before: fn1,
					after:  fn2
				}
			}
		};
	}
});

console.log(typeof A);
console.log(A);
console.log(A.name, A[dcl.declaredClass]);
console.log(Object.keys(A.prototype));
console.log(Object.getOwnPropertyNames(A.prototype));

const a = new A;
console.log(a);
console.log(a.name);
a.name = 'John';
console.log(a.name);
console.log(a.method(3));
