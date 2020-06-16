'use strict';

angular.module('perf.controllers')
    .controller('perfMonthlyMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, perfMeteringService, CONSTANTS) {
        _DebugConsoleLog("perfMeteringControllers.js : perfMonthlyMeteringCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.data = {};

        ct.data.sltOrgCode = $scope.main.sltPortalOrg.orgId;
        ct.data.sltOrgName = $scope.main.sltPortalOrg.orgName;

        ct.meteringItemGroups = [];
        ct.data.maxRow = "";
        ct.today = new Date();
        ct.data.sltYear = "";
        ct.meteringYears = [];
        ct.orgMeteringMonthlyLists = [];

        // ng-repeat
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

            var sltYear = ct.today.getFullYear();
            for (var i = CONSTANTS.startYear; i < sltYear + 1; i++) {
                ct.meteringYears.push(i);
            }
            ct.data.sltYear = sltYear;

            ct.fn.selectMeteringYear(ct.data.sltYear);
        };

        /* 년도 변경 */
        /**
         * HUBPOP_INT_PER_ANS_03 - 월별 사용 현황
         * @param sltYear
         */
        ct.fn.selectMeteringYear = function (sltYear) {
            $scope.main.loadingMainBody = true;

            ct.data.sltYear = sltYear;
            var params = {
                "urlPaths": {
                    "orgCode": ct.data.sltOrgCode
                },
                "year": ct.data.sltYear
            };
            var promise = perfMeteringService.listPerfMonthlyMeteringByOrgCode(params);
            promise.success(function (data) {
                if (angular.isArray(data.items)) {
                    ct.orgMeteringMonthlyLists = data.items;

                    if (angular.isUndefined(ct.data.maxRow) || ct.data.maxRow == "") {
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
        ct.fn.isPast = function (sltYear, sltMonth) {
            var date = new Date();
            date.setFullYear(sltYear, sltMonth, 1);

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
    .controller('perfItemsMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $q, $interval, $filter, common, perfMeteringService, CONSTANTS, perfCommService) {
        _DebugConsoleLog("perfMeteringControllers.js : perfItemsMeteringCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};

        ct.sltOrg = {};
        ct.sltOrg.code = $scope.main.sltPortalOrg.orgId;
        ct.sltOrg.name = $scope.main.sltPortalOrg.orgName;

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

        // day
        ct.today = new Date();
        ct.data.sltYear = ct.today.getFullYear();
        ct.data.prevSltYear = ct.data.sltYear;
        ct.data.sltMonth = ct.today.getMonth() + 1;
        // month list
        ct.meteringMonths = perfCommService.listPerfMonth(ct.data.sltYear);
        ct.meteringMonthsForChart = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        // day list
        ct.meteringDays = [""];
        //for (var month = 1; month < ( new Date( 년도입력, 월입력, 0) ).getDate(); month++)

        // monthlyMetering by org, item
        ct.perfMeteringMonthlyByOrgAndItems = [];
        ct.perfMeteringMonthlyByOrgAndItemSum = 0;

        // dailyMetering by org, item
        ct.perfMeteringDailyByOrgAndItems = [];
        ct.perfMeteringDailyByOrgAndItemSum = 0;

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
                    categories: ct.meteringMonthsForChart,
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
                if (ct.meteringItemsBySltItemGroup.length > 0 && angular.isUndefined(ct.data.sltItemCode) || ct.data.sltItemCode == "") {
                    ct.sltItem = angular.copy(ct.meteringItemsBySltItemGroup[0]);
                    ct.data.sltItemCode = ct.sltItem.itemCode;
                }
            }
        };


        // item 변경시
        ct.fn.changeMeteringItem = function (sltItemCode) {
            ct.data.sltItemCode = sltItemCode;
            var item = common.objectsFindCopyByField(ct.meteringItemsBySltItemGroup, "itemCode", sltItemCode);
            if (angular.isObject(item) && angular.isDefined(item.itemCode)) {
                ct.sltItem = angular.copy(item);
                ct.fn.reconstructData()
            }
        };
        // year 변경시
        ct.fn.selectMeteringYear = function (sltYear) {
            ct.data.sltYear = sltYear;

            ct.meteringMonths = perfCommService.listPerfMonth(ct.data.sltYear);
            ct.data.sltMonth = perfCommService.monthWhenChangeYear(ct.data.prevSltYear, ct.data.sltYear);
            // error, return -1
            if (ct.data.sltMonth < 1) {
                console.log("error");
                return
            }

            ct.data.prevSltYear = ct.data.sltYear;
            ct.fn.reconstructData();
        };
        // year, itemCdoe 변경시 GET Monthly Data, Daily Data
        ct.fn.reconstructData = function () {
            console.log("reconstruct ------")
            if (ct.sltItem.itemCode != false) {
                if (ct.data.sltYear != false) {
                    ct.fn.listPerfMeteringMonthlyByOrgAndItemCode(ct.sltOrg.code, ct.data.sltItemCode, ct.data.sltYear);
                    if (ct.data.sltMonth != false) {
                        ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
                        ct.fn.listPerfMeteringDailyByOrgAndItemCode(ct.sltOrg.code, ct.data.sltItemCode, ct.data.sltYear, ct.data.sltMonth)
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
                    ct.fn.listPerfMeteringDailyByOrgAndItemCode(ct.sltOrg.code, ct.data.sltItemCode, ct.data.sltYear, ct.data.sltMonth);
                }
            }
        };

        // Data 변경시 Chart rerender
        ct.fn.redrawChart = function (chart) {
            chart.instance.setData(chart.data);
            chart.instance.rerender();
            $scope.main.loadingMainBody = false;
        };

        // GET Monthly Data - redraw chart
        /**
         * HUBPOP_INT_PER_ANS_04 - 월별 사용 추이
         * @param orgCode
         * @param itemCode
         * @param sltYear
         * @param sltMonth
         */
        ct.fn.listPerfMeteringMonthlyByOrgAndItemCode = function (orgCode, itemCode, sltYear) {
            $scope.main.loadingMainBody = true;
            var params = {
                urlPaths: {
                    "orgCode": orgCode,
                    "itemCode": itemCode
                },
                "year": sltYear
            };
            var promise = perfMeteringService.listPerfMeteringMonthlyByOrgAndItemCode(params);
            promise.success(function (data) {
                console.log(data);
                console.log("Success listPerfMeteringMonthlyByOrgAndItemCode");

                ct.perfMeteringMonthlyByOrgAndItems = [];
                ct.perfMeteringMonthlyByOrgAndItemSum = 0;
                var dataIndex = 0;
                var perfMonth = 0;
                for (var month = 1; month <= 12; month++) {
                    if (dataIndex < data.itemCount) {
                        perfMonth = Number(data.items[dataIndex].perfYm.slice(4, 6));
                    }
                    if (month == perfMonth) {
                        var meteringValue = data.items[dataIndex].meteringValue;
                        ct.perfMeteringMonthlyByOrgAndItems.push(meteringValue);
                        ct.perfMeteringMonthlyByOrgAndItemSum += meteringValue;
                        dataIndex++;
                    } else {
                        if (ct.fn.isPast(sltYear, month)) {
                            ct.perfMeteringMonthlyByOrgAndItems.push(0);
                        } else {
                            ct.perfMeteringMonthlyByOrgAndItems.push('');
                        }
                    }
                }

                ct.monthlyChart.option.chart.title = '추이 (단위: ' + ct.sltItem.itemUnit + ')';
                ct.monthlyChart.data = {
                    categories: ct.meteringMonthsForChart,
                    series: [
                        {
                            name: ct.sltItem.itemName,
                            data: ct.perfMeteringMonthlyByOrgAndItems
                        }
                    ]
                };
                ct.fn.redrawChart(ct.monthlyChart);
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listPerfMeteringMonthlyByOrgAndItemCode");
                ct.perfMeteringMonthlyByOrgAndItems = [];
                ct.perfMeteringMonthlyByOrgAndItemSum = 0;
                $scope.main.loadingMainBody = false;
            });
        };

        // GET Daily Chart - redraw chart
        /**
         * HUBPOP_INT_PER_ANS_04 - 일별 사용 추이
         * @param orgCode
         * @param itemCode
         * @param sltYear
         * @param sltMonth
         */
        ct.fn.listPerfMeteringDailyByOrgAndItemCode = function (orgCode, itemCode, sltYear, sltMonth) {
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
            var promise = perfMeteringService.listPerfMeteringDailyByOrgAndItemCode(params);
            promise.success(function (data) {
                console.log("Success listPerfMeteringDailyByOrgAndItemCode");
                var lastDay = (new Date(sltYear, sltMonth, 0)).getDate();

                ct.perfMeteringDailyByOrgAndItems = [];
                ct.perfMeteringDailyByOrgAndItemSum = 0;
                var dataIndex = 0;
                for (var day = 1; day <= lastDay; day++) {
                    if (dataIndex < data.itemCount) {
                        var perfDay = Number(data.items[dataIndex].perfYmd.slice(6, 8));
                    }
                    if (perfDay == day) {
                        var meteringValue = data.items[dataIndex].meteringValue;
                        ct.perfMeteringDailyByOrgAndItems.push(meteringValue);
                        ct.perfMeteringDailyByOrgAndItemSum += meteringValue;
                        dataIndex++;
                    } else {
                        if (ct.fn.isPast(sltYear, sltMonth, perfDay)) {
                            ct.perfMeteringDailyByOrgAndItems.push(0);
                        } else {
                            ct.perfMeteringDailyByOrgAndItems.push('');
                        }
                    }
                }

                // chart
                ct.dailyChart.option.chart.title = '추이 (단위: ' + ct.sltItem.itemUnit + ')';
                ct.dailyChart.data = {
                    categories: ct.meteringDays,
                    series: [
                        {
                            name: ct.sltItem.itemName,
                            data: ct.perfMeteringDailyByOrgAndItems
                        }
                    ]
                };

                ct.fn.redrawChart(ct.dailyChart);
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listPerfMeteringDailyByOrgAndItemCode");
                ct.perfMeteringDailyByOrgAndItems = [];
                ct.perfMeteringDailyByOrgAndItemSum = 0;
                $scope.main.loadingMainBody = false;
            });
        };

        // page Processs setting
        ct.fn.initPage = function () {
            $scope.main.loadingMainBody = true;
            var listItemGroupsDefer = $q.defer();
            var listItemsDefer = $q.defer();

            var allProcessForInit = $q.all([listItemGroupsDefer.promise, listItemsDefer.promise]);
            allProcessForInit.then(function (datas) {
                console.log(ct.sltOrg.code);
                ct.fn.listPerfMeteringMonthlyByOrgAndItemCode(ct.sltOrg.code, ct.sltItem.itemCode, ct.data.sltYear);
                ct.fn.listPerfMeteringDailyByOrgAndItemCode(ct.sltOrg.code, ct.sltItem.itemCode, ct.data.sltYear, ct.data.sltMonth);
            });
            ct.fn.initDraw();
            ct.fn.listAllMeteringItemGroups(listItemGroupsDefer);
            ct.fn.listAllMeteringItems(listItemsDefer);

            // 연도 리스트 구성
            ct.data.startYear = ct.scope.CONSTANTS.startYear;
            ct.today = new Date();
            for (var i = ct.data.startYear; i < ct.today.getFullYear() + 1; i++) {
                ct.meteringYears.push(i);
            }

            ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
        };

        ct.fn.initPage();
    })
;
