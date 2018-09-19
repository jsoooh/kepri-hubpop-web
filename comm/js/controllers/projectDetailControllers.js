'use strict';

angular.module('portal.controllers')
    .controller('commProjectDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, common, cache, projectService, CONSTANTS, SITEMAP, quotaService, user, orgService, userSettingService) {
        _DebugConsoleLog('projectDetailControllers.js : projectDetailCtrl Start, path : ' + $location.path(), 1);

        var ct = this;

        // 권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자
        ct.userAuth = common.getUserAuth();
        ct.user = common.getUser();

        ct.project = {};
        ct.projectBak = {};

        ct.mode = 'R'; // C, R, U

        ct.CONSTANTS = CONSTANTS;
        ct.SITEMAP   = SITEMAP;

        ct.isThisProjectManager  = false; // 현 프로젝트관리자 + 프로젝트 책임자
        ct.ngDisabled            = false;
        ct.isExistRequest        = false; //용량 변경요청 상태의 건이 있는지 여부
        ct.isDashboardHide       = null;   //dashboard에서의 숨김 여부

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        //작업 추가에서 쓰일 객체 시작
        pop.selOrg = {};
        pop.selOrg.orgQuotas = {};   //작업 쿼터
        //작업 추가에서 쓰일 객체 끝
        pop.project = {};           //수정팝업 시 사용
        pop.projectQuotas = [];     //수정팝업 시 사용

        pop.parentForm = "projectDtl";  //작업등록 오픈 form명

        /*project 상세조회*/
        ct.getProject = function () {
            $scope.main.loadingMainBody = true;

            ct.mode = 'R'; // C, R, U

            ct.project.id = $stateParams.projectId;
            if (!ct.project.id) return;
            var promise = projectService.getProject(ct.project.id);
            promise.success(function (data, status, headers) {

                var isIng = false;
                for (var i=0; i<data.orgs.length; i++) {
                    //상태코드가 중지중/삭제중이 있는 경우
                    if (data.orgs[i].statusCode.indexOf("ing") > -1) {
                        isIng = true;
                        break;
                    }
                }
                if (isIng) {
                    $scope.main.reloadCommTimmer['projectDetail'] = $timeout(function () {
                        ct.getProject();
                    }, 3000)
                } else {
                    ct.project    = data;
                    ct.projectBak = angular.copy(ct.project);

                    $timeout.cancel($scope.main.reloadCommTimmer['projectDetail']);
                    $scope.main.syncListAllPortalOrgs();  //작업 전체 조회

                    //프로젝트 상세에 따라 공통 현프로젝트 변경
                    $scope.main.setProject(ct.project);

                    /*프로젝트 책임자/관리자 여부*/
                    if (ct.project.owner.email == ct.user.email) {
                        ct.isThisProjectManager = true; // 현 프로젝트관리자
                    }

                    if (ct.userAuth == 'O' || ct.userAuth == 'U') {
                        var items = ct.project.users;
                        for (var i = 0, l = items.length; i < l; i++) {
                            var item = items[i];
                            if (item.roleName == 'ADMIN') {
                                ct.ngDisabled = true;
                                break;
                            }
                        }
                    }

                    listProjectOrgs();

                    if (ct.project.useStartDate) {
                        ct.project.useStartDate = moment(ct.project.useStartDate.time).format('YYYY-MM-DD');
                    }
                    if (ct.project.useEndDate) {
                        ct.project.useEndDate = moment(ct.project.useEndDate.time).format('YYYY-MM-DD');
                    }

                    ct.project.useRemainTimeMs2 = Math.round(data.useRemainTimeMs / (1000 * 60 * 60 * 24));

                    //대시보드에서 감추기 시 보여주도록 하기 위한 조회.
                    ct.listProjects();
                    ct.getMyProjects();

                    $scope.main.loadingMainBody = false;
                }
            });
            promise.error(function (data, status, headers) {
                $timeout.cancel($scope.main.reloadCommTimmer['projectDetail']);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.btn = {};
        ct.btn.isJobRegistration = false; // 작업 등록 버튼 권한
        ct.btn.del = function (user) {
            deleteProjectUser(user);
        };
        /*프로젝트 수정*/
        ct.btn.updateProject = function () {
            updateProject();
        };
        /*프로젝트 수정 실제 action*/
        ct.btn.updateProject_edit = function () {
            updateProjectAction();
        };
        ct.popCancel = function () {
            ct.mode = 'R'; // C, R, U
            common.mdDialogCancel();
        };

        /*프로젝트 삭제*/
        ct.btn.deleteProject = function () {

            var title = $translate.instant('label.project_del');
            var textContent = ct.project.name + ' ' + $translate.instant('message.mq_delete');
            var showConfirm = common.showConfirm(title, textContent);
            showConfirm.then(function () {

                $scope.main.loadingMainBody = true;
                var params = {
                    id: ct.project.id
                };

                var promise = projectService.deleteProject(params);
                promise.success(function (data, status, headers) {
                    $scope.main.syncListAllProjects();	//프로젝트 전체 조회
                    $scope.main.loadingMainBody = false;
                    $location.path('/comm/projects');
                });
                promise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 406) {    //project.org 건수가 있을 때 에러
                        common.showAlertError($translate.instant('label.project_del'), $translate.instant('message.mi_cant_delete_exist_org_in_project'));
                    } else {
                        common.showAlertError($translate.instant('label.project_del'), $translate.instant('message.mi_error'));
                    }
                });

            });
        };

        ct.btn.updateUser = function (item) {

            var cnt = 0;
            var items = ct.project.users;
            for (var i = 0, l = items.length; i < l; i++) {
                var item2 = items[i];
                if (item2.roleName == 'ADMIN') {
                    cnt++;
                }
            }
            if (cnt > 1) {
                var title = '';
                var textContent = '프로젝트 관리자는 한 명만 가능합니다.';
                common.showAlert(title, textContent);
                return;
            }

            $scope.main.loadingMainBody = true;

            var params = {
                projectId: ct.project.id,
                id: item.id,
                role: item.roleName
            };

            var promise = projectService.updateUser(params);

            promise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;

                ct.getProject();
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;

                var title = '';
                var textContent = $translate.instant('message.mi_error');
                common.showAlert(title, textContent);
            });
        };

        // 작업 등록
        ct.btn.orgForm = function (param) {

            var contents = ct;

            pop.Init();
            pop.projectNgChange(pop.selOrg.projectId);

            //작업등록 팝업 오픈
            var dialogOptions = {
                title: $translate.instant("label.job_register"),
                formName: "orgAsideForm",
                controllerAs: "orgPop",
                templateUrl: _COMM_VIEWS_ + "/org/popOrgForm.html" + _VersionTail(),
                btnTemplate: '<div class="sideBtmWrap two">' +
                '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="pop.apply();" ng-disabled="orgAsideForm.$invalid">{{ "label.save" | translate }}</button>' +
                '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closePop();">{{ "label.cancel" | translate }}</button>' +
                '</div>'
            };
            pop.selOrg.isUsePublicIp = true;
            common.showRightDialog($scope, dialogOptions);

        };

        ct.pop = {
            pageOptions: {
                currentPage: 1,
                pageSize: 5,
                total: 0
                // sort : 'email,asc'
            },
            listPageUser: [],
            projectUsers: [],
            checkboxAll: false
        };

        ct.pop.memberAdd = function (currentPage) {

            //프로젝트 멤버 등록 팝업 오픈
            var dialogOptions = {
                title: $translate.instant('label.project_member_add'),
                formName: "projectUserAddForm",
                templateUrl: _COMM_VIEWS_ + "/project/popProjectUserAddForm.html" + _VersionTail(),
                btnTemplate: '<div class="sideBtmWrap two">' +
                '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="contents.pop.confirm();" ng-disabled="orgAsideForm.$invalid">{{ "label.confirm" | translate }}</button>' +
                '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closePop();">{{ "label.cancel" | translate }}</button>' +
                '</div>'
            };
            common.showRightDialog($scope, dialogOptions);

            var ngDisabled = false;
            var items = ct.project.users;
            for (var i = 0, l = items.length; i < l; i++) {
                var item = items[i];
                if (item.roleName == 'ADMIN') {
                    ngDisabled = true;
                    break;
                }
            }

            $scope.main.loadingMainBody = true;

            if (!currentPage) {
                currentPage = 1;
                ct.pop.pageOptions.total = 0;

                ct.pop.email = '';
            }

            ct.pop.listPageUser = [];
            ct.pop.checkboxAll = false;

            ct.pop.pageOptions.currentPage = currentPage;
            ct.pop.pageOptions.pageSize = 15;

            var params = {
                token: ct.user.token,
                page: ct.pop.pageOptions.currentPage - 1,
                size: ct.pop.pageOptions.pageSize,
                sort: ct.pop.pageOptions.sort,
                name: ct.pop.email,
                emails: getMemberAddEmails(ct)
            };

            var promise = user.listPageUser(params);
            promise.success(function (data, status, headers) {
                ct.pop.listPageUser = data.content;
                ct.pop.pageOptions.total = data.totalElements;

                for (var i = 0, l = data.content.length; i < l; i++) {
                    data.content[i].checked = false;
                    data.content[i].roleName = 'USER';
                    data.content[i].ngDisabled = ngDisabled;
                }

                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.pop.confirm = function () {
            ct.pop.projectUsers = [];

            var cnt = 0;

            for (var i = 0, l = ct.pop.listPageUser.length; i < l; i++) {
                var item = ct.pop.listPageUser[i];

                if (!!item.checked) {
                    ct.pop.projectUsers.push({
                        user: {
                            email: item.email
                        },
                        roleName: item.roleName
                    });

                    if (item.roleName == 'ADMIN') {
                        cnt++;
                    }
                }
            }

            if (cnt > 1) {
                var title = '';
                var textContent = '프로젝트 관리자는 한 명만 가능합니다.';
                common.showAlert(title, textContent);
                return;
            }

            if (!ct.pop.projectUsers.length) {
                var title = '';
                var textContent = $translate.instant('message.mi_dont_exist_checked');
                common.showAlert(title, textContent);
                return;
            }

            $scope.main.loadingMainBody = true;

            var params = {
                projectId: ct.project.id,
                projectUsers: ct.pop.projectUsers
            };

            var promise = projectService.addUsers(params);
            promise.success(function (data, status, headers) {
                ct.getProject();
                $scope.main.loadingMainBody = false;
                common.mdDialogCancel();
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.pop.cancel = function () {

            ct.pop.listPageUser = [];
            ct.pop.email = '';
            ct.pop.checkboxAll = false;

            $('#project_mbr_add').modal('hide');

            $scope.main.asideHide({
                selectors: '#aside-mem'
            });
        };

        ct.pop.checkedAll = function ($event) {
            for (var i = 0, l = ct.pop.listPageUser.length; i < l; i++) {
                var item = ct.pop.listPageUser[i];

                item.checked = $event.currentTarget.checked;
            }
        };

        // 배경색설정
        ct.backgroundColorSettingNgClick = function (param) {

            var $index = param.$index;
            var className = param.className;

            $('#panelWrapBdtColor' + $index).removeClass('bdtColor1 bdtColor2 bdtColor3').addClass(className);
        };

        // 작업상세로 이동
        ct.orgFormRNgClick = function (param) {
            $location.path('/comm/orgs/orgForm/R/' + param.org.id);
        };

        // 탭클릭 : 작업정보/프로젝트 멤버
        ct.tabNgClick = function (param) {
            var tabId = param.tabId;

            $('#tab1, #tab2').removeClass('active');
            $('#' + tabId).addClass('active');
        };

        //project 상세조회
        ct.getProject();

        quotaFunctions();

        //js2에 있던 소스 이동
        function deleteProjectUser(user) {

            var showConfirm = common.showConfirm($translate.instant('label.del'), user.user.name + ' ' + $translate.instant('message.mq_delete'));
            showConfirm.then(function () {

                $scope.main.loadingMainBody = true;
                var params = {
                    projectId: ct.project.id,
                    id: user.id
                };
                var promise = projectService.removeUser(params);
                promise.success(function (data, status, headers) {
                    ct.getProject();
                    $scope.main.loadingMainBody = false;
                });
                promise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });

        }

        /*프로젝트 수정*/
        function updateProject() {

            pop.project = angular.copy(ct.projectBak);

            if (pop.project.useStartDate) {
                pop.project.useStartDate = moment(pop.project.useStartDate.time).format('YYYY-MM-DD');
            }
            if (pop.project.useEndDate) {
                pop.project.useEndDate = moment(pop.project.useEndDate.time).format('YYYY-MM-DD');
            }

            ct.mode = 'U'; // C, R, U

            //수정 팝업 오픈
            var dialogOptions = {
                title: $translate.instant("label.project_edit"),
                formName: "projectsAsideAddForm",
                controllerAs: "projectPop",
                templateUrl: _COMM_VIEWS_ + "/project/popProjectForm.html" + _VersionTail(),
                btnTemplate: '<div class="sideBtmWrap two">' +
                '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="contents.btn.updateProject_edit();" ng-disabled="projectDetailAsideModiForm.$invalid">{{ "label.edit" | translate }}</button>' +
                '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.popCancel();">{{ "label.cancel" | translate }}</button>' +
                '</div>'
            };
            common.showRightDialog($scope, dialogOptions);

            //project 쿼터 조회
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listProjectQuotas({
                projectId: ct.project.id
            });
            promise.success(function (data, status, headers) {
                pop.projectQuotas = data;
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                pop.projectQuotas = {};
                $scope.main.loadingMainBody = false;
            });

        }

        /*프로젝트 수정 실제 action*/
        function updateProjectAction() {

            if (! $scope.projectPop.validationService.checkFormValidity($scope.projectPop.projectsAsideAddForm)) {
                return;
            }
            if (!pop.project.name) {
                common.showAlert('', '1. 프로젝트명을 입력해 주세요.');
                return;
            }
            $scope.main.loadingMainBody = true;

            var params = {
                id: pop.project.id,
                name: pop.project.name,
                description: pop.project.description,
                quota: {
                    id : pop.project.quotaId
                },
                useStartDate: pop.project.useStartDate,
                useEndDate: pop.project.useEndDate
            };

            var promise = projectService.updateProject(params);
            promise.success(function (data, status, headers) {
                ct.getProject();

                common.mdDialogCancel();
                $scope.main.syncListAllProjects();	//프로젝트 전체 조회

                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                var sMsg = data.resultMsg;
                if (sMsg.indexOf("same name project") > -1){
                    sMsg = "동일한 프로젝트명이 존재 합니다.";
                }
                common.showAlertError($translate.instant("label.project_edit"), sMsg);
            });
        }

        /**
         * 작업정보 탭 작업명 클릭 권한: 프로젝트 책임자이면 작업상세로 이동, 프로젝트 관리자/사용자이면 작업멤버 일때 작업상세로 이동
         */
        function listProjectOrgs() {

            var orgs = ct.project.orgs;
            for (var i = 0, l = orgs.length; i < l; i++) {
                var org = orgs[i];

                if (ct.project.owner.email == ct.user.email) {
                    org.isOrgDetail = true;
                } else {
                    org.isOrgDetail = false;

                    var orgUserList = org.orgUserList;
                    for (var i2 = 0, l2 = orgUserList.length; i2 < l2; i2++) {
                        var orgUser = orgUserList[i2];

                        if (orgUser.usersInfo.email == ct.user.email) {
                            org.isOrgDetail = true;
                            break;
                        }
                    }
                }
            }

        }

        function quotaFunctions() {

            var main = $scope.main;
            var contents = ct;

            contents.listQuotaHistory  = {};
            contents.quotaHistory      = {};
            contents.listProjectQuotas = {};
            contents.listQuotaHistoryNgClickCBox = '';

            /*용량 탭 클릭 이벤트 : 용량변경요청 목록 조회*/
            contents.listQuotaHistoryNgClick = function () {

                ct.isExistRequest          = false; //용량 변경요청 상태의 건이 있는지 여부

                var main = $scope.main;
                var contents = ct;

                main.loadingMainBody = true;

                var params = {};
                params.type = 'PROJECT'; // PROJECT, ORG
                params.id = contents.project.id;

                var promise = quotaService.listQuotaHistory(params);

                promise.success(function (data, status, headers) {
                    contents.listQuotaHistory = data;

                    angular.forEach(data.items, function(quotaItem) {
                        //용량 변경요청 상태의 건이 있을 경우 변경요청 추가 버튼 disable
                        if (quotaItem.status == 'REQUEST') {
                            ct.isExistRequest = true; //용량 변경요청 상태의 건이 있는지 여부
                            return;
                        }
                    });
                    main.loadingMainBody = false;
                });
                promise.error(function (data, status, headers) {
                    contents.listQuotaHistory = {};
                    main.loadingMainBody = false;
                });
            };

            /*용량변경 요청 [+] 클릭 이벤트*/
            contents.asideQuotaReqNgClick = function () {
                contents.quotaHistory = {};

                listProjectQuotas();

                var dialogOptions = {
                    title: $translate.instant("label.capacity_change_request"),
                    formName: "projectDetailAsideQuotaReqForm",
                    controllerAs: "projectQuotaReqPop",
                    templateUrl: _COMM_VIEWS_ + "/project/popProjectDetailQuotaReq.html" + _VersionTail(),
                    btnTemplate: '<div class="sideBtmWrap two">' +
                    '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="contents.asideQuotaReqRequestQuotaNgClick();" ng-disabled="projectDetailAsideQuotaReqForm.$invalid">{{ "label.save" | translate }}</button>' +
                    '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.popCancel();">{{ "label.cancel" | translate }}</button>' +
                    '</div>'
                };
                common.showRightDialog($scope, dialogOptions);
            };

            /*용량변경 요청 [저장]*/
            contents.asideQuotaReqRequestQuotaNgClick = function () {
                var contents = ct;

                if (! $scope.projectQuotaReqPop.validationService.checkFormValidity($scope.projectQuotaReqPop.projectDetailAsideQuotaReqForm)) {
                    return;
                }
                if (!contents.quotaHistory.quotaReq) {
                    common.showAlert($translate.instant("label.job_register"), '1. 변경 요청할 용량을 선택해주세요.');
                    return;
                } else if (!contents.quotaHistory.messageReq) {
                    common.showAlert($translate.instant("label.job_register"), '2. 변경 요청 사유를 입력해 주세요.');
                    return;
                }

                $scope.main.loadingMainBody = true;

                var params         = {};
                params.type        = 'PROJECT'; // PROJECT, ORG
                params.project     = {};
                params.project.id  = contents.project.id;

                params.quotaReq    = {};
                params.quotaReq.id = contents.quotaHistory.quotaReq.id;
                params.messageReq  = contents.quotaHistory.messageReq;

                var promise = quotaService.requestQuota(params);
                promise.success(function (data, status, headers) {

                    common.mdDialogCancel();

                    //용량변경요청 목록 조회
                    contents.listQuotaHistoryNgClick();

                    $scope.main.loadingMainBody = false;
                });
                promise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            };

            /*용량변경 요청 삭제 이벤트*/
            contents.deleteRequestQuota = function(quotaHistory){
                var showConfirm = common.showConfirm($translate.instant('label.capacity_change_request_del') + "(" + quotaHistory.quotaReq.name + ")", $translate.instant('message.mq_delete_quota_request'));
                showConfirm.then(function() {

                    $scope.main.loadingMainBody = true;
                    var orgPromise = quotaService.deleteQuota(quotaHistory.id);
                    orgPromise.success(function(data, status, headers) {
                        $scope.main.loadingMainBody = false;
                        common.showAlert($translate.instant('label.capacity_change_request_del'), $translate.instant('message.mi_delete'));

                        //용량변경 요청 목록 조회
                        contents.listQuotaHistoryNgClick();

                    });
                    orgPromise.error(function(data, status, headers) {
                        $scope.main.loadingMainBody = false;
                        var errMessage = data.message;
                        if (status == 406) {    //요청 상태가 아닌 건은 에러 처리
                            errMessage = $translate.instant('message.mi_wrong_quota_request');
                        }
                        common.showAlertError($translate.instant("label.capacity_change_request_del"), errMessage);
                    });
                });
            };
        }

        function listProjectQuotas() {
            $scope.main.loadingMainBody = true;

            var params = {};
            params.projectId = ct.project.id;

            var promise = quotaService.listProjectQuotas(params);
            promise.success(function (data, status, headers) {
                ct.listProjectQuotas = data;

                for (var i = 0, l = data.items.length; i < l; i++) {
                    var item = data.items[i];
                    if (!!item.defaultQuota) {
                        ct.quotaHistory.quotaReq = item;
                        break;
                    }
                }

                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                ct.listProjectQuotas = {};
                $scope.main.loadingMainBody = false;
            });
        }

        function getMemberAddEmails(ct) {

            var emails = '';
            var results = ct.project.users;
            for (var i = 0, l = results.length; i < l; i++) {
                var result = results[i];

                emails += ',' + result.user.email;
            }

            return emails.substr(1);
        }

        //orgDetailController에서 임의로 이동 시작
        /*작업 추가 시 사용하는 기본 세팅*/
        pop.Init = function () {
            pop.selOrg = {};

            //관리자는 로그인 사용자
            if (cache.getUser()) { //manager Set
                pop.selOrg.managerId    = cache.getUser().user_id;
                pop.selOrg.managerName  = cache.getUser().user_name;
                pop.selOrg.managerEmail = cache.getUser().email;
            }

            //사용기간 : 1년으로 세팅
            var nowDate = new Date();
            var eDate   = nowDate;
            pop.selOrg.useStartDate = nowDate;

            pop.selOrg.projectId = $scope.main.sltProjectId;
        };

        /* [완료] 요청 : 조직 신청 or 조직 수정 */
        pop.apply = function () {
            // 기본정보 validate
            if (!pop.validateOrg()) return;
            if (! $scope.orgPop.validationService.checkFormValidity($scope.orgPop.orgAsideForm)) {
                return;
            }

            $scope.main.loadingMainBody = true;

            var param              = {};
            var orgManager         = {'email': pop.selOrg.managerEmail, 'userId': pop.selOrg.managerId};
            var project            = {'id': pop.selOrg.projectId};
            var quota              = {'id': pop.selOrg.orgQuotaId};
            param['orgManager']    = orgManager;
            param['orgId']         = String(pop.selOrg.orgId);
            param['project']       = project;
            param['quota']         = quota;
            param['description']   = pop.selOrg.description;
            param['usePublicIp']   = pop.selOrg.isUsePublicIp;

            if (!pop.selOrg.orgName)
                param['orgName']   = "";
            else
                param['orgName']   = String(pop.selOrg.orgName);

            var useStartDate       = new Date(pop.selOrg.useStartDate.replace(/\./g, "-")).getTime();
            var useEndDate         = new Date(pop.selOrg.useEndDate.replace(/\./g, "-")).getTime();
            param['useStartDate']  = String(useStartDate);
            param['useEndDate']    = String(useEndDate);

            var applyPromise;
            var resultMessage;

            //신규추가
            applyPromise = orgService.requestOrgCreate(param);
            applyPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                if (ct.userAuth == "A" || ct.userAuth == "M") {
                    common.showAlert($translate.instant('label.org_add'), "작업 신청이 완료되었습니다.");
                } else {
                    common.showAlert($translate.instant('label.org_add'), $translate.instant('message.mi_apply_org_after_apprv'));
                }
                /*window.setTimeout(function () {
                    $('#listOrgs').trigger('click');
                }, 1000);*/
                common.mdDialogCancel();
                ct.getProject();
            });
            applyPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError($translate.instant('label.org_add') + "(" + pop.selOrg.orgId + ")", data);
            });

        };

        /*작업 쿼터 변경 이벤트*/
        pop.projectNgChange = function (projectId) {
            if (!projectId) {
                return;
            }

            $scope.main.loadingMainBody = true;
            var param = {};
            param['projectId'] = projectId;
            param['orgId'] = pop.selOrg.id;
            var promise = quotaService.listOrgQuotas(param);
            promise.success(function (data, status, headers) {
                pop.selOrg.orgQuotas = data.items;
                pop.selOrg.orgQuotaId = '';
                for (var i = 0, l = data.items.length; i < l; i++) {
                    if (data.items[i].available == true) {
                        if (data.items[i].defaultQuota == true) {
                            pop.selOrg.orgQuotaId = data.items[i].id;
                            break;
                        } else {
                            pop.selOrg.orgQuotaId = data.items[i].id;
                        }
                    }
                }
                if (!pop.selOrg.orgQuotaId){
                    common.showAlert('', '작업 쿼터가 없어 작업을 등록할 수 없습니다.');
                }
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                pop.selOrg.orgQuotas = {};
                $scope.main.loadingMainBody = false;
            });
        };

        /* 조직정보 유효성검사 */
        pop.validateOrg = function () {
            var stitle = $translate.instant('label.org_add');
            /*if(pop.modeU){
             stitle = $translate.instant('label.org_edit');
             }*/
            if (!pop.selOrg.projectId) {
                common.showAlert(stitle, '1. 프로젝트를 선택해 주세요.');
                return false;
            }
            /*if(ct.orgValidError){
             common.showAlert(stitle, "조직ID가 중복됩니다.");
             return false;
             }*/
            if (!pop.selOrg.orgName) {
                common.showAlert(stitle, '2. 작업명을 입력해 주세요.');
                return false;
            }
            if (!pop.selOrg.orgQuotaId) {
                common.showAlert(stitle, '3. 작업 쿼터를 선택해 주세요.');
                return false;
            }
            if (!pop.selOrg.managerEmail) {
                common.showAlert(stitle, "관리자를 선택해 주세요.");
                return false;
            }

            return true;
        };

        /*조직추가 시 시작일자 변경 시 종료일자 1년 뒤로 세팅*/
        pop.chgEndDate = function () {
            /*if(!pop.modeC) return;*/

            //var sDate = new Date(pop.selOrg.useStartDate);
            var sDate = new Date(pop.selOrg.useStartDate.replace(/\./g, "-"));
            var eDate = sDate;
            if (!sDate) {
                pop.selOrg.useEndDate = "";
            } else {
                eDate.setYear(sDate.getFullYear() + 1);
                eDate.setDate(sDate.getDate() - 1);

                pop.selOrg.useEndDate = new Date(eDate);
            }
        };
        //orgDetailController에서 임의로 이동 끝

        /*작업 추가 팝업 [취소] 클릭*/
        ct.closePop = function () {
            common.mdDialogCancel();
        };

        /*user_setting 조회*/
        ct.myProjectsLoad = "no";
        ct.getMyProjects = function () {
            var userSettingPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.myProjectsKey);
            userSettingPromise.success(function (data, status, headers) {
                ct.myProjects = [];
                data = userSettingService.userSettingParse(data);
                if (data && angular.isArray(data.contents)) {
                    ct.myProjects = data.contents;
                }
                if (ct.listProjectsLoad == "success") {
                    ct.listProjectsSetting();
                }
                ct.myProjectsLoad = "success";
            });
            userSettingPromise.error(function (data, status, headers) {
                if (!ct.myProjects) ct.myProjects = [];
                ct.myProjectsLoad = "error";
            });
        };

        ct.saveMyProjectSetting = function () {
            var myProjects = [];
            for (var i=0; i<ct.projects.length; i++) {
                var myProject         = {};
                myProject.id          = ct.projects[i].id;
                myProject.hide        = ct.projects[i].hide;
                myProject.bgColorType = ct.projects[i].bgColorType;
                myProject.bgImage     = ct.projects[i].bgImage;
                myProjects.push(myProject);
            }

            $scope.main.loadingMainBody = true;
            var userSettingPromise = userSettingService.saveUserSetting(CONSTANTS.userSettingKeys.myProjectsKey, myProjects);
            userSettingPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
            userSettingPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.projectItemSetShowHide = function (bHide) {
            angular.forEach(ct.projects, function (item, key) {
                if (item.id == ct.project.id){
                    item.hide = bHide;
                }
            });
            ct.saveMyProjectSetting();
            ct.isDashboardHide     = bHide;   //dashboard에서의 숨김 여부
        };

        /*로그인 사용자 프로젝트 조회*/
        ct.listProjectsLoad = "no";
        ct.listProjects = function () {
            ct.projects = [];
            ct.projectItems = [];
            var projectsPromise = projectService.listProjects("", "");
            projectsPromise.success(function(data, status, headers) {
                ct.projects = data.items;
                if (data && data.items) {
                    ct.projectItems = data.items;
                    if (ct.myProjectsLoad == "success") {
                        ct.listProjectsSetting();
                    }
                }
                ct.listProjectsLoad = "success";
                $scope.main.loadingMainBody = false;
            });
            projectsPromise.error(function(data, status, headers) {
                ct.listProjectsLoad = "error";
                $scope.main.loadingMainBody = false;
            });
        };

        /*프로젝트 목록 : 배경색 등 세팅*/
        ct.listProjectsSetting = function () {
            ct.projects = [];
            var isMyProjectArr = [];
            if (angular.isArray(ct.myProjects)) {
                for (var i=0; i<ct.myProjects.length; i++) {
                    var project = common.objectsFindCopyByField(ct.projectItems, "id", ct.myProjects[i].id);
                    if (project && project.id) {
                        project.sortKey     = i;
                        project.hide        = ct.myProjects[i].hide;
                        project.bgColorType = ct.myProjects[i].bgColorType;
                        project.bgImage     = ct.myProjects[i].bgImage;
                        isMyProjectArr.push(project.id);
                        ct.projects.push(project);
                    }
                }
            } else {
                ct.myProjects = [];
            }
            for (var i=0; i<ct.projectItems.length; i++) {
                if (isMyProjectArr.indexOf(ct.projectItems[i].id) == -1) {
                    var project = angular.copy(ct.projectItems[i]);
                    var myProject = {};
                    myProject.id = project.id;
                    myProject.hide = false;
                    if ((i+1)%4 == 0) {
                        myProject.bgColorType = 'color-no';
                        myProject.bgImage = 'images/im_sample_pic.jpg';
                    } else {
                        myProject.bgColorType = "color-type"+(i+1)%4;
                        myProject.bgImage = "";
                    }
                    project.hide        = myProject.hide;
                    project.bgColorType = myProject.bgColorType;
                    project.bgImage     = myProject.bgImage;
                    ct.projects.push(project);
                    ct.myProjects.push(myProject);
                }
            }
            var thisProject = common.objectsFindCopyByField(ct.projects, "id", ct.project.id);
            if (thisProject && thisProject.hide) {
                ct.isDashboardHide = thisProject.hide;    //dashboard에서의 숨김 여부
            }
            ct.projectData = [];
        };
    })
;
