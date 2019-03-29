'use strict';

angular.module('portal.controllers')
    .controller('commUserEditCtrl', function ($scope, $location, $state, $stateParams, $translate, CONSTANTS, common, cache, memberService) {
        _DebugConsoleLog("memberControllers.js : commUserEditCtrl", 1);

        var ct = this;
        ct.bCommon = (common.getUser() != null && common.getUser().common != null) ? common.getUser().common : false;

        // popup modal에서 사용 할 객체 선언
        var pop = $scope.pop = {};

        /* 비밀번호 입력 변수 */
        pop.changePasswordData = {
            oldPassword : "",
            password : "",
            retypePassword : ""
        };

        // 권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자
        ct.userAuth = common.getUserAuth();
        ct.memberInfo = {};

        if (ct.userAuth == 'M') {
            ct.userAuthNm = '프로젝트 책임자';
        } else if (ct.userAuth == 'U') {
            ct.userAuthNm = '프로젝트 사용자';
        }

        if(common.getUser() == null){
            common.logout();
            return;
        }

        // 회원정보, 기업정보 세팅
        ct.setUserInfo = function(data) {
            ct.memberInfo = angular.copy($scope.main.userInfo);
            ct.memberInfo.position = data.position;
            ct.memberInfo.is_uaaUpdate = false;
        };

        // 처음 User 정보 조회
        ct.getUserInfo = function() {
            // 사용자 정보가 없으면 로그인 페이지로 이동
            if (!common.getUser() || !common.getUser().user_id){
                common.logout();
                return;
            }

            $scope.main.loadingMainBody = true;
            var memberPromise = memberService.getUserInfo($scope.main.userInfo.user_id);
            memberPromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;
                // 회원정보, 기업정보 세팅
                ct.setUserInfo(data);
            });
            memberPromise.error(function(data) {
                $scope.main.loadingMainBody = false;
                common.showAlertError($translate.instant('label.user_info'), data);
            });
        };

        ct.getUserInfo();

        // 저장 버튼 클릭
        $scope.updateUser = function() {
            if (ct.memberInfo.user_name == "") {
                common.showAlert($translate.instant('label.user_info'), $translate.instant('message.mi_dont_input_name'));
                return false;
            }
            if (ct.memberInfo.email == "") {
                common.showAlert($translate.instant('label.user_info'), $translate.instant('message.mi_dont_input_email'));
                return false;
            }

            // 이름이 변경 되었으면 UAA Update
            if (ct.memberInfo.user_name != $scope.main.userInfo.user_name)
                ct.memberInfo.is_uaaUpdate = true;

            $scope.main.loadingMainBody = true;
            var memberPromise = memberService.updateUser(ct.memberInfo);
            memberPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                // 사용자 변경 정보 세팅
                common.setUser(data);
                // 회원정보, 기업정보 세팅
                ct.setUserInfo(data);
                common.showAlert($translate.instant('label.user_info'), $translate.instant('message.mi_change_privacy'));
            });
            memberPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlertError($translate.instant('label.user_info'), data);
            });
        };

        /*회원 탈퇴*/
        $scope.signout = function() {
            var showConfirm = common.showConfirm($translate.instant('label.signout'), "탈퇴하시면 사용 중인 자원은 삭제됩니다.\n 정말로 탈퇴 하시겠습니까?", "info");
            showConfirm.then(function () {
                $scope.deleteUser();
            });
        };
        $scope.deleteUser = function() {
            var param = {
                  user_id    : $scope.main.userInfo.user_id
            };

            $scope.main.loadingMainBody=true;
            var deletePromise = memberService.deleteUser(param);
            deletePromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                common.logout();
                common.showAlert($translate.instant('label.user_deregistered'), $translate.instant('message.mi_delete'));
                common.moveLoginPage();
            });
            deletePromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                if (status == 403) {          //기업관리자
                    common.showAlertError($translate.instant('label.user_deregistered'), "프로젝트 책임자 이므로 탈퇴가 불가능합니다. 관리자에게 문의 바랍니다.");
                }else if(status == 406){      //조직관리자
                    common.showAlertError($translate.instant("label.user_deregistered"), "다음 작업에서 관리자 입니다. 작업의 관리자 변경 후 처리해 주시기 바랍니다. (" + data.resultMsg + ")");
                }else {
                    common.showAlertError($translate.instant('label.user_deregistered'), data);
                }
            });
        };

        /*
         * [비밀번호 수정] 클릭 이벤트
         * */
        $scope.changePassword = function ($event) {
            var dialogOptions = {
                title : $translate.instant("label.pwd_change"),
                form : {
                    name: "passwordForm",
                    options: ""
                },
                dialogClassName : "modal-dialog",
                templateUrl: _COMM_VIEWS_ + "/user/popChangePasswordForm.html" + _VersionTail(),
                okName : $translate.instant("label.change")
            };
            $scope.pop.changePasswordData = {
                oldPassword : "",
                password : "",
                retypePassword : ""
            };
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.changePasswordAction($scope.pop.changePasswordData);
            }
        };

        /*
         * [비밀번호 수정] 실제 액션
         * */
        pop.changePasswordAction = function(passData){
            if(passData.oldPassword == undefined || passData.oldPassword == ""){
                alert($translate.instant("message.mi_type_current_pwd"));
                return;
            }
            if(passData.password == undefined || passData.password == ""){
                alert($translate.instant("message.mi_type_new_pwd"));
                return;
            }
            if (passData.password != passData.retypePassword) {
                alert($translate.instant("message.mi_wrong_pwd_retype"));
                return;
            }
            var param = {
                'user_id'     : $scope.main.userInfo.user_id,
                'email'       : $scope.main.userInfo.email,
                'old_password': passData.oldPassword,
                'password'    : passData.password,
                'token'       : $scope.main.userInfo.token
                //'version'     : $scope.main.userInfo.version
            };

            $scope.main.loadingMainBody=true;
            var changePromise = memberService.changePassword(param);
            changePromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                common.clearUser();
                common.setUser(data);
                common.clearAccessToken();
                common.setAccessToken(data.token);

                // 초기화 및 팝업 닫기
                $scope.popHide();

                common.showAlert($translate.instant("label.pwd_change"), $translate.instant("message.mi_change_pwd"));

            });
            changePromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                // 초기화 및 팝업 닫기
                $scope.popHide();

                if(status == 406){      //비밀번호 패턴이 맞지 않습니다.
                    common.showAlertError($translate.instant("label.pwd_change"), "비밀번호 규칙이 맞지 않습니다. 10~20자 영문, 숫자를 포함해 주시기 바랍니다.");
                } else {
                    //$scope.error = $translate.instant("label.error");
                    common.showAlertError($translate.instant("label.pwd_change"), "비밀번호 수정 실패!!! 비밀번호를 다시 수정해 주세요.");
                }
            });
        };
    })
;