'use strict';

angular.module('iaas.controllers')
    .controller('iaasVrouterDetailCtrl', function ($scope, $location, $state, $stateParams, $timeout, $filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("iaasVrouterDetailCtrl.js : iaasVrouterDetailCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.param=[];

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
        ct.userInfo = $scope.main.userInfo;
        ct.actionBtn = false;
        ct.testBtn = false;
        ct.nsId = $stateParams.vrouterid;


        ct.fn.getVrouterDetailInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                nsId :ct.nsId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/vRouterServiceDetail', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                //    common.showAlert("message",data);
                if (!data.content) {
                    common.showAlert("message", 'No data');
                }
                ct.data.vRouterInfo = data.content.vRouterInfo;
               // ct.param.trgtenant= ct.data.vRouterInfo.srcTenantId
                $scope.main.loadingMainBody = false;
                ct.fn.getRotutingList();

            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };
        ct.fn.addNetwork = function() {
            var param = {
                tenantId : ct.param.trgtenant,
                nsId : ct.nsId,
                networkid:ct.param.network
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/Routing', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                //    common.showAlert("message",data);

                $scope.main.loadingMainBody = false;
                ct.fn.getRotutingList();

            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };
        ct.fn.routinfoDeleteAction= function(routinginfo) {
            var param = {
                nsId : routinginfo.nsId,
                tenantid : routinginfo.tenantId,
                networkid:routinginfo.networkid
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/Routing', 'DELETE', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                //    common.showAlert("message",data);

                $scope.main.loadingMainBody = false;
                ct.fn.getRotutingList();

            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };
        ct.fn.getTrgNetworkList = function() {
            _DebugConsoleLog("iaasVrouterDetailCtrl.js : vrouterDetailCtrl1111"+ct.param.trgtenant, 1);
           //alert( ct.data.trgTenant);
            if (!ct.param.trgtenant) {
                ct.data.network=null;
                return;
            }

            $scope.main.loadingMainBody = true;

            var param = {
                tenantId : ct.param.trgtenant,
                isExternal : false
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                //    common.showAlert("message",data);
                if (!data.content) {
                    common.showAlert("message", 'No data');
                }
                ct.data.network = data.content;
                $scope.main.loadingMainBody = false;


            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };
        ct.fn.getRotutingList = function() {

            //alert( ct.data.trgTenant);

            $scope.main.loadingMainBody = true;
            var param = {
                nsId :ct.nsId
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/Routing', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                //    common.showAlert("message",data);
                if (!data.content) {
                    common.showAlert("message", 'No data');
                }
                ct.data.routinginfo= data.content.vRouterRoutingInfos;
                $scope.main.loadingMainBody = false;


            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.getVrouterDetailInfo();

    })

;
