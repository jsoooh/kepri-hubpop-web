'use strict';

angular.module('portal.controllers')
    .controller('loginCtrl', function ($scope, $http, $log, $location, $translate, $window, $timeout, $cookies, cookies, cache, common, login, boardService, CONSTANTS, $rootScope, $mdDialog) {
        _DebugConsoleLog("loginControllers.js : loginCtrl", 1);

        $scope.blurEmail = false;   //로그인 이메일 입력 이후 메시지 보이기 위함

        //$scope.redirect = cookies.getRedirectUrl();
        $scope.credentials = {
            email: '',
            password: '',
            redirect_uri: '',
            rememberMe: false
        };

        var userAgent = $window.navigator.userAgent;
        var browser;
        var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /msie|rv/i};
        for(var key in browsers) {
            if (browsers[key].test(userAgent)) {
                browser = key;
                break;
            }
        }
        if(browser == 'ie') {
            if( (!userAgent.match(/rv:11.0/i)) && ( (userAgent.match(/MSIE 10.0/i)) || (userAgent.match(/MSIE 9.0/i)) ) ) {
                //common.showAlert($translate.instant('mi_optimize_ie_11'));
            }
        }

        $scope.isCapsLock = false;
        $scope.checkCapsLock = function (event) {
            $scope.isCapsLock = false;

            var keyCode = event.keyCode;
            var shiftKey = event.shiftKey;
            if (((keyCode >= 65 && keyCode <= 90) && !shiftKey) || ((keyCode >= 97 && keyCode <= 122) && shiftKey)) {
                //alert("CapsLock이 켜져 있습니다");
                $scope.isCapsLock = true;
                return;
            }
        };

        /* 로그인 */
        $scope.authenticating = false;
        $scope.login = function ($event) {

            $scope.authenticating = false;

            //$scope.redirect = cookies.getRedirectUrl();
            if ($scope.credentials.email == undefined || $scope.credentials.email == '') {
                common.showAlert($translate.instant('message.mi_dont_input_id'));
                return false;
            }
            if ($scope.credentials.password == undefined || $scope.credentials.password == '') {
                common.showAlert($translate.instant('message.mi_dont_input_pwd'));
                return false;
            }
            if ($scope.credentials.redirect == undefined || $scope.credentials.redirect == '') {
                //$scope.redirect = default_redirect_url;
            }

            $scope.main.loadingMainBody = true;

            var authenticationPromise = login.authenticate($scope.credentials);
            authenticationPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;

                if(status == 200){
if (data.httpStatus == 'UNAUTHORIZED') {
//	$scope.error = 'NOT LOGIN';
	$scope.authenticating = false;
	common.showAlertError("Login", $translate.instant('message.mi_wrong_id_or_pwd'));
	return;
}
//                    if($scope.redirect == null || $scope.redirect == ''){
//                        common.setAccessToken(headers(_TOKEN_HEADER_NAME_));
//                        common.setUser(data);
//                        //기업로고 사용 일 때 기업로고 세팅
//                        if(data.company && data.company.ciUseYn && data.company.ciUseYn == 'Y' && data.company.ciFilePath){
//                            common.setCompanyLogo(data.company.ciFilePath);
//                        }
//                        common.moveHomePage();
//
//                        /*common.goToState('main').then(function () {
//                            $scope.getPopupNotice($event);  // 팝업게시 공지사항 조회
//                        });*/
//                    }else{
//                        $window.location.href = $scope.redirect;
//                    }

                    common.setAccessToken(headers(_TOKEN_HEADER_NAME_));
                    common.setUser(data);
                    //기업로고 사용 일 때 기업로고 세팅
                    if(data.company && data.company.ciUseYn && data.company.ciUseYn == 'Y' && data.company.ciFilePath){
                        common.setCompanyLogo(data.company.ciFilePath);
                    }
                    if($scope.redirect == null || $scope.redirect == ''){
                        common.moveHomePage();
                    } else {
                        $window.location.href = $scope.redirect;
                    }
//$scope.main.hubpop.listProjects();
commonControllers_mainCtrl_fn_getUserAuth({common : common, mc : $scope.main});
                }else if(status == 201){
                    if(headers('Location') != null && headers('Location') != '') {
                        //$window.location.href = headers('Location');
                    }
                    //$scope.getPopupNotice($event);// 팝업게시 공지사항 조회
                    common.moveHomePage();
                } else {
                    $scope.error = 'NOT LOGIN';
                    $scope.authenticating = false;
                    //common.moveLoginPage();
                }
            });
            authenticationPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                //common.clearUser();
                $scope.error = data.message;
                $scope.authenticating = false;
                if (status == 403) {
                    common.showAlertError("Login", $translate.instant('message.mi_dont_auth_user'))
                } else {
                    common.showAlertError("Login", $translate.instant('message.mi_wrong_id_or_pwd'))
                }
            });
        };
