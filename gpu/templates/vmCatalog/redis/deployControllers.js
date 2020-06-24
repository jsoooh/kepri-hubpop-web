'use strict';

angular.module('gpu.controllers')
    .controller('redisDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("redis deployControllers.js : redisDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.clusterCnt = 3;
        ct.data.servicePort = 6379;
        ct.data.lbSvcPort = 6379;
        ct.data.redis1Port = 6379;
        ct.data.redis2Port = 6380;


        // 테스트 입력값
        if(ct.testInput) {
            ct.data.deployName = "레디스";
            ct.data.stackName = "Redis";

            ct.data.redisPassword = "Crossent!234";
            ct.data.redisConfirmPassword = "Crossent!234";
        }

        subPage.fn.appendSetVmCatalogDeplooy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            vmCatalogDeploy.parameters.security_group = ct.data.securityGroup;
            vmCatalogDeploy.parameters.redis_password = ct.data.redisPassword;
            if (ct.data.deployType == "cluster") {
                vmCatalogDeploy.parameters.lb_algorithm = ct.data.lbAlgorithm;
                vmCatalogDeploy.parameters.lb_svc_port = ct.data.lbSvcPort;
                vmCatalogDeploy.parameters.redis1_port = ct.data.redis1Port;
                vmCatalogDeploy.parameters.redis2_port = ct.data.redis2Port;
            }

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
