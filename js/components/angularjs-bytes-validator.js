(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("angular"));
	else if(typeof define === 'function' && define.amd)
		define("bytes-validator", ["angular"], factory);
	else if(typeof exports === 'object')
		exports["bytes-validator"] = factory(require("angular"));
	else
		root["bytes-validator"] = factory(root["angular"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_4__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var ng_from_import = __webpack_require__(4);
var ng_from_global = angular;
/** @internal */
exports.ng = (ng_from_import && ng_from_import.module) ? ng_from_import : ng_from_global;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var DEFAULT_BYTES_LIMIT = 140;
/** @internal */
var BytesValidator = (function () {
    function BytesValidator($bytes) {
        this.$bytes = $bytes;
        this.require = 'ngModel';
        this.restrict = 'A';
    }
    BytesValidator.instance = function ($bytes) {
        return new BytesValidator($bytes);
    };
    BytesValidator.prototype.link = function ($scope, $element, $attrs, ngModelCtrl) {
        var _this = this;
        var limit = parseInt($attrs.bytesValidate) || DEFAULT_BYTES_LIMIT;
        ngModelCtrl.$validators.bytes = function (modelValue, viewValue) {
            var value = modelValue || viewValue;
            if (!value) {
                return true;
            }
            return (_this.$bytes.lengthInUtf8Bytes(value) <= limit);
        };
    };
    return BytesValidator;
}());
BytesValidator.$inject = ['$bytes'];
exports.BytesValidator = BytesValidator;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

BytesFilter.$inject = StringToBytesFilter.$inject = ['$bytes'];
function BytesFilter($bytes) {
    return function (value) {
        var numberValue = (typeof value === 'number') ? value : parseInt(value);
        if (!numberValue || numberValue == 0) {
            return '';
        }
        return $bytes.formatBytes(numberValue);
    };
}
exports.BytesFilter = BytesFilter;
function StringToBytesFilter($bytes) {
    return function (string) {
        if (!string || string == '') {
            return '';
        }
        return $bytes.formatBytes($bytes.lengthInUtf8Bytes(string));
    };
}
exports.StringToBytesFilter = StringToBytesFilter;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var BytesService = (function () {
    function BytesService() {
    }
    BytesService.prototype.lengthInUtf8Bytes = function (string) {
        if (!string || !string.length) {
            return 0;
        }
        // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
        var m = encodeURIComponent(string).match(/%[89ABab]/g);
        return string.length + (m ? m.length : 0);
    };
    BytesService.prototype.formatBytes = function (number) {
        var exponent;
        var unit;
        var negative = number < 0;
        var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        if (negative) {
            number = -number;
        }
        if (number < 1) {
            return (negative ? '-' : '') + number + ' B';
        }
        //exponent = Math.min(Math.floor(Math.log(number) / Math.log(1000)), units.length - 1);
        //number = Number((number / Math.pow(1000, exponent)).toFixed(2));
        //unit = units[exponent];
        return (negative ? '-' : '') + number;// + ' ' + unit;
    };
    return BytesService;
}());
exports.BytesService = BytesService;


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/** @internal */
var angular_1 = __webpack_require__(0);
var bytes_validator_service_1 = __webpack_require__(3);
var bytes_validator_directive_1 = __webpack_require__(1);
var bytes_validator_filter_1 = __webpack_require__(2);
var module = angular_1.ng.module('bytes-validator', []);
module.service('$bytes', bytes_validator_service_1.BytesService);
module.filter('bytes', bytes_validator_filter_1.BytesFilter);
module.filter('stringToBytes', bytes_validator_filter_1.StringToBytesFilter);
module.directive('bytesValidate', bytes_validator_directive_1.BytesValidator.instance);


/***/ })
/******/ ]);
});
//# sourceMappingURL=bytes-validator.js.map