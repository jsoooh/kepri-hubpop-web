'use strict';

angular.module('gpu.controllers')
.controller('gpuVmCatalogDeployListCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user,paging, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployListCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};

    ct.pageOptions = {
        currentPage : 1,
        pageSize : 10,
        total : 0
    };

    ct.fn.openVmCatalogDeployRenameForm = function ($event, vmCatalogDeploy) {
        $scope.dialogOptions = {
            controller : "gpuVmCatalogDeployRenameCtrl",
        };
        $scope.actionBtnHied = false;
        common.showDialog($scope, $event, $scope.dialogOptions);
        $scope.actionLoading = true; // action loading
    };

})
.controller('gpuVmCatalogDeployRenameCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, common, ValidationService, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployRenameCtrl", 1);

    var pop               = this;
    pop.tenantId          = $scope.main.userTenantGpuId;
    pop.fn                = {};

    $scope.actionLoading = false;

    pop.fn = {};
    pop.data = {};
    pop.data.vmCatlog = {};

    pop.method = "PUT";
    pop.formName = "vmCatalogDeployRenamePopForm";
    $scope.dialogOptions.formName = pop.formName;
    $scope.dialogOptions.validDisabled = true;
    $scope.dialogOptions.dialogClassName = "modal-dialog";
    $scope.dialogOptions.title = "서비스 이름 수정";
    $scope.dialogOptions.okName 	= "수정";
    $scope.dialogOptions.closeName 	= "닫기";
    $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + '/vmCatalog/vmCatalogDeployRenamePopForm.html' + _VersionTail();

    // Dialog ok 버튼 클릭 시 액션 정의
    $scope.popDialogOk = function () {
        if ($scope.actionBtnHied) return;
        $scope.actionBtnHied = true;
        $scope.popCancel();
    };

    $scope.popCancel = function () {
        $scope.popHide();
    };

})
.controller('gpuVmCatalogDeployViewCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployViewCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};

})
;
