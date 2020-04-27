//'use strict';

angular.module('perf.services')
    .factory('perfMeteringService', function (common, CONSTANTS) {

        var perfMeteringService = {};

        /* 미터링 아이템 그룹 리스트 ALL */
        perfMeteringService.listAllMeteringGroupItems = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/groupItems/all', 'GET'));
        };

        /* 미터링 아이템 리스트 ALL */
        perfMeteringService.listAllMeteringItems = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/items/all', 'GET'));
        };

        /* 미터링 연도 리스트 ALL */
        perfMeteringService.listAllMeteringYears = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/years/all', 'GET'));
        };

        /* 미터링 월 리스트 ALL */
        perfMeteringService.listAllMeteringMonths = function(year) {
            var param = {
                "year" : year ? year : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/months/all', 'GET', param));
        };

        /* 월별 미터링 리스트 BY ORG_ORGCODE */
        perfMeteringService.listPerfMonthlyMeteringByOrgCode = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/org/{orgCode}/monthly/total', 'GET', params));
        };

        /* 성과관리 아이템-월별 사용량량 Total */
        perfMeteringService.listPerfMeteringMonthlyTotalByItemCode = function(params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/org/{orgCode}/item/{itemCode}/monthly/total', 'GET', params))
        };
        /* 성과관리 아이템-일별 사용량량 Total*/
        perfMeteringService.listPerfMeteringDailyTotalByItemCode = function(params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/org/{orgCode}/item/{itemCode}/daily/total', 'GET', params) )
        };

        return perfMeteringService;
    })
;
