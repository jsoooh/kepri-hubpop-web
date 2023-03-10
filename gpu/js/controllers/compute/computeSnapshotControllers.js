'use strict';

angular.module('gpu.controllers')
    .controller('gpuServerSnapshotCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, user,paging, common, CONSTANTS) {
        _DebugConsoleLog("computeSnapshotControllers.js : gpuServerSnapshotCtrl", 1);

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

        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        // 공통 레프트 메뉴의 userTenantId
        // ct.data.tenantId = $scope.main.userTenantId;
        // ct.data.tenantName = $scope.main.userTenant.korName;
        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.data.tenantName = $scope.main.userTenantGpu.korName;

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
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshotList', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                var instanceSnapshots = [];
                if (data && angular.isArray(data.content)) {
                    instanceSnapshots = data.content;
                    if (data.content.length != 0) {
                        ct.loadingInstanceSnapshotList = true;
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
                //백업이미지 목록이 없을 때 자원사용여부 확인 후 사용하지 않을 때 [서비스 삭제하기] 활성화
                if (!ct.instanceSnapshotList || ct.instanceSnapshotList.length == 0) {
                    $scope.main.checkUseYnPortalOrgSystem("gpu");
                }
            });
        };

        ct.fn.deleteInstanceSnapshot = function(instanceSnapshot) {
            common.showConfirm('서버 백업 이미지 삭제', '"'+instanceSnapshot.name+'" 서버 백업 이미지을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : instanceSnapshot.tenantId,
                    snapShotId : instanceSnapshot.id
                };
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'DELETE', param);
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshot', 'DELETE', param);
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
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshotList', 'GET', param, 'application/x-www-form-urlencoded'));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshotList', 'GET', param, 'application/x-www-form-urlencoded'));
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
                if (!ct.storageSnapshotList || ct.storageSnapshotList.length == 0) $scope.main.checkUseYnPortalOrgSystem("gpu");
            });
        };

        ct.fn.deleteStorageSnapshot = function(storageSnapshot) {
            common.showConfirm('디스크 백업 이미지 삭제', '"'+storageSnapshot.snapshotName+'" 디스크 백업 이미지을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : storageSnapshot.tenantId,
                    snapshotId : storageSnapshot.snapshotId
                };
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'DELETE', param);
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshot', 'DELETE', param);
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
                // controller       : "iaasServerSnapshotDescriptionCtrl" ,
                // formName         : 'iaasServerSnapshotDescriptionForm',
                controller       : "gpuServerSnapshotDescriptionCtrl" ,
                formName         : 'gpuServerSnapshotDescriptionForm',
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
                // controller       : "iaasStorageSnapshotDescriptionCtrl" ,
                // formName         : 'iaasStorageSnapshotDescriptionForm',
                controller       : "gpuStorageSnapshotDescriptionCtrl" ,
                formName         : 'gpuStorageSnapshotDescriptionForm',
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

        if (!$scope.main.sltPortalOrg.isUseGpu) {
            common.showDialogAlert('알림', '현재 프로젝트는 "GPU 서버 가상화"를 이용하지 않는 프로젝트입니다.');
            $scope.main.goToPage("/comm/projects/projectDetail/" + $scope.main.sltPortalOrg.id);
        }

        if (ct.data.tenantId) {
            ct.fn.getInstanceSnapshotList();
            ct.fn.getStorageSnapshotList(1);
        }
    })
    .controller('gpuServerSnapshotCreateCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("computeSnapshotControllers.js : gpuServerSnapshotCreateCtrl start", 1);

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
        ct.subnet = {};
        ct.snapshotInfo = {};
        ct.networks = [];

        ct.selectedSpecType = "";

        ct.gpuCardList  = [];
        ct.selectedGpuCard = {};
        ct.selectedGpuCardId = "";

        ct.volume            = {};

        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.data.tenantName = $scope.main.userTenantGpu.korName;

        ct.formName = "computeCreateForm";
        ct.data.name = 'server-01';

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;

        ct.data.baseDomainName = ct.rdpBaseDomain;
        ct.data.subDomainName = "";

        ct.snapshotId = $stateParams.snapshotId;
        ct.paramTenantId = !!$stateParams.tenantId ? $stateParams.tenantId : ct.data.tenantId;

        ct.fn.getSnapshotInfo = function(snapshotId) {
            $scope.main.loadingMainBody = true;
            var params = {
                tenantId : ct.paramTenantId,
                snapShotId : snapshotId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshot', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.id) {
                    ct.snapshotInfo = data.content;
                    ct.fn.setSpecMinDisabled();

                    // Train은 fixed_ip 대신 floating_ip만 사용하기때문에 불필요
                    /*var params = {
                        tenantId: ct.snapshotInfo.tenantId,
                        instanceId: ct.snapshotInfo.instanceId
                    };

                    var rp = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshot/networkId', 'GET', params);
                    rp.success(function (result) {
                        if (result && result.content) {
                            ct.networkId = result.content.networkId;
                        } else {
                            common.showAlertWarning('네트워크ID 가 설정되지 않았습니다.');
                        }
                    });
                    rp.error(function (result) {
                        common.showAlertWarning('네트워크ID 가 설정되지 않았습니다. >>> ' + result.exception);
                    });*/
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
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/securityPolicy', 'GET', param);
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
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/keypair', 'GET', param );
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

        ct.fn.getTenantResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            ct.tenantResource = {};
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/usedLookup', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.tenantResource = data.content;
                    ct.tenantResource.available = {};
                    ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                    ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                    ct.tenantResource.maxResource.volumeGigabytes = (ct.tenantResource.maxResource.hddVolumeGigabytes + ct.tenantResource.maxResource.ssdVolumeGigabytes);
                    ct.tenantResource.usedResource.volumeGigabytes = (ct.tenantResource.usedResource.hddVolumeGigabytes + ct.tenantResource.usedResource.ssdVolumeGigabytes);
                    ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;
                    ct.tenantResource.available.hddVolumeGigabytes = ct.tenantResource.maxResource.hddVolumeGigabytes - ct.tenantResource.usedResource.hddVolumeGigabytes;
                    ct.tenantResource.available.ssdVolumeGigabytes = ct.tenantResource.maxResource.ssdVolumeGigabytes - ct.tenantResource.usedResource.ssdVolumeGigabytes;
                    ct.tenantResource.available.objectStorageGigaByte = ct.tenantResource.maxResource.objectStorageGigaByte - ct.tenantResource.usedResource.objectStorageGigaByte;
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.hddVolumeGigabytes;
                    if (CONSTANTS.iaasDef && CONSTANTS.iaasDef.insMaxDiskSize && (ct.volumeSliderOptions.ceil > CONSTANTS.iaasDef.insMaxDiskSize)) {
                        ct.volumeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize
                    }
                    ct.fn.setSpecMaxDisabled();
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function() {
            });
        };

        //스펙그룹의 스펙 리스트 조회
        ct.isSpecLoad = false;
        ct.fn.getSpecList = function(specGroup) {
            ct.specList = [];
            ct.data.spec = {};
            var param = {specGroupName:specGroup};
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/spec', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.specs && data.content.specs.length > 0) {
                    ct.specList = data.content.specs;
                    // Spec 타입 체크를 위한 스냅샷 스펙 정보 저장 by hrit, 200923
                    for (var i = 0; i < ct.specList.length; i++) {
                        var spec = ct.specList[i];
                        if (spec.uuid == ct.snapshotInfo.specId) {
                            ct.data.spec = spec;
                            ct.selectedSpecType = ct.data.spec.type;
                            // GPU 인스턴스의 스냅샷인지 체크하고 GPU 카드 선택할 수 있도록 변경. by hrit, 201015
                            if (ct.data.spec.type == 'GPU') {
                                ct.fn.getGpuCardList();
                            } else {
                                ct.isSpecLoad = true;
                                ct.fn.setSpecMinDisabled();
                                ct.fn.setSpecMaxDisabled();
                            }
                            break;
                        }
                    }
                }
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
                    if (spec.vcpus > ct.tenantResource.available.cores
                        || spec.ram > ct.tenantResource.available.ramSize 
                        || spec.disk > ct.tenantResource.available.hddVolumeGigabytes
                        || (ct.selectedSpecType == 'GPU' && ct.selectedGpuCard && spec.gpu > ct.selectedGpuCard.availableCount)   // 해당 프로젝트에서 사용가능한 개수
                        || (ct.selectedSpecType == 'GPU' && ct.selectedAvailabilityZone && spec.gpu > ct.selectedAvailabilityZone.availableMaxGpuCard)) {  // 해당 가용성 존에서 사용가능한 최대 개수
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
                var sltSpec = {};
                var specList = $filter('filterSpecList')(ct.specList, ct.selectedSpecType, ct.selectedGpuCard);
                for (var i=0; i<specList.length; i++) {
                    if (!specList[i].disabled) {
                        sltSpec = specList[i];
                        break;
                    }
                }
                ct.fn.selectSpec(sltSpec);
            }
        };

        ct.fn.selectSpec = function(sltSpec) {
            if (!ct.specDisabledAllSetting || sltSpec.disabled) return;
            if (sltSpec && sltSpec.uuid) {
                ct.data.spec = angular.copy(sltSpec);
                ct.specUuid = ct.data.spec.uuid;
                if (ct.volume.type == 'HDD') {
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.hddVolumeGigabytes - ct.data.spec.disk;
                } else if (ct.volume.type == 'SSD') {
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.ssdVolumeGigabytes;
                } else {
                    ct.volumeSliderOptions.ceil = 0;
                }
            } else {
                ct.data.spec = {};
                ct.specUuid = "";
            }
            
            ct.fn.setSelectedGpuCount();
        };

        // 네트워크 리스트 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/networks', 'GET', param);
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
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/domain/all', 'GET', param);
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
                ct.setVolumeSize(ct.inputVolumeSize);
            }
        };

        ct.inputVolumeSizeChange = function () {
            var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
            if (volumeSize >= ct.volumeSliderOptions.minLimit && volumeSize <= ct.volumeSliderOptions.ceil) {
                ct.volumeSize = ct.inputVolumeSize;
            }
            ct.setVolumeSize(ct.inputVolumeSize);
        };

        ct.inputVolumeSizeBlur = function () {
            var volumeSize = ct.inputVolumeSize ? parseInt(ct.inputVolumeSize, 10) : 0;
            if (volumeSize < ct.volumeSliderOptions.minLimit || volumeSize > ct.volumeSliderOptions.ceil) {
                ct.inputVolumeSize = ct.volumeSize;
            } else {
                ct.inputVolumeSize = volumeSize;
                ct.volumeSize = volumeSize;
            }
            ct.setVolumeSize(ct.inputVolumeSize);
        };

        ct.setVolumeSize = function (volumeSize) {
            volumeSize = parseInt(volumeSize);
            if (ct.volume.type == 'HDD')
                ct.hddSize = volumeSize;
            else if (ct.volume.type == 'SSD')
                ct.ssdSize = volumeSize;
        };


        ct.fn.createServer = function() {
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                return;
            }

            var params = {};

            params.instance                  = {};
            params.instance.name             = ct.data.name;
            params.instance.tenantId         = ct.data.tenantId;
            params.instance.networks = [{ id: ct.selectedAvailabilityZone.publicNetworkSubnet.networkId} ];
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
                params.volume.type = ct.volume.type;
                params.volume.size = ct.volumeSize;
                params.volume.tenantId = ct.data.tenantId;
            }

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess(ct.data.name+" 서버 생성이 시작 되었습니다.");
                // 페이지 이동으로 바꿔야 하고
                $scope.main.goToPage("/gpu/compute");
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
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
        
        // 볼륨 타입 호출
        ct.fn.getVolumeTypeList = function() {
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/common/volumeType', 'GET', ct.params , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.volumeTypes = data.content.volumeTypes;
            });
        };

        ct.hddSize = ct.ssdSize = 0;
        // 볼륨 타입 변경
        ct.fn.volumeChange = function () {
            if (ct.volume.type == 'HDD') {
                ct.volumeSliderOptions.ceil = ct.tenantResource.available.hddVolumeGigabytes - ct.data.spec.disk;
            } else if (ct.volume.type == 'SSD') {
                ct.volumeSliderOptions.ceil = ct.tenantResource.available.ssdVolumeGigabytes;
            } else {
                ct.volumeSliderOptions.ceil = 0;
            }
            ct.volumeSize = ct.volumeSize > ct.volumeSliderOptions.ceil ? ct.volumeSliderOptions.ceil : ct.volumeSize;
            ct.inputVolumeSize = ct.volumeSize;
            
            if (ct.volume.type == 'HDD') {
                ct.hddSize = ct.inputVolumeSize;
                ct.ssdSize = 0;
            } else if (ct.volume.type == 'SSD') {
                ct.ssdSize = ct.inputVolumeSize;
                ct.hddSize = 0;
            } else {
                ct.hddSize = 0;
                ct.ssdSize = 0;
            }
        };

        ct.fn.getGpuCardList = function() {
            $scope.main.loadingMainBody = true;

            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/gpu/card', 'GET');
            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.gpuCardList = data.content;
                    var rp = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/gpuUsed', 'GET', {tenantId: ct.data.tenantId});
                    rp.success(function (data2) {
                        var gpuCardResources = data2.content;
                        gpuCardResources.forEach(function (resource) {
                            for (var i = 0; i < ct.gpuCardList.length; i++) {
                                var gpuCard = ct.gpuCardList[i];
                                if (resource.gpuId == gpuCard.itemCode) {
                                    gpuCard.quatorCount = resource.total;
                                    gpuCard.quatorUsedCount = resource.used;
                                    var quator = resource.total - resource.used;
                                    var portal = gpuCard.count - gpuCard.usedCount;
                                    gpuCard.availableCount = quator <= portal ? quator: portal;
                                    console.log(gpuCard.name, gpuCard.availableCount)
                                    if (gpuCard.availableCount == undefined) gpuCard.availableCount = 0;
                                }
                            }
                        });
                        for (var i = 0; i < ct.gpuCardList.length; i++) {
                            var gpuCard = ct.gpuCardList[i];
                            if (gpuCard.id == ct.data.spec.gpuCardInfo.id && gpuCard.availableCount > 0) {
                                ct.selectedGpuCard = gpuCard;
                                ct.selectedGpuCardId = gpuCard.id;
                                ct.fn.onchangeGpuCard(ct.selectedGpuCardId);
                            }
                        }

                        ct.isSpecLoad = true;
                        ct.fn.setSpecMinDisabled();
                        ct.fn.setSpecMaxDisabled();
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.onchangeGpuCard = function (selectedGpuCardId) {
            ct.selectedGpuCard = {};
            ct.selectedAvailabilityZoneId = null;

            if (selectedGpuCardId) {
                var selectedGpuCard = common.objectsFindByField(ct.gpuCardList, 'id', selectedGpuCardId);
                if (selectedGpuCard) {
                    ct.selectedGpuCard = selectedGpuCard;
                    ct.fn.defaultSelectSpec();
                }
                ct.fn.getAvailabilityZoneList(selectedGpuCardId);
                ct.fn.setSpecAllEnabled();
                ct.fn.setSpecMaxDisabled(); // GpuCard 변경시 스펙 Disabled 여부 변경 by hrit, 201015
            }
            else {
                ct.fn.getAvailabilityZoneList();
            }
            ct.fn.setSelectedGpuCount();
        };

        ct.fn.setSelectedGpuCount = function () {
            // GPU 인스턴스는 프로젝트 자원 계획에 카드의 사용쿼터를 표시하므로 스펙 선택 시 GPU 사용량 표시 by hrit, 201015
            ct.gpuCardList.forEach(function (gpuCard) {
                gpuCard.selected = 0;
                if (gpuCard.id == ct.selectedGpuCardId) 
                    gpuCard.selected = ct.data.spec.gpu ? ct.data.spec.gpu: 0;
            });
        };


        ct.fn.getAvailabilityZoneList = function(gpuCardId) {
            var param = {
                gpuCardId : gpuCardId,
            };
            ct.availabilityZoneList  = [];
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/availabilityZones', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.availabilityZoneList = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.onchangeAvailabilityZone = function(availabilityZoneId) {
            ct.selectedAvailabilityZone = {};
            if (availabilityZoneId) {
                var availabilityZone = common.objectsFindByField(ct.availabilityZoneList, 'id', availabilityZoneId);
                if (availabilityZone) {
                    ct.selectedAvailabilityZone = availabilityZone;
                }
                // 해당 가용성 존에서 사용가능한 GPU 카드 최대 개수
                ct.fn.getAvailableMaxGpuCardByAvailabilityZone(ct.selectedGpuCardId, availabilityZoneId);
            }
        };

        // 해당 가용성 존에서 사용가능한 GPU 카드 최대 개수
        ct.fn.getAvailableMaxGpuCardByAvailabilityZone = function (gpuCardId, availabilityZoneId) {
            if (!gpuCardId || !availabilityZoneId) {
                return;
            }

            var params = {
                gpuCardId : gpuCardId,
                availabilityZoneId : availabilityZoneId
            };

            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/availabilityZone/gpu/availablemax', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (ct.selectedAvailabilityZone) {
                    ct.selectedAvailabilityZone.availableMaxGpuCard = data.content;
                    ct.fn.setSpecAllEnabled();
                    ct.fn.setSpecMaxDisabled();
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };


        ct.fn.checkGpu = function () {
            if (ct.selectedSpecType == 'GPU') {
                return ct.selectedGpuCardId != undefined && ct.selectedGpuCardId != '';
            } else {
                return true;
            }
        };

        ct.fn.filterGpuCard = function () {
            return function (item) {
                return item.availableCount > 0;
            }
        };

        if (ct.data.tenantId && ct.snapshotId) {
            $scope.main.loadingMainBody = true;
            ct.fn.getTenantResource();
            ct.fn.getSnapshotInfo(ct.snapshotId);
            ct.fn.networkListSearch();
            ct.fn.getKeypairList();
            ct.fn.getSecurityPolicy();
            ct.fn.getSpecList();
            ct.fn.getVolumeTypeList();
            ct.fn.getAvailabilityZoneList();

            $scope.main.panelToggleChange({currentTarget: $('#btn_quota_plan_toggle')})
        }
    })
    // .controller('iaasComputeRestoreCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, ValidationService, user, common, CONSTANTS) {
    .controller('gpuComputeRestoreCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, ValidationService, user, common, CONSTANTS) {
        // _DebugConsoleLog("computeSnapshotControllers.js : iaasComputeRestoreCtrl start", 1);
        _DebugConsoleLog("computeSnapshotControllers.js : gpuComputeRestoreCtrl start", 1);

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
        // pop.data.tenantId = common.getMainCtrlScope().main.userTenantId;
        // pop.data.tenantName = common.getMainCtrlScope().main.userTenant.korName;
        pop.data.tenantId = common.getMainCtrlScope().main.userTenantGpuId;
        pop.data.tenantName = common.getMainCtrlScope().main.userTenantGpu.korName;
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'GET', params, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshot', 'GET', params, 'application/x-www-form-urlencoded');
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param );
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/keypair', 'GET', param );
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
            // $scope.main.layerTemplateUrl2 = _IAAS_VIEWS_ + "/keypair/keypairForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl2 = _GPU_VIEWS_ + "/keypair/keypairForm.html" + _VersionTail();
            $("#aside-aside2").stop().animate({"right":"0"}, 500);
        };

        pop.fn.appendKeypair = function (keypair) {
            pop.keypairList.push(keypair);
            pop.keypairValue = keypair.name;
        };

        pop.fn.getKeyFile = function(keypair, type) {
            // document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+pop.data.tenantId+"&name="+keypair.name;
            document.location.href = CONSTANTS.gpuApiContextUrl + '/server/keypair/'+type+"?tenantId="+pop.data.tenantId+"&name="+keypair.name;
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
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', {instance : pop.data});
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'POST', {instance : pop.data});
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                	// $scope.main.goToPage("/iaas");
                    $scope.main.goToPage("/gpu");
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param , 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/spec', 'GET', param , 'application/x-www-form-urlencoded');
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'GET', param , 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/initScript', 'GET', param , 'application/x-www-form-urlencoded');
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/networks', 'GET', param);
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
    // .controller('iaasServerSnapshotDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuServerSnapshotDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        	// _DebugConsoleLog("storageControllers.js : iaasServerSnapshotDescriptionCtrl", 1);
        _DebugConsoleLog("storageControllers.js : gpuServerSnapshotDescriptionCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        // pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.snapShot 					= $scope.dialogOptions.selectSnapshot;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "스냅샷 설명 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/serverSnapshotDescriptionPopForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/compute/serverSnapshotDescriptionPopForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;


        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {

            if ($scope.actionBtnHied) return;

            $scope.actionBtnHied = true;

            var checkByte = $bytes.lengthInUtf8Bytes(pop.newSnapshotDesc);
            if (checkByte > 255) {
                common.showAlertWarning("스냅샷 설명이 255Byte를 초과하였습니다.");
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'PUT', {instanceSnapShot : param});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshot', 'PUT', {instanceSnapShot : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("스냅샷 설명이 변경 되었습니다.");

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
    // .controller('iaasStorageSnapshotDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuStorageSnapshotDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        	// _DebugConsoleLog("storageControllers.js : iaasStorageSnapshotDescriptionCtrl", 1);
        _DebugConsoleLog("storageControllers.js : gpuStorageSnapshotDescriptionCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        // pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.snapShot 					= $scope.dialogOptions.selectSnapshot;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "백업 이미지 설명 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/storageSnapshotDescriptionPopForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/compute/storageSnapshotDescriptionPopForm.html" + _VersionTail();

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

            // returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'PUT', {volumeSnapShot : param});
            returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshot', 'PUT', {volumeSnapShot : param});
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
