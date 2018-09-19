//'use strict';

angular.module('portal.services')
	.factory('member', function (common, CONSTANTS) {

		var member = {};

        /*
        * 회원정보 조회
        * */
        /*member.getUserInfo = function (email, token) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/'+email+'?token='+token, 'GET'));
        };*/
        member.getUserInfo = function (userId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/'+userId, 'GET'));
        };

        /*비밀번호 수정*/
        member.changePassword = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/passwordchange', 'POST', param));
        };

        /*회원정보 수정*/
        member.updateUser = function(memberInfo) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/'+memberInfo.user_id, 'PUT', memberInfo));
        };

        /*회원탈퇴*/
        member.deleteUser = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users', 'DELETE', param));
        };

        /*기업정보 조회*/
        member.getCompanyInfo = function(companyId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/companies/'+companyId, 'GET'));
        };

        return member;

	})
;
