'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, orgService, quotaService, common, portal) {
        _DebugConsoleLog("orgControllers.js : commOrgProjectsCtrl", 1);

        var ct = this;
        ct.orgProjects = [];
        ct.notices = [];
        ct.tempNotices = [];
        ct.selectItemKey = 0;
        ct.userAuth = $scope.main.userAuth;
        ct.popup = $stateParams.popup;      //프로젝트 생성 팝업 여부
        ct.schFilterText = "";
        ct.popNoticeCnt = 0;
        ct.tempData = {
            "data":[
                {
                    "NOTICE_NO":6,
                    "TITLE":"공지사항",
                    "POP_YN":"Y",
                    "START_DT":"2019-05-30",
                    "END_DT":"2019-08-06",
                    "CONTENTS":"<p>테스트입니다.</p>\r\n",
                    "ATTACH_FILE":"206|RTU속성2.txt",
                    "COMMON_CD":"CD0021",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2019-05-30",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2019-05-30",
                    "DELETE_YN":"N"
                }
            ],
            "status":{
                "code":200,
                "name":"OK"
            }
        };

        ct.extendItem = function(evt) {
            console.log('extendItem', evt);
            if($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.changeItem = function(evt, itemKey) {
            console.log('changeItem', evt);
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

        ct.orgProjects = [];

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
                $scope.main.loadingMainBody = false;

                //좌측메뉴 [프로젝트 생성] 클릭으로 넘어온 경우 바로 팝업 띄움. 2019.06.25
                if ($scope.main.userAuth == 'M' && ct.popup == 'popup') {
                    ct.addOrgProjectFormOpen();
                }
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.detailNgClick = function(orgItem) {
            $location.path('/comm/projects/projectDetail/' + orgItem.id);
        };

        ct.addOrgProjectFormOpen = function($event) {
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

        /*공지 목록 조회*/
        ct.listNotices = function () {
            ct.notices = [];
            ct.tempNotices = [];
            ct.popNoticeCnt = 0;
            $scope.main.loadingMainBody = true;
            var promise = portal.portalOrgs.getNotices();
            promise.success(function (data) {
                ct.tempNotices = data;
            });
            promise.error(function (data, status, headers) {
            });
            promise.finally(function() {
                ct.tempNotices = ct.tempData.data;
                if (ct.tempNotices.length > 0) {
                    setPopNoties();
                }
                $scope.main.loadingMainBody = false;
            });
        };

        function setPopNoties() {
            var toDay = moment(new Date()).format('YYYY-MM-DD');    //2019-07-11
            angular.forEach(ct.tempNotices, function (noticeItem) {
                if (noticeItem.DELETE_YN == "N" && noticeItem.POP_YN == "Y" && noticeItem.START_DT <= toDay && noticeItem.END_DT >= toDay) {
                    ct.notices.push(noticeItem);
                }
            });
            ct.popNoticeCnt = ct.notices.length;
            console.log("toDay : ", toDay);
            console.log("ct.popNoticeCnt : ", ct.popNoticeCnt);
            console.log("ct.tempNotices : ", ct.tempNotices);
            console.log("ct.notices : ", ct.notices);
        }

        ct.noticeListOpen = function($event) {
            ct.viewNoticeList = {};
            ct.viewNoticeList.isView11 = true;
            ct.viewNoticeList.isView12 = true;
            ct.viewNoticeList.isView13 = true;
            var dialogOptions = {
                controller : "commNoticeListFormCtrl",
                controllerAs: "pop",
                templateUrl : _COMM_VIEWS_ + "/common/popNoticeListForm.html" + _VersionTail(),
                formName : "popNoticeListForm",
                noticeList : ct.notices,
                viewNoticeList : ct.viewNoticeList,
                callBackFunction : ct.listNotices
            };
            $scope.actionBtnHied = false;
            $scope.actionLoading = false;
            common.showCustomDialog($scope, $event, dialogOptions);
        };

        //임시. 공지팝업 오픈
        //ct.noticeListOpen();

        ct.listOrgProjects();   //조직 목록 조회
        ct.listNotices();       //공지 목록 조회
    })
    .controller('commFirstOrgProjectMainCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commFirstOrgProjectMainCtrl", 1);

        var ct = this;
        ct.fn = {};

        ct.selectItemKey = 0;

        ct.userAuth  = $scope.main.userAuth;

        ct.fn.extendItem = function(evt) {
            console.log('extendItem', evt);
            if($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.fn.changeItem = function(evt, itemKey) {
            console.log('changeItem', evt);
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
            common.mdDialogHide();
            applyPromise.success(function (data) {
                $scope.main.loadingMainBody=false;
                pop.btnClickCheck = false;
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
    .controller('commNoticeListFormCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commNoticeListFormCtrl", 1);

        var pop = this;

        pop.validationService = new ValidationService();

        pop.formName = $scope.dialogOptions.formName;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.title = $translate.instant("label.board_notice");
        $scope.dialogOptions.clickOutsideToClose = true;    //동작안함
        //$scope.dialogOptions.okName = "생성";
        //$scope.dialogOptions.closeName = "취소";

        pop.noticeList = $scope.dialogOptions.noticeList;
        $scope.popNotice = $scope.dialogOptions.viewNoticeList;

        //공지사항 닫기
        $scope.popNotice.close = function (id) {
            switch (id) {
                case 11 : $scope.popNotice.isView11 = false; break;
                case 12 : $scope.popNotice.isView12 = false; break;
                case 13 : $scope.popNotice.isView13 = false; break;
            }
            if (!$scope.popNotice.isView11 && !$scope.popNotice.isView12 && !$scope.popNotice.isView13) {
                $scope.popCancel();
            }
        };

        //pop.orgProjectDefaultQuota(pop.orgProject.projectId);
    })
;
