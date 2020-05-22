'use strict';

angular.module('gpu.controllers')
   .controller('mysqlDeployViewCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mysql deployViewControllers.js : mysqlDeployViewCtrl", 1);

       var viewer = this;
       viewer.tenantId          = $scope.main.userTenantGpuId;
       viewer.fn                = {};

    })
;
