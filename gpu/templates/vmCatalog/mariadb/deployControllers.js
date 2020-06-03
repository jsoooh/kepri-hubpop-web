'use strict';

angular.module('gpu.controllers')
    .controller('mariadbDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mariadb deployControllers.js : mariadbDeployCtrl", 1);
        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.deployTypeReplicaSuport = true;
        ct.deployTypeClusterSuport = true;
        ct.data.replicaCnt = 2;

        ct.checkClickBtn = false;
        ct.fn.createVmCatalogDeploy = function () {
            if (ct.checkClickBtn) return;
            ct.checkClickBtn = true;
            if (!ct.vs.checkFormValidity($scope['subPage'])) {
                ct.checkClickBtn = false;
                return;
            }
        };

    })
;
