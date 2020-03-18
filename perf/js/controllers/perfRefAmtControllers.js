'use strict';

angular.module('perf.controllers')
    .controller('perfRefAmtCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $filter, common, perfMeteringService, perfRefAmtService, CONSTANTS) {
        _DebugConsoleLog("perfRefAmtControllers.js : perfRefAmtCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.data.sltItemGroup = {};
        ct.data.sltItemGroupCode = "";
        ct.meteringItemGroups = [];
        ct.itemPerfRefAmts = [];

        ct.fn.listAllMeteringGroupItems = function () {
            var promise = perfMeteringService.listAllMeteringGroupItems();
            promise.success(function (data) {
                if (angular.isArray(data.items)) {
                    ct.meteringItemGroups = data.items;
                    if (ct.meteringItemGroups.length > 0) {
                        if (ct.meteringItemGroups.length > 0 && angular.isUndefined(ct.data.sltItemGroupCode) || ct.data.sltItemGroupCode == "") {
                            ct.data.sltItemGroup = angular.copy(ct.meteringItemGroups[0]);
                            ct.data.sltItemGroupCode = ct.data.sltItemGroup.itemGroupCode;
                        }
                    } else {
                        ct.data.sltItemGroupCode = "";
                        ct.data.sltItemGroup = {};
                    }
                } else {
                    ct.meteringItemGroups = [];
                }
            });
            promise.error(function (data, status, headers) {
                ct.meteringItemGroups = [];
            });
        };

        ct.fn.listAllPrefItemRefAmts = function () {
            var promise = perfRefAmtService.listAllPrefItemRefAmts();
            promise.success(function (data) {
                if (angular.isArray(data.items)) {
                    ct.itemPerfRefAmts = data.items;
                } else {
                    ct.itemPerfRefAmts = [];
                }
            });
            promise.error(function (data, status, headers) {
                ct.itemPerfRefAmts = [];
            });
        };

        ct.fn.changeItemGroup = function (sltItemGroupCode) {
            if (angular.isDefined(sltItemGroupCode)) {
                var itemGroup = common.objectsFindCopyByField(ct.meteringItemGroups, "itemGroupCode", sltItemGroupCode);
                if (angular.isObject(itemGroup) && angular.isDefined(itemGroup.itemGroupCode)) {
                    ct.data.sltItemGroup = itemGroup;
                    ct.data.sltItemGroupCode = sltItemGroupCode;
                }
            }
        };

        ct.fn.listAllMeteringGroupItems();
        ct.fn.listAllPrefItemRefAmts();

    })
;