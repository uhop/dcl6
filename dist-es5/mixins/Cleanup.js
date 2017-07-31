'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (_, f) {
	window.dcl.mixins.Cleanup = f(window.dcl, window.dcl.mixins.Destroyable);
})(['../dcl', './Destroyable'], function (dcl, Destroyable) {
	'use strict';

	return dcl(null, Destroyable, function (Base) {
		return function (_Base) {
			_inherits(_class, _Base);

			_createClass(_class, null, [{
				key: dcl.declaredClass,
				get: function get() {
					return 'dcl/mixins/Cleanup';
				}
			}]);

			function _class() {
				var _ref;

				_classCallCheck(this, _class);

				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				var _this = _possibleConstructorReturn(this, (_ref = _class.__proto__ || Object.getPrototypeOf(_class)).call.apply(_ref, [this].concat(args)));

				_this.__cleanupStack = [];
				return _this;
			}

			_createClass(_class, [{
				key: 'pushCleanup',
				value: function pushCleanup(resource, cleanup) {
					var f = cleanup ? function () {
						cleanup(resource);
					} : function () {
						resource.destroy();
					};
					this.__cleanupStack.push(f);
					return f;
				}
			}, {
				key: 'popCleanup',
				value: function popCleanup(dontRun) {
					if (dontRun) {
						return this.__cleanupStack.pop();
					}
					this.__cleanupStack.pop()();
				}
			}, {
				key: 'removeCleanup',
				value: function removeCleanup(f) {
					for (var i = this.__cleanupStack.length - 1; i >= 0; --i) {
						if (this.__cleanupStack[i] === f) {
							this.__cleanupStack.splice(i, 1);
							return true;
						}
					}
				}
			}, {
				key: 'cleanup',
				value: function cleanup() {
					while (this.__cleanupStack.length) {
						this.__cleanupStack.pop()();
					}
				}
			}, {
				key: 'destroy',
				value: function destroy() {
					this.cleanup();
				}
			}]);

			return _class;
		}(Base);
	});
});