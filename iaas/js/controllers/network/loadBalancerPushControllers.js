'use strict';

angular.module('iaas.controllers')
    .controller('iaasLoadBalancerPushCtrl', function ($scope, $location, $state, $stateParams, $filter, ValidationService, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("loadBalancerPushControllers.js : iaasLoadBalancerPushCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.nsId = $stateParams.nsId;
        ct.nfId = $stateParams.nfId;
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getLBServiceInfo();
        });

        ct.nextTab = function() {
            if(ct.activeTabIndex == 1) {
                if (!ct.data.name) {
                    common.showAlert("이름: 필수 입력 항목입니다.");
                    return;
                }
                if (!ct.data.listnerPort) {
                    common.showAlert("접속 정보: 필수 입력 항목입니다.");
                    return;
                }

                if (ct.data.healthProtocol == 'HTTP' ||ct.data.healthProtocol == 'HTTPS') {
                    if(!ct.data.healthUrl){
                        common.showAlert("상태확인 URL: 상태확인 프로토콜이 HTTP 혹은 HTTPS일 경우 필수 입력 항목입니다.");
                        return;
                    }
                }

                if(ct.data.sessionPersitenceType != 'APP_COOKIE') {
                    ct.data.cookieName = '';
                } else {
                    if(!ct.data.cookieName){
                        common.showAlert("쿠키 변수명: 세션유지타입이 APP_COOKIE일 경우 필수 입력 항목입니다.");
                        return;
                    }
                }


            } else if(ct.activeTabIndex == 2) {
                if(ct.data.listnerProtocol == 'SSL'){
                    if (!ct.data.sslPublicKey) {
                        common.showAlert("Public Key: 필수 입력 항목입니다.");
                        return;
                    }
                    if (!ct.data.sslPrivateKey) {
                        common.showAlert("Private Key : 필수 입력 항목입니다.");
                        return;
                    }
                }
            }
            if(ct.data.listnerProtocol != 'SSL') {
                ct.activeTabIndex = 3;
            } else {
                ct.activeTabIndex++;
            }
        }

        ct.previousTab = function () {
            if(ct.data.listnerProtocol !== 'SSL') {
                ct.activeTabIndex = 1;
                return;
            }
            ct.activeTabIndex--;
        }

        ct.fn.getLBServiceInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                nsId : ct.nsId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbService', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.lbService = data.content.lbNetworkService;
                if(!ct.lbService) {
                    $scope.main.moveToAppPage('/network/loadBalancer');
                } else {
                    ct.data.sessionPersitenceType = 'SOURCE_IP';
                    ct.data.algorithm = 'ROUND_ROBIN';
                    ct.data.listnerProtocol = 'HTTP';
                    ct.data.healthProtocol = 'PING';
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.pushLoadBalance = function() {
            common.showConfirm('Load Balance 추가','※ 로드밸런스를 추가 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                ct.data.nsId = ct.nsId;
                ct.data.nfId = ct.nfId;
                ct.data.vipAddres = ct.lbService.vip;

                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lb', 'POST', {loadbalancer : ct.data,tenantId : ct.data.tenantId});
                returnPromise.success(function (data, status, headers) {
                    $scope.main.moveToAppPage('/network/loadBalancer/'+ct.nsId);
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
            ct.fn.getLBServiceInfo();
        }
    })
;
