'use strict';

angular.module('portal.controllers')
    .controller('sampleTableCtrl', function ($scope) {
        _DebugConsoleLog("sampleControllers.js : sampleTableCtrl", 1);
        var ct = this;

        ct.visibleProjects = [{
            facility: "Atlanta",
            code: "C-RD34",
            cost: 540000,
            conditionRating: 52,
            extent: 100,
            planYear: 2014
        }, {
            facility: "Seattle",
            code: "CRDm-4",
            cost: 23000,
            conditionRating: 40,
            extent: 88,
            planYear: 2014
        }, {
            facility: "Austin",
            code: "GR-5",
            cost: 1200000,
            conditionRating: 92,
            extent: 90,
            planYear: 2014
        }, {
            facility: "Dayton",
            code: "LY-7",
            cost: 123000,
            conditionRating: 71,
            extent: 98,
            planYear: 2014
        }, {
            facility: "Portland",
            code: "Dm-4",
            cost: 149000,
            conditionRating: 89,
            extent: 77,
            planYear: 2014
        }, {
            facility: "Dallas",
            code: "AW-3",
            cost: 14000,
            conditionRating: 89,
            extent: 79,
            planYear: 2014
        }, {
            facility: "Houston",
            code: "Dm-4",
            cost: 1100000,
            conditionRating: 93,
            extent: 79,
            planYear: 2014
        }, {
            facility: "Boston",
            code: "DD3",
            cost: 1940000,
            conditionRating: 86,
            extent: 80,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }];

        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        ct.goCurrentPage = function (page) {
            ct.pageOptions.currentPage = page;
            ct.pageOptions.total = ct.visibleProjects.length;
            ct.pageOptions.start = ct.pageOptions.pageSize * (ct.pageOptions.currentPage - 1);
        };

        ct.goCurrentPage(1);

        ct.boardData = {startDate: '', endDate: ''};

        $scope.main.loadingMainBody = false;
    })
    .controller('sampleTableScrollCtrl', function ($scope) {
        _DebugConsoleLog("sampleControllers.js : sampleTableScrollCtrl", 1);
        var ct = this;

        ct.visibleProjects = [{
            facility: "Atlanta",
            code: "C-RD34",
            cost: 540000,
            conditionRating: 52,
            extent: 100,
            planYear: 2014
        }, {
            facility: "Seattle",
            code: "CRDm-4",
            cost: 23000,
            conditionRating: 40,
            extent: 88,
            planYear: 2014
        }, {
            facility: "Austin",
            code: "GR-5",
            cost: 1200000,
            conditionRating: 92,
            extent: 90,
            planYear: 2014
        }, {
            facility: "Dayton",
            code: "LY-7",
            cost: 123000,
            conditionRating: 71,
            extent: 98,
            planYear: 2014
        }, {
            facility: "Portland",
            code: "Dm-4",
            cost: 149000,
            conditionRating: 89,
            extent: 77,
            planYear: 2014
        }, {
            facility: "Dallas",
            code: "AW-3",
            cost: 14000,
            conditionRating: 89,
            extent: 79,
            planYear: 2014
        }, {
            facility: "Houston",
            code: "Dm-4",
            cost: 1100000,
            conditionRating: 93,
            extent: 79,
            planYear: 2014
        }, {
            facility: "Boston",
            code: "DD3",
            cost: 1940000,
            conditionRating: 86,
            extent: 80,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }, {
            facility: "New York",
            code: "ER1",
            cost: 910000,
            conditionRating: 87,
            extent: 82,
            planYear: 2015
        }];

        ct.boardData = {};
        $scope.main.loadingMainBody = false;
    })
    .controller('sampleProgressBarCtrl', function ($scope, $timeout, progressBarManager) {
        _DebugConsoleLog("sampleControllers.js : sampleProgressBarCtrl", 1);
        var ct = this;

        ct.myPersont = 75;

        ct.progressVals = {
            label : "{percentage}%",
            percentage : 80
        };

        ct.stopProgress = function() {

        };

        ct.actual = 0.75;
        ct.expected = 0.75;

        ct.actual2 = 0;
        ct.expected2 = 0;

        $timeout(

        );

        $scope.main.loadingMainBody = false;
    })
    .controller('sampleDragAndDropCtrl', function ($scope) {
        _DebugConsoleLog("sampleControllers.js : sampleDragAndDropCtrl", 1);
        var ct = this;

        ct.dragoverCallback = function(index, external, type, callback) {
            return index <= container.items.length; // Disallow dropping in the third row.
        };

        ct.dropCallback = function(index, item, external, type) {
            ct.logListEvent('dropped at', index, external, type);
            // Return false here to cancel drop. Return true if you insert the item yourself.
            return item;
        };

        ct.logEvent = function(message) {
            console.log(message);
        };

        ct.logListEvent = function(action, index, external, type) {
            var message = external ? 'External ' : '';
            message += type + ' element was ' + action + ' position ' + index;
            console.log(message);
        };

        var id = 10;
        var container = {items: [], effectAllowed: "all"};
        for (var k = 0; k < 7; ++k) {
            container.items.push({label: "all" + ' ' + id++, effectAllowed: "all", itemStyle: (k%4+1)});
        }
        ct.container = container;

        $scope.$watch('contents.container', function(container) {
            ct.containerAsJson = angular.toJson(container, true);
        }, true);

        $scope.main.loadingMainBody = false;
    })
    .controller('sampleChartCtrl', function ($scope, $timeout) {
        _DebugConsoleLog("sampleControllers.js : sampleChartCtrl", 1);
        var ct = this;

        ct.line = {};
        ct.line.labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        ct.line.series = ['Series A', 'Series B'];
        ct.line.data = [
            [65, 59, 80, 81, 56, 55, 40],
            [28, 48, 40, 19, 86, 27, 90]
        ];
        ct.line.onClick = function (points, evt) {
            console.log(points, evt);
        };
        ct.line.onHover = function (points) {
            if (points.length > 0) {
                console.log('Point', points[0].value);
            } else {
                console.log('No point');
            }
        };
        ct.line.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];

        ct.line.colors = [
            {
                backgroundColor: "rgba(159,204,0, 0.2)",
                pointBackgroundColor: "rgba(159,204,0, 1)",
                pointHoverBackgroundColor: "rgba(159,204,0, 0.8)",
                borderColor: "rgba(159,204,0, 1)",
                pointBorderColor: '#fff',
                pointHoverBorderColor: "rgba(159,204,0, 1)"
            },"rgba(250,109,33,0.5)","#9a9a9a","rgb(233,177,69)"
        ];

        ct.line.options = {
            scales: {
                yAxes: [
                    {
                        id: 'y-axis-1',
                        type: 'linear',
                        display: true,
                        position: 'left'
                    },
                    {
                        id: 'y-axis-2',
                        type: 'linear',
                        display: true,
                        position: 'right'
                    }
                ]
            }
        };


        ct.bar = {};
        ct.bar.options = { legend: { display: true } };
        ct.bar.labels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
        ct.bar.series = ['Series A', 'Series B'];
        ct.bar.data = [
            [65, 59, 80, 81, 56, 55, 40],
            [28, 48, 40, 19, 86, 27, 90]
        ];


        ct.doughnut = {};
        ct.doughnut.labels = ['Download Sales', 'In-Store Sales', 'Mail-Order Sales'];
        ct.doughnut.data = [0, 0, 0];

        $timeout(function () {
            ct.doughnut.data = [350, 450, 100];
        }, 500);


        ct.pie = {};
        ct.pie.labels = ['Download Sales', 'In-Store Sales', 'Mail Sales'];
        ct.pie.data = [300, 500, 100];
        ct.pie.options = { legend: { display: false } };

        $scope.main.loadingMainBody = false;
    })
    .controller('samplePopCtrl', function ($scope, common) {
        _DebugConsoleLog("sampleControllers.js : samplePopCtrl", 1);
        var ct = this;

        ct.showAlertSuccess = function (message) {
            // 기본 3초 후 닫기
            common.showAlertSuccess(message);
        };

        ct.showAlertError = function (message) {
            // 기본 3초 후 닫기
            common.showAlertError(message);
        };

        ct.showAlertWarning = function (message) {
            // 2초 후 닫기
            common.showAlertWarning(2000, message);
        };

        ct.showAlertInfo = function (message) {
            // 5초 후 닫기
            common.showAlertInfo(5000, message);
        };

        ct.showDialogAlert = function (title, message) {
            common.showDialogAlert(title, message);
        };

        ct.showConfirm = function (title, message) {
            common.showConfirm(title, message).then(function () {
                common.showAlertInfo("확인 하였습니다.");
            });
        };

        ct.popCallBackFunction = function ($event) {
            common.showAlertInfo("등록 되었습니다.");
        };

        ct.popDialog = null;
        ct.showDialog = function ($event) {
            var dialogOptions = {
                controller : "samplePopFormCtrl",
                callBackFunction : ct.popCallBackFunction
            };
            ct.popDialog = common.showDialog($scope, $event, dialogOptions);
        };

        ct.rightDialog = null;
        ct.showSimpleDialog = function ($event) {
            var dialogOptions = {
                controller : "sampleSimplePopFormCtrl",
                callBackFunction : ct.popCallBackFunction
            };
            ct.rightDialog = common.showSimpleDialog($scope, $event, dialogOptions);
        };

        ct.popData = {};
        ct.showRightDialog = function () {
            var dialogOptions = {
                controller : "sampleRightPopFormCtrl",
                controllerAs : "rpop", // default pop
                callBackFunction : ct.moveNextPage
            };
            ct.rightDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.rightPopCallBackFunction = function ($event) {
            common.showAlertInfo("등록 되었습니다.");
        };

        ct.moveNextPage = function() {
            $scope.contents.popData = {name: "다음"};
            var dialogOptions = {
                controller : "sampleRightNextPopFormCtrl",
                controllerAs : "rpop", // default pop
                callBackFunction : ct.rightPopCallBackFunction
            };
            ct.rightDialog = common.showRightDialog($scope, dialogOptions);
        };


        $scope.main.loadingMainBody = false;
    })
    .controller('samplePopFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService) {
        _DebugConsoleLog("sampleControllers.js : samplePopFormCtrl", 1);

        var pop = this;
        $scope.dialogOptions.dialogClassName =  "modal-dialog";
        $scope.dialogOptions.title = $translate.instant("label.add");
        $scope.dialogOptions.okName =  $translate.instant("label.add");
        $scope.dialogOptions.cancelName =  $translate.instant("label.cancel");

        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/sample/samplePopForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                $scope.dialogOptions.callBackFunction();
            }
            $mdDialog.hide();
        };

        $scope.dialogOptions.popCancel = function () {
            $mdDialog.cancel();
        }

    })
    .controller('sampleSimplePopFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService) {
        _DebugConsoleLog("sampleControllers.js : samplePopFormCtrl", 1);

        var pop = this;
        $scope.dialogOptions.dialogClassName =  "modal-dialog";
        $scope.dialogOptions.title = "label.add";
        $scope.dialogOptions.okName =  "label.add";
        $scope.dialogOptions.cancelName =  "label.cancel";

        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/sample/samplePopForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                $scope.dialogOptions.callBackFunction();
            }
            $mdDialog.hide();
        };

        $scope.dialogOptions.popCancel = function () {
            $mdDialog.cancel();
        }

    })
    .controller('sampleRightPopFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService) {
        _DebugConsoleLog("sampleControllers.js : sampleRightPopFormCtrl", 1);

        var vm = this;
        $scope.dialogOptions.title = "label.make_instance";
        $scope.dialogOptions.okName =  "label.next_stage";

        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/sample/sampleRightPopForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                $scope.dialogOptions.callBackFunction();
            }
            $mdDialog.hide();
        };

        $scope.dialogOptions.popCancel = function () {
            $mdDialog.cancel();
        };

        vm.sample = { instanceName: "", useStartDate2: "", useEndDate2: "" };

    })
    .controller('sampleRightNextPopFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService) {
        _DebugConsoleLog("sampleControllers.js : sampleRightNextPopFormCtrl", 1);

        var vm = this;
        $scope.dialogOptions.title = "label.make_instance";
        $scope.dialogOptions.okName =  "label.add_instance";

        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/sample/sampleRightNextPopForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                $scope.dialogOptions.callBackFunction();
            }
            $mdDialog.hide();
        };

        $scope.dialogOptions.popCancel = function () {
            $mdDialog.cancel();
        };

    })
;
