'use strict';

angular.module('common.services')
    .factory('user', function (common, cache, cookies, CONSTANTS) {

        var user = {};

        /*일반사용자 로그인*/
        user.authenticate = function (userForm) {
            //return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/login', 'POST', {"email": userForm.email.trim(), "password": userForm.password.trim()}, 'application/x-www-form-urlencoded'));
            //return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/login', 'POST', param, 'application/x-www-form-urlencoded'));
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/login', 'POST', param));
        };

        /*관리자 로그인*/
        user.login = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/adminLogin', 'POST', param, 'application/x-www-form-urlencoded'));
        };

        user.iaasAuthenticate = function (userForm) {
            return common.retrieveResource(common.syncHttpResponseJson(CONSTANTS.iaasApiContextUrl + '/user/login', 'POST', {"userId": userForm.email, "password": userForm.password}));
        };

        user.myUserInfo = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.paasApiCoreContextUrl + '/users/me', 'GET'));
        };

        // 동기 방식
        user.getMyUserInfo = function () {
            var response = common.syncHttpResponseJson(CONSTANTS.paasApiCoreContextUrl + '/users/me', 'GET');
            return response.data;
        };

        user.accessTokenCheck = function (accessToken) {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/token/check', 'POST', {"access_token": accessToken}));
        };

        // 동기 방식
        user.checkAccessToken = function (accessToken) {
            var response = common.syncHttpResponseJson(CONSTANTS.uaaContextUrl + '/token/check', 'POST', {"access_token": accessToken});
            if (response) {
                if (response.status == 307) {
                    return false;
                } else if (response.data && response.data.resultCode == "0") {
                    var userInfo = common.getUser();
                    var tokenUserInfo = response.data.tokenInfo;
                    if (userInfo && userInfo.email && tokenUserInfo != userInfo.email) {
                        if (tokenUserInfo.email == tokenUserInfo.user_name) {
                            tokenUserInfo.user_name = userInfo.user_name;
                        }
                        if (!tokenUserInfo.company &&  userInfo.company) {
                            tokenUserInfo.company = userInfo.company;
                        }
                    }
                    common.setUser(tokenUserInfo);
                    return true;
                }
            } else {
                return false;
            }
        };

        user.accessTokenDecode = function (accessToken) {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/token/decode', 'POST', {"access_token": accessToken}));
        };

        user.logoutAction = function () {
            var scope = common.getMainCtrlScope();
            scope.main.loadingMainBody = true;
            var logoutPromise = common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/logout', 'POST'));
            logoutPromise.success(function (data, status, headers) {
                scope.main.loadingMainBody = false;
                common.logout();
            });
            logoutPromise.error(function (data, status, headers) {
                scope.main.loadingMainBody = false;
                common.logout();
            });
        };

        user.refreshAccessToken = function (body) {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.paasApiCoreContextUrl + '/users/refreshAccessToken', 'PUT', body));
        };

        return user;

    })
;