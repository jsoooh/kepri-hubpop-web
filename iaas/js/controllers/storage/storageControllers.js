'use strict';

angular.module('iaas.controllers')
    .controller('iaasStorageCtrl', function ($scope, $location, $state,$translate,$filter, $stateParams, user, $q,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("storageControllers.js : iaasStorageCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.typeState = true;

        ct.fn.formOpen = function($event, state, data){
        	ct.formType = state;
    		if(state == 'storage'){
    			ct.fn.createStorage($event);
    		}else if (state == 'snapshot'){
    			ct.createSnapshotPopBefore($event, data);
    		}
        }
        
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
        if($stateParams.volumeName) {
            ct.conditionKey = 'name';
            ct.conditionValue = $stateParams.volumeName;
        } else {
            ct.conditionKey = '';
        }

        ct.fn.getStorageList = function(currentPage) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue,
            }
            if (currentPage != undefined) {
                param.number = currentPage;
            }
            
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
            	ct.pageOptions = paging.makePagingOptions(data);
            	ct.storageMainList = data.content.volumes;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        //추가 전체 볼륨 크기E
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
        }

        ct.fn.checkAll = function($event) {
            ct.roles = [];
            if($event.currentTarget.checked) {
                for(var i=0; i < ct.storageMainList.length; i++) {
                    if(ct.storageMainList[i].status != 'in-use') {
                        ct.roles.push(ct.storageMainList[i].volumeId);
                    }
                }
            }

        }

        ct.fn.checkOne = function($event,id) {
            if($event.currentTarget.checked) {
                if(ct.roles.length == $("#mainList tbody").find("input[type='checkbox']").length) {
                    $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);
            }
        }

        ct.deleteVolumes = function(type, id) {
        	if(type == 'thum'){
        		common.showConfirm('볼륨 삭제','볼륨을 삭제 하시겠습니까?').then(function(){
                    ct.deleteVolumesAction(type, id);
                });
        	}else if(type == 'tbl'){
        		if(ct.roles.length == 0) {
                    common.showAlert('메세지','선택된 볼륨이 없습니다.');
                } else {
                    common.showConfirm('볼륨 삭제','선택된 '+ct.roles.length+'개의 볼륨을 삭제 하시겠습니까?').then(function(){
                        ct.deleteVolumesAction(type, id);
                    });
                }
        	}
            
        }


        // 스토리지 삭제
        ct.deleteVolumesAction = function(type, id) {
            var prom = [];
            if(type == 'thum'){
            	prom.push(ct.deleteVolumesJob(id));
            }else if(type == 'tbl'){
            	for(var i=0; i< ct.roles.length; i++) {
                    prom.push(ct.deleteVolumesJob(ct.roles[i]));
                }
            }
            $q.all(prom).then(function(results){
                for(var i=0; i < results.length; i++ ) {
                    if(!results[i]) {
                        common.showAlert('메세지','오류가 발생하였습니다.');
                    }
                }
                ct.fn.getStorageList();
                ct.roles = [];
            }).catch(function(e){
                common.showAlert('메세지',e);
            });
        }

        // 스토리지 삭제
        ct.deleteVolumesJob = function(id) {
        	$scope.main.loadingMainBody = true;
            var deferred = $q.defer();
            if(typeof id !== 'string') {
                return;
            }
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : id
            }
            
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'DELETE', param)
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
            if(volume.status == 'in-use' || volume.status == 'available') {
                if(volume.status == 'in-use') {
                    var param = {
                        tenantId : volume.tenantId,
                        volumeId : volume.volumeId
                    }
                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
                    returnPromise.success(function (data, status, headers) {
                    	if(data.content.instanceStatus == 'active') {
                        	common.showAlert('메세지',data.content.instanceName + '이 실행 중입니다. 인스턴스를 종료하고 시도해주세요.');
                        } else {
                            ct.fn.createSnapshotPop($event,volume);
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlert('메세지',data.message);
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
        }

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
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
        }

        if(ct.data.tenantId) {
            ct.fn.getStorageList(1);
        }

    })
    .controller('iaasStorageFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasStorageFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);
        
        pop.fn = {};
        pop.data = {};
        pop.data.size = 1;
        pop.roles = [];

        pop.formName = "storageForm";
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "볼륨 추가";
        
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/storageForm.html" + _VersionTail();


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
                common.showAlertWarning("볼륨 설명이 255Byte를 초과하였습니다.");
        		$scope.actionBtnHied = false;
        		return;
        	}

            if(Number(pop.data.size) < 1){
                common.showAlertWarning("볼륨 크기는 1G 부터 추가 가능 합니다. 볼륨 크기 최소값 : 1" + ", 입력값 : " + pop.data.size );
                pop.data.size = 10;
                $scope.actionBtnHied = false;
                return;
            }

            if(Number(pop.data.size) > (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes)){
                common.showAlertWarning("볼륨 크기가 쿼터를 초과 하였습니다. 쿼터 크기 : " + (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes) + ", 입력값 : " + pop.data.size );
                pop.data.size = 10;
                $scope.actionBtnHied = false;
                return;
            }

            pop.createStorageVolumeAction();
            
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
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

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

        pop.createStorageVolumeAction = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'POST', {volume:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.contents.fn.getStorageList();
                pop.popCancel();
            });
            returnPromise.error(function (data, status, headers) {
            	pop.popCancel();
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
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
    .controller('iaasStorageDetailCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, user, common,$filter, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("storageControllers.js : iaasStorageDetailCtrl", 1);

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
    		if(state == 'storageEdit'){
    			ct.fn.storageEdit($event, data);
    		}else if (state == 'snapshot'){
    			ct.createSnapshotPopBefore($event, data);
    		}
        }
        
        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            //$scope.main.moveToAppPage("/iaas/storage/detail/"+ct.data.volumeId);
        	$scope.main.moveToAppPage("/iaas");
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getStorageInfo();
        });

        ct.fn.getStorageInfo = function() {
        	$scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : ct.data.volumeId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.volume = data.content.volumes[0];
                ct.expandVolumeSize = ct.volume.size;
                if(ct.volume.volumeAttachment != null) {
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
                if(data.content.instances.length == 1) {
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

            if(isNaN(Number(ct.expandVolumeSize)))return;

            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : ct.volume.volumeId,
                size : ct.expandVolumeSize,
                description : ct.volume.description,
                name : ct.volume.name
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'PUT', {volume : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.moveToAppPage('/iaas/storage/');
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        ct.fn.dettachVolume = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : ct.volume.volumeId,
                id : ct.volume.volumeAttachment.id,
                instanceId : ct.volume.volumeAttachment.instanceId
            }
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
        }

        ct.fn.volumeSizeAction = function(flag) {

            if(flag) {
                ct.expandVolumeSize += 1;
                if(ct.resourceDefault.maxResource.volumeGigabytes < ct.expandVolumeSize){
                    ct.expandVolumeSize -= 1;
                }

            } else {
                if(ct.expandVolumeSize - ct.volume.size >= 1) {
                    ct.expandVolumeSize -= 1;
                }
            }

            ct.resource.usedResource.volumeGigabytes = ct.expandVolumeSize - ct.volume.size + ct.resourceDefault.usedResource.volumeGigabytes;
        };

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
        }
        
        ct.createSnapshotPopBefore = function ($event,volume) {
            if(volume.status == 'in-use' || volume.status == 'available') {
                if(volume.status == 'in-use') {
                    var param = {
                        tenantId : volume.tenantId,
                        volumeId : volume.volumeId
                    }
                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
                    returnPromise.success(function (data, status, headers) {
                    	if(data.content.instanceStatus == 'active') {
                        	common.showAlert('메세지',data.content.instanceName + '이 실행 중입니다. 인스턴스를 종료하고 시도해주세요.');
                        } else {
                            ct.fn.createSnapshotPop($event,volume);
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlert('메세지',data.message);
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
        }
        
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
        }

        if(ct.data.tenantId) {
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
        pop.title = "볼륨 수정";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/subMenus/storageEditForm.html" + _VersionTail();

        pop.popCancel = function () {
        	$(".aside").stop().animate({"right":"-360px"}, 400);
        };
        
        pop.fn.getStorageInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.userTenant.tenantId,
                volumeId : pop.volume.volumeId
            }
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
            }
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
        }
        
        pop.fn.volumeSizeAction = function(flag) {

            if(flag) {
            	pop.expandVolumeSize += 1;
                if(pop.resourceDefault.maxResource.volumeGigabytes < pop.expandVolumeSize){
                	pop.expandVolumeSize -= 1;
                }

            } else {
                if(pop.expandVolumeSize - pop.volume.size >= 1) {
                	pop.expandVolumeSize -= 1;
                }
            }

            pop.resource.usedResource.volumeGigabytes = pop.expandVolumeSize - pop.volume.size + pop.resourceDefault.usedResource.volumeGigabytes;
        }
        
        pop.fn.changeVolumeSize = function() {
            pop.resource.usedResource.volumeGigabytes = Number(pop.data.size) + Number(pop.resourceDefault.usedResource.volumeGigabytes);
        }
        
        pop.fn.updateVolume = function() {

            if(isNaN(Number(pop.expandVolumeSize)))return;
            
            var checkByte = $bytes.lengthInUtf8Bytes(pop.volume.description);
        	if(checkByte > 255){
                common.showAlertWarning("볼륨 설명이 255Byte를 초과하였습니다.");
        		return;
        	}

            if(Number(pop.expandVolumeSize) < pop.volume.size){
                common.showAlertWarning("볼륨 크기는 size up만 가능 합니다. 볼륨 크기 최소값 : " + pop.volume.size + ", 입력값 : " + pop.expandVolumeSize);
                pop.expandVolumeSize = pop.volume.size;
                return;
            }

            if(Number(pop.expandVolumeSize) > (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes)){
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
            }
            
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
        }

        pop.fn.checkByte = function (text, maxValue){
            pop.checkByte = $bytes.lengthInUtf8Bytes(text);
        }

        pop.formatter = function(data){
			return data + 'G';
		}
        
        if(pop.userTenant.tenantId) {
            pop.fn.getStorageInfo();
        }
    })
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
        pop.title = "볼륨 스냅샷 생성";

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
        	if(checkByte > 255){
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
                $scope.main.moveToAppPage('/iaas/storage/snapshot');
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert('메세지',data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }
    })
;
