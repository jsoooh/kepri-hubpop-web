'use strict';

angular.module('common.controllers')
    .controller('commLoginCtrl', function ($scope, $location, $timeout, $translate, $mdDialog, $cookies, user, common, portal, CONSTANTS) {
        _DebugConsoleLog("userControllers.js : commLoginCtrl", 1);

        var ct = this;
        ct.notices = [];
        ct.tempNotices = [];
        ct.popNoticeCnt = 0;

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
                    ct.listNotices();   //공지 목록 조회
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
                        ct.listNotices();   //공지 목록 조회
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

        /*공지 목록 조회*/
        ct.listNotices = function () {
            ct.notices = [];
            ct.tempNotices = [];
            ct.popNoticeCnt = 0;
            $scope.main.loadingMainBody = true;
            var promise = portal.portalOrgs.getNotices();
            promise.success(function (data) {
                ct.tempNotices = data.data;
            });
            promise.error(function (data, status, headers) {
            });
            promise.finally(function() {
                //ct.tempNotices = CONSTANTS.tempNoticeData.data;
                if (ct.tempNotices.length > 0) {
                    setPopNoties();
                }
                $scope.main.loadingMainBody = false;
            });
        };

        /*팝업 공지사항 목록 세팅 : 팝업여부체크/날짜체크/팝업위치등 설정*/
        function setPopNoties() {
            var toDay = moment(new Date()).format('YYYY-MM-DD');    //2019-07-11
            var i = 0;
            angular.forEach(ct.tempNotices, function (noticeItem) {
                var attachFiles = [];
                var attachFile = {};
                if (noticeItem.DELETE_YN == "N" && noticeItem.POP_YN == "Y" && noticeItem.START_DT <= toDay && noticeItem.END_DT >= toDay && $cookies.get('notice_' + noticeItem.NOTICE_NO) != 'valid') {
                    i++;
                    noticeItem["isView"] = true;
                    noticeItem["top"] = 50;     //100 * i - 50;
                    noticeItem["left"] = 200 * i + 100;
                    if (!!noticeItem.ATTACH_FILE) {
                        var arrFiles = noticeItem.ATTACH_FILE.split(",");   //"ATTACH_FILE":"206|RTU속성2.txt,210|RTU속성33.txt"
                        if (!!arrFiles && arrFiles.length > 0) {
                            angular.forEach(arrFiles, function (file) {
                                var arrFileInfo = file.split("|");      //206|RTU속성2.txt
                                attachFile["FILE_NO"] = arrFileInfo[0];      //206
                                attachFile["FILE_NAME"] = arrFileInfo[1];    //RTU속성2.txt
                                attachFiles.push(attachFile);
                            });
                            noticeItem["ATTACH_FILES"] = attachFiles;
                        }
                    }
                    //CONTENTS 중 ", ' 를 문자 치환
                    noticeItem.CONTENTS = noticeItem.CONTENTS.replace(/\"/g,"&quot;");
                    //noticeItem.CONTENTS = noticeItem.CONTENTS.replace(/\'/g,"&#39;");
                    ct.notices.push(noticeItem);
                }
            });
            ct.popNoticeCnt = ct.notices.length;
            /*console.log("toDay : ", toDay);
             console.log("ct.popNoticeCnt : ", ct.popNoticeCnt);
             console.log("ct.tempNotices : ", ct.tempNotices);
             console.log("ct.notices : ", ct.notices);*/
            $scope.main.noticeList = [];
            if (ct.popNoticeCnt > 0) {
                $scope.main.desplayNoticeList(ct.notices);
            }
        }

        if ($scope.main.ssoUserLoginChecking) {
            $scope.main.reloadTimmer['ssoUserCheck'] = $timeout(function () {
                ct.ssoUserCreating = true;
            }, 8000);
        }
    })
;