'use strict';

// angular.module('iaas.controllers')
angular.module('gpu.controllers')
    // .controller('iaasComputeTempCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
    .controller('gpuComputeTempCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        // _DebugConsoleLog("computeTempControllers.js : iaasComputeTempCtrl", 1);
        _DebugConsoleLog("computeTempControllers.js : gpuComputeTempCtrl", 1);

        $scope.actionBtnEnabled = true;

        var ct 				= this;
        ct.list 			= {};
        ct.fn 				= {};
        ct.data 			= {};
        ct.roles 			= [];
        ct.network 			= {};
        ct.serverMainList   = [];
        ct.lbServiceLists   = [];
        ct.consoleLogLimit 	= '50';
        ct.actionLogLimit 	= '10';
        ct.pageFirstLoad 	= true;
        ct.loadingServerList 	= false;
        ct.loadingLbList 	= false;
        ct.showVal			= false;
        ct.schFilterText    = "";
        ct.schLbFilterText    = "";
        // 공통 레프트 메뉴의 userTenantId
        // ct.data.tenantId = $scope.main.userTenant.id;
        // ct.data.tenantName = $scope.main.userTenant.korName;
        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.data.tenantName = $scope.main.userTenantGpu.korName;

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;
        ct.tabIndex = 0;

        // 부하분산 서버관리 디테일 페이지에서 리스트 페이지로 넘어올때 필요하여 추가
        if ($location.$$search.tabIndex) {
            ct.tabIndex = $location.$$search.tabIndex;
        }

        ct.fn.formOpen = function($event, state, data){
            ct.formType = state;
            if (state == 'storage') {
                ct.fn.createStorage($event);
            } else if (state == 'snapshot') {
                ct.fn.createPopSnapshot($event,data);
            } else if (state == 'rename') {
                ct.fn.reNamePopLb($event,data);
            }
        };

        ct.computeEditFormOpen = function (instance, $event){
            var dialogOptions =  {
                // controller       : "iaasComputeEditFormCtrl" ,
                controller       : "gpuComputeEditFormCtrl" ,
                formName         : 'computeEditForm',
                instance         : angular.copy(instance)
                // callBackFunction : ct.reNamePopServerCallBackFunction1
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        //20181120 sg0730  서버사양변경 PopUp 추가
        ct.computePopEditServerForm = function (instance, $event, $index) {
        	 var dialogOptions = {
                 // controller : "iaasComputePopEditServerCtrl" ,
                 // formName   : 'iaasComputePopEditServerForm',
                 controller : "gpuComputePopEditServerCtrl" ,
                 formName   : 'gpuComputePopEditServerForm',
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
            }, 10000);
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
            // document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
            document.location.href = CONSTANTS.gpuApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
        };

        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/networks', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                ct.networks = data.content;
                ct.networks.unshift({id:"",name:'',description:"네트워크 선택"});
                ct.network = ct.networks[0];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError(data.message);
                }
                $scope.main.loadingMainBody = false;
            });
        };

        ct.firstInstanceCreatePop = function() {
            var dialogOptions = {
                controllerAs: "pop",
                // templateUrl : _IAAS_VIEWS_ + "/compute/firstInstanceCreatePop.html" + _VersionTail(),
                templateUrl : _GPU_VIEWS_ + "/compute/firstInstanceCreatePop.html" + _VersionTail(),
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
                    if (!serverMain.creatingTimmer) {
                        if (angular.isObject(serverMain.elapsed)) {
                            serverMain.creatingTimmer = parseInt(serverMain.elapsed.time/1000, 10);
                        } else {
                            var createdDate = new Date(serverMain.created);
                            serverMain.creatingTimmer = parseInt((nowDate.getTime() - createdDate.getTime())/1000, 10);
                        }
                    } else {
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

        ct.noIngStates = ['active', 'stopped', 'error', 'paused', 'shelved_offloaded', 'error_ip', 'error_volume'];
        ct.creatingStates = ['creating', 'networking', 'block_device_mapping'];

        // 서버메인 tenant list 함수
        ct.fnGetServerMainList = function() {
            $scope.main.loadingMainBody = true;

            var param = {
                tenantId : ct.data.tenantId,
                queryType : 'list'
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.loadingServerList = false;
                ct.serverMainList = [];
                var instances = [];
                if (status == 200 && data && data.content && data.content.instances && angular.isArray(data.content.instances)) {
                    instances = data.content.instances;
                    var rtFilter = $filter('filter')(instances, {taskState: '!deleting'});
                    //if (data.totalElements != 0){
                    if (rtFilter.length != 0){
                        ct.loadingServerList = true;
                    }
                }
                var isServerStatusCheck = false;
                common.objectOrArrayMergeData(ct.serverMainList, instances);
                var nowDate = new Date();
                angular.forEach(ct.serverMainList, function (serverMain) {
                    if (ct.noIngStates.indexOf(serverMain.uiTask) == -1) {
                        isServerStatusCheck = true;
                    }
                    ct.fn.setProcState(serverMain);
                    ct.fn.setRdpConnectDomain(serverMain);
                    if (angular.isObject(serverMain.elapsed)) {
                        serverMain.creatingTimmer = parseInt(serverMain.elapsed.time/1000, 10);
                    } else {
                        var createdDate = new Date(serverMain.created);
                        serverMain.creatingTimmer = parseInt((nowDate.getTime() - createdDate.getTime())/1000, 10);
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
                /*if (ct.pageFirstLoad && (!ct.serverMainList || ct.serverMainList.length == 0)) {
                    ct.firstInstanceCreatePop();
                }*/
                ct.pageFirstLoad = false;
            });
            returnPromise.error(function (data, status, headers) {
                ct.pageFirstLoad = false;
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                console.debug("serverMainList: ", ct.serverMainList);
            });
        };

        ct.fn.setProcState = function (instance) {
            if (ct.noIngStates.indexOf(instance.uiTask) >= 0 && (!instance.taskState || instance.taskState == 'image_uploading')) {
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
            if (instance.instanceDomainLinkInfos && instance.instanceDomainLinkInfos.length > 0) {
                var rdpDomain = "";
                angular.forEach(instance.instanceDomainLinkInfos, function (domainLinkInfo) {
                    if (domainLinkInfo.domainInfo && domainLinkInfo.domainInfo.domain
                        && domainLinkInfo.domainInfo.domain.substring(domainLinkInfo.domainInfo.domain.length - ct.rdpBaseDomain.length) == ct.rdpBaseDomain) {
                        rdpDomain = domainLinkInfo.domainInfo.domain;
                        domainLinkInfo.isRdpDomain = true;
                    } else {
                        domainLinkInfo.isRdpDomain = false;
                    }
                });
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
                tenantId : ct.data.tenantId
            };
            if (instanceId) {
                param.instanceId = instanceId;
            }
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    if (instanceId) {
                        var instance = data.content.instances[0];
                        var serverItem = common.objectsFindByField(ct.serverMainList, "id", data.content.instances[0].id);
                        if (serverItem && serverItem.id) {
                            var beforUiTask = serverItem.uiTask;
                            var newItem = false;
                            if (serverItem.procState == "creating") {
                                newItem = true;
                            }
                            ct.fn.mergeServerInfo(serverItem, instance);
                            ct.fn.setProcState(serverItem);
                            ct.fn.setRdpConnectDomain(serverItem);
                            if (newItem) {
                                common.showAlertSuccess('"' + serverItem.name + '" 서버가 생성 되었습니다.');
                                serverItem.newCreated = true;
                                $timeout(function () {
                                    serverItem.newCreated = false;
                                }, 5000);
                            } else {
                                var message = '"' + serverItem.name + '" ';
                                if (beforUiTask == "starting") {
                                    message += '서버가 시작 되었습니다.'
                                } else if (beforUiTask == "stopping")  {
                                    message += '서버가 정지 되었습니다.'
                                } else if (beforUiTask == "pausing")  {
                                    message += '서버가 일시정지 되었습니다.'
                                } else if (beforUiTask == "unpausing")  {
                                    message += '서버가 정지해제 되었습니다.'
                                } else if (beforUiTask == "rebooting")  {
                                    message += '서버가 재시작 되었습니다.'
                                } else if (beforUiTask == "shelved")  {
                                    message += '서버가 비활성화 되었습니다.'
                                } else if (beforUiTask == "shelved_offloaded")  {
                                    message += '서버가 활성화 되었습니다.'
                                } else if (beforUiTask == "resized")  {
                                    message += '서버의 사양이 되었습니다.'
                                } else {
                                    message += '서버에 적용 되었습니다.'
                                }
                                common.showAlertSuccess(message);
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
                tenantId : ct.data.tenantId
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/states', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/states', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    if (instanceId) {
                        var instanceStateInfo = data.content.instances[0];
                        ct.fn.setProcState(instanceStateInfo);
                        if (instanceStateInfo.procState != 'end') {
                            $scope.main.reloadTimmer['instanceServerState_' + instanceStateInfo.id] = $timeout(function () {
                                ct.fn.checkServerState(instanceStateInfo.id);
                            }, 1000);
                            var serverItem = common.objectsFindByField(ct.serverMainList, "id", instanceStateInfo.id);
                            if (instanceStateInfo.taskState == "shelving_image_uploading" || instanceStateInfo.taskState == "shelving_offloading" || instanceStateInfo.taskState == "shelving" || instanceStateInfo.taskState == "shelving_image_pending_upload") {
                                instanceStateInfo.vmState = "shelved";
                            } else if (instanceStateInfo.taskState == "powering-off") {
                                instanceStateInfo.vmState = "stopping";
                            }
                            if (instanceStateInfo.vmState == "shelved_offloaded" && (instanceStateInfo.taskState == "spawning" || instanceStateInfo.taskState == "unshelving")) {
                                instanceStateInfo.vmState = "unshelved";
                            }
                            if (serverItem && serverItem.id) {
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
                            ct.serverMainList.splice(serverStates.length, ct.serverMainList.length - serverStates.length);
                        }
                        var serverMainList = angular.copy(ct.serverMainList);
                        angular.forEach(serverStates, function (instanceStateInfo, inKey) {
                            ct.fn.setProcState(instanceStateInfo);
                            var serverItem = common.objectsFindByField(serverMainList, "id", instanceStateInfo.id);
                            if (serverItem && serverItem.id) {
                                delete serverItem.taskState;
                                angular.forEach(instanceStateInfo, function(value, key) {
                                    serverItem[key] = value;
                                });
                            } else {
                                serverItem = instanceStateInfo;
                            }
                            if (serverItem.procState != 'end') {
                                isServerStatusCheck = true;
                                if (ct.serverMainList[inKey]) {
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
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/used', 'GET', params));
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError(data.message);
                }
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
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'DELETE', param);
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'DELETE', param);
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
            if (action == "START") {
                common.showConfirm('시작',instance.name +' 서버를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "STOP") {
                common.showConfirm('정지',instance.name +' 서버를 정지하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "PAUSE") {
                common.showConfirm('일시정지', instance.name +' 서버를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "UNPAUSE") {
                common.showConfirm('정지해제', instance.name +' 서버를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "REBOOT") {
                common.showConfirm('재시작',instance.name +' 서버를 재시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "SHELVE") {
                common.showConfirm('비활성화', instance.name + ' 서버를 비활성화 하시겠습니까?').then(function () {
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if (action == "UNSHELVE") {
                common.showConfirm('비활성화 해제',instance.name +' 서버를 활성화 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "DELETE") {
                ct.deleteInstanceJob(instance.id);
            } else if (action == "SNAPSHOT") {
                //ct.fn.createSnapshot(instance);
            	ct.fn.createPopSnapshot ($event,instance) ;
            } else if (action == "VOLUME"){
                ct.fn.createInstanceVolumePop($event,instance);
            } else if (action == "IPCONNECT"){
                ct.fn.IpConnectPop(instance,index);
            } else if (action == "IPDISCONNECT"){
                ct.fn.ipConnectionSet(instance, "detach",index);
            } else if (action == "RENAME") {
                ct.deleteInstanceJob(instance.id);
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
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                var vmStateChange = "";
                if (action == "START") {
                    vmStateChange = "starting";
                }else if (action == "STOP") {
                    vmStateChange = "stopping";
                }else if (action == "PAUSE") {
                    vmStateChange = "pausing";
                }else if (action == "UNPAUSE") {
                    vmStateChange = "unpausing";
                }else if (action == "REBOOT") {
                    vmStateChange = "rebooting";
                }else if (action == "SHELVE") {
                    vmStateChange = "shelved";
                }else if (action == "UNSHELVE") {
                    vmStateChange = "unshelved";
                }
                var sltInstance = ct.serverMainList[index];
                sltInstance.vmState = vmStateChange;
                sltInstance.uiTask = vmStateChange;
                sltInstance.vmStateSec = 0;
                ct.fn.setProcState(sltInstance);
                $scope.main.loadingMainBody = false;
                $scope.main.reloadTimmer['instanceServerState_' + sltInstance.id] = $timeout(function () {
                    ct.fn.checkServerState(sltInstance.id);
                }, 5000);
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
        	if (instance.vmState != 'stopped') {
                common.showAlertWarning('서버를 정지 후 생성가능합니다.');
            } else {
            	dialogOptions = {
            			// controller : "iaasCreatePopSnapshotCtrl" ,
            			// formName   : 'iaasCreatePopSnapshotForm',
                        controller : "gpuCreatePopSnapshotCtrl" ,
                        formName   : 'gpuCreatePopSnapshotForm',
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
        	 // $scope.main.goToPage('/iaas/compute');
            $scope.main.goToPage('/gpu/compute');
        };
        
        ct.showInfo = function (instance) {
            instance.showVal = !instance.showVal;
        };

        // 웹콘솔 접근
        ct.fn.openWebConsole = function(instance) {
            var param = {
                instanceId : instance.id,
                tenantId : ct.data.tenantId
            };
             // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/vnc', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/vnc', 'GET', param);
             returnPromise.success(function (data, status, headers) {
                 window.open(data.content, '_blank');
             });
             returnPromise.error(function (data, status, headers) {
                 common.showAlertError(data.message);
                 $scope.main.loadingMainBody = false;
             });
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
			            			// controller : "iaasComputeVolumeFormCtrl" ,
			            			// formName   : 'iaasComputeVolumeForm',
                                    controller : "gpuComputeVolumeFormCtrl" ,
                                    formName   : 'gpuComputeVolumeForm',
			            			selectInstance : angular.copy(instance),
			            			callBackFunction : ct.creInsVolPopCallBackFunction
				            	};
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // sg0730 인스턴스 디스크 생성 팝업
        ct.creInsVolPopCallBackFunction = function () {
        	 // $scope.main.goToPage('/iaas/compute');
            $scope.main.goToPage('/gpu/compute');
        };

        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function(instance,index) {
            ct.selectInstance = instance;
            ct.selectInstanceIndex = index;

            // $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
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
                if (instance.floatingIp) {
                    param.floatingIp = instance.floatingIp;
                    param.action = type;
                } else {
                    return false;
                }
                $scope.main.loadingMainBody = true;
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertSuccess('접속 IP가 해제되었습니다.');
                    ct.serverMainList[index].floatingIp = "";
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.copyConnectInfoToClipboard = function (instance) {
            if (instance.image.osType == 'ubuntu') {
                if (instance.floatingIp) {
                    common.copyToClipboard(instance.floatingIp);
                    $scope.main.copyToClipboard(instance.floatingIp, '"' + instance.floatingIp + '"가 클립보드에 복사 되었습니다.');
                } else {
                    common.showAlertWarning("접속 IP가 존재하지 않습니다.");
                }
            } else if (instance.image.osType == 'windows') {
                var rdpConnectUrl = (instance.rdpConnectDomain) ? instance.rdpConnectDomain + ':' + ct.rdpConnectPort : '';
                var rdpDomain = instance.rdpDomain ? instance.rdpDomain : '';
                var copyUrl = rdpConnectUrl ? rdpConnectUrl : rdpDomain;
                if (copyUrl) {
                    common.copyToClipboard(copyUrl);
                    $scope.main.copyToClipboard(copyUrl, '"' + copyUrl + '"가 클립보드에 복사 되었습니다.');
                } else {
                    common.showAlertWarning("접속 URL이 존재하지 않습니다.");
                }
            }
        };

        // lb 전체 리스트 조회
        ct.fngetLbList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancers', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancers', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.lbServiceLists = data.content;
                //console.log("ct.lbServiceLists : ", ct.lbServiceLists);
                ct.iaasLbPortMembers = [];
                ct.connectServer = "";
                if (ct.lbServiceLists.length != 0) {
                    ct.loadingLbList = true;
                }

                angular.forEach(ct.lbServiceLists, function (lbList) {
                    if (lbList.iaasLbInfo.checkStatus.indexOf("ing") > -1) {
                        $scope.main.reloadTimmer['instanceServerStateList'] = $timeout(function () {
                            ct.fn.checkLbState(lbList.iaasLbInfo.id);
                        }, 1000);
                    }
                });
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // lb 삭제
        ct.deleteLb = function(id) {
            common.showConfirm('LB 삭제','선택한 LB를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    loadBalancerId : id
                };
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'DELETE', param);
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        common.showAlertSuccess('삭제되었습니다.');
                        ct.fngetLbList();
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

        // 이름 & 설명 변경 팝업
        ct.fn.reNamePopLb = function($event, lbserviceList) {
            var dialogOptions =  {
                // controller       : "iaasReNamePopLoadBalancerCtrl" ,
                // formName         : 'iaasReNamePopLoadBalancerForm',
                controller       : "gpuReNamePopLoadBalancerCtrl" ,
                formName         : 'gpuReNamePopLoadBalancerForm',
                selectLoadBalancer    : angular.copy(lbserviceList),
                callBackFunction : ct.reNamePopLoadBalancerCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.reNamePopLoadBalancerCallBackFunction = function () {
            ct.fngetLbList();
        };

        // lb 상태 조회
        ct.fn.checkLbState = function(loadBalancerId) {
            var param = {loadBalancerId: loadBalancerId};
            if ($scope.main.reloadTimmer['loadBalancerState_' + loadBalancerId]) {
                $timeout.cancel($scope.main.reloadTimmer['loadBalancerState_' + loadBalancerId]);
                $scope.main.reloadTimmer['loadBalancerState_' + loadBalancerId] = null;
            }
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.iaasLbInfo) {
                    var lbLists = data.content;
                    //ct.fn.setProcState(instanceStateInfo);
                    if (lbLists.iaasLbInfo.checkStatus.indexOf("ing") > -1) {
                        $scope.main.reloadTimmer['loadBalancerState_' + lbLists.iaasLbInfo.id] = $timeout(function () {
                            ct.fn.checkLbState(lbLists.iaasLbInfo.id);
                        }, 2000);
                    }
                    angular.forEach(ct.lbServiceLists, function (lbList) {
                        if (lbList.iaasLbInfo.id == loadBalancerId) {
                            lbList.iaasLbInfo = lbLists.iaasLbInfo;
                            angular.forEach(lbLists.iaasLbPorts, function (lbPort) {
                                var lbPortSearch = common.objectsFindByField(lbList.iaasLbPorts, "id", lbPort.id);
                                if (lbPortSearch == null) {
                                    lbList.iaasLbPorts.push(lbPort);
                                }
                            });
                            angular.forEach(lbLists.iaasLbPortMembers, function (lbPortMember) {
                                var lbPortMemberSearch = common.objectsFindByField(lbList.iaasLbPortMembers, "id", lbPortMember.id);
                                if (lbPortMemberSearch == null) {
                                    lbList.iaasLbPortMembers.push(lbPortMember);
                                }
                            });
                        }
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        if (ct.data.tenantId) {
            ct.fnGetUsedResource();
            ct.fnGetServerMainList();
            ct.fngetLbList();
        } else { // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해 주세요.');
            showAlert.then(function () {
                $scope.main.goToPage("/");
            });
            return false;
        }
    })
;
