'use strict';

angular.module('paas.controllers')
    .controller('paasSpaceQuotasCtrl', function ($scope, $location, $state, $stateParams, $translate, spaceQuotaService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("spaceQuotaControllers.js : paasSpaceQuotasCtrl", 1);
        var ct = this;
        var vs = new ValidationService();
        ct.spaceQuotas = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1,
        };

        ct.spaceQuotas.totalElements = 0;

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.spaceQuotaData = {};
        pop.organizations = [];
        pop.unitTypes = [{ key : "1" , val : "MB"}, {key : "1024", val : "GB"}];

        ct.listSpaceQuotas = function (currentPage) {
            $scope.main.loadingMainBody = true;
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            var spaceQuotaPromise = spaceQuotaService.listSpaceQuotas($scope.main.sltOrganizationGuid, ct.pageOptions.pageSize, ct.pageOptions.currentPage);
            spaceQuotaPromise.success(function (data) {
                ct.spaceQuotas = data;
                ct.pageOptions.total = data.totalElements;
                $scope.main.loadingMainBody = false;
            });
            spaceQuotaPromise.error(function (data) {
                ct.spaceQuotas = [];
                $scope.main.loadingMainBody = false;
            });
        };

        // main changeOrganization 와 연결
        $scope.$on('organizationChanged', function(event, orgItem) {
            ct.listSpaceQuotas();
        });

        $scope.authenticating = false;
        $scope.actionLoading = false;
        ct.createSpaceQuota = function ($event) {
            $scope.dialogOptions = {
                title : $translate.instant("label.space_quota_add"),
                formName : "createSpaceQuotaForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/spaceQuota/popSpaceQuotaForm.html" + _VersionTail(),
                okName : $translate.instant("label.add")
            };
            pop.organizations = angular.copy($scope.main.organizations);
            pop.spaceQuotaData	= {
                organizationGuid : $scope.main.sltOrganizationGuid,
                spaceQuotaMemoryLimitUnit : "1",
                spaceQuotaInstanceMemoryLimitUnit : "1"
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createSpaceQuotaAction(pop.spaceQuotaData);
            }
        };

        ct.deleteSpaceQuota = function (guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_space_quota'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.deleteSpaceQuotaAction(guid);
            });
        };

        pop.createSpaceQuotaAction = function (spaceQuotaData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            var spaceQuotaBody = {};
            spaceQuotaBody.organizationGuid = spaceQuotaData.organizationGuid;
            spaceQuotaBody.name = spaceQuotaData.name;
            spaceQuotaBody.totalServices = spaceQuotaData.spaceQuoaTotalServices;
            spaceQuotaBody.totalRoutes = spaceQuotaData.spaceQuoaTotalRoutes;
            spaceQuotaBody.memoryLimit = parseInt(spaceQuotaData.spaceQuotaMemoryLimit, 10) * parseInt(spaceQuotaData.spaceQuotaMemoryLimitUnit, 10);
            spaceQuotaBody.instanceMemoryLimit = parseInt(spaceQuotaData.spaceQuotaInstanceMemoryLimit, 10) * parseInt(spaceQuotaData.spaceQuotaInstanceMemoryLimitUnit, 10);
            spaceQuotaBody.appInstanceLimit = spaceQuotaData.spaceQuotaAppInstanceLimit;
            spaceQuotaBody.nonBasicServicesAllowed = String(false);

            $scope.actionLoading = true;
            var spaceQuotaPromise = spaceQuotaService.createSpaceQuota(spaceQuotaBody.organizationGuid, spaceQuotaBody);
            spaceQuotaPromise.success(function (data) {
                pop.organizations   = [];
                ct.listSpaceQuotas();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.popHide();
            });
            spaceQuotaPromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        ct.deleteSpaceQuotaAction = function (guid) {
            $scope.main.loadingMainBody = true;
            var spaceQuotaPromise = spaceQuotaService.deleteSpaceQuota(guid);
            spaceQuotaPromise.success(function (data) {
                ct.listSpaceQuotas();
            });
            spaceQuotaPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listSpaceQuotas();
    })
;
