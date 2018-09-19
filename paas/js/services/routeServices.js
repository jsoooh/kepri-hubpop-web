//'use strict';

angular.module('paas.services')
    .factory('routeService', function (common, cloudFoundry, CONSTANTS) {

        var routeService = {};

        routeService.listRoutes = function (size, page, conditions) {
            var condition = "";
            if (conditions && conditions.length > 0) {
                condition = conditions.join(";");
            }
            return cloudFoundry.routes.listRoutes(size, page, condition, 1);
        };

        routeService.createRoute = function (routeBody) {
            return cloudFoundry.routes.createRoute(routeBody);
        };

        routeService.updateRoute = function (guid, routeBody) {
            return cloudFoundry.routes.updateRoute(guid, routeBody);
        };
        
        routeService.deleteRoute = function (guid) {
            return cloudFoundry.routes.deleteRoute(guid);
        };

        routeService.checkDuplRoute = function (guid, host) {
            return cloudFoundry.routes.checkDuplRoute(guid, host);
        };

        return routeService;
    })
;
