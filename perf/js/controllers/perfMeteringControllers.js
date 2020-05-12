'use strict';

angular.module('perf.controllers')
    .controller('perfMonthlyMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, orgService, perfMeteringService, CONSTANTS) {
        _DebugConsoleLog("perfMeteringControllers.js : perfMonthlyMeteringCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};

        ct.data.sltOrgCode = "";
        ct.data.sltOrgName = "";

        ct.meteringItemGroups = [];
        ct.data.maxRow = "";
        ct.data.sltYear = "";
        ct.meteringYears = [];
        ct.orgMeteringMonthlyLists = [];

        ct.meteringMonths = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

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
            $scope.main.loadingMainBody = true;

            var promise = perfMeteringService.listAllMeteringYears();
            promise.success(function (data) {
                console.log("Success listAllMeteringYears");
                ct.data.sltYear = data.items[0];
                ct.meteringYears = angular.copy(data.items);

                if(angular.isUndefined(ct.data.sltYear) || ct.data.sltYear == "") {
                    var date = new Date();
                    ct.data.sltYear = date.getFullYear();
                }

                ct.fn.orgListMeteringMonthlyTotal(ct.data.sltYear);
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                console.log("Fail listAllMeteringYears");
                ct.meteringYears = [];
            });
        };

        /* 월별 사용량 리스트 BY ORG_ORGCODE */
        ct.fn.orgListMeteringMonthlyTotal = function(sltYear) {
            $scope.main.loadingMainBody = true;

            /* Org 정보 조회 BY ORG_ID */
            var orgPromise = orgService.getOrg(common.getPortalOrgKey());
            orgPromise.success(function (data) {
                ct.data.sltOrgName = data.orgName;
                ct.data.sltOrgCode = data.orgId;

                ct.fn.selectMeteringYear(sltYear);
            });
            orgPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.sltOrgCode = {};
                ct.sltOrgName = {};
            });
        };

        /* 년도 변경 */
        ct.fn.selectMeteringYear = function (sltYear) {
            $scope.main.loadingMainBody = true;
            if(angular.isDefined(sltYear)) {
                ct.data.sltYear = sltYear;
                var params = {
                    "urlPaths": {
                        "orgCode":ct.data.sltOrgCode
                    },
                    "year": ct.data.sltYear
                }
                var promise = perfMeteringService.listPerfMonthlyMeteringByOrgCode(params);
                promise.success(function (data) {
                    if(angular.isArray(data.items)) {
                        ct.orgMeteringMonthlyLists = data.items;
                        if(angular.isUndefined(ct.data.maxRow) || ct.data.maxRow == "") {
                            ct.fn.findMaxRow(data);
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

        // 과거 확인
        ct.fn.isPast = function (sltYear, sltMonth, sltDay) {
            var date = new Date();
            if (!sltDay == true) {
                sltDay = 1;
            }
            date.setFullYear(sltYear, sltMonth, sltDay);

            var today = new Date();
            if (today.getTime() > date.getTime()) {
                return true;
            } else {
                return false;
            }
        };

        ct.fn.listAllMeteringYears();
        ct.fn.listAllMeteringGroupItems();

    })
    .controller('perfItemsMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $q, $interval, $filter, common, perfMeteringService, CONSTANTS, orgService) {
            _DebugConsoleLog("perfMeteringControllers.js : perfItemsMeteringCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};

        ct.data.sltOrg = {
            code: "",
            name: ""
        };

        // ItemGroup
        ct.sltItemGroup = {};
        ct.data.sltItemGroupCode = "";
        ct.meteringItemGroups = [];

        // Total Item List
        ct.meteringItems = [];
        // Item
        ct.sltItem = {};
        ct.data.sltItemCode = "";
        ct.meteringItemsBySltItemGroup = [];

        // year list
        ct.meteringYears = [];
        // month list
        ct.meteringMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        // day
        ct.today = new Date();
        ct.data.sltYear = ct.today.getFullYear();
        ct.data.sltMonth = ct.today.getMonth() + 1;

        // day list
        ct.meteringDays = [""];
        //for (var month = 1; month < ( new Date( 년도입력, 월입력, 0) ).getDate(); month++)

        // month total param year
        ct.perfMeteringMonthlyTotals = [];
        ct.perfMeteringMonthlyTotalSum = 0;

        // day total param year
        ct.perfMeteringDailyTotals = [];
        ct.perfMeteringDailyTotalSum = 0;

        // 숫자 필터 처리를 위한 작업
        ct.data.numUnit = 1;

        ct.data.chartWidth = 1450;
        ct.data.chartHeight = 500;

        // chart
        ct.monthlyChart = {};
        ct.dailyChart = {};

        // First Draw
        ct.fn.initDraw = function () {
            // Monthly Chart
            // variables for monthly Chart
            ct.monthlyChart = {
                container: document.getElementById('monthly-metering-chart'),
                data: {
                    categories: ct.meteringMonths,
                    series: null
                },
                option: {
                    chart: {
                        width: ct.data.chartWidth,
                        height: ct.data.chartHeight,
                        title: 'Monthly Performance',
                        format: '1,000'
                    },
                    yAxis: {
                        title: 'Amount',
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

            // variables for daily Chart
            ct.dailyChart = {
                container: document.getElementById('daily-metering-chart'),
                data: {
                    categories: ct.meteringDays,
                    series: null
                },
                option: {
                    chart: {
                        width: ct.data.chartWidth,
                        height: ct.data.chartHeight,
                        title: 'Daily Performance',
                        format: '1,000'
                    },
                    yAxis: {
                        title: 'Amount',
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

            ct.dailyChart.instance = tui.chart.columnChart(ct.dailyChart.container, ct.dailyChart.data, ct.dailyChart.option);
            ct.monthlyChart.instance = tui.chart.columnChart(ct.monthlyChart.container, ct.monthlyChart.data, ct.monthlyChart.option);
        }

        /*
            Initial Setting
         */
        ct.fn.getOrg = function(defer) {
            var promise = orgService.getOrg(common.getPortalOrgKey());
            promise.success(function (data) {
                console.log("Success getOrgData")
                console.log(data.orgId + ", " + data.orgName);
                ct.data.sltOrg.code = data.orgId;
                ct.data.sltOrg.name = data.orgName;
                if(defer) {
                    defer.resolve();
                }
            });
            promise.error(function (data, status, headers) {
                console.log("Fail getOrgData");
            });
        }

        // GET meteringItemGroup
        ct.fn.listAllMeteringItemGroups = function (defer) {
            var promise = perfMeteringService.listAllMeteringGroupItems();
            promise.success(function (data) {
                console.log("Success listAllMeteringGroupItems");
                ct.meteringItemGroups = data.items;
                if (ct.meteringItemGroups.length > 0 && angular.isUndefined(ct.data.sltItemGroupCode) || ct.data.sltItemGroupCode == "") {
                    ct.sltItemGroup = angular.copy(ct.meteringItemGroups[0]);
                    ct.data.sltItemGroupCode = ct.sltItemGroup.itemGroupCode;
                }
                if (defer) {
                    defer.resolve();
                }
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringGroupItems");
                ct.meteringItemGroups = []
                if (defer) {
                    defer.reject();
                }
            });
        };

        // 과거인지 확인
        ct.fn.isPast = function (sltYear, sltMonth, sltDay) {
            var date = new Date();
            var today = ct.today;

            if (!sltDay == true) {
                sltDay = 1;
            }
            date.setFullYear(sltYear, sltMonth - 1, sltDay);

            if (today.getTime() > date.getTime()) {
                return true;
            } else {
                return false;
            }
        };

        // GET meteringItem
        ct.fn.listAllMeteringItems = function (defer) {
            $scope.main.loadingMainBody = true;
            var promise = perfMeteringService.listAllMeteringItems();
            promise.success(function (data) {
                console.log("Success listAllMeteringItems");
                ct.meteringItems = data.items;
                ct.fn.changeMeteringItemsByItemGroupCode(ct.data.sltItemGroupCode);
                if (ct.meteringItemsBySltItemGroup.length > 0 && angular.isUndefined(ct.data.sltItemCode) || ct.data.sltItemCode == "") {
                    ct.sltItem = angular.copy(ct.meteringItemsBySltItemGroup[0]);
                    console.log(ct.sltItem);
                    ct.data.sltItemCode = ct.sltItem.itemCode;
                }
                if (defer) {
                    defer.resolve();
                }

                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringItems");
                ct.meteringItems = [];
                if (defer) {
                    defer.reject();
                }
                $scope.main.loadingMainBody = false;
            });
        };

        // 년월에 따른 day 배열 생성
        ct.fn.configDayArray = function (year, month) {
            var lastDay = (new Date(year, month, 0)).getDate();
            ct.meteringDays = [];
            for (var i = 1; i <= lastDay; i++) {
                ct.meteringDays.push(i);
            }
        };

        /*
           View Control Functions
           */
        // itemGroup 변경시
        ct.fn.changeMeteringItemsByItemGroupCode = function (sltItemGroupCode) {
            var itemGroup = common.objectsFindCopyByField(ct.meteringItemGroups, "itemGroupCode", sltItemGroupCode);
            if (angular.isObject(itemGroup) && angular.isDefined(itemGroup.itemGroupCode)) {
                ct.sltItemGroup = itemGroup;
                ct.data.sltItemGroupCode = sltItemGroupCode;
                ct.meteringItemsBySltItemGroup = [];
                for (var i = 0; i < ct.meteringItems.length; i++) {
                    var item = ct.meteringItems[i];

                    if (item.itemCode.startsWith(sltItemGroupCode)) {
                        ct.meteringItemsBySltItemGroup.push(item)
                    }
                }
            }
        };


        // item 변경시
        ct.fn.changeMeteringItem = function (sltItemCode) {
            ct.data.sltItemCode = sltItemCode;
            var item = common.objectsFindCopyByField(ct.meteringItemsBySltItemGroup, "itemCode", sltItemCode);
            if (angular.isObject(item) && angular.isDefined(item.itemCode)) {
                ct.fn.reconstructData()
            }
        };
        // year 변경시
        ct.fn.selectMeteringYear = function (sltYear) {
            ct.data.sltYear = sltYear;
            ct.fn.reconstructData();
        };
        // year, itemCdoe 변경시 GET Monthly Data, Daily Data
        ct.fn.reconstructData = function () {
            console.log("reconstruct ------")
            if (ct.sltItem.itemCode != false) {
                if (ct.data.sltYear != false) {
                    ct.fn.listPerfMeteringMonthlyTotalByItemCode(ct.data.sltItemCode, ct.data.sltYear, ct.data.sltOrg.code);
                    if (ct.data.sltMonth != false) {
                        ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
                        ct.fn.listPerfMeteringDailyTotalByItemCode(ct.data.sltItemCode, ct.data.sltYear, ct.data.sltMonth, ct.data.sltOrg.code)
                    }
                }
            }
        };

        // month 변경시 - GET Daily Data
        ct.fn.changeMeteringMonth = function (sltMonth) {
            ct.data.sltMonth = sltMonth;
            if (ct.sltItem.itemCode != false && ct.data.sltYear != false) {
                if (ct.data.sltMonth != false) {
                    ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
                    ct.fn.listPerfMeteringDailyTotalByItemCode(ct.data.sltItemCode, ct.data.sltYear, ct.data.sltMonth, ct.data.sltOrg.code);
                }
            }
        };

        // Data 변경시 Chart rerender
        ct.fn.redrawChart = function (chart) {
            chart.instance.setData(chart.data);
            chart.instance.rerender();
        };

        // GET Monthly Data - redraw chart
        ct.fn.listPerfMeteringMonthlyTotalByItemCode = function (itemCode, sltYear, orgCode) {
            $scope.main.loadingMainBody = true;
            var params = {
                urlPaths: {
                    "orgCode": orgCode,
                    "itemCode": itemCode
                },
                "year": sltYear
            };
            var promise = perfMeteringService.listPerfMeteringMonthlyTotalByItemCode(params);
            promise.success(function (data) {
                console.log(data);
                console.log("Success listPerfMeteringMonthlyTotalByItemCode");
                if (data.items.length > 0) {
                    ct.perfMeteringMonthlyTotals = [];

                    ct.perfMeteringMonthlyTotalSum = data.items[0].totalMeteringValue;

                    var key = "";
                    for (var i = 0; i < 12; i++) {
                        if (i < 9) {
                            key = "mv0" + (i + 1)
                        } else {
                            key = "mv" + (i + 1)
                        }

                        if (data.items[0].hasOwnProperty(key)) {
                            if (ct.today.getFullYear() == ct.data.sltYear) {
                                if (i + 1 > (ct.today.getMonth() + 1)) {
                                    ct.perfMeteringMonthlyTotals[i] = "";
                                    continue;
                                }
                            }
                            ct.perfMeteringMonthlyTotals[i] = data.items[0][key];
                        }
                    }
                } else {
                    ct.perfMeteringDailyTotalSum = 0;
                    ct.perfMeteringDailyTotals = [];
                }

                ct.monthlyChart.option.chart.title = '추이 (단위: ' + ct.sltItem.itemUnit + ')';
                ct.monthlyChart.data = {
                    categories: ct.meteringMonths,
                    series: [
                        {
                            name: ct.sltItem.itemName,
                            data: ct.perfMeteringMonthlyTotals
                        }
                    ]
                };
                ct.fn.redrawChart(ct.monthlyChart);
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listPerfMeteringMonthlyTotalByItemCode");
                ct.perfMeteringMonthlyTotals = [];
                ct.perfMeteringMonthlyTotalSum = 0;
                $scope.main.loadingMainBody = false;
            });
        };

        // GET Daily Chart - redraw chart
        ct.fn.listPerfMeteringDailyTotalByItemCode = function (itemCode, sltYear, sltMonth, orgCode) {
            $scope.main.loadingMainBody = true;
            var params = {
                urlPaths: {
                    "orgCode": orgCode,
                    "itemCode": itemCode
                },
                "year": sltYear,
                "month": sltMonth
            };
            console.log(params);
            var promise = perfMeteringService.listPerfMeteringDailyTotalByItemCode(params);
            promise.success(function (data) {
                console.log(data);
                console.log("Success listPerfMeteringDailyTotalByItemCode");
                if (data.items.length > 0) {
                    ct.perfMeteringDailyTotals = [];
                    ct.perfMeteringDailyTotalSum = data.items[0].totalMeteringValue;

                    var key = "";
                    for (var i = 0; i < ct.meteringDays.length; i++) {
                        if (i < 9) {
                            key = "dv0" + (i + 1)
                        } else {
                            key = "dv" + (i + 1)
                        }

                        if (data.items[0].hasOwnProperty(key)) {
                            if (ct.today.getFullYear() == ct.data.sltYear) {
                                if (ct.today.getMonth() + 1 == ct.data.sltMonth) {
                                    if (i + 1 > ct.today.getDate()) {
                                        ct.perfMeteringDailyTotals[i] = "";
                                        continue;
                                    }
                                }
                            }
                            ct.perfMeteringDailyTotals[i] = data.items[0][key];
                        }
                    }
                } else {
                    ct.perfMeteringDailyTotalSum = 0;
                    ct.perfMeteringDailyTotals = [];
                }

                // chart
                ct.dailyChart.option.chart.title = '추이 (단위: ' + ct.sltItem.itemUnit + ')';
                ct.dailyChart.data = {
                    categories: ct.meteringDays,
                    series: [
                        {
                            name: ct.sltItem.itemName,
                            data: ct.perfMeteringDailyTotals
                        }
                    ]
                };

                ct.fn.redrawChart(ct.dailyChart);
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listPerfMeteringDailyTotalByItemCode");
                ct.perfMeteringDailyTotals = [];
                ct.perfMeteringDailyTotalSum = 0;
                $scope.main.loadingMainBody = false;
            });
        };

        // page Processs setting
        ct.fn.initPage = function () {
            $scope.main.loadingMainBody = true;
            var orgDefer = $q.defer();
            var listItemGroupsDefer = $q.defer();
            var listItemsDefer = $q.defer();

            var allProcessForInit = $q.all([orgDefer.promise, listItemGroupsDefer.promise, listItemsDefer.promise]);
            allProcessForInit.then(function (datas) {
                console.log("wow");
                console.log(ct.data.sltOrg.code);
                ct.fn.listPerfMeteringMonthlyTotalByItemCode(ct.sltItem.itemCode, ct.data.sltYear, ct.data.sltOrg.code);
                ct.fn.listPerfMeteringDailyTotalByItemCode(ct.sltItem.itemCode, ct.data.sltYear, ct.data.sltMonth, ct.data.sltOrg.code);
            });
            ct.fn.getOrg(orgDefer);
            ct.fn.initDraw();
            ct.fn.listAllMeteringItemGroups(listItemGroupsDefer);
            ct.fn.listAllMeteringItems(listItemsDefer);

            // 연도 리스트 구성
            ct.data.startYear = 2019;
            ct.today = new Date();
            for (var i = ct.data.startYear; i < ct.today.getFullYear() + 1; i++) {
                ct.meteringYears.push(i);
            }

            ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
        };

        ct.fn.initPage();
    })
;