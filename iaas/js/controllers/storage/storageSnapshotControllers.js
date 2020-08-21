'use strict';

angular.module('iaas.controllers')
    .controller('iaasStorageSnapshotCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("storageSnapshotControllers.js : iaasStorageSnapshotCtrl", 1);

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
        ct.data.tenantId = $scope.main.userTenantId;

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshotList', 'GET', param);
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
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'DELETE', param);
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
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/storageSnapshotForm.html" + _VersionTail();
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
    .controller('iaasStorageSnapshotCreateCtrl', function ($scope, $location, $state, $window, $translate, $timeout, $stateParams, $bytes, $interval, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasStorageSnapshotCreateCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;
        // 첫 시작 로딩
        $scope.main.loadingMainBody = true;
        var ct               = this;
        ct.data              = {};
        ct.data.tenantId     = $scope.main.userTenantId;
        ct.data.tenantName   = $scope.main.userTenant.korName;
        ct.fn                = {};
        ct.volume            = {};
        ct.instances         = [];
        ct.sltInstance       = {};
        ct.formName          = "storageSnapshotForm";

        ct.volume.name      = 'disk-01';
        ct.storageNameList  = [];

        ct.data.snapshotId = $stateParams.snapshotId;

        // 디스크 크기 제한 설정
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

        ct.fn.inputVolumeSizeChange = function () {
            var volumeSize = ct.inputVolumeSize ? ct.inputVolumeSize : 0;
            if (volumeSize >= ct.volumeSliderOptions.minLimit && volumeSize <= ct.volumeSliderOptions.ceil) {
                ct.volumeSize = ct.inputVolumeSize;
            }
        };

        ct.fn.inputVolumeSizeBlur = function () {
            var volumeSize = ct.inputVolumeSize ? ct.inputVolumeSize : 0;
            if (volumeSize < ct.volumeSliderOptions.minLimit || volumeSize > ct.volumeSliderOptions.ceil) {
                ct.inputVolumeSize = ct.volumeSize;
            } else {
                ct.inputVolumeSize = volumeSize;
                ct.volumeSize = volumeSize;
            }
        };

        // 볼륨 생성전 체크
        ct.fn.createVolumeCheck = function () {
            if (ct.storageNameList.indexOf(ct.volume.name) > -1) {
                return common.showAlert("이미 사용중인 이름 입니다.");
            } else if (ct.volumeSize > ct.tenantResource.available.volumeGigabytes) {
                return common.showAlert("디스크 용량이 부족합니다.");
            }
            ct.fn.createVolume();
        };

        // 볼륨 생성
        ct.fn.createVolume = function() {
            $scope.main.loadingMainBody = true;
            var params = {};
            params.volumeSnapShot = ct.snapshotVolume;
            params.newVolumeInfo = {};
            params.newVolumeInfo.tenantId = ct.data.tenantId;
            params.newVolumeInfo.name = ct.volume.name;
            params.newVolumeInfo.type = 'HDD';
            params.newVolumeInfo.size = ct.volumeSize;
            params.newVolumeInfo.description = ct.volume.description;

            if (ct.sltInstance && ct.sltInstance.id) {
                params.newVolumeInfo.volumeAttachment = {};
                params.newVolumeInfo.volumeAttachment.id = ct.sltInstance.id;
                params.newVolumeInfo.volumeAttachment.instanceName = ct.sltInstance.name;
                params.newVolumeInfo.volumeAttachment.instanceId = ct.sltInstance.id;
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshotToVolume', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess(ct.volume.name+" 디스크 생성이 시작 되었습니다.");
                $scope.main.goToPage('/iaas/storage');
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError("message",data.message);
            });
            returnPromise.finally(function () {
                $scope.main.loadingMainBody = false;
            });
        };

        // 테넌트 자원 사용량 조회
        ct.fn.getTenantResource = function() {
            ct.isTenantResourceLoad = false;
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/usedLookup', 'GET', params);

            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.tenantResource = data.content;
                    ct.tenantResource.available = {};
                    ct.tenantResource.available.instances = ct.tenantResource.maxResource.instances - ct.tenantResource.usedResource.instances;
                    ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                    ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                    ct.tenantResource.available.instanceDiskGigabytes = ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes;
                    ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;

                    ct.tenantResource.usedResource.volumePercent = (ct.tenantResource.usedResource.volumeGigabytes/ct.tenantResource.maxResource.volumeGigabytes)*100;
                    ct.tenantResource.available.volumePercent = (ct.tenantResource.available.volumeGigabytes/ct.tenantResource.maxResource.volumeGigabytes)*100;

                    // 볼륨 크기 최대 제한
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.volumeGigabytes;
                    if (ct.volumeSliderOptions.ceil > CONSTANTS.iaasDef.insMaxDiskSize) {
                        ct.volumeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError("message",data.message);
            });
            returnPromise.finally(function () {
                ct.isTenantResourceLoad = true;
            });
        };

        // 볼륨 스냅샷 조회
        ct.fn.getStorageSnapshotInfo = function() {
            ct.isStorageSnapshotLoad = false;
            var param = {
                tenantId : ct.data.tenantId,
                snapshotId : ct.data.snapshotId
            };
            ct.snapshotVolume = {};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.volumeSnapShot && data.content.volumeSnapShot.snapshotId) {
                    ct.snapshotVolume = data.content.volumeSnapShot;
                    ct.volumeSize = ct.snapshotVolume.size;
                    ct.inputVolumeSize = ct.snapshotVolume.size;
                    ct.volumeSliderOptions.minLimit = ct.snapshotVolume.size;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError("message",data.message);
            });
            returnPromise.finally(function () {
                ct.isStorageSnapshotLoad = true;
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

        // 인스턴스 리스트 조회
        ct.fn.getServerList = function() {
            ct.isServerListLoad = false;
            var param = {
                tenantId : ct.data.tenantId
            };
            ct.instances = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    ct.instances = data.content.instances;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function () {
                ct.isServerListLoad = true;
            });
        };

        // 볼륨 리스트 조회
        ct.fn.getStorageList = function() {
            ct.isStorageListLoad = false;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue
            };

            param.size = 0;

            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                var volumes = [];
                if (data && data.content && data.content.volumes && angular.isArray(data.content.volumes)) {
                    volumes = data.content.volumes;
                    for (var i = 0; i < volumes.length; i++) {
                        ct.storageNameList.push(volumes[i].name);
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError("message", data.message);
                }
            });
            returnPromise.finally(function () {
                ct.isStorageListLoad = true;
            });
        };

        // 볼륨 이름 중복 체크
        ct.fn.storageNameCustomValidationCheck = function(name) {
            if (ct.storageNameList.indexOf(name) > -1) {
                return {isValid : false, message: "이미 사용중인 이름 입니다."};
            } else {
                return {isValid : true};
            }
        };

        // 페이지 첫 로딩
        ct.fn.firstPageLoading = function() {
            ct.fn.getServerList();
            ct.fn.getTenantResource();
            ct.fn.getStorageList();
            ct.fn.getStorageSnapshotInfo();

            // 함수 로드 체크
            var delay = 100;            // 100ms
            var maxCount = 10 * 60 * 3; // 최대 3분(1800번)
            var firstLoadingLoop = $interval(function () {
                $scope.main.loadingMainBody = true;
                if (maxCount < 0 || (ct.isServerListLoad == true && ct.isTenantResourceLoad == true && ct.isStorageListLoad == true == ct.isStorageSnapshotLoad == true)) {
                    $interval.cancel(firstLoadingLoop);
                    $scope.main.loadingMainBody = false;
                }
                maxCount--;
            }, delay);
        };

        ct.fn.firstPageLoading();
    })
    .controller('iaasStorageSnapshotFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasStorageSnapshotFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.data = {};
        pop.data.size = 1;
        pop.roles = [];
        pop.snapshot = angular.copy($scope.dialogOptions.snapshot);

        pop.formName = "storageSnapshotForm";
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "디스크 복원";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/storageSnapshotForm.html" + _VersionTail();


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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
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

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshotToVolume', 'POST', param);
            returnPromise.success(function (data, status, headers) {
            	$scope.main.goToPage('/iaas/storage');
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
