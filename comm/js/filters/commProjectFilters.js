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
});
