'use strict';

angular.module('paas.controllers')
    .controller('paasDashboardCtrl', function ($scope, $location, $state, $stateParams, user, portal, organizationService, applicationService, common, CONSTANTS) {
        _DebugConsoleLog("paasController.js : paasDashboardCtrl", 1);

        var ct = this;

        ct.portalInfo = {};
        ct.serviceInfo = {};
        ct.orgQuotaInfo = {};
        ct.appStartInfo = {};
        ct.appStopInfo = {};
        ct.buildpackInfo = {};
        ct.portalBuildpacks = [];

        ct.listAllPortalOrgs = function () {
            var commOrganizationPromise = portal.portalOrgs.listAllPortalOrgs();
            commOrganizationPromise.success(function (data) {
                $scope.main.portalOrgs = data;
                ct.listAllOrganizations();
            });
            commOrganizationPromise.error(function (data) {
                $scope.main.portalOrgs = [];
                $scope.main.loadingMainBody = true;
            });
        };

        ct.listAllOrganizations = function () {
            var organizationPromise = organizationService.listAllOrganizations();
            organizationPromise.success(function (data) {
                // Organization 한글명 매핑
                $scope.main.organizations = $scope.main.sinkPotalOrgsName(data);
                ct.setOrgInfo();
            });
            organizationPromise.error(function (data) {
                $scope.main.organizations = [];
                $scope.main.loadingMainBody = true;
            });
        };

        ct.listAllPortalBuildpacks = function () {
            var portalBuildpacksPromise = applicationService.listAllPortalBuildpacks();
            portalBuildpacksPromise.success(function (data) {
                ct.portalBuildpacks = data;
                ct.loadPortalBuildpacks = true;
                if (ct.loadBuildpackInfo) {
                    ct.setPortalBuildpacks();
                }
            });
            portalBuildpacksPromise.error(function (data) {
                ct.portalBuildpacks = [];
                $scope.main.loadingMainBody = true;
            });
        };

        ct.setOrgInfo = function () {
            var organizations = $scope.main.organizations;
            ct.portalInfo.orgCount = 0;

            ct.serviceInfo.passServicesCount = 0;
            ct.serviceInfo.userServicesCount = 0;
            ct.serviceInfo.routesCount = 0;

            ct.orgQuotaInfo.totalServices = 0;
            ct.orgQuotaInfo.totalRoutes = 0;
            ct.orgQuotaInfo.memoryLimit = 0;
            ct.orgQuotaInfo.appInstanceLimit = 0;

            ct.appStartInfo.apps = 0;
            ct.appStartInfo.instances = 0;
            ct.appStartInfo.memory = 0;
            ct.appStartInfo.diskQuota = 0;

            ct.appStopInfo.apps = 0;
            ct.appStopInfo.instances = 0;
            ct.appStopInfo.memory = 0;
            ct.appStopInfo.diskQuota = 0;

            ct.portalInfo.userCount = 0;
            var users = [];

            ct.buildpackInfo = {};

            var orgCount = 0;
            for (var i=0; i<organizations.length; i++) {
                orgCount++;
                if (organizations[i].quotaDefinition && organizations[i].quotaDefinition.guid) {
                    ct.orgQuotaInfo.totalServices += organizations[i].quotaDefinition.totalServices;
                    ct.orgQuotaInfo.totalRoutes += organizations[i].quotaDefinition.totalRoutes;
                    ct.orgQuotaInfo.memoryLimit += organizations[i].quotaDefinition.memoryLimit;
                    ct.orgQuotaInfo.appInstanceLimit += organizations[i].quotaDefinition.appInstanceLimit;
                }
                if (angular.isArray(organizations[i].users) && organizations[i].users.length > 0) {
                    for (var j=0; j<organizations[i].users.length; j++) {
                        if (users.indexOf(organizations[i].users[j].guid) == -1) {
                            users.push(organizations[i].users[j].guid);
                        }
                    }
                }
                if (angular.isArray(organizations[i].spaces) && organizations[i].spaces.length > 0) {
                    var spaces = organizations[i].spaces;
                    for (var j=0; j<spaces.length; j++) {
                        if (angular.isArray(spaces[j].serviceInstances) && spaces[j].serviceInstances.length > 0) {
                            ct.serviceInfo.passServicesCount += spaces[j].serviceInstances.length;
                        }
                        if (angular.isArray(spaces[j].userServiceInstances) && spaces[j].userServiceInstances.length > 0) {
                            ct.serviceInfo.userServicesCount += spaces[j].userServiceInstances.length;
                        }
                        if (angular.isArray(spaces[j].routes) && spaces[j].routes.length > 0) {
                            ct.serviceInfo.routesCount += spaces[j].routes.length;
                        }
                        if (angular.isArray(spaces[j].apps) && spaces[j].apps.length > 0) {
                            var apps = spaces[j].apps;
                            for (var k=0; k<apps.length; k++) {
                                if (apps[k].state == "STARTED") {
                                    ct.appStartInfo.apps++;
                                    ct.appStartInfo.instances += apps[k].instances;
                                    ct.appStartInfo.memory += apps[k].memory * apps[k].instances;
                                    ct.appStartInfo.diskQuota += apps[k].diskQuota * apps[k].instances;
                                } else {
                                    ct.appStopInfo.apps++;
                                    ct.appStopInfo.instances += apps[k].instances;
                                    ct.appStopInfo.memory += apps[k].memory * apps[k].instances;
                                    ct.appStopInfo.diskQuota += apps[k].diskQuota * apps[k].instances;
                                }
                                if (apps[k].buildpack) {
                                    var buildpackVersions = apps[k].buildpack.split("_buildpack-");
                                    var buildpack = buildpackVersions[0];
                                    if (!ct.buildpackInfo[buildpack]) {
                                        ct.buildpackInfo[buildpack] = {
                                            appStartCount : 0,
                                            appStopCount : 0
                                        };
                                    }
                                    if (apps[k].state == "STARTED") {
                                        ct.buildpackInfo[buildpack].appStartCount++;
                                    } else {
                                        ct.buildpackInfo[buildpack].appStopCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            ct.portalInfo.orgCount = orgCount;
            ct.portalInfo.userCount = users.length;
            ct.loadBuildpackInfo = true;
            if (ct.loadPortalBuildpacks) {
                ct.setPortalBuildpacks();
            }
        };


        ct.setPortalBuildpacks = function () {
            for (var i=0; i<ct.portalBuildpacks.length; i++) {
                ct.portalBuildpacks[i].appStartCount = 0;
                ct.portalBuildpacks[i].appStopCount = 0;
                var buildpack = ct.portalBuildpacks[i].name;
                if (ct.buildpackInfo[buildpack]) {
                    ct.portalBuildpacks[i].appStartCount = ct.buildpackInfo[buildpack].appStartCount;
                    ct.portalBuildpacks[i].appStopCount = ct.buildpackInfo[buildpack].appStopCount;
                }
            }
            $scope.main.loadingMainBody = false;
        };

        ct.loadPage = function () {
            $scope.main.loadingMainBody = true;
            ct.listAllPortalOrgs();
            ct.listAllPortalBuildpacks();
        };

        ct.loadPage();
    })
;
