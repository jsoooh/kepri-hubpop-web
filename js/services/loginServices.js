'use strict';

angular.module('portal.services')
    .factory('login', function (common, cache, cookies, CONSTANTS) {

        var login = {};

        /* 로그인(토큰발급) */
        login.authenticate = function (credentials) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/login', 'POST', credentials, 'application/x-www-form-urlencoded'));
            //return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/login', 'POST', credentials));
        };

        /* 로그아웃 */
        login.logoutAction = function () {
            var scope = common.getMainCtrlScope();
            scope.main.loadingMainBody = true;
            var logoutPromise = common.retrieveResource(common.resourcePromiseJson(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/logout', 'POST'));
            logoutPromise.success(function (data, status, headers) {
                scope.main.loadingMainBody = false;
                common.logout();
            });
            logoutPromise.error(function (data, status, headers) {
                scope.main.loadingMainBody = false;
                common.logout();
            });
        };

        /* 비밀번호 리셋 이메일 전송 */
        login.passwordResetEmail = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/passwordreset/sendmail', 'POST', param, 'application/x-www-form-urlencoded'));
        };

        /* 비밀번호 리셋 */
        login.passwordReset = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/users/passwordreset/set', 'POST', param, 'application/x-www-form-urlencoded'));
        };

        return login;

    })
;