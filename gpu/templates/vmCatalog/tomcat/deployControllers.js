'use strict';

angular.module('gpu.controllers')
    .controller('tomcatDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("tomcat deployControllers.js : tomcatDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.lbSvcPort = 8080;
        ct.data.servicePort = 8080;

        // 선택 불가 포트
        ct.usingPorts.single.push(8005);
        ct.usingPorts.single.push(8009);

        ct.usingPorts.cluster.push(8005);
        ct.usingPorts.cluster.push(8009);

        // 테스트
        if (ct.testInput) {
            ct.data.deployName = "톰캣";
            ct.data.stackName = "tomcat";
            ct.data.deployType = "single";
            ct.data.octaviaLbUse = false;
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
