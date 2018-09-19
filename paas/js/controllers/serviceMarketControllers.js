'use strict';

angular.module('paas.controllers')
    .controller('serviceMarketCtrl', function ($scope, $location, $state, $stateParams, $translate, $filter, user, common, serviceMarketService, ValidationService, CONSTANTS) {
        _DebugConsoleLog("serviceMarketControllers.js : serviceMarketCtrl", 1);

        var ct = this;

        ct.portalServices = [];
        ct.cfServices = [];
        ct.services = [];
        ct.sltService = {};
        ct.selected = false;

        ct.listAllServices = function () {
            $scope.main.loadingMainBody = true;
            ct.isPortalServiceData = false;
            ct.isCfServiceData = false;
            ct.listAllPortalServices();
            ct.listAllCfServices();
        };

        ct.listAllPortalServices = function () {
            var servicePromise = serviceMarketService.listAllPortalServices();
            servicePromise.success(function (data) {
                ct.portalServices = data;
                ct.isPortalServiceData = true;
                if (ct.isCfServiceData) ct.listAllServicesAction();
            });
            servicePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllCfServices = function () {
            var servicePromise = serviceMarketService.listAllServices();
            servicePromise.success(function (data) {
                ct.cfServices = data;
                ct.isCfServiceData = true;
                if (ct.isPortalServiceData) ct.listAllServicesAction();
            });
            servicePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllServicesAction = function () {
            var result = [];
            for(var i = 0; i < ct.cfServices.length; i++) {
                var portalService = ($filter('filter')(ct.portalServices, {'label': ct.cfServices[i].label}))[0];
                if(portalService != null && portalService.iconImage != null) ct.cfServices[i].iconImage = portalService.iconImage;
                if(ct.cfServices[i].extra != null && typeof ct.cfServices[i].extra === 'string') ct.cfServices[i]["extra"] = JSON.parse(ct.cfServices[i].extra);
                result.push(ct.cfServices[i]);
            }
            ct.services = result;
            $scope.main.loadingMainBody = false;
        };

        ct.goToServiceDetail = function (label) {
            common.locationPath("/service_market/" + label);
        };

        ct.listAllServices();
    })
    .controller('serviceMarketDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $filter, user, common, serviceMarketService, ValidationService, CONSTANTS) {
        _DebugConsoleLog("serviceMarketControllers.js : serviceMarketDetailCtrl", 1);

        var ct = this;
        ct.sltServiceLabel = $stateParams.label;
        ct.sltService = {};
        ct.sltPortalService = {};

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

        ct.loadPage = function () {
            $scope.main.loadingMainBody = true;
            ct.loadService = false;
            ct.loadPortalService = false;
            ct.getServiceByLabel(ct.sltServiceLabel);
            ct.getPortalServiceByLabel(ct.sltServiceLabel);
        };

        ct.loadPage();
    })
;