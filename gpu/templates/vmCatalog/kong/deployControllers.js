'use strict';

angular.module('gpu.controllers')
    .controller('kongDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("kong deployControllers.js : kongDeployCtrl", 1);
        var deploy = this;
        deploy.tenantId          = $scope.main.userTenantGpuId;
        deploy.fn                = {};

    })
;
