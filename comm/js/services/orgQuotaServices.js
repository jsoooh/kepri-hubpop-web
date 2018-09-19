//'use strict';

angular.module('portal.services')
	.factory('orgQuotaService', function (common, CONSTANTS) {

		var orgQuotaService = {};

		/* orgQuota 목록조회 */
        orgQuotaService.listOrgQuotas = function (id) {
            var param = {"id" : id};
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota', 'GET', param));
        };

        /* orgQuota 추가 */
        orgQuotaService.saveOrgQuota = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota', 'POST', param));
        };

        /* orgQuota 수정 */
        orgQuotaService.updateOrgQuota = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota', 'PUT', param));
        };

        /* orgQuota 삭제 */
        orgQuotaService.removeOrgQuota = function (quotaId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota/'+ quotaId, 'DELETE'));
        };

        /* orgQuota 삭제 (DevOps) */
        orgQuotaService.removeOrgQuotaDevOps = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota/'+ param.product.productName, 'PUT', param));
        };

        /* orgServe 목록조회 */
        orgQuotaService.listOrgServes = function (orgId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota/'+ orgId + '/serves', 'GET'));
        };

        /* orgQuota API Call */
        orgQuotaService.orgQuotaApi = function (orgId, service) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota/'+ orgId + '/call', 'PUT'));
        };

        /* Company Quota 사용량 조회 */
        orgQuotaService.getOrgQuotaUsage = function (companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgQuota/'+ companyId + '/usage', 'GET'));
        };

        return orgQuotaService;
	})
;
