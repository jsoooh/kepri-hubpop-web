'use strict';

angular.module('gpu.controllers')
    .controller('hadoopDeployCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("hadoop deployControllers.js : hadoopDeployCtrl", 1);
        var subPage = this;
        subPage.tenantId          = $scope.main.userTenantGpuId;
        subPage.fn                = {};
        subPage.data              = {};

    })
;
