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
        });

        /*목록 조회*/
        ct.fn.getObjectStorageList = function(){
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/objectStrage/containerList', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if(data.content) {
                    ct.objectStorageQuator = data.content.objecteStorageQuator;
                    ct.objectContainerList = data.content.objectContainers;

                    /*console.log("========ct.fn.getObjectStorageList======ct.objectStorageQuator==========");
                    console.log(ct.objectStorageQuator);
                    console.log("========ct.fn.getObjectStorageList======ct.objectContainerList==========");
                    console.log(ct.objectContainerList);*/
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

        ct.fn.changeContainerQuator = function() {
            if(ct.objectStorageQuator.containerQuator == '') {
                common.showAlert("message","컨테이너 할당량은 공백 일 수 없습니다.");
                return;
            }
            common.showConfirm('컨테이너 할당량 변경','컨테이너 할당량을 변경 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/objectStrage/containerQuata', 'PUT', {objecteStorageQuator:ct.objectStorageQuator});
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getObjectStorageList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                    $scope.main.loadingMainBody = false;
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };

        /*삭제 클릭*/
        ct.fn.deleteContainer = function(container) {
            container.tenantId = ct.data.tenantId;
            common.showConfirm('컨테이너 삭제',container.containerName+'를 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/objectStrage/container', 'DELETE', container);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getObjectStorageList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                    $scope.main.loadingMainBody = false;
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

        /*[접근정보조회] 클릭 이벤트*/
        ct.fn.accessInfoBtn = function($event) {
            if(Number(ct.objectStorageQuator.teamQuator) == 0) {
                common.showAlert("message","팀 할당량이 없어 접근정보를 조회 할 수 없습니다.");
                return;
            } else {
                ct.fn.accessInfo($event);
            }
        };

        /*[접근정보조회] 팝업 오픈*/
        ct.fn.accessInfo = function ($event) {
            $scope.dialogOptions = {
                controller : "iaasAccessInfoFormCtrl",
                callBackFunction : ct.fn.getObjectStorageList
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*열쇠 모양 버튼 클릭 : 오브젝트 스토리지 컨테이너 접근 권한 관리*/
        ct.fn.popAclInfo= function ($event,containerobj) {

            $scope.dialogOptions = {
                controller : "iaasAclInfoFormCtrl",
                callBackFunction : ct.fn.getObjectStorageList,
                container:containerobj
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        if(ct.data.tenantId) {
            ct.fn.getObjectStorageList();
        }

    })
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

        /*$scope.dialogOptions.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            $mdDialog.hide();
        };*/

        $scope.popCancel = function () {
            $mdDialog.hide();
        };

        pop.createObjectStorageAction = function() {
            pop.data.tenantId = pop.userTenant.tenantId;
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/objectStrage/container', 'POST', pop.data,'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/objectStrage/sendSecretInfo', 'GET', {tenantId:pop.userTenant.tenantId},'application/x-www-form-urlencoded');
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
    })
    .controller('iaasAclInfoFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : accessInfoFormCtrl", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.data = {};
        pop.pdata = {};
        pop.pdata = $scope.dialogOptions.container;
        pop.formName = "aclIfnoForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "오브젝트 스토리지 컨테이너 접근 권한 관리";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popContanerAclinfoForm.html" + _VersionTail();
        $scope.dialogOptions.okName = $translate.instant("label.confirm");

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            pop.fn.changeAclInfo();
            //$scope.popCancel();

        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.changeAclInfo= function (){
            //alert(pop.pdata.containerName);
            //alert(pop.pdata.tennantId);
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/objectStrage/Aclinfo', 'PUT', {objectStorageAclGroup:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $scope.popHide();

            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.getAclInfo= function (){
            //alert(pop.pdata.containerName);
            //alert(pop.pdata.tennantId);
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/objectStrage/Aclinfo', 'GET', {tenantId:pop.pdata.tennantId,containerName:pop.pdata.containerName},'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {

                pop.data = data.content;

            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };
        pop.fn.getAclInfo();

    })
;
