//'use strict';

angular.module('perf.services')
    .factory('perfMeteringService', function (common, CONSTANTS) {

        var perfMeteringService = {};

        /* 미터링 아이템 그룹 리스트 ALL */
        perfMeteringService.listAllMeteringGroupItems = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/groupItems/all', 'GET'));
        };

        return perfMeteringService;
    })
;
