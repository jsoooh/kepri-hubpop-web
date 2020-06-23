'use strict';

angular.module('gpu.controllers')
    .controller('mongodbDeployCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user, paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mongodb deployControllers.js : mongodbDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs: $scope.subPage});

        // single 테스트
        ct.data.servicePort = 20717;
        ct.data.deployName = "몽고DB";
        ct.data.stackName = "MongoDB";
        ct.data.volumeUse = true;

        ct.data.adminId = "admin";
        ct.data.adminPassword = "Crossent!234";
        ct.data.adminConfirmPassword = "Crossent!234";

        /*
        ct.data.servicePort = 20717;
        //ct.data.lbSvcPort = 20717;
        //ct.data.galeraPort = 4567;
        //ct.data.checkPort = 9898;

        //테스트
        ct.data.deployName = "몽고DB";
        ct.data.stackName = "MongoDB";
        //ct.data.deployType = //"cluster";
        //ct.data.octaviaLbUse = //true;
        ct.data.volumeUse = true;

        ct.data.adminId = "admin";
        ct.data.adminPassword = "Crossent!234";
        ct.data.adminConfirmPassword = "Crossent!234";
        //ct.data.createUser = true;
        //ct.data.createUserId = "kepri";
        //ct.data.createDbName = "kepri";
        //ct.data.createUserPassword = "Kepri!234";
        //ct.data.createUserConfirmPassword = "Kepri!234";
         */
        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            if (ct.data.deployType == "cluster") {
                if (ct.data.servicePort == ct.data.galeraPort) {
                    ct.data.galeraPort++;
                }
                vmCatalogDeploy.parameters.galera_port = ct.data.galeraPort;
                //vmCatalogDeploy.parameters.lb_algorithm = ct.data.lbAlgorithm;
                //vmCatalogDeploy.parameters.lb_svc_port = ct.data.lbSvcPort;
            }
            vmCatalogDeploy.parameters.admin_id = ct.data.adminId;
            vmCatalogDeploy.parameters.admin_password = ct.data.adminPassword;

            return vmCatalogDeploy;
        };

        subPage.fn.setTocDeployAction = function (deployTemplate) {
            ct.fn.createVmCatalogDeployAction(deployTemplate, subPage.fn.appendSetVmCatalogDeploy, false);
        };

        ct.fn.createVmCatalogDeploy = function () {
            if (!ct.fn.commCheckFormValidity(subPage)) return;

            ct.fn.loadTemplateAndCallAction(ct.data.deployType, subPage.fn.setTocDeployAction);
        };

        ct.fn.loadPage();

    })
;
