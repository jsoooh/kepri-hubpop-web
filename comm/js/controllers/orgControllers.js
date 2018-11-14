'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commOrgsCtrl", 1);

        var ct = this;

        // portalOrg 선택 제거
        $scope.main.setPortalOrg(null);

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
            var promise = orgService.getMyProjectOrgList($scope.main.sltProjectId, "", "");
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                if (angular.isArray(data.items)) {
                    angular.forEach(data.items, function (orgProject, key) {
                        if (!schText || (orgProject.orgName && (orgProject.orgName.toLowerCase().indexOf(schText.toLowerCase()) >= 0))) {
                            ct.orgProjects.push(orgProject);
                        }
                    });
                    $scope.main.setListAllPortalOrgs(data.items);
                } else {
                    $scope.main.setListAllPortalOrgs();
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

        // 조직 목록 조회
        ct.listOrgProjects();

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
        _DebugConsoleLog("orgControllers.js : commOrgsCtrl", 1);

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
                    common.showAlert('작업 쿼터가 없어 작업을 등록할 수 없습니다.');
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

            var param              = {};
            param.orgManager    = {'email':pop.orgProject.managerEmail, 'userId':pop.orgProject.managerId};
            param.project       = {'id':pop.orgProject.projectId};
            param.quota         = {'id':pop.orgProject.orgQuotaId};
            param.description   = String(pop.orgProject.orgName);
            param.usePublicIp   = true;
            param.orgName       = String(pop.orgProject.orgName);

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
                common.showAlertError($translate.instant('label.org_add') + "(" + param.orgName + ")", data);
            });
        };

        pop.orgProjectDefaultQuota(pop.orgProject.projectId);

    })
;
