'use strict';

angular.module('portal.controllers')
    .controller('memberCtrl', function ($scope, $location, $state, $stateParams, $translate, CONSTANTS, common, cache, signupService, member) {
        _DebugConsoleLog("memberControllers.js : memberCtrl", 1);

        $scope.memberInfo = {
            user_id          : $scope.main.userInfo.user_id,
            user_name        : $scope.main.userInfo.user_name,
            email            : $scope.main.userInfo.email,
            cellphone_number1: "",
            cellphone_number2: "",
            cellphone_number3: "",
            company_id       : "",
            company_name     : "",
            user_type        : "normal", // 회원유형(일반화윈:"normal", 기업관리자: "company")
            is_uaaUpdate     : false
        };

        //회원정보, 기업정보 세팅
        function fnSetInit() {
            $scope.memberInfo.user_id           = $scope.main.userInfo.user_id;
            $scope.memberInfo.user_name         = $scope.main.userInfo.user_name;
            $scope.memberInfo.email             = $scope.main.userInfo.email;
            $scope.memberInfo.user_type         = $scope.main.userInfo.user_type;
            $scope.memberInfo.cellphone_number1 = $scope.main.userInfo.cellphone_number1;
            $scope.memberInfo.cellphone_number2 = $scope.main.userInfo.cellphone_number2;
            $scope.memberInfo.cellphone_number3 = $scope.main.userInfo.cellphone_number3;
            $scope.memberInfo.company_id        = $scope.main.userInfo.company_id;
            $scope.memberInfo.company_name      = $scope.main.userInfo.company_name;
            $scope.is_uaaUpdate                 = false;
        };

        /*
         * 처음 User 정보 조회
         * */
        function fnUserInfo(){
            // 사용자정보가 없으면 로그인 페이지로 이동
            if ( ($scope.main.userInfo         == undefined && $scope.main.userInfo         == null) ||
                 ($scope.main.userInfo.user_id == undefined && $scope.main.userInfo.user_id == null) )
            {
                common.clearUser();
                common.moveLoginPage();
                return;
            }

            $scope.main.loadingMainBody=true;
            //var memberPromise = member.getUserInfo($scope.main.userInfo.email, $scope.main.userInfo.token);
            var memberPromise = member.getUserInfo($scope.main.userInfo.user_id);
            memberPromise.success(function(data, status, headers){
                $scope.main.loadingMainBody=false;
                common.setUser(data);
                fnSetInit();    //회원정보, 기업정보 세팅
            });
            memberPromise.error(function(data) {
                $scope.main.loadingMainBody=false;
                common.showAlertError($translate.instant('label.user_info'), data);
            });
        };
        fnUserInfo();

        // 저장버튼클릭
        $scope.updateUser = function() {
            if ($scope.memberInfo.user_name == "") {
                common.showAlert($translate.instant('label.user_info'), $translate.instant('message.mi_dont_input_name'));
                return false;
            }
            if ($scope.memberInfo.email == "") {
                common.showAlert($translate.instant('label.user_info'), $translate.instant('message.mi_dont_input_email'));
                return false;
            }

            // 이름이 변경 되었으면 UAA Update
            if ($scope.memberInfo.user_name != $scope.main.userInfo.user_name) $scope.memberInfo.is_uaaUpdate = true;

            $scope.main.loadingMainBody = true;
            var signupPromise = member.updateUser($scope.memberInfo);
            signupPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.setUser(data);
                //common.setAccessToken(data.token);
                $state.reload();
                common.showAlert($translate.instant('label.user_info'), $translate.instant('message.mi_change_privacy'));
            });
            signupPromise.error(function (data) {
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
                , version    : $scope.main.userInfo.version
                //, user_type  : $scope.memberInfo.user_type
                //, company_id : $scope.memberInfo.company_id
            };

            $scope.main.loadingMainBody=true;
            var deletePromise = member.deleteUser(param);
            deletePromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                common.logout();
                common.showAlert($translate.instant('label.user_deregistered'), $translate.instant('message.mi_delete'));
                common.moveLoginPage();
            });
            deletePromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                if (status == 401) {          //기업관리자
                    common.showAlertError($translate.instant('label.user_deregistered'), "프로젝트책임자 이므로 탈퇴가 불가능합니다. 관리자에게 문의 바랍니다.");
                }else if(status == 406){      //조직관리자
                    common.showAlertError($translate.instant("label.user_deregistered"), "다음 작업에서 작업관리자 입니다. 작업관리자 변경 후 처리해 주시기 바랍니다. (" + data.resultMsg + ")");
                }else {
                    common.showAlertError($translate.instant('label.user_deregistered'), data);
                }
            });
        };

        // popup modal에서 사용 할 객체 선언
        var pop = $scope.pop = {};
        pop.companies = [];

        /* 기업검색 paging */
        pop.pageOption = {
            currentPage: 1,
            pageSize: 10,
            total: 0
        };

        /*기업 검색 클릭 이벤트*/
        $scope.searchCompanyList = function($event) {
            var dialogOptions = {
                title : $translate.instant("label.company_search"),
                form : {
                    name: "searchCompany",
                    options: "",
                },
                dialogClassName : "modal-lg",
                templateUrl: "views/common/popSearchCompany.html" + _VersionTail(),
                buttons : []
            };

            pop.searchCompanyAction();
            common.showDialog($scope, $event, dialogOptions);
        };

        // 기업검색 : 검색 조건 세팅
        pop.conditions = [
            {id: 'companyName',        name: 'label.business_name'},
            {id: 'companyId',          name: 'label.business_id'},
            //{id: 'registrationNumber', name: 'label.registration_number'},
            {id: 'representativeName', name: 'label.representative_name'}
        ];
        pop.selCondition = pop.conditions[0];
        if( $scope.main.userInfo.company_id != undefined &&
            $scope.main.userInfo.company_id != null      &&
            $scope.main.userInfo.company_id != '' )
        {
            pop.selCondition = pop.conditions[1];
            pop.schText = $scope.main.userInfo.company_id;
        };

        // 기업검색(팝업 버튼클릭 이벤트)
        pop.searchCompanyAction = function(currentPage) {

            if (currentPage == undefined) currentPage = 1;
            pop.pageOption.currentPage = currentPage;

            var sText = pop.schText == null?"":pop.schText;
            //기업검색 : 검색구분/검색어
            //var param = {'schType': pop.selCondition.id, 'schText': sText};

            $scope.main.loadingMainBody=true;
            var searchPromise = signupService.searchCompany(pop.pageOption.pageSize, currentPage-1, pop.selCondition.id, sText);
            searchPromise.success(function(data, status, headers){
                $scope.main.loadingMainBody=false;
                pop.companies = data.items;
                pop.pageOption.total = data.counts;
            });
            searchPromise.error(function(data) {
                $scope.main.loadingMainBody=false;
                common.showAlertError($translate.instant('label.company_search'), data);
            });
        };

        /*기업검색 팝업에서 그리드 클릭 시 해당 기업으로 세팅*/
        pop.setCompany = function(comp) {
            $scope.memberInfo.company_id   = comp.companyId;
            $scope.memberInfo.company_name = comp.companyName;

            $scope.popCancel();
        };

        /* 비밀번호 입력 변수 */
        pop.changePasswordData = {
            oldPassword : "",
            password : "",
            retypePassword : ""
        };

        /*
         * [비밀번호 수정] 클릭 이벤트
         * */
        $scope.changePassword = function ($event) {
            var dialogOptions = {
                title : $translate.instant("label.pwd_change"),
                form : {
                    name: "passwordForm",
                    options: "",
                },
                dialogClassName : "modal-dialog",
                templateUrl: "views/member/popChangePasswordForm.html" + _VersionTail(),
                okName : $translate.instant("label.change")
            };
            pop.changePasswordData = {
                oldPassword : "",
                password : "",
                retypePassword : ""
            };
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.changePasswordAction(pop.changePasswordData);
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
            var changePromise = member.changePassword(param);
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