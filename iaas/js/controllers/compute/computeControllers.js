'use strict';

angular.module('iaas.controllers')
    .controller('iaasComputeCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCtrl", 1);

        $scope.actionBtnEnabled = true;

        var ct = this;
        ct.list = {};
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.network = {};
        ct.consoleLogLimit = '50';
        ct.actionLogLimit = '10';

        ct.formOpen = function (){
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeCreateStepForm.html" + _VersionTail();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = common.getMainCtrlScope().main.userTenant.id;
        ct.data.tenantName = common.getMainCtrlScope().main.userTenant.korName;
        //ct.data.tenantId = 'acb13dd1207740e8aeebdb46a2eb2e71';

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
            ct.networks = [{id:"",name:'',description:"네트워크 선택"}];
            ct.network = ct.networks[0];
            ct.fnGetServerMainList();
        });

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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/image', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.imageList = data.content.images;
                ct.fnGetServerMainList();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
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
                        angular.forEach(ct.imageList, function(iData) {
                            if (sData.image && sData.image.id == iData.id) {
                                sData.image.iconFileName = iData.iconFileName;
                            }
                        });
                        if (!sData.image.iconFileName){
                            sData.image.iconFileName = "im_logo_compute";
                        }
                    });
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
            $scope.main.loadingMainBody = true;
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
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
        ct.fnServerConfirm = function(action,instance,index) {
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
                ct.fn.createSnapshot(instance);
            } else if(action == "VOLUME"){
                ct.fn.createInstanceVolumePop(instance);
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
                }, 1000);
            });
            returnPromise.error(function (data, status, headers) {
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
        ct.fn.createSnapshot = function(instance) {
            if(instance.vmState != 'stopped') {
                common.showAlertWarning('서버를 종료 후 생성가능합니다.');
                return;
            } else {
                ct.selectInstance = instance;
                $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
                $(".aside").stop().animate({"right":"-360px"}, 400);
                $("#aside-aside1").stop().animate({"right":"0"}, 500);
            }
        };

        //인스턴스 볼륨 생성 팝업
        ct.fn.createInstanceVolumePop = function(instance) {
            common.showConfirm('메세지',instance.name +' 서버에 볼륨을 연결하시겠습니까?').then(function(){
                ct.selectInstance = instance;
                $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeVolumeForm.html" + _VersionTail();
                $(".aside").stop().animate({"right":"-360px"}, 400);
                $("#aside-aside1").stop().animate({"right":"0"}, 500);
            });
        };

        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function(instance,index) {
            common.showConfirm('메세지',instance.name +' 서버에 접속 IP를 설정하시겠습니까?').then(function(){
                ct.selectInstance = instance;
                ct.selectInstanceIndex = index;

                $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
                $(".aside").stop().animate({"right":"-360px"}, 400);
                $("#aside-aside1").stop().animate({"right":"0"}, 500);
            });
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
            //ct.fnGetServerMainList();
            ct.fn.imageListSearch();
        }else if(!$scope.main.hubpop.projectIdSelected && !$scope.main.currentProjectId){ // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해주세요.');
            showAlert.then(function () {
                $scope.main.moveToAppPage("/");
            });
            return false;
        }

    })
    .controller('iaasComputeCreateCtrl', function ($scope, $location, $state, $sce,$translate, $stateParams,$timeout,$filter, $mdDialog, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasComputeCreateCtrl start", 1);

        var ct = this;
        ct.data = {};
        ct.fn = {};
        ct.ui = {};
        ct.roles = [];
        ct.data.name = '';
        ct.data.spec = {};
        ct.data.networks = [];
        ct.data.keyPair = {};
        ct.data.initScript = {};
        ct.data.securityPolicys = [];
        ct.subnet = {};
        ct.networks = [];
        ct.specValue = '';
        ct.keyPairValue = '';
        ct.initScriptValue = '';
        ct.ipFlag = true;
        ct.activeTabIndex = 1;
        ct.data.tenantId = common.getMainCtrlScope().main.userTenant.id;
        ct.data.tenantName = common.getMainCtrlScope().main.userTenant.korName;
        ct.formName = "computeCreateForm";
        ct.formName2 = "computeCreateForm2";
        ct.fnGetServerMainList = common.getMainContentsCtrlScope().contents.fnGetServerMainList;

        ct.fn.formClose = function(){
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $(".aside div").remove();
        };

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
                ct.fn.getKeyPairList();
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
        ct.fn.getKeyPairList = function(keyPairName) {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.keyPairList = data.content;
                if(ct.keyPairList.length == 0){
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
                        ct.fn.getKeyPairList();
                    } else {
                        common.showAlertError(returnData.data.responseJSON.message);
                        $scope.main.loadingMainBody = false;
                    }
                }else{
                    for(var i = 0; i < ct.keyPairList.length; i++){
                        if(ct.keyPairList[i].name == "default"){
                            ct.keyPairValue = ct.keyPairList[i];
                            ct.data.keyPair = angular.fromJson(ct.keyPairValue);
                        }else{
                            ct.keyPairValue = ct.keyPairList[0];
                            ct.data.keyPair = angular.fromJson(ct.keyPairValue);
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
        ct.fn.changeKeyPair = function() {
            if(ct.keyPairValue){
                ct.data.keyPair = angular.fromJson(ct.keyPairValue);
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/image', 'GET', param , 'application/x-www-form-urlencoded');
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
                    return;
                }

                $scope.main.loadingMainBody = true;
                ct.fn.formClose();
                ct.data.spec.type = ct.data.spec.name;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', {instance : ct.data});
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.fnGetServerMainList(1);
                    //common.showAlertSuccess("생성 되었습니다.");
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
;
