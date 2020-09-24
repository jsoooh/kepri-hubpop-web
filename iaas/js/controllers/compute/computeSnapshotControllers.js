'use strict';

angular.module('iaas.controllers')
    .controller('iaasServerSnapshotCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, user,paging, common, CONSTANTS) {
        _DebugConsoleLog("computeSnapshotControllers.js : iaasServerSnapshotCtrl", 1);

        var ct = this;
        ct.data = {};
        ct.fn = {};
        ct.listType = "image";          //리스트 타입

        ct.tabIndex = 0;

        if ($location.$$search.tabIndex) {
            ct.tabIndex = $location.$$search.tabIndex;
        }

        ct.instanceSnapshotList = [];
        ct.storageSnapshotList = [];

        ct.schInstanceFilterText = "";
        ct.schStorageFilterText = "";

        ct.loadingInstanceSnapshotList = false;
        ct.loadingStorageSnapshotList = false;

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event, status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getInstanceSnapshotList();
            ct.fn.getStorageSnapshotList();
        });
        
        // Snapshot List
        ct.fn.getInstanceSnapshotList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                var instanceSnapshots = [];
                if (data && angular.isArray(data.content)) {
                    instanceSnapshots = data.content;
                    if (data.content.length != 0) {
                        ct.loadingInstanceSnapshotList = true;
                    }
                    //백업이미지 목록이 없을 때 자원사용여부 확인 후 사용하지 않을 때 [서비스 삭제하기] 활성화
                    if (instanceSnapshots.length == 0) {
                        $scope.main.checkUseYnPortalOrgSystem("iaas");
                    }
                }
                common.objectOrArrayMergeData(ct.instanceSnapshotList, instanceSnapshots);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.deleteInstanceSnapshot = function(instanceSnapshot) {
            common.showConfirm('서버 백업 이미지 삭제', '"'+instanceSnapshot.name+'" 서버 백업 이미지을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : instanceSnapshot.tenantId,
                    snapShotId : instanceSnapshot.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    
                    $timeout(function() {
                    	ct.fn.getInstanceSnapshotList();
                        common.showAlertSuccess("삭제 되었습니다.");
                	}, 1000);
                    
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                	common.showAlertError(data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };

        // Script list
        ct.fn.getStorageSnapshotList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            };
            ct.storageSnapshotList = [];
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshotList', 'GET', param, 'application/x-www-form-urlencoded'));
            returnPromise.success(function (data, status, headers) {
                var volumeSnapShots = [];
                if (data && data.content && angular.isArray(data.content.volumeSnapShots)) {
                    volumeSnapShots = data.content.volumeSnapShots;
                    if (data.content.volumeSnapShots.length != 0) {
                        ct.loadingStorageSnapshotList = true;
                    }
                }
                common.objectOrArrayMergeData(ct.storageSnapshotList, volumeSnapShots);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.deleteStorageSnapshot = function(storageSnapshot) {
            common.showConfirm('디스크 백업 이미지 삭제', '"'+storageSnapshot.snapshotName+'" 디스크 백업 이미지을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : storageSnapshot.tenantId,
                    snapshotId : storageSnapshot.snapshotId
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getStorageSnapshotList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };

        // 백업 이미지 설명 팝업
        ct.fn.descriptionFormOpen = function($event, snapShot, state){
    		if (state == 'server') {
    			ct.fn.modifyServerSnapShotDesc($event, snapShot);
    		} else if (state == 'storage') {
    		    ct.fn.modifyStorageSnapShotDesc($event, snapShot);
    		}
        };

        // 서버 백업 이미지 설명 수정
        ct.fn.modifyServerSnapShotDesc = function($event, snapshot) {

            var dialogOptions =  {
                controller       : "iaasServerSnapshotDescriptionCtrl" ,
                formName         : 'iaasServerSnapshotDescriptionForm',
                selectSnapshot    : angular.copy(snapshot),
                callBackFunction : ct.modifyServerSnapShotDescCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading

        };

        ct.modifyServerSnapShotDescCallBackFunction = function () {
             $scope.main.replacePage();
        };

        // 디스크 백업 이미지 설명 수정
        ct.fn.modifyStorageSnapShotDesc = function($event, snapshot) {

            var dialogOptions =  {
                controller       : "iaasStorageSnapshotDescriptionCtrl" ,
                formName         : 'iaasStorageSnapshotDescriptionForm',
                selectSnapshot    : angular.copy(snapshot),
                callBackFunction : ct.modifyStorageSnapShotDescCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading

        };

        ct.modifyStorageSnapShotDescCallBackFunction = function () {
             ct.fn.getStorageSnapshotList(1);
        };

        ct.fn.showErrorAlert = function() {
            common.showAlertError('이미 삭제된 인스턴스입니다.');
        };

        if (ct.data.tenantId) {
            ct.fn.getInstanceSnapshotList();
            ct.fn.getStorageSnapshotList(1);
        }
    })
    .controller('iaasServerSnapshotCreateCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("computeSnapshotControllers.js : iaasServerSnapshotCreateCtrl start", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct = this;
        ct.data = {};
        ct.fn = {};
        ct.roles = [];
        ct.tenantResource = {};
        ct.data.spec = {};
        ct.data.networks = [];
        ct.data.keypair = {};
        ct.data.securityPolicies = [];
        ct.serverNameList = [];
        ct.subnet = {};
        ct.snapshotInfo = {};
        ct.networks = [];

        ct.volume            = {};

        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        ct.formName = "computeCreateForm";
        ct.data.name = 'server-01';

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;

        ct.data.baseDomainName = ct.rdpBaseDomain;
        ct.data.subDomainName = "";

        ct.snapshotId = $stateParams.snapshotId;
        ct.paramTenantId = !!$stateParams.tenantId ? $stateParams.tenantId : ct.data.tenantId;

        // 서버 이름 중복 검사
        ct.fn.serverNameCustomValidationCheck = function(name) {
            if (ct.serverNameList.indexOf(name) > -1) {
                return {isValid : false, message : "이미 사용중인 이름입니다."};
            } else {
                return {isValid : true};
            }
        };

        // 인스턴스 목록 DB 조회
        ct.fn.getInstanceList = function() {
            ct.isInstanceListLoad = false;
            var params = {
                tenantId : ct.data.tenantId,
                deleteYn : "N",
                size : -1,
                page : 0
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/lookup', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0) {
                    angular.forEach(data.content, function (item) {
                        ct.serverNameList.push(item.name);
                    });
                }
            });
            returnPromise.error(function (data) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function () {
                ct.isInstanceListLoad = true;
            });
        };

        ct.fn.getSnapshotInfo = function(snapshotId) {
            $scope.main.loadingMainBody = true;
            var params = {
                //tenantId : ct.data.tenantId,
                tenantId : ct.paramTenantId,
                snapShotId : snapshotId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.id) {
                    ct.snapshotInfo = data.content;
                    ct.fn.setSpecMinDisabled();
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getSecurityPolicy = function() {
            ct.securityPolicyList = [];
            ct.roles = [];
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0) {
                    ct.securityPolicyList = data.content;
                    for (var i = 0; i < ct.securityPolicyList.length; i++) {
                        if (ct.securityPolicyList[i].name == "default") {
                            ct.roles.push(ct.securityPolicyList[i]);
                            ct.data.securityPolicys = ct.roles;
                        }
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
            });
        };

        ct.fn.changeSecurityPolicy = function() {
            ct.securityPolicies = ct.roles;
        };

        ct.fn.getKeypairList = function() {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param );
            returnPromise.success(function (data, status, headers) {
                ct.keypairList = data.content;
                if (ct.keypairList && ct.keypairList.length > 0) {
                    ct.data.keypair = ct.keypairList[0];
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
            });
        };

        // 서버만들기 - 사양선택 관련 속도개선 api로 변경
        ct.fn.getTenantResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            ct.tenantResource = {};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/usedLookup', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.tenantResource = data.content;
                    ct.tenantResource.available = {};
                    ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                    ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                    ct.tenantResource.available.instanceDiskGigabytes = ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes;
                    ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;
                    ct.tenantResource.available.licenseWindows = ct.tenantResource.maxResource.licenseWindows - ct.tenantResource.usedResource.licenseWindows;
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.volumeGigabytes;
                    if (CONSTANTS.iaasDef && CONSTANTS.iaasDef.insMaxDiskSize && (ct.volumeSliderOptions.ceil > CONSTANTS.iaasDef.insMaxDiskSize)) {
                        ct.volumeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize;
                    }
                    ct.fn.setSpecMaxDisabled();
                }
            });
            returnPromise.error(function (data) {
                common.showAlertError("message", data.message);
            });
        };

        //스펙그룹의 스펙 리스트 조회
        ct.isSpecLoad = false;
        ct.fn.getSpecList = function(specGroup) {
            ct.specList = [];
            ct.data.spec = {};
            var param = {specGroupName:specGroup};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param);
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
            if (ct.isSpecLoad && ct.snapshotInfo && ct.snapshotInfo.id) {
                angular.forEach(ct.specList, function (spec) {
                    if (spec.disk < ct.snapshotInfo.disk) {
                        spec.disabled = true;
                        ct.isMinSpecDisabled = true;
                    }
                });
                ct.specMinDisabledSetting = true;
                ct.fn.defaultSelectSpec();
            }
        };

        // max spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        ct.isMaxSpecDisabled = false;
        // spec loading 체크
        ct.specMaxDisabledSetting = false;
        ct.fn.setSpecMaxDisabled = function () {
            ct.isMaxSpecDisabled = false;
            if (ct.isSpecLoad && ct.tenantResource && ct.tenantResource.maxResource &&  ct.tenantResource.usedResource) {
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
                } else {
                    ct.specUuid = "";
                    ct.data.spec = "";
                }
            }
        };

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

        // 네트워크 리스트 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.networks = data.content;
                if (ct.networks.length > 0) {
                    ct.network = ct.networks[0];
                    ct.data.networks.push(ct.networks[0]);
                    ct.subnet.cidr_A = ct.network.subnets[0].cidr_A;
                    ct.subnet.cidr_B = ct.network.subnets[0].cidr_B;
                    ct.subnet.cidr_C = ct.network.subnets[0].cidr_C;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        ct.usingDomainList = [];
        ct.usingDomainNames = [];
        ct.fn.getDomainUsingList = function() {
            ct.usingDomainList = [];
            ct.usingDomainNames = [];
            var param = {};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/all', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.usingDomainList = data.content;
                    angular.forEach(ct.usingDomainList, function (domain, key) {
                        ct.usingDomainNames.push(domain.domain);
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
        };

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

        ct.inputVolumeSizeChange = function () {
            var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
            if (volumeSize >= ct.volumeSliderOptions.minLimit && volumeSize <= ct.volumeSliderOptions.ceil) {
                ct.volumeSize = ct.inputVolumeSize;
            }
        };

        ct.inputVolumeSizeBlur = function () {
            var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
            if (volumeSize < ct.volumeSliderOptions.minLimit || volumeSize > ct.volumeSliderOptions.ceil) {
                ct.inputVolumeSize = ct.volumeSize;
            } else {
                ct.inputVolumeSize = volumeSize;
                ct.volumeSize = volumeSize;
            }
        };


        var clickCheck = false;
        ct.fn.createServer = function() {
            if (clickCheck) return;
            clickCheck = true;
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                clickCheck = false;
                return;
            }

            var params = {};

            params.instance                  = {};
            params.instance.name             = ct.data.name;
            params.instance.tenantId         = ct.data.tenantId;
            params.instance.networks         = [{ id: ct.data.networks[0].id }];
            params.instance.image            = {id: ct.snapshotInfo.id, type: 'snapshot'};
            params.instance.keypair          = { keypairName: ct.data.keypair.keypairName };
            params.instance.securityPolicies = angular.copy(ct.data.securityPolicys);
            params.instance.spec             = ct.data.spec;

            if (ct.snapshotInfo.osType == 'windows') {
                if (ct.data.baseDomainName && ct.data.subDomainName) {
                    params.instance.rdpDomain = ct.data.subDomainName + "." + ct.data.baseDomainName;
                }
            }

            if (ct.volumeSize > 0) {
                params.volume = {};
                params.volume.name = ct.data.name+'_volume01';
                params.volume.type = 'HDD';
                params.volume.size = ct.volumeSize;
                params.volume.tenantId = ct.data.tenantId;
            }

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                $timeout(function () {
                    common.showAlertSuccess(ct.data.name+" 서버 생성이 시작 되었습니다.");
                    // 페이지 이동으로 바꿔야 하고
                    $scope.main.goToPage("/iaas/compute");
                }, 5000);
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
                clickCheck = false;
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.subDomainCustomValidationCheck = function(subDomain) {
            if (subDomain && angular.isArray(ct.usingDomainNames) && ct.usingDomainNames.length > 0) {
                var domainName = subDomain + "." + ct.data.baseDomainName;
                if ((ct.formMode != "mod" || ct.orgDomain.domain != domainName) && ct.usingDomainNames.indexOf(domainName) >= 0) {
                    return {isValid: false, message: "이미 사용중인 서브도메인 입니다."};
                }
            }
            return {isValid : true};
        };

        if (ct.data.tenantId && ct.snapshotId) {
            $scope.main.loadingMainBody = true;
            ct.fn.getInstanceList();
            ct.fn.getTenantResource();
            //ct.fn.getDomainUsingList();     //windows rdp 포트포워딩으로 도메인 사용하지 않음
            ct.fn.getSnapshotInfo(ct.snapshotId);
            ct.fn.networkListSearch();
            ct.fn.getKeypairList();
            ct.fn.getSecurityPolicy();
            ct.fn.getSpecList();
        }
    })
    .controller('iaasComputeRestoreCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("computeSnapshotControllers.js : iaasComputeRestoreCtrl start", 1);

        var pop = this;
        pop.data = {};
        pop.fn = {};
        pop.ui = {};
        pop.roles = [];
        pop.data.spec = {};
        pop.data.networks = [];
        pop.data.keypair = {};
        pop.data.initScript = {};
        pop.data.securityPolicies = [];
        pop.subnet = {};
        pop.networks = [];
        pop.ipFlag = true;
        pop.activeTabIndex = 1;
        pop.data.tenantId = common.getMainCtrlScope().main.userTenantId;
        pop.data.tenantName = common.getMainCtrlScope().main.userTenant.korName;
        pop.snapshotId = common.getMainContentsCtrlScope().contents.selectSnapshot.snapShotId;
        pop.instanceId = common.getMainContentsCtrlScope().contents.selectSnapshot.instanceId;
        pop.formName = "computeCreateForm";
        pop.formName2 = "computeCreateForm2";
        
        //다음
        pop.nextStep = function(){
        	
        	if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                return;
            }
        	
            pop.activeTabIndex++;
        };

        //이전
        pop.preStep = function () {
        	pop.activeTabIndex--;
        };
        
        pop.fn.getSnapshotInfo = function(snapshotId) {
            $scope.main.loadingMainBody = true;
            var params = {
                tenantId : pop.data.tenantId,
                snapShotId : snapshotId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'GET', params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                //$scope.main.loadingMainBody = false;
            	pop.data.image = data.content.image;
            });
            returnPromise.error(function (data, status, headers) {
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };
        
        //인스턴스 상세 정보 조회
        pop.fn.getInstanceInfo = function(instanceId) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.data.tenantId,
                instanceId : instanceId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
            	pop.instance = data.content.instances[0];
            	
            	if (pop.instance.vmState == 'deleted') {
            		common.showAlertWarning("원본 인스턴스가 삭제되어있습니다.");
            		//common.showAlert("message","원본 인스턴스가 삭제되어있습니다.");
            	}
	            
            	pop.fn.networkListSearch();
	            pop.fn.getKeypairList();
	            pop.fn.getSecurityPolicy();
	        	pop.fn.getSpecList();
	        	
	        	pop.initCheck = false;
	        	pop.fn.initScriptSet();
	        	pop.fn.getInitScriptList();
            });
            returnPromise.error(function (data, status, headers) {
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
        };
        
        pop.fn.getSecurityPolicy = function() {
            $scope.main.loadingMainBody = true;
        	pop.roles = [];
            var param = {tenantId:pop.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.securityPolicyList = data.content;
                
                for (var i=0; i < pop.securityPolicyList.length; i++) {
                    if (pop.instance.securityPolicies) {
                        for (var j=0; j < pop.instance.securityPolicies.length; j++) {
                            if (pop.securityPolicyList[i].name == pop.instance.securityPolicies[j].name) {
                                pop.roles.push(pop.securityPolicyList[i]);
                            }
                        }
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
        };
        
        pop.fn.changeSecurityPolicy = function() {
        	 pop.securityPolicies = pop.roles;
        };

        pop.fn.getKeypairList = function() {
            $scope.main.loadingMainBody = true;
            var param = {tenantId:pop.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param );
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.keypairList = data.content;
                
                if (!pop.instance.keypair) {
                	pop.instance.keypair = {};
                	pop.instance.keypair.name = '';
                }
                
                for (var i=0; i < pop.keypairList.length; i++) {
                	if (pop.keypairList[i].name == pop.instance.keypair.name) {
                		pop.keypairValue = pop.keypairList[i];
                		pop.data.keypair = angular.fromJson(pop.keypairValue);
                    }
                }
                //pop.fn.getSecurityPolicy();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
        };

        pop.fn.changeKeypair = function() {
            pop.data.keypair = angular.fromJson(pop.keypairValue);
        };

        pop.fn.createKeypair = function () {
            pop.nowMenu = "compute";
            pop.formType = "write";
            $scope.main.layerTemplateUrl2 = _IAAS_VIEWS_ + "/keypair/keypairForm.html" + _VersionTail();
            $("#aside-aside2").stop().animate({"right":"0"}, 500);
        };

        pop.fn.appendKeypair = function (keypair) {
            pop.keypairList.push(keypair);
            pop.keypairValue = keypair.name;
        };

        pop.fn.getKeyFile = function(keypair, type) {
            document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+pop.data.tenantId+"&name="+keypair.name;
        };
        
        var clickCheck = false;
        pop.fn.createServer = function() {
        	if (!clickCheck) {
        		if (!new ValidationService().checkFormValidity($scope[pop.formName2])) {
                    return;
                }
        		
        		clickCheck = true;
                pop.data.spec.type = pop.data.spec.name;
                pop.data.image.type = 'snapshot';
                //pop.data.vmType = 'SNAPSHOT'
                $scope.main.loadingMainBody = true;
                $scope.main.asideClose();
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', {instance : pop.data});
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                	$scope.main.goToPage("/iaas");
                    common.showAlertSuccess("생성 되었습니다.");
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                	common.showAlertError(data.message);
                    //common.showAlert("message",data.message);
                });
                returnPromise.finally(function() {
                    $scope.main.loadingMainBody = false;
                    clickCheck = false;
                });
        	}
        };
        
        pop.fn.getSpecList = function(specGroup) {
            $scope.main.loadingMainBody = true;
            pop.specList = [];
            var param = {specGroupName:specGroup};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.specList = data.content.specs;
                
                if (!pop.instance.spec) {
                	pop.instance.spec = {};
                	pop.instance.spec.name = '';
                }
                
                for (var i=0; i < pop.specList.length; i++) {
                	pop.specList[i].title = '[' + pop.specList[i].name + '] vCPU ' + pop.specList[i].vcpus + '개 / MEM ' + pop.specList[i].ram / 1024 + ' GB / DISK(HDD) ' + pop.specList[i].disk + ' GB';
                	if (pop.specList[i].name == pop.instance.spec.name) {
                		pop.specValue = pop.specList[i];
                		pop.data.spec = angular.fromJson(pop.specValue);
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
        };
        
        pop.fn.selectSpec = function() {
        	if (pop.specValue) {
        		pop.data.spec = angular.fromJson(pop.specValue);
        	} else {
        		pop.data.spec.vcpus = 0;
        		pop.data.spec.ram = 0;
        		pop.data.spec.disk = 0;
        	}
        };
        
        pop.fn.getInitScriptList = function(scriptId) {
            var param = {
                tenantId : pop.data.tenantId
            };
            if (scriptId) {
                param.scriptId = scriptId;
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (scriptId) {
                    pop.data.initScript = data.content[0];
                    $scope.main.loadingMainBody = false;
                } else {
                    pop.initScriptList = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
        };

        pop.fn.changeInitScript = function() {
            if (pop.initScriptValue == "") {
                pop.data.initScript = {};
            } else {
                pop.fn.getInitScriptList(angular.fromJson(pop.initScriptValue).scriptId);
            }
        };
        
        pop.fn.initScriptSet = function() {
            if (!pop.initCheck) {
                pop.data.initScript = {};
                pop.initScriptValue = "";
            }
        };
        
        // 네트워크 리스트 조회
        pop.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.networks = data.content;
                if (pop.networks.length > 0) {
                    pop.network = pop.networks[0];
                    pop.data.networks.push(pop.networks[0]);
                    pop.subnet.cidr_A = pop.network.subnets[0].cidr_A;
                    pop.subnet.cidr_B = pop.network.subnets[0].cidr_B;
                    pop.subnet.cidr_C = pop.network.subnets[0].cidr_C;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
        };

        //네트워크 setting
        pop.fn.networksChange = function() {
            if (pop.network && pop.network.subnets) {
                pop.subnet.cidr_A = pop.network.subnets[0].cidr_A;
                pop.subnet.cidr_B = pop.network.subnets[0].cidr_B;
                pop.subnet.cidr_C = pop.network.subnets[0].cidr_C;
                pop.data.networks = [{
                    id : pop.network.id
                }];
            }
        };
        
        if (pop.data.tenantId) {
            pop.fn.getInstanceInfo(pop.instanceId);
            pop.fn.getSnapshotInfo(pop.snapshotId);
        }
    })
    .controller('iaasServerSnapshotDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        	_DebugConsoleLog("storageControllers.js : iaasServerSnapshotDescriptionCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.snapShot 					= $scope.dialogOptions.selectSnapshot;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "백업 이미지 설명 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/serverSnapshotDescriptionPopForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;


        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {

            if ($scope.actionBtnHied) return;

            $scope.actionBtnHied = true;

            var checkByte = $bytes.lengthInUtf8Bytes(pop.newSnapshotDesc);
            if (checkByte > 255) {
                common.showAlertWarning("백업 이미지 설명이 255Byte를 초과하였습니다.");
                $scope.actionBtnHied = false;
                return;
            }

            pop.fn.modifyDesc();
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        pop.fn.modifyDesc = function() {

            $scope.main.loadingMainBody = true;

            var param = {
                            tenantId : pop.userTenant.id,
                            snapShotId : pop.snapShot.id,
                            description : pop.snapShot.description
                        };


            common.mdDialogHide();
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'PUT', {instanceSnapShot : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("백업 이미지 설명이 변경 되었습니다.");

                /* 20.04.29 - 리스트형 추가로 이미지형일때와 리스트형일때 callbackFunction 분기 by ksw*/
                if ( angular.isFunction(pop.callBackFunction) ) {
                    if ($scope.contents.listType == 'image') {
                        pop.callBackFunction();
                    } else {
                        $scope.contents.fn.getInstanceSnapshotList();
                    }
                }

            });
            returnPromise.error(function (data, status, headers){
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers){
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        }
    })
    .controller('iaasStorageSnapshotDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        	_DebugConsoleLog("storageControllers.js : iaasStorageSnapshotDescriptionCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.snapShot 					= $scope.dialogOptions.selectSnapshot;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "백업 이미지 설명 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/storageSnapshotDescriptionPopForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;


        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {

            if ($scope.actionBtnHied) return;

            $scope.actionBtnHied = true;

            var checkByte = $bytes.lengthInUtf8Bytes(pop.newSnapshotDesc);
            if (checkByte > 255) {
                common.showAlertWarning("백업 이미지 설명이 255Byte를 초과하였습니다.");
                $scope.actionBtnHied = false;
                return;
            }

            pop.fn.modifyDesc();
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        pop.fn.modifyDesc = function() {

            $scope.main.loadingMainBody = true;

            var param = {
                            tenantId : pop.userTenant.id,
                            snapshotId : pop.snapShot.snapshotId,
                            description : pop.snapShot.description
                        };


            common.mdDialogHide();
            var returnPromise = {};

            returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'PUT', {volumeSnapShot : param});
            returnPromise.success(function (data, status, headers){
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("백업 이미지 설명이 변경 되었습니다.");

                /* 20.04.29 - 리스트형 추가로 이미지형일때와 리스트형일때 callbackFunction 분기 by ksw*/
                if ( angular.isFunction(pop.callBackFunction) ) {
                    if ($scope.contents.listType == 'image') {
                        pop.callBackFunction();
                    } else {
                        $scope.contents.fn.getStorageSnapshotList();
                    }
                }
            });
            returnPromise.error(function (data, status, headers){
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers){
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        }
    })
;
