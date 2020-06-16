'use strict';

angular.module('gpu.controllers')
    .controller('mongodbDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mongodb deployControllers.js : mongodbDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.deployTypeReplicaSupport = false;
        ct.deployTypeClusterSupport = true;

        ct.fn.loadPage();

    })
;
