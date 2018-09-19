//'use strict';

angular.module('paas.services')
	.factory('applicationService', function (common, cloudFoundry, CONSTANTS) {

		var applicationService = {};

        applicationService.listAllSpaces = function (organizationGuid, condition) {
            if (organizationGuid) {
                return cloudFoundry.organizations.listAllOrganizationSpaces(organizationGuid, condition, 1);
            } else {
                return cloudFoundry.spaces.listAllSpaces(condition, 1);
            }
        };

        applicationService.listApps = function (size, page, conditions) {
            var condition = "";
            if (conditions && conditions.length > 0) {
                condition = conditions.join(";");
            }
            return cloudFoundry.apps.listApps(size, page, condition, 2);
        };

        applicationService.listAllOrganizations = function () {
            return cloudFoundry.organizations.listAllOrganizations(null, 2);
        };

        applicationService.listAllPortalBuildpacks = function () {
            return cloudFoundry.portalBuildpacks.listAllPortalBuildpacks();
        };

		applicationService.listAllBuildpacks = function () {
			return cloudFoundry.buildpacks.listAllBuildpacks(null);
		};

		applicationService.listAllPortalBuildpackVersions = function () {
            return cloudFoundry.portalBuildpackVersions.listAllPortalBuildpackVersions();
        };

        applicationService.appFilePush = function (appBody) {
            return cloudFoundry.apps.appFilePush(appBody);
        };

        applicationService.appPush = function (formData) {
            return cloudFoundry.apps.appPush(formData);
        };

		applicationService.appFileRePush = function (appBody) {
			return cloudFoundry.apps.appFileRePush(appBody);
		};

		applicationService.appRePush = function (formData) {
			return cloudFoundry.apps.appRePush(formData);
		};

        applicationService.getApp = function (guid, depth) {
        	if (angular.isUndefined(depth)) {
		        depth = 2;
	        }
            return cloudFoundry.apps.getApp(guid, depth);
        };

        applicationService.getAppStats = function (guid) {
            return cloudFoundry.apps.getAppStats(guid, 2);
        };

        applicationService.getAppSummary = function (guid) {
            return cloudFoundry.apps.getAppSummary(guid);
        };

		applicationService.listAllAppInstanceStats = function (guid) {
			return cloudFoundry.apps.listAllAppInstanceStats(guid);
		};

		applicationService.listAllAppServiceBindings = function (guid) {
            return cloudFoundry.apps.listAllAppServiceBindings(guid, null, 2);
        };

		applicationService.startApp = function (guid) {
			return cloudFoundry.apps.startApp(guid);
		};

		applicationService.stopApp = function (guid) {
			return cloudFoundry.apps.stopApp(guid);
		};

		applicationService.restartApp = function (guid) {
			return cloudFoundry.apps.restartApp(guid);
		};

        applicationService.updateAppState = function (guid, state) {
            return cloudFoundry.apps.updateAppState(guid, state);
        };

        applicationService.updateAppScale = function (guid, instances, memory, diskQuota) {
            return cloudFoundry.apps.updateAppScale(guid, instances, memory, diskQuota);
        };

        applicationService.restageApp = function (guid, withStart) {
            return cloudFoundry.apps.restageApp(guid, withStart);
        };

        applicationService.deleteApp = function (guid) {
            return cloudFoundry.apps.deleteApp(guid);
        };

        applicationService.deleteApp = function (guid) {
            return cloudFoundry.apps.deleteApp(guid);
        };

        applicationService.updateAppNameAction = function(guid, newName){
            return cloudFoundry.apps.updateAppNameAction(guid, newName);
        };

        applicationService.createServiceBinding = function (appGuid, serviceInstanceGuid) {
            return cloudFoundry.serviceBindings.createServiceBinding(appGuid, serviceInstanceGuid);
        };

        applicationService.deleteServiceBinding = function (guid) {
            return cloudFoundry.serviceBindings.deleteServiceBinding(guid);
        };

        applicationService.listAllSpaceServiceInstances = function (guid) {
            return cloudFoundry.spaces.listAllSpaceServiceInstances(guid, null, 0);
        };

        applicationService.listAllSpaceUserServiceInstances = function (guid) {
            return cloudFoundry.spaces.listAllSpaceUserServiceInstances(guid, null, 0);
        };

        applicationService.listAllAppRoutes = function (guid) {
            return cloudFoundry.apps.listAllAppRoutes(guid, null, 1);
        };

        applicationService.createRoute = function (routeBody) {
            return cloudFoundry.routes.createRoute(routeBody);
        };

        applicationService.deleteRoute = function (guid) {
            return cloudFoundry.routes.deleteRoute(guid);
        };

        applicationService.associateAppRoute = function (guid, routeGuid) {
            return cloudFoundry.apps.associateAppRoute(guid, routeGuid);
        };

        applicationService.removeAppRoute = function (guid, routeGuid) {
            return cloudFoundry.apps.removeAppRoute(guid, routeGuid);
        };

        applicationService.listAllDomains = function (guid) {
            return cloudFoundry.organizations.listAllDomains(guid, null);
        };

        applicationService.getAppEnvironment = function (guid) {
            return cloudFoundry.apps.getAppEnvironment(guid);
        };

        applicationService.updateAppUserEnvironment = function (guid, envBody) {
            return cloudFoundry.apps.updateAppUserEnvironment(guid, envBody);
        };

        applicationService.listAppEvents = function (guid, size, page) {
            return cloudFoundry.apps.listAppEvents(guid, size, page, "order:DESC");
        };

        applicationService.getAppAutoScalingPolicy = function (url, guid, token) {
            return cloudFoundry.apps.getAppAutoScalingPolicy(url, guid, token);
        };

        applicationService.createAppAutoScalingPolicy = function (url, guid, body, token) {
            return cloudFoundry.apps.createAppAutoScalingPolicy(url, guid, body, token);
        };

        applicationService.deleteAppAutoScalingPolicy = function (url, guid, token) {
            return cloudFoundry.apps.deleteAppAutoScalingPolicy(url, guid, token);
        };
        
        applicationService.listAppAutoScalingHistories = function (url, guid, token) {
            return cloudFoundry.apps.listAppAutoScalingHistories(url, guid, token);
        };

        applicationService.listAppMetricHistories = function (url, guid, metricType, token) {
            return cloudFoundry.apps.listAppMetricHistories(url, guid, metricType, token);
        };

        applicationService.getAppMonitoring = function (guid, time_step, start_time) {
            return cloudFoundry.apps.getAppMonitoring(guid, time_step, start_time);
        };

        applicationService.getOrganizationByName = function (name) {
            return cloudFoundry.apps.getOrganizationByName(name);
        };

        applicationService.getSpaceByName = function (guid, name) {
            return cloudFoundry.apps.getSpaceByName(guid, name);
        };

        applicationService.restartAppInstance = function (guid, index) {
            return cloudFoundry.apps.restartAppInstance(guid, index);
        };

        return applicationService;
	})
;
