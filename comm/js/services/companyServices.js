//'use strict';

angular.module('portal.services')
	.factory('companyService', function (common, CONSTANTS) {

		var companyService = {};

		/*기업검색*/
        /*companyService.listCompany0 = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies', 'POST', param));
        };*/

		/*기업검색*/
        companyService.listCompany = function(size, page, schType, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "sort" : "createdDate,desc",
				"schType" : schType,
				"schText" : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies', 'GET', getParams));
        };

        /*기업검색*/
        companyService.listCompanyPop = function(size, page, schType, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "sort" : "createdDate,desc",
                "schType" : schType,
                "schText" : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/search', 'GET', getParams));
        };

		/*기업정보 승인/반려 */
        companyService.updateCompanyStatusCode = function(companyId, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/'+companyId+'/updateStatusCode', 'PUT', param, 'application/x-www-form-urlencoded'));
        };

        /*기업사용자 조회*/
        companyService.listCompanyUsers = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/'+companyId+'/users', 'GET'));
        };

        /*기업정보 조회*/
        companyService.getCompanyInfo = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/'+companyId, 'GET'));
        };

        /*기업정보 수정*/
        companyService.updateCompany = function(companyInfo) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/'+companyInfo.companyId, 'POST', companyInfo, 'multipart/form-data'));
        };

        /*기업ID check*/
        companyService.existsCompany = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/company/'+companyId, 'GET'));
        };

        /*담당자 Email check*/
        companyService.existsManager = function(email) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/manager/'+email, 'GET'));
        };

        /*기업정보 등록*/
        companyService.createCompanyAction = function(companyInfo) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/action', 'POST', companyInfo, 'multipart/form-data'));
        };

        /*기업정보 수정*/
        companyService.updateCompanyAction = function(companyInfo) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/action/'+companyInfo.companyId, 'POST', companyInfo, 'multipart/form-data'));
        };

        /*기업정보 삭제*/
        companyService.deleteCompanyAction = function(companyId, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/action/'+companyId, 'DELETE', param, 'application/x-www-form-urlencoded'));
        };

        /*기업 Quota*/
        companyService.listCompanyQuotas = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/quota/'+companyId, 'GET'));
        };

		/*기업 Quota 수정*/
        companyService.updateCompanyQuota = function(companyQuotaData) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/quota/'+companyQuotaData.companyId, 'PUT', companyQuotaData));
        };

        /*기업정보 중지*/
        companyService.stopCompanyAction = function(companyId, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/action/stop/'+companyId, 'PUT', param, 'application/x-www-form-urlencoded'));
        };

        /*기업 활성화 : 중지상태에서 상태만 done으로*/
        companyService.activateCompanyAction = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies/action/activate/'+companyId, 'PUT'));
        };

		return companyService;
	})
;
