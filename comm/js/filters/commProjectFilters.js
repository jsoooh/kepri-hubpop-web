'use strict';

angular.module('app')

.filter('commQuotaDescription', function() {
	return function(input, quotas) {

		var description = '';

		if (!input) {
			return description;
		}
		if (!quotas) {
			return description;
		}

		for (var i = 0, l = quotas.length; i < l; i++) {
			var item = quotas[i];

			if (item.id == input) {
				description = item.description;
				break;
			}
		}

		return description;
	}
}).filter('orgRoleName', function(CONSTANTS) {
	return function(input) {

		var json = {};
		json[CONSTANTS.roleName.owner] = '프로젝트 책임자';
		json[CONSTANTS.roleName.admin] = '프로젝트 관리자';
		json[CONSTANTS.roleName.user] = '프로젝트 사용자';

		return json[input];
	}
}).filter('roleName2', function(CONSTANTS) {
		return function(input) {

			var json = {};
			json[CONSTANTS.roleName.owner] = '책임자';
			json[CONSTANTS.roleName.admin] = '관리자';
			json[CONSTANTS.roleName.user] = '사용자';

			return json[input];
		}
	})

;
