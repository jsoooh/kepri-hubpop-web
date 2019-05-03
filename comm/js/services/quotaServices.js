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

	return quotaService;
});
