//'use strict';

angular.module('perf.services')
    .factory('perfMeteringService', function (common, CONSTANTS) {

        var perfMeteringService = {};

        /* 미터링 서비스 그룹 리스트 ALL */
        perfMeteringService.listAllMeteringGroupItems = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/groupItems/all', 'GET'));
        };

        /* 미터링 서비스 아이템 리스트 ALL */
        perfMeteringService.listAllMeteringItems = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/items/all', 'GET'));
        };

        /* 년도 리스트 ALL */
        perfMeteringService.listAllMeteringYears = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/years/all', 'GET'));
        };

        /* 월 리스트 ALL */
        perfMeteringService.listAllMeteringMonths = function(year) {
            var param = {
                "year" : year ? year : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/months/all', 'GET', param));
        };

        /* 월별 사용 현황 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_03 */
        perfMeteringService.listPerfMonthlyMeteringByOrgCode = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/org/{orgCode}/monthly/total', 'GET', params));
        };

        /* 월별/아이템별 사용량 추이 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_04 */
        perfMeteringService.listPerfMeteringMonthlyByOrgAndItemCode = function(params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/org/{orgCode}/item/{itemCode}/monthly/total', 'GET', params))
        };
        /* 일별/아이템별 사용량 추이 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_04 */
        perfMeteringService.listPerfMeteringDailyByOrgAndItemCode = function(params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/metering/org/{orgCode}/item/{itemCode}/daily/total', 'GET', params) )
        };

        return perfMeteringService;
    })
;
