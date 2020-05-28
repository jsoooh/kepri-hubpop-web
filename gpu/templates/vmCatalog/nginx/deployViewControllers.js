'use strict';

angular.module('gpu.controllers')
   .controller('nginxDeployViewCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("nginx deployViewControllers.js : nginxDeployViewCtrl", 1);
       var subPage = this;
       subPage.tenantId          = $scope.main.userTenantGpuId;
       subPage.fn                = {};
       subPage.data              = {};

    })
;
