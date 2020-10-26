'use strict';

angular.module('gpu.controllers')
.controller('gpuVmCatalogDeployListCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user,paging, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployListCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};

    ct.listType = 'image';
    ct.vmCatalogDeployList = [];
    ct.schFilterText = "";

    ct.fn.mappingOuputsData = function (vmCatalogDeploy) {
        if (angular.isArray(vmCatalogDeploy.outputs)) {
            angular.forEach(vmCatalogDeploy.outputs, function(output) {
                if (output.output_key == "servers") {
                    vmCatalogDeploy.servers = angular.copy(output.output_value);
                } else if (output.output_key == "octaviaLb") {
                    vmCatalogDeploy.octaviaLb = angular.copy(output.output_value);
                    vmCatalogDeploy.octaviaLbUse = true;
                }
            });
        }
    };

    ct.fn.listAllVmCatalogDeploy = function (tenantId) {
        $scope.main.loadingMainBody = true;
        var promise = vmCatalogService.listAllVmCatalogDeploy(tenantId);
        promise.success(function (data) {
            if (angular.isArray(data.content)) {
                ct.vmCatalogDeployList = data.content;
                angular.forEach(ct.vmCatalogDeployList, function (vmCatalogDeploy, kdy) {
                    ct.fn.mappingOuputsData(vmCatalogDeploy);
                    if (vmCatalogDeploy.stackStatus.indexOf("FAILED") == -1 && vmCatalogDeploy.deployStatus.indexOf("PROGRESS") >= 0) {
                        vmCatalogService.checkDeployTimeOutStatus(vmCatalogDeploy);
                        if(vmCatalogDeploy.deployStatus != "DEPLOY_TIME_OUT") {
                            $scope.main.reloadTimmerStart("listAllVmCatalogDeploy", function () { ct.fn.listAllVmCatalogDeploy(tenantId); }, 10000);
                        }
                    }
                });
            } else {
                ct.vmCatalogDeployList = [];
            }
            $scope.main.loadingMainBody = false;
        });
        promise.error(function (data, status, headers) {
            ct.vmCatalogDeployList = [];
            $scope.main.loadingMainBody = false;
        });
        promise.finally(function () {
            if (ct.vmCatalogDeployList.length == 0) $scope.main.checkUseYnPortalOrgSystem("gpu");
        })
    };

    ct.fn.openVmCatalogDeployRenameForm = function ($event, vmCatalogDeploy) {
        $scope.dialogOptions = {
            controller: "gpuVmCatalogDeployRenameCtrl",
            vmCatalogDeploy: vmCatalogDeploy,
            callBackFunction: ct.fn.loadPage
        };
        $scope.actionBtnHied = false;
        common.showDialog($scope, $event, $scope.dialogOptions);
        $scope.actionLoading = true; // action loading
    };

    ct.fn.deleteVmCatalogDeploy = function (vmCatalogDeploy) {
        common.showConfirm("서비스 삭제", "'" + vmCatalogDeploy.deployName + "'서비스를 삭제하시겠습니까?").then(function(){
            $scope.main.loadingMainBody = true;
            var promise = vmCatalogService.deleteVmCatalogDeploy(vmCatalogDeploy.tenantId, vmCatalogDeploy.id);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                if (vmCatalogDeploy.parameters.s3_bucket_name != null) {
                    ct.fn.deleteBucket(vmCatalogDeploy);
                }
                ct.fn.loadPage();
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        });
    };

    ct.fn.deleteBucket = function(vmCatalogDeploy) {
        var param = {
            tenantId: vmCatalogDeploy.tenantId,
            bucket: vmCatalogDeploy.parameters.s3_bucket_name
        };
        console.log("tenantId >>>>>>>>>>>>" + vmCatalogDeploy.tenantId);
        console.log("삭제할 버킷 네임  >>>>>>>>>>>>" + vmCatalogDeploy.parameters.s3_bucket_name);
        var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket', 'DELETE', param);
        returnPromise.success(function (data, status, headers) {
            console.log("deleteObjectBucket DELETE!!!!!!!!!!!!!");
            if (status == 200 && data) {
                common.showAlertSuccess('삭제되었습니다.');
                ct.fn.getObjectStorageList();
            } else {
                $scope.main.loadingMainBody = false;
                common.showAlertError('오류가 발생하였습니다.');
            }
        });
    };

    ct.fn.loadPage = function () {
        ct.fn.listAllVmCatalogDeploy(ct.tenantId);
    };

    ct.fn.loadPage();

})
.controller('gpuVmCatalogDeployViewCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, $templateCache, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployViewCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};
    ct.deployId          = $stateParams.id;

    ct.htmlUrls                         = {};
    ct.htmlUrls.deployTitle             = _GPU_VIEWS_ + "/vmCatalog/view/viewDeployTitle.html" + _VERSION_TAIL_;
    ct.htmlUrls.deployOctaviaLb         = _GPU_VIEWS_ + "/vmCatalog/view/viewDeployOctaviaLb.html" + _VERSION_TAIL_;
    ct.htmlUrls.deployServerList        = _GPU_VIEWS_ + "/vmCatalog/view/viewDeployServerList.html" + _VERSION_TAIL_;

    ct.vmCatalogInfo = {};
    ct.vmCatalogDeployInfo = {};
    ct.vmCatalogTemplateUrl = "";
    ct.octaviaLbUse = false;

    ct.octaviaLb = {};
    ct.servers = [];

    ct.fn.loadVmCatalogDeployView = function (templatePath, controllerName, deployViewHtmlFile, deployViewHtmlFileType) {
        // 페이지 로드
        var controllerTag = ' ng-controller="' + controllerName + ' as subPage"';
        var deployViewHtmlFilePath = templatePath + "/" + deployViewHtmlFile;
        var promise = vmCatalogService.getVmCatalogDeployTemplateFile(deployViewHtmlFilePath);
        promise.success(function (data) {
            if (deployViewHtmlFileType == "full") {
                $templateCache.put("deployViewTemplate", "<div id=\"vmCatalogDeployView\" " + controllerTag + ">\n" + data + "\n</div>");
            } else {
                $templateCache.put("deployViewTemplate", "<div id=\"vmCatalogDeployView\" class=\"in\"" + controllerTag + ">\n" + data + "\n</div>");
            }
            ct.vmCatalogTemplateUrl = "deployViewTemplate";
            $scope.main.loadingMainBody = false;
        });
        promise.error(function (data, status, headers) {
            if (deployViewHtmlFileType == "full") {
                $templateCache.put("deployViewTemplate", "<div id=\"vmCatalogDeployView\"" + controllerTag + ">\nNot Found: " + deployViewHtmlFilePath + "\n</div>");
            } else {
                $templateCache.put("deployViewTemplate", "<div id=\"vmCatalogDeployView\" class=\"in\"" + controllerTag + ">nNot Found: " + deployViewHtmlFilePath + "\n</div>");
            }
            ct.vmCatalogTemplateUrl = "deployViewTemplateFail";
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.loadVmCatalogDeployController = function (templatePath, vmCatalogTemplateInfo) {
        var loadPromise = vmCatalogService.loadVmCatalogDeployController(templatePath + "/" + vmCatalogTemplateInfo.deployViewControllerFile);
        loadPromise.then(function (loadData) {
            ct.fn.loadVmCatalogDeployView(templatePath, vmCatalogTemplateInfo.deployViewControllerName, vmCatalogTemplateInfo.deployViewHtmlFile, vmCatalogTemplateInfo.deployViewHtmlFileType);
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

    ct.fn.mappingOuputsData = function (outputs) {
        if (angular.isArray(outputs)) {
            angular.forEach(outputs, function(output) {
                if (output.output_key == "servers") {
                    ct.servers = angular.copy(output.output_value);
                } else if (output.output_key == "octaviaLb") {
                    ct.octaviaLb = angular.copy(output.output_value);
                    ct.octaviaLbUse = true;
                }
            });
        }
    };

    ct.fn.getVmCatalogDeployAndLoadTemplate = function (tenantId, deployId) {
        $scope.main.loadingMainBody = true;
        var promise = vmCatalogService.getVmCatalogDeploy(tenantId, deployId);
        promise.success(function (data) {
            if (angular.isObject(data.content)) {
                ct.vmCatalogDeployInfo = data.content;
                ct.vmCatalogInfo = angular.copy(ct.vmCatalogDeployInfo.vmCatalogInfo);
                ct.fn.mappingOuputsData(data.content.outputs);
                ct.fn.loadVmCatalogDeployViewTemplate(ct.vmCatalogInfo.templatePath);
                if (ct.vmCatalogDeployInfo.stackStatus.indexOf("FAILED") == -1 && ct.vmCatalogDeployInfo.deployStatus.indexOf("PROGRESS") > 0) {
                    vmCatalogService.checkDeployTimeOutStatus(ct.vmCatalogDeployInfo);
                    if(ct.vmCatalogDeployInfo.deployStatus != "DEPLOY_TIME_OUT") {
                        $scope.main.reloadTimmerStart("VmCatalogDeployStatus", function () { ct.fn.getVmCatalogDeployStatus(tenantId, deployId); }, 10000);
                    }
                }
            } else {
                $scope.main.goToPage("/gpu/vmCatalogDeploy/list");
                $scope.main.loadingMainBody = false;
            }
        });
        promise.error(function (data, status, headers) {
            ct.vmCatalogDeployInfo = {};
            $scope.main.loadingMainBody = false;
        });
    };

    ct.vmCatalogDeployStatusTimeout = null;

    ct.fn.getVmCatalogDeployStatus = function (tenantId, deployId) {
        var promise = vmCatalogService.getVmCatalogDeploy(tenantId, deployId);
        promise.success(function (data) {
            if (angular.isObject(data.content) && data.content.id) {
                ct.vmCatalogDeployInfo = data.content;
                ct.vmCatalogInfo = angular.copy(ct.vmCatalogDeployInfo.vmCatalogInfo);
                ct.fn.mappingOuputsData(data.content.outputs);
                if (ct.vmCatalogDeployInfo.stackStatus.indexOf("FAILED") == -1 && ct.vmCatalogDeployInfo.deployStatus.indexOf("PROGRESS") > 0) {
                    vmCatalogService.checkDeployTimeOutStatus(ct.vmCatalogDeployInfo);
                    if(ct.vmCatalogDeployInfo.deployStatus != "DEPLOY_TIME_OUT") {
                        $scope.main.reloadTimmerStart("VmCatalogDeployStatus", function () { ct.fn.getVmCatalogDeployStatus(tenantId, deployId); }, 10000);
                    }
                }
            } else {
                $scope.main.goToPage("/gpu/vmCatalogDeploy/list");
            }
        });
        promise.error(function (data, status, headers) {
        });
    };

    ct.fn.openVmCatalogDeployRenameForm = function ($event, vmCatalogDeploy) {
        $scope.dialogOptions = {
            controller: "gpuVmCatalogDeployRenameCtrl",
            vmCatalogDeploy: vmCatalogDeploy,
            callBackFunction: ct.fn.loadPage
        };
        $scope.actionBtnHied = false;
        common.showDialog($scope, $event, $scope.dialogOptions);
        $scope.actionLoading = true; // action loading
    };

    ct.fn.deleteVmCatalogDeploy = function (vmCatalogDeploy) {
        common.showConfirm("서비스 삭제", "'" + vmCatalogDeploy.deployName + "'서비스를 삭제하시겠습니까?").then(function(){
            $scope.main.loadingMainBody = true;
            var promise = vmCatalogService.deleteVmCatalogDeploy(vmCatalogDeploy.tenantId, vmCatalogDeploy.id);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.fn.getVmCatalogDeployStatus(vmCatalogDeploy.tenantId, vmCatalogDeploy.id);
                if (vmCatalogDeploy.parameters.s3_bucket_name != null) {
                    ct.fn.deleteBucket(vmCatalogDeploy);
                }
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        });
    };

    ct.fn.deleteBucket = function(vmCatalogDeploy) {
        var param = {
            tenantId : vmCatalogDeploy.tenantId,
            bucket : ct.vmCatalogDeployInfo.parameters.s3_bucket_name
        };
        console.log("tenantId >>>>>>>>>>>>"+ vmCatalogDeploy.tenantId);
        console.log("삭제할 버킷 네임  >>>>>>>>>>>>"+ ct.vmCatalogDeployInfo.parameters.s3_bucket_name);
        var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket', 'DELETE', param);
        returnPromise.success(function (data, status, headers) {
            console.log("deleteObjectBucket DELETE!!!!!!!!!!!!!");
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
            common.showAlertError(data.message);});
    };

    ct.fn.copyConnectInfoToClipboard = function (ipAddress) {
        $scope.main.copyToClipboard(ipAddress, '"' + ipAddress + '"가 클립보드에 복사 되었습니다.');
    };

    ct.fn.getKeyFile = function(keypairName, type) {
        document.location.href = CONSTANTS.gpuApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.tenantId+"&name="+keypairName;
    };

    ct.fn.getVmCatalogDeployAndLoadTemplate(ct.tenantId, ct.deployId);

    ct.fn.loadPage = function () {
    };

})
.controller('gpuVmCatalogDeployRenameCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, common, ValidationService, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogDeployControllers.js : gpuVmCatalogDeployRenameCtrl", 1);

    var pop               = this;
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
        pop.fn.renameVmCatalogDeploy(pop.vmCatalogDeploy.tenantId, pop.vmCatalogDeploy.id, pop.data.deployName);
    };

    $scope.popCancel = function () {
        $scope.popHide();
    };

})
;
