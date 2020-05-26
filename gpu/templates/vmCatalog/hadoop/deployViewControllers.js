'use strict';

angular.module('gpu.controllers')
   .controller('hadoopDeployViewCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("hadoop deployViewControllers.js : hadoopDeployViewCtrl", 1);

       var viewer = this;
       viewer.tenantId          = $scope.main.userTenantGpuId;
       viewer.fn                = {};

    })
;
