'use strict';

angular.module('gpu.controllers')
.controller('gpuVmCatalogListCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogControllers.js : gpuVmCatalogListCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};

    ct.vmCatalogs = [];
    ct.schFilterText = "";

    ct.fn.listAllVmCatalogs = function () {
        $scope.main.loadingMainBody = true;
        var promise = vmCatalogService.listAllVmCatalogs();
        promise.success(function (data) {
            if (angular.isArray(data.content)) {
                ct.vmCatalogs = data.content;
            } else {
                ct.vmCatalogs = [];
            }
            $scope.main.loadingMainBody = false;
        });
        promise.error(function (data, status, headers) {
            ct.vmCatalogs = [];
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.listAllVmCatalogs();

})
.controller('gpuVmCatalogDeployFormCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, $templateCache, common, ValidationService, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogControllers.js : gpuVmCatalogDeployFormCtrl", 1);

    var ct                      = this;
    ct.tenantId                 = $scope.main.userTenantGpuId;
    ct.fn                       = {};

    ct.catalogId                = $stateParams.id;
    ct.vmCatalogInfo            = {};
    ct.vmCatalogTemplateInfo    = {};
    ct.vmCatalogTemplateUrl     = "";

    ct.fn.loadVmCatalogDeployForm = function (templatePath, controllerName, deployHtmlFile) {
        // 페이지 로드
        var controllerTag = ' ng-controller="' + controllerName + ' as sub"';
        var deployHtmlFilePath = templatePath + "/" + deployHtmlFile;
        var promise = vmCatalogService.getVmCatalogDeployTemplateHtml(deployHtmlFilePath);
        promise.success(function (data) {
            $templateCache.put("deployFormTemplate", "<div class=\"panel_area\" id=\"vmCatalogDeploy\"" + controllerTag + ">\n" + data + "\n</div>");
            ct.vmCatalogTemplateUrl = "deployFormTemplate";
            $scope.main.loadingMainBody = false;
        });
        promise.error(function (data, status, headers) {
            $templateCache.put("deployFormTemplateFail", "<div class=\"panel_area\" id=\"vmCatalogDeploy\"" + controllerTag + ">\nNot Found: " + deployHtmlFilePath + "\n</div>");
            ct.vmCatalogTemplateUrl = "deployFormTemplateFail";
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.loadVmCatalogDeployController = function (templatePath, vmCatalogTemplateInfo) {
        var loadPromise = vmCatalogService.loadVmCatalogDeployController(templatePath + "/" + vmCatalogTemplateInfo.deployControllerFile);
        loadPromise.then(function (loadData) {
            ct.fn.loadVmCatalogDeployForm(templatePath, vmCatalogTemplateInfo.deployControllerName, vmCatalogTemplateInfo.deployHtmlFile);
        });
        loadPromise.catch(function () {
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.loadVmCatalogDeployTemplate = function (templatePath) {
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
                ct.fn.loadVmCatalogDeployTemplate(ct.vmCatalogInfo.templatePath);
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

    // 디스크 생성 부분 추가 2018.11.13 sg0730
    // 서버만들기-사양선택 관련 속도개선 api로 변경
    ct.fn.getTenantResource = function()  {
        var params = {
            tenantId : ct.data.tenantId
        };
        // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/usedLookup', 'GET', params));
        var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/usedLookup', 'GET', params));
        returnPromise.success(function (data, status, headers) {
            if (data && data.content) {
                ct.tenantResource = data.content;
                ct.tenantResource.available = {};
                ct.tenantResource.available.instances = ct.tenantResource.maxResource.instances - ct.tenantResource.usedResource.instances;
                ct.tenantResource.available.floatingIps = ct.tenantResource.maxResource.floatingIps - ct.tenantResource.usedResource.floatingIps;
                ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                ct.tenantResource.available.instanceDiskGigabytes = ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes;
                ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;
                ct.tenantResource.available.objectStorageGigaByte = ct.tenantResource.maxResource.objectStorageGigaByte - ct.tenantResource.usedResource.objectStorageGigaByte;
                ct.volumeSliderOptions.ceil = ct.tenantResource.available.volumeGigabytes;
                if (CONSTANTS.iaasDef && CONSTANTS.iaasDef.insMaxDiskSize && (ct.volumeSliderOptions.ceil > CONSTANTS.iaasDef.insMaxDiskSize)) {
                    ct.volumeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize
                }
                ct.fn.setSpecMaxDisabled();
            }
        });
        returnPromise.error(function (data, status, headers) {
            if (status != 307) {
                common.showAlertError(data.message);
            }
            common.showAlertError(data.message);
        });
        returnPromise.finally(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
        });
    };


    // 네트워크 셀렉트박스 조회
    ct.fn.networkListSearch = function() {
        var param = {
            tenantId : ct.data.tenantId,
            isExternal : false
        };
        // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
        var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/networks', 'GET', param);
        returnPromise.success(function (data, status, headers) {
            ct.networks = data.content;
            ct.networks.unshift({id:"",name:'',description:"네트워크 선택"});
            ct.network = ct.networks[0];
        });
        returnPromise.error(function (data, status, headers) {
            common.showAlertError(data.message);
            $scope.main.loadingMainBody = false;
        });
    };

    //보안정책 조회
    ct.fn.getSecurityPolicy = function() {
        var param = {tenantId:ct.data.tenantId};
        // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param));
        var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/securityPolicy', 'GET', param));
        returnPromise.success(function (data, status, headers) {
            ct.securityPolicyList = data.content;
            for (var i = 0; i < ct.securityPolicyList.length; i++) {
                if (ct.securityPolicyList[i].name == "default") {
                    ct.roles.push(ct.securityPolicyList[i]);
                    ct.data.securityPolicys = ct.roles;
                }
            }
        });
        returnPromise.error(function (data, status, headers) {
            if (status != 307) {
                common.showAlertError(data.message);
            }
            $scope.main.loadingMainBody = false;
        });
    };

    //키페어 조회
    ct.fn.getKeypairList = function(keypairName) {
        var param = {tenantId:ct.data.tenantId};
        // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param);
        var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/keypair', 'GET', param);
        returnPromise.success(function (data, status, headers) {
            ct.keypairList = data.content;
            if (ct.keypairList.length == 0) {
                ct.createKeypair = {};
                ct.createKeypair.tenantId = ct.data.tenantId;
                ct.createKeypair.name = "default";
                ct.createKeypair.description = "default keypair";

                var param = {
                    keypair : ct.createKeypair
                };
                // var returnData = common.noMsgSyncHttpResponseJson(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'POST', param);
                var returnData = common.noMsgSyncHttpResponseJson(CONSTANTS.gpuApiContextUrl + '/server/keypair', 'POST', param);
                if (returnData.status == 200) {
                    ct.fn.getKeypairList();
                } else {
                    common.showAlertError(returnData.data.responseJSON.message);
                    $scope.main.loadingMainBody = false;
                }
            } else {
                for (var i = 0; i < ct.keypairList.length; i++) {
                    if (ct.keypairList[i].name == "default") {
                        ct.data.keypair = ct.keypairList[i];
                    }
                }
                if (!ct.data.keypair) {
                    ct.data.keypair = ct.keypairList[0];
                }
                $scope.main.loadingMainBody = false;
                ct.fn.getSpecList();
            }
        });
        returnPromise.error(function (data, status, headers) {
            common.showAlertError(data.message);
            $scope.main.loadingMainBody = false;
        });
    };

    //스펙그룹의 스펙 리스트 조회
    ct.fn.getSpecList = function(specGroup) {
        ct.specList = [];
        ct.data.spec = {};
        var param = {specGroupName:specGroup};
        // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param);
        var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/spec', 'GET', param);
        returnPromise.success(function (data, status, headers) {
            if (data && data.content && data.content.specs && data.content.specs.length > 0) {
                ct.specList = data.content.specs;
            }
            ct.isSpecLoad = true;
            ct.fn.setSpecMinDisabled();
            ct.fn.setSpecMaxDisabled();
        });
        returnPromise.error(function (data, status, headers) {
            ct.isSpecLoad = true;
            ct.fn.setSpecMinDisabled();
            ct.fn.setSpecMaxDisabled();
            common.showAlertError(data.message);
        });
    };

    // min spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
    ct.isMinSpecDisabled = false;
    // spec loading 체크
    ct.specMinDisabledSetting = false;
    ct.fn.setSpecMinDisabled = function () {
        ct.isMinSpecDisabled = false;
        if (ct.isSpecLoad && ct.data.image && ct.data.image.id) {
            angular.forEach(ct.specList, function (spec) {
                if (spec.disk < ct.data.image.minDisk || spec.ram < (ct.data.image.minRam * 1024)) {
                    spec.disabled = true;
                    ct.isMinSpecDisabled = true;
                }
            });
            ct.specMinDisabledSetting = true;
            if (ct.data.spec && ct.data.spec.uuid) {
                if (ct.data.spec.disk < ct.data.image.minDisk || ct.data.spec.ram < (ct.data.image.minRam)) {
                    ct.fn.defaultSelectSpec();
                }
            } else {
                ct.fn.defaultSelectSpec();
            }
        }
    };

    // max spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
    ct.isMaxSpecDisabled = false;
    // spec loading 체크
    ct.specMaxDisabledSetting = false;
    ct.fn.setSpecMaxDisabled = function () {
        ct.isMaxSpecDisabled = false;
        if (ct.isSpecLoad && ct.tenantResource && ct.tenantResource.maxResource && ct.tenantResource.usedResource) {
            angular.forEach(ct.specList, function (spec) {
                if (spec.vcpus > ct.tenantResource.available.cores || spec.ram > ct.tenantResource.available.ramSize || spec.disk > ct.tenantResource.available.instanceDiskGigabytes) {
                    spec.disabled = true;
                    ct.isMaxSpecDisabled = true;
                }
            });
            ct.specMaxDisabledSetting = true;
            ct.fn.defaultSelectSpec();
        }
    };

    ct.fn.setSpecAllEnabled = function () {
        if (ct.specList && ct.specList.length && ct.specList.length > 0) {
            angular.forEach(ct.specList, function (spec) {
                spec.disabled = false;
            });
        }
    };

    // spec loading 체크
    ct.specDisabledAllSetting = false;
    ct.fn.defaultSelectSpec = function() {
        if (ct.specMinDisabledSetting && ct.specMaxDisabledSetting) {
            ct.specDisabledAllSetting = true;
            var sltSpec = null;
            for (var i=0; i<ct.specList.length; i++) {
                if (!ct.specList[i].disabled) {
                    sltSpec = ct.specList[i];
                    break;
                }
            }
            if (sltSpec) {
                ct.fn.selectSpec(sltSpec);
            }
        }
    };

    //사양선택 이벤트 2018.11.13 sg0730 add
    ct.fn.selectSpec = function(sltSpec) {
        if (!ct.specDisabledAllSetting || sltSpec.disabled) return;
        if (sltSpec && sltSpec.uuid) {
            ct.data.spec = angular.copy(sltSpec);
            ct.specUuid = ct.data.spec.uuid;
        } else {
            ct.data.spec = {};
            ct.specUuid = "";
        }
    };

    ct.fn.getVmCatalogInfo(ct.catalogId);

})
;
