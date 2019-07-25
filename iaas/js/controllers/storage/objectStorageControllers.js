'use strict';

angular.module('iaas.controllers')
    .controller('iaasObjectStorageCtrl', function ($scope, $location, $state,$translate,$filter, $stateParams, user, $q,paging, common, CONSTANTS) {
        _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.objectStorageQuator = {};
        ct.roles = [];

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getObjectStorageList();
            ct.fn.getSendSecretInfoList();
        });
        ct.presentDate = function(){
            ct.toDay = moment(new Date()).format('YYYY-MM-DD');
        }

        /*오브젝트 저장소 목록,정보,용량 조회*/
        ct.fn.getObjectStorageList = function(){
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/containerList', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    ct.objectStorageList = data.content.objectContainers;
                    ct.objecteStorageQuator = data.content.objecteStorageQuator
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //접속정보 조회
        ct.fn.getSendSecretInfoList = function(){
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/sendSecretInfo', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    ct.sendSecretInfoList = data.content.secret
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

         /*삭제 클릭*/
        ct.fn.deleteObjectBucket = function(objectName) {
            common.showConfirm('저장소 삭제','선택한 저장소를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    bucket : objectName
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        common.showAlertSuccess('삭제되었습니다.');
                        ct.fn.getObjectStorageList();
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
        ct.fn.createObjectStoragePop = function($event) {

            var dialogOptions =  {
                controller       : "iaasObjectStorageFormCtrl" ,
                callBackFunction : ct.objectStorageCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.objectStorageCallBackFunction = function () {
            ct.fn.getObjectStorageList();
        };



        if (ct.data.tenantId) {
            ct.fn.getObjectStorageList();
            ct.fn.getSendSecretInfoList();
            ct.presentDate();
        }
    })
    //오브젝트스토리지 생성 컨트롤
    .controller('iaasObjectStorageFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageFormCtrl", 1);
        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "저장소 생성";
        $scope.dialogOptions.okName 	= "생성";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popObjectStorageForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (!pop.validationService.checkFormValidity(pop[pop.formName]))
            {
                $scope.actionBtnHied = false;
                return;
            }
            pop.fn.createObjectStorageAction();
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        pop.fn.createObjectStorageAction = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            var params = {
                tenantId : pop.data.tenantId,
                bucket : pop.data.containerName
            };
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket', 'POST',params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("저장소가 생성되었습니다.");
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    })

