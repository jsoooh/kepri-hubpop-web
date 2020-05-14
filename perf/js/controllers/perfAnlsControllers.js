'use strict';

angular.module('perf.controllers')
    .controller('perfAnlsCtrl', function ($scope, $location, $state, $q, $stateParams, $translate, $timeout, $interval, $filter, common, perfAnlsService, CONSTANTS, perfMeteringService, orgService) {
        _DebugConsoleLog("perfAnlsControllers.js : perfAnlsCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};

        ct.data.maxRow = 0;

        ct.sltOrg = {
            code: "",
            name: ""
        };

        ct.today = new Date();
        ct.data.startYear = 2019;

        ct.meteringItemGroups = [];

        ct.perfYears = [];
        ct.perfMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        ct.data.sltYear = "";
        ct.data.sltMonth = "";
        ct.totalPerfAnlsByOrgCodeAndPerfDate = [];
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
                ct.totalPerfAnlsByOrgCodeAndPerfDate = [];
                console.log("Start Combine");
                ct.data.totalPerfAnls = 0;
                var sltData = datas[0];
                var lastData = datas[1];
                var sltDataMaxRow = ct.fn.findMaxRow(sltData);
                var lastDatamaxRow = ct.fn.findMaxRow(lastData);
                if (sltDataMaxRow > lastDatamaxRow) {
                    ct.data.maxRow = sltDataMaxRow;
                } else {
                    ct.data.maxRow = lastDatamaxRow;
                }

                if (sltData != undefined && lastData != undefined) {
                    var sltDataList = sltData.items;
                    var lastDataList = lastData.items;
                    var itemGroupCode = "";
                    var startItemGroup = 0;
                    var itemCount = 0;
                    if (sltData.itemCount > lastData.itemCount) {
                        itemCount = sltData.itemCount
                    } else {
                        itemCount = lastData.itemCount;
                    }

                    for (var i = 0; i < itemCount; i++) {
                        if (!sltDataList[i]) {
                            var perfAnlsByOrgCodeAndPerfDate = {
                                orgName: lastDataList[i].orgName,
                                orgCode: lastDataList[i].orgCode,
                                itemGroupName: lastDataList[i].itemGroupName,
                                itemGroupCode: lastDataList[i].itemGroupCode,
                                itemName: lastDataList[i].itemName,
                                itemCode: lastDataList[i].itemCode,
                                itemUnit: lastDataList[i].itemUnit,
                                lastMetering: lastDataList[i].meteringValue,
                                sltMetering: null,
                                lastAnls: lastDataList[i].perfAmt,
                                sltAnls: null
                            };
                            if (lastDataList[i].itemGroupCode != itemGroupCode) {
                                itemGroupCode = angular.copy(lastDataList[i].itemGroupCode);
                                startItemGroup = i;
                                perfAnlsByOrgCodeAndPerfDate.lastAnlsSumByItemGroup = lastDataList[i].perfAmt;
                                perfAnlsByOrgCodeAndPerfDate.sltAnlsSumByItemGroup = "0";
                            } else {
                                ct.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].lastAnlsSumByItemGroup += lastDataList[i].perfAmt;
                                //ct.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].sltAnlsSumByItemGroup += 0;
                            }
                            ct.data.totalPerfAnls = "0";
                            ct.totalPerfAnlsByOrgCodeAndPerfDate.push(perfAnlsByOrgCodeAndPerfDate);

                        } else if (!lastDataList[i]) {
                            var perfAnlsByOrgCodeAndPerfDate = {
                                orgName: sltDataList[i].orgName,
                                orgCode: sltDataList[i].orgCode,
                                itemGroupName: sltDataList[i].itemGroupName,
                                itemGroupCode: sltDataList[i].itemGroupCode,
                                itemName: sltDataList[i].itemName,
                                itemCode: sltDataList[i].itemCode,
                                itemUnit: sltDataList[i].itemUnit,
                                lastMetering: null,
                                sltMetering: sltDataList[i].meteringValue,
                                lastAnls: null,
                                sltAnls: sltDataList[i].perfAmt
                            };
                            if (sltDataList[i].itemGroupCode != itemGroupCode) {
                                itemGroupCode = angular.copy(sltDataList[i].itemGroupCode);
                                startItemGroup = i;
                                perfAnlsByOrgCodeAndPerfDate.lastAnlsSumByItemGroup = "0";
                                perfAnlsByOrgCodeAndPerfDate.sltAnlsSumByItemGroup = sltDataList[i].perfAmt;
                            } else {
                                //ct.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].lastAnlsSumByItemGroup += 0;
                                ct.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].sltAnlsSumByItemGroup += sltDataList[i].perfAmt;
                            }
                            ct.data.totalPerfAnls += sltDataList[i].perfAmt;
                            ct.totalPerfAnlsByOrgCodeAndPerfDate.push(perfAnlsByOrgCodeAndPerfDate);
                        } else {
                            var perfAnlsByOrgCodeAndPerfDate = {
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
                                perfAnlsByOrgCodeAndPerfDate.lastAnlsSumByItemGroup = lastDataList[i].perfAmt;
                                perfAnlsByOrgCodeAndPerfDate.sltAnlsSumByItemGroup = sltDataList[i].perfAmt;
                            } else {
                                ct.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].lastAnlsSumByItemGroup += lastDataList[i].perfAmt;
                                ct.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].sltAnlsSumByItemGroup += sltDataList[i].perfAmt;
                            }
                            ct.data.totalPerfAnls += sltDataList[i].perfAmt;
                            ct.totalPerfAnlsByOrgCodeAndPerfDate.push(perfAnlsByOrgCodeAndPerfDate);
                        }
                    }
                }
                console.log(ct.totalPerfAnlsByOrgCodeAndPerfDate);
                $scope.main.loadingMainBody = false;
            });

            ct.fn.totalAnlsByOrgCodeAndPerfYm(paramsSlt, sltDataDefer);
            ct.fn.totalAnlsByOrgCodeAndPerfYm(paramsLast, lastDataDefer);
        };

        // 년도 변경
        ct.fn.changeSltYear = function (sltYear) {
            ct.data.sltYear = sltYear;
            ct.data.sltMonth = "";
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
            var promise = orgService.getOrg(common.getPortalOrgKey());
            promise.success(function (data) {
                console.log("Success getOrgData")

                ct.sltOrg.code = data.orgId;
                ct.sltOrg.name = data.orgName;
                // 연 list 만들기
                for (var i = ct.data.startYear; i < ct.today.getFullYear() + 1; i++) {
                    ct.perfYears.push(i);
                }

                ct.fn.listAllMeteringGroupItems();
                ct.data.sltYear = ct.today.getFullYear();
                ct.data.sltMonth = ct.today.getMonth() + 1;
                ct.fn.selectMonth(ct.data.sltMonth);
            });
            promise.error(function (data, status, headers) {
                console.log("Fail getOrgData");
            });
        };

        ct.fn.pageDataInit();
    })
;