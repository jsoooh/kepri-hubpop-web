//'use strict';

angular.module('perf.services')
    .factory('perfAnlsService', function (common, CONSTANTS) {

        var perfAnlsService = {};

        /* 월별 과금 리스트 BY ORGCODE */
        perfAnlsService.totalAnlsByOrgCodeAndPerfYm = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/monthly/total', 'GET', params));
        };

        return perfAnlsService;
    })
;
