'use strict';

angular.module('gpu.controllers')
   .controller('haproxyDeployViewCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("haproxy deployViewControllers.js : haproxyDeployViewCtrl", 1);

       var viewer = this;
       viewer.tenantId          = $scope.main.userTenantGpuId;
       viewer.fn                = {};

    })
;
