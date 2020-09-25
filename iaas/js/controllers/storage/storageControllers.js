'use strict';

angular.module('iaas.controllers')
    .controller('iaasStorageCtrl', function ($scope, $location, $state,$translate,$filter, $stateParams, user, $q,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("storageControllers.js : iaasStorageCtrl", 1);

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
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
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
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                var volumes = [];
                if (data && data.content && data.content.volumes && angular.isArray(data.content.volumes)) {
                    volumes = data.content.volumes;
                    if (data.totalElements != 0) {
                        ct.isStorageMainListLoad = true;
                    }
                    //디스크 목록이 없을 때 자원사용여부 확인 후 사용하지 않을 때 [서비스 삭제하기] 활성화
                    if (volumes.length == 0) {
                        $scope.main.checkUseYnPortalOrgSystem("iaas");
                    }
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
            });
        };

        //추가 전체 디스크 크기E
        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.createStorage = function ($event) {
            $scope.dialogOptions = {
                controller : "storageFormCtrl",
                callBackFunction : ct.fn.getStorageList
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/storageForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
            
            //common.showDialog($scope, $event, $scope.dialogOptions);
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

        // 스토리지 삭제
        ct.deleteVolumesJob = function(id) {
            if (typeof id !== 'string') {
                return;
            }
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : id
            };

        	$scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'DELETE', param)
            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess('삭제되었습니다.');
                ct.fn.getStorageList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message)
            });
            returnPromise.finally(function () {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.createSnapshotPopBefore = function ($event,volume) {
            if (volume.status == 'in-use' || volume.status == 'available') {
                if (volume.status == 'in-use') {
                    var param = {
                        tenantId : volume.tenantId,
                        volumeId : volume.volumeId
                    };
                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
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
                common.showAlert('메세지','백업 이미지을 생성할 수 있는 상태가 아닙니다.');
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
			            			controller       : "iaasCreateStorageSnapshotPopFormCtrl" ,
			            			formName         : 'iaasCreatePopStorageSnapshotForm',
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
        
        ct.fn.reNamePopStorage = function($event,volume) {
        	var dialogOptions =  {
                controller       : "iaasReNamePopStorageCtrl" ,
                formName         : 'iaasReNamePopStorageForm',
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
                controller       : "iaasStorageDescriptionCtrl" ,
                formName         : 'iaasStorageDescriptionForm',
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
                controller       : "iaasReSizePopStorageCtrl" ,
                formName         : 'iaasReSizePopStorageForm',
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
        
        if (ct.data.tenantId) {
            ct.fn.getStorageList();
        }

    })
    .controller('iaasStorageFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $bytes, $interval ,user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasStorageFormCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        $scope.main.loadingMainBody = false;

        var ct               = this;
        ct.data              = {};
        ct.fn                = {};
        ct.volume            = {};
        ct.instances         = [];
        ct.sltInstance       = {};
        ct.data.tenantId     = $scope.main.userTenantId;
        ct.data.tenantName   = $scope.main.userTenant.korName;
        ct.formName          = "storageForm";
        ct.validDisabled = true;

        ct.volume.name      = 'disk-01';
        ct.storageNameList  = [];

        //디스크생성 변수
        ct.volumeSize = 100;
        ct.volumeSliderOptions = {
            showSelectionBar : true,
            minLimit : 10,
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

        // 볼륨 생성전 체크
        ct.fn.createVolumeCheck = function () {
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                common.showAlertError("항목", "잘못된 값이 있거나 필수사항을 입력하지 않았습니다.");
                return;
            } else if (ct.volumeSize > ct.tenantResource.available.volumeGigabytes) {
                return common.showAlert("디스크 용량이 부족합니다.")
            }
            ct.fn.createVolume();
        };

        // 볼륨 생성
        ct.fn.createVolume = function() {
            $scope.main.loadingMainBody = true;

            var params = {};

            params.volume = {};
            params.volume.tenantId = ct.data.tenantId;
            params.volume.name = ct.volume.name;
            params.volume.type = 'HDD';
            params.volume.size = ct.volumeSize;
            params.volume.description = ct.volume.description;

            if (ct.sltInstance && ct.sltInstance.id) {
                params.volume.volumeAttachment = {};
                params.volume.volumeAttachment.id = ct.sltInstance.id;
                params.volume.volumeAttachment.instanceName = ct.sltInstance.name;
                params.volume.volumeAttachment.instanceId = ct.sltInstance.id;
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess(ct.volume.name+" 디스크 생성이 시작 되었습니다.");
                $scope.main.goToPage("/iaas/storage");
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
                    ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                    ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                    ct.tenantResource.available.instanceDiskGigabytes = ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes;
                    ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;

                    ct.tenantResource.usedResource.volumePercent = (ct.tenantResource.usedResource.volumeGigabytes/ct.tenantResource.maxResource.volumeGigabytes)*100;
                    ct.tenantResource.available.volumePercent = (ct.tenantResource.available.volumeGigabytes/ct.tenantResource.maxResource.volumeGigabytes)*100;

                    // 디스크 크기 최대 제한
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.volumeGigabytes;
                    if (ct.volumeSliderOptions.ceil > CONSTANTS.iaasDef.insMaxDiskSize) {
                        ct.volumeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize
                    }
                    // 로딩되고나서 디스크 크기 최소로 자동설정
                    ct.inputVolumeSize = ct.volumeSliderOptions.minLimit;
                    ct.volumeSize = ct.volumeSliderOptions.minLimit;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError("message",data.message);
            });
            returnPromise.finally(function () {
                ct.isTenantResourceLoad = true;
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

        ct.fn.getServerList();
        ct.fn.getTenantResource();
        ct.fn.getStorageList();

    })
    .controller('iaasStorageDetailCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, user, common,$filter, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasStorageDetailCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.volume = {};
        ct.data.volumeId = $stateParams.volumeid;
        ct.data.tenantId = $scope.main.userTenantId;
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
            //$scope.main.goToPage("/iaas/storage/detail/"+ct.data.volumeId);
        	$scope.main.goToPage("/iaas");
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.goToPage('/iaas/storage');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach : param});
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
                controller : "iaasStorageEditFormCtrl",
                callBackFunction : null,
                volume : data
                
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/subMenus/storageEditForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

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
                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
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
                common.showAlert('메세지','백업 이미지을 생성할 수 있는 상태가 아닙니다.');
            }
        };
        
        ct.fn.createSnapshotPop = function ($event,volume) {
            $scope.dialogOptions = {
                controller : "iaasCreateStorageSnapshotFormCtrl",
                callBackFunction : null,
                volume : volume
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/createSnapshotForm.html" + _VersionTail();
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
    .controller('iaasStorageEditFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasStorageEditFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.volume = angular.copy($scope.dialogOptions.volume);
        pop.fn = {};
        pop.formName = "snapshotEditForm";
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "디스크 수정";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/subMenus/storageEditForm.html" + _VersionTail();

        pop.popCancel = function () {
        	$(".aside").stop().animate({"right":"-360px"}, 400);
        };
        
        pop.fn.getStorageInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.userTenant.tenantId,
                volumeId : pop.volume.volumeId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
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
                common.showAlertWarning("디스크 설명이 255Byte를 초과하였습니다.");
        		return;
        	}
            if (Number(pop.expandVolumeSize) < pop.volume.size) {
                common.showAlertWarning("디스크 크기는 size up만 가능 합니다. 디스크 크기 최소값 : " + pop.volume.size + ", 입력값 : " + pop.expandVolumeSize);
                pop.expandVolumeSize = pop.volume.size;
                return;
            }
            if (Number(pop.expandVolumeSize) > (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes)) {
                common.showAlertWarning("디스크 크기가 쿼터를 초과 하였습니다. 쿼터 크기 : " + (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes) + ", 입력값 : " + pop.expandVolumeSize );
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
            
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
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
    .controller('iaasCreateStorageSnapshotFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasCreateStorageSnapshotFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.volume = angular.copy($scope.dialogOptions.volume);
        pop.fn = {};
        pop.formName = "createSnapshotForm";
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "디스크 백업 이미지 생성";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/createSnapshotForm.html" + _VersionTail();

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'POST', {volumeSnapShot:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.main.goToPage('/iaas/storage/snapshot');
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
     .controller('iaasCreateStorageSnapshotPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasCreateStorageSnapshotPopFormCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.volume 						= $scope.dialogOptions.selectStorage;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        
        $scope.dialogOptions.title 		= "백업 이미지  생성";
        $scope.dialogOptions.okName 	= "생성";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/storageCreatePopSnapshotForm.html" + _VersionTail();

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
            $scope.actionLoading = true;
            pop.data.tenantId = pop.userTenant.id;
            pop.data.volumeId = pop.volume.volumeId;
            pop.data.volumeName = pop.volume.name;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'POST', {volumeSnapShot:pop.data});
            returnPromise.success(function (data, status, headers) {
                common.mdDialogHide();
                common.showAlertSuccess("생성 되었습니다.");
                common.locationHref('/#/iaas/snapshot?tabIndex=1');
            });
            returnPromise.error(function (data) {
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function () {
                $scope.actionBtnHied = false;
                $scope.actionLoading = false;
            });
        }
    })
    //////////////////////////////////////////////////////////////////////////
    //////////       2018.11.21 디스크 이름 변경 팝업      sg0730       ////////////////
    //////////////////////////////////////////////////////////////////////////    
    .controller('iaasReNamePopStorageCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    	_DebugConsoleLog("storageControllers.js : iaasReNamePopStorageCtrl", 1);
    	
    	var pop = this;
    	pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
    	pop.userTenant 					= angular.copy($scope.main.userTenant);
    	pop.volume 						= $scope.dialogOptions.selectStorage;
    	pop.volumes                     = angular.copy($scope.contents.storageMainList);
    	pop.fn 							= {};
    	pop.data						= {};
    	pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
    	pop.storageNameList             = [];
        pop.newVolNm                    = "";
    	
    	$scope.dialogOptions.title 		= "디스크 이름 변경";
    	$scope.dialogOptions.okName 	= "변경";
    	$scope.dialogOptions.closeName 	= "닫기";
    	$scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/reNameStoragePopForm.html" + _VersionTail();
    	
    	$scope.actionLoading 			= false;
        $scope.actionBtnHied            = false;
    	pop.btnClickCheck 				= false;

    	angular.forEach(pop.volumes, function (item) {
            pop.storageNameList.push(item.name);
        });

    	pop.fn.storageNameCustomValidationCheck = function(name) {
            if (pop.storageNameList.indexOf(name) > -1) {
                return {isValid : false, message : "이미 사용중인 이름 입니다."};
            } else {
                return {isValid : true};
            }
        };

    	// Dialog ok 버튼 클릭 시 액션 정의
    	$scope.popDialogOk = function () {
    		if ($scope.actionBtnHied) return;

            $scope.actionBtnHied = true;

            if(!new ValidationService().checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
    		pop.fn.reNmStor();
    	};
    	
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};
    	
    	pop.fn.reNmStor = function() {
            $scope.actionLoading = true;
    		var param = {
		                    tenantId : pop.userTenant.id,
		                    volumeId : pop.volume.volumeId,
		                    name     : pop.newVolNm
		                };
    		var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
    		returnPromise.success(function (data, status, headers) {
                common.mdDialogHide();
    			common.showAlertSuccess("디스크 이름이 변경 되었습니다.");
    			if (angular.isFunction(pop.callBackFunction)) {
    				pop.callBackFunction();
    			}
    		});
    		returnPromise.error(function (data, status, headers) {
    			common.showAlertError(data.message);
    		});
    		returnPromise.finally(function () {
    			$scope.actionBtnHied = false;
                $scope.actionLoading = false;
    		});
    	}
    })
    //////////////////////////////////////////////////////////////////////////
    //////////       2018.11.21 디스크 사이즈 변경 팝업      sg0730       ////////////////
    //////////////////////////////////////////////////////////////////////////    
    .controller('iaasReSizePopStorageCtrl', function ($scope, $location, $state, $translate, $stateParams, $bytes, $timeout, $interval, user, common, ValidationService, CONSTANTS ) {
    	_DebugConsoleLog("storageControllers.js : iaasReSizePopStorageCtrl", 1);
    	
    	var pop = this;
    	pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
    	pop.userTenant 					= angular.copy($scope.main.userTenant);
    	pop.volume 						= angular.copy($scope.dialogOptions.selectStorage);
    	pop.fn 							= {};
    	pop.data						= {};
    	pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
    	
    	$scope.dialogOptions.title 		= "디스크 크기 변경";
    	$scope.dialogOptions.okName 	= "변경";
    	$scope.dialogOptions.closeName 	= "닫기";
    	$scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/reSizeStoragePopForm.html" + _VersionTail();

    	$scope.actionLoading 			= false;
    	pop.volumeSize 					= 0;
    	pop.inputVolumeSize             = 0;

        // 디스크 크기 제한 설정
        pop.reSizeSliderOptions = {
            showSelectionBar : true,
            minLimit : 10,
            floor: 0,
            ceil: 100,
            step: 1,
            onChange : function () {
                pop.inputVolumeSize = pop.volumeSize;
            }
        };

        pop.fn.inputVolumeSizeChange = function () {
            var volumeSize = pop.inputVolumeSize ? pop.inputVolumeSize : 0;
            if (volumeSize >= pop.reSizeSliderOptions.minLimit && volumeSize <= pop.reSizeSliderOptions.ceil) {
                pop.volumeSize = pop.inputVolumeSize;
            }
        };

        pop.fn.inputVolumeSizeBlur = function () {
            var volumeSize = pop.inputVolumeSize ? pop.inputVolumeSize : 0;
            if (volumeSize < pop.reSizeSliderOptions.minLimit || volumeSize > pop.reSizeSliderOptions.ceil) {
                pop.inputVolumeSize = pop.volumeSize;
            } else {
                pop.inputVolumeSize = volumeSize;
                pop.volumeSize = volumeSize;
            }
        };

        // 볼륨 리스트 조회
        pop.fn.getStorageList = function() {
            var param = {
                tenantId : pop.userTenant.id,
                volumeId : pop.volume.volumeId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.volumes && data.content.volumes.length > 0 && $scope.dialogOptions && $scope.dialogOptions.selectStorage) {
                    angular.forEach(data.content.volumes, function (item) {
                        if (item.volumeId == pop.volume.volumeId) {
                            pop.volume 							  = item;
                            pop.volumeSize 						  = pop.volume.size;
                            pop.inputVolumeSize 				  = pop.volume.size;
                            pop.reSizeSliderOptions.minLimit      = pop.volume.size;
                        }
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError("message",data.message);
            });
        };

        // 테넌트 자원 사용량 조회
        pop.fn.getTenantResource = function() {
            $scope.actionLoading = true;
            var params = {
                tenantId : pop.userTenant.id
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/usedLookup', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    pop.tenantResource = data.content;
                    pop.tenantResource.available = {};
                    pop.tenantResource.available.volumeGigabytes = pop.tenantResource.maxResource.volumeGigabytes - pop.tenantResource.usedResource.volumeGigabytes;

                    pop.reSizeSliderOptions.ceil = pop.tenantResource.available.volumeGigabytes;
                    if (pop.reSizeSliderOptions.ceil > CONSTANTS.iaasDef.insMaxDiskSize) {
                        pop.reSizeSliderOptions.ceil = CONSTANTS.iaasDef.insMaxDiskSize
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError("message",data.message);
            });
            returnPromise.finally(function () {
                $timeout(function () {
                    pop.fn.refreshSlider();
                    $scope.actionLoading = false;
                }, 500);
            });
        };

    	// Dialog ok 버튼 클릭 시 액션 정의
    	$scope.popDialogOk = function () {
    		if ($scope.actionBtnHied) return;
    		$scope.actionBtnHied = true;

    		if (pop.volumeSize == pop.volume.size) {
    		    $scope.actionBtnHied = false;
    		    return common.showAlert("디스크 크기가 변경되지 않았습니다.");
            } else if (pop.volumeSize < pop.volumeSize) {
                $scope.actionBtnHied = false;
                return common.showAlert("디스크 크기가 기존보다 작습니다.")
            }
    		pop.fn.reSizeStor();
    	};
    	
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};

    	// 볼륨 크기 변경
    	pop.fn.reSizeStor = function() {
            $scope.actionLoading = true;
    		var param = {
                tenantId : pop.userTenant.id,
                volumeId : pop.volume.volumeId,
                size     : pop.volumeSize
            };
    		var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
    		returnPromise.success(function (data, status, headers) {
                common.mdDialogHide();
    			common.showAlertSuccess("디스크 크키가 변경 되었습니다.");
    			if ( angular.isFunction(pop.callBackFunction) ) {
    				pop.callBackFunction();
    			}
    			
    		});
    		returnPromise.error(function (data, status, headers) {
		    	common.showAlertError(data.message);
    		});
    		returnPromise.finally(function () {
    			$scope.actionBtnHied = false;
                $scope.actionLoading = false;
    		});
    	};

    	// 볼륨 크기 조절 슬라이드 렌더링 호출
        pop.fn.refreshSlider = function() {
            $timeout(function() {
                $scope.$broadcast('rzSliderForceRender');
            })
        };

        pop.fn.getStorageList();
        pop.fn.getTenantResource();
    })
    .controller('iaasStorageDescriptionCtrl', function ($scope, $rootScope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        	_DebugConsoleLog("storageControllers.js : iaasStorageDescriptionCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.volume 						= $scope.dialogOptions.selectStorage;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "디스크 설명 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/storageDescriptionPopForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            var checkByte = $bytes.lengthInUtf8Bytes(pop.newVolDesc);
            if (checkByte > 255) {
                common.showAlertWarning("디스크 설명이 255Byte를 초과하였습니다.");
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("디스크 설명이 변경 되었습니다.");

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
