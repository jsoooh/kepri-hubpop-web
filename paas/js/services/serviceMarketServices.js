//'use strict';

angular.module('paas.services')
    .factory('serviceMarketService', function (common, cloudFoundry, CONSTANTS) {

        var serviceMarketService = {};

        serviceMarketService.listAllPortalServices = function () {
            return cloudFoundry.portalServices.listAllPortalServices();
        };

        serviceMarketService.getPortalServiceByLabel = function (label) {
            return cloudFoundry.portalServices.getPortalServiceByLabel(label);
        };

        serviceMarketService.listAllServices = function () {
            return cloudFoundry.services.listAllServices(null, 1);
        };

        serviceMarketService.getService = function (guid) {
            return cloudFoundry.services.getService(guid, 1);
        };

        serviceMarketService.getServiceByLabel = function (label) {
            return cloudFoundry.services.getServiceByLabel(label, 1);
        };

        return serviceMarketService;
    })
;
