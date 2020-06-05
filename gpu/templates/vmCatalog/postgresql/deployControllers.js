'use strict';

angular.module('gpu.controllers')
    .controller('postgresqlDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("postgresql deployControllers.js : postgresqlDeployCtrl", 1);
        var subPage = this;
        var ct = $scope.$parent.$parent.contents;

        ct.deployTypeReplicaSuport = true;
        ct.deployTypeClusterSuport = false;

    })
;
