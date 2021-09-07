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
        ct.serverMainList   = [];
        ct.lbServiceLists   = [];
        ct.promiseList      = [];
        ct.consoleLogLimit 	= '50';
        ct.actionLogLimit 	= '10';
        ct.loadingServerList 	= false;
        ct.loadingLbList 	= false;
        ct.showVal			= false;
        ct.schFilterText    = "";
        ct.schLbFilterText    = "";
        ct.listType = "image";          //리스트 타입
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenant.id;
        ct.data.tenantName = $scope.main.userTenant.korName;

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;
        ct.tabIndex = 0;
        ct.lbPortCnt = 0;   //테넌트의 전체 lbPort 갯수

        // 부하분산 인스턴스 관리 디테일 페이지에서 리스트 페이지로 넘어올때 필요하여 추가
        if ($location.$$search.tabIndex) {
            ct.tabIndex = $location.$$search.tabIndex;
        }

        //임시 알림 설정 2020.02.03
        ct.showTempAlert = function() {
            common.showDialogAlert("알림", "플랫폼 정책 변경에 따라 신규 프로젝트와 가상머신 생성을 제한하고 있습니다.\n자세한 문의는 관리자(042-865-6786, 042-865-5236)으로 문의하여 주시기 바랍니다.");
            return;
        };

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
                controller       : "iaasComputeEditFormCtrl" ,
                formName         : 'computeEditForm',
                instance         : angular.copy(instance)
                // callBackFunction : ct.reNamePopServerCallBackFunction1
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*ct.reNamePopServerCallBackFunction1 = function () {
            ct.fnGetServerMainList();
        };*/

        //20181120 sg0730  인스턴스 사양변경 PopUp 추가
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
            }, 10000);
        };

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
            ct.networks = [{id:"",name:'',description:"네트워크 선택"}];
            ct.network = ct.networks[0];
            ct.fnGetServerMainList();
            //ct.fnGetUsedResource();
        });
        
        ct.fn.getKeyFile = function(keypair,type) {
            var returnData = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name, 'GET'));
            //returnData.success(()=>{
            returnData.success(function (data, status, headers) {
                document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
            });
            //returnData.error(()=>{
            returnData.error(function (data, status, headers) {
            });
        };

        ct.fn.getWindowAgentConfFile = function (instance) {
            return CONSTANTS.iaasApiContextUrl + '/server/windows/script/download?tenantId='+ct.data.tenantId+"&instanceId="+instance.id;
        }; 

        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param));
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
                templateUrl : _IAAS_VIEWS_ + "/compute/firstInstanceCreatePop.html" + _VersionTail()
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

        // 인스턴스 메인 tenant list 함수
        ct.fnGetServerMainList = function() {
            if (!ct.data || !ct.data.tenantId) {
                common.showAlertWarning('테넌트 정보가 없습니다.');
                return;
            }
            var param = {
                tenantId : ct.data.tenantId,
                queryType : 'list'
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
            returnPromise.success(function (data, status, headers) {
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
                //인스턴스 목록이 없을 때 자원사용여부 확인 후 사용하지 않을 때 [서비스 삭제하기] 활성화
                if (!ct.loadingServerList) {
                    $scope.main.checkUseYnPortalOrgSystem("iaas");
                }
                var isServerStatusCheck = false;
                common.objectOrArrayMergeData(ct.serverMainList, instances);
                ct.fnGetInstancesData();
                var nowDate = new Date();
                angular.forEach(ct.serverMainList, function (serverMain) {
                    ct.fn.setProcState(serverMain);
                    // 인스턴스 생성중, 변경 상태가 있다면 true
                    if (serverMain.procState != 'end') {
                        isServerStatusCheck = true;
                    }
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
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function () {
                ct.pageFirstLoad = false;
            });
            ct.promiseList.push(returnPromise);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    if (instanceId) {
                        var instance = data.content.instances[0];
                        var serverItem = common.objectsFindByField(ct.serverMainList, "id", data.content.instances[0].id);
                        ct.fnGetInstancesData(serverItem);
                        if (serverItem && serverItem.id) {
                            var beforUiTask = serverItem.uiTask;
                            var newItem = false;
                            if (serverItem.procState == "creating") {
                                newItem = true;
                            }
                            ct.fn.mergeServerInfo(serverItem, instance);
                            ct.fn.setProcState(serverItem);
                            ct.fn.setRdpConnectDomain(serverItem);
                            // VM 생성시 1시간 초과하여 미생성시 자동 삭제 처리
                            if (newItem && serverItem.floatingIp == "") {
                                common.showAlertInfo('"' + serverItem.name + '" 인스턴스가 생성한지 1시간이 지나 삭제되었습니다.');
                            } else if (newItem) {
                                common.showAlertSuccess('"' + serverItem.name + '" 인스턴스가 생성 되었습니다.');
                                serverItem.newCreated = true;
                                $timeout(function () {
                                    serverItem.newCreated = false;
                                }, 5000);
                            } else {
                                var message = '"' + serverItem.name + '" ';
                                if (beforUiTask == "starting") {
                                    message += '인스턴스가 시작 되었습니다.'
                                } else if (beforUiTask == "stopping")  {
                                    message += '인스턴스가 정지 되었습니다.'
                                } else if (beforUiTask == "pausing")  {
                                    message += '인스턴스가 일시정지 되었습니다.'
                                } else if (beforUiTask == "unpausing")  {
                                    message += '인스턴스가 정지해제 되었습니다.'
                                } else if (beforUiTask == "rebooting")  {
                                    message += '인스턴스가 재시작 되었습니다.'
                                } else if (beforUiTask == "shelved")  {
                                    message += '인스턴스가 비활성화 되었습니다.'
                                } else if (beforUiTask == "shelved_offloaded")  {
                                    message += '인스턴스가 활성화 되었습니다.'
                                } else if (beforUiTask == "resized")  {
                                    message += '인스턴스의 사양이 되었습니다.'
                                } else {
                                    message += '인스턴스에 적용 되었습니다.'
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
                        ct.fnGetInstancesData(ct.serverMainList);
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        // 인스턴스 상태
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/states', 'GET', param);
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
                            ct.fnGetInstancesData(serverItem);
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
                        // var isReplaceServerInfo = false;

                        // 인스턴스 리스트 삭제된 항목 제거
                        if (ct.serverMainList.length > serverStates.length) {
                            var newServerMainList = new Array();
                            angular.forEach(ct.serverMainList, function (server) {
                                for (var i = 0; i < serverStates.length; i++) {
                                    if (server.id == serverStates[i].id) {
                                        newServerMainList.push(server);
                                        break;
                                    }
                                }
                            });
                            ct.serverMainList = newServerMainList;
                        }

                        var serverMainList = angular.copy(ct.serverMainList);
                        ct.fnGetInstancesData(serverStates);
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
                                }
                            } else {
                                if (!ct.serverMainList[inKey]) {
                                    ct.serverMainList.push(serverItem);
                                } else {
                                    var serverStateItem = common.objectsFindByField(ct.serverMainList, "id", instanceStateInfo.id);
                                    if (serverStateItem && serverStateItem.id && ct.noIngStates.indexOf(serverStateItem.uiTask) == -1) {
                                        // isReplaceServerInfo = true;
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
                        } else {
                            ct.fn.replaceServerInfo();
                        }
                        // fnGetUsedResource 사용안하므로 주석처리
                        // if (isReplaceServerInfo) {
                        //     ct.fnGetUsedResource();
                        // }
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        /*추가 S
        [20190621.HYG] 사용안하므로 주석처리
        ct.fnGetUsedResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params));
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
        };*/

        //추가 E
        // 인스턴스 삭제
        ct.deleteInstanceJob = function(id) {
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
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function () {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.selectedValues = {};
        ct.fnServerConfirm = function(action,instance,index,$event) {
            if (action == "START") {
                common.showConfirm('시작',instance.name +' 인스턴스를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "STOP") {
                common.showConfirm('정지',instance.name +' 인스턴스를 정지하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "PAUSE") {
                common.showConfirm('일시정지', instance.name +' 인스턴스를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "UNPAUSE") {
                common.showConfirm('정지해제', instance.name +' 인스턴스를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "REBOOT") {
                common.showConfirm('재시작',instance.name +' 인스턴스를 재시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if (action == "SHELVE") {
                common.showConfirm('비활성화', instance.name + ' 인스턴스를 비활성화 하시겠습니까?').then(function () {
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if (action == "UNSHELVE") {
                common.showConfirm('비활성화 해제',instance.name +' 인스턴스를 활성화 하시겠습니까?').then(function(){
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
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
        //20181120 sg0730  스냅샷 생성 PopUp 추가
        ct.fn.createPopSnapshot = function($event,instance) {
        	var dialogOptions = {};
        	if (instance.vmState != 'stopped') {
                common.showAlertWarning('인스턴스를 정지 후 생성가능합니다.');
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
        
        // sg0730 차후 인스턴스 이미지 생성 후 페이지 이동.
        ct.reflashSnapShotCallBackFunction = function () {
        	 $scope.main.goToPage('/iaas/compute');
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
             var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/vnc', 'GET', param);
             returnPromise.success(function (data, status, headers) {
                 window.open(data.content, '_blank');
             });
             returnPromise.error(function (data, status, headers) {
                 common.showAlertError(data.message);
                 $scope.main.loadingMainBody = false;
             });
        };

        //인스턴스 볼륨 생성 팝업
       /* ct.fn.createInstanceVolumePop = function(instance) {
            ct.selectInstance = instance;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeVolumeForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };*/
        
        //인스턴스 볼륨 생성 팝업
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

        // sg0730 인스턴스 볼륨 생성 팝업
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
            common.showConfirm('메세지',instance.name +' 인스턴스의 접속 IP를 해제하시겠습니까?').then(function(){
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
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
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
            } else if (instance.image.osType == 'centos') {
                if (instance.floatingIp) {
                    common.copyToClipboard(instance.floatingIp);
                    $scope.main.copyToClipboard(instance.floatingIp, '"' + instance.floatingIp + '"가 클립보드에 복사 되었습니다.');
                } else {
                    common.showAlertWarning("접속 IP가 존재하지 않습니다.");
                }
            }
        };

        // lb 전체 리스트 조회
        ct.fngetLbList = function() {
            var param = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancers', 'GET', param);
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
            ct.promiseList.push(returnPromise);
        };

        // 부하분산 관리 - 접속 IP 복사
        ct.fn.copyConnectLbInfoToClipboard = function (loadbalancer) {
            if (loadbalancer.floatingIp) {
                common.copyToClipboard(loadbalancer.floatingIp);
                $scope.main.copyToClipboard(loadbalancer.floatingIp, '"' + loadbalancer.floatingIp + '"가 클립보드에 복사 되었습니다.');
            } else {
                common.showAlertWarning("접속 IP가 존재하지 않습니다.");
            }
        };

        // lb 삭제
        ct.deleteLb = function(id) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                loadBalancerId : id
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'DELETE', param);
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
        };

        // 이름 & 설명 변경 팝업
        ct.fn.reNamePopLb = function($event, lbserviceList) {
            var dialogOptions =  {
                controller       : "iaasReNamePopLoadBalancerCtrl" ,
                formName         : 'iaasReNamePopLoadBalancerForm',
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.iaasLbInfo) {
                    var lbLists = data.content;
                    //ct.fn.setProcState(instanceStateInfo);
                    if (lbLists.iaasLbInfo.checkStatus.indexOf("ing") > -1) {
                        $scope.main.reloadTimmer['loadBalancerState_' + lbLists.iaasLbInfo.id] = $timeout(function () {
                            ct.fn.checkLbState(lbLists.iaasLbInfo.id);
                        }, 2000);
                    } else {
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
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        //lb port limit 확인
        ct.fn.checkLbPortLimit = function () {
            ct.lbPortCnt = 0;   //테넌트의 전체 lbPort 갯수
            //console.log("ct.lbServiceLists : ", ct.lbServiceLists);
            angular.forEach(ct.lbServiceLists, function (lbItem) {
                if (lbItem.iaasLbPorts && lbItem.iaasLbPorts.length > 0) {
                    ct.lbPortCnt += lbItem.iaasLbPorts.length;
                }
            });
            if (ct.lbPortCnt < CONSTANTS.lbaasPortLimit) {
                $scope.main.goToPage('/iaas/loadbalancer/create');
            } else {
                common.showAlertError("message", "부하분산의 포트는 최대 " + CONSTANTS.lbaasPortLimit + "개로 더 이상 생성 불가합니다.");
            }
        };

        /*[20190621.HYG] It's a func to bind Instance monitoring data
        Dev History
        테넌트 전체 인스턴스 모니터링 데이터 호출 API 는 사용안함
        - 인스턴스상태변경(정지->시작) 후 API 호출 할 때 인스턴스의 모니터링 데이터가 0 응답함
        - 인스턴스 시작 후 일정 시간 후에 정상데이터 호출 되는데 그 시점을 핸들링 할 수 없음.
        - 인스턴스 정보 세팅하는 경우 1개 인스턴스의 모니터링 데이터를 호출하는 방식으로 변경.
        fnGetInstancesData 메서드의 응답에 필요 데이터가 존재하므로 조회 된 데이터를 바인드하는 기능으로 변경. 2019.11.11
        ct.fnSetInstanceUseRate = function (instance) {
            if (instance.uiTask && instance.uiTask == 'active') {
                var rp = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/iaas/tenant/' + ct.data.tenantId + '/instance/' + instance.id + '/resourceUsage', 'GET');
                rp.success(function (d) {
                    instance.cpuUsage = d.cpuUsage;
                    instance.memoryUsage = d.memUsage;
                    instance.diskUsage = d.diskUsage;
                });
                rp.error(function (d) {
                    common.showAlertError(d.message);
                });
            } else {
                instance.cpuUsage = 0;
                instance.memoryUsage = 0;
                instance.diskUsage = 0;
            }
        };*/

        ct.fnSetInstanceUseRate = function (src, desc) {
            if (src.uiTask && src.uiTask == 'active') {
                src.cpuUsage = desc.cpuUsage;
                src.memoryUsage = desc.memoryUsage;
                src.diskUsage = desc.diskUsage;
            } else {
                src.cpuUsage = 0;
                src.memoryUsage = 0;
                src.diskUsage = 0;
            }
        };

        // 인스턴스 알람 상태 체크
        ct.fnSetInstanceState = function (server, instance) {
            server.alarmStatus = instance.alarmStatus;
            if (server.vmState == 'active' && (instance.alarmStatus == 'minor' || instance.alarmStatus == 'warning' || instance.alarmStatus == 'critical')) {
                server.alarmOccur = true;
            }
        };

        // 인스턴스 알람 상태 조회
        ct.fnGetInstancesData = function (server) {
            var params = {
                limit: 1000 
            };

            var rp = common.retrieveResource(common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/iaas/tenant/' + ct.data.tenantId + '/instances', 'GET', params));
            rp.success(function (data) {
                angular.forEach(data.metric, function (instance) {
                    if (angular.isArray(server)) {
                        angular.forEach(server, function (serverItem) {
                            if (serverItem.id == instance.instance_id) {
                                ct.fnSetInstanceState(serverItem, instance);
                                ct.fnSetInstanceUseRate(serverItem, instance);
                            }
                        });
                    } else if (server && instance.alarmStatus) {
                        ct.fnSetInstanceState(server, instance);
                        ct.fnSetInstanceUseRate(server, instance);
                    } else {
                        // var stop = $interval(function () {
                        //     console.log(ct.serverMainList)
                        //     if (ct.serverMainList) {
                        //         $interval.cancel(stop);
                                angular.forEach(ct.serverMainList, function (serverMain) {
                                    if (serverMain && serverMain.id == instance.instance_id) {
                                        ct.fnSetInstanceState(serverMain, instance);
                                        ct.fnSetInstanceUseRate(serverMain, instance);
                                    }
                                });
                        //     }
                        // }, 500);
                    }
                });
            });
        };

        //임시 알림 설정 2020.02.03
        ct.showTempAlert = function() {
            common.showDialogAlertHtml("알림", "플랫폼 정책 변경에 따라 신규 프로젝트와 가상머신 생성을 제한하고 있습니다.<br>자세한 문의는 관리자(042-865-6786, 042-865-5236)으로 문의하여 주시기 바랍니다.");
            return;
        };

        // 인스턴스 자원 사용량 조회
        var instancesDataLoop = $interval(function () {
            // /iaas/compute 페이지가 아닌 곳에서는 작동을 멈춤
            if ($location.url() != "/iaas/compute") {
                $interval.cancel(instancesDataLoop);
            }
            ct.fnGetInstancesData();
            /*
            angular.forEach(ct.serverMainList, function (server) {
                ct.fnSetInstanceUseRate(server);
            });
            */
        }, 1000 * 60);

        if (!$scope.main.sltPortalOrg.isUseIaas) {
            common.showDialogAlert('알림', '현재 프로젝트는 "서버 가상화"를 이용하지 않는 프로젝트입니다.');
            $scope.main.goToPage("/comm/projects/projectDetail/" + $scope.main.sltPortalOrg.id);
        }

        // 페이지 데이터 로드
        if (ct.data.tenantId) {
            ct.fnGetServerMainList();
            ct.fngetLbList();

            // 페이지 로딩바
            if (ct.promiseList && ct.promiseList.length > 0) {
                $scope.main.loadingMainBody = true;
                $q.all(ct.promiseList).finally(function() {
                    $scope.main.loadingMainBody = false;
                });
            }
        } else {
            /*
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해 주세요.');
                showAlert.then(function () {
                    $scope.main.goToPage("/");
                });
            */
        }
    })
    .controller('iaasComputeCreateCtrl', function ($scope, $location, $state, $sce, $translate, $stateParams, $timeout, $filter, $mdDialog, $q, user, common, ValidationService, CONSTANTS) {
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
        ct.serverNameList    = [];
        ct.promiseList       = [];
        ct.subnet            = {};
        ct.networks          = [];
        ct.volume            = {};
        ct.ipFlag            = true;
        ct.data.tenantId     = $scope.main.userTenant.id;
        ct.data.tenantName   = $scope.main.userTenant.korName;
        ct.maxSingleDiskSize = CONSTANTS.iaasDef.insMaxDiskSize;
        ct.formName          = "computeCreateForm";

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;

        ct.data.baseDomainName = ct.rdpBaseDomain;
        ct.data.subDomainName = "";

        ct.data.name = 'instance-01';

        // 인스턴스 이름 중복 검사
        ct.fn.serverNameCustomValidationCheck = function(name) {
            if (ct.serverNameList.indexOf(name) > -1) {
                return {isValid : false, message : "이미 사용중인 이름입니다."};
            } else {
                return {isValid : true};
            }
        };

        // 인스턴스 목록 DB 조회
        ct.fn.getInstanceList = function() {
            ct.isInstanceListLoad = false;
            var params = {
                tenantId : ct.data.tenantId,
                size : -1,
                page : 0
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content && data.content.instances && data.content.instances.length > 0) {
                    angular.forEach(data.content.instances, function (item) {
                        ct.serverNameList.push(item.name);
                    });
                }
            });
            returnPromise.error(function (data) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function () {
                ct.isInstanceListLoad = true;
            });
            ct.promiseList.push(returnPromise);
        };

        // 네트워크 셀렉트박스 조회
        /*ct.fn.networkListSearch = function() {
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
        };*/

        //보안정책 조회
        ct.fn.getSecurityPolicy = function() {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                ct.securityPolicyList = data.content;
                for (var i = 0; i < ct.securityPolicyList.length; i++) {
                    if (ct.securityPolicyList[i].name == "default") {
                        ct.roles.push(ct.securityPolicyList[i]);
                        ct.data.securityPolicys = ct.roles;
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError(data.message);
                }
                $scope.main.loadingMainBody = false;
            });
        };

        //키페어 조회
        ct.fn.getKeypairList = function(keypairName) {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.keypairList = data.content;
                if (ct.keypairList.length == 0) {
                    ct.createKeypair = {};
                    ct.createKeypair.tenantId = ct.data.tenantId;
                    ct.createKeypair.name = "default";
                    ct.createKeypair.description = "default keypair";

                    var param = {
                        keypair : ct.createKeypair
                    };
                    var returnData = common.noMsgSyncHttpResponseJson(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'POST', param);
                    if (returnData.status == 200) {
                        ct.fn.getKeypairList();
                    } else {
                        common.showAlertError(returnData.data.responseJSON.message);
                    }
                } else {
                    for (var i = 0; i < ct.keypairList.length; i++) {
                        if (ct.keypairList[i].name == "default") {
                            ct.data.keypair = ct.keypairList[i];
                        }
                    }
                    if (!ct.data.keypair) {
                        ct.data.keypair = ct.keypairList[0];
                    }
                    ct.fn.getSpecList();
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            ct.promiseList.push(returnPromise);
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
            ct.promiseList.push(returnPromise);
        };

        // min spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        ct.isMinSpecDisabled = false;
        // spec loading 체크
        ct.specMinDisabledSetting = false;
        ct.fn.setSpecMinDisabled = function () {
            ct.isMinSpecDisabled = false;
            if (ct.isSpecLoad && ct.data.image && ct.data.image.id) {
                angular.forEach(ct.specList, function (spec) {
                    if (spec.disk < ct.data.image.minDisk || spec.ram < (ct.data.image.minRam * 1024)) {
                        spec.disabled = true;
                        ct.isMinSpecDisabled = true;
                    }
                });
                ct.specMinDisabledSetting = true;
                if (ct.data.spec && ct.data.spec.uuid) {
                    if (ct.data.spec.disk < ct.data.image.minDisk || ct.data.spec.ram < (ct.data.image.minRam)) {
                        ct.fn.defaultSelectSpec();
                    }
                } else {
                    ct.fn.defaultSelectSpec();
                }
            }
        };

        // max spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        ct.isMaxSpecDisabled = false;
        // spec loading 체크
        ct.specMaxDisabledSetting = false;
        ct.fn.setSpecMaxDisabled = function () {
            ct.isMaxSpecDisabled = false;
            if (ct.isSpecLoad && ct.tenantResource && ct.tenantResource.maxResource &&  ct.tenantResource.usedResource) {
                angular.forEach(ct.specList, function (spec) {
                    if (spec.vcpus > ct.tenantResource.available.cores || spec.ram > ct.tenantResource.available.ramSize || spec.disk > ct.tenantResource.available.instanceDiskGigabytes) {
                        spec.disabled = true;
                        ct.isMaxSpecDisabled = true;
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
            if (ct.specMinDisabledSetting && ct.specMaxDisabledSetting) {
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
                } else {
                    ct.specUuid = "";
                    ct.data.spec = "";
                }
            }
        };

        //사양선택 이벤트 2018.11.13 sg0730 add
        ct.fn.selectSpec = function(sltSpec) {
            if (!ct.specDisabledAllSetting || sltSpec.disabled) return;
            if (sltSpec && sltSpec.uuid) {
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
            var param = {
                tenantId : ct.data.tenantId
            };
            if (ct.conditionKey == 'imageServiceName') {
                param.imageServiceName = ct.conditionValue;
            }
            if (ct.conditionKey == 'imageUseCase') {
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
                    // 라이센스 없을시 다음 이미지 기본설정
                    for (var i=0; i <ct.imageList.length; i++) {
                        if (!ct.fn.imageLicenseCheck(ct.imageList[i])) {
                            ct.fn.imageChange(ct.imageList[i].id);
                            break;
                        }
                    }
                }
                ct.imageListLoad = true;
            });
            returnPromise.error(function (data, status, headers) {
                ct.imageListLoad = true;
                common.showAlertError(data.message);
            });
            ct.promiseList.push(returnPromise);
        };
        
        ct.fn.imageChange = function (imageId) {
            ct.data.image = common.objectsFindCopyByField(ct.imageList, "id", imageId);
            if (ct.data.image && ct.data.image.id) {
                ct.sltImageId = ct.data.image.id;
            } else {
                ct.sltImageId = "";
            }
            ct.fn.setSpecAllEnabled();
            ct.fn.setSpecMinDisabled();
            ct.fn.setSpecMaxDisabled();
        };

        ct.fn.imageLicenseCheck = function(image) {
            var osType = image.osType.toUpperCase();
            if (!ct.tenantResource || !ct.tenantResource.available)
                return false;
            if (osType == "REDHAT")
                return ct.tenantResource.available.licenseRedhat <= 0 ? true : false;
            else if (osType == "WINDOWS")
                return ct.tenantResource.available.licenseWindows <= 0 ? true : false;
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
                if (ct.networks.length > 0) {
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
            ct.promiseList.push(returnPromise);
        };

        //네트워크 setting
        ct.fn.networksChange = function() {
            if (ct.network && ct.network.subnets) {
                ct.subnet.cidr_A = ct.network.subnets[0].cidr_A;
                ct.subnet.cidr_B = ct.network.subnets[0].cidr_B;
                ct.subnet.cidr_C = ct.network.subnets[0].cidr_C;
                ct.data.networks = [{
                    id : ct.network.id
                }];
            }
        };
        
        // 볼륨 생성 부분 추가 2018.11.13 sg0730
        // 인스턴스 만들기 - 사양선택 관련 속도개선 api로 변경
        ct.fn.getTenantResource = function()  {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/usedLookup', 'GET', params));
            returnPromise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.tenantResource = data.content;
                    ct.tenantResource.available = {};
                    ct.tenantResource.available.cores = ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores;
                    ct.tenantResource.available.ramSize = ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize;
                    ct.tenantResource.available.instanceDiskGigabytes = ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes;
                    ct.tenantResource.available.volumeGigabytes = ct.tenantResource.maxResource.volumeGigabytes - ct.tenantResource.usedResource.volumeGigabytes;
                    ct.tenantResource.available.licenseWindows = ct.tenantResource.maxResource.licenseWindows - ct.tenantResource.usedResource.licenseWindows;
                    ct.volumeSliderOptions.ceil = ct.tenantResource.available.volumeGigabytes;
                    if (ct.volumeSliderOptions.ceil > ct.maxSingleDiskSize) {
                        ct.volumeSliderOptions.ceil = ct.maxSingleDiskSize;
                    }
                    ct.fn.setSpecMaxDisabled();
                }
            });
            returnPromise.error(function (data) {
                common.showAlertError("message" ,data.message);
            });
            ct.promiseList.push(returnPromise);
        };
        
        //ip체크
        ct.fn.checkCidr = function() {
            if (!ct.subnet.cidr_A || !ct.subnet.cidr_B || !ct.subnet.cidr_C || !ct.subnet.cidr_D) {
                common.showAlertWarning("ip를 입력해주세요.");
                return;
            }

            var regExp = /^\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b/i;
            if (!regExp.test(ct.subnet.cidr_D)) {
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
                if (!data.content.ipinfos[0].used) {
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
            if (ct.networkBindCheck) {
                ct.subnet.cidr_D = "";
                ct.ipFlag = false;
            }
        };
        
        ct.fn.subnetCidrDChange = function() {
            if (ct.subnet.cidr_D) {
                ct.ipFlag = false;
            } else {
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
                if ((ct.rdpBaseDomain != domainName) && ct.usingDomainNames.indexOf(domainName) >= 0) {
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

        //볼륨 생성 변수
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

        //인스턴스 생성
        var clickCheck = false;
        ct.fn.createServer = function()  {
            if(clickCheck) return;
            clickCheck = true;
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                clickCheck = false;
                return;
            }
            var params = {};
            params.instance = {};
            params.instance.name = ct.data.name;
            params.instance.tenantId = ct.data.tenantId;
            params.instance.networks = [{ id: (ct.data.networks && angular.isArray(ct.data.networks) && ct.data.networks[0] && ct.data.networks[0].id)?ct.data.networks[0].id:0 }];
            params.instance.image = {id: ct.data.image.id};
            params.instance.keypair = { keypairName: ct.data.keypair.keypairName };
            params.instance.securityPolicies = angular.copy(ct.data.securityPolicys);
            params.instance.spec = ct.data.spec;

            //windows RDP 관련 수정. domain 저장하지 않음. 2019.07.16
            /*if (ct.data.image.osType == 'windows') {
                if (ct.data.baseDomainName && ct.data.subDomainName) {
                    params.instance.rdpDomain = ct.data.subDomainName + "." + ct.data.baseDomainName;
                }
            }*/

            if (ct.volumeSize > 0) {
                params.volume = {};
                params.volume.name = ct.data.name+'_volume01';
                params.volume.type = 'HDD';
                params.volume.size = ct.volumeSize;
                params.volume.tenantId = ct.data.tenantId;
            }

            if (!ct.data.spec || !ct.data.spec.uuid) {
                common.showAlertError("사양이 선택되지 않았습니다.");
                clickCheck = false;
                return;
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', params);
            returnPromise.success(function (data, status, headers)  {
                $timeout(function () {
                    clickCheck = false;
                    $scope.main.loadingMainBody = false;
                    common.showAlertSuccess(ct.data.name+" 인스턴스 생성이 시작 되었습니다.");
                    // 페이지 이동으로 바꿔야 하고
                    $scope.main.goToPage("/iaas/compute");
                }, 5000);
            });
            returnPromise.error(function (data, status, headers) {
                clickCheck = false;
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        if (ct.data.tenantId) {
            ct.fn.getInstanceList();
            ct.fn.getTenantResource();
            //ct.fn.getDomainUsingList();     //windows rdp 포트포워딩으로 도메인 사용하지 않음
            ct.fn.getSpecList();
            ct.fn.imageListSearch();
            ct.fn.getSecurityPolicy();
            ct.fn.networkListSearch();
            ct.fn.getKeypairList();

            // 함수 로딩 체크
            if (ct.promiseList && ct.promiseList.length > 0) {
                $scope.main.loadingMainBody = true;
                $q.all(ct.promiseList).finally(function() {
                    $scope.main.loadingMainBody = false;
                });
            }
        }

    })
    .controller('iaasComputeCopyCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCopyCtrl start", 1);

        var ct               = this;
        ct.projectId         = $scope.main.sltProjectId;
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

        // orgCode 내의 다른 테넌트 스냅샷 조회
        ct.fn.getInstanceSnapshotList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList/others', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && angular.isArray(data.content)) {
                    // 스냅샷 리스트중 참여중인 프로젝트만 필터링
                    ct.instanceSnapshotList = data.content.filter(function (item) {
                        var userTenant = common.objectsFindCopyByField(ct.userTenants, "id", item.tenantId);
                        if (userTenant && userTenant.korName) {
                            item.portalOrgName = userTenant.korName;
                            return item;
                        }
                    });
                    ct.pageOptions.total = ct.instanceSnapshotList.length;
                }
            });
            returnPromise.error(function (data) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function () {
                $scope.main.loadingMainBody = false;
            });
        };

        // 테넌트 리스트 조회
        ct.fn.getUserTenants = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                orgCode : ct.projectId
            };
            ct.userTenants = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/org', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0 && data.content[0].teams && data.content[0].teams.length > 0) {
                    // 테넌트 리스트중 참여중인 프로젝트만 필터링
                    angular.forEach(ct.portalOrgs, function (item) {
                        var tenant = common.objectsFindCopyByField(data.content[0].teams, "teamCode", item.orgId);
                        if (tenant)
                            ct.userTenants.push(tenant);
                    });
                }
                ct.fn.getInstanceSnapshotList();
            });
            returnPromise.error(function (data) {
                common.showAlertError(data.message);
            });
        };

        // select 변경
        ct.fn.onChangeSchPortalOrg = function(schPortalOrgId) {
            var userTenant = null;
            if (schPortalOrgId) {
                userTenant = common.objectsFindCopyByField(ct.userTenants, "teamCode", schPortalOrgId);
            }
            if (schPortalOrgId == "") {
                ct.schFilterTenantId = "";
            } else if (userTenant && userTenant.id) {
                ct.schFilterTenantId = userTenant.id;
            } else {
                ct.schFilterTenantId = null;
            }
        };

        ct.fn.getUserTenants();
    })
    .controller('iaasComputeAlarmCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, user, common, computeDetailService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeAlarmCtrl start", 1);
        
        var ct = this;
        ct.sltInfoTab = 'alarmList';
        ct.fn = {};
        ct.alarmId = $location.search().alarmId;
        ct.serverId = $location.search().serverId;
        ct.changeSltInfoTab = function (sltInfoTab, alarmId) {
            if ($location.search().alarmId) delete $location.search().alarmId;
            ct.sltInfoTab = sltInfoTab;
            if (!sltInfoTab) {
                sltInfoTab = 'alarmList';
            } else {
                if (sltInfoTab == 'alarmList') {
                    ct.selectAlarmList();
                } else if (sltInfoTab == 'alarmDetail') { 
                    ct.alarmId = alarmId;
                    ct.fn.selectAlarmDetail();
                } else if (sltInfoTab == 'alarmConf') {
                    ct.fn.requestData();
                }
            }
        };

        $scope.$on('alarmListOnClick', function (event, datas) {
            ct.serverId = undefined;
            ct.changeSltInfoTab('alarmDetail', datas.alarmId);
            common.locationHref(datas.path + '?alarmId=' + datas.alarmId);
        });

        $scope.$on('alarmMoreOnClick', function (event, datas) {
            ct.serverId = undefined;
            ct.changeSltInfoTab('alarmList');
            common.locationHref(datas);
        });

        //-- 알람목록 탭 시작
        // 검색조건 콤보박스 세팅
        ct.options = {};
        ct.options.alarmType = common.getAlarmType();
        ct.options.alarmLevel = common.getAlarmLevel();
        ct.options.resolveStatus = common.getResolveStatusCmb();
        ct.options.alarmType.unshift({value: '', name: '알람타입'});
        ct.options.alarmLevel.unshift({value: '', name: '알람레벨'});
        ct.options.resolveStatus.unshift({value: '', name: '조치상태'});

        // 검색조건 폼 데이터
        ct.sch_condition = {};
        ct.sch_condition.alarmType = ct.options.alarmType[0].value;
        ct.sch_condition.alarmLevel = ct.options.alarmLevel[0].value;
        ct.sch_condition.resolveStatus = ct.options.resolveStatus[2].value;
        ct.timeRanges = [];
        ct.selTimeRange = {};

        //기간검색
        ct.timeRanges = [
            {id: '1day', value: '1', name: 'label.day'},
            {id: '3day', value: '3', name: 'label.days'},
            {id: '7day', value: '7', name: 'label.days'},
            {id: '1month', value: '1', name: 'label.month'},
            {id: '6month', value: '6', name: 'label.months'}
        ];
        ct.selTimeRange = common.objectsFindByField(ct.timeRanges, "id", "1month");

        //기간검색 변경
        ct.changeTimeRange = function (timeRangeId) {
            var num = 0;
            var gbn = '';
            switch (timeRangeId) {
                case "1day":
                    num = 1;
                    gbn = 'day';
                    break;
                case "3day":
                    num = 3;
                    gbn = 'day';
                    break;
                case "7day":
                    num = 7;
                    gbn = 'day';
                    break;
                case "1month":
                    num = 1;
                    gbn = 'month';
                    break;
                case "6month":
                    num = 6;
                    gbn = 'month';
                    break;
                default:
                    num = 1;
                    gbn = 'day';
                    break;
            }
            ct.sch_condition.dateFrom = moment().subtract(num, gbn).format('YYYY-MM-DD');
            ct.sch_condition.dateTo = moment().format('YYYY-MM-DD');
        };

        // 검색결과 데이터 Repository
        ct.alarmData = [];
        
        // 페이징 옵션
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        // 검색
        ct.selectAlarmList = function (page) {
            if (page) ct.pageOptions.currentPage = page;
            else page = ct.pageOptions.currentPage;

            ct.sch_condition.searchDateFrom = moment(ct.sch_condition.dateFrom + ' 00:00:00').unix();
            ct.sch_condition.searchDateTo = moment(ct.sch_condition.dateTo + ' 23:59:59').unix();
            ct.sch_condition.pageItems = ct.pageOptions.pageSize;
            ct.sch_condition.pageIndex = page;
            ct.sch_condition.baremetalYn = 'N';
            ct.sch_condition.projectId = $scope.main.userTenantId;

            // 테넌트 알람, 인스턴스 알람을 구분
            if (ct.serverId) ct.sch_condition.instanceId = ct.serverId;
            else ct.sch_condition.instanceId = undefined
            
            $scope.main.loadingMainBody = true;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/alarm/list', 'GET', ct.sch_condition);
            serverStatsPromise.success(function (data, status, headers) {
                ct.alarmData = data.data;

                if (data.totalCount > 10000) {
                    ct.pageOptions.total = 10000;
                } else {
                    ct.pageOptions.total = data.totalCount;
                }
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        ct.setIndent = function (ip) {
            return ip.replace(',', '<br>');
        };
        
        common.getServiceType(false, function (nodeList) {
            ct.options.serviceType = nodeList;
            ct.options.serviceType.unshift({value: '', name: '서비스타입'});
            ct.sch_condition.policyType = ct.options.serviceType[0].value;
            ct.changeTimeRange('1month');
            ct.selectAlarmList();
        });
        //-- 알람목록 탭 종료

        //-- 알람목록 상세 시작
        ct.actionForm = {};
        ct.data = {};

        // 알람 상세정보 조회
        ct.fn.selectAlarmDetail = function () {
            
            $scope.main.loadingMainBody = true;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/alarm/detail/' + ct.alarmId, 'GET');
            serverStatsPromise.success(function (data, status, headers) {
                ct.data = data;
                ct.fn.initAction();
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 알람 조치 이력 수정
        ct.fn.updateActionForm = function (action_id, desc) {
            ct.actionForm.id = action_id;
            ct.actionForm.alarmActionDesc = desc;
        };
        
        // 알람 조치 이력 삭제
        ct.fn.deleteAction = function (action_id) {
            
            common.showConfirm($translate.instant('label.del'), $translate.instant('message.mq_delete_bulletin')).then(function() {

                $scope.main.loadingMainBody = true;
                var serverStatsPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/alarm/action/' + action_id, 'DELETE');
                serverStatsPromise.success(function (data, status, headers) {
                    common.showAlert('message', '삭제되었습니다');
                    ct.fn.selectAlarmDetail();
                });
                serverStatsPromise.error(function (data, status, headers) {
                    common.showAlert(data);
                });
                serverStatsPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };
        
        // 알람 조치 이력 저장
        ct.fn.saveAction = function () {
            var method = "";
            if (ct.actionForm.id) {
                method = "PUT";
                ct.actionForm.modiUser = common.getUser().email.split('@')[0];
            } else {
                method = "POST";
                ct.actionForm.regUser = common.getUser().email.split('@')[0];
            }
            
            $scope.main.loadingMainBody = true;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/alarm/action', method, ct.actionForm);
            serverStatsPromise.success(function (data, status, headers) {
                common.showAlert('message', '저장이 완료되었습니다.');
                ct.fn.selectAlarmDetail();
            });
            serverStatsPromise.error(function (data, status, headers) {
                common.showAlert(data);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 조치 완료
        ct.fn.completeAction = function () {
            
            var params = {
                id: ct.data.id,
                resolveStatus: '2',
                modiUser: common.getUser().email.split('@')[0]
            };

            
            $scope.main.loadingMainBody = true;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/alarm', "PUT", params);
            serverStatsPromise.success(function (data, status, headers) {
                common.showAlert('message', '조치완료 처리되었습니다.');
                ct.changeSltInfoTab('alarmList');
                $scope.main.selectAlarmList();
                $scope.main.selectAlarmCount();
            });
            serverStatsPromise.error(function (data, status, headers) {
                common.showAlert(data);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 알람 수정 폼 초기화
        ct.fn.initAction = function () {
            ct.actionForm = {};
            ct.actionForm.alarmId = ct.data.id;
        };
        //-- 알람목록 탭 종료
        
        //-- 알람설정 탭 시작
        $scope.actionBtnHied = true;
        ct.condition = {};
        ct.condition.keyword = {};
        ct.selServiceType = '';
        ct.policys = {};
        
        ct.cpuwarnSlider = {
            value : 1,
            options: {
                floor: 1,
                ceil: 100,
                step: 1,
                minLimit: 1,
                showSelectionBar: true,
                onChange: function () {
                    ct.fn.parseTimer();
                }
            }
        };
        ct.cpuemerSlider = {};
        ct.cpuminorSlider = {};
        
        ct.memorywarnSlider = {};
        ct.memoryemerSlider = {};
        ct.memoryminorSlider = {};
        
        ct.diskwarnSlider = {};
        ct.diskemerSlider = {};
        ct.diskminorSlider = {};
        
        ct.measuretimeSlider = {};

        angular.copy(ct.cpuwarnSlider, ct.cpuminorSlider);
        angular.copy(ct.cpuwarnSlider, ct.cpuemerSlider);
        angular.copy(ct.cpuwarnSlider, ct.memoryminorSlider);
        angular.copy(ct.cpuwarnSlider, ct.memorywarnSlider);
        angular.copy(ct.cpuwarnSlider, ct.memoryemerSlider);
        angular.copy(ct.cpuwarnSlider, ct.diskminorSlider);
        angular.copy(ct.cpuwarnSlider, ct.diskwarnSlider);
        angular.copy(ct.cpuwarnSlider, ct.diskemerSlider);
        angular.copy(ct.cpuwarnSlider, ct.measuretimeSlider);

        ct.measuretimeSlider.options.ceil = 60 * 60 * 3;
        ct.measuretimeSlider.options.minLimit = 60 * 3;
        ct.measuretimeSlider.options.floor = 60 * 3;

        // 초기 알람정보 조회
        ct.fn.requestData = function () {
            $scope.main.getAlarmPolicy (ct.selServiceType, function () {
                angular.copy($scope.main.alarmPolicys[ct.selServiceType], ct.policys);
                ct.measuretimeSlider.value = ct.policys.measureTime;
    
                // 측정시간 초기화
                ct.fn.parseTimer();
    
                angular.forEach(ct.policys.detail, function (el, k) {
                    ct[el.alarmType+'minorSlider'].value = el.minorThreshold;
                    ct[el.alarmType+'warnSlider'].value = el.warningThreshold;
                    ct[el.alarmType+'emerSlider'].value = el.criticalThreshold;
                });
    
                ct.data.alarmEmail = ct.policys.mailAddress.split('@')[0];
                ct.data.alarmEmailHost = ct.policys.mailAddress.split('@')[1];
            }, $scope.main.userTenantId);
        };

        ct.fn.minimumCheck = function () {
            // 측정시간 최소값 지정
            if (ct.measuretimeSlider.value < 180) {
                ct.measuretimeSlider.value = 180;
                ct.fn.parseTimer();
            };
        };

        ct.fn.parseTimer = function () {
            var second = ct.measuretimeSlider.value;
            var minute = Math.floor(second / 60);
            var hours = Math.floor(minute / 60);
            var result = (second % 60) + '초';

            if (minute > 0) {
                if (hours > 0) {
                    result = hours + '시간 ' + (minute % 60) + '분 ' + result;
                } else {
                    result = minute + '분 ' + result;
                }
            }
            
            ct.measureTime = result;
        };

        // 숫자만 입력
        ct.fn.numberCheck = function () {
            if (!computeDetailService.isNumber(event)) {
                event.preventDefault();
            }
        };

        // 숫자 입력 범위 필터
        ct.fn.percentCheck = function (modelName) {
            var val = ct[modelName+'Slider'].value;
            if (!computeDetailService.isNumber(event)) {
                val = 0;
                event.preventDefault();
            }
            if (val < 0) {
                val = 0;
                event.preventDefault();
            } else if (val > 100) {
                val = 100;
                event.preventDefault();
            } else {
                val = parseInt(val);
            }
            ct[modelName+'Slider'].value = val;
        };

        // 설정값 저장
        ct.fn.saveAlarm = function () {

            var cpumVal = ct.cpuminorSlider.value;
            var cpuwVal = ct.cpuwarnSlider.value;
            var cpueVal = ct.cpuemerSlider.value;
            var memmVal = ct.memoryminorSlider.value;
            var memwVal = ct.memorywarnSlider.value;
            var memeVal = ct.memoryemerSlider.value;
            var dskmVal = ct.diskminorSlider.value;
            var dskwVal = ct.diskwarnSlider.value;
            var dskeVal = ct.diskemerSlider.value;

            if (cpumVal > cpuwVal || cpumVal > cpueVal) {
                angular.element('#minor-cpu').focus();
                common.showAlert("error", $translate.instant("iaas.message.mi_alarm_policy_cpu_over_we"));
                return;
            }
            if (cpuwVal > cpueVal) {
                angular.element('#warn-cpu').focus();
                common.showAlert("error", $translate.instant("iaas.message.mi_alarm_policy_cpu_over_w"));
                return;
            }
            if (memmVal > memwVal || memmVal > memeVal) {
                angular.element('#minor-memory').focus();
                common.showAlert("error", $translate.instant("iaas.message.mi_alarm_policy_memory_over_we"));
                return;
            }
            if (memwVal > memeVal) {
                angular.element('#warn-memory').focus();
                common.showAlert("error", $translate.instant("iaas.message.mi_alarm_policy_memory_over_w"));
                return;
            }
            if (dskmVal > dskwVal || dskmVal > dskeVal) {
                angular.element('#minor-disk').focus();
                common.showAlert("error", $translate.instant("iaas.message.mi_alarm_policy_disk_over_we"));
                return;
            }
            if (dskwVal > dskeVal) {
                angular.element('#warn-disk').focus();
                common.showAlert("error", $translate.instant("iaas.message.mi_alarm_policy_disk_over_w"));
                return;
            }

            var detail = [];
            ct.policys.mailAddress = ct.data.alarmEmail + '@' + ct.data.alarmEmailHost;
            angular.forEach(ct.policys.detail, function (el, k) {
                var alarmType = el.alarmType == 'mem' ? 'memory' : el.alarmType;
                detail.push({
                    alarmType: alarmType,
                    minorThreshold: ct[alarmType+'minorSlider'].value,
                    warningThreshold: ct[alarmType+'warnSlider'].value,
                    criticalThreshold: ct[alarmType+'emerSlider'].value
                });
                el.minorThreshold = ct[alarmType+'minorSlider'].value;
                el.warningThreshold = ct[alarmType+'warnSlider'].value;
                el.criticalThreshold = ct[alarmType+'emerSlider'].value;
            });
            
            $scope.main.loadingMainBody = true;
            var params = {
                "id": ct.policys.id,
                "policyType": ct.selServiceType,
                "projectId": $scope.main.userTenantId,
                "measureTime": ct.measuretimeSlider.value,
                "mailAddress": ct.policys.mailAddress,
                "mailReceiveYn": ct.policys.mailReceiveYn,
                "comment": ct.policys.comment,
                "detail": detail
            };

            var methodName = ct.selServiceType != ct.policys.policyType ? 'POST' : 'PUT';
            var returnPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/alarm/policy', methodName, params);
            returnPromise.success(function (data, status, headers) {
                common.showAlert("message", $translate.instant('message.mi_change'));
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data);
            });
            returnPromise.finally(function() {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.$on('userTenantChanged',function(event,status) {
            $scope.main.replacePage();
        });
        
        // 설정값 최초 로드
        ct.alarmReceives = [
            {'value': 'Y', 'name': 'iaas.label.receive'}, 
            {'value': 'N', 'name': 'iaas.label.noreceive'}
        ];
        ct.alarmFormName = 'saveform';
        ct.data.alarmReceive = ct.alarmReceives[0].value;
        ct.selServiceType = CONSTANTS.nodeKey.TENANT;
        ct.fn.requestData();
        //-- 알람설정 탭 종료
        
        if (ct.alarmId) ct.changeSltInfoTab('alarmDetail', ct.alarmId);
    })
    .directive('krInput', ['$parse', function($parse) { // 알람 메세지 입력 시 한글 실시간 바인드 안되는 현상에 대한 조치
        return {
            priority : 2,
            restrict : 'A',
            compile : function(element) {
                element.on('compositionstart', function(e) {
                    e.stopImmediatePropagation();
                });
            }
        };
    }])
;
