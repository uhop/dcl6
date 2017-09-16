(function(_,f){f(window.dcl,window.dcl.advise,window.dcl.mixins.Named);})
(['./dcl', './advise', './mixins/Named'], function (dcl, advise, Named) {
	'use strict';

	// set up custom names
	const pname = 'prototype', cname = 'constructor';

	function DclError (message) {
		this.name = 'DclError';
		this.message = message || 'Default Message';
		this.stack = (new Error()).stack;
	}
	DclError[pname] = Object.create(Error[pname]);
	DclError[pname][cname] = DclError;

	const BaseError = dcl(DclError, Named('dcl/debug/BaseError')),
		AdviceError = dcl(DclError, Named('dcl/debug/AdviceError')),
		ChainingError = dcl(DclError, Named('dcl/debug/ChainingError')),
		SuperError = dcl(DclError, Named('dcl/debug/SuperError'));

	function getClassNames (cls) {
		const uniques = [];
		return cls.map(c => {
			if (c.name) return c.name;
			const index = uniques.indexOf(c);
			return index < 0 ? uniques.push(c) : index;
		});
	}

	advise.around(dcl, '_error', function (sup) {
		return function (reason, info) {
			// dcl.js
			if (reason === 'incompatible bases') {
				throw new BaseError('dcl: base classes based on incompatible bases - ' +
					getClassNames(info.bases).join(', '));
			}
			if (reason === 'dependency cycle') {
				throw new BaseError('dcl: base classes are mutually dependent creating a loop - ' +
					getClassNames(info.mixins).join(', '));
			}
			if (/\badvice is not function$/.test(reason)) {
				throw new AdviceError('dcl: advice is not a function - class: ' +
					(info.proto.constructor.name || 'unknown') + ', method: ' + info.name +
					', advice: ' + info.path);
			}
			if (reason === 'expected value descriptor') {
				throw new AdviceError('dcl: expected value descriptor - class: ' +
					(info.proto.constructor.name || 'unknown') + ', method: ' + info.key);
			}
			if (/^no chaining rule for constructors\b/.test(reason)) {
				throw new ChainingError('dcl: no chaining rules for constructors, see the standard - class: ' +
					(info.proto.constructor.name || 'unknown'));
			}
			if (reason === 'conflicting chaining directives') {
				throw new ChainingError('dcl: no chaining rules for constructors, see the standard - class: ' +
					(info.proto.constructor.name || 'unknown'));
			}
			if (reason === 'chaining cannot be applied to accessors') {
				throw new ChainingError('dcl: chaining directive cannot be applied to accessors - method: ' +
					info.name + ', directive: ' + info.directive);
			}
			if (reason === 'value is expected to be a function') {
				throw new ChainingError('dcl: chaining directive should be applied to function values - method: ' +
					info.name + ', directive: ' + info.directive);
			}
			if (/^there is no weaver\b/.test(reason)) {
				throw new ChainingError('dcl: unknown chaining directive (no corresponding weaver) - method: ' +
					info.name + ', directive: ' + info.directive);
			}
			// advise.js
			if (reason === 'wrong super call') {
				throw new SuperError('dcl/advise: wrong around/super advice, expected a function - method: ' + info.name);
			}
			if (reason === 'wrong super arg') {
				throw new SuperError('dcl/advise: wrong around/super argument, expected a function - method: ' + info.name);
			}
			if (reason === 'wrong super result') {
				throw new SuperError('dcl/advise: wrong around/super result, expected a function - method: ' + info.name);
			}
			if (reason === 'a function was expected') {
				throw new SuperError('dcl/advise: wrong advised method, expected a function - method: ' + info.name);
			}
			// the default
			return sup.apply(this, arguments);
		};
	});

	function logCtor (ctr) {
		const meta = ctr[dcl.meta];
		if (!meta) {
			return console.log('class doesn\'t have information compatible with dcl');
		}
		console.log('class "' + ctr.name + '" is based on "' + (meta.base ? meta.base.name : 'null') +
			'" with ' + meta.mixins.length + ' mixin' + (meta.mixins.length == 1 ? '' : 's'));
		// display structure of ctr
	}

	function log (o, suppressCtor) {
		if (typeof o == 'function') {
			return logCtor(o);
		}
		const ctr = o[cname];
		console.log('object of class "' + ctr.name + '"');
		!suppressCtor && logCtor(ctr);
		// log members of o
	}

	dcl.log = log;
	dcl.DclError = DclError;
	dcl.BaseError = BaseError;
	dcl.AdviceError = AdviceError;
	dcl.ChainingError = ChainingError;
	dcl.SuperError = SuperError;

	return dcl;
});
