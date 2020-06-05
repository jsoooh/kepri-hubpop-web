'use strict';

angular.module('gpu.controllers')
    .controller('nginxDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("nginx deployControllers.js : nginxDeployCtrl", 1);
        var subPage = this;
        var ct = $scope.$parent.$parent.contents;

        ct.deployTypeReplicaSuport = false;
        ct.deployTypeClusterSuport = true;

    })
;
