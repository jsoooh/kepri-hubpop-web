'use strict';

angular.module('paas.controllers')
    .controller('paasRoutesCtrl', function ($scope, $location, $state, $stateParams, $translate, $filter, routeService, domainService, ValidationService, user, common, CONSTANTS) {
        _DebugConsoleLog("routeControllers.js : paasRoutesCtrl", 1);

        var ct = this;
        var vs = new ValidationService();
        ct.sltDomainGuid = $stateParams.guid;

        ct.routes = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        ct.routes.totalElements = 0;

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.routeData = {};
        pop.organizations = [];
        pop.spaces = [];
        pop.domains = [];

        ct.listRoutes = function (currentPage) {
            $scope.main.loadingMainBody = true;
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            var conditions = [];
            if ($scope.main.sltOrganizationGuid) {
                conditions.push("organization_guid:" + $scope.main.sltOrganizationGuid);
            }
            if (ct.sltDomainGuid) {
                conditions.push("domain_guid:" + ct.sltDomainGuid);
            }
            var routePromise = routeService.listRoutes(ct.pageOptions.pageSize, currentPage, conditions);
            routePromise.success(function (data) {
                ct.routes = data;
                ct.pageOptions.total = data.totalElements;
                $scope.main.domainName = ($filter('filter')(pop.domains, {'guid': ct.sltDomainGuid}))[0].name;
                $scope.main.loadingMainBody = false;
            });
            routePromise.error(function (data) {
                ct.routes = [];
                $scope.main.loadingMainBody = false;
            });
        };

        // main changeOrganization 와 연결
        $scope.$on('organizationChanged', function(event, orgItem) {
            ct.listRoutes();
        });

        ct.listAllDomains = function () {
            $scope.main.loadingMainBody = true;
            var domainPromise = domainService.listAllDomains();
            domainPromise.success(function (data) {
                pop.domains = data;
                ct.listRoutes();
            });
            domainPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.createRoute = function ($event) {
            $scope.dialogOptions = {
                title : $translate.instant("label.route_add"),
                formName: "createRouteForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/route/popRouteForm.html" + _VersionTail(),
                okName : $translate.instant("label.add")
            };
            pop.organizations = angular.copy($scope.main.organizations);
            pop.spaces = [];
            pop.routeData = {
                organizationGuid : $scope.main.sltOrganizationGuid,
                domainGuid : $stateParams.guid,
                domainName : $scope.main.domainName
            };
            for (var i = 0; i < pop.organizations.length; i++) {
                pop.spaces = pop.spaces.concat(pop.organizations[i].spaces);
            }
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createRouteAction(pop.routeData);
            }
        };

        ct.updateRoute = function ($event, route) {
            $scope.dialogOptions = {
                title : $translate.instant("label.route_edit"),
                formName: "updateRouteForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/route/popRouteForm.html" + _VersionTail(),
                okName : $translate.instant("label.edit")
            };
            pop.organizations = angular.copy($scope.main.organizations);
            pop.routeData = angular.copy(route);
            $scope.organizationEnabled = false;
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updateRouteAction(pop.routeData);
            }
        };

        ct.deleteRoute = function (guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_route'));
            showConfirm.then(function () {
                common.mdDialogHide();
                pop.deleteRouteAction(guid);
            });
        };
        
        pop.changeOrganization = function () {
            pop.routeData.spaceGuid = pop.routeData.domainGuid = pop.routeData.domainName = null;
        };

        pop.spaceFilter = function (space) {
            return space.organizationGuid === pop.routeData.organizationGuid;
        };

        pop.domainFilter = function (domain) {
            if (pop.routeData.organizationGuid) {
                return (typeof domain.organizationGuid === 'object' && domain.organizationGuid == null) || domain.organizationGuid === pop.routeData.organizationGuid;
            } else {
                return domain.guid === $stateParams.guid;
            }
        };

        pop.createRouteAction = function (routeData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var routeBody = {};
            routeBody["host"] = routeData.host;
            routeBody["domainGuid"] = routeData.domainGuid;
            routeBody["spaceGuid"] = routeData.spaceGuid;
            routeBody["path"] = routeData.path;
            routeBody["port"] = routeData.port;

            var routePromise = routeService.createRoute(routeBody);
            routePromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listRoutes();
                $scope.popHide();
            });
            routePromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };
        
        pop.updateRouteAction = function (routeData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var routePromise = routeService.updateRoute(routeData.guid, routeData);
            routePromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listRoutes();
                $scope.popHide();
            });
            routePromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        pop.deleteRouteAction = function (guid) {
            $scope.main.loadingMainBody = true;
            var routePromise = routeService.deleteRoute(guid);
            routePromise.success(function (data) {
                ct.listRoutes();
            });
            routePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllDomains();
    })
;
