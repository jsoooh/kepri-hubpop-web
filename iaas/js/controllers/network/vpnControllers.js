'use strict';

angular.module('iaas.controllers')
    .controller('iaasVpnCtrl', function ($scope, $location, $state, $stateParams, $timeout, $filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("vpnControllers.js : iaasVpnCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.staus="ready";
        ct.reccovery="N";
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
        ct.userInfo = $scope.main.userInfo;
        ct.actionBtn = false;
        ct.testBtn = false;
        if($.inArray('company.manager',ct.userInfo.scope) != -1) {

            ct.actionBtn = true;

        }
       // common.showAlert("message",ct.userInfo.email);
        if(ct.userInfo.email == 'iaasManager@devkpaasta.com') {
            ct.testBtn= true;
          //  common.showAlert("message",'테스트용 계정으로 로그인함!!!!!');
        }
      //  if (ct.userinfo.email=='iaasManager@devkpaasta.com')
       // {
        //   common.showAlert("message","테스트용 계정으로 로그인함");
         // ct.testBtn= true;
        //}

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getVpnInfo();
        });

        ct.fn.getVpnInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/ipSecL2tp', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
            //    common.showAlert("message",data);
                if (!data.content) {
                    common.showAlert("message", 'No data');
                }
                ct.vpn = data.content.vpninfo;

                $timeout(ct.fn.getVpnUserList,2000);

            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.getVpnUserList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/members', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.vpnUsers = data.content.vpnUsers;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.changePsk = function() {
            common.showConfirm('PSK(pre shared key) 변경','pre shared key를 변경 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    psk : ct.vpn.psk
                }
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/vpnInfoPsk', 'PUT', param, 'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getVpnInfo();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                    $scope.main.loadingMainBody = false;
                });
            });
        }

        ct.fn.vpnStartStopAction = function(type) {
            var action = "시작";
            if(type == 'vpnServiceStop') {
                action = "종료";
            }
            common.showConfirm('VPN 서비스','서비스를 '+action+' 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId
                }
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/'+type, 'PUT', param, 'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getVpnInfo();
                   // ct.status="ready";
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                    $scope.main.loadingMainBody = false;
                });
            });
        }
        ct.fn.addMember = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/addMember', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.fn.getVpnUserList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });

        }
        ct.fn.vpnCreate = function() {
           // common.showAlert("message",'vpnCreate'+  ct.data.tenantId);
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/makeVpnNetworkService', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.fn.getVpnInfo();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        }
        ct.fn.vpnNetworkAdd = function() {
             common.showAlert("message",'vpnNetworkAdd111'+  ct.data.tenantId);
           $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/addVpnNetworkService', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.fn.getVpnInfo();
                $scope.main.loadingMainBody = false;
            });
           returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        }
        ct.fn.vpnDelete = function() {
          //  common.showAlert("message",'vpnDelete'+  ct.data.tenantId);

            if (ct.vpn.vip!="")
            {
                common.showAlert("message","정상적으로 생성된VPN은 삭제하실수 없습니다.");
                return;

            }

            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/deleteVpnNetworkService', 'DELETE', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.fn.getVpnInfo();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        }
        ct.fn.recover = function() {
            //  common.showAlert("message",'vpnDelete'+  ct.data.tenantId);

           // if (ct.vpn.vip!="")
           // {
           //     common.showAlert("message","정상적으로 생성된VPN은 삭제하실수 없습니다.");
            //    return;

           // }

            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/recoveryVpnNetworkService', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.fn.getVpnInfo();
                ct.reccovery="Y";
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        }

        if(ct.data.tenantId) {
            ct.fn.getVpnInfo();
        }
    })
;
