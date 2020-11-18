'use strict';

angular.module('gpu.controllers')
    .controller('nginxDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("nginx deployControllers.js : nginxDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.lbSvcPort = ct.prodPortBand + 80;
        ct.data.servicePort = ct.prodPortBand + 80;

        // 테스트
        if (ct.testInput) {
            ct.data.deployName = "엔진엑스";
            ct.data.stackName = "nginxView";
            ct.data.deployType = "cluster";
            ct.data.octaviaLbUse = true;
        }

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            if (vmCatalogDeploy.octaviaLbUse) {
                vmCatalogDeploy.context.monitorUrlPathUse = true;
                vmCatalogDeploy.parameters.lb_svc_protocol = "HTTP";
                vmCatalogDeploy.parameters.lb_svc_monitor_type = "HTTP";
                vmCatalogDeploy.parameters.lb_svc_monitor_url_path = "/";
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
