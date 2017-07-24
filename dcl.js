/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';


	const cname = 'constructor', pname = 'prototype';

	const findCommonBase = bases => {
		let commonBase = bases[0];
		for (let i = 1; i < bases.length; ++i) {
			const base = bases[i];
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

	const c3mro = mixins => {
		// build a connectivity matrix
		const connectivity = new Map();
		mixins.forEach(mixins => {
			mixins.forEach((mixin, index) => {
				if (connectivity.has(mixin)) {
					const value = connectivity.get(mixin);
					index + 1 != mixins.length && ++value.counter;
					index && value.links.push(mixins[index - 1]);
				} else {
					connectivity.set(mixin, {
						links:   index ? [mixins[index - 1]] : [],
						counter: index + 1 == mixins.length ? 0 : 1
					});
				}
			});
		});

		// Kahn's algorithm
		const output = [], unreferenced = [];
		// find unreferenced bases
		mixins.forEach(mixins => {
			const last = mixins[mixins.length - 1], data = connectivity.get(last);
			if (!data.pushed && !data.counter) {
				unreferenced.push(last);
				data.pushed = true;
			}
		});
		while (unreferenced.length) {
			const mixin = unreferenced.pop();
			output.push(mixin);
			const value = connectivity.get(mixin);
			value.links.forEach(mixin => {
				const value = connectivity.get(mixin);
				!--value.counter && unreferenced.push(mixin);
			});
		}

		// final checks and return
		if (connectivity.size != output.length) { dcl._error('dependency cycle'); }
		return output.reverse();
	}

	const updateDecorations = (base, action) => {
		const meta = base[dcl.meta];
		if (meta) {
			const remove = meta[action + 'Remove'];
			remove && remove.forEach(name => delete base[pname][name])
			meta[action] && Object.defineProperties(base[pname], meta[action]);
			return meta.ctr;
		}
		return base;
	};

	const dereferable = {object: 1, function: 1};

	const getPath = (obj, path) => {
		if (typeof path == 'string') {
			path = path.split('.');
		}
		for (let i = 0; i < path.length; ++i) {
			if (!obj || dereferable[typeof obj] !== 1) return; // undefined
			obj = obj[path[i]];
		}
		return obj;
	};

	const collectSideAdvice = (target, source, path) => {
		const fn = getPath(source, path);
		if (fn) {
			if (typeof fn != 'function') { dcl._error(path + ' advice is not function'); }
			if (target[path]) {
				target[path].push(fn);
			} else {
				target[path] = [fn];
			}
		}
	};

	const decorateAroundAdvices = ctr => {
		const ownDirectives = ctr.hasOwnProperty(dcl.directives) && ctr[dcl.directives] ||
			Object[pname].hasOwnProperty.call(ctr[pname], dcl.directives) && ctr[pname][dcl.directives];
		ownDirectives && Object.keys(ownDirectives).forEach(name => {
			const advice = ownDirectives[name];
			if (advice.around || advice.get && advice.get.around || advice.set && advice.set.around) {
				let replace, prop = getPropertyDescriptor(ctr[pname], name);
				if (prop) { // guided by existing descriptor
					if (prop.get || prop.set) { // accessor descriptor
						if (advice.get && advice.get.around) {
							prop.get = advice.get.around.call(advice, prop.get);
							replace = true;
						}
						if (advice.set && advice.set.around) {
							prop.set = advice.set.around.call(advice, prop.set);
							replace = true;
						}
					} else { // data descriptor
						if (advice.around) {
							prop.value = advice.around(prop.value);
							replace = true;
						}
					}
				} else { // guided by existing advices
					replace = true;
					if (advice.around) { // data descriptor
						prop = {
							value: advice.around(Object[pname][name] || null),
							configurable: true,
							writable:     true
						};
					} else { // accessor descriptor
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

	const iterateOverPrototypes = (o, callback) => {
		while (o && o !== Object[pname]) {
			if (callback(o)) break;
			o = Object.getPrototypeOf(o);
		}
	};

	const getPropertyDescriptor = (o, name) => {
		let prop;
		iterateOverPrototypes(o, proto => {
			prop = Object.getOwnPropertyDescriptor(proto, name);
			if (prop) { return true; }
		});
		return prop;
	};

	const collectPropertyDescriptors = o => {
		const props = {};

		const collect = name => {
			if (!Object[pname].hasOwnProperty.call(props, name)) {
				props[name] = Object.getOwnPropertyDescriptor(o, name);
			}
		};

		iterateOverPrototypes(o, proto => {
			Object.getOwnPropertyNames(proto).forEach(collect);
			Object.getOwnPropertySymbols(proto).forEach(collect);
		});
		return props;
	}

	const nop = () => {};

	const collectValues = (source, key) => {
		const values = [];
		iterateOverPrototypes(source, proto => {
			const prop = Object.getOwnPropertyDescriptor(proto, key);
			if (prop) {
				if (prop.get || prop.set) { dcl._error('wrong value descriptor'); }
				values.push(prop.value);
			}
		});
		return values;
	};

	const chain = fns => {
		return function () {
			for (let i = 0; i < fns.length; ++i) {
				fns[i].apply(this, arguments);
			}
		};
	};

	const hasSideAdvice = (advice, prefix, suffix) => advice[prefix + suffix] && advice[prefix + suffix].length;
	const hasSideAdvices = (advice, prefix='') => hasSideAdvice(advice, prefix, 'before') || hasSideAdvice(advice, prefix, 'after');

	const makeValueStub = (fn, advice) => {
		if (!hasSideAdvices(advice) && !hasSideAdvices(advice, 'get.')) { return fn; }
		fn = fn || (() => {});
		const stub = function () {
			let i, fns = advice['get.before'], result, thrown = false;
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
			fns = advice['get.after'];
			if (fns) {
				const args = [];
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, args, fn);
				}
			}
			fns = advice.after;
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, arguments, result);
				}
			}
			if (thrown) {
				throw result;
			}
			return result;
		};
		stub[dcl.advice] = advice;
		advice.value = fn;
		return stub;
	};

	const makeGetStub = (getter, advice) => {
		if (!hasSideAdvices(advice, 'get.')) { return getter; }
		getter = getter || (() => {});
		const stub = function () {
			let i, fns = advice['get.before'], result, thrown = false;
			// run getter advices
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
			fns = advice['get.after'];
			if (fns) {
				const args = [];
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, args, result);
				}
			}
			if (thrown) {
				throw result;
			}
			return result;
		};
		stub[dcl.advice] = advice;
		advice.getter = getter;
		return stub;
	};

	const makeSetStub = (setter, advice) => {
		if (!hasSideAdvices(advice, 'set.')) { return setter; }
		setter = setter || (() => {});
		const stub = function (value) {
			let i, fns = advice['set.before'], result, thrown = false;
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
			fns = advice['set.after'];
			if (fns) {
				const args = [value];
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, args);
				}
			}
			if (thrown) {
				throw result;
			}
		};
		stub[dcl.advice] = advice;
		advice.setter = setter;
		return stub;
	};

	const makeCtrStub = (fn, advice) => {
		dcl._checkCtrAdvices();
		return new Proxy(fn, {construct: function (target, args) {
			let i, fns = advice.before, result, thrown = false;
			// run main advices
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].apply(null, args);
				}
			}
			try {
				result = new fn(...args);
			} catch (e) {
				result = e;
				thrown = true;
			}
			fns = advice.after;
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(result, args, result);
				}
			}
			if (thrown) {
				throw result;
			}
			return result;
		}});
	};

	function guardedRun (runner, finalizer) {
		try {
			runner();
		} finally {
			finalizer();
		}
	}

	function dcl(base, ...mixins) {
		// normalize parameters
		base = base || Object;

		// collect mixins and bases
		const bases = [], mixes = [], meta = base[dcl.meta];
		if (meta) {
			bases.push(meta.base);
			meta.mixins.length && mixes.push(meta.mixins);
		} else {
			bases.push(base);
		}
		mixins.forEach(mixin => {
			const meta = mixin[dcl.meta];
			if (meta) {
				bases.push(meta.base);
				meta.mixins.length && mixes.push(meta.mixins);
			} else {
				mixes.push([mixin]);
			}
		});

		// calculate the common base, and necessary mixins (C3MRO)
		const originalBase = base;
		let commonBase = base = findCommonBase(bases), commonMixins = mixins = c3mro(mixes);

		// see, if we can use our base directly
		if (meta && meta.base === commonBase && meta.mixins.length <= commonMixins.length) {
			const last = meta.mixins.length - 1;
			if (last >= 0 && meta.mixins[last] === commonMixins[last]) {
				commonBase = originalBase;
				commonMixins = commonMixins.slice(last + 1);
			}
		}

		// create a prototype and collect interrim constructors
		let ctr = updateDecorations(commonBase, 'original');
		commonMixins.forEach(mixin => {
			ctr = mixin(ctr);
			decorateAroundAdvices(ctr);
		});

		// prepare to collect advices
		const directives = {}, advices = {};
		const collectDirectives = (ownDirectives, proto) => name => {
			const advice = typeof ownDirectives[name] == 'string' ? {chainWith: ownDirectives[name]} : ownDirectives[name];
			if (typeof advice.chainWith == 'string') {
				if (name === cname) { dcl._error('no chaining rule for constructors: always "after"'); }
				if (!Object[pname].hasOwnProperty.call(directives, name)) { directives[name] = advice.chainWith; }
				else if (directives[name] !== advice.chainWith) { dcl._error('conflicting chaining directives'); }
			}
			if (!Object[pname].hasOwnProperty.call(advices, name)) { advices[name] = {}; }
			const target = advices[name];
			['get.before', 'get.after', 'set.before', 'set.after', 'before', 'after'].
				forEach(path => collectSideAdvice(target, advice, path));
		};

		// prepare to apply advices
		const original = {}, reverted = {}, originalRemove = [];
		const createDirectives = name => {
			if (name === cname) { return; } // ignore constructors
			const advice = advices[name];

			// normalize advice chains
			advice['get.before'] && advice['get.before'].reverse();
			advice['set.before'] && advice['set.before'].reverse();
			advice.before && advice.before.reverse();

			// process descriptor
			let newProp, prop = getPropertyDescriptor(ctr[pname], name);
			if (prop) { // guided by descriptor
				const hasDirective = Object[pname].hasOwnProperty.call(directives, name);
				if (prop.get || prop.set) { // accessor descriptor
					if (hasDirective) { dcl._error('chaining cannot be applied to accessors'); }
					newProp = {
						get: makeGetStub(prop.get, advice),
						set: makeSetStub(prop.set, advice),
						configurable: true,
						enumerable:   prop.enumerable
					};
					if (newProp.get === prop.get && newProp.set === prop.set) { newProp = null; }
				} else { // data descriptor
					let value = prop.value;
					if (typeof value !== 'function') { dcl._error('wrong value'); }
					if (hasDirective) {
						const weaver = dcl.weavers[directives[name]];
						if (!weaver) { dcl._error('there is no weaver: ' + directives[name]); }
						value = weaver(collectValues(ctr[pname], name));
					}
					newProp = {
						value: makeValueStub(value, advice),
						configurable: true,
						enumerable:   prop.enumerable,
						writable:     prop.writable
					};
					if (newProp.value === prop.value) { newProp = null; }
				}
			} else { // guided by advice
				// no descriptor
				if (hasSideAdvices(advice)) { // data descriptor
					newProp = {
						value: makeValueStub(null, advice),
						configurable: true,
						writable:     true
					};
					if (!newProp.value) { newProp = null; }
				} else { // accessor descriptor
					newProp = {
						get: makeGetStub(null, advice),
						set: makeSetStub(null, advice),
						configurable: true
					};
					if (!newProp.get && !newProp.set) { newProp = null; }
				}
			}
			if (newProp) {
				if (prop && Object[pname].hasOwnProperty.call(ctr[pname], name)) {
					original[name] = prop;
				} else {
					originalRemove.push(name);
				}
				reverted[name] = newProp;
			}
		};

		// apply directives & advices
		guardedRun(() => {
			// collect advices
			collectValues(ctr[pname], cname).reverse().forEach(mixin => {
				const ownDirectives = mixin.hasOwnProperty(dcl.directives) && mixin[dcl.directives] ||
					Object[pname].hasOwnProperty.call(mixin[pname], dcl.directives) && mixin[pname][dcl.directives];
				if (ownDirectives) {
					const collect = collectDirectives(ownDirectives, mixin[pname]);
					Object.getOwnPropertyNames(ownDirectives).forEach(collect);
					Object.getOwnPropertySymbols(ownDirectives).forEach(collect);
				}
			});
			// apply advices
			Object.getOwnPropertyNames(advices).forEach(createDirectives);
			Object.getOwnPropertySymbols(advices).forEach(createDirectives);
		}, () => {
			updateDecorations(commonBase, 'reverted');
		});

		// finalize a constructor
		ctr[dcl.meta] = {original, originalRemove, reverted, mixins, base, ctr};
		const name = ctr.hasOwnProperty(dcl.declaredClass) && ctr[dcl.declaredClass] ||
			Object[pname].hasOwnProperty.call(ctr[pname], dcl.declaredClass) && ctr[pname][dcl.declaredClass] ||
			ctr.hasOwnProperty('name') && ctr.name;
		if (name && name !== 'Object') {
			const prop = getPropertyDescriptor(ctr, 'name');
			prop.value = name;
			Object.defineProperty(ctr, 'name', prop);

		}
		if (Object[pname].hasOwnProperty.call(advices, cname)) {
			const prop = Object.getOwnPropertyDescriptor(ctr[pname], cname);
			original[cname] = prop;
			const advice = advices[cname];
			advice.before && advice.before.reverse();
			ctr = makeCtrStub(ctr, advice);
			reverted[cname] = {
				value:        ctr,
				configurable: true,
				enumerable:   prop.enumerable,
				writable:     prop.writable
			};
		}
		Object.defineProperties(ctr[pname], reverted);
		return dcl._makeCtr(ctr);
	}

	const isSubset = (ctr, subset) => {
		if (subset === ctr) { return true; }
		const m1 = ctr[dcl.meta], m2 = subset[dcl.meta];
		if (m1) {
			if (m2) {
				if (m2.mixins.length > m1.mixins.length || m2.base !== m1.base && !Object[pname].isPrototypeOf.call(m2.base[pname], m1.base[pname])) { return false; }
				let i = 0, j = 0;
				for (; i < m2.mixins.length && j < m1.mixins.length; ++j) {
					if (m2.mixins[i] === m1.mixins[j]) { ++i; }
				}
				return i >= m2.mixins.length;
			}
			return subset === m1.base || Object[pname].isPrototypeOf.call(subset[pname], m1.base[pname]);
		}
		return !m2 && Object[pname].isPrototypeOf.call(subset[pname], ctr[pname]);
	};

	// symbols
	dcl.declaredClass = Symbol('name');
	dcl.directives = Symbol('directives');
	dcl.meta = Symbol('meta');
	dcl.advice = Symbol('advice');

	// weavers
	dcl.weavers = {
		chainBefore: fns => chain(fns),
		chainAfter:  fns => chain(fns.reverse())
	};

	// utilities
	dcl.iterateOverPrototypes = iterateOverPrototypes;
	dcl.getPropertyDescriptor = getPropertyDescriptor;
	dcl.collectPropertyDescriptors = collectPropertyDescriptors;
	dcl.isSubset = isSubset;
	dcl.hasMixin = (ctr, mixin) => ctr[dcl.meta] && ctr[dcl.meta].mixins.some(m => m === mixin);

	// internals
	dcl._error = text => { throw new Error(text); };
	dcl._makeCtr = ctr => ctr;
	dcl._checkCtrAdvices = () => {};

	return dcl;
});
