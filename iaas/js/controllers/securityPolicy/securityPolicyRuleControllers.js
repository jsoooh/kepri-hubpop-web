'use strict';

angular.module('iaas.controllers')
    .controller('iaasSecurityPolicyRuleCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("securityPolicyRuleControllers.js : iaasSecurityPolicyRuleCtrl", 1);

        var ct = this;
        ct.rule = {};
        ct.roles = [];
        ct.fn = {};
        ct.data = {};
        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event, status) {
            $scope.main.goToPage("/iaas/securityPolicy/securityPolicy");
            ct.data.tenantId = status.tenantId;
            // ct.fn.getPolicyManagementList();
        });

        ct.fn.formOpen = function($event){
			ct.fn.addPolicyRulePop($event);
        };
        
        ct.fn.getPolicyManagementList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                securityPolicyId : $stateParams.policyid
            };
            
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param,'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.policyRuleList = data.content[0].rules;
                ct.policyName = data.content[0].name;
                ct.policyId = data.content[0].id;
                ct.policyDescription = data.content[0].description;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("오류",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        
        ct.fn.addPolicyRulePop = function($event) {
            $scope.dialogOptions = {
                controller : "addPolicyRuleFormCtrl",
                callBackFunction : ct.fn.getPolicyManagementList
            };
            $scope.actionBtnHied = false;

            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/securityPolicy/securityPolicyRuleForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside1").stop().animate({"right":"0"}, 500);
			
            $scope.actionLoading = true; // action loading
        }

        ct.fn.deletePolicyRolesJob = function(id) {
        	common.showConfirm('보안 규칙 삭제','선택된 보안 규칙을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                
	            var deferred = $q.defer();
	            if(typeof id !== 'string') {
	                return;
	            }
	            var param = {
	                tenantId : ct.data.tenantId,
	                ruleId : id
	            }
	            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy/rule', 'DELETE', param)
	            returnPromise.success(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	                if (status == 200 && data) {
	                	common.showAlertSuccess('삭제되었습니다.');
	                	//common.showAlert("알림",'삭제되었습니다.');
	                	ct.fn.getPolicyManagementList();
	                } else {
	                	common.showAlertError('오류가 발생하였습니다.');
		                //common.showAlert("오류",'오류가 발생하였습니다.');
	                }
	            });
	            returnPromise.error(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	            	common.showAlertError(data.message);
	                //common.showAlert("오류",'오류가 발생하였습니다.');
	            });
	            returnPromise.finally(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	            });

        	});
        };
        
        if(ct.data.tenantId) {
            ct.fn.getPolicyManagementList();
        }
    })
    .controller('iaasAddPolicyRuleFormCtrl', function ($scope, $location, $state, $sce, $stateParams,$filter,$q,$translate,ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("securityPolicyControllers.js : iaasAddPolicyRuleFormCtrl", 1);
        
        $scope.contents = angular.copy(common.getMainContentsCtrlScope().contents);
        $scope.dialogOptions = angular.copy(common.getMainContentsCtrlScope().dialogOptions);
        
        $scope.actionLoading = false;

        var pop = this;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.data = {};
        pop.policy = {};
        pop.formName = "addPolicyRuleForm";
        pop.title = "규칙추가";
        pop.portType = "All";
        pop.protocol = 'tcp';
        pop.policy.protocol = 'tcp';

        // Dialog ok 버튼 클릭 시 액션 정의
        pop.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            
            if(pop.policy.protocol != 'icmp') {
                if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                    
                    return;
                }
            }
            pop.fn.addPolicyRule();
        };

        pop.fn.addPolicyRule = function() {

            if(pop.policy.minPort < 1 || pop.policy.minPort > 65535){
                common.showAlertWarning("입력가능한 포트 범위는 1 ~ 65535입니다.");
                pop.policy.minPort = "";
                return;
            }

            if(pop.policy.maxPort < 1 || pop.policy.maxPort > 65535){
                common.showAlertWarning("입력가능한 포트 범위는 1 ~ 65535입니다.");
                pop.policy.maxPort = "";
                return;
            }

            if(pop.policy.maxPort < pop.policy.minPort) {
            	common.showAlertWarning("최대 포트가 최소 포트보다 낮을 수 없습니다.");
                // common.showAlert("message","최대 포트가 최소 포트보다 낮을 수 없습니다.");
                pop.policy.maxPort = "";
                
                return;
            }


            $scope.main.loadingMainBody = true;
            $scope.main.asideClose();
            
            var param = {
                rule: pop.policy
            }
            param.rule.securityPolicyId = $scope.contents.policyId;
            param.rule.tenantId = pop.userTenant.tenantId;

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy/rule', 'POST', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $scope.contents.fn.getPolicyManagementList();
                common.showAlertSuccess("생성되었습니다.");
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("message",data.message);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }
        
        pop.fn.protocolChange = function($event) {
            if(pop.protocol != 'tcp' && pop.protocol != 'udp') {
                pop.policy = angular.fromJson(pop.protocol);
                pop.portType = 'port';
            } else {
                pop.policy.minPort = "";
                pop.policy.maxPort = "";
                pop.policy.protocol = pop.protocol;
            }
        }

        pop.fn.portTypeChange = function() {
            if(pop.portType == 'port') {
                pop.policy.maxPort = pop.policy.minPort
            }else if(pop.portType == 'All'){
            	pop.policy.minPort = '';
            	pop.policy.maxPort = '';
            }else if(pop.portType == 'range'){
            	pop.policy.minPort = '';
            	pop.policy.maxPort = '';
            }
        }

        pop.fn.policyRuleMeta = function() {
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy/rule/meta', 'GET', false, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                pop.policyRuleMetaList = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            	common.showAlertError(data.message);
                //common.showAlert("오류",data.message);
            });
        }
        
        pop.fn.policyRuleMeta();
    })
;
