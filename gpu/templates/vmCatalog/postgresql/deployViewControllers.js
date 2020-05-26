'use strict';

angular.module('gpu.controllers')
   .controller('postgresqlDeployViewCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("postgresql deployViewControllers.js : postgresqlDeployViewCtrl", 1);

       var viewer = this;
       viewer.tenantId          = $scope.main.userTenantGpuId;
       viewer.fn                = {};

    })
;
