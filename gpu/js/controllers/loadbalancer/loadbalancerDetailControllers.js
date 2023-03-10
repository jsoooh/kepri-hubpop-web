'use strict';

// angular.module('iaas.controllers')
angular.module('gpu.controllers')
    // .controller('iaasLoadbalancerDetailCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, common, ValidationService, CONSTANTS, computeDetailService) {
    .controller('gpuLoadbalancerDetailCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, common, ValidationService, CONSTANTS, computeDetailService) {
        // _DebugConsoleLog("loadbalancerDetailControllers.js : iaasLoadbalancerDetailCtrl", 1);
        _DebugConsoleLog("loadbalancerDetailControllers.js : gpuLoadbalancerDetailCtrl", 1);

        $scope.actionBtnEnabled = true;

        var ct 				    = this;
        ct.list 			    = {};
        ct.fn 				    = {};
        ct.data 			    = {};
        ct.roles 			    = [];
        ct.loadbalancer         = {};
        // ct.data.tenantId        = $scope.main.userTenant.id;
        // ct.data.tenantName      = $scope.main.userTenant.korName;
        ct.data.tenantId        = $scope.main.userTenantGpu.id;
        ct.data.tenantName      = $scope.main.userTenantGpu.korName;

        ct.data.loadbalancerId  = $stateParams.lbInfoId;
        ct.serverMainList       = [];
        ct.selectPortId         = "";
        ct.sltInfoTab           = 'lbPort';
        ct.data.instanceId = $stateParams.instanceId;
        ct.instanceDomainLinkInfos = [];
        ct.instance             = {};
        ct.popServerMode        = "server"; //연결서버 추가 시 유형 : server/image

        ct.fn.formOpen = function($event, state, data){
            ct.formType = state;
            if (state == 'gotolblist') {
                ct.fn.goToLbList($event);
            } else if (state == 'port') {
                //ct.fn.createLoadBalancerPort($event,data);
                ct.fn.checkLbPortLimit($event,data);
            } else if (state == 'rename') {
                ct.fn.reNamePopLb($event,data);
            } else if (state == 'editport') {
                ct.fn.editPopPort($event,data);
            } else if (state == 'editserver') {
                ct.fn.editPopServer($event,data);
            } else if (state == 'createserver') {
                ct.fn.createPopServer($event,data);
            }
        };

        // 부하분산 관리 디테일 페이지 - 리스트 페이지로 이동
        ct.fn.goToLbList = function($event) {
            // common.locationHref('/#/iaas/compute?tabIndex=1');
            common.locationHref('/#/gpu/compute?tabIndex=1');
        };

        // 부하분산 포트 사용현황 - 추가 버튼
        ct.fn.createLoadBalancerPort = function($event, lbservice) {
            var dialogOptions =  {
                // controller       : "iaasCreateLoadBalancerPortPopFormCtrl" ,
                // formName         : 'iaasCreateLoadBalancerPortPopForm',
                controller       : "gpuCreateLoadBalancerPortPopFormCtrl" ,
                formName         : 'gpuCreateLoadBalancerPortPopForm',
                selectLoadBalancer    : angular.copy(lbservice)
                // callBackFunction : ct.reStorageSnapShotCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // 포트관리 - 수정
        ct.fn.editPopPort = function($event, lbservice) {
            var dialogOptions =  {
                // controller       : "iaasEditPortPopFormCtrl" ,
                // formName         : 'iaasEditPortPopForm',
                controller       : "gpuEditPortPopFormCtrl" ,
                formName         : 'gpuEditPortPopForm',
                selectLoadBalancer    : angular.copy(lbservice),
                callBackFunction : ct.editPopPortCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.editPopPortCallBackFunction = function() {
            ct.getLb();
        };

        // 연결서버 - 수정
        ct.fn.editPopServer = function($event, lbservice) {
            var dialogOptions =  {
                // controller       : "iaasEditServerPopFormCtrl" ,
                // formName         : 'iaasEditServerPopForm',
                controller       : "gpuEditServerPopFormCtrl" ,
                formName         : 'gpuEditServerPopForm',
                selectLoadBalancer    : angular.copy(lbservice),
                callBackFunction : ct.editPopServerCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.editPopServerCallBackFunction = function() {
            $timeout(function () {
                ct.getLb();
            }, 4000);
        };

        // 연결서버 - 추가
        ct.fn.createPopServer = function($event, lbservice) {
            var dialogOptions =  {
                // controller       : "iaasCreateServerPopFormCtrl" ,
                // formName         : 'iaasCreateServerPopForm',
                controller       : "gpuCreateServerPopFormCtrl" ,
                formName         : 'gpuCreateServerPopForm',
                selectLoadBalancer    : angular.copy(lbservice),
                callBackFunction : ct.createPopServerCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.createPopServerCallBackFunction = function() {
            $timeout(function () {
                ct.getLb();
            }, 4000);
        };

        // 부하분산 관리 - 이름/설명 변경
        ct.fn.reNamePopLb = function($event, lbservice) {
            var dialogOptions =  {
                // controller              : "iaasReNamePopLoadBalancerCtrl" ,
                // formName                : 'iaasReNamePopLoadBalancerForm',
                controller              : "gpuReNamePopLoadBalancerCtrl" ,
                formName                : 'gpuReNamePopLoadBalancerForm',
                selectLoadBalancer      : angular.copy(lbservice)
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
            ct.fnGetUsedResource();
            ct.GetServerMainList();
            ct.getLb();
        });

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

        // 연결서버 마우스 오버시 - OS 유형 정보 나타내기 위함.
        ct.GetServerMainList = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : ct.data.tenantId
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.serverMainList = data.content.instances;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                setOsType();    //vm osType 세팅
                $scope.main.loadingMainBody = false;
                console.debug("serverMainList: ", ct.serverMainList);
            });
        };

        // 개별 loadbalancer 조회
        ct.getLb = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                loadBalancerId : ct.data.loadbalancerId,
                tenantId : ct.data.tenantId
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.loadbalancer = data.content;
                ct.loadbalancer.iaasLbPorts = data.content.iaasLbPorts;
                ct.loadbalancer.iaasLbPortMembers = data.content.iaasLbPortMembers;
                ct.iaasLbPorts = angular.copy(ct.loadbalancer.iaasLbPorts);

                if (ct.loadbalancer.iaasLbInfo.checkStatus.indexOf("ing") > -1) {
                    $scope.main.reloadTimmer['loadBalancerState_' + ct.loadbalancer.iaasLbInfo.id] = $timeout(function () {
                        ct.fn.checkLbState(ct.loadbalancer.iaasLbInfo.id);
                    }, 1000);
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                setOsType();    //vm osType 세팅
                $scope.main.loadingMainBody = false;
            });
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
                    } else {
                        ct.GetServerMainList(); //서버 목록 조회
                    }
                    ct.loadbalancer = data.content;
                    ct.loadbalancer.iaasLbPorts = data.content.iaasLbPorts;
                    ct.loadbalancer.iaasLbPortMembers = data.content.iaasLbPortMembers;
                    ct.iaasLbPorts = angular.copy(ct.loadbalancer.iaasLbPorts);
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        // LB 삭제
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
                        $scope.main.loadingMainBody = false;
                        common.showAlertSuccess('삭제되었습니다.');
                        // common.locationHref('/#/iaas/compute?tabIndex=1');
                        common.locationHref('/#/gpu/compute?tabIndex=1');
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

        // 부하분산 관리 - 포트관리 - 삭제 버튼
        ct.deleteLbPort = function(id) {
            common.showConfirm('부하 분산 서버 포트 삭제','선택한 부하 분산 서버 포트를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    loadBalancerPortId : id
                };
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port', 'DELETE', param);
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        $scope.main.loadingMainBody = false;
                        $scope.main.replacePage();
                        common.showAlertSuccess('삭제되었습니다.');
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

        // 부하분산 관리 - 접속 IP 복사
        ct.fn.copyConnectInfoToClipboard = function (loadbalancer) {
            /*
            if (loadbalancer.floatingIp) {
                common.copyToClipboard(loadbalancer.floatingIp);
                $scope.main.copyToClipboard(loadbalancer.floatingIp, '"' + loadbalancer.floatingIp + '"가 클립보드에 복사 되었습니다.');
            }
            */
            if (loadbalancer.ipAddress) {
                common.copyToClipboard(loadbalancer.ipAddress);
                $scope.main.copyToClipboard(loadbalancer.ipAddress, '"' + loadbalancer.ipAddress + '"가 클립보드에 복사 되었습니다.');
            }
            else {
                common.showAlertWarning("접속 IP가 존재하지 않습니다.");
            }
        };

        // 포트 선택시 포트관리 및 연결 서버 탭
        ct.showPortDetail = function (iaasLbPort) {
            ct.hidePortDetails();
            $timeout(function () {
                ct.selectPortId = iaasLbPort.id;
                iaasLbPort.selected = true;
                ct.iaasLbPorts = iaasLbPort;
            }, 0);
        };

        ct.hidePortDetails = function () {
            ct.iaasLbPorts = {};
            ct.tabIndex = 0;
            if (ct.iaasLbPorts && ct.iaasLbPorts.length > 0) {
                for (var i=0; i<ct.iaasLbPorts.length; i++) {
                    ct.iaasLbPorts[i].selected = false;
                }
            }
        };

        //vm osType 세팅
        function setOsType() {
            if (ct.loadbalancer && ct.loadbalancer.iaasLbPortMembers && ct.loadbalancer.iaasLbPortMembers.length > 0 && ct.serverMainList.length > 0) {
                //console.log("ct.loadbalancer.iaasLbPortMembers(1) : ", ct.loadbalancer.iaasLbPortMembers);
                angular.forEach(ct.loadbalancer.iaasLbPortMembers, function(member) {
                    var sltServer = common.objectsFindCopyByField(ct.serverMainList, "id", member.instanceId);
                    if (sltServer) {
                        if (sltServer.image && sltServer.image.osType) {
                            member.instanceOsType = sltServer.image.osType;
                        }
                        member.instanceFloatingIp = sltServer.floatingIp;
                        member.instanceFixedIp = sltServer.fixedIp;
                        member.instanceCreated = sltServer.created;
                    }
                });
                //console.log("ct.loadbalancer.iaasLbPortMembers(2) : ", ct.loadbalancer.iaasLbPortMembers);
            }
        }

        // 부하분산 포트 사용현황 - 서비스 도메인 - 포트포워딩 선택 탭
        ct.fn.changeSltInfoTab = function (sltInfoTab) {
            if (sltInfoTab == 'lbPort') {
                ct.sltInfoTab = sltInfoTab;
                ct.selectPortId = "";
                ct.getLb();
            } else if (sltInfoTab == 'domain') {
                ct.sltInfoTab = sltInfoTab;
                ct.fn.listDomains();
            } else if (sltInfoTab == 'portForwarding') {
                ct.sltInfoTab = sltInfoTab;
                ct.fn.listPortForwardings();
            }
        };

        //서비스 도메인 조회
        ct.fn.listDomains = function() {
            $scope.main.loadingMainBody = true;
            var returnPromise = computeDetailService.listDomains(ct.loadbalancer.iaasLbInfo.id);
            returnPromise.success(function (data) {
                ct.instanceDomainLinkInfos = data.content;
                //ct.fn.setRdpConnectDomain(ct.instance);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 서비스 도메인, 포트 포워딩 탭 확대/축소
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

        // 서비스 도메인 추가 팝업
        ct.fn.popConnDomainForm = function($event) {
            var dialogOptions = {
                // controller : "iaasPopConnDomainFormCtrl" ,
                // formName : 'iaasLbPopConnDomainForm',
                controller : "gpuPopConnDomainFormCtrl" ,
                formName : 'gpuLbPopConnDomainForm',
                formMode : "add",
                instance : angular.copy(ct.loadbalancer.iaasLbInfo),
                callBackFunction : ct.refreshDomainCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.refreshDomainCallBackFunction = function () {
            ct.fn.listDomains();
        };

        ct.fn.popModDomainForm = function($event, domainLinkInfo) {
            var dialogOptions = {
                // controller : "iaasPopConnDomainFormCtrl" ,
                // formName : 'iaasLbPopConnDomainForm',
                controller : "gpuPopConnDomainFormCtrl" ,
                formName : 'gpuLbPopConnDomainForm',
                formMode : "mod",
                instance : angular.copy(ct.loadbalancer.iaasLbInfo),
                domainLinkInfo : angular.copy(domainLinkInfo),
                callBackFunction : ct.refreshDomainCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
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

        //포트포워딩 조회
        ct.fn.listPortForwardings = function () {
            ct.instance.instancePortForwardings = [];
            $scope.main.loadingMainBody = true;
            var returnPromise = computeDetailService.listPortForwardings(ct.loadbalancer.iaasLbInfo.id);
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
                instance : angular.copy(ct.loadbalancer.iaasLbInfo),
                callBackFunction : ct.refreshPortForwardingCallBackFunction
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
                instance : angular.copy(ct.loadbalancer.iaasLbInfo),
                portForwardingInfo : angular.copy(portForwardingInfo),
                callBackFunction : ct.refreshPortForwardingCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.refreshPortForwardingCallBackFunction = function () {
            ct.fn.listPortForwardings();
        };

        //포트포워딩 삭제
        ct.fn.deletePortForwarding = function(forwardingItem) {
            common.showConfirm('포트포워딩 삭제','※'+forwardingItem.targetPort+' 포트포워딩을 삭제 하시겠습니까?').then(function(){
                ct.fn.deletePortForwardingAction(forwardingItem);
            });
        };

        //lb port limit 확인
        ct.fn.checkLbPortLimit = function($event, lbservice) {
            ct.lbPortCnt = 0;   //테넌트의 전체 lbPort 갯수
            var params = {
                tenantId : ct.data.tenantId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/check', 'GET', params));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port/check', 'GET', params));
            returnPromise.success(function (data, status, headers) {
                ct.lbPortCnt = data.content;
                if (ct.lbPortCnt < CONSTANTS.lbaasPortLimit) {
                    ct.fn.createLoadBalancerPort($event, lbservice);
                } else {
                    common.showAlertError("message", "부하분산의 포트는 최대 " + CONSTANTS.lbaasPortLimit + "개로 더 이상 생성 불가합니다.");
                }
            });
            returnPromise.error(function (data, status, headers) {
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
        };

        //포트포워딩 삭제 실제 action
        ct.fn.deletePortForwardingAction = function(forwardingItem) {
            $scope.main.loadingMainBody = true;
            var param = {
                instanceId : ct.loadbalancer.iaasLbInfo.id,
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

        if (ct.data.tenantId) {
            ct.fnGetUsedResource();
            ct.getLb();
            ct.GetServerMainList();
            ct.fn.changeSltInfoTab();
        } else { // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해 주세요.');
            showAlert.then(function () {
                $scope.main.goToPage("/");
            });
            return false;
        }
    })
    // 이름/설명 변경 팝업 컨트롤러
    // .controller('iaasReNamePopLoadBalancerCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuReNamePopLoadBalancerCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("loadbalancerDetailControllers.js : iaasReNamePopLoadBalancerCtrl", 1);
        _DebugConsoleLog("loadbalancerDetailControllers.js : gpuReNamePopLoadBalancerCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.sltLoadBalancer = $scope.dialogOptions.selectLoadBalancer.iaasLbInfo;
        pop.lbserviceLists = angular.copy($scope.contents.lbServiceLists);
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title = "이름/설명 변경";
        $scope.dialogOptions.okName = "변경";
        $scope.dialogOptions.closeName = "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/reNameLoadBalancerPopForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/loadbalancer/reNameLoadBalancerPopForm.html" + _VersionTail();

        $scope.actionLoading = false;
        pop.btnClickCheck = false;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            pop.fn.loadBalancerNameValidationCheck();
        };

        // 취소
        $scope.popCancel = function () {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        // 이름 validation check
        pop.fn.loadBalancerNameValidationCheck = function () {
            var params = {
                tenantId: pop.sltLoadBalancer.tenantId,
                loadBalancerId: pop.sltLoadBalancer.id,
                name: pop.newLbNm
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/check_name', 'GET', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/check_name', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                pop.fn.reNmLb();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
                common.showAlertError("message", data.message);
            });
        };

        // 부하분산 서버 이름/설명 변경
        pop.fn.reNmLb = function () {
            $scope.main.loadingMainBody = true;

            var params = {
                id: pop.sltLoadBalancer.id,
                tenantId: pop.sltLoadBalancer.tenantId,
                name: pop.newLbNm,
                description: pop.sltLoadBalancer.description
            };

            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'PUT', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer', 'PUT', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.replacePage();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("부하분산 서버 이름/설명이 변경 되었습니다.");

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
        }
    })
    // 부하분산 포트 사용현황 - 포트추가 팝업 컨트롤러
    // .controller('iaasCreateLoadBalancerPortPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuCreateLoadBalancerPortPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("loadbalancerDetailControllers.js : iaasCreateLoadBalancerPortPopFormCtrl", 1);
        _DebugConsoleLog("loadbalancerDetailControllers.js : gpuCreateLoadBalancerPortPopFormCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.sltLoadBalancer = $scope.dialogOptions.selectLoadBalancer;
        pop.lbInfo = $scope.dialogOptions.selectLoadBalancer.iaasLbInfo;
        pop.ports = $scope.dialogOptions.selectLoadBalancer.iaasLbPorts;
        pop.portMembers = $scope.dialogOptions.selectLoadBalancer.iaasLbPortMembers;
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "부하 분산 서버 포트 만들기";
        $scope.dialogOptions.okName     = "생성";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerCreatePopPortForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/loadbalancer/loadbalancerCreatePopPortForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            pop.fn.createLoadBalancerPort();
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        // 부하분산 포트 사용현황 - 추가
        pop.fn.createLoadBalancerPort = function() {
            $scope.main.loadingMainBody = true;
            var params = {
                iaasLbInfo: {
                    id: pop.lbInfo.id,
                    tenantId: pop.lbInfo.tenantId
                },
                name: pop.ports.name,
                protocol: pop.ports.protocol,
                protocolPort: pop.ports.protocolPort
            };
            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port', 'POST', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.replacePage();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("생성 되었습니다.");
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
    // 포트관리 - 수정 버튼 팝업 컨트롤러
    // .controller('iaasEditPortPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuEditPortPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("loadbalancerDetailControllers.js : iaasEditPortPopFormCtrl", 1);
        _DebugConsoleLog("loadbalancerDetailControllers.js : gpuEditPortPopFormCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.port = angular.copy($scope.contents.iaasLbPorts);
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "부하 분산 서버 포트 수정";
        $scope.dialogOptions.okName     = "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerEditPopPortForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/loadbalancer/loadbalancerEditPopPortForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;


        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            pop.fn.editLoadBalancerPort();
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        pop.fn.editLoadBalancerPort = function() {
            $scope.main.loadingMainBody = true;
            var params = {
                id: pop.port.id,
                name: pop.port.name,
                protocol: pop.port.protocol,
                protocolPort: pop.port.protocolPort,
                connectionPort: pop.port.connectionPort,
                lbAlgorithm: pop.port.lbAlgorithm,
                healthType: pop.port.healthType,
                connectionLimit: pop.port.connectionLimit,
                healthDelay: pop.port.healthDelay,
                healthUrlPath: pop.port.healthUrlPath
            };
            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port', 'PUT', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port', 'PUT', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.replacePage();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("수정 되었습니다.");
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
    // 연결서버 - 수정 버튼 팝업 컨트롤러
    // .controller('iaasEditServerPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuEditServerPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("loadbalancerDetailControllers.js : iaasEditServerPopFormCtrl", 1);
        _DebugConsoleLog("loadbalancerDetailControllers.js : gpuEditServerPopFormCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.port = angular.copy($scope.contents.iaasLbPorts);
        pop.portMembers = angular.copy($scope.contents.loadbalancer.iaasLbPortMembers);
        pop.fn = {};
        pop.data = [];
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        pop.serverMainList   = [];
        pop.instanceSnapshots = [];
        pop.instanceSnapshotName = "";

        $scope.dialogOptions.title 		= "연결 서버 수정";
        $scope.dialogOptions.okName     = "수정";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerEditPopServerForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/loadbalancer/loadbalancerEditPopServerForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (pop.port.connType == 'server') {
                pop.fn.editConnectServer();
            } else {
                pop.fn.editConnectImage();
            }
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        // 연결서버 유형: 서버 선택시 서버 목록 불러옴
        pop.fn.GetServerMainList = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : pop.port.iaasLbInfo.tenantId,
                queryType : 'list'
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.serverMainList = data.content.instances;
                angular.forEach(pop.serverMainList, function(member) {
                    angular.forEach(pop.portMembers, function(selMember) {
                        if (selMember.instanceId == member.id) {
                            member.checked = true;
                        }
                    });
                });
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                console.debug("serverMainList: ", pop.serverMainList);
            });
        };

        // 연결서버 유형: 이미지 선택시 백업 이미지 목록 불러옴
        pop.fn.getInstanceSnapshotList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.port.iaasLbInfo.tenantId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshotList', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.instanceSnapshots = data.content;
                for (var i = 0; i < pop.instanceSnapshots.length; i++) {
                    if (pop.instanceSnapshots[i].id == pop.port.connImageId) {
                        pop.instanceSnapshotName = pop.instanceSnapshots[i].name
                    }
                }
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

        // 연결서버 유형이 server인 경우 연결서버 수정
        pop.fn.editConnectServer = function() {
            $scope.main.loadingMainBody = true;
            var params = [];
            angular.forEach(pop.serverMainList, function(portMember) {
                if (portMember.checked) {
                    params.push({
                        lbPortId: pop.port.id,
                        instanceId: portMember.id,
                        name: portMember.name,
                        // 문자열에 공백이 있어서 trim() 사용
                        ipAddress: portMember.fixedIp.trim()
                    });
                }
            });
            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/server', 'POST', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port/members/server', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.replacePage();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("수정 되었습니다.");
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

        // 연결서버 유형이 image인 경우 연결서버 수정
        pop.fn.editConnectImage = function() {
            $scope.main.loadingMainBody = true;
            var params = {
                id: pop.port.id,
                connType: pop.port.connType,
                connImageId: pop.port.connImageId,
                connImageName: pop.port.connImageName,
                connImageCount: pop.port.connImageCount
            };
            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/image', 'POST', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port/members/image', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                //$scope.main.replacePage();
                common.showAlertSuccess("수정 중 입니다.");
                pop.callBackFunction();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.GetServerMainList();
        pop.fn.getInstanceSnapshotList();
    })
    // 연결서버 - 추가 버튼 팝업 컨트롤러
    // .controller('iaasCreateServerPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuCreateServerPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("loadbalancerDetailControllers.js : iaasCreateServerPopFormCtrl", 1);
        _DebugConsoleLog("loadbalancerDetailControllers.js : gpuCreateServerPopFormCtrl", 1);
        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.port = angular.copy($scope.contents.iaasLbPorts);
        pop.fn = {};
        pop.data = [];
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        pop.serverMainList = [];
        pop.instanceSnapshots = [];

        $scope.dialogOptions.title 		= "연결 서버 추가";
        $scope.dialogOptions.okName    	= "추가";
        $scope.dialogOptions.closeName 	= "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerCreatePopServerForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/loadbalancer/loadbalancerCreatePopServerForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (pop.sltConnType == 'server') {
                pop.fn.createConnectServer();
            } else {
                pop.fn.createConnectImage();
            }
        };

        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        // 연결서버 유형 선택 버튼
        pop.fn.choiceConnType = function(sltConnType) {
            if (sltConnType == "server") {
                pop.sltConnType = sltConnType;
                pop.port.connType = pop.sltConnType;
                pop.fn.GetServerMainList();
            } else {
                pop.sltConnType = sltConnType;
                pop.port.connType = pop.sltConnType;
                pop.fn.getInstanceSnapshotList();
            }
        };

        // 연결서버 유형: 서버 선택시 서버 목록 불러옴
        pop.fn.GetServerMainList = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : pop.port.iaasLbInfo.tenantId,
                queryType : 'list'
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.serverMainList = data.content.instances;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                console.debug("serverMainList: ", pop.serverMainList);
            });
        };

        // 연결서버 유형: 이미지 선택시 백업 이미지 목록 불러옴
        pop.fn.getInstanceSnapshotList = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : pop.port.iaasLbInfo.tenantId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshotList', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.instanceSnapshots = data.content;
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

        // 연결서버 유형이 server인 경우 연결서버 추가
        pop.fn.createConnectServer = function() {
            $scope.main.loadingMainBody = true;
            var params = [];
            angular.forEach(pop.serverMainList, function(server) {
                if (server.checked) {
                    params.push({
                        lbPortId: pop.port.id,
                        instanceId: server.id,
                        name: server.name,
                        // 문자열에 공백이 있어서 trim() 사용
                        ipAddress: server.fixedIp.trim()
                    });
                }
            });
            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/server', 'POST', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port/members/server', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.replacePage();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("추가 되었습니다.");
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

        // 연결서버 유형이 image인 경우 연결서버 추가
        pop.fn.createConnectImage = function() {
            $scope.main.loadingMainBody = true;
            var params = {
                id: pop.port.id,
                connType: pop.port.connType,
                connImageId: pop.port.connImageId,
                connImageName: pop.port.connImageName,
                connImageCount: pop.port.connImageCount
            };
            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/image', 'POST', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/port/members/image', 'POST', params);
            returnPromise.success(function (data, status, headers) {
                //$scope.main.replacePage();
                common.showAlertSuccess("추가 중 입니다.");
                pop.callBackFunction();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.GetServerMainList();

    })
    // 부하분산 관리 - 이름/설명 변경 팝업 컨트롤러
    // .controller('iaasReNamePopLoadBalancerCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
    .controller('gpuReNamePopLoadBalancerCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("loadbalancerDetailControllers.js : iaasReNamePopLoadBalancerCtrl", 1);
        _DebugConsoleLog("loadbalancerDetailControllers.js : gpuReNamePopLoadBalancerCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        // pop.userTenant = angular.copy($scope.main.userTenant);
        pop.userTenant = angular.copy($scope.main.userTenantGpu);
        pop.sltLoadBalancer = $scope.dialogOptions.selectLoadBalancer.iaasLbInfo;
        pop.lbserviceLists = angular.copy($scope.contents.lbServiceLists);
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title = "이름/설명 변경";
        $scope.dialogOptions.okName = "변경";
        $scope.dialogOptions.closeName = "닫기";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/reNameLoadBalancerPopForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/loadbalancer/reNameLoadBalancerPopForm.html" + _VersionTail();

        $scope.actionLoading = false;
        pop.btnClickCheck = false;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            pop.fn.loadBalancerNameValidationCheck();
        };

        $scope.popCancel = function () {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };

        pop.fn.loadBalancerNameValidationCheck = function () {
            var params = {
                tenantId: pop.sltLoadBalancer.tenantId,
                loadBalancerId: pop.sltLoadBalancer.id,
                name: pop.newLbNm
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/check_name', 'GET', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/check_name', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                pop.fn.reNmLb();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.actionBtnHied = false;
                $scope.main.loadingMainBody = false;
                common.showAlertError("message", data.message);
            });
        };

        pop.fn.reNmLb = function () {
            $scope.main.loadingMainBody = true;

            var params = {
                id: pop.sltLoadBalancer.id,
                tenantId: pop.sltLoadBalancer.tenantId,
                name: pop.newLbNm,
                description: pop.sltLoadBalancer.description
            };

            common.mdDialogHide();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'PUT', params);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer', 'PUT', params);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("부하분산 서버 이름/설명이 변경 되었습니다.");

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
        }
    })
;
