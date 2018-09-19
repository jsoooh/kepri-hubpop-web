
'use strict';

angular.module('portal.services')
    .factory('signupService', function (common, CONSTANTS) {

        var signupService = {};

        /* 회원가입 - 일반회원 */
        signupService.signup = function(memberInfo) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users', 'POST', memberInfo));
        };

        /* 이메일 인증 */
        signupService.verifyUser = function(verifyCode) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/verify', 'PUT', verifyCode, 'application/x-www-form-urlencoded'));
        };

        /* 이메일 인증 재발송 */
        signupService.resendVerifyEmail = function(email) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/verify-link', 'POST', email, 'application/x-www-form-urlencoded'));
        };


        /*기업검색*/
        signupService.searchCompany = function(size, page, schType, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "sort" : "createdDate,desc",
                "schType" : schType,
                "schText" : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/companies/search', 'GET', getParams));
        };

        /*기업 duplicate check*/
        signupService.checkByCompany = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/companies/' + companyId + "/checkCompany", 'GET'));
        };

        /*기업정보조회*/
        signupService.getCompanyInfo = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/companies/' + companyId, 'GET'));
        };

        /*조직 초대자의 기업정보 조회 */
        signupService.checkByInvitation = function(email) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/orgs/' + email + '/invitation', 'GET'));
        };

        /*이메일 check*/
        signupService.fetchByEmail = function(email) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/checkUserByEmail?email=' + email, 'GET'));
        };

        /*[이메일 인증 재발송] 사전 Check*/
        signupService.preChkResendVerifyEmail = function(email) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/preCheckUserByEmail?email=' + email, 'GET'));
        };

        /* 파일업로드*/
        signupService.fileUpload = function(fieldName, uploadFile) {
            return common.retrieveResource(common.fileUploader(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/uploadfile/' + fieldName, 'POST', uploadFile));
        };

        return signupService;
    })
;