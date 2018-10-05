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
                ct.selOrg = data;

                if (ct.selOrg.project.myRoleName == 'OWNER') {
                    ct.isOrgManager = true;
                }
            });
            orgPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 이미지 변경
        ct.changeIcon = function($event) {
            
        };

        ct.deleteOrg = function () {

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
                id : ct.selOrg.id
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
