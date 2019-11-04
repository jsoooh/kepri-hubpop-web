'use strict';

angular.module('iaas.controllers')
    .controller('iaasLoadbalancerDetailCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasLoadbalancerDetailCtrl", 1);

        $scope.actionBtnEnabled = true;

        var ct 				    = this;
        ct.list 			    = {};
        ct.fn 				    = {};
        ct.data 			    = {};
        ct.roles 			    = [];
        ct.loadbalancer         = {};
        ct.data.tenantId        = $scope.main.userTenant.id;
        ct.data.tenantName      = $scope.main.userTenant.korName;
        ct.data.loadbalancerId  = $stateParams.lbInfoId;
        ct.serverMainList       = [];
        ct.selectPortId         = "";
        ct.sltInfoTab           = 'lbPort';
        ct.data.instanceId = $stateParams.instanceId;

        ct.fn.formOpen = function($event, state, data){
            ct.formType = state;
            if (state == 'gotolblist') {
                ct.fn.goToLbList($event);
            } else if (state == 'port') {
                ct.fn.createLoadBalancerPort($event,data);
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
            common.locationHref('/#/iaas/compute?tabIndex=1');
        };

        // 부하분산 포트 사용현황 - 추가 버튼
        ct.fn.createLoadBalancerPort = function($event, lbservice) {
            var dialogOptions =  {
                controller       : "iaasCreateLoadBalancerPortPopFormCtrl" ,
                formName         : 'iaasCreateLoadBalancerPortPopForm',
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
                controller       : "iaasEditPortPopFormCtrl" ,
                formName         : 'iaasEditPortPopForm',
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
                controller       : "iaasEditServerPopFormCtrl" ,
                formName         : 'iaasEditServerPopForm',
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
                controller       : "iaasCreateServerPopFormCtrl" ,
                formName         : 'iaasCreateServerPopForm',
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
                controller              : "iaasReNamePopLoadBalancerCtrl" ,
                formName                : 'iaasReNamePopLoadBalancerForm',
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
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params));
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'GET', param);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data && data.content && data.content.iaasLbInfo) {
                    var lbLists = data.content;
                    //ct.fn.setProcState(instanceStateInfo);
                    if (lbLists.iaasLbInfo.checkStatus.indexOf("ing") > -1) {
                        $scope.main.reloadTimmer['loadBalancerState_' + lbLists.iaasLbInfo.id] = $timeout(function () {
                            ct.fn.checkLbState(lbLists.iaasLbInfo.id);
                        }, 2000);
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
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        $scope.main.loadingMainBody = false;
                        common.showAlertSuccess('삭제되었습니다.');
                        common.locationHref('/#/iaas/compute?tabIndex=1');
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
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port', 'DELETE', param);
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
            if (loadbalancer.floatingIp) {
                common.copyToClipboard(loadbalancer.floatingIp);
                $scope.main.copyToClipboard(loadbalancer.floatingIp, '"' + loadbalancer.floatingIp + '"가 클립보드에 복사 되었습니다.');
            } else {
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
            if (ct.loadbalancer && ct.loadbalancer.iaasLbPortMembers && ct.loadbalancer.iaasLbPortMembers.length >0 && ct.serverMainList.length > 0) {
                //console.log("ct.loadbalancer.iaasLbPortMembers(1) : ", ct.loadbalancer.iaasLbPortMembers);
                angular.forEach(ct.loadbalancer.iaasLbPortMembers, function(member) {
                    var sltServer = common.objectsFindCopyByField(ct.serverMainList, "id", member.instanceId);
                    if (sltServer.image && sltServer.image.osType) {
                        member.instanceOsType = sltServer.image.osType;
                    }
                    member.instanceFloatingIp = sltServer.floatingIp;
                    member.instanceFixedIp = sltServer.fixedIp;
                    member.instanceCreated = sltServer.created;
                });
                //console.log("ct.loadbalancer.iaasLbPortMembers(2) : ", ct.loadbalancer.iaasLbPortMembers);
            }
        }

        // 부하분산 포트 사용현황 - 서비스 도메인 - 포트포워딩 선택 탭
        ct.fn.changeSltInfoTab = function (sltInfoTab) {
            if (sltInfoTab == 'lbPort') {
                ct.sltInfoTab = sltInfoTab;
            } else if (sltInfoTab == 'domain') {
                ct.sltInfoTab = sltInfoTab;
            } else if (sltInfoTab == 'portForwarding') {
                ct.sltInfoTab = sltInfoTab;
                // ct.fn.listPortForwardings();
            }
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
                controller : "iaasLbPopConnDomainFormCtrl" ,
                formName : 'iaasLbPopConnDomainForm',
                formMode : "add",
                loadbalancer : angular.copy(ct.loadbalancer),
                callBackFunction : ct.refreshDomainCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.refreshDomainCallBackFunction = function () {
            ct.fn.listDomains();
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
    .controller('iaasReNamePopLoadBalancerCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasReNamePopLoadBalancerCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.sltLoadBalancer = $scope.dialogOptions.selectLoadBalancer.iaasLbInfo;
        pop.lbserviceLists = angular.copy($scope.contents.lbServiceLists);
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title = "이름/설명 변경";
        $scope.dialogOptions.okName = "변경";
        $scope.dialogOptions.closeName = "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/reNameLoadBalancerPopForm.html" + _VersionTail();

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/check_name', 'GET', params);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'PUT', params);
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
    .controller('iaasCreateLoadBalancerPortPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasCreateLoadBalancerPortPopFormCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        pop.userTenant = angular.copy($scope.main.userTenant);
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
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerCreatePopPortForm.html" + _VersionTail();

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port', 'POST', params);
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
    .controller('iaasEditPortPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasEditPortPopFormCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.port = angular.copy($scope.contents.iaasLbPorts);
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title 		= "부하 분산 서버 포트 수정";
        $scope.dialogOptions.okName     = "변경";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerEditPopPortForm.html" + _VersionTail();

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
                connectionPort: pop.port.protocolPort,
                lbAlgorithm: pop.port.lbAlgorithm,
                healthType: pop.port.healthType,
                connectionLimit: pop.port.connectionLimit,
                healthDelay: pop.port.healthDelay,
                healthUrlPath: pop.port.healthUrlPath
            };
            common.mdDialogHide();
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port', 'PUT', params);
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
    .controller('iaasEditServerPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasEditServerPopFormCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        pop.userTenant = angular.copy($scope.main.userTenant);
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
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerEditPopServerForm.html" + _VersionTail();

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
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
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
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/server', 'POST', params);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/image', 'POST', params);
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
    .controller('iaasCreateServerPopFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasCreateServerPopFormCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.port = angular.copy($scope.contents.iaasLbPorts);
        pop.fn = {};
        pop.data = [];
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        pop.serverMainList = [];
        pop.instanceSnapshots = [];

        $scope.dialogOptions.title 		= "연결 서버 추가";
        $scope.dialogOptions.okName    	= "추가";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerCreatePopServerForm.html" + _VersionTail();

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
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
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
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/server', 'POST', params);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/port/members/image', 'POST', params);
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
    .controller('iaasReNamePopLoadBalancerCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadbalancerDetailControllers.js : iaasReNamePopLoadBalancerCtrl", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs: pop});
        pop.formName = $scope.dialogOptions.formName;
        pop.userTenant = angular.copy($scope.main.userTenant);
        pop.sltLoadBalancer = $scope.dialogOptions.selectLoadBalancer.iaasLbInfo;
        pop.lbserviceLists = angular.copy($scope.contents.lbServiceLists);
        pop.fn = {};
        pop.data = {};
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title = "이름/설명 변경";
        $scope.dialogOptions.okName = "변경";
        $scope.dialogOptions.closeName = "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/reNameLoadBalancerPopForm.html" + _VersionTail();

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/check_name', 'GET', params);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'PUT', params);
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
    // 서비스 도메인 - 추가 팝업 컨트롤러
    .controller('iaasLbPopConnDomainFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("iaasLbPopConnDomainFormCtrl.js : iaasLbPopConnDomainFormCtrl", 1);

        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.formMode 					= $scope.dialogOptions.formMode;
        pop.fn 							= {};
        pop.domain						= {};
        pop.orgDomain					= {};
        pop.orgDomainLinkInfo           = {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;
        pop.loadbalancer 				= $scope.dialogOptions.loadbalancer;

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
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/loadbalancer/loadbalancerCreatePopDomainForm.html" + _VersionTail();

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;

        pop.fn.getBaseDomainList = function() {
            pop.baseDomains = [];
            var param = {};
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/baseDomain/all', 'GET', param);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/all', 'GET', param);
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

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain/service', method, params);
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
;
