//'use strict';

angular.module('paas.services')
	.factory('spaceQuotaService', function (common, cloudFoundry, CONSTANTS) {

		var spaceQuotaService = {};

        spaceQuotaService.listAllOrganizations = function (condition) {
            return cloudFoundry.organizations.listAllOrganizations(condition, 0);
        };

        spaceQuotaService.listSpaceQuotas = function (organizationGuid, size, page, condition) {
            if (organizationGuid) {
                return cloudFoundry.organizations.listOrganizationSpaceQuotas(organizationGuid, size, page, 1);
            } else {
                return cloudFoundry.spaceQuotas.listSpaceQuotas(size, page, condition, 1);
            }
        };

        spaceQuotaService.listAllSpaceQuotas = function (condition) {
            return cloudFoundry.spaceQuotas.listAllSpaceQuotas(condition, 1);
        };

        spaceQuotaService.createSpaceQuota = function (organizationGuid, spaceQuotaBody) {
            return cloudFoundry.spaceQuotas.createSpaceQuota(organizationGuid, spaceQuotaBody);
        };

        spaceQuotaService.getSpaceQuota = function (guid, depth) {
            return cloudFoundry.spaceQuotas.getSpaceQuota(guid, depth);
        };

        spaceQuotaService.deleteSpaceQuota = function (guid) {
            return cloudFoundry.spaceQuotas.deleteSpaceQuota(guid);
        };

		return spaceQuotaService;
	})
;
