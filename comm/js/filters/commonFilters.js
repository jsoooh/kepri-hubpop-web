'use strict';

angular.module('app')
// 부분 필터
    .filter('propsFilter', function () {
        return function (items, props) {
            var out = [];
            if (angular.isArray(items)) {
                var keys = Object.keys(props);
                items.forEach(function (item) {
                    var itemMatches = false;
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }
                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }
            return out;
        };
    })
    .filter('displayVolume', function () {
        return function (value, unit, options) {
            var out = (angular.isUndefined(value) || value == null) ? 0 : parseFloat(value);
            if (!options) {
                options = {};
            }
            if (!unit) {
                unit = "KB";
            }
            if (angular.isUndefined(options.chUnit)) {
                options.chUnit = "AUTO";
            }
            var unitLabel   = "KB";
            // 계산을 일률적으로 하기 위해 KB 단위로 설정
            if (unit.toUpperCase() == "BYTE") {
                out = out/1024;
            } if (unit.toUpperCase() == "MB") {
                out = out*1024;
            } else if (unit.toUpperCase() == "GB") {
                out = out*1024*1024;
            } else if (unit.toUpperCase() == "TB") {
                out = out*1024*1024*1024;
            }
            if (options.chUnit.toUpperCase() != "AUTO") {
                unitLabel = options.chUnit;
            } else {
                // 입력된 단위를 최소 단위로
                if (out >= 1024*1024*1024) {
                    unitLabel = "TB";
                } else if (out >= 1024*1024) {
                    unitLabel = "GB";
                    if (unit.toUpperCase() == "TB") {
                        unitLabel = "TB";
                    }
                } else if (out >= 1024) {
                    unitLabel = "MB";
                    if (unit.toUpperCase() == "GB") {
                        unitLabel = "GB";
                    } else if (unit.toUpperCase() == "TB") {
                        unitLabel = "TB";
                    }
                } else {
                    unitLabel = "KB";
                    if (unit.toUpperCase() == "MB") {
                        unitLabel = "MB";
                    } else if (unit.toUpperCase() == "GB") {
                        unitLabel = "GB";
                    } else if (unit.toUpperCase() == "TB") {
                        unitLabel = "TB";
                    }
                }
            }
            if (unitLabel.toUpperCase() == "TB") {
                out = out/(1024*1024*1024);
            } else if (unitLabel.toUpperCase() == "GB") {
                out = out/(1024*1024);
            } else if (unitLabel.toUpperCase() == "MB") {
                out = out/1024;
            }
            if (angular.isUndefined(options.decimal)) {
                if (angular.isUndefined(options.maxDecimal)) {
                    options.maxDecimal = 2;
                }
            }
            if (angular.isDefined(options.decimal)) {
                out = out.toFixed(options.decimal);
            } else {
                if (options.maxDecimal == 0) {
                    out = Math.round(out);
                } else {
                    var factor = Math.pow(10, options.maxDecimal);
                    out = Math.round(out * factor) / factor;
                }
                if (angular.isDefined(options.minDecimal)) {
                    out = out.toFixed(options.minDecimal);
                }
            }
            if (options.viewType == "val") {
                return out;
            } else if (options.viewType == "unit") {
                return unitLabel;
            } else {
                return out + " " + unitLabel;
            }
        };
    })
    .filter('range', function() {
        return function(input, total) {
            total = parseInt(total);
            for (var i=0; i<total; i++)
                input.push(i);
            return input;
        };
    })
    .filter('join', function() {
        return function(arr, separator, fkey, chked) {
            if (angular.isArray(arr)) {
                if (fkey) {
                    var keyArr = [];
                    angular.forEach(arr, function (val, k) {
                        if (!chked || val[fkey]) {
                            keyArr.push(val[fkey]);
                        }
                    });
                    return keyArr.join(separator);
                } else {
                    return arr.join(separator);
                }
            } else {
                return arr
            }
        };
    })
    .filter('firstUpperCase', function() {
        return function(value) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        };
    })
    .filter('enterByNbr', function() {
        return function(value) {
            if (angular.isString(value)) {
                return value.replace(/\n/g, '<br />');
            } else {
                return value;
            }
        };
    })
;