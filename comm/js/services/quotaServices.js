'use strict';

angular.module('portal.services')

.factory('quotaService', function(common, CONSTANTS) {
	var quotaService = {};

	/**
	 * 프로젝트 쿼타조회
	 */
	quotaService.listProjectQuotas = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/project', 'GET', params));
	};

	/**
	 * 작업 쿼타조회
	 */
	quotaService.listOrgQuotas = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/org', 'GET', params));
	};

    /**
     * 작업 쿼타조회
     */
    quotaService.listOrgProjectQuotas = function(params) {

        return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/orgProject', 'GET', params));
    };

	/**
	 * 쿼타수정 요청
	 */
	quotaService.requestQuota = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/requests', 'POST', params));
	};

	/**
	 * 쿼타수정 요청처리
	 */
	quotaService.updateQuota = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/requests/' + params.id, 'PUT', params));
	};

    /**
     * 쿼타수정 삭제
     */
    quotaService.deleteQuota = function(quotaId) {

        return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/requests/' + quotaId, 'DELETE'));
    };

	/**
	 * 쿼타수정 요청목록조회
	 */
	quotaService.listQuotaHistory = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/requests/' + params.type + '/' + params.id, 'GET'));
	};

	/**
	 *  참조플랜 그룹 조회
	 */
	quotaService.listQuotaPlanGroups = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/org_quota_plan_groups', 'GET', params));
	};

	/**
	 *	참조플랜 조회
	 */
	quotaService.listQuotaPlan = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/org_quota_plans', 'GET', params));
	};

	/**
	 * 	참조플랜 조회 : 개인프로젝트
	 */
	quotaService.listQuotaPlanPersonal = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/org_quota_plans/isPersonal', 'GET', params));
	};

	/**
	 * 	쿼터 항목 조회
	 */
	quotaService.listQuotaItem = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/org_quota_items', 'GET', params));
	};

	/**
	 *	참조플랜값 조회
	 */
	quotaService.listQuotaItemValue = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/org_quota_plan_values/' + params, 'GET'));
	};

    /**
     * paas 프로젝트 쿼터 조회
     */
    quotaService.listPaasQuotas = function (size, page, conditions) {
        var condition = "";
        if (conditions && conditions.length > 0) {
            condition = conditions.join(";");
        }
        var getParams = {
            "size" : size ? size : 10,
            "page" : page ? page : 1,
            "condition" : condition ? condition : "",
            "depth" : 1
        };
        return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/quotas', 'GET', getParams));
    };

	return quotaService;
});
