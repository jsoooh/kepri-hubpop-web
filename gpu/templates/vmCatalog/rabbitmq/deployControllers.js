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
        ct.data.epmdPort = 4369;
        ct.data.erlangPort = 25672;
        ct.data.ncCheckPort = 4444;

        ct.usingPorts.cluster = ['4369', '15672', '25672'];

        // 테스트 입력값
        if(ct.testInput) {
            ct.data.deployName = "래빗엠큐";
            ct.data.stackName = "rabbitmq";
            ct.data.adminPassword = "Crossent!234";
            ct.data.adminConfirmPassword = "Crossent!234";
        }

        ct.fn.createErlangCookie = function() {
            var alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var erlangCookie = "";

            for (var i=0; i<20; i++) {
                erlangCookie += alphabet.charAt(Math.floor(Math.random()*alphabet.length));
            }

            return erlangCookie;
        };

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.amqp_port = ct.data.servicePort;
            vmCatalogDeploy.parameters.management_port = ct.data.managementPort;
            vmCatalogDeploy.parameters.epmd_port = ct.data.epmdPort;
            vmCatalogDeploy.parameters.erlang_port = ct.data.erlangPort;
            vmCatalogDeploy.parameters.admin_password = ct.data.adminPassword;
            if(ct.data.deployType == "cluster") {
                if(ct.data.servicePort == ct.data.ncCheckPort) {
                    ct.data.ncCheckPort++;
                }
                ct.data.erlangCookie = ct.fn.createErlangCookie();
                vmCatalogDeploy.parameters.erlang_cookie = ct.data.erlangCookie;
                vmCatalogDeploy.parameters.nc_check_port = ct.data.ncCheckPort;
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
