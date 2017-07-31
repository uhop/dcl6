'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (_, f) {
	window.dcl = f();
})([], function () {
	'use strict';

	var cname = 'constructor',
	    pname = 'prototype';

	var findCommonBase = function findCommonBase(bases) {
		var commonBase = bases[0];
		for (var i = 1; i < bases.length; ++i) {
			var base = bases[i];
			if (commonBase === base || Object[pname].isPrototypeOf.call(commonBase[pname], base[pname])) {
				// do nothing
			} else if (Object[pname].isPrototypeOf.call(base[pname], commonBase[pname])) {
				commonBase = base;
			} else {
				dcl._error('incompatible bases');
			}
		}
		return commonBase;
	};

	var c3mro = function c3mro(mixins) {
		// build a connectivity matrix
		var connectivity = new Map();
		mixins.forEach(function (mixins) {
			mixins.forEach(function (mixin, index) {
				if (connectivity.has(mixin)) {
					var value = connectivity.get(mixin);
					index + 1 != mixins.length && ++value.counter;
					index && value.links.push(mixins[index - 1]);
				} else {
					connectivity.set(mixin, {
						links: index ? [mixins[index - 1]] : [],
						counter: index + 1 == mixins.length ? 0 : 1
					});
				}
			});
		});

		// Kahn's algorithm
		var output = [],
		    unreferenced = [];
		// find unreferenced bases
		mixins.forEach(function (mixins) {
			var last = mixins[mixins.length - 1],
			    data = connectivity.get(last);
			if (!data.pushed && !data.counter) {
				unreferenced.push(last);
				data.pushed = true;
			}
		});
		while (unreferenced.length) {
			var mixin = unreferenced.pop();
			output.push(mixin);
			var value = connectivity.get(mixin);
			value.links.forEach(function (mixin) {
				var value = connectivity.get(mixin);
				! --value.counter && unreferenced.push(mixin);
			});
		}

		// final checks and return
		if (connectivity.size != output.length) {
			dcl._error('dependency cycle');
		}
		return output.reverse();
	};

	var dereferable = { object: 1, function: 1 };

	var getPath = function getPath(obj, path) {
		var delimiter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '_';

		if (typeof path == 'string') {
			path = path.split(delimiter);
		}
		for (var i = 0; i < path.length; ++i) {
			if (!obj || !dereferable[typeof obj === 'undefined' ? 'undefined' : _typeof(obj)]) return; // undefined
			obj = obj[path[i]];
		}
		return obj;
	};

	var collectSideAdvice = function collectSideAdvice(target, source, path) {
		var fn = getPath(source, path);
		if (fn) {
			if (typeof fn != 'function') {
				dcl._error(path + ' advice is not function');
			}
			if (target[path]) {
				target[path].push(fn);
			} else {
				target[path] = [fn];
			}
		}
	};

	var decorateAroundAdvices = function decorateAroundAdvices(ctr) {
		var ownDirectives = ctr.hasOwnProperty(dcl.directives) && ctr[dcl.directives] || Object[pname].hasOwnProperty.call(ctr[pname], dcl.directives) && ctr[pname][dcl.directives];
		ownDirectives && Object.keys(ownDirectives).forEach(function (name) {
			var advice = ownDirectives[name];
			if (advice.around || advice.get && advice.get.around || advice.set && advice.set.around) {
				var replace = void 0,
				    prop = getPropertyDescriptor(ctr[pname], name);
				if (prop) {
					// guided by existing descriptor
					if (prop.get || prop.set) {
						// accessor descriptor
						if (advice.get && advice.get.around) {
							prop.get = advice.get.around.call(advice, prop.get);
							replace = true;
						}
						if (advice.set && advice.set.around) {
							prop.set = advice.set.around.call(advice, prop.set);
							replace = true;
						}
					} else {
						// data descriptor
						if (advice.around) {
							prop.value = advice.around(prop.value);
							replace = true;
						}
					}
				} else {
					// guided by existing advices
					replace = true;
					if (advice.around) {
						// data descriptor
						prop = {
							value: advice.around(Object[pname][name] || null),
							configurable: true,
							writable: true
						};
					} else {
						// accessor descriptor
						prop = {
							get: advice.get && advice.get.around && advice.get.around.call(advice, null) || undefined,
							set: advice.set && advice.set.around && advice.set.around.call(advice, null) || undefined,
							configurable: true
						};
					}
				}
				replace && Object.defineProperty(ctr[pname], name, prop);
			}
		});
	};

	var iterateOverPrototypes = function iterateOverPrototypes(o, callback) {
		while (o && o !== Object[pname]) {
			if (callback(o)) break;
			o = Object.getPrototypeOf(o);
		}
	};

	var getPropertyDescriptor = function getPropertyDescriptor(o, name) {
		var prop = void 0;
		iterateOverPrototypes(o, function (proto) {
			prop = Object.getOwnPropertyDescriptor(proto, name);
			if (prop) {
				return true;
			}
		});
		return prop;
	};

	var collectPropertyDescriptors = function collectPropertyDescriptors(o) {
		var props = {};

		var collect = function collect(name) {
			if (!Object[pname].hasOwnProperty.call(props, name)) {
				props[name] = Object.getOwnPropertyDescriptor(o, name);
			}
		};

		iterateOverPrototypes(o, function (proto) {
			Object.getOwnPropertyNames(proto).forEach(collect);
			Object.getOwnPropertySymbols(proto).forEach(collect);
		});
		return props;
	};

	var nop = function nop() {};

	var collectValues = function collectValues(source, key) {
		var values = [];
		iterateOverPrototypes(source, function (proto) {
			var prop = Object.getOwnPropertyDescriptor(proto, key);
			if (prop) {
				if (prop.get || prop.set) {
					dcl._error('wrong value descriptor');
				}
				values.push(prop.value);
			}
		});
		return values;
	};

	var chain = function chain(fns) {
		return function () {
			for (var i = 0; i < fns.length; ++i) {
				fns[i].apply(this, arguments);
			}
		};
	};

	var hasSideAdvice = function hasSideAdvice(advice, prefix, suffix) {
		return advice[prefix + suffix] && advice[prefix + suffix].length;
	};
	var hasSideAdvices = function hasSideAdvices(advice) {
		var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
		return hasSideAdvice(advice, prefix, 'before') || hasSideAdvice(advice, prefix, 'after');
	};

	var makeValueStub = function makeValueStub(fn, advice) {
		if (!hasSideAdvices(advice) && !hasSideAdvices(advice, 'get_')) {
			return fn;
		}
		fn = fn || function () {};
		var stubValue = function stubValue() {
			var i = void 0,
			    fns = advice.get_before,
			    result = void 0,
			    thrown = false;
			var makeReturn = function makeReturn(value) {
				result = value;thrown = false;
			};
			var makeThrow = function makeThrow(value) {
				result = value;thrown = true;
			};
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this);
				}
			}
			fns = advice.before;
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].apply(this, arguments);
				}
			}
			try {
				result = fn.apply(this, arguments);
			} catch (e) {
				result = e;
				thrown = true;
			}
			fns = advice.after;
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, arguments, result, makeReturn, makeThrow);
				}
			}
			fns = advice.get_after;
			if (fns) {
				var args = [];
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, args, fn);
				}
			}
			if (thrown) {
				throw result;
			}
			return result;
		};
		stubValue[dcl.advice] = advice;
		advice.original = fn;
		return stubValue;
	};

	var makeGetStub = function makeGetStub(getter, advice) {
		if (!hasSideAdvices(advice, 'get_')) {
			return getter;
		}
		getter = getter || function () {};
		var stubGetter = function stubGetter() {
			var i = void 0,
			    fns = advice.get_before,
			    result = void 0,
			    thrown = false;
			var makeReturn = function makeReturn(value) {
				result = value;thrown = false;
			};
			var makeThrow = function makeThrow(value) {
				result = value;thrown = true;
			};
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this);
				}
			}
			try {
				result = getter.call(this);
			} catch (e) {
				result = e;
				thrown = true;
			}
			fns = advice.get_after;
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, arguments, result, makeReturn, makeThrow);
				}
			}
			if (thrown) {
				throw result;
			}
			return result;
		};
		stubGetter[dcl.advice] = advice;
		advice.original = getter;
		return stubGetter;
	};

	var makeSetStub = function makeSetStub(setter, advice) {
		if (!hasSideAdvices(advice, 'set_')) {
			return setter;
		}
		setter = setter || function () {};
		var stubSetter = function stubSetter(value) {
			var i = void 0,
			    fns = advice.set_before,
			    result = void 0,
			    thrown = false;
			var makeThrow = function makeThrow(value) {
				result = value;thrown = true;
			};
			// run setter advices
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, value);
				}
			}
			try {
				setter.call(this, value);
			} catch (e) {
				result = e;
				thrown = true;
			}
			fns = advice.set_after;
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, arguments, undefined, null, makeThrow);
				}
			}
			if (thrown) {
				throw result;
			}
		};
		var adviceCopy = advice.hasOwnProperty('original') ? Object.create(advice) : advice;
		stubSetter[dcl.advice] = adviceCopy;
		adviceCopy.original = setter;
		return stubSetter;
	};

	var makeCtrStub = function makeCtrStub(ctr, advice, layer) {
		dcl._checkCtrAdvices(advice);

		var layerCtr = advice ? function (_ctr) {
			_inherits(_class, _ctr);

			function _class() {
				var _ref;

				_classCallCheck(this, _class);

				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				var _this = _possibleConstructorReturn(this, (_ref = _class.__proto__ || Object.getPrototypeOf(_class)).call.apply(_ref, [this].concat(args)));

				var i = void 0,
				    fns = advice.after,
				    result = _this,
				    thrown = false;
				var makeThrow = function makeThrow(value) {
					result = value;thrown = true;
				};
				if (fns) {
					for (i = 0; i < fns.length; ++i) {
						fns[i].call(result, args, result, null, makeThrow);
					}
				}
				if (thrown) {
					throw result;
				}
				return _this;
			}

			return _class;
		}(ctr) : function (_ctr2) {
			_inherits(_class2, _ctr2);

			function _class2() {
				_classCallCheck(this, _class2);

				return _possibleConstructorReturn(this, (_class2.__proto__ || Object.getPrototypeOf(_class2)).apply(this, arguments));
			}

			return _class2;
		}(ctr);
		Object.defineProperties(layerCtr[pname], layer);
		// Object.defineProperty(layerCtr[pname], cname, {value: ctr, configurable: true});
		var prop = Object.getOwnPropertyDescriptor(ctr, 'name');
		prop && Object.defineProperty(layerCtr, 'name', prop);
		return layerCtr;
	};

	var flatten = function flatten(target, source) {
		source.forEach(function (value) {
			if (value instanceof Array) {
				flatten(target, value);
			} else {
				target.push(value);
			}
		});
		return target;
	};

	function dcl(base) {
		for (var _len2 = arguments.length, mixins = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
			mixins[_key2 - 1] = arguments[_key2];
		}

		// normalize parameters
		base = base || Object;
		mixins = flatten([], mixins);

		// collect mixins and bases
		var bases = [],
		    mixes = [],
		    meta = base[dcl.meta];
		if (meta) {
			bases.push(meta.base);
			meta.mixins.length && mixes.push(meta.mixins);
		} else {
			bases.push(base);
		}
		mixins.forEach(function (mixin) {
			var meta = mixin[dcl.meta];
			if (meta) {
				bases.push(meta.base);
				meta.mixins.length && mixes.push(meta.mixins);
			} else {
				mixes.push([mixin]);
			}
		});

		// calculate the common base, and necessary mixins (C3MRO)
		var originalBase = base;
		var commonBase = base = findCommonBase(bases),
		    commonMixins = mixins = c3mro(mixes);

		// see, if we can use our base directly
		if (meta && meta.base === commonBase && meta.mixins.length <= commonMixins.length) {
			var last = meta.mixins.length - 1;
			if (last >= 0 && meta.mixins[last] === commonMixins[last]) {
				commonBase = originalBase;
				commonMixins = commonMixins.slice(last + 1);
			}
		}

		// create a prototype and collect interrim constructors
		var ctr = commonBase[dcl.meta] && commonBase[dcl.meta].ctr || commonBase;
		commonMixins.forEach(function (mixin) {
			ctr = mixin(ctr);
			decorateAroundAdvices(ctr);
		});

		// prepare to collect advices
		var directives = {},
		    advices = {};
		var collectDirectives = function collectDirectives(ownDirectives, proto) {
			return function (name) {
				var advice = typeof ownDirectives[name] == 'string' ? { chainWith: ownDirectives[name] } : ownDirectives[name];
				if (typeof advice.chainWith == 'string') {
					if (name === cname) {
						dcl._error('no chaining rule for constructors: always "after"');
					}
					if (!Object[pname].hasOwnProperty.call(directives, name)) {
						directives[name] = advice.chainWith;
					} else if (directives[name] !== advice.chainWith) {
						dcl._error('conflicting chaining directives');
					}
				}
				if (!Object[pname].hasOwnProperty.call(advices, name)) {
					advices[name] = {};
				}
				var target = advices[name];
				dcl._sideAdvices.forEach(function (path) {
					return collectSideAdvice(target, advice, path);
				});
			};
		};

		// prepare to apply advices
		var layer = {};
		var createDirectives = function createDirectives(name) {
			if (name === cname) {
				return;
			} // ignore constructors
			var advice = advices[name];

			// normalize advice chains
			advice.get_before && advice.get_before.reverse();
			advice.set_before && advice.set_before.reverse();
			advice.before && advice.before.reverse();

			// process descriptor
			var newProp = void 0,
			    prop = getPropertyDescriptor(ctr[pname], name);
			if (prop) {
				// guided by descriptor
				var hasDirective = Object[pname].hasOwnProperty.call(directives, name);
				if (prop.get || prop.set) {
					// accessor descriptor
					if (hasDirective) {
						dcl._error('chaining cannot be applied to accessors');
					}
					newProp = {
						get: makeGetStub(prop.get, advice),
						set: makeSetStub(prop.set, advice),
						configurable: true,
						enumerable: prop.enumerable
					};
					if (newProp.get === prop.get && newProp.set === prop.set) {
						newProp = null;
					}
				} else {
					// data descriptor
					var value = prop.value;
					if (typeof value !== 'function') {
						dcl._error('wrong value');
					}
					if (hasDirective) {
						var weaver = dcl.weavers[directives[name]];
						if (!weaver) {
							dcl._error('there is no weaver: ' + directives[name]);
						}
						value = weaver(collectValues(ctr[pname], name));
					}
					newProp = {
						value: makeValueStub(value, advice),
						configurable: true,
						enumerable: prop.enumerable,
						writable: prop.writable
					};
					if (newProp.value === prop.value) {
						newProp = null;
					}
				}
			} else {
				// guided by advice
				// no descriptor
				if (hasSideAdvices(advice)) {
					// data descriptor
					newProp = {
						value: makeValueStub(null, advice),
						configurable: true,
						writable: true
					};
					if (!newProp.value) {
						newProp = null;
					}
				} else {
					// accessor descriptor
					newProp = {
						get: makeGetStub(null, advice),
						set: makeSetStub(null, advice),
						configurable: true
					};
					if (!newProp.get && !newProp.set) {
						newProp = null;
					}
				}
			}
			if (newProp) {
				layer[name] = newProp;
			}
		};

		// collect advices
		collectValues(ctr[pname], cname).reverse().forEach(function (mixin) {
			var ownDirectives = mixin.hasOwnProperty(dcl.directives) && mixin[dcl.directives] || Object[pname].hasOwnProperty.call(mixin[pname], dcl.directives) && mixin[pname][dcl.directives];
			if (ownDirectives) {
				var collect = collectDirectives(ownDirectives, mixin[pname]);
				Object.getOwnPropertyNames(ownDirectives).forEach(collect);
				Object.getOwnPropertySymbols(ownDirectives).forEach(collect);
			}
		});
		// apply advices
		Object.getOwnPropertyNames(advices).forEach(createDirectives);
		Object.getOwnPropertySymbols(advices).forEach(createDirectives);

		// finalize a constructor
		var name = ctr.hasOwnProperty(dcl.declaredClass) && ctr[dcl.declaredClass] || Object[pname].hasOwnProperty.call(ctr[pname], dcl.declaredClass) && ctr[pname][dcl.declaredClass];
		if (name && name !== 'Object') {
			Object.defineProperty(ctr, 'name', { value: name, configurable: true });
		}
		var advice = Object[pname].hasOwnProperty.call(advices, cname) && advices[cname];
		var layerCtr = makeCtrStub(ctr, advice, layer);
		ctr[dcl.meta] = { base: base, mixins: mixins, ctr: ctr, layerCtr: layerCtr };
		return dcl._makeCtr(layerCtr);
	}

	var isSubset = function isSubset(ctr, subset) {
		if (subset === ctr) {
			return true;
		}
		var m1 = ctr[dcl.meta],
		    m2 = subset[dcl.meta];
		if (m1) {
			if (m2) {
				if (m2.mixins.length > m1.mixins.length || m2.base !== m1.base && !Object[pname].isPrototypeOf.call(m2.base[pname], m1.base[pname])) {
					return false;
				}
				var i = 0,
				    j = 0;
				for (; i < m2.mixins.length && j < m1.mixins.length; ++j) {
					if (m2.mixins[i] === m1.mixins[j]) {
						++i;
					}
				}
				return i >= m2.mixins.length;
			}
			return subset === m1.base || Object[pname].isPrototypeOf.call(subset[pname], m1.base[pname]);
		}
		return !m2 && Object[pname].isPrototypeOf.call(subset[pname], ctr[pname]);
	};

	// symbols
	dcl.declaredClass = Symbol('dcl.name');
	dcl.directives = Symbol('dcl.directives');
	dcl.meta = Symbol('dcl.meta');
	dcl.advice = Symbol('dcl.advice');

	// weavers
	dcl.weavers = {
		chainBefore: function chainBefore(fns) {
			return chain(fns);
		},
		chainAfter: function chainAfter(fns) {
			return chain(fns.reverse());
		}
	};

	// utilities
	dcl.iterateOverPrototypes = iterateOverPrototypes;
	dcl.getPropertyDescriptor = getPropertyDescriptor;
	dcl.collectPropertyDescriptors = collectPropertyDescriptors;

	// introspection
	dcl.isSubset = isSubset;
	dcl.hasMixin = function (ctr, mixin) {
		return ctr[dcl.meta] && ctr[dcl.meta].mixins.some(function (m) {
			return m === mixin;
		});
	};

	// internals
	dcl._error = function (text) {
		throw new Error(text);
	};
	dcl._makeCtr = function (ctr) {
		return ctr;
	};
	dcl._checkCtrAdvices = function () {};

	dcl._sideAdvices = ['get_before', 'get_after', 'set_before', 'set_after', 'before', 'after'];

	return dcl;
});