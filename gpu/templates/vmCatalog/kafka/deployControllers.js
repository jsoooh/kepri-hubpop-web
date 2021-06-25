'use strict';

angular.module('gpu.controllers')
    .controller('kafkaDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("kafka deployControllers.js : kafkaDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};
        var ct = $scope.$parent.$parent.contents;
        ct.vs = new ValidationService({controllerAs: $scope.subPage});

        ct.data.servicePort = ct.prodPortBand + 104;
        ct.data.zookeeperPort = ct.prodPortBand + 904;

        ct.usingPorts.cluster.push(2888);
        ct.usingPorts.cluster.push(3888);

        ct.data.deployType = "single";

        // cluster 테스트
        if (ct.testInput) {
            ct.data.deployName = "카프카";
            ct.data.stackName = "kafkaView";
            ct.data.deployType = "cluster";

        }

        ct.fn.kafkaPortCustomValidationCheck = function(port, type) {
            if (port == undefined || port == null || port == "") return;
            if (type == "kafka" && port == ct.data.zookeeperPort) {
                return {isValid : false, message: "zookeeper 포트와 같은 포트는 사용할 수 없습니다."};
            } else if (type == "zookeeper" && port == ct.data.servicePort) {
                return {isValid : false, message: "kafka 포트와 같은 포트는 사용할 수 없습니다."};
            } else {
                return {isValid: true};
            }
        };

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
            vmCatalogDeploy.parameters.zookeeper_port = ct.data.zookeeperPort;

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
