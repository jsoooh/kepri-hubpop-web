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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshotList', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.snapshotList = data.content.volumeSnapShots;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }


        ct.fn.deleteSnapshot = function(snapshot) {
            common.showConfirm('스냅샷 삭제',snapshot.snapshotName+' 스냅샷을 삭제 하시겠습니까?').then(function(){
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
        pop.title = "볼륨 복원";

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
                common.showAlertWarning("볼륨 설명이 255Byte를 초과하였습니다.");
        		$scope.actionBtnHied = false;
        		return;
        	}

        	if(Number(pop.data.size) < pop.snapshotVolume.size){
                common.showAlertWarning("볼륨 크기는 size up만 가능 합니다. 볼륨 크기 최소값 : " + pop.snapshotVolume.size + ", 입력값 : " + pop.data.size );
                pop.data.size = pop.snapshotVolume.size;
                $scope.actionBtnHied = false;
                return;
            }

            if(Number(pop.data.size) > (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes)){
                common.showAlertWarning("볼륨 크기가 쿼터를 초과 하였습니다. 쿼터 크기 : " + (pop.resource.maxResource.volumeGigabytes - pop.resource.usedResource.volumeGigabytes) + ", 입력값 : " + pop.data.size );
                pop.data.size = pop.snapshotVolume.size;
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

        pop.createStorageVolumeAction = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            var param = {
                newVolumeInfo : pop.data,
                volumeSnapShot : pop.snapshot
            }

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
