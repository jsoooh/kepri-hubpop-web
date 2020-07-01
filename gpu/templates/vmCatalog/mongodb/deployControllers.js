'use strict';

angular.module('gpu.controllers')
    .controller('mongodbDeployCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user, paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mongodb deployControllers.js : mongodbDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs: $scope.subPage});

        if (ct.testInput) {
            ct.data.deployName = "몽고DB";
            ct.data.stackName = "MongoDB";
            ct.data.deployType = "single";
            ct.data.servicePort = 20717;
            ct.data.adminId = "admin";
            ct.data.adminPassword = "Crossent!234";
            ct.data.adminConfirmPassword = "Crossent!234";
            ct.data.volumeUse = true;
            /*
            ct.data.deployName = "몽고DB클러스터";
            ct.data.stackName = "MongoDBCluster";
            ct.data.deployType = "cluster";
            ct.data.volumeUse = true;
            */
        }

        var checkPort = '9994';
        var port1 = '27020';
        var port2 = '27030';
        var port3 = '27040';
        var configPort = '27011';
        ct.usingPorts.cluster = [checkPort, port1, port2, port3, configPort];
        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
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
