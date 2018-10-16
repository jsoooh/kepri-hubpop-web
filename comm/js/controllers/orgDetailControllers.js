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
                // 조직 변경 중복 신청 체크
                ct.orgRequest = true;
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
                $timeout(function () {
                    $scope.main.changePortalOrg(data);
                }, 0);
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
            var password = 'kepco12345';
            $scope.main.loadingMain = true;
            var promise = memberService.resetPassword(user.email, password);
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
                ct.listOrgUsers();
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

                for (var i = 0; i < data.items.length; i++) {
                    var item = data.items[i];
                    if (item.status == 'REQUEST') {
                        ct.orgRequest = false;
                        break;
                    }
                }
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

                // 현재 사용하고 있는 용량 표시
                for (var i = 0; i < ct.orgQuotas.length; i++) {
                    if (ct.orgQuotas[i].name == ct.selOrgProject.quotaId.name) {
                        ct.quotaHistory.quotaReq = ct.orgQuotas[i];
                        break;
                    }
                }
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
            if (ct.quotaHistory.quotaReq.name == ct.selOrgProject.quotaId.name) {
                common.showAlert('용량 변경 요청', ct.quotaHistory.quotaReq.name + ' 현재 사용하고 있는 용량과 동일합니다.');
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
    .controller('commOrgProjectUsersCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache, orgService, memberService, projectService, CONSTANTS, SITEMAP) {
        _DebugConsoleLog('orgDetailControllers.js : commOrgProjectUsersCtrl', 1);

        var ct = this;

        ct.orgRoleNames = CONSTANTS.roleName;
        ct.paramId = $stateParams.orgId;

        ct.newOrgUsers = [];
        // 관리자 존재 여부 조회
        ct.isAdmin = false;

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

        // 등록 사용자 목록 조회
        ct.listOrgUsers = function () {
            ct.orgUserEmails = [];
            var promise = orgService.listOrgUsers(ct.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                if (orgUsers && orgUsers.length > 0) {
                    angular.forEach(orgUsers, function (orgUser, key) {
                        ct.orgUserEmails.push(orgUser.usersInfo.email);

                        if (orgUser.isAdmin)  {
                            ct.isAdmin = true;
                        }
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

        // 전체 사용자 조회
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

        // 조직 신규 사용자 등록을 위한 미동록 사용 목록 조회
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

        // 전체 선택
        ct.checkAll = function ($event) {
            for (var i = 0; i < ct.orgNotUsers.length; i++) {
                if ((i >= (ct.pageOptions.pageSize * (ct.pageOptions.currentPage-1))) && (i < (ct.pageOptions.pageSize * (ct.pageOptions.currentPage)))) {
                    ct.orgNotUsers[i].checked = $event.currentTarget.checked;
                }
            }
        };

        // 사용자 조회 등록
        ct.addOrgUsers = function () {
            var adminCnt = 0;
            ct.orgUserRequests = [];

            for (var i = 0; i < ct.orgNotUsers.length; i++) {
                if (ct.orgNotUsers[i].checked) {
                    var roleName = ct.isAdmin ? 'USER' : ct.orgNotUsers[i].roleName;
                    ct.orgUserRequests.push({
                        email : ct.orgNotUsers[i].email,
                        name : ct.orgNotUsers[i].name,
                        userRole : roleName
                    });

                    if (roleName == 'ADMIN') {
                        adminCnt++;
                    }
                }
            }

            if (adminCnt > 1) {
                common.showAlert('', '프로젝트 관리자는 한 명만 가능합니다.');
                return;
            }

            if (ct.orgUserRequests.length == 0) {
                common.showAlert('', $translate.instant('message.mi_dont_exist_checked'));
                return;
            }
            
            ct.addOrgUsersAction(ct.orgUserRequests)
        };

        // 사용자 등록 액션
        ct.addOrgUsersAction = function (orgUserRequests) {
            var params = {
                type : 'add',
                orgUserRequests : orgUserRequests
            };
            $scope.main.loadingMain = true;
            var promise = orgService.orgUserAdds(ct.paramId, params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                ct.checkboxAll = false;
                ct.pageListOrgUsersLoadData(1);
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };
        
        // 사용자 아이디 중복 체크
        ct.checkOrgUserDup = function (email, index) {
            if (!email) {
                return;
            }

            // 등록 사용자 목록에서 조회
            for (var i = 0; i < ct.orgUserEmails.length; i++) {
                if (ct.orgUserEmails[i].indexOf(email) > -1) {
                    common.showAlertError('이미 회원가입/프로젝트 멤버 추가한 아이디(' + email + ')입니다.');
                    return;
                }
            }

            // 미등록 사용자 목록에서 조회
            for (var i = 0; i < ct.orgNotUsers.length; i++) {
                if (ct.orgNotUsers[i].email.indexOf(email) > -1) {
                    common.showAlertError('이미 회원가입한 아이디(' + email + ')입니다.');
                    return;
                }
            }

            // 등록하려는 사용자 목록에서 조회
            for (var i = 0; i < ct.newOrgUsers.length; i++) {
                if (i != index && ct.newOrgUsers[i].email.indexOf(email) > -1) {
                    common.showAlertError('직접 등록 사용자 목록에 존재하는 아이디(' + email + ')입니다.');
                    return;
                }
            }

            common.showAlertSuccess('회원가입 가능한 아이디(' + email + ')입니다.');
        };

        // 사용자 직접 등록
        ct.addCustomOrgUser = function (item) {
            if (!item.name) {
                common.showAlertWarning('이름을 입력하세요');
                return;
            } else if (!item.position) {
                common.showAlertWarning('소속을 입력하세요');
                return;
            } else if (!item.email) {
                common.showAlertWarning('아이디를 입력하세요');
                return;
            } else if (!item.password) {
                common.showAlertWarning('비밀번호를 입력하세요');
                return;
            }

            for (var i = 0; i < ct.newOrgUsers.length; i++) {
                var orgUser = ct.newOrgUsers[i];
                orgUser.add = false;
                orgUser.del = true;
            }

            ct.newOrgUsers.push({
                roleName : CONSTANTS.roleName.user,
                add : true,
                del : false
            });
        };

        // 사용자 직접 등록 액션
        ct.addCustomOrgUserAction = function () {
            var adminCnt = 0;
            ct.orgUserRequests = [];

            for (var i = 0; i < ct.newOrgUsers.length; i++) {
                var roleName = ct.isAdmin ? 'USER' : ct.newOrgUsers[i].roleName;
                ct.orgUserRequests.push({
                    email : ct.newOrgUsers[i].email,
                    name : ct.newOrgUsers[i].name,
                    userRole : roleName
                });

                if (roleName == 'ADMIN') {
                    adminCnt++;
                }
            }

            if (adminCnt > 1) {
                common.showAlert('', '프로젝트 관리자는 한 명만 가능합니다.');
                return;
            }

            if (ct.orgUserRequests.length == 0) {
                common.showAlert('', $translate.instant('message.mi_dont_exist_checked'));
                return;
            }

            for (var i = 0; i < ct.newOrgUsers.length; i++) {
                var item = ct.newOrgUsers[i];
                
                var param = {};
                param.name = item.name;
                param.position = item.position;
                param.email = item.email;
                param.password = item.password;
                param.userType = 'normal';
                var promise = memberService.createUser(param);
                promise.success(function (data) {
                    if (i == ct.newOrgUsers.length) {
                        ct.addOrgUsersAction(ct.orgUserRequests);
                    }
                });
                promise.error(function (data) {
                    $scope.main.loadingMain = false;
                    common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
                });
            }
        };

        // 취소 버튼
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
