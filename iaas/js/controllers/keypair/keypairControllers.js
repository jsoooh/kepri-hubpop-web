'use strict';

angular.module('iaas.controllers')
    .controller('iaasKeypairCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $bytes, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("keypairControllers.js : iaasKeypairCtrl", 1);

        var ct = this;
        ct.data = {};
        ct.fn = {};
        ct.ui = {};
        ct.roles = [];
        ct.keypair = {};
        ct.formType = '';
        
        
        $(".section-col.col2.type1").hide();
		
        ct.fn.formOpen = function($event, state, keypair){
    		ct.formType = state;
    		if(state == 'edit'){
    			ct.fn.editKeypairPop($event, keypair);
    		}else if (state == 'write'){
    			ct.fn.createKeypairPop($event);
    		}
        };

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        //ct.data.tenantId = 'acb13dd1207740e8aeebdb46a2eb2e71';
        // ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            // ct.data.tenantName = status.korName;
            ct.fn.searchKeypairList();
        });

        // Script list
        ct.fn.searchKeypairList = function() {
            $scope.main.loadingMainBody = true;
            var param = ct.data;

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                ct.keypairList = data.content;
                ct.keypair = {};
            });
            returnPromise.error(function (data, status, headers) {
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
        
        ct.fn.createKeypairPop = function ($event) {
            $scope.dialogOptions = {
                controller : "createKeypairFormCtrl",
                callBackFunction : ct.fn.searchKeypairList
            };
            $scope.actionBtnHied = false;
            
            $scope.main.layerTemplateUrl2 = _IAAS_VIEWS_ + "/keypair/keypairForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside2").stop().animate({"right":"0"}, 500);
			
            $scope.actionLoading = true; // action loading
        };

        ct.fn.editKeypairPop = function ($event,keypair) {
            $scope.dialogOptions = {
                controller : "editKeypairFormCtrl",
                callBackFunction : ct.fn.searchKeypairList,
                keypair : keypair
            };
            $scope.actionBtnHied = false;
            
            $scope.main.layerTemplateUrl2 = _IAAS_VIEWS_ + "/keypair/keypairForm.html" + _VersionTail();
            var name = $($event.currentTarget).attr("data-username"),
    		top = $(window).scrollTop();

			$(".aside").stop().animate({"right":"-360px"}, 400);
			$("#aside-aside2").stop().animate({"right":"0"}, 500);
            
            $scope.actionLoading = true; // action loading
        };

        ct.fn.deleteKeypairsBtn = function(keypairName) {
	        common.showConfirm('키 페어 삭제','선택한 키 페어를 삭제 하시겠습니까?').then(function(){
	            $scope.main.loadingMainBody = true;
	            var param = {
	                tenantId : ct.data.tenantId,
	                keypairName : keypairName
	            };
	            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'DELETE', param)
	            returnPromise.success(function (data, status, headers) {
	                $scope.main.loadingMainBody = false;
	                if (status == 200 && data) {
	                    common.showAlertSuccess("삭제되었습니다");
	                	//common.showAlert("message",'삭제되었습니다.');
	                	ct.fn.searchKeypairList();
	                } else {
	                	common.showAlertError('오류가 발생하였습니다.');
	                	//common.showAlert("message",'오류가 발생하였습니다.');
	                }
	            });
	            returnPromise.error(function (data, status, headers) {
                	common.showAlertError(data.message);
	                //common.showAlert("message",'오류가 발생하였습니다.');
	            });
	            
	        });
        };

        ct.fn.getKeyFile = function(keypair,type) {
            var param = {
                tenantId : ct.data.tenantId,
                name : keypair.keypairName
            }
            location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+ct.data.tenantId+"&keypairName="+keypair.keypairName;
        };
        if(ct.data.tenantId) {
            ct.fn.searchKeypairList();
        }
    })
    .controller('iaasKeypairFormCtrl', function ($scope, $location, $state,$translate, $stateParams, $bytes, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("keypairControllers.js : iaasKeypairFormCtrl", 1);

        $scope.contents = angular.copy(common.getMainContentsCtrlScope().contents);
        $scope.dialogOptions = angular.copy(common.getMainContentsCtrlScope().dialogOptions);
        
        $scope.computeContents;
        if(document.getElementById("computeCreate")){
			$scope.computeContents = angular.copy(angular.element(document.getElementById("computeCreate")).scope().pop);
        }
        
        
        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.keypair = {};
        pop.roles = [];
        
        if($scope.computeContents){
        	pop.formType = $scope.computeContents.formType;
        }else{
        	pop.formType = $scope.contents.formType;
        }
        
        pop.title = "";
        if(pop.formType == "write") {
        	pop.title = "키페어 생성";
        }else if(pop.formType == "edit"){
        	pop.title = "키페어 수정";
            pop.keypair = angular.copy($scope.dialogOptions.keypair);
        }
        pop.formName = "createKeypairForm";

        // Dialog ok 버튼 클릭 시 액션 정의
        pop.popDialogOk = function (evt) {
            if ($scope.actionBtnHied) return;
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                return;
            }
            
            pop.checkByte = $bytes.lengthInUtf8Bytes(pop.keypair.description);
        	if(pop.checkByte > 255){
        		return;
        	}
            
        	if(pop.formType == "write") {
        		pop.fn.createKeypair(evt);
            }else if(pop.formType == "edit"){
            	pop.fn.editKeypair(evt);
            }
            
        };
        
        
        pop.fn.createKeypair = function(evt) {
            $scope.main.loadingMainBody = true;
            pop.keypair.tenantId = pop.userTenant.tenantId;
            var param = {
                keypair : pop.keypair
            };
            var returnData = common.noMsgSyncHttpResponseJson(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'POST', param);
            if(returnData.status == 200) {
                if($scope.computeContents){
                	$scope.main.loadingMainBody = false;
                    if (returnData.responseJSON && returnData.responseJSON.content && returnData.responseJSON.content.keypair && returnData.responseJSON.content.keypair.name) {
                        $scope.computeContents.fn.appendKeypair(returnData.responseJSON.content.keypair);
                        $scope.computeContents.fn.getKeyFile(returnData.responseJSON.content.keypair, 'privateKey');
                    } else {
                        $scope.computeContents.fn.getKeypairList();
                    }
                }else{
                	$scope.main.loadingMainBody = false;
                	$scope.contents.fn.searchKeypairList();

                    if (returnData.responseJSON && returnData.responseJSON.content && returnData.responseJSON.content.keypair && returnData.responseJSON.content.keypair.name) {
                        $scope.contents.fn.getKeyFile(returnData.responseJSON.content.keypair, 'privateKey');
                    }
                }

                pop.keypairCreated = true;

                $scope.main.thisAsideClose(evt);
                common.showAlertSuccess('생성되었습니다.');
            	//common.showAlert("message",'생성되었습니다.');
            } else {
            	common.showAlertError(returnData.data.responseJSON.message);
                common.showAlert("message",returnData.data.responseJSON.message);
                $scope.main.loadingMainBody = false;
            }
        };

        pop.fn.editKeypair = function() {
            $scope.main.loadingMainBody = true;
            pop.keypair.tenantId = pop.userTenant.tenantId;
            var param = {
                keypair : pop.keypair
            };

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'PUT', param);
            returnPromise.success(function (data, status, headers) {
            	$scope.main.loadingMainBody = false;
                $scope.contents.fn.searchKeypairList();
                $scope.main.loadingMainBody = false;
                $scope.main.thisAsideClose(evt);
                common.showAlertSuccess('수정되었습니다.');
            });
            returnPromise.error(function (data, status, headers) {
            	common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        }
        
        pop.fn.checkByte = function (text, maxValue){
        	pop.checkByte = $bytes.lengthInUtf8Bytes(text);
        }
    })
    .controller('iaasKeypairInstanceCtrl', function ($scope, $location, $state, $stateParams,paging,$mdDialog, $q, $filter, user, common, CONSTANTS) {
        _DebugConsoleLog("keypairControllers.js : iaasKeypairInstanceCtrl", 1);

        var ct = this;
        ct.data = {};
        ct.fn = {};
        ct.ui = {};
        ct.roles = [];
        ct.keypair = {};
        ct.keypairName = $stateParams.keypairName;
        ct.data.tenantId = $scope.main.userTenantId;
        $scope.$on('userTenantChanged',function(event,status) {
            // ct.data.tenantId = status.tenantId;
            // ct.fn.getKeypairInstanceList();
            $scope.main.moveToAppPage('/iaas/keypair/keypair');
        });

        ct.fn.getKeypairInstanceList = function(page) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                keypairName : ct.keypairName
            }

            if (page != undefined) {
                param.number = page;
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.keypairInstanceList = data.content.instances;
                ct.pageOptions = paging.makePagingOptions(data);
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }
        if(ct.data.tenantId) {
            ct.fn.getKeypairInstanceList(1);
        }
    })
;
