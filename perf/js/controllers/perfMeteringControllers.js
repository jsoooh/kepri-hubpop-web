'use strict';

angular.module('perf.controllers')
    .controller('perfMonthlyMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, perfMeteringService, CONSTANTS) {
        _DebugConsoleLog("perfMeteringControllers.js : perfMonthlyMeteringCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};
    })
    .controller('perfItemsMeteringCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, perfMeteringService, CONSTANTS) {
            _DebugConsoleLog("perfMeteringControllers.js : perfItemsMeteringCtrl", 1);

            var ct = this;
            ct.scope = $scope;
            ct.scope.CONSTANTS = CONSTANTS;
            ct.fn = {};
            ct.conditions = {};
            ct.data = {};
    })
;