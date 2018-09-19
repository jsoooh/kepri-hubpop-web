'use strict';

angular.module('iaas.controllers')
    .controller('iaasSecurityPolicyCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $bytes, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("securityPolicyControllers.js : iaasSecurityPolicyCtrl", 1);

        var ct = this;
        ct.data = {};
        ct.fn = {};
        ct.ui = {};
        ct.method = 'POST';
        ct.roles = [];
        ct.securityPolicy = {};
        
        ct.fn.formOpen = function($event, state, policy){
        	ct.fn.policyGroupAction($event, state, policy);
        }
        
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.fn.searchPolicyList();
        });

        // Script list
        ct.fn.searchPolicyList = function() {
            $scope.main.loadingMainBody = true;
            ct.policyList = [];
            ct.roles = [];

            var param = ct.data;

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.policyList = data.content;
                ct.securityPolicy = {};
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

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        
        ct.fn.policyGroupAction = function($event, state, policy) {
            $scope.dialogOptions = {
                controller : "policyGroupActionFormCtrl",
                callBackFunction : ct.fn.searchPolicyList,
                policy : policy
            };
            $scope.actionBtnHied = false;
            
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/securityPolicy/securityPolicyForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
			
            $scope.actionLoading = true; // action loading
        }

        ct.fn.deleteSecurityPolicyJob = function(id) {
	        common.showConfirm('보안그룹 삭제','선택한 보안그룹을 삭제 하시겠습니까?').then(function(){
	            $scope.main.loadingMainBody = true;
	            var param = {
	                tenantId : ct.data.tenantId,
	                securityPolicyId : id
	            }
	            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'DELETE', param)
	            returnPromise.success(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	                if (status == 200 && data) {
	                    common.showAlertSuccess('삭제되었습니다.');
	                    //common.showAlert("message",'삭제되었습니다.');
	                	ct.fn.searchPolicyList();
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
	            returnPromise.finally(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	            });
	        });
        };
        
        if(ct.data.tenantId) {
            ct.fn.searchPolicyList();
        }
    })
    .controller('iaasPolicyGroupActionFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate, $bytes,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("securityPolicyControllers.js : iaasPolicyGroupActionFormCtrl", 1);
        
        $scope.contents = angular.copy(common.getMainContentsCtrlScope().contents);
        $scope.dialogOptions = angular.copy(common.getMainContentsCtrlScope().dialogOptions);

        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.data = {};

        pop.formName = "securityPolicyGroupForm";
        pop.policy = angular.copy($scope.dialogOptions.policy);
        
        pop.validDisabled = true;

        if(pop.policy) {
        	pop.formType = "edit";
        	pop.title = "보안그룹 수정";
            pop.securityPolicy = pop.policy;
            pop.method = 'PUT';
        } else {
        	pop.formType = "write";
        	pop.title = "보안그룹 생성";
            pop.method = 'POST';
        }
        
        // Dialog ok 버튼 클릭 시 액션 정의
        pop.popDialogOk = function () {
        	if ($scope.actionBtnHied) return;
            
        	if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                return;
            }
        	
        	pop.checkByte = $bytes.lengthInUtf8Bytes(pop.securityPolicy.description);
        	if(pop.checkByte > 255){
        		return;
        	}
        	
            pop.fn.policyGroupAction();
        };

        pop.fn.policyGroupAction = function() {
            $scope.main.loadingMainBody = true;
            $scope.main.asideClose();
            pop.securityPolicy.tenantId = pop.userTenant.tenantId;
            var param = {
                securityPolicy : pop.securityPolicy
            }
            
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', pop.method, param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.securityPolicy = {};
                $scope.contents.fn.searchPolicyList();
                var messageData = "";
                if(pop.policy) {
                	messageData = "수정되었습니다.";
                } else {
                	messageData = "생성되었습니다.";
                }

                common.showAlertSuccess(messageData);
                
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

    })
;
