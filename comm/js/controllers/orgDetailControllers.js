'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, common, cache, quotaService, memberService) {
        _DebugConsoleLog('orgDetailControllers.js : commOrgProjectDetailCtrl', 1);

        var ct = this;

        ct.paramId = $stateParams.orgId;
        ct.isOrgManager = false;
        ct.sltInfoTab = 'info';
        
        // 탭 변경
        ct.changeSltInfoTab = function (sltInfoTab) {
            ct.sltInfoTab = sltInfoTab;

            if (sltInfoTab == 'resource') {
                ct.listQuotaHistory();
            }
        };

        // 조직 정보 조회
        ct.getOrgProject = function () {
            $scope.main.loadingMainBody = true;
            var orgPromise = orgService.getOrg(ct.paramId);
            orgPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.selOrgProject = data;
                
                if (ct.selOrgProject.project.myRoleName == 'OWNER') {
                    ct.isOrgManager = true;
                }
            });
            orgPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 이미지 변경
        $scope.pop = {};
        var pop = $scope.pop;
        ct.createOrgProjectIcon = function($event) {
            pop.uploadedNoticeFile = [];
            pop.uploader = common.setDefaultFileUploader($scope);
            pop.uploader.onAfterAddingFile = function(fileItem) {
                pop.uploadedNoticeFile.push(fileItem._file);
                $('#userfile').val(fileItem._file.name);
            };

            var dialogOptions = {
                title : '프로젝트 이미지 변경',
                formName : 'popThumModifyForm',
                dialogClassName : 'modal-dialog-popThumModify',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgIcon.html' + _VersionTail(),
                okName : '업로드'
            };
            common.showDialog($scope, $event, dialogOptions);
            
            $scope.popDialogOk = function() {
                ct.createOrgProjectIconAction();
            };
            
            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };
        };

        // 이미지 변경 액션
        ct.createOrgProjectIconAction = function () {
            if (!pop.uploadedNoticeFile[pop.uploadedNoticeFile.length - 1]) {
                common.showAlertWarning('프로젝트 로고를 선택하십시오.');
                return;
            }

            var body = {};
            body.iconFile = pop.uploadedNoticeFile[pop.uploadedNoticeFile.length - 1];

            $scope.main.loadingMain = true;
            var promise = orgService.createOrgIcon(ct.paramId, body);
            promise.success(function (data, status, headers) {
                $scope.main.loadingMain = false;
                ct.selOrgProject.iconImage = data;
                common.mdDialogHide();
                common.showAlertSuccess('업로드 되었습니다');
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMain = false;
                common.showAlertError('프로젝트 로고 업로드 실패하였습니다.');
            });
        };

        // 조직 설명 추가
        ct.createOrgProjectDesc = function($event) {
            ct.selOrgProject.updatedDescription = ct.selOrgProject.description;
            var dialogOptions = {
                title : '프로젝트 설명',
                formName : 'popOrgDescriptionForm',
                dialogClassName : 'modal-dialog-popOrgDescription',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgDescription.html' + _VersionTail(),
                okName : '수정',
                closeName : '취소'
            };
            common.showDialog($scope, $event, dialogOptions);

            $scope.popDialogOk = function() {
                ct.createOrgProjectDescAction();
            };

            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };
        };

        // 조직 설명 추가 액션
        ct.createOrgProjectDescAction = function () {
            var params = {
                description : $('#description_toUpdate').val()
            };

            $scope.main.loadingMain = true;
            var promise = orgService.updateOrgDescription(ct.paramId, params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_update'));
                common.mdDialogHide();
                ct.selOrgProject.description = params.description;
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_update'));
            });
        };

        // 조직 삭제
        ct.deleteOrgProject = function () {
            var showConfirm = common.showConfirm($translate.instant('label.del') + '(' + ct.selOrgProject.orgName + ')', '프로젝트를 삭제하시겠습니까?');
            showConfirm.then(function () {
                ct.deleteOrgProjectAction();
            });
        };

        // 조직 삭제 액션
        ct.deleteOrgProjectAction = function () {
            $scope.main.loadingMainBody = true;
            var promise = orgService.deleteOrg(ct.paramId);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '해당 프로젝트를 삭제 처리 중 입니다.');
                $scope.main.goToPage('/comm/projects');
            });
            promise.error(function (data, status) {
                $scope.main.loadingMainBody = false;
                if (status == 406) {
                    common.showAlertError($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '삭제 권한이 없습니다.');
                } else if (status == 403) {
                    common.showAlertErrorHtml($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '아래 시스템에서 사용중 입니다.');
                } else {
                    common.showAlertError('', data);
                }
            });
        };

        // 사용자 목록 조회
        ct.listOrgUsers = function () {
            var promise = orgService.listOrgUsers(ct.paramId);
            promise.success(function (data) {
                ct.orgUsers = data.items;
            });
            promise.error(function (data) {
            });
        };

        // 사용자 추가 버튼 클릭
        ct.goToOrgProjectUsers = function () {
            common.locationPath('/comm/projects/projectUsers/' + ct.selOrgProject.id);
        };

        // 비밀번호 초기화
        ct.resetPassword = function (user) {
            var showConfirm = common.showConfirm('비밀번호 초기화', user.name + '(' + user.email + ') 비밀번호(kepco12345) 초기화하시겠습니까?');
            showConfirm.then(function() {
                ct.resetPasswordAction(user);
            });
        };

        // 비밀번호 초기화 액션
        ct.resetPasswordAction = function (user) {
            var params = {};
            params.email = user.email;
            params.new_password = 'kepco12345';

            $scope.main.loadingMain = true;
            var promise = memberService.resetPassword(params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess('비밀번호가 정상적으로 초기화되었습니다');
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError('비밀번호 초기화가 실패하였습니다.');
            });
        };

        // 사용자 삭제
        ct.deleteOrgProjectUser = function (user) {
            var showConfirm = common.showConfirm($translate.instant('label.del'), user.name + ' ' + $translate.instant('message.mq_delete'));
            showConfirm.then(function() {
                ct.deleteOrgProjectUserAction(user);
            });
        };

        // 사용자 삭제 액션
        ct.deleteOrgProjectUserAction = function (user) {
            $scope.main.loadingMain = true;
            var promise = orgService.deleteOrgUser(ct.paramId, user.email);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess(user.name + ' ' + $translate.instant('message.mi_egov_success_common_delete'));
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_delete'));
            });
        };

        // 자원 조회
        ct.listQuotaHistory = function () {
            var params = {
                type : 'ORG', // PROJECT, ORG
                id : ct.selOrgProject.id
            };
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listQuotaHistory(params);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.quotaHistory = data;
            });
            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 용량 조회
        ct.listOrgQuotas = function () {
            var params = {
                projectId : ct.selOrgProject.project.id
            };

            var promise = quotaService.listOrgQuotas(params);
            promise.success(function (data) {
                ct.orgQuotas = data.items;
            });
            promise.error(function (data) {
                ct.orgQuotas = {};
            });
        };

        // 용량 변경
        ct.updateQuota = function($event) {
            var dialogOptions = {
                title : '용량 변경 요청',
                formName : 'projectDetailAsideQuotaReqForm',
                dialogClassName : 'modal-dialog-projectDetailAsideQuotaReq',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgQuota.html' + _VersionTail(),
            };
            common.showDialog($scope, $event, dialogOptions);

            $scope.popDialogOk = function() {
                ct.updateQuotaAction();
            };

            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };

            ct.listOrgQuotas();
        };

        // 용량 변경 액션
        ct.updateQuotaAction = function () {
            if (ct.quotaHistory.quotaReq == undefined) {
                common.showAlert('용량 변경 요청', '1. 변경 요청할 용량을 선택해주세요.');
                return;
            }
            if (ct.quotaHistory.messageReq == null) {
                common.showAlert('용량 변경 요청', '2. 변경 요청 사유를 입력해 주세요.');
                return;
            }

            var params = {};
            params.type = 'ORG';
            params.org = {};
            params.org.id = ct.selOrgProject.id;
            params.quotaReq = {};
            params.quotaReq.id = ct.quotaHistory.quotaReq.id;
            params.messageReq = ct.quotaHistory.messageReq;

            $scope.main.loadingMain = true;
            var promise = quotaService.requestQuota(params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
                common.mdDialogHide();
                ct.listQuotaHistory();
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };

        ct.pageLoadData = function () {
            ct.getOrgProject();
            ct.listOrgUsers();
        };

        ct.pageLoadData();
    })
    .controller('commOrgProjectUsersCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache, orgService, memberService, CONSTANTS, SITEMAP) {
        _DebugConsoleLog('orgDetailControllers.js : commOrgProjectUsersCtrl', 1);

        var ct = this;

        ct.orgRoleNames = CONSTANTS.roleName;
        ct.paramId = $stateParams.orgId;

        ct.newOrgUsers = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 5,
            total : 1
        };

        ct.addNewOrgUsers = function () {
            ct.newOrgUsers.push({
                roleName : ct.orgRoleNames.user,
                add : true,
                del : false,
                ngDisabled : ct.ngDisabled,
            });
        };

        ct.tab_ngClick = function (tabId) {
            $('#tab1-1, #tab1-2').removeClass('active');
            $('#' + tabId).addClass('active');
        };

        // 사용자 목록 조회
        ct.listOrgUsers = function () {
            ct.orgUserEmails = [];
            var promise = orgService.listOrgUsers(ct.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                if (orgUsers && orgUsers.length > 0) {
                    angular.forEach(orgUsers, function (orgUser, key) {
                        ct.orgUserEmails.push(orgUser.usersInfo.email);
                    });
                }
                ct.loadListOrgUsers = true;
                if (ct.loadListAllUsers) {
                    ct.setOrgNotUsers();
                }
            });
            promise.error(function (data) {
            });
        };

        ct.listAllUsers = function () {
            $scope.main.loadingMainBody = true;
            var promise = memberService.listAllUsers();
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.allUsers = data.items;
                ct.loadListAllUsers = true;
                if (ct.loadListOrgUsers) {
                    ct.setOrgNotUsers();
                }
            });

            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.setOrgNotUsers = function () {
            ct.orgNotUsers = [];
            if (ct.allUsers && ct.allUsers.length > 0) {
                angular.forEach(ct.allUsers, function (user, key) {
                    if (ct.orgUserEmails.indexOf(user.email) == -1) {
                        if (!ct.schName || user.name.toLowerCase().indexOf(ct.schName.toLowerCase()) > -1) {
                            user.roleName = ct.orgRoleNames.user;
                            ct.orgNotUsers.push(user);
                        }
                    }
                });
            }
            ct.pageOptions.total = ct.orgNotUsers.length;
        };

        ct.cancel = function () {
            common.locationPath('/comm/projects/projectDetail/' + ct.paramId);
        };

        ct.goToPage = function (page) {
            ct.pageOptions.currentPage = page;
        };

        ct.pageListOrgUsersLoadData = function (page) {
            ct.pageOptions.currentPage = page;
            ct.loadListOrgUsers = false;
            ct.loadListAllUsers = false;
            ct.listOrgUsers(1);
            ct.listAllUsers();
        };

        ct.addNewOrgUsers();

        ct.pageListOrgUsersLoadData(1);
    })
;
