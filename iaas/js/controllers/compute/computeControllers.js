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

        ct.formOpen = function (){
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeCreateForm.html" + _VersionTail();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };
        
      //20181120 sg0730  서버사양변경 PopUp 추가
        ct.computePopEditServerForm = function (instance,$event) {
        	
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
        
      //sg0730 차후 서버 이미지 생성 후 페이지 이동.
        ct.reflashCallBackFunction = function () 
        {
        	 $scope.main.goToPage('/iaas/compute');
        	
        	/*if(ct.data.tenantId) {
                ct.fn.getInstanceInfo();
                ct.fn.changeSltInfoTab();
            }*/
        };

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = common.getMainCtrlScope().main.userTenant.id;
        ct.data.tenantName = common.getMainCtrlScope().main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
            ct.networks = [{id:"",name:'',description:"네트워크 선택"}];
            ct.network = ct.networks[0];
            ct.fnGetServerMainList();
        });
        
        // 2018.11.29 keypair 파일 다운로드 추가.
        ct.fn.getKeyFile = function(keypair,type) {
            var param = {
                tenantId : ct.data.tenantId,
                name : keypair.keypairName
            }
            location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&keypairName="+keypair.keypairName;
        };

        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param, 'application/x-www-form-urlencoded');
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

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data) {
                    ct.pageOptions = paging.makePagingOptions(data);
                    ct.serverMainList = data.content.instances;

                    //icon image match 08.21 추가
                    //진행중일 때 count 필요 08.22 추가
                    angular.forEach(ct.serverMainList, function(sData, key) {
                        if (sData.vmState.indexOf("ing") > -1){
                            ct.serverMainList[key].vmStateSec = 0;
                            ct.serverMainList[key].vmStateInterval = $interval(function () {
                                fnInterval(key);
                            }, 1000);
                        }
                    });

                    if (ct.pageFirstLoad && (!ct.serverMainList || ct.serverMainList.length == 0)) {
                        ct.firstInstanceCreatePop();
                        ct.pageFirstLoad = false;
                    }
                    ct.fnGetUsedResource();
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //추가 S
        ct.fnGetUsedResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
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
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'DELETE', param)
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        var action = "";
                        var instance = {};
                        var tenantId = ct.data.tenantId;
                        var value = "";

                        var recursive = function() {
                            var param = {
                                instanceId : id,
                                action : action,
                                tenantId : tenantId
                            };
                            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
                            returnPromise.success(function (data, status, headers) {
                                if (status == 200 && data) {
                                    var requestAction = $filter('lowercase')(action);
                                    var responseAction = $filter('lowercase')(data.content.instances[0].vmState);
                                    if(responseAction || responseAction == "error") {
                                        if(responseAction == 'deleted') {
                                            $scope.main.loadingMainBody = false;
                                            common.showAlertSuccess('삭제되었습니다.');
                                            ct.fnGetServerMainList(1);
                                        }
                                    }else if(responseAction == 'deleted') {
                                        $scope.main.loadingMainBody = false;
                                        common.showAlertSuccess('삭제되었습니다.');
                                        ct.fnGetServerMainList(1);
                                    }else {
                                        instance.taskState = data.content.instances[0].taskState;
                                        directiveWatch();
                                    }
                                } else {
                                    instance.vmState = "error";
                                }
                            });
                            returnPromise.error(function (data, status, headers) {
                                $scope.main.loadingMainBody = false;
                                instance.vmState = "error";
                            });
                        };

                        var directiveWatch = function() {
                            if(instance.taskState == "deleting") {
                                value="DELETE";
                            }

                            if(value != "ready") {
                                if(value == "DELETE") {
                                    action = "deleted";
                                }
                                $timeout(recursive,5000);
                            }
                        };
                        directiveWatch();
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
                ct.serverMainList[index].vmState = vmStateChange;
                ct.serverMainList[index].observeAction = action;
                ct.serverMainList[index].vmStateSec = 0;
                ct.serverMainList[index].vmStateInterval = $interval(function () {
                    fnInterval(index);
                    $scope.main.loadingMainBody = false;
                }, 1000);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        var fnInterval = function(index) {
            ct.serverMainList[index].vmStateSec += 1;
            if (ct.serverMainList[index].vmState.lastIndexOf("ing") == -1) {
                $interval.cancel(ct.serverMainList[index].vmStateInterval);
            }
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
            ct.fnGetServerMainList();
        } else { // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해주세요.');
            showAlert.then(function () {
                $scope.main.goToPage("/");
            });
            return false;
        }

    })
    .controller('iaasComputeCreatePopCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCreatePopCtrl start", 1);

        var ct = this;
        ct.data = {};
        ct.fn = {};
        ct.ui = {};
        ct.roles = [];
        ct.data.name = '';
        ct.data.spec = {};
        ct.data.networks = [];
        ct.data.keypair = {};
        ct.data.initScript = {};
        ct.data.securityPolicys = [];
        ct.subnet = {};
        ct.networks = [];
        ct.specValue = '';
        ct.keypairValue = '';
        ct.initScriptValue = '';
        ct.ipFlag = true;
        ct.activeTabIndex = 1;
        ct.data.tenantId = common.getMainCtrlScope().main.userTenant.id;
        ct.data.tenantName = common.getMainCtrlScope().main.userTenant.korName;
        ct.formName = "computeCreateForm";
        ct.formName2 = "computeCreateForm2";
        ct.fnGetServerMainList = common.getMainContentsCtrlScope().contents.fnGetServerMainList;

        ct.scrollPane = function (){
            setTimeout(function() {
                var scrollPane = $('.scroll-pane').jScrollPane({});
            }, 250);
        };

        //다음
        ct.nextStep = function(){
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                return;
            }
            ct.activeTabIndex++;
        };

        //이전
        ct.preStep = function () {
            ct.activeTabIndex--;
        };

        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param, 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.securityPolicyList = data.content;
                for(var i = 0; i < ct.securityPolicyList.length; i++){
                    if(ct.securityPolicyList[i].name == "default"){
                        ct.roles.push(ct.securityPolicyList[i]);
                        ct.data.securityPolicys = ct.roles;
                    }
                }
                ct.fn.getKeypairList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        //보안정책 setting
        ct.fn.changeSecurityPolicy = function() {
            ct.data.securityPolicys = ct.roles;
        };

        //키페어 조회
        ct.fn.getKeypairList = function(keypairName) {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param , 'application/x-www-form-urlencoded');
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
                        //ct.fn.getKeyFile(returnData.responseJSON.content.keypair,'privateKey');
                        ct.fn.getKeypairList();
                    } else {
                        common.showAlertError(returnData.data.responseJSON.message);
                        $scope.main.loadingMainBody = false;
                    }
                }else{
                    for(var i = 0; i < ct.keypairList.length; i++){
                        if(ct.keypairList[i].name == "default"){
                            ct.keypairValue = ct.keypairList[i];
                            ct.data.keypair = angular.fromJson(ct.keypairValue);
                        }else{
                            ct.keypairValue = ct.keypairList[0];
                            ct.data.keypair = angular.fromJson(ct.keypairValue);
                        }
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

        //키페어 setting
        ct.fn.changeKeypair = function() {
            if(ct.keypairValue){
                ct.data.keypair = angular.fromJson(ct.keypairValue);
            }
        };

        //스펙그룹의 스펙 리스트 조회
        ct.fn.getSpecList = function(specGroup) {
            ct.specList = [];
            ct.data.spec = {};
            var param = {specGroupName:specGroup};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.specList = data.content.specs;

                ct.initCheck = false;
                ct.fn.initScriptSet();
                ct.fn.getInitScriptList();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        ct.fn.selectSpec = function() {
            if(ct.specValue){
                ct.data.spec = angular.fromJson(ct.specValue);
            }else{
                ct.data.spec.vcpus = 0;
                ct.data.spec.ram = 0;
                ct.data.spec.disk = 0;
            }
        };

        //초기화스크립트 리스트 조회
        ct.fn.getInitScriptList = function() {
            var param = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScriptAll', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.initScriptList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        //초기화스크립트 조회
        ct.fn.getInitScript = function(scriptId) {
            $scope.main.loadingMainBody = true;
            var param = {
                scriptId : scriptId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScriptId', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.data.initScript = data.content[0];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };


        //초기화 스크립트 변경
        ct.fn.changeInitScript = function() {
            if(ct.initScriptValue == "") {
                ct.data.initScript = {};
            } else {
                ct.fn.getInitScript(angular.fromJson(ct.initScriptValue).scriptId);
            }
        };

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
            param.imageType = ct.imageType;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/image', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.imageList = data.content.images;
                ct.fn.getSecurityPolicy();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        //서버 생성
        var clickCheck = false;
        ct.fn.createServer = function() {
            if(!clickCheck){
                clickCheck = true;

                if (!new ValidationService().checkFormValidity($scope[ct.formName2])) {
                    clickCheck = false;
                    return;
                }

                var instance = {};
                instance.name = ct.data.name;
                instance.tenantId = ct.data.tenantId;
                instance.networks = [{ id: ct.data.networks[0].id }];
                instance.image = {id: ct.data.image.id};
                instance.keypair = { keypairName: ct.data.keypair.keypairName };
                instance.securityPolicies = angular.copy(ct.data.securityPolicys);
                if (ct.data.initScript) {
                    instance.initScript = angular.copy(ct.data.initScript);
                }
                instance.spec = ct.data.spec;

                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', {instance : instance});
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    $scope.main.asideClose();
                    common.showAlertSuccess("생성 되었습니다.");
                    ct.fnGetServerMainList(1);
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
                returnPromise.finally(function() {
                    clickCheck = false;
                });
            }

        };

        // 네트워크 리스트 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param, 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/fixedIps', 'GET', param, 'application/x-www-form-urlencoded');
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

        //초기화 스크립트 체크
        ct.fn.initScriptSet = function() {
            if(!ct.initCheck) {
                ct.data.initScript = {};
                ct.initScriptValue = "";
            }
        };
        //자동&수동할당 체크
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

        if(ct.data.tenantId) {
            ct.fn.imageListSearch();
            ct.fn.networkListSearch();
        }

        ct.fn.getKeyFile = function(keypair,type) {
            var param = {
                tenantId : ct.data.tenantId,
                name : keypair.name
            };
            location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
        }


    })
    .controller('iaasComputeCreateCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCreateCtrl start", 1);

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
        ct.specValue         = '';
        ct.volume            = {};
        ct.keypairValue      = '';
        ct.initScriptValue   = '';
        ct.ipFlag            = true;
        ct.activeTabIndex    = 1;
        ct.data.tenantId     = $scope.main.userTenant.id;
        ct.data.tenantName   = $scope.main.userTenant.korName;
        ct.formName          = "computeCreateForm";
        
        //볼륨생성 변수
        ct.data.size = 1;

        ct.scrollPane = function (){
            setTimeout(function() {
                var scrollPane = $('.scroll-pane').jScrollPane({});
            }, 250);
        };
        
     
        
        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param, 'application/x-www-form-urlencoded');
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.securityPolicyList = data.content;
                for(var i = 0; i < ct.securityPolicyList.length; i++){
                    if(ct.securityPolicyList[i].name == "default"){
                        ct.roles.push(ct.securityPolicyList[i]);
                        ct.data.securityPolicys = ct.roles;
                    }
                }
                ct.fn.getKeypairList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        //보안정책 setting
        ct.fn.changeSecurityPolicy = function() {
            ct.data.securityPolicys = ct.roles;
        };

        //키페어 조회
        ct.fn.getKeypairList = function(keypairName) {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param , 'application/x-www-form-urlencoded');
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
                            ct.keypairValue = ct.keypairList[i];
                            ct.data.keypair = angular.fromJson(ct.keypairValue);
                        }else{
                            ct.keypairValue = ct.keypairList[0];
                            ct.data.keypair = angular.fromJson(ct.keypairValue);
                        }
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

        //키페어 setting
        ct.fn.changeKeypair = function() {
            if(ct.keypairValue){
                ct.data.keypair = angular.fromJson(ct.keypairValue);
            }
        };

        //스펙그룹의 스펙 리스트 조회
        ct.fn.getSpecList = function(specGroup) {
            ct.specList = [];
            ct.data.spec = {};
            var param = {specGroupName:specGroup};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.specList = data.content.specs;

                ct.initCheck = false;
                ct.fn.initScriptSet();
                ct.fn.getInitScriptList();
                ct.fn.selectSpec();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };
        
        
        //사양선택 이벤트 2018.11.13 sg0730 add
        ct.fn.selectSpec = function() 
        {
            var sltSpec = common.objectsFindCopyByField(ct.specList, "uuid", ct.specUuid);
        
            if(!sltSpec || !sltSpec.uuid)
            {
            	sltSpec = ct.specList[0] ;
            	
            }
            
            ct.data.spec = sltSpec;
            ct.specUuid = sltSpec.uuid;
            
        };

        //초기화스크립트 리스트 조회
        ct.fn.getInitScriptList = function() {
            var param = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScriptAll', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.initScriptList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        //초기화스크립트 조회
        ct.fn.getInitScript = function(scriptId) {
            $scope.main.loadingMainBody = true;
            var param = {
                scriptId : scriptId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScriptId', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.data.initScript = data.content[0];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };


        //초기화 스크립트 변경
        ct.fn.changeInitScript = function() {
            if(ct.initScriptValue == "") {
                ct.data.initScript = {};
            } else {
                ct.fn.getInitScript(angular.fromJson(ct.initScriptValue).scriptId);
            }
        };
        
        
        
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
            param.imageType = ct.imageType;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/image', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.imageList  = data.content.images;
                ct.data.image = ct.imageList[0];
                ct.fn.imageClick (ct.data.image) ;
                ct.fn.getSecurityPolicy();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };
        
        ct.fn.imageClick = function (image)
        {
        	var sltSpec = common.objectsFindCopyByField(ct.specList, "uuid", ct.specUuid);
        	ct.data.image = image ;
        	ct.serviceNm = image.serviceName
        	ct.imageTmpNm = image.serviceName; 
        }
        
        // 네트워크 리스트 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param, 'application/x-www-form-urlencoded');
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
        
        // 볼륨 생성 부분 추가 2018.11.13 sg0730
        ct.fn.getTenantResource = function() 
        {
            var params = 
            {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
            
            returnPromise.success(function (data, status, headers) 
            {
                ct.volume.resource = data.content[0];
                ct.volume.resourceDefault = angular.copy(ct.volume.resource);
                ct.volumeSliderOptions.ceil = ct.volume.resource.maxResource.volumeGigabytes - ct.volume.resource.usedResource.volumeGigabytes ;
            });
            
            returnPromise.error(function (data, status, headers) 
            {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
           
            returnPromise.finally(function (data, status, headers) 
            {
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/fixedIps', 'GET', param, 'application/x-www-form-urlencoded');
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

        //초기화 스크립트 체크
        ct.fn.initScriptSet = function() {
            if(!ct.initCheck) {
                ct.data.initScript = {};
                ct.initScriptValue = "";
            }
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

        if(ct.data.tenantId) {
        	ct.fn.getSpecList();
            ct.fn.imageListSearch();
            ct.fn.networkListSearch();
            ct.fn.getTenantResource();
        }

        ct.fn.getKeyFile = function(keypair,type) {
            var param = {
                tenantId : ct.data.tenantId,
                name : keypair.name
            };
            location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&name="+keypair.name;
        }
        
        
       
        //서버 생성
        var clickCheck = false;
        ct.fn.createServer = function() 
        {
            if(!clickCheck)
            {
                clickCheck = true;

                if (!new ValidationService().checkFormValidity($scope[ct.formName])) 
                {
                    clickCheck = false;
                    return;
                }

                var instance              = {};
                instance.name             = ct.data.name;
                instance.tenantId         = ct.data.tenantId;
                instance.networks         = [{ id: ct.data.networks[0].id }];
                instance.image            = {id: ct.data.image.id};
                instance.keypair          = { keypairName: ct.data.keypair.keypairName };
                instance.securityPolicies = angular.copy(ct.data.securityPolicys);
                
                ct.volume.name = instance.name+'_volume01';
                ct.volume.type = 'HDD';
                ct.volume.size = ct.volumeSize;
                //ct.volume.size = ct.volumeSlider.minValue;
                ct.volume.tenantId = ct.data.tenantId;
          
                instance.spec = ct.data.spec;
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', {instance : instance, volume : ct.volume});
                
                returnPromise.success(function (data, status, headers) 
                {
                	// 서버생성후 -> 볼륨 생성 후 sucess 처리.
                    $scope.main.loadingMainBody = false;
                    common.showAlertSuccess(ct.data.name+" 서버 생성이 시작 되었습니다.");
                    // 페이지 이동으로 바꿔야 하고
                    $scope.main.goToPage("/iaas/compute");
                	
                	
                });
                
                returnPromise.error(function (data, status, headers) 
                {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
                
                returnPromise.finally(function() 
                {
                    clickCheck = false;
                });
            }

        };

        ct.inputVolumeSizeChange = function () {
            if (ct.inputVolumeSize >= 10 || ct.inputVolumeSize > contents.volumeSliderOptions.ceil) {
                ct.volumeSize = ct.inputVolumeSize;
            }
        };

        ct.inputVolumeSizeBlur = function () {
            if (ct.inputVolumeSize < 10 || ct.inputVolumeSize > contents.volumeSliderOptions.ceil) {
                ct.inputVolumeSize = ct.volumeSize;
            } else {
                ct.volumeSize = ct.inputVolumeSize;
            }
        };

        ct.sliderVolumeSizeChange = function () {
            ct.inputVolumeSize = ct.volumeSize;
        };

      //볼륨생성 변수
        ct.inputVolumeSize = 10;
        ct.volumeSize = 10;
        ct.volumeSliderOptions = 
        {
        	showSelectionBar : true,
        	minValue : 1,
        	options: {
                floor: 0,
                ceil: 100,
                step: 30,
                onChange : ct.sliderVolumeSizeChange
            }
        };
        
        
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
