'use strict';

angular.module('portal.controllers')
    .controller('orgProjectDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, common, cache, quotaService, applicationService, userSettingService, CONSTANTS) {
        _DebugConsoleLog("orgProjectDetailControllers.js : orgProjectDetailCtrl", 1);

        var ct = this;

        ct.orgId = $stateParams.orgId;
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
        ct.getOrg = function () {
            $scope.main.loadingMainBody = true;
            var orgPromise = orgService.getOrg(ct.orgId);
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
        $scope.popIcon = {};
        ct.changeIcon = function($event) {
            var popIcon = $scope.popIcon;
            popIcon.uploadedNoticeFile = [];
            popIcon.uploader = common.setDefaultFileUploader($scope);
            popIcon.uploader.onAfterAddingFile = function(fileItem) {
                popIcon.uploadedNoticeFile.push(fileItem._file);
                $('#userfile').val(fileItem._file.name);
            };
            var dialogOptions = {
                title : '프로젝트 이미지변경',
                formName : 'popThumModifyForm',
                dialogClassName : 'modal-dialog-popThumModify',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgIcon.html' + _VersionTail(),
                okName : '업로드'
            };
            common.showDialog($scope, $event, dialogOptions);
            $scope.popDialogOk = function() {
                if (!popIcon.uploadedNoticeFile[popIcon.uploadedNoticeFile.length - 1]) {
                    common.showAlertWarning('프로젝트 로고를 선택하십시오.');
                    return;
                }

                $scope.main.loadingMain = true;
                var params = {};
                params.projectId = ct.project.id;
                params.attachedFile = popIcon.uploadedNoticeFile[popIcon.uploadedNoticeFile.length - 1];
                var promise = projectService.uploadProjectLogo(params);
                promise.success(function(data, status, headers) {
                    $scope.main.loadingMain = false;
                    common.mdDialogHide();
                    common.showAlertSuccess('업로드 되었습니다');
                });
                promise.error(function(data, status, headers) {
                    $scope.main.loadingMain = false;
                    common.showAlertError('프로젝트 로고 업로드 실패하였습니다.');
                });
            };
            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };
        };

        // 사용자 목록 조회
        ct.listUsers = function () {
            var orgPromise = orgService.listOrgUsers(ct.orgId);
            orgPromise.success(function (data) {
                ct.orgUsers = data;
            });
            orgPromise.error(function (data) {
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

        ct.pageLoadData = function () {
            ct.getOrg();
            ct.listUsers();
        };

        ct.pageLoadData();
    })
;
