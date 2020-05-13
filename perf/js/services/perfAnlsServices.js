//'use strict';

angular.module('perf.services')
    .factory('perfAnlsService', function (common, CONSTANTS) {

        var perfAnlsService = {};

        /* 월별 과금 현황 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_02  */
        perfAnlsService.totalAnlsByOrgCodeAndPerfYm = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/monthly/total', 'GET', params));
        };

        /* 대시보드 월별/아이템그룹별 과금 합계 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_01 */
        perfAnlsService.listAnlsTotalByOrgAndItemGroup = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/itemgroup/total', 'GET', params));
        }

        /* 대시보드 월별/아이템별 과금 합계 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_01 */
        perfAnlsService.listAnlsTotalByOrgAndItem = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/item/total', 'GET', params));
        }

        /* 대시보드 월별 과금 추이 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_01 */
        perfAnlsService.listAnlsMonthlySummaryByOrg = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/summary', 'GET', params));
        }

        /* 대시보드 일별 과금 추이 BY ORGCODE - 화면 ID: HUBPOP_INT_PER_ANS_01 */
        perfAnlsService.listAnlsDailySummaryByOrg = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/daily/summary', 'GET', params));
        }

        return perfAnlsService;
    })
;
