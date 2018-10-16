'use strict';

angular.module('common.services')
    .factory('user', function (common, cache, cookies, CONSTANTS) {

        var user = {};

        /* 로그인(토큰발급) */
        user.authenticate = function (credentials) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/login', 'POST', credentials, 'application/x-www-form-urlencoded'));
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
                    if (userInfo && userInfo.email && tokenUserInfo.user_name != userInfo.email) {
                        if (tokenUserInfo.email == tokenUserInfo.user_name) {
                            tokenUserInfo.user_name = userInfo.user_name;
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

        // 비동기 방식
        user.getCheckSsoPgsecuid = function (pgsecuid) {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/pgsecuid/check', 'POST', { "pgsecuid": pgsecuid }));
        };

        // 동기 방식
        user.checkPgsecuid = function (pgsecuid) {
            var response = common.syncHttpResponseJson(CONSTANTS.uaaContextUrl + '/pgsecuid/check', 'POST', { "pgsecuid": pgsecuid });
            if (response) {
                if (response.status == 307) {
                    return false;
                } else if (response.status == 200 && response.data) {
                    var userInfo = response.data;
                    var accessToken = userInfo.token;
                    if (response.headers && response.headers("U-X-TOKEN")) {
                        accessToken = response.headers("U-X-TOKEN");
                    }
                    if (accessToken) {
                        common.setAccessToken(accessToken);
                        common.setUser(userInfo);
                        return true;
                    } else {
                        return true;
                    }
                }
            } else {
                return false;
            }
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

        user.listPageUser = function(params) {

            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users', 'GET', params));
        };

        return user;

    })
;