'use strict';

// angular.module('iaas.controllers')
angular.module('gpu.controllers')
    .controller('gpuStorageSnapshotCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("storageSnapshotControllers.js : gpuStorageSnapshotCtrl", 1);

        var ct = this;
        ct.data = {};
        ct.data.size = 0;
        ct.fn = {};
        ct.ui = {};
        ct.roles = [];
        ct.formName = "storageSnapshotForm";

        ct.fn.formOpen = function($event, snapshot){
    		ct.fn.createStorage($event, snapshot);
    	}

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantGpuId;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.fn.getStorageSnapshotList(1);
        });

        // Script list
        ct.fn.getStorageSnapshotList = function(page) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                volumeName: ct.volumeName,
                number : page
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshotList', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.snapshotList = data.content.volumeSnapShots;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };


        ct.fn.deleteSnapshot = function(snapshot) {
            common.showConfirm('백업 이미지 삭제',snapshot.snapshotName+' 백업 이미지을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : snapshot.tenantId,
                    snapshotId : snapshot.snapshotId
                }
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshot', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getStorageSnapshotList(1);
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.createStorage = function ($event,snapshot) {
            $scope.dialogOptions = {
                controller : "storageSnapshotFormCtrl",
                callBackFunction : ct.fn.getStorageSnapshotList,
                snapshot:snapshot
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/storage/storageSnapshotForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
			
            $scope.actionLoading = true; // action loading
        }

        if(ct.data.tenantId) {
            ct.fn.getStorageSnapshotList(1);
        }
    })
    .controller('gpuStorageSnapshotCreateCtrl', function ($scope, $location, $state, $window, $translate, $timeout, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuStorageSnapshotCreateCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct               = this;
        ct.data              = {};
        ct.data.tenantId     = $scope.main.userTenantGpuId;
        ct.data.tenantName   = $scope.main.userTenantGpu.korName;
        ct.fn                = {};
        ct.volume            = {};
        ct.instances         = [];
        ct.sltInstance       = {};
        ct.formName          = "storageSnapshotForm";
        ct.isTenantResourceLoad = false;

        ct.volume.name      = 'disk-01';

        ct.data.snapshotId = $stateParams.snapshotId;

        ct.inputVolumeSizeChange = function () {
            var volumeSize = ct.inputVolumeSize ? ct.inputVolumeSize : 0;
            if (volumeSize >= ct.volumeSliderOptions.minLimit && volumeSize <= ct.volumeSliderOptions.ceil) {
                ct.volumeSize = ct.inputVolumeSize;
            }
        };

        ct.inputVolumeSizeBlur = function () {
            var volumeSize = ct.inputVolumeSize ? ct.inputVolumeSize : 0;
            if (volumeSize < ct.volumeSliderOptions.minLimit || volumeSize > ct.volumeSliderOptions.ceil) {
                ct.inputVolumeSize = ct.volumeSize;
            } else {
                ct.inputVolumeSize = volumeSize;
                ct.volumeSize = volumeSize;
            }
        };

        //디스크생성 변수
        ct.volumeSize = 100;
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

        ct.fn.getTenantResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/usedLookup', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.tenantResource = data.content;
                    ct.tenantResource.available = {};
                    ct.tenantResource.available.instances = ct.tenantResource.maxResource.instances - ct.tenantResource.usedResource.instances;
                    ct.tenantResource.available.floatingIps = ct.tenantResource.maxResource.floatingIps - ct.tenantResource.usedResource.floatingIps;
                    ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                    ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                    ct.tenantResource.available.instanceDiskGigabytes = ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes;
                    ct.tenantResource.available.objectStorageGigaByte = ct.tenantResource.maxResource.objectStorageGigaByte - ct.tenantResource.usedResource.objectStorageGigaByte;
                    // hdd, ssd 구분
                    ct.fn.changeVolumeType();
                }
                ct.isTenantResourceLoad = true;
            });
            returnPromise.error(function (data, status, headers) {
                ct.isTenantResourceLoad = true;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.isStorageSnapshotLoad = false;
        ct.fn.getStorageSnapshotInfo = function() {
            var param = {
                tenantId : ct.data.tenantId,
                snapshotId : ct.data.snapshotId
            };
            ct.snapshotVolume = {};
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshot', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.volumeSnapShot && data.content.volumeSnapShot.snapshotId) {
                    ct.snapshotVolume = data.content.volumeSnapShot;
                    ct.volumeSize = ct.snapshotVolume.size;
                    ct.inputVolumeSize = ct.snapshotVolume.size;
                    ct.volumeSliderOptions.minLimit = ct.snapshotVolume.size;
                    ct.volume.type = ct.snapshotVolume.type;
                }
                ct.isStorageSnapshotLoad = false;
            });
            returnPromise.error(function (data, status, headers) {
                ct.isStorageSnapshotLoad = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.sltInstanceChange = function (sltInstanceId) {
            var sltInstance = null;
            if (sltInstanceId) {
                sltInstance = common.objectsFindCopyByField(ct.instances, "id", sltInstanceId);
            }
            if (sltInstance && sltInstance.id) {
                ct.sltInstance = sltInstance;
                ct.sltInstanceId = sltInstanceId;
            } else {
                ct.sltInstance = {};
                ct.sltInstanceId = "";
            }
        };

        // 서버메인 tenant list 함수
        ct.isServerListLoad = false;
        ct.fn.serverList = function() {
            var param = {
                tenantId : ct.data.tenantId
            };
            ct.instances         = [];
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    ct.instances = data.content.instances;
                }
                ct.isServerListLoad = true;
            });
            returnPromise.error(function (data, status, headers) {
                ct.isServerListLoad = true;
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.createStorageVolumeAction = function() {
            $scope.main.loadingMainBody = true;
            var params = {};
            params.volumeSnapShot = ct.snapshotVolume;
            params.newVolumeInfo = {};
            params.newVolumeInfo.tenantId = ct.data.tenantId;
            params.newVolumeInfo.name = ct.volume.name;
            params.newVolumeInfo.type = ct.volume.type;
            params.newVolumeInfo.size = ct.volumeSize;
            params.newVolumeInfo.description = ct.volume.description;

            if (ct.sltInstance && ct.sltInstance.id) {
                params.newVolumeInfo.volumeAttachment = {};
                params.newVolumeInfo.volumeAttachment.id = ct.sltInstance.id;
                params.newVolumeInfo.volumeAttachment.instanceName = ct.sltInstance.name;
                params.newVolumeInfo.volumeAttachment.instanceId = ct.sltInstance.id;
            }

            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshotToVolume', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.goToPage('/gpu/storage');
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        };

        ct.fn.snapshotAndCreateStorage = function () {
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                return;
            }

            if (ct.tenantResource.available.volumeGigabytes <= 0 || ct.volumeSize > ct.tenantResource.available.volumeGigabytes) {
                return common.showAlert("볼륨용량 제한으로 생성할 수 없습니다.");
            }

            ct.fn.createStorageVolumeAction();
        };

        ct.cancelAction = function () {
            $window.history.back();
        };
        // 볼륨 타입 호출
        ct.fn.getVolumeTypeList = function() {
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/common/volumeType', 'GET', ct.params , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.volumeTypes = data.content.volumeTypes;

            });
        };

        ct.fn.changeVolumeType = function () {
            if (ct.volume.type == 'HDD') {
                ct.tenantResource.available.hddVolumeGigabytes = ct.tenantResource.maxResource.hddVolumeGigabytes - ct.tenantResource.usedResource.hddVolumeGigabytes;
                ct.tenantResource.maxResource.volumeGigabytes = ct.tenantResource.maxResource.hddVolumeGigabytes
                ct.tenantResource.usedResource.volumeGigabytes = ct.tenantResource.usedResource.hddVolumeGigabytes
                ct.volumeSliderOptions.ceil = ct.tenantResource.available.hddVolumeGigabytes;
            } else if (ct.volume.type == 'SSD') {
                ct.tenantResource.available.ssdVolumeGigabytes = ct.tenantResource.maxResource.ssdVolumeGigabytes - ct.tenantResource.usedResource.ssdVolumeGigabytes;
                ct.tenantResource.maxResource.volumeGigabytes = ct.tenantResource.maxResource.ssdVolumeGigabytes
                ct.tenantResource.usedResource.volumeGigabytes = ct.tenantResource.usedResource.ssdVolumeGigabytes
                ct.volumeSliderOptions.ceil = ct.tenantResource.available.ssdVolumeGigabytes;
            } else {
                ct.tenantResource.available.hddVolumeGigabytes = 0;
                ct.tenantResource.available.ssdVolumeGigabytes = 0;
                ct.tenantResource.maxResource.volumeGigabytes = 0;
                ct.tenantResource.usedResource.volumeGigabytes = 0;
                ct.volumeSliderOptions.ceil = 0;
            }
            
            ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;
            ct.tenantResource.usedResource.volumePercent = (ct.tenantResource.usedResource.volumeGigabytes/ct.tenantResource.maxResource.volumeGigabytes)*100;
            ct.tenantResource.available.volumePercent = (ct.tenantResource.available.volumeGigabytes/ct.tenantResource.maxResource.volumeGigabytes)*100;

            ct.volumeSize = ct.volumeSize > ct.volumeSliderOptions.ceil ? ct.volumeSliderOptions.ceil : ct.volumeSize;
            ct.inputVolumeSize = ct.volumeSize;
        };

        ct.fn.checkVolume = function () {
            ct.volumeSize = ct.volumeSize > ct.volumeSliderOptions.ceil ? ct.volumeSliderOptions.ceil : ct.volumeSize;
            ct.inputVolumeSize = ct.volumeSize;
        };

        ct.fn.serverList();
        ct.fn.getTenantResource();
        ct.fn.getStorageSnapshotInfo();
        ct.fn.getVolumeTypeList();
    })
    .controller('gpuStorageSnapshotFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuStorageSnapshotFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);

        pop.fn = {};
        pop.data = {};
        pop.data.size = 1;
        pop.roles = [];
        pop.snapshot = angular.copy($scope.dialogOptions.snapshot);

        pop.formName = "storageSnapshotForm";
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "디스크 복원";

        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/storageSnapshotForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/storageSnapshotForm.html" + _VersionTail();


        // Dialog ok 버튼 클릭 시 액션 정의
        pop.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            
            var checkByte = $bytes.lengthInUtf8Bytes(pop.data.description);
        	if(checkByte > 255){
                common.showAlertWarning("디스크 설명이 255Byte를 초과하였습니다.");
        		$scope.actionBtnHied = false;
        		return;
        	}

        	if(Number(pop.data.size) < pop.snapshotVolume.size){
                common.showAlertWarning("디스크 크기는 size up만 가능 합니다. 디스크 크기 최소값 : " + pop.snapshotVolume.size + ", 입력값 : " + pop.data.size );
                pop.data.size = pop.snapshotVolume.size;
                $scope.actionBtnHied = false;
                return;
            }

            if(Number(pop.data.size) > (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes)){
                common.showAlertWarning("디스크 크기가 쿼터를 초과 하였습니다. 쿼터 크기 : " + (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes) + ", 입력값 : " + pop.data.size );
                pop.data.size = pop.snapshotVolume.size;
                $scope.actionBtnHied = false;
                return;
            }


            pop.fn.createStorageVolumeAction();
        };

        pop.popCancel = function () {
        	$(".aside").stop().animate({"right":"-360px"}, 400);
        };

        pop.fn.getTenantResource = function() {
            var params = {
                tenantId : pop.userTenant.tenantId
            }
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.resource = data.content[0];
                pop.resourceDefault = angular.copy(pop.resource);
                pop.resource.usedResource.volumeGigabytes += pop.data.size;
                pop.fn.getStorageInfo();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        pop.fn.getStorageInfo = function() {
        	$scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.snapshot.tenantId,
                volumeId : pop.snapshot.volumeId
            }
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
            	pop.snapshotVolume = data.content.volumes[0];
                pop.data.type = pop.snapshotVolume.type;
                pop.data.size = pop.snapshotVolume.size;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.volumeSizeAction = function(flag) {
            if(flag) {
                pop.data.size = Number(pop.data.size) + 1;
                if(Number(pop.resourceDefault.maxResource.volumeGigabytes) < (Number(pop.data.size) + Number(pop.resourceDefault.usedResource.volumeGigabytes))){
                    pop.data.size = Number(pop.data.size) - 1;
                }
            } else {
                if(Number(pop.data.size) - 1 >= 1) {
                    pop.data.size = Number(pop.data.size) - 1;
                }
            }
            pop.resource.usedResource.volumeGigabytes = Number(pop.data.size) + Number(pop.resourceDefault.usedResource.volumeGigabytes);
        }

        pop.fn.changeVolumeSize = function() {
            // pop.resource.usedResource.volumeGigabytes = Number(pop.data.size) + Number(pop.resourceDefault.usedResource.volumeGigabytes);
        }

        pop.fn.createStorageVolumeAction = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            var param = {
                newVolumeInfo : pop.data,
                volumeSnapShot : pop.snapshot
            };

            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshotToVolume', 'POST', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshotToVolume', 'POST', param);
            returnPromise.success(function (data, status, headers) {
            	// $scope.main.goToPage('/iaas/storage');
                $scope.main.goToPage('/gpu/storage');
            });
            returnPromise.error(function (data, status, headers) {
            	pop.popCancel();
            	$scope.main.loadingMainBody = false;
            	common.showAlert("message",data.message);
                $scope.error = data.message;
            });
        };

        pop.fn.checkByte = function (text, maxValue){
            pop.checkByte = $bytes.lengthInUtf8Bytes(text);
        }
        
        pop.formatter = function(data){
			return data + 'G';
		}

        pop.fn.getTenantResource();
    })
;
