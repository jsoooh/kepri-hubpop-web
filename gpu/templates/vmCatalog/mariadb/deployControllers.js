'use strict';

angular.module('gpu.controllers')
    .controller('mariadbDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mariadb deployControllers.js : mariadbDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.deployTypeReplicaSuport = true;
        ct.deployTypeClusterSuport = true;
        ct.data.replicaCnt = 2;
        ct.data.servicePort = 3306;
        ct.data.deployType = 'single';
        ct.data.cerateUser = true;
        ct.data.octaviaLbUse = true;
        ct.data.volumeUse = true;
        ct.data.lbSvcPort = 3306;
        ct.data.lbAlgorithm = "ROUND_ROBIN";
        ct.data.volumeType = "RBD";
        ct.data.volumeMountPoint = "/dev/vdb";
        ct.data.volumeMountPath = "/mnt/data";

        ct.checkClickBtn = false;

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            vmCatalogDeploy.parameters.root_password = ct.data.rootPassword;
            if (ct.data.cerateUser) {
                vmCatalogDeploy.parameters.create_user_id = ct.data.createUserId;
                vmCatalogDeploy.parameters.create_user_password = ct.data.createUserPassword;
                vmCatalogDeploy.parameters.create_db_name = ct.data.createDbName;
            }
        }

        subPage.fn.setTocDeployAction = function (deployTemplate) {
            ct.fn.createVmCatalogDeployAction(deployTemplate, subPage.fn.appendSetVmCatalogDeploy);
        }

        ct.fn.createVmCatalogDeploy = function () {
            if (!ct.fn.commCheckFormValidity(subPage)) return;

            ct.fn.loadTemplateAndCallAction(ct.data.deployType, subPage.fn.setTocDeployAction);
        };

    })
;
