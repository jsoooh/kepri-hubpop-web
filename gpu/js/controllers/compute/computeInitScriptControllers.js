'use strict';

// angular.module('iaas.controllers')
angular.module('gpu.controllers')
    // .controller('iaasComputeIntitScriptCtrl', function ($scope, $location, $state, $stateParams, $q, $filter, paging, user, common,CONSTANTS) {
    .controller('gpuComputeIntitScriptCtrl', function ($scope, $location, $state, $stateParams, $q, $filter, paging, user, common,CONSTANTS) {
        // _DebugConsoleLog("computeInitScriptControllers.js : iaasComputeIntitScriptCtrl", 1);
        _DebugConsoleLog("computeInitScriptControllers.js : gpuComputeIntitScriptCtrl", 1);

        $scope.actionBtnEnabled = true;
        var ct = this;

        ct.data = {};
        ct.fn = {};
        ct.method = 'POST';
        ct.roles = [];

        // 공통 레프트 메뉴의 userTenantId
        // ct.data.tenantId = common.getMainCtrlScope().main.userTenant.id;
        ct.data.tenantId = common.getMainCtrlScope().main.gpuUserTenant.id;
        // ct.data.tenantName = common.getMainCtrlScope().main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            // ct.data.tenantName = status.korName;
            ct.fn.searchSysScriptList();
        });

        ct.fn.formOpen = function(scriptId){
            ct.scriptId = scriptId;

            // $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeInitScriptForm.html" + _VersionTail();
            $scope.main.layerTemplateUrl = _GPU_VIEWS_ + "/compute/computeInitScriptForm.html" + _VersionTail();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        }

        // Script list
        ct.fn.searchScriptList = function() {
            ct.initScriptList = [];
            var param = {
                tenantId : ct.data.tenantId
            }
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'GET', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/initScript', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.pageOptions = paging.makePagingOptions(data);
                ct.pageOptions.total = data.content.length;
                ct.initScriptList = data.content;
                ct.initScript = {};
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        }

        ct.fn.searchSysScriptList = function() {
            $scope.main.loadingMainBody = true;
            ct.sysInitScriptList = [];
            var param;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScriptSys', 'GET', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/initScriptSys', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.sysInitScriptList = data.content;
                ct.fn.searchScriptList();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        }

        // initScript삭제
        ct.fn.deleteInitScriptBtn = function(id) {
            common.showConfirm('초기화 스크립트 삭제','선택한 초기화 스크립트를 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    scriptId : id
                }
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'DELETE', param)
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/initScript', 'DELETE', param)
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200 && data) {
                        common.showAlertSuccess("삭제되었습니다");
                        ct.fn.searchScriptList();
                    } else {
                        common.showAlertError('오류가 발생하였습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };
        if(ct.data.tenantId) {
            ct.fn.searchSysScriptList();
        }else if(!$scope.main.hubpop.projectIdSelected && !$scope.main.currentProjectId){ // 프로젝트 선택
            var showAlert = common.showDialogAlert('알림','프로젝트를 선택해주세요.');
            showAlert.then(function () {
                $scope.main.goToPage("/");
            });
            return false;
        }

    })
    // .controller('iaasComputeScriptDetailCtrl', function ($scope, $location, $state, $sce, $stateParams, $bytes,$filter, ValidationService, user, common,  CONSTANTS) {
    .controller('gpuComputeScriptDetailCtrl', function ($scope, $location, $state, $sce, $stateParams, $bytes,$filter, ValidationService, user, common,  CONSTANTS) {
        // _DebugConsoleLog("computeInitScriptControllers.js : iaasComputeScriptDetailCtrl", 1);
        _DebugConsoleLog("computeInitScriptControllers.js : gpuComputeScriptDetailCtrl", 1);

        $scope.contents = angular.copy(common.getMainContentsCtrlScope().contents);

        var pop = this;
        pop.fn = {};
        pop.data = {};
        pop.data.scriptId = $scope.contents.scriptId;
        // pop.data.tenantId = common.getMainCtrlScope().main.userTenant.id;
        pop.data.tenantId = common.getMainCtrlScope().main.gpuUserTenant.id;

        pop.formName = "initScriptForm";
        if(pop.data.scriptId) {
            pop.title = "사용자 정의 스크립트 수정";
            pop.method = "PUT";
        } else {
            pop.title = "사용자 정의 스크립트 생성";
            pop.method = "POST";
        }

        pop.fn.formClose = function(){
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $(".aside div").remove();
        }

        pop.fn.getInitScriptInfo = function() {
            var param = {
                scriptId : pop.data.scriptId
            }
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScriptId', 'GET', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/initScriptId', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.initScript = data.content[0];
                if(pop.initScript.scripType == 'sys'){
                    pop.title = "시스템 제공 스크립트 확인";
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        }

        pop.fn.createOrChangeInitScript = function(invalid) {
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                return;
            }
            pop.checkByte = $bytes.lengthInUtf8Bytes(pop.initScript.description);
            if(pop.checkByte > 255){
                return;
            }
            if(!pop.initScript.tenantId){
                pop.initScript.tenantId = pop.data.tenantId;
            }
            if(!pop.initScript.scripType){
                pop.initScript.scripType = 'user';
            }
            var param = {
                initScript : pop.initScript
            }
            $scope.main.loadingMainBody = true;
            pop.fn.formClose();
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', pop.method, param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/initScript', pop.method, param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $scope.contents.fn.searchScriptList();

                var messageData = "";
                if(pop.data.scriptId) {
                    messageData = "수정되었습니다.";
                } else {
                    messageData = "생성되었습니다.";
                }

                common.showAlertSuccess(messageData);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        }

        pop.fn.checkByte = function (text, maxValue){
            pop.checkByte = $bytes.lengthInUtf8Bytes(text);
        }

        if(pop.data.scriptId && pop.data.tenantId) {
            pop.fn.getInitScriptInfo();
        }
    })
;
