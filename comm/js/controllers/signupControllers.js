'use strict';

angular.module('common.controllers')
    .controller('commSignupCtrl', function ($scope, $location, $translate, CONSTANTS, common, signupService) {
        _DebugConsoleLog("signupControllers.js : commSignupCtrl", 1);

        $scope.blurSignupEmail    = false;     //회원가입 이메일 입력 이후 메시지 보이기 위함
        $scope.blurPassword       = false;     //회원가입 비밀번호 입력 이후 메시지 보이기 위함
        $scope.blurCellphoneNo    = false;     //회원가입 담당자 휴대폰 번호 입력 후 메시지 보이기 위함
        $scope.blurRegistrationNo = false;     //회원가입 담당자 사업자등록번호 입력 후 메시지 보이기 위함
        $scope.blurPhoneNo        = false;     //회원가입 담당자 대표전화번호 입력 후 메시지 보이기 위함

        //기업로고 샘플 다운받을 url
        $scope.guideUrl = location.origin;

        // 기업회원 가입안내 메일을 통해 들어온 경우인지 체크
        $scope.isFileUpload = true;
        var paramCompanyId = "";
        var paramEmail     = "";
        var absUrl  = $location.absUrl().toString();		//http://localhost:9000/#/signup?companyId=nUc3mHrhFS
        if (absUrl.indexOf('companyId=') > 0) {
            paramCompanyId = absUrl.substring(absUrl.indexOf('companyId=')+10, absUrl.length);
        } else if (absUrl.indexOf('userId=') > 0) {
            // 조직 초대 메일을 통해 들어온 경우인지 체크
            paramEmail = absUrl.substring(absUrl.indexOf('userId=')+7, absUrl.length);
        }

        // 회원가입 Step CSS 설정
        $scope.joinStepClass = {step1: "joinStep step01", step2: "joinStep step02", step3: "joinStep step03", step4: "joinStep step04"};
        // 회원가입 Step
        $scope.joinStep = "step1";

        // 이용약관 동의 체크
        $scope.agreePolicy = {service: false, personInfo: false};
        //$scope.agreePolicyCheck = true;
        // 휴대전화번호
        $scope.phoneNumbers = CONSTANTS.phoneNumbers;

        // Email check
        $scope.emailError = false;
        // Email check : Temp Email
        $scope.emailTempError = false;
        // 비밀번호 오류여부
        $scope.invalidPassword = false;
        // 기업관리자 담당자 휴대폰 check
        $scope.chkCellPhone = true;
        // 기업ID 중복 check
        $scope.dupCompanyId = false;
        // 기업 검색 버튼 비활성화 여부
        $scope.isCompanyDisable = false;

        $scope.memberInfo = {
            user_type: "normal", // 회원유형(일반화윈:"normal", 기업관리자: "company")
            user_name: "",
            email: "",
            password: "",
            password2: ""
        };
        $scope.fileName = "";

        // popup modal에서 사용 할 객체 선언
        var pop = $scope.pop = {};

        // Email Check
        //      1) duplicate Check
        //      2) Temp Email Check
        $scope.validationEmail = function() {

            if ($scope.memberInfo.email) {
                $scope.main.loadingMainBody = true;
                var chkEmail = $scope.memberInfo.email;
                //1. Email duplicate Check
                var validationPromise = signupService.fetchByEmail($scope.memberInfo.email);
                validationPromise.success(function (data, status, headers) {
                    //$scope.emailError = true;
                    $scope.emailError = data;
                    $scope.main.loadingMainBody = false;
                });
                validationPromise.error(function (data) {
                    $scope.emailError = false;
                    $scope.main.loadingMainBody = false;
                });

                //2. Temp Email Check
                $scope.emailTempError = false;
                for (var i=0; i<CONSTANTS.tempEmail.length; i++){
                    var arrEmail = chkEmail.split("@");
                    if (arrEmail[1] == CONSTANTS.tempEmail[i]){
                        $scope.emailTempError = true;
                        break;
                    }
                }

                //3. 공용계정(AI분석, ex:commonuser11) Check
                $scope.emailCommonError = false;
                var arrCommon = $scope.memberInfo.email.split('commonuser');

                if (arrCommon.length ==  2) {
                    var id2 = arrCommon[1]*1;
                    if (!isNaN(id2) && typeof id2 === "number") {
                        $scope.emailCommonError = true;
                    }
                }

                //4. 프로젝트 공용계정(ex:commonOrgUser300) Check
                $scope.emailCommonOrgError = false;
                if ($scope.memberInfo.email.toLowerCase().indexOf('commonorguser') > -1) $scope.emailCommonOrgError = true;
            }
        };


        $scope.resetEmail = function () {
            $scope.emailError       = false;     //이메일 dup Check
            $scope.emailTempError   = false;     //임시 이메일 Check
            $scope.emailCommonError = false;     //공용계정(AI분석, ex:commonuser11) Check
            $scope.emailCommonOrgError = false;  //프로젝트공용계정(AI분석, ex:commonOrgUser300) Check
            $scope.blurSignupEmail  = false;
        };

        // 비밀번호확인 check
        $scope.checkPasswordConfirm = function(){
            $scope.invalidPassword = false;

            if (!$scope.memberInfo.password && !$scope.memberInfo.password2) return;
            if ($scope.memberInfo.password != $scope.memberInfo.password2) {
                $scope.invalidPassword = true;
            } else {
                //
            }
        };

        // 담당자 휴대폰 check
        $scope.chkCellPhoneNumber = function(){
            if (!$scope.memberInfo.cellphone_number1 || !$scope.memberInfo.cellphone_number2 || !$scope.memberInfo.cellphone_number3){

                $scope.chkCellPhone = false;
            }
        };

        // 문자열 Byte 길이체크 (한글: 3Byte)
        var stringByteLength = function (string) {
            return (function(s,b,i,c){
                for(b=i=0;c=s.charCodeAt(i++);b+=c>>11?3:c>>7?2:1);
                return b
            })(string);
        };

        /*회원가입*/
        $scope.signup = function() {

            //validation 체크
            //일반회원 가입
            if(!$scope.requestForm.$valid) return;

            if (!$scope.memberInfo.email || $scope.memberInfo.email.length < 5) {
                common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_input_email'));
                return;
            }
            // 이메일 중복 체크
            if ($scope.emailError) {
                common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_exist_duplicate_email'));
                return;
            }
            //임시 이메일 체크
            if ($scope.emailTempError) {
                common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_allow_temp_email'));
                return;
            }
            //공용계정(AI분석, ex:commonuser11) Check
            if ($scope.emailCommonError) {
                common.showAlert($translate.instant('label.signup'), "[commonuser]+[숫자] 형식의 아이디는 사용하실 수 없습니다.");
                return;
            }
            //공용계정(AI분석, ex:commonuser11) Check
            if ($scope.emailCommonOrgError) {
                common.showAlert($translate.instant('label.signup'), $translate.instant('message.mi_unusable_commonorguser_email'));
                return;
            }

            if (!$scope.memberInfo.password || $scope.memberInfo.password.length < 10) {
                common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_input_pwd'));
                return;
            }
            if (!$scope.memberInfo.password2 || $scope.memberInfo.password2.length < 10) {
                common.showAlert($translate.instant('label.signup'), $translate.instant('message.mi_dont_input_pwd'));
                return;
            }
            // 비밀번호와 비밀번호 확인이 일치하는지 조건
            if ($scope.memberInfo.password != $scope.memberInfo.password2) {
                common.showAlert($translate.instant('label.signup'), $translate.instant('message.mi_wrong_pwd'));
                return;
            }

            // 일반회원 가입
            signup($scope.memberInfo);
        };

        /*일반회원 회원가입*/
        function signup(memberInfo){

            /*구분자(_)를 함께 쓰던 방식에서 변경*/
            var memInfo = chgMemberInfo(memberInfo);

            $scope.main.loadingMainBody = true;
            var signupPromise = signupService.signup(memInfo);
            signupPromise.success(function () {
                $scope.main.loadingMainBody = false;
                //common.showAlert("확인",$translate.instant('message.mi_register_user_confirm_email'));
                $scope.joinStep = "step4";
            });
            signupPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status == 406) {    //임시 이메일 Check
                    common.showAlertError($translate.instant('label.signup'), $translate.instant('message.mi_allow_temp_email'));
                } else {
                    common.showAlertError($translate.instant('label.signup'), data);
                }
            });
        }

        /*구분자(_)를 함께 쓰던 방식에서 변경*/
        function chgMemberInfo(memberInfo){

            var memInfo = {};
            memInfo['userType']             = memberInfo.user_type;
            memInfo['isManager']            = memberInfo.is_manager;
            memInfo['name']                 = memberInfo.user_name;
            memInfo['email']                = memberInfo.email;
            memInfo['password']             = memberInfo.password;
            memInfo['password2']            = memberInfo.password2;
            memInfo['position']             = memberInfo.position;

            return memInfo;
        }

        /*로그인 페이지 이동*/
        $scope.moveLoginPage = function() {
            common.moveLoginPage();
        };

    })
    .controller('verifyUserCtrl', function ($scope, $location, $translate, common, signupService) {
        _DebugConsoleLog("signupControllers.js : verifyUserCtrl", 1);

        var absUrl  = $location.absUrl().toString();		//http://localhost:9000/#/verify?auth_code=nUc3mHrhFS
        var verifyCode = absUrl.substring(absUrl.indexOf('auth_code=')+10, absUrl.length);
        $scope.verifyCode = verifyCode;
        $scope.verify = false;

        $scope.main.loadingMainBody = true;

        var promise = signupService.verifyUser({auth_code: verifyCode});
        promise.success(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
            $scope.verify = true;
            $scope.verifyMessage = $translate.instant('message.mi_auth_user_email');
            //$scope.email = data.email;
        });
        promise.error(function (data, status, headers) {
            $scope.main.loadingMainBody = false;
            $scope.verifyMessage = $translate.instant('message.mi_wrong_email_auth_code_reissue_code');
        });

        $scope.ok = function () {
            common.moveLoginPage();
        }
    })
    .controller('resendverifymailCtrl', function ($scope, $location, $translate, common, signupService) {
        _DebugConsoleLog("signupControllers.js : resendverifymailCtrl", 1);

        //[이메일 인증 재발송] 사전 Check
        $scope.validationEmail = function() {
            $scope.main.loadingMainBody = true;

            var validationPromise = signupService.preChkResendVerifyEmail($scope.email);
            validationPromise.success(function (data) {
                // 이미 인증된 사용자
                if(angular.equals(data.verified, true)) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert($translate.instant('label.email_auth_resend'), $translate.instant('message.mi_auth_user_aleady'));
                } else {
                    $scope.sendEmail();
                }
            });
            validationPromise.error(function () {
                $scope.main.loadingMainBody = false;
                common.showAlertError($translate.instant('label.email_auth_resend'), $translate.instant('message.mi_dont_exist_email'));
            });
        };

        //[이메일 인증 재발송] Send Email
        $scope.sendEmail = function () {
            var param = {email: $scope.email};

            //$scope.$root.rootLoading = true;
            var passwordResetEmailPromise = signupService.resendVerifyEmail(param);
            passwordResetEmailPromise.success(function () {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.email_auth_resend'), $translate.instant('message.mi_send_email'));
                common.moveLoginPage();
            });
            passwordResetEmailPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                //data.message = $translate.instant('message.mi_dont_exist_email') +'<br>' + data.errors[0].message;
                common.showAlertError("Error!!!", data);
            });
        }
    })
    .directive('onlyNumber', function(){
        return {
            link: function(scope, element, attr){
                element.on('keydown', function(event){
                    var key = (event.which) ? event.which : event.keyCode;
                    if ((key >=48 && key <= 57) || (key >=96 && key <= 105) || (key == 8) || (key == 9) || (key == 13) || (key == 16) || (key == 37) || (key == 39) || (key == 116)){
                        return true;
                    }
                    else {
                        return false;
                    }
                });
            }
        }
    })
;