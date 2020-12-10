'use strict';

angular.module('gpu.controllers')
    .controller('gpuComputeDetailCtrl', function ($scope, $location, $state, $sce,$q, $stateParams, $timeout, $interval, $window, $mdDialog, $filter, $bytes, $translate, $log, $exceptionHandler, common, cookies, ValidationService, CONSTANTS, computeDetailService, tenantChartConfig, tenantNetChartConfig) {
        _DebugConsoleLog("computeDetailControllers.js : gpuComputeDetailCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        $scope.actionBtnHied = true;
        var ct = this;
        ct.fn = {};
        ct.ui = {};
        ct.data = {};
        ct.instance = {};
        ct.subnet = {};
        ct.ipFlag = true;
        ct.addNetwork = {};
        ct.roles = [];
        ct.serverMainList = [];
        ct.volumeRoles = [];
        ct.consoleLogLimit = 50;
        ct.actionLogLimit = 5;
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantGpu.id;
        ct.data.tenantName = $scope.main.userTenantGpu.tenantName;

        ct.data.instanceId = $stateParams.instanceId;
        ct.viewType = 'instance';
        if ($scope.main.stateKey == "gpuDeployServerComputeDetail") {
            ct.viewType = 'deploy';
        }
        // ct.sltInfoTab = 'domain';
        ct.sltInfoTab = 'actEvent';
        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;

        ct.noIngStates = ['active', 'stopped', 'error', 'paused', 'shelved_offloaded', 'error_ip', 'error_volume'];
        ct.creatingStates = ['creating', 'networking', 'block_device_mapping'];

        ct.computeEditFormOpen = function ($event, instance){
            var dialogOptions =  {
                controller       : "gpuComputeEditFormCtrl" ,
                formName         : 'computeEditForm',
                instance         : angular.copy(instance)
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        //20181120 sg0730  서버사양변경 PopUp 추가
        ct.computePopEditServerForm = function ($event) {
        	 var dialogOptions = {
                     controller : "gpuComputePopEditServerCtrl" ,
                     formName   : 'gpuComputePopEditServerForm',
                     instance : angular.copy(ct.instance),
                     dialogClassName: "modal-lg",
                     callBackFunction : ct.reflashCallBackFunction
                 };
                 $scope.actionBtnHied = false;
                 common.showDialog($scope, $event, dialogOptions);
                 $scope.actionLoading = true; // action loading
        };

        /*ct.fnGetServerMainList = function() {
            $scope.main.loadingMainBody = true;

            var param = {
                tenantId : ct.data.tenantId,
                queryType : 'list'
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.loadingServerList = false;
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
                /!*if (ct.pageFirstLoad && (!ct.serverMainList || ct.serverMainList.length == 0)) {
                    ct.firstInstanceCreatePop();
                }*!/
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
            });
        };*/

        ct.fn.setProcState = function (instance) {
            if (ct.noIngStates.indexOf(instance.uiTask) >= 0 && !instance.taskState) {
                instance.procState = "end";
            } else if (ct.creatingStates.indexOf(instance.uiTask) >= 0) {
                instance.procState = "creating";
            } else {
                instance.procState = "ing";
            }
        };

        // 서버 상태
        ct.fn.checkServerState = function(instanceId) {
            var param = {
                tenantId : ct.data.tenantId
            };
            param.instanceId = instanceId;
            if ($scope.main.reloadTimmer['instanceServerState_' + instanceId]) {
                $timeout.cancel($scope.main.reloadTimmer['instanceServerState_' + instanceId]);
                $scope.main.reloadTimmer['instanceServerState_' + instanceId] = null;
            }
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/states', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/states', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    var instanceStateInfo = data.content.instances[0];
                    ct.fn.setProcState(instanceStateInfo);
                    if (instanceStateInfo.procState != 'end') {
                        angular.forEach(instanceStateInfo, function (value, key) {
                            ct.instance[key] = value;
                        });
                        $scope.main.reloadTimmer['instanceServerState_' + instanceStateInfo.id] = $timeout(function () {
                            ct.fn.checkServerState(instanceStateInfo.id);
                        }, 1000);
                    } else {
                        ct.fn.replaceServerInfo(instanceStateInfo.id);
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
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
            param.instanceId = instanceId;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status == 200 && data && data.content && data.content.instances && data.content.instances.length > 0) {
                    var instance = data.content.instances[0];
                    var beforUiTask = instance.uiTask;
                    ct.fn.mergeServerInfo(ct.instance, instance);
                    ct.fn.setProcState(ct.instance);
                    ct.fn.setRdpConnectDomain(ct.instance);
                    ct.instance.tenantId = ct.data.tenantId;
                    ct.instance.changeName = ct.instance.name;
                    var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", ct.instance.vmType);
                    if (angular.isObject(vmDeployType) && vmDeployType.id) {
                        ct.instance.vmDeployType = vmDeployType;
                    } else {
                        ct.instance.vmDeployType = angular.copy(ct.deployTypes[0]);
                    }
                    if (ct.instance.console) {
                        ct.instance.consoleArr = ct.instance.console.split("\n");
                    } else {
                        ct.instance.consoleArr = [];
                    }
                    for (var i=0; i<ct.instance.consoleArr.length; i++) {
                        ct.instance.consoleArr[i] = common.replaceAll(ct.instance.consoleArr[i], "(\\[[0-9;]{1,}m(.){1,})\\[0m", "\x1B$1\x1B[0m");
                    }
                    $timeout(function () {
                        $('#action_event_panel.scroll-pane').jScrollPane({});
                    }, 100);

                    var massage = '"' + instance.name + '" ';
                    if (beforUiTask == "starting") {
                        massage += '인스턴스가 시작 되었습니다.'
                    } else if (beforUiTask == "stopping")  {
                        massage += '인스턴스가 정지 되었습니다.'
                    } else if (beforUiTask == "pausing")  {
                        massage += '인스턴스가 일시정지 되었습니다.'
                    } else if (beforUiTask == "unpausing")  {
                        massage += '인스턴스가 정지해제 되었습니다.'
                    } else if (beforUiTask == "rebooting")  {
                        massage += '인스턴스가 재시작 되었습니다.'
                    } else if (beforUiTask == "resized")  {
                        massage += '인스턴스의 사양이 되었습니다.'
                    } else {
                        massage += '인스턴스에 적용 되었습니다.'
                    }
                    common.showAlertSuccess(massage);
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        //sg0730 차후 서버 이미지 생성 후 페이지 이동.
        ct.reflashCallBackFunction = function (instance) {
            ct.instance.vmState = instance.vmState;
            ct.instance.uiTask = instance.uiTask;
            ct.fn.setProcState(ct.instance);
            $timeout(function () {
                //ct.fn.checkServerState(instance.id);
                ct.fn.checkServerState();
            }, 10000);
        };

        // SnapShot 생성
        //20181120 sg0730  백업 이미지 생성 PopUp 추가
        ct.fn.createPopSnapshot = function($event,instance) {
        	var dialogOptions = {};
        	if(instance.vmState != 'stopped') {
                common.showAlertWarning('인스턴스를 정지 후 생성가능합니다.');
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
        
        //sg0730 차후 서버 이미지 생성 후 페이지 이동.
        ct.reflashSnapShotCallBackFunction = function () {
        	 // $scope.main.goToPage('/iaas/snapshot');
            $scope.main.goToPage('/gpu/snapshot');
        };
        
        ct.cpuRoundProgress = {
            label : "{percentage}%",
            percentage : 0
        };

        ct.ramRoundProgress = {
            label : "{percentage}%",
            percentage : 0
        };

        ct.doughnut = {};
        ct.doughnut.labels = ['미사용', '사용률'];

        ct.doughnut.colors = {};
        ct.doughnut.colors.cpu = ["rgba(199,143,220,.5)", "rgba(183,93,218,1)"];
        ct.doughnut.colors.ram = ["rgba(145,191,206,.5)", "rgba(1,160,206,1)"];
        ct.doughnut.colors.disk = ["rgba(143,171,234,.5)", "rgba(22,87,218,1)"];

        ct.doughnut.data = {};
        ct.doughnut.data.cpu = [1, 0];
        ct.doughnut.data.ram = [1, 0];
        ct.doughnut.data.disk = [1, 0];

        ct.zoomPanel = function(evt, type){
            var panel = $(evt.currentTarget).closest(".panel");
            var isZoom = false;
            if(panel.hasClass("zoom")) {
                panel.removeClass("zoom").resize();
                if (type != 'virtualMonit' && type != 'systemLog') panel.find('.panel_body').css("height", "400px");
                $timeout(function () {
                    $(window).scrollTop(document.scrollingElement.scrollHeight);
                }, 100);
            } else {
                isZoom = true;
                panel.addClass("zoom").resize();
                if (type != 'virtualMonit' && type != 'systemLog') panel.find('.panel_body').css("height", "90%");
                $timeout(function () {
                    $(window).scrollTop(0);
                }, 100);
            }
            if(type == 'insMonit') {
                if (isZoom) {
                    panel.find('.visualizeItem').css("width", "750px");
                } else {
                    panel.find('.visualizeItem').css("width", "465px");
                }
                $timeout(function () {
                    panel.find('.scroll-pane').jScrollPane({contentWidth: '0px'});
                }, 100);
            } else if (type == 'virtualMonit') {
                if (isZoom) {
                    panel.css("height", "100%");
                    panel.find('#chart').css("height", "auto");
                } else {
                    panel.css("height", "670px");
                    panel.find('#chart').css("height", "425px");
                }
            } else if (type == 'alarmEvent') {
                if (isZoom) {
                    panel.find('.tbl.type1').css("overflow-y", "hidden");
                    panel.find('.tbl.type1').css("height", "auto");
                } else {
                    panel.find('.tbl.type1').css("overflow-y", "auto");
                    panel.find('.tbl.type1').css("height", "235px");
                }
            } else if (type == 'systemLog') {
                if (isZoom) {
                    panel.find('.tbl.type1').css("overflow-y", "hidden");
                    panel.css("height", "auto");
                    panel.find('.tbl.type1').css("height", "auto");
                } else {
                    panel.find('.tbl.type1').css("overflow-y", "auto");
                    panel.css("height", "670px");
                    panel.find('.tbl.type1').css("height", "425px");
                }
            } else {
                panel.find('.scroll-pane').jScrollPane({contentWidth: '0px'});
                if(type == 'bootLog') {
                    if (isZoom) {
                        ct.fn.systemTerminalResize(180, 40);
                    } else {
                        ct.fn.systemTerminalResize(170, 15);
                    }
                }
            }
        };

        $scope.$on('userTenantChanged',function(event,status) {
            // $scope.main.goToPage("/iaas");
            $scope.main.goToPage("/gpu");
        });

        // deprecated
        ct.fn.getUsedResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded'));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded'));
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];

                ct.defaultResource = angular.copy(ct.tenantResource);
                ct.tenantResource.usedResource.cores -= ct.instance.spec.vcpus;
                ct.tenantResource.usedResource.ramSize -= ct.instance.spec.ram;
                ct.tenantResource.usedResource.instanceDiskGigabytes -= ct.instance.spec.disk;
                
                ct.doughnut.data.cpu = [ct.defaultResource.maxResource.cores - ct.defaultResource.usedResource.cores, ct.tenantResource.usedResource.cores, ct.instance.spec.vcpus];
                ct.doughnut.data.ram = [(ct.defaultResource.maxResource.ramSize - ct.defaultResource.usedResource.ramSize)/1024, ct.tenantResource.usedResource.ramSize/1024, ct.instance.spec.ram/1024];
                ct.doughnut.data.disk = [ct.defaultResource.maxResource.instanceDiskGigabytes - ct.defaultResource.usedResource.instanceDiskGigabytes, ct.tenantResource.usedResource.instanceDiskGigabytes, ct.instance.spec.disk];

                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
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

        //인스턴스 상세 정보 조회
        ct.fn.getInstanceInfo = function(action) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded'));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded'));
            returnPromise.success(function (data, status, headers) {
                if(data.content.instances.length == 1) {
                    if(data.content.instances[0].powerState == "deleted"){
                        common.showAlertWarning('삭제된 인스턴스입니다.');
                        $window.history.back();
                    }

                    ct.instance = data.content.instances[0];
                    ct.fn.setProcState(ct.instance);
                    ct.fn.setRdpConnectDomain(ct.instance);
                    ct.instance.tenantId = ct.data.tenantId;

                    ct.instance.changeName = ct.instance.name;

                    var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", ct.instance.vmType);
                    if (angular.isObject(vmDeployType) && vmDeployType.id) {
                        ct.instance.vmDeployType = vmDeployType;
                    } else {
                        ct.instance.vmDeployType = angular.copy(ct.deployTypes[0]);
                    }

                    /*
                    var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/iaas/tenant/' + param.tenantId + '/instances', 'GET', {limit: 1000}, 'application/x-www-form-urlencoded'));
                    returnPromise.success(function (data2, status2, headers2) {
                        angular.forEach(data2.metric, function (instance) {
                            if (ct.instance.id == instance.instance_id) {
                                ct.doughnut.data.cpu = [100 - instance.cpuUsage, instance.cpuUsage];
                                ct.doughnut.data.ram = [100 - instance.memoryUsage, instance.memoryUsage];
                                ct.doughnut.data.disk = [100 - instance.diskUsage, instance.diskUsage];
                                ct.instance.alarmStatus = instance.alarmStatus;
                                if (ct.instance.vmState == 'active' && (instance.alarmStatus == 'minor' || instance.alarmStatus == 'warning' || instance.alarmStatus == 'critical')) {
                                    ct.instance.alarmOccur = true;
                                }
                            }
                        });
                    });
                    */ // yminlee : monitoring 제외

                    // ct.fn.getUsedResource();
                    ct.fn.searchInstanceVolumeList();

                    if (ct.instance.procState != 'end') {
                        if ($scope.main.reloadTimmer['instanceServerInfo_'+ct.instance.id]) {
                            $timeout.cancel($scope.main.reloadTimmer['instanceServerInfo']);
                            $scope.main.reloadTimmer['instanceServerInfo'+ct.instance.id] = null;
                        }
                        $scope.main.reloadTimmer['instanceServerInfo'+ct.instance.id] = $timeout(function () {
                            ct.fn.checkServerState();
                        }, 2000);
                    }

                    if (ct.instance.console) {
                        ct.instance.consoleArr = ct.instance.console.split("\n");
                    } else {
                        ct.instance.consoleArr = [];
                    }
                    for (var i=0; i<ct.instance.consoleArr.length; i++) {
                        ct.instance.consoleArr[i] = common.replaceAll(ct.instance.consoleArr[i], "(\\[[0-9;]{1,}m(.){1,})\\[0m", "\x1B$1\x1B[0m");
                    }
                    
                    // 20.9.1 by hrit, 모니터링 링크 세팅
                    ct.instance.monitoringLink = CONSTANTS.monitoringUrl + '?var-project_name=' + ct.data.tenantName + '&var-node_name=' + ct.instance.name;

                    if (ct.instance.uiTask != 'creating' && ct.instance.taskState != "deleting" && ct.instance.vmMonitoringYn == 'N') {
                        $scope.main.refreshInterval['instanceMonitoringYn'] = $interval(function () {ct.fn.monitYnState(ct.instance);}, 1000);
                    }

                    $timeout(function () {
                        $('#action_event_panel.scroll-pane').jScrollPane({});
                    }, 100);
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 모니터링 활성화 여부 조회
        ct.fn.monitYnState = function (instance) {
            ct.vmMonitoringYn = {};
            ct.gpuMonitoringYn = {};
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/'+ instance.id +'/monitoring/vm', 'GET'));
            returnPromise.success(function (data, status, headers) {
                ct.vmMonitoringYn = data.content.vmMonitoringYn;
                ct.gpuMonitoringYn = data.content.gpuMonitoringYn;
                if (ct.vmMonitoringYn == 'Y') {
                    $timeout(function () {
                        ct.instance.vmMonitoringYn = ct.vmMonitoringYn;

                    },30000);
                    $interval.cancel($scope.main.refreshInterval['instanceMonitoringYn']);
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
        };

        // 서버 이벤트 조회
        ct.fn.getInstanceActionLog = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/actionlogs', 'GET', param, 'application/x-www-form-urlencoded'));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/actionlogs', 'GET', param, 'application/x-www-form-urlencoded'));
            returnPromise.success(function (data, status, headers) {
                ct.serverEvent = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getInstanceBootLog = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId: ct.data.tenantId,
                instanceId: ct.data.instanceId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/bootlogs', 'GET', param, 'application/x-www-form-urlencoded'));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/bootlogs', 'GET', param, 'application/x-www-form-urlencoded'));
            returnPromise.success(function (data, status, headers) {
                ct.test = data.content;
                ct.test.consoleArr = ct.test.console.split("\n");
                for (var i = 0; i < ct.test.consoleArr.length; i++) {
                    ct.test.consoleArr[i] = common.replaceAll(ct.test.consoleArr[i], "(\\[[0-9;]{1,}m(.){1,})\\[0m", "\x1B$1\x1B[0m");
                }
                $timeout(function () {
                    $('#action_event_panel.scroll-pane').jScrollPane({});
                    ct.fn.systemTerminalResize(170, 15);
                    ct.panelFlag = true;
                }, 100);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.systemTerminalResize = function(cols, rows) {
            //Terminal.applyAddon(fit);
            if (!cols) {
                cols = 170;
            }
            if (!rows) {
                rows = 20;
            }
            var term = new Terminal({
                cursorBlink: true,  // Do not blink the terminal's cursor
                cols: cols,  // Set the terminal's width to 120 columns
                rows: rows  // Set the terminal's height to 80 rows
            });
            $('#boot_log_terminal').html('');
            term.open(document.getElementById('boot_log_terminal'));
            //term.fit();
            if (ct.test && angular.isArray(ct.test.consoleArr)) {
                for (var i=0; i<ct.test.consoleArr.length; i++) {
                    term.writeln(ct.test.consoleArr[i]);
                }
            }
        };

        ct.fn.getTimeColumnSeries = function(data) {
            var series = [];
            if (angular.isArray(data) && data.length > 0 && angular.isArray(data[0].series)  && data[0].series.length > 0) {
                angular.forEach(data[0].series, function (seryData, seryKey) {
                    seryData.columnData = [];
                    if (angular.isArray(seryData.values) &&  seryData.values.length > 0) {
                        var valuesLen = seryData.values.length;
                        angular.forEach(seryData.values, function (value, key) {
                            var itemObj = {};
                            angular.forEach(seryData.columns, function (column, k) {
                                itemObj[column] = value[k];
                            });
                            if (key == valuesLen - 1 && itemObj["total"]) {
                                seryData.total = itemObj["total"];
                            }
                            seryData.columnData.push(itemObj);
                        });
                    }
                    series.push(seryData)
                });
            }
            return series;
        };

        /*// 도메인 연결 버튼
        ct.fn.connectDomainFormOpen = function() {
            if (ct.instance.floatingIp == '') {
                common.showAlertError('접속 IP 주소가 없으면 도메인 연결을 할 수 없습니다.');
                return;
            }

            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeDomainForm.html" + _VersionTail();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };*/
        
        //20181120 sg0730  도메인연결 PopUp 추가
        ct.fn.popConnDomainForm = function($event) {
        	var dialogOptions = {
                // controller : "iaasPopConnDomainFormCtrl" ,
                // formName : 'iaasPopConnDomainForm',
                controller : "gpuPopConnDomainFormCtrl" ,
                formName : 'gpuPopConnDomainForm',
                formMode : "add",
                instance : angular.copy(ct.instance),
                callBackFunction : ct.refalshDomainCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.fn.popModDomainForm = function($event, domainLinkInfo) {
            var dialogOptions = {
                // controller : "iaasPopConnDomainFormCtrl" ,
                // formName : 'iaasPopConnDomainForm',
                controller : "gpuPopConnDomainFormCtrl" ,
                formName : 'gpuPopConnDomainForm',
                formMode : "mod",
                instance : angular.copy(ct.instance),
                domainLinkInfo : angular.copy(domainLinkInfo),
                callBackFunction : ct.refalshDomainCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // sg0730 차후 callback 처리 고민.
        ct.refalshDomainCallBackFunction = function () {
            ct.fn.listDomains();
        };

        // 도메인 반환 버튼
        ct.fn.deleteDomain = function(domainLink) {
            common.showConfirm('도메인 삭제','※'+domainLink.domainInfo.domain+' 도메인을 삭제 합니다.').then(function(){
                ct.fn.deleteDomainAction(domainLink);
            });
        };

        // 도메인 삭제 job
        ct.fn.deleteDomainAction = function(domainLink) {
            $scope.main.loadingMainBody = true;
            var param = {
                instanceDomainLinkId : domainLink.id,
                domainId : domainLink.domainInfo.id
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain/service', 'DELETE', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/domain/service', 'DELETE', param);
            returnPromise.success(function (data, status, headers) {
                ct.fn.listDomains();
                common.showAlertSuccess("도메인이 삭제 되었습니다.");
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
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

        ct.fn.serverActionConfirm = function(action,instance) {
            if(action == "START") {
                common.showConfirm('시작',instance.name +' 인스턴스를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "STOP") {
                common.showConfirm('정지',instance.name +' 인스턴스를 정지하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('일시정지', instance.name +' 인스턴스를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('정지해제', instance.name +' 인스턴스를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('재시작',instance.name +' 인스턴스를 재시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop();
            } else if(action == "IPDISCONNECT"){
                common.showConfirm('접속 IP를 해제',instance.name +' 인스턴스의 접속 IP를 해제하시겠습니까?').then(function(){
                    ct.fn.ipConnectionSet("detach");
                });
            }
        };

        ct.fn.getKeyFile = function(keypair,type) {
            // document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
            document.location.href = CONSTANTS.gpuApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
        };

        // 서버삭제
        ct.deleteInstanceJob = function(id) {
            common.showConfirm('인스턴스 삭제','선택한 인스턴스를 삭제하시겠습니까?').then(function(){
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
                        // $scope.main.goToPage('/iaas/compute');
                        $scope.main.goToPage('/gpu/compute');
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

        ct.fnSingleInstanceAction = function(action,instance) {
            if(typeof id !== 'string' && typeof action !== 'string'){
                console.log('type missmatch error');
                return;
            }
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
                ct.instance.vmState = vmStateChange;
                ct.instance.uiTask = vmStateChange;
                ct.instance.vmStateSec = 0;
                ct.fn.setProcState(ct.instance);
                $scope.main.loadingMainBody = false;
                $scope.main.reloadTimmer['instanceServerState_' + ct.instance.id] = $timeout(function () {
                    ct.fn.checkServerState(ct.instance.id);
                }, 5000);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        // SnapShot 생성
        ct.fn.createSnapshot = function($event,instance) {
            if(instance.vmState != 'stopped') {
                common.showAlertWarning('인스턴스를 정지 후 생성가능합니다.');
            } else {
                ct.selectInstance = instance;
                // $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
                $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
                $(".aside").stop().animate({"right":"-360px"}, 400);
                $("#aside-aside1").stop().animate({"right":"0"}, 500);
            }
        };

        //인스턴스 디스크 조회
        ct.fn.searchInstanceVolumeList = function() {
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId
            };
            ct.instanceVolList = [];
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/instance', 'GET', param, 'application/x-www-form-urlencoded'));
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.volumeAttaches && data.content.volumeAttaches.length > 0) {
                    ct.instanceVolList = data.content.volumeAttaches;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
        };

        // 디스크 반환 버튼
        ct.fn.restorationConfirm = function(volume) {
            common.showConfirm('볼륨 연결해제','인스턴스와의 연결을 해제 하시겠습니까?').then(function(){
                ct.fn.restorationVolume(volume);
            });
        };

        //디스크 반환 job
        ct.fn.restorationVolume = function(volume) {
            volume.tenantId = ct.data.tenantId;
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach:volume});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach:volume});
            returnPromise.success(function (data, status, headers) {
                ct.fn.searchInstanceVolumeList();
                common.showAlertSuccess("인스턴스와의 연결을 해제 되었습니다.");
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //인스턴스 디스크 생성 팝업
        /*ct.fn.createInstanceVolumePop = function(instance) {
            ct.selectInstance = instance;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeVolumeForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };*/
        
        //인스턴스 디스크 생성 팝업
        ct.fn.createInstanceVolumePop = function($event,instance) {
        	///iaas/compute/detail/ct.data.instanceId
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
            ct.fn.searchInstanceVolumeList();
        };

        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function() {
            // $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        // 공인 IP 연결 해제 펑션
        ct.fn.ipConnectionSet = function(type) {
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId
            };
            if(ct.instance.floatingIp) {
                param.floatingIp = ct.instance.floatingIp;
                param.action = type;
            } else {
                return false;
            }
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');            returnPromise.success(function (data, status, headers) {
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess('접속 IP가 해제되었습니다.');
                ct.instance.floatingIp = '';
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        };

        // paging
        ct.eventHistoryPageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        // 이벤트 이력 Page
        ct.fn.listEventHistory = function(page, size) {
            if (angular.isUndefined(page)) {
                page = ct.eventHistoryPageOptions.currentPage;
            } else {
                ct.eventHistoryPageOptions.currentPage = page;
            }
            if (angular.isUndefined(size)) {
                size = ct.eventHistoryPageOptions.pageSize;
            } else {
                ct.eventHistoryPageOptions.pageSize = size;
            }
            var params = {
                urlPaths: {
                    resource_uuid: ct.data.instanceId
                },
                page: (page - 1),
                size: size
            };
            $scope.main.loadingMainBody = true;
            ct.data.eventHistories = [];
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/event_histories/{resource_uuid}/page', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.data.eventHistories = data.content;
                ct.eventHistoryPageOptions.total = data.totalElements;
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $timeout(function () {
                    $('#system_event_history_panel.scroll-pane').jScrollPane({});
                }, 100);
                $scope.main.loadingMainBody = false;
            });
        };

        //서비스 도메인 조회
        ct.fn.listDomains = function() {
            $scope.main.loadingMainBody = true;
            var returnPromise = computeDetailService.listDomains(ct.data.instanceId);
            returnPromise.success(function (data) {
                ct.instance.instanceDomainLinkInfos = data.content;
                ct.fn.setRdpConnectDomain(ct.instance);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // paging
        ct.systemLogPageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        ct.panelFlag = false;
        ct.fn.changeSltInfoTab = function (sltInfoTab) {
            if (!sltInfoTab) {
                // sltInfoTab = 'domain';
                sltInfoTab = 'actEvent';
                ct.fn.getInstanceActionLog();

                ct.sltInfoTab = sltInfoTab;
            } else {
                if (ct.sltInfoTab != sltInfoTab) {
                    ct.sltInfoTab = sltInfoTab;
            
                    if (sltInfoTab == 'systemLog' || sltInfoTab == 'virtualMonit') {
                        angular.element('.tab-content.inst').css("height", "690px");
                    } else {
                        angular.element('.tab-content.inst').css("height", "530px");
                    }

                    if (sltInfoTab == 'bootLog') {
                        if(!ct.panelFlag) {
                            $timeout(function () {
                                ct.fn.systemTerminalResize(170, 15);
                            }, 100);
                        }
                        ct.fn.getInstanceBootLog();
                    } else if (sltInfoTab == 'actEvent') {
                        ct.fn.getInstanceActionLog();
                    } else if (sltInfoTab == 'sysEvent') {
                        ct.fn.listEventHistory(1, 1000);
                    } else if (sltInfoTab == 'systemLog') { 
                        ct.fn.initLogsTab();
                    } else if (sltInfoTab == 'virtualMonit') {

                        $timeout(function () {
                            // 조회주기 설정 관련
                            ct.timeRangePicker;
                            // TimeRange & GroupBy
                            ct.selCTimeRange = cookies.getDefaultTimeRange();
                            ct.selGroupBy = cookies.getGroupBy();
                            // Time Range 수동설정 달력
                            ct.timeRangeFrom = cookies.getDefaultTimeRangeFrom();
                            ct.timeRangeTo = cookies.getDefaultTimeRangeTo();
                        
                            ct.fn.selectChartList();
                        }, 500);

                        // 검색조건 수동설정 기간 데이터 설정
                        var tuiStop = $interval(function () {
                            if (angular.element('#startDate-input').attr('id')) {
                                $interval.cancel(tuiStop);
                
                                var today = new Date();
                                var from = new Date(moment(ct.timeRangeFrom).format('YYYY/MM/DD HH:mm'));
                                var to = new Date(moment(ct.timeRangeTo).format('YYYY/MM/DD HH:mm'));
                                ct.timeRangePicker = tui.DatePicker.createRangePicker({
                                    startpicker: {
                                        date: from,
                                        input: '#startDate-input',
                                        container: '#startDate-wrapper'
                                    },
                                    endpicker: {
                                        date: to,
                                        input: '#endDate-input',
                                        container: '#endDate-wrapper'
                                    },
                                    format: 'yyyy-MM-dd HH:mm',
                                    language: 'ko',
                                    timepicker: {
                                        inputType: 'spinbox'
                                    },
                                    selectableRanges: [
                                        [null, today],
                                        [null, today]
                                    ]
                                });
                                
                                ct.timeRangePicker.on('change:start', function() {
                                    var start = moment(ct.timeRangePicker.getStartDate());
                                    var end = moment(ct.timeRangePicker.getEndDate());
                                    if (end.diff(start, 'months') >= 6) {
                                        ct.timeRangePicker.setEndDate(new Date(start.add(6, 'months').format('YYYY.MM.DD HH:mm')));
                                    }
                                    ct.timeRangeFrom = moment(ct.timeRangePicker.getStartDate());
                                    $timeout(function () { ct.fn.setIntervalTime(true); }, 500);
                                });
                                
                                ct.timeRangePicker.on('change:end', function() {
                                    var start = moment(ct.timeRangePicker.getStartDate());
                                    var end = moment(ct.timeRangePicker.getEndDate());
                                    if (end.diff(start, 'months') >= 6) {
                                        ct.timeRangePicker.setStartDate(new Date(end.subtract(6, 'months').format('YYYY.MM.DD HH:mm')));
                                    }
                                    ct.timeRangeTo = moment(ct.timeRangePicker.getEndDate());
                                    $timeout(function () { ct.fn.setIntervalTime(true); }, 500);
                                });
                            }
                        }, 500);
                    } else if (sltInfoTab == 'alarmEvent') {
                        ct.changeTimeRange('1month');
                        ct.fn.selectAlarmList();
                    } else if (sltInfoTab == 'portForwarding') {
                        ct.fn.listPortForwardings();
                    }
                }
            }
        };

        ct.fn.copyConnectInfoToClipboard = function (instance) {
            if(instance.image.osType == 'ubuntu'){
                if (instance.floatingIp) {
                    common.copyToClipboard(instance.floatingIp);
                    $scope.main.copyToClipboard(instance.floatingIp, '"' + instance.floatingIp + '"가 클립보드에 복사 되었습니다.');
                } else {
                    common.showAlertWarning("접속 IP가 존재하지 않습니다.");
                }
            }
            else if(instance.image.osType == 'windows'){
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

        if(ct.data.tenantId) {
            ct.fn.getInstanceInfo();
            ct.fn.changeSltInfoTab();
        }
        
        // 시스템 로그 관련
        ct.fn.setPosition = function () {
            return navigator.userAgent.indexOf('Trident') > 0 || navigator.userAgent.indexOf('MSIE') > 0 ? 'ie' : '';
        };

        var stop = $interval(function () {
            $scope.serverName = ct.instance.name;
            if ($scope.serverName) {
                $interval.cancel(stop);
            }
        }, 500);
    
        ct.scope = $scope;
        ct.scope.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        ct.isPageLoad = true;

        ct.fn.initLogsTab = function () {
            var tuiLogsStop = $interval(function () {
                if (angular.element('#startDatetime').attr('id')) {
                    $interval.cancel(tuiLogsStop);
                    // TUI Datepicker
                    var today = new Date();
                    var from = new Date(moment().subtract(1, 'days').format('YYYY/MM/DD HH:mm'));
                    var to = new Date(moment().format('YYYY/MM/DD HH:mm'));
                    ct.datepicker = tui.DatePicker.createRangePicker({
                        startpicker: {
                            date: from,
                            input: '#startDatetime',
                            container: '#startDatetime-wrapper'
                        },
                        endpicker: {
                            date: to,
                            input: '#endDatetime',
                            container: '#endDatetime-wrapper'
                        },
                        format: 'yyyy-MM-dd HH:mm',
                        language: 'ko',
                        timepicker: {
                            inputType: 'spinbox',
                            showMeridiem: false
                        },
                        selectableRanges: [
                            [null, today],
                            [null, today]
                        ]
                    });
                }
            }, 500);

            ct.fn.selectLogs();
        };

        ct.fn.selectLogs = function (page) {
            ct.data.specificLogs = [];
            if (ct.isPageLoad) ct.fn.recentLogs(page);
            else ct.fn.specificLogs(page);
        };

        ct.schEnter = function (keyEvent){
            if(keyEvent.which == 13){
                ct.fn.specificLogs();
            }
        };

        // 최근 로그 조회
        ct.fn.recentLogs = function (page) {
            if (page) {
                ct.scope.pageOptions.currentPage = page;
            } else {
                page = ct.scope.pageOptions.currentPage;
            }

            $scope.main.loadingMainBody = true;
            var params = {
                projectId: ct.data.tenantId,
                serverUUID: $stateParams.instanceId,
                pageItems: ct.scope.pageOptions.pageSize,
                pageIndex: page,
                period: '24h'
            };

            var rp = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/log/recent/N', 'GET', params);
            rp.success(function (data, status, headers) {
                ct.data.specificLogs = data;
                ct.scope.pageOptions.total = data.totalCount;
            });
            rp.error(function (data, status, headers) {
                common.showAlertError('Http api Error', data.message);
            });
            rp.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 로그 조회
        ct.fn.specificLogs = function (page) {
            if (ct.isPageLoad) ct.scope.pageOptions.currentPage = 1;
            ct.isPageLoad = false;
            if (page) {
                ct.scope.pageOptions.currentPage = page;
            } else {
                page = ct.scope.pageOptions.currentPage;
            }

            $scope.main.loadingMainBody = true;
            var startDatetime = moment(ct.datepicker.getStartDate()).format('YYYY-MM-DDTHH:mm') + ':00';
            var endDatetime = moment(ct.datepicker.getEndDate()).format('YYYY-MM-DDTHH:mm') + ':59';

            var param = {
                projectId: ct.data.tenantId,
                serverUUID: $stateParams.instanceId,
                pageItems: ct.scope.pageOptions.pageSize,
                pageIndex: page,
                startTime: startDatetime,
                endTime: endDatetime,
                programName: ct.programName,
                keyword: ct.message
            };
            
            $scope.main.loadingMainBody = true;
            var rp = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/log/specific/N', 'GET', param);
            rp.success(function (data, status, headers) {
                ct.data.specificLogs = data;
                ct.scope.pageOptions.total = data.totalCount;
            });
            rp.error(function (data, status, headers) {
                common.showAlertError('Http api Error', data.message);
            });
            rp.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        /*
         * 가상머신 모니터링 차트
         */
        ct.fn.selectCustomBox = function () {
            ct.selCTimeRange = 'custom';
            ct.fn.selectGroupBy();
        };

        ct.fn.getTimeRangeString = function() {
            $timeout(function() {
            if(ct.selCTimeRange == 'custom') {
                var to = ct.timeRangeTo;
                var from = ct.timeRangeFrom;
                ct.timeRangeString = (from._i)+' ~ '+(to._i);
            } else {
                ct.timeRangeString = angular.element("input[name='radioTimeRange']:checked").parent().text();
            }
            });
        };

        // time range 선택 시 그에 해당하는 group by 선택
        ct.fn.selectGroupBy = function() {
            ct.fn.setIntervalTime(true);
        };
        
        var hostname = $stateParams.instanceId;
        var chartDataOption = {
            chartConfig: tenantChartConfig,
            netChartConfig: tenantNetChartConfig,
            nodeKey: CONSTANTS.nodeKey.TENANT,
            interfaceFunc: 'tenantInterfaceList',
            hostname: hostname,
            cookies: cookies,
            scope: $scope,
            log: $log,
            timeout: $timeout,
            interval: $interval,
            ex: $exceptionHandler
        };

        ct.fn.setIntervalTime = function (isChange) {
            ct.groupResources = common.getGroupingComboBox(ct.selCTimeRange, ct.timeRangeFrom, ct.timeRangeTo);
            if (isChange) {
                if (ct.groupResources.length > 0) ct.selGroupBy = ct.groupResources[0].value;
            } else {
                if (ct.groupResources.length > 0 && cookies.getGroupBy() == undefined) ct.selGroupBy = ct.groupResources[0].value;
            }
        };

        ct.fn.selectChartList = function () {
            ct.fn.setIntervalTime();
            computeDetailService.initChartData(chartDataOption);
        };

        // 조회주기 및 GroupBy 설정
        ct.fn.saveTimeRange = function () {
            if(ct.selCTimeRange == 'custom') {
                if (ct.timeRangeTo.diff(ct.timeRangeFrom, 'minutes') < 30) {
                    ct.timeRangeFrom.subtract(30, 'minutes');
                    ct.timeRangePicker.setStartDate(new Date(ct.timeRangeFrom.format('YYYY-MM-DD HH:mm')));
                }
                cookies.putTimeRangeFrom(common.getTimeRangeFlag(moment(ct.timeRangeFrom, 'YYYY-MM-DD HH:mm')));
                cookies.putTimeRangeTo(common.getTimeRangeFlag(moment(ct.timeRangeTo, 'YYYY-MM-DD HH:mm')));
                cookies.putDefaultTimeRangeFrom(ct.timeRangeFrom);
                cookies.putDefaultTimeRangeTo(ct.timeRangeTo);
                // ct.selGroupBy = common.getGroupingByTimeRange(ct.timeRangeFrom, ct.timeRangeTo);
            }

            cookies.putDefaultTimeRange(ct.selCTimeRange);
            cookies.putGroupBy(ct.selGroupBy);

            var datas = {
                selTimeRange: ct.selCTimeRange,
                selGroupBy: ct.selGroupBy,
                timeRangeFrom: cookies.getTimeRangeFrom(),
                timeRangeTo: cookies.getTimeRangeTo()
            };

            chartDataOption.datas = datas;
            computeDetailService.reloadChartData(chartDataOption);
            ct.fn.getTimeRangeString();
        };

        // 알람탭 관련
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
        ct.selATimeRange = {};

        //기간검색
        ct.timeRanges = [
            {id: '1day', value: '1', name: 'label.day'},
            {id: '3day', value: '3', name: 'label.days'},
            {id: '7day', value: '7', name: 'label.days'},
            {id: '1month', value: '1', name: 'label.month'},
            {id: '6month', value: '6', name: 'label.months'}
        ];
        ct.selATimeRange = common.objectsFindByField(ct.timeRanges, "id", "1month");

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
        $scope.alarmPageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        ct.fn.alarmListOnClick = function (path, alarmId) {
            common.locationHref(path + '?alarmId=' + alarmId + '&serverId=' + $stateParams.instanceId);
        };

        // 알람 이벤트 검색
        ct.fn.selectAlarmList = function (page) {
            if (page) $scope.alarmPageOptions.currentPage = page;
            else page = $scope.alarmPageOptions.currentPage;

            ct.sch_condition.searchDateFrom = moment(ct.sch_condition.dateFrom + ' 00:00:00').unix();
            ct.sch_condition.searchDateTo = moment(ct.sch_condition.dateTo + ' 23:59:59').unix();
            ct.sch_condition.pageItems = $scope.alarmPageOptions.pageSize;
            ct.sch_condition.pageIndex = page;
            ct.sch_condition.baremetalYn = 'N';
            // ct.sch_condition.projectId = $scope.main.userTenantId;
            ct.sch_condition.projectId = $scope.main.userTenantGpuId;
            ct.sch_condition.instanceId = ct.data.instanceId;
            
            $scope.main.loadingMainBody = true;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/admin/alarm/list', 'GET', ct.sch_condition);
            serverStatsPromise.success(function (data, status, headers) {
                ct.alarmData = data.data;

                if (data.totalCount > 10000) {
                    $scope.alarmPageOptions.total = 10000;
                } else {
                    $scope.alarmPageOptions.total = data.totalCount;
                }
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //포트포워딩 조회
        ct.fn.listPortForwardings = function () {
            ct.instance.instancePortForwardings = [];
            $scope.main.loadingMainBody = true;
            var returnPromise = computeDetailService.listPortForwardings(ct.data.instanceId);
            returnPromise.success(function (data) {
                ct.instance.instancePortForwardings = data.content;
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //포트포워딩 추가
        ct.fn.popPortForwardingForm = function($event) {
            var dialogOptions = {
                // controller : "iaasPopPortForwardingFormCtrl" ,
                // formName : 'iaasPopPortForwardingForm',
                controller : "gpuPopPortForwardingFormCtrl" ,
                formName : 'gpuPopPortForwardingForm',
                formMode : "add",
                instance : angular.copy(ct.instance),
                callBackFunction : ct.refalshPortForwardingCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        //포트포워딩 수정
        ct.fn.popModPortForwardingForm = function($event, portForwardingInfo) {
            var dialogOptions = {
                // controller : "iaasPopPortForwardingFormCtrl" ,
                // formName : 'iaasPopPortForwardingForm',
                controller : "gpuPopPortForwardingFormCtrl" ,
                formName : 'gpuPopPortForwardingForm',
                formMode : "mod",
                instance : angular.copy(ct.instance),
                portForwardingInfo : angular.copy(portForwardingInfo),
                callBackFunction : ct.refalshPortForwardingCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.refalshPortForwardingCallBackFunction = function () {
            ct.fn.listPortForwardings();
        };

        //포트포워딩 삭제
        ct.fn.deletePortForwarding = function(forwardingItem) {
            common.showConfirm('포트포워딩 삭제','※'+forwardingItem.targetPort+' 포트포워딩을 삭제 하시겠습니까?').then(function(){
                ct.fn.deletePortForwardingAction(forwardingItem);
            });
        };

        //포트포워딩 삭제 실제 action
        ct.fn.deletePortForwardingAction = function(forwardingItem) {
            $scope.main.loadingMainBody = true;
            var param = {
                instanceId : ct.data.instanceId,
                id : forwardingItem.id
            };
            var returnPromise = computeDetailService.deletePortForwardings(param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("포트포워딩이 삭제 되었습니다.");
                ct.instance.instancePortForwardings = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        // 모니터링 URL 복사하기 클릭 리스너
        ct.fn.copyMonitoringInfoToClipboard = function (monitoringUrl) {
            if (monitoringUrl) {
                common.copyToClipboard(monitoringUrl);
                $scope.main.copyToClipboard(monitoringUrl, '"' + monitoringUrl + '"가 클립보드에 복사 되었습니다.');
            } else {
                common.showAlertWarning("모니터링 링크가 존재하지 않습니다.");
            }
        };
        
        // 모니터링 활성화 여부 지정
        ct.fn.setMonitoringYn = function (instance) {
            computeDetailService.setMonitoringYn(instance);
        };
    })
    .controller('gpuComputeSystemDetailCtrl', function ($scope, $location, $state, $sce,$q, $stateParams, $timeout, $window, $mdDialog, $filter, $bytes, $translate, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeDetailControllers.js : gpuComputeSystemDetailCtrl", 1);
        
        $scope.actionBtnHied = true;
        var ct = this;
        ct.fn = {};
        ct.ui = {};
        ct.data = {};
        ct.instance = {};
        ct.subnet = {};
        ct.ipFlag = true;
        ct.addNetwork = {};
        ct.roles = [];
        ct.volumeRoles = [];
        ct.consoleLogLimit = 50 ;
        ct.actionLogLimit = 5;
        // 공통 레프트 메뉴의 userTenantId
        // ct.data.tenantId = $scope.main.userTenantId;
        // ct.data.tenantName = $scope.main.userTenant.korName;
        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.data.tenantName = $scope.main.userTenantGpu.korName;
        ct.data.instanceId = $stateParams.instanceId;
        ct.viewType = 'instance';
        // if ($scope.main.stateKey == "iaasDeployServerComputeDetail") {
        if ($scope.main.stateKey == "gpuDeployServerComputeDetail") {
            ct.viewType = 'deploy';
        }
        ct.sltInfoTab = 'actEvent';
        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);

        ct.computeEditFormOpen = function (){
        	// $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeEditForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computeEditForm.html" + _VersionTail();
			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        };
        
        ct.cpuRoundProgress = {
            label : "{percentage}%",
            percentage : 0
        };


        ct.ramRoundProgress = {
            label : "{percentage}%",
            percentage : 0
        };
        
        ct.doughnut = {};
        ct.doughnut.labels = ['사용량', '유휴량'];
        
        ct.doughnut.colors = {};
        ct.doughnut.colors.cpu = ["rgba(183,93,218,1)", "rgba(199,143,220,.5)"];
        ct.doughnut.colors.ram = ["rgba(1,160,206,1)", "rgba(145,191,206,.5)"];
        ct.doughnut.colors.disk = ["rgba(22,87,218,1)", "rgba(143,171,234,.5)"];
        
        ct.doughnut.data = {};
        ct.doughnut.data.cpuUsed = 0;
        ct.doughnut.data.ramParsentUsed = 0;
        ct.doughnut.data.diskParsentUsed = 0;
        ct.doughnut.data.cpu = [0, 100];
        ct.doughnut.data.ram = [0, 100];
        ct.doughnut.data.disk = [0, 100];
        ct.doughnut.cpuDataLoad = false;
        ct.doughnut.ramDataLoad = false;
        ct.doughnut.diskDataLoad = false;

        ct.zoomPanel = function(evt, type){
            var panel = $(evt.currentTarget).closest(".panel");
            var isZoom = false;
            if(panel.hasClass("zoom")) {
                panel.removeClass("zoom").resize();
                panel.find('.panel_body').css("height", "400px");
                $timeout(function () {
                    $(window).scrollTop(document.scrollingElement.scrollHeight);
                }, 100);
            } else {
                isZoom = true;
                panel.addClass("zoom").resize();
                panel.find('.panel_body').css("height", "90%");
                $timeout(function () {
                    $(window).scrollTop(0);
                }, 100);
            }
            if(type == 'insMonit') {
                if (isZoom) {
                    panel.find('.visualizeItem').css("width", "750px");
                } else {
                    panel.find('.visualizeItem').css("width", "465px");
                }
                $timeout(function () {
                    panel.find('.scroll-pane').jScrollPane({contentWidth: '0px'});
                }, 100);
            } else {
                panel.find('.scroll-pane').jScrollPane({contentWidth: '0px'});
                if(type == 'bootLog') {
                    if (isZoom) {
                        ct.fn.systemTerminalResize(180, 40);
                    } else {
                        ct.fn.systemTerminalResize(170, 20);
                    }
                }
            }
        };
        
        
        $scope.$on('userTenantChanged',function(event,status) {
            // $scope.main.goToPage("/iaas");
            $scope.main.goToPage("/gpu");
        });
        
        //인스턴스 상세 정보 조회
        ct.fn.getInstanceInfo = function(action) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if(data.content.instances.length == 1) {
                	if(data.content.instances[0].powerState == "deleted"){
                		common.showAlertWarning('삭제된 인스턴스입니다.');
                		$window.history.back();
                	}
                	
                    ct.instance = data.content.instances[0];
                    ct.instance.tenantId = ct.data.tenantId;

                	ct.instance.changeName = ct.instance.name;
                    $scope.main.sltOrganizationName = ct.instance.name;

                    var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", ct.instance.vmType);
                    if (angular.isObject(vmDeployType) && vmDeployType.id) {
                        ct.instance.vmDeployType = vmDeployType;
                    } else {
                        ct.instance.vmDeployType = angular.copy(ct.deployTypes[0]);
                    }

                    ct.specValue = '';
                    if(ct.instance.spec !== undefined && ct.instance.spec != null) {
                        if(ct.instance.spec.name) ct.specValue +='['+ct.instance.spec.name+']';
                        if(ct.instance.spec.vcpus) ct.specValue += ' cpu'+ct.instance.spec.vcpus+'개';
                        if(ct.instance.spec.ram) ct.specValue += ', ram'+ct.instance.spec.ram + 'MB';
                        if(ct.instance.spec.disk) ct.specValue += ', disk'+ct.instance.spec.disk + 'GB';
                    }

                    ct.fn.searchInstanceVolumeList();

                    if (ct.instance.vmState != 'active' && ct.instance.vmState != 'stopped' && ct.instance.vmState != 'paused' ) {
                        $scope.main.reloadTimmer['deployServerDetail'] = $timeout(function () {
                            ct.fn.getInstanceInfo();
                        }, 10000)
                    }

                    if (ct.instance.console) {
                        ct.instance.consoleArr = ct.instance.console.split("\n");
                    } else {
                        ct.instance.consoleArr = [];
                    }
                    for (var i=0; i<ct.instance.consoleArr.length; i++) {
                        ct.instance.consoleArr[i] = common.replaceAll(ct.instance.consoleArr[i], "(\\[[0-9;]{1,}m(.){1,})\\[0m", "\x1B$1\x1B[0m");
                    }
                    $timeout(function () {
                        $('#action_event_panel.scroll-pane').jScrollPane({});
                    }, 100);
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.systemTerminalResize = function(cols, rows) {
            //Terminal.applyAddon(fit);
            if (!cols) {
                cols = 170;
            }
            if (!rows) {
                rows = 20;
            }
            var term = new Terminal({
                cursorBlink: true,  // Do not blink the terminal's cursor
                cols: cols,  // Set the terminal's width to 120 columns
                rows: rows  // Set the terminal's height to 80 rows
            });
            $('#boot_log_terminal').html('');
            term.open(document.getElementById('boot_log_terminal'));
            //term.fit();
            if (ct.instance && angular.isArray(ct.instance.consoleArr)) {
                for (var i=0; i<ct.instance.consoleArr.length; i++) {
                    term.writeln(ct.instance.consoleArr[i]);
                }
            }
        };

        ct.fn.getTimeColumnSeries = function(data) {
            var series = [];
            if (angular.isArray(data) && data.length > 0 && angular.isArray(data[0].series)  && data[0].series.length > 0) {
                angular.forEach(data[0].series, function (seryData, seryKey) {
                    seryData.columnData = [];
                    if (angular.isArray(seryData.values) &&  seryData.values.length > 0) {
                        var valuesLen = seryData.values.length;
                        angular.forEach(seryData.values, function (value, key) {
                            var itemObj = {};
                            angular.forEach(seryData.columns, function (column, k) {
                                itemObj[column] = value[k];
                            });
                            if (key == valuesLen - 1 && itemObj["total"]) {
                                seryData.total = itemObj["total"];
                            }
                            seryData.columnData.push(itemObj);
                        });
                    }
                    series.push(seryData)
                });
            }
            return series;
        };

        // 서버 CPU
        ct.fn.getNowServerCpuUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    server_uuid: ct.data.instanceId
                },
                start_time: start_time
            };
            ct.doughnut.cpuDataLoad = false;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_cpu/{server_type}/{server_uuid}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                var series = ct.fn.getTimeColumnSeries(data);
                var cpuUsed = 0;
                if (series && series.length > 0 && series[0].columnData && series[0].columnData.length > 0) {
                    cpuUsed = Math.round(series[0].columnData[0]['mean_usage_active'], 2);
                }
                $timeout(function () {
                    ct.doughnut.data.cpu = [cpuUsed, (100 - cpuUsed)];
                    ct.doughnut.data.cpuUsed = cpuUsed;
                    ct.doughnut.cpuDataLoad = true;
                }, 100);
            });
            serverStatsPromise.error(function (data, status, headers) {
                ct.doughnut.cpuDataLoad = true;
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
            });
        };

        // 서버 Memory
        ct.fn.getNowServerMemoryUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    server_uuid: ct.data.instanceId
                },
                start_time: start_time
            };
            ct.doughnut.ramDataLoad = false;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_mem/{server_type}/{server_uuid}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                var series = ct.fn.getTimeColumnSeries(data);
                var ramParsentUsed = 0;
                var ramUsed = 0;
                if (series && series.length > 0 && series[0].columnData && series[0].columnData.length > 0) {
                    ramUsed = series[0].columnData[0]['mean_used'];
                    ramParsentUsed = Math.round(series[0].columnData[0]['mean_used_percent'], 2);
                }
                $timeout(function () {
                    ct.doughnut.data.ram = [ramParsentUsed, (100 - ramParsentUsed)];
                    ct.doughnut.data.ramUsed = Math.round(ramUsed/(1024*1024), 2);
                    ct.doughnut.data.ramParsentUsed = ramParsentUsed;
                    ct.doughnut.ramDataLoad = true;
                }, 100);
            });
            serverStatsPromise.error(function (data, status, headers) {
                ct.doughnut.ramDataLoad = true;
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
            });
        };

        // 서버 Disk
        ct.fn.getNowServerDiskUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    server_uuid: ct.data.instanceId
                },
                start_time: start_time
            };
            ct.doughnut.diskDataLoad = false;
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_disk/{server_type}/{server_uuid}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                var series = ct.fn.getTimeColumnSeries(data);
                var diskTotal = 0;
                var diskUsed = 0;
                var diskParsentUsed = 0;
                if (series && series.length > 0) {
                    angular.forEach(series, function (sery, key) {
                        if (sery.columnData && sery.columnData.length > 0) {
                            diskTotal += sery.columnData[0]['total'];
                            diskUsed += sery.columnData[0]['used'];
                            diskParsentUsed += sery.columnData[0]['used_percent'];
                        }
                    });
                    if (diskTotal > 0) {
                        diskParsentUsed = Math.round(diskUsed*100/diskTotal, 2);
                    }
                }
                $timeout(function () {
                    ct.doughnut.data.disk = [diskParsentUsed, (100 - diskParsentUsed)];
                    ct.doughnut.data.diskTotal = Math.round(diskTotal/(1024*1024), 2);
                    ct.doughnut.data.diskUsed = Math.round(diskUsed/(1024*1024), 2);
                    ct.doughnut.data.diskParsentUsed = diskParsentUsed;
                    ct.doughnut.diskDataLoad = true;
                }, 100);
            });
            serverStatsPromise.error(function (data, status, headers) {
                ct.doughnut.diskDataLoad = true;
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
            });
        };

        // 도메인 연결 버튼
        ct.fn.connectDomainFormOpen = function() {
            if (ct.instance.floatingIp == '') {
                common.showAlertError('접속 IP 주소가 없으면 도메인 연결을 할 수 없습니다.');
                return;
            }

            // $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeDomainForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computeDomainForm.html" + _VersionTail();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        // 도메인 반환 버튼
        ct.fn.publicIpReturn = function(domain) {
            common.showConfirm('도메인 반환','※'+domain.domainInfo.domain+' 도메인을 반환 합니다. 반환된 도메인에 대한 관리는 도메인 관리에서 가능합니다').then(function(){
                ct.fn.restorationDomain(domain);
            });
        };

        // 도메인 반환 job
        ct.fn.restorationDomain = function(domain) {
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain', 'DELETE', {instanceDomainLinkId:domain.id});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/domain', 'DELETE', {instanceDomainLinkId:domain.id});
            returnPromise.success(function (data, status, headers) {
                ct.fn.getInstanceInfo();
                common.showAlertSuccess("도메인이 반환 되었습니다.");
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.serverActionConfirm = function(action,instance) {
            if(action == "START") {
                common.showConfirm('시작',instance.name +' 인스턴스를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "STOP") {
                common.showConfirm('정지',instance.name +' 인스턴스를 정지하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('일시정지', instance.name +' 인스턴스를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('정지해제', instance.name +' 인스턴스를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('재시작',instance.name +' 인스턴스를 재시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop();
            } else if(action == "IPDISCONNECT"){
            	common.showConfirm('접속 IP를 해제',instance.name +' 인스턴스의 접속 IP를 해제하시겠습니까?').then(function(){
            		ct.fn.ipConnectionSet("detach");
            	});
            }
        };

        ct.fnSingleInstanceAction = function(action,instance) {
            if(typeof id !== 'string' && typeof action !== 'string'){
                console.log('type missmatch error');
                return;
            }
            var param = {
                instanceId : instance.id,
                action : action,
                tenantId : ct.data.tenantId
            };
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $timeout(function () {
                    ct.fn.getInstanceInfo(action);
                }, 1000);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        // SnapShot 생성
        ct.fn.createSnapshot = function($event,instance) {
            if(instance.vmState != 'stopped') {
            	common.showAlertWarning('인스턴스를 정지 후 생성가능합니다.');
            } else {
            	ct.selectInstance = instance;
            	// $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
                $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
    			$(".aside").stop().animate({"right":"-360px"}, 400);
    			$("#aside-aside1").stop().animate({"right":"0"}, 500);
            }
        };

        //인스턴스 디스크 조회
        ct.fn.searchInstanceVolumeList = function() {
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId
            };
            ct.instanceVolList = [];
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instance', 'GET', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.volumeAttaches && data.content.volumeAttaches.length > 0) {
                    ct.instanceVolList = data.content.volumeAttaches;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
        };

        // 디스크 반환 버튼
        ct.fn.restorationConfirm = function(volume) {
            common.showConfirm('볼륨 연결해제','인스턴스와의 연결을 해제 하시겠습니까?').then(function(){
                ct.fn.restorationVolume(volume);
            });
        };

        //디스크 반환 job
        ct.fn.restorationVolume = function(volume) {
            volume.tenantId = ct.data.tenantId;
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach:volume});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach:volume});
            returnPromise.success(function (data, status, headers) {
                ct.fn.searchInstanceVolumeList();
                common.showAlertSuccess("인스턴스와의 연결을 해제 되었습니다.");
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //인스턴스 디스크 생성 팝업
        /*ct.fn.createInstanceVolumePop = function(instance) {
            ct.selectInstance = instance;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeVolumeForm.html" + _VersionTail();
			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        };*/
        
        ct.fn.createInstanceVolumePop = function($event,instance) {
        	
        	///iaas/compute/detail/ct.data.instanceId
        	
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
        ct.creInsVolPopCallBackFunction = function () 
        {
        	 //$scope.main.goToPage('/iaas/compute');
        	ct.fn.getInstanceInfo();
            ct.fn.changeSltInfoTab();
        };
        
        
        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function() {
        	// $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        };
        
        // 공인 IP 연결 해제 펑션
        ct.fn.ipConnectionSet = function(type) {
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId
            };
            if(ct.instance.floatingIp) {
                param.floatingIp = ct.instance.floatingIp;
                param.action = type;
            } else {
                return false;
            }
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
    			common.showAlertSuccess('접속 IP가 해제되었습니다.');
                //ct.fn.getInstanceInfo();
                ct.instance.floatingIp = '';
                ct.dnsRouterList = null;

                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        };

        // paging
        ct.eventHistoryPageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        // 이벤트 이력 Page
        ct.fn.listEventHistory = function(page, size) {
            if (angular.isUndefined(page)) {
                page = ct.eventHistoryPageOptions.currentPage;
            } else {
                ct.eventHistoryPageOptions.currentPage = page;
            }
            if (angular.isUndefined(size)) {
                size = ct.eventHistoryPageOptions.pageSize;
            } else {
                ct.eventHistoryPageOptions.pageSize = size;
            }
            var params = {
                urlPaths: {
                    resource_uuid: ct.data.instanceId
                },
                page: (page - 1),
                size: size
            };
            $scope.main.loadingMainBody = true;
            ct.data.eventHistories = [];
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/event_histories/{resource_uuid}/page', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.data.eventHistories = data.content;
                ct.eventHistoryPageOptions.total = data.totalElements;
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $timeout(function () {
                    $('#system_event_history_panel.scroll-pane').jScrollPane({});
                }, 100);
                $scope.main.loadingMainBody = false;
            });
        };

        // paging
        ct.systemLogPageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        // 시스템 로그
        ct.fn.listSystemLog = function(rangeType, page, size) {
            if (angular.isUndefined(page)) {
                page = ct.systemLogPageOptions.currentPage;
            } else {
                ct.systemLogPageOptions.currentPage = page;
            }
            if (angular.isUndefined(size)) {
                size = ct.systemLogPageOptions.pageSize;
            } else {
                ct.systemLogPageOptions.pageSize = size;
            }
            var params = {
                urlPaths: {
                    server_uuid: ct.data.instanceId
                },
                rangeType: rangeType,
                page: (page - 1),
                size: size
            };
            $scope.main.loadingMainBody = true;
            ct.data.systemLogs = [];
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_logs/{server_uuid}/page', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.data.systemLogs = data.content;
           });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $timeout(function () {
                    $('#system_log_panel.scroll-pane').jScrollPane({});
                }, 100);
                $scope.main.loadingMainBody = false;
            });
        };

        // 개수가 변동이 있는 차트에서 사용
        ct.lineChartColors = [
            { borderColor: "rgba(183,93,218,1)", backgroundColor: "rgba(183,93,218,0.2)", fill: true, },
            { borderColor: "rgba(22,87,218,1)", backgroundColor: "rgba(22,87,218,0.2)", fill: true, },
            { borderColor: "rgba(1,160,206,1)", backgroundColor: "rgba(1,160,206,0.2)", fill: true, },
            { borderColor: "rgba(183,93,118,1)", backgroundColor: "rgba(183,93,118,0.2)", fill: true, },
            { borderColor: "rgba(22,87,118,1)", backgroundColor: "rgba(22,87,118,0.2)", fill: true, },
            { borderColor: "rgba(1,160,106,1)", backgroundColor: "rgba(1,160,106,0.2)", fill: true, },
            { borderColor: "rgba(183,93,18,1)", backgroundColor: "rgba(183,93,18,0.2)", fill: true, },
            { borderColor: "rgba(22,87,18,1)", backgroundColor: "rgba(22,87,18,0.2)", fill: true, },
            { borderColor: "rgba(1,160,6,1)", backgroundColor: "rgba(1,160,6,0.2)", fill: true, },
        ];

        ct.lineChartLabels = [];
        ct.lineChartDayLabels = [];

        ct.fn.getStepRang = function (rangeType) {
            var range = 60000;
            if (rangeType == "s") {
                range = 1000;
            } else if (rangeType == "h") {
                range = 3600000;
            } else if (rangeType == "d") {
                range = 86400000;
            }
            return range;
        };

        ct.fn.getChartTimeLabels = function(time_step, start_time) {
            var setDate = new Date();
            var stepRangeType = time_step.substring(time_step.length - 1);
            var stepRangeTime = time_step.substring(0, time_step.length - 1);
            var stepRange = ct.fn.getStepRang(stepRangeType);
            stepRangeTime *= stepRange;

            var startRangeType = start_time.substring(start_time.length - 1);
            var startRangeTime = start_time.substring(0, start_time.length - 1);
            startRangeTime *= ct.fn.getStepRang(startRangeType);

            var end = Math.round(setDate.getTime()/stepRange)*stepRange;
            var start = end - startRangeTime;
            var lineChartLabels = [];
            for (var time = start; time < end; time += stepRangeTime) {
                lineChartLabels.push(new Date(time));
            }
            return lineChartLabels;
        };

        ct.lineChartCpu = {};
        ct.lineChartCpu.options = {
            elements: { line: { tension: 0, spanGaps: true }, point: { radius: 0, spanGaps: true } },
            //maintainAspectRatio: false,
            scales: {
                yAxes: [{ ticks: { min : 0, max : 100, stepSize: 20 } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };
        ct.lineChartCpu.series = ['Max', 'Avg', 'Min'];
        ct.lineChartCpu.colors = [
            { borderColor: "rgba(183,93,218,1)", backgroundColor: "rgba(183,93,218,0.2)", fill: true },
            { borderColor: "rgba(22,87,218,1)", backgroundColor: "rgba(22,87,218,0.2)", fill: true },
            { borderColor: "rgba(1,160,206,1)", backgroundColor: "rgba(1,160,206,0.2)", fill: true }
        ];
        ct.lineChartCpu.labels = [];
        ct.lineChartCpu.data = [[], [], []];

        // 서버 CPU
        ct.fn.getServerCpuData = function() {
            ct.loadingComputeMonitoring = true;
            var params = {
                urlPaths: {
                    server_type: "vm",
                    server_uuid: ct.data.instanceId
                },
                time_step : ct.selPeriod + "m",
                start_time : ct.selTimeRange + "h"
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_cpu/{server_type}/{server_uuid}/used_step', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                var series = ct.fn.getTimeColumnSeries(data);
                if (series && series.length > 0) {
                    ct.data.serverCpu = series[0];
                } else {
                    ct.data.serverCpu = {};
                }
                var cpuData = [[], [], []];
                if (angular.isArray(ct.data.serverCpu.columnData)) {
                    var labels = [];
                    angular.forEach(ct.data.serverCpu.columnData, function (item, key) {
                        labels.push(new Date(item['time']));
                        cpuData[0].push(item['max_usage_active']);
                        cpuData[1].push(item['mean_usage_active']);
                        cpuData[2].push(item['min_usage_active']);
                    });
                    ct.lineChartCpu.labels = labels;
                    delete(ct.lineChartCpu.options.scales.yAxes);
                } else {
                    ct.lineChartCpu.labels = angular.copy(ct.lineChartLabels);
                    ct.lineChartCpu.options.scales.yAxes = [{ ticks: { min : 0, max : 100, stepSize: 20 } }];
                    angular.forEach(ct.lineChartCpu.labels, function (time, key) {
                        cpuData[0].push(null);
                        cpuData[1].push(null);
                        cpuData[2].push(null);
                    });
                }
                $timeout(function () {
                    ct.lineChartCpu.data = cpuData;
                }, 100);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverCpuDataLoad = true;
                ct.loadingComputeMonitoring = false;
                ct.fn.instanceMonitLoadCheck();
            });
        };

        ct.lineChartMem = {};
        ct.lineChartMem.options = {
            elements: { line: { tension: 0, spanGaps: true }, point: { radius: 0, spanGaps: true } },
            scales: {
                yAxes: [{ ticks: { min : 0, max : 100, stepSize: 20 } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };
        ct.lineChartMem.series = ['Max', 'Age', 'Min'];
        ct.lineChartMem.colors = [
            { borderColor: "rgba(183,93,218,1)", backgroundColor: "rgba(183,93,218,0.2)", fill: true, },
            { borderColor: "rgba(22,87,218,1)", backgroundColor: "rgba(22,87,218,0.2)", fill: true, },
            { borderColor: "rgba(1,160,206,1)", backgroundColor: "rgba(1,160,206,0.2)", fill: true, }
        ];
        ct.lineChartMem.labels = [];
        ct.lineChartMem.data = [[], [], []];

        // 서버 Memory
        ct.fn.getServerMemData = function() {
            ct.loadingComputeMonitoring = true;
            var params = {
                urlPaths: {
                    server_type: "vm",
                    server_uuid: ct.data.instanceId
                },
                time_step : ct.selPeriod + "m",
                start_time : ct.selTimeRange + "h"
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_mem/{server_type}/{server_uuid}/used_step', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                var series = ct.fn.getTimeColumnSeries(data);
                if (series && series.length > 0) {
                    ct.data.serverMem = series[0];
                } else {
                    ct.data.serverMem = {};
                }
                var memData = [[], [], []];
                if (angular.isArray(ct.data.serverMem.columnData)) {
                    var labels = [];
                    angular.forEach(ct.data.serverMem.columnData, function (item, key) {
                        labels.push(new Date(item['time']));
                        memData[0].push(item['max_used_percent']);
                        memData[1].push(item['mean_used_percent']);
                        memData[2].push(item['min_used_percent']);
                    });
                    ct.lineChartMem.labels = labels;
                    delete(ct.lineChartMem.options.scales.yAxes);
                } else {
                    ct.lineChartMem.labels = angular.copy(ct.lineChartLabels);
                    ct.lineChartMem.options.scales.yAxes = [{ ticks: { min : 0, max : 100, stepSize: 20 } }];
                    angular.forEach(ct.lineChartMem.labels, function (time, key) {
                        memData[0].push(null);
                        memData[1].push(null);
                        memData[2].push(null);
                    });
                }
                $timeout(function () {
                    ct.lineChartMem.data = memData;
                }, 100);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverMemDataLoad = true;
                ct.loadingComputeMonitoring = false;
                ct.fn.instanceMonitLoadCheck();
            });
        };

        ct.lineChartDisk = {};
        ct.lineChartDisk.options = {
            elements: { line: { tension: 0, spanGaps: true }, point: { radius: 0, spanGaps: true } },
            scales: {
                yAxes: [{ ticks: { min : 0, max : 100, stepSize: 20 } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };

        ct.lineChartDisk.series = [];
        ct.lineChartDisk.colors = [];
        ct.lineChartDisk.labels = [];
        ct.lineChartDisk.data = [];

        // 서버 Disk
        ct.fn.getServerDiskData = function() {
            ct.loadingComputeMonitoring = true;
            var params = {
                urlPaths: {
                    server_type: "vm",
                    server_uuid: ct.data.instanceId
                },
                time_step : ct.selPeriod + "m",
                start_time : ct.selTimeRange + "h"
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_disk/{server_type}/{server_uuid}/used_step', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.data.serverDiskSeries = ct.fn.getTimeColumnSeries(data);
                ct.lineChartDisk.series = [];
                ct.lineChartDisk.colors = [];
                var diskData = [];
                if (ct.data.serverDiskSeries && ct.data.serverDiskSeries.length > 0 && ct.data.serverDiskSeries != null) {
                    var labels = [];
                    angular.forEach(ct.data.serverDiskSeries, function (cData, ckey) {
                        ct.lineChartDisk.series[ckey] = cData.tags.device;
                        ct.lineChartDisk.colors[ckey] = angular.copy(ct.lineChartColors[ckey]);
                        diskData[ckey] = [];
                        if (angular.isArray(cData.columnData)) {
                            angular.forEach(cData.columnData, function (item, key) {
                                if (ckey == 0) {
                                    labels.push(new Date(item['time']));
                                }
                                diskData[ckey].push(item['used_percent']);
                            });
                        }
                    });
                    ct.lineChartDisk.labels = labels;
                    //delete(ct.lineChartDisk.options.scales.yAxes);
                } else {
                    ct.lineChartDisk.series.push("Device");
                    ct.lineChartDisk.colors.push(angular.copy(ct.lineChartColors[0]));
                    ct.lineChartDisk.labels = angular.copy(ct.lineChartLabels);
                    ct.lineChartDisk.options.scales.yAxes = [{ ticks: { min : 0, max : 100, stepSize: 20 } }];
                    diskData[0] = [];
                    angular.forEach(ct.lineChartDisk.labels, function (time, key) {
                        diskData[0].push(null);
                    });
                }
                $timeout(function () {
                    ct.lineChartDisk.data = diskData;
                }, 100);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverDiskDataLoad = true;
                ct.loadingComputeMonitoring = false;
                ct.fn.instanceMonitLoadCheck();
            });
        };

        ct.lineChartNetBytesRecv = {};
        ct.lineChartNetBytesRecv.series = [];
        ct.lineChartNetBytesRecv.colors = [];
        ct.lineChartNetBytesRecv.labels = [];
        ct.lineChartNetBytesRecv.options = {
            elements: { line: { tension: 0 }, point: { radius: 0 } },
            scales: {
                //yAxes: [{ ticks: { min : 0, } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };
        ct.lineChartNetBytesRecv.data = [];

        ct.lineChartNetBytesSent = {};
        ct.lineChartNetBytesSent.series = [];
        ct.lineChartNetBytesSent.colors = [];
        ct.lineChartNetBytesSent.labels = [];
        ct.lineChartNetBytesSent.options = {
            elements: { line: { tension: 0 }, point: { radius: 0 } },
            scales: {
                yAxes: [{ ticks: { min : 0 } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };
        ct.lineChartNetBytesSent.data = [];

        ct.lineChartNetPacketsRecv = {};
        ct.lineChartNetPacketsRecv.series = [];
        ct.lineChartNetPacketsRecv.colors = [];
        ct.lineChartNetPacketsRecv.labels = [];
        ct.lineChartNetPacketsRecv.options = {
            elements: { line: { tension: 0 }, point: { radius: 0 } },
            scales: {
                //yAxes: [{ ticks: { min : 0 } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };
        ct.lineChartNetPacketsRecv.data = [];

        ct.lineChartNetPacketsSent = {};
        ct.lineChartNetPacketsSent.series = [];
        ct.lineChartNetPacketsSent.colors = [];
        ct.lineChartNetPacketsSent.labels = [];
        ct.lineChartNetPacketsSent.options = {
            elements: { line: { tension: 0 }, point: { radius: 0 } },
            scales: {
                //yAxes: [{ ticks: { min : 0, max : 100, stepSize: 20 } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };
        ct.lineChartNetPacketsSent.data = [];

        // 서버 Network
        ct.fn.getServerNetData = function() {
            ct.loadingComputeMonitoring = true;
            var params = {
                urlPaths: {
                    server_type: "vm",
                    server_uuid: ct.data.instanceId
                },
                time_step : ct.selPeriod + "m",
                start_time : ct.selTimeRange + "h"
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_net/{server_type}/{server_uuid}/used_step', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.data.serverNetSeries = ct.fn.getTimeColumnSeries(data);

                var netSeries = [];
                var netColors = [];
                var netLabels = [];

                var netBytesRecvData = [];
                var netBytesSentData = [];
                var netPacketsRecvData = [];
                var netPacketsSentData = [];

                if (ct.data.serverNetSeries && ct.data.serverNetSeries.length > 0) {
                    angular.forEach(ct.data.serverNetSeries, function (cData, ckey) {
                        netSeries[ckey] = cData.tags.interface;
                        netColors[ckey] = angular.copy(ct.lineChartColors[ckey]);

                        netBytesRecvData[ckey] = [];
                        netBytesSentData[ckey] = [];
                        netPacketsRecvData[ckey] = [];
                        netPacketsSentData[ckey] = [];

                        if (angular.isArray(cData.columnData)) {
                            angular.forEach(cData.columnData, function (item, key) {
                                if (key > 0) {
                                    if (ckey == 0) {
                                        netLabels.push(new Date(item['time']));
                                    }
                                    var prvKey = key - 1;
                                    var bytes_recv = null;
                                    var bytes_sent = null;
                                    var packets_recv = null;
                                    var packets_sent = null;
                                    if (angular.isObject(cData.columnData[prvKey]) && angular.isObject(cData.columnData[key])) {
                                        if (cData.columnData[prvKey]['bytes_recv'] != null && angular.isDefined(cData.columnData[prvKey]['bytes_recv'])
                                            && cData.columnData[key]['bytes_recv'] != null && angular.isDefined(cData.columnData[key]['bytes_recv'])) {
                                            bytes_recv = cData.columnData[key]['bytes_recv'] - cData.columnData[prvKey]['bytes_recv'];
                                        }
                                        if (cData.columnData[prvKey]['bytes_sent'] != null && angular.isDefined(cData.columnData[prvKey]['bytes_sent'])
                                            && cData.columnData[key]['bytes_sent'] != null && angular.isDefined(cData.columnData[key]['bytes_sent'])) {
                                            bytes_sent = cData.columnData[key]['bytes_sent'] - cData.columnData[prvKey]['bytes_sent'];
                                        }
                                        if (cData.columnData[prvKey]['packets_recv'] != null && angular.isDefined(cData.columnData[prvKey]['packets_recv'])
                                            && cData.columnData[key]['packets_recv'] != null && angular.isDefined(cData.columnData[key]['packets_recv'])) {
                                            packets_recv = cData.columnData[key]['packets_recv'] - cData.columnData[prvKey]['packets_recv'];
                                        }
                                        if (cData.columnData[prvKey]['packets_sent'] != null && angular.isDefined(cData.columnData[prvKey]['packets_sent'])
                                            && cData.columnData[key]['packets_sent'] != null && angular.isDefined(cData.columnData[key]['packets_sent'])) {
                                            packets_sent = cData.columnData[key]['packets_sent'] - cData.columnData[prvKey]['packets_sent'];
                                        }
                                    }
                                    netBytesRecvData[ckey].push(bytes_recv);
                                    netBytesSentData[ckey].push(bytes_sent);
                                    netPacketsRecvData[ckey].push(packets_recv);
                                    netPacketsSentData[ckey].push(packets_sent);
                                }
                            });
                        }
                    });
                    delete(ct.lineChartNetBytesRecv.options.scales.yAxes);
                    delete(ct.lineChartNetBytesSent.options.scales.yAxes);
                    delete(ct.lineChartNetPacketsRecv.options.scales.yAxes);
                    delete(ct.lineChartNetPacketsSent.options.scales.yAxes);
                } else {
                    netSeries.push("Interface");
                    netColors.push(angular.copy(ct.lineChartColors[0]));
                    netLabels = angular.copy(ct.lineChartLabels);
                    ct.lineChartNetBytesRecv.options.scales.yAxes = [{ ticks: { min : 0 } }];
                    ct.lineChartNetBytesSent.options.scales.yAxes = [{ ticks: { min : 0 } }];
                    ct.lineChartNetPacketsRecv.options.scales.yAxes = [{ ticks: { min : 0 } }];
                    ct.lineChartNetPacketsSent.options.scales.yAxes = [{ ticks: { min : 0 } }];
                    netBytesRecvData[0] = [];
                    netBytesSentData[0] = [];
                    netPacketsRecvData[0] = [];
                    netPacketsSentData[0] = [];
                    angular.forEach(netLabels, function (time, key) {
                        netBytesRecvData[0].push(null);
                        netBytesSentData[0].push(null);
                        netPacketsRecvData[0].push(null);
                        netPacketsSentData[0].push(null);
                    });
                }

                $timeout(function () {
                    ct.lineChartNetBytesRecv.series = angular.copy(netSeries);
                    ct.lineChartNetBytesSent.series = angular.copy(netSeries);
                    ct.lineChartNetPacketsRecv.series = angular.copy(netSeries);
                    ct.lineChartNetPacketsSent.series = angular.copy(netSeries);

                    ct.lineChartNetBytesRecv.colors = angular.copy(netColors);
                    ct.lineChartNetBytesSent.colors = angular.copy(netColors);
                    ct.lineChartNetPacketsRecv.colors = angular.copy(netColors);
                    ct.lineChartNetPacketsSent.colors = angular.copy(netColors);

                    ct.lineChartNetBytesRecv.labels = angular.copy(netLabels);
                    ct.lineChartNetBytesSent.labels = angular.copy(netLabels);
                    ct.lineChartNetPacketsRecv.labels = angular.copy(netLabels);
                    ct.lineChartNetPacketsSent.labels = angular.copy(netLabels);

                    ct.lineChartNetBytesRecv.data = netBytesRecvData;
                    ct.lineChartNetBytesSent.data = netBytesSentData;
                    ct.lineChartNetPacketsRecv.data = netPacketsRecvData;
                    ct.lineChartNetPacketsSent.data = netPacketsSentData;
                }, 100);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
                ct.loadingComputeMonitoring = false;
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverNetDataLoad = true;
                ct.loadingComputeMonitoring = false;
                ct.fn.instanceMonitLoadCheck();
            });
        };

        ct.fn.instanceMonitLoadCheck = function () {
            if (ct.serverCpuDataLoad && ct.serverMemDataLoad && ct.serverDiskDataLoad && ct.serverNetDataLoad) {
                $timeout(function () {
                    $('#instance_monitoring_panel.scroll-pane').jScrollPane({});
                }, 100);
                $scope.main.loadingMainBody = false;
            }
        };

        ct.fn.changeSltInfoTab = function (sltInfoTab) {
            if (!sltInfoTab) {
                sltInfoTab = 'actEvent';
                ct.sltInfoTab = sltInfoTab;
            } else {
                if (ct.sltInfoTab != sltInfoTab) {
                    ct.sltInfoTab = sltInfoTab;
                    if (sltInfoTab == 'bootLog') {
                        $timeout(function() {
                            ct.fn.systemTerminalResize(170, 20);
                        }, 100);
                    } else if (sltInfoTab == 'sysEvent') {
                        ct.fn.listEventHistory(1, 1000);
                    } else if (sltInfoTab == 'sysLog') {
                        ct.fn.listSystemLog("1d", 1, 1000);
                    } else if (sltInfoTab == 'insMonit') {
                        $scope.main.loadingMainBody = true;
                        ct.serverCpuDataLoad = false;
                        ct.serverMemDataLoad = false;
                        ct.serverDiskDataLoad = false;
                        ct.serverNetDataLoad = false;
                        ct.lineChartLabels = ct.fn.getChartTimeLabels(ct.selPeriod + "m", ct.selTimeRange + "h");
                        ct.fn.getServerCpuData();
                        ct.fn.getServerMemData();
                        ct.fn.getServerDiskData();
                        ct.fn.getServerNetData();
                    } else if (sltInfoTab == 'systemLog') {
                    } else if (sltInfoTab == 'virtualMonit') {
                    } else if (sltInfoTab == 'alarmEvent') {
                    } else if (sltInfoTab == 'swInfo') {
                    } else if (sltInfoTab == 'swMonit') {
                    }
                }
            }
        };

        ct.changeTimestamp = function () {
            ct.lineChartLabels = ct.fn.getChartTimeLabels(ct.selPeriod + "m", ct.selTimeRange + "h");
            ct.fn.getServerCpuData();
            ct.fn.getServerMemData();
            ct.fn.getServerDiskData();
            ct.fn.getServerNetData();
        };

        if(ct.data.tenantId) {
            ct.fn.getInstanceInfo();
            ct.fn.getNowServerCpuUsedData("10m");
            ct.fn.getNowServerMemoryUsedData("10m");
            ct.fn.getNowServerDiskUsedData("10m");
            ct.fn.changeSltInfoTab();
        }
    }) 
    .controller('gpuComputeEditFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("computeDetailControllers.js : gpuComputeEditFormCtrl", 1);
        
        var pop = this;

        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.serverMainLists = angular.copy($scope.contents.serverMainList);
        pop.fn = {};
        pop.formName = $scope.dialogOptions.formName;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        if ($scope.contents.instance == undefined) {
            pop.instance = $scope.dialogOptions.instance;
            pop.instance.tenantId = pop.userTenant.tenantId;
            pop.instance.changeName = $scope.dialogOptions.instance.name;
        } else {
            pop.instance = $scope.contents.instance;
        }
        pop.serverNameList = [];

        $scope.dialogOptions.title 		= "이름 변경";
        $scope.dialogOptions.okName 	    = "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/computeEditForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/compute/computeEditForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;

        for (var i = 0; i < pop.serverMainLists.length; i++) {
            pop.serverNameList.push(pop.instance.name);
        }

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;

            $scope.actionBtnHied = true;

            if (pop.serverNameList.indexOf(pop.instance.changeName) > -1) {
                $scope.actionBtnHied = false;
                return common.showAlert("이미 사용중인 이름 입니다.");
            }

            pop.fn.changeInstance();
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        //인스턴스 상세 정보 변경
        pop.fn.changeInstance = function() {
            /* detail 페이지와 팝업창의 인스턴스 이름 동기화 방지를 위함.*/
            pop.instance.name = pop.instance.changeName;
            var param = {
                instance : pop.instance
            };
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'PUT', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'PUT', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.replacePage();
                common.mdDialogHide();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("수정되었습니다");
            });
            returnPromise.error(function (data, status, headers) {
                common.mdDialogHide();
                $scope.main.loadingMainBody = false;
                common.showAlertError("실패하였습니다");
            });
            returnPromise.finally(function() {
                common.mdDialogHide();
                $scope.main.loadingMainBody = false;
            });
        };

    })
    // .controller('iaasComputeDomainFormCtrl', function($scope, common, ValidationService, CONSTANTS) {
    .controller('gpuComputeDomainFormCtrl', function($scope, common, ValidationService, CONSTANTS) {
        // _DebugConsoleLog("computeDetailControllers.js : iaasComputeDomainFormCtrl", 1);
        _DebugConsoleLog("computeDetailControllers.js : gpuComputeDomainFormCtrl", 1);

        var pop = this;
        var vs = new ValidationService();
        var ct = common.getMainContentsCtrlScope().contents;

        pop.instance = angular.copy(ct.instance);
        pop.instanceIndex = angular.copy(ct.selectInstanceIndex);

        $scope.actionLoading = false;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);

        pop.data = {};
        pop.data.protocolType = "http";
        pop.data.sslUsed = true;

        pop.formName = "domainForm";
        pop.title = "도메인 연결";
        pop.domainList = [];
        pop.domainListByType = [];

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.actionBtnHied = false;
        pop.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            pop.connectDomain();
            $scope.main.asideClose();
        };

        pop.formClose = function(){
            $(".aside").stop().animate({"right":"-360px"}, 400);
        };

        // 전체 도메인 리스트 조회
        pop.getUnusedDomainList = function() {
            $scope.main.loadingMainBody = true;
            var param = {tenantId:pop.userTenant.id};
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/tenant/unusing', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/domain/tenant/unusing', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                pop.domainList = data.content;
                pop.changeProtocolType();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 프로토콜에 따른 도메인 리스트 조회
        pop.changeProtocolType = function() {
            pop.domainListByType = [];
            for (var i = 0; i < pop.domainList.length; i++) {
                switch (pop.data.protocolType) {
                    case 'http': if (pop.domainList[i].unusingHttp) { pop.domainListByType.push(pop.domainList[i]) } break;
                    case 'mysql': if (pop.domainList[i].unusingMysql) { pop.domainListByType.push(pop.domainList[i]) } break;
                    case 'rdp': if (pop.domainList[i].unusingRdp) { pop.domainListByType.push(pop.domainList[i]) } break;
                }
            }
        };

        // 도메인 연결
        pop.connectDomain = function(domain) {
            $scope.main.loadingMainBody = true;
            var param = {
                "tenantId": pop.userTenant.id,
                "instanceId": pop.instance.id,
                "floatingIp": pop.instance.floatingIp,
                "domainId": pop.data.domainId,
                "protocolType": pop.data.protocolType,
                "sourcePort": pop.data.sourcePort,
                "sslUsed": pop.data.sslUsed,
                "sslSourcePort": pop.data.sslSourcePort
            };

            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain', 'POST', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/domain', 'POST', param);
            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess("도메인이 연결되었습니다.");
                ct.fn.getInstanceInfo();
                $scope.actionBtnHied = false;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        };

        pop.getUnusedDomainList();
    })
    // .controller('iaasComputeSnapshotFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuComputeSnapshotFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("computeDetailControllers.js : iaasComputeSnapshotFormCtrl", 1);
        _DebugConsoleLog("computeDetailControllers.js : gpuComputeSnapshotFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        
        var pop = this;
        $scope.actionLoading = false;

        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.instance = angular.copy($scope.contents.selectInstance);
        
        pop.fn = {};
        pop.formName = "createSnapshotForm";
        pop.title = "인스턴스 스냅샷 생성";
        
        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.actionBtnHied = false;
        pop.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            pop.checkByte = $bytes.lengthInUtf8Bytes(pop.data.description);
        	if(pop.checkByte > 255){
                $scope.actionBtnHied = false;
        		return;
        	}
        	
            pop.fn.createSnapshot();
        };

        pop.fn.createSnapshot = function() {
            $scope.main.loadingMainBody = true;
            $scope.main.asideClose();
            pop.data.tenantId = pop.userTenant.id;
            pop.data.instanceId = pop.instance.id;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'POST', {instanceSnapShot:pop.data});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshot', 'POST', {instanceSnapShot:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("생성 되었습니다.");
                // $scope.main.goToPage('/iaas/compute/snapshot');
                $scope.main.goToPage('/gpu/compute/snapshot');
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

        pop.fn.checkByte = function (text, maxValue){
        	pop.checkByte = $bytes.lengthInUtf8Bytes(text);
        }
    })
    // .controller('iaasComputeVolumePopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuComputeVolumePopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("computeDetailControllers.js : iaasComputeVolumePopFormCtrl", 1);
        _DebugConsoleLog("computeDetailControllers.js : gpuComputeVolumePopFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        
        var pop = this;
        var ct = $scope.contents;
        $scope.actionLoading = false;

        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        
        pop.fn = {};
        pop.formName = "computeVolumeForm";
        pop.title = "볼륨 연결";

      //디스크 리스트 조회
        pop.fn.getVolumeList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : "status",
                conditionValue : "available"
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param , 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.volumeList = data.content.volumes;
            });
            $scope.main.loadingMainBody = false;
            returnPromise.error(function (data, status, headers) {
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //인스턴스 디스크 셋팅
        pop.fn.setInstanceVolume = function(volume) {
            pop.volume = volume;
        };

        //인스턴스 디스크 추가
        pop.fn.addInstanceVolume = function() {
            var param = {
                instanceId : $scope.contents.selectInstance.id,
                tenantId : $scope.contents.data.tenantId,
                volumeId : pop.volume.volumeId
            };
            $scope.main.loadingMainBody = true;
            $scope.main.asideClose();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceAttach', 'POST', {volumeAttach : param});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/instanceAttach', 'POST', {volumeAttach : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("볼륨이 추가 되었습니다.");
            	$scope.contents.fn.searchInstanceVolumeList();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.getVolumeList();

    })
    .controller('gpuComputePublicIpSearchFormCtrl', function ($scope, $location, $state, $sce,$q,$translate, $stateParams, $mdDialog, $filter, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("deployServerControllers.js : gpuComputePublicIpSearchFormCtrl", 1);

        var pop = this;
        var vs = new ValidationService();
        var ct = common.getMainContentsCtrlScope().contents;

        pop.instance = angular.copy(ct.selectInstance);
        pop.instanceIndex = angular.copy(ct.selectInstanceIndex);

        $scope.actionLoading = false;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);

        pop.fn = {};
        pop.data = {};
        pop.roles = [];

        pop.floatingIp = {};
        pop.selectFloatingIp = '';

        pop.formName = "publicIpForm";
        pop.title = "접속 IP 설정";

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.actionBtnHied = false;
        pop.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            pop.fn.ipConnectionSet();
            $scope.main.asideClose();
        };

        pop.fn.formClose = function(){
            $(".aside").stop().animate({"right":"-360px"}, 400);
        };

        //공인아이피 리스트 조회
        pop.fn.getPublicIpList = function() {
            pop.floatingIpsList = [];
            $scope.main.loadingMainBody = true;
            var param = {tenantId:pop.userTenant.id,queryType:'list'};
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/floatingIps', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.tenantName = pop.userTenant.tenantName;
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    pop.floatingIpsList = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        // IP 신규 할당
        pop.fn.publicIpAllocate = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.userTenant.id,
                action : "allocate"
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'POST', param , 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/floatingIps', 'POST', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess("IP가 할당 되었습니다.");
                pop.fn.getPublicIpList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 공인 IP 연결 펑션
        pop.fn.ipConnectionSet = function() {
            $scope.main.loadingMainBody = true;

            var instanceId;

            if(pop.instance){
                instanceId = pop.instance.id;
            }else{
                instanceId = ct.data.instanceId;
            }

            var param = {
                urlParams : {
                    tenantId : ct.data.tenantId,
                    instanceId : instanceId,
                    floatingIp : pop.selectFloatingIp,
                    action : "attach"
                }
            };

            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/network/floatingIp', 'POST', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if(ct && ct.fn && ct.fn.getInstanceInfo){
                    ct.instance.floatingIp = pop.selectFloatingIp;
                    ct.fn.getInstanceInfo();
                } else {
                    if (pop.instanceIndex) {
                        if (ct.deployServerList && ct.deployServerList[pop.instanceIndex]) {
                            ct.deployServerList[pop.instanceIndex].floatingIp = pop.floatingIp.floatingIp;
                        }
                    } else {
                        if (ct.fnGetServerMainList) {
                            ct.fnGetServerMainList();
                        }
                    }
                }
                common.showAlertSuccess("접속 IP가 설정 되었습니다.");
            });
            returnPromise.error(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        };

        pop.fn.getPublicIpList();
    })
    //////////////////////////////////////////////////////////////
    /////////20181120 sg0730 서버유형 변경 Pop 추가   ////////////////////
    //////////////////////////////////////////////////////////////
    .controller('gpuComputePopEditServerCtrl', function ($scope, $location, $state, $sce, $timeout, $stateParams,$filter,$q,$translate, $bytes, ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("computePopEditServerCtrl.js : gpuComputePopEditServerCtrl", 1);
        
        var pop = this;

        pop.formName 					= $scope.dialogOptions.formName;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        pop.instance 					= $scope.dialogOptions.instance;
        pop.instanceNm                  = pop.instance.name;
        pop.uuid                		= pop.instance.spec.uuid;

        pop.tenantId 					= pop.instance.tenantId;

        if (!pop.tenantId) {
            pop.tenantId = $scope.main.userTenantGpuId;
        }

        pop.colspan = pop.instance.spec.type == 'GPU' ? 7: 5;

        $scope.dialogOptions.title 		= "인스턴스 사양 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/compute/computePopEditServerForm.html" + _VersionTail();


        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.specList 					= [];
        pop.spec 						= {};
        $scope.dialogOptions.authenticate = true;

        pop.isSpecLoad = false;
        //스펙그룹의 스펙 리스트 조회
        pop.getSpecList = function() {
            pop.specList = [];
            pop.sltSpec = {};
            var params = {
                type: pop.instance.spec.type
            };

            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/spec', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.specs && data.content.specs.length > 0) {
                    pop.specList = data.content.specs;
                }
                pop.isSpecLoad = true;
                pop.setSpecMinDisabled();
                pop.setSpecMaxDisabled();
            });
            returnPromise.error(function (data, status, headers) {
                pop.isSpecLoad = true;
                pop.setSpecMinDisabled();
                pop.setSpecMaxDisabled();
                common.showAlertError(data.message);
            });
        };

        pop.setInstanceSpec = function(sltSpec) {
            if (!pop.specDisabledAllSetting || sltSpec.disabled) return;
        	if(pop.spec && sltSpec.uuid){
        		pop.sltSpec = angular.copy(sltSpec);
                pop.sltSpecUuid = sltSpec.uuid;
                $scope.dialogOptions.authenticate = false;
        	}else{
        		pop.sltSpec = {};
                pop.sltSpecUuid = "";
                $scope.dialogOptions.authenticate = true;
            }
        };

        // 디스크 생성 부분 추가 2018.11.13 sg0730
        pop.getTenantResource = function()  {
            var params = {
                tenantId : pop.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/used', 'GET', params);

            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0) {
                    pop.tenantResource = data.content[0];
                    pop.tenantResource.available = {};
                    pop.tenantResource.available.cores = pop.tenantResource.maxResource.cores - pop.tenantResource.usedResource.cores;
                    pop.tenantResource.available.ramSize = pop.tenantResource.maxResource.ramSize - pop.tenantResource.usedResource.ramSize;
                    pop.tenantResource.maxResource.volumeGigabytes = (pop.tenantResource.maxResource.hddVolumeGigabytes + pop.tenantResource.maxResource.ssdVolumeGigabytes);
                    pop.tenantResource.usedResource.volumeGigabytes = (pop.tenantResource.usedResource.hddVolumeGigabytes + pop.tenantResource.usedResource.ssdVolumeGigabytes);
                    pop.tenantResource.available.volumeGigabytes = pop.tenantResource.maxResource.volumeGigabytes - pop.tenantResource.usedResource.volumeGigabytes;
                    pop.tenantResource.available.hddVolumeGigabytes = pop.tenantResource.maxResource.hddVolumeGigabytes - pop.tenantResource.usedResource.hddVolumeGigabytes;
                    pop.tenantResource.available.ssdVolumeGigabytes = pop.tenantResource.maxResource.ssdVolumeGigabytes - pop.tenantResource.usedResource.ssdVolumeGigabytes;
                    pop.tenantResource.available.objectStorageGigaByte = pop.tenantResource.maxResource.objectStorageGigaByte - pop.tenantResource.usedResource.objectStorageGigaByte;
                    pop.setSpecMaxDisabled();
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

        // min spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        pop.isMinSpecDisabled = false;

        // spec loading 체크
        pop.specMinDisabledSetting = false;
        pop.specDisabledAllSetting = false;
        pop.setSpecMinDisabled = function () {
            if (pop.isSpecLoad) {
                angular.forEach(pop.specList, function (spec) {
                    if (spec.disk <= pop.instance.spec.disk || spec.ram <= pop.instance.spec.ram) {
                        spec.disabled = true;
                        pop.isMinSpecDisabled = true;
                    }
                });
                pop.specMinDisabledSetting = true;
                if(pop.specMaxDisabledSetting){
                    pop.specDisabledAllSetting = true;
                }
            }
        };

        // max spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        pop.isMaxSpecDisabled = false;

        // spec loading 체크
        pop.specMaxDisabledSetting = false;
        pop.setSpecMaxDisabled = function () {
            if (pop.isSpecLoad && pop.tenantResource && pop.tenantResource.maxResource &&  pop.tenantResource.usedResource) {
                angular.forEach(pop.specList, function (spec) {
                    if (spec.vcpus > pop.tenantResource.available.cores || spec.ram > pop.tenantResource.available.ramSize || spec.disk > pop.tenantResource.available.hddVolumeGigabytes) {
                        spec.disabled = true;
                        pop.isMaxSpecDisabled = true;
                    }
                });
                pop.specMaxDisabledSetting = true;
                if(pop.specMinDisabledSetting){
                    pop.specDisabledAllSetting = true;
                }
            }
        };

        pop.setSpecAllEnabled = function () {
            if (pop.specList && pop.specList.length && pop.specList.length > 0) {
                angular.forEach(pop.specList, function (spec) {
                    spec.disabled = false;
                });
            }
        };

        $scope.popDialogOk = function () {
            pop.updateServerFormAction();
        };
        
        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };
        
        // 서버사양 변경
        pop.updateServerFormAction = function () {
        	if (pop.btnClickCheck) return;
            pop.btnClickCheck = true;

            if (!pop.sltSpecUuid) {
                common.showAlertWarning("변경 할 사양을 선택 하십시오.");
                pop.btnClickCheck = false;
                return;
            }

            var param = {
                urlParams : {
                    instanceId : pop.instance.id,
                    tenantId   : pop.tenantId,
                    specId     : pop.sltSpecUuid
                }
            };
            common.mdDialogHide();
            $scope.main.loadingMain = true;
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/resize', 'POST', param );
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess("변경 되었습니다.");
                pop.btnClickCheck = false;
                if (angular.isFunction(pop.callBackFunction) ) {
                    pop.instance.uiTask = "resized";
                    pop.instance.vmState = "resized";
                    pop.callBackFunction(pop.instance);
                }
            });
            returnPromise.error(function (data, status, headers) {
                pop.btnClickCheck = false;
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
            });
        };

        pop.getTenantResource();
        pop.getSpecList();

    })
    //////////////////////////////////////////////////////////////
    .controller('gpuCreatePopSnapshotCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $timeout, $bytes,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("iaasCreatePopSnapshotCtrl.js : gpuCreatePopSnapshotCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.instance 					= $scope.dialogOptions.selectInstance;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "스냅샷 생성";
        $scope.dialogOptions.okName 	= "생성";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/compute/computeCreatePopSnapshotForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        
       // Dialog ok 버튼 클릭 시 액션 정의
        $scope.actionBtnHied = false;
        
        $scope.popDialogOk = function () {
        	 if ($scope.actionBtnHied) return;
             $scope.actionBtnHied = true;
             if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                 $scope.actionBtnHied = false;
                 return;
             }
             pop.fn.createSnapshot();
        };
        
        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };
       
        pop.fn.createSnapshot = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId 			= pop.userTenant.id;
            pop.data.instanceId 		= pop.instance.id;
            pop.data.disk               = pop.instance.spec.disk; // 사용량 체크를 위해 추가. by hrit 200923
            pop.data.type               = 'HDD';
            
            common.mdDialogHide();
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshot', 'POST', {instanceSnapShot:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                //생성이후 Callback처리 할지 아니면 페이지를 아예 이동 할지 정의후 제작성 필요. sg0730 20181120
                common.showAlertSuccess("생성 되었습니다.");
                $scope.main.goToPage('/gpu/snapshot');
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
    })
    ///////////////////////////////////////////////////////////////////////////////
    ///////////////2018.11.21 sg0730 도메인 등록 팝업////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////
    .controller('iaasPopConnDomainFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
    	_DebugConsoleLog("iaasPopConnDomainFormCtrl.js : iaasPopConnDomainFormCtrl", 1);
    	
    	var pop = this;
    	pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
    	pop.formMode 					= $scope.dialogOptions.formMode;
    	pop.fn 							= {};
    	pop.domain						= {};
        pop.orgDomain					= {};
        pop.orgDomainLinkInfo           = {};
    	pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
    	pop.instance 					= $scope.dialogOptions.instance;

        if (pop.formMode == "mod") {
            $scope.dialogOptions.title = "도메인 수정";
            $scope.dialogOptions.okName =  "수정";
            pop.orgDomainLinkInfo = angular.copy($scope.dialogOptions.domainLinkInfo);
            pop.domain.tenantId = pop.orgDomainLinkInfo.tenantId;
            pop.domain.instanceId = pop.orgDomainLinkInfo.instanceId;
            pop.domain.id = pop.orgDomainLinkInfo.id;
            pop.domain.domainId = pop.orgDomainLinkInfo.domainInfo.id;
            pop.domain.floatingIp = pop.instance.floatingIp;
            pop.domain.domain = pop.orgDomainLinkInfo.domainInfo.domain;
            pop.domain.sourcePort = pop.orgDomainLinkInfo.sourcePort;
            pop.domain.protocolType = pop.orgDomainLinkInfo.protocolType;
            pop.domain.sslUsed = false;
        } else {
            $scope.dialogOptions.title = "도메인 등록";
            $scope.dialogOptions.okName =  "등록";
            pop.domain.tenantId = pop.instance.tenantId;
            pop.domain.instanceId = pop.instance.id;
            pop.domain.floatingIp = pop.instance.floatingIp;
            pop.domain.sourcePort = 80;
            pop.domain.protocolType = "http";
            pop.domain.sslUsed = false;
        }

    	$scope.dialogOptions.closeName 	= "닫기";
    	// $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/computeCreatePopDomainForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/compute/computeCreatePopDomainForm.html" + _VersionTail();
    	
    	$scope.actionLoading 			= false;
    	pop.btnClickCheck 				= false;

        pop.fn.getBaseDomainList = function() {
            pop.baseDomains = [];
            var param = {};
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/baseDomain/all', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/baseDomain/all', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    pop.baseDomains = data.content;
                    if (pop.formMode == "mod") {
                        angular.forEach(pop.baseDomains, function (baseDomain) {
                            if (pop.domain.domain.indexOf(baseDomain.domain) > 0) {
                                pop.domain.baseDomain = baseDomain.domain;
                                pop.domain.subDomain = pop.domain.domain.substring(0, pop.domain.domain.indexOf(baseDomain.domain)-1);
                            }
                        });
                    } else {
                        pop.domain.baseDomain = pop.baseDomains[0].domain;
                    }
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.getDomainUsingList = function() {
            pop.usingDomainList = [];
            pop.usingDomainNames = [];
            var param = {};
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/all', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/domain/all', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    pop.usingDomainList = data.content;
                    angular.forEach(pop.usingDomainList, function (domain, key) {
                        pop.usingDomainNames.push(domain.domain);
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
        };

        pop.fn.subDomainCustomValidationCheck = function(subDomain) {
            if (subDomain && angular.isArray(pop.usingDomainNames) && pop.usingDomainNames.length > 0) {
                var domainName = subDomain + "." + pop.domain.baseDomain;
                if (pop.formMode == "mod") {
                    if (pop.orgDomainLinkInfo.domainInfo.domain != domainName && pop.usingDomainNames.indexOf(domainName) >= 0) {
                        return {isValid: false, message: "이미 사용중인 서브도메인 입니다."};
                    }
                } else {
                    if (pop.usingDomainNames.indexOf(domainName) >= 0) {
                        return {isValid: false, message: "이미 사용중인 서브도메인 입니다."};
                    }
                }
            }
            return {isValid : true};
        };

        pop.fn.systemPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
                return {isValid : true};
            } else {
                return {isValid : false, message: "포트범위는 [80, 443, 1024~65535] 입니다."};
            }
        };

        $scope.actionBtnHied = false;
    	$scope.popDialogOk = function () {
            pop.fn.actionDomain();
    	};
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};

        $scope.actionBtnHied = false;
    	pop.fn.actionDomain = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            pop.domain.domain =  pop.domain.subDomain + "." + pop.domain.baseDomain;

            if (pop.formMode == "mod") {
                if (pop.orgDomainLinkInfo.domainInfo.domain == pop.domain.domain && pop.orgDomainLinkInfo.sourcePort == pop.domain.sourcePort) {
                    $scope.actionBtnHied = false;
                    common.showAlertWarning("변경된 정보가 없습니다.");
                    return;
                }
            }

            $scope.main.loadingMainBody = true;
            var method = "POST";
            var params = {};
            params.tenantId 		= pop.domain.tenantId;
            params.instanceId 		= pop.domain.instanceId;
            if (pop.formMode == "mod") {
                method = "PUT";
                params.id = pop.domain.id;
                params.domainId = pop.domain.domainId;
            }
            params.domain = pop.domain.domain;
            params.floatingIp = pop.domain.floatingIp;
            params.sourcePort = pop.domain.sourcePort;
            params.protocolType = pop.domain.protocolType;
            params.sslUsed = pop.domain.sslUsed;

    		common.mdDialogHide();
    		
    		// var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain/service', method, params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/domain/service', method, params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (pop.formMode == "mod") {
                    common.showAlertSuccess("수정 되었습니다.");
                } else {
                    common.showAlertSuccess("생성 되었습니다.");
                }
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

    	};

        pop.fn.getBaseDomainList();
        pop.fn.getDomainUsingList();

    })
    // .controller('iaasComputeVolumeFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuComputeVolumeFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("computeDetailControllers.js : iaasComputeVolumeFormCtrl", 1);
        _DebugConsoleLog("computeDetailControllers.js : gpuComputeVolumeFormCtrl", 1);

        var pop 						= this;
        var ct 							= $scope.contents;
        pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
        pop.fn 							= {};
        // pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.instance 					= $scope.dialogOptions.selectInstance;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        //pop.formName 		= "computeVolumeForm";
        $scope.dialogOptions.title 		= "볼륨 연결";
        $scope.dialogOptions.okName 	= "연결";
    	$scope.dialogOptions.closeName 	= "닫기";
    	// $scope.dialogOptions.templateUrl= _IAAS_VIEWS_ + "/compute/computeServerConnVolPopForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl= _GPU_VIEWS_ + "/compute/computeServerConnVolPopForm.html" + _VersionTail();
    	$scope.actionLoading 			= false;
    	$scope.actionBtnHied = false;
        pop.volumeList = [];
        pop.sltVolume = {};
        pop.sltVolumeId = "";

        // 버튼 disabled
        $scope.dialogOptions.authenticate = true;

      //디스크 리스트 조회
        pop.isVolumeListLoad = false;
        pop.fn.getVolumeList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId       : ct.data.tenantId,
                conditionKey   : "status",
                conditionValue : "available"
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param , 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.volumeList = data.content.volumes;
                pop.isVolumeListLoad = true;
            });
           returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.isVolumeListLoad = true;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        //인스턴스 디스크 셋팅
        pop.fn.setInstanceVolume = function(volume) {
            if (volume.volumeAttachment && volume.volumeAttachment.instanceId) return;
            if (volume && volume.volumeId) {
                pop.sltVolume = angular.copy(volume);
                pop.sltVolumeId = volume.volumeId;
                $scope.dialogOptions.authenticate = false;
            } else {
                pop.sltVolume = {};
                pop.sltVolumeId = "";
                $scope.dialogOptions.authenticate = true;
            }
        };
        
        $scope.popDialogOk = function () {
        	pop.fn.addInstanceVolume();
    	};
    	
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};
        
        //인스턴스 디스크 추가
        $scope.actionBtnHied = false;
        pop.fn.addInstanceVolume = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
        	if (pop.sltVolume == false ) {
        		common.showAlertWarning('추가할 볼륨을 선택 하십시요.');
                $scope.actionBtnHied = false;
				return;
			}
            var param = {
                instanceId : pop.instance.id,
                tenantId : pop.userTenant.tenantId,
                volumeId : pop.sltVolume.volumeId
            };
            
            $scope.main.loadingMainBody = true;
            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceAttach', 'POST', {volumeAttach : param});
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/volume/instanceAttach', 'POST', {volumeAttach : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("볼륨이 추가 되었습니다.");
                if ( angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        pop.fn.getVolumeList();

    })
    // .controller('iaasPopPortForwardingFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
    .controller('gpuPopPortForwardingFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
        // _DebugConsoleLog("iaasPopConnDomainFormCtrl.js : iaasPopPortForwardingFormCtrl", 1);
        _DebugConsoleLog("iaasPopConnDomainFormCtrl.js : gpuPopPortForwardingFormCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.formMode 					= $scope.dialogOptions.formMode;
        pop.fn 							= {};
        pop.originPortForwardingInfo	= {};
        //pop.orgDomainLinkInfo           = {};
        pop.portForwarding              = {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        pop.instance 					= $scope.dialogOptions.instance;

        if (pop.formMode == "mod") {
            $scope.dialogOptions.title = "포트포워딩 수정";
            $scope.dialogOptions.okName =  "수정";
            pop.originPortForwardingInfo = angular.copy($scope.dialogOptions.portForwardingInfo);
            pop.portForwarding.instanceId = pop.originPortForwardingInfo.instanceId;
            pop.portForwarding.id = pop.originPortForwardingInfo.id;
            pop.portForwarding.targetPort = pop.originPortForwardingInfo.targetPort;
        } else {
            $scope.dialogOptions.title = "포트포워딩 등록";
            $scope.dialogOptions.okName =  "등록";
            pop.portForwarding.tenantId = pop.instance.tenantId;
            pop.portForwarding.instanceId = pop.instance.id;
            pop.portForwarding.targetIp = pop.instance.floatingIp;
        }

        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/computeCreatePopPortForwardingForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/compute/computeCreatePopPortForwardingForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;

        pop.fn.portForwardingValidationCheck = function(targetPort, id) {
            if (targetPort && angular.isArray(pop.instance.instancePortForwardings) && pop.instance.instancePortForwardings.length > 0) {
                if (pop.formMode == "mod") {
                    if (pop.originPortForwardingInfo.targetPort == pop.portForwarding.targetPort) {
                        return {isValid: false, message: "변경 내용이 없습니다."};
                    }
                    var obj = common.objectsFindCopyByField(pop.instance.instancePortForwardings, "targetPort", targetPort);
                    if (obj != null && obj.id != id) {
                        return {isValid: false, message: "이미 사용중인 포트 입니다."};
                    }
                } else {
                    var obj = common.objectsFindCopyByField(pop.instance.instancePortForwardings, "targetPort", targetPort);
                    if (obj != null) {
                        return {isValid: false, message: "이미 사용중인 포트 입니다."};
                    }
                }
            }
            return {isValid : true};
        };

        pop.fn.systemPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
                return {isValid : true};
            } else {
                return {isValid : false, message: "포트범위는 [80, 443, 1024~65535] 입니다."};
            }
        };

        $scope.actionBtnHied = false;
        $scope.popDialogOk = function () {
            pop.fn.actionPortForwarding();
        };
        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        $scope.actionBtnHied = false;
        pop.fn.actionPortForwarding = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var method = "POST";
            var params = pop.portForwarding;
            params.targetPort = pop.portForwarding.targetPort;
            if (pop.formMode == "mod") {
                method = "PUT";
            }

            $scope.main.loadingMainBody = true;
            common.mdDialogHide();

            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/portForwarding/service', method, params, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance/portForwarding/service', method, params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (pop.formMode == "mod") {
                    common.showAlertSuccess("수정 되었습니다.");
                } else {
                    common.showAlertSuccess("생성 되었습니다.");
                }
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

        };
    })
;
