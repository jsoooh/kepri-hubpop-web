'use strict';

angular.module('iaas.controllers')
    .controller('iaasComputeCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCtrl", 1);

        $scope.actionBtnEnabled = true;

        var ct 				= this;
        ct.list 			= {};
        ct.fn 				= {};
        ct.data 			= {};
        ct.roles 			= [];
        ct.network 			= {};
        ct.consoleLogLimit 	= '50';
        ct.actionLogLimit 	= '10';
        ct.pageFirstLoad 	= true;
        ct.showVal			= false;
        ct.schFilterText    = "";
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenant.id;
        ct.data.tenantName = $scope.main.userTenant.korName;

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;

        //20181120 sg0730  서버사양변경 PopUp 추가
        ct.computePopEditServerForm = function (instance, $event, $index) {
        	 var dialogOptions = {
                 controller : "iaasComputePopEditServerCtrl" ,
                 formName   : 'iaasComputePopEditServerForm',
                 instance : angular.copy(instance),
                 callBackFunction : ct.reflashCallBackFunction
             };
             $scope.actionBtnHied = false;
             common.showDialog($scope, $event, dialogOptions);
             $scope.actionLoading = true; // action loading
        };
        
        ct.reflashCallBackFunction = function (instance)  {
            var reInstance = common.objectsFindByField(ct.serverMainList, "id", instance.id);
            reInstance.vmState = instance.vmState;
            reInstance.uiTask = instance.uiTask;
            ct.fn.setProcState(reInstance);
            $timeout(function () {
                //ct.fn.checkServerState(instance.id);
                ct.fn.checkServerState();
            }, 1000);
        };

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
            ct.networks = [{id:"",name:'',description:"네트워크 선택"}];
            ct.network = ct.networks[0];
            ct.fnGetServerMainList();
            ct.fnGetUsedResource();
        });
        
        ct.fn.getKeyFile = function(keypair,type) {
            document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
        };

        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.networks = data.content;
                ct.networks.unshift({id:"",name:'',description:"네트워크 선택"});
                ct.network = ct.networks[0];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                //common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.firstInstanceCreatePop = function() {
            var dialogOptions = {
                controllerAs: "pop",
                templateUrl : _IAAS_VIEWS_ + "/compute/firstInstanceCreatePop.html" + _VersionTail(),
            };
            common.showCustomDialog($scope, null, dialogOptions);
        };

        ct.creatingTimmerSetting = function () {
            var isCreatingTimmerStop = true;
            if (ct.serverMainList && ct.serverMainList.length > 0) {
                var nowDate = new Date();
                angular.forEach(ct.serverMainList, function (serverMain) {
                    if (serverMain.procState != 'end') {
                        isCreatingTimmerStop = false;
                    }
                    if (serverMain.created) {
                        var createdDate = new Date(serverMain.created);
                        serverMain.creatingTimmer = parseInt((nowDate.getTime() - createdDate.getTime())/1000);
                    } else {
                        if (!serverMain.creatingTimmer) serverMain.creatingTimmer = 0;
                        serverMain.creatingTimmer++;
                    }
                });
            }
            if (isCreatingTimmerStop) {
                if ($scope.main.refreshInterval['instanceCreatingTimmer']) {
                    $interval.cancel($scope.main.refreshInterval['instanceCreatingTimmer']);
                    $scope.main.refreshInterval['instanceCreatingTimmer'] = null;
                }
            }
        };

        ct.noIngStates = ['active', 'stopped', 'error', 'paused', 'error_ip', 'error_volume'];
        ct.creatingStates = ['creating', 'networking', 'block_device_mapping'];

        // 서버메인 tenant list 함수
        ct.fnGetServerMainList = function() {
            $scope.main.loadingMainBody = true;

            var param = {
                tenantId : ct.data.tenantId,
                queryType : 'list'
            };
            ct.serverMainList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    ct.serverMainList = data.content.instances;
                    var isServerStatusCheck = false;
                    var nowDate = new Date();
                    angular.forEach(ct.serverMainList, function (serverMain) {
                        if (ct.noIngStates.indexOf(serverMain.uiTask) == -1) {
                            isServerStatusCheck = true;
                        }
                        ct.fn.setProcState(serverMain);
                        ct.fn.setRdpConnectDomain(serverMain);
                        if (serverMain.created) {
                            var createdDate = new Date(serverMain.created);
                            serverMain.creatingTimmer = parseInt((nowDate.getTime() - createdDate.getTime())/1000);
                        } else {
                            if (!serverMain.creatingTimmer) serverMain.creatingTimmer = 0;
                            serverMain.creatingTimmer++;
                        }
                    });
                    if (isServerStatusCheck) {
                        if ($scope.main.reloadTimmer['instanceServerStateList']) {
                            $timeout.cancel($scope.main.reloadTimmer['instanceServerStateList']);
                            $scope.main.reloadTimmer['instanceServerStateList'] = null;
                        }
                        $scope.main.reloadTimmer['instanceServerStateList'] = $timeout(function () {
                            ct.fn.checkServerState();
                        }, 1000);
                        if ($scope.main.refreshInterval['instanceCreatingTimmer']) {
                            $interval.cancel($scope.main.refreshInterval['instanceCreatingTimmer']);
                            $scope.main.refreshInterval['instanceCreatingTimmer'] = null;
                        }
                        $scope.main.refreshInterval['instanceCreatingTimmer'] = $interval(ct.creatingTimmerSetting, 1000);
                    }
                }
                if (ct.pageFirstLoad && (!ct.serverMainList || ct.serverMainList.length == 0)) {
                    ct.firstInstanceCreatePop();
                }
                ct.pageFirstLoad = false;
            });
            returnPromise.error(function (data, status, headers) {
                ct.pageFirstLoad = false;
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.setProcState = function (instance) {
            if (ct.noIngStates.indexOf(instance.uiTask) >= 0) {
                instance.procState = "end";
            } else if (ct.creatingStates.indexOf(instance.uiTask) >= 0) {
                instance.procState = "creating";
            } else {
                instance.procState = "ing";
            }
        };

        ct.fn.setListRdpConnectDomain = function (serverList) {
            angular.forEach(serverList, function(instance) {
                ct.fn.setRdpConnectDomain(instance);
            });
        };

        ct.fn.setRdpConnectDomain = function (instance) {
            if (instance.image && instance.image.osType == "windows" && instance.instanceDomainLinkInfos && instance.instanceDomainLinkInfos.length > 0) {
                var rdpDomain = "";
                for (var i=0; i<instance.instanceDomainLinkInfos.length; i++) {
                    if (instance.instanceDomainLinkInfos[i].domainInfo && instance.instanceDomainLinkInfos[i].domainInfo.domain
                        && instance.instanceDomainLinkInfos[i].domainInfo.domain.substring(instance.instanceDomainLinkInfos[i].domainInfo.domain.length - ct.rdpBaseDomain.length) == ct.rdpBaseDomain) {
                        rdpDomain = instance.instanceDomainLinkInfos[i].domainInfo.domain;
                        break;
                    }
                }
                instance.rdpConnectDomain = rdpDomain;
            }
        };

        ct.fn.mergeServerInfo = function (serverItem, instance) {
            angular.forEach(serverItem, function(value, key) {
                if (angular.isUndefined(instance[key])) {
                    delete serverItem[key];
                }
            });
            angular.forEach(instance, function(value, key) {
                if (angular.isArray(value)) {
                    if (!angular.isArray(serverItem[key])) serverItem[key] = [];
                    angular.forEach(value, function(val, k) {
                        serverItem[key][k] = val;
                    });
                } else if (angular.isObject(value)) {
                    if (!angular.isObject(serverItem[key])) serverItem[key] = {};
                    angular.forEach(value, function(val, k) {
                        serverItem[key][k] = val;
                    });
                } else {
                    serverItem[key] = value;
                }
            });
        };

        ct.fn.replaceServerInfo = function(instanceId) {
            var param = {
                tenantId : ct.data.tenantId,
            };
            if (instanceId) {
                param.instanceId = instanceId;
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    if (instanceId) {
                        var instance = data.content.instances[0];
                        var serverItem = common.objectsFindByField(ct.serverMainList, "id", data.content.instances[0].id);
                        if (serverItem && serverItem.id) {
                            var newItem = false;
                            if(serverItem.procState == "creating") {
                                newItem = true;
                            }
                            ct.fn.mergeServerInfo(serverItem, instance);
                            ct.fn.setProcState(serverItem);
                            ct.fn.setRdpConnectDomain(serverItem);
                            if(newItem) {
                                serverItem.newCreated = true;
                                $timeout(function () {
                                    serverItem.newCreated = false;
                                }, 5000);
                            }
                        }
                    } else {
                        if (ct.serverMainList.length > data.content.instances.length) {
                            ct.deployServerList.splice(data.content.instances.length, ct.serverMainList.length - data.content.instances.length);
                        }
                        angular.forEach(data.content.instances, function (instance, inKey) {
                            if (ct.serverMainList[inKey]) {
                                ct.fn.mergeServerInfo(ct.serverMainList[inKey], instance);
                                ct.fn.setProcState(ct.serverMainList[inKey]);
                                ct.fn.setRdpConnectDomain(ct.serverMainList[inKey]);
                            } else {
                                ct.fn.setProcState(instance);
                                ct.fn.setRdpConnectDomain(instance);
                                ct.serverMainList.push(instance);
                            }
                        });
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        // 서버 상태
        ct.fn.checkServerState = function(instanceId) {
            var param = {
                tenantId : ct.data.tenantId,
            };
            if (instanceId) {
                param.instanceId = instanceId;
                if ($scope.main.reloadTimmer['instanceServerState_' + instanceId]) {
                    $timeout.cancel($scope.main.reloadTimmer['instanceServerState_' + instanceId]);
                    $scope.main.reloadTimmer['instanceServerState_' + instanceId] = null;
                }
            } else {
                if ($scope.main.reloadTimmer['instanceServerStateList']) {
                    $timeout.cancel($scope.main.reloadTimmer['instanceServerStateList']);
                    $scope.main.reloadTimmer['instanceServerStateList'] = null;
                }
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/states', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    if (instanceId) {
                        var instanceStateInfo = data.content.instances[0];
                        if (ct.noIngStates.indexOf(instanceStateInfo.uiTask) == -1) {
                            $scope.main.reloadTimmer['instanceServerState_' + instanceStateInfo.id] = $timeout(function () {
                                ct.fn.checkServerState(instanceStateInfo.id);
                            }, 1000);
                            var serverItem = common.objectsFindByField(ct.serverMainList, "id", instanceStateInfo.id);
                            if (serverItem && serverItem.id) {
                                ct.fn.setProcState(serverItem);
                                angular.forEach(instanceStateInfo, function(value, key) {
                                    serverItem[key] = value;
                                });
                            }
                        } else {
                            ct.fn.replaceServerInfo(instanceStateInfo.id);
                        }
                    } else {
                        var serverStates = data.content.instances;
                        var isServerStatusCheck = false;
                        var isReplaceServerInfo = false;
                        if (ct.serverMainList.length > serverStates.length) {
                            ct.deployServerList.splice(serverStates.length, ct.serverMainList.length - serverStates.length);
                        }
                        var serverMainList = angular.copy(ct.serverMainList);
                        angular.forEach(serverStates, function (instanceStateInfo, inKey) {
                            var serverItem = common.objectsFindByField(serverMainList, "id", instanceStateInfo.id);
                            if (serverItem && serverItem.id) {
                                angular.forEach(instanceStateInfo, function(value, key) {
                                    serverItem[key] = value;
                                });
                            } else {
                                serverItem = instanceStateInfo;
                            }
                            if (ct.noIngStates.indexOf(serverItem.uiTask) == -1) {
                                isServerStatusCheck = true;
                                if (ct.serverMainList[inKey]) {
                                    ct.fn.setProcState(serverItem);
                                    ct.fn.mergeServerInfo(ct.serverMainList[inKey], serverItem);
                                } else {
                                    ct.serverMainList.push(serverItem);
                                    //ct.fn.replaceServerInfo(serverItem.id);
                                }
                            } else {
                                if (!ct.serverMainList[inKey]) {
                                    ct.serverMainList.push(serverItem);
                                } else {
                                    var serverStateItem = common.objectsFindByField(ct.serverMainList, "id", instanceStateInfo.id);
                                    if (serverStateItem && serverStateItem.id && ct.noIngStates.indexOf(serverStateItem.uiTask) == -1) {
                                        isReplaceServerInfo = true;
                                        ct.serverMainList[inKey].uiTask = "created_complete";
                                        $timeout(function () {
                                            ct.fn.replaceServerInfo(serverItem.id);
                                        }, 100);
                                    }
                                }
                            }
                        });
                        if (isServerStatusCheck) {
                            $scope.main.reloadTimmer['instanceServerStateList'] = $timeout(function () {
                                ct.fn.checkServerState();
                            }, 2000);
                        }
                        if (isReplaceServerInfo) {
                            ct.fnGetUsedResource();
                        }
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        //추가 S
        ct.fnGetUsedResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        //추가 E
        // 서버삭제
        ct.deleteInstanceJob = function(id) {
            common.showConfirm('서버 삭제','선택한 서버를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    instanceId : id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        common.showAlertSuccess('삭제되었습니다.');
                        ct.fnGetServerMainList();
                    } else {
                        $scope.main.loadingMainBody = false;
                        common.showAlertError('오류가 발생하였습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        ct.selectedValues = {};
        ct.fnServerConfirm = function(action,instance,index,$event) {
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
                ct.deleteInstanceJob(instance.id);
            } else if(action == "SNAPSHOT") {
                //ct.fn.createSnapshot(instance);
            	ct.fn.createPopSnapshot ($event,instance) ;
            } else if(action == "VOLUME"){
                ct.fn.createInstanceVolumePop($event,instance);
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop(instance,index);
            } else if(action == "IPDISCONNECT"){
                ct.fn.ipConnectionSet(instance, "detach",index);
            }
            ct.selectedValues[index] = "";
        };

        ct.fnSingleInstanceAction = function(action,instance,index) {
            var param = {
                instanceId : instance.id,
                action : action,
                tenantId : ct.data.tenantId
            };
            $scope.main.loadingMainBody = true;
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
                var sltInstance = ct.serverMainList[index]
                sltInstance.vmState = vmStateChange;
                sltInstance.uiTask = vmStateChange;
                sltInstance.vmStateSec = 0;
                ct.fn.setProcState(sltInstance);
                $scope.main.loadingMainBody = false;
                $scope.main.reloadTimmer['instanceServerState_' + sltInstance.id] = $timeout(function () {
                    ct.fn.checkServerState(sltInstance.id);
                }, 1000);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        // SnapShot 생성
        //20181120 sg0730  백업 이미지 생성 PopUp 추가
        ct.fn.createPopSnapshot = function($event,instance) {
        	var dialogOptions = {};
        	if(instance.vmState != 'stopped') {
                common.showAlertWarning('서버를 종료 후 생성가능합니다.');
                return;
            } else {
            	dialogOptions = {
            			controller : "iaasCreatePopSnapshotCtrl" ,
            			formName   : 'iaasCreatePopSnapshotForm',
            			selectInstance : angular.copy(instance),
            			callBackFunction : ct.reflashSnapShotCallBackFunction
            	};
            	$scope.actionBtnHied = false;
            	common.showDialog($scope, $event, dialogOptions);
            	$scope.actionLoading = true; // action loading
               
            }
        }; 
        
        // sg0730 차후 서버 이미지 생성 후 페이지 이동.
        ct.reflashSnapShotCallBackFunction = function () {
        	 $scope.main.goToPage('/iaas/compute');
        };
        
        ct.showInfo = function (instance) {
            instance.showVal = !instance.showVal;
        };
        //인스턴스 디스크 생성 팝업
       /* ct.fn.createInstanceVolumePop = function(instance) {
            ct.selectInstance = instance;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeVolumeForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };*/
        
        //인스턴스 디스크 생성 팝업
        ct.fn.createInstanceVolumePop = function($event,instance) {
        	var dialogOptions =  {
			            			controller : "iaasComputeVolumeFormCtrl" ,
			            			formName   : 'iaasComputeVolumeForm',
			            			selectInstance : angular.copy(instance),
			            			callBackFunction : ct.creInsVolPopCallBackFunction
				            	};
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };
        
        
        // sg0730 인스턴스 디스크 생성 팝업
        ct.creInsVolPopCallBackFunction = function () {
        	 $scope.main.goToPage('/iaas/compute');
        };
        

        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function(instance,index) {
            ct.selectInstance = instance;
            ct.selectInstanceIndex = index;

            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        // 공인 IP 연결 해제 펑션
        ct.fn.ipConnectionSet = function(instance,type,index) {
            common.showConfirm('메세지',instance.name +' 서버의 접속 IP를 해제하시겠습니까?').then(function(){
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
            });
        };

        if(ct.data.tenantId) {
            ct.fnGetUsedResource();
            ct.fnGetServerMainList();
        } else { // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해주세요.');
            showAlert.then(function () {
                $scope.main.goToPage("/");
            });
            return false;
        }

    })
    .controller('iaasComputeCreateCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCreateCtrl start", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct               = this;
        ct.data              = {};
        ct.fn                = {};
        ct.ui                = {};
        ct.roles             = [];
        ct.data.name         = '';
        ct.data.spec         = {};
        ct.data.networks     = [];
        ct.data.keypair      = {};
        ct.data.initScript   = {};
        ct.data.securityPolicys = [];
        ct.subnet            = {};
        ct.networks          = [];
        ct.volume            = {};
        ct.ipFlag            = true;
        ct.data.tenantId     = $scope.main.userTenant.id;
        ct.data.tenantName   = $scope.main.userTenant.korName;
        ct.formName          = "computeCreateForm";

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;

        ct.data.baseDomainName = ct.rdpBaseDomain;
        ct.data.subDomainName = "";

        ct.data.name = 'server-01';

        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.networks = data.content;
                ct.networks.unshift({id:"",name:'',description:"네트워크 선택"});
                ct.network = ct.networks[0];
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        //보안정책 조회
        ct.fn.getSecurityPolicy = function() {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.securityPolicyList = data.content;
                for(var i = 0; i < ct.securityPolicyList.length; i++){
                    if(ct.securityPolicyList[i].name == "default"){
                        ct.roles.push(ct.securityPolicyList[i]);
                        ct.data.securityPolicys = ct.roles;
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        //키페어 조회
        ct.fn.getKeypairList = function(keypairName) {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.keypairList = data.content;
                if(ct.keypairList.length == 0){
                    ct.createKeypair = {};
                    ct.createKeypair.tenantId = ct.data.tenantId;
                    ct.createKeypair.name = "default";
                    ct.createKeypair.description = "default keypair";

                    var param = {
                        keypair : ct.createKeypair
                    };
                    var returnData = common.noMsgSyncHttpResponseJson(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'POST', param);
                    if(returnData.status == 200) {
                        ct.fn.getKeypairList();
                    } else {
                        common.showAlertError(returnData.data.responseJSON.message);
                        $scope.main.loadingMainBody = false;
                    }
                }else{
                    for(var i = 0; i < ct.keypairList.length; i++){
                        if(ct.keypairList[i].name == "default"){
                            ct.data.keypair = ct.keypairList[i];
                        }
                    }
                    if (!ct.data.keypair) {
                        ct.data.keypair = ct.keypairList[0];
                    }
                    $scope.main.loadingMainBody = false;
                    ct.fn.getSpecList();
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.isSpecLoad = false;
        //스펙그룹의 스펙 리스트 조회
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
            if (ct.isSpecLoad && ct.data.image && ct.data.image.id) {
                angular.forEach(ct.specList, function (spec) {
                    if (spec.disk < ct.data.image.minDisk || spec.ram < ct.data.image.minRam) {
                        spec.disabled = true;
                    }
                });
                ct.specMinDisabledSetting = true;
                if(ct.data.spec && ct.data.spec.uuid) {
                    if (ct.data.spec.disk < ct.data.image.minDisk || ct.data.spec.ram < ct.data.image.minRam) {
                        ct.fn.defaultSelectSpec();
                    }
                } else {
                    ct.fn.defaultSelectSpec();
                }
            }
        };

        // min spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        ct.isMinSpecDisabled = false;
        // spec loading 체크
        ct.specMaxDisabledSetting = false;
        ct.fn.setSpecMaxDisabled = function () {
            if (ct.isSpecLoad && ct.tenantResource && ct.tenantResource.maxResource &&  ct.tenantResource.usedResource) {
                angular.forEach(ct.specList, function (spec) {
                    if (spec.vcpus > ct.tenantResource.available.cores || spec.ram > ct.tenantResource.available.ramSize || spec.disk > ct.tenantResource.available.instanceDiskGigabytes) {
                        spec.disabled = true;
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
            if(ct.specMinDisabledSetting && ct.specMaxDisabledSetting){
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
                }
            }
        };

        //사양선택 이벤트 2018.11.13 sg0730 add
        ct.fn.selectSpec = function(sltSpec) {
            if (!ct.specDisabledAllSetting || sltSpec.disabled) return;
            if(sltSpec && sltSpec.uuid) {
                ct.data.spec = angular.copy(sltSpec);
                ct.specUuid = ct.data.spec.uuid;
            } else {
                ct.data.spec = {};
                ct.specUuid = "";
            }
        };

        ct.imageListLoad = false;
        //이미지 리스트 조회
        ct.fn.imageListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            };
            if(ct.conditionKey == 'imageServiceName') {
                param.imageServiceName = ct.conditionValue;
            }
            if(ct.conditionKey == 'imageUseCase') {
                param.imageUseCase = ct.conditionValue;
            }
            //param.imageType = ct.imageType;
            ct.imageList  = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/image', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.images && data.content.images.length > 0) {
                    ct.imageList  = data.content.images;
                    angular.forEach(ct.imageList, function (image) {
                        var sizeGb = image.size/(1024*1024*1024);
                        image.minDisk = (image.minDisk > sizeGb) ? image.minDisk : sizeGb;
                        image.minRam = (image.minRam > 0) ? image.minRam/(1024) : 0;
                    });
                    ct.fn.imageClick(ct.imageList[0]);
                }
                ct.imageListLoad = true;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.imageListLoad = true;
                common.showAlertError(data.message);
            });
        };
        
        ct.fn.imageClick = function (image) {
            ct.data.image = angular.copy(image);
            ct.sltImageId = ct.data.image.id;
            ct.fn.setSpecAllEnabled();
            ct.fn.setSpecMinDisabled();
            ct.fn.setSpecMaxDisabled();
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
                if(ct.networks.length > 0) {
                    ct.network = ct.networks[0];
                    ct.data.networks.push(ct.networks[0]);
                    ct.subnet.cidr_A = ct.network.subnets[0].cidr_A;
                    ct.subnet.cidr_B = ct.network.subnets[0].cidr_B;
                    ct.subnet.cidr_C = ct.network.subnets[0].cidr_C;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        //네트워크 setting
        ct.fn.networksChange = function() {
            if(ct.network && ct.network.subnets) {
                ct.subnet.cidr_A = ct.network.subnets[0].cidr_A;
                ct.subnet.cidr_B = ct.network.subnets[0].cidr_B;
                ct.subnet.cidr_C = ct.network.subnets[0].cidr_C;
                ct.data.networks = [{
                    id : ct.network.id
                }];
            }
        };
        
        // 디스크 생성 부분 추가 2018.11.13 sg0730
        ct.fn.getTenantResource = function()  {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params);
            
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0) {
                    ct.tenantResource = data.content[0];
                    ct.tenantResource.available = {};
                    ct.tenantResource.available.instances = ct.tenantResource.maxResource.instances - ct.tenantResource.usedResource.instances;
                    ct.tenantResource.available.floatingIps = ct.tenantResource.maxResource.floatingIps - ct.tenantResource.usedResource.floatingIps;
                    ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                    ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                    ct.tenantResource.available.instanceDiskGigabytes = ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes;
                    ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;
                    ct.tenantResource.available.objectStorageGigaByte = ct.tenantResource.maxResource.objectStorageGigaByte - ct.tenantResource.usedResource.objectStorageGigaByte;
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.volumeGigabytes;
                    ct.fn.setSpecMaxDisabled();
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };
        
        //ip체크
        ct.fn.checkCidr = function() {
            if(!ct.subnet.cidr_A || !ct.subnet.cidr_B || !ct.subnet.cidr_C || !ct.subnet.cidr_D) {
                common.showAlertWarning("ip를 입력해주세요.");
                return;
            }

            var regExp = /^\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b/i;
            if(!regExp.test(ct.subnet.cidr_D)) {
                common.showAlertWarning("0~255까지의 숫자만 입력가능합니다.");
                return;
            }

            var param = {
                tenantId : ct.data.tenantId,
                networkId : ct.network.id,
                ipaddr : ct.subnet.cidr_A + '.' + ct.subnet.cidr_B + '.' + ct.subnet.cidr_C + '.' + ct.subnet.cidr_D
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/fixedIps', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if(!data.content.ipinfos[0].used) {
                    ct.data.fixedIp = data.content.ipinfos[0].addr;
                    ct.data.portId = data.content.ipinfos[0].id;
                    common.showAlertSuccess("사용가능한 Ip입니다.");
                    ct.ipFlag = true;
                }else {
                    common.showAlertWarning("사용중인 ip입니다.");
                    ct.subnet.cidr_D = "";
                    ct.ipFlag = false;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        //자동&수동할당 체크
        ct.networkBindCheck = false;
        ct.fn.networkBindSet = function() {
            if(ct.networkBindCheck) {
                ct.subnet.cidr_D = "";
                ct.ipFlag = false;
            }
        };
        
        ct.fn.subnetCidrDChange = function() {
            if(ct.subnet.cidr_D) {
                ct.ipFlag = false;
            }else {
                ct.ipFlag = true;
            }
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

        ct.fn.subDomainCustomValidationCheck = function(subDomain) {
            if (subDomain && angular.isArray(ct.usingDomainNames) && ct.usingDomainNames.length > 0) {
                var domainName = subDomain + "." + ct.data.baseDomainName;
                if ((ct.formMode != "mod" || ct.orgDomain.domain != domainName) && ct.usingDomainNames.indexOf(domainName) >= 0) {
                    return {isValid: false, message: "이미 사용중인 서브도메인 입니다."};
                }
            }
            return {isValid : true};
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

        //서버 생성
        var clickCheck = false;
        ct.fn.createServer = function()  {
            if(clickCheck) return;
            clickCheck = true;

            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                clickCheck = false;
                return;
            }

            var params = {};

            params.instance              = {};
            params.instance.name             = ct.data.name;
            params.instance.tenantId         = ct.data.tenantId;
            params.instance.networks         = [{ id: ct.data.networks[0].id }];
            params.instance.image            = {id: ct.data.image.id};
            params.instance.keypair          = { keypairName: ct.data.keypair.keypairName };
            params.instance.securityPolicies = angular.copy(ct.data.securityPolicys);
            params.instance.spec = ct.data.spec;

            if (ct.data.image.osType == 'windows') {
                if (ct.data.baseDomainName && ct.data.subDomainName) {
                    params.instance.rdpDomain = ct.data.subDomainName + "." + ct.data.baseDomainName;
                }
            }

            if (ct.volumeSize > 0) {
                params.volume = {};
                params.volume.name = instance.name+'_volume01';
                params.volume.type = 'HDD';
                params.volume.size = ct.volumeSize;
                params.volume.tenantId = ct.data.tenantId;
            }

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', params);
            returnPromise.success(function (data, status, headers)  {
                // 서버생성후 -> 디스크 생성 후 sucess 처리.
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess(ct.data.name+" 서버 생성이 시작 되었습니다.");
                // 페이지 이동으로 바꿔야 하고
                $scope.main.goToPage("/iaas/compute");
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
                clickCheck = false;
            });
        };

        if(ct.data.tenantId) {
            ct.fn.getTenantResource();
            ct.fn.getDomainUsingList();
            ct.fn.getSpecList();
            ct.fn.imageListSearch();
            ct.fn.getSecurityPolicy();
            ct.fn.networkListSearch();
            ct.fn.getKeypairList();
        }

    })
    .controller('iaasComputeCopyCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCopyCtrl start", 1);

        var ct               = this;
        ct.projectId          = $scope.main.sltProjectId;
        ct.sltPortalOrgId    = $scope.main.sltPortalOrgId;
        ct.tenantId          = $scope.main.userTenantId;
        ct.fn                = {};
        ct.formName          = "computeCopyForm";

        ct.portalOrgs = angular.copy($scope.main.portalOrgs);
        ct.instanceSnapshotList = [];
        ct.userTenants = [];
        ct.schPortalOrgId = "";
        ct.schFilterTenantId = "";
        ct.schFilterText = "";

        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        // Snapshot List
        ct.fn.getInstanceSnapshotList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.tenantId
            };
            ct.instanceSnapshotList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList/others', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.instanceSnapshotList = data.content;
                angular.forEach(ct.instanceSnapshotList, function (item) {
                    var userTenant = common.objectsFindCopyByField(ct.userTenants, "id", item.tenantId);
                    if (userTenant && userTenant.korName) {
                        item.portalOrgName = userTenant.korName;
                    }
                });
                ct.pageOptions.total = ct.instanceSnapshotList.length;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getUserTenants = function() {
            var param = {
                orgCode : ct.projectId
            };
            ct.userTenants = [];
            $scope.main.loadingMainBody = false;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/org', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0 && data.content[0].teams && data.content[0].teams.length > 0) {
                    ct.userTenants = data.content[0].teams;
                    angular.forEach(ct.userTenants, function (item) {
                        var portalOrg = common.objectsFindCopyByField(ct.portalOrgs, "orgId", item.teamCode);
                        if (portalOrg && portalOrg.orgName) {
                            item.korName = portalOrg.orgName;
                        }
                    });
                }
                ct.fn.getInstanceSnapshotList();
            });
            returnPromise.error(function (data, status, headers) {
            });
        };

        ct.fn.onChangeSchPortalOrg = function(schPortalOrgId) {
            var userTenant = null;
            if (schPortalOrgId) {
                userTenant = common.objectsFindCopyByField(ct.userTenants, "teamCode", schPortalOrgId);
            }
            if (userTenant && userTenant.id) {
                ct.schFilterTenantId = userTenant.id;
            } else {
                ct.schFilterTenantId = "";
            }
        };

        ct.fn.changeCurrentPage = function(currentPage) {
            ct.pageOptions.currentPage = currentPage;
        };

        ct.fn.getUserTenants();
    })
;
