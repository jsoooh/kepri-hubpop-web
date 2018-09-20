'use strict';

angular.module('app').filter('commQuotaHistoryDefaultQuotaName', function() {
	return function(input) {
		var json = {};
		json[true] = '기본';
		json[false] = '';
		return json[input];
	}
}).filter('commQuotaHistoryStatusName', function() {
	return function(input) {
		var json = {};
		json.REQUEST = '변경요청';
		json.APPROVAL = '승인';
		json.REJECTION = '반려';
        json.SUCCESS = '연계성공';
        json.FAIL = '연계실패';
		return json[input];
	}
}).filter('commQuotaHistoryStatusName2', function() {
    return function(input) {
        var json = {};
        json.REQUEST = '변경요청';
        json.APPROVAL = '승인';
        json.REJECTION = '반려';
        json.SUCCESS = '성공';
        json.FAIL = '실패';
        return json[input];
    }
}).filter('commProjectUseRemainTimeMs', function() {
	return function(input) {
		return Math.round(input / (1000 * 60 * 60 * 24));
	}
});
