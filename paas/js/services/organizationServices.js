//'use strict';

angular.module('paas.services')
	.factory('organizationService', function (common, portal, cloudFoundry, CONSTANTS) {

		var organizationService = {};

        organizationService.listAllOrganizations = function (condition, depth) {
            depth = angular.isDefined(depth) ? depth : 2;
            return cloudFoundry.organizations.listAllOrganizations(condition, depth);
        };

        organizationService.listOrganizations = function (size, page, condition, depth) {
            depth = angular.isDefined(depth) ? depth : 2;
            return cloudFoundry.organizations.listOrganizations(size, page, condition, depth);
        };

        organizationService.listAllPortalOrgs = function () {
            return portal.portalOrgs.listAllPortalOrgs();
        };

        organizationService.getOrganization = function (guid) {
            return cloudFoundry.organizations.getOrganization(guid, 2);
        };

		return organizationService;
	})
;
