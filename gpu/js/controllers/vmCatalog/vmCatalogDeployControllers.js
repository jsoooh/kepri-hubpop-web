'use strict';

angular.module('gpu.controllers')
.controller('gpuVmCatalogDeployListCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user,paging, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployListCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};

    ct.vmCatalogDeployList = [];
    ct.schFilterText = "";

    ct.fn.listAllVmCatalogDeploy = function (tenantId) {
        $scope.main.loadingMainBody = true;
        var promise = vmCatalogService.listAllVmCatalogDeploy(tenantId);
        promise.success(function (data) {
            if (angular.isArray(data.content)) {
                ct.vmCatalogDeployList = data.content;
            } else {
                ct.vmCatalogDeployList = [];
            }
            $scope.main.loadingMainBody = false;
        });
        promise.error(function (data, status, headers) {
            ct.vmCatalogDeployList = [];
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.openVmCatalogDeployRenameForm = function ($event, vmCatalogDeploy) {
        $scope.dialogOptions = {
            controller: "gpuVmCatalogDeployRenameCtrl",
            vmCatalogDeploy: vmCatalogDeploy,
            callBackFunction: ct.fn.pageReplace
        };
        $scope.actionBtnHied = false;
        common.showDialog($scope, $event, $scope.dialogOptions);
        $scope.actionLoading = true; // action loading
    };

    ct.fn.deleteVmCatalogDeploy = function (tenantId, vmCatalogDeploy) {
        common.showConfirm("서비스 삭제", "선택한 '" + vmCatalogDeploy.deployName + "'서비스를 삭제하시겠습니까?").then(function(){
            $scope.main.loadingMainBody = true;
            var promise = vmCatalogService.deleteVmCatalogDeploy(tenantId, vmCatalogDeploy.id);
            promise.success(function (data) {
                common.showAlertSuccess("삭제되었습니다.");
                ct.fn.pageReplace();
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        });
    };

    ct.fn.pageReplace = function () {
        ct.fn.listAllVmCatalogDeploy(ct.tenantId);
    }

    ct.fn.pageReplace();

})
.controller('gpuVmCatalogDeployRenameCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, common, ValidationService, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployRenameCtrl", 1);

    var pop               = this;
    pop.tenantId          = $scope.main.userTenantGpuId;
    pop.fn                = {};

    $scope.actionLoading = false;

    pop.fn = {};
    pop.data = {};

    pop.method = "PUT";
    pop.formName = "vmCatalogDeployRenamePopForm";
    pop.callBackFunction = $scope.dialogOptions.callBackFunction;
    $scope.dialogOptions.formName = pop.formName;
    $scope.dialogOptions.dialogClassName = "modal-dialog";
    $scope.dialogOptions.title = "서비스 이름 수정";
    $scope.dialogOptions.okName 	= "수정";
    $scope.dialogOptions.closeName 	= "닫기";
    $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + '/vmCatalog/vmCatalogDeployRenamePopForm.html' + _VersionTail();

    pop.vmCatalogDeploy = angular.copy($scope.dialogOptions.vmCatalogDeploy);
    pop.data.deployName = pop.vmCatalogDeploy.deployName;

    pop.fn.renameVmCatalogDeploy = function (tenantId, deployId, deployName) {
        $scope.actionLoading = false;
        var promise = vmCatalogService.renameVmCatalogDeploy(tenantId, deployId, deployName);
        promise.success(function (data) {
            $scope.actionLoading = false;
            $scope.actionBtnHied = false;
            $scope.popCancel();
            common.showAlertSuccess("수정 되었습니다.");
            if (angular.isFunction(pop.callBackFunction)) {
                pop.callBackFunction(data);
            }
        });
        promise.error(function (data, status, headers) {
            $scope.actionLoading = false;
            $scope.actionBtnHied = false;
            $scope.popCancel();
        });
    };

    // Dialog ok 버튼 클릭 시 액션 정의
    $scope.popDialogOk = function () {
        if ($scope.actionBtnHied) return;
        $scope.actionBtnHied = true;
        pop.fn.renameVmCatalogDeploy(pop.tenantId, pop.vmCatalogDeploy.id, pop.data.deployName);
    };

    $scope.popCancel = function () {
        $scope.popHide();
    };

})
.controller('gpuVmCatalogDeployViewCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, $templateCache, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployViewCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};

    ct.fn.loadVmCatalogDeployView = function (templatePath, controllerName, deployViewHtmlFile) {
        // 페이지 로드
        var controllerTag = ' ng-controller="' + controllerName + ' as sub"';
        var deployViewHtmlFilePath = templatePath + "/" + deployViewHtmlFile;
        var promise = vmCatalogService.getVmCatalogDeployTemplateFile(deployViewHtmlFilePath);
        promise.success(function (data) {
            $templateCache.put("deployFormTemplate", "<div id=\"vmCatalogDeployView\"" + controllerTag + ">\n" + data + "\n</div>");
            ct.vmCatalogTemplateUrl = "deployViewTemplate";
            $scope.main.loadingMainBody = false;
        });
        promise.error(function (data, status, headers) {
            $templateCache.put("deployFormTemplateFail", "<div id=\"vmCatalogDeployView\"" + controllerTag + ">\nNot Found: " + deployViewHtmlFilePath + "\n</div>");
            ct.vmCatalogTemplateUrl = "deployViewTemplateFail";
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.loadVmCatalogDeployController = function (templatePath, vmCatalogTemplateInfo) {
        var loadPromise = vmCatalogService.loadVmCatalogDeployController(templatePath + "/" + vmCatalogTemplateInfo.deployViewControllerFile);
        loadPromise.then(function (loadData) {
            ct.fn.loadVmCatalogDeployForm(templatePath, vmCatalogTemplateInfo.deployViewControllerName, vmCatalogTemplateInfo.deployViewHtmlFile);
        });
        loadPromise.catch(function () {
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.loadVmCatalogDeployViewTemplate = function (templatePath) {
        var promise = vmCatalogService.getVmCatalogDeployTemplateInfo(templatePath);
        promise.success(function (data) {
            if (angular.isObject(data)) {
                ct.vmCatalogTemplateInfo = data;
                ct.fn.loadVmCatalogDeployController(templatePath, ct.vmCatalogTemplateInfo);
            } else {
                ct.vmCatalogTemplateInfo = {};
                $scope.main.loadingMainBody = false;
            }
        });
        promise.error(function (data, status, headers) {
            ct.vmCatalogTemplateInfo = {};
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.getVmCatalogInfo = function (catalogId) {
        $scope.main.loadingMainBody = true;
        var promise = vmCatalogService.getVmCatalogInfo(catalogId);
        promise.success(function (data) {
            if (angular.isObject(data.content)) {
                ct.vmCatalogInfo = data.content;
                ct.fn.loadVmCatalogDeployViewTemplate(ct.vmCatalogInfo.templatePath);
            } else {
                ct.vmCatalogInfo = {};
                $scope.main.loadingMainBody = false;
            }
        });
        promise.error(function (data, status, headers) {
            ct.vmCatalogInfo = {};
            $scope.main.loadingMainBody = false;
        });
    };

})
;
