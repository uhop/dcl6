/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';

	return {
		advice: (name, keyMaker) => ({
			around: keyMaker ?
				function (sup) {
					return function () {
						const key = keyMaker(this, arguments);
						let cache = this.__memoizerCache, dict;
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
				} :
				function (sup) {
					return function (first) {
						let cache = this.__memoizerCache, dict;
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
		}),
		guard: name => ({
			after: function () {
				const cache = this.__memoizerCache;
				if (cache && name) {
					delete cache[name];
				} else {
					this.__memoizerCache = {};
				}
			}
		})
	};
});
