'use strict';

angular.module('portal.controllers')
    .controller('commOrgDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, common, cache, quotaService, applicationService, userSettingService, CONSTANTS) {
        _DebugConsoleLog("orgDetailControllers.js : commOrgDetailCtrl", 1);

        var ct = this;
        var absUrl  = $location.absUrl().toString();

        //시스템관리자/기업관리자
        ct.isAdmin             = false;         //시스템관리자
        ct.isManager           = false;         //기업관리자
        ct.isThisOrgManager    = false;         //현 조직관리자
        ct.userAuth = common.getUserAuth();     //권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자
        if(ct.userAuth == "A"){
            ct.isAdmin = true;
        }else if(ct.userAuth == "M"){
            ct.isManager = true;
        }
        ct.userEmail           = common.getUser().email;
        ct.orgUsers            = [];

        var pop = $scope.pop   = {}; // popup modal에서 사용 할 객체 선언
        pop.orgData            = {};
        pop.orgUserData        = {};

        //작업 추가에서 쓰일 객체 시작
        pop.selOrg             = {};
        pop.selOrg.orgQuotas   = {};   //작업 쿼터
        //작업 추가에서 쓰일 객체 끝
        pop.projectUsers       = [];   //작업 멤버 추가 시의 사용자목록

        ct.paramMode           = $stateParams.mode;
        ct.paramId             = $stateParams.orgId;

        ct.selOrg              = {};
        ct.isSystemLinkRetry   = false;  //[재실행] 클릭 여부
        ct.isDashboardHide     = null;   //dashboard에서의 숨김 여부

        //paas app 조회
        ct.apps                = [];
        ct.sltOrganizationGuid = "";
        ct.sltSpaceGuid        = "";

        //iaas instance 조회
        ct.tenantResource      = {};
        ct.iaaSInstanceCount   = 0;		//iaas instanceCount 조회
        ct.data                = {};
        ct.serverMainData      = {};

        //quota.plan : comm 에서 조회
        ct.planQuotaIaaS       = {};    //cpu/memory/disk/objectStorage/ip
        ct.planQuotaPaaS       = {};    //memory/service/router/app
        //quota.used : iaas, paas에서 조회
        ct.usedQuotaIaaS       = {};
        ct.usedQuotaPaaS       = {};

        ct.bIaaS               = false;    //iaas정보 조회 여부
        ct.bPaaS               = false;    //paas정보 조회 여부

        /*
         * 등록일 때 화면 Init
         * 상세보기, 수정일 때 조회
         * */
        function getSetValue() {

            ct.startDateDisabled = true;
            ct.endDateDisabled   = true;

            if (!ct.paramId) {
                common.showAlert("작업 조회", $translate.instant('message.mi_dont_select_org'));
                return;
            }

            //조직정보 조회
            $scope.main.loadingMainBody = true;
            var orgPromise = orgService.getOrg(ct.paramId);
            orgPromise.success(function (data) {
                ct.selOrg = data; //org Set

                var isIng = false;
                if (ct.selOrg.statusCode.indexOf("ing")==-1) { //상태코드 ing 아닐 때 재조회 없도록
                    $timeout.cancel($scope.main.reloadCommTimmer['orgDetail']);
                } else {
                    isIng = true;
                    $scope.main.reloadCommTimmer['orgDetail'] = $timeout(function () {
                        getSetValue();
                    }, 3000)
                }

                // 상단 메뉴명에 조직명, 조직아이디 출력
                $scope.main.detailOrgName = ct.selOrg.orgName + ' : ' + ct.selOrg.id + '';

                //화면 refresh 중이 아닐 때만 하단 조회
                if (!isIng) {
                    if (ct.selOrg.useStartDate.time) ct.selOrg.useStartDate = moment(ct.selOrg.useStartDate.time).format("YYYY.MM.DD");
                    if (ct.selOrg.useEndDate.time) ct.selOrg.useEndDate = moment(ct.selOrg.useEndDate.time).format("YYYY.MM.DD");

                    // 조직 신청 변경 데이터 셋팅
                    ct.currentInfo = {};
                    ct.currentInfo['id'] = ct.selOrg.id;
                    ct.currentInfo['orgId'] = ct.selOrg.orgId;
                    ct.currentInfo['orgName'] = ct.selOrg.orgName;
                    ct.currentInfo['managerEmail'] = ct.selOrg.managerEmail;
                    var useStartDate = new Date(ct.selOrg.useStartDate.replace(/\./g, "-")).getTime();
                    var useEndDate = new Date(ct.selOrg.useEndDate.replace(/\./g, "-")).getTime();
                    ct.currentInfo['useStartDate'] = String(useStartDate);
                    ct.currentInfo['useEndDate'] = String(useEndDate);
                    ct.currentInfo['description'] = ct.selOrg.description;

                    //버튼 show/hide : 요청취소/조직수정/조직삭제
                    ct.isThisOrgManager = false;    //현 조직관리자
                    if(ct.selOrg.managerEmail == ct.userEmail){
                        ct.isThisOrgManager = true;    //현 조직관리자
                    }

                    //작업 멤버 보이도록 처리
                    $(".cBox.cToggle-open .cBox-cnt").show();

                    if (ct.selOrg.project && ct.selOrg.project.id){
                        if (ct.selOrg.project.id != $scope.main.sltProjectId){
                            //프로젝트 상세에 따라 공통 현프로젝트 변경
                            $scope.main.setProject(ct.selOrg.project);
                        }
                    }

                    $scope.main.changePortalOrg(ct.selOrg); //공통 org 선택

                    //조직 사용자 목록 조회
                    ct.getUserList();

                    //paas app 조회, iaas instance 조회
                    ct.getOrganizationByName();     //paas 조회
                    if (ct.data.tenantId) {
                        ct.fnGetServerMainList();   //iaas 조회
                    }

                    if (ct.isSystemLinkRetry){
                        //작업 이력/용량변경 요청 조회
                        getListQuotaHistoryNgClick();
                        ct.isSystemLinkRetry   = false;  //[재실행] 클릭 여부
                    }
                    //대시보드에서 감추기 시 보여주도록 하기 위한 조회.
                    ct.listJobs();
                    ct.getMyJobs();
                }

            });
            orgPromise.error(function (data, status, headers) {
                common.showAlertError("조직 조회", data.message);
                $timeout.cancel($scope.main.reloadCommTimmer['orgDetail']);
                $scope.main.loadingMainBody = false;
            });
        }

        /*조직 변경 신청 시 이전값과 비교*/
        function makeUpdates(body) {
            var updates = [];
            if(ct.currentInfo.useStartDate != body.useStartDate) {
                var item = {itemName: 'useStartDate', currentValue: ct.currentInfo.useStartDate, updateValue: body.useStartDate};
                updates.push(item);
            }
            if(ct.currentInfo.useEndDate != body.useEndDate) {
                var item = {itemName: 'useEndDate', currentValue: ct.currentInfo.useEndDate, updateValue: body.useEndDate};
                updates.push(item);
            }
            if(ct.currentInfo.orgName != body.orgName) {
                var item = {itemName: 'orgName', currentValue: ct.currentInfo.orgName, updateValue: body.orgName};
                updates.push(item);
            }
            if(ct.currentInfo.managerEmail != body.orgManager.email) {
                var item = {itemName: 'managerEmail', currentValue: ct.currentInfo.managerEmail, updateValue: body.managerEmail};
                updates.push(item);
            }
            if(ct.currentInfo.description != body.description) {
                var item = {itemName: 'description', currentValue: ct.currentInfo.description, updateValue: body.description};
                updates.push(item);
            }

            return updates;
        }

        /* 조직정보 유효성검사 */
        pop.validateOrg = function() {
            var stitle = $translate.instant('label.org_edit');

            if(!pop.selOrg.projectId){
                common.showAlert(stitle, '1. 프로젝트를 선택해 주세요.');
                return false;
            }
            if(!pop.selOrg.orgName){
                common.showAlert(stitle, '2. 작업명을 입력해 주세요.');
                return false;
            }
            if (!pop.selOrg.orgQuotaId) {
                common.showAlert(stitle, '3. 작업 쿼터를 선택해 주세요.');
                return false;
            }
            if(!pop.selOrg.managerEmail){
                common.showAlert(stitle, "관리자를 선택해 주세요.");
                return false;
            }

            return true;
        };

        // button Action
        ct.orgBtn = function (action) {
            switch (action) {
                case "update":          //수정
                    orgBtnUpdateNgClick({$scope : $scope, action : action, quotaService : quotaService});
                    break;
                case "delete":          //삭제
                    ct.deleteOrg();
                    break;
                case "deleteCall":      //삭제요청:삭제와 분리 처리
                    ct.deleteOrgCall();
                    break;
                default:
                    console.log(action);
                    break;
            }
        };

        /* [완료] 요청 : 조직 신청 or 조직 수정 */
        pop.apply = function() {
            // 기본정보 validate
            if (!pop.validateOrg()) return;
            if (! $scope.orgPop.validationService.checkFormValidity($scope.orgPop.orgAsideForm)) {
                return;
            }

            $scope.main.loadingMainBody=true;

            var param            = {};
            var orgManager       = {'email':pop.selOrg.managerEmail, 'userId':pop.selOrg.managerId};
            var project          = {'id':pop.selOrg.projectId};
            var quota            = {'id':pop.selOrg.orgQuotaId};
            param['orgManager']  = orgManager;
            param['orgId']       = String(pop.selOrg.orgId);
            param['project']     = project;
            param['quota']       = quota;
            param['description'] = pop.selOrg.description;

            if(!pop.selOrg.orgName)
                param['orgName'] = "";
            else
                param['orgName'] = String(pop.selOrg.orgName);

            var useStartDate      = new Date(pop.selOrg.useStartDate.replace(/\./g,"-")).getTime();
            var useEndDate        = new Date(pop.selOrg.useEndDate.replace(/\./g,"-")).getTime();
            param['useStartDate'] = String(useStartDate);
            param['useEndDate']   = String(useEndDate);

            var applyPromise;

            //수정
            var updates = makeUpdates(param);
            if(Object.keys(updates).length == 0) {
                $scope.main.loadingMainBody=false;
                common.showAlert($translate.instant('label.org_edit'),$translate.instant('message.mi_change_no_item'));
                return;
            }
            param['updates'] = updates;

            param['id']  = pop.selOrg.id;
            applyPromise = orgService.updateOrg(pop.selOrg.id, param);
            applyPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                //if(ct.userAuth=="A" || ct.userAuth=="M") {
                    common.showAlert($translate.instant('label.org_edit'), $translate.instant('message.mi_change_apply'));
                /*}else {
                    common.showAlert($translate.instant('label.org_edit'), $translate.instant('message.mi_change_apply_org_after_apprv'));
                }*/
                common.mdDialogCancel();
                getSetValue();
                $scope.main.syncListAllPortalOrgs();    //작업 전체 조회
            });
            applyPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                common.showAlertError($translate.instant('label.org_edit') + "(" + ct.selOrg.orgId + ")", data);
            });
        };

        /*
        * [조직삭제] 실행
        * */
        ct.deleteOrg = function () {

            if (ct.paramId == null || ct.paramId == "") return;
            var cntIaaS = ct.serverMainData.totalElements?ct.serverMainData.totalElements:0;
            var cntPaaS = ct.apps.content?ct.apps.content.length:0;
            var msg = "";
            if (cntIaaS > 0){
                msg = "IaaS";
            }
            if (cntPaaS > 0){
                if (msg == ""){
                    msg = "PaaS";
                }else{
                    msg += ",PaaS";
                }
            }
            if(msg != ""){
                common.showAlertHtml($translate.instant('label.org_del') + "(" + ct.selOrg.orgId + ")", "아래 시스템에서 사용중 입니다. <br>아래 시스템에서 조직 삭제 후 처리해 주시기 바랍니다.<br>(" + msg + ")");
                return;
            }

            var showConfirm = common.showConfirm($translate.instant('label.del') + "(" + ct.selOrg.id + ")", "작업을 삭제하시겠습니까?");
            showConfirm.then(function () {
                $scope.main.loadingMainBody = true;

                var orgPromise = orgService.deleteOrg(ct.paramId);
                orgPromise.success(function (data) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert($translate.instant('label.org_del') + "(" + ct.selOrg.orgId + ")", $translate.instant('message.mi_deleting_organization'));
                    $scope.main.goToPage('/comm/projects/projectDetail/'+ $scope.main.sltProjectId);
                });
                orgPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 406) {
                        common.showAlertError($translate.instant('label.org_del') + "(" + ct.selOrg.orgId + ")", "삭제 권한이 없습니다.");
                    } else if (status == 403) {
                        common.showAlertErrorHtml($translate.instant('label.org_del') + "(" + ct.selOrg.orgId + ")", "아래 시스템에서 사용중 입니다. <br>아래 시스템에서 삭제 후 처리해 주시기 바랍니다.<br>(" + data.resultMsg + ")");
                    } else {
                        common.showAlertError("", data);
                    }
                });
        });
        };

        /*
        *  [조직삭제] 요청
        *       - 권한에 따라 [조직삭제] 처리
        * */
        ct.deleteOrgCall = function () {
            //기업관리자/(조직관리자 && org.is_created : false)이면 즉시 삭제
            if( ct.isManager || (ct.isThisOrgManager && !ct.selOrg.isCreated) ){
                ct.deleteOrg();
                return;
            }

            if (ct.paramId == null || ct.paramId == "") return;
            var showConfirm = common.showConfirm($translate.instant('label.org_del') + "(" + ct.selOrg.orgId + ")", "조직을 삭제요청 하시겠습니까?");
            showConfirm.then(function () {
                $scope.main.loadingMainBody = true;
                var orgPromise = orgService.deleteOrgstatusCall(ct.paramId);
                orgPromise.success(function (data) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert($translate.instant('label.org_del') + "(" + ct.selOrg.orgId + ")", "조직을 삭제요청 되었습니다.");
                    $scope.main.goToPage("/projects/projectDetail/"+ $scope.main.sltProjectId);
                });
                orgPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 401) {
                        common.showAlertErrorHtml($translate.instant('label.org_del') + "(" + ct.selOrg.orgId + ")", "아래 시스템에서 사용중입니다. <br>아래 시스템에서 조직 삭제 후 처리해 주시기 바랍니다.<br>" + data.resultMsg);
                    } else {
                        common.showAlertError("", data);
                    }
                });
            });
        };

        //등록/수정/상세보기 시 화면 Init 및 조회
        getSetValue();

        /*조직 사용자 목록 조회*/
        ct.getUserList = function () {
            // paging
            ct.pageOptions = {
                currentPage : 1,
                // pageSize : 10,
                pageSize : 100,
                total : 0
            };

            if (!ct.selOrg.id)
                return;

            ct.isThisOrgManager = false; // 현 조직관리자

            var orgPromise = orgService.listOrgUsers(ct.selOrg.id);
            orgPromise.success(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
                angular.forEach(data.items, function(item) {
                    // 조직관리자이고 org.statusCode : done/change_done 일 때 버튼 활성화
                    if (item.email == ct.userEmail && item.isAdmin && item.orgStatusCode.indexOf("done") > -1) {
                        ct.isThisOrgManager = true; // 현 조직관리자
                        return;
                    }
                });

                ct.orgUsers = data.items;
                ct.pageOptions.total = data.counts;

                /*현 조직관리자 여부 확인*/
                getUserList_isThisOrgManager();
            });
            orgPromise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError("조직 사용자 목록 조회", data);
            });
        };

        /*
         * 작업 멤버 [+] 클릭
         * */
        ct.clickBtn = function ($event, btnId) {

            var main = $scope.main;

            ct.searchMembersEmail = '';
            ct.searchMembersMessage = '';
            ct.checkboxAll = false;

            pop.projectUsers   = [];
            pop.selCompanyUser = {};

            /*
             * 사용자 [추가]/[초대] 클릭 시 이벤트 add/invite
             */
            pop.chgEmail = "";
            pop.chgName = "";
            pop.btnId = btnId;

            var dialogOptions = {
                title : $translate.instant("label.job_member_add"),
                formName: "orgUserAddForm",
                templateUrl : _COMM_VIEWS_ + "/org/popOrgUserAddForm.html" + _VersionTail(),
                btnTemplate : '<div class="sideBtmWrap two">' +
                '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="contents.userAdd();" ng-disabled="orgMainAsideQuotaReqForm.$invalid">{{ "label.confirm" | translate }}</button>' +
                '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closeOrgPop();">{{ "label.cancel" | translate }}</button>' +
                '</div>'
            };
            pop.orgUserData = {};
            pop.projectUsers = ct.selOrg.project.users;
            common.showRightDialog($scope, dialogOptions);

            var items  = pop.projectUsers;
            var items2 = ct.orgUsers;

            label1: for (var i = 0, l = items.length; i < l; i++) {
                items[i].email = items[i].user.email;
                items[i].chgName = items[i].user.name;
                items[i].added = false;
                items[i].checked = false;

                label2: for (var i2 = 0, l2 = items2.length; i2 < l2; i2++) {
                    if (items[i].user.email == items2[i2].email) {
                        items[i].added = true;
                        break label2;
                    }
                }

                if (items[i].roleName == 'OWNER') {
                    items[i].added = true;
                }
            }
        };

        ct.checkboxAll = false;
        ct.checkedAll = function($event) {
            var items = pop.projectUsers;

            for (var i = 0, l = items.length; i < l; i++) {
                var item = items[i];

                item.checked = $event.currentTarget.checked;
            }
        };

        /*사용자 삭제*/
        ct.deleteUser = function (delUser) {

            /* 사용자 삭제 */
            if (delUser.isAdmin && delUser.email == ct.selOrg.managerEmail) {
                common.showAlert($translate.instant('label.user_del') + "(" + delUser.orgId + " : " + delUser.email + ")", "프로젝트 책임자는 삭제 불가합니다.");
                return;
            }
            var showConfirm = common.showConfirm($translate.instant('label.user_del') + "(" + delUser.orgId + " : " + delUser.email + ")", $translate.instant('message.mq_delete_user'));
            showConfirm.then(function() {

                $scope.main.loadingMainBody = true;
                var orgPromise = orgService.deleteOrgUser(delUser.id, delUser.email);
                orgPromise.success(function(data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert($translate.instant('label.user_del') + "(" + delUser.orgId + " : " + delUser.email + ")", $translate.instant('message.mi_delete'));
                    /* 조직 사용자 목록 조회 */
                    ct.getUserList();
                });
                orgPromise.error(function(data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 404) {
                        data = $translate.instant('message.mi_dont_register_user');
                    }
                    if (status == 406) {
                        data = $translate.instant('message.mi_wrong_user_company');
                    }
                    common.showAlertError($translate.instant("label.user_del"), data);
                });
            });
        };

        /*
         * 작업 멤버 추가 [확인] 클릭
         * */
        ct.userAdd = function() {

            var sTitle = $translate.instant("label.user_add");
            var items = pop.projectUsers;

            var orgUserRequests = [];

            for (var i = 0, l = items.length; i < l; i++) {
                var item = items[i];

                if (!item.added && !!item.checked) {
                    orgUserRequests.push({
                        email : item.email,
                        name : item.chgName,
                        userRole : item.roleName
                    });
                }
            }

            var param = {
                type : 'add',
                orgUserRequests : orgUserRequests
            };

            $scope.main.loadingMainBody = true;
            var orgPromise = orgService.orgUserAdds(ct.selOrg.id, param);
            orgPromise.success(function(data, status, headers) {

                $scope.main.loadingMainBody = false;

                common.showAlert(sTitle, "사용자 추가 되었습니다.");
                common.mdDialogCancel();

                /* 조직 사용자 목록 조회 */
                ct.getUserList();

                //등록/수정/상세보기 시 화면 Init 및 조회
                getSetValue();
            });
            orgPromise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status == 404) {
                    common.showAlertError(sTitle, $translate.instant('message.mi_dont_register_user'));
                }
                if (status == 406) {
                    common.showAlertError(sTitle, $translate.instant('message.mi_wrong_user_company'));
                }

            });
        };

        function fnProjectNgChange(projectId) {
            if(!projectId) {
                return;
            }

            $scope.main.loadingMainBody = true;
            var param = {};
            param['projectId'] = projectId;
            param['orgId']     = ct.selOrg.id;
            var promise = quotaService.listOrgQuotas(param);
            promise.success(function(data, status, headers) {
                ct.selOrg.orgQuotas = data.items;
                ct.selOrg.orgQuotaId = '';
                for (var i = 0, l = data.items.length; i < l; i++) {
                    if (data.items[i].available == true) {
                        //if (data.items[i].name == 'default') {
                        if (data.items[i].defaultQuota == true) {
                            ct.selOrg.orgQuotaId = data.items[i].id;
                            break;
                        } else {
                            ct.selOrg.orgQuotaId = data.items[i].id;
                        }
                    }
                }
                if (!pop.selOrg.orgQuotaId){
                    common.showAlert('', '작업 쿼터가 없어 작업을 등록할 수 없습니다.');
                }
                $scope.main.loadingMainBody = false;
            });
            promise.error(function(data, status, headers) {
                ct.selOrg.orgQuotas = {};
                $scope.main.loadingMainBody = false;
            });
        }

        ct.projectNgChange = function(projectId) {
            fnProjectNgChange(projectId);
        };

        /*용량처리 관련 함수들*/
        quotaFunctions();

        /*용량처리 관련 함수들*/
        function quotaFunctions() {

            var main = $scope.main;
            var contents = ct;

            contents.listQuotaHistory = {};
            contents.quotaHistory = {};
            contents.listQuotaHistoryNgClickCBox = '';
            contents.listQuotaHistoryNgClick = function() {
                if (!contents.listQuotaHistoryNgClickCBox) {
                    contents.listQuotaHistoryNgClickCBox = 'cToggle-open';
                    /*작업 이력/용량변경 요청 조회*/
                    getListQuotaHistoryNgClick();
                } else {
                    contents.listQuotaHistoryNgClickCBox = '';
                }
            };

            /*용량변경 요청 팝업*/
            contents.asideQuotaReqNgClick = function() {
                contents.quotaHistory  = {};
                contents.quotaHistory.quotaReq = {};
                contents.quotaSelected = {};

                listOrgQuotas();    //작업쿼터 조회

                var dialogOptions = {
                    title : $translate.instant("label.capacity_change_request"),
                    formName: "orgMainAsideQuotaReqForm",
                    controllerAs: "orgQuotaReqPop",
                    templateUrl: _COMM_VIEWS_ + "/org/popOrgMainQuotaReq.html" + _VersionTail(),
                    btnTemplate : '<div class="sideBtmWrap two">' +
                    '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="contents.asideQuotaReqRequestQuotaNgClick();" ng-disabled="orgMainAsideQuotaReqForm.$invalid">{{ "label.save" | translate }}</button>' +
                    '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closeOrgPop();">{{ "label.cancel" | translate }}</button>' +
                    '</div>'
                };
                common.showRightDialog($scope, dialogOptions);
            };

            /*용량변경 요청 : 저장*/
            contents.asideQuotaReqRequestQuotaNgClick = function() {
                quotaReqRequestQuotaNgClick();
            };

            /*용량 변경 처리 팝업*/
            contents.asideQuotaResNgClick = function(param) {
                listOrgQuotas();    //작업쿼터 조회

                var dialogOptions = {
                    title: $translate.instant("label.capacity_change_treat"),
                    formName: "orgMainAsideQuotaResForm",
                    controllerAs: "orgQuotaResPop",
                    templateUrl: _COMM_VIEWS_ + "/org/popOrgMainQuotaRes.html" + _VersionTail(),
                    btnTemplate: '<div class="sideBtmWrap two">' +
                    '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="contents.asideQuotaReqUpdateQuotaNgClick();" ng-disabled="orgMainAsideQuotaResForm.$invalid">{{ "label.save" | translate }}</button>' +
                    '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closeOrgPop();">{{ "label.cancel" | translate }}</button>' +
                    '</div>'
                };
                common.showRightDialog($scope, dialogOptions);

                contents.quotaHistory = {};
                contents.quotaHistory.id = param.quotaHistory.id;
                contents.quotaHistory.org = {};
                contents.quotaHistory.org.id = param.quotaHistory.org.id;
                contents.quotaHistory.quotaReq = {};
                contents.quotaHistory.quotaReq.name = param.quotaHistory.quotaReq.name;
                contents.quotaHistory.messageReq = param.quotaHistory.messageReq;
                contents.quotaHistory.quotaTo = {};
                contents.quotaHistory.quotaTo.id = param.quotaHistory.quotaReq.id;
                contents.quotaHistory.status = '';
            };

            /*용량 변경 처리 : [저장]*/
            contents.asideQuotaReqUpdateQuotaNgClick = function() {
                quotaReqUpdateQuotaNgClick();
            };

            /*변경 요청 용량 변경 이벤트*/
            contents.quotaReqDescription_ngChange = function() {
                //contents.quotaSelected = $scope.main.quotaSelected(contents.quotaHistory.quotaReq.id, contents.selOrg.orgQuotas.items);
                for (var i = 0, l = contents.selOrg.orgQuotas.items.length; i < l; i++) {
                    var item = contents.selOrg.orgQuotas.items[i];

                    if (item.id == contents.quotaHistory.quotaReq.id) {
                        contents.quotaSelected = item;
                        break;
                    }
                }
            };

            /*변경 요청 용량 변경 이벤트*/
            contents.quotaToDescription_ngChange = function() {
                if (!contents.selOrg) {
                    return;
                }
                if (!contents.selOrg.orgQuotas) {
                    return;
                }
                if (!contents.selOrg.orgQuotas.items) {
                    return;
                }

                for (var i = 0, l = contents.selOrg.orgQuotas.items.length; i < l; i++) {
                    var item = contents.selOrg.orgQuotas.items[i];

                    if (item.id == contents.quotaHistory.quotaTo.id) {
                        contents.quotaSelected = item;
                        break;
                    }
                }
            };
        }

        /*작업 이력/용량변경 요청 조회*/
        function getListQuotaHistoryNgClick() {
            var params = {
                type : 'ORG', // PROJECT, ORG
                id : ct.selOrg.id
            };

            $scope.main.loadingMainBody = true;
            var promise = quotaService.listQuotaHistory(params);
            promise.success(function(data, status, headers) {
                ct.listQuotaHistory = data;

                $scope.main.loadingMainBody = false;
            });
            promise.error(function(data, status, headers) {
                ct.listQuotaHistory = {};
                $scope.main.loadingMainBody = false;
            });
        }

        /*작업쿼터 조회*/
        function listOrgQuotas() {

            $scope.main.loadingMainBody = true;
            var params       = {};
            params.projectId = ct.selOrg.project.id;
            params.orgId     = ct.selOrg.id;

            var promise = quotaService.listOrgQuotas(params);
            promise.success(function(data, status, headers) {
                ct.selOrg.orgQuotas = data;
                $scope.main.loadingMainBody = false;
            });
            promise.error(function(data, status, headers) {
                ct.selOrg.orgQuotas = {};
                $scope.main.loadingMainBody = false;
            });
        }

        /*용량변경 요청 : 저장*/
        function quotaReqRequestQuotaNgClick() {

            if (! $scope.orgQuotaReqPop.validationService.checkFormValidity($scope.orgQuotaReqPop.orgMainAsideQuotaReqForm)) {
                return;
            }
            if (!ct.quotaHistory.quotaReq.id) {
                common.showAlert($translate.instant("label.job_register"), '1. 변경 요청할 용량을 선택해주세요.');
                return;
            } else if (!ct.quotaHistory.messageReq) {
                common.showAlert($translate.instant("label.job_register"), '2. 변경 요청 사유를 입력해 주세요.');
                return;
            }

            $scope.main.loadingMainBody = true;

            var params = {};
            params.type = 'ORG';
            params.org = {};
            params.org.id = ct.selOrg.id;
            params.quotaReq = {};
            params.quotaReq.id = ct.quotaHistory.quotaReq.id;
            params.messageReq = ct.quotaHistory.messageReq;

            var promise = quotaService.requestQuota(params);
            promise.success(function(data, status, headers) {

                common.mdDialogCancel();

                ct.listQuotaHistoryNgClickCBox = '';
                ct.listQuotaHistoryNgClick();
            });
            promise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        /*용량 변경 처리 : [저장]*/
        function quotaReqUpdateQuotaNgClick() {

            if (! $scope.orgQuotaResPop.validationService.checkFormValidity($scope.orgQuotaResPop.orgMainAsideQuotaResForm)) {
                return;
            }
            if (!ct.quotaHistory.status) {
                common.showAlert('용량 변경 처리', '1. 승인 여부를 선택해주세요.');
                return;
            } else if (!ct.quotaHistory.quotaTo) {
                common.showAlert('용량 변경 처리', '2. 변경할 용량을 선택해주세요.');
                return;
            } else if (!ct.quotaHistory.messageRes) {
                common.showAlert('용량 변경 처리', '3. 요청 처리 사유를 입력해 주세요.');
                return;
            }

            $scope.main.loadingMainBody = true;

            var params = {};
            params.id = ct.quotaHistory.id;
            params.type = 'ORG';
            params.org = {};
            params.org.id = ct.quotaHistory.org.id;
            params.quotaTo = {};
            params.quotaTo.id = ct.quotaHistory.quotaTo.id;
            params.status = ct.quotaHistory.status;
            params.messageRes = ct.quotaHistory.messageRes;

            var promise = quotaService.updateQuota(params);
            promise.success(function(data, status, headers) {

                common.mdDialogCancel();

                ct.listQuotaHistoryNgClickCBox = '';
                ct.listQuotaHistoryNgClick();
                //ct.orgInit();
            });
            promise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        /*현 조직관리자 여부 확인*/
        function getUserList_isThisOrgManager() {

            if (ct.userAuth == 'A' || ct.userAuth == 'M') {
                // 버튼 show/hide : 요청취소/조직수정/조직삭제
                ct.isThisOrgManager = true; // 현 조직관리자
                return;
            }

            // ct.selOrg.project.users;
            if (ct.paramMode == 'R') {
                var items = ct.orgUsers;

                for (var i = 0, l = items.length; i < l; i++) {
                    var item = items[i];
                    if (item.auth == 'ADMIN' && item.email == ct.userEmail) {
                        // 버튼 show/hide : 요청취소/조직수정/조직삭제
                        ct.isThisOrgManager = true; // 현 조직관리자
                    }
                }
            }
        }

        /*[수정] 이벤트*/
        function orgBtnUpdateNgClick(param) {

            var $scope = param.$scope;
            var action = param.action;
            var quotaService = param.quotaService;

            var main = $scope.main;
            var ct = $scope.contents;

            ct.selOrg.projectId = ct.selOrg.project.id;

            // 수정모드일 때
            if (ct.selOrg.useStartDate.time)
                ct.selOrg.useStartDate = moment(ct.selOrg.useStartDate.time).format("YYYY-MM-DD");
            if (ct.selOrg.useEndDate.time)
                ct.selOrg.useEndDate = moment(ct.selOrg.useEndDate.time).format("YYYY-MM-DD");

            // 조직 신청 변경 데이터 셋팅
            ct.currentInfo = {};
            ct.currentInfo['id']           = ct.selOrg.id;
            ct.currentInfo['orgId']        = ct.selOrg.orgId;
            ct.currentInfo['orgName']      = ct.selOrg.orgName;
            ct.currentInfo['managerEmail'] = ct.selOrg.managerEmail;
            var useStartDate = new Date(ct.selOrg.useStartDate.replace(/\./g, "-")).getTime();
            var useEndDate   = new Date(ct.selOrg.useEndDate.replace(/\./g, "-")).getTime();
            ct.currentInfo['useStartDate'] = String(useStartDate);
            ct.currentInfo['useEndDate']   = String(useEndDate);

            $scope.main.loadingMainBody = true;
            var promise = quotaService.listOrgQuotas({
                projectId : ct.selOrg.project.id,
                orgId : ct.selOrg.id
            });
            promise.success(function(data, status, headers) {
                ct.selOrg.orgQuotas = data;
                ct.selOrg.orgQuotaId = ct.selOrg.quotaId.id;

                pop.selOrg = angular.copy(ct.selOrg);
                pop.selOrg.orgQuotas = angular.copy(ct.selOrg.orgQuotas.items);
                $scope.main.loadingMainBody = false;

                //작업 수정 팝업 오픈
                var dialogOptions = {
                    title : $translate.instant("label.job_edit"),
                    formName: "orgAsideForm",
                    controllerAs: "orgPop",
                    templateUrl: _COMM_VIEWS_ + "/org/popOrgForm.html" + _VersionTail(),
                    btnTemplate : '<div class="sideBtmWrap two">' +
                    '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="pop.apply();" ng-disabled="orgAsideForm.$invalid">{{ "label.edit" | translate }}</button>' +
                    '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closeOrgPop();">{{ "label.cancel" | translate }}</button>' +
                    '</div>'
                };
                common.showRightDialog($scope, dialogOptions);

            });
            promise.error(function(data, status, headers) {
                ct.selOrg.orgQuotas = {};
                pop.selOrg.orgQuotas = {};
                $scope.main.loadingMainBody = false;
            });
        }

        /*수정 팝업 닫기*/
        ct.closeOrgPop = function(){
            common.mdDialogCancel();
        };

        /*
        * [재실행] : 작업 이력/용량변경 요청 > 시스템연계 실패 시
        *       -1. 조직 재생성
        *       -2. 조직 쿼터 재실행
        * */
        ct.systemLinkRetry = function(quotaHistory) {

            var quotaHistoryId = quotaHistory.id;
            //1. 조직 재생성
            if (quotaHistory.messageReq == "SYSTEM INSERT"){
                quotaHistoryId = null;
            }
            var sTitle = $translate.instant('label.org_rerun') + "(" + quotaHistory.org.orgName + ")";
            var showConfirm = common.showConfirm(sTitle, "재실행 하시겠습니까?");
            showConfirm.then(function () {
                $scope.main.loadingMainBody = true;
                var orgPromise = orgService.reRunSystemLink(quotaHistory.org.id, quotaHistoryId);
                orgPromise.success(function (data) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert(sTitle, $translate.instant('message.mi_ctrl_success'));

                    if (!quotaHistoryId){
                        ct.isSystemLinkRetry   = true;  //[재실행] 클릭 여부
                        getSetValue();
                    } else {
                        //작업 이력/용량변경 요청 조회
                        getListQuotaHistoryNgClick();
                    }
                });
                orgPromise.error(function (data, status, headers) {
                    ct.isSystemLinkRetry   = false;  //[재실행] 클릭 여부
                    $scope.main.loadingMainBody = false;
                    if (status == 406) {
                        common.showAlertError(sTitle, "재생성은 오류건만 진행합니다.");
                    } else if (status == 401) {
                        common.showAlertError(sTitle, "기업관리자가 아닙니다.");
                    } else {
                        common.showAlertError(sTitle, data.message);
                    }
                });
            });
        };

        /*paas app 조회 시작*/
        ct.getOrganizationByName = function () {
            var orgPromise = applicationService.getOrganizationByName($scope.main.sltPortalOrg.orgId);
            orgPromise.success(function (data) {
                if (data.guid != null && data.name != null) {
                    ct.getSpaceByName(data.guid, data.name);
                }else{
                    $scope.main.loadingMainBody = false;
                }
            });
            orgPromise.error(function (data) {
                $timeout.cancel($scope.main.reloadCommTimmer['orgDetail']);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.getSpaceByName = function (orgGuid, orgName) {
            var spacePromise = applicationService.getSpaceByName(orgGuid, orgName);
            spacePromise.success(function (data) {
                ct.sltOrganizationGuid = data.organizationGuid;
                ct.sltSpaceGuid = data.guid;

                ct.listApps();
            });
            spacePromise.error(function (data) {
                ct.sltOrganizationGuid = "";
                ct.sltSpaceGuid = "";
                ct.listApps();
            });
        };

        ct.listApps = function (currentPage) {
            //$scope.main.loadingMainBody = true;
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            var conditions = [];
            if(ct.sltOrganizationGuid) {
                conditions.push("organization_guid:" + ct.sltOrganizationGuid);
            }
            if(ct.sltSpaceGuid) {
                conditions.push("space_guid:" + ct.sltSpaceGuid);
            }
            if(ct.sltAppNames && ct.sltAppNames.length > 0) {
                conditions.push("name:" + ct.sltAppNames.join(","));
            }

            var appPromise = applicationService.listApps(ct.pageOptions.pageSize, ct.pageOptions.currentPage, conditions);
            appPromise.success(function (data) {
                ct.bPaaS = true;    //paas정보 조회 여부
                if (ct.bIaaS) $scope.main.loadingMainBody = false;
                ct.apps = data;

                $scope.main.loadingMainBody = false;
                ct.pageOptions.total = data.totalElements;
            });
            appPromise.error(function (data) {
                ct.apps = [];
                $timeout.cancel($scope.main.reloadCommTimmer['orgDetail']);
                $scope.main.loadingMainBody = false;
            });
        };
        /*paas app 조회 종료*/

        /*iaas 인스턴스 조회 시작*/

        // 서버메인 tenant list 함수
        // 공통 레프트 메뉴의 userTenantId
        if (angular.isObject($scope.main.userTenant) && $scope.main.userTenantId) {
            ct.data.tenantId   = $scope.main.userTenantId;
            ct.data.tenantName = $scope.main.userTenant.korName;
        }

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId   = status.tenantId;
            ct.data.tenantName = status.korName;
        });

        ct.fnGetServerMainList = function () {
            //$scope.main.loadingMainBody = true;

            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue,
                queryType : 'list'
            };

            if (!ct.data.tenantId) {
                $scope.main.loadingMainBody = false;
                return;
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data) {
                    //ct.serverMainList = data.content.instances;
                    ct.serverMainData = data;
                    ct.fnGetUsedResource();
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $timeout.cancel($scope.main.reloadCommTimmer['orgDetail']);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fnGetUsedResource = function() {
            //$scope.main.loadingMainBody = true;
            var params = {
                tenantId : ct.data.tenantId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.tenantResource = data.content[0];

                ct.bIaaS = true;    //iaas정보 조회 여부
                if (ct.bPaaS) $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $timeout.cancel($scope.main.reloadCommTimmer['orgDetail']);
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };
        /*iaas 인스턴스 조회 종료*/

        /*쿼터 탭 클릭 시 IaaS/PaaS 조회 후 세팅*/
        ct.searchSystemLinkQuota = function(){
            //quota.plan : 공통에서 조회
            ct.planQuotaIaaS       = {};    //cpu/memory/disk/objectStorage/ip
            ct.planQuotaPaaS       = {};    //memory/service/router/app
            //quota.used : iaas, paas에서 조회
            ct.usedQuotaIaaS       = {};
            ct.usedQuotaPaaS       = {};

            ct.usedQuotaIaaS.cpuRatio            = 0;
            ct.usedQuotaIaaS.memoryRatio         = 0;
            ct.usedQuotaIaaS.diskRatio           = 0;
            ct.usedQuotaIaaS.objectStorageRatio  = 0;
            ct.usedQuotaIaaS.ipRatio             = 0;
            ct.usedQuotaPaaS.memoryRatio  = 0;
            ct.usedQuotaPaaS.serviceRatio = 0;
            ct.usedQuotaPaaS.routerRatio  = 0;
            ct.usedQuotaPaaS.appRatio     = 0;

            if (!ct.selOrg) return;
            //quota.plan : 공통에서 조회
            if (!!ct.selOrg.quotaId && !!ct.selOrg.quotaId.quotaIaas){
                ct.planQuotaIaaS.cpu           = ct.selOrg.quotaId.quotaIaas.computingVcpus;
                ct.planQuotaIaaS.memory        = ct.selOrg.quotaId.quotaIaas.computingRam;
                ct.planQuotaIaaS.disk          = ct.selOrg.quotaId.quotaIaas.computingHdd + ct.selOrg.quotaId.quotaIaas.storageExternalHdd;
                ct.planQuotaIaaS.objectStorage = ct.selOrg.quotaId.quotaIaas.storageObjectStorage;
                ct.planQuotaIaaS.ip            = ct.selOrg.quotaId.quotaIaas.networkFloatingIp;

                ct.usedQuotaIaaS.cpu           = 0;
                ct.usedQuotaIaaS.memory        = 0;
                ct.usedQuotaIaaS.disk          = 0;
                ct.usedQuotaIaaS.objectStorage = 0;
                ct.usedQuotaIaaS.ip            = 0;
            }
            if (!!ct.selOrg.quotaId && !!ct.selOrg.quotaId.quotaPaas){
                ct.planQuotaPaaS.memory   = ct.selOrg.quotaId.quotaPaas.totalMemory;
                ct.planQuotaPaaS.service  = ct.selOrg.quotaId.quotaPaas.serviceInstances;
                ct.planQuotaPaaS.router   = ct.selOrg.quotaId.quotaPaas.routes;
                ct.planQuotaPaaS.app      = ct.selOrg.quotaId.quotaPaas.appInstances;

                ct.usedQuotaPaaS.memory   = 0;
                ct.usedQuotaPaaS.service  = 0;
                ct.usedQuotaPaaS.router   = 0;
                ct.usedQuotaPaaS.app      = 0;
            }

            //iaas 조직정보 조회 : 서버 가상화 서비스 조회 시 미리 조회 됨
            if (ct.tenantResource && ct.tenantResource.usedResource && ct.tenantResource.maxResource){

                ct.planQuotaIaaS.cpu           = ct.tenantResource.maxResource.cores;
                ct.planQuotaIaaS.memory        = Math.round(ct.tenantResource.maxResource.ramSize/1024);
                ct.planQuotaIaaS.disk          = ct.tenantResource.maxResource.instanceDiskGigabytes + ct.tenantResource.maxResource.volumeGigabytes;
                ct.planQuotaIaaS.objectStorage = ct.tenantResource.maxResource.objectStorageGigaByte;
                ct.planQuotaIaaS.ip            = ct.tenantResource.maxResource.floatingIps;

                ct.usedQuotaIaaS.cpu           = ct.tenantResource.usedResource.cores;
                ct.usedQuotaIaaS.memory        = Math.round(ct.tenantResource.usedResource.ramSize/1024);
                ct.usedQuotaIaaS.disk          = ct.tenantResource.usedResource.instanceDiskGigabytes + ct.tenantResource.usedResource.volumeGigabytes;
                ct.usedQuotaIaaS.objectStorage = ct.tenantResource.usedResource.objectStorageGigaByte;
                ct.usedQuotaIaaS.ip            = ct.tenantResource.usedResource.floatingIps;

                if (ct.usedQuotaIaaS.cpu)           ct.usedQuotaIaaS.cpuRatio               = Math.round(ct.usedQuotaIaaS.cpu/ct.planQuotaIaaS.cpu * 100);
                if (ct.usedQuotaIaaS.memory)        ct.usedQuotaIaaS.memoryRatio            = Math.round(ct.usedQuotaIaaS.memory/ct.planQuotaIaaS.memory * 100);
                if (ct.usedQuotaIaaS.disk)          ct.usedQuotaIaaS.diskRatio              = Math.round(ct.usedQuotaIaaS.disk/ct.planQuotaIaaS.disk * 100);
                if (ct.usedQuotaIaaS.objectStorage) ct.usedQuotaIaaS.objectStorageRatio     = Math.round(ct.usedQuotaIaaS.objectStorage/ct.planQuotaIaaS.objectStorage * 100);
                if (ct.usedQuotaIaaS.ip)            ct.usedQuotaIaaS.ipRatio                = Math.round(ct.usedQuotaIaaS.ip/ct.planQuotaIaaS.ip * 100);
            }

            //paas 조직정보 조회
            ct.searchSystemLinkQuotaPaaS(ct.selOrg.orgId);
        };

        //paas 조직정보 조회
        ct.searchSystemLinkQuotaPaaS = function(orgId){

            //paas 조직정보 조회
            var orgPromise = orgService.getOrganizationByName(orgId, 2);
            orgPromise.success(function (data) {

                if (data && data.quotaDefinition && data.spaces && data.spaces.length > 0) {
                    ct.planQuotaPaaS.memory  = Math.round(data.quotaDefinition.memoryLimit/1024);
                    ct.planQuotaPaaS.service = data.quotaDefinition.totalServices;
                    ct.planQuotaPaaS.router  = data.quotaDefinition.totalRoutes;
                    ct.planQuotaPaaS.app     = data.quotaDefinition.appInstanceLimit;

                    ct.usedQuotaPaaS.memory  = Math.round(data.spaces[0].memoryUsage/1024);
                    ct.usedQuotaPaaS.service = data.spaces[0].servicesUsage;
                    ct.usedQuotaPaaS.router  = data.spaces[0].routesUsage;
                    ct.usedQuotaPaaS.app     = data.spaces[0].appInstancesUsage;

                    if (ct.planQuotaPaaS.memory)  ct.usedQuotaPaaS.memoryRatio  = Math.round(ct.usedQuotaPaaS.memory/ct.planQuotaPaaS.memory * 100);
                    if (ct.planQuotaPaaS.service) ct.usedQuotaPaaS.serviceRatio = Math.round(ct.usedQuotaPaaS.service/ct.planQuotaPaaS.service * 100);
                    if (ct.planQuotaPaaS.router)  ct.usedQuotaPaaS.routerRatio  = Math.round(ct.usedQuotaPaaS.router/ct.planQuotaPaaS.router * 100);
                    if (ct.planQuotaPaaS.app)     ct.usedQuotaPaaS.appRatio     = Math.round(ct.usedQuotaPaaS.app/ct.planQuotaPaaS.app * 100);
                }

            });
            orgPromise.error(function (data, status, headers) {
                common.showAlertError("조직 조회", data.message);
            });

        };

        /*작업목록 조회*/
        ct.listJobsLoad = "no";
        ct.listJobs = function () {
            ct.jobs = [];
            ct.jobItems = [];
            var jobsPromise = orgService.getMyOrgList("", "");
            jobsPromise.success(function(data, status, headers) {
                if (data && data.items) {
                    ct.jobItems = data.items;
                    if (ct.myJobsLoad == "success") {
                        ct.listJobsSetting();
                    }
                }
                ct.listJobsLoad = "success";
                $scope.main.loadingMainBody = false;
            });
            jobsPromise.error(function(data, status, headers) {
                ct.listJobsLoad = "error";
                $scope.main.loadingMainBody = false;
            });
        };

        ct.jobItemSetShowHide = function (bHide) {
            angular.forEach(ct.jobs, function (item, key) {
                if (item.id == ct.selOrg.id){
                    item.hide = bHide;
                }
            });
            ct.saveMyJobSetting();
            ct.isDashboardHide     = bHide;   //dashboard에서의 숨김 여부
        };

        ct.saveMyJobSetting = function () {
            var myJobs            = [];
            for (var i=0; i<ct.jobs.length; i++) {
                var myJob         = {};
                myJob.id          = ct.jobs[i].id;
                myJob.hide        = ct.jobs[i].hide;
                myJob.bgColorType = ct.jobs[i].bgColorType;
                myJob.bgImage     = ct.jobs[i].bgImage;
                myJobs.push(myJob);
            }
            $scope.main.loadingMainBody = true;
            var userSettingPromise = userSettingService.saveUserSetting(CONSTANTS.userSettingKeys.myJobsKey, myJobs);
            userSettingPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
            userSettingPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        /*작업 목록 : 배경색 등 세팅*/
        ct.listJobsSetting = function () {
            ct.jobs = [];
            var isMyJobArr = [];
            if (angular.isArray(ct.myJobs)) {
                for (var i=0; i<ct.myJobs.length; i++) {
                    var job = common.objectsFindCopyByField(ct.jobItems, "id", ct.myJobs[i].id);
                    if (job && job.id) {
                        job.sortKey     = i;
                        job.hide        = ct.myJobs[i].hide;
                        job.bgColorType = ct.myJobs[i].bgColorType;
                        job.bgImage     = ct.myJobs[i].bgImage;
                        isMyJobArr.push(job.id);
                        ct.jobs.push(job);
                    }
                }
            } else {
                ct.myJobs = [];
            }
            for (var i=0; i<ct.jobItems.length; i++) {
                //ct.totalJobCount += ct.jobItems[i].orgCount;
                if (isMyJobArr.indexOf(ct.jobItems[i].id) == -1) {
                    var job = angular.copy(ct.jobItems[i]);
                    var myJob = {};
                    myJob.id = job.id;
                    myJob.hide = false;
                    if ((i+1)%4 == 0) {
                        myJob.bgColorType = 'color-no';
                        myJob.bgImage = 'images/im_sample_pic.jpg';
                    } else {
                        myJob.bgColorType = "color-type"+(i+1)%4;
                        myJob.bgImage = "";
                    }
                    job.hide        = myJob.hide;
                    job.bgColorType = myJob.bgColorType;
                    job.bgImage     = myJob.bgImage;
                    ct.jobs.push(job);
                    ct.myJobs.push(myJob);
                }
            }
            var thisJob = common.objectsFindCopyByField(ct.jobs, "id", ct.selOrg.id);
            if (thisJob && thisJob.hide) {
                ct.isDashboardHide = thisJob.hide;    //dashboard에서의 숨김 여부
            }
            ct.jobItems = [];
        };

        ct.myJobsLoad = "no";
        ct.getMyJobs = function () {
            var userSettingPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.myJobsKey);
            userSettingPromise.success(function (data, status, headers) {
                ct.myJobs = [];
                data = userSettingService.userSettingParse(data);
                if (data && angular.isArray(data.contents)) {
                    ct.myJobs = data.contents;
                }
                if (ct.listJobsLoad == "success") {
                    ct.listJobsSetting();
                }
                ct.myJobsLoad = "success";
            });
            userSettingPromise.error(function (data, status, headers) {
                if (!ct.myJobs) ct.myJobs = [];
                ct.myJobsLoad = "error";
            });
        };
    })
;
