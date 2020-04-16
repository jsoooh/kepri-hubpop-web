'use strict';

angular.module('gpu.controllers')
    .controller('gpuVmCatalogListCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, common, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("vmCatalogControllers.js : gpuVmCatalogListCtrl", 1);

        var ct               = this;
        ct.tenantId          = $scope.main.userTenantId;
        ct.fn                = {};

        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

    })
   .controller('gpuVmCatalogDeployFormCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, common, ValidationService, vmCatalogService, CONSTANTS) {
       _DebugConsoleLog("vmCatalogControllers.js : gpuVmCatalogDeployFormCtrl", 1);

       var ct               = this;
       ct.tenantId          = $scope.main.userTenantId;
       ct.fn                = {};

   })
;
