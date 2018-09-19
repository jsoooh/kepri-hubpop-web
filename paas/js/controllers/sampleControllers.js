'use strict';

angular.module('portal.controllers')
    .controller('sampleCtrl', function ($scope, $location, $state, $timeout, $stateParams, user, common, CONSTANTS) {
        _DebugConsoleLog("sampleControllers.js : sampleCtrl", 1);
        var ct = this;

        $scope.slider1 = {
            value: 5,
            options: {
                floor: 0,
                ceil: 10,
                step: 1,
				showSelectionBar: true
            }
        };

        $scope.slider2 = {
            minValue: 10,
            maxValue: 90,
            options: {
                floor: 0,
                ceil: 100,
                step: 1
            }
        };

        $scope.slider3 = {
            value: 5,
            options: {
                floor: 0,
                ceil: 10,
                showTicksValues: true,
                ticksTooltip: function (v) {
                    return 'Tooltip for ' + v;
                }
            }
        };

        $scope.slider4 = {
            minValue: 20,
            maxValue: 80,
            options: {
                floor: 0,
                ceil: 100,
                step: 10,
                disabled: true,
                showTicks: true, // just to show the disabled style
                draggableRange: true // just to show the disabled style
            }
        };

        $scope.size = 200;
        $scope.progress = 0.75;
        $scope.strokeWidth = 50;
        $scope.stroke = '#333';
        $scope.counterClockwise = '';

        $scope.main.loadingMainBody = false;
    })
    .controller('sampleCtrl4', function ($scope, $location, $state, $timeout, $stateParams, user, common, CONSTANTS) {
        _DebugConsoleLog("sampleControllers.js : sampleCtrl5", 1);
        var ct = this;
        ct.spaces = [];
        ct.checkedSpaces = [];

        function guidNumStr (val) {
            if (val < 10) {
                return "000" + val;
            } else if (val < 100) {
                return "00" + val;
            } else if (val < 1000) {
                return "0" + val;
            } else {
                return val;
            }
        }

        function orgStr (val) {
            return guidNumStr(val % 5);
        }

        function readomNum (val) {
            return Math.round(Math.random() * val);
        }

        for (var i=0; i<100; i++) {
            ct.spaces.push({guid:'guid-'+guidNumStr(i), orgName:'org-'+orgStr(i), name:'spaace-'+guidNumStr(i), serviceUsage:readomNum(10), serviceLimit:readomNum(10)+10, routerUsage:readomNum(10), routerLimit:readomNum(10)+10, instanceMemoryUsage:readomNum(1024), instanceMemoryLimit:readomNum(10)*1024, instanceUsage:readomNum(10), instanceLimit:readomNum(10)+10});
        }

        $scope.main.loadingMainBody = false;
    })
    .controller('sampleCtrl5', function ($scope, $location, $state, $timeout, $stateParams, user, common, CONSTANTS) {
        _DebugConsoleLog("sampleControllers.js : sampleCtrl5", 1);
        var ct = this;

        ct.openMainDataLoading = function (evt) {
            $scope.main.uploadProgress = null;
            $scope.main.loadingMainBody = true;
        };

        ct.openMainUploadProgress = function (evt) {
            $scope.main.uploadProgress = { loaded : 0, total : 3000000, percent : 0 };
            $scope.main.loadingMainBody = true;
            ct.startUploadProgress();
        };

        ct.openPopDataLoading = function (evt) {
            $scope.main.uploadProgress = null;
            $scope.dialogOptions = {
                title : "팝업 로딩 샘플",
                dialogClassName : "modal-dialog",
            };
            common.showDialog($scope, evt, $scope.dialogOptions);
            $scope.actionBtnHied = true;
            $scope.actionLoading = true;
        };

        ct.openPopUploadProgress = function (evt) {
            $scope.main.uploadProgress = { loaded : 0, total : 3000000, percent : 0 };
            $scope.dialogOptions = {
                title : "팝업 업로드 Progress 샘플",
                dialogClassName : "modal-dialog",
            };
            common.showDialog($scope, evt, $scope.dialogOptions);
            ct.startUploadProgress();
            $scope.actionBtnHied = false;
            $scope.actionLoading = true;
        };

        ct.startUploadProgress = function () {
            $timeout(function () {
                if (!$scope.main.uploadProgress) return;
                var loaded = parseInt($scope.main.uploadProgress.loaded, 10);
                var total = parseInt($scope.main.uploadProgress.total, 10);
                var step = total/20;
                loaded += step;
                if (loaded > total) {
                    loaded = total;
                }
                var percent = parseInt((loaded*100)/total, 10);
                $scope.main.uploadProgress = {
                    loaded : loaded,
                    total : total,
                    percent : percent
                };
                if (percent < 100) {
                    ct.startUploadProgress();
                }
            }, 500);
        };

        $scope.main.loadingMainBody = false;
    })
;
