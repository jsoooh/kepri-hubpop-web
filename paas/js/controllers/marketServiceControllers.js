'use strict';

angular.module('paas.controllers')
    .controller('paasMarketServicesCtrl', function ($scope, $location, $state, $stateParams, $translate, $filter, marketServiceService, common, CONSTANTS) {
        _DebugConsoleLog("marketServiceControllers.js : paasMarketServicesCtrl", 1);

        var ct = this;

        ct.marketServices = {};
        ct.marketServices.totalElements = 0;
        ct.bannerMarketServices = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 16,
            total : 1
        }

        ct.listMarketServices = function (currentPage) {
            $scope.main.loadingMainBody = true;
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            var marketServicePromise = marketServiceService.listMarketServicesByOpenStatus(ct.pageOptions.pageSize, ct.pageOptions.currentPage);
            marketServicePromise.success(function (data) {
                ct.marketServices = data;
                ct.pageOptions.total = data.totalElements;
                $scope.main.loadingMainBody = false;
            });
            marketServicePromise.error(function (data) {
                ct.marketServices = {};
                $scope.main.loadingMainBody = false;
            });
        };
        ct.marketServiceView = function (id) {
            common.locationPath("/market_services/" + id + "/view");
        };

        ct.loadPage = function() {
            ct.listMarketServices();
        };

        // main changeCategory 와 연결
        $scope.$on('categoryChanged',function(event, orgItem) {
            ct.loadPage();
        });

        ct.loadPage();

    })
    .controller('paasMarketServiceViewCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, $filter, marketServiceService, serviceMarketService, common, CONSTANTS) {
        _DebugConsoleLog("marketServiceControllers.js : paasMarketServiceViewCtrl", 1);

        var ct = this;

        ct.sltMarketServiceId = angular.isDefined($stateParams.id) ? $stateParams.id : null;
        ct.sltService = {};
        ct.sltPortalService = {};

        ct.sltParentId = 0;
        ct.sltMarketService = {};

        ct.getMarketService = function (id) {
            $scope.main.loadingMainBody = true;
            var marketServiceServicePromise = marketServiceService.getMarketService(id);
            marketServiceServicePromise.success(function (data) {
                ct.sltMarketService = data;
                ct.loadService = false;
                ct.loadPortalService = false;
                ct.getServiceByLabel(data.serviceLabel);
                ct.getPortalServiceByLabel(data.serviceLabel);
            });
            marketServiceServicePromise.error(function (data) {
                ct.sltMarketService = {};
                ct.marketServiceData = {};
                $scope.main.loadingMainBody = false;
            });
        };

        ct.getServiceByLabel = function (label) {
            var servicePromise = serviceMarketService.getServiceByLabel(label);
            servicePromise.success(function (data) {
                ct.sltService = data;
                ct.loadService = true;
                if (ct.loadPortalService) {
                    ct.setServicePlans();
                    $scope.main.loadingMainBody = false;
                }
            });
            servicePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.getPortalServiceByLabel = function (label) {
            var servicePromise = serviceMarketService.getPortalServiceByLabel(label);
            servicePromise.success(function (data) {
                ct.sltPortalService = data;
                ct.loadPortalService = true;
                if (ct.loadService) {
                    ct.setServicePlans();
                    $scope.main.loadingMainBody = false;
                }
            });
            servicePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.setServicePlans = function () {
            if(ct.sltPortalService != null && ct.sltPortalService.iconImage != null) {
                ct.sltService.iconImage = ct.sltPortalService.iconImage;
            }
            if(ct.sltService.extra != null && typeof ct.sltService.extra === 'string') {
                ct.sltService.extra = JSON.parse(ct.sltService.extra);
            }
            angular.forEach(ct.sltService.servicePlans, function (servicePlan) {
                if(servicePlan.extra != null && typeof servicePlan.extra === 'string') {
                    servicePlan.extra = JSON.parse(servicePlan.extra);
                }
            });
        };

        ct.createServiceInstance = function ($event, sltService, servicePlan) {
            var sltServiceMarket = {};
            sltServiceMarket.serviceGuid = sltService.guid;
            sltServiceMarket.serviceLabel = sltService.label;
            sltServiceMarket.servicePlanGuid = servicePlan.guid;
            sltServiceMarket.servicePlanName = servicePlan.name;

            $scope.dialogOptions = {
                controller : "serviceInstanceFormCtrl",
                serviceMarket : true,
                sltServiceMarket : sltServiceMarket
            };
            common.showDialog($scope, $event, $scope.dialogOptions);
        };

        ct.getMarketService(ct.sltMarketServiceId);
    })
;