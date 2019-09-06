'use strict';

angular.module('iaas.controllers')
    .controller('iaasLoadbalancerDetailCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasLoadbalancerDetailCtrl", 1);

        $scope.actionBtnEnabled = true;

        var ct 				    = this;
        ct.list 			        = {};
        ct.fn 				    = {};
        ct.data 			    = {};
        ct.roles 			    = [];
        ct.loadbalancer         = {};
        ct.data.tenantId        = $scope.main.userTenant.id;
        ct.data.tenantName      = $scope.main.userTenant.korName;
        ct.data.loadbalancerId  = $stateParams.lbInfoId;

        ct.fn.formOpen = function($event, state, data){
            ct.formType = state;
            if(state == 'storage')
            {
                ct.fn.createStorage($event);
            }
            else if (state == 'snapshot')
            {
                ct.fn.createPopSnapshot($event,data);
            }
            else if (state == 'rename')
            {
                ct.fn.reNamePopLb($event,data);
            }
        };

        ct.fn.reNamePopLb = function($event, lbservice) {

            var dialogOptions =  {
                controller              : "iaasReNamePopLoadBalancerCtrl" ,
                formName                : 'iaasReNamePopLoadBalancerForm',
                selectLoadBalancer      : angular.copy(lbservice),
                callBackFunction        : ct.reNamePopLoadBalancerCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.reNamePopLoadBalancerCallBackFunction = function () {
            ct.fngetLbList();
        };

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
            ct.fnGetUsedResource();
            ct.getLb();
        });

        //추가 S
        ct.fnGetUsedResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params));
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
        };

        // 개별 loadbalancer 조회
        ct.getLb = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                loadBalancerId : ct.data.loadbalancerId,
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.loadbalancer = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.deleteLb = function(id) {
            common.showConfirm('LB 삭제','선택한 LB를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    loadBalancerId : id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        common.showAlertSuccess('삭제되었습니다.');
                        $scope.main.goToPage('/iaas/compute');
                    } else {
                        $scope.main.loadingMainBody = false;
                        common.showAlertError('오류가 발생하였습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        if (ct.data.tenantId) {
            ct.fnGetUsedResource();
            ct.getLb();
        } else { // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해 주세요.');
            showAlert.then(function () {
                $scope.main.goToPage("/");
            });
            return false;
        }
    })

    .controller('iaasReNamePopLoadBalancerCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasReNamePopLoadBalancerCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.sltLoadBalancer = $scope.dialogOptions.selectLoadBalancer.iaasLbInfo;
        pop.lbserviceLists = angular.copy($scope.contents.lbServiceLists);
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title = "이름/설명 변경";
        $scope.dialogOptions.okName = "변경";
        $scope.dialogOptions.closeName = "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/reNameLoadBalancerPopForm.html" + _VersionTail();

        $scope.actionLoading = false;
        pop.btnClickCheck = false;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            pop.fn.loadBalancerNameValidationCheck();
        };

        $scope.popCancel = function () {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        pop.fn.loadBalancerNameValidationCheck = function () {
            var params = {
                tenantId: pop.sltLoadBalancer.tenantId,
                loadBalancerId: pop.sltLoadBalancer.id,
                name: pop.newLbNm,
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/check_name', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                pop.fn.reNmLb();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
                common.showAlertError("message", data.message);
            });
        };

        pop.fn.reNmLb = function () {
            $scope.main.loadingMainBody = true;

            var params = {
                id: pop.sltLoadBalancer.id,
                tenantId: pop.sltLoadBalancer.tenantId,
                name: pop.newLbNm,
                description: pop.sltLoadBalancer.description
            };

            common.mdDialogHide();
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'PUT', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("부하분산 서버 이름/설명이 변경 되었습니다.");

                if (angular.isFunction(pop.callBackFunction)) {
                    pop.callBackFunction();
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        }
    })
;
