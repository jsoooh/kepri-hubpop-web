'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjecsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commOrgsCtrl", 1);

        var ct = this;

        $scope.main.loadingMainBody = true;

        ct.userAuth  = $scope.main.userAuth;

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
            var schText = !ct.schText ? "" : ct.schText;

            $scope.main.loadingMainBody = true;
            var promise = orgService.getMyProjectOrgList($scope.main.sltProjectId, ct.schType, schText);
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
                    ct.orgProjects = data.items;
                    $timeout.cancel($scope.main.reloadCommTimmer['orgProjects']);
                    $scope.main.loadingMainBody = false;
                } else {
                    $scope.main.reloadCommTimmer['orgProjects'] = $timeout(function () {
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

        ct.detailNgClick = function(orgItem) {
            $location.path('/comm/projects/projectDetail/' + orgItem.id);
        };

        ct.addOrgProjectFormOpen = function($event) {
            if (!ct.defaultOrgQuotaId){
                common.showAlert('', '작업 쿼터가 없어 작업을 등록할 수 없습니다.');
                return;
            }
            var orgProject = {};
            orgProject.managerId    = $scope.main.userInfo.user_id;
            orgProject.managerName  = $scope.main.userInfo.user_name;
            orgProject.managerEmail = $scope.main.userInfo.email;

            orgProject.projectId = $scope.main.sltProjectId;

            var dialogOptions = {
                controller : "commAddOrgProjecFormCtrl",
                controllerAs: "pop",
                fromName : "popOrgProjectForm",
                orgProject : orgProject,
                callBackFunction : ct.listOrgProjects
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true;
        };

        ct.orgProjectDefaultQuota = function(projectId) {
            if(!projectId) {
                return;
            }
            var param = {};
            param['projectId'] = projectId;
            var promise = quotaService.listOrgQuotas(param);
            promise.success(function(data, status, headers) {
                ct.orgQuotas = data.items;
                ct.defaultOrgQuotaId = '';
                for (var i = 0, l = ct.orgQuotas.length; i < l; i++) {
                    if (ct.orgQuotas[i].available == true) {
                        if (ct.orgQuotas[i].defaultQuota == true) {
                            ct.defaultOrgQuotaId = ct.orgQuotas[i].id;
                            break;
                        } else {
                            ct.defaultOrgQuotaId = ct.orgQuotas[i].id;
                        }
                    }
                }
            });
            promise.error(function(data, status, headers) {
                ct.defaultOrgQuotaId = '';
            });
        };

        // 조직 목록 조회
        ct.listOrgProjects();

        ct.orgProjectDefaultQuota($scope.main.sltProjectId);

    })
    .controller('commAddOrgProjecFormCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commOrgsCtrl", 1);

        var pop = this;

        pop.validationService = new ValidationService({controllerAs : pop});

        pop.formName = $scope.dialogOptions.fromName;

        $scope.dialogOptions.title = $translate.instant("label.project_register");
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popOrgProjectForm.html" + _VersionTail();
        $scope.dialogOptions.okName = "생성";
        $scope.dialogOptions.closeName = "취소";

        $scope.actionLoading = true;

        pop.apply = function() {
            // 기본정보 validate
            if (!pop.validateOrg()) return;
            if (! pop.validationService.checkFormValidity(pop[pop.formName])) {
                return;
            }

            $scope.main.loadingMainBody= true;

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

    })
;
