'use strict';

angular.module('gpu.controllers')
    .controller('mysqlDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mysql deployControllers.js : mysqlDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.data.replicaCnt = 2;
        ct.data.servicePort = 3306;
        ct.data.lbSvcPort = 3306;
        ct.data.galeraPort = 4567;
        ct.data.checkPort = 9898;

        // 테스트 입력값
        ct.data.deployName = "마이에스큐엘";
        ct.data.stackName = "Mysql-Single";

        ct.data.rootPassword = "Crossent!234";
        ct.data.rootConfirmPassword = "Crossent!234";
        ct.data.createUser = true;
        ct.data.createUserId = "kepri";
        ct.data.createDbName = "kepri";
        ct.data.createUserPassword = "Kepri!234";
        ct.data.createUserConfirmPassword = "Kepri!234";


        ct.checkClickBtn = false;

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            if (ct.data.deployType == "cluster") {
                if (ct.data.servicePort == ct.data.galeraPort) {
                    ct.data.galeraPort++;
                }
                vmCatalogDeploy.parameters.galera_port = ct.data.galeraPort;
                vmCatalogDeploy.parameters.lb_algorithm = ct.data.lbAlgorithm;
                vmCatalogDeploy.parameters.lb_svc_port = ct.data.lbSvcPort;
            } else if (ct.data.deployType == "replica") {
                if (ct.data.servicePort == ct.data.checkPort) {
                    ct.data.checkPort++;
                }
                vmCatalogDeploy.parameters.check_port = ct.data.checkPort;
            }
            vmCatalogDeploy.parameters.root_password = ct.data.rootPassword;
            if (ct.data.createUser) {
                vmCatalogDeploy.parameters.create_user_id = ct.data.createUserId;
                vmCatalogDeploy.parameters.create_db_name = ct.data.createDbName;
                vmCatalogDeploy.parameters.create_user_password = ct.data.createUserPassword;
            }
            return vmCatalogDeploy;
        };

        subPage.fn.setTocDeployAction = function (deployTemplate) {
            ct.fn.createVmCatalogDeployAction(deployTemplate, subPage.fn.appendSetVmCatalogDeploy, false);
        };

        ct.fn.createVmCatalogDeploy = function () {
            if (!ct.fn.commCheckFormValidity(subPage)) return;

            ct.fn.loadTemplateAndCallAction(ct.data.deployType, subPage.fn.setTocDeployAction);  // (single/replica/cluster, )
        };

        ct.fn.loadPage();
    })
;
