"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _dcl = require("../dcl");

var _dcl2 = _interopRequireDefault(_dcl);

var _advise = require("../advise");

var _advise2 = _interopRequireDefault(_advise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (_, f) {
	return f(_dcl2.default, _advise2.default);
}(['../dcl', '../advise'], function (dcl, advise) {
	'use strict';

	var registry = {};

	// register all named classes automatically
	advise.after(dcl, '_makeCtr', function (_, ctr) {
		var name = ctr && (ctr[dcl.declaredClass] || ctr.prototype[dcl.declaredClass]);
		if (typeof name == 'string') {
			registry[name] = ctr;
		}
	});

	return {
		get: function get(name) {
			return registry[name];
		},
		has: function has(name) {
			return Object.prototype.hasOwnProperty.call(registry, name);
		},
		delete: function _delete(name) {
			return delete registry[name];
		},
		keys: function keys() {
			return Object.keys(registry).filter(function (name) {
				return Object.prototype.hasOwnProperty.call(registry, name);
			});
		},
		clear: function clear() {
			registry = {};
		}
	};
});