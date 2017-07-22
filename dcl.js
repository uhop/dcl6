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
				throw new Error('incompatible bases');
				// dcl._error('incompatible bases');
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
		if (connectivity.size != output.length) {
			throw new Error('dependency cycle');
			// dcl._error('cycle', bases);
		}
		return output.reverse();
	}

	const updateDecorations = (base, action) => {
		const meta = base[dcl.meta];
		if (meta) {
			const remove = meta[action + 'Remove'];
			remove && remove.forEach(name => delete base[pname][name])
			meta[action] && Object.defineProperties(base[pname], meta[action]);
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

	const collectAdvice = (target, source, path) => {
		const fn = getPath(source, path);
		if (fn) {
			if (typeof fn != 'function') {
				throw new Error(path + ' advice is not function');
			}
			if (target[path]) {
				target[path].push(fn);
			} else {
				target[path] = [fn];
			}
		}
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
			const prop = Object.getOwnPropertyDescriptor(source, key);
			Object.defineProperty(target, key, prop);
		};
		Object.getOwnPropertyNames(source).forEach(copyOwnDescriptor);
		Object.getOwnPropertySymbols(source).forEach(copyOwnDescriptor);
	};

	const collectValues = (source, key) => {
		const values = [];
		iterateOverPrototypes(source, proto => {
			const prop = Object.getOwnPropertyDescriptor(proto, key);
			if (prop) {
				if (prop.get || prop.set) {
					throw new Error('wrong value descriptor');
				}
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

	const makeValueStubWithGetters = (fn, advice) => {
		return function () {
			let i, fns = advice['get.before'], result = fn, thrown = false;
			// run getter advices
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].apply(this, arguments);
				}
			}
			fns = advice['get.after'];
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, arguments, result);
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
	};

	const makeValueStubDefault = (fn, advice) => {
		return function () {
			let i, fns = advice.before, result, thrown = false;
			// run main advices
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
					fns[i].call(this, arguments, result);
				}
			}
			if (thrown) {
				throw result;
			}
			return result;
		};
	};

	const makeValueStub = (fn, advice) => {
		const stub = (advice['get.before'] || advice['get.after'] ? makeValueStubWithGetters : makeValueStubDefault)(fn, advice);
		stub[dcl.advice] = advice;
		return stub;
	};

	const haveAdvices = (advice, prefix, suffix) => advice[prefix + suffix] && advice[prefix + suffix].length;
	const haveAnyAdvices = (advice, prefix) => haveAdvices(advice, prefix, 'before') ||
		haveAdvices(advice, prefix, 'after') || haveAdvices(advice, prefix, 'around');

	const makeGetStub = (fn, advice) => {
		if (!fn) {
			if (!haveAnyAdvices(advice, 'get.')) { return fn; }
			fn = function () {};
		}
		const stub = function () {
			let i, fns = advice['get.before'], result, thrown = false;
			// run getter advices
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this);
				}
			}
			try {
				result = fn.call(this);
			} catch (e) {
				result = e;
				thrown = true;
			}
			fns = advice['get.after'];
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, [], result);
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

	const makeSetStub = (fn, advice) => {
		if (!fn) {
			if (!haveAnyAdvices(advice, 'get.')) { return fn; }
			fn = function () {};
		}
		const stub = function (value) {
			let i, fns = advice['set.before'], result, thrown = false;
			// run setter advices
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, value);
				}
			}
			try {
				fn.call(this, value);
			} catch (e) {
				result = e;
				thrown = true;
			}
			fns = advice['set.after'];
			if (fns) {
				for (i = 0; i < fns.length; ++i) {
					fns[i].call(this, [value], undefined);
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
		if (!mixins.length) {
			mixins = [base];
			base = Object;
		} else if (!base) {
			base = Object;
		}

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
		let commonBase = findCommonBase(bases), commonMixins = c3mro(mixes);

		// see, if we can use our base directly
		if (meta) {
			if (meta.base === commonBase && meta.mixins.length <= commonMixins.length) {
				const last = meta.mixins.length - 1;
				if (last >= 0 && meta.mixins[last] === commonMixins[last]) {
					commonBase = base;
					commonMixins = commonMixins.slice(last + 1);
				}
			}
		}

		// create a prototype and collect interrim constructors
		const ctrs = [commonBase];
		let ctr = updateDecorations(commonBase, 'original');
		commonMixins.forEach(mixin => {
			ctr = mixin(ctr);
			ctrs.push(ctr);
		});
		updateDecorations(commonBase, 'reverted');

		// collect directives & advices from the interrim constructors
		const directives = {}, advices = {};

		const collectDirectives = ownDirectives => name => {
			const advice = typeof ownDirectives[name] == 'string' ? {chainWith: ownDirectives[name]} : ownDirectives[name];
			if (typeof advice.chainWith == 'string') {
				if (name === cname) {
					throw new Error('no chaining rule for constructors: always "after"');
				}
				if (!directives.hasOwnProperty(name)) {
					directives[name] = advice.chainWith;
				} else if (directives[name] !== advice.chainWith) {
					throw new Error('conflicting chaining directives');
				}
			}
			if (!advices.hasOwnProperty(name)) {
				advices[name] = {};
			}
			const target = advices[name];
			['get.before', 'get.after', 'get.around', 'set.before', 'set.after', 'set.around', 'before', 'after', 'around'].
				forEach(name => collectAdvice(target, advice, name));
		};

		ctrs.forEach(mixin => {
			const ownDirectives = Object[pname].hasOwnProperty.call(mixin, dcl.directives) && mixin[dcl.directives] ||
				Object[pname].hasOwnProperty.call(mixin[pname], dcl.directives) && mixin[pname][dcl.directives];
			if (ownDirectives) {
				const collect = collectDirectives(ownDirectives);
				Object.getOwnPropertyNames(ownDirectives).forEach(collect);
				Object.getOwnPropertySymbols(ownDirectives).forEach(collect);
			}
		});

		const original = {}, reverted = {}, originalRemove = [];

		const createDirectives = name => {
			if (name === cname) return;

			const advice = advices[name];
			// normalize advice chains
			advice['get.before'] && advice['get.before'].reverse();
			advice['set.before'] && advice['set.before'].reverse();
			advice.before && advice.before.reverse();
			// process descriptor
			let prop = Object.getOwnPropertyDescriptor(ctr[pname], name), newProp;
			if (!prop) {
				originalRemove.push(name);
				prop = getPropertyDescriptor(ctr[pname], name);
			}
			if (prop) {
				original[name] = prop;
				if (prop.get || prop.set) {
					// accessor descriptor
					if (directives.hasOwnProperty(name)) {
						throw new Error('chaining cannot be applied to accessors');
					}
					newProp = {
						get: makeGetStub(prop.get, advice),
						set: makeSetStub(prop.set, advice),
						configurable: true,
						enumerable:   prop.enumerable
					};
				} else {
					// data descriptor
					let value = prop.value;
					if (typeof value !== 'function') {
						throw new Error('wrong value');
					}
					if (directives.hasOwnProperty(name)) {
						const weaver = dcl.weavers[directives[name]];
						if (!weaver) {
							throw new Error('there is no weaver: ' + directives[name]);
						}
						value = weaver(collectValues(ctr[pname], name));
					}
					newProp = {
						value: makeValueStub(value, advice),
						configurable: true,
						enumerable:   prop.enumerable,
						writable:     prop.writable
					};
				}
			} else {
				// no descriptor
				newProp = {
					value: makeValueStub(nop, advice),
					configurable: true
				};
			}
			reverted[name] = newProp;
		};

		// apply directives & advices
		// TODO: add processing directives, for now directives are ignored
		Object.getOwnPropertyNames(advices).forEach(createDirectives);
		Object.getOwnPropertySymbols(advices).forEach(createDirectives);

		// finalize a constructor
		const name = ctr.hasOwnProperty(dcl.declaredClass) && ctr[dcl.declaredClass] ||
			ctr[pname].hasOwnProperty(dcl.declaredClass) && ctr[pname][dcl.declaredClass] ||
			ctr.hasOwnProperty('name') && ctr.name;
		if (advices[cname]) {
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
		if (name && name !== 'Object') {
			updateValue(ctr, 'name', name);
		}
		Object.defineProperties(ctr[pname], reverted);
		ctr[dcl.meta] = {
			original, originalRemove, reverted,
			base: commonBase,
			mixins: commonMixins
		};
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
	dcl._makeCtr = ctr => ctr;

	return dcl;
});
