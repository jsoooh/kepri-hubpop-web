'use strict';

angular.module('portal.controllers')
    .controller('commCompanyCtrl', function ($scope, $location, $state, $stateParams, $translate, $interval, companyService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("companyControllers.js : commCompanyCtrl", 1);

        var ct = this;
        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언

        ct.companys = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        //기업검색 : 검색 조건 세팅
        ct.conditions = [
            {id: 'companyName',        name: 'label.business_name'},
            {id: 'companyId',          name: 'label.business_id'},
            {id: 'registrationNumber', name: 'label.registration_number'},
            {id: 'representativeName', name: 'label.representative_name'}
        ];
        ct.selCondition = ct.conditions[0];

        ct.selOrgId = "";
        ct.isUpdate = false;        //수정여부
        ct.showDetail = false;
        ct.showQuotaDetail = false;
        ct.companyData = {};
        ct.companyQuotaData = {};
        ct.file = {};

        ct.uaaContextUrl = CONSTANTS.uaaContextUrl;
        ct.phoneNumbers  = CONSTANTS.phoneNumbers;

        ct.blurRegistrationNo = false;
        ct.blurPhoneNumber    = false;
        ct.blurManagerPhoneNo = false;
        ct.isRefresh          = false;  //화면 refresh 중인지 체크

        pop.companyData = {};
        pop.phoneNumbers = CONSTANTS.phoneNumbers;
        pop.isDuplicateCompany = false;
        pop.isDuplicateManager = false;
        pop.isAttachedFile = false;
        pop.blurRegistrationNo = false;
        pop.blurPhoneNumber = false;
        pop.blurManagerPhoneNo = false;
        pop.file = {};
        pop.caption   = "반려 사유";
        pop.placeText = pop.caption + "를 입력하세요.";

        /*Company 목록 조회*/
        ct.listCompanys = function (currentPage) {

            ct.showDetail = false;
            var sText = (ct.schText == null || ct.schText == undefined)?"": ct.schText;

            if(!ct.isRefresh) {
                $scope.main.loadingMainBody = true;
            }
            if (currentPage == undefined) currentPage = 1;
            ct.pageOptions.currentPage = currentPage;
            var domainPromise = companyService.listCompany(ct.pageOptions.pageSize, currentPage-1, ct.selCondition.id, sText);
            domainPromise.success(function (data) {
                ct.companies = data.items;
                ct.pageOptions.total = data.counts;
                $scope.main.loadingMainBody = false;

                //현 페이지 목록 중 중지중/삭제중 있는지 확인. 없는 경우 화면 refresh 멈춤
                checkStatusCodeIng();
            });
            domainPromise.error(function (data, status, headers) {
                ct.companies = [];
                $interval.cancel($scope.main.refreshInterval['company_interval']);
                $scope.main.loadingMainBody = false;
            });
        };

        /*게시판 검색input 엔터 시 조회*/
        ct.schEnter = function (keyEvent){
            if(keyEvent.which == 13){
                ct.listCompanys();
            }
        };

        /*
         * 그리드 클릭 > 사용자 클릭 : 사용자 상세조회
         * */
        ct.getCompanyUser = function(){

            $scope.main.loadingMainBody = true;
            var orgPromise = companyService.listCompanyUsers($scope.selCompanyId);
            orgPromise.success(function (data) {
                $scope.main.loadingMainBody = false;

                ct.companyUsers = data.items;
            });
            orgPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                uaa.alert(data);
            });
        };

        /*
         * 기업상세 저장
         * */
        ct.updateCompany = function(detail){

            if($scope.detail.companyName == undefined || $scope.detail.companyName == '') {
                uaa.alert($translate.instant('mi_dont_input_business_name'));
                return;
            }
            if ($scope.detail.registrationNumber1 == undefined || $scope.detail.registrationNumber1 == '' || $scope.detail.registrationNumber2 == undefined || $scope.detail.registrationNumber2 == '' || $scope.detail.registrationNumber3 == undefined || $scope.detail.registrationNumber3 == '') {
                uaa.alert($translate.instant('mi_required_item_bizNo'));
                return false;
            }
            if ($scope.detail.phoneNumber1 == undefined || $scope.detail.phoneNumber1 == '' || $scope.detail.phoneNumber2 == undefined || $scope.detail.phoneNumber2 == '' || $scope.detail.phoneNumber3 == undefined || $scope.detail.phoneNumber3 == '') {
                uaa.alert("대표 전화번호는 필수 입력 항목입니다.");
                return false;
            }
            var param = {
                'companyId'          : $scope.detail.companyId,
                'companyName'        : $scope.detail.companyName,
                'registrationNumber1': $scope.detail.registrationNumber1,
                'registrationNumber2': $scope.detail.registrationNumber2,
                'registrationNumber3': $scope.detail.registrationNumber3,
                'representativeName' : $scope.detail.representativeName,
                'phoneNumber1'       : $scope.detail.phoneNumber1,
                'phoneNumber2'       : $scope.detail.phoneNumber2,
                'phoneNumber3'       : $scope.detail.phoneNumber3,
                'address'            : $scope.detail.address,
                'businessType1'      : $scope.detail.businessType1,
                'businessType2'      : $scope.detail.businessType2,
                'thirdPartyYn'       : $scope.detail.thirdPartyYn
            };
            $scope.main.loadingMainBody = true;
            var updatePromise = companyService.updateCompany($scope.detail.companyId, param);
            updatePromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;
                uaa.success($translate.instant('mi_change_company'));
                $scope.getList();
            });
            updatePromise.error(function(data) {
                $scope.main.loadingMainBody = false;
                uaa.alert(data);
            });
        };

        ct.resetData = function () {
            $scope.detail = null;
        };

        /*
         * 승인/반려/중지/삭제 클릭 이벤트
         *      gb : appr/return/stop/delete
         * */
        ct.showPop = function (companyItem, gb, $event) {
            var isOK = true;
            var sOkName = "";   //버튼명
            if(gb == "return"){
                sOkName = $translate.instant("label.regject");
            }else if(gb == "stop"){
                sOkName = $translate.instant("label.stop2");
            }else if(gb == "delete"){
                sOkName = $translate.instant("label.del");
            }

            if (gb == "appr") {   //승인
                var param = {'companyId': companyItem.companyId
                            , 'isOk': isOK
                            , 'returnReason': '' };
                isOKTran(companyItem.companyId, isOK, param);
            } else {      //반려/중지/삭제
                isOK = false;
                if(gb == "return"){
                    pop.caption   = "반려 사유";
                }else if(gb == "stop"){
                    pop.caption   = "중지 사유";
                }else if(gb == "delete"){
                    pop.caption   = "삭제 사유";
                }
                pop.placeText = pop.caption + "를 입력하세요.";

                var dialogOptions = {
                    title: pop.caption + " (" + companyItem.companyId + ")",
                    form: {
                        name: "popCompanyReturnForm",
                        options: ""
                    },
                    dialogClassName: "modal-dialog",
                    templateUrl: _COMM_ADMIN_VIEWS_ + "/company/popCompanyReturnForm.html" + _VersionTail(),
                    okName: sOkName
                };
                pop.mode = "C";
                if(gb == "return"){
                    pop.reason = companyItem.returnReason;
                }else if(gb == "stop"){
                    pop.reason = companyItem.stopReason;
                }else if(gb == "delete"){
                    pop.reason = companyItem.returnReason;
                }
                common.showDialog($scope, $event, dialogOptions);
                // Dialog ok 버튼 클릭 시 액션 정의
                $scope.popDialogOk = function () {
                    if (!new ValidationService().checkFormValidity($scope[$scope.dialogOptions.formName])) {
                        $scope.actionBtnHied = false;
                        return;
                    }

                    if(gb == "return"){         //반려
                        var param = {'companyId': companyItem.companyId
                            , 'isOk': isOK
                            , 'returnReason': pop.reason };
                        isOKTran(companyItem.companyId, isOK, param);
                    }else if(gb == "stop"){     //중지
                        var param = {'companyId': companyItem.companyId, 'stopReason': pop.reason };
                        ct.stopCompany(companyItem.companyId, param);
                    }else if(gb == "delete"){   //삭제
                        var param = {'companyId': companyItem.companyId, 'deleteReason': pop.reason };
                        ct.deleteCompany(companyItem.companyId, param);
                    }
                };
            }
        };

        /*[승인], [반려] 실제 처리*/
        function isOKTran(companyId, isOK, param) {

            $scope.isOK0 = isOK;

            if ($scope.isOK0) {
                $scope.main.loadingMainBody = true;
            }else{
                $scope.actionLoading = true;
            }
            var orgPromise = companyService.updateCompanyStatusCode(companyId, param);
            orgPromise.success(function (data, status, headers) {
                if ($scope.isOK0) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert("기업 승인/반려", $translate.instant("message.mi_apprv"));
                } else {
                    $scope.actionLoading = false;
                    common.showAlert("기업 승인/반려", $translate.instant("message.mi_regject"));
                }

                ct.listCompanys(ct.pageOptions.currentPage);
            });
            orgPromise.error(function (data, status, headers) {
                if ($scope.isOK0) {
                    $scope.main.loadingMainBody = false;
                }else{
                    $scope.actionLoading = false;
                }
                if (status == 406) {
                    common.showAlertError("조직 승인/반려", "관리자만 승인/반려 가능합니다.");
                }
            })
        }

        /*
        * 클릭 시 사유 보여줌 : 반려/중지/삭제
        *       gb : appr/return/stop/delete
        * */
        ct.popReason = function (companyItem, gb, $event) {
            //if(companyItem.statusCode != "back") return;
            if(gb == "return"){
                pop.caption   = "반려 사유";
            }else if(gb == "stop"){
                pop.caption   = "중지 사유";
            }else if(gb == "delete"){
                pop.caption   = "삭제 사유";
            }
            pop.placeText = pop.caption + "를 입력하세요.";
            var dialogOptions = {
                title: pop.caption + " (" + companyItem.companyId + ")",
                form: {
                    name: "popCompanyReturnForm",
                    options: ""
                },
                dialogClassName: "modal-dialog",
                templateUrl: _COMM_ADMIN_VIEWS_ + "/company/popCompanyReturnForm.html" + _VersionTail(),
                buttons: []//okName: $translate.instant("label.regject")
            };
            pop.mode = "R";
            if(gb == "return"){
                pop.reason = companyItem.returnReason;
            }else if(gb == "stop"){
                pop.reason = companyItem.stopReason;
            }else if(gb == "delete"){
                pop.reason = companyItem.returnReason;
            }
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {

            };
        };

        /* 기업 상세 */
        ct.getInfo = function (companyItem, isUpdate) {
            $scope.main.loadingMainBody = true;
            var viewPromise = companyService.getCompanyInfo(companyItem.companyId);
            viewPromise.success(function(data, status, headers){
                ct.isUpdate = isUpdate;
                $scope.main.loadingMainBody = false;

                clearForm();

                if (data) {
                    ct.companyData = data;
                    ct.showDetail = true;
                    ct.blurRegistrationNo = false;
                    ct.blurPhoneNumber = false;
                    ct.blurManagerPhoneNo = false;
                } else {
                    ct.companyData = {};
                    ct.showDetail = false;
                    ct.blurRegistrationNo = false;
                    ct.blurPhoneNumber = false;
                    ct.blurManagerPhoneNo = false;
                }

                /* 쿼타정보 조회 */
                ct.getQuotaInfo(companyItem);
            });
            viewPromise.error(function(data){
                $scope.main.loadingMainBody = false;
                common.showAlertError("",data);
            });
        };

        /* 기업정보 수정 */
        ct.updateCompanyAction = function(){
            // Company Info
            if (!ct.companyData) return;
            // angular-validation
            if (!new ValidationService().checkFormValidity($scope['updateCompanyForm'])) return;
            // form 전체 validation 여부(custom validation 포함)
            if ($scope['updateCompanyForm'].$invalid) return;

            if (ct.file.registrationFileName) {
                ct.companyData['attachedFile'] = ct.file.registrationFileName[0];
            }

            delete ct.companyData["createdDate"];
            delete ct.companyData["updatedDate"];
            ct.companyData.updatedId = common.getUser().email;

            $scope.main.loadingMainBody = true;
            var updatePromise = companyService.updateCompanyAction(ct.companyData);
            updatePromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;

                // Quota Update
                if (ct.companyQuotaData == undefined ||
                    ct.companyQuotaData == null      ||
                    ct.companyQuotaData == "" )
                {
                    common.showAlert('', $translate.instant('message.mi_change_company'));
                    ct.companyData = {};
                    ct.file = {};
                    ct.showDetail = false;
                    ct.blurRegistrationNo = false;
                    ct.blurPhoneNumber = false;
                    ct.blurManagerPhoneNo = false;
                    ct.listCompanys();
                } else {
                    ct.updateCompanyQuota();
                }
            });
            updatePromise.error(function(data) {
                $scope.main.loadingMainBody = false;
                common.showAlertError('', data);
            });
        };

        /* 기업정보 삭제 */
        ct.deleteCompany = function (companyId, param) {
            var showConfirm = common.showConfirm($translate.instant('label.company_del'), "기업(" + companyId + ") " + $translate.instant('message.mq_delete'));
            showConfirm.then(function () {

                $scope.main.loadingMainBody = true;
                var deletePromise = companyService.deleteCompanyAction(companyId, param);
                deletePromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.showDetail = false;
                    refresh();  //화면 refresh
                    common.showAlert($translate.instant('label.company_del'), $translate.instant('message.mi_deleting'));
                });
                deletePromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 401) {
                        ct.showDetail = false;
                        common.showAlertErrorHtml($translate.instant('label.company_del') + "(" + companyId + ")", "아래 시스템에서 사용중입니다. <br>아래 시스템에서 조직 삭제 후 처리해 주시기 바랍니다.<br>" + data.resultMsg);
                    } else {
                        ct.showDetail = false;
                        common.showAlertError($translate.instant('label.company_del') + "(" + companyId + ")", data);
                    }
                });
            });
        };

        /* 기업 중지 */
        ct.stopCompany = function (companyId, param) {
            var showConfirm = common.showConfirm($translate.instant('label.stop2'), "기업(" + companyId + ") " + $translate.instant('message.mq_stop'));
            showConfirm.then(function () {
                $scope.main.loadingMainBody = true;
                var deletePromise = companyService.stopCompanyAction(companyId, param);
                deletePromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.showDetail = false;
                    refresh();  //화면 refresh
                    common.showAlert($translate.instant('label.stop2'), $translate.instant('message.mi_stopping'));
                });
                deletePromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.showDetail = false;
                    if (status == 401) {
                        //common.showAlertHtml($translate.instant('label.company_del') + "(" + companyId + ")", "아래 시스템에서 사용중입니다. <br>아래 시스템에서 조직 삭제 후 처리해 주시기 바랍니다.<br>" + data.resultMsg);
                    } else {
                        common.showAlertError($translate.instant('label.stop2'), data);
                    }
                });
            });
        };

        /* 기업 활성화 : 중지상태에서 상태만 done으로 */
        ct.activateCompany = function (companyId) {
            var showConfirm = common.showConfirm($translate.instant('label.stop2'), "기업(" + companyId + ") " + $translate.instant('message.mq_activate'));
            showConfirm.then(function () {
                $scope.main.loadingMainBody = true;
                var activatePromise = companyService.activateCompanyAction(companyId);
                activatePromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.showDetail = false;
                    ct.listCompanys();
                    common.showAlert($translate.instant('label.stop2'), $translate.instant('message.mi_ctrl_success'));
                });
                activatePromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.showDetail = false;
                    if (status == 401) {
                        //common.showAlertHtml($translate.instant('label.company_del') + "(" + companyId + ")", "아래 시스템에서 사용중입니다. <br>아래 시스템에서 조직 삭제 후 처리해 주시기 바랍니다.<br>" + data.resultMsg);
                    } else {
                        common.showAlertError("", data);
                    }
                });
            });
        };

        /* 기업 Quota 상세 */
        ct.getQuotaInfo = function (companyItem) {
            $scope.main.loadingMainBody = true;
            var viewPromise = companyService.listCompanyQuotas(companyItem.companyId);
            viewPromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;
                //$scope['companyQuotaForm'].$setPristine();
                //$scope['companyQuotaForm'].$setUntouched();
                //clearForm();
                if (data) {
                    ct.companyQuotaData = data.tokenInfo;
                    if (data.createdDate == undefined || data.createdDate == null) {
                        ct.companyQuotaData.createdDate = new Date();
                    }

                    //ct.showQuotaDetail = true;
                } else {
                    ct.companyQuotaData = {};
                    //ct.showQuotaDetail = false;
                }
            });
            viewPromise.error(function(data){
                $scope.main.loadingMainBody = false;
                common.showAlertError("",data);
            });
        };

        /* 기업 Quota 수정 */
        ct.updateCompanyQuota = function() {
            // angular-validation
            //if (!new ValidationService().checkFormValidity($scope['companyQuotaForm'])) return;
            // form 전체 validation 여부(custom validation 포함)
            //if ($scope['companyQuotaForm'].$invalid) return;

            delete ct.companyQuotaData["createdDate"];
            delete ct.companyQuotaData["updatedDate"];
            ct.companyQuotaData.updatedId = common.getUser().email;

            $scope.main.loadingMainBody = true;

            var updatePromise = companyService.updateCompanyQuota(ct.companyQuotaData);
            updatePromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;

                common.showAlert('', $translate.instant('message.mi_change_company'));
                ct.companyData = {};
                ct.companyQuotaData = {};
                ct.file = {};
                ct.showDetail = false;
                ct.showQuotaDetail = false;
                ct.blurRegistrationNo = false;
                ct.blurPhoneNumber = false;
                ct.blurManagerPhoneNo = false;
                ct.listCompanys();
            });
            updatePromise.error(function(data) {
                $scope.main.loadingMainBody = false;
                common.showAlertError('', data);
            });
        };

        /* 기업 Quota 초기화 */
        ct.initCompanyQuota = function() {
            angular.forEach(ct.companyQuotaData, function (data, key) {
                if (key == "IaaS" || key == "PaaS" || key == "DevOps") {
                   angular.forEach(data, function (_, quotas) {
                       ct.companyQuotaData[key][quotas] = 0;
                   });
                }
            });
        };

        /*[Company 추가] 클릭*/
        ct.createCompany = function ($event) {
            var dialogOptions = {
                title : $translate.instant("label.company_add"),
                formName : "companyForm",
                dialogClassName : "modal-lg",
                templateUrl: _COMM_ADMIN_VIEWS_ + "/company/popCompanyForm.html" + _VersionTail(),
                okName : $translate.instant("label.save")
            };
            pop.companyData = {};
            pop.companyData["orgLimit"] = CONSTANTS.defultOrgLimit;
            pop.companyData["thirdPartyYn"] = "N";
            pop.isDuplicateCompany = false;
            pop.isDuplicateManager = false;
            pop.isAttachedFile = false;
            pop.blurRegistrationNo = false;
            pop.blurPhoneNumber = false;
            pop.blurManagerPhoneNo = false;
            pop.file.registrationFileName = '';
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createCompanyAction(pop.companyData);
            };
        };

        /*[Company 추가] 팝업 [확인]*/
        pop.createCompanyAction = function (companyData) {
            pop.blurRegistrationNo = true;
            pop.blurPhoneNumber = true;
            pop.blurManagerPhoneNo = true;
            pop.isAttachedFile = true;

            // angular-validation
            if (!new ValidationService().checkFormValidity($scope[$scope.dialogOptions.formName])) {
                return;
            }
            // form 전체 validation 여부(custom validation 포함)
            if ($scope[$scope.dialogOptions.formName].$invalid) {
                if ($scope[$scope.dialogOptions.formName].$error.required.length) {
                    return;
                }
                if ($scope[$scope.dialogOptions.formName].$error.required.validation) {
                    return;
                }
                return;
            }
            // companyId 중복 여부
            if (pop.isDuplicateCompany) {
                return;
            }
            // managerEmail 중복 여부
            if (pop.isDuplicateManager) {
                return;
            }
            // 첨부파일 추가 여부
            if (pop.file.registrationFileName == '') {
                return;
            }

            var param = {};
            param["companyId"]          = companyData.companyId;
            param["companyName"]        = companyData.companyName;
            param["registrationNumber1"]= companyData.registrationNumber1;
            param["registrationNumber2"]= companyData.registrationNumber2;
            param["registrationNumber3"]= companyData.registrationNumber3;
            param["representativeName"] = companyData.representativeName;
            param["phoneNumber1"]       = companyData.phoneNumber1;
            param["phoneNumber2"]       = companyData.phoneNumber2;
            param["phoneNumber3"]       = companyData.phoneNumber3;
            param["address"]            = companyData.address;
            param["businessType1"]      = companyData.businessType1;
            param["businessType2"]      = companyData.businessType2;
            param["managerName"]        = companyData.managerName;
            param["managerPhoneNumber1"]= companyData.managerPhoneNumber1;
            param["managerPhoneNumber2"]= companyData.managerPhoneNumber2;
            param["managerPhoneNumber3"]= companyData.managerPhoneNumber3;
            param["managerEmail"]       = companyData.managerEmail;
            param["orgLimit"]           = companyData.orgLimit;
            param["thirdPartyYn"]       = companyData.thirdPartyYn;

            if (pop.file.registrationFileName != undefined && pop.file.registrationFileName != null) {
                param['attachedFile'] = pop.file.registrationFileName[0];
            }

            $scope.actionLoading = true;
            var createPromise = companyService.createCompanyAction(param);
            createPromise.success(function (data, status, headers) {
                $scope.actionLoading = false;
                common.showAlertHtml($translate.instant("label.company_add"), $translate.instant("message.mi_register_success")).then(function () {
                    pop.companyData = {};
                    pop.file = {};
                    ct.listCompanys();
                });
            });
            createPromise.error(function (data, status, headers) {
                $scope.actionLoading = false;
                $scope.error = $translate.instant("label.error");
                if(status == 401){          //Not Admin
                    common.showAlertErrorHtml($translate.instant("label.company_add"), $translate.instant("message.mi_no_admin_role"));
                }else if(status == 406){    //Dup
                    common.showAlertErrorHtml($translate.instant("label.company_add"), $translate.instant("message.mi_exist_duplicate_company"));
                }
            });
        };

        /* companyId 중복 확인*/
        pop.duplicateCompany = function (companyId) {
            if(companyId == null || companyId == "" || companyId == undefined) return;
            $scope.main.loadingMainBody = true;
            var duplicatePromise = companyService.existsCompany(companyId);
            duplicatePromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;
                if(data){
                    pop.isDuplicateCompany = true;
                } else{
                    pop.isDuplicateCompany = false;
                }
            });
            duplicatePromise.error(function(data){
                $scope.main.loadingMainBody = false;
                //common.showAlertError("",data);
            });
        };

        /* managerEmail 중복 확인*/
        pop.duplicateManager = function (email) {
            if(email == null || email == "" || email == undefined) return;
            $scope.main.loadingMainBody = true;
            var duplicatePromise = companyService.existsManager(email);
            duplicatePromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;
                if(data){
                    pop.isDuplicateManager = true;
                } else{
                    pop.isDuplicateManager = false;
                }
            });
            duplicatePromise.error(function(data){
                $scope.main.loadingMainBody = false;
                //common.showAlertError("",data);
            });
        };

        /*
        * 기업 중지/삭제 시 화면 refresh
        *   - 2초마다 함수 호출
        *   - 목록 중 중지중/삭제중(~ing) 없는 경우 화면 refresh 멈춤
        * */
        function refresh() {
            ct.isRefresh = true;  //화면 refresh 중
            $scope.main.refreshInterval['company_interval'] = $interval(function() {
                ct.listCompanys(ct.pageOptions.currentPage);
            }, 2000);
        }

        /*
        * 현 페이지 목록 중 중지중/삭제중 있는지 확인
        *   - 없는 경우 화면 refresh 멈춤
        * */
        function checkStatusCodeIng(){
            if (!ct.isRefresh) return;

            var isIng = false;
            angular.forEach(ct.companies, function(companyItem) {
                //상태코드가 중지중/삭제중이 있는 경우
                console.debug("======companyItem.statusCode========"+ companyItem.statusCode);
                if (companyItem.statusCode.indexOf("ing")>-1) {
                    isIng = true;
                    return;
                }
            });
            if(!isIng) {
                $interval.cancel($scope.main.refreshInterval['company_interval']);
                ct.isRefresh = false;  //화면 refresh 중이 아님
            }
            console.debug("======ct.isRefresh========"+ ct.isRefresh);
        }

        /* 기업정보, 기업Quota 초기화 */
        function clearForm() {
            ct.companyData = {};
            ct.showDetail = false;
            ct.blurRegistrationNo = false;
            ct.blurPhoneNumber = false;
            ct.blurManagerPhoneNo = false;

            ct.companyQuotaData = {};
            ct.showQuotaDetail = false;
        }

        ct.listCompanys();
    })
;
