'use strict';

angular.module('iaas.controllers',[])
    .controller('iaasComputeCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCtrl", 1);
        
        $scope.actionBtnHied = true;

        var ct = this;
        ct.list = {};
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.network = {};
        ct.consoleLogLimit = '50';
        ct.actionLogLimit = '10';
        ct.serverMainList = [];

        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);

        ct.formOpen = function (){
        	//$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeCreateStepForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeTypeCreateStepForm.html" + _VersionTail();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        }
        		
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
        	ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fnGetUsedResource();
            ct.fn.getDeployServerList();
        });

        ct.fn.getDeployServerList = function() {
            ct.fnGetServerMainList();
        };

        // 서버메인 tenant list 함수
        ct.fnGetServerMainList = function(currentPage) {
            $scope.main.loadingMainBody = true;

            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue,
                queryType : 'list'
            };

            if(ct.network.id != '') {
                param.networkName = ct.network.name;
            }

            if (currentPage != undefined) {
                param.number = currentPage;
            }
            ct.serverMainList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data) {
                    ct.pageOptions = paging.makePagingOptions(data);
                    angular.forEach(data.content.instances, function (item, key) {
                        var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", item.vmType);
                        if (angular.isObject(vmDeployType) && vmDeployType.id) {
                            item.vmDeployType = vmDeployType;
                        } else {
                            item.vmDeployType = angular.copy(ct.deployTypes[0]);
                        }
                    });
                    ct.serverMainList = data.content.instances;
                }
            });
            returnPromise.error(function (data, status, headers) {
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }
        //추가 S
        ct.fnGetUsedResource = function() {
        	$scope.main.loadingMainBody = true;
            var params = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
        }
        //추가 E
        // 서버삭제
        ct.deleteInstanceJob = function(instance, index) {
        	common.showConfirm('서버 삭제','선택한 서버를 삭제하시겠습니까?').then(function(){
        		$scope.main.loadingMainBody = true;
	            var param = {
	                tenantId : ct.data.tenantId,
	                instanceId : instance.id
	            }
	            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'DELETE', param)
	            returnPromise.success(function (data, status, headers) {
	            	
	            	setTimeout(function() {
	            		$scope.main.loadingMainBody = false;
	            		if (status == 200 && data) {
                            ct.deployServerList.splice(index, 1);
	            			common.showAlertSuccess('삭제되었습니다.');
                            ct.fnGetUsedResource();
		                } else {
		                	common.showAlertError('오류가 발생하였습니다.');
		                }
	            	}, 1000);
	            });
	            returnPromise.error(function (data, status, headers) {
	            	common.showAlertError(data.message);
	            });
            });
        };

        ct.selectedValues = {}
        ct.fn.serverActionConfirm = function(action,instance,index) {
            if(action == "START") {
                common.showConfirm('메세지',instance.name +' 서버를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "STOP") {
                common.showConfirm('메세지',instance.name +' 서버를 종료하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('메세지',instance.name +' 서버를 재시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "DELETE") {
            	ct.deleteInstanceJob(instance, index);
            } else if(action == "SNAPSHOT") {
            	ct.fn.createSnapshot(instance);
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop(instance,index);
            } else if(action == "IPDISCONNECT"){
            	common.showConfirm('메세지',instance.name +' 서버의 접속 IP를 해제하시겠습니까?').then(function(){
            		ct.fn.ipConnectionSet(instance, "detach",index);
            	});
            }
            ct.selectedValues[index] = "";
        }


        ct.fnSingleInstanceAction = function(action,instance,index) {
            var param = {
                instanceId : instance.id,
                action : action,
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
            	
            	var vmStateChange = "";
            	if(action == "START"){
            		vmStateChange = "starting";
            	}else if(action == "STOP"){
            		vmStateChange = "stopping";
            	}else if(action == "PAUSE"){
            		vmStateChange = "pausing";
            	}else if(action == "UNPAUSE"){
            		vmStateChange = "unpausing";
            	}else if(action == "REBOOT"){
            		vmStateChange = "rebooting";
            	}
            	ct.serverMainList[index].vmState = vmStateChange; 
                ct.serverMainList[index].observeAction = action;
            });
            returnPromise.error(function (data, status, headers) {
            	common.showAlertError(data.message);
                //common.showAlert('메세지',data.message);
            });
        }

        // SnapShot 생성
        ct.fn.createSnapshot = function(instance) {
            if(instance.vmState != 'stopped') {
            	common.showAlertWarning('서버를 종료 후 생성가능합니다.');
                //common.showAlert('메세지','서버를 종료 후 생성가능합니다.');
                return;
            } else {
            	ct.selectInstance = instance;
            	$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
    			$(".aside").stop().animate({"right":"-360px"}, 400);
    			$("#aside-aside1").stop().animate({"right":"0"}, 500);
            }
        }
        
        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function(instance,index) {
        	ct.selectInstance = instance;
        	ct.selectInstanceIndex = index;
        	
        	$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        }
        
        // 공인 IP 연결 해제 펑션
        ct.fn.ipConnectionSet = function(instance,type,index) {
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : instance.id
            };
            if(instance.floatingIp) {
                param.floatingIp = instance.floatingIp;
                param.action = type;
            } else {
                return false;
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
    			common.showAlertSuccess('접속 IP가 해제되었습니다.');
            	ct.serverMainList[index].floatingIp = "";
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        }

        if(ct.data.tenantId) {
            ct.fnGetUsedResource();
            ct.fn.getDeployServerList();
        }

    })
;
