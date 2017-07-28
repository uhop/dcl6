'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dcl = require('../dcl');

var _dcl2 = _interopRequireDefault(_dcl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

exports.default = function (_, f) {
	return f(_dcl2.default);
}(['../dcl'], function (dcl) {
	'use strict';

	var Counter = new dcl(null, function (Base) {
		return function (_Base) {
			_inherits(_class, _Base);

			_createClass(_class, null, [{
				key: dcl.declaredClass,
				get: function get() {
					return 'dcl/advices/counter/Counter';
				}
			}]);

			function _class() {
				_classCallCheck(this, _class);

				var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

				_this.reset();
				return _this;
			}

			_createClass(_class, [{
				key: 'reset',
				value: function reset() {
					this.calls = this.errors = 0;
				}
			}, {
				key: 'advice',
				value: function advice() {
					var _this2 = this;

					return {
						before: function before() {
							++_this2.calls;
						},
						after: function after(args, result) {
							if (result instanceof Error) {
								++_this2.errors;
							}
						}
					};
				}
			}]);

			return _class;
		}(Base);
	});

	return function () {
		return new Counter();
	};
});