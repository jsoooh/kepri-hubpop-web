'use strict';

angular.module('gpu.controllers')
    .controller('tomcatDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("tomcat deployControllers.js : tomcatDeployCtrl", 1);
        var ct = $scope.$parent.$parent.contents;

        ct.deployTypeReplicaSuport = false;
        ct.deployTypeClusterSuport = true;

    })
;