'use strict';

angular.module('gpu.controllers')
   .controller('kafkaDeployViewCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("kafka deployViewControllers.js : kafkaDeployViewCtrl", 1);
       var subPage = this;
       subPage.tenantId          = $scope.main.userTenantGpuId;
       subPage.fn                = {};
       subPage.data              = {};

    })
;
