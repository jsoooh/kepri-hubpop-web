'use strict';

angular.module('gpu.controllers')
.controller('gpuVmCatalogListCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, common, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogControllers.js : gpuVmCatalogListCtrl", 1);

    var ct               = this;
    ct.tenantId          = $scope.main.userTenantGpuId;
    ct.fn                = {};
    ct.gpu_vm_catalog_template = _GPU_VM_CATALOG_TEMPLATE_;

    ct.listType = 'image';

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

    ct.fn.loadPage = function () {
        ct.fn.listAllVmCatalogs();
    }

    ct.fn.loadPage();

})
.controller('gpuVmCatalogDeployFormCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, $templateCache, common, ValidationService, vmCatalogService, CONSTANTS) {
    _DebugConsoleLog("vmCatalogControllers.js : gpuVmCatalogDeployFormCtrl", 1);

    var ct                      = this;

    ct.testInput                = false;

    ct.tenantId                 = $scope.main.userTenantGpuId;
    ct.fn                       = {};
    ct.data                     = {};

    ct.htmlUrls                         = {};
    ct.htmlUrls.deployName              = _GPU_VIEWS_ + "/vmCatalog/create/createDeployDeployName.html" + _VERSION_TAIL_;
    ct.htmlUrls.stackName               = _GPU_VIEWS_ + "/vmCatalog/create/createDeployStackName.html" + _VERSION_TAIL_;
    ct.htmlUrls.deployTypeRadio         = _GPU_VIEWS_ + "/vmCatalog/create/createDeployTypeRadio.html" + _VERSION_TAIL_;
    ct.htmlUrls.octaviaLbUse            = _GPU_VIEWS_ + "/vmCatalog/create/createDeployOctaviaLbUse.html" + _VERSION_TAIL_;
    ct.htmlUrls.servicePort             = _GPU_VIEWS_ + "/vmCatalog/create/createDeployServicePort.html" + _VERSION_TAIL_;
    ct.htmlUrls.rootPassword            = _GPU_VIEWS_ + "/vmCatalog/create/createDeployRootPassword.html" + _VERSION_TAIL_;
    ct.htmlUrls.rootConfirmPassword     = _GPU_VIEWS_ + "/vmCatalog/create/createDeployRootConfirmPassword.html" + _VERSION_TAIL_;
    ct.htmlUrls.adminPassword           = _GPU_VIEWS_ + "/vmCatalog/create/createDeployAdminPassword.html" + _VERSION_TAIL_;
    ct.htmlUrls.adminConfirmPassword    = _GPU_VIEWS_ + "/vmCatalog/create/createDeployAdminConfirmPassword.html" + _VERSION_TAIL_;
    ct.htmlUrls.userDbUse               = _GPU_VIEWS_ + "/vmCatalog/create/createDeployUserDbUse.html" + _VERSION_TAIL_;
    ct.htmlUrls.zoneSelect              = _GPU_VIEWS_ + "/vmCatalog/create/createDeployZoneSelect.html" + _VERSION_TAIL_;
    ct.htmlUrls.specSelect              = _GPU_VIEWS_ + "/vmCatalog/create/createDeploySpecSelect.html" + _VERSION_TAIL_;
    ct.htmlUrls.volumeSelect            = _GPU_VIEWS_ + "/vmCatalog/create/createDeployVolumeSelect.html" + _VERSION_TAIL_;
    ct.htmlUrls.createDeployBtn         = _GPU_VIEWS_ + "/vmCatalog/create/createDeployBtn.html" + _VERSION_TAIL_;
    ct.htmlUrls.createDeployInfo        = _GPU_VIEWS_ + "/vmCatalog/create/createDeployInfo.html" + _VERSION_TAIL_;

    ct.stackNames               = [];
    ct.usingPorts               = {};
    ct.usingPorts.single        = [9100];
    ct.usingPorts.replica       = [9100];
    ct.usingPorts.cluster       = [9100];
    ct.catalogId                = $stateParams.id;
    ct.vmCatalogInfo            = {};
    ct.vmCatalogTemplateInfo    = {};
    ct.vmCatalogTemplateUrl     = "";
    ct.isSpecLoad = false;
    ct.isTenantResourceLoad = false;
    ct.specList = [];
    ct.availabilityZones = [];
    ct.sltAvailabilityZone = null;
    ct.sltSpec = {};
    ct.data.replicaCnt = 3;
    ct.data.clusterCnt = 3;
    ct.data.serverCnt = 1;
    ct.data.securityGroup = "default";
    ct.data.volumeType = "RBD";
    ct.data.lbAlgorithm = "ROUND_ROBIN";
    ct.data.volumeMountPoint = "/dev/vdb";
    ct.data.volumeMountPath = "/mnt/data";

    ct.data.volumeSize = 40;
    ct.data.deployType = 'single';
    ct.data.createUser = false;
    ct.data.octaviaLbUse = false;
    ct.data.volumeUse = false;

    //디스크생성 변수
    ct.inputVolumeSize = ct.data.volumeSize;
    ct.volumeSliderOptions = {
        showSelectionBar : true,
        minLimit : 1,
        floor: 0,
        ceil: 100,
        step: 10,
        onChange : function () {
            ct.inputVolumeSize = ct.data.volumeSize;
        }
    };

    ct.checkClickBtn = false;

    ct.fn.inputVolumeSizeChange = function () {
        var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
        if (volumeSize >= ct.volumeSliderOptions.minLimit && volumeSize <= ct.volumeSliderOptions.ceil) {
            ct.data.volumeSize = ct.inputVolumeSize;
        }
    };

    ct.fn.inputVolumeSizeBlur = function () {
        var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
        if (volumeSize < ct.volumeSliderOptions.minLimit || volumeSize > ct.volumeSliderOptions.ceil) {
            ct.inputVolumeSize = ct.data.volumeSize;
        } else {
            ct.inputVolumeSize = volumeSize;
            ct.data.volumeSize = volumeSize;
        }
    };

    ct.fn.commCheckFormValidity  = function (subPage) {
        if (ct.checkClickBtn) return;
        ct.checkClickBtn = true;
        if (!ct.vs.checkFormValidity(subPage)) {
            try {
                var deployForm = $('form[name="subPage.deployForm"]');
                for (var i=0; i<subPage.$validationSummary.length; i++) {
                    try {
                        var validationTarget = deployForm.find('[name="' + subPage.$validationSummary[0].field + '"]');
                        if (validationTarget.length == 0) continue;
                        if (validationTarget.attr('type') == 'hidden') {
                            var targetId = validationTarget.attr('targetId');
                            if (targetId && deployForm.find('#'+targetId).length == 1) {
                                deployForm.find('#'+targetId)[0].focus();
                                break;
                            }
                        } else {
                            validationTarget[0].focus();
                            break;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            } catch (e) {
                console.log(e);
            }
            ct.checkClickBtn = false;
            return false;
        }
        return true;
    }

    ct.fn.loadTemplateAndCallAction = function (deployType, callBackFuncion) {
        // 페이지 로드
        var templatePath = ct.vmCatalogInfo.templatePath;
        var deployTemplateUrl = ct.vmCatalogTemplateInfo.deployTemplates[deployType];
        var deployTemplateFilePath = templatePath + "/" + deployTemplateUrl + _VERSION_TAIL_;
        var promise = vmCatalogService.getVmCatalogDeployTemplateFile(deployTemplateFilePath);
        promise.success(function (data) {
            callBackFuncion(data);
        });
        promise.error(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
        });
    };

    ct.fn.loadVmCatalogDeployForm = function (templatePath, controllerName, deployHtmlFile) {
        // 페이지 로드
        var controllerTag = ' ng-controller="' + controllerName + ' as subPage"';
        var deployHtmlFilePath = templatePath + "/" + deployHtmlFile + _VERSION_TAIL_;
        var promise = vmCatalogService.getVmCatalogDeployTemplateFile(deployHtmlFilePath);

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

    ct.fn.getVmCatalogAndLoadTamplate = function (catalogId) {
        $scope.main.loadingMainBody = true;
        var promise = vmCatalogService.getVmCatalog(catalogId);
        promise.success(function (data) {
            if (angular.isObject(data.content)) {
                ct.vmCatalogInfo = data.content;
                ct.deployTypeReplicaSupport = ct.vmCatalogInfo.replicaSupport;
                ct.deployTypeClusterSupport = ct.vmCatalogInfo.clusterSupport;
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

    ct.fn.changeSetResourceMax = function() {
        var volumeMaxCeil = ct.tenantResource.available.volumeGigabytes / ct.data.serverCnt;
        if (CONSTANTS.iaasDef && CONSTANTS.iaasDef.insMaxDiskSize && (volumeMaxCeil > CONSTANTS.iaasDef.insMaxDiskSize)) {
            ct.volumeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize;
        } else {
            ct.volumeSliderOptions.ceil = volumeMaxCeil;
        }
    }

    ct.fn.getTenantResource = function(tenantId, resourceDefer)  {
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
            }
            if (resourceDefer) resourceDefer.resolve(data);
        });
        returnPromise.error(function (data, status, headers) {
            if (resourceDefer) resourceDefer.reject(data);
        });
        returnPromise.finally(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
            ct.isTenantResourceLoad = true
        });
    };

    // 상용존 셀렉트박스 조회
    ct.isAvailabilityZoneLoad = false;
    ct.fn.availabilityZoneList = function() {
        var returnPromise = vmCatalogService.listAllAvailabilityZones();
        returnPromise.success(function (data, status, headers) {
            ct.availabilityZones = data.content;
            if (angular.isArray(data.content)) {
                var maxNum = 0;
                angular.forEach(ct.availabilityZones, function (availabilityZone, k) {
                    if (availabilityZone.publicNetworkSubnet.available == 0) {
                        availabilityZone.disabled = true;
                    } else {
                        availabilityZone.disabled = false;
                        if (maxNum < availabilityZone.publicNetworkSubnet.available) {
                            maxNum = availabilityZone.publicNetworkSubnet.available;
                            ct.sltAvailabilityZone = availabilityZone;
                        }
                    }
                });
            }
            ct.isAvailabilityZoneLoad = true;
        });
        returnPromise.error(function (data, status, headers) {
            ct.isAvailabilityZoneLoad = true;
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
                ct.data.keyName = ct.data.keypair.keypairName;
                $scope.main.loadingMainBody = false;
            }
        });
        returnPromise.error(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
        });
    };

    //스펙그룹의 스펙 리스트 조회
    ct.fn.getSpecList = function(specListDefer) {
        var returnPromise = vmCatalogService.listAllSpec();
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
            if (specListDefer) specListDefer.resolve(data);
        });
        returnPromise.error(function (data, status, headers) {
            ct.isSpecLoad = true;
            if (specListDefer) specListDefer.reject(data);
        });
    };

    // min spec disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
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
            if (ct.sltSpec && ct.sltSpec.uuid) {
                if (ct.sltSpec.disk < 4 || ct.sltSpec.ram < 512) {
                    ct.fn.defaultSelectSpec();
                }
            } else {
                ct.fn.defaultSelectSpec();
            }
        }
    };

    // max spec disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
    ct.isMaxSpecDisabled = false;
    // spec loading 체크
    ct.specMaxDisabledSetting = false;
    ct.fn.setSpecMaxDisabled = function () {
        ct.isMaxSpecDisabled = false;
        if (ct.isSpecLoad && ct.tenantResource && ct.tenantResource.maxResource && ct.tenantResource.usedResource) {
            angular.forEach(ct.specList, function (spec) {
                if ((spec.vcpus  * ct.data.serverCnt) > ct.tenantResource.available.cores
                    || (spec.ram  * ct.data.serverCnt) > ct.tenantResource.available.ramSize
                    || (spec.disk  * ct.data.serverCnt) > ct.tenantResource.available.instanceDiskGigabytes) {
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
            ct.sltSpec = angular.copy(sltSpec);
            ct.data.flavor = ct.sltSpec.name;
            ct.sltSpecUuid = ct.sltSpec.uuid;
        } else {
            ct.sltSpec = {};
            ct.data.flavor = "";
            ct.sltSpecUuid = "";
        }
    };

    //스펙그룹의 스펙 리스트 조회
    ct.fn.getStackNames = function(tenantId) {
        var returnPromise = vmCatalogService.listAllVmCatalogDeployNames(tenantId);
        returnPromise.success(function (data, status, headers) {
            var stackNames = [];
            if (data && angular.isArray(data.content) && data.content.length > 0) {
                angular.forEach(data.content, function(val, key) {
                    stackNames.push(val.stackName);
                });
            }
            ct.stackNames = stackNames;
        });
        returnPromise.error(function (data, status, headers) {
        });
    };

    ct.fn.changeDeployType = function (deployType) {
        if (deployType == 'replica') {
           ct.data.serverCnt = ct.data.replicaCnt;
        } else if (deployType == 'cluster') {
           ct.data.serverCnt = ct.data.clusterCnt;
        } else {
           ct.data.serverCnt = 1;
        }
        ct.data.deployType = deployType;
        ct.fn.changeSetResourceMax();
        ct.fn.setSpecMaxDisabled();
    };

    ct.fn.validationDeployName = function (deployName) {
        var regexp = /[ㄱ-ㅎ가-힣0-9a-zA-Z.\-_]/;    // 한글,숫자,영문,특수문자(.-_)
        var bInValid = false;
        var orgNameErrorString = "";                // 문제되는 문자
        if (!deployName) return;
        for (var i=0; i<deployName.length; i++) {
            if (deployName.charAt(i) != " " && regexp.test(deployName.charAt(i)) == false) {
                bInValid = true;
                orgNameErrorString += deployName.charAt(i);
            }
        }
        if (bInValid) {
            return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
        } else {
            return {isValid : true};
        }
    };

    ct.fn.validationStackName = function (stackName) {
        if (!stackName) return;
        if (ct.stackNames.indexOf(stackName) >= 0) {
            return {isValid : false, message: "'" + stackName + "'은 이미 사용 중인 이름 입니다."};
        }
        return {isValid : true};
    };

    ct.fn.systemPortCustomValidationCheck = function(deployType, port) {
        if (port == undefined || port == null || port == "") return;
        if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
            if (ct.usingPorts[deployType].indexOf(port) >= 0) {
                return {isValid : false, message: "사용이 예약된 포트 입니다."};
            } else {
                return {isValid: true};
            }
        } else {
            return {isValid : false, message: "사용이 가능한 포트 범위는 [80, 443, 1024~65535] 입니다."};
        }
    };

    ct.fn.systemLbPortCustomValidationCheck = function(port) {
        if (port == undefined || port == null || port == "") return;
        if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
            return {isValid: true};
        } else {
            return {isValid : false, message: "사용이 가능한 포트 범위는 [80, 443, 1024~65535] 입니다."};
        }
    };

    ct.fn.checkPasswordValidation = function(password) {
        var regExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,20}$/;
        if(!regExp.test(password)) {
            return {isValid: false, message: "비밀번호는 숫자, 영소문자, 영대문자, 특수문자 혼합 및 8자리 이상 20자 이하 입니다."};
        }
        return {isValid: true};
    };

    ct.fn.checkConfirmPasswordValidation = function(password, confirmPassword) {
        if (password !== confirmPassword) {
            return {isValid: false, message: "비밀번호와 비밀번호 확인이 동일하지 않습니다."};
        }
        return {isValid: true};
    };

    ct.checkClickBtn = false;

    ct.fn.createVmCatalogDeployAction = function (deployTemplate, appendSetVmCatalogDeploy, templatePrint) {
        var vmCatalogDeploy = {};
        vmCatalogDeploy.context = {};
        vmCatalogDeploy.parameters = {};

        vmCatalogDeploy.vmCatalogInfoId = ct.vmCatalogInfo.id;
        vmCatalogDeploy.version = ct.vmCatalogInfo.version;
        vmCatalogDeploy.deployName = ct.data.deployName;
        vmCatalogDeploy.stackName = ct.data.stackName;
        vmCatalogDeploy.deployType = ct.data.deployType;
        vmCatalogDeploy.deployServerCount = 1;
        vmCatalogDeploy.deployTemplate = deployTemplate;
        vmCatalogDeploy.volumeUse = ct.data.volumeUse;
        vmCatalogDeploy.context.volumeUse = ct.data.volumeUse;
        vmCatalogDeploy.context.createUser = ct.data.createUser;
        if (ct.data.deployType == "cluster") {
            vmCatalogDeploy.deployServerCount = ct.data.clusterCnt;
            vmCatalogDeploy.octaviaLbUse = ct.data.octaviaLbUse;
            vmCatalogDeploy.context.octaviaLbUse = ct.data.octaviaLbUse;
        } else {
            if (ct.data.deployType == "replica") {
                vmCatalogDeploy.deployServerCount = ct.data.replicaCnt;
            }
            vmCatalogDeploy.octaviaLbUse = false;
            vmCatalogDeploy.context.octaviaLbUse = false;
        }
        vmCatalogDeploy.parameters.image = ct.vmCatalogTemplateInfo.images[ct.data.deployType];
        vmCatalogDeploy.parameters.flavor = ct.data.flavor;
        vmCatalogDeploy.parameters.key_name = ct.data.keyName;
        vmCatalogDeploy.parameters.security_group = ct.data.securityGroup;
        vmCatalogDeploy.parameters.availability_zone = ct.sltAvailabilityZone.availabilityZone;
        vmCatalogDeploy.parameters.provider_net = ct.sltAvailabilityZone.publicNetworkSubnet.networkId;
        vmCatalogDeploy.parameters.provider_subnet = ct.sltAvailabilityZone.publicNetworkSubnet.subnetId;
        if (vmCatalogDeploy.octaviaLbUse) {
            vmCatalogDeploy.parameters.lb_svc_port = ct.data.lbSvcPort;
            vmCatalogDeploy.parameters.lb_svc_protocol = "TCP";
            vmCatalogDeploy.parameters.lb_algorithm = ct.data.lbAlgorithm;
            vmCatalogDeploy.parameters.lb_svc_connection_limit = 2000;
            vmCatalogDeploy.parameters.lb_svc_monitor_type = "TCP";
            vmCatalogDeploy.parameters.lb_svc_monitor_delay = 3;
            vmCatalogDeploy.parameters.lb_svc_monitor_max_retries = 5;
            vmCatalogDeploy.parameters.lb_svc_monitor_timeout = 5;
            vmCatalogDeploy.parameters.lb_description = "vmCatalog " + ct.data.stackName + " lb";
        }
        if (ct.data.volumeUse) {
            vmCatalogDeploy.parameters.volume_type = ct.data.volumeType;
            vmCatalogDeploy.parameters.volume_size = ct.data.volumeSize;
            vmCatalogDeploy.parameters.volume_mount_point = ct.data.volumeMountPoint;
            vmCatalogDeploy.parameters.volume_format_type = "xfs";
            vmCatalogDeploy.parameters.volume_mount_path = ct.data.volumeMountPath;
        }
        if (ct.data.createUser) {
            vmCatalogDeploy.parameters.create_user_id = ct.data.createUserId;
            vmCatalogDeploy.parameters.create_db_name = ct.data.createDbName;
            vmCatalogDeploy.parameters.create_user_password = ct.data.createUserPassword;
        }
        if (angular.isFunction(appendSetVmCatalogDeploy)) {
            vmCatalogDeploy = appendSetVmCatalogDeploy(vmCatalogDeploy);
        }

        $scope.main.loadingMainBody = true;

        var promise = vmCatalogService.createVmCatalogDeploy(ct.tenantId, vmCatalogDeploy);
        promise.success(function (data) {
            if (angular.isObject(data.content) && angular.isNumber(data.content.id) && data.content.id > 0) {
                $scope.main.goToPage("/gpu/vmCatalogDeploy/view/" + data.content.id);
            } else {
                $scope.main.loadingMainBody = false;
            }
            ct.checkClickBtn = false;
        });
        promise.error(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
            ct.checkClickBtn = false;
        });
        if (templatePrint) {
            var printPromise = vmCatalogService.templateVmCatalogDeploy(vmCatalogDeploy);
            printPromise.success(function (data) {
                if (angular.isString(data.content)) {
                    console.log(data.content);
                }
            });
            printPromise.error(function (data, status, headers) {
            });
        }
    };

    ct.fn.loadPage = function () {
        var resourceDefer = $q.defer();
        var specListDefer = $q.defer();
        ct.fn.getTenantResource(ct.tenantId, resourceDefer);
        ct.fn.getSpecList(specListDefer);
        ct.fn.availabilityZoneList();
        ct.fn.getKeypairList(ct.tenantId);
        ct.fn.getStackNames(ct.tenantId);

        var allResourceMax = $q.all([resourceDefer.promise, specListDefer.promise]);
        allResourceMax.then(function (datas) {
            ct.fn.changeDeployType(ct.data.deployType);
        });
    };

    ct.fn.getVmCatalogAndLoadTamplate(ct.catalogId);
})
;
