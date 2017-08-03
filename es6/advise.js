import m0 from "./dcl";export default (function(_,f){return f(m0);})
(['./dcl'], function (dcl) {
	'use strict';

	var pname = 'prototype';

	class Node {
		constructor (parent) {
			this.parent = parent || this;
		}
		removeTopic (topic) {
			const n = 'next_' + topic, p = 'prev_' + topic;
			if (this[n] && this[p]) {
				this[n][p] = this[p];
				this[p][n] = this[n];
			}
		}
		remove () {
			let next = this.next_around;

			dcl._sideAdvices.forEach(name => this.removeTopic(name));
			this.removeTopic('around');

			// remove & recreate around advices
			for (const parent = this.parent; next && next !== parent; next = next.next_around) {
				next.around = next.originalAround(next.prev_around.around);
			}
		}
		addTopic (node, topic) {
			const n = 'next_' + topic, p = 'prev_' + topic, prev = node[p] = this[p] || this;
			node[n] = this;
			prev[n] = this[p] = node;
		}
	}
	Node[pname].destroy = Node[pname].unadvise = Node[pname].remove;

	const convertAdvices = fn => {
		const root = new Node(), meta = fn[dcl.advice] || {original: fn};
		for (let i = 0;; ++i) {
			const node = new Node(root);
			if (!i) {
				node.around = meta.original;
				root.addTopic(node, 'around');
			};
			let done = true;
			dcl._sideAdvices.forEach(name => {
				if (meta[name] && i < meta[name].length) {
					node[name] = meta[name][i];
					root.addTopic(node, name);
					done = false;
				}
			});
			if (done) { break; }
		}
		return root;
	}

	const addAdvice = (root, advice, around) => {
		const node = new Node(root);
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

	const makeValueStub = value => {
		// TODO: verify that value is a function
		if (typeof value != 'function') { dcl._error(); }
		const root = convertAdvices(value);
		const stub = function () {
			let result, thrown, p;
			const makeReturn = value => { result = value; thrown = false; }
			const makeThrow  = value => { result = value; thrown = true; }
			// running the before chain
			for (p = root.prev_get_before; p && p !== root; p = p.prev_get_before) {
				p.get_before.call(this);
			}
			for (p = root.prev_before; p && p !== root; p = p.prev_before) {
				p.before.apply(this, arguments);
			}
			// running the around chain
			const fn = root.prev_around && root.prev_around !== root && root.prev_around.around || null;
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
			const args = [];
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

	const makeGetStub = getter => {
		const root = convertAdvices(getter);
		const stub = function () {
			let result, thrown, p;
			const makeReturn = value => { result = value; thrown = false; }
			const makeThrow  = value => { result = value; thrown = true; }
			// running the before chain
			for (p = root.prev_get_before; p && p !== root; p = p.prev_get_before) {
				p.get_before.call(this);
			}
			// running the around chain
			const fn = root.prev_around && root.prev_around !== root && root.prev_around.around || null;
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

	const makeSetStub = setter => {
		const root = convertAdvices(setter);
		const stub = function (value) {
			let result, thrown, p;
			const makeThrow  = value => { result = value; thrown = true; }
			// running the before chain
			for (p = root.prev_set_before; p && p !== root; p = p.prev_set_before) {
				p.set_before.call(this, value);
			}
			// running the around chain
			const fn = root.prev_around && root.prev_around !== root && root.prev_around.around || null;
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

	const convertProp = prop => {
		const newProp = {};
		Object.getOwnPropertyNames(prop).forEach(name => newProp[name] = prop[name]);
		let replace;
		if (prop.get || prop.set) { // accessor descriptor
			if (prop.get && !prop.get[advise.meta]) {
				newProp.get = makeGetStub(prop.get);
				replace = replace || newProp.get != prop.get;
			}
			if (prop.set && !prop.set[advise.meta]) {
				newProp.set = makeSetStub(prop.set);
				replace = replace || newProp.set != prop.set;
			}
		} else { // data descriptor
			if (prop.value && !prop.value[advise.meta]) {
				newProp.value = makeValueStub(prop.value);
				replace = replace || newProp.value != prop.value;
			}
		}
		return replace && newProp;
	};

	const convertProperty = (instance, name, isAccessor) => {
		let prop = dcl.getPropertyDescriptor(instance, name);
		if (!prop) {
			if (isAccessor) {
				prop = {get: undefined, set: undefined, configurable: true};
			} else {
				prop = {value: undefined, writable: true, configurable: true};
			}
		}
		const newProp = convertProp(prop);
		if (newProp) {
			const isReplaced = Object[pname].hasOwnProperty(instance, name);
			Object.defineProperty(instance, name, newProp);
			const remove = isReplaced ? (() => Object.defineProperty(instance, name, prop)) : (() => delete instance[name]);
			newProp.get && (newProp.get.remove = remove);
			newProp.set && (newProp.set.remove = remove);
			newProp.value && (newProp.value.remove = remove);
		}
	};

	const combineHandles = handles => {
		if (handles.length == 1) { return handles[0]; }
		const handle = {};
		handle.destroy = handle.unadvise = handle.remove =
			() => handles.forEach(handle => handle.remove());
		return handle;
	}

	const advise = (instance, name, advice) => {
		let handles;
		if (typeof name == 'object') {
			handles = Object.keys(name).filter(key => typeof name[key] == 'object').
				map(name => advise(instance, key, name[key]));
		} else {
			convertProperty(instance, name, !(advice.before || advice.around || advice.after));
			const prop = Object.getOwnPropertyDescriptor(instance, name);
			handles = ['get', 'set', 'value'].
				map(name => prop[name] && addAdvice(prop[name][advise.meta], advice,
					name !== 'value' ? advice[name] && advice[name].around : advice.around));
		}
		return combineHandles(handles.filter(handle => handle));
	};

	// export

	const S = typeof Symbol != 'undefined' ? Symbol : (name => '__' + name);

	advise.meta = S('dcl.advise.meta');

	advise.before = (instance, name, f) => advise(instance, name, {before: f});
	advise.after  = (instance, name, f) => advise(instance, name, {after:  f});
	advise.around = (instance, name, f) => advise(instance, name, {around: f});
	advise.Node = Node;

	advise.isAdvised = (instance, name) => {
		const prop = Object.getOwnPropertyDescriptor(instance, name);
		return prop && (prop.get && prop.get[advise.meta] ||
			prop.set && prop.set[advise.meta] || prop.value && prop.value[advise.meta]);
	};

	return advise;
});
