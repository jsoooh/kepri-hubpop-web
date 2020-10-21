'use strict';

angular.module('gpu.controllers')
    .controller('kongDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("kong deployControllers.js : kongDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.pgPort = ct.prodPortBand + 5432;
        ct.data.kongaPort = ct.prodPortBand + 1337;
        ct.data.kongUserId = "kong";
        ct.data.kongDbName = "kong";
        ct.data.kongaUserId = "konga";
        ct.data.kongaDbName = "konga";

        ct.usingPorts.single.push(8443);
        ct.usingPorts.single.push(8444);
        ct.usingPorts.single.push(8000);
        ct.usingPorts.single.push(8001);

        // 테스트
        if (ct.testInput) {
            ct.data.deployName = "API 게이트웨이 콩";
            ct.data.stackName = "kong";

            ct.data.pgPassword = "Crossent!234";
            ct.data.pgConfirmPassword = "Crossent!234";
            ct.data.kongUserPassword = "Crossent!234";
            ct.data.kongUserConfirmPassword = "Crossent!234";
            ct.data.kongaUserPassword = "Crossent!234";
            ct.data.kongaUserConfirmPassword = "Crossent!234";
        }

        ct.fn.kongPortCustomValidationCheck = function(port, type) {
            if (port == undefined || port == null || port == "") return;
            if (type == "konga" && port == ct.data.pgPort) {
                return {isValid : false, message: "DB 포트와 같은 포트는 사용할 수 없습니다."};
            } else if (type == "pg" && port == ct.data.kongaPort) {
                return {isValid : false, message: "Konga 포트와 같은 포트는 사용할 수 없습니다."};
            } else {
                return {isValid: true};
            }
        };

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.pg_port = ct.data.pgPort;
            vmCatalogDeploy.parameters.pg_password = ct.data.pgPassword;
            vmCatalogDeploy.parameters.konga_port = ct.data.kongaPort;
            vmCatalogDeploy.parameters.kong_user_id = ct.data.kongUserId;
            vmCatalogDeploy.parameters.kong_db_name = ct.data.kongDbName;
            vmCatalogDeploy.parameters.kong_user_password = ct.data.kongUserPassword;
            vmCatalogDeploy.parameters.konga_user_id = ct.data.kongaUserId;
            vmCatalogDeploy.parameters.konga_db_name = ct.data.kongaDbName;
            vmCatalogDeploy.parameters.konga_user_password = ct.data.kongaUserPassword;
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
