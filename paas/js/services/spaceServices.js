//'use strict';

angular.module('paas.services')
	.factory('spaceService', function (common, cloudFoundry, CONSTANTS) {

		var spaceService = {};

        spaceService.listAllOrganizations = function (condition) {
            return cloudFoundry.organizations.listAllOrganizations(condition, 0);
        };

        spaceService.getOrganization = function (guid) {
            return cloudFoundry.organizations.getOrganization(guid, 2);
        };

        spaceService.listSpaces = function (organizationGuid, size, page, condition) {
            if (organizationGuid) {
                return cloudFoundry.organizations.listOrganizationSpaces(organizationGuid, size, page, 2);
            } else {
                return cloudFoundry.spaces.listSpaces(size, page, condition, 2);
            }
        };

        spaceService.listAllOrganizationSpaceQuotas = function (organizationGuid) {
            return cloudFoundry.organizations.listAllOrganizationSpaceQuotas(organizationGuid, 1);
        };

        spaceService.getSpace = function (guid, depth) {
            return cloudFoundry.spaces.getSpace(guid, depth);
        };

        spaceService.getSpaceSummery = function (guid) {
            return cloudFoundry.spaces.getSpaceSummery(guid);
        };

        spaceService.createSpace = function (spaceBody) {
            return cloudFoundry.spaces.createSpace(spaceBody);
        };

        spaceService.updateSpace = function (guid, spaceBody) {
            return cloudFoundry.spaces.updateSpace(guid, spaceBody);
        };

        spaceService.deleteSpace = function (guid) {
            return cloudFoundry.spaces.deleteSpace(guid);
        };

        spaceService.listAllSpaceUserRoles = function (spaceGuid) {
            return cloudFoundry.spaces.listAllSpaceUserRoles(spaceGuid, 0);
        };

        spaceService.listSpaceUserRoles = function (spaceGuid, size, page) {
            return cloudFoundry.spaces.listSpaceUserRoles(spaceGuid, size, page, 1);
        };

        spaceService.updateSpaceUserRole = function (spaceGuid, spaceUserRole) {
            return cloudFoundry.spaces.updateSpaceUserRole(spaceGuid, spaceUserRole);
        };

        spaceService.listOrganizationUserRoles = function (organizationGuid, size, page) {
            return cloudFoundry.organizations.listOrganizationUserRoles(organizationGuid, size, page, 1);
        };

        return spaceService;
	})
;
