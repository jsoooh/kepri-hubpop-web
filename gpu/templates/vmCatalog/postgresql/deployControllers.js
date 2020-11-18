'use strict';

angular.module('gpu.controllers')
    .controller('postgresqlDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("postgresql deployControllers.js : postgresqlDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.replicaCnt = 3;
        ct.data.servicePort = ct.prodPortBand + 5432;
        ct.data.checkPort = 25432;
        ct.data.applicationName = "master01";

        ct.usingPorts.replica.push(ct.data.checkPort);

        ct.data.deployType = "single";
        ct.data.volumeUse = false;
        ct.data.createUser = true;

        // 테스트
        if (ct.testInput) {
            ct.data.deployName = "포스트그래스SQL";
            ct.data.stackName = "postgresSqlView";
            ct.data.deployType = "replica";
            ct.data.postgresPassword = "Crossent!234";
            ct.data.postgresConfirmPassword = "Crossent!234";

            ct.data.createUser = true;
            ct.data.createUserId = "kepri";
            ct.data.createDbName = "kepri";
            ct.data.createUserPassword = "Kepri!234";
            ct.data.createUserConfirmPassword = "Kepri!234";
        }

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            if (ct.data.deployType == "replica") {
                if (ct.data.checkPort == ct.data.servicePort) {
                    ct.data.checkPort++;
                }
                vmCatalogDeploy.parameters.check_port = ct.data.checkPort;
                vmCatalogDeploy.parameters.application_name = ct.data.applicationName;
                vmCatalogDeploy.parameters.repluser_password = ct.data.postgresPassword;
            }
            vmCatalogDeploy.parameters.postgres_password = ct.data.postgresPassword;

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
