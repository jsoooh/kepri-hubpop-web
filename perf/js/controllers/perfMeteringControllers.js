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
            var promise = perfMeteringService.listAllMeteringYears();
            promise.success(function (data) {
                console.log("Success listAllMeteringYears");
                ct.data.sltYear = data.items[0];
                ct.meteringYears = angular.copy(data.items);
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
                var params = {
                    "urlPaths": {
                        "orgCode":ct.data.sltOrgId
                    },
                    "year": ct.data.sltYear
                }
                var promise = perfMeteringService.listPerfMonthlyMeteringByOrgCode(params);
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
                var params = {
                    "urlPaths": {
                        "orgCode":ct.data.sltOrgId
                    },
                    "year": ct.data.sltYear
                }
                var promise = perfMeteringService.listPerfMonthlyMeteringByOrgCode(params);
                promise.success(function (data) {
                    if(angular.isArray(data.items)) {
                        ct.orgMeteringMonthlyLists = data.items;
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
    .controller('perfItemsMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, perfMeteringService, CONSTANTS, orgService) {
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
        ct.data.sltItemGroup = {};
        ct.data.sltItemGroupCode = "";
        ct.meteringItemGroups = [];

        // Total Item List
        ct.meteringItems = [];
        // Item
        ct.data.sltItem = {};
        ct.data.sltItemCode = "";
        ct.meteringItemsBySltItemGroup = [];

        // year list
        ct.meteringYears = [];
        ct.data.sltYear = "";
        // month list
        ct.meteringMonths = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        ct.data.sltMonth = "";

        // day
        ct.today = new Date();
        // day list
        ct.meteringDays = [];
        //for (var month = 1; month < ( new Date( 년도입력, 월입력, 0) ).getDate(); month++)

        // month total param year
        ct.perfMeteringMonthlyTotals = [];
        ct.perfMeteringMonthlyTotalSum = 0;

        // day total param year
        ct.perfMeteringDailyTotals = [];
        ct.perfMeteringDailyTotalSum = 0;

        // 숫자 필터 처리를 위한 작업
        ct.data.numUnit = 1;

        // variables for monthly Chart
        ct.monthlyChart = {
            switch: false,
            container: document.getElementById('monthly-metering-chart'),
            data: {},
            option: {
                chart: {
                    width: 1450,
                    height: 500,
                    title: '추이 (' + ct.data.sltItem.itemUnit + ')',
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
                    align: 'top'
                }
            },
            column: null
        };

        // variables for daily Chart
        ct.dailyChart = {
            switch: false,
            container: document.getElementById('daily-metering-chart'),
            data: {},
            option: {
                chart: {
                    width: 1450,
                    height: 500,
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
                    align: 'top'
                }
            },
            column: null
        };

        /*
            Initial Setting
         */
        ct.fn.getOrg = function() {
            var promise = orgService.getOrg(common.getPortalOrgKey());
            promise.success(function (data) {
                console.log("Success getOrgData")
                console.log(data.orgId + ", " + data.orgName);
                ct.data.sltOrg.code = data.orgId;
                ct.data.sltOrg.name = data.orgName;
            });
            promise.error(function (data, status, headers) {
                console.log("Fail getOrgData");
            });
        }

        // API로부터 metering 그룹 get
        ct.fn.listAllMeteringItemGroups = function () {
            var promise = perfMeteringService.listAllMeteringGroupItems();
            promise.success(function (data) {
                console.log("Success listAllMeteringGroupItems");
                ct.meteringItemGroups = data.items;
                if (ct.meteringItemGroups.length > 0 && angular.isUndefined(ct.data.sltItemGroupCode) || ct.data.sltItemGroupCode == "") {
                    ct.data.sltItemGroup = angular.copy(ct.meteringItemGroups[0]);
                    ct.data.sltItemGroupCode = ct.data.sltItemGroup.itemGroupCode;
                }
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringGroupItems");
                ct.meteringItemGroups = []
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

        // API로부터 meteringItem get
        ct.fn.listAllMeteringItems = function () {
            $scope.main.loadingMainBody = true;
            var promise = perfMeteringService.listAllMeteringItems();
            promise.success(function (data) {
                console.log("Success listAllMeteringItems");
                ct.meteringItems = data.items;
                ct.fn.changeMeteringItemsByItemGroupCode(ct.data.sltItemGroupCode);
                if (ct.meteringItemsBySltItemGroup.length > 0 && angular.isUndefined(ct.data.sltItemCode) || ct.data.sltItemCode == "") {
                    ct.data.sltItem = angular.copy(ct.meteringItemsBySltItemGroup[0]);
                    ct.data.sltItemCode = ct.data.sltItem.itemCode;
                }
                ct.fn.listAllMeteringYears();
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringItems");
                ct.meteringItems = []
                $scope.main.loadingMainBody = false;
            });
        };

        // API로부터 metering Year get
        ct.fn.listAllMeteringYears = function () {
            var promise = perfMeteringService.listAllMeteringYears();
            promise.success(function (data) {
                console.log("Success listAllMeteringYears");
                console.log(data);
                ct.meteringYears = angular.copy(data.items);

                // year, month 초기값 설정
                ct.fn.changeMeteringYear();
                ct.fn.changeMeteringMonth();
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listAllMeteringYears");
                ct.meteringYears = [];
            });
        };

        // html에서 값에 따라 정렬 방식 선택
        /*
        ct.fn.setClassForViewAlign = function (value) {
            if (value == '-') {
                return "text-center";
            } else if (!isNaN(value)) {
                return "text-right";
            } else {
                return "";
            }
        };
        */

        // 년월에 따른 day 배열 생성
        ct.fn.configDayArray = function (year, month) {
            var lastDay = (new Date(year, month, 0)).getDate();
            ct.meteringDays = [];
            for (var i = 1; i <= lastDay; i++) {
                ct.meteringDays.push(i);
            }
        };

        // year나 itemCdoe를 바꿀때 모든 데이터 재구성
        ct.fn.reconstructData = function () {
            if (ct.data.sltItem.itemCode != false) {
                if (ct.data.sltYear != false) {
                    ct.fn.listPerfMeteringMonthlyTotalByItemCode(ct.data.sltOrg.code ,ct.data.sltItem.itemCode, ct.data.sltYear);
                    if (ct.data.sltMonth != false) {
                        ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
                        ct.fn.listPerfMeteringDailyTotalByItemCode(ct.data.sltOrg.code, ct.data.sltItemCode, ct.data.sltYear, ct.data.sltMonth)
                    }
                }
            }
        };

        /*
         View Control Functions
         */
        // itemGroup을 변경했을 때
        ct.fn.changeMeteringItemsByItemGroupCode = function (sltItemGroupCode) {
            ct.meteringItemsBySltItemGroup = [];
            for (var i = 0; i < ct.meteringItems.length; i++) {
                var item = ct.meteringItems[i];

                if (item.itemCode.startsWith(sltItemGroupCode)) {
                    ct.meteringItemsBySltItemGroup.push(item)
                }
            }
        };

        // item을 변경했을 때
        ct.fn.changeMeteringItem = function (sltItemCode) {
            for (var i = 0; i < ct.meteringItemsBySltItemGroup.length; i++) {
                var item = ct.meteringItemsBySltItemGroup[i];
                if (item.itemCode == sltItemCode) {
                    ct.data.sltItem = item;
                    break;
                } else {
                    ct.data.sltItem = null;
                }
            }
            ct.fn.reconstructData();
        };

        // year을 변경했을 때
        ct.fn.changeMeteringYear = function (sltYear) {
            ct.data.sltYear = sltYear;
            if (ct.meteringYears.length > 0 && angular.isUndefined(ct.data.sltYear) || ct.data.sltYear == "") {
                var today = ct.today;
                ct.data.sltYear = String(today.getFullYear());
            }
            ct.fn.reconstructData();
        };

        // month를 변경했을 떄
        ct.fn.changeMeteringMonth = function (sltMonth) {
            ct.data.sltMonth = sltMonth;
            if (ct.meteringMonths.length > 0 && angular.isUndefined(ct.data.sltMonth) || ct.data.sltMonth == "") {
                var today = ct.today;
                ct.data.sltMonth = String(today.getMonth() + 1);
                ct.data.today = String(today.getDate());
            }
            if (ct.data.sltItem.itemCode != false && ct.data.sltYear != false) {
                if (ct.data.sltMonth != false) {
                    ct.fn.configDayArray(ct.data.sltYear, ct.data.sltMonth);
                    ct.fn.listPerfMeteringDailyTotalByItemCode(ct.data.sltOrg.code, ct.data.sltItemCode, ct.data.sltYear, ct.data.sltMonth);
                }
            }
        };

        // Draw Chart
        ct.fn.drawColumnChart = function (chart) {
            if (chart.switch) {
                chart.column.setData(chart.data);
                chart.column.rerender();
            } else {
                chart.column = tui.chart.columnChart(chart.container, chart.data, chart.option);
                chart.switch = !chart.switch;
            }
        };

        /*
        Get data from API
         */
        ct.fn.listPerfMeteringMonthlyTotalByItemCode = function (orgCode, itemCode, sltYear) {
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
                                if (i + 1 > (ct.data.sltMonth)) {
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
                /*
                ct.monthlyChart.options = {
                    chart: {
                        title: '추이 (단위: ' + ct.data.sltItem.itemUnit + ')'
                    },
                    yAxis: {
                        min: 0
                    }
                };
                */
                ct.monthlyChart.option.chart.title = '추이 (단위: ' + ct.data.sltItem.itemUnit + ')';
                ct.monthlyChart.data = {
                    categories: ct.meteringMonths,
                    series: [
                        {
                            name: ct.data.sltItem.itemName,
                            data: ct.perfMeteringMonthlyTotals
                        }
                    ]
                };

                ct.fn.drawColumnChart(ct.monthlyChart);
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listPerfMeteringMonthlyTotalByItemCode");
                ct.perfMeteringMonthlyTotals = [];
                ct.perfMeteringMonthlyTotalSum = 0;
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.listPerfMeteringDailyTotalByItemCode = function (orgCode, itemCode, sltYear, sltMonth) {
            $scope.main.loadingMainBody = true;
            var params = {
                urlPaths: {
                    "orgCode": orgCode,
                    "itemCode": itemCode
                },
                "year": sltYear,
                "month": sltMonth
            };
            var promise = perfMeteringService.listPerfMeteringDailyTotalByItemCode(params);
            promise.success(function (data) {
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
                ct.dailyChart.option.chart.title = '추이 (단위: ' + ct.data.sltItem.itemUnit + ')';
                ct.dailyChart.data = {
                    categories: ct.meteringDays,
                    series: [
                        {
                            name: ct.data.sltItem.itemName,
                            data: ct.perfMeteringDailyTotals
                        }
                    ]
                };

                ct.fn.drawColumnChart(ct.dailyChart);
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                console.log("Fail listPerfMeteringDailyTotalByItemCode");
                ct.perfMeteringDailyTotals = [];
                ct.perfMeteringDailyTotalSum = 0;
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getOrg();
        ct.fn.listAllMeteringItemGroups();
        ct.fn.listAllMeteringItems();
    })
    .filter('numberUnit', function() {
        return function(number, param) {
            if (!isNaN(number) && !isNaN(param)) {
                return parseInt(number/param);
            } else {
                return number;
            }
        }
    })
;