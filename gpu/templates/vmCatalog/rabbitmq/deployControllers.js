'use strict';

angular.module('gpu.controllers')
    .controller('rabbitmqDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("hadoop deployControllers.js : rabbitmqDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;


        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.servicePort = 5672;
        ct.data.managementPort = 15672;
        ct.data.lbSvcPort = 5672;
        ct.data.checkPort = 9898;

        // 테스트 입력값
        ct.data.deployName = "래빗엠큐";
        ct.data.stackName = "Rabbitmq";

        ct.data.adminPassword = "Crossent!234";
        ct.data.adminConfirmPassword = "Crossent!234";
        ct.data.erlangCookie = "CMAXAFWPGKUBELOPUZOP";

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.amqp_port = ct.data.servicePort;
            vmCatalogDeploy.parameters.management_port = ct.data.managementPort;
            vmCatalogDeploy.parameters.admin_password = ct.data.adminPassword;
            if(ct.data.deployType == "cluster") {
                vmCatalogDeploy.parameters.erlang_cookie = ct.data.erlangCookie;
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
