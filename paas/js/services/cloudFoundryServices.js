//'use strict';

angular.module('paas.services')
	.factory('cloudFoundry', function (common, CONSTANTS) {

		var cloudFoundry = {};

        cloudFoundry.organizations = {};

        // 동기 방식
        cloudFoundry.organizations.syncListAllOrganizations = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.syncHttpResponseJson(CONSTANTS.paasApiCfContextUrl + '/organizations/all', 'GET', getParams);
        };

        cloudFoundry.organizations.listAllOrganizations = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/all', 'GET', getParams));
        };

        cloudFoundry.organizations.listOrganizations = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations', 'GET', getParams));
        };

        cloudFoundry.organizations.getOrganization = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}', 'GET', getParams));
        };

        cloudFoundry.organizations.listAllOrganizationSpaceQuotas = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/space_quotas/all', 'GET', getParams));
        };

        cloudFoundry.organizations.listOrganizationSpaceQuotas = function (guid, size, page, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/space_quotas', 'GET', getParams));
        };

        cloudFoundry.organizations.listAllOrganizationSpaces = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/spaces/all', 'GET', getParams));
        };

        cloudFoundry.organizations.listOrganizationSpaces = function (guid, size, page, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/spaces', 'GET', getParams));
        };

        cloudFoundry.organizations.listOrganizationPrivateDomains = function (guid, size, page, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/private_domains', 'GET', getParams));
        };
        
        cloudFoundry.organizations.listOrganizationUserRoles = function (guid, size, page, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/user_roles', 'GET', getParams));
        };

        cloudFoundry.organizations.changeOrganizationUserRole = function (guid, organizationUserBody) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : organizationUserBody
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/user_role', 'PUT', getParams));
        };

        cloudFoundry.organizations.listAllDomains = function (guid, condition) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/{guid}/domains/all', 'GET', getParams));
        };

        cloudFoundry.spaceQuotas = {};

        cloudFoundry.spaceQuotas.listAllSpaceQuotas = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/space_quotas/all', 'GET', getParams));
        };

        cloudFoundry.spaceQuotas.listSpaceQuotas = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/space_quotas', 'GET', getParams));
        };

        cloudFoundry.spaceQuotas.createSpaceQuota = function (guid, spaceQuotaBody) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : spaceQuotaBody
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/space_quotas/organization/{guid}', 'POST', getParams));
        };

        cloudFoundry.spaceQuotas.getSpaceQuota = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/space_quotas/{guid}', 'GET', getParams));
        };

        cloudFoundry.spaceQuotas.deleteSpaceQuota = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/space_quotas/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.quotas = {};
        
        cloudFoundry.quotas.listAllQuotas = function () {
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/quotas', 'GET'));
		};

        cloudFoundry.quotas.listQuotas = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/quotas', 'GET', getParams));
        };

        cloudFoundry.quotas.createQuota = function (quotaBody) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/quotas', 'POST', quotaBody));
        };

        cloudFoundry.quotas.updateQuota = function (guid, quotaBody) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : quotaBody
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/quotas/{guid}', 'PUT', getParams));
        };

        cloudFoundry.quotas.deleteQuota = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/quotas/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.spaces = {};

        cloudFoundry.spaces.listAllSpaces = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/all', 'GET', getParams));
        };

        cloudFoundry.spaces.listSpaces = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces', 'GET', getParams));
        };

        cloudFoundry.spaces.getSpace = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}', 'GET', getParams));
        };

        cloudFoundry.spaces.getSpaceSummery = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}/summary', 'GET', getParams));
        };

        cloudFoundry.spaces.createSpace = function (spaceQuotaBody) {
            var getParams = spaceQuotaBody;
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces', 'POST', getParams));
        };

        cloudFoundry.spaces.updateSpace = function (guid, spaceQuotaBody) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : spaceQuotaBody
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}', 'PUT', getParams));
        };

        cloudFoundry.spaces.deleteSpace = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.spaces.listAllSpaceUserRoles = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}/user_roles/all', 'GET', getParams));
        };
        
        cloudFoundry.spaces.listSpaceUserRoles = function (guid, size, page, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}/user_roles', 'GET', getParams));
        };

        cloudFoundry.spaces.updateSpaceUserRole = function (spaceGuid, spaceUserRole) {
            var getParams = {
                urlPaths : {
                    "guid" : spaceGuid
                },
                body : spaceUserRole
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}/user_role', 'PUT', getParams));
        };

        cloudFoundry.spaces.listAllSpaceServiceInstances = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}/service_instances/all', 'GET', getParams));
        };

        cloudFoundry.spaces.listAllSpaceUserServiceInstances = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}/user_service_instances/all', 'GET', getParams));
        };

        cloudFoundry.spaces.listAllSpaceApps = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/{guid}/apps/all', 'GET', getParams));
        };


        cloudFoundry.domains = {};

        cloudFoundry.domains.listAllSharedDomains = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/shared_domains/all', 'GET', getParams));
        };

        cloudFoundry.domains.listSharedDomains = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 20,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/shared_domains', 'GET', getParams));
        };

        cloudFoundry.domains.createSharedDomain = function (sharedDomainBody) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/shared_domains', 'POST', sharedDomainBody));
        };

        cloudFoundry.domains.updateSharedDomain = function (guid, sharedDomainBody) {
            var getParams = sharedDomainBody;
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/shared_domains/{guid}', 'PUT', getParams));
        };

        cloudFoundry.domains.deleteSharedDomain = function (guid) {
            var getParams = {};
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/shared_domains/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.domains.listPrivateDomains = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 20,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/private_domains', 'GET', getParams));
        };

        cloudFoundry.domains.createPrivateDomain = function (privateDomainBody) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/private_domains', 'POST', privateDomainBody));
        };

        cloudFoundry.domains.updatePrivateDomain = function (guid, privateDomainBody) {
            var getParams = privateDomainBody;
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/private_domains/{guid}', 'PUT', getParams));
        };

        cloudFoundry.domains.deletePrivateDomain = function (guid) {
            var getParams = {};
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/private_domains/{guid}', 'DELETE', getParams));
        };
        
        cloudFoundry.domains.listAllDomains = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/domains/all', 'GET', getParams));
        };

        cloudFoundry.services = {};

        cloudFoundry.services.listAllServices = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/services/all', 'GET', getParams));
        };

        cloudFoundry.services.listServices = function (size, page, condition, depth) {
            var getParams = {
                "size": size ? size : 10,
                "page": page ? page : 1,
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/services', 'GET', getParams));
        };

        cloudFoundry.services.getService = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/services/{guid}', 'GET', getParams));
        };

        cloudFoundry.services.getServiceByLabel = function (label, depth) {
            var getParams = {
                urlPaths : {
                    "label" : label
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/services/label/{label}', 'GET', getParams));
        };

        cloudFoundry.services.deleteService = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/services/{guid}', 'DELETE', getParams));
        };


        cloudFoundry.serviceInstances = {};

        cloudFoundry.serviceInstances.listAllServiceInstances = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances/all', 'GET', getParams));
        };

        cloudFoundry.serviceInstances.listServiceInstances = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances', 'GET', getParams));
        };

        cloudFoundry.serviceInstances.getServiceInstance = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances/{guid}', 'GET', getParams));
        };

        cloudFoundry.serviceInstances.createServiceInstance = function (serviceInstanceBody) {
            var getParams = serviceInstanceBody;
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances', 'POST', getParams));
        };

        cloudFoundry.serviceInstances.updateServiceInstance = function (guid, serviceInstanceBody) {
            var getParams = serviceInstanceBody;
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances/{guid}', 'PUT', getParams));
        };

        cloudFoundry.serviceInstances.deleteServiceInstance = function (guid) {
            var getParams = {};
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.serviceInstances.listAllServiceInstanceBindings = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances/{guid}/service_bindings/all', 'GET', getParams));
        };

        cloudFoundry.serviceInstances.listServiceInstanceBindings = function (guid, size, page, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_instances/{guid}/service_bindings', 'GET', getParams));
        };

        cloudFoundry.userServiceInstances = {};

        cloudFoundry.userServiceInstances.listAllUserServiceInstances = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances/all', 'GET', getParams));
        };

        cloudFoundry.userServiceInstances.listUserServiceInstances = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances', 'GET', getParams));
        };

        cloudFoundry.userServiceInstances.getUserServiceInstance = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances/{guid}', 'GET', getParams));
        };

        cloudFoundry.userServiceInstances.createUserServiceInstance = function (userServiceInstanceBody) {
            var getParams = userServiceInstanceBody;
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances', 'POST', getParams));
        };

        cloudFoundry.userServiceInstances.updateUserServiceInstance = function (guid, userServiceInstanceBody) {
            var getParams = userServiceInstanceBody;
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances/{guid}', 'PUT', getParams));
        };

        cloudFoundry.userServiceInstances.deleteUserServiceInstance = function (guid) {
            var getParams = {};
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.userServiceInstances.listAllUserServiceInstanceBindings = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances/{guid}/service_bindings/all', 'GET', getParams));
        };

        cloudFoundry.userServiceInstances.listUserServiceInstanceBindings = function (guid, size, page, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/user_service_instances/{guid}/service_bindings', 'GET', getParams));
        };

        cloudFoundry.portalServices = {};

        cloudFoundry.portalServices.listAllPortalServices = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_services/all', 'GET'));
        };

        cloudFoundry.portalServices.listPortalServices = function (size, page) {
            var getParams = {
                "size": size ? size : 10,
                "page": page ? page : 1
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_services', 'GET', getParams));
        };

        cloudFoundry.portalServices.createPortalService = function (body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_services', 'POST', body, "multipart/form-data"));
        };

        cloudFoundry.portalServices.getPortalService = function (id) {
            var getParams = {};
            getParams.urlPaths = { "id" : id };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_services/{id}', 'GET', getParams));
        };

        cloudFoundry.portalServices.getPortalServiceByLabel = function (label) {
            var getParams = {};
            getParams.urlPaths = { "label" : label };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_services/label/{label}', 'GET', getParams));
        };

        cloudFoundry.portalServices.updatePortalService = function (id, body) {
            var getParams = {
                urlPaths : {
                    "id" : id
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_services/{id}', 'POST', getParams, "multipart/form-data"));
        };

        cloudFoundry.apps = {};

        cloudFoundry.apps.listAllApps = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/all', 'GET', getParams));
        };

        cloudFoundry.apps.listApps = function (size, page, condition, depth) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps', 'GET', getParams));
        };

        cloudFoundry.apps.appFilePush = function (body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/push/file', 'POST', body, "multipart/form-data"));
        };

        cloudFoundry.apps.appPush = function (formData) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/push', 'POST', formData));
        };

		cloudFoundry.apps.appFileRePush = function (body) {
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/re_push/file', 'POST', body, "multipart/form-data"));
		};

		cloudFoundry.apps.appRePush = function (formData) {
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/re_push', 'POST', formData));
		};

        cloudFoundry.apps.getApp = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}', 'GET', getParams));
        };

        cloudFoundry.apps.getAppStats = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/stats', 'GET', getParams));
        };

        cloudFoundry.apps.getAppSummary = function(guid){
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/summary', 'GET', getParams));
        };

		cloudFoundry.apps.listAllAppInstanceStats = function (guid) {
			var getParams = {
				urlPaths : {
					"guid" : guid
				}
			};
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/instance_stats/all', 'GET', getParams));
		};

		cloudFoundry.apps.listAllAppServiceBindings = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/service_bindings/all', 'GET', getParams));
        };

        cloudFoundry.apps.listAllAppRoutes = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/routes/all', 'GET', getParams));
        };

        cloudFoundry.apps.representativeAppRoute = function (guid, host) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "host" : host
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/routes/{host}/representative', 'PUT', getParams));
        };

        cloudFoundry.apps.associateAppRoute = function (guid, routeGuid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "routeGuid" : routeGuid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/routes/{routeGuid}', 'PUT', getParams));
        };

        cloudFoundry.apps.removeAppRoute = function (guid, routeGuid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "routeGuid" : routeGuid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/routes/{routeGuid}', 'DELETE', getParams));
        };

		cloudFoundry.apps.startApp = function (guid) {
			var getParams = {
				urlPaths : {
					"guid" : guid
				}
			};
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/start', 'PUT', getParams));
		};

		cloudFoundry.apps.stopApp = function (guid) {
			var getParams = {
				urlPaths : {
					"guid" : guid
				}
			};
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/stop', 'PUT', getParams));
		};

		cloudFoundry.apps.restartApp = function (guid) {
			var getParams = {
				urlPaths : {
					"guid" : guid
				}
			};
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/restart', 'PUT', getParams));
		};

		cloudFoundry.apps.updateAppState = function (guid, state) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "state" : state
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/state/{state}', 'PUT', getParams));
        };

        cloudFoundry.apps.updateAppScale = function (guid, instances, memory, diskQuota) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                instances : instances,
                memory : memory,
                diskQuota : diskQuota
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/scale', 'PUT', getParams));
        };

        cloudFoundry.apps.restageApp = function (guid, withStart) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
	            "withStart" : withStart
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/restage', 'PUT', getParams));
        };

        cloudFoundry.apps.deleteApp = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.apps.updateAppNameAction = function(guid, newName){
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "name" : newName
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}', 'PUT', getParams));
        };

        cloudFoundry.apps.getAppEnvironment = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/env', 'GET', getParams));
        };

        cloudFoundry.apps.updateAppUserEnvironment = function (guid, envBody) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : envBody
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/user_env', 'PUT', getParams));
        };

        cloudFoundry.apps.listAppEvents = function (guid, size, page, condition) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/events', 'GET', getParams));
        };

        cloudFoundry.apps.getAppAutoScalingPolicy = function (url, guid, token) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(url + '/v1/apps/{guid}/policy', 'GET', getParams, undefined, undefined, token));
        };

        cloudFoundry.apps.createAppAutoScalingPolicy = function (url, guid, autoScalingBody, token) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : autoScalingBody
            };
            return common.retrieveResource(common.resourcePromise(url + '/v1/apps/{guid}/policy', 'PUT', getParams, undefined, undefined, token));
        };

        cloudFoundry.apps.deleteAppAutoScalingPolicy = function (url, guid, token) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(url + '/v1/apps/{guid}/policy', 'DELETE', getParams, undefined, undefined, token));
        };

        cloudFoundry.apps.listAppAutoScalingHistories = function (url, guid, token) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "results-per-page" : 100000
            };
            return common.retrieveResource(common.resourcePromise(url + '/v1/apps/{guid}/scaling_histories', 'GET', getParams, undefined, undefined, token));
        };

        cloudFoundry.apps.listAppMetricHistories = function (url, guid, metricType, token) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "metrictype": metricType
                },
                "results-per-page" : 100000
            };
            return common.retrieveResource(common.resourcePromise(url + '/v1/apps/{guid}/metric_histories/{metrictype}', 'GET', getParams, undefined, undefined, token));
        };

        cloudFoundry.apps.getAppMonitoring = function (guid, time_step, start_time) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "time_step" : time_step,
                "start_time" : start_time
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.monitApiContextUrl + '/paas/container/' + guid + '/used_step', 'GET', getParams));
        };

        cloudFoundry.apps.getOrganizationByName = function (name) {
            var getParams = {
                urlPaths : {
                    "name" : name
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/name/{name}', 'GET', getParams));
        };

        cloudFoundry.apps.getSpaceByName = function (guid, name) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "name" : name
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/spaces/organizations/{guid}/name/{name}', 'GET', getParams));
        };

        cloudFoundry.apps.restartAppInstance = function (guid, index) {
          var getParams = {
              urlPaths : {
                  "guid" : guid,
                  "index" : index
              }
          }  ;
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/instances/{index}', 'DELETE', getParams));
        };


        cloudFoundry.serviceBindings = {};

        cloudFoundry.serviceBindings.createServiceBinding = function (appGuid, serviceInstanceGuid) {
            var getParams = {
                appGuid : appGuid,
                serviceInstanceGuid : serviceInstanceGuid
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_bindings/single', 'POST', getParams));
        };

        cloudFoundry.serviceBindings.deleteServiceBinding = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_bindings/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.routes = {};

        cloudFoundry.routes.listRoutes = function (size, page, condition, depth) {
            var getParams = {
                "size": size ? size : 10,
                "page": page ? page : 1,
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/routes', 'GET', getParams));
        };

        cloudFoundry.routes.createRoute = function (routeBody) {
            var getParams = routeBody;
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/routes', 'POST', getParams));
        };

        cloudFoundry.routes.updateRoute = function (guid, routeBody) {
            var getParams = routeBody;
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/routes/{guid}', 'PUT', getParams));
        };

        cloudFoundry.routes.deleteRoute = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/routes/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.routes.checkDuplRoute = function (guid, host) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "host" : host
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/routes/domain/{guid}/host/{host}/check', 'GET', getParams));
        };
        
        cloudFoundry.buildpacks = {};

        cloudFoundry.buildpacks.listAllBuildpacks = function (condition) {
            var getParams = {
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/buildpacks/all', 'GET', getParams));
        };

        cloudFoundry.buildpacks.listBuildpacks = function (size, page, condition) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1,
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/buildpacks', 'GET', getParams));
        };

        cloudFoundry.buildpacks.createBuildpack = function (pid, body) {
            var getParams = {
                urlPaths : {
                    "pid" : pid
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/buildpacks/portal/{pid}', 'POST', getParams, "multipart/form-data"));
        };

        cloudFoundry.buildpacks.getBuildpack = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/buildpacks/{guid}', 'GET', getParams));
        };

        cloudFoundry.buildpacks.updateBuildpack = function (guid, body) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/buildpacks/{guid}/update', 'POST', getParams, "multipart/form-data"));
        };

        cloudFoundry.buildpacks.deleteBuildpack = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/buildpacks/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.portalBuildpacks = {};

        cloudFoundry.portalBuildpacks.listAllPortalBuildpacks = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks/all', 'GET'));
        };

        cloudFoundry.portalBuildpacks.listPortalBuildpacks = function (size, page) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks', 'GET', getParams));
        };

        cloudFoundry.portalBuildpacks.getPortalBuildpack = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks/{id}', 'GET', getParams));
        };

        cloudFoundry.portalBuildpacks.createPortalBuildpack = function (body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks', 'POST', body, "multipart/form-data"));
        };

        cloudFoundry.portalBuildpacks.updatePortalBuildpack = function (id, body) {
            var getParams = {
                urlPaths : {
                    "id" : id
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks/{id}', 'POST', getParams, "multipart/form-data"));
        };

        cloudFoundry.portalBuildpacks.deletePortalBuildpack = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks/{id}', 'DELETE', getParams));
        };

        cloudFoundry.portalBuildpacks.listAllPortalBuildpackVersions = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks/{id}/versions/all', 'GET', getParams));
        };

        cloudFoundry.portalBuildpacks.listPortalBuildpackVersions = function (id, size, page) {
            var getParams = {
                urlPaths : {
                    "id" : id
                },
                "size" : size ? size : 10,
                "page" : page ? page : 1
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpacks/{id}/versions', 'GET', getParams));
        };

        cloudFoundry.portalBuildpackVersions = {};

        cloudFoundry.portalBuildpackVersions.listAllPortalBuildpackVersions = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpack_versions/all', 'GET'));
        };

        cloudFoundry.portalBuildpackVersions.listPortalBuildpackVersions = function (size, page) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpack_versions', 'GET', getParams));
        };

        cloudFoundry.portalBuildpackVersions.getPortalBuildpackVersion = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_buildpack_versions/{id}', 'GET', getParams));
        };

        cloudFoundry.serviceBrokers = {};

		cloudFoundry.serviceBrokers.getServicesCount = function () {
			return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/services/count', 'GET'));
		};

		cloudFoundry.serviceBrokers.listAllServiceBrokers = function (condition) {
            var getParams = {
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_brokers/all', 'GET', getParams));
        };

        cloudFoundry.serviceBrokers.listServiceBrokers = function (size, page, condition) {
            var getParams = {
                "size": size ? size : 10,
                "page": page ? page : 1,
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_brokers', 'GET', getParams));
        };

        cloudFoundry.serviceBrokers.createServiceBroker = function (body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_brokers', 'POST', body));
        };

        cloudFoundry.serviceBrokers.updateServiceBroker = function (guid, body) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_brokers/{guid}', 'PUT', getParams));
        };

        cloudFoundry.serviceBrokers.deleteServiceBroker = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_brokers/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.servicePlans = {};

        cloudFoundry.servicePlans.listAllServicePlans = function (condition) {
            var getParams = {
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_plans/all', 'GET', getParams));
        };

        cloudFoundry.servicePlans.updateServicePlan = function (guid, servicePlanBody) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : servicePlanBody
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_plans/{guid}', 'PUT', getParams));
        };

        cloudFoundry.servicePlans.deleteServicePlan = function (guid) {
            var getParams = {};
            getParams.urlPaths = { "guid" : guid };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_plans/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.servicePlans.listAllServiceInstances = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_plans/{guid}/service_instances/all', 'GET', getParams));
        };

        cloudFoundry.servicePlans.listServiceInstances = function (guid, size, page, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size": size ? size : 10,
                "page": page ? page : 1,
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_plans/{guid}/service_instances', 'GET', getParams));
        };

        cloudFoundry.servicePlans.listAllServicePlanVisibilities = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/service_plan_visibilities/all', 'GET', getParams));
        };

        // 셀 그룹
        cloudFoundry.isolationSegments = {};

        cloudFoundry.isolationSegments.listAllIsolationSegments = function (condition) {
            var getParams = {
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments/all', 'GET', getParams));
        };

        cloudFoundry.isolationSegments.listIsolationSegments = function (size, page, condition) {
            var getParams = {
                "size": size ? size : 10,
                "page": page ? page : 1,
                "condition" : condition ? condition : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments', 'GET', getParams));
        };

        cloudFoundry.isolationSegments.getIsolationSegment = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments/{guid}', 'GET', getParams));
        };

        cloudFoundry.isolationSegments.createIsolationSegment = function (name) {
            var getParams = {
                "name" : name
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments', 'POST', getParams));
        };

        cloudFoundry.isolationSegments.updateIsolationSegment = function (guid, name) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "name" : name
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments/{guid}', 'PUT', getParams));
        };

        cloudFoundry.isolationSegments.deleteIsolationSegment = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.isolationSegments.listAllIsolationSegmentPortalCells = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments/{guid}/portal_cells/all', 'GET', getParams));
        };

        cloudFoundry.isolationSegments.listIsolationSegmentsPortalCells = function (guid, size, page) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size": size ? size : 10,
                "page": page ? page : 1
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/isolation_segments/{guid}/portal_cells', 'GET', getParams));
        };

        // 셀
        cloudFoundry.portalCells = {};

        cloudFoundry.portalCells.listAllPortalCells = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_cells/all', 'GET'));
        };

        cloudFoundry.portalCells.getPortalCell = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_cells/{id}', 'GET', getParams));
        };

        cloudFoundry.portalCells.createPortalCell = function (body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_cells', 'POST', body));
        };

        cloudFoundry.portalCells.updatePortalCell = function (id, body) {
            var getParams = {
                urlPaths : {
                    "id" : id
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_cells/{id}', 'PUT', getParams));
        };

        cloudFoundry.portalCells.deletePortalCell = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/portal_cells/{id}', 'DELETE', getParams));
        };

        // 보안 그룹
        cloudFoundry.securityGroups = {};

        cloudFoundry.securityGroups.listAllSecurityGroups = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/all', 'GET', getParams));
        };

        cloudFoundry.securityGroups.listSecurityGroups = function (size, page, condition, depth) {
            var getParams = {
                "size": size ? size : 10,
                "page": page ? page : 1,
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups', 'GET', getParams));
        };

        cloudFoundry.securityGroups.getSecurityGroup = function (guid, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/{guid}', 'GET', getParams));
        };

        cloudFoundry.securityGroups.createSecurityGroup = function (body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups', 'POST', body));
        };

        cloudFoundry.securityGroups.updateSecurityGroup = function (guid, body) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/{guid}', 'PUT', getParams));
        };

        cloudFoundry.securityGroups.updateSecurityGroupRules = function (guid, body) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                body : body
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/{guid}/rules', 'PUT', getParams));
        };

        cloudFoundry.securityGroups.deleteSecurityGroup = function (guid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/{guid}', 'DELETE', getParams));
        };

        cloudFoundry.securityGroups.listAllSecurityGroupSpaces = function (guid, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/all', 'GET', getParams));
        };

        cloudFoundry.securityGroups.listSecurityGroupSpaces = function (guid, size, page, condition, depth) {
            var getParams = {
                urlPaths : {
                    "guid" : guid
                },
                "size": size ? size : 10,
                "page": page ? page : 1,
                "condition" : condition ? condition : "",
                "depth": depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups', 'GET', getParams));
        };

        cloudFoundry.securityGroups.associateSecurityGroupSpace = function (guid, spaceGuid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "spaceGuid" : spaceGuid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/{guid}/spaces/{spaceGuid}', 'POST', getParams));
        };

        cloudFoundry.securityGroups.removeSecurityGroupSpace = function (guid, spaceGuid) {
            var getParams = {
                urlPaths : {
                    "guid" : guid,
                    "spaceGuid" : spaceGuid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/security_groups/{guid}/spaces/{spaceGuid}', 'DELETE', getParams));
        };

        cloudFoundry.vms = {};

        cloudFoundry.vms.listAllVMs = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/vms/all', 'GET'));
        };

        cloudFoundry.vms.listVmsByDeployment = function (deployment) {
            var getParams = {
                urlPaths : {
                    "deployment" : deployment
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/vms/deployment/{deployment}', 'GET', getParams));
        };

        cloudFoundry.vms.listAllDeployments = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/vms/deployments/all', 'GET'));
        };

        cloudFoundry.stemcells = {};

        cloudFoundry.stemcells.listAllStemcells = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/stemcells/all', 'GET'));
        };

        cloudFoundry.releases = {};

        cloudFoundry.releases.listAllReleases = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/releases/all', 'GET'));
        };
        
        return cloudFoundry;

	})
;
