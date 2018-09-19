'use strict';

angular.module('portal.controllers')
    .controller('commOrgsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, quotaService, common, cache) {
        _DebugConsoleLog("orgControllers.js : commOrgsCtrl", 1);

        $scope.main.loadingMainBody = true;

        $scope.schType = 'orgName';

        // 조직추가 시 상단에 조직명, 조직아이디 기본 '' 출력
        $scope.main.detailOrgName = '';

        var ct = this;

        ct.paramMode = 'L';

        ct.isBtnOperationRegistration = false; // 작업 등록 버튼 권한

        ct.fnBtnOperationRegistration = function(param) {

            var $scope = param.$scope;
            var contents = param.ct;
            var main = $scope.main;

            var userAuth = main.userAuth;

            contents.isBtnOperationRegistration = false; // 작업 등록 버튼 권한

            if (main.userAuth == 'M') { // 기업관리자, 프로젝트 책임자
                contents.isBtnOperationRegistration = true; // 작업 등록 버튼 권한
                fn1();
            } else if (main.userAuth == 'O') { // 조직관리자, 프로젝트 관리자
                contents.isBtnOperationRegistration = true; // 작업 등록 버튼 권한
                fn1();
            }

            if (main.userAuth == 'U') { // 일반사용자, 프로젝트 사용자
                fn1();
            }

            function fn1() {
                var projectSelected = main.sltProject;
                var projects        = main.projects;

                for (var i = 0, l = projects.length; i < l; i++) {
                    var project = projects[i];

                    contents.isBtnOperationRegistration = false; // 작업 등록 버튼 권한
                    if (project.id == projectSelected.id) {
                        if (project.myRoleName == 'OWNER' || project.myRoleName == 'ADMIN') {
                            contents.isBtnOperationRegistration = true; // 작업 등록 버튼 권한
                        }
                        break;
                    }
                }

            }
        };

        // paging
        ct.pageOptions = {
            currentPage: 1,
            pageSize: 10,
            total: 0
        };

        ct.orgs = [];
        //기업관리자
        ct.isManager = cache.getUser().manager;
        ct.isAdmin   = cache.getUser().uaaAdmin;
        ct.userAuth  = common.getUserAuth();     //권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.orgData  = {};
        pop.orgUsers = [];
        pop.orgQuota = {};
        //작업 추가에서 쓰일 객체 시작
        pop.selOrg   = {};
        pop.selOrg.orgQuotas = {};   //작업 쿼터
        //작업 추가에서 쓰일 객체 끝

        pop.parentForm = "org";  //작업등록 오픈 form명

        /*Org 목록 조회*/
        ct.listOrgs = function (currentPage) {
            ct.orgs = [];
            var schText1 = !$scope.schText ? "" : $scope.schText;
            if (!currentPage) currentPage = 1;
            ct.pageOptions.currentPage = currentPage;

            $scope.main.loadingMainBody = true;
            var promise = orgService.getMyOrgList($scope.schType, schText1);
            promise.success(function (data) {

                //목록 중 생성중/수정중/삭제중 있는지 확인
                var isIng = false;
                angular.forEach(data.items, function(orgItem) {
                    //상태코드가 중지중/삭제중이 있는 경우
                    if (orgItem.statusCode.indexOf("ing")>-1) {
                        isIng = true;
                        return;
                    }
                });
                if (!isIng) { //에러 시 refresh 멈추도록
                    ct.orgs = data.items;
                    ct.pageOptions.total = data.counts;

                    $timeout.cancel($scope.main.reloadCommTimmer['orgs']);
                    $scope.main.loadingMainBody = false;
                } else {
                    $scope.main.reloadCommTimmer['orgs'] = $timeout(function () {
                        ct.listOrgs();
                    }, 3000)
                }
                $scope.main.syncListAllPortalOrgs();  //작업 전체 조회
            });
            promise.error(function (data, status, headers) {
                ct.orgs = [];
                $timeout.cancel($scope.main.reloadCommTimmer['orgs']);
                $scope.main.loadingMainBody = false;
            });
        };

        /*
         * [승인], [반려] 클릭 이벤트
         * */
        ct.isOK = function (org, isOK, $event) {
            var param = {
                'id': org.id
                , 'statusCode': isOK
                , 'returnReason': ''
            };
            if (isOK) {   //승인
                isOKTran(org.id, isOK, param);
            } else {      //반려
                var dialogOptions = {
                    title: "반려 사유 (" + org.orgId + ")",
                    form: {
                        name: "popOrgReturnForm",
                        options: ""
                    },
                    templateUrl: _COMM_VIEWS_ + "/org/popOrgReturnForm.html" + _VersionTail(),
                    okName: $translate.instant("label.regject")
                };
                pop.mode = "C";
                pop.returnReason = "";
                common.showDialog($scope, $event, dialogOptions);
                // Dialog ok 버튼 클릭 시 액션 정의
                $scope.popDialogOk = function () {
                    param.returnReason = pop.returnReason;
                    if (pop.returnReason == "") {
                        alert("반려사유를 입력해 주세요.");
                        return;
                    }

                    isOKTran(org.id, isOK, param);
                };
            }
        };

        /*[승인], [반려] 실제 처리*/
        function isOKTran(id, isOK, param) {

            $scope.isOK0 = isOK;

            $scope.main.loadingMainBody = true;
            var orgPromise = orgService.updateOrgStatus(id, param);
            orgPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if ($scope.isOK0) {
                    common.showAlert("조직 승인/반려", $translate.instant("message.mi_apprving"));
                } else {
                    common.showAlert("조직 승인/반려", $translate.instant("message.mi_regject"));
                }
                ct.listOrgs();
            });
            orgPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status == 406) {
                    common.showAlertError("조직 승인/반려", "기업관리자만 승인/반려 가능합니다.");
                }
            })
        }

        /*반려 클릭 시 반려사유 보여줌 */
        ct.popReturnReason = function (orgItem, $event) {

            //반려/변경반려/삭제반려 아닌 경우 return
            if(orgItem.statusCode.indexOf("back") == -1) return;

            var dialogOptions = {
                title: "반려 사유 (" + orgItem.orgId + ")",
                form: {
                    name: "popOrgReturnForm",
                    options: ""
                },
                templateUrl: _COMM_VIEWS_ + "/org/popOrgReturnForm.html" + _VersionTail(),
                buttons: []//[{btnName: $translate.instant("label.close")}]
            };
            pop.mode = "R";
            pop.returnReason = orgItem.returnReason;
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {

            };
        };

		// 조직 목록 조회
        ct.listOrgs();

        orgsFunctions({
            $scope : $scope,
            $location : $location,
            ct : ct
        });

        //js2에서 이동 이명화
        function orgsFunctions(param) {

            var $scope = param.$scope;
            var contents = param.ct;

            contents.hubpop = {};

            contents.set = '설정';

            contents.onLoad = function() {

                var contents = param.ct;

                contents.fnBtnOperationRegistration(param);
            };
            contents.onLoad();

            contents.set = function(index, className) {
                $('#panelWrapColorType' + index).removeClass('color-type1 color-type2 color-type3 color-type4').addClass(className);
            };

            contents.asideAdd = function($event, main) {

                pop.Init();
                pop.projectNgChange(pop.selOrg.projectId);

                var dialogOptions = {
                    title : $translate.instant("label.job_register"),
                    formName: "orgAsideForm",
                    controllerAs: "orgPop",
                    templateUrl: _COMM_VIEWS_ + "/org/popOrgForm.html" + _VersionTail(),
                    btnTemplate : '<div class="sideBtmWrap two">' +
                    '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="pop.apply();" ng-disabled="orgAsideForm.$invalid">{{ "label.save" | translate }}</button>' +
                    '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closeOrgPop();">{{ "label.cancel" | translate }}</button>' +
                    '</div>'
                };
                pop.selOrg.isUsePublicIp = true;
                common.showRightDialog($scope, dialogOptions);

            };

            contents.detailNgClick = function(param2) {

                var $location = param.$location;
                var orgItem = param2.orgItem;

                $location.path('/comm/orgs/orgForm/R/' + orgItem.id);
            };
        }

        ct.closeOrgPop = function(){
            common.mdDialogCancel();
        };

        /*작업 추가 시 사용하는 기본 세팅*/
        pop.Init = function(){
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
        pop.apply = function() {
            // 기본정보 validate
            if (!pop.validateOrg()) return;
            if (! $scope.orgPop.validationService.checkFormValidity($scope.orgPop.orgAsideForm)) {
                return;
            }

            $scope.main.loadingMainBody=true;

            var param              = {};
            var orgManager         = {'email':pop.selOrg.managerEmail, 'userId':pop.selOrg.managerId};
            var project            = {'id':pop.selOrg.projectId};
            var quota              = {'id':pop.selOrg.orgQuotaId};
            param['orgManager']    = orgManager;
            param['orgId']         = String(pop.selOrg.orgId);
            param['project']       = project;
            param['quota']         = quota;
            param['description']   = pop.selOrg.description;
            param['usePublicIp']   = pop.selOrg.isUsePublicIp;

            if(!pop.selOrg.orgName)
                param['orgName']   = "";
            else
                param['orgName']   = String(pop.selOrg.orgName);

            var useStartDate       = new Date(pop.selOrg.useStartDate.replace(/\./g,"-")).getTime();
            var useEndDate         = new Date(pop.selOrg.useEndDate.replace(/\./g,"-")).getTime();
            param['useStartDate']  = String(useStartDate);
            param['useEndDate']    = String(useEndDate);

            var applyPromise;
            var resultMessage;

            //신규추가
            applyPromise = orgService.requestOrgCreate(param);
            applyPromise.success(function (data) {
                $scope.main.loadingMainBody=false;
                if(ct.userAuth=="A" || ct.userAuth=="M") {
                    common.showAlert($translate.instant('label.org_add'), "작업 신청이 완료되었습니다.");
                }else {
                    common.showAlert($translate.instant('label.org_add'), $translate.instant('message.mi_apply_org_after_apprv'));
                }
                window.setTimeout(function() {$('#listOrgs').trigger('click');}, 1000);
                common.mdDialogCancel();
            });
            applyPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                common.showAlertError($translate.instant('label.org_add') + "(" + pop.selOrg.orgId + ")", data);
            });
        };

        /*작업 쿼터 변경 이벤트*/
        pop.projectNgChange = function(projectId) {
            if(!projectId) {
                return;
            }

            $scope.main.loadingMainBody = true;
            var param = {};
            param['projectId'] = projectId;
            param['orgId']     = pop.selOrg.id;
            var promise = quotaService.listOrgQuotas(param);
            promise.success(function(data, status, headers) {
                pop.selOrg.orgQuotas = data.items;
                pop.selOrg.orgQuotaId = '';
                for (var i = 0, l = data.items.length; i < l; i++) {
                    if (data.items[i].available == true) {
                        //if (data.items[i].name == 'default') {
                        if (data.items[i].defaultQuota == true) {
                            pop.selOrg.orgQuotaId = data.items[i].id;
                            break;
                        } else {
                            pop.selOrg.orgQuotaId = data.items[i].id;
                        }
                    }
                    if (!pop.selOrg.orgQuotaId){
                        common.showAlert('', '작업 쿼터가 없어 작업을 등록할 수 없습니다.');
                    }
                }
                $scope.main.loadingMainBody = false;
            });
            promise.error(function(data, status, headers) {
                pop.selOrg.orgQuotas = {};
                $scope.main.loadingMainBody = false;
            });
        };

        /* 조직정보 유효성검사 */
        pop.validateOrg = function() {
            var stitle = $translate.instant('label.org_add');
            /*if(pop.modeU){
                stitle = $translate.instant('label.org_edit');
            }*/
            if(!pop.selOrg.projectId){
                common.showAlert(stitle, '1. 프로젝트를 선택해 주세요.');
                return false;
            }
            /*if(ct.orgValidError){
                common.showAlert(stitle, "조직ID가 중복됩니다.");
                return false;
            }*/
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

        /*조직추가 시 시작일자 변경 시 종료일자 1년 뒤로 세팅*/
        pop.chgEndDate = function(){
            /*if(!pop.modeC) return;*/

            //var sDate = new Date(pop.selOrg.useStartDate);
            var sDate = new Date(pop.selOrg.useStartDate.replace(/\./g,"-"));
            var eDate = sDate;
            if(!sDate){
                pop.selOrg.useEndDate = "";
            }else{
                eDate.setYear(sDate.getFullYear()+1);
                eDate.setDate(sDate.getDate()-1);

                pop.selOrg.useEndDate = new Date(eDate);
            }
        };

    })
;
