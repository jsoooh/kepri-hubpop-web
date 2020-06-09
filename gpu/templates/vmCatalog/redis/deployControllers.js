'use strict';

angular.module('gpu.controllers')
    .controller('redisDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("redis deployControllers.js : redisDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.deployTypeReplicaSuport = false;
        ct.deployTypeClusterSuport = true;

    })
;
