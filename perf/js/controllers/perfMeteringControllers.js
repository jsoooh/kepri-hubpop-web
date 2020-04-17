'use strict';

angular.module('perf.controllers')
    .controller('perfMonthlyMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, orgService, perfMeteringService, CONSTANTS) {
        _DebugConsoleLog("perfMeteringControllers.js : perfMonthlyMeteringCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};

        ct.data.sltId = common.getPortalOrgKey();  // 선택된 Org의 id (!= orgId)
        ct.data.sltOrgId = "";
        ct.data.sltOrgName = "";

        ct.meteringItemGroups = [];
        ct.data.maxRow = {};
        ct.data.sltYear = "";
        ct.meteringYears = [];
        ct.orgMeteringMonthlyLists = [];

        ct.orgMeteringValues = [];
        ct.orgMeteringMonthlyValueLists = [];

        /* 미터링 서비스 그룹 리스트 */
        ct.fn.listAllMeteringGroupItems = function () {
            var promise = perfMeteringService.listAllMeteringGroupItems();
            promise.success(function (data) {
                if (angular.isArray(data.items)) {
                    ct.meteringItemGroups = data.items;
                } else {
                    ct.meteringItemGroups = [];
                }
            });
            promise.error(function (data, status, headers) {
                ct.meteringItemGroups = [];
            });
        };

        /* 년도 리스트 */
        ct.fn.listAllMeteringYears = function () {
            var promise = perfMeteringService.listAllMeteringYears();
            promise.success(function (data) {
                console.log("Success listAllMeteringYears");
                ct.data.sltYear = data.items[0];
                for (var i=0; i<data.items.length; i++) {
                    ct.meteringYears.push(data.items[i]);
                }
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringYears");
                ct.meteringYears = [];
            });
        };

        /* 월별 사용량 리스트 BY ORG_ORGCODE */
        ct.fn.orgListMeteringMonthlyTotal = function() {
            ct.fn.listAllMeteringYears();

            console.log("orgListMeteringMonthlyTotal");

            if(angular.isUndefined(ct.data.sltYear) || ct.data.sltYear == "") {
                var date = new Date();
                ct.data.sltYear = date.getFullYear();
            }

            $scope.main.loadingMainBody = true;

            /* Org 정보 조회 BY ORG_ID */
            var orgPromise = orgService.getOrg(ct.data.sltId);
            orgPromise.success(function (data) {
                ct.data.sltOrgName = data.orgName;
                ct.data.sltOrgId = data.orgId;
                /* orgId(orgCode) 이용하여 월별 사용량 조회 */
                console.log(ct.sltOrgId +", " +data.orgId);
                var promise = perfMeteringService.listPerfMonthlyMeteringByOrgCode(ct.data.sltYear, ct.data.sltOrgId);
                promise.success(function (data) {
                    if(angular.isArray(data.items)) {
                        ct.orgMeteringMonthlyLists = data.items;
                        /* rowspan 최대값 */
                        var itemGroupName = "";
                        var itemCnt = 1;
                        ct.data.maxRow = 0;
                        for(var i=0; i<data.itemCount; i++) {
                            if (data.items[i].itemGroupName != itemGroupName) {
                                itemGroupName = angular.copy(data.items[i].itemGroupName);
                                if (ct.data.maxRow < itemCnt) {
                                    ct.data.maxRow = itemCnt;
                                }
                                itemCnt = 1;
                            } else {
                                itemCnt++;
                            }

                            /* 월별 ng-repeat을 위한 객체 생성 */
                            ct.orgMeteringValues = [data.items[i].m01, data.items[i].m02, data.items[i].m03
                                               , data.items[i].m04, data.items[i].m05, data.items[i].m06
                                               , data.items[i].m07, data.items[i].m08, data.items[i].m09
                                               , data.items[i].m10, data.items[i].m11, data.items[i].m12];
                            for(var j=0; j<ct.orgMeteringValues.length; j++) {
                                ct.orgMeteringMonthlyValueLists.push({
                                    itemCode: data.items[i].itemCode,
                                    itemUnit: data.items[i].itemUnit,
                                    meteringValue: ct.orgMeteringValues[j]
                                });
                            }
                        }
                        $scope.main.loadingMainBody = false;
                    } else {
                        ct.orgMeteringMonthlyLists = [];
                        $scope.main.loadingMainBody = false;
                    }
                });
                promise.error(function (data, status, headers) {
                    ct.orgMeteringMonthlyLists = [];
                    $scope.main.loadingMainBody = false;
                });
            });
            orgPromise.error(function (data, status, headers) {
                ct.orgMeteringMonthlyLists = [];
                ct.sltOrgCode = {};
                ct.sltOrgName = {};
            });
        };

        /* 년도 변경 */
        ct.fn.selectMeteringYear = function (sltYear) {
            $scope.main.loadingMainBody = true;
            if(angular.isDefined(sltYear)) {
                ct.data.sltYear = sltYear;
                var promise = perfMeteringService.listPerfMonthlyMeteringByOrgCode(ct.data.sltYear, ct.data.sltOrgId);
                promise.success(function (data) {
                    if(angular.isArray(data.items)) {
                        ct.orgMeteringMonthlyLists = data.items;

                        /* 월별 ng-repeat을 위한 객체 생성 */
                        ct.orgMeteringMonthlyValueLists = [];
                        for(var i=0; i<data.itemCount; i++){
                            ct.orgMeteringValues = [data.items[i].m01, data.items[i].m02, data.items[i].m03
                                                  , data.items[i].m04, data.items[i].m05, data.items[i].m06
                                                  , data.items[i].m07, data.items[i].m08, data.items[i].m09
                                                  , data.items[i].m10, data.items[i].m11, data.items[i].m12];
                            for(var j=0; j<ct.orgMeteringValues.length; j++) {
                                ct.orgMeteringMonthlyValueLists.push({
                                    itemCode: data.items[i].itemCode,
                                    itemUnit: data.items[i].itemUnit,
                                    meteringValue: ct.orgMeteringValues[j]
                                });
                            }
                        }
                    } else {
                        ct.orgMeteringMonthlyLists = [];
                    }
                    $scope.main.loadingMainBody = false;
                });
                promise.error(function (data, status, headers) {
                    ct.orgMeteringMonthlyLists = [];
                    $scope.main.loadingMainBody = false;
                });
            }
        };

        ct.fn.listAllMeteringGroupItems();
        ct.fn.orgListMeteringMonthlyTotal();

    })
    .controller('perfItemsMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, perfMeteringService, CONSTANTS) {
            _DebugConsoleLog("perfMeteringControllers.js : perfItemsMeteringCtrl", 1);

            var ct = this;
            ct.scope = $scope;
            ct.scope.CONSTANTS = CONSTANTS;
            ct.fn = {};
            ct.conditions = {};
            ct.data = {};
    })
;