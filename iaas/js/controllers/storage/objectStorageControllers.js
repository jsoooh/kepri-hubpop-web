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
                if(data.content) {
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


        /*[생성(+)] 클릭*/
        ct.fn.createStorageObjectBtn = function($event) {
            if(Number(ct.objectStorageQuator.teamQuator) == 0) {
                common.showAlert("message","팀 할당량이 없어 오브젝트 스토리지를 생성 할 수 없습니다.");
                return;
            } else {
                ct.fn.createStorageObject($event);
            }
        };

        /*[생성(+)] 팝업 오픈*/
        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.createStorageObject = function ($event) {
            $scope.dialogOptions = {
                controller : "iaasObjectStorageFormCtrl",
                callBackFunction : ct.fn.getObjectStorageList
            };
            $scope.actionBtnHied = false;
            common.showRightDialog($scope, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        if(ct.data.tenantId) {
            ct.fn.getObjectStorageList();
            ct.fn.getSendSecretInfoList();
        }
    })
    //오브젝트스토리지 생성 컨트롤
    .controller('iaasObjectStorageFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageFormCtrl", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.fn = {};
        pop.data = {};
        pop.formName = "objectStorageForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "오브젝트 스토리지 생성";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popObjectStorageForm.html" + _VersionTail();
        $scope.dialogOptions.okName = $translate.instant("label.confirm");

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.createObjectStorageAction();
        };

        $scope.popCancel = function () {
            $mdDialog.hide();
        };

        pop.createObjectStorageAction = function() {
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
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    })

  //오브젝트스토리지 접근 정보 컨트롤러
    .controller('iaasAccessInfoFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : iaasAccessInfoFormCtrl", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.data = {};

        pop.formName = "objectStorageForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "오브젝트 스토리지 접근 정보";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popAccessInfoForm.html" + _VersionTail();
        $scope.dialogOptions.okName = $translate.instant("label.confirm");

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            $scope.popCancel();
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };
        /*내용 클릭 시 내용 copy*/
        pop.fn.selectInput = function($event) {
            $(event.target).select();
            document.execCommand('copy');
        };

        pop.fn.sendSecretInfo = function() {
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/sendSecretInfo', 'GET', {tenantId:pop.userTenant.tenantId},'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.secret = data.content.secret;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.sendSecretInfo();
    });
