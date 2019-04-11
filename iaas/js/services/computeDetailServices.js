//'use strict';

angular.module('iaas.services')
    .factory('compuDetailService', function (common, CONSTANTS) {

        var compuDetailService = {};

        compuDetailService.listDomains = function (instanceId) {
            var params = {
                instanceId : instanceId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain/service', 'GET', params));
        };

        return compuDetailService;
    })
;