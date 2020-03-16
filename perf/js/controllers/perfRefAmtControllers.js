'use strict';

angular.module('perf.controllers')
    .controller('perfRefAmtCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, perfRefAmtService, CONSTANTS) {
        _DebugConsoleLog("perfRefAmtControllers.js : perfRefAmtCtrl", 1);

        var ct = this;
        ct.scope = $scope;
        ct.scope.CONSTANTS = CONSTANTS;
        ct.fn = {};
        ct.conditions = {};
        ct.data = {};
    })
;