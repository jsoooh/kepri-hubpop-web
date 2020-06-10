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

        ct.perfYears = [];
        //ct.perfMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        ct.data.sltYear = "";
        ct.data.sltMonth = "";

        // ct.combinedAnlList = [];
        ct.data.totalPerfAnls = 0;

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
            return maxRow;
        };

        // 데이터 호출 Using $q
        /**
         * HUBPOP_INT_PER_ANS_02 - 월별 과금 현황
         * @param params
         * @param defer
         */
        ct.fn.totalAnlsByOrgCodeAndPerfYm = function (params, defer) {
            var promise = perfAnlsService.totalAnlsByOrgCodeAndPerfYm(params)
            promise.success(function (data) {
                console.log("Success get" + params.year + "_" + params.month + "perfAnls");
                if (defer) {
                    defer.resolve(data);
                }
            });
            promise.error(function (data, status, headers) {
                console.log("Fail get" + params.year + "_" + params.month + "perfAnls");
                defer.reject(data);
            });
        };

        // 당월 전월 데이터를 통합
        ct.fn.combinePerfAnlsByMonthly = function (paramsSlt, paramsLast) {
            var sltDataDefer = $q.defer();
            var lastDataDefer = $q.defer();

            var allProcessForCombineData = $q.all([sltDataDefer.promise, lastDataDefer.promise]);

            allProcessForCombineData.then(function (datas) {
                ct.combinedAnlList = [];
                console.log("Start Combine");
                ct.data.totalPerfAnls = 0;
                ct.data.lastTotalPerfAnls = 0;
                var sltData = datas[0];
                var lastData = datas[1];
                var sltDataMaxRow = ct.fn.findMaxRow(sltData);
                var lastDatamaxRow = ct.fn.findMaxRow(lastData);
                ct.data.maxRow = Math.max(sltDataMaxRow, lastDatamaxRow);

                if (sltData != undefined && lastData != undefined) {
                    var itemCount = Math.max(sltData.itemCount, lastData.itemCount);
                    var sltDataList = sltData.items;
                    var lastDataList = lastData.items;
                    var itemGroupCode = "";
                    var startItemGroup = 0;

                    if (!lastDataList || lastDataList.length == 0) {
                        for (var i = 0; i < itemCount; i++) {
                            var combinedAnl = {
                                orgName: sltDataList[i].orgName,
                                orgCode: sltDataList[i].orgCode,
                                itemGroupName: sltDataList[i].itemGroupName,
                                itemGroupCode: sltDataList[i].itemGroupCode,
                                itemName: sltDataList[i].itemName,
                                itemCode: sltDataList[i].itemCode,
                                itemUnit: sltDataList[i].itemUnit,
                                lastMetering: 0,
                                sltMetering: sltDataList[i].meteringValue,
                                lastAnls: 0,
                                sltAnls: sltDataList[i].perfAmt
                            };
                            if (sltDataList[i].itemGroupCode != itemGroupCode) {
                                itemGroupCode = angular.copy(sltDataList[i].itemGroupCode);
                                startItemGroup = i;
                                combinedAnl.lastAnlsSumByItemGroup = "0";
                                combinedAnl.sltAnlsSumByItemGroup = sltDataList[i].perfAmt;
                            } else {
                                //ct.totalcombinedAnl[startItemGroup].lastAnlsSumByItemGroup += 0;
                                ct.combinedAnlList[startItemGroup].sltAnlsSumByItemGroup += sltDataList[i].perfAmt;
                            }
                            ct.data.totalPerfAnls += sltDataList[i].perfAmt;
                            ct.combinedAnlList.push(combinedAnl);
                        }
                    } else if (!sltDataList || sltDataList.length == 0) {
                        for (var i = 0; i < itemCount; i++) {
                            var combinedAnl = {
                                orgName: lastDataList[i].orgName,
                                orgCode: lastDataList[i].orgCode,
                                itemGroupName: lastDataList[i].itemGroupName,
                                itemGroupCode: lastDataList[i].itemGroupCode,
                                itemName: lastDataList[i].itemName,
                                itemCode: lastDataList[i].itemCode,
                                itemUnit: lastDataList[i].itemUnit,
                                lastMetering: lastDataList[i].meteringValue,
                                sltMetering: 0,
                                lastAnls: lastDataList[i].perfAmt,
                                sltAnls: 0
                            };
                            if (lastDataList[i].itemGroupCode != itemGroupCode) {
                                itemGroupCode = angular.copy(lastDataList[i].itemGroupCode);
                                startItemGroup = i;
                                combinedAnl.lastAnlsSumByItemGroup = lastDataList[i].perfAmt;
                                combinedAnl.sltAnlsSumByItemGroup = "0";
                            } else {
                                ct.combinedAnlList[startItemGroup].lastAnlsSumByItemGroup += lastDataList[i].perfAmt;
                                //ct.combinedAnlList[startItemGroup].sltAnlsSumByItemGroup += 0;
                            }
                            ct.data.totalPerfAnls = "0";
                            ct.combinedAnlList.push(combinedAnl);
                        }
                    } else {
                        for (var i = 0; i < itemCount; i++) {
                            var combinedAnl = {
                                orgName: sltDataList[i].orgName,
                                orgCode: sltDataList[i].orgCode,
                                itemGroupName: sltDataList[i].itemGroupName,
                                itemGroupCode: sltDataList[i].itemGroupCode,
                                itemName: sltDataList[i].itemName,
                                itemCode: sltDataList[i].itemCode,
                                itemUnit: sltDataList[i].itemUnit,
                                lastMetering: lastDataList[i].meteringValue,
                                sltMetering: sltDataList[i].meteringValue,
                                lastAnls: lastDataList[i].perfAmt,
                                sltAnls: sltDataList[i].perfAmt
                            };
                            if (sltDataList[i].itemGroupCode != itemGroupCode) {
                                itemGroupCode = angular.copy(sltDataList[i].itemGroupCode);
                                startItemGroup = i;
                                combinedAnl.lastAnlsSumByItemGroup = lastDataList[i].perfAmt;
                                combinedAnl.sltAnlsSumByItemGroup = sltDataList[i].perfAmt;
                            } else {
                                ct.combinedAnlList[startItemGroup].lastAnlsSumByItemGroup += lastDataList[i].perfAmt;
                                ct.combinedAnlList[startItemGroup].sltAnlsSumByItemGroup += sltDataList[i].perfAmt;
                            }
                            ct.data.totalPerfAnls += sltDataList[i].perfAmt;
                            ct.data.lastTotalPerfAnls += lastDataList[i].perfAmt;
                            ct.combinedAnlList.push(combinedAnl);
                        }
                    }
                }
                $scope.main.loadingMainBody = false;
            });

            ct.fn.totalAnlsByOrgCodeAndPerfYm(paramsSlt, sltDataDefer);
            ct.fn.totalAnlsByOrgCodeAndPerfYm(paramsLast, lastDataDefer);
        };

        // 년도 변경
        ct.fn.changeSltYear = function (sltYear) {
            ct.data.sltYear = sltYear;

            ct.perfMonths = perfCommService.listPerfMonth(ct.data.sltYear);
            ct.data.sltMonth = perfCommService.monthWhenChangeYear(ct.data.prevSltYear, ct.data.sltYear);

            ct.data.prevSltYear = ct.data.sltYear;

            ct.fn.selectMonth(ct.data.sltMonth);

            console.log("year: " + ct.data.sltYear + " month: " + ct.data.sltMonth);
        };

        // 데이터 요청
        ct.fn.selectMonth = function (sltMonth) {
            $scope.main.loadingMainBody = true;
            ct.data.sltMonth = sltMonth;
            var firstDayOfMonth = new Date(ct.data.sltYear, ct.data.sltMonth - 1, 1);
            ct.lastDayOfLastMonth = new Date(firstDayOfMonth.setDate(firstDayOfMonth.getDate() - 1));

            console.log(ct.lastDayOfLastMonth.getFullYear() + ":" + (ct.lastDayOfLastMonth.getMonth() + 1));
            console.log(ct.data.sltYear + ":" + ct.data.sltMonth);
            var paramsSlt = {
                urlPaths: {
                    "orgCode": ct.sltOrg.code
                },
                "year": ct.data.sltYear,
                "month": ct.data.sltMonth
            };
            var paramsLast = {
                urlPaths: {
                    "orgCode": ct.sltOrg.code
                },
                "year": ct.lastDayOfLastMonth.getFullYear(),
                "month": ct.lastDayOfLastMonth.getMonth() + 1
            };
            ct.fn.combinePerfAnlsByMonthly(paramsSlt, paramsLast);
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
