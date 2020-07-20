'use strict';

angular.module('perf.controllers')
    .controller('perfAnlsCtrl', function ($scope, $location, $state, $q, $stateParams, $translate, $timeout, $interval, $filter, common, perfAnlsService, perfMeteringService, CONSTANTS, perfCommService) {
        _DebugConsoleLog("perfAnlsControllers.js : perfAnlsCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};

        ct.data.maxRow = 0;

        ct.sltOrg = {};
        ct.sltOrg.code = $scope.main.sltPortalOrg.orgId;
        ct.sltOrg.name = $scope.main.sltPortalOrg.orgName;

        ct.today = new Date();
        ct.data.startYear = ct.scope.CONSTANTS.startYear;

        ct.meteringItemGroups = [];
        ct.combinedAnlList = [];

        ct.perfYears = [];
        //ct.perfMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        ct.data.sltYear = "";
        ct.data.sltMonth = "";

        // 미터링 서비스 그룹 리스트
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

        // 과금 정책 페이지로 이동
        ct.fn.showPerfRefAmt = function (itemGroupCode) {
            $location.path('/perf/perfRefAmt').search('itemGroupCode=' + itemGroupCode);
        };

        // rowspan 최대값
        ct.fn.findMaxRow = function (data) {
            var itemGroupCode = "";
            var itemCnt = 1;
            var maxRow = 0;

            for (var i = 0; i < data.itemCount; i++) {
                if (data.items[i].itemGroupCode != itemGroupCode) {
                    itemGroupCode = data.items[i].itemGroupCode;
                    if (maxRow < itemCnt) {
                        maxRow = itemCnt;
                        itemCnt = 1;
                    }
                } else {
                    itemCnt++;
                }
            }
            if (maxRow < itemCnt) {
                maxRow = itemCnt;
            }
            return maxRow;
        };

        // 데이터 호출
        /**
         * HUBPOP_INT_PER_ANS_02 - 월별 과금 현황
         * @param params
         * @param defer
         */
        ct.fn.totalAnlsByOrgCodeAndPerfYm = function (params) {
            var promise = perfAnlsService.totalAnlsByOrgCodeAndPerfYm(params)
            promise.success(function (data) {
                var tempCombinedAnlList = data.items;
                ct.data.maxRow = ct.fn.findMaxRow(data);
                var itemGroupCode = "";
                var startItemGroup = 0;
                ct.data.totalPerfAnls = 0;
                ct.data.lastTotalPerfAnls = 0;

                for (var i = 0; i < data.itemCount; i++) {
                    if (tempCombinedAnlList[i].itemGroupCode != itemGroupCode) {
                        itemGroupCode = angular.copy(tempCombinedAnlList[i].itemGroupCode);
                        startItemGroup = i;
                        tempCombinedAnlList[startItemGroup].lastAnlsSumByItemGroup = 0;
                        tempCombinedAnlList[startItemGroup].sltAnlsSumByItemGroup = 0;
                        tempCombinedAnlList[startItemGroup].lastAnlsSumByItemGroup = tempCombinedAnlList[startItemGroup].lastPerfAmt;
                        tempCombinedAnlList[startItemGroup].sltAnlsSumByItemGroup = tempCombinedAnlList[startItemGroup].sltPerfAmt;
                    } else {
                        tempCombinedAnlList[startItemGroup].lastAnlsSumByItemGroup += tempCombinedAnlList[i].lastPerfAmt;
                        tempCombinedAnlList[startItemGroup].sltAnlsSumByItemGroup += tempCombinedAnlList[i].sltPerfAmt;
                    }
                    ct.data.totalPerfAnls += tempCombinedAnlList[i].sltPerfAmt;
                    ct.data.lastTotalPerfAnls += tempCombinedAnlList[i].lastPerfAmt;
                }

                var startIdx = 0;
                for (var i = 0; i < ct.meteringItemGroups.length; i++) {
                    var exist = false;
                    for(var j = startIdx; j < data.itemCount; j++) {
                        if(ct.meteringItemGroups[i].itemGroupCode == tempCombinedAnlList[j].itemGroupCode) {
                            ct.combinedAnlList.push(tempCombinedAnlList[j]);
                            exist = true;
                        } else {
                            startIdx = j;
                            break;
                        }
                    }
                    if (exist == false) {
                        var combinedData = {
                            itemGroupCode: ct.meteringItemGroups[i].itemGroupCode,
                            itemGroupName: ct.meteringItemGroups[i].itemGroupName,
                            itemName: "",
                            lastAnlsSumByItemGroup: 0,
                            lastMeteringValue: 0,
                            lastPerfAmt: 0,
                            sltAnlsSumByItemGroup: 0,
                            sltMeteringValue: 0,
                            sltPerfAmt: 0
                        };
                        ct.combinedAnlList.push(combinedData);
                    }
                }
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 년도 변경
        ct.fn.changeSltYear = function (sltYear) {
            ct.data.sltYear = sltYear;

            ct.perfMonths = perfCommService.listPerfMonth(ct.data.sltYear);
            ct.data.sltMonth = perfCommService.monthWhenChangeYear(ct.data.prevSltYear, ct.data.sltYear);

            ct.data.prevSltYear = ct.data.sltYear;

            ct.fn.selectMonth(ct.data.sltMonth);
        };

        // 데이터 요청
        ct.fn.selectMonth = function (sltMonth) {
            $scope.main.loadingMainBody = true;
            ct.data.sltMonth = sltMonth;
            var firstDayOfMonth = new Date(ct.data.sltYear, ct.data.sltMonth - 1, 1);
            ct.lastDayOfLastMonth = new Date(firstDayOfMonth.setDate(firstDayOfMonth.getDate() - 1));

            var sltParams = {
                urlPaths: {
                    "orgCode": ct.sltOrg.code
                },
                "year": ct.data.sltYear,
                "month": ct.data.sltMonth
            };
            ct.fn.totalAnlsByOrgCodeAndPerfYm(sltParams)
        };

        // page Data 초기화 함수
        ct.fn.pageDataInit = function () {
            $scope.main.loadingMainBody = true;
            // 연 list 만들기
            for (var i = ct.data.startYear; i < ct.today.getFullYear() + 1; i++) {
                ct.perfYears.push(i);
            }

            ct.fn.listAllMeteringGroupItems();
            ct.data.sltYear = ct.today.getFullYear();
            ct.data.sltMonth = ct.today.getMonth() + 1;
            ct.data.prevSltYear = ct.data.sltYear;
            
            ct.perfMonths = perfCommService.listPerfMonth(ct.data.sltYear);

            ct.fn.selectMonth(ct.data.sltMonth);
        };

        ct.fn.pageDataInit();
    })
;
