'use strict';

angular.module('perf.controllers')
    .controller('perfDashboardCtrl', function ($scope, $location, $state, $stateParams, $translate, $q, $timeout, $interval, $filter, common, perfMeteringService, perfAnlsService, orgService, CONSTANTS) {
        _DebugConsoleLog("perfDashboardControllers.js : perfDashboardCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};

        ct.data.sltOrgCode = common.getTeamCode();
        console.log("orgCode: "+ct.data.sltOrgCode);

        ct.meteringItemGroups = [];
        ct.meteringItems = [];
        ct.data.sltItemGroup = "";
        ct.data.sltItemGroupCode = "";

        ct.data.today = new Date();
        ct.data.sltYear = "";
        ct.data.sltMonth = "";
        ct.dashYears = [];
        ct.dashMonths = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        ct.dashDays = [""];

        ct.anlsByItemGroupLists = [];
        ct.anlsByItemGroupListsToChartData = [];
        ct.anlsByItemLists = [];
        ct.anlsByItemListsToChartData = [];

        ct.anlsMonthlySummaryLists = [];
        ct.anlsMonthlySummaryListsToChartData = [];
        ct.anlsDailySummaryLists = [];
        ct.anlsDailySummaryListsToChartData = [];

        ct.data.sltSumPerfAmt = "";
        ct.data.lastSumPerfAmt = "";
        ct.data.nextSumPerfAmt = "";

        /* 미터링 서비스 그룹 리스트 */
        ct.fn.listAllMeteringGroupItems = function (defer) {
            var promise = perfMeteringService.listAllMeteringGroupItems();
            promise.success(function (data) {
                if (angular.isArray(data.items)) {
                    ct.meteringItemGroups = data.items;
                    if (ct.meteringItemGroups.length > 0 && angular.isUndefined(ct.data.sltItemGroupCode) || ct.data.sltItemGroupCode == "") {
                        ct.data.sltItemGroup = angular.copy(ct.meteringItemGroups[0]);
                        ct.data.sltItemGroupCode = ct.data.sltItemGroup.itemGroupCode;
                    }
                    defer.resolve();
                } else {
                    ct.meteringItemGroups = [];
                }
            });
            promise.error(function (data, status, headers) {
                ct.meteringItemGroups = [];
            });
        };

        /* 년도 리스트 */
        ct.fn.listAllMeteringYears = function (defer) {
            var promise = perfMeteringService.listAllMeteringYears();
            promise.success(function (data) {
                console.log("Success listAllMeteringYears");
                ct.data.sltYear = data.items[0];
                ct.dashYears = angular.copy(data.items);

                if(ct.dashYears.length > 0 && (angular.isUndefined(ct.data.sltYear) || ct.data.sltYear == "")) {
                    ct.data.sltYear = String(ct.data.today.getFullYear());
                }
                if(angular.isUndefined(ct.data.sltMonth) || ct.data.sltMonth == "") {
                    ct.data.sltMonth = String(ct.data.today.getMonth() + 1);
                }

                var paramValues = ct.fn.setLastYearMonth(ct.data.sltYear, ct.data.sltMonth);
                ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);

                defer.resolve(paramValues);
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringYears");
                ct.dashYears = [];
            });
        };

        // 년월에 따른 day 배열 생성
        ct.fn.configDayArray = function (year, month) {
            var lastDay = (new Date(year, month, 0)).getDate();
            ct.dashDays = [];
            for (var i = 1; i <= lastDay; i++) {
                ct.dashDays.push(i);
            }
        };
        // 전년도, 전월 설정
        ct.fn.setLastYearMonth = function(sltYear, sltMonth) {
            if(sltMonth == 1) {
                ct.data.lastYear = String(sltYear - 1);
                ct.data.lastMonth = "12";
            } else {
                ct.data.lastYear = String(sltYear);
                ct.data.lastMonth = String(sltMonth - 1);
            }

            var paramValues = {
                "orgCode": ct.data.sltOrgCode,
                "sltYear": ct.data.sltYear,
                "sltMonth": ct.data.sltMonth,
                "lastYear": ct.data.lastYear,
                "lastMonth": ct.data.lastMonth
            };
            return paramValues
        };

        // variables for itemGroup Chart
        ct.itemGroupChart = {
            switch: false,
            container: document.getElementById('itemGroup-anls-chart'),
            data: {},
            option: {
                chart: {
                    width: 450,
                    height: 450,
                    format: '1,000'
                },
                series: {
                    radiusRange: ['40%', '100%'],
                    showLabel: true
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

        // variables for itemByItemGroup Chart
        ct.itemChart = {
            switch: false,
            container: document.getElementById('item-anls-chart'),
            data: {},
            option: {
                chart: {
                    width: 450,
                    height: 450,
                    format: '1,000'
                },
                series: {
                    radiusRange: ['40%', '100%'],
                    showLabel: true
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

        ct.fn.initDrawChart = function(defer) {
            /*// By ItemGroup
            ct.itemGroupChart = {
                container: document.getElementById('itemGroup-anls-chart'),
                data: {
                    series: null
                },
                option: {
                    chart: {
                        width: 450,
                        height: 450,
                        format: '1,000'
                    },
                    series: {
                        radiusRange: ['40%', '100%'],
                        showLabel: true
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
                    series: null
                },
                option: {
                    chart: {
                        width: 450,
                        height: 450,
                        format: '1,000'
                    },
                    series: {
                        radiusRange: ['40%', '100%'],
                        showLabel: true
                    },
                    tooltip: {
                        suffix: '원'
                    },
                    legend: {
                        showCheckbox: false
                    }
                },
                instance: null
            };*/
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
                        format: '1,000'
                    },
                    yAxis: {
                        title: '원',
                        min: 1
                    },
                    xAxis: {
                        title: 'Day'
                    },
                    legend: {
                        align: 'top',
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
                        format: '1,000'
                    },
                    yAxis: {
                        title: '원',
                        min: 1
                    },
                    xAxis: {
                        title: 'Month'
                    },
                    legend: {
                        align: 'top',
                        visible: false
                    }
                },
                instance: null
            };

            ct.dailyChart.instance = tui.chart.columnChart(ct.dailyChart.container, ct.dailyChart.data, ct.dailyChart.option);
            ct.monthlyChart.instance = tui.chart.columnChart(ct.monthlyChart.container, ct.monthlyChart.data, ct.monthlyChart.option);
            // ct.itemGroupChart.instance = tui.chart.pieChart(ct.itemGroupChart.container, ct.itemGroupChart.data, ct.itemGroupChart.option);
            // ct.itemChart.instance = tui.chart.pieChart(ct.itemChart.container, ct.itemChart.data, ct.itemChart.option);
            defer.resolve();
        }

        /* 사용 금액 월별 추이 */
        ct.fn.listAnlsMonthlySummaryByOrg = function(paramValues) {
            var params = {
                "urlPaths": {
                    "orgCode": paramValues.orgCode
                },
                "year": paramValues.sltYear,
                "month": paramValues.sltMonth
            };
            var promise = perfAnlsService.listAnlsMonthlySummaryByOrg(params);
            promise.success(function (data) {
                ct.anlsMonthlySummaryLists = data.items[0];

                var monthlySummaryValues = [];
                ct.anlsMonthlySummaryListsToChartData = [];
                if(data.itemCount > 0) {
                    var key = "";
                    for(var i=1; i<=12; i++) {
                        if (i < 10) {
                            key = "mv0" + i;
                        } else {
                            key = "mv" + i;
                        }
                        monthlySummaryValues[i-1] = ct.anlsMonthlySummaryLists[key];
                    }
                }

                ct.anlsMonthlySummaryListsToChartData.push({
                    name: ct.data.sltYear,
                    data: monthlySummaryValues
                });

                ct.monthlyChart.data = {
                    categories: ct.dashMonths,
                    series: angular.copy(ct.anlsMonthlySummaryListsToChartData)
                };

                console.log("monthlyChartData");
                console.log(ct.monthlyChart.data);
                ct.fn.redrawChart(ct.monthlyChart);
            });
        };

        /* 사용 금액 일별 추이 */
        ct.fn.listAnlsDailySummaryByOrg = function(paramValues) {
            var sltParams = {
                "urlPaths": {
                    "orgCode": paramValues.orgCode
                },
                "year": paramValues.sltYear,
                "month": paramValues.sltMonth
            };
            var promise = perfAnlsService.listAnlsDailySummaryByOrg(sltParams);
            promise.success(function (data) {
                ct.anlsDailySummaryLists = data.items[0];

                var sltDay = ct.data.today.getDate();
                var lastDay = new Date(ct.data.sltYear, ct.data.sltMonth, 0).getDate();
                if(angular.isUndefined(ct.data.sltSumPerfAmt) || ct.data.sltSumPerfAmt == "") {
                    ct.data.sltSumPerfAmt = ct.anlsDailySummaryLists.sumPerfAmt;
                    ct.data.nextSumPerfAmt = ct.data.sltSumPerfAmt + (ct.data.sltSumPerfAmt / sltDay) * (lastDay - sltDay);
                }

                var dailySummaryValues = [];
                ct.anlsDailySummaryListsToChartData = [];
                if(data.itemCount > 0) {
                    var key = "";
                    for(var i=1; i<=lastDay; i++) {
                        if (i < 10) {
                            key = "dv0" + i;
                        } else {
                            key = "dv" + i;
                        }
                        if(ct.anlsDailySummaryLists.hasOwnProperty(key)) {
                            if(ct.data.today.getFullYear() == ct.data.sltYear && ct.data.today.getMonth() + 1 == ct.data.sltMonth) {
                                if(i > ct.data.today.getDate()) {
                                    dailySummaryValues[i-1] = "";
                                    continue;
                                }
                            }
                            dailySummaryValues[i-1] = ct.anlsDailySummaryLists[key];
                        }
                    }
                }

                ct.anlsDailySummaryListsToChartData.push({
                    name: ct.data.sltMonth,
                    data: dailySummaryValues
                });

                ct.dailyChart.data = {
                    categories: ct.dashDays,
                    series: angular.copy(ct.anlsDailySummaryListsToChartData)
                };

                console.log("dailyChartData");
                console.log(ct.dailyChart.data);
                ct.fn.redrawChart(ct.dailyChart);
            });

            /* 지난달 사용 금액 */
            if(angular.isUndefined(ct.data.lastSumPerfAmt) || ct.data.lastSumPerfAmt == "") {
                var lastParams = {
                    "urlPaths": {
                        "orgCode": paramValues.orgCode
                    },
                    "year": paramValues.lastYear,
                    "month": paramValues.lastMonth
                };
                var promise = perfAnlsService.listAnlsDailySummaryByOrg(lastParams);
                promise.success(function (data) {
                    if(angular.isArray(data.items)) {
                        ct.data.lastSumPerfAmt = data.items[0].sumPerfAmt;
                    }
                });
            }
        };

        /* 서비스별 사용 금액 */
        ct.fn.listAnlsByItemGroup = function (paramValues) {
            $scope.main.loadingMainBody = true;

            var params = {
                "urlPaths": {
                    "orgCode": paramValues.orgCode
                },
                "year": paramValues.sltYear,
                "month": paramValues.sltMonth
            };
            var promise = perfAnlsService.listAnlsTotalByOrgAndItemGroup(params);
            promise.success(function (data) {
                console.log("Success listAnlsTotalByOrgAndItemGroup");
                console.log(data);
                if(angular.isArray(data.items)) {
                    ct.anlsByItemGroupLists = data.items;
                    ct.anlsByItemGroupListsToChartData = [];
                    if(data.itemCount > 0) {
                        ct.data.sltItemGroupCode = ct.anlsByItemGroupLists[0].itemGroupCode;
                        for(var i=0; i<data.itemCount; i++) {
                            ct.anlsByItemGroupListsToChartData.push({
                                name: ct.anlsByItemGroupLists[i].itemGroupName,
                                data: ct.anlsByItemGroupLists[i].perfAmt
                            });
                        }
                    }

                    ct.itemGroupChart.data = {
                        series: angular.copy(ct.anlsByItemGroupListsToChartData)
                    };

                    console.log("itemGroupChartData");
                    console.log(ct.itemGroupChart.data);

                    if(!ct.itemGroupChart.switch) {
                        ct.itemGroupChart.switch = true;
                        ct.itemGroupChart.instance = tui.chart.pieChart(ct.itemGroupChart.container, ct.itemGroupChart.data, ct.itemGroupChart.option);
                    } else {
                        ct.fn.redrawChart(ct.itemGroupChart);
                    }
                }

                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, header) {
                console.log("Fail listAnlsTotalByOrgAndItemGroup");
                ct.anlsByItemGroupLists = [];
                ct.anlsByItemGroupListsToChartData = [];

                $scope.main.loadingMainBody = false;
            });
        };

        /* 서비스 항목별 사용 금액 */
        ct.fn.listAnlsByItem = function (paramValues) {
            $scope.main.loadingMainBody = true;

            var params = {
                "urlPaths": {
                    "orgCode": paramValues.orgCode
                },
                "year": paramValues.sltYear,
                "month": paramValues.sltMonth
            };
            var promise = perfAnlsService.listAnlsTotalByOrgAndItem(params);
            promise.success(function (data) {
                console.log("Success listAnlsTotalByOrgAndItem");
                console.log(data);
                if(angular.isArray(data.items)) {
                    ct.anlsByItemLists = data.items;
                    ct.anlsByItemListsToChartData = [];
                    for(var i=0; i<data.itemCount; i++) {
                        if(ct.anlsByItemLists[i].itemGroupCode == ct.data.sltItemGroupCode) {
                            ct.anlsByItemListsToChartData.push({
                                name: ct.anlsByItemLists[i].itemName,
                                data: ct.anlsByItemLists[i].perfAmt
                            });
                        }
                    }
                    ct.itemChart.data = {
                        series: angular.copy(ct.anlsByItemListsToChartData)
                    };

                    console.log("itemChartData");
                    console.log(ct.itemChart.data);

                    if(!ct.itemChart.switch) {
                        ct.itemChart.switch = true;
                        ct.itemChart.instance = tui.chart.pieChart(ct.itemChart.container, ct.itemChart.data, ct.itemChart.option);
                    } else {
                        ct.fn.redrawChart(ct.itemChart);
                    }
                }

                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, header) {
                console.log("Fail listAnlsTotalByOrgAndItem");
                ct.anlsByItemLists = [];
                ct.anlsByItemListsToChartData = [];

                $scope.main.loadingMainBody = false;
            });
        };

        // Data 변경시 Chart rerender
        ct.fn.redrawChart = function (chart) {
            chart.instance.setData(chart.data);
            chart.instance.rerender();
        };

        /* columnChart 옵션 초기화 */
        ct.fn.setColumnOption = function(defer) {
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

            defer.resolve();
        };

        /* 서비스(ItemGroup) 변경 - 서비스 항목별 */
        ct.fn.changeMeteringItemsByItemGroupCode = function(sltItemGroupCode) {
            ct.data.sltItemGroupCode = sltItemGroupCode;
            if(ct.anlsByItemLists.length > 0) {
                ct.anlsByItemListsToChartData = [];
                for(var i=0; i<ct.anlsByItemLists.length; i++) {
                    if(ct.anlsByItemLists[i].itemGroupCode == ct.data.sltItemGroupCode) {
                        ct.anlsByItemListsToChartData.push({
                            name: ct.anlsByItemLists[i].itemName,
                            data: ct.anlsByItemLists[i].perfAmt
                        });
                    }
                }
                ct.itemChart.data = {
                    series: angular.copy(ct.anlsByItemListsToChartData)
                };

                console.log("changedItemChartData");
                console.log(ct.itemChart.data);

                if(!ct.itemChart.switch) {
                    ct.itemChart.switch = true;
                    ct.itemChart.instance = tui.chart.pieChart(ct.itemChart.container, ct.itemChart.data, ct.itemChart.option);
                } else {
                    ct.fn.redrawChart(ct.itemChart);
                }
            }
        }
        /* 연도 변경 - 사용 금액 현황 월별 */
        ct.fn.changeMeteringYear = function(sltYear) {
            ct.data.sltYear = String(sltYear);
            ct.data.sltMonth = "";
            var paramValues = ct.fn.setLastYearMonth(ct.data.sltYear, ct.data.sltMonth);
            ct.fn.listAnlsMonthlySummaryByOrg(paramValues);
            console.log("changeMeteringYear, " + sltYear);
        };
        /* 월 변경 - 서비스별, 서비스 항목별, 사용 금액 현황 일별 */
        ct.fn.changeMeteringMonth = function(sltMonth) {
            console.log("changeMeteringMonth, " + sltMonth);

            ct.data.sltMonth = String(sltMonth);
            ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
            ct.data.sltColumnOption = "daily";

            var paramValues = ct.fn.setLastYearMonth(ct.data.sltYear, ct.data.sltMonth);
            ct.fn.listAnlsByItemGroup(paramValues);
            ct.fn.listAnlsDailySummaryByOrg(paramValues);
            ct.fn.listAnlsByItem(paramValues);
        };
        /* 일별, 월별 조건 변경 - 사용 금액 현황 */
        ct.fn.changeColumnOption = function(sltColumnOption) {
            console.log("changeColumnOption, " + sltColumnOption);
            if(sltColumnOption == "daily") {
                ct.fn.redrawChart(ct.dailyChart);
            } else if(sltColumnOption == "monthly") {
                ct.fn.redrawChart(ct.monthlyChart);
            }
        };

        /* 최초 페이지 구성 */
        ct.fn.initPage = function() {
            var initDrawChartDefer = $q.defer();
            var listYearDefer = $q.defer();
            var listItemGroupDefer = $q.defer();
            var columnOptionDefer = $q.defer();

            var allProcessForInit = $q.all([initDrawChartDefer.promise, listYearDefer.promise, listItemGroupDefer.promise, columnOptionDefer.promise]);
            allProcessForInit.then(function (datas) {
                var paramValues = datas[1];
                ct.fn.listAnlsByItemGroup(paramValues);
                ct.fn.listAnlsMonthlySummaryByOrg(paramValues);
                ct.fn.listAnlsDailySummaryByOrg(paramValues);
                ct.fn.listAnlsByItem(paramValues);
            });

            ct.fn.initDrawChart(initDrawChartDefer);
            ct.fn.listAllMeteringGroupItems(listItemGroupDefer);
            ct.fn.listAllMeteringYears(listYearDefer);
            ct.fn.setColumnOption(columnOptionDefer);
        }

        ct.fn.initPage();
    })
;