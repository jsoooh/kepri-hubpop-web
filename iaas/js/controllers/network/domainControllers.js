'use strict';

angular.module('iaas.controllers')
    .controller('iaasDomainCtrl', function ($scope, $location, $state, $stateParams,$filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("domainControllers.js : iaasDomainCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.userTenant = $scope.main.userTenant;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getDomainList();
        });
        
        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
      
        ct.fn.addDomainFormOpen = function ($event) {
            var dialogOptions = {
                controller : "iaasDomainFormCtrl",
                callBackFunction : ct.fn.actionCallBackFun,
                tenantId : ct.data.tenantId,
                controllerAs : "domainPop",
                formMode : "add"
            };
            ct.addDomainDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.fn.modDomainFormOpen = function ($event, domain) {
            var dialogOptions = {
                controller : "iaasDomainFormCtrl",
                callBackFunction : ct.fn.actionCallBackFun,
                userTenantId : ct.data.tenantId,
                domain : domain,
                controllerAs : "domainPop",
                formMode : "mod"
            };
            ct.domainFormDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.fn.actionCallBackFun = function(domain, formMode) {
            ct.fn.getDomainList();
        };

        // 도메인 삭제
        ct.fn.deleteDomainName = function(domain) {
            common.showConfirm('도메인 삭제', '도메인("' + domain.domain + '")을 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    id : domain.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $state.reload();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };

        ct.fn.getDomainList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            };
            ct.domains = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/tenant/unusing', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.domains = data.content;
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        if(ct.data.tenantId) {
            ct.fn.getDomainList();
        }
    })
    .controller('iaasDomainFormCtrl', function ($scope, $location, $state, $translate, $stateParams, $mdDialog, popType, ValidationService, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("domainControllers.js : iaasDomainFormCtrl", 1);

        var domainPop = this;

        domainPop.validationService = new ValidationService({controllerAs : domainPop});
        domainPop.fn = {};
        domainPop.domain = {};

        domainPop.dialogOptions = popType == "child" ? $scope.childDialogOptions : $scope.dialogOptions;

        if (domainPop.dialogOptions.selector) {
            domainPop.selector = domainPop.dialogOptions.selector;
        }
        domainPop.tenantId = domainPop.dialogOptions.tenantId;
        domainPop.formMode = domainPop.dialogOptions.formMode;

        domainPop.callbackfn = domainPop.dialogOptions.callBackFunction;

        if (domainPop.formMode == "mod") {
            if (domainPop.domain.cert) {
                domainPop.dialogOptions.title = "인증서 재등록";
                domainPop.dialogOptions.okName =  "재등록";
            } else {
                domainPop.dialogOptions.title = "인증서 등록";
                domainPop.dialogOptions.okName =  "등록";
            }
            domainPop.isSslCert = true;
            domainPop.orgDomain = angular.copy(domainPop.dialogOptions.domain);
            domainPop.domain = angular.copy(domainPop.orgDomain);
        } else {
            domainPop.dialogOptions.title = "도메인 등록";
            domainPop.dialogOptions.okName =  "등록";
            domainPop.isSslCert = false;
            domainPop.domain = {};
            domainPop.domain.domainType = "public";
        }

        domainPop.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/network/domainForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        domainPop.dialogOptions.popDialogOk = function () {
            if (domainPop.formMode == "mod") {
                domainPop.fn.modDomainName();
            } else {
                domainPop.fn.addDomainName();
            }
        };

        domainPop.callBackFunction = domainPop.dialogOptions.callBackFunction;

        domainPop.userTenantId = domainPop.dialogOptions.userTenantId;
        domainPop.formName = "domainForm";

        domainPop.fn.getDomainRouter = function() {
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/dnsRouter/instance', 'GET');
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isObject(data.content)) {
                    domainPop.domainRouter = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        domainPop.fn.getBaseDomainList = function() {
            domainPop.baseDomains = [];
            var param = {};
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/baseDomain/all', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    domainPop.baseDomains = data.content;
                    if (domainPop.formMode == "add") {
                        domainPop.domain.baseDomain = domainPop.baseDomains[0].domain;
                    }
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        domainPop.fn.getDomainUsingList = function() {
            domainPop.usingDomainList = [];
            domainPop.usingDomainNames = [];
            var param = {};
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/all', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    domainPop.usingDomainList = data.content;
                    angular.forEach(domainPop.usingDomainList, function (domain, key) {
                        domainPop.usingDomainNames.push(domain.domain);
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
            });
        };

        domainPop.fn.subDomainCustomValidationCheck = function(subDomain) {
            if (subDomain && angular.isArray(domainPop.usingDomainNames) && domainPop.usingDomainNames.length > 0) {
                var domainName = subDomain + "." + domainPop.domain.baseDomain;
                if ((domainPop.formMode != "mod" || domainPop.orgDomain.domain != domainName) && domainPop.usingDomainNames.indexOf(domainName) >= 0) {
                    return {isValid: false, message: "이미 사용중인 서브도메인 입니다."};
                }
            }
            return {isValid : true};
        };

        domainPop.fn.domainCustomValidationCheck = function(domainName) {
            if (domainName && angular.isArray(domainPop.usingDomainNames) && domainPop.usingDomainNames.length > 0) {
                if ((domainPop.formMode != "mod" || domainPop.orgDomain.domain != domainName) && domainPop.usingDomainNames.indexOf(domainName) >= 0) {
                    return {isValid: false, message: "이미 사용중인 도메인 입니다."};
                }
            }
            return {isValid : true};
        };

        // 도메인 추가
        domainPop.fn.addDomainName = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!domainPop.validationService.checkFormValidity(domainPop[domainPop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var param = {
                tenantId : domainPop.tenantId,
                domainType : domainPop.domain.domainType
            };

            if (domainPop.domain.domainType == "public") {
                param.domain = domainPop.domain.subDomain + '.' + domainPop.domain.baseDomain;
                param.subDomain = domainPop.domain.subDomain;
                param.baseDomain = domainPop.domain.baseDomain;
            } else {
                param.domain = domainPop.domain.domainName;
            }

            if (domainPop.isSslCert) {
                param.cert = domainPop.domain.publicKey + "\n" + domainPop.domain.privateKey + "\n" + domainPop.domain.caKey;
            }

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain', 'POST', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isObject(data.content)) {
                    domainPop.callbackfn(data.content, "mod");
                }
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                domainPop.dialogOptions.popHide();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlert("message",data.message);
            });
        };

        // 도메인 수정
        domainPop.fn.modDomainName = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!domainPop.validationService.checkFormValidity(domainPop[domainPop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var param = {
                tenantId : domainPop.tenantId,
                domain : domainPop.domain.domain,
                cert: domainPop.domain.publicKey + "\n" + domainPop.domain.privateKey + "\n" + domainPop.domain.caKey
            };

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain', 'PUT', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isObject(data.content)) {
                    domainPop.callbackfn(data.content, "mod");
                }
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                domainPop.dialogOptions.popHide();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlert("message",data.message);
            });
        };

        domainPop.fn.getBaseDomainList();
        domainPop.fn.getDomainUsingList();
        domainPop.fn.getDomainRouter();

    })
;
