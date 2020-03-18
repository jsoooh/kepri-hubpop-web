//'use strict';

angular.module('perf.services')
    .factory('perfRefAmtService', function (common, CONSTANTS) {

        var perfRefAmtService = {};

        /* 성과관리 과금기준 리스트 ALL */
        perfRefAmtService.listAllPrefItemRefAmts = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/refAmt/items/all', 'GET'));
        };

        return perfRefAmtService;
    })
;
