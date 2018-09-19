'use strict';

angular.module('portal.controllers')
    .controller('signupCtrl', function ($scope, $location, $translate, CONSTANTS, common, signupService) {
        _DebugConsoleLog("signupControllers.js : signupCtrl", 1);

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
            password2: "",
            cellphone_number1: "",
            cellphone_number2: "",
            cellphone_number3: "",
            company_id: "",
            company_name: "",
            representative_name: "",
            registration_number1: "",
            registration_number2: "",
            registration_number3: "",
            address: "",
            phone_number1: "",
            phone_number2: "",
            phone_number3: "",
            registration_file_name: "",
            registration_file_path: "",
            ci_use_yn: "N",
            ci_file_name: "",
            ci_file_path: "",
            thirdPartyYn: "N"
        };
        $scope.fileName = "";

        // 기업회원 가입안내 메일을 통해 들어온 경우는 Step2로 이동
        if (paramCompanyId) {
            $scope.memberInfo.user_type = "company";
            $scope.joinStep = "step2";

            // 기업회원 가입안내 메일을 통해 들어온 경우는 기업정보 조회
            var validationPromise = signupService.getCompanyInfo(paramCompanyId);
            validationPromise.success(function (data, status, headers) {
                // 기업정보 입력 못하도록 변경
                if (data.companyId != undefined && data.companyId != "") {
                    $scope.isCompanyDisable = true;
                }

                $scope.memberInfo.company_id           = data.companyId;
                $scope.memberInfo.company_name         = data.companyName;
                $scope.memberInfo.representative_name  = data.representativeName;
                $scope.memberInfo.registration_number1 = data.registrationNumber1;
                $scope.memberInfo.registration_number2 = data.registrationNumber2;
                $scope.memberInfo.registration_number3 = data.registrationNumber3;
                $scope.memberInfo.address              = data.address;
                $scope.memberInfo.phone_number1        = data.phoneNumber1;
                $scope.memberInfo.phone_number2        = data.phoneNumber2;
                $scope.memberInfo.phone_number3        = data.phoneNumber3;

                $scope.memberInfo.email                = data.managerEmail;
                $scope.memberInfo.user_name            = data.managerName;
                $scope.memberInfo.cellphone_number1    = data.managerPhoneNumber1;
                $scope.memberInfo.cellphone_number2    = data.managerPhoneNumber2;
                $scope.memberInfo.cellphone_number3    = data.managerPhoneNumber3;
                $scope.memberInfo.thirdPartyYn         = data.thirdPartyYn;

                $scope.memberInfo.registration_file_name = data.registrationFileName;
                $scope.memberInfo.registration_file_path = data.registrationFilePath;

                if ( $scope.memberInfo.registration_file_name != undefined &&
                     $scope.memberInfo.registration_file_name != null      &&
                     $scope.memberInfo.registration_file_name != ""        &&
                     $scope.memberInfo.registration_file_path != undefined &&
                     $scope.memberInfo.registration_file_path != null      &&
                     $scope.memberInfo.registration_file_path != "" ){

                    $scope.isFileUpload = false;
                } else {
                    $scope.memberInfo.registration_file_name = "";
                    $scope.memberInfo.registration_file_path = "";
                }
            });
        }

        // 조직 초대 메일을 통해 들어온 경우는 기업정보 조회
        if (paramEmail != undefined && paramEmail != "") {
            $scope.memberInfo.email     = paramEmail;
            $scope.memberInfo.user_type = "normal";
            $scope.joinStep = "step2";

            var validationPromise = signupService.checkByInvitation(paramEmail);
            validationPromise.success(function (data, status, headers) {
                $scope.memberInfo.company_id   = data.companyId;
                $scope.memberInfo.company_name = data.companyName;
                $scope.memberInfo.user_name    = data.userName;
                if ($scope.memberInfo.company_id) {
                    $scope.isCompanyDisable = true;
                }
            });
        }

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
                //pop.totalCnt = data.itemCount;
                pop.pageOption.total = data.counts;
            });
            searchPromise.error(function(data) {
                $scope.main.loadingMainBody=false;
                common.showAlertError($translate.instant('label.company_search'), data);
            });
        };

        // 기업검색 팝업에서 그리드 클릭 시 해당 기업으로 세팅
        pop.setCompany = function(comp) {
            $scope.memberInfo.company_id   = comp.companyId;
            $scope.memberInfo.company_name = comp.companyName;

            $scope.popCancel();
        };

        // 사용자 유형 선택
        $scope.userTypeClick = function (userType) {
            $scope.memberInfo.user_type = userType;
            $scope.joinStep = "step2";
        };

        // 이용약관 동의 클릭
        $scope.agreePolicyClick = function () {
            if ($scope.agreePolicy["service"] && $scope.agreePolicy["personInfo"]) {
                $scope.agreePolicyCheck = false;
                //회원정보 입력으로 이동
                $scope.joinStep = "step3";

            } else {
                var messages = "이용약관에 모두 동의시 이 진행 됩니다.";
                if (!$scope.agreePolicy["service"] && $scope.agreePolicy["personInfo"]) {
                    messages = "'서비스 이용약관' 동의는 필수항목 입니다.";
                }
                if ($scope.agreePolicy["service"] && !$scope.agreePolicy["personInfo"]) {
                    messages = "'개인정보 수집 및 활용 안내' 동의는 필수항목 입니다.";
                }
                common.showAlert($translate.instant('label.signup'), messages );
            }
        };

        // Email Check
        //      1) duplicate Check
        //      2) Temp Email Check
        $scope.validationEmail = function() {

            if ($scope.memberInfo.email) {
$scope.main.loadingMain = true;
                var chkEmail = $scope.memberInfo.email;
                //1. Email duplicate Check
                var validationPromise = signupService.fetchByEmail($scope.memberInfo.email);
                validationPromise.success(function (data, status, headers) {
//                    $scope.emailError = true;
                    $scope.emailError = data;
$scope.main.loadingMain = false;
                });
                validationPromise.error(function (data) {
                    $scope.emailError = false;
$scope.main.loadingMain = false;
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
            }
        };


        $scope.resetEmail = function () {
            $scope.emailError      = false;     //이메일 dup Check
            $scope.emailTempError  = false;     //임시 이메일 Check
            $scope.blurSignupEmail = false;
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

        // CompanyId 중복 Check
        $scope.validationCompany = function() {
            if ($scope.memberInfo.company_id != "") {
                // 기업회원 가입안내 메일을 통해 들어온 경우는 return;
                if (paramCompanyId) return;

                var validationPromise = signupService.checkByCompany($scope.memberInfo.company_id);
                validationPromise.success(function (data, status, headers) {
                    $scope.dupCompanyId = true;
                });
                validationPromise.error(function (data) {
                    $scope.dupCompanyId = false;
                });
            }
        };

        // CompanyId 중복 Check
        $scope.moveLoginPage = function() {
            common.moveLoginPage();
        };

        $scope.initCompany = function () {
            if ($scope.memberInfo != undefined) {
                $scope.memberInfo.company_id   = "";
                $scope.memberInfo.company_name = "";
                $scope.isCompanyDisable = false;
            }
        };

        // 문자열 Byte 길이체크 (한글: 3Byte)
        var stringByteLength = function (string) {
            return (function(s,b,i,c){
                for(b=i=0;c=s.charCodeAt(i++);b+=c>>11?3:c>>7?2:1);
                return b
            })(string);
        };

        //
        $scope.signup = function() {

            //validation 체크
            if ($scope.memberInfo.user_type == "company") {     //기업관리자 가입
                if(!$scope.requestFormCompany.$valid) return;
            }else{                                              //일반회원 가입
                if(!$scope.requestForm.$valid) return;
            }

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

            /*if ($scope.agreePolicyCheck) {
                common.showAlert("확인",$translate.instant('message.mi_agree_privacy'));
                return false;
            }*/
            // 기업관리자 가입
            if ($scope.memberInfo.user_type == "company") {

                if (!$scope.memberInfo.company_id) {
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_type_business_id'));
                    return;
                }
                if($scope.dupCompanyId){
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_exist_duplicate_company'));
                    return;
                }
                if (!$scope.memberInfo.company_name || stringByteLength($scope.memberInfo.company_name) < 6) {
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_input_business_name'));
                    return;
                }
                if (!$scope.memberInfo.representative_name || stringByteLength($scope.memberInfo.representative_name) < 6) {
                    common.showAlert($translate.instant('label.signup'), $translate.instant('label.representative_name') + $translate.instant('message.mi_required_items'));
                    return;
                }
                if ($scope.memberInfo.registration_number1.length != 3 ||
                    $scope.memberInfo.registration_number2.length != 2 ||
                    $scope.memberInfo.registration_number3.length != 5 ){

                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_required_item_bizNo'));
                    return;
                }
                if (!$scope.memberInfo.address || stringByteLength($scope.memberInfo.address) < 4) {
                    common.showAlert($translate.instant('label.signup'), $translate.instant('message.mi_type_address'));
                    return;
                }
                if (!$scope.memberInfo.phone_number1 || !$scope.memberInfo.phone_number2 || !$scope.memberInfo.phone_number3){
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_input_crepresentative_tel_no'));
                    return;
                }
                /*if ($scope.memberInfo.registration_file_name == undefined || $scope.memberInfo.registration_file_name == "" )
                {
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_select_file'));
                    return false;
                }*/

                if ($scope.isFileUpload && !$scope.uploadedFile) {
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_select_file'));
                    return;
                }
                //기업로고 사용:Y, 기업로고 첨부파일 없을 때
                if ($scope.memberInfo.ci_use_yn == "Y" && !$scope.ciUploadedFile) {
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_select_ci_file'));
                    return;
                }
                //thirdParty여부
                if (!$scope.memberInfo.thirdPartyYn) {
                    common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_select_third_party_yn'));
                    return;
                }

                //담당자명
                if (!$scope.memberInfo.user_name || stringByteLength($scope.memberInfo.user_name) < 6) {
                    if ($scope.memberInfo.user_type == "company") {
                        common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_type_manager_name'));
                    } else {
                        common.showAlert($translate.instant('label.signup'),$translate.instant('message.mi_dont_input_name'));
                    }
                    return;
                }

                $scope.main.loadingMainBody = true;
                if ($scope.isFileUpload) {
                    //사업자등록증 파일 업로드
                    var fileUploadPromise = signupService.fileUpload("registration", $scope.uploadedFile);
                    fileUploadPromise.success(function (data) {
                        if (data != undefined && data != null) {
                            //$scope.main.loadingMainBody = false;
                            $scope.memberInfo.registration_file_name = $scope.uploadedFile.name;
                            $scope.memberInfo.registration_file_path = data.filePath;

                            if($scope.memberInfo.ci_use_yn=="Y" && $scope.ciUploadedFile){

                                //기업로고 파일업로드
                                var ciFileUploadPromise = signupService.fileUpload("ci", $scope.ciUploadedFile);
                                ciFileUploadPromise.success(function (data) {
                                    if (data != undefined && data != null) {
                                        //$scope.main.loadingMainBody = false;
                                        $scope.memberInfo.ci_file_name = $scope.ciUploadedFile.name;
                                        $scope.memberInfo.ci_file_path = data.filePath;

                                        // 기업관리자 정보 저장
                                        signupCompanyManager($scope.memberInfo);
                                    }
                                });
                                ciFileUploadPromise.error(function (data) {
                                    $scope.main.loadingMainBody = false;
                                    $scope.memberInfo.registration_file_name = "";
                                    common.showAlertError("기업로고 파일첨부 오류!!!","첨부파일을 다시 첨부 해 주세요...");
                                });
                            }else {
                                // 기업관리자 정보 저장
                                signupCompanyManager($scope.memberInfo);
                            }

                        } else {
                            $scope.main.loadingMainBody = false;
                            common.showAlertError("오류",data);
                        }

                    });
                    fileUploadPromise.error(function (data) {
                        $scope.main.loadingMainBody = false;
                        $scope.memberInfo.registration_file_name = "";
                        common.showAlertError("사업자등록증 파일첨부 오류!!!","첨부파일을 다시 첨부 해 주세요...");
                    });
                } else {
                    // 기업관리자 정보 저장
                    signupCompanyManager($scope.memberInfo);
                }
            } else {
                 // 일반회원 가입
                signup($scope.memberInfo);
            }
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
            memInfo['cellphoneNumber1']     = memberInfo.cellphone_number1;
            memInfo['cellphoneNumber2']     = memberInfo.cellphone_number2;
            memInfo['cellphoneNumber3']     = memberInfo.cellphone_number3;
            memInfo['companyId']            = memberInfo.company_id;
            memInfo['companyName']          = memberInfo.company_name;
            memInfo['representativeName']   = memberInfo.representative_name;
            memInfo['registrationNumber1']  = memberInfo.registration_number1;
            memInfo['registrationNumber2']  = memberInfo.registration_number2;
            memInfo['registrationNumber3']  = memberInfo.registration_number3;
            memInfo['address']              = memberInfo.address;
            memInfo['phoneNumber1']         = memberInfo.phone_number1;
            memInfo['phoneNumber2']         = memberInfo.phone_number2;
            memInfo['phoneNumber3']         = memberInfo.phone_number3;
            memInfo['registrationFileName'] = memberInfo.registration_file_name;
            memInfo['registrationFilePath'] = memberInfo.registration_file_path;
            memInfo['ciUseYn']              = memberInfo.ci_use_yn;
            memInfo['ciFileName']           = memberInfo.ci_file_name;
            memInfo['ciFilePath']           = memberInfo.ci_file_path;
            memInfo['thirdPartyYn']         = memberInfo.thirdPartyYn;

            return memInfo;
        }



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
                    if((key >=48 && key <= 57) || (key >=96 && key <= 105) || (key == 8) || (key == 9) || (key == 13) || (key == 16) || (key == 37) || (key == 39) || (key == 116)){
                        return true;
                    }
                    else{
                        return false;
                    }
                });
            }
        }
    })
;