'use strict';

angular.module('gpu.controllers')
    .controller('gpuStorageCtrl', function ($scope, $location, $state,$translate,$filter, $stateParams, user, $q,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("storageControllers.js : gpuStorageCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.storageMainList = [];
        ct.typeState = true;
        ct.listType = "image";

        ct.fn.formOpen = function($event, state, data){
        	ct.formType = state;
    		if (state == 'storage') {
    			ct.fn.createStorage($event);
    		} else if (state == 'snapshot') {
    			ct.fn.createPopSnapshot($event,data);
    		} else if (state == 'rename') {
    			ct.fn.reNamePopStorage($event,data);
    		} else if (state == 'description') {
                ct.fn.modifyDescription($event,data);
            } else if (state == 'resize') {
    			ct.fn.reSizePopStorage($event,data);
    		}
        };

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.data.tenantName = $scope.main.userTenantGpu.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
        	ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getStorageList();
        });

        var conditionValue = $stateParams.volumeName;
        if (conditionValue) {
            ct.conditionKey = 'name';
            ct.conditionValue = conditionValue;
        } else {
            ct.conditionKey = '';
        }

        ct.isStorageMainListLoad = false;
        ct.fn.getStorageList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue
            };

            param.size = 0;
            
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                var volumes = [];
                if (data && data.content && data.content.volumes && angular.isArray(data.content.volumes)) {
                    volumes = data.content.volumes;
                    if (data.totalElements != 0) {
                        ct.isStorageMainListLoad = true;
                    }
                    // 미생성 Bootable 볼륨 체크 by hrit, 201016
                    var rp = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/bootable', 'GET', param));
                    rp.success(function (data2, status, headers) {
                        if (data2.content.volumes.length > 0) {
                            console.log(volumes.length, data2.content.volumes)
                            volumes = volumes.concat(data2.content.volumes);
                            console.log(volumes.length, volumes)
                            common.objectOrArrayMergeData(ct.storageMainList, volumes);
                        }
                    });
                }
                common.objectOrArrayMergeData(ct.storageMainList, volumes);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlert("message", data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                if (!ct.storageMainList || ct.storageMainList.length == 0) $scope.main.checkUseYnPortalOrgSystem("gpu");
            });
        };

        //추가 전체 디스크 크기
        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.createStorage = function ($event) {
            $scope.dialogOptions = {
                controller : "storageFormCtrl",
                callBackFunction : ct.fn.getStorageList
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/storage/storageForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
            
            $scope.actionLoading = true; // action loading
        };

        ct.fn.checkAll = function($event) {
            ct.roles = [];
            if ($event.currentTarget.checked) {
                for (var i=0; i < ct.storageMainList.length; i++) {
                    if (ct.storageMainList[i].status != 'in-use') {
                        ct.roles.push(ct.storageMainList[i].volumeId);
                    }
                }
            }
        };

        ct.fn.checkOne = function($event,id) {
            if ($event.currentTarget.checked) {
                if (ct.roles.length == $("#mainList tbody").find("input[type='checkbox']").length) {
                    $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);
            }
        };

        ct.deleteVolumes = function(type, id) {
        	if (type == 'thum') {
        		common.showConfirm('볼륨 삭제','볼륨을 삭제 하시겠습니까?').then(function(){
                    ct.deleteVolumesAction(type, id);
                });
        	} else if (type == 'tbl') {
        		if (ct.roles.length == 0) {
                    common.showAlert('메세지','선택된 볼륨이 없습니다.');
                } else {
                    common.showConfirm('볼륨 삭제','선택된 '+ct.roles.length+'개의 볼륨을 삭제 하시겠습니까?').then(function(){
                        ct.deleteVolumesAction(type, id);
                    });
                }
        	}
        };

        // 스토리지 삭제
        ct.deleteVolumesAction = function(type, id) {
            var prom = [];
            if (type == 'thum') {
            	prom.push(ct.deleteVolumesJob(id));
            } else if (type == 'tbl') {
            	for (var i=0; i< ct.roles.length; i++) {
                    prom.push(ct.deleteVolumesJob(ct.roles[i]));
                }
            }
            $q.all(prom).then(function(results){
                for (var i=0; i < results.length; i++ ) {
                    if (!results[i]) {
                        common.showAlert('메세지','오류가 발생하였습니다.');
                    }
                }
                common.showAlertSuccess('볼륨이 삭제 되었습니다.');
                ct.fn.getStorageList();
                ct.roles = [];
            }).catch(function(e){
                common.showAlert('메세지',e);
            });
        };

        // 스토리지 삭제
        ct.deleteVolumesJob = function(id) {
        	$scope.main.loadingMainBody = true;
            var deferred = $q.defer();
            if (typeof id !== 'string') {
                return;
            }
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : id
            };
            
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'DELETE', param)
            returnPromise.success(function (data, status, headers) {
                deferred.resolve(true);
            });
            returnPromise.error(function (data, status, headers) {
                deferred.reject(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });

            return deferred.promise;
        };

        ct.createSnapshotPopBefore = function ($event,volume) {
            if (volume.status == 'in-use' || volume.status == 'available') {
                if (volume.status == 'in-use') {
                    var param = {
                        tenantId : volume.tenantId,
                        volumeId : volume.volumeId
                    };
                    var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
                    returnPromise.success(function (data, status, headers) {
                    	if (data.content.instanceStatus == 'active') {
                        	common.showAlert('경고',data.content.instanceName + '이 실행 중입니다. 인스턴스를 정지하고 시도해주세요.');
                        } else {
                        	ct.fn.createPopSnapshot($event,volume);
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlert('오류',data.message);
                    });
                    returnPromise.finally(function (data, status, headers) {
                        $scope.main.loadingMainBody = false;
                    });
                } else {
                    ct.fn.createSnapshotPop($event,volume);
                }
            } else {
                common.showAlert('메세지','스냅샷을 생성할 수 있는 상태가 아닙니다.');
            }
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        
        ///////////////////////////////////////////////////////////////////
        ////////2018.11.22 sg0730//////////////////////////////////////////
        ///////* 기존 레이어 팝업 호출 폼에서 모달팝업으로 변경.////////////////////////////
        ///////* AS-IS : iaasCreateStorageSnapshotFormCtrl/////////////////
        ///////* TO-BE : iaasCreateStorageSnapshotPopFormCtrl/////////////////
        ///////////////////////////////////////////////////////////////////
        
        ct.fn.createPopSnapshot = function($event,volume) {
        	var dialogOptions =  {
                    controller       : "gpuCreateStorageSnapshotPopFormCtrl" ,
                    formName         : 'gpuCreatePopStorageSnapshotForm',
                    selectStorage    : angular.copy(volume),
                    callBackFunction : ct.reStorageSnapShotCallBackFunction
                };
        	
            	$scope.actionBtnHied = false;
            	common.showDialog($scope, $event, dialogOptions);
            	$scope.actionLoading = true; // action loading
        };
        
        ct.reStorageSnapShotCallBackFunction = function () {
            ct.fn.getStorageList();
        };
        
        ct.fn.reNamePopStorage = function($event, volume) {
        	var dialogOptions =  {
                // controller       : "iaasReNamePopStorageCtrl" ,
                // formName         : 'iaasReNamePopStorageForm',
                controller       : "gpuReNamePopStorageCtrl" ,
                formName         : 'gpuReNamePopStorageForm',
                selectStorage    : angular.copy(volume),
                callBackFunction : ct.reNamePopStorageCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };
        
        ct.reNamePopStorageCallBackFunction = function () {
            ct.fn.getStorageList();
        };

        // 디스크 설명 수정
        ct.fn.modifyDescription = function($event,volume) {

            var dialogOptions =  {
                // controller       : "iaasStorageDescriptionCtrl" ,
                // formName         : 'iaasStorageDescriptionForm',
                controller       : "gpuStorageDescriptionCtrl" ,
                formName         : 'gpuStorageDescriptionForm',
                selectStorage    : angular.copy(volume),
                callBackFunction : ct.modifyDescriptionCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.modifyDescriptionCallBackFunction = function () {
             $scope.main.replacePage();
        };

        ct.reStorageSnapShotCallBackFunction = function () {
            ct.fn.getStorageList();
        };

        //////////////////////////////////////////////////////////////////////////
        //////////       2018.11.29 디스크 사이즈 변경 팝업      sg0730       ////////////////
        //////////////////////////////////////////////////////////////////////////
        ct.fn.reSizePopStorage = function($event,volume) {

        	var dialogOptions =  {
                controller       : "gpuReSizePopStorageCtrl" ,
                formName         : 'gpuReSizePopStorageForm',
                selectStorage    : angular.copy(volume),
                callBackFunction : ct.reSizePopStorCallBackFunc
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };
        
        ct.reSizePopStorCallBackFunc = function () {
            ct.fn.getStorageList();
        };

        if (!$scope.main.sltPortalOrg.isUseGpu) {
            common.showDialogAlert('알림', '현재 프로젝트는 "GPU 서버 가상화"를 이용하지 않는 프로젝트입니다.');
            $scope.main.goToPage("/comm/projects/projectDetail/" + $scope.main.sltPortalOrg.id);
        }

        if (ct.data.tenantId) {
            ct.fn.getStorageList();
        }

    })
    .controller('gpuStorageFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuStorageFormCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct               = this;
        ct.data              = {};
        ct.fn                = {};
        ct.volume            = {};
        ct.instances         = [];
        ct.sltInstance       = {};
        ct.data.tenantId     = $scope.main.userTenantGpuId;
        ct.data.tenantName   = $scope.main.userTenantGpu.korName;
        ct.formName          = "storageForm";
        ct.validDisabled = true;
        ct.isTenantResourceLoad = false;
        ct.volume.type       ="";
        ct.volume.name      = 'disk-01';
        ct.storageNameList = [];

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

        //디스크생성 변수
        ct.volumeSize = 0;
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

        // Dialog ok 버튼 클릭 시 액션 정의
        ct.checkVal = function () {
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                return;
            }

            if (ct.storageNameList.indexOf(ct.volume.name) > -1) {
                return common.showAlert("이미 사용중인 이름 입니다.");
            }

            if (ct.volume.type == "") {
                return common.showAlert("볼륨타입을 선택해주세요.");
            }

            if (ct.tenantResource.available.volumeGigabytes <= 0 || ct.volumeSize > ct.tenantResource.available.volumeGigabytes) {
                return common.showAlert("볼륨용량 제한으로 생성할 수 없습니다.");
            }
            ct.fn.createStorageVolumeAction();
        };

        // 디스크 생성 부분 추가 2018.11.13 sg0730
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
        // 볼륨 타입 호출
        ct.fn.getVolumeTypeList = function() {
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/common/volumeType', 'GET', ct.params , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.volumeTypes = data.content.volumeTypes;
            });
        };
        
        // val 통과 실제 디스크 생성 호출
        ct.fn.createStorageVolumeAction = function() {
            $scope.main.loadingMainBody = true;

            var params = {};

            params.volume = {};
            params.volume.tenantId = ct.data.tenantId;
            params.volume.name = ct.volume.name;
            params.volume.type = ct.volume.type;
            params.volume.size = ct.volumeSize;
            params.volume.description = ct.volume.description;

            if (ct.sltInstance && ct.sltInstance.id) {
                params.volume.volumeAttachment = {};
                params.volume.volumeAttachment.id = ct.sltInstance.id;
                params.volume.volumeAttachment.instanceName = ct.sltInstance.name;
                params.volume.volumeAttachment.instanceId = ct.sltInstance.id;
            }

            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'POST', params);
            returnPromise.success(function (data, status, headers) {
            	// 서버생성후 -> 디스크 생성 후 sucess 처리.
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess(ct.volume.name+" 볼륨 생성이 시작 되었습니다.");
                // 페이지 이동으로 바꿔야 하고
                $scope.main.goToPage("/gpu/storage");
            });
            returnPromise.error(function (data, status, headers) {
            	$scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
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

        ct.fn.getStorageList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue
            };

            param.size = 0;

            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                var volumes = [];
                if (data && data.content && data.content.volumes && angular.isArray(data.content.volumes)) {
                    volumes = data.content.volumes;
                    for (var i = 0; i < volumes.length; i++) {
                        ct.storageNameList.push(volumes[i].name);
                    }
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlert("message", data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.storageNameCustomValidationCheck = function(name) {
            if (ct.storageNameList.indexOf(name) > -1) {
                return {isValid : false, message: "이미 사용중인 이름 입니다."};
            } else {
                return {isValid : true};
            }
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

        ct.fn.getTenantResource();
        ct.fn.serverList();
        ct.fn.getStorageList();
        ct.fn.getVolumeTypeList();

    })
    .controller('gpuStorageDetailCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, user, common,$filter, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuStorageDetailCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.volume = {};
        ct.data.volumeId = $stateParams.volumeid;
        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.expandVolumeSize = 10;

        ct.fn.formOpen = function($event, state, data){
            ct.formType = state;
    		if (state == 'storageEdit') {
    			ct.fn.storageEdit($event, data);
    		} else if (state == 'snapshot') {
    			ct.createSnapshotPopBefore($event, data);
    		}
        };
        
        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            $scope.main.goToPage("/gpu");
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getStorageInfo();
        });

        ct.fn.getStorageInfo = function() {
        	$scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : ct.data.volumeId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.volume = data.content.volumes[0];
                ct.expandVolumeSize = ct.volume.size;
                if (ct.volume.volumeAttachment != null) {
                    ct.fn.getInstanceInfo(ct.volume.volumeAttachment.instanceId);
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //인스턴스 상세 정보 조회
        ct.fn.getInstanceInfo = function(instanceId) {
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : instanceId,
                queryType : 'detail'
            };
            $scope.main.loadingMain = true;
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data.content.instances.length == 1) {
                    ct.instance = data.content.instances[0];
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMain = false;
            });
        };

        ct.fn.changeNetwork = function() {
            if (isNaN(Number(ct.expandVolumeSize))) return;

            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : ct.volume.volumeId,
                size : ct.expandVolumeSize,
                description : ct.volume.description,
                name : ct.volume.name
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.goToPage('/gpu/storage');
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.dettachVolume = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : ct.volume.volumeId,
                id : ct.volume.volumeAttachment.id,
                instanceId : ct.volume.volumeAttachment.instanceId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach : param});
            returnPromise.success(function (data, status, headers) {
                ct.fn.getStorageInfo();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.volumeSizeAction = function(flag) {
            if (flag) {
                ct.expandVolumeSize += 1;
                if (ct.resourceDefault.maxResource.volumeGigabytes < ct.expandVolumeSize) {
                    ct.expandVolumeSize -= 1;
                }
            } else {
                if (ct.expandVolumeSize - ct.volume.size >= 1) {
                    ct.expandVolumeSize -= 1;
                }
            }
            ct.resource.usedResource.volumeGigabytes = ct.expandVolumeSize - ct.volume.size + ct.resourceDefault.usedResource.volumeGigabytes;
        };

        //sg0730
        ct.fn.storageEdit = function ($event, data) {
            $scope.dialogOptions = {
                controller : "gpuStorageEditFormCtrl",
                callBackFunction : null,
                volume : data
                
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/storage/subMenus/storageEditForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"), top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
            
            $scope.actionLoading = true; // action loading
        };
        
        ct.createSnapshotPopBefore = function ($event,volume) {
            if (volume.status == 'in-use' || volume.status == 'available') {
                if (volume.status == 'in-use') {
                    var param = {
                        tenantId : volume.tenantId,
                        volumeId : volume.volumeId
                    };
                    var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
                    returnPromise.success(function (data, status, headers) {
                    	if (data.content.instanceStatus == 'active') {
                        	common.showAlert('경고',data.content.instanceName + '이 실행 중입니다. 인스턴스를 정지하고 시도해주세요.');
                        } else {
                            ct.fn.createSnapshotPop($event,volume);
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlert('에러',data.message);
                    });
                    returnPromise.finally(function (data, status, headers) {
                        $scope.main.loadingMainBody = false;
                    });
                } else {
                    ct.fn.createSnapshotPop($event,volume);
                }
            } else {
                common.showAlert('메세지','스냅샷을 생성할 수 있는 상태가 아닙니다.');
            }
        };
        
        ct.fn.createSnapshotPop = function ($event,volume) {
            $scope.dialogOptions = {
                controller : "gpuCreateStorageSnapshotFormCtrl",
                callBackFunction : null,
                volume : volume
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/storage/createSnapshotForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
            $scope.actionLoading = true; // action loading
        };

        if (ct.data.tenantId) {
            ct.fn.getStorageInfo();
        }
    })
    .controller('gpuStorageEditFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuStorageEditFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.volume = angular.copy($scope.dialogOptions.volume);
        pop.fn = {};
        pop.formName = "snapshotEditForm";
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "볼륨 수정";

        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/subMenus/storageEditForm.html" + _VersionTail();

        pop.popCancel = function () {
        	$(".aside").stop().animate({"right":"-360px"}, 400);
        };
        
        pop.fn.getStorageInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.userTenant.tenantId,
                volumeId : pop.volume.volumeId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.volume = data.content.volumes[0];
                pop.expandVolumeSize = pop.volume.size;
                pop.fn.getTenantResource();
                
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };
        
        pop.fn.getTenantResource = function() {
            var params = {
                tenantId : pop.userTenant.tenantId
            };
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/usedLookup', 'GET', params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.resource = angular.copy(data.content[0]);
                pop.resourceDefault = angular.copy(data.content[0]);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };
        
        pop.fn.volumeSizeAction = function(flag) {
            if (flag) {
            	pop.expandVolumeSize += 1;
                if (pop.resourceDefault.maxResource.volumeGigabytes < pop.expandVolumeSize) {
                	pop.expandVolumeSize -= 1;
                }

            } else {
                if (pop.expandVolumeSize - pop.volume.size >= 1) {
                	pop.expandVolumeSize -= 1;
                }
            }
            pop.resource.usedResource.volumeGigabytes = pop.expandVolumeSize - pop.volume.size + pop.resourceDefault.usedResource.volumeGigabytes;
        };
        
        pop.fn.changeVolumeSize = function() {
            pop.resource.usedResource.volumeGigabytes = Number(pop.data.size) + Number(pop.resourceDefault.usedResource.volumeGigabytes);
        };
        
        pop.fn.updateVolume = function() {
            if (isNaN(Number(pop.expandVolumeSize))) return;
            var checkByte = $bytes.lengthInUtf8Bytes(pop.volume.description);
        	if (checkByte > 255) {
                common.showAlertWarning("볼륨 설명이 255Byte를 초과하였습니다.");
        		return;
        	}
            if (Number(pop.expandVolumeSize) < pop.volume.size) {
                common.showAlertWarning("볼륨 크기는 size up만 가능 합니다. 볼륨 크기 최소값 : " + pop.volume.size + ", 입력값 : " + pop.expandVolumeSize);
                pop.expandVolumeSize = pop.volume.size;
                return;
            }
            if (Number(pop.expandVolumeSize) > (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes)) {
                common.showAlertWarning("볼륨 크기가 쿼터를 초과 하였습니다. 쿼터 크기 : " + (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes) + ", 입력값 : " + pop.expandVolumeSize );
                pop.expandVolumeSize = pop.volume.size;
                return;
            }

            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.userTenant.tenantId,
                volumeId : pop.volume.volumeId,
                size : pop.expandVolumeSize,
                description : pop.volume.description,
                name : pop.volume.name
            };
            
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            returnPromise.success(function (data, status, headers) {
            	setTimeout(function() {
            		$scope.main.loadingMainBody = false;
            		common.stateReload();
            	}, 1000);
            	
            });
            returnPromise.error(function (data, status, headers) {
                $state.reload();
                common.showAlertError(data.message);
            });
            /*returnPromise.finally(function (data, status, headers) {
            	$scope.main.loadingMainBody = false;
            });*/
        };

        pop.fn.checkByte = function (text, maxValue){
            pop.checkByte = $bytes.lengthInUtf8Bytes(text);
        };

        pop.formatter = function(data){
			return data + 'G';
		};
        
        if (pop.userTenant.tenantId) {
            pop.fn.getStorageInfo();
        }
    })
    //////////////////////////////////////////////////////////////////////////
    //////////////       2018.11.21 디스크 생성 폼      sg0730       //////////////////
    //////////////////////////////////////////////////////////////////////////
    .controller('gpuCreateStorageSnapshotFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuCreateStorageSnapshotFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.volume = angular.copy($scope.dialogOptions.volume);
        pop.fn = {};
        pop.formName = "createSnapshotForm";
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "볼륨 스냅샷 생성";

        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/createSnapshotForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        pop.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            
            var checkByte = $bytes.lengthInUtf8Bytes(pop.data.description);
        	if (checkByte > 255) {
        		alert("255Byte를 초과하였습니다.");
        		$scope.actionBtnHied = false;
        		return;
        	}
            
            pop.fn.createSnapshot();
        };

        pop.popCancel = function () {
        	$(".aside").stop().animate({"right":"-360px"}, 400);
        };

        pop.fn.createSnapshot = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            pop.data.volumeId = pop.volume.volumeId;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'POST', {volumeSnapShot:pop.data});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshot', 'POST', {volumeSnapShot:pop.data});
            returnPromise.success(function (data, status, headers) {
                // $scope.main.goToPage('/iaas/storage/snapshot');
                $scope.main.goToPage('/gpu/storage/snapshot');
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert('메세지',data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }
    })
    //////////////////////////////////////////////////////////////////////////
    //////////////       2018.11.22 디스크 백업 이미지 생성 팝업      sg0730 ///////////////
    //////////////////////////////////////////////////////////////////////////    
    .controller('gpuCreateStorageSnapshotPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuCreateStorageSnapshotPopFormCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.volume 						= $scope.dialogOptions.selectStorage;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        
        $scope.dialogOptions.title 		= "스냅샷 생성";
        $scope.dialogOptions.okName 	= "생성";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/storageCreatePopSnapshotForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;
        
       // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
             $scope.actionBtnHied = false;
             return;
            }
            pop.fn.createStorageSnapshot();
        };
        
        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        pop.fn.createStorageSnapshot = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.id;
            pop.data.volumeId = pop.volume.volumeId;
            pop.data.volumeName = pop.volume.name;
            pop.data.size = pop.volume.size;
            pop.data.type = pop.volume.type;
            
            common.mdDialogHide();
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/snapshot', 'POST', {volumeSnapShot:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("생성 되었습니다.");
                common.locationHref('/#/gpu/snapshot?tabIndex=1');
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        }
    })
    //////////////////////////////////////////////////////////////////////////
    //////////       2018.11.21 디스크 이름 변경 팝업      sg0730       ////////////////
    //////////////////////////////////////////////////////////////////////////    
    .controller('gpuReNamePopStorageCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuReNamePopStorageCtrl", 1);
    	
    	var pop = this;
    	pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
    	pop.volume 						= $scope.dialogOptions.selectStorage;
    	pop.volumes                     = angular.copy($scope.contents.storageMainList);
    	pop.fn 							= {};
    	pop.data						= {};
    	pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
    	pop.storageNameList             = [];
    	
    	$scope.dialogOptions.title 		= "볼륨 이름 변경";
    	$scope.dialogOptions.okName 	= "변경";
    	$scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/reNameStoragePopForm.html" + _VersionTail();
    	
    	$scope.actionLoading 			= false;
    	pop.btnClickCheck 				= false;

    	for (var i = 0; i < pop.volumes.length; i++) {
            pop.storageNameList.push(pop.volumes[i].name);
        }

    	pop.fn.storageNameCustomValidationCheck = function(name) {
            if (pop.storageNameList.indexOf(name) > -1) {
                return {isValid : false, message: "이미 사용중인 이름 입니다."};
            } else {
                return {isValid : true};
            }
        };

    	// Dialog ok 버튼 클릭 시 액션 정의
    	$scope.popDialogOk = function () {
    		if ($scope.actionBtnHied) return;

            $scope.actionBtnHied = true;

    		if (pop.storageNameList.indexOf(pop.newVolNm) > -1) {
    			$scope.actionBtnHied = false;
    			return common.showAlert("이미 사용중인 이름 입니다.");
    		}
    		
    		pop.fn.reNmStor();
    	};
    	
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};
    	
    	pop.fn.reNmStor = function() {
    		$scope.main.loadingMainBody = true;
    		var param = {
		                    tenantId : pop.userTenant.id,
		                    volumeId : pop.volume.volumeId,
		                    name     : pop.newVolNm
		                };
    		
    		common.mdDialogHide();
    		// var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'PUT', {volume : param});
    		returnPromise.success(function (data, status, headers) {
    			$scope.main.loadingMainBody = false;
    			common.showAlertSuccess("볼륨 이름이 변경 되었습니다.");
    			
    			if (angular.isFunction(pop.callBackFunction)) {
    				pop.callBackFunction();
    			}
    		});
    		returnPromise.error(function (data, status, headers) {
    			$scope.main.loadingMainBody = false;
    			common.showAlertError(data.message);
    		});
    		returnPromise.finally(function (data, status, headers) {
    			$scope.actionBtnHied = false;
    			$scope.main.loadingMainBody = false;
    		});
    	}
    })
    //////////////////////////////////////////////////////////////////////////
    //////////       2018.11.21 디스크 사이즈 변경 팝업      sg0730       ////////////////
    //////////////////////////////////////////////////////////////////////////    
    .controller('gpuReSizePopStorageCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuReSizePopStorageCtrl", 1);
    	
    	var pop = this;
    	pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
    	pop.volume 						= $scope.dialogOptions.selectStorage;
    	pop.fn 							= {};
    	pop.data						= {};
    	pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
    	
    	$scope.dialogOptions.title 		= "볼륨 크기 변경";
    	$scope.dialogOptions.okName 	= "변경";
    	$scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/reSizeStoragePopForm.html" + _VersionTail();
    	
    	$scope.actionLoading 			= false;
    	pop.inputVolumeSize 			= pop.volume.size;
    	pop.volumeSize 					= pop.volume.size;

        pop.inputVolumeSizeChange = function () {
            var volumeSize = pop.inputVolumeSize ? parseInt(pop.inputVolumeSize, 10) : 0;
            if (volumeSize >= pop.reSizeSliderOptions.minLimit && volumeSize <= pop.reSizeSliderOptions.ceil) {
                pop.volumeSize = pop.inputVolumeSize;
            }
        };

        pop.inputVolumeSizeBlur = function () {
            var volumeSize = pop.inputVolumeSize ? parseInt(pop.inputVolumeSize, 10) : 0;
            if (volumeSize < pop.reSizeSliderOptions.minLimit || volumeSize > pop.reSizeSliderOptions.ceil) {
                pop.inputVolumeSize = pop.volumeSize;
            } else {
                pop.inputVolumeSize = volumeSize;
                pop.volumeSize = volumeSize;
            }
        };

        pop.reSizeSliderOptions = {
            floor: 0,
            ceil: 100,
            step: 1,
            minLimit : pop.volume.size,
            showSelectionBar : true,
            onChange : function () {
                pop.inputVolumeSize = pop.volumeSize;
            }
        };

        pop.fn.getStorageInfo = function() {
            $scope.main.loadingMainBody = true;

            var param = {
                tenantId : pop.userTenant.id,
                volumeId : pop.volume.volumeId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                pop.volume 							= data.content.volumes[0];
                pop.inputVolumeSize 				= pop.volume.size;
                pop.volumeSize 						= pop.volume.size;
                pop.reSizeSliderOptions.minLimit    = pop.volume.size;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.isTenantResourceLoad = false;
        pop.fn.getTenantResource = function() {
            var params = {
                tenantId : pop.userTenant.id
            };
            $scope.main.loadingMainBody = true;

            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/usedLookup', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                pop.resource 		 = angular.copy(data.content);
                pop.resourceDefault = angular.copy(data.content);
                if (pop.volume.type == 'HDD') {
                    pop.resource.maxResource.volumeGigabytes = pop.resource.maxResource.hddVolumeGigabytes;
                    pop.resource.usedResource.volumeGigabytes = pop.resource.usedResource.hddVolumeGigabytes;
                } else if (pop.volume.type == 'SSD') {
                    pop.resource.maxResource.volumeGigabytes = pop.resource.maxResource.ssdVolumeGigabytes;
                    pop.resource.usedResource.volumeGigabytes = pop.resource.usedResource.ssdVolumeGigabytes;
                }
                pop.reSizeSliderOptions.ceil = pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes + pop.volumeSize;
                if (pop.reSizeSliderOptions.ceil > CONSTANTS.iaasDef.insMaxDiskSize) {
                    pop.reSizeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize
                }
                pop.isTenantResourceLoad = true;
            });
            returnPromise.error(function (data, status, headers) {
                pop.isTenantResourceLoad = true;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

    	// Dialog ok 버튼 클릭 시 액션 정의
    	$scope.popDialogOk = function () {
    		if ($scope.actionBtnHied) return;
    		$scope.actionBtnHied = true;
            /*
            if (!pop.validationService.checkFormValidity(pop[pop.formName]))
            {
                $scope.actionBtnHied = false;
                return;
            }
            */
    		pop.fn.reSizeStor();
    	};
    	
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};
    	
    	pop.fn.reSizeStor = function() {
    		$scope.main.loadingMainBody = true;
    		var param = {
                tenantId : pop.userTenant.id,
                volumeId : pop.volume.volumeId,
                size     : pop.volumeSize
            };
    		common.mdDialogHide();
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'PUT', {volume : param});
    		returnPromise.success(function (data, status, headers) {
    			$scope.main.loadingMainBody = false;
    			common.showAlertSuccess("볼륨 크기가 변경 되었습니다.");
    			if ( angular.isFunction(pop.callBackFunction) ) {
    				pop.callBackFunction();
    			}
    			
    		});
    		returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
    		});
    		returnPromise.finally(function (data, status, headers) {
    			$scope.actionBtnHied = false;
    			$scope.main.loadingMainBody = false;
    		});
    	};
    	
    	if (pop.userTenant && pop.userTenant.id) {
            pop.fn.getTenantResource();
    		pop.fn.getStorageInfo();
    	}
    })
    .controller('gpuStorageDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : gpuStorageDescriptionCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        // pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.volume 						= $scope.dialogOptions.selectStorage;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "볼륨 설명 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/storageDescriptionPopForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/storageDescriptionPopForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            var checkByte = $bytes.lengthInUtf8Bytes(pop.newVolDesc);
            if (checkByte > 255) {
                common.showAlertWarning("볼륨 설명이 255Byte를 초과하였습니다.");
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
                            volumeId : pop.volume.volumeId,
                            description : pop.volume.description
                        };

            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("볼륨 설명이 변경 되었습니다.");

                /* 20.04.29 - 리스트형 추가로 이미지형일때와 리스트형일때 callbackFunction 분기 by ksw*/
                if ($scope.contents.listType == 'image') {
                    pop.callBackFunction();
                } else {
                    $scope.contents.fn.getStorageList();
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        }
    })
;
