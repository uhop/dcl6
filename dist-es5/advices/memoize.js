'use strict';

(function (_, f, g) {
	g = window;g = g.dcl || (g.dcl = {});g = g.advices || (g.advices = {});g.memoize = f();
})([], function () {
	'use strict';

	return {
		advice: function advice(name, keyMaker) {
			return {
				around: keyMaker ? function (sup) {
					return function () {
						var key = keyMaker(this, arguments);
						var cache = this.__memoizerCache,
						    dict = void 0;
						if (!cache) {
							cache = this.__memoizerCache = {};
						}
						if (Object.prototype.hasOwnProperty.call(cache, name)) {
							dict = cache[name];
						} else {
							dict = cache[name] = {};
						}
						if (Object.prototype.hasOwnProperty.call(dict, key)) {
							return dict[key];
						}
						return dict[key] = sup ? sup.apply(this, arguments) : undefined;
					};
				} : function (sup) {
					return function (first) {
						var cache = this.__memoizerCache,
						    dict = void 0;
						if (!cache) {
							cache = this.__memoizerCache = {};
						}
						if (Object.prototype.hasOwnProperty.call(cache, name)) {
							dict = cache[name];
						} else {
							dict = cache[name] = {};
						}
						if (Object.prototype.hasOwnProperty.call(dict, first)) {
							return dict[first];
						}
						return dict[first] = sup ? sup.apply(this, arguments) : undefined;
					};
				}
			};
		},
		guard: function guard(name) {
			return {
				after: function after() {
					var cache = this.__memoizerCache;
					if (cache && name) {
						delete cache[name];
					} else {
						this.__memoizerCache = {};
					}
				}
			};
		}
	};
});