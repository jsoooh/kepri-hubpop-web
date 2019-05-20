'use strict';

angular.module('common.controllers')
    .controller('commLoginCtrl', function ($scope, $location, $timeout, $translate, $mdDialog, user, common) {
        _DebugConsoleLog("userControllers.js : commLoginCtrl", 1);

        var ct = this;

        $scope.main.loadingMainBody = false;

        ct.checkSsoPgsecuid = function (pgsecuid) {
            $scope.main.ssoUserLoginChecking = true;
            var promise = user.getCheckSsoPgsecuid(pgsecuid);
            promise.success(function (data, status, headers) {
                if (data && data.token) {
                    var userInfo = data;
                    $scope.main.ssoUserLogin = true;
                    common.setAccessToken(userInfo.token);
                    common.setUser(userInfo);
                    $scope.main.isLoginPage = true;
                    $scope.main.mainLayoutClass = "main";
                    if (angular.isObject($scope.mainBody)) {
                        $scope.mainBody.mainContentsTemplateUrl = "";
                    }
                    if (!$scope.main.dbMenuList || $scope.main.dbMenuList.length == 0) {
                        $scope.main.setDbMenuList();
                    }
                    $timeout(function () {
                        common.moveCommHomePage();
                    }, 100);
                }
                $scope.main.ssoUserLoginChecking = false;
            });
            promise.error(function (data, status, headers) {
                $scope.main.ssoUserLogin = false;
                $scope.main.ssoUserLoginChecking = false;
            });
        };

        // TODO : SSO 연계 추가 작성
        if (common.getPgsecuid()) {
            ct.checkSsoPgsecuid(common.getPgsecuid());
        }

        //platform 교육 관련 공지사항
        function showNotice(ev) {
            $mdDialog.show({
                controller: DialogNoticeController,
                templateUrl: _COMM_VIEWS_ + '/common/popNoticePlatform.html' + _VersionTail(),
                //parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: true // Only for -xs, -sm breakpoints.
            })
        }
        function DialogNoticeController($scope, $mdDialog) {
            $scope.hide = function() {
                $mdDialog.hide();
            };
        }

        ct.ssoUserCreating = false;
        ct.notice = false;

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
                    if (ct.notice) {
                        //common.showDialogAlertHtml('알림', '공지사항 내용', 'notice');
                        //showNotice();
                    }
                    if (!data.manager && data.orgCount == 0) {
                        common.showDialogAlertHtml('알림', '현재 참여중인 프로젝트가 없습니다. </br>외부 사용자의 경우, 한전 담당자가 생성한 프로젝트에 참여하여 HUB-PoP을 사용할 수 있습니다.</br>계정 정보를 한전 담당자에게 전달하여 프로젝트 참여자로 등록하도록 요청하여 주세요.', 'info');
                        $scope.authenticating = false;
                        $scope.main.loadingMainBody = false;
                    } else {
                        common.setAccessToken(headers("U-X-TOKEN"));
                        common.setUser(data);
                        // 자연스러운 페이지 변환을 위한 로직
                        $scope.main.isLoginPage = true;
                        $scope.main.mainLayoutClass = "main";
                        if (angular.isObject($scope.mainBody)) {
                            $scope.mainBody.mainContentsTemplateUrl = "";
                        }
                        if (!$scope.main.dbMenuList || $scope.main.dbMenuList.length == 0) {
                            $scope.main.setDbMenuList();
                        }
                        $timeout(function () {
                            common.moveCommHomePage();
                        }, 100);
                    }
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

        if ($scope.main.ssoUserLoginChecking) {
            $scope.main.reloadTimmer['ssoUserCheck'] = $timeout(function () {
                ct.ssoUserCreating = true;
            }, 8000);
        }
    })
;