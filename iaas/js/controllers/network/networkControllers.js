'use strict';

angular.module('iaas.controllers')
    .controller('iaasNetworkCtrl', function ($scope, $location, $state, $stateParams,$filter, $translate, $q, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("networkControllers.js : iaasNetworkCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.userTenant = angular.copy($scope.main.userTenant);
        ct.formName = "networkForm";
        var validationService = new ValidationService();

        ct.fn.formOpen = function($event, state, network){
    		ct.formType = state;
    		if(state == 'edit'){
    			ct.fn.networkAction($event, network);
    		}else if (state == 'write'){
    			ct.fn.networkAction($event);
    		}
        }
        
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getNetworkList();
        });

        ct.fn.getNetworkList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.networkMainList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        
        ct.fn.networkAction = function($event,network) {
            $scope.dialogOptions = {
                controller : "networkActionFormCtrl",
                callBackFunction : ct.fn.getNetworkList,
                network : network
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/network/networkForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
            
            //common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        }

        ct.fn.deleteNetwork = function(network) {
            common.showConfirm('네트워크 삭제','※' + network.description + '를 삭제 하시겠습니까?').then(function(){
                var param = {
                    tenantId : ct.data.tenantId,
                    networkId : network.id
                };
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getNetworkList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }
        
        //네트워크 추가 S
        ct.fn.getNewNetworkId = function() {
            var param = {
                tenantId :  ct.userTenant.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks/add', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.cidr_A = data.content.subnets[0].cidr_A;
                ct.cidr_B = data.content.subnets[0].cidr_B;
                ct.data.name = data.content.name;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };
        
        // Dialog ok 버튼 클릭 시 액션 정의
        ct.createOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!validationService.checkFormValidity($scope[ct.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            ct.fn.createNetworkAction();
        };
        
        ct.fn.createNetworkAction = function() {
            $scope.main.loadingMainBody = true;
            ct.data.tenantId = ct.userTenant.tenantId;
            ct.data.subnets = [{cidr:ct.cidr_A+"."+ct.cidr_B+"."+ct.cidr_C+"."+ct.cidr_D+"/24"}];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', ct.method, {network:ct.data});
            returnPromise.success(function (data, status, headers) {
            	ct.fn.getNetworkList();
            	ct.formClose('type1');
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }
        
        //네트워크 추가 E

        if(ct.data.tenantId) {
            ct.fn.getNetworkList();
        }
    })
    .controller('iaasNetworkDetailCtrl', function ($scope, $location, $state, $stateParams,$filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("networkControllers.js : iaasNetworkDetailCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
        ct.networkId = $stateParams.networkId;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            $scope.main.goToPage("/iaas/network");
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            // ct.fn.getPortList();
        });

        ct.fn.getPortList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                networkId : ct.networkId
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks/port', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.portList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.deletePort = function(portId) {
            common.showConfirm('포트 삭제','포트를 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    portId : portId
                }

                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks/port', 'DELETE', param, 'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getPortList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }

        if(ct.data.tenantId) {
            ct.fn.getPortList();
        }
    })
    .controller('iaasNetworkActionFormCtrl', function ($scope, $location, $state, $translate, $stateParams, $bytes, ValidationService, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("networkControllers.js : iaasNetworkActionFormCtrl", 1);

        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.data = {};

        pop.formName = "networkForm";
        pop.data = $scope.dialogOptions.network;
        pop.validDisabled = true;
        pop.dialogClassName = "modal-lg";
        pop.title = "네트워크 추가";

        if($scope.dialogOptions.network) {
            pop.title = "네트워크 수정";
            pop.data = angular.copy($scope.dialogOptions.network);
            pop.method = 'PUT';
        } else {
            pop.title = "네트워크 추가";
            pop.method = 'POST';
        }


        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/network/networkForm.html" + _VersionTail();
        var validationService = new ValidationService();
        // {hideErrorUnderInputs:true}

        // Dialog ok 버튼 클릭 시 액션 정의
        pop.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!validationService.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            
            var checkByte = $bytes.lengthInUtf8Bytes(pop.data.realDescription);
        	if(checkByte > 255){
        		alert("255Byte를 초과하였습니다.");
        		$scope.actionBtnHied = false;
        		return;
        	}
            
            pop.fn.createNetworkAction();
        };

        pop.popCancel = function () {
        	$(".aside").stop().animate({"right":"-360px"}, 400);
        };

        pop.fn.getNewNetworkId = function() {
            var param = {
                tenantId : pop.userTenant.tenantId,
            };

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks/add', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.cidr_A = data.content.subnets[0].cidr_A;
                pop.cidr_B = data.content.subnets[0].cidr_B;
                pop.data.name = data.content.name;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.createNetworkAction = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            pop.data.subnets = [{cidr:pop.cidr_A+"."+pop.cidr_B+"."+pop.cidr_C+"."+pop.cidr_D+"/24"}];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', pop.method, {network:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.contents.fn.getNetworkList();
                pop.popCancel();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                pop.popCancel();
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        if(!$scope.dialogOptions.network) {
            pop.fn.getNewNetworkId();
        }
    })
    .controller('iaasPublicIpInstanceConnectFormCtrl', function ($scope, $location, $state, $translate, $stateParams, $mdDialog, paging, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("networkControllers.js : iaasPublicIpInstanceConnectFormCtrl", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.keypair = {};
        pop.roles = [];
        pop.publicIp = angular.copy($scope.dialogOptions.publicIp);
        pop.formName = "publicIpInstanceConnect";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "인스턴스 조회";
        $scope.dialogOptions.okName = "연결";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/network/popInstancePublicIpForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            pop.fn.ipConnectionSet();
        };

        $scope.popCancel = function () {
            //$scope.popHide();
            $mdDialog.cancel();
        };

        /*공인 IP 연결*/
        pop.fn.ipConnectionSet = function() {
            var instance = JSON.parse(pop.instance);
            common.showConfirm('공인IP 연결','※'+instance.name+'에 공인IP '+pop.publicIp.floatingIp+'를 연결 하시겠습니까?').then(function(){
                var param = {
                    tenantId : pop.userTenant.tenantId,
                    instanceId : instance.id,
                    action : 'attach',
                    floatingIp : pop.publicIp.floatingIp
                };
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    $scope.dialogOptions.callBackFunction();
                    $scope.popCancel();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function(){
                    $scope.main.loadingMainBody = false;
                });
            });
        };

        /*인스턴스 조회*/
        pop.fn.getInstanceList = function(currentPage) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.userTenant.tenantId,
                conditionKey : pop.conditionKey,
                conditionValue : pop.conditionValue,
                queryType : 'list'
            };

            if(pop.network.id != '') {
                param.networkName = pop.network.name;
            }

            if (currentPage != undefined) {
                param.number = currentPage;
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.pageOptions = paging.makePagingOptions(data);
                pop.instanceList = data.content.instances;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        /*네트워크 셀렉트박스 조회*/
        pop.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.userTenant.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                pop.networks = data.content;
                pop.networks.unshift({id:"",name:'',description:"네트워크 선택"});
                pop.network = pop.networks[0];
                pop.fn.getInstanceList(1);
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        /*네트워크 셀렉트박스 조회*/
        pop.fn.networkListSearch();
    })
;
