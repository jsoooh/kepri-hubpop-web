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
            var listPerfMonth = [];
            if (sltYear == 2019 || sltYear == "2019") {
                listPerfMonth.push("12");
            } else if (sltYear == thisYear) {
                var thisMonth = today.getMonth() + 1;
                for (var m = 1; m < (thisMonth + 1); m++) {
                    listPerfMonth.push(String(m));
                }
            } else {
                listPerfMonth = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
            }
            return listPerfMonth;
        };

        // sltMonth, when change year
        perfCommonService.monthWhenChangeYear = function(prevSltYear, sltYear) {
            console.log("-- monthWhenChangeYear --" + prevSltYear+":"+sltYear);
            var listPerfMonth = perfCommonService.listPerfMonth(sltYear);
            var sltMonth = null;
            if (prevSltYear > sltYear) {
                sltMonth = listPerfMonth[listPerfMonth.length - 1];
            } else if (prevSltYear < sltYear) {
                sltMonth = listPerfMonth[0];
            } else {
                console.log("prevSltYear == sltYear");
                sltMonth = -1;
            }
            return sltMonth;
        };

        return perfCommonService;
    });