'use strict';

angular.module('gpu.controllers')
    .controller('mongodbDeployCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user, paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mongodb deployControllers.js : mongodbDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs: $scope.subPage});

        ct.data.clusterCnt = 3;
        ct.data.servicePort = 27017;
        ct.data.checkPort = 9994;
        ct.data.mongoPort1 = 27020;
        ct.data.mongoPort2 = 27030;
        ct.data.mongoPort3 = 27040;
        ct.data.configPort = 27011;

        ct.usingPorts.cluster.push(27020);
        ct.usingPorts.cluster.push(27030);
        ct.usingPorts.cluster.push(27040);
        ct.usingPorts.cluster.push(27011);

        ct.data.deployType = "single";
        ct.data.adminId = "admin";
        ct.data.volumeUse = false;

        if (ct.testInput) {
            ct.data.deployName = "몽고DB";
            ct.data.stackName = "MongoDB";
            ct.data.adminPassword = "Crossent!234";
            ct.data.adminConfirmPassword = "Crossent!234";
            /*
            ct.data.deployName = "몽고DB클러스터";
            ct.data.stackName = "MongoDBCluster";
            ct.data.deployType = "cluster";
            ct.data.volumeUse = true;
            */
        }

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            if (ct.data.deployType == "cluster") {
                if (ct.data.servicePort == ct.data.checkPort) {
                    ct.data.checkPort++;
                }
                vmCatalogDeploy.parameters.check_port = ct.data.checkPort;
                vmCatalogDeploy.parameters.mongo_port1 = ct.data.mongoPort1;
                vmCatalogDeploy.parameters.mongo_port2 = ct.data.mongoPort2;
                vmCatalogDeploy.parameters.mongo_port3 = ct.data.mongoPort3;
                vmCatalogDeploy.parameters.config_port = ct.data.configPort;
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
