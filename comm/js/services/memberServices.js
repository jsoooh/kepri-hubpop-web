//'use strict';

angular.module('portal.services')
	.factory('memberService', function (common, CONSTANTS) {

		var memberService = {};

        /*사용자관리 조회*/
        memberService.listAllUsers = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/all', 'POST', param));
        };

        memberService.listUsers = function (size, page, condition) {
            return common.retrieveResource(commone.resourcePromise(CONSTANTS.uaaContextUrl + '/users?size='+size+'&page='+page+'&condition='+condition, 'GET'));
        };

        /*
        * 회원정보 조회
        * */
        memberService.getUserInfo = function (user_id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/'+user_id, 'GET'));
        };

        /*회원가입 > Email Check*/
        memberService.fetchByEmail = function (email) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/checkUserByEmail?email='+email, 'GET'));
        };

        //[회원상세 저장]
        memberService.updateUserActive = function(param, myEmail) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/updateActive/'+myEmail, 'PUT', param));
        };

        //[사용자 권한 부여/삭제]
        memberService.updateUserGroupMember = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/updateGroupMember', 'POST', param));
        };

        /*비밀번호 수정*/
        memberService.changePass = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/passwordchange', 'POST', param));
        };

        /*비밀번호 수정*/
        memberService.changePassword = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/passwordchange', 'POST', param));
        };

        /*비밀번호 초기화*/
        memberService.resetPassword = function (body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/passwordreset/manager', 'POST', body));
        };

        /*회원정보 수정*/
        /*memberService.updateUser = function(userId, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/'+userId, 'PUT', param));
        };*/

        /*회원정보 수정*/
        memberService.updateUser = function(memberInfo) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/'+memberInfo.user_id, 'PUT', memberInfo));
        };

        /*회원탈퇴*/
        memberService.deleteUser = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users', 'DELETE', param));
        };

        /*기업검색*/
        memberService.listCompany = function(param) {
            var getParams = {
                "size" : 20,
                "page" : 0,
                "sort" : "companyName,asc"
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/companies', 'GET', param));
        };

        /*사용자동기화*/
        memberService.setUserSync = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/setSync', 'PUT'));
        };

        /*
         * 회원정보 조회 : 추가할 운영자 조회
         * */
        memberService.getUserSearch = function (email) {
            return common.retrieveCommResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/'+email+'/search', 'GET'));
        };

        /*
         * 기업 관리자 [변경]
         * */
        memberService.updateCompanyManager = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/changeManager', 'PUT', param, 'application/x-www-form-urlencoded'));
        };


        /*운영자 목록 조회*/
        memberService.listAdminUsers = function (size, page) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "sort" : "createdDate,desc"
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/adminList', 'GET', getParams));
        };

        /*운영자 삭제*/
        memberService.deleteAdminUser = function (delUserEmail) {
            var getParams = {
                "delUserEmail" : delUserEmail
            };

            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/deleteAdmin', 'DELETE', getParams));
        };

        /*운영자 권한변경*/
        memberService.updateAdminRole = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/updateAdminRole', 'PUT', param, 'application/x-www-form-urlencoded'));
        };

        /*운영자 추가*/
        memberService.insertAdmin = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/createAdmin', 'POST', param));
        };

        return memberService;

	})
;
