'use strict';

angular.module('iaas.controllers')
    .controller('iaasComputeDetailCtrl', function ($scope, $location, $state, $sce,$q, $stateParams, $timeout, $window, $mdDialog, $filter, $bytes, $translate, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeDetailControllers.js : iaasComputeDetailCtrl", 1);

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
        ct.volumeRoles = [];
        ct.consoleLogLimit = 50 ;
        ct.actionLogLimit = 5;
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
        ct.data.instanceId = $stateParams.instanceId;
        ct.viewType = 'instance';
        if ($scope.main.stateKey == "iaasDeployServerComputeDetail") {
            ct.viewType = 'deploy';
        }
        ct.sltInfoTab = 'actEvent';
        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);

        ct.rdpBaseDomain = CONSTANTS.rdpConnect.baseDomain;
        ct.rdpConnectPort = CONSTANTS.rdpConnect.port;

        ct.computeEditFormOpen = function (){
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeEditForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        }

        //20181120 sg0730  서버사양변경 PopUp 추가
        ct.computePopEditServerForm = function ($event) {
        
        	 var dialogOptions = {
                     controller : "iaasComputePopEditServerCtrl" ,
                     formName   : 'iaasComputePopEditServerForm',
                     instance : angular.copy(ct.instance),
                     callBackFunction : ct.reflashCallBackFunction
                 };
                 $scope.actionBtnHied = false;
                 common.showDialog($scope, $event, dialogOptions);
                 $scope.actionLoading = true; // action loading
        };
        
      //sg0730 차후 서버 이미지 생성 후 페이지 이동.
        ct.reflashCallBackFunction = function () 
        {
        	 $scope.main.goToPage('/iaas/compute');
        	
        	/*if(ct.data.tenantId) {
                ct.fn.getInstanceInfo();
                ct.fn.changeSltInfoTab();
            }*/
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
        
        //sg0730 차후 서버 이미지 생성 후 페이지 이동.
        ct.reflashSnapShotCallBackFunction = function () 
        {
        	 $scope.main.goToPage('/iaas/compute');
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
        ct.doughnut.labels = ['남은 쿼터', '다른 인스턴스 사용', '현재 인스턴스 사용'];

        ct.doughnut.colors = {};
        ct.doughnut.colors.cpu = ["rgba(199,143,220,.5)","rgba(183,93,218,.7)", "rgba(183,93,218,1)"];
        ct.doughnut.colors.ram = ["rgba(145,191,206,.5)","rgba(1,160,206,.7)", "rgba(1,160,206,1)"];
        ct.doughnut.colors.disk = ["rgba(143,171,234,.5)","rgba(22,87,218,.7)", "rgba(22,87,218,1)"];

        ct.doughnut.data = {};
        ct.doughnut.data.cpu = [1, 0, 0];
        ct.doughnut.data.ram = [1, 0, 0];
        ct.doughnut.data.disk = [1, 0, 0];

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
            $scope.main.goToPage("/iaas");
        });

        ct.fn.getUsedResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
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
                common.showAlertError(data.message);
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

        //인스턴스 상세 정보 조회
        ct.fn.getInstanceInfo = function(action) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId,
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if(data.content.instances.length == 1) {
                    if(data.content.instances[0].powerState == "deleted"){
                        common.showAlertWarning('삭제된 인스턴스입니다.');
                        $window.history.back();
                    }

                    ct.instance = data.content.instances[0];
                    ct.fn.setRdpConnectDomain(ct.instance);
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

                    ct.fn.getUsedResource();
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

       /* // 도메인 연결 버튼
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
            			controller       : "iaasPopConnDomainFormCtrl" ,
            			formName         : 'iaasPopConnDomainForm',
            			callBackFunction : ct.refalshDomainCallBackFunction
            	};
            	$scope.actionBtnHied = false;
            	common.showDialog($scope, $event, dialogOptions);
            	$scope.actionLoading = true; // action loading
               
            
        };
        
        // sg0730 차후 callback 처리 고민.
        ct.refalshDomainCallBackFunction = function () {
        	//ct.fn.changeSltInfoTab('domain');
        	ct.fn.changeSltInfoTab();
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain', 'DELETE', {instanceDomainLinkId:domain.id});
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
                common.showConfirm('메세지',instance.name +' 서버를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "STOP") {
                common.showConfirm('메세지',instance.name +' 서버를 종료하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('메세지',instance.name +' 서버를 재시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop();
            } else if(action == "IPDISCONNECT"){
                common.showConfirm('메세지',instance.name +' 서버의 접속 IP를 해제하시겠습니까?').then(function(){
                    ct.fn.ipConnectionSet("detach");
                });
            }
        };

        ct.fn.getKeyFile = function(keypair,type) {
            document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $timeout(function () {
                    ct.fn.getInstanceInfo(action);
                }, 1500);
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
                common.showAlertWarning('서버를 종료 후 생성가능합니다.');
                //common.showAlert('메세지','서버를 종료 후 생성가능합니다.');
                return;
            } else {
                ct.selectInstance = instance;
                $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instance', 'GET', param, 'application/x-www-form-urlencoded');
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
            common.showConfirm('디스크 반환','※'+volume.volumeName+' 디스크을 반환 합니다. 반환된 디스크에 대한 관리는 스토리지 관리에서 가능합니다').then(function(){
                ct.fn.restorationVolume(volume);
            });
        };

        //디스크 반환 job
        ct.fn.restorationVolume = function(volume) {
            volume.tenantId = ct.data.tenantId;
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach:volume});
            returnPromise.success(function (data, status, headers) {
                ct.fn.searchInstanceVolumeList();
                common.showAlertSuccess("디스크이 반환 되었습니다.");
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
       /* ct.fn.createInstanceVolumePop = function(instance) {
            ct.selectInstance = instance;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeVolumeForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };*/
        
        //인스턴스 디스크 생성 팝업
        ct.fn.createInstanceVolumePop = function($event,instance) {
        	
        	///iaas/compute/detail/ct.data.instanceId
        	
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
        	 //$scope.main.goToPage('/iaas/compute');
        	ct.fn.getInstanceInfo();
            ct.fn.changeSltInfoTab();
        };
        

        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function() {
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
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
            ct.data.eventHistories == [];
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
                    }
                }
            }
        };

        if(ct.data.tenantId) {
            ct.fn.getInstanceInfo();
            ct.fn.changeSltInfoTab();
        }

    })
    .controller('iaasComputeSystemDetailCtrl', function ($scope, $location, $state, $sce,$q, $stateParams, $timeout, $window, $mdDialog, $filter, $bytes, $translate, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeDetailControllers.js : iaasComputeSystemDetailCtrl", 1);
        
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
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
        ct.data.instanceId = $stateParams.instanceId;
        ct.viewType = 'instance';
        if ($scope.main.stateKey == "iaasDeployServerComputeDetail") {
            ct.viewType = 'deploy';
        }
        ct.sltInfoTab = 'actEvent';
        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);

        ct.computeEditFormOpen = function (){
        	$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeEditForm.html" + _VersionTail();
			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        }
        
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
            $scope.main.goToPage("/iaas");
        });
        
        //인스턴스 상세 정보 조회
        ct.fn.getInstanceInfo = function(action) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : ct.data.instanceId,
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
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

            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeDomainForm.html" + _VersionTail();

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain', 'DELETE', {instanceDomainLinkId:domain.id});
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
                common.showConfirm('메세지',instance.name +' 서버를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "STOP") {
                common.showConfirm('메세지',instance.name +' 서버를 종료하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('메세지',instance.name +' 서버를 재시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance);
                });
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop();
            } else if(action == "IPDISCONNECT"){
            	common.showConfirm('메세지',instance.name +' 서버의 접속 IP를 해제하시겠습니까?').then(function(){
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
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
            	common.showAlertWarning('서버를 종료 후 생성가능합니다.');
                //common.showAlert('메세지','서버를 종료 후 생성가능합니다.');
                return;
            } else {
            	ct.selectInstance = instance;
            	$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.volumeAttaches && data.content.volumeAttaches.length > 0) {
                    ct.instanceVolList = data.content.volumeAttaches;
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
        }

        // 디스크 반환 버튼
        ct.fn.restorationConfirm = function(volume) {
            common.showConfirm('디스크 반환','※'+volume.volumeName+' 디스크을 반환 합니다. 반환된 디스크에 대한 관리는 스토리지 관리에서 가능합니다').then(function(){
                ct.fn.restorationVolume(volume);
            });
        };

        //디스크 반환 job
        ct.fn.restorationVolume = function(volume) {
            volume.tenantId = ct.data.tenantId;
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceDettach', 'POST', {volumeAttach:volume});
            returnPromise.success(function (data, status, headers) {
                ct.fn.searchInstanceVolumeList();
                common.showAlertSuccess("디스크이 반환 되었습니다.");
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
        ct.creInsVolPopCallBackFunction = function () 
        {
        	 //$scope.main.goToPage('/iaas/compute');
        	ct.fn.getInstanceInfo();
            ct.fn.changeSltInfoTab();
        };
        
        
        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function() {
        	$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
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
            ct.data.eventHistories == [];
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
            elements: { line: { tension: 0, spanGaps: true, }, point: { radius: 0, spanGaps: true, } },
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
                        time: { unit: 'minute' },
                    },
                }]
            },
        };
        ct.lineChartCpu.series = ['Max', 'Avg', 'Min'];
        ct.lineChartCpu.colors = [
            { borderColor: "rgba(183,93,218,1)", backgroundColor: "rgba(183,93,218,0.2)", fill: true, },
            { borderColor: "rgba(22,87,218,1)", backgroundColor: "rgba(22,87,218,0.2)", fill: true, },
            { borderColor: "rgba(1,160,206,1)", backgroundColor: "rgba(1,160,206,0.2)", fill: true, }
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
            elements: { line: { tension: 0, spanGaps: true, }, point: { radius: 0, spanGaps: true, } },
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
                        time: { unit: 'minute' },
                    },
                }]
            },
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
            elements: { line: { tension: 0, spanGaps: true, }, point: { radius: 0, spanGaps: true, } },
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
                        time: { unit: 'minute' },
                    },
                }]
            },
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
            elements: { line: { tension: 0, }, point: { radius: 0, } },
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
                        time: { unit: 'minute' },
                    },
                }]
            },
        };
        ct.lineChartNetBytesRecv.data = [];

        ct.lineChartNetBytesSent = {};
        ct.lineChartNetBytesSent.series = [];
        ct.lineChartNetBytesSent.colors = [];
        ct.lineChartNetBytesSent.labels = [];
        ct.lineChartNetBytesSent.options = {
            elements: { line: { tension: 0, }, point: { radius: 0, } },
            scales: {
                yAxes: [{ ticks: { min : 0, } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' },
                    },
                }]
            },
        };
        ct.lineChartNetBytesSent.data = [];

        ct.lineChartNetPacketsRecv = {};
        ct.lineChartNetPacketsRecv.series = [];
        ct.lineChartNetPacketsRecv.colors = [];
        ct.lineChartNetPacketsRecv.labels = [];
        ct.lineChartNetPacketsRecv.options = {
            elements: { line: { tension: 0, }, point: { radius: 0, } },
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
                        time: { unit: 'minute' },
                    },
                }]
            },
        };
        ct.lineChartNetPacketsRecv.data = [];

        ct.lineChartNetPacketsSent = {};
        ct.lineChartNetPacketsSent.series = [];
        ct.lineChartNetPacketsSent.colors = [];
        ct.lineChartNetPacketsSent.labels = [];
        ct.lineChartNetPacketsSent.options = {
            elements: { line: { tension: 0, }, point: { radius: 0, } },
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
                        time: { unit: 'minute' },
                    },
                }]
            },
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
    .controller('iaasComputeEditFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("computeDetailControllers.js : iaasComputeEditFormCtrl", 1);
        
        var pop = this;
        $scope.contents = angular.copy(common.getMainContentsCtrlScope().contents);

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.formName = "computeEditForm";
        pop.title = "인스턴스 수정";
        pop.instance = $scope.contents.instance;

        //인스턴스 상세 정보 변경
        pop.fn.changeInstance = function() {
        	common.showConfirm('메세지',pop.instance.name +' 서버 정보를 수정하시겠습니까?').then(function(){
        		if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                    return;
                }
	            var param = {instance:pop.instance};
	            $scope.main.loadingMainBody = true;
                $scope.main.asideClose();
	            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'PUT', param);
	            returnPromise.success(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	                common.showAlertSuccess("수정되었습니다");
	            	//common.showAlert("message","수정되었습니다.");
	                $scope.main.goToPage("/iaas");
	            });
	            returnPromise.error(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	            	common.showAlertError(data.message);
	                //common.showAlert("message",data.message);
	            });
	            returnPromise.finally(function() {
	                $scope.main.loadingMainBody = false;
	            });
        	});
        };
        
        //보안정책 조회 후 셋팅
        pop.fn.getSecurityPolicy = function() {
            $scope.main.loadingMainBody = true;
        	pop.roles = [];
            var param = {tenantId:$scope.contents.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
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
                $scope.main.loadingMainBody = false;
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

        //보안정책 셋팅
        pop.fn.changeSecurityPolicy = function() {
        	pop.instance.securityPolicies = pop.roles;
        };
        
        pop.fn.getSecurityPolicy();
    })
    .controller('iaasComputeDomainFormCtrl', function($scope, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeDetailControllers.js : iaasComputeDomainFormCtrl", 1);

        var pop = this;
        var vs = new ValidationService();
        var ct = common.getMainContentsCtrlScope().contents;

        pop.instance = angular.copy(ct.instance);
        pop.instanceIndex = angular.copy(ct.selectInstanceIndex);

        $scope.actionLoading = false;
        pop.userTenant = angular.copy($scope.main.userTenant);

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/tenant/unusing', 'GET', param);
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

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain', 'POST', param);
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
    .controller('iaasComputeSnapshotFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("computeDetailControllers.js : iaasComputeSnapshotFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);
        
        pop.instance = angular.copy($scope.contents.selectInstance);
        
        pop.fn = {};
        pop.formName = "createSnapshotForm";
        pop.title = "인스턴스 백업이미지 생성";
        
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'POST', {instanceSnapShot:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("생성 되었습니다.");
                $scope.main.goToPage('/iaas/compute/snapshot');
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

        pop.fn.checkByte = function (text, maxValue){
        	pop.checkByte = $bytes.lengthInUtf8Bytes(text);
        }
    })
    .controller('iaasComputeVolumePopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("computeDetailControllers.js : iaasComputeVolumePopFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        
        var pop = this;
        var ct = $scope.contents;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);
        
        pop.fn = {};
        pop.formName = "computeVolumeForm";
        pop.title = "디스크 연결";

      //디스크 리스트 조회
        pop.fn.getVolumeList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : "status",
                conditionValue : "available"
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param , 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceAttach', 'POST', {volumeAttach : param});
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("디스크이 추가 되었습니다.");
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
    .controller('iaasComputePublicIpSearchFormCtrl', function ($scope, $location, $state, $sce,$q,$translate, $stateParams, $mdDialog, $filter, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("deployServerControllers.js : iaasComputePublicIpSearchFormCtrl", 1);

        var pop = this;
        var vs = new ValidationService();
        var ct = common.getMainContentsCtrlScope().contents;

        pop.instance = angular.copy(ct.selectInstance);
        pop.instanceIndex = angular.copy(ct.selectInstanceIndex);

        $scope.actionLoading = false;
        pop.userTenant = angular.copy($scope.main.userTenant);

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'GET', param);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'POST', param , 'application/x-www-form-urlencoded');
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

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param);
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
     .controller('iaasComputePopEditServerCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("computePopEditServerCtrl.js : iaasComputePopEditServerCtrl", 1);
        
        
        var pop = this;

        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        pop.instance 					= $scope.dialogOptions.instance;
        pop.instanceNm                  = pop.instance.name;
        pop.uuid                		= pop.instance.spec.uuid;
        
        pop.tenantId 					= pop.instance.tenantId;
        
        if (!pop.tenantId) 
        {
        	pop.tenantId = common.getMainCtrlScope().main.userTenant.id;
		}
        
        
        $scope.dialogOptions.title 		= "서버사양 변경";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/computePopEditServerForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.specList 					= [];
        pop.spec 						= {};
        
        
        //스펙그룹의 스펙 리스트 조회
        /*pop.fn.getSpecList = function() {*/
        pop.getSpecList = function(specGroup) {
        	
            var param 		  = {specGroupName:specGroup};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param,  'application/x-www-form-urlencoded');
            
            returnPromise.success(function (data, status, headers) 
            {
            	pop.specList = data.content.specs;
            	pop.initCheck = false;            	
            });
            returnPromise.error(function (data, status, headers) 
            {
            	$scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };
        
        pop.selectSpec = function() {
        	if(pop.specValue){
        		pop.spec = angular.fromJson(pop.specValue);
        	}else{
        		pop.spec.vcpus = 0;
        		pop.spec.ram   = 0;
        		pop.spec.disk  = 0;
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

            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                pop.btnClickCheck = false;
                return;
            }
            
            $scope.main.loadingMain = true;
            common.mdDialogHide();
            
            var param = {
            		urlParams : {
            			instanceId : pop.instance.id,
            			tenantId   : pop.tenantId,
            			specId     : pop.spec.uuid
            		}
            };
           
            
            // 변경 API정의되면 다시 수정 처리 해야함. 20181120 sg0730
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/resize', 'POST', param );
            
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("변경 되었습니다.");
                
             // 변경 API정의되면 다시 수정 처리 해야함. 20181120 sg0730
                if ( angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
                
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
                pop.btnClickCheck = false;
            });
            
        };
        
        pop.getSpecList();
      

    })
    //////////////////////////////////////////////////////////////
     .controller('iaasCreatePopSnapshotCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("iaasCreatePopSnapshotCtrl.js : iaasCreatePopSnapshotCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.instance 					= $scope.dialogOptions.selectInstance;
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        
        $scope.dialogOptions.title 		= "백업 이미지 생성";
        $scope.dialogOptions.okName 	= "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/computeCreatePopSnapshotForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        
       // Dialog ok 버튼 클릭 시 액션 정의
        $scope.actionBtnHied = false;
        
        $scope.popDialogOk = function () {
        	 if ($scope.actionBtnHied) return;
        	 
             $scope.actionBtnHied = true;
             
             if (!pop.validationService.checkFormValidity(pop[pop.formName])) 
             {
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
            
            common.mdDialogHide();

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'POST', {instanceSnapShot:pop.data});
            
            returnPromise.success(function (data, status, headers) 
            {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("생성 되었습니다.");
                
                //생성이후 Callback처리 할지 아니면 페이지를 아예 이동 할지 정의후 제작성 필요. sg0730 20181120
                if ( angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
                
            });
            returnPromise.error(function (data, status, headers) 
            {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) 
            {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        }
    })
    ///////////////////////////////////////////////////////////////////////////////
    ///////////////2018.11.21 sg0730 도메인 등록 팝업////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////
    .controller('iaasPopConnDomainFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
    	_DebugConsoleLog("iaasPopConnDomainFormCtrl.js : iaasPopConnDomainFormCtrl", 1);
    	
    	var pop = this;
    	pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
    	pop.fn 							= {};
    	pop.data						= {};
    	pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
    	//pop.userTenant 					= angular.copy($scope.main.userTenant);
    	//pop.instance 					= $scope.dialogOptions.selectInstance;
    	
    	$scope.dialogOptions.title 		= "도메인 등록";
    	$scope.dialogOptions.okName 	= "등록";
    	$scope.dialogOptions.closeName 	= "닫기";
    	$scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/computeCreatePopDomainForm.html" + _VersionTail();
    	
    	$scope.actionLoading 			= false;
    	pop.btnClickCheck 				= false;
    	
    	// Dialog ok 버튼 클릭 시 액션 정의
    	$scope.actionBtnHied = false;
    	
    	$scope.popDialogOk = function () {
            pop.fn.addDomain();
    	};
    	
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};

        $scope.actionBtnHied = false;
    	pop.fn.addDomain = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            $scope.main.loadingMainBody = true;
    		pop.data.tenantId 			= pop.userTenant.id;
    		pop.data.instanceId 		= pop.instance.id;
    		
    		common.mdDialogHide();
    		
    		var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'POST', {instanceSnapShot:pop.data});
            returnPromise.success(function (data, status, headers)
            {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("생성 되었습니다.");
                //생성이후 Callback처리 할지 아니면 페이지를 아예 이동 할지 정의후 제작성 필요. sg0730 20181120
                $scope.main.goToPage('/iaas/compute/snapshot');

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
    .controller('iaasComputeVolumeFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("computeDetailControllers.js : iaasComputeVolumeFormCtrl", 1);

        var pop 						= this;
        var ct 							= $scope.contents;
        pop.validationService 			= new ValidationService({controllerAs: pop});
    	pop.formName 					= $scope.dialogOptions.formName;
        pop.fn 							= {};
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.instance 					= $scope.dialogOptions.selectInstance;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        //pop.formName 		= "computeVolumeForm";
        $scope.dialogOptions.title 		= "디스크 추가";
        $scope.dialogOptions.okName 	= "변경";
    	$scope.dialogOptions.closeName 	= "닫기";
    	$scope.dialogOptions.templateUrl= _IAAS_VIEWS_ + "/compute/computeServerConnVolPopForm.html" + _VersionTail();
    	$scope.actionLoading 			= false;
    	pop.checkValFlag 				= false;
    	$scope.actionBtnHied = false;

        
      //디스크 리스트 조회
        pop.fn.getVolumeList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
			                tenantId       : ct.data.tenantId,
			                conditionKey   : "status",
			                conditionValue : "available"
			            };
            
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param , 'application/x-www-form-urlencoded');
            
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
            pop.checkValFlag = true;
        };
        
        $scope.popDialogOk = function () {
        	pop.fn.addInstanceVolume();
    	};
    	
    	$scope.popCancel = function() {
    		$scope.dialogClose = true;
    		common.mdDialogCancel();
    	};
        
        
        //인스턴스 디스크 추가
        pop.fn.addInstanceVolume = function() {
        	
        	if (pop.checkValFlag == false ) 
        	{	
        		//common.showAlertWarning('추가할 디스크를 선택 하십시요.');
				return;
			}
        	
        	if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
        	
        	/* if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                 $scope.actionBtnHied = false;
                 return;
             }
        	*/
            var param = {
			                instanceId : pop.instance.id,
			                tenantId : pop.userTenant.tenantId,
			                volumeId : pop.volume.volumeId
			            };
            
            $scope.main.loadingMainBody = true;
            common.mdDialogHide();
            
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/instanceAttach', 'POST', {volumeAttach : param});
            
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("디스크가 추가 되었습니다.");
                if ( angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
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
;
