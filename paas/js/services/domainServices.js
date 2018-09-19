//'use strict';

angular.module('paas.services')
	.factory('domainService', function (common, cloudFoundry, CONSTANTS) {

		var domainService = {};

		domainService.listOrganizations = function (condition) {
			return cloudFoundry.organizations.listOrganizations(condition, 0);
		};
		
		domainService.listAllSharedDomains = function () {
			return cloudFoundry.domains.listAllSharedDomains();
		};

		domainService.listSharedDomains = function (size, page) {
			return cloudFoundry.domains.listSharedDomains(size, page);
		};

		domainService.createSharedDomain = function (sharedDomainBody) {
			return cloudFoundry.domains.createSharedDomain(sharedDomainBody);
		};
		
		domainService.updateSharedDomain = function (guid, sharedDomainBody) {
			return cloudFoundry.domains.updateSharedDomain(guid, sharedDomainBody);
		};

		domainService.deleteSharedDomain = function (guid) {
			return cloudFoundry.domains.deleteSharedDomain(guid);
		};

		domainService.listPrivateDomains = function (organizationGuid, size, page, condition) {
			if (organizationGuid) {
				return cloudFoundry.organizations.listOrganizationPrivateDomains(organizationGuid, size, page, 1);
			} else {
				return cloudFoundry.domains.listPrivateDomains(size, page, condition, 1);
			}
		};

		domainService.createPrivateDomain = function (privateDomainBody) {
			return cloudFoundry.domains.createPrivateDomain(privateDomainBody);
		};

		domainService.updatePrivateDomain = function (guid, privateDomainBody) {
			return cloudFoundry.domains.updatePrivateDomain(guid, privateDomainBody);
		};

		domainService.deletePrivateDomain = function (guid) {
			return cloudFoundry.domains.deletePrivateDomain(guid);
		};
		
		domainService.listAllDomains = function () {
			return cloudFoundry.domains.listAllDomains();	
		};
		
		return domainService;
	})
;
