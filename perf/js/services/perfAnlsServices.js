//'use strict';

angular.module('perf.services')
    .factory('perfAnlsService', function (common, CONSTANTS) {

        var perfAnlsService = {};

        /* 월별 과금 리스트 BY ORGCODE */
        perfAnlsService.totalAnlsByOrgCodeAndPerfYm = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/monthly/total', 'GET', params));
        };

        /* 프로젝트별 과금 모든 금액 통합 월별 아이템그룹별 조회 */
        perfAnlsService.listAnlsTotalByOrgAndItemGroup = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/itemgroup/total', 'GET', params));
        }

        /* 프로젝트별 과금 모든 금액 통합 월별 아이템별 조회 */
        perfAnlsService.listAnlsTotalByOrgAndItem = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/item/total', 'GET', params));
        }

        /* 프로젝트별 과금 통합 월별 추이 조회 */
        perfAnlsService.listAnlsMonthlySummaryByOrg = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/summary', 'GET', params));
        }

        /* 프로젝트별 과금 통합 일별 추이 조회 */
        perfAnlsService.listAnlsDailySummaryByOrg = function (params) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/org/{orgCode}/daily/summary', 'GET', params));
        }

        return perfAnlsService;
    })
;
