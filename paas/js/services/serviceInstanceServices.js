//'use strict';

angular.module('paas.services')
	.factory('serviceInstanceService', function (common, cloudFoundry, CONSTANTS) {

		var serviceInstanceService = {};
        serviceInstanceService.listType = '';

        serviceInstanceService.getConditionByOrgAndSpace = function (organizationGuid, spaceGuid) {
            var condition = "";
            if (organizationGuid) {
                condition = "organization_guid : " + organizationGuid;
            }
            if (spaceGuid) {
                if (condition) {
                    condition += ";"
                }
                condition += "space_guid : " + spaceGuid;
            }
            return condition;
        };

        serviceInstanceService.listAllOrganizations = function () {
            return cloudFoundry.organizations.listAllOrganizations(null, 2);
        };

        serviceInstanceService.getOrganization = function (guid) {
            return cloudFoundry.organizations.getOrganization(guid, 2);
        };

        serviceInstanceService.listAllSpaces = function (organizationGuid) {
            if (organizationGuid) {
                return cloudFoundry.organizations.listAllOrganizationSpaces(organizationGuid, null, 1);
            } else {
                return cloudFoundry.spaces.listAllSpaces(null, 1);
            }
        };

        serviceInstanceService.listAllSpaceApps = function (spaceGuid) {
            return cloudFoundry.spaces.listAllSpaceApps(spaceGuid, "", 1);
        };

        serviceInstanceService.getService = function (guid) {
            return cloudFoundry.services.getService(guid, 1);
        };

        serviceInstanceService.listAllServices = function () {
            return cloudFoundry.services.listAllServices(null, 1);
        };

        serviceInstanceService.listAllServiceInstances = function (organizationGuid, spaceGuid) {
            var condition = serviceInstanceService.getConditionByOrgAndSpace(organizationGuid, spaceGuid);
            return cloudFoundry.serviceInstances.listAllServiceInstances(condition, 2);
        };

        serviceInstanceService.listServiceInstances = function (organizationGuid, spaceGuid, size, page) {
            var condition = serviceInstanceService.getConditionByOrgAndSpace(organizationGuid, spaceGuid);
            return cloudFoundry.serviceInstances.listServiceInstances(size, page, condition, 2);
        };

        serviceInstanceService.getServiceInstance = function (guid) {
            return cloudFoundry.serviceInstances.getServiceInstance(guid, 2);
        };

        serviceInstanceService.createServiceInstance = function (serviceInstanceBody) {
            return cloudFoundry.serviceInstances.createServiceInstance(serviceInstanceBody);
        };

        serviceInstanceService.updateServiceInstance = function (guid, serviceInstanceBody) {
            return cloudFoundry.serviceInstances.updateServiceInstance(guid, serviceInstanceBody);
        };

        serviceInstanceService.deleteServiceInstance = function (guid) {
            return cloudFoundry.serviceInstances.deleteServiceInstance(guid);
        };

        serviceInstanceService.listAllServiceInstanceBindings = function (guid) {
            return cloudFoundry.serviceInstances.listAllServiceInstanceBindings(guid, null, 0);
        };

        serviceInstanceService.listServiceInstanceBindings = function (guid, size, page) {
            return cloudFoundry.serviceInstances.listServiceInstanceBindings(guid, size, page, null, 1);
        };

        serviceInstanceService.listAllUserServiceInstances = function (organizationGuid, spaceGuid) {
            var condition = serviceInstanceService.getConditionByOrgAndSpace(organizationGuid, spaceGuid);
            return cloudFoundry.userServiceInstances.listAllUserServiceInstances(condition, 2);
        };

        serviceInstanceService.listUserServiceInstances = function (organizationGuid, spaceGuid, size, page) {
            var condition = serviceInstanceService.getConditionByOrgAndSpace(organizationGuid, spaceGuid);
            return cloudFoundry.userServiceInstances.listUserServiceInstances(size, page, condition, 2);
        };

        serviceInstanceService.getUserServiceInstance = function (guid) {
            return cloudFoundry.userServiceInstances.getUserServiceInstance(guid, 2);
        };

        serviceInstanceService.createUserServiceInstance = function (userServiceInstanceBody) {
            return cloudFoundry.userServiceInstances.createUserServiceInstance(userServiceInstanceBody);
        };

        serviceInstanceService.updateUserServiceInstance = function (guid, userServiceInstanceBody) {
            return cloudFoundry.userServiceInstances.updateUserServiceInstance(guid, userServiceInstanceBody);
        };

        serviceInstanceService.deleteUserServiceInstance = function (guid) {
            return cloudFoundry.userServiceInstances.deleteUserServiceInstance(guid);
        };

        serviceInstanceService.listAllUserServiceInstanceBindings = function (guid) {
            return cloudFoundry.userServiceInstances.listAllUserServiceInstanceBindings(guid, null, 0);
        };

        serviceInstanceService.listUserServiceInstanceBindings = function (guid, size, page) {
            return cloudFoundry.userServiceInstances.listUserServiceInstanceBindings(guid, size, page, null, 1);
        };

        serviceInstanceService.listAllSpaceApps = function (guid) {
            return cloudFoundry.spaces.listAllSpaceApps(guid, null, 0);
        };

        serviceInstanceService.createServiceBinding = function (appGuid, serviceInstanceGuid) {
            return cloudFoundry.serviceBindings.createServiceBinding(appGuid, serviceInstanceGuid);
        };

        serviceInstanceService.deleteServiceBinding = function (guid) {
            return cloudFoundry.serviceBindings.deleteServiceBinding(guid);
        };

        serviceInstanceService.listServices = function (size, page, conditions) {
            var condition = "";
            if (conditions && conditions.length > 0) {
                condition = conditions.join(";");
            }
            return cloudFoundry.services.listServices(size, page, condition, 1);
        };

        return serviceInstanceService;
	})
;
