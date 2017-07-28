'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (_, f) {
	return f();
}([], function () {
	'use strict';

	var _this = this,
	    _arguments = arguments;

	var lvl = 0;

	var rep = function rep(ch, n) {
		if (n < 1) {
			return '';
		}
		if (n == 1) {
			return ch;
		}
		var h = rep(ch, Math.floor(n / 2));
		return h + h + (n & 1 ? ch : '');
	};

	var pad = function pad(value, width) {
		var ch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ' ';

		var v = value.toString();
		return v + rep(ch, width - v.length);
	};

	return function (name, level) {
		return {
			before: function before() {
				++lvl;
				console.log((level ? pad(lvl, 2 * lvl) : '') + _this + ' => ' + name + '(' + Array.prototype.join.call(_arguments, ', ') + ')');
			},
			after: function after(args, result) {
				console.log((level ? pad(lvl, 2 * lvl) : '') + _this + ' => ' + name + (result && result instanceof Error ? ' throws' : ' returns') + ' ' + result);
				--lvl;
			}
		};
	};
});