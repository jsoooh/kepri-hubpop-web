'use strict';

angular.module('paas.controllers')
    .controller('paasDomainsCtrl', function ($scope, $location, $state, $stateParams, $translate, domainService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("domainControllers.js : paasDomainsCtrl", 1);

        var ct = this;
        var vs = new ValidationService();
      
        $scope.createPrivateDomainData = {};
        ct.sharedDomains = [];
        ct.privateDomains = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        ct.privateDomains.totalElements = 0;

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.privateDomainData = {};
        pop.organizations = [];

        ct.listAllSharedDomains = function () {
            var domainPromise = domainService.listAllSharedDomains();
            domainPromise.success(function (data) {
                ct.sharedDomains = data;
            });
            domainPromise.error(function (data) {
                ct.sharedDomains = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listPrivateDomains = function (currentPage) {
            $scope.main.loadingMainBody = true;
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            var domainPromise = domainService.listPrivateDomains($scope.main.sltOrganizationGuid, ct.pageOptions.pageSize, ct.pageOptions.currentPage);
            domainPromise.success(function (data) {
                ct.privateDomains = data;
                ct.pageOptions.total = data.totalElements;
                $scope.main.loadingMainBody = false;
            });
            domainPromise.error(function (data) {
                ct.privateDomains = [];
                $scope.main.loadingMainBody = false;
            });
        };

        // main changeOrganization 와 연결
        $scope.$on('organizationChanged', function(event, orgItem) {
            ct.listPrivateDomains();
        });

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.createPrivateDomain = function ($event) {
            $scope.dialogOptions = {
                title : $translate.instant("label.domain_add"),
                formName: "createPrivateDomainForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/domain/popPrivateDomainForm.html" + _VersionTail(),
                okName : $translate.instant("label.add")
            };
            pop.organizations = angular.copy($scope.main.organizations);
            pop.privateDomainData = {
                organizationGuid : $scope.main.sltOrganizationGuid
            };
            $scope.organizationEnabled = true;
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createPrivateDomainAction(pop.privateDomainData);
            }
        };

        ct.updatePrivateDomain = function ($event, privateDomain) {
            $scope.dialogOptions = {
                title : $translate.instant("label.domain_edit"),
                formName: "updatePrivateDomainForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/domain/popPrivateDomainForm.html" + _VersionTail(),
                okName : $translate.instant("label.edit")
            };
            pop.organizations = angular.copy($scope.main.organizations);
            pop.privateDomainData	= {
                organizationGuid : privateDomain.organization.guid,
                organizationName : privateDomain.organization.name,
                guid : privateDomain.guid,
                name : privateDomain.name
            };
            $scope.organizationEnabled = false;
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updatePrivateDomainAction(pop.privateDomainData);
            }
        };

        ct.deletePrivateDomain = function (guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_domain'));
            showConfirm.then(function () {
                common.mdDialogHide();
                pop.deletePrivateDomainAction(guid);
            });
        };

        ct.moveToRoutesPage = function (domainItem) {
            if (domainItem.organizationGuid) {
                var organization = common.objectsFindCopyByField($scope.main.organizations, "guid", domainItem.organizationGuid);
	            if (organization && angular.isDefined(organization.name)) {
		            $scope.main.detailOrgName = organization.name + "(" + organization.orgName + ")";
	            }
            }
            $scope.main.domainName = domainItem.name;
            $scope.main.goToPage('/paas/domains/' + domainItem.guid + '/routes');
        };

        pop.createPrivateDomainAction = function (privateDomainData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var privateDomainBody = {};
            privateDomainBody["organizationGuid"] = privateDomainData.organizationGuid;
            privateDomainBody["name"] = privateDomainData.name;
            
            var domainPromise = domainService.createPrivateDomain(privateDomainBody);
            domainPromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listPrivateDomains();
                pop.organizations = [];
                $scope.popHide();
            });
            domainPromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        pop.updatePrivateDomainAction = function (privateDomainData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var privateDomainBody = {};
            privateDomainBody["organizationGuid"] = privateDomainData.organizationGuid;
            privateDomainBody["name"] = privateDomainData.name;

            var domainPromise = domainService.updatePrivateDomain(privateDomainData.guid, privateDomainBody);
            domainPromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listPrivateDomains();
                pop.organizations = [];
                $scope.popHide();
            });
            domainPromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        pop.deletePrivateDomainAction = function (guid) {
            $scope.main.loadingMainBody = true;
            var domainPromise = domainService.deletePrivateDomain(guid);
            domainPromise.success(function (data) {
                ct.listPrivateDomains();
            });
            domainPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllSharedDomains();
        ct.listPrivateDomains();
    })
;
