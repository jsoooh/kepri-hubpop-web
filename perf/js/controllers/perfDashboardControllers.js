'use strict';

angular.module('perf.controllers')
    .controller('perfDashboardCtrl', function ($scope, $location, $state, $stateParams, $translate, $q, $timeout, $interval, $filter, common, perfMeteringService, perfAnlsService, perfCommService, CONSTANTS) {
        _DebugConsoleLog("perfDashboardControllers.js : perfDashboardCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};

        ct.data.sltOrgCode = $scope.main.sltPortalOrg.orgId;
        console.log("orgCode: "+ct.data.sltOrgCode);

        ct.meteringItemGroups = [];
        ct.meteringItems = [];
        ct.data.sltItemGroupCode = "";

        ct.today = new Date();
        ct.data.sltYear = "";
        ct.data.sltMonth = "";
        ct.dashYears = [];
        ct.dashMonths = perfCommService.listPerfMonth(ct.today.getFullYear());
        ct.dashDays = [""];

        ct.anlsByItemGroupLists = [];
        ct.anlsByItemLists = [];
        ct.anlsMonthlySummaryLists = [];
        ct.anlsDailySummaryLists = [];

        /* 미터링 서비스 그룹 리스트 */
        ct.fn.listAllMeteringGroupItems = function () {
            var promise = perfMeteringService.listAllMeteringGroupItems();
            promise.success(function (data) {
                if (angular.isArray(data.items)) {
                    ct.meteringItemGroups = data.items;
                    if (ct.meteringItemGroups.length > 0 && angular.isUndefined(ct.data.sltItemGroupCode) || ct.data.sltItemGroupCode == "") {
                        ct.data.sltItemGroupCode = ct.meteringItemGroups[0].itemGroupCode;
                    }
                } else {
                    ct.meteringItemGroups = [];
                }
            });
            promise.error(function (data, status, headers) {
                ct.meteringItemGroups = [];
            });
        };

        ct.fn.initYearMonth = function() {
            // 연도 리스트 구성
            for (var i = ct.scope.CONSTANTS.startYear; i < ct.today.getFullYear() + 1; i++) {
                ct.dashYears.push(i);
            }
            ct.data.sltYear = ct.today.getFullYear();
            ct.data.sltMonth = ct.today.getMonth() + 1;
            ct.data.prevSltYear = ct.data.sltYear;

            // 월별 추이
            ct.fn.listAnlsMonthlySummaryByOrg(ct.data.sltYear);

            // 전체 사용 금액, 일별 추이, 서비스별, 서비스 항목별
            ct.fn.changeMeteringMonth(ct.data.sltMonth);
        };

        ct.fn.initDrawChart = function() {
            // By ItemGroup
            ct.itemGroupChart = {
                container: document.getElementById('itemGroup-anls-chart'),
                data: {
                    categories: "ByItemGroup",
                    series: [
                        {
                            name: " ",
                            data: 0
                        }
                    ]
                },
                option: {
                    chart: {
                        width: 450,
                        height: 400,
                        format: '1,000'
                    },
                    series: {
                        radiusRange: ['40%', '100%'],
                        showLabel: false
                    },
                    tooltip: {
                        suffix: '원'
                    },
                    legend: {
                        showCheckbox: false
                    }
                },
                instance: null
            };

            // By Item
            ct.itemChart = {
                container: document.getElementById('item-anls-chart'),
                data: {
                    categories: "ByItem",
                    series: [
                        {
                            name: " ",
                            data: 0
                        }
                    ]
                },
                option: {
                    chart: {
                        width: 450,
                        height: 400,
                        format: '1,000'
                    },
                    series: {
                        radiusRange: ['40%', '100%'],
                        showLabel: false
                    },
                    tooltip: {
                        suffix: '원'
                    },
                    legend: {
                        showCheckbox: false
                    }
                },
                instance: null
            };

            // Daily
            ct.dailyChart = {
                container: document.getElementById('daily-anls-chart'),
                data: {
                    categories: ct.dashDays,
                    series: null
                },
                option: {
                    chart: {
                        width: 1450,
                        height: 500,
                        format: '1,000',
                        title: 'Daily Performance',
                    },
                    yAxis: {
                        title: '원',
                        min: 1
                    },
                    xAxis: {
                        title: 'Day',
                        suffix: '일'
                    },
                    legend: {
                        visible: false
                    }
                },
                instance: null
            };

            // Monthly
            ct.monthlyChart = {
                container: document.getElementById('monthly-anls-chart'),
                data: {
                    categories: ct.dashMonths,
                    series: null
                },
                option: {
                    chart: {
                        width: 1450,
                        height: 500,
                        format: '1,000',
                        title: 'Monthly Performance',
                    },
                    yAxis: {
                        title: '원',
                        min: 1
                    },
                    xAxis: {
                        title: 'Month',
                        suffix: '월'
                    },
                    legend: {
                        visible: false
                    }
                },
                instance: null
            };

            ct.dailyChart.instance = tui.chart.columnChart(ct.dailyChart.container, ct.dailyChart.data, ct.dailyChart.option);
            ct.monthlyChart.instance = tui.chart.columnChart(ct.monthlyChart.container, ct.monthlyChart.data, ct.monthlyChart.option);
            ct.itemGroupChart.instance = tui.chart.pieChart(ct.itemGroupChart.container, ct.itemGroupChart.data, ct.itemGroupChart.option);
            ct.itemChart.instance = tui.chart.pieChart(ct.itemChart.container, ct.itemChart.data, ct.itemChart.option);
        };

        /* 전체 사용 금액 */
        /**
         * HUBPOP_INT_PER_ANS_01 - 전체 사용 금액
         * @param sltYear
         * @param sltMonth
         */
        /* 전년, 전월 계산 */
        ct.fn.lastSumTotalPerfAnlsByOrg = function(sltYear, sltMonth) {
            ct.lastSumLoading = true;

            ct.data.sltYear = sltYear;
            ct.data.sltMonth = sltMonth;

            var firstDayOfMonth = new Date(sltYear, sltMonth-1, 1);
            var lastMonth = new Date(firstDayOfMonth.setDate(firstDayOfMonth.getDate() - 1));
            ct.data.lastYear = lastMonth.getFullYear();
            ct.data.lastMonth = lastMonth.getMonth() + 1;

            var params = {
                "urlPaths": {
                    "orgCode": ct.data.sltOrgCode
                },
                "year": ct.data.lastYear,
                "month": ct.data.lastMonth
            };
            var promise = perfAnlsService.sumTotalAnlsByOrg(params);
            promise.success(function (data) {
                if(data.itemCount > 0) {
                    console.log("perfTotalAmt: "+data.items[0].perfTotalAmt);
                    ct.data.lastSumPerfAmt = data.items[0].perfTotalAmt;
                } else {
                    ct.data.lastSumPerfAmt = 0;
                }

                ct.lastSumLoading = false;
                console.log("lastPerfTotalAmt: "+ct.data.lastSumPerfAmt);
            });
            promise.error(function (data) {
                ct.data.lastSumPerfAmt = [];

                ct.lastSumLoading = false;
            });
        };
        /* 후년, 후월 계산 */
        ct.fn.nextSumTotalPerfAnlsByOrg = function(sltYear, sltMonth) {
            ct.nextSumLoading = true;

            ct.data.sltYear = sltYear;
            ct.data.sltMonth = sltMonth;

            var lastDayOfMonth = (new Date(sltYear, sltMonth, 0));
            var nextMonth = new Date(lastDayOfMonth.setDate(lastDayOfMonth.getDate() + 1));
            ct.data.nextYear = nextMonth.getFullYear();
            ct.data.nextMonth = nextMonth.getMonth() + 1;

            var params = {
                "urlPaths": {
                    "orgCode": ct.data.sltOrgCode
                },
                "year": ct.data.nextYear,
                "month": ct.data.nextMonth
            };
            var promise = perfAnlsService.sumTotalAnlsByOrg(params);
            promise.success(function (data) {
                if(data.itemCount > 0) {
                    console.log("perfTotalAmt: "+data.items[0].perfTotalAmt);
                    ct.data.nextSumPerfAmt = data.items[0].perfTotalAmt;
                } else if(!ct.isToday) {
                    ct.data.nextSumPerfAmt = 0;
                }

                ct.nextSumLoading = false;

                console.log("lastPerfTotalAmt: "+ct.data.nextSumPerfAmt);
            });
            promise.error(function (data) {
                ct.data.nextSumPerfAmt = [];

                ct.nextSumLoading = false;
            });

            console.log("nextPerfTotalAmt: "+ct.data.nextSumPerfAmt);
        };

        /* 사용 금액 월별 추이 */
        /**
         * HUBPOP_INT_PER_ANS_01 - 사용 금액 월별 추이
         * @param sltYear
         */
        ct.fn.listAnlsMonthlySummaryByOrg = function(sltYear) {
            ct.dailyChart.loading = true;

            ct.data.sltYear = sltYear;
            var params = {
                "urlPaths": {
                    "orgCode": ct.data.sltOrgCode
                },
                "year": ct.data.sltYear
            };
            var promise = perfAnlsService.listAnlsMonthlySummaryByOrg(params);
            promise.success(function (data) {
                ct.anlsMonthlySummaryLists = data.items;
                var monthlySummaryValues = [];
                var anlsMonthlySummaryListsToChartData = [];

                var dataIndex = 0;
                var monthlySumPerf = 0;
                for (var month = 1; month <= 12; month++) {
                    if(dataIndex < data.itemCount) {
                        var perfMonth = Number(data.items[dataIndex].perfYm.slice(4, 6));
                    }
                    if (perfMonth == month) {
                        var perfAmt = data.items[dataIndex].perfAmt;
                        monthlySummaryValues[month-1] = perfAmt;
                        dataIndex++;
                        monthlySumPerf += perfAmt;
                    } else {
                        monthlySummaryValues[month-1] = "";
                    }
                }
                ct.data.sltMonthlySumPerfAmt = monthlySumPerf;

                anlsMonthlySummaryListsToChartData.push({
                    name: String(sltYear),
                    data: monthlySummaryValues
                });

                ct.monthlyChart.data = {
                    categories: ct.dashMonths,
                    series: anlsMonthlySummaryListsToChartData
                };

                console.log("monthlyChartData");
                console.log(ct.monthlyChart.data);
                ct.fn.redrawChart(ct.monthlyChart);

                ct.dailyChart.loading = false;
            });
            promise.error(function (data) {
                ct.anlsMonthlySummaryLists = [];

                ct.dailyChart.loading = false;
            });
        };

        /* 사용 금액 일별 추이 */
        /**
         * HUBPOP_INT_PER_ANS_01 - 사용 금액 일별 추이
         * @param sltYear
         * @param sltMonth
         */
        ct.fn.listAnlsDailySummaryByOrg = function(sltYear, sltMonth) {
            ct.dailyChart.loading = true;

            ct.data.sltSumPerfAmt = null;
            var sltParams = {
                "urlPaths": {
                    "orgCode": ct.data.sltOrgCode
                },
                "year": sltYear,
                "month": sltMonth
            };
            var promise = perfAnlsService.listAnlsDailySummaryByOrg(sltParams);
            promise.success(function (data) {
                ct.anlsDailySummaryLists = data.items;

                var dailySummaryValues = [];
                var anlsDailySummaryListsToChartData = [];

                var sltDay = ct.today.getDate();
                var lastDay = new Date(ct.data.sltYear, ct.data.sltMonth, 0).getDate();

                var dataIndex = 0;
                var sumPerfAmt = 0;
                for (var day = 1; day <= lastDay; day++) {
                    if(dataIndex < data.itemCount) {
                        var perfDay = Number(data.items[dataIndex].perfYmd.slice(6, 8));
                    }
                    if (perfDay == day) {
                        var perfAmt = data.items[dataIndex].perfAmt;
                        dailySummaryValues[day-1] = perfAmt;
                        sumPerfAmt += perfAmt;
                        dataIndex++;
                    } else {
                        dailySummaryValues[day-1] = "";
                    }
                }

                ct.data.sltSumPerfAmt = sumPerfAmt;
                if(ct.isToday) {
                    ct.data.nextSumPerfAmt = ct.data.sltSumPerfAmt + (ct.data.sltSumPerfAmt / sltDay) * (lastDay - sltDay);
                }

                anlsDailySummaryListsToChartData.push({
                    name: String(sltMonth),
                    data: dailySummaryValues
                });

                ct.dailyChart.data = {
                    categories: ct.dashDays,
                    series: anlsDailySummaryListsToChartData
                };

                console.log("dailyChartData");
                console.log(ct.dailyChart.data);
                ct.fn.redrawChart(ct.dailyChart);

                ct.dailyChart.loading = false;
            });
            promise.error(function (data) {
                ct.anlsDailySummaryLists = [];

                ct.dailyChart.loading = false;
            });
        };

        /* 서비스별 사용 금액 */
        /**
         * HUBPOP_INT_PER_ANS_01 - 아이템그룹별 사용 금액
         * @param sltYear
         * @param sltMonth
         */
        ct.fn.listAnlsByItemGroup = function (sltYear, sltMonth) {
            ct.itemGroupChart.loading = true;

            var params = {
                "urlPaths": {
                    "orgCode": ct.data.sltOrgCode
                },
                "year": sltYear,
                "month": sltMonth
            };
            var promise = perfAnlsService.listAnlsTotalByOrgAndItemGroup(params);
            promise.success(function (data) {
                console.log("Success listAnlsTotalByOrgAndItemGroup");
                console.log(data);
                if(angular.isArray(data.items)) {
                    ct.anlsByItemGroupLists = data.items;
                    var anlsByItemGroupListsToChartData = [];
                    if(data.itemCount > 0) {
                        ct.data.sltItemGroupCode = ct.anlsByItemGroupLists[0].itemGroupCode;
                        for(var i=0; i<data.itemCount; i++) {
                            anlsByItemGroupListsToChartData.push({
                                name: ct.anlsByItemGroupLists[i].itemGroupName,
                                data: ct.anlsByItemGroupLists[i].perfAmt
                            });
                        }
                    }

                    ct.itemGroupChart.data = {
                        series: anlsByItemGroupListsToChartData
                    };

                    console.log("itemGroupChartData");
                    console.log(ct.itemGroupChart.data);

                    ct.fn.redrawChart(ct.itemGroupChart);
                }

                ct.itemGroupChart.loading = false;
            });
            promise.error(function (data, status, header) {
                console.log("Fail listAnlsTotalByOrgAndItemGroup");
                ct.anlsByItemGroupLists = [];

                ct.itemGroupChart.loading = false;
            });
        };

        /* 서비스 항목별 사용 금액 */
        /**
         * HUBPOP_INT_PER_ANS_01 - 아이템별 사용 금액
         * @param sltYear
         * @param sltMonth
         */
        ct.fn.listAnlsByItem = function (sltYear, sltMonth) {
            ct.itemChart.loading = true;

            var params = {
                "urlPaths": {
                    "orgCode": ct.data.sltOrgCode
                },
                "year": sltYear,
                "month": sltMonth
            };
            var promise = perfAnlsService.listAnlsTotalByOrgAndItem(params);
            promise.success(function (data) {
                console.log("Success listAnlsTotalByOrgAndItem");
                console.log(data);
                if(angular.isArray(data.items)) {
                    ct.anlsByItemLists = data.items;

                    var anlsByItemListsToChartData = ct.fn.makeItemChartData(ct.anlsByItemLists);

                    ct.itemChart.data = {
                        series: anlsByItemListsToChartData
                    };

                    console.log("itemChartData");
                    console.log(ct.itemChart.data);

                    ct.fn.redrawChart(ct.itemChart);

                    ct.itemChart.loading = false;
                }
            });
            promise.error(function (data, status, header) {
                console.log("Fail listAnlsTotalByOrgAndItem");
                ct.anlsByItemLists = [];

                ct.itemChart.loading = false;
            });
        };
        /* itemChartData 구성 */
        ct.fn.makeItemChartData = function(data) {
            var anlsByItemListsToChartData = [];
            var dataCnt = 0;
            var nonEtcDataCnt = 0;
            var sumEtcData = 0;
            var limit = 10;
            var endIdx = 0;
            for(var i=0; i<data.length; i++) {
                if(data[i].itemGroupCode == ct.data.sltItemGroupCode) {
                    dataCnt++;
                    if(dataCnt < limit) {
                        anlsByItemListsToChartData.push({
                            name: data[i].itemName,
                            data: data[i].perfAmt
                        });
                        nonEtcDataCnt++;
                    } else {
                        sumEtcData += data[i].perfAmt;
                    }
                    endIdx = i;
                }
            }
            if(sumEtcData > 0 && nonEtcDataCnt + 1 == dataCnt) {
                anlsByItemListsToChartData.push({
                    name: data[endIdx].itemName,
                    data: data[endIdx].perfAmt
                });
            } else if(sumEtcData > 0) {
                anlsByItemListsToChartData.push({
                    name: 'etc.',
                    data: sumEtcData
                });
            }

            return anlsByItemListsToChartData;
        };

        // 년월에 따른 day 배열 생성
        ct.fn.configDayArray = function (year, month) {
            var lastDay = (new Date(year, month, 0)).getDate();
            ct.dashDays = [];
            for (var i = 1; i <= lastDay; i++) {
                ct.dashDays.push(i);
            }
        };

        /* columnChart 옵션 초기화 */
        ct.fn.setColumnOption = function() {
            ct.columnOptions = [
                {
                    'value': 'daily',
                    'label': '일별추이'
                },
                {
                    'value': 'monthly',
                    'label': '월별추이'
                }
            ];
            if(angular.isUndefined(ct.data.sltColumnOption) || ct.data.sltColumnOption == "") {
                ct.data.sltColumnOption = ct.columnOptions[0].value;
            }
        };

        /* 서비스(ItemGroup) 변경 - 서비스 항목별 */
        ct.fn.changeMeteringItemsByItemGroupCode = function(sltItemGroupCode) {
            ct.data.sltItemGroupCode = sltItemGroupCode;
            if(ct.anlsByItemLists.length > 0) {
                var anlsByItemListsToChartData = [];

                anlsByItemListsToChartData = ct.fn.makeItemChartData(ct.anlsByItemLists);

                ct.itemChart.data = {
                    series: anlsByItemListsToChartData
                };

                console.log("changedItemChartData");
                console.log(ct.itemChart.data);

                ct.fn.redrawChart(ct.itemChart);
            }
        };
        /* 연도 변경 - 사용 금액 현황 월별 */
        ct.fn.changeMeteringYear = function(sltYear) {
            ct.data.sltYear = sltYear;
            ct.dashMonths = perfCommService.listPerfMonth(ct.data.sltYear);
            ct.data.sltMonth = perfCommService.monthWhenChangeYear(ct.data.prevSltYear, ct.data.sltYear);

            perfCommService.chartLoadingOn(ct.monthlyChart);

            ct.data.prevSltYear = ct.data.sltYear;

            ct.fn.listAnlsMonthlySummaryByOrg(ct.data.sltYear);
            ct.fn.changeMeteringMonth(ct.data.sltMonth);
        };
        /* 월 변경 - 전체 사용 금액, 서비스별, 서비스 항목별, 사용 금액 현황 일별 */
        ct.fn.changeMeteringMonth = function(sltMonth) {
            ct.data.sltMonth = sltMonth;

            perfCommService.chartLoadingOn(ct.itemChart);
            perfCommService.chartLoadingOn(ct.itemGroupChart);
            perfCommService.chartLoadingOn(ct.dailyChart);

            if(ct.data.sltYear == ct.today.getFullYear() && ct.data.sltMonth == ct.today.getMonth() + 1) {
                ct.isToday = true;
            } else {
                ct.isToday = false;
            }

            // 전체 사용 금액
            ct.fn.lastSumTotalPerfAnlsByOrg(ct.data.sltYear, ct.data.sltMonth);
            ct.fn.nextSumTotalPerfAnlsByOrg(ct.data.sltYear, ct.data.sltMonth);

            ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
            ct.data.sltColumnOption = "daily";

            ct.fn.listAnlsDailySummaryByOrg(ct.data.sltYear, ct.data.sltMonth);
            ct.fn.listAnlsByItemGroup(ct.data.sltYear, ct.data.sltMonth);
            ct.fn.listAnlsByItem(ct.data.sltYear, ct.data.sltMonth);
        };
        /* 일별, 월별 조건 변경 - 사용 금액 현황 */
        ct.fn.changeColumnOption = function(sltColumnOption) {
            if(sltColumnOption == "daily") {
                ct.fn.redrawChart(ct.dailyChart);
            } else if(sltColumnOption == "monthly") {
                ct.fn.redrawChart(ct.monthlyChart);
            }
        };

        // Data 변경시 Chart rerender
        ct.fn.redrawChart = function (chart) {
            chart.instance.setData(chart.data);
            chart.instance.rerender();
        };

        ct.fn.initDrawChart();
        ct.fn.setColumnOption();
        ct.fn.listAllMeteringGroupItems();
        ct.fn.initYearMonth();
    })
;