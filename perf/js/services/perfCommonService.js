angular.module('perf.services')
    .factory('perfCommService', function (common, CONSTANTS) {
        var perfCommonService = {};

        // each Chart-loading
        perfCommonService.chartLoadingOn = function(chart) {
            //return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/perf/anls/totalSum', 'GET', params))
            chart.loading = true;
            if (chart.loading === true) {
                chart.data.series = angular.copy([]);

                // chart redraw using NoData
                chart.instance.setData(chart.data);
                chart.instance.rerender();
            }
        };

        // calc perfMonthList
        perfCommonService.listPerfMonth = function(sltYear) {
            var today = new Date();
            var thisYear = today.getFullYear();
            var thisMonth = today.getMonth() + 1;
            var listPerfMonth = [];
            var startYm = CONSTANTS.startYear + '' + CONSTANTS.startMonth;
            var endYm = '' + thisYear + ((thisMonth+'').length == 1 ? '0'+thisMonth : thisMonth);
            for (var m = 1; m <= 12; m++) {
                var checkYm = '' + sltYear + ((m+'').length == 1 ? '0'+m : m);
                if (checkYm <  startYm) continue;
                if (checkYm >  endYm) break;
                listPerfMonth.push(m);
            }
            return listPerfMonth;
        };

        // sltMonth, when change year
        perfCommonService.monthWhenChangeYear = function(prevSltYear, sltYear) {
            var listPerfMonth = perfCommonService.listPerfMonth(sltYear);
            var sltMonth = null;
            if (prevSltYear > sltYear) {
                sltMonth = listPerfMonth[listPerfMonth.length - 1];
            } else if (prevSltYear < sltYear) {
                sltMonth = listPerfMonth[0];
            } else {
                sltMonth = -1;
            }
            return sltMonth;
        };

        perfCommonService.findMaxRow = function (data) {
            var itemGroupCode = "";
            var sltItemGroupCnt = 1;
            var maxRow = 0;

            for (var i = 0; i < data.itemCount; i++) {
                if (data.items[i].itemGroupCode != itemGroupCode) {
                    itemGroupCode = angular.copy(data.items[i].itemGroupCode);
                    sltItemGroupCnt = 1;
                } else {
                    sltItemGroupCnt++;
                }
                if (maxRow < sltItemGroupCnt) {
                    maxRow = sltItemGroupCnt;
                }
            }
            return maxRow
        };

        return perfCommonService;
    });