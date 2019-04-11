//'use strict';

angular.module('iaas.services')
    .factory('computeDetailService', function (common, CONSTANTS) {

        var computeDetailService = {};

        computeDetailService.listDomains = function (instanceId) {
            var params = {
                instanceId : instanceId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain/service', 'GET', params));
        };

        return computeDetailService;
    })
;