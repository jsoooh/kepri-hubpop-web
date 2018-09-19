'use strict';

angular.module('iaas.controllers')
    .controller('iaasComputeIntitScriptCtrl', function ($scope, $location, $state, $stateParams, $q, $filter, paging, user, common,CONSTANTS) {
        _DebugConsoleLog("computeInitScriptControllers.js : iaasComputeIntitScriptCtrl", 1);

        $scope.actionBtnHied = true;
        var ct = this;

        ct.data = {};
        ct.fn = {};
        ct.method = 'POST';
        ct.roles = [];

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        // ct.data.tenantName = $scope.main.userTenant.korName;
        //ct.data.tenantId = '7f9032fc56c540b7a95ea7f2682f419b';

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            // ct.data.tenantName = status.korName;
            ct.fn.searchScriptList();
        });

        ct.fn.formOpen = function(scriptId){
        	ct.scriptId = scriptId;
        	
    		$scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeInitScriptForm.html" + _VersionTail();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
        }
        
        ct.fn.checkAll = function($event) {
            ct.roles = [];
            if($event.currentTarget.checked) {
                for(var i=0; i < ct.initScriptList.length; i++) {
                    ct.roles.push(ct.initScriptList[i].scriptId);
                }
            }

        }

        ct.fn.checkOne = function($event,id) {
            if($event.currentTarget.checked) {
                if(ct.roles.length == $("#mainList tbody").find("input[type='checkbox']").length) {
                    $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);
            }
        }

        // Script list
        ct.fn.searchScriptList = function() {
            $scope.main.loadingMainBody = true;
            ct.initScriptList = [];

            var param = ct.data;

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'GET', param, 'application/x-www-form-urlencoded');
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
                //common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
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
	            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'DELETE', param)
	            returnPromise.success(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	                if (status == 200 && data) {
	                    common.showAlertSuccess("삭제되었습니다");
	                	//common.showAlert("message",'삭제되었습니다.');
	                	ct.fn.searchScriptList();
	                } else {
	                	common.showAlertError('오류가 발생하였습니다.');
	                	//common.showAlert("message",'오류가 발생하였습니다.');
	                }
	            });
	            returnPromise.error(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
                	common.showAlertError(data.message);
	            	//common.showAlert("message",'오류가 발생하였습니다.');
	            });
        	});
        };
        if(ct.data.tenantId) {
            ct.fn.searchScriptList();
        }
    })
    .controller('iaasComputeScriptDetailCtrl', function ($scope, $location, $state, $sce, $stateParams, $bytes,$filter, ValidationService, user, common,  CONSTANTS) {
        _DebugConsoleLog("computeInitScriptControllers.js : iaasComputeScriptDetailCtrl", 1);

        $scope.contents = angular.copy(common.getMainContentsCtrlScope().contents);
        
        var pop = this;
        pop.fn = {};
        pop.data = {};
        pop.data.scriptId = $scope.contents.scriptId;
        pop.data.tenantId = $scope.main.userTenantId;
        
        pop.formName = "initScriptForm";
        if(pop.data.scriptId) {
        	pop.title = "초기화 스크립트 수정";
        	pop.method = "PUT";
        } else {
        	pop.title = "초기화 스크립트 생성";
        	pop.method = "POST";
        }
        
        $scope.main.loadingMainBody = false;
        
        pop.fn.getInitScriptInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : pop.data.tenantId,
                scriptId : pop.data.scriptId
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	pop.initScript = data.content[0];
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
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
            
            var param = {
                initScript : pop.initScript
            }
            $scope.main.loadingMainBody = true;
            $scope.main.asideClose();
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/initScript', pop.method, param);
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
                //common.showAlert("message",messageData);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
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
