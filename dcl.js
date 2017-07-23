/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function () {
	'use strict';


	const cname = 'constructor', pname = 'prototype';

	const findCommonBase = bases => {
		if (!bases.length) {
			return Object; // null?
		}
		let commonBase = bases[0];
		for (let i = 1; i < bases.length; ++i) {
			const base = bases[i];
			if (commonBase === base || base[pname].isPrototypeOf(commonBase[pname])) {
				// do nothing
			} else if (commonBase[pname].isPrototypeOf(base[pname])) {
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
			mixins.forEach(function (mixin, index) {
				if (connectivity.has(mixin)) {
					const value = connectivity.get(mixin);
					++value.counter;
					if (index) {
						value.links.push(mixins[index - 1]);
					}
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
			const last = mixins[mixins.length - 1];
			if (!connectivity.get(last).counter) {
				unreferenced.push(last);
			}
		});
		while (unreferenced.length) {
			const mixin = unreferenced.pop();
			output.push(mixin);
			const value = connectivity.get(mixin);
			value.links.forEach(mixin => {
				const value = connectivity.get(mixin);
				if (!--value.counter) {
					unreferenced.push(mixin);
				}
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

	const collectAroundAdvice = (target, source, path, proto, name) => {
		if (!target.hasOwnProperty(path)) {
			const fn = getPath(source, path);
			if (fn) {
				if (typeof fn != 'function') { dcl._error(path + ' advice is not function'); }
				target[path] = fn;
			} else {
				if (Object[pname].hasOwnProperty.call(proto, name)) {
					const prop = Object.getOwnPropertyDescriptor(proto, name);
					if (prop.get || prop.set) { // accessor
						if (path.charAt(3) === '.') {
							target[path] = null;
						}
					} else { // data
						target[path] = null;
					}
				}
			}
		}
	};

	const decorateAroundAdvices = ctr => {
		const ownDirectives = Object[pname].hasOwnProperty.call(ctr, dcl.directives) && ctr[dcl.directives] ||
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
							get: advice.get && advice.get.around ? advice.get.around.call(advice, null) : null,
							set: advice.set && advice.set.around ? advice.set.around.call(advice, null) : null,
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
			if (Object[pname].hasOwnProperty.call(proto, name)) {
				prop = Object.getOwnPropertyDescriptor(proto, name);
				return true;
			}
		});
		return prop;
	};

	function recordProp(props, o, recorded) {
		return function (name) {
			if (recorded[name] !== 1) {
				recorded[name] = 1;
				props[name] = Object.getOwnPropertyDescriptor(o, name);
			}
		};
	}

	const collectPropertyDescriptors = o => {
		const props = {};

		const collect = name => {
			if (!Object[pname].hasOwnProperty.call(props, name)) {
				props[name] = Object.getOwnPropertyDescriptor(proto, name);
			}
		};

		iterateOverPrototypes(o, proto => {
			Object.getOwnPropertyNames(proto).forEach(collect);
			Object.getOwnPropertySymbols(proto).forEach(collect);
		});
		return props;
	}

	const nop = () => {};

	const copyOwnDescriptors = (target, source) => {
		const copyOwnDescriptor = key => {
			if (!Object[pname].hasOwnProperty.call(target, key)) {
				Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
			}
		};
		Object.getOwnPropertyNames(source).forEach(copyOwnDescriptor);
		Object.getOwnPropertySymbols(source).forEach(copyOwnDescriptor);
	};

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
		const stub = function () {
			let i, fns = advice['get.before'], result = fn, thrown = false;
			// run getter advices
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this);
				}
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
			// run main advices
			fns = advice.before;
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].apply(this, arguments);
				}
			}
			try {
				result = result.apply(this, arguments);
			} catch (e) {
				result = e;
				thrown = true;
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
		return stub;
	};

	const makeGetStub = (getter, advice) => {
		if (!hasSideAdvices(advice, 'get.')) { return getter; }
		getter = getter || function () {};
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
		return stub;
	};

	const makeSetStub = (setter, advice) => {
		if (!hasSideAdvices(advice, 'set.')) { return setter; }
		setter = setter || function () {};
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
		return stub;
	};

	const makeCtrStub = (fn, advice) => {
		dcl._checkAdviceForCtr();
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

	const updateValue = (o, name, value) => {
		const prop = getPropertyDescriptor(o, name);
		prop.value = value;
		Object.defineProperty(o, name, prop);
	};

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
		if (meta) {
			if (meta.base === commonBase && meta.mixins.length <= commonMixins.length) {
				const last = meta.mixins.length - 1;
				if (last >= 0 && meta.mixins[last] === commonMixins[last]) {
					commonBase = originalBase;
					commonMixins = commonMixins.slice(last + 1);
				}
			}
		}

		// create a prototype and collect interrim constructors
		let ctr = updateDecorations(commonBase, 'original');
		commonMixins.forEach(mixin => {
			ctr = mixin(ctr);
			decorateAroundAdvices(ctr);
		});
		updateDecorations(commonBase, 'reverted');

		// collect directives & advices from the interrim constructors
		const directives = {}, advices = {};

		const collectDirectives = (ownDirectives, proto) => name => {
			const advice = typeof ownDirectives[name] == 'string' ? {chainWith: ownDirectives[name]} : ownDirectives[name];
			if (typeof advice.chainWith == 'string') {
				if (name === cname) { dcl._error('no chaining rule for constructors: always "after"'); }
				if (!directives.hasOwnProperty(name)) { directives[name] = advice.chainWith; }
				else if (directives[name] !== advice.chainWith) { dcl._error('conflicting chaining directives'); }
			}
			if (!advices.hasOwnProperty(name)) { advices[name] = {}; }
			const target = advices[name];
			['get.before', 'get.after', 'set.before', 'set.after', 'before', 'after'].
				forEach(path => collectSideAdvice(target, advice, path));
		};

		collectValues(ctr[pname], cname).reverse().forEach(mixin => {
			const ownDirectives = Object[pname].hasOwnProperty.call(mixin, dcl.directives) && mixin[dcl.directives] ||
				Object[pname].hasOwnProperty.call(mixin[pname], dcl.directives) && mixin[pname][dcl.directives];
			if (ownDirectives) {
				const collect = collectDirectives(ownDirectives, mixin[pname]);
				Object.getOwnPropertyNames(ownDirectives).forEach(collect);
				Object.getOwnPropertySymbols(ownDirectives).forEach(collect);
			}
		});

		const original = {}, reverted = {}, originalRemove = [];

		const createDirectives = name => {
			if (name === cname) { return; } // ignore constructors

			const advice = advices[name];

			// normalize advice chains
			advice['get.before'] && advice['get.before'].reverse();
			advice['set.before'] && advice['set.before'].reverse();
			advice.before && advice.before.reverse();

			// process descriptor
			let newProp, prop = Object.getOwnPropertyDescriptor(ctr[pname], name);
			if (!prop) {
				prop = getPropertyDescriptor(ctr[pname], name);
			}
			if (prop) {
				if (prop.get || prop.set) { // accessor descriptor
					if (directives.hasOwnProperty(name)) { dcl._error('chaining cannot be applied to accessors'); }
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
					if (directives.hasOwnProperty(name)) {
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
			} else {
				// no descriptor
				newProp = {
					value: makeValueStub(nop, advice),
					configurable: true,
					writable:     true
				};
				if (newProp.value === nop) { newProp = null; }
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
		Object.getOwnPropertyNames(advices).forEach(createDirectives);
		Object.getOwnPropertySymbols(advices).forEach(createDirectives);

		// finalize a constructor
		ctr[dcl.meta] = {original, originalRemove, reverted, mixins, base, ctr};
		const name = ctr.hasOwnProperty(dcl.declaredClass) && ctr[dcl.declaredClass] ||
			ctr[pname].hasOwnProperty(dcl.declaredClass) && ctr[pname][dcl.declaredClass] ||
			ctr.hasOwnProperty('name') && ctr.name;
		if (name && name !== 'Object') {
			updateValue(ctr, 'name', name);
		}
		if (Object[pname].hasOwnProperty.call(advices, cname)) {
			const prop = Object.getOwnPropertyDescriptor(ctr[pname], cname);
			original[cname] = prop;
			const advice = advices[cname];
			advice.before && advice.before.reverse();
			ctr = makeCtrStub(ctr, advice); // copyOwnDescriptors(stub, ctr);
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

	// internals
	dcl._error = text => { throw new Error(text); };
	dcl._makeCtr = ctr => ctr;
	dcl._checkAdviceForCtr = () => {};

	return dcl;
});
