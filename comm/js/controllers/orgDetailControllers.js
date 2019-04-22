'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, common, cache, orgService, portal, quotaService, memberService) {
        _DebugConsoleLog('orgDetailControllers.js : commOrgProjectDetailCtrl', 1);

        var ct = this;

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        ct.paramId = $stateParams.orgId;
        ct.isOrgManager = false;
        ct.sltInfoTab = 'dashboard';

        // 탭 변경
        ct.changeSltInfoTab = function (sltInfoTab) {
            ct.sltInfoTab = sltInfoTab;

            if (sltInfoTab == 'resource') {
                // 조직 변경 중복 신청 체크
                ct.orgRequest = true;
                ct.listQuotaHistory();
            }
        };

        // 조직 정보 조회
        ct.getOrgProject = function () {
            $scope.main.loadingMainBody = true;
            var orgPromise = orgService.getOrg(ct.paramId);
            orgPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.selOrgProject = data;
                if (ct.selOrgProject.myRoleName == 'OWNER') {
                    ct.isOrgManager = true;
                }
                $timeout(function () {
                    $scope.main.changePortalOrg(data);
                    ct.loadDashBoard();
                }, 0);
            });
            orgPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        /**************************************************************************/
        /************************ 대시보드 차트 데이터 ****************************/
        /**************************************************************************/

        //Semi DOught Chart Func
        ct.semiChart = function (chartArea, jsonList ) {
            var container = document.getElementById(chartArea);
            var data = jsonList;
            var options = {
                chart: {
                    width: 247,
                    height: 130
                },
                series: {
                    startAngle: -90,
                    endAngle: 90,
                    radiusRange: ['75%', '100%'],
                    showLabel: true
                    //  showLegend: true
                },
                tooltip: {
                    suffix: '%'
                },
                legend: {
                    visible: false
                },
                chartExportMenu : {
                    visible: false
                } ,
                usageStatistics : false
            };

            var theme = {
                series: {
                    colors: ['#fe3392', '#8fcbe4'],
                    label: {
                        color: '#fff',
                        fontWeight: 'bold'
                    }
                }
            };

            tui.chart.registerTheme('myTheme', theme);
            options.theme = 'myTheme';
            tui.chart.pieChart(container, data, options);
        };

        ct.pieChart = function (chartArea, jsonList, tmpSuf, tmpColor1, tmpColor2) {
            var container = document.getElementById(chartArea);
            var data = jsonList;
            var options = {
                chart: {
                    width: 152,
                    height: 152
                },
                series: {
                    radiusRange: ['75%', '100%']
                },
                tooltip: {
                    suffix: tmpSuf
                },
                legend: {
                    visible: false
                },
                chartExportMenu : {
                    visible: false
                } ,
                usageStatistics : false
            };
            var theme = {
                series: {
                    colors: [tmpColor1, tmpColor2],
                    label: {
                        color: '#fff',
                        fontWeight: 'bold'
                    }
                }
            };

            tui.chart.registerTheme('myTheme', theme);
            options.theme = 'myTheme';
            tui.chart.pieChart(container, data, options);

        };

        ct.barChart = function (chartArea, jsonList, tmpSuf, tmpColor1, tmpColor2) {
            var container = document.getElementById(chartArea);
            var data = jsonList;
            var options = {
                chart: {
                    width: 580,
                    height: 100
                },
                yAxis: {

                },
                xAxis: {

                },
                series: {
                    stackType: 'normal',
                    showLabel : true
                },
                tooltip: {
                    suffix: tmpSuf
                },
                legend: {
                    visible: false
                },
                chartExportMenu : {
                    visible: false
                },
                plot :{
                    showLine : false
                } ,
                usageStatistics : false

            };
            var theme = {
                series: {
                    colors: [tmpColor1, tmpColor2],
                    label: {
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize:14
                    }
                }
            };

            tui.chart.registerTheme('myTheme', theme);
            options.theme = 'myTheme';

            tui.chart.barChart(container, data, options);
        };

        //////////////////////////////// dcp Chart  ///////////////////////////////////
        ct.dcpChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '200') {
                ser1.name = "반려";
                ser1.data = chartData.dataReqRejNoca;  //반려
                reqJsonArray.push(ser1);

                ser2.name = "승인";
                ser2.data = chartData.dataReqAprvNoca;  //승인
                reqJsonArray.push(ser2);

                serJsonList.series = reqJsonArray;
            }

            var totTmpCnt = parseInt(chartData.dataReqRejNoca) + parseInt(chartData.dataReqAprvNoca);

            ct.dcpDashboardInfo.totTmpCnt = totTmpCnt;

            //ct.dataReq1 = { totalCnt: chartData.dataSubsNoca, totCnt: chartData.dataReqAllNoca, confirmCnt: chartData.dataReqAprvNoca, reJecCnt: chartData.dataReqRejNoca, totTmpCnt : totTmpCnt};
            var chartArea = 'chart-area';
            ct.semiChart (chartArea, serJsonList) ;
        };

        //////////////////////////////// API서비스 사용현황 Chart  ///////////////////////////////////
        ct.apiChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000')
            {
                ser1.name = "비활성";
                ser1.data = chartData.apiVtlzNCnt;
                reqJsonArray.push(ser1);

                ser2.name = "활성";
                ser2.data = chartData.apiVtlzYCnt;
                reqJsonArray.push(ser2);

                serJsonList.series = reqJsonArray;
            }
            var totTmpCnt = parseInt(chartData.apiVtlzNCnt) + parseInt(chartData.apiVtlzYCnt);

            ct.apipeDashboardInfo.totTmpCnt = totTmpCnt;

            //ct.dataReq2 = { totalCnt: chartData.apiTotalCnt, totCnt: chartData.appTotalCnt, confirmCnt: chartData.apiVtlzYCnt, reJecCnt: chartData.apiVtlzNCnt, totTmpCnt : totTmpCnt};
            var chartArea = 'chart-area1';
            ct.semiChart (chartArea, serJsonList) ;
        };

        //////////////////////////////// 가상서버 CPU    ///////////////////////////////////
        ct.iaasCpuChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                //ct.dataReq4 = { };
                ser1.name = "사용율";
                ser1.data = chartData.cpuTotUsed.toFixed(1);
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq4 = serJsonList  ;
            var chartArea = 'chart-area3';
            var tmpValue = '%';

            //CPU Chart Color
            var tmpColor1 = "#0a88bd";
            var tmpColor2 = "#ebebeb";

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// 가상서버 MEMORY     ///////////////////////////////////
        ct.iaasMemChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                ser1.name = "사용율";
                ser1.data = chartData.ramSizeTot.toFixed(1);
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq5 = ser1.data ;
            var chartArea = 'chart-area4';
            var tmpValue = '%';
            //Memory Chart Color
            var tmpColor1 = '#fe3392';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// 가상서버 STORAGE      ///////////////////////////////////
        ct.iaasStorgeChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                //ct.dataReq4 = { };
                ser1.name = "사용율";
                // STRAGE 기준을 instance disk 로 할 것인지 volume으로 할 것인지 확인 필요
                //ser1.data = chartData.instanceDiskGigabytesTot; // instance disk
                ser1.data = chartData.objectStorageGigaByteTot.toFixed(1) // volume
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq6 = ser1.data ;
            var chartArea = 'chart-area5';
            var tmpValue = '%';
            var tmpColor1 = '#fe3392';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// 표준 앱 CPU 사용율    ///////////////////////////////////
        ct.paasCpuChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                //ct.dataReq4 = { };
                ser1.name = "사용율";
                ser1.data = chartData.cpu.percentUsed.toFixed(1);
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq7 = ser1.data ;
            var chartArea = 'chart-area7';
            var tmpValue = '%';

            //PaaS CPU Color
            var tmpColor1 = '#0a88bd';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// 표준 앱 MEMORY    ///////////////////////////////////
        ct.paasMemChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000')
            {
                ser1.name = "사용율";
                ser1.data = chartData.mem.percentUsed.toFixed(1);
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq8 = ser1.data ;
            var chartArea = 'chart-area8';
            var tmpValue = '%';

            var tmpColor1 = '#fe3392';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// 표준 앱 STOREGE  ajax sg0730 2018.10.15     ///////////////////////////////////
        ct.paasStorgeChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                //ct.dataReq4 = { };
                ser1.name = "사용율";
                ser1.data = chartData.disk.percentUsed.toFixed(1);
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                //ser2.data = chartData.data2;
                ser2.data = parseInt(100 - parseInt(ser1.data));;
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq9 = ser1.data ;
            var chartArea = 'chart-area9';
            var tmpValue = '%';
            var tmpColor1 = '#fe3392';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// API서비스 사용현황 Chart  ///////////////////////////////////
        ct.pipChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                ser1.name = "SVN";
                ser1.data = chartData.svnCnt;
                reqJsonArray.push(ser1);

                ser2.name = "GIT";
                ser2.data = chartData.gitCnt;
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            var tmpTot = chartData.svnCnt + chartData.gitCnt ;

            ct.dataReq10 = { svnCnt: chartData.svnCnt, gitCnt: chartData.gitCnt, totCnt : ct.pipelineDashboardInfo.repoTotalCnt };
            var chartArea = 'chart-area10';
            var tmpValue = '건';

            var tmpColor1 = '#8fcbe4'; //SVN
            var tmpColor2 = '#0f6bba'; //GIT

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// pipeline Chart  ///////////////////////////////////
        ct.barChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                ser1.name = "성공";
                ser1.data = chartData.sucCnt;
                reqJsonArray.push(ser1);

                ser2.name = "실패";
                ser2.data = chartData.failCnt;
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
                serJsonList.categories = [''];
            }

            ct.pipelineDashboardInfo.totCnt = ser1.data + ser2.data;
            var chartArea = 'chart-area11';
            var tmpValue = '건';
            var tmpColor1 = '#8fcbe4'; //성공
            var tmpColor2 = '#fe3291'; //실패
            ct.barChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// Dcp 데이터수집  ///////////////////////////////////
        ct.dcpDashboardInfo = {
            dataSubsNoca: 0,
            dataReqAllNoca: 0,
            dataReqAprvNoca: 0,
            dataReqRejNoca: 0,
            totTmpCnt : 0
        };

        ct.getDcpDashboardInfo = function (projectId) {
            var promise = portal.dashboard.getDcpDashboardInfo(projectId);
            promise.success(function (data, status, headers) {
                if (data.code == '200' && data.dataReqAllNoca > 0 ) {
                    ct.dcpDashboardInfo = data;
                    // Semi Chart
                    ct.dcpChartFunc(ct.dcpDashboardInfo) ;
                }
            });
            promise.error(function (data, status, headers) {
            });
        };

        //////////////////////////////// API서비스 사용현황  ///////////////////////////////////
        ct.apipeDashboardInfo = {
            apiTotalCnt : 0,
            appTotalCnt : 0,
            apiVtlzYCnt : 0,
            apiVtlzNCnt : 0,
            totTmpCnt : 0
        };

        ct.getApipDashBoardInfo = function () {
            var promise = portal.dashboard.getApipDashBoardInfo();
            promise.success(function (data, status, headers) {
                if (data.code == '0000' && data.apiTotalCnt > 0 ) {
                    ct.apipeDashboardInfo = data;
                    ct.apiChartFunc(ct.apipeDashboardInfo);
                }
            });
            promise.error(function (data, status, headers) {
            });
        };

        //////////////////////////////// CPU 상태  ///////////////////////////////////
        // 가상서버 CPU 상태
        ct.iaasCpuStatusChart = function () {
            var container = document.getElementById('chart-area2');
            var data = {
                categories: ['2018.01', '2018.06', '2018.12'],
                series: {
                    area: [
                        {
                            name: ' ',                                 //차후 항목라벨 정리필요 sg0730 2018.10.17
                            data: [80, 60, 90]
                        }
                    ],
                    line: [
                        {
                            name: ' ',
                            data: [80, 60, 90]
                        }
                    ]
                }
            };
            var options = {
                chart: {
                    width: 230,
                    height: 80
                },
                yAxis: {
                    min: 0,
                    pointOnColumn: true
                },
                xAxis: {
                    tickInterval: 'auto'
                },
                series: {
                    zoomable: true
                },
                tooltip: {
                    suffix: '%'
                },
                legend: {
                    visible: false
                },
                chartExportMenu : {
                    visible: false
                }
            };

            var theme = {
                series: {
                    area: {
                        colors: ['#ffc4c4']
                    },
                    line: {
                        colors: ['#fe5f9e']
                    }
                }
            };

            tui.chart.registerTheme('newTheme', theme);
            options.theme = 'newTheme';

            tui.chart.comboChart(container, data, options);
        };

        ct.iaasInstanceStateCountInit = function () {
            // 카운트
            ct.iaasInstanceStateCount = {
                TOTAL: 0,
                STARTED: 0,
                STOPPED: 0,
                ERROR: 0
            };
        };

        ct.iaasInstanceUsageInit = function () {
            ct.iaasInstanceUsage = {
                cpu : {
                    percentUsedQuota : 0, // 할당률 %
                    usedQuota : 0, // 인스턴스 할당 코어수
                    maxQuota : 0 // 프로젝트 할당량 코어수
                },
                mem : {
                    percentUsedQuota : 0, // 할당률 %
                    usedQuota : 0, // 인스턴스 할당량 Byte
                    maxQuota : 0 // 프로젝트 할당량 Byte
                },
                disk : {
                    percentUsedQuota : 0, // 할당률 %
                    usedQuota : 0, // 인스턴스 할당량 Giga Byte
                    maxQuota : 0 // 프로젝트 할당량 Giga Byte
                },
                volume : {
                    percentUsedQuota : 0, // 할당률 %
                    usedQuota : 0, // 인스턴스 할당량 Giga Byte
                    maxQuota : 0 // 프로젝트 할당량 Giga Byte
                }
            };
        };

        ct.iaasInstanceStateCountInit();
        ct.iaasInstanceUsageInit();

        // IAAS 가상 서버 정보
        ct.iaasInstances = [];
        ct.getIaasInseanceInfos = function (tenantId) {
            ct.iaasInstanceStateCountInit();
            ct.iaasInstances = [];
            var promise = portal.dashboard.getIaasInseanceInfos(tenantId);
            promise.success(function (data, status, headers) {
                if (data && data.content && data.content.instances && data.content.instances.length > 0) {
                    ct.iaasInstances = data.content.instances;
                    angular.forEach(ct.paasApps, function (instance, instanceKey) {
                        ct.iaasInstanceStateCount.TOTAL++;
                        if (instance.vmState == "active") {
                            ct.iaasInstanceStateCount.STARTED++;
                        } else if (instance.vmState == "error") {
                            ct.iaasInstanceStateCount.ERROR++;
                        } else {
                            ct.iaasInstanceStateCount.STOPPED++;
                        }
                    });
                }
            });
            promise.error(function (data, status, headers) {
            });
        };

        // IAAS 가상 서버 할당 정보  리소스 사용 현황
        ct.iaasResourceUsed = {};
        ct.getIaasResourceUsed = function (tenantId) {
            ct.iaasInstanceUsageInit();
            ct.iaasResourceUsed = {};
            var promise = portal.dashboard.getIaasResourceUsed(tenantId);
            promise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0) {
                    ct.iaasResourceUsed = data.content[0];
                    if (ct.iaasResourceUsed.maxResource && ct.iaasResourceUsed.usedResource) {
                        // 할당 코어수
                        ct.iaasInstanceUsage.cpu.maxQuota = ct.iaasResourceUsed.maxResource.cores;
                        ct.iaasInstanceUsage.cpu.usedQuota = ct.iaasResourceUsed.usedResource.cores;
                        ct.iaasInstanceUsage.cpu.percentUsedQuota = (ct.iaasInstanceUsage.cpu.usedQuota/ct.iaasInstanceUsage.cpu.maxQuota) * 100;

                        // 할당 메모리 Byte
                        ct.iaasInstanceUsage.mem.maxQuota = ct.iaasResourceUsed.maxResource.ramSize;
                        ct.iaasInstanceUsage.mem.usedQuota = ct.iaasResourceUsed.usedResource.ramSize;
                        ct.iaasInstanceUsage.mem.percentUsedQuota = (ct.iaasInstanceUsage.mem.usedQuota/ct.iaasInstanceUsage.mem.maxQuota) * 100;

                        // 할당 인스트턴스 용량 Giga Byte
                        ct.iaasInstanceUsage.disk.maxQuota = ct.iaasResourceUsed.maxResource.instanceDiskGigabytes;
                        ct.iaasInstanceUsage.disk.usedQuota = ct.iaasResourceUsed.usedResource.instanceDiskGigabytes;
                        ct.iaasInstanceUsage.disk.percentUsedQuota = (ct.iaasInstanceUsage.disk.usedQuota/ct.iaasInstanceUsage.disk.maxQuota) * 100;

                        // 할당 디스크 용량 Giga Byte
                        ct.iaasInstanceUsage.volume.maxQuota = ct.iaasResourceUsed.maxResource.volumeGigabytes;
                        ct.iaasInstanceUsage.volume.usedQuota = ct.iaasResourceUsed.usedResource.volumeGigabytes;
                        ct.iaasInstanceUsage.volume.percentUsedQuota = (ct.iaasInstanceUsage.volume.usedQuota/ct.iaasInstanceUsage.volume.maxQuota) * 100;

                        var chartData = {
                            code: "0000",
                            cpuTotUsed : ct.iaasInstanceUsage.cpu.percentUsedQuota,
                            ramSizeTot : ct.iaasInstanceUsage.mem.percentUsedQuota,
                            instanceDiskGigabytesTot : ct.iaasInstanceUsage.disk.percentUsedQuota,
                            objectStorageGigaByteTot : ct.iaasInstanceUsage.volume.percentUsedQuota
                        };

                        ct.iaasCpuChartFunc(chartData);
                        ct.iaasMemChartFunc(chartData);
                        ct.iaasStorgeChartFunc(chartData);
                    }
                }

            });
            promise.error(function (data, status, headers) {
            });
        };

        //////////////////////////////// 표준 앱 CPU 상태     ///////////////////////////////////
        // 가상서버 CPU 상태
        ct.paasCpuStatusChart = function () {
            var container = document.getElementById('chart-area6');
            var data = {
                categories: ['20184.01', '2018.06', '2018.12'],
                series: {
                    area: [
                        {
                            name: ' ',
                            data: [80, 60, 90]
                        }
                    ],
                    line: [
                        {
                            name: ' ',
                            data: [80, 60, 90]
                        }
                    ]
                }
            };
            var options = {
                chart: {
                    width: 230,
                    height: 80
                    // title: 'Energy Usage'
                },
                yAxis: {
                    // title: 'Energy (kWh)',
                    min: 0,
                    pointOnColumn: true
                },
                xAxis: {
                    // title: 'Month',
                    tickInterval: 'auto'
                },
                series: {
                    zoomable: true
                },
                tooltip: {
                    suffix: '%'
                },
                legend: {
                    visible: false
                },
                chartExportMenu: {
                    visible: false
                },
            };

            var theme = {
                series: {
                    area: {
                        colors: ['#ffc4c4']
                    },
                    line: {
                        colors: ['#fe5f9e']
                    }
                }
            };

            tui.chart.registerTheme('newTheme', theme);
            options.theme = 'newTheme';
            tui.chart.comboChart(container, data, options);
        };

        // PAAS 가상 서버 할당 정보
        ct.paasAppsStateCountInit = function () {
            // 카운트
            ct.paasAppsStateCount = {
                TOTAL : 0,
                STARTED : 0,
                STOPPED : 0,
                ERROR : 0
            };
        };

        ct.paasAppsUsageInit = function () {
            // 사용량
            ct.paasAppsUsage = {
                sumCount : 0, // 합산 app 카운트 => 순차적 계산을 위한용도
                cpu : {
                    percentUsed : 0, // 사용률 %
                    sumPercentUsed : 0 // 사용률 합산 => 순차적 계산을 위한용도
                },
                disk : {
                    percentUsed : 0, // 사용률 %
                    sumUsed : 0, // 사용량 byte
                    sumQuota : 0 // 할당량 byte
                },
                mem : {
                    percentUsed : 0, // 사용률 %
                    sumUsed : 0, // 사용량 byte
                    sumQuota : 0 // 할당량 byte
                }
            };
        };

        ct.paasAppsStateCountInit();
        ct.paasAppsUsageInit();

        ct.paasApps = [];
        ct.getPaasAppInfosAndInstanceInfosByName = function (orgId) {
            var promise = portal.dashboard.getOrganizationByName(orgId);
            promise.success(function (data) {
                if (data.guid != null) {
                    ct.getPaasAppInfosAndInstanceInfos(data.guid);
                }
            });
            promise.error(function (data) {
            });
        };

        ct.getPaasAppInfosAndInstanceInfos = function (org_guid) {
            ct.paasAppsStateCountInit();
            ct.paasAppsUsageInit();
            ct.paasApps = [];
            var promise = portal.dashboard.getPaasAppInfos(org_guid);
            promise.success(function (data, status, headers) {
                if (data && data.length > 0) {
                    ct.paasApps = data;
                    angular.forEach(ct.paasApps, function (app, appKey) {
                        if (app.state == "STARTED") {
                            ct.paasAppsStateCount.STARTED++;
                            ct.getPaasAppInstanceStatsInfos(app.guid, appKey);
                        } else if (app.state == "STARTING" || app.state == "STOPPED") {
                            ct.paasAppsStateCount.STOPPED++;
                            app.loadInstanceStats = true;
                        } else if (app.state == "FAILED") {
                            ct.paasAppsStateCount.ERROR++;
                            app.loadInstanceStats = true;
                        } else {
                            ct.paasAppsStateCount.STOPPED++;
                            app.loadInstanceStats = true;
                        }
                    });
                    ct.paasAppsStateCount.TOTAL = data.length;
                }

            });
            promise.error(function (data, status, headers) {
            });
        };

        ct.getPaasAppInstanceStatsInfos = function (org_guid, appKey) {
            var promise = portal.dashboard.getPaasAppInstanceStatsInfos(org_guid);
            promise.success(function (data, status, headers) {
                if (data && data.length > 0) {
                    var memQuota = 0;
                    var diskQuota = 0;
                    var sumPercentUsed = 0;
                    var memUsed = 0;
                    var diskUsed = 0;
                    angular.forEach(data, function (instance, key) {
                        memQuota += instance.memQuota;
                        diskQuota += instance.diskQuota;
                        sumPercentUsed += instance.usage.cpu;
                        memUsed += instance.usage.mem;
                        diskUsed += instance.usage.disk;
                    });
                    ct.paasApps[appKey].usage = {};
                    ct.paasApps[appKey].usage.sumPercentUsed = sumPercentUsed;
                    ct.paasApps[appKey].usage.memQuota = memQuota;
                    ct.paasApps[appKey].usage.memUsed = memUsed;
                    ct.paasApps[appKey].usage.diskQuota = diskQuota;
                    ct.paasApps[appKey].usage.diskUsed = diskUsed;
                    ct.paasApps[appKey].loadInstanceStats = true;
                    ct.setPaasAppsUsaged(ct.paasApps[appKey].usage);
                } else {
                    ct.paasApps[appKey].loadInstanceStats = true;
                    ct.setPaasAppsUsaged();
                }
            });
            promise.error(function (data, status, headers) {
                ct.paasApps[appKey].loadInstanceStats = true;
                ct.setPaasAppsUsaged();
            });
        };

        ct.setPaasAppsUsaged = function (usage) {
            if (usage && usage.memQuota && usage.diskQuota) {
                ct.paasAppsUsage.sumCount++;
                ct.paasAppsUsage.cpu.sumPercentUsed += usage.sumPercentUsed;
                ct.paasAppsUsage.mem.sumUsed += usage.memUsed;
                ct.paasAppsUsage.mem.sumQuota += usage.diskQuota;
                ct.paasAppsUsage.disk.sumUsed += usage.diskUsed;
                ct.paasAppsUsage.disk.sumQuota += usage.diskQuota;
            }

            // 모두 로드 되었는지 체크 하는 부분
            var loadInstanceStatsAll = true;
            for (var i=0; i<ct.paasApps.length; i++) {
                if (!ct.paasApps[i].loadInstanceStats) {
                    loadInstanceStatsAll = false;
                    break;
                }
            }
            if (loadInstanceStatsAll) {
                ct.paasAppsUsage.cpu.percentUsed = (ct.paasAppsUsage.cpu.sumPercentUsed/ct.paasAppsUsage.sumCount)*100;
                ct.paasAppsUsage.mem.percentUsed = (ct.paasAppsUsage.mem.sumUsed/ct.paasAppsUsage.mem.sumQuota)*100;
                ct.paasAppsUsage.disk.percentUsed = (ct.paasAppsUsage.disk.sumUsed/ct.paasAppsUsage.disk.sumQuota)*100;

                // 이부분이 모두 로드된 상황임
                if (ct.paasAppsUsage.sumCount > 0) {
                    ct.paasAppsUsage.code = '0000';
                } else {
                    ct.paasAppsUsage.code = '1111';
                }
                ct.paasCpuChartFunc (ct.paasAppsUsage) ;
                ct.paasMemChartFunc (ct.paasAppsUsage) ;
                ct.paasStorgeChartFunc(ct.paasAppsUsage) ;
            }
        };

        ct.dataReq10 = {
            totCnt: 0,
            svnCnt: 0,
            gitCnt: 0
        };

        ct.pipelineDashboardInfo = {
            sucCnt: 0,
            failCnt: 0,
            totCnt : 0
        };

        ct.getPipelineDashBoardInfo = function (projectId) {
            var promise = portal.dashboard.getPipelineDashBoardInfo(projectId);
            promise.success(function (data, status, headers) {
                if (data.code == '0000' && data.apiTotalCnt > 0 ) {
                    ct.pipelineDashboardInfo = data;
                    ct.pipChartFunc (ct.pipelineDashboardInfo) ;
                    ct.barChartFunc (ct.pipelineDashboardInfo) ;
                }
            });
            promise.error(function (data, status, headers) {
            });
        };

        ct.gisDashBoardInfo = {
            layAllCnt: 0,
            prjcLayCnt: 0,
            styAllCnt: 0
        };

        ct.getGisDashBoardInfo = function (projectId) {
            var promise = portal.dashboard.getGisDashBoardInfo(projectId);
            promise.success(function (data, status, headers) {
                ct.gisDashBoardInfo = data;
            });
            promise.error(function (data, status, headers) {
            });
        };

        ct.loadDashBoard = function () {
            // Dcp 정보
            ct.getDcpDashboardInfo(ct.paramId);
            // Apip 정보
            ct.getApipDashBoardInfo();

            // IaaS 정보
            if ($scope.main.userTenantId) {
                ct.iaasCpuStatusChart();
                ct.getIaasInseanceInfos($scope.main.userTenantId);
                ct.getIaasResourceUsed($scope.main.userTenantId);
            }

            // PaaS 정보
            if ($scope.main.sltPortalOrg && $scope.main.sltOrganizationGuid) {
                ct.paasCpuStatusChart();
                ct.getPaasAppInfosAndInstanceInfos($scope.main.sltOrganizationGuid);
            }
            // Pipeline 정보
            ct.getPipelineDashBoardInfo(ct.paramId);
            // Gis 정보
            ct.getGisDashBoardInfo(ct.paramId);
        };

        /**************************************************************************/

        // 이미지 변경
        ct.createOrgProjectIcon = function($event) {
            var dialogOptions = {
                title : '프로젝트 이미지 변경',
                formName : 'popThumModifyForm',
                dialogClassName : 'modal-dialog-popThumModify',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgIcon.html' + _VersionTail(),
                okName : '업로드'
            };
            common.showDialog($scope, $event, dialogOptions);

            ct.uploadedNoticeFile = [];
            ct.uploader = common.setDefaultFileUploader($scope);
            ct.uploader.onAfterAddingFile = function(fileItem) {
                ct.uploadedNoticeFile.push(fileItem._file);
                $('#userfile').val(fileItem._file.name);
            };

            $scope.popDialogOk = function() {
                ct.createOrgProjectIconAction();
            };
            
            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };
        };

        // 이미지 변경 액션
        ct.createOrgProjectIconAction = function () {
            if (!ct.uploadedNoticeFile[ct.uploadedNoticeFile.length - 1]) {
                common.showAlertWarning('프로젝트 로고를 선택하십시오.');
                return;
            }

            var body = {};
            body.iconFile = ct.uploadedNoticeFile[ct.uploadedNoticeFile.length - 1];

            $scope.main.loadingMain = true;
            var promise = orgService.createOrgIcon(ct.paramId, body);
            promise.success(function (data, status, headers) {
                $scope.main.loadingMain = false;
                ct.selOrgProject.iconImage = data;
                common.mdDialogHide();
                common.showAlertSuccess('업로드 되었습니다');
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMain = false;
                common.showAlertError('프로젝트 로고 업로드 실패하였습니다.');
            });
        };

        // 조직 설명 추가
        ct.createOrgProjectDesc = function($event) {
            ct.selOrgProject.updatedDescription = ct.selOrgProject.description;
            var dialogOptions = {
                title : '프로젝트 설명',
                formName : 'popOrgDescriptionForm',
                dialogClassName : 'modal-dialog-popOrgDescription',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgDescription.html' + _VersionTail(),
                okName : '수정',
                closeName : '취소'
            };
            common.showDialog($scope, $event, dialogOptions);

            $scope.popDialogOk = function() {
                ct.createOrgProjectDescAction();
            };

            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };
        };

        // 조직 설명 추가 액션
        ct.createOrgProjectDescAction = function () {
            var params = {
                description : $('#description_toUpdate').val()
            };

            $scope.main.loadingMain = true;
            var promise = orgService.updateOrgDescription(ct.paramId, params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_update'));
                common.mdDialogHide();
                ct.selOrgProject.description = params.description;
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_update'));
            });
        };

        // 조직 삭제
        ct.deleteOrgProject = function () {
            var showConfirm = common.showConfirm($translate.instant('label.del') + '(' + ct.selOrgProject.orgName + ')', '프로젝트를 삭제하시겠습니까?');
            showConfirm.then(function () {
                ct.deleteOrgProjectAction();
            });
        };

        // 조직 삭제 액션
        ct.deleteOrgProjectAction = function () {
            $scope.main.loadingMainBody = true;
            var promise = orgService.deleteOrg(ct.paramId);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '해당 프로젝트를 삭제 처리 중 입니다.');
                $scope.main.goToPage('/comm/projects');
            });
            promise.error(function (data, status) {
                $scope.main.loadingMainBody = false;
                if (status == 406) {
                    common.showAlertError($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '삭제 권한이 없습니다.');
                } else if (status == 403) {
                    common.showAlertErrorHtml($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '아래 시스템에서 사용중 입니다.');
                } else {
                    common.showAlertError('', data);
                }
            });
        };

        // 사용자 목록 조회
        ct.listOrgUsers = function () {
            var promise = orgService.listOrgUsers(ct.paramId);
            promise.success(function (data) {
                ct.orgUsers = data.items;
            });
            promise.error(function (data) {
            });
        };

        ct.replaceCallBackFunction = function () {
            ct.listOrgUsers();
        };

        // 사용자 검색 추가 버튼 클릭
        ct.popOrgProjectSchAddUsersOpen = function ($event) {
            $scope.dialogOptions = {
                controller : "commPopOrgProjectSchAddUsersCtrl",
                formName : 'popOrgProjectSchAddUsersForm',
                dialogClassName : "modal-xlg",
                orgProject : angular.copy(ct.selOrgProject),
                callBackFunction : ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // 사용자 신규 추가 버튼 클릭
        ct.popOrgProjectNewAddUsersOpen = function ($event) {
            $scope.dialogOptions = {
                controller : "commPopOrgProjectNewAddUsersCtrl",
                dialogClassName : "modal-xlg",
                formName : 'popOrgProjectNewAddUsersForm',
                orgProject : angular.copy(ct.selOrgProject),
                callBackFunction : ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // 비밀번호 초기화
        ct.resetPassword = function (user) {
            var showConfirm = common.showConfirm('비밀번호 초기화', user.name + '(' + user.email + ') 비밀번호(kepco12345) 초기화하시겠습니까?');
            showConfirm.then(function() {
                ct.resetPasswordAction(user);
            });
        };

        // 비밀번호 초기화 액션
        ct.resetPasswordAction = function (user) {
            var password = 'kepco12345';
            $scope.main.loadingMain = true;
            var promise = memberService.resetPassword(user.email, password);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess('비밀번호가 정상적으로 초기화되었습니다');
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError('비밀번호 초기화가 실패하였습니다.');
            });
        };

        // 사용자 삭제
        ct.deleteOrgProjectUser = function (user) {
            var showConfirm = common.showConfirm($translate.instant('label.del'), user.name + ' ' + $translate.instant('message.mq_delete'));
            showConfirm.then(function() {
                ct.deleteOrgProjectUserAction(user);
            });
        };

        // 사용자 삭제 액션
        ct.deleteOrgProjectUserAction = function (user) {
            $scope.main.loadingMain = true;
            var promise = orgService.deleteOrgUser(ct.paramId, user.email);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                ct.listOrgUsers();
                common.showAlertSuccess(user.name + ' ' + $translate.instant('message.mi_egov_success_common_delete'));
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_delete'));
            });
        };

        // 자원 조회
        ct.listQuotaHistory = function () {
            var params = {
                type : 'ORG', // PROJECT, ORG
                id : ct.selOrgProject.id
            };
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listQuotaHistory(params);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.quotaHistory = data;

                for (var i = 0; i < data.items.length; i++) {
                    var item = data.items[i];
                    if (item.status == 'REQUEST') {
                        ct.orgRequest = false;
                        break;
                    }
                }
            });
            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 용량 조회
        ct.listOrgQuotas = function () {
            var params = {
                projectId : ct.selOrgProject.project.id
            };

            var promise = quotaService.listOrgQuotas(params);
            promise.success(function (data) {
                ct.orgQuotas = data.items;

                // 현재 사용하고 있는 용량 표시
                for (var i = 0; i < ct.orgQuotas.length; i++) {
                    if (ct.orgQuotas[i].name == ct.selOrgProject.quotaId.name) {
                        ct.quotaHistory.quotaReq = ct.orgQuotas[i];
                        break;
                    }
                }
            });
            promise.error(function (data) {
                ct.orgQuotas = {};
            });
        };

        // 용량 변경
        ct.updateQuota = function($event) {
            var dialogOptions = {
                title : '용량 변경 요청',
                formName : 'projectDetailAsideQuotaReqForm',
                dialogClassName : 'modal-dialog-projectDetailAsideQuotaReq',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgQuota.html' + _VersionTail(),
            };
            common.showDialog($scope, $event, dialogOptions);

            $scope.popDialogOk = function() {
                ct.updateQuotaAction();
            };

            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };

            ct.listOrgQuotas();
        };

        // 용량 변경 액션
        ct.updateQuotaAction = function () {
            if (ct.quotaHistory.quotaReq == undefined) {
                common.showAlert('용량 변경 요청', '1. 변경 요청할 용량을 선택해주세요.');
                return;
            }
            if (ct.quotaHistory.quotaReq.name == ct.selOrgProject.quotaId.name) {
                common.showAlert('용량 변경 요청', ct.quotaHistory.quotaReq.name + ' 현재 사용하고 있는 용량과 동일합니다.');
                return;
            }
            if (ct.quotaHistory.messageReq == null) {
                common.showAlert('용량 변경 요청', '2. 변경 요청 사유를 입력해 주세요.');
                return;
            }

            var params = {};
            params.type = 'ORG';
            params.org = {};
            params.org.id = ct.selOrgProject.id;
            params.quotaReq = {};
            params.quotaReq.id = ct.quotaHistory.quotaReq.id;
            params.messageReq = ct.quotaHistory.messageReq;

            $scope.main.loadingMain = true;
            var promise = quotaService.requestQuota(params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
                common.mdDialogHide();
                ct.listQuotaHistory();
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };

        ct.pageLoadData = function () {
            ct.getOrgProject();
            ct.listOrgUsers();
        };

        ct.pageLoadData();
    })
    .controller('commPopOrgProjectSchAddUsersCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache, ValidationService, orgService, memberService, projectService, CONSTANTS, SITEMAP) {
        _DebugConsoleLog('orgDetailControllers.js : commPopOrgProjectSchAddUsersCtrl', 1);

        var pop = this;

        pop.validationService = new ValidationService();
        pop.formName = $scope.dialogOptions.formName;

        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.title = "조회 등록";
        $scope.dialogOptions.okName = "생성";
        $scope.dialogOptions.closeName = "취소";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popOrgProjectSchAddUsersForm.html" + _VersionTail();


        pop.orgProject = $scope.dialogOptions.orgProject;

        $scope.actionBtnHied = false;
        $scope.actionLoading = false;

        $scope.popDialogOk = function () {
            pop.addSchOrgUsersAction();
        };

        pop.btnClickCheck = false;

        pop.orgRoleNames = CONSTANTS.roleName;
        pop.paramId = $stateParams.orgId;

        pop.schKey = "";
        pop.schText = "";

        pop.schAddOrgUsers = [];
        pop.schAddOrgUserEmails = [];

        // paging
        pop.pageOptions = {
            currentPage : 1,
            pageSize : 5,
            total : 1
        };

        // 등록 사용자 목록 조회
        pop.listOrgUsers = function () {
            pop.orgUserEmails = [];
            pop.isAdmin = false;
            var promise = orgService.listOrgUsers(pop.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                if (orgUsers && orgUsers.length > 0) {
                    angular.forEach(orgUsers, function (orgUser, key) {
                        pop.orgUserEmails.push(orgUser.usersInfo.email);
                        if(orgUser.isAdmin){
                            pop.isAdmin = true;
                        }
                    });
                }
                pop.loadListOrgUsers = true;
                if (pop.loadListAllUsers) {
                    pop.setOrgNotUsers();
                }
            });
            promise.error(function (data) {
            });
        };

        // 전체 사용자 조회
        pop.listAllUsers = function () {
            $scope.main.loadingMainBody = true;
            var promise = memberService.listAllUsers();
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                pop.allUsers = data.items;
                pop.loadListAllUsers = true;
                if (pop.loadListOrgUsers) {
                    pop.setOrgNotUsers();
                }
            });

            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 조직 신규 사용자 등록을 위한 미동록 사용 목록 조회
        pop.setOrgNotUsers = function () {
            pop.orgNotUsers = [];
            if (pop.allUsers && pop.allUsers.length > 0) {
                angular.forEach(pop.allUsers, function (user, key) {
                    if (pop.orgUserEmails.indexOf(user.email) == -1 && pop.schAddOrgUserEmails.indexOf(user.email) == -1) {
                        if (pop.schText) {
                            if (pop.schKey == "email" || pop.schKey == "name") {
                                if (user[pop.schKey].toLowerCase().indexOf(pop.schText.toLowerCase()) > -1) {
                                    pop.orgNotUsers.push(angular.copy(user));
                                }
                            } else {
                                if (user.email.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1 || user.name.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1) {
                                    pop.orgNotUsers.push(angular.copy(user));
                                }
                            }
                        } else {
                            pop.orgNotUsers.push(angular.copy(user));
                        }
                    }
                });
            }
            pop.pageOptions.total = pop.orgNotUsers.length;
            var maxCurrentPage = parseInt(pop.pageOptions.total/pop.pageOptions.pageSize) + 1;
            if (pop.pageOptions.currentPage > maxCurrentPage) {
                pop.pageOptions.currentPage = maxCurrentPage;
            }
        };

        // 전체 선택
        pop.checkAll = function ($event) {
            for (var i = 0; i < pop.orgNotUsers.length; i++) {
                if ((i >= (pop.pageOptions.pageSize * (pop.pageOptions.currentPage-1))) && (i < (pop.pageOptions.pageSize * (pop.pageOptions.currentPage)))) {
                    pop.orgNotUsers[i].checked = $event.currentTarget.checked;
                }
            }
        };

        pop.sltUserMove = function () {
            if (pop.orgNotUsers && pop.orgNotUsers.length > 0) {
                angular.forEach(pop.orgNotUsers, function (user, key) {
                    if (user.checked) {
                        var addOrgUser = angular.copy(user);
                        addOrgUser.roleName = pop.orgRoleNames.user;
                        addOrgUser.checked = false;
                        pop.schAddOrgUserEmails.push(addOrgUser.email);
                        pop.schAddOrgUsers.push(addOrgUser);
                    }
                });
                pop.setOrgNotUsers();
            }
        };

        pop.sltOrgUserClear = function () {
            if (pop.schAddOrgUsers && pop.schAddOrgUsers.length > 0) {
                pop.schAddOrgUserEmails = [];
                for (var i=(pop.schAddOrgUsers.length-1); i>=0; i--) {
                    pop.schAddOrgUserEmails.splice(i, 1);
                    if (pop.schAddOrgUsers[i].checked) {
                        pop.schAddOrgUsers.splice(i, 1);
                    } else {
                        pop.schAddOrgUserEmails.push(pop.schAddOrgUsers[i].email);
                    }
                }
                angular.forEach(pop.schAddOrgUsers, function (orgUser, key) {
                });
                pop.setOrgNotUsers();
            }
        };

        // 사용자 조회 등록
        pop.addSchOrgUsersAction = function () {
            if (pop.btnClickCheck) {
                return;
            }
            pop.btnClickCheck = true;

            if (!pop.schAddOrgUsers || pop.schAddOrgUsers.length == 0) {
                common.showAlert($translate.instant('message.mi_dont_exist_checked'));
                pop.btnClickCheck = false;
                return;
            }

            var orgUserRequests = [];
            var checkAdminCnt = 0;
            angular.forEach(pop.schAddOrgUsers, function (orgUser) {
                orgUserRequests.push({
                    email : orgUser.email,
                    name : orgUser.name,
                    userRole : orgUser.roleName
                });
                if(orgUser.roleName == "ADMIN"){
                    checkAdminCnt++;
                }
            });

            if (checkAdminCnt >= 2) {
                common.showAlertError("사용자 등록시 관리자 역할은 한 명만 지정할 수 있습니다.");
                pop.btnClickCheck = false;
                return;
            }

            $scope.main.loadingMain = true;
            common.mdDialogHide();
            var promise = orgService.orgUserAdds(pop.paramId, orgUserRequests);
            promise.success(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
                if ( angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
            });
            promise.error(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };

        pop.pageListOrgUsersLoadData = function (page) {
            pop.pageOptions.currentPage = page;
            pop.loadListOrgUsers = false;
            pop.loadListAllUsers = false;
            pop.listOrgUsers();
            pop.listAllUsers();
        };

        pop.pageListOrgUsersLoadData(1);
    })
    .controller('commPopOrgProjectNewAddUsersCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache, ValidationService, orgService, memberService, projectService, CONSTANTS, SITEMAP) {
        _DebugConsoleLog('orgDetailControllers.js : commPopOrgProjectNewAddUsersCtrl', 1);

        var pop = this;

        pop.validationService = new ValidationService();
        pop.formName = $scope.dialogOptions.formName;

        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.title = "직접 등록";
        $scope.dialogOptions.okName = "생성";
        $scope.dialogOptions.closeName = "취소";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popOrgProjectNewAddUsersForm.html" + _VersionTail();

        pop.orgProject = $scope.dialogOptions.orgProject;

        $scope.actionBtnHied = false;
        $scope.actionLoading = false;

        pop.orgRoleNames = CONSTANTS.roleName;
        pop.paramId = $stateParams.orgId;

        pop.newOrgUsers = [];
        pop.orgUserEmails = [];
        pop.notOrgUserEmails = [];

        pop.addNewOrgUsers = function () {
            pop.newOrgUsers.push({
                roleName : pop.orgRoleNames.user,
                email : "",
                name : "",
                position : "",
                add : true,
                del : false
            });
        };

        // 등록 사용자 목록 조회
        pop.listOrgUsers = function () {
            pop.orgUserEmails = [];
            pop.isAdmin = false;
            var promise = orgService.listOrgUsers(pop.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                if (orgUsers && orgUsers.length > 0) {
                    angular.forEach(orgUsers, function (orgUser, key) {
                        pop.orgUserEmails.push(orgUser.usersInfo.email);
                        if(orgUser.isAdmin){
                            pop.isAdmin = true;
                        }
                    });
                }
                pop.loadListOrgUsers = true;
                if (pop.loadListAllUsers) {
                    pop.setOrgNotUsers();
                }
            });
            promise.error(function (data) {
            });
        };

        // 전체 사용자 조회
        pop.listAllUsers = function () {
            $scope.main.loadingMainBody = true;
            var promise = memberService.listAllUsers();
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                pop.allUsers = data.items;
                pop.loadListAllUsers = true;
                if (pop.loadListOrgUsers) {
                    pop.setOrgNotUsers();
                }
            });

            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 조직 신규 사용자 등록을 위한 미동록 사용 목록 조회
        pop.setOrgNotUsers = function () {
            pop.notOrgUserEmails = [];
            if (pop.allUsers && pop.allUsers.length > 0) {
                angular.forEach(pop.allUsers, function (user, key) {
                    if (pop.orgUserEmails.indexOf(user.email) == -1) {
                        pop.notOrgUserEmails.push(user.email);
                    }
                });
            }
        };

        // 사용자 아이디 중복 체크
        pop.checkOrgUserDup = function (email, key) {
            if (!email) {
                return;
            }
            if (pop.orgUserEmails.indexOf(email) > -1 ) {
                common.showAlertError('이미 회원가입/프로젝트 구성원 추가한 아이디(' + email + ')입니다.');
                return;
            }
            if (pop.notOrgUserEmails.indexOf(email) > -1 ) {
                common.showAlertError('이미 회원가입한 아이디(' + email + ')입니다.');
                return;
            }
            // 등록하려는 사용자 목록에서 조회
            for (var i = 0; i < pop.newOrgUsers.length; i++) {
                if (i != key && email.indexOf(pop.newOrgUsers[i].email) > -1) {
                    common.showAlertError('직접 등록 사용자 목록에 존재하는 아이디(' + email + ')입니다.');
                    return;
                }
            }

            common.showAlertSuccess('회원가입 가능한 아이디(' + email + ')입니다.');
        };

        pop.checkPasswordPattern = function (password) {
            var regex = /^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z]{10,20}$/;
            if(!regex.test(password)) {
                common.showAlertWarning('영문, 숫자를 포함한 10~20자의 비밀번호를 입력하십시오.');
                return false;
            }
            return true;
        };

        // 사용자 직접 등록
        pop.addCustomOrgUser = function (orgUser) {
            if (!orgUser.name) {
                common.showAlertWarning('이름을 입력하세요');
                return;
            }
            if (!orgUser.position) {
                common.showAlertWarning('소속을 입력하세요');
                return;
            }
            if (!orgUser.email) {
                common.showAlertWarning('아이디를 입력하세요');
                return;
            }
            if (!orgUser.password) {
                common.showAlertWarning('비밀번호를 입력하세요');
                return;
            }
            if (!pop.checkPasswordPattern(orgUser.password)) {
                return;
            }
            pop.addNewOrgUsers();
        };

        pop.deleteCustomOrgUser = function (key) {
            pop.newOrgUsers.splice(key, 1);
        };

        // 사용자 등록 액션
        pop.addOrgUsersAction = function (orgUserRequests) {
            $scope.main.loadingMain = true;
            var promise = orgService.orgUserAdds(pop.paramId, orgUserRequests);
            promise.success(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
                if (angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
            });
            promise.error(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };

        // 사용자 직접 등록 액션
        pop.btnClickCheck = false;
        pop.addCustomOrgUserAction = function () {
            if (pop.btnClickCheck) {
                return;
            }
            pop.btnClickCheck = true;
            pop.orgUserRequests = [];
            var checkAdminCnt = 0;
            for (var i = 0; i < pop.newOrgUsers.length; i++) {
                if (!pop.newOrgUsers[i].name) {
                    common.showAlertWarning('이름을 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.newOrgUsers[i].position) {
                    common.showAlertWarning('소속을 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.newOrgUsers[i].email) {
                    common.showAlertWarning('아이디를 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.newOrgUsers[i].password) {
                    common.showAlertWarning('비밀번호를 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.checkPasswordPattern(pop.newOrgUsers[i].password)) {
                    pop.btnClickCheck = false;
                    return;
                }
                pop.orgUserRequests.push({
                    email : pop.newOrgUsers[i].email,
                    name : pop.newOrgUsers[i].name,
                    userRole : pop.newOrgUsers[i].roleName
                });
                if(pop.newOrgUsers[i].roleName == "ADMIN"){
                    checkAdminCnt++;
                }
            }

            if (checkAdminCnt >= 2) {
                common.showAlertError("사용자 등록시 관리자 역할은 한 명만 지정할 수 있습니다.");
                pop.btnClickCheck = false;
                return;
            }

            if (pop.newOrgUsers.length == 0) {
                common.showAlertWarning($translate.instant('message.mi_dont_exist_checked'));
                pop.btnClickCheck = false;
                return;
            }

            common.mdDialogHide();
            $scope.main.loadingMain = true;
            for (var i = 0; i < pop.newOrgUsers.length; i++) {
                var item = pop.newOrgUsers[i];
                // 모든 사용자 생성 이후 조직 등록
                var totalUsers = 0;

                var param = {};
                param.name = item.name;
                param.position = item.position;
                param.email = item.email;
                param.password = item.password;
                param.userType = 'normal';
                var promise = memberService.createUser(param);
                promise.success(function (data) {
                    totalUsers++;
                    if (totalUsers == pop.newOrgUsers.length) {
                        pop.addOrgUsersAction(pop.orgUserRequests);
                    }
                });
                promise.error(function (data) {
                    totalUsers++;
                    $scope.main.loadingMain = false;
                    if (totalUsers == pop.newOrgUsers.length) {
                        pop.addOrgUsersAction(pop.orgUserRequests);
                    }
                    common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
                });
            }
        };

        $scope.popDialogOk = function () {
            pop.addCustomOrgUserAction();
        };

        pop.pageListOrgUsersLoadData = function () {
            pop.loadListOrgUsers = false;
            pop.loadListAllUsers = false;
            pop.listOrgUsers(1);
            pop.listAllUsers();
        };

        pop.addNewOrgUsers();

        pop.pageListOrgUsersLoadData();
    })
;
