'use strict';

angular.module('iaas.controllers')
    .controller('iaasComputeDashboardCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user, paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("dashboardControllers.js : iaasComputeDashboardCtrl", 1);

        $scope.actionBtnEnabled = false;

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.network = {};
        ct.selectedValues = {};
        ct.consoleLogLimit = '50';
        ct.actionLogLimit = '10';

        ct.formOpen = function ($event, state, type, data){
            if(state == 'volume'){
                if(type == 'storage'){
                    ct.fn.createStorage($event);
                }else if (type == 'snapshot'){
                    ct.fn.createSnapshotPopBefore($event, data);
                }
            }else if(state == 'compute'){
                $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeCreateForm.html" + _VersionTail();
                $(".aside").stop().animate({"right":"-360px"}, 400);
                $("#aside-aside1").stop().animate({"right":"0"}, 500);
            }
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
            //ct.fn.getStorageList();
        });
        // 인스턴스 S

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
                    //icon image match   08.21 추가
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
                common.showAlert("message",data.message);
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

        // 네트워크 리스트 조회
        ct.fn.networkListSearch = function() {
            $scope.main.loadingMainBody = true;
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
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        // 이미지 리스트 조회
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
                ct.fnGetServerMainList();   //서버메인 tenant list 함수
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        //키페어 조회
        ct.fn.getKeypairList = function(keypairName) {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.keypairList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };
        //보안정책 조회
        ct.fn.getSecurityPolicy = function() {
            var param = {tenantId:ct.data.tenantId};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.securityPolicyList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };
        // 스펙그룹의 스펙 리스트 조회
        ct.fn.getSpecList = function(specGroup) {
            $scope.main.loadingMainBody = true;
            ct.specList = [];
            ct.data.spec = {};
            var param = {specGroupName:specGroup};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.specList = data.content.specs;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //초기화스크립트 리스트 조회
        ct.fn.getInitScriptList = function(scriptId) {
            var param = {
                tenantId : ct.data.tenantId
            };
            if(scriptId) {
                param.scriptId = scriptId;
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'GET', param , 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if(scriptId) {
                    ct.data.initScript = data.content[0];
                    $scope.main.loadingMainBody = false;
                } else {
                    ct.initScriptList = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        //서버 생성
        ct.fn.createServer = function() {
            if (!ct.data.spec || angular.equals({},ct.data.spec)) {
                common.validationAlert($scope,"인스턴스 사양", "필수 선택 항목입니다.");
                return;
            }

            $scope.main.loadingMainBody = true;
            ct.data.spec.type = ct.data.spec.name;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', {instance : ct.data});
            returnPromise.success(function (data, status, headers) {
                $state.reload();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function() {
                $scope.main.loadingMainBody = false;
            });
        };

        //키페어 setting
        ct.fn.changeKeypair = function() {
            if(ct.keypairValue){
                ct.data.keypair = angular.fromJson(ct.keypairValue);
            }
        };
        //보안정책 setting
        ct.fn.changeSecurityPolicy = function() {
            ct.data.securityPolicys = ct.roles;
        };
        //인스턴스 설정
        ct.fn.selectSpec = function() {
            if(ct.specValue){
                ct.data.spec = angular.fromJson(ct.specValue);
            }else{
                ct.data.spec.vcpus = 0;
                ct.data.spec.ram = 0;
                ct.data.spec.disk = 0;
            }
        };
        //초기화 스크립트 체크
        ct.fn.initScriptSet = function() {
            if(!ct.initCheck) {
                ct.data.initScript = {};
                ct.initScriptValue = "";
            }
        };
        //초기화 스크립트 변경
        ct.fn.changeInitScript = function() {
            if(ct.initScriptValue == "") {
                ct.data.initScript = {};
            } else {
                ct.fn.getInitScriptList(angular.fromJson(ct.initScriptValue).scriptId);
            }
        };
        // 서버삭제
        ct.deleteInstanceJob = function(id) {
            common.showConfirm('서버 삭제','선택한 서버를 삭제하시겠습니까?').then(function(){

                $scope.main.loadingMainBody = true;
                var deferred = $q.defer();
                if(typeof id !== 'string') {
                    return;
                }
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
                                    if(requestAction == responseAction || responseAction == "error") {
                                        if(responseAction == 'deleted') {
                                            $scope.main.loadingMainBody = false;
                                            common.showAlertSuccess(10000,'삭제되었습니다.');
                                            ct.fnGetServerMainList(1);
                                        }
                                    }else if(responseAction == 'deleted') {
                                        $scope.main.loadingMainBody = false;
                                        common.showAlertSuccess(10000,'삭제되었습니다.');
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
                    common.showAlertError(data.message);
                });
            });
        };
        ct.fnServerConfirm = function(action,instance,index) {
            if(action == "START") {
                // 메시지 헤더와 메시지 내용부를 통일. 201808.24 sg0730
                common.showConfirm('서버 시작',instance.name +' 서버를 시작하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "STOP") {
                common.showConfirm('서버 정지',instance.name +' 서버를 정지하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('서버 일시정지', instance.name +' 서버를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('서버 정지해제', instance.name +' 서버를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action,instance,index);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('서버 재시작',instance.name +' 서버를 재시작하시겠습니까?').then(function(){
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
            ct.selectInstance = instance;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeVolumeForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
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
            common.showConfirm('접속 IP해제',instance.name +' 서버의 접속 IP를 해제하시겠습니까?').then(function(){
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

        // 인스턴스 E
        // 볼륨 스토리지 S
        var conditionValue = $stateParams.volumeName;
        if($stateParams.volumeName) {
            ct.conditionKey = 'name';
            ct.conditionValue = $stateParams.volumeName;
        } else {
            ct.conditionKey = '';
        }

        //볼륨 리스트
        ct.fn.getStorageList = function(currentPage) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue
            };
            if (currentPage != undefined) {
                param.number = currentPage;
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.pageOptions = paging.makePagingOptions(data);
                ct.storageMainList = data.content.volumes;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.deleteVolumes = function(type, id) {
            if(type == 'thum'){
                common.showConfirm('볼륨 삭제','볼륨을 삭제 하시겠습니까?').then(function(){
                    ct.deleteVolumesAction(type, id);
                });
            }else if(type == 'tbl'){
                if(ct.roles.length == 0) {
                    common.showAlert('메세지','선택된 볼륨이 없습니다.');
                } else {
                    common.showConfirm('볼륨 삭제','선택된 '+ct.roles.length+'개의 볼륨을 삭제 하시겠습니까?').then(function(){
                        ct.deleteVolumesAction(type, id);
                    });
                }
            }

        };

        // 스토리지 삭제
        ct.deleteVolumesAction = function(type, id) {
            var prom = [];
            if(type == 'thum'){
                prom.push(ct.deleteVolumesJob(id));
            }else if(type == 'tbl'){
                for(var i=0; i< ct.roles.length; i++) {
                    prom.push(ct.deleteVolumesJob(ct.roles[i]));
                }
            }
            $q.all(prom).then(function(results){
                for(var i=0; i < results.length; i++ ) {
                    if(!results[i]) {
                        common.showAlert('메세지','오류가 발생하였습니다.');
                    }
                }
                ct.fn.getStorageList();
                ct.roles = [];
            }).catch(function(e){
                common.showAlert('메세지',e);
            });
        };

        // 스토리지 삭제
        ct.deleteVolumesJob = function(id) {
            $scope.main.loadingMainBody = true;
            var deferred = $q.defer();
            if(typeof id !== 'string') {
                return;
            }
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : id
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'DELETE', param)
            returnPromise.success(function (data, status, headers) {
                deferred.resolve(true);
            });
            returnPromise.error(function (data, status, headers) {
                deferred.reject(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });

            return deferred.promise;
        };

        ct.fn.createStorage = function ($event) {
            $scope.dialogOptions = {
                controller : "iaasStorageFormCtrl",
                callBackFunction : ct.fn.getStorageList
            };
            $scope.actionBtnEnabled = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/storageForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
                top = $(window).scrollTop();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);

            $scope.actionLoading = true; // action loading
        };

        ct.fn.createSnapshotPopBefore = function ($event,volume) {
            if(volume.status == 'in-use' || volume.status == 'available') {
                if(volume.status == 'in-use') {
                    var param = {
                        tenantId : volume.tenantId,
                        volumeId : volume.volumeId
                    };
                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
                    returnPromise.success(function (data, status, headers) {
                        if(data.content.instanceStatus == 'active') {
                            common.showAlert('메세지',data.content.instanceName + '이 실행 중입니다. 인스턴스를 종료하고 시도해주세요.');
                        } else {
                            ct.fn.createSnapshotPop($event,volume);
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlert('메세지',data.message);
                    });
                    returnPromise.finally(function (data, status, headers) {
                        $scope.main.loadingMainBody = false;
                    });
                } else {
                    ct.fn.createSnapshotPop($event,volume);
                }
            } else {
                common.showAlert('메세지','스냅샷을 생성할 수 있는 상태가 아닙니다.');
            }
        };

        ct.fn.createSnapshotPop = function ($event, volume) {
            $scope.dialogOptions = {
                controller : "iaasCreateStorageSnapshotFormCtrl",
                callBackFunction : null,
                volume : volume
            };
            $scope.actionBtnEnabled = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/createSnapshotForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
                top = $(window).scrollTop();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);

            $scope.actionLoading = true; // action loading
        };
        //볼륨 스토리지 E

        if(ct.data.tenantId) {
            ct.fn.imageListSearch();    //이미지 리스트 조회
            //ct.fnGetServerMainList();
            ct.fn.getStorageList(1);
        }else if(!$scope.main.hubpop.projectIdSelected && !$scope.main.currentProjectId){ // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해주세요.');
            showAlert.then(function () {
                $scope.main.moveToAppPage("/");
            });
            return false;
        }
    })
    .controller('iaasDeployDashboardCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, user, paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("dashboardControllers.js : iaasDeployDashboardCtrl", 1);

        $scope.actionBtnHied = false;

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.serverMainList = [];
        ct.deployList = [];
        ct.deployServerList = [];
        ct.network = {};
        ct.selectedValues = {};
        ct.consoleLogLimit = '50';
        ct.actionLogLimit = '10';
        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);
        ct.tenantMonitUsed = { cpu : {}, mem: {}, disk: {} };
        ct.cxAgengName = "cx_agent";

        ct.softwareIcons = {
            "haproxy" : "images/thum/im_logo_haproxy.png"
            , "nginx" : "images/thum/im_logo_nginx.png"
            , "tomcat" : "images/thum/im_thum_tomcat.png"
            , "mariadb" : "images/thum/im_logo_mysql.png"
        };

        ct.doughnutLabels = ['남은 쿼터', '다른 인스턴스 사용', '현재 인스턴스 사용'];

        ct.doughnutCpu = {};
        ct.doughnutCpu.colors = ["rgba(199,143,220,.5)","rgba(183,93,218,.7)", "rgba(183,93,218,1)"];
        ct.doughnutCpu.data = [1, 0, 0];

        ct.doughnutRam = {};
        ct.doughnutRam.colors = ["rgba(145,191,206,.5)","rgba(1,160,206,.7)", "rgba(1,160,206,1)"];
        ct.doughnutRam.data = [1, 0, 0];

        ct.doughnutDisk = {};
        ct.doughnutDisk.colors = ["rgba(143,171,234,.5)","rgba(22,87,218,.7)", "rgba(22,87,218,1)"];
        ct.doughnutDisk.data = [1, 0, 0];
        // ct.tenantInfoData = {};

        ct.fn.getUsedResource = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            ct.tenantResource = {};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];
                ct.doughnutCpu.data = [(ct.tenantResource.maxResource.cores - ct.tenantResource.usedResource.cores), ct.tenantResource.usedResource.cores];
                ct.doughnutRam.data = [(ct.tenantResource.maxResource.ramSize - ct.tenantResource.usedResource.ramSize)/1024, ct.tenantResource.usedResource.ramSize/1024];
                ct.doughnutDisk.data = [ct.tenantResource.maxResource.instanceDiskGigabytes - ct.tenantResource.usedResource.instanceDiskGigabytes, ct.tenantResource.usedResource.instanceDiskGigabytes];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        ct.formOpen = function ($event, state, type, data){
        	if(state == 'volume'){
        		if(type == 'storage'){
        			ct.fn.createStorage($event);
        		}else if (type == 'snapshot'){
        			ct.fn.createSnapshotPopBefore($event, data);
        		}
        	}else if(state == 'compute'){
        		//$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeCreateForm.html" + _VersionTail();
                $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeTypeCreateForm.html" + _VersionTail();
        		$(".aside").stop().animate({"right":"-360px"}, 400);
        		$("#aside-aside1").stop().animate({"right":"0"}, 500);
            }
        };

        // 공통 레프트 메뉴의 userTenantId
        if (angular.isObject($scope.main.userTenant) && $scope.main.userTenantId) {
            ct.data.tenantId = $scope.main.userTenantId;
            ct.data.tenantName = $scope.main.userTenant.korName;
        }

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getUsedResource();
            ct.fn.getDeployServerList();
            ct.fn.getStorageList();
        });
// 인스턴스 S

        ct.moveToDetailPage = function(deployServer) {
            if (deployServer.viewType == "deploy") {
                $scope.main.moveToAppPage('/iaas/deploy_server/detail/'+deployServer.deployId,deployServer.name,true)
            } else {
                $scope.main.moveToAppPage('/iaas/compute/detail/'+deployServer.id,deployServer.name,true)
            }
        };

        ct.fn.getInstanceColumnDataBySeries = function(data) {
            var series = [];
            var instances = {};
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
                angular.forEach(series, function (seryData, seryKey) {
                    if (seryData.columnData && seryData.columnData.length > 0) {
                        if (seryData.name == "disk") {
                            if (!instances[seryData.tags.server_uuid]) {
                                instances[seryData.tags.server_uuid] = [];
                            }
                            instances[seryData.tags.server_uuid].push(seryData.columnData[0]);
                        } else {
                            instances[seryData.tags.server_uuid] = seryData.columnData[0];
                        }
                    }
                });
            }
            return instances;
        };

        ct.fn.setInstanceMonitUsedMerge = function (tenantMonitUsed, monitUsed, instanceId) {
            if (tenantMonitUsed.cpu[instanceId]) {
                monitUsed.cpu.used += tenantMonitUsed.cpu[instanceId]['mean_usage_active'];
                monitUsed.cpu.count++;
            }
            if (ct.tenantMonitUsed.mem[instanceId]) {
                monitUsed.mem.total += tenantMonitUsed.mem[instanceId]['total'];
                monitUsed.mem.used += tenantMonitUsed.mem[instanceId]['mean_used'];
                monitUsed.mem.parsentUsed += tenantMonitUsed.mem[instanceId]['mean_used_percent'];
                monitUsed.mem.count++;
            }
            if (tenantMonitUsed.disk[instanceId] && tenantMonitUsed.disk[instanceId].length > 0) {
                angular.forEach(tenantMonitUsed.disk[instanceId], function (diskData, dk) {
                    monitUsed.disk.total += diskData['total'];
                    monitUsed.disk.used += diskData['used'];
                    monitUsed.disk.parsentUsed += diskData['used_percent'];
                    monitUsed.disk.count++;
                });
            }
            return monitUsed;
        };

        ct.fn.setServerInstanceUsedData = function () {
            if (ct.serverCpuDataLoad && ct.serverMemDataLoad && ct.serverDiskDataLoad) {
                angular.forEach(ct.deployServerList, function (deployServer, key) {
                    var monitUsed = {cpu: {count: 0, used: 0}, mem: {count: 0, total: 0, used: 0, parsentUsed: 0}, disk: {count: 0, total: 0, used: 0, parsentUsed: 0}};
                    if (deployServer.viewType == "deploy") {
                        angular.forEach(deployServer.instances, function (instance, k) {
                            monitUsed = ct.fn.setInstanceMonitUsedMerge(ct.tenantMonitUsed, monitUsed, instance.id);
                        });
                    } else {
                        monitUsed = ct.fn.setInstanceMonitUsedMerge(ct.tenantMonitUsed, monitUsed, deployServer.id);
                    }

                    if (monitUsed.cpu.count > 0) {
                        monitUsed.cpu.used = Math.round(monitUsed.cpu.used/monitUsed.cpu.count, 2);
                    }

                    if (monitUsed.mem.total > 0) {
                        monitUsed.mem.parsentUsed = Math.round(monitUsed.mem.used*100 / monitUsed.mem.total, 2);
                        monitUsed.mem.total = Math.round(monitUsed.mem.total / (1024 * 1024), 0);
                        monitUsed.mem.used = Math.round(monitUsed.mem.used / (1024 * 1024), 0);
                    }

                    if (monitUsed.disk.total > 0) {
                        monitUsed.disk.parsentUsed = Math.round(monitUsed.disk.used*100 / monitUsed.disk.total, 2);
                        monitUsed.disk.total = Math.round(monitUsed.disk.total / (1024 * 1024), 0);
                        monitUsed.disk.used = Math.round(monitUsed.disk.used / (1024 * 1024), 0);
                    }

                    $timeout(function () {
                        deployServer.cpu = monitUsed.cpu;
                        deployServer.mem = monitUsed.mem;
                        deployServer.disk = monitUsed.disk;
                    }, 100);
                });
            }
        };

        // 서버 CPU
        ct.fn.getTenantNowServerCpuUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    tenant_id: ct.data.tenantId
                },
                start_time: start_time
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_cpu/{server_type}/tenant/{tenant_id}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.tenantMonitUsed.cpu = ct.fn.getInstanceColumnDataBySeries(data);
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverCpuDataLoad = true;
                ct.fn.setServerInstanceUsedData();
            });
        };

        // 서버 Memory
        ct.fn.getTenantNowServerMemUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    tenant_id: ct.data.tenantId
                },
                start_time: start_time
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_mem/{server_type}/tenant/{tenant_id}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.tenantMonitUsed.mem = ct.fn.getInstanceColumnDataBySeries(data);
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverMemDataLoad = true;
                ct.fn.setServerInstanceUsedData();
            });
        };

        // 서버 Disk
        ct.fn.getTenantNowServerDiskUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    tenant_id: ct.data.tenantId
                },
                start_time: start_time
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_disk/{server_type}/tenant/{tenant_id}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.tenantMonitUsed.disk = ct.fn.getInstanceColumnDataBySeries(data);
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverDiskDataLoad = true;
                ct.fn.setServerInstanceUsedData();
            });
        };

        ct.fn.onlyDataReLoad = function() {
            if ($scope.main.reloadTimmer['deployList'] != null) {
                if ($timeout.cancel($scope.main.reloadTimmer['deployList'])) {
                    $scope.main.reloadTimmer['deployList'] = null;
                }
            }
            ct.loadServerMainList = false;
            ct.loadServerMainList = false;
            ct.loadDeployList = false;
            ct.fnGetServerMainList();
            ct.fn.getDeployList();
        };

        ct.fn.getDeployServerList = function() {
            $scope.main.loadingMainBody = true;
            ct.deployServerList = [];
            ct.fn.onlyDataReLoad();
        };

        ct.vmStatus = {};
        ct.swStatus = {};

        ct.fn.setDeployServerList = function() {
            var deployServerList = [];
            angular.forEach(ct.serverMainList, function (instance, key) {
                instance.existDeploy = false;
                angular.forEach(ct.deployList, function (deploy, k) {
                    if (!angular.isArray(deploy.instances)) {
                        deploy.instances = [];
                    }
                    if (instance.deployId == deploy.deployId) {
                        instance.existDeploy = true;
                        deploy.instances.push(angular.copy(instance));
                    }
                });
            });

            angular.forEach(ct.deployList, function (deploy, k) {
                if (!deploy.instances ||  deploy.instances.length == 0) {
                    deploy.viewType = "deploy";
                    if (deploy.status == 'active') {
                        deploy.status = "deleted";
                    }
                    deployServerList.push(deploy);
                }
            });

            var checkDeployServers = [];
            angular.forEach(ct.serverMainList, function (instance, key) {
                if (instance.existDeploy) {
                    if (checkDeployServers.indexOf(instance.deployId) == -1) {
                        checkDeployServers.push(instance.deployId);
                        var deployServer = common.objectsFindCopyByField(ct.deployList, "deployId", instance.deployId);
                        deployServer.image = angular.copy(deployServer.instances[0].image);
                        deployServer.vmState = deployServer.instances[deployServer.instances.length - 1].vmState;
                        deployServer.taskState = deployServer.instances[deployServer.instances.length - 1].taskState;
                        deployServer.keypair = angular.copy(deployServer.instances[0].keypair);
                        deployServer.spec = {};
                        deployServer.spec.name = deployServer.instances[0].spec.name;
                        deployServer.spec.vcpus = 0;
                        deployServer.spec.ram = 0;
                        deployServer.spec.disk = 0;
                        deployServer.cpu = { used: 0 };
                        deployServer.mem = { total: 0, used: 0, parsentUsed: 0};
                        deployServer.disk = { total: 0, used: 0, parsentUsed: 0};
                        angular.forEach(deployServer.instances, function (item, k) {
                            deployServer.spec.vcpus += item.spec.vcpus;
                            deployServer.spec.ram += item.spec.ram;
                            deployServer.spec.disk += item.spec.disk;
                        });
                        deployServer.viewType = "deploy";
                        deployServerList.push(angular.copy(deployServer));
                    }
                } else {
                    if (instance.name != ct.cxAgengName) {
                        var deployServer = angular.copy(instance);
                        deployServer.viewType = "instance";
                        deployServerList.push(deployServer);
                    }
                }
            });

            if (ct.deployServerList.length > deployServerList.length) {
                ct.deployServerList.splice(deployServerList.length, ct.deployServerList.length - deployServerList.length);
            }

            ct.vmStatus = { tcnt: 0, start: 0, stop: 0, fail: 0 };
            ct.swStatus = { tcnt: 0, start: 0, stop: 0, fail: 0 };

            var dataReLoadDeployServers = [];

            angular.forEach(deployServerList, function (deployServer, key) {
                if (deployServer.viewType == "deploy") {
                    switch (deployServer.uiStatus) {
                        case "initializing":
                            deployServer.statusIndex = 0;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        case "creating":
                            deployServer.statusIndex = 1;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push(ct.deployServerList[key]);
                            break;
                        case "preparing":
                            deployServer.statusIndex = 2;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        case "installing":
                            deployServer.statusIndex = 3;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        case "configuring":
                            deployServer.statusIndex = 4;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        default :
                            deployServer.statusIndex = 5;
                            if (deployServer.uiStatus == 'error' ) {
                                deployServer.deployStatus = "fail";
                            } else {
                                deployServer.deployStatus = "done";
                            }
                            break;
                    }

                    ct.swStatus.tcnt += deployServer.instances.length;
                    ct.vmStatus.tcnt += deployServer.instances.length;
                    if (deployServer.uiStatus == 'error' ) {
                        ct.swStatus.fail += deployServer.instances.length;
                    } else {
                        ct.swStatus.start += deployServer.instances.length;
                    }
                    for(var j=0; j<deployServer.instances.length; j++) {
                        if (deployServer.instances[j].vmState == 'error') {
                            ct.vmStatus.fail += 1;
                        } else if (deployServer.instances[j].vmState == 'stopped') {
                            ct.vmStatus.stop += 1;
                        } else {
                            ct.vmStatus.start += 1;
                        }
                    }

                    deployServer.instances.sort(function (a, b) {return a.name > b.name ? 1 : -1});

                } else if (deployServer.viewType == "instance") {
                    switch (deployServer.vmState) {
                        case "active":
                        case "stopped":
                        case "paused":
                            deployServer.deployStatus = "done";
                            break;
                        case "error":
                            deployServer.deployStatus = "fail";
                            break;
                        default :
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ instanceId : deployServer.instanceId });
                            break;
                    }
                    if (deployServer.name != ct.cxAgengName) {
                        ct.vmStatus.tcnt += 1;
                        if (deployServer.vmState == 'error') {
                            ct.vmStatus.fail += 1;
                        } else if (deployServer.vmState == 'stopped') {
                            ct.vmStatus.stop += 1;
                        } else {
                            ct.vmStatus.start += 1;
                        }
                    }
                }
                if (ct.deployServerList[key]) {
                    angular.forEach(deployServer, function(value, skey) {
                        if (angular.isArray(value)) {
                            if (!angular.isArray(ct.deployServerList[key][skey])) {
                                ct.deployServerList[key][skey] = [];
                            }
                            if (ct.deployServerList[key][skey].length > value.length) {
                                ct.deployServerList[key][skey].splice(value.length, ct.deployServerList[key][skey].length - value.length);
                            }
                            angular.forEach(value, function(val, k) {
                                if (ct.deployServerList[key][skey][k]) {
                                    angular.forEach(val, function(v, sk) {
                                        if (ct.deployServerList[key][skey][k][sk] != v) {
                                            ct.deployServerList[key][skey][k][sk] = v;
                                        }
                                    });
                                } else {
                                    ct.deployServerList[key][skey].push(val)
                                }
                            });
                        } else {
                            ct.deployServerList[key][skey] = value;
                        }
                    });
                } else {
                    ct.deployServerList.push(deployServer);
                }
            });

            if (dataReLoadDeployServers.length > 0) {
                $scope.main.reloadTimmer['deployList'] = $timeout(function () {
                    ct.fn.onlyDataReLoad();
                }, 5000);
            }

            ct.serverCpuDataLoad = false;
            ct.serverMemDataLoad = false;
            ct.serverDiskDataLoad = false;
            ct.fn.getTenantNowServerCpuUsedData("10m");
            ct.fn.getTenantNowServerMemUsedData("10m");
            ct.fn.getTenantNowServerDiskUsedData("10m");

        };

        // Lb DeployList 리스트 조회
        ct.fn.getDeployList = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            ct.deployList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    angular.forEach(data.content, function (item, key) {
                        item.vmType = item.deployType;
                        item.name = item.deployName;
                        item.softwareIconUrl = ct.softwareIcons[item.software];
                        var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", item.vmType);
                        if (angular.isObject(vmDeployType) && vmDeployType.id) {
                            item.vmDeployType = vmDeployType;
                        } else {
                            item.vmDeployType = angular.copy(ct.deployTypes[0]);
                        }
                        ct.deployList.push(item);
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                if (ct.loadServerMainList && ct.loadDeployList) {
                    $scope.main.loadingMainBody = false;
                }
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                ct.loadDeployList = true;
                if (ct.loadServerMainList && ct.loadDeployList) {
                    $scope.main.loadingMainBody = false;
                    ct.fn.setDeployServerList();
                }
            });
        };

        // 서버메인 tenant list 함수
        ct.fnGetServerMainList = function() {
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue,
                queryType : 'list',
                size : 0
            };

            ct.serverMainList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data) {
                    ct.pageOptions = paging.makePagingOptions(data);
                    var isCxAgent = false;
                    angular.forEach(data.content.instances, function (item, key) {
                        var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", item.vmType);
                        if (angular.isObject(vmDeployType) && vmDeployType.id) {
                            item.vmDeployType = vmDeployType;
                        } else {
                            item.vmDeployType = angular.copy(ct.deployTypes[0]);
                        }
                        if (item.name == ct.cxAgengName) {
                            isCxAgent = false;
                        }
                    });
                    ct.serverMainList = data.content.instances;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                ct.loadServerMainList = true;
                if (ct.loadServerMainList && ct.loadDeployList) {
                    $scope.main.loadingMainBody = false;
                    ct.fn.setDeployServerList();
                }
            });
        };

        // 서비스 삭제
        ct.fn.deleteDeployServer = function(deployServer, index) {
            if (deployServer.deployType == "LB" && angular.isArray(deployServer.serviceDeployments) && deployServer.serviceDeployments.length > 0) {
                common.showAlertSuccess('LB ('+deployServer.name+')에 연결되어 있는 서비스('+deployServer.serviceDeployments.length+')가 존재하여 삭제 하실 수 없습니다.');
                return;
            }
            common.showConfirm('서비스 삭제', '선택한 서비스('+deployServer.name+') 및 서버를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : deployServer.deployId
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    setTimeout(function() {
                        $scope.main.loadingMainBody = false;
                        if (status == 200 && data) {
                            ct.deployServerList.splice(index, 1);
                            common.showAlertSuccess('삭제되었습니다.');
                        } else {
                            common.showAlertError('오류가 발생하였습니다.');
                        }
                    }, 1000);
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
            });
        };

        // 서버삭제
        ct.deleteInstanceJob = function(instance, index) {
            common.showConfirm('서버 삭제', '선택한 서버('+instance.name+')를 삭제하시겠습니까?').then(function(){
	            $scope.main.loadingMainBody = true;
	            var param = {
	                tenantId : ct.data.tenantId,
	                instanceId : instance.id
	            };
	            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'DELETE', param);
	            returnPromise.success(function (data, status, headers) {
	            	setTimeout(function() {
	            		$scope.main.loadingMainBody = false;
	            		if (status == 200 && data) {
                            ct.deployServerList.splice(index, 1);
	            			common.showAlertSuccess('삭제되었습니다.');
                            ct.fn.getUsedResource();
		                } else {
		                	common.showAlertError('오류가 발생하였습니다.');
		                }
	            	}, 1000);
	            });
	            returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
	            	common.showAlertError(data.message);
	            });
            });
        };

        ct.fn.addDeployServerInstance = function(deployServer, index, count) {
            var title = '인스턴스 증가';
            var message = '선택한 서비스('+deployServer.name+')의 인스턴스를 증가하시겠습니까?';
            if (deployServer.deployType == "LB" || deployServer.deployType == "DB") {
                title = '클러스터 구성';
                message = '선택한 서비스('+deployServer.name+')의 클러스터 구성하시겠습니까?';
            }
            common.showConfirm(title, message).then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams : {
                        deployId: deployServer.deployId,
                        instanceCount: count
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/instance/scale', 'PUT', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.onlyDataReLoad();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.delDeployServerInstance = function(deployServer, index, count) {
            var title = '인스턴스 감소';
            var message = '선택한 서비스('+deployServer.name+')의 인스턴스를 감소하시겠습니까?';
            if (deployServer.deployType == "LB" || deployServer.deployType == "DB") {
                title = '단일 구성';
                message = '선택한 서비스('+deployServer.name+')의 단일 구성하시겠습니까?';
            }
            common.showConfirm(title, message).then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams : {
                        deployId: deployServer.deployId,
                        count: count
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/instance/scale', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.onlyDataReLoad();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.deployServerInstanceCountFormOpen = function (deployServer, index) {
            var dialogOptions = {
                controller : "iaasDeployInstanceCountFormOpenCtrl",
                callBackFunction : ct.fn.actionSebCallBackFun,
                deployServer : angular.copy(deployServer),
                controllerAs : "pop",
                formMode : "mod"
            };
            ct.servicePortFormDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.fn.deployServerActionConfirm = function(action, deployServer, index) {
            if(action == "START") {
                common.showConfirm('메세지', deployServer.deployName +' 서비스를 시작 하시겠습니까?').then(function(){
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            } else if(action == "STOP") {
                common.showConfirm('메세지', deployServer.deployName +' 서비스를 정지 하시겠습니까?').then(function(){
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            } else if(action == "RESTART") {
                common.showConfirm('메세지', deployServer.deployName + ' 서버를 재시작 하시겠습니까?').then(function () {
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            } else if(action == "INSTALL") {
                common.showConfirm('메세지', deployServer.deployName + ' 서버를 재배포 하시겠습니까?').then(function () {
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            }  else if(action == "DELETE") {
                ct.fn.deleteDeployServer(deployServer, index);
            } else if(action == "SCALE") {
                ct.fn.deployServerInstanceCountFormOpen(deployServer, index);
            }
            ct.selectedValues[index] = "";
        };

        ct.fn.deployServerAction = function(action, deployServer, index) {
            var param = {
                deployId : deployServer.deployId,
                command : action.toLowerCase()
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/action?' + $.param(param), 'POST');
            returnPromise.success(function (data, status, headers) {
                if (action == "START") {
                    common.showAlertError("서비스가 시작 되었습니다.");
                } else if(action == "STOP") {
                    common.showAlertError("서비스가 정지 되었습니다.");
                } else if(action == "RESTART") {
                    common.showAlertError("서비스가 재시작 되었습니다.");
                }  else if(action == "INSTALL") {
                    common.showAlertError("서비스가 재배포 중 입니다.");
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        ct.fn.serverActionConfirm = function(action,instance,index) {
            if(action == "START") {
                common.showConfirm('메세지', instance.name +' 서버를 시작 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "STOP") {
                common.showConfirm('메세지', instance.name +' 서버를 종료 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('메세지', instance.name +' 서버를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('메세지',instance.name +' 서버를 재시작 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "DELETE") {
                ct.deleteInstanceJob(instance, index);
            } else if(action == "SNAPSHOT") {
                ct.fn.createSnapshot(instance);
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop(instance,index);
            } else if(action == "IPDISCONNECT"){
                common.showConfirm('메세지',instance.name +' 서버의 접속 IP를 해제 하시겠습니까?').then(function(){
                    ct.fn.ipConnectionSet(instance, "detach",index);
                });
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
                $timeout(function () {
                    ct.fn.getDeployServerList();
                }, 1000);
            });
            returnPromise.error(function (data, status, headers) {
            	common.showAlertError(data.message);
                //common.showAlert('메세지',data.message);
            });
        }
        // SnapShot 생성
        ct.fn.createSnapshot = function(instance) {
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
        }

        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function(instance,index) {
        	ct.selectInstance = instance;
        	ct.selectInstanceIndex = index;

        	$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        }

        // 공인 IP 연결 해제 펑션
        ct.fn.ipConnectionSet = function(instance,type,index) {
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
            	ct.deployServerList[index].floatingIp = "";
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        }
// 인스턴스 E
// 볼륨 스토리지 S
        var conditionValue = $stateParams.volumeName;
        if($stateParams.volumeName) {
            ct.conditionKey = 'name';
            ct.conditionValue = $stateParams.volumeName;
        } else {
            ct.conditionKey = '';
        }

        //볼륨 리스트
        ct.fn.getStorageList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue,
            };

            ct.storageMainList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
            	ct.pageOptions = paging.makePagingOptions(data);
                ct.storageMainList = data.content.volumes;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };
        ct.fn.deleteVolumes = function(type, id) {
        	if(type == 'thum'){
        		common.showConfirm('볼륨 삭제','볼륨을 삭제 하시겠습니까?').then(function(){
                    ct.deleteVolumesAction(type, id);
                });
        	} else if(type == 'tbl'){
        		if(ct.roles.length == 0) {
                    common.showAlert('메세지','선택된 볼륨이 없습니다.');
                } else {
                    common.showConfirm('볼륨 삭제','선택된 '+ct.roles.length+'개의 볼륨을 삭제 하시겠습니까?').then(function(){
                        ct.deleteVolumesAction(type, id);
                    });
                }
        	}

        }
     // 스토리지 삭제
        ct.deleteVolumesAction = function(type, id) {
            var prom = [];
            if(type == 'thum'){
            	prom.push(ct.deleteVolumesJob(id));
            }else if(type == 'tbl'){
            	for(var i=0; i< ct.roles.length; i++) {
                    prom.push(ct.deleteVolumesJob(ct.roles[i]));
                }
            }
            $q.all(prom).then(function(results){
                for(var i=0; i < results.length; i++ ) {
                    if(!results[i]) {
                        common.showAlert('메세지','오류가 발생하였습니다.');
                    }
                }
                $timeout(function () {
                    ct.fn.getStorageList();
                }, 1000);
                ct.roles = [];
            }).catch(function(e){
                $scope.main.loadingMainBody = false;
                common.showAlert('메세지',e);
            });
        }

        // 스토리지 삭제
        ct.deleteVolumesJob = function(id) {
        	$scope.main.loadingMainBody = true;
            var deferred = $q.defer();
            if(typeof id !== 'string') {
                return;
            }
            var param = {
                tenantId : ct.data.tenantId,
                volumeId : id
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'DELETE', param)
            returnPromise.success(function (data, status, headers) {
                deferred.resolve(true);
            });
            returnPromise.error(function (data, status, headers) {
                deferred.reject(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });

            return deferred.promise;
        };

        ct.fn.createStorage = function ($event) {
            $scope.dialogOptions = {
                controller : "iaasStorageFormCtrl",
                callBackFunction : ct.fn.getStorageList
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/storageForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);

            $scope.actionLoading = true; // action loading
        }

        ct.fn.createSnapshotPopBefore = function ($event,volume) {
            if(volume.status == 'in-use' || volume.status == 'available') {
                if(volume.status == 'in-use') {
                    var param = {
                        tenantId : volume.tenantId,
                        volumeId : volume.volumeId
                    }
                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/attachedInstanceCheck', 'GET', param, 'application/x-www-form-urlencoded')
                    returnPromise.success(function (data, status, headers) {
                        if(data.content.instanceStatus == 'active') {
                            common.showAlert('메세지',data.content.instanceName + '이 실행 중입니다. 인스턴스를 종료하고 시도해주세요.');
                        } else {
                            ct.fn.createSnapshotPop($event,volume);
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlert('메세지',data.message);
                    });
                    returnPromise.finally(function (data, status, headers) {
                        $scope.main.loadingMainBody = false;
                    });
                } else {
                    ct.fn.createSnapshotPop($event,volume);
                }
            } else {
                common.showAlert('메세지','스냅샷을 생성할 수 있는 상태가 아닙니다.');
            }
        }

        ct.fn.createSnapshotPop = function ($event, volume) {
            $scope.dialogOptions = {
                controller : "iaasCreateStorageSnapshotFormCtrl",
                callBackFunction : null,
                volume : volume
            };
            $scope.actionBtnHied = false;
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/storage/createSnapshotForm.html" + _VersionTail();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);

            $scope.actionLoading = true; // action loading
        }

//볼륨 스토리지 E

        if(ct.data.tenantId) {
            ct.fn.getUsedResource();
            ct.fn.getDeployServerList();
        	ct.fn.getStorageList();
        }
    })
;