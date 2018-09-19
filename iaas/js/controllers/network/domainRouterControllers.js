'use strict';

angular.module('iaas.controllers')
    .controller('iaasDomainRouterCtrl', function ($scope, $location, $state, $stateParams,$filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("domainRouterControllers.js : iaasDomainRouterCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.userTenant = $scope.main.userTenant;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getFloatingIpsList();
        });
        
        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled

        ct.fn.getDomainRouter = function() {
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/dnsRouter/instance', 'GET');
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isObject(data.content)) {
                    ct.domainRouter = data.content;
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.getFloatingIpsList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            };
            ct.floatingIpsList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps/domain', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.floatingIpsList = data.content;
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        };

        ct.fn.domainListControllClick = function (evt) {
            var target = $(evt.currentTarget);
            // 작은 화살표
            if(target.hasClass("ico-right")){ // 오른쪽 누르면 펼치기
                target.removeClass("ico-right").addClass("ico-left");
                target.parent().parent().parent().parent().find("ul.domainList").first().css( "display", "block" );
            }
            else if(target.hasClass("ico-left")){ // 왼쪽 누르면 숨기기
                target.removeClass("ico-left").addClass("ico-right");
                target.parent().parent().parent().parent().find("ul.domainList").first().css( "display", "none" );
            }
            // 큰 화살표
            else if(target.hasClass("ico-big-right")){ // 오른쪽 누르면 펼치기
                target.removeClass("ico-big-right").addClass("ico-big-left");
                target.parent().parent().find("ul.domainList").first().css( "display", "block" );
            }
            else if(target.hasClass("ico-big-left")){ // 왼쪽 누르면 숨기기
                target.removeClass("ico-big-left").addClass("ico-big-right");
                target.parent().parent().find("ul.domainList").first().css( "display", "none" );
            }
        };

        ct.fn.publicIpAllotment = function() {
            common.showConfirm('공인IP 할당','※공인IP를 추가 할당 하시겠습니까?').then(function(){
                var param = {
                    tenantId : ct.data.tenantId,
                    action : "allocate"
                };
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'POST', param,'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getPublicIpList();
                    $scope.main.loadingMainBody = false;
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert("메세지",data.message);
                });
            });
        };

        /*반납*/
        ct.fn.publicIpReturn = function(publicIp) {
            common.showConfirm('공인IP 반납','※선택된 공인IP를 반납 하시겠습니까?').then(function(){
                ct.returnPublicIpsAction(publicIp);
            });
        };

        /*반납 : 실제 액션*/
        ct.returnPublicIpsAction = function(publicIp) {
            var prom = [];
            prom.push(ct.returnPublicIpJob(publicIp));

            $scope.main.loadingMainBody = true;
            $q.all(prom).then(function(results){
                ct.fn.getFloatingIpsList();
                ct.roles = [];
                $scope.main.loadingMainBody = false;
            }).catch(function(e){
                $scope.main.loadingMainBody = false;
                common.showAlert('메세지','오류가 발생하였습니다.');
            });
        };

        /*반납 : 실제 액션2*/
        ct.returnPublicIpJob = function(floatingIp) {
            var deferred = $q.defer();
            var param = {
                tenantId : ct.data.tenantId,
                action : "deallocate",
                floatingIpId : floatingIp.id
            };
            var returnData = common.noMsgSyncHttpResponseJson(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'POST', param,'application/x-www-form-urlencoded');
            if(returnData.status == 200) {
                deferred.resolve(true);
            } else {
                deferred.reject(false);
            }
        };

        /*연결해제*/
        ct.fn.publicIpDeallot = function(publicIp) {
            common.showConfirm('접속IP 연결해제','※'+publicIp.instanceName+'에서 접속IP '+publicIp.floatingIp+'를 연결 해제 하시겠습니까?').then(function(){
                var param = {
                    instanceId : publicIp.instanceId,
                    tenantId : ct.data.tenantId,
                    floatingIp : publicIp.floatingIp,
                    action : "detach"
                };
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.fn.getPublicIpList();
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert("메세지",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                });
            });
        };

        /*인스턴스연결 클릭 : 인스턴스 조회 팝업 오픈*/
        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.publicIpAttach = function ($event, publicIp) {
            $scope.dialogOptions = {
                controller : "iaasPublicIpInstanceConnectFormCtrl",
                callBackFunction : ct.fn.getPublicIpList,
                publicIp : publicIp
            };
            $scope.actionBtnHied = false;
            //common.showDialog($scope, $event, $scope.dialogOptions);
            common.showRightDialog($scope, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        if(ct.data.tenantId) {
            ct.fn.getDomainRouter();
            ct.fn.getFloatingIpsList();
        }
    })
;
