'use strict';

angular.module('iaas.controllers')
    .controller('networkExpansionCtrl', function ($scope, $location, $state, $stateParams,$filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("networkExpansionControllers.js : networkExpansionCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getNetworkList();
        });

        ct.fn.getNetworkList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.networkMainList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.networkAction = function($event,network) {
            $scope.dialogOptions = {
                controller : "networkActionFormCtrl",
                callBackFunction : ct.fn.getNetworkList,
                network : network
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        }

        ct.fn.deleteNetwork = function(network) {
            common.showConfirm('네트워크 삭제','※' + network.description + '를 삭제 하시겠습니까?').then(function(){
                var param = {
                    tenantId : ct.data.tenantId,
                    networkId : network.id
                };
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getNetworkList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }

        if(ct.data.tenantId) {
            ct.fn.getNetworkList();
        }
    })
;
