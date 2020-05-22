'use strict';

angular.module('gpu.controllers')
   .controller('mariadbDeployViewCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mariadb deployViewControllers.js : mariadbDeployViewCtrl", 1);

       var viewer = this;
       viewer.tenantId          = $scope.main.userTenantGpuId;
       viewer.fn                = {};

    })
;
