'use strict';

angular.module('paas.controllers')
    .controller('paasMarketAppsCtrl', function ($scope, $location, $state, $stateParams, $translate, $filter, common, marketAppService, CONSTANTS) {
        _DebugConsoleLog("marketAppControllers.js : paasMarketAppsCtrl", 1);

        var ct = this;

        ct.marketApps = {};
        ct.marketApps.totalElements = 0;
        ct.bannerMarketApps = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 16,
            total : 1
        }

        ct.listMarketApps = function (currentPage) {
            $scope.main.loadingMainBody = true;
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            var marketAppPromise = marketAppService.listMarketAppsByOpenStatus(ct.pageOptions.pageSize, ct.pageOptions.currentPage);
            marketAppPromise.success(function (data) {
                ct.marketApps = data;
                ct.pageOptions.total = data.totalElements;
                $scope.main.loadingMainBody = false;
            });
            marketAppPromise.error(function (data) {
                ct.marketApps = {};
                $scope.main.loadingMainBody = false;
            });
        };

        ct.marketAppView = function (id) {
            common.locationPath("/market_apps/" + id + "/view");
        };

        ct.loadPage = function() {
            ct.listMarketApps();
        };

        // main changeCategory 와 연결
        $scope.$on('categoryChanged',function(event, orgItem) {
            ct.loadPage();
        });

        ct.loadPage();

    })
    .controller('paasMarketAppViewCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, $filter, marketServiceService, marketAppService, common, CONSTANTS) {
        _DebugConsoleLog("marketAppControllers.js : paasMarketAppViewCtrl", 1);

        var ct = this;

        ct.sltMarketAppId = angular.isDefined($stateParams.id) ? $stateParams.id : null;

        ct.sltMarketApp = {};
        ct.marketServices = [];

        ct.memorySlider = {
            value : 128,
            options: {
                floor: 0,
                ceil: 4096,
                step: 128,
                readOnly: true,
                showSelectionBar: true
            }
        };

        ct.diskQuotaSlider = {
            value : 128,
            options: {
                floor: 0,
                ceil: 2048,
                step: 128,
                readOnly: true,
                showSelectionBar: true
            }
        };

        ct.listAllMarketServices = function () {
            var marketServicePromise = marketServiceService.listAllMarketServicesByOpenStatus();
            marketServicePromise.success(function (data) {
                ct.setSelectMarketServices(data);
                $scope.main.loadingMainBody = false;
            });
            marketServicePromise.error(function (data) {
                ct.marketServices = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.getMarketApp = function (id) {
            $scope.main.loadingMainBody = true;
            var marketAppPromise = marketAppService.getAuthMarketApp(id);
            marketAppPromise.success(function (data) {
                ct.sltMarketApp = data;
                var buildpackVersionInfo =  ct.sltMarketApp.buildpackVersion.split("_buildpack-");
                ct.sltMarketApp.buildpackName = buildpackVersionInfo[0];
                if (buildpackVersionInfo[1]) {
                    ct.sltMarketApp.buildpackVersionName = buildpackVersionInfo[1].replace(/-/g, '.');
                }
                ct.memorySlider.value = ct.sltMarketApp.minMemory;
                ct.diskQuotaSlider.value = ct.sltMarketApp.minDisk;
	            $timeout(function () {
		            $scope.$broadcast('rzSliderForceRender');
	            }, 10);
	            if (ct.sltMarketApp.serviceLabels) {
                    ct.listAllMarketServices();
                } else {
                    $scope.main.loadingMainBody = false;
                }
            });
            marketAppPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.setSelectMarketServices = function(marketServices) {
            var serviceLabels = ct.sltMarketApp.serviceLabels.split(",");
            ct.marketServices = [];
            if (marketServices && marketServices.length > 0) {
                for (var i=0; i<marketServices.length; i++) {
                    for (var j=0; j<serviceLabels.length; j++) {
                        if (marketServices[i].serviceLabel == serviceLabels[j]) {
                            marketServices[i].checked = true;
                            ct.marketServices.push(marketServices[i]);
                            break;
                        }
                    }
                }
            }
        };

        ct.goMarketAppPush = function () {
            common.locationPath("/market_apps/" + ct.sltMarketAppId + "/push");
        };

        ct.getMarketApp(ct.sltMarketAppId);
    })
    .controller('paasMarketAppPushCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, user, marketAppService, applicationService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("marketAppControllers.js : paasMarketAppPushCtrl", 1);

        var ct = this;
        var vs = new ValidationService({ controllerAs: ct });

        ct.sltMarketAppId = angular.isDefined($stateParams.id) ? $stateParams.id : null;

        ct.organizations = [];
        ct.sltOrganization = {};
        ct.spaces = [];
        ct.sltSpace  = {};
        ct.domains = [];
        ct.sltDomainName;
        ct.sltPortalBuildpack  = {};
        ct.appPushData   = {};
        ct.formName = "marketAppPushForm";

        if ($scope.main.sltOrganizationGuid) {
            ct.appPushData.organizationGuid = $scope.main.sltOrganizationGuid;
        }

        if ($scope.main.sltSpaceGuid) {
            ct.appPushData.spaceGuid = $scope.main.sltSpaceGuid;
        }

        ct.appPushData.pushType = "MARKET";
        ct.appPushData.withStart = "true";

        ct.defaultSetting = {
            instances: 1,
            memory: 768,
            diskQuota: 512
        };

        ct.instancesSlider = {
            value : ct.defaultSetting.instances,
            options: {
                floor: 0,
                ceil: 20,
                step: 1,
                minLimit: 1,
                showSelectionBar: true
            }
        };

        ct.memorySlider = {
            value : ct.defaultSetting.memory,
            options: {
                floor: 0,
                ceil: 4096,
                step: 128,
                minLimit: 128,
                showSelectionBar: true
            }
        };

        ct.diskQuotaSlider = {
            value : ct.defaultSetting.diskQuota,
            options: {
                floor: 0,
                ceil: 2048,
                step: 128,
                minLimit: 128,
                showSelectionBar: true
            }
        };

        ct.getMarketApp = function (id) {
            $scope.main.loadingMainBody = true;
            var marketAppPromise = marketAppService.getAuthMarketApp(id);
            marketAppPromise.success(function (data) {
                ct.sltMarketApp = data;
                var buildpackVersionInfo =  ct.sltMarketApp.buildpackVersion.split("_buildpack-");
                ct.sltMarketApp.buildpackName = buildpackVersionInfo[0];
                if (buildpackVersionInfo[1]) {
                    ct.sltMarketApp.buildpackVersionName = buildpackVersionInfo[1].replace(/-/g, '.');
                }
                ct.memorySlider.value = ct.sltMarketApp.minMemory;
	            ct.memorySlider.options.minLimit = ct.sltMarketApp.minMemory;
                ct.diskQuotaSlider.value = ct.sltMarketApp.minDisk;
	            ct.diskQuotaSlider.options.minLimit = ct.sltMarketApp.minDisk;
	            $timeout(function () {
		            $scope.$broadcast('rzSliderForceRender');
	            }, 10);
	            if (ct.sltMarketApp.serviceLabels) {
                    ct.listAllServices(ct.sltMarketApp.serviceLabels);
                } else {
                    ct.loadMarketApp = true;
                    if (ct.loadOrganizations) {
                        $scope.main.loadingMainBody = false;
                    }
                }
            });
            marketAppPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllServices = function (serviceLabels) {
            var condition = "label:" + serviceLabels;
            var servicePromise = marketAppService.listAllServices(condition);
            servicePromise.success(function (data) {
                ct.services = data;
                ct.loadMarketApp = true;
                if (ct.loadOrganizations) {
                    $scope.main.loadingMainBody = false;
                }
            });
            servicePromise.error(function (data) {
                ct.services = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllOrganizations = function () {
            var organizationPromise = marketAppService.listAllOrganizations();
            organizationPromise.success(function (data) {
                $scope.main.organizations = angular.copy(data);
                $scope.main.syncListAllPortalOrgs();
                ct.organizations = $scope.main.sinkPotalOrgsName(data);
                ct.changeOrganization();
                ct.loadOrganizations = true;
                if (ct.loadMarketApp) {
                    $scope.main.loadingMainBody = false;
                }
            });
            organizationPromise.error(function (data) {
                ct.organizations = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.changeSpace = function () {
            if (ct.appPushData.spaceGuid) {
                ct.sltSpace = common.objectsFindCopyByField(ct.spaces, "guid", ct.appPushData.spaceGuid);
                if (!ct.sltSpace || !ct.sltSpace.guid) {
                    ct.appPushData.spaceGuid = "";
                } else {
                    if (ct.sltSpace.serviceInstances && ct.sltSpace.serviceInstances.length > 0) {
                        ct.serviceInstances = angular.copy(ct.sltSpace.serviceInstances);
                        ct.appPushData.serviceInstanceGuid = "";
                    } else {
                        ct.serviceInstances = [];
                        ct.appPushData.serviceInstanceGuid = "";
                    }
                }
            }
        };

        ct.changeOrganization = function () {
            if (ct.appPushData.organizationGuid) {
                ct.sltOrganization = common.objectsFindCopyByField(ct.organizations, "guid", ct.appPushData.organizationGuid);
                ct.spaces = angular.copy(ct.sltOrganization.spaces);
                ct.changeSpace();
                if (ct.sltOrganization.domains && ct.sltOrganization.domains.length > 0) {
                    ct.domains = angular.copy(ct.sltOrganization.domains);
                    ct.sltDomainName = ct.domains[0].name;
                } else {
                    ct.domains = [];
                    ct.sltDomainName = "";
                }
            } else {
                ct.sltOrganization = {};
                ct.spaces = [];
                ct.sltSpace = {};
                ct.appPushData.spaceGuid = "";
                ct.domains = [];
                ct.sltDomainName = "";
            }
        };

        ct.marketAppPush = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity(ct[ct.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }

	        $scope.main.loadingMain = true;
            $scope.main.loadingMainBody = true;
            var appBody = {};
	        appBody.marketAppId = ct.sltMarketAppId;
            appBody.organizationGuid = ct.appPushData.organizationGuid;
            appBody.spaceGuid = ct.appPushData.spaceGuid;
            appBody.pushType = ct.appPushData.pushType;
            appBody.appName = ct.appPushData.appName;
            appBody.hostName = ct.appPushData.appName + "." + ct.sltDomainName;
            appBody.withStart = false;
            var afterStart = (ct.appPushData.withStart == "true") ? true : false;
            if (ct.services && ct.services.length > 0) {
                appBody.appServiceInstances = [];
                for (var i=0; i<ct.services.length; i++) {
                    if (ct.services[i].sltServiceInstanceName && ct.services[i].sltServicePlanGuid) {
                        appBody.appServiceInstances.push({ name : ct.services[i].sltServiceInstanceName, servicePlanGuid : ct.services[i].sltServicePlanGuid });
                    }
                }
            }
            appBody.instances = ct.instancesSlider.value;
            appBody.memory = ct.memorySlider.value;
            appBody.diskQuota = ct.diskQuotaSlider.value;

            var appPushPromise = marketAppService.marketAppPush(appBody);
            appPushPromise.success(function (data) {
                $scope.actionBtnHied = false;
	            $scope.main.loadingMain = false;
                $scope.main.loadingMainBody = false;
                common.showAlertHtml($translate.instant("label.app") + "(" + data.name + ")", $translate.instant("message.mi_register_success")).then(function () {
	                if (afterStart) {
		                $scope.main.startAppGuid = data.guid;
	                }
                    $scope.main.goToPage('/paas/apps/' + data.guid);
                });
            });
            appPushPromise.error(function (data) {
                $scope.actionBtnHied = false;
	            $scope.main.loadingMain = false;
                $scope.main.loadingMainBody = false;
            });
        };

        ct.loadPage = function () {
            ct.loadOrganizations = false;
            ct.loadMarketApp = false;
            ct.listAllOrganizations();
            ct.getMarketApp(ct.sltMarketAppId);
        };

        ct.loadPage();
    })
;