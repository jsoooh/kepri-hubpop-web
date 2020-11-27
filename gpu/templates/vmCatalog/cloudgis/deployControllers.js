'use strict';

angular.module('gpu.controllers')
    .controller('cloudgisDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("cloudgis deployControllers.js : cloudgisDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.replicaCnt = 2;
        ct.data.servicePort = ct.prodPortBand + 8080;
        ct.data.checkPort = 28080;
        ct.data.GIS1Port = ct.prodPortBand + 8081;
        ct.data.GIS2Port = ct.prodPortBand + 8081;
        ct.data.applicationName = "master01";

        ct.usingPorts.replica.push(ct.data.checkPort);

        ct.data.deployType = "single";
        ct.data.volumeUse = false;

        ct.testInput = true;
        // 테스트
        if (ct.testInput) {
            ct.data.deployName = "CloudGIS";
            ct.data.stackName = "CloudGISView";
            ct.data.deployType = "replica";
            ct.data.pgPort = "80";
            ct.data.pgPassword = "Crossent!234";
            ct.data.pgConfirmPassword = "Crossent!234";

        }

        ct.fn.cloudGISPortCustomValidationCheck = function(port, type) {
            if (port == undefined || port == null || port == "") return;
            if (ct.data.servicePort == ct.data.pgPort) {
                return {isValid : false, message: "cloudGIS 포트와 같은 포트는 사용할 수 없습니다."};
            } else {
                return {isValid: true};
            }
        };

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            vmCatalogDeploy.parameters.pg_password = ct.data.pgPassword;
            vmCatalogDeploy.parameters.pg_port = ct.data.pgPort;
            if (ct.data.deployType == "replica") {
                if (ct.data.checkPort == ct.data.servicePort) {
                    ct.data.checkPort++;
                }
                vmCatalogDeploy.parameters.check_port = ct.data.checkPort;
                vmCatalogDeploy.parameters.application_name = ct.data.applicationName;
                vmCatalogDeploy.parameters.repluser_password = ct.data.postgresPassword;
            }
            if (ct.data.deployType == "cluster") {
                vmCatalogDeploy.parameters.GIS1_Port = ct.data.GIS1Port;
                vmCatalogDeploy.parameters.GIS2_Port = ct.data.GIS2Port;
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
