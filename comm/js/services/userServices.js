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
        // 20.1.22 by hrit, api 호출 시 계정 로그인, 생성 여부 전달
        user.getCheckSsoPgsecuid = function (pgsecuid, isUpdate, ssoPassword, ssoEmail) {
            if (isUpdate == undefined) isUpdate = true;
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/pgsecuid/check', 'POST', { "pgsecuid": pgsecuid, "update": isUpdate, "pgsecupw": ssoPassword, "email": ssoEmail }));
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

        // 20.3.20 by hrit, 패스워드 보안 규칙
        user.passwordSecureCheck = function(email, pw, fn) {

            // 1차 규칙, 사용금지 패스워드 확인
            if (pw == 'kepco123456/' || pw == 'Kepco123456/' || pw == 'kepco123456!' || pw == 'Kepco123456!') {
                common.showAlertError("패스워드", "사용금지 패스워드를 사용하셨습니다. 다른 패스워드를 사용하여 주시기 바랍니다.");
                if (fn) fn(1);
                return;
            }
            
            // 2차 규칙, 비밀번호 8~16자 영문, 숫자 특수문자 조합 확인
            var pattern1 = /[0-9]/;
            var pattern2 = /[a-zA-Z]/;
            var pattern3 = /[~`!@#$%\^&*()-+=.]/;     // 원하는 특수문자 추가 제거
            if (!pattern1.test(pw) || !pattern2.test(pw) || !pattern3.test(pw) || pw.length < 8 || pw.length > 16){
                common.showAlertError("패스워드", "8~16자 영문, 숫자, 특수문자 조합으로 구성하여야 합니다.");
                if (fn) fn(1);
                return;
            } 

            // 3차 규칙, 알파벳, 숫자 연속 확인
            for (var i = 0; i < pw.length; i++) {
                if (i + 2 < pw.length) {
                    if (pw.charCodeAt(i) + 1 == pw.charCodeAt(i + 1) && pw.charCodeAt(i + 1) + 1 == pw.charCodeAt(i + 2)) {
                        common.showAlertError("패스워드", "연속된 비밀번호는 3자 이상 사용할 수 없습니다.");
                        if (fn) fn(1);
                        return;
                    }
                }
            }

            // 4차 규칙, 최근 사용한 비밀번호 재사용 확인
            var rp = common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/recentPasswordCheck', 'GET', {email: email, pw: pw}));
            rp.success(function (data) {
                if (data) { // 데이터가 있는 경우, 비밀번호가 존재함.
                    common.showAlertError("패스워드", "최근 사용한 비밀번호는 재사용할 수 없습니다.")
                    if (fn) fn(data)
                } else { // 데이터가 없는 경우, 사용한적 없는 비밀번호
                    if (fn) fn();
                }
            });
            rp.error(function (data) {
                if (fn) fn(true);
            });
        }

        return user;

    })
;