loginControllers_loginCtrl({
	$scope : $scope,
	$location : $location
});
    })
    .controller('passwordResetEmailCtrl', function ($scope, $http, $log, $location, $translate, $window, $timeout, $cookies, cookies, cache, common, signupService, login) {

        //$scope.redirect = cookies.getRedirectUrl();
        $scope.email = "";

        // Email Check
        $scope.validationEmail = function() {
            $scope.main.loadingMainBody = true;

            var validationPromise = signupService.fetchByEmail($scope.email);
            validationPromise.success(function () {
                //$scope.main.loadingMainBody = false;
                $scope.sendEmail();
            });
            validationPromise.error(function () {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.pwd_reset'), $translate.instant('message.mi_dont_exist_email'));
            });
        };

        // Send Email
        $scope.sendEmail = function () {
            var param = {email: $scope.email};

            //$scope.$root.rootLoading = true;
            var passwordResetEmailPromise = login.passwordResetEmail(param);
            passwordResetEmailPromise.success(function () {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant("label.pwd_reset"), $translate.instant('message.mi_send_init_pwd_confirm_email'));
                common.moveLoginPage();
            });
            passwordResetEmailPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                data.message = $translate.instant('message.mi_dont_send_init_pwd_retry') +'<br>' + data.errors[0].message;
                common.showAlert("Error!!!", data.message);
            });
        }
        
    })
    .controller('passwordResetVerifyCtrl', function ($scope, $http, $log, $location, $translate, $window, $timeout, $cookies, cookies, cache, common, login) {
        _DebugConsoleLog("loginControllers.js : passwordResetVerifyCtrl", 1);

        var absUrl  = $location.absUrl().toString();		//http://localhost:9000/#/verify?auth_code=nUc3mHrhFS
        var verifyCode = absUrl.substring(absUrl.indexOf('auth_code=')+10, absUrl.length);
        $scope.verifyCode = verifyCode;

        /* 비밀번호 재설정 */
        $scope.passwordReset = function () {
            if (!$scope.password) {
                common.showAlert($translate.instant("label.pwd_reset"), $translate.instant('message.mi_dont_input_pwd'));
                return false;
            }
            if (!$scope.confirmPassword) {
                common.showAlert($translate.instant("label.pwd_reset"), $translate.instant('message.mi_dont_input_pwd'));
                return false;
            }
            // 비밀번호와 비밀번호 확인이 일치하는지 조건
            if ($scope.password != $scope.confirmPassword) {
                common.showAlert($translate.instant("label.pwd_reset"), $translate.instant('message.mi_wrong_pwd'));
                return false;
            }

            var param = {
                new_password: $scope.password,
                auth_code: String($scope.verifyCode)
            };
            $scope.main.loadingMainBody = true;

            var passwordResetPromise = login.passwordReset(param);
            passwordResetPromise.success(function () {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant("label.pwd_reset"), $translate.instant('message.mi_change_pwd'));
                common.moveLoginPage();
            });
            passwordResetPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                //data.message = $translate.instant('message.mi_wrong_auth_code_init_pwd') +'<br>' + data;
                common.showAlertError($translate.instant("label.pwd_reset"), $translate.instant('message.mi_error'));
                common.moveLoginPage();
            });
        }
    })
    .controller('popNoticeCtrl', function ($scope, $http, $log, $location, $translate, $window, $timeout, $cookies, cookies, cache, common, login, $mdDialog) {
        _DebugConsoleLog("loginControllers.js : popNoticeCtrl", 1);

        //var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언

        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.popCancel = function() {
            $mdDialog.cancel();
        };

        $scope.answer = function(answer) {
            $mdDialog.hide(answer);
        };

    })
;