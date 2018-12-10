'use strict';

angular.module('portal.controllers').controller('commServiceCatalogCataViewCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache) {

	_DebugConsoleLog('serviceCatalogViewControllers.js Start', 1);

	var contents = this;

	contents.serviceCatalogId = $stateParams.serviceCatalogId;

	if (contents.serviceCatalogId == ':serviceCatalogId') {
		contents.serviceCatalogId = 'default';
	}

	_DebugConsoleLog('contents.serviceCatalogId=' + contents.serviceCatalogId, 1);
	_DebugConsoleLog(contents.serviceCatalogId, 1);

	contents.contentNgInclude = _COMM_VIEWS_ + '/serviceCatalog/cata_view_' + contents.serviceCatalogId + '.html';

	contents.setNavigationTreeTitle = function() {
		var displayName = {
			java : 'Java App',
			c : 'C/C APP',
			net : '.Net APP',
			compute : '가상서버',
			volume : '디스크 스토리지',
			object : '오브젝트 스토리지',
		};

		var mc = $scope.main;
		mc.sltServiceCatalog = {};
		mc.sltServiceCatalog.id = contents.serviceCatalogId;
		mc.sltServiceCatalog.displayName = displayName[contents.serviceCatalogId];
		mc.setNavigationTreeTitle();
	};

	contents.setNavigationTreeTitle();

	_DebugConsoleLog('serviceCatalogViewControllers.js End', 1);

});
