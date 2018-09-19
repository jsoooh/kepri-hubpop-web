//'use strict';

angular.module('portal.services')
	.factory('commQuotaService', function (common, CONSTANTS) {

		var commQuotaService = {};

		/*quota 검색*/
        commQuotaService.listQuotas = function(schType) {
            var getParams = {
                "type" : schType
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/all', 'GET', getParams));
        };

        /*quota 삭제*/
        commQuotaService.deleteQuota = function(id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/'+id, 'DELETE'));
        };

        /*quota 등록/수정*/
        commQuotaService.updateQuota = function(param, modeU) {
            if(modeU) {     //수정
                return common.retrieveCommResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/' + param.id, 'PUT', param));
            }else{          //등록
                return common.retrieveCommResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas', 'POST', param));
            }
        };

        /* PaaS 용량계획 검색 */
        commQuotaService.searchPaasQuota = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/paasQuota', 'GET', param));
        };

        /*프로젝트 quota 변경 요청 검색*/
        commQuotaService.listProjectQuotaRequests = function(size, page, status) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "status" : status
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/project/request/all', 'GET', getParams));
        };

        /**
         * 프로젝트 쿼타조회 : quotaServices에서 가져옴
         */
        commQuotaService.listProjectQuotas = function(params) {

            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/project', 'GET', params));
        };

        /**
         * 쿼타수정 요청처리 : quotaServices에서 가져옴
         */
        commQuotaService.updateQuotaRequest = function(params) {

            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/quotas/requests/' + params.id, 'PUT', params));
        };

		return commQuotaService;
	})
;
