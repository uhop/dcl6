(function(_,f,g){g=window;g=g.dcl||(g.dcl={});g=g.advices||(g.advices={});g.trace=f();})
([], function () {
	'use strict';

	let lvl = 0;

	const rep = (ch, n) => {
		if (n <  1) { return ''; }
		if (n == 1) { return ch; }
		const h = rep(ch, Math.floor(n / 2));
		return h + h + ((n & 1) ? ch : '');
	}

	const pad = (value, width, ch=' ') => {
		const v = value.toString();
		return v + rep(ch, width - v.length);
	}

	return (name, level) => {
		return {
			before: () => {
				++lvl;
				console.log((level ? pad(lvl, 2 * lvl) : '') + this + ' => ' +
					name + '(' + Array.prototype.join.call(arguments, ', ') + ')');
			},
			after: (args, result) => {
				console.log((level ? pad(lvl, 2 * lvl) : '') + this + ' => ' +
					name + (result && result instanceof Error ? ' throws' : ' returns') +
					' ' + result);
				--lvl;
			}
		};
	};
});
