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

        ct.data.maxRow = {};

        ct.data.sltOrg = {
            code: "",
            name: ""
        };

        ct.meteringItemGroups = [];

        ct.perfYears = [];
        ct.perfMonths = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        ct.data.sltYear = "";
        ct.data.sltMonth = "";
        ct.data.totalPerfAnlsByOrgCodeAndPerfDate = [];
        ct.data.totalPerfAnls = 0;

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

        /* 연도 리스트 */
        ct.fn.listAllMeteringYears = function () {
            var promise = perfMeteringService.listAllMeteringYears();
            promise.success(function (data) {
                console.log("Success listAllMeteringYears");
                var today = new Date();
                ct.data.sltYear = String(today.getFullYear());
                // Date() month = {0~11}
                ct.data.sltMonth = String(today.getMonth() + 1);

                ct.data.today = moment(today).format('YYYY-MM-DD');
                for (var i = 0; i < data.items.length; i++) {
                    ct.perfYears.push(data.items[i]);
                }
                ct.fn.changeSltMonth(ct.data.sltMonth);
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringYears");
                ct.perfYears = [];
            });
        };

        /* 과금 정책 페이지로 이동 */
        ct.fn.showPerfRefAmt = function (itemGroupCode) {
            $location.path('/perf/perfRefAmt').search('itemGroupCode=' + itemGroupCode);
        };

        /* rowspan 최대값 */
        ct.fn.findMaxRow = function (data) {
            var itemGroupCode = "";
            var itemCnt = 1;
            ct.data.maxRow = 0;

            for (var i = 0; i < data.itemCount; i++) {
                if (data.items[i].itemGroupCode != itemGroupCode) {
                    itemGroupCode = angular.copy(data.items[i].itemGroupCode);
                    if (ct.data.maxRow < itemCnt) {
                        ct.data.maxRow = itemCnt;
                        itemCnt = 1;
                    }
                } else {
                    itemCnt++;
                }
            }
        };

        /* page Data 초기화 함수 */
        ct.fn.pageDataInit = function () {
            $scope.main.loadingMainBody = true;
            var promise = orgService.getOrg(common.getPortalOrgKey());
            promise.success(function (data) {
                console.log("Success getOrgData")
                console.log(data.orgId + ", " + data.orgName);
                ct.data.sltOrg.code = data.orgId;
                ct.data.sltOrg.name = data.orgName;
                ct.fn.listAllMeteringYears();
                ct.fn.listAllMeteringGroupItems();
            });
            promise.error(function (data, status, headers) {
                console.log("Fail getOrgData");
            });
        };


        /* 데이터 호출 Using $q */
        ct.fn.totalAnlsByOrgCodeAndPerfYm = function (params, defer) {
            var promise = perfAnlsService.totalAnlsByOrgCodeAndPerfYm(params)
            promise.success(function (data) {
                console.log("Success get" + params.year + "_" + params.month + "perfAnls");
                ct.fn.findMaxRow(data);
                if (defer) {
                    defer.resolve(data);
                }
            });
            promise.error(function (data, status, headers) {
                console.log("Fail get" + params.year + "_" + params.month + "perfAnls");
                defer.reject(data);
            });
        };

        /* 당월 전월 데이터를 통합 */
        ct.fn.combinePerfAnlsByMonthly = function (paramsSlt, paramsLast) {
            var sltDataDefer = $q.defer();
            var lastDataDefer = $q.defer();

            var allProcessForCombineData = $q.all([sltDataDefer.promise, lastDataDefer.promise]);

            allProcessForCombineData.then(function (datas) {
                ct.data.totalPerfAnlsByOrgCodeAndPerfDate = [];
                console.log("Start Combine");
                ct.data.totalPerfAnls = 0;
                var sltData = datas[0];
                var lastData = datas[1];
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
                                ct.data.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].lastAnlsSumByItemGroup += lastDataList[i].perfAmt;
                                //ct.data.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].sltAnlsSumByItemGroup += 0;
                            }
                            ct.data.totalPerfAnls = "0";
                            ct.data.totalPerfAnlsByOrgCodeAndPerfDate.push(perfAnlsByOrgCodeAndPerfDate);

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
                                //ct.data.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].lastAnlsSumByItemGroup += 0;
                                ct.data.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].sltAnlsSumByItemGroup += sltDataList[i].perfAmt;
                            }
                            ct.data.totalPerfAnls += sltDataList[i].perfAmt;
                            ct.data.totalPerfAnlsByOrgCodeAndPerfDate.push(perfAnlsByOrgCodeAndPerfDate);
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
                                ct.data.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].lastAnlsSumByItemGroup += lastDataList[i].perfAmt;
                                ct.data.totalPerfAnlsByOrgCodeAndPerfDate[startItemGroup].sltAnlsSumByItemGroup += sltDataList[i].perfAmt;
                            }
                            ct.data.totalPerfAnls += sltDataList[i].perfAmt;
                            ct.data.totalPerfAnlsByOrgCodeAndPerfDate.push(perfAnlsByOrgCodeAndPerfDate);
                        }
                    }
                }
                console.log(ct.data.totalPerfAnlsByOrgCodeAndPerfDate);
                $scope.main.loadingMainBody = false;
            });

            ct.fn.totalAnlsByOrgCodeAndPerfYm(paramsSlt, sltDataDefer);
            ct.fn.totalAnlsByOrgCodeAndPerfYm(paramsLast, lastDataDefer);
        };

        /* 년도 변경 */
        ct.fn.changeSltYear = function (sltYear) {
            ct.data.sltMonth = "";
            console.log("year: " + ct.data.sltYear + " month: " + ct.data.sltMonth);
        };

        /* 전년 set */
        ct.fn.calcLastMonth = function (sltYear, sltMonth) {
            var last = {
                year: sltYear,
                month: ""
            };
            if (sltMonth == 1) {
                last.year = sltYear - 1;
                last.month = 12;
            } else {
                last.month = sltMonth - 1;
            }
            return last;
        };

        /* 데이터 요청 */
        ct.fn.changeSltMonth = function (sltMonth) {
            $scope.main.loadingMainBody = true;

            var paramsSlt = {
                urlPaths: {
                    "orgCode": ct.data.sltOrg.code
                },
                "year": ct.data.sltYear,
                "month": ct.data.sltMonth
            };

            var lastPerfYm = ct.fn.calcLastMonth(ct.data.sltYear, sltMonth);
            var paramsLast = {
                urlPaths: {
                    "orgCode": ct.data.sltOrg.code
                },
                "year": lastPerfYm.year,
                "month": lastPerfYm.month
            };


            ct.fn.combinePerfAnlsByMonthly(paramsSlt, paramsLast);
        };

        ct.fn.pageDataInit();
    })
;