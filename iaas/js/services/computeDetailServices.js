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

        var options = {
            width: 460,
            height: 250,
            fillGraph: true,
            fillAlpha: 0.35,
            highlightCircleSize: 2,
            strokeWidth: 2,
            // ylabel: widget.axisLabel,
            highlightSeriesOpts: {
                strokeWidth: 3,
                strokeBorderWidth: 1,
                highlightCircleSize: 5
            },
            legend: 'follow',
            colors: ['#b9e866','#5cc6d9','#f5da25','#9041d2','#2172e4','#22a581','#ed3131','#9c78df','#ff9936','#2b6e90']
        };

        computeDetailService.resetChartData = function (widget, data) {
            var resources = [];
            var labels = ['time'];

            angular.forEach(data, function (e, k) {
                labels.push(e.name);
                var metric = [];
                if (widget.nodeid == 'cpu_usage' || widget.nodeid == 'mem_usage') {
                    metric = e.metric[0].metric;
                } else {
                    metric = e.metric;
                }
                angular.forEach(metric, function (e2, k2) {
                    if (k == 0) {
                        resources.push([new Date(e2.time * 1000)]);
                    }
                    resources[k2].push(e2.usage);
                });
            });

            return {
                resources: resources,
                labels: labels
            }
        };

        computeDetailService.setChartData = function(p) {
            var widgets = p.interface ? p.scope.dashboard.netWidgets[p.interface] : p.scope.dashboard.widgets;
            angular.forEach(widgets, function(widget, key) {
                
                var interfaceVal = p.interface ? p.interface : undefined;
                if (interfaceVal) {
                    p.condition.interface = interfaceVal;
                    widget.interface = interfaceVal;
                }

                widget.refreshIconShow = false;
                widget.hostname = p.hostname;
                computeDetailService[widget.func](p.condition).then(
                    function (result) {
                        computeDetailService.setChart(result, widget);
                    }
                );
            });

            p.interface = undefined;
        };

        computeDetailService.setChart = function (result, widget) {
            var resetData = computeDetailService.resetChartData(widget, result.data);
            var resources = resetData.resources;
            var labels = resetData.labels;
            var option = angular.copy(options);

            option.labels = labels.slice();
            if (widget.percent) option.valueRange = [0, 101];
            var nodeid = widget.interface ? widget.interface + '_' + widget.nodeid : widget.nodeid;
            widget.chart = new Dygraph(document.getElementById(nodeid), resources, option);
            widget.chart.updateOptions({
                zoomCallback : function (minDate, maxDate, yRange) {
                    computeDetailService.zoomCallback(minDate, maxDate, widget.hostname, widget, true);
                }
            });
        };

        computeDetailService.zoomCallback = function (minDate, maxDate, hostname, widget, refreshIconShow) {
            var timeRangeFrom = new Date(minDate);
            var timeRangeTo = new Date(maxDate);
            var condition = {
                hostname: hostname,
                timeRangeFrom: common.getTimeRangeFlag(moment(timeRangeTo, 'YYYY.MM.DD hh:mm')),
                timeRangeTo: common.getTimeRangeFlag(moment(timeRangeFrom, 'YYYY.MM.DD hh:mm')),
                groupBy: common.getGroupingByTimeRange('custom', timeRangeFrom, timeRangeTo)
            };
            
            var rp2 = computeDetailService[widget.func](condition);
            rp2.success(function (data2) {
                widget.refreshIconShow = refreshIconShow;
                var resources2 = computeDetailService.resetChartData(widget, data2).resources;
                if (resources2.length > 0) widget.chart.updateOptions({file: resources2});
            });
        };

        computeDetailService.initChartData = function (p) {

            p.condition = {
                hostname: p.hostname,
                groupBy: p.cookies.getGroupBy()
            };
            
            if (p.cookies.getDefaultTimeRange() == 'custom') {
                p.condition.timeRangeFrom = p.cookies.getTimeRangeTo();
                p.condition.timeRangeTo = p.cookies.getTimeRangeFrom();
            } else {
                p.condition.defaultTimeRange = p.cookies.getDefaultTimeRange();
            }

            p.scope.interfaceList = [];
            p.scope.dashboard = {
                widgets: angular.copy(p.chartConfig),
                netWidgets: {}
            };

            p.scope.main.loadingMainBody = true;

            computeDetailService.setChartData(p);
            computeDetailService[p.interfaceFunc]({hostname: p.hostname}).then(
                function (result) {
                    if (result.data.metric) {
                        angular.forEach(result.data.metric, function (metricItem, mkey) {
                            p.scope.interfaceList.push(metricItem);
                            p.scope.dashboard.netWidgets[metricItem] = [];
                            angular.forEach(p.netChartConfig, function (config) {
                                p.scope.dashboard.netWidgets[metricItem].push(angular.copy(config));
                            });
                            p.interface = metricItem;
                            computeDetailService.setChartData(p);
                            p.scope.main.loadingMainBody = false;
                        });
                    } else {
                        p.scope.main.loadingMainBody = false;
                    }
                },
                function (reason) {
                    p.scope.main.loadingMainBody = false;
                }
            );
        };

        computeDetailService.reloadChartData = function (p) {
            p.isReload = true;
            p.condition = {
                hostname: p.hostname,
                groupBy: p.datas.selGroupBy
            };

            p.defaultTimeRange = p.datas.selTimeRange;

            if (p.defaultTimeRange == 'custom') {
                p.condition.timeRangeFrom = p.datas.timeRangeTo;
                p.condition.timeRangeTo = p.datas.timeRangeFrom;
                p.scope.savedCustom = true;
            } else {
                p.condition.defaultTimeRange = p.defaultTimeRange;
                p.condition.groupBy = p.datas.selGroupBy;
                p.scope.savedCustom = false;
            }

            p.scope.main.loadingMainBody = true;

            // 노드 데이터 재조회
            p.chartConfig = p.scope.dashboard.widgets;
            computeDetailService.setChartData(p);

            // 네트워크 데이터 재조회
            angular.forEach(p.scope.interfaceList, function (interfaceVal, index) {
                p.chartConfig = p.scope.dashboard.netWidgets[interfaceVal];
                p.interface = interfaceVal;
                computeDetailService.setChartData(p);
            });
            p.scope.main.loadingMainBody = false;
        };

        computeDetailService.reloadChartDataOne = function (widget, p) {
            widget.refreshIconShow = false;
            p.scope.main.loadingMainBody = true;
            computeDetailService[widget.func](p.condition).then(
                function (result) {
                    computeDetailService.setChart(result, widget);
                    p.scope.main.loadingMainBody = false;
                }
            );
        };

        return computeDetailService;
    })
;