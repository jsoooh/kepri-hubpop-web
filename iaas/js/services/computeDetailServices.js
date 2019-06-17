//'use strict';

angular.module('iaas.services')
    .factory('computeDetailService', function (common, CONSTANTS) {

        var computeDetailService = {};

        computeDetailService.listDomains = function (instanceId) {
            var params = {
                instanceId : instanceId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/domain/service', 'GET', params));
        };

        computeDetailService.getTimePicker = function () {
            var result = [];
            var value;
            var startTime = 0;
            var endTime = 2400;
            var n = 4;

            for (var i = startTime; i < endTime; i+=5) {
                value = ("0".repeat(n) + i).slice(-1 * n);
                if (value.substr(2,2) == '60') {
                    i += 35;
                    continue;
                }
                result.push({
                    value: (value.substr(0, 2) + ':' + value.substr(2,2) + ':00'),
                    name: (value.substr(0, 2) + ':' + value.substr(2,2))
                });
            }

            return result;
        };

        var tenantUrl = CONSTANTS.monitNewApiContextUrl + '/admin/iaas/tenant';

        computeDetailService.tenantCpuUsageList = function (condition) {
            return common.resourcePromise(tenantUrl + '/cpu/' + condition.hostname + '/usageList', 'GET', condition);
        };

        computeDetailService.tenantCpuLoad1mList = function (condition) {
            return common.resourcePromise(tenantUrl + '/cpu/' + condition.hostname + '/loadList', 'GET', condition);
        };

        computeDetailService.tenantMemorySwapList = function (condition) {
            return common.resourcePromise(tenantUrl + '/memory/' + condition.hostname + '/swapList', 'GET', condition);
        };

        computeDetailService.tenantMemoryUsageList = function (condition) {
            return common.resourcePromise(tenantUrl + '/memory/' + condition.hostname + '/usageList', 'GET', condition);
        };

        computeDetailService.tenantDiskUsageList = function (condition) {
            return common.resourcePromise(tenantUrl + '/disk/' + condition.hostname + '/usageList', 'GET', condition);
        };

        computeDetailService.tenantDiskIOReadList = function (condition) {
            return common.resourcePromise(tenantUrl + '/disk/' + condition.hostname + '/readList', 'GET', condition);
        };

        computeDetailService.tenantDiskIOWriteList = function (condition) {
            return common.resourcePromise(tenantUrl + '/disk/' + condition.hostname + '/writeList', 'GET', condition);
        };

        computeDetailService.tenantDiskIOList = function (condition) {
            return common.resourcePromise(tenantUrl + '/disk/' + condition.hostname + '/inoutList', 'GET', condition);
        }

        computeDetailService.tenantInterfaceList = function (condition) {
            return common.resourcePromise(tenantUrl + '/net/' + condition.hostname + '/interfaceList', 'GET', condition);
        };

        computeDetailService.tenantNetworkIOKByteList = function (condition) {
            return common.resourcePromise(tenantUrl + '/net/' + condition.hostname + '/byteList', 'GET', condition);
        };

        computeDetailService.tenantNetworkErrorList = function (condition) {
            return common.resourcePromise(tenantUrl + '/net/' + condition.hostname + '/errList', 'GET', condition);
        };

        computeDetailService.tenantNetworkDroppedPacketList = function (condition) {
            return common.resourcePromise(tenantUrl + '/net/' + condition.hostname + '/droppacketList', 'GET', condition);
        };

        computeDetailService.setAlarmLine = function (arr, nodeKey, main, nodeid) {
            if ((nodeid == 'cpu_usage' || nodeid == 'mem_usage' || nodeid == 'dsk_usage') && arr.length > 0) {
                var alarmType = nodeid.split('_')[0].replace('dsk', 'disk').replace('mem', 'memory');
                var warnSeries = [];
                var criSeries = [];
                angular.copy(arr[0].values, warnSeries);
                angular.copy(arr[0].values, criSeries);
                var warnValue = 100;
                var criValue = 100;
                angular.forEach(main.alarmPolicys[nodeKey].detail, function (el, k) {
                    if (el.alarmType == alarmType) {
                        warnValue = el.warningThreshold;
                        criValue = el.criticalThreshold;
                    }
                });
                angular.forEach(warnSeries, function (el, k) {
                    el.totalUsage = warnValue;
                });
                angular.forEach(criSeries, function (el, k) {
                    el.totalUsage = criValue;
                });
                arr.push({values: warnSeries, key: 'Warning', area: false, color: main.getAlarmColor('warning')});
                arr.push({values: criSeries, key: 'Critical', area: false, color: main.getAlarmColor('critical')});
            }
        }

        return computeDetailService;
    })
;