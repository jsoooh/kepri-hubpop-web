'use strict';

angular.module('gpu.controllers')
    .controller('cloudgisDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("cloudgis deployControllers.js : cloudgisDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.replicaCnt = 2;
        ct.data.servicePort = ct.prodPortBand + 281;
        ct.data.pgPort = ct.prodPortBand + 301;
        ct.data.checkPort = 28080;
        ct.data.GIS1Port = ct.prodPortBand + 901;
        ct.data.GIS2Port = ct.prodPortBand + 901;
        ct.data.applicationName = "master01";

        ct.usingPorts.replica.push(ct.data.checkPort);

        ct.data.deployType = "single";
        ct.data.volumeUse = false;

        // 테스트
        if (ct.testInput) {
            //ct.data.deployName = "CloudGIS";
            //ct.data.stackName = "CloudGISView";
            ct.data.deployType = "single";
            ct.data.pgPort = "5432";
            //ct.data.pgPassword = "Crossent!234";
            //ct.data.pgConfirmPassword = "Crossent!234";

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
            vmCatalogDeploy.parameters.CGIS_PORT_WEB = ct.data.servicePort;
            vmCatalogDeploy.parameters.pg_password = ct.data.pgPassword;
            vmCatalogDeploy.parameters.CGIS_PORT_POSTGRES = ct.data.pgPort;
            vmCatalogDeploy.parameters.CGIS_DIST_TYPE = "D01";
            vmCatalogDeploy.context.CgisDistType = "D01";

            if (ct.data.deployType == "replica") {
                vmCatalogDeploy.parameters.CGIS_DIST_TYPE = "D02";
                vmCatalogDeploy.context.CgisDistType = "D02";
            }
            if (ct.data.deployType == "cluster1") {
                vmCatalogDeploy.parameters.CGIS_DIST_TYPE = "D03";
                vmCatalogDeploy.context.CgisDistType  = "D03";
            }
            if (ct.data.deployType == "cluster2") {
                vmCatalogDeploy.parameters.CGIS_DIST_TYPE = "D05";
                vmCatalogDeploy.context.CgisDistType  = "D05";
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
