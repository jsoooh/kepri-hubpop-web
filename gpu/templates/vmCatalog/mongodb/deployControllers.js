'use strict';

angular.module('gpu.controllers')
    .controller('mongodbDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mongodb deployControllers.js : mongodbDeployCtrl", 1);
        var deploy = this;
        deploy.tenantId          = $scope.main.userTenantGpuId;
        deploy.fn                = {};

    })
;
