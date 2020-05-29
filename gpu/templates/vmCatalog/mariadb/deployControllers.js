'use strict';

angular.module('gpu.controllers')
    .controller('mariadbDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mariadb deployControllers.js : mariadbDeployCtrl", 1);
        var ct = $scope.$parent.$parent.contents;

        ct.deployTypeReplicaSuport = true;
        ct.deployTypeClusterSuport = true;

    })
;
