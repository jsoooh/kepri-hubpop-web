'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $cookies, $mdDialog, orgService, userSettingService, common, CONSTANTS) {
        _DebugConsoleLog("orgControllers.js : commOrgProjectsCtrl", 1);

        var ct = this;
        ct.orgProjects = [];
        ct.selectItemKey = 0;
        ct.userAuth = $scope.main.userAuth;
        ct.popup = $stateParams.popup;      //프로젝트 생성 팝업 여부
        ct.schFilterText = "";
        ct.listType = "image";          //프로젝트 리스트 타입

        ct.extendItem = function(evt) {
            //console.log('extendItem', evt);
            if($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.changeItem = function(evt, itemKey) {
            //console.log('changeItem', evt);
            ct.selectItemKey = itemKey;
        };

        // portalOrg 선택 제거
        $scope.main.setPortalOrg(null);
        $scope.main.loadingMainBody = true;
        ct.schType = 'orgName';

        // 조직추가 시 상단에 조직명, 조직아이디 기본 '' 출력
        $scope.main.detailOrgName = '';

        ct.isBtnOperationRegistration = false; // 작업 등록 버튼 권한

        if ($scope.main.userAuth == 'M') { // 기업관리자, 프로젝트 책임자
            ct.isBtnOperationRegistration = true; // 작업 등록 버튼 권한
        } else if ($scope.main.userAuth == 'O') { // 조직관리자, 프로젝트 관리자
            ct.isBtnOperationRegistration = true; // 작업 등록 버튼 권한
        }

        /*Org 목록 조회*/
        ct.listOrgProjects = function () {
            ct.orgProjects = [];
            $scope.main.loadingMainBody = true;
            var promise = orgService.getMyProjectOrgList($scope.main.sltProjectId, "", "");
            promise.success(function (data) {
                if (data && data.items && angular.isArray(data.items)) {
                    common.objectOrArrayMergeData(ct.orgProjects, angular.copy(data.items));
                    $scope.main.setListAllPortalOrgs(data.items);
                } else {
                    $scope.main.setListAllPortalOrgs();
                }
                //좌측메뉴 [프로젝트 생성] 클릭으로 넘어온 경우 바로 팝업 띄움. 2019.06.25
                if ($scope.main.userAuth == 'M' && ct.popup == 'popup') {
                    ct.addOrgProjectFormOpen();
                }
            });
            promise.error(function (data, status, headers) {
            });
            promise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.detailNgClick = function(orgItem) {
            $location.path('/comm/projects/projectDetail/' + orgItem.id);
        };

        /*프로젝트 생성 팝업창 오픈*/
        ct.addOrgProjectFormOpen = function($event) {
            //임시 알림 설정 2020.02.03
            //common.showDialogAlert("알림", "플랫폼 정책 변경에 따라 신규 프로젝트와 가상머신 생성을 제한하고 있습니다.\n자세한 문의는 관리자(042-865-6786, 042-865-5236)으로 문의하여 주시기 바랍니다."); return;
            var orgProject = {};
            orgProject.managerId    = $scope.main.userInfo.user_id;
            orgProject.managerName  = $scope.main.userInfo.user_name;
            orgProject.managerEmail = $scope.main.userInfo.email;

            orgProject.projectId = $scope.main.sltProjectId;

            var dialogOptions = {
                controller : "commAddOrgProjecFormCtrl",
                controllerAs: "pop",
                templateUrl : _COMM_VIEWS_ + "/org/popOrgProjectForm.html" + _VersionTail(),
                formName : "popOrgProjectForm",
                orgProject : orgProject,
                callBackFunction : ct.listOrgProjects
            };
            $scope.actionBtnHied = false;
            $scope.actionLoading = false;
            common.showCustomDialog($scope, $event, dialogOptions);
        };

        /*프로젝트명 변경 팝업화면 오픈*/
        ct.changeNameOrgProject = function ($event, org) {
            $scope.dialogOptions = {
                controller: "commChangeNameFormCtrl",
                callBackFunction: ct.listOrgProjects,
                org : org
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /* 2020.03.24 - 사용자 탈퇴 추가 by ksw */
        ct.withdrawOrgProjectUser = function (org) {
            var showConfirm = common.showConfirm($translate.instant('label.del'), org.orgName + ' ' + $translate.instant('message.mq_delete_account'));
            showConfirm.then(function() {
                ct.withdrawOrgProjectUserAction(org);
            });
        };

        /* 2020.03.24 - 사용자 탈퇴 액션 추가 by ksw */
        ct.withdrawOrgProjectUserAction = function (org) {
            $scope.main.loadingMain = true;
            var user = {};
            user.email = $scope.main.userInfo.email;
            var promise = orgService.deleteOrgUser(org.id, user.email);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                ct.listOrgProjects();
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_delete_account'));
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_delete_account'));
            });
        };

        /* 2020.03.27 - 즐겨찾기 추가 by ksw */
        ct.orgBookmarkAdd = function (org) {
            var showConfirm = common.showConfirm($translate.instant('label.add'), org.orgName + '' + $translate.instant('message.mq_bookmark'));
            showConfirm.then(function () {
                $scope.main.loadingMain = true;
                var promise = orgService.orgBookmarkAdd(org.id);
                promise.success(function (data) {
                    $scope.main.loadingMain = false;
                    ct.listOrgProjects();
                    common.showAlertSuccess($translate.instant('message.mi_egov_success_org_bookmark'));

                });
                promise.error(function (data) {
                    $scope.main.loadingMain = false;
                    common.showAlertError($translate.instant('message.mi_egov_fail_org_bookmark'));
                });
            })
        };

        /* 2020.03.31 - 즐겨찾기 삭제 by ksw */
        ct.orgBookmarkDelete = function (org) {
            var showConfirm = common.showConfirm($translate.instant('label.del'), org.orgName + '' + $translate.instant('message.mq_unbookmark'));
            showConfirm.then(function () {
                $scope.main.loadingMain = true;
                var promise = orgService.orgBookmarkDelete(org.id);
                promise.success(function (data) {
                    $scope.main.loadingMain = false;
                    ct.listOrgProjects();
                    common.showAlertSuccess($translate.instant('message.mi_egov_success_org_unbookmark'));
                });
                promise.error(function (data) {
                    $scope.main.loadingMain = false;
                    common.showAlertError($translate.instant('message.mi_egov_fail_org_unbookmark'));
                });
            })
        };

        ct.listOrgProjects();   //조직 목록 조회
    })
    .controller('commFirstOrgProjectMainCtrl', function ($scope) {
        _DebugConsoleLog("orgControllers.js : commFirstOrgProjectMainCtrl", 1);

        var ct = this;
        ct.fn = {};

        ct.selectItemKey = 0;

        ct.userAuth  = $scope.main.userAuth;

        ct.fn.extendItem = function(evt) {
            //console.log('extendItem', evt);
            if($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.fn.changeItem = function(evt, itemKey) {
            //console.log('changeItem', evt);
            ct.selectItemKey = itemKey;
        };

        $scope.main.loadingMainBody = false;

    })
    .controller('commAddOrgProjecFormCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commAddOrgProjecFormCtrl", 1);

        var pop = this;

        pop.validationService = new ValidationService();

        pop.formName = $scope.dialogOptions.formName;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.title = $translate.instant("label.project_register");
        $scope.dialogOptions.okName = "생성";
        $scope.dialogOptions.closeName = "취소";

        pop.orgProject = $scope.dialogOptions.orgProject;

        $scope.actionBtnHied = false;
        $scope.actionLoading = false;

        $scope.popDialogOk = function () {
            pop.addOrgProject();
        };

        pop.btnClickCheck = false;
        pop.orgProjectDefaultQuota = function(projectId) {
            if(!projectId) {
                return;
            }
            var param = {};
            param['projectId'] = projectId;
            var promise = quotaService.listOrgQuotas(param);
            promise.success(function(data, status, headers) {
                pop.orgQuotas = data.items;
                pop.orgProject.orgQuotaId = '';
                if (pop.orgQuotas && pop.orgQuotas.length > 0) {
                    for (var i = 0; i < pop.orgQuotas.length; i++) {
                        if (pop.orgQuotas[i].defaultQuota == true) {
                            pop.orgProject.orgQuotaId = pop.orgQuotas[i].id;
                            break;
                        }
                    }
                    if (!pop.orgProject.orgQuotaId){
                        pop.orgProject.orgQuotaId = pop.orgQuotas[0].orgQuotaId;
                    }
                }
                if (!pop.orgProject.orgQuotaId){
                    common.showAlert('프로젝트 쿼터가 없어 프로젝트를 등록할 수 없습니다.');
                    common.mdDialogHide();
                }
            });
            promise.error(function(data, status, headers) {
                pop.defaultOrgQuotaId = '';
            });
        };

        pop.addOrgProject = function() {
            if (pop.btnClickCheck) return;
            pop.btnClickCheck = true;

            if (!pop.validationService.checkFormValidity($scope[pop.formName])) {
                pop.btnClickCheck = false;
                return;
            }

            var param           = {};
            param.orgManager    = {'email':pop.orgProject.managerEmail, 'userId':pop.orgProject.managerId};
            param.project       = {'id':pop.orgProject.projectId};
            param.quota         = {'id':pop.orgProject.orgQuotaId};
            param.description   = pop.orgProject.orgName;
            param.usePublicIp   = true;
            param.orgName       = pop.orgProject.orgName;

            $scope.main.loadingMainBody= true;

            var applyPromise = orgService.requestOrgCreate(param);
            applyPromise.success(function (data) {
                $scope.main.loadingMainBody=false;
                pop.btnClickCheck = false;
                common.mdDialogHide();
                //common.showAlert($translate.instant('label.org_add'), $translate.instant('message.mi_apply_org_after_apprv'));
                common.showAlert($translate.instant('label.org_add'), $translate.instant('message.mi_egov_success_common_insert'));
                if (angular.isFunction(pop.callBackFunction)) {
                    pop.callBackFunction();
                }
            });
            applyPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                pop.btnClickCheck = false;
                //common.showAlertError($translate.instant('label.org_add') + "(" + param.orgName + ")", data);
            });
        };

        $scope.validationOrgProjectName = function (orgProjectName) {
            var regexp = /[ㄱ-ㅎ가-힣0-9a-zA-Z.\-_]/;    //한글,숫자,영문,특수문자(.-_)
            var bInValid = false;
            var text = orgProjectName;
            var orgNameErrorString = "";                //문제되는 문자
            if (!text) return;
            for (var i=0; i<text.length; i++) {
                if (text.charAt(i) != " " && regexp.test(text.charAt(i)) == false) {
                    bInValid = true;
                    orgNameErrorString += text.charAt(i);
                }
            }
            if (bInValid) {
                return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
            } else {
                return {isValid : true};
            }
        };

        pop.orgProjectDefaultQuota(pop.orgProject.projectId);
    })
    .controller('commOrgProjectCreateCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $cookies, $mdDialog, orgService, quotaService, userSettingService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("orgControllers.js : commOrgProjectCreateCtrl", 1);

        var ct = this;

        ct.orgData = {};
        ct.orgData.orgQuotaPlan = [];
        ct.orgData.orgQuotas = [];
        ct.quotaItemValue = [];
        ct.orgData.personal = "nomal";
        ct.formName = "orgCreateForm";
        ct.orgIdValidationResult = false;
        ct.personalProjectCnt = 0;      //개인프로젝트 생성 갯수
        ct.myPersonalCnt = 0;           //사용자별 개인프로젝트 생성 갯수

        ct.attachFile = null;         //과제계획서 파일
        ct.uploader = common.setDefaultFileUploader($scope);
        ct.uploader.onAfterAddingFile = function(fileItem) {
            $('#attachFile').val(fileItem._file.name);
            ct.attachFile = null;
            $timeout(function () {
                ct.attachFile = fileItem;
            }, 0);
        };

        /*프로젝트 ID 유효성 검사 및 중복체크*/
        ct.orgIdCustomValidationCheck = function(orgId) {
            var regexp = /[0-9a-zA-Z\-_]/;    //숫자,영문,특수문자(-_)
            var bInValid = false;
            var text = orgId;
            var orgNameErrorString = "";      //문제되는 문자
            if (!text) return;
            for (var i=0; i<text.length; i++) {
                if (text.charAt(i) != "" && regexp.test(text.charAt(i)) == false) {
                    bInValid = true;
                    orgNameErrorString += text.charAt(i);
                }
            }
            if (bInValid) {
                return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
            } else {        //프로젝트 ID 중복체크
                var param = {
                    org_id : orgId.trim()
                };
                var returnPromise = orgService.orgIdValidationCheck(param);
                returnPromise.success(function (data) {
                    if (data) {
                        ct.orgIdValidationResult = true;
                    } else {
                        ct.orgIdValidationResult = false;
                    }
                });
                returnPromise.error(function (data) {
                    common.showAlert("message",data.message);
                });
                if (ct.orgIdValidationResult) {
                    return {isValid : false, message: "이미 사용하고 있는 프로젝트 ID 입니다."};
                } else {
                    return {isValid : true};
                }
            }
        };

        /*프로젝트 이름 유효성 검사*/
        ct.validationOrgProjectName = function (orgProjectName) {
            var regexp = /[ㄱ-ㅎ가-힣0-9a-zA-Z.\-_]/;    //한글,숫자,영문
            var bInValid = false;
            var text = orgProjectName;
            var orgNameErrorString = "";             //문제되는 문자
            if (!text) return;
            for (var i=0; i<text.length; i++) {
                if (text.charAt(i) != " " && regexp.test(text.charAt(i)) == false) {
                    bInValid = true;
                    orgNameErrorString += text.charAt(i);
                }
            }
            if (bInValid) {
                return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
            } else {
                return {isValid : true};
            }
        };

        /*참조플랜 그룹 목록 조회*/
        ct.listQuotaPlanGroups = function() {
            $scope.main.loadingMainBody = true;
            var params = {
                schType : "name",
                schText : ""
            };
            var returnPromise = quotaService.listQuotaPlanGroups(params);
            returnPromise.success(function (data) {
                ct.quotaPlanGroups = [];
                ct.quotaPlanGroups = data;
            });
            returnPromise.error(function (data) {
                ct.quotaPlanGroups = [];
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                ct.quotaPlanGroups.unshift({id:"", name:"-- 유형 선택 --"});
                ct.orgData.orgQuotaPlan = ct.quotaPlanGroups[0];
                $scope.main.loadingMainBody = false;
            });
        };

        /*참조플랜 그룹 세부목록 조회*/
        ct.listQuotaPlan = function() {
            var returnPromise = "";
            if (ct.orgData.personal == "personal") { //프로젝트 유형 확인
                var params = {
                    isPersonal : true
                };
                returnPromise = quotaService.listQuotaPlanPersonal(params);
            } else {
                var initSchGroupId = ct.orgData.orgQuotaPlan.id;
                if (!initSchGroupId) {
                    initSchGroupId = -1;
                }
                var params = {
                    schGroupId : initSchGroupId,
                    schType : "name",
                    schText:  ""
                };
                returnPromise = quotaService.listQuotaPlan(params);
            }
            returnPromise.success(function (data) {
                ct.quotaPlan = [];
                ct.quotaPlan = data;
            });
            returnPromise.error(function (data) {
                ct.quotaPlan = [];
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                ct.quotaPlan.unshift({id:"", code:"-- 세부 유형 선택 --"});
                ct.orgData.orgQuotas = ct.quotaPlan[0];
            });
        };

        /*상세쿼타조정 조회*/
        ct.listQuotaItem = function() {
            var params = {
                schGroupId : 0,
                schType : "name",
                schText : ""
            };
            var returnPromise = quotaService.listQuotaItem(params);
            returnPromise.success(function (data) {
                ct.quotaItem = [];
                ct.quotaItem = data;
            });
            returnPromise.error(function (data) {
                ct.quotaItem = [];
                common.showAlert("message",data.message);
            });
        };

        /*상세쿼타조정 값 조회*/
        ct.listQuotaItemValue = function() {
            var planId = ct.orgData.orgQuotas.id;
            if(!planId) {
                planId = 1;
            }
            var returnPromise = quotaService.listQuotaItemValue(planId);
            returnPromise.success(function (data) {
                ct.quotaItemValue = [];
                ct.quotaItemValue = data;

                for (var i=0; i<ct.quotaItem.length; i++) { //상세쿼타조정 값 매칭
                    ct.quotaItem[i].value = "";
                    for (var j=0; j<ct.quotaItemValue.length; j++) {
                        if (ct.quotaItem[i].id == ct.quotaItemValue[j].orgQuotaItem.id) {
                            ct.quotaItem[i].value = ct.quotaItemValue[j].value;
                            break;
                        }
                    }
                }
            });
            returnPromise.error(function (data) {
                ct.quotaItemValue = [];
                common.showAlert("message",data.message);
            });
        };

        /*프로젝트 쿼터 세부 유형 선택*/
        ct.changePlan = function () {
            ct.orgData.paasQuotaGuid = ct.orgData.orgQuotas.paasQuotaGuid;
            ct.listQuotaItemValue();
        };

        /*프로젝트 유형 변경 감지*/
        ct.orgCaseChange = function() {
            var calendarButton = $('.datepickerWrap').find('.dtp-ig');
            if(ct.orgData.personal == "personal") {
                ct.orgData.startDate = moment().format('YYYY-MM-DD');
                ct.orgData.endDate = moment('9999-12-31','YYYY-MM-DD');
                calendarButton.hide();
            } else {
                ct.orgData.startDate = moment().format('YYYY-MM-DD');
                ct.orgData.endDate = moment().subtract(1,'days').add(1,'month').format('YYYY-MM-DD');
                ct.listQuotaPlanGroups();
                calendarButton.show();
            }
            ct.listQuotaPlan();
        };

        /*프로젝트 신청*/
        ct.createOrg = function () {
            if (!new ValidationService().checkFormValidity($scope[ct.formName]) || !ct.orgData.startDate || !ct.orgData.endDate) { //프로젝트 신청 유효성 검증
                common.showAlertSuccess("잘못된 값이 있거나 필수사항을 입력해 주세요", "잘못된 값이 있거나 필수사항을 입력해 주세요");
                return;
            }

            var params = {};
            params['orgId'] = ct.orgData.orgId.trim();
            params['orgName'] = ct.orgData.orgName.trim();
            params['personal'] = ct.orgData.personal == "personal" ? true : false;
            params['startDate'] = ct.orgData.startDate;
            params['endDate'] = ct.orgData.endDate;
            params['cost'] = !ct.orgData.cost ? 0 : ct.orgData.cost;
            params['description'] = !ct.orgData.description ? "" : ct.orgData.description;
            params['orgQuotaPlanId'] = ct.orgData.orgQuotas.id;
            params['paasQuotaGuid'] = !ct.orgData.paasQuotaGuid ? "" : ct.orgData.paasQuotaGuid;
            var quotasList = [];
            for (var i=0; i<ct.quotaItem.length; i++) {
                if (ct.quotaItem[i].value) {
                    var orgQuotas = ct.quotaItem[i].id + "/" + ct.quotaItem[i].value;
                    quotasList.push(orgQuotas);
                }
            }
            params['orgQuotaValues'] = quotasList;
            if (!ct.orgData.paasQuotaGuid && quotasList.length == 0) {
                common.showAlertSuccess("상세 쿼터 설정은 필수사항입니다.", "상세 쿼터 설정은 필수사항입니다.");
                return;
            }
            if (ct.attachFile != null) {
                params['attachFile'] = ct.attachFile._file;
            }
            var returnPromise = orgService.requestOrgCreate(params);
            returnPromise.success(function (data, status, headers) {
                $location.path('/comm/projects');
                common.showAlertSuccess("프로젝트 신청 성공", "프로젝트 신청을 완료했습니다.");
            });
            returnPromise.error(function (data) {
                common.showAlert("message",data.message);
            });
        };

        /*개인 프로젝트 설정 건수 조회*/
        ct.getPersonalProjectCount = function () {
            ct.personalProjectCnt = 0;
            $scope.main.loadingMainBody = true;
            var returnPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.personalProjectCnt);
            returnPromise.success(function (data) {
                data = userSettingService.userSettingParse(data);
                if (data && data.contents && data.contents.projectCnt) {
                    ct.personalProjectCnt = data.contents.projectCnt;
                }
            });
            returnPromise.error(function (data, status, headers) {
                ct.personalProjectCnt = 0;
            });
            returnPromise.finally(function (data, status, headers) {
                //$scope.main.loadingMainBody = false;
                //사용자가 생성한 개인프로젝트 건수
                ct.getMyPersonalCnt();
            });
        };

        /*사용자가 생성한 개인프로젝트 건수*/
        ct.getMyPersonalCnt = function () {
            ct.myPersonalCnt = 0;
            //$scope.main.loadingMainBody = true;
            var returnPromise = orgService.getMyPersonalCnt();
            returnPromise.success(function (data) {
                if (data) {
                    ct.myPersonalCnt = data;
                }
            });
            returnPromise.error(function (data, status, headers) {
                ct.myPersonalCnt = 0;
            });
            returnPromise.finally(function (data, status, headers) {
                //$scope.main.loadingMainBody = false;
            });
        };

        /*paas 프로젝트 쿼터 조회*/
        ct.listPaasQuotas = function (currentPage) {
            $scope.main.loadingMainBody = true;
            if (!currentPage) {
                currentPage = 1;
            }
            var returnPromise = quotaService.listPaasQuotas(10, currentPage, null);
            returnPromise.success(function (data) {
                ct.paasQuotas = data.content;
            });
            returnPromise.error(function (data) {
                ct.paasQuotas = [];
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listQuotaPlanGroups();   //참조플랜 그룹 목록 조회 로딩
        ct.listQuotaPlan();         //참조플랜 그룹 세부목록 조회 로딩
        ct.listQuotaItem();         //상세쿼타조정 조회 로딩
        ct.orgCaseChange();         //프로젝트 유형 변경 감지 로딩
        ct.listPaasQuotas();        //paas 프로젝트 쿼터 조회
        //개인 프로젝트 설정 건수 조회
        ct.getPersonalProjectCount();
    })
    .controller('commChangeNameFormCtrl', function ($scope, $location, $state, $stateParams,$mdDialog,$translate, $q,ValidationService, orgService, common) {
        _DebugConsoleLog("orgControllers.js : commChangeNameFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = angular.copy($scope.dialogOptions.org);

        pop.formName = "changeNameForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-md";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popOrgProjectChangeNameForm.html" + _VersionTail();
        $scope.dialogOptions.title = "프로젝트명 변경";
        pop.method = "PUT";

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            pop.fn.createOrgProjectNameAction();
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        /* 20.04.01 - 프로젝트명 변경 액션 by ksw */
        pop.fn.createOrgProjectNameAction = function () {
            var params = {
                orgName: pop.data.orgName
            };

            $scope.main.loadingMain = true;
            var promise = orgService.updateOrgName(pop.data.id, params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_update'));
                common.mdDialogHide();
                /* 성공후 리스트에 바로 적용 */
                $scope.dialogOptions.org.orgName = params.orgName;
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_update'));
            });
        };
    })
;
