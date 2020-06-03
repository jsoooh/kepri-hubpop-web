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
    ct.data                     = {};

    ct.htmlUrls                 = {};
    ct.htmlUrls.userDbUse  = _GPU_VIEWS_ + "/vmCatalog/createDeployUserDbUse.html" + _VERSION_TAIL_;
    ct.htmlUrls.deployTypeRadio = _GPU_VIEWS_ + "/vmCatalog/createDeployTypeRadio.html" + _VERSION_TAIL_;
    ct.htmlUrls.octaviaLbUse      = _GPU_VIEWS_ + "/vmCatalog/createDeployOctaviaLbUse.html" + _VERSION_TAIL_;
    ct.htmlUrls.spaceSelect      = _GPU_VIEWS_ + "/vmCatalog/createDeploySpaceSelect.html" + _VERSION_TAIL_;
    ct.htmlUrls.volumeSelect     = _GPU_VIEWS_ + "/vmCatalog/createDeployVolumeSelect.html" + _VERSION_TAIL_;
    ct.htmlUrls.createDeployBtn  = _GPU_VIEWS_ + "/vmCatalog/createDeployBtn.html" + _VERSION_TAIL_;
    ct.htmlUrls.createDeployInfo = _GPU_VIEWS_ + "/vmCatalog/createDeployInfo.html" + _VERSION_TAIL_;

    ct.roles                    = [];
    ct.catalogId                = $stateParams.id;
    ct.vmCatalogInfo            = {};
    ct.vmCatalogTemplateInfo    = {};
    ct.vmCatalogTemplateUrl     = "";
    ct.isSpecLoad = false;
    ct.isTenantResourceLoad = false;
    ct.specList = [];
    ct.data.spec = {};
    ct.data.replicaCnt = 3;
    ct.data.clusterCnt = 3;
    ct.data.serverCnt = 1;

    //디스크생성 변수
    ct.volumeSize = 0;
    ct.inputVolumeSize = ct.volumeSize;
    ct.volumeSliderOptions = {
        showSelectionBar : true,
        minLimit : 0,
        floor: 0,
        ceil: 100,
        step: 1,
        onChange : function () {
            ct.inputVolumeSize = ct.volumeSize;
        }
    };

    ct.fn.inputVolumeSizeChange = function () {
        var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
        if (volumeSize >= ct.volumeSliderOptions.minLimit && volumeSize <= ct.volumeSliderOptions.ceil) {
            ct.volumeSize = ct.inputVolumeSize;
        }
    };

    ct.fn.inputVolumeSizeBlur = function () {
        var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
        if (volumeSize < ct.volumeSliderOptions.minLimit || volumeSize > ct.volumeSliderOptions.ceil) {
            ct.inputVolumeSize = ct.volumeSize;
        } else {
            ct.inputVolumeSize = volumeSize;
            ct.volumeSize = volumeSize;
        }
    };

    ct.fn.loadVmCatalogDeployForm = function (templatePath, controllerName, deployHtmlFile) {
        // 페이지 로드
        var controllerTag = ' ng-controller="' + controllerName + ' as subPage"';
        var deployHtmlFilePath = templatePath + "/" + deployHtmlFile + _VERSION_TAIL_;
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
    ct.fn.getTenantResource = function(tenantId)  {
        var returnPromise = vmCatalogService.getTenantResource(tenantId);
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
        });
        returnPromise.finally(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
            ct.isTenantResourceLoad = true
        });
    };


    // 네트워크 셀렉트박스 조회
    ct.fn.networkList = function(tenantId) {
        var returnPromise = vmCatalogService.listAllNetwork(tenantId);
        returnPromise.success(function (data, status, headers) {
            ct.networks = data.content;
            ct.networks.unshift({id:"",name:'',description:"네트워크 선택"});
            ct.network = ct.networks[0];
        });
        returnPromise.error(function (data, status, headers) {
        });
    };

    //보안정책 조회
    ct.fn.getSecurityPolicy = function(tenantId) {
        var returnPromise = vmCatalogService.listAllSecurityPolicy(tenantId);
        returnPromise.success(function (data, status, headers) {
            ct.securityPolicyList = data.content;
            for (var i = 0; i < ct.securityPolicyList.length; i++) {
                if (ct.securityPolicyList[i].name == "default") {
                    ct.roles.push(ct.securityPolicyList[i]);
                    ct.data.securityPolicys = ct.roles;
                    break;
                }
            }
        });
        returnPromise.error(function (data, status, headers) {
        });
    };

    //키페어 조회
    ct.fn.addDefaultKeypair = function(tenantId) {
        var createKeypair = {};
        createKeypair.tenantId = tenantId;
        createKeypair.name = "default";
        createKeypair.description = "default keypair";

        var returnPromise = vmCatalogService.addDefaultKeypair(createKeypair);
        returnPromise.success(function (data, status, headers) {
            ct.fn.getKeypairList();
        });
        returnPromise.error(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
        });
    };

    //키페어 조회
    ct.fn.getKeypairList = function(tenantId) {
        var returnPromise = vmCatalogService.getKeypairList(tenantId);
        returnPromise.success(function (data, status, headers) {
            ct.keypairList = data.content;
            if (ct.keypairList.length == 0) {
                ct.fn.addDefaultKeypair(tenantId);
            } else {
                for (var i = 0; i < ct.keypairList.length; i++) {
                    if (ct.keypairList[i].name == "default") {
                        ct.data.keypair = ct.keypairList[i];
                        break;
                    }
                }
                if (!ct.data.keypair) {
                    ct.data.keypair = ct.keypairList[0];
                }
                $scope.main.loadingMainBody = false;
            }
        });
        returnPromise.error(function (data, status, headers) {
            common.showAlertError(data.message);
            $scope.main.loadingMainBody = false;
        });
    };

    //스펙그룹의 스펙 리스트 조회
    ct.fn.getSpecList = function(specGroup) {
        var returnPromise = vmCatalogService.listAllSpec(specGroup);
        returnPromise.success(function (data, status, headers) {
            if (data && data.content && data.content.specs && data.content.specs.length > 0) {
                var specList = [];
                angular.forEach(data.content.specs, function(val, key) {
                    if (val.name[0] == 'm' &&  val.type == "general") {
                        specList.push(val);
                    }
                });
                ct.specList = specList;
            }
            ct.isSpecLoad = true;
            ct.fn.setSpecMinDisabled();
            ct.fn.setSpecMaxDisabled();
        });
        returnPromise.error(function (data, status, headers) {
            ct.isSpecLoad = true;
        });
    };

    // min spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
    ct.isMinSpecDisabled = false;
    // spec loading 체크
    ct.specMinDisabledSetting = false;
    ct.fn.setSpecMinDisabled = function () {
        ct.isMinSpecDisabled = false;
        if (ct.isSpecLoad) {
            angular.forEach(ct.specList, function (spec) {
                if (spec.disk < 4 || spec.ram < 512) {
                    spec.disabled = true;
                    ct.isMinSpecDisabled = true;
                }
            });
            ct.specMinDisabledSetting = true;
            if (ct.data.spec && ct.data.spec.uuid) {
                if (ct.data.spec.disk < 4 || ct.data.spec.ram < 512) {
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
            ct.data.specUuid = ct.data.spec.uuid;
        } else {
            ct.data.spec = {};
            ct.specUuid = "";
        }
    };

    ct.fn.changeDeployType = function () {
       if (ct.data.deployType == 'replica') {
           ct.data.serverCnt = ct.data.replicaCnt;
       } else if (ct.data.deployType == 'cluster') {
           ct.data.serverCnt = ct.data.clusterCnt;
       } else {
           ct.data.serverCnt = 1;
       }
    };

    ct.fn.getVmCatalogInfo(ct.catalogId);
    ct.fn.getTenantResource(ct.tenantId);
    ct.fn.networkList(ct.tenantId);
    ct.fn.getSecurityPolicy(ct.tenantId);
    ct.fn.getKeypairList(ct.tenantId);
    ct.fn.getSpecList();

})
;
