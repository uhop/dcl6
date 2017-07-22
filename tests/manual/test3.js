'use strict';

// import dcl from '../../dcl';
const dcl = require('../../dcl');

const SuperArray = dcl(Array, Base => class extends Base {
	static get [dcl.declaredClass]() { return 'SuperArray'; }
	top() { return this[this.length - 1]; }
	pop() { console.log('*pop*'); return super.pop(); }
});

console.log(SuperArray.name);

const a = new SuperArray(1, 2, 3);
console.log(a);
console.log(a instanceof Array);
console.log(Array.isArray(a));
console.log(a.length);
console.log(a.pop());
console.log(a.length);
console.log(a.top());
