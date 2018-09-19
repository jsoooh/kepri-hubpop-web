'use strict';

angular.module('iaas.controllers')
    .controller('iaasComputeSnapshotCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, user,paging, common, CONSTANTS) {
        _DebugConsoleLog("computeSnapshotControllers.js : iaasComputeSnapshotCtrl", 1);

        var ct = this;
        ct.data = {};
        ct.fn = {};
        
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getInstanceSnapshotList(1);
        });
        
        ct.formOpen = function (snapshot){
        	ct.selectSnapshot = snapshot;
    		$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeRestoreStepForm.html" + _VersionTail();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        }

        // Snapshot List
        ct.fn.getInstanceSnapshotList = function(page) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                instanceName : ct.data.instanceName,
                number : page
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	ct.snapshotList = data.content.instanceSnapShots;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        ct.fn.deleteSnapshot = function(snapshot) {
            common.showConfirm('스냅샷 삭제',snapshot.snapShotName+' 스냅샷을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : snapshot.tenantId,
                    snapShotId : snapshot.snapShotId
                }
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    
                    $timeout(function() {
                    	ct.fn.getInstanceSnapshotList(1);
                        common.showAlertSuccess("삭제 되었습니다.");
                	}, 1000);
                    
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                	common.showAlertError(data.message);
                    //common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }
        if(ct.data.tenantId) {
            ct.fn.getInstanceSnapshotList(1);
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
        }

        //이전
        pop.preStep = function () {
        	pop.activeTabIndex--;
        }
        
        pop.fn.getSnapshotInfo = function(snapshotId) {
            $scope.main.loadingMainBody = true;
            var params = {
                tenantId : pop.data.tenantId,
                snapShotId : snapshotId
            }
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
        }
        
      //인스턴스 상세 정보 조회
        pop.fn.getInstanceInfo = function(instanceId) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.data.tenantId,
                instanceId : instanceId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
            	pop.instance = data.content.instances[0];
            	
            	if(pop.instance.vmState == 'deleted') {
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
        }
        
        pop.fn.getSecurityPolicy = function() {
            $scope.main.loadingMainBody = true;
        	pop.roles = [];
            var param = {tenantId:pop.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.securityPolicyList = data.content;
                
                for(var i=0; i < pop.securityPolicyList.length; i++) {
                    if(pop.instance.securityPolicies) {
                        for(var j=0; j < pop.instance.securityPolicies.length; j++) {
                            if(pop.securityPolicyList[i].name == pop.instance.securityPolicies[j].name) {
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
        }
        
        pop.fn.changeSecurityPolicy = function() {
        	 pop.securityPolicies = pop.roles;
        }

        pop.fn.getKeypairList = function() {
            $scope.main.loadingMainBody = true;
            var param = {tenantId:pop.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param );
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.keypairList = data.content;
                
                if(!pop.instance.keypair){
                	pop.instance.keypair = {};
                	pop.instance.keypair.name = '';
                }
                
                for(var i=0; i < pop.keypairList.length; i++) {
                	if(pop.keypairList[i].name == pop.instance.keypair.name) {
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
        }

        pop.fn.changeKeypair = function() {
            pop.data.keypair = angular.fromJson(pop.keypairValue);
            
        }

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
            var param = {
                tenantId : pop.data.tenantId,
                name : keypair.name
            }
            location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+pop.data.tenantId+"&name="+keypair.name;
        };
        
        var clickCheck = false;
        pop.fn.createServer = function() {
        	if(!clickCheck){
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
                	$scope.main.moveToAppPage("/iaas");
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
                
                if(!pop.instance.spec) {
                	pop.instance.spec = {};
                	pop.instance.spec.name = '';
                }
                
                for(var i=0; i < pop.specList.length; i++) {
                	pop.specList[i].title = '[' + pop.specList[i].name + '] vCPU ' + pop.specList[i].vcpus + '개 / MEM ' + pop.specList[i].ram / 1024 + ' GB / DISK(HDD) ' + pop.specList[i].disk + ' GB';
                	if(pop.specList[i].name == pop.instance.spec.name) {
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
        }
        
        pop.fn.selectSpec = function() {
        	if(pop.specValue){
        		pop.data.spec = angular.fromJson(pop.specValue);
        	}else{
        		pop.data.spec.vcpus = 0;
        		pop.data.spec.ram = 0;
        		pop.data.spec.disk = 0;
        	}
        }
        
        pop.fn.getInitScriptList = function(scriptId) {
            var param = {
                tenantId : pop.data.tenantId
            }
            if(scriptId) {
                param.scriptId = scriptId;
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if(scriptId) {
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
        }

        pop.fn.changeInitScript = function() {
            if(pop.initScriptValue == "") {
                pop.data.initScript = {};
            } else {
                pop.fn.getInitScriptList(angular.fromJson(pop.initScriptValue).scriptId);
            }
        }
        
        pop.fn.initScriptSet = function() {
            if(!pop.initCheck) {
                pop.data.initScript = {};
                pop.initScriptValue = "";
            }
        }
        
        // 네트워크 리스트 조회
        pop.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.data.tenantId,
                isExternal : false
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.networks = data.content;
                if(pop.networks.length > 0) {
                    pop.network = data.content.networks[0];
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
        }

        //네트워크 setting
        pop.fn.networksChange = function() {
            if(pop.network && pop.network.subnets) {
                pop.subnet.cidr_A = pop.network.subnets[0].cidr_A;
                pop.subnet.cidr_B = pop.network.subnets[0].cidr_B;
                pop.subnet.cidr_C = pop.network.subnets[0].cidr_C;
                pop.data.networks = [{
                    id : pop.network.id
                }];
            }
        }
        
        if(pop.data.tenantId) {
            pop.fn.getInstanceInfo(pop.instanceId);
            pop.fn.getSnapshotInfo(pop.snapshotId);
        }
    })
;
