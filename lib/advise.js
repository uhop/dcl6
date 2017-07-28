'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dcl = require('./dcl');

var _dcl2 = _interopRequireDefault(_dcl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

exports.default = function (_, f) {
	return f(_dcl2.default);
}(['./dcl'], function (dcl) {
	'use strict';

	var pname = 'prototype';

	var Node = function () {
		function Node(parent) {
			_classCallCheck(this, Node);

			this.parent = parent || this;
		}

		_createClass(Node, [{
			key: 'removeTopic',
			value: function removeTopic(topic) {
				var n = 'next_' + topic,
				    p = 'prev_' + topic;
				if (this[n] && this[p]) {
					this[n][p] = this[p];
					this[p][n] = this[n];
				}
			}
		}, {
			key: 'remove',
			value: function remove() {
				var _this = this;

				var next = this.next_around;

				dcl._sideAdvices.forEach(function (name) {
					return _this.removeTopic(name);
				});
				this.removeTopic('around');

				// remove & recreate around advices
				for (var parent = this.parent; next && next !== parent; next = next.next_around) {
					next.around = next.originalAround(next.prev_around.around);
				}
			}
		}, {
			key: 'addTopic',
			value: function addTopic(node, topic) {
				var n = 'next_' + topic,
				    p = 'prev_' + topic,
				    prev = node[p] = this[p] || this;
				node[n] = this;
				prev[n] = this[p] = node;
			}
		}]);

		return Node;
	}();

	Node[pname].destroy = Node[pname].unadvise = Node[pname].remove;

	var convertAdvices = function convertAdvices(fn) {
		var root = new Node(),
		    meta = fn[dcl.advice] || { original: fn };

		var _loop = function _loop(i) {
			var node = new Node(root);
			if (!i) {
				node.around = meta.original;
				root.addTopic(node, 'around');
			};
			var done = true;
			dcl._sideAdvices.forEach(function (name) {
				if (meta[name] && i < meta[name].length) {
					node[name] = meta[name][i];
					root.addTopic(node, name);
					done = false;
				}
			});
			if (done) {
				return 'break';
			}
		};

		for (var i = 0;; ++i) {
			var _ret = _loop(i);

			if (_ret === 'break') break;
		}
		return root;
	};

	var addAdvice = function addAdvice(root, advice, around) {
		var node = new Node(root);
		if (advice.get) {
			if (advice.get.before) {
				node.get_before = advice.get.before;
				root.addTopic(node, 'get_before');
			}
			if (advice.get.after) {
				node.get_after = advice.get.after;
				root.addTopic(node, 'get_after');
			}
		}
		if (advice.set) {
			if (advice.set.before) {
				node.set_before = advice.set.before;
				root.addTopic(node, 'set_before');
			}
			if (advice.set.after) {
				node.set_after = advice.set.after;
				root.addTopic(node, 'set_after');
			}
		}
		if (advice.before) {
			node.before = advice.before;
			root.addTopic(node, 'before');
		}
		if (advice.after) {
			node.after = advice.after;
			root.addTopic(node, 'after');
		}
		if (around) {
			if (typeof around != 'function') {
				dcl._error('wrong super call');
			}
			node.originalAround = around;
			root.addTopic(node, 'around');
			if (node.prev_around.around && typeof node.prev_around.around != 'function') {
				dcl._error('wrong super arg');
			}
			node.around = around.call(advice, node.prev_around.around || null);
			if (typeof node.around != 'function') {
				dcl._error('wrong super result');
			}
		}
		return node;
	};

	var makeValueStub = function makeValueStub(value) {
		// TODO: verify that value is a function
		if (typeof value != 'function') {
			dcl._error();
		}
		var root = convertAdvices(value);
		var stub = function stub() {
			var result = void 0,
			    thrown = void 0,
			    p = void 0;
			var makeReturn = function makeReturn(value) {
				result = value;thrown = false;
			};
			var makeThrow = function makeThrow(value) {
				result = value;thrown = true;
			};
			// running the before chain
			for (p = root.prev_get_before; p && p !== root; p = p.prev_get_before) {
				p.get_before.call(this);
			}
			for (p = root.prev_before; p && p !== root; p = p.prev_before) {
				p.before.apply(this, arguments);
			}
			// running the around chain
			var fn = root.prev_around && root.prev_around !== root && root.prev_around.around || null;
			if (fn) {
				try {
					result = fn.apply(this, arguments);
				} catch (e) {
					result = e;
					thrown = true;
				}
			}
			// running the after chain
			for (p = root.next_after; p && p !== root; p = p.next_after) {
				p.after.call(this, arguments, result, makeReturn, makeThrow);
			}
			var args = [];
			for (p = root.next_get_after; p && p !== root; p = p.next_get_after) {
				p.get_after.call(this, args, fn);
			}
			if (thrown) {
				throw result;
			}
			return result;
		};
		stub[advise.meta] = root;
		return stub;
	};

	var makeGetStub = function makeGetStub(getter) {
		var root = convertAdvices(getter);
		var stub = function stub() {
			var result = void 0,
			    thrown = void 0,
			    p = void 0;
			var makeReturn = function makeReturn(value) {
				result = value;thrown = false;
			};
			var makeThrow = function makeThrow(value) {
				result = value;thrown = true;
			};
			// running the before chain
			for (p = root.prev_get_before; p && p !== root; p = p.prev_get_before) {
				p.get_before.call(this);
			}
			// running the around chain
			var fn = root.prev_around && root.prev_around !== root && root.prev_around.around || null;
			if (fn) {
				try {
					result = fn.call(this);
				} catch (e) {
					result = e;
					thrown = true;
				}
			}
			// running the after chain
			for (p = root.next_get_after; p && p !== root; p = p.next_get_after) {
				p.get_after.call(this, arguments, result, makeReturn, makeThrow);
			}
			if (thrown) {
				throw result;
			}
			return result;
		};
		stub[advise.meta] = root;
		return stub;
	};

	var makeSetStub = function makeSetStub(setter) {
		var root = convertAdvices(setter);
		var stub = function stub(value) {
			var result = void 0,
			    thrown = void 0,
			    p = void 0;
			var makeThrow = function makeThrow(value) {
				result = value;thrown = true;
			};
			// running the before chain
			for (p = root.prev_set_before; p && p !== root; p = p.prev_set_before) {
				p.set_before.call(this, value);
			}
			// running the around chain
			var fn = root.prev_around && root.prev_around !== root && root.prev_around.around || null;
			if (fn) {
				try {
					fn.call(this, value);
				} catch (e) {
					result = e;
					thrown = true;
				}
			}
			// running the after chain
			for (p = root.next_set_after; p && p !== root; p = p.next_set_after) {
				p.set_after.call(this, arguments, undefined, null, makeThrow);
			}
			if (thrown) {
				throw result;
			}
		};
		stub[advise.meta] = root;
		return stub;
	};

	var convertProp = function convertProp(prop) {
		var newProp = {};
		Object.getOwnPropertyNames(prop).forEach(function (name) {
			return newProp[name] = prop[name];
		});
		var replace = void 0;
		if (prop.get || prop.set) {
			// accessor descriptor
			if (prop.get && !prop.get[advise.meta]) {
				newProp.get = makeGetStub(prop.get);
				replace = replace || newProp.get != prop.get;
			}
			if (prop.set && !prop.set[advise.meta]) {
				newProp.set = makeSetStub(prop.set);
				replace = replace || newProp.set != prop.set;
			}
		} else {
			// data descriptor
			if (prop.value && !prop.value[advise.meta]) {
				newProp.value = makeValueStub(prop.value);
				replace = replace || newProp.value != prop.value;
			}
		}
		return replace && newProp;
	};

	var convertProperty = function convertProperty(instance, name, isAccessor) {
		var prop = dcl.getPropertyDescriptor(instance, name);
		if (!prop) {
			if (isAccessor) {
				prop = { get: undefined, set: undefined, configurable: true };
			} else {
				prop = { value: undefined, writable: true, configurable: true };
			}
		}
		var newProp = convertProp(prop);
		if (newProp) {
			var isReplaced = Object[pname].hasOwnProperty(instance, name);
			Object.defineProperty(instance, name, newProp);
			var remove = isReplaced ? function () {
				return Object.defineProperty(instance, name, prop);
			} : function () {
				return delete instance[name];
			};
			newProp.get && (newProp.get.remove = remove);
			newProp.set && (newProp.set.remove = remove);
			newProp.value && (newProp.value.remove = remove);
		}
	};

	var combineHandles = function combineHandles(handles) {
		if (handles.length == 1) {
			return handles[0];
		}
		var handle = {};
		handle.destroy = handle.unadvise = handle.remove = function () {
			return handles.forEach(function (handle) {
				return handle.remove();
			});
		};
		return handle;
	};

	var advise = function advise(instance, name, advice) {
		var handles = void 0;
		if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) == 'object') {
			handles = Object.keys(name).filter(function (key) {
				return _typeof(name[key]) == 'object';
			}).map(function (name) {
				return advise(instance, key, name[key]);
			});
		} else {
			convertProperty(instance, name, !(advice.before || advice.around || advice.after));
			var prop = Object.getOwnPropertyDescriptor(instance, name);
			handles = ['get', 'set', 'value'].map(function (name) {
				return prop[name] && addAdvice(prop[name][advise.meta], advice, name !== 'value' ? advice[name] && advice[name].around : advice.around);
			});
		}
		return combineHandles(handles.filter(function (handle) {
			return handle;
		}));
	};

	// export

	advise.meta = Symbol('dcl.advise.meta');

	advise.before = function (instance, name, f) {
		return advise(instance, name, { before: f });
	};
	advise.after = function (instance, name, f) {
		return advise(instance, name, { after: f });
	};
	advise.around = function (instance, name, f) {
		return advise(instance, name, { around: f });
	};
	advise.Node = Node;

	advise.isAdvised = function (instance, name) {
		var prop = Object.getOwnPropertyDescriptor(instance, name);
		return prop && (prop.get && prop.get[advise.meta] || prop.set && prop.set[advise.meta] || prop.value && prop.value[advise.meta]);
	};

	return advise;
});