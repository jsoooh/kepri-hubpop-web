'use strict';

angular.module('common.controllers')
    .controller('commLoginCtrl', function ($scope, $location, $timeout, $translate, user, common) {
        _DebugConsoleLog("userControllers.js : commLoginCtrl", 1);

        $scope.authenticating = false;
        $scope.login = function (evt) {
            var param = {};
            param['email']    = $scope.credentials.email.trim();
            param['password'] = $scope.credentials.password.trim();

            $scope.authenticating = true;
            $scope.main.loadingMainBody = true;
            var authenticationPromise = user.authenticate(param);
            authenticationPromise.success(function (data, status, headers) {
                if (status == 200 && angular.isObject(data) && data.token) {
                    common.setAccessToken(headers("U-X-TOKEN"));
                    common.setUser(data);
                    // 자연스러운 페이지 변환을 위한 로직
                    $scope.main.isLoginPage = true;
                    $scope.main.mainLayoutClass = "main";
                    if (angular.isObject($scope.mainBody)) {
                        $scope.mainBody.mainContentsTemplateUrl = "";
                    }
                    $timeout(function () {
                        common.moveCommHomePage();
                    }, 100);
                } else {
                    common.showDialogAlertError("로그인 오류", $translate.instant('message.mi_wrong_id_or_pwd'));
                    $scope.authenticating = false;
                    $scope.main.loadingMainBody = false;
                }
            });
            authenticationPromise.error(function (data, status, headers) {
                common.clearUser();
                $scope.authenticating = false;
                $scope.main.loadingMainBody = false;
            });
        };
        $scope.main.loadingMainBody = false;
    })
;