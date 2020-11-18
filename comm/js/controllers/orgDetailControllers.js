'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $q, ValidationService, common, cache, orgService, portal, quotaService, memberService, CONSTANTS) {
        _DebugConsoleLog('orgDetailControllers.js : commOrgProjectDetailCtrl', 1);

        var ct = this;

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        ct.paramId = $stateParams.orgId;
        // ct.isOrgManager = false;     // 공통 컨트롤러 에서 처리
        /* 20.04.24 - 프로젝트 목록 : 우측 메뉴 기능 by ksw */
        /* 사용자 변경을 통해 DetailController로 넘어올 경우 구성원 탭 선택(기본은 대시보드) */
        if (orgService.changeUser) {
            ct.sltInfoTab = 'member';
        } else {
            ct.sltInfoTab = 'dashboard';
        }

        ct.isQuotaChange = true;    //쿼터변경요청 가능 여부, 첫건이 '요청'상태일 때 요청불가
        ct.loadQuotaHistory = false;    //쿼터변경요청 조회여부
        ct.loadOrgQuotas = false;       //쿼터값(미터링포함) 조회여부

        // 탭 변경
        ct.changeSltInfoTab = function (sltInfoTab) {
            ct.sltInfoTab = sltInfoTab;

            if (sltInfoTab == 'resource') {
                ct.listPaasQuotas();
                //ct.listQuotaHistories();
                //ct.listOrgQuotaValues();
            }
        };

        // 조직 정보 조회
        ct.getOrgProject = function () {
            ct.searchFirst = false;
            if (!$scope.main.reloadTimmer['getOrgProject_' + ct.paramId]) {
                $scope.main.loadingMainBody = true;
                ct.searchFirst = true;
            }
            var orgPromise = orgService.getOrg(ct.paramId);
            orgPromise.success(function (data) {
                //생성 완료되지 않은 경우 재조회. 2019.07.29
                if (data.statusCode == "creating") {
                    if (ct.searchFirst) {
                        common.showAlertWarning("프로젝트 생성 중입니다.");
                    }
                    $scope.main.reloadTimmer['getOrgProject_' + ct.paramId] = $timeout(function () {
                        console.log("재조회 : getOrgProject_" + ct.paramId);
                        ct.getOrgProject();
                    }, 2000);
                } else {
                    $scope.main.loadingMainBody = false;
                    if ($scope.main.reloadTimmer['getOrgProject_' + ct.paramId]) {
                        $timeout.cancel($scope.main.reloadTimmer['getOrgProject_' + ct.paramId]);
                        $scope.main.reloadTimmer['getOrgProject_' + ct.paramId] = null;
                    }
                    ct.selOrgProject = data;
                    // 공통 컨트롤러 에서 처리
                    /*if (ct.selOrgProject.myRoleName == 'OWNER' || ct.selOrgProject.myRoleName == 'ADMIN') {
                        ct.isOrgManager = true;
                    }*/
                    $timeout(function () {
                        $scope.main.changePortalOrg(data);
                        ct.loadDashBoard();
                    }, 0);
                }
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

        //////////////////////////////// 데이터 카탈로그 이용 현황 Chart  ///////////////////////////////////
        ct.ctlgChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var ser3 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '200') {
                ser1.name = "반려";
                ser1.data = chartData.ctlgRejectCnt;  //반려
                reqJsonArray.push(ser1);

                ser2.name = "승인";
                ser2.data = chartData.ctlgApproveCnt;  //승인
                reqJsonArray.push(ser2);

                ser3.name = "대기";
                ser3.data = chartData.ctlgWaitCnt;  //대기
                reqJsonArray.push(ser3);

                serJsonList.series = reqJsonArray;
            }

            var ctlgTotalCnt = parseInt(chartData.ctlgRejectCnt) + parseInt(chartData.ctlgApproveCnt) + parseInt(chartData.ctlgWaitCnt) ; // 전체

            ct.ctlgDashboardInfo.ctlgTotalCnt = ctlgTotalCnt;

            var chartArea = 'chart-area12';
            ct.semiChart (chartArea, serJsonList) ;
        };

        //////////////////////////////// API서비스 사용현황 Chart  ///////////////////////////////////
        ct.apiChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
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
                ser1.cpuMax = chartData.cpuMax;
                ser1.cpuUsed = chartData.cpuUsed;
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
                ser1.ramSizeMax = chartData.ramSizeMax;
                ser1.ramSizeUsed = chartData.ramSizeUsed;
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq5 = serJsonList;
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
                ser1.data = chartData.objectStorageGigaByteTot.toFixed(1); // volume
                ser1.objectStorageGigaByteMax = chartData.objectStorageGigaByteMax;
                ser1.objectStorageGigaByteUsed = chartData.objectStorageGigaByteUsed;
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.dataReq6 = serJsonList;
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
            ser1.data = 0;
            ser1.data = ser1.data.toFixed(1);
            ser2.data = 100;
            ser1.name = "사용율";
            ser2.name = "미사용율";
            if (tmpCode == '0000') {
                ser1.data = chartData.cpu.percentUsed.toFixed(1);
                ser2.data = parseInt(100 - parseInt(ser1.data));
            }
            reqJsonArray.push(ser1);
            reqJsonArray.push(ser2);
            serJsonList.series = reqJsonArray;

            ct.dataReq7 = ser1.data;
            var chartArea = 'chart-area7';
            var tmpValue = '%';

            //PaaS CPU Color
            var tmpColor1 = '#0a88bd';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2);
        };

        //////////////////////////////// 표준 앱 MEMORY    ///////////////////////////////////
        ct.paasMemChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();
            ser1.data = 0;
            ser1.data = ser1.data.toFixed(1);
            ser2.data = 100;
            ser1.name = "사용율";
            ser2.name = "미사용율";

            if (tmpCode == '0000') {
                ser1.data = chartData.mem.percentUsed.toFixed(1);
                ser2.data = parseInt(100 - parseInt(ser1.data));
            }
            reqJsonArray.push(ser1);
            reqJsonArray.push(ser2);
            serJsonList.series = reqJsonArray;

            ct.dataReq8 = ser1.data;
            var chartArea = 'chart-area8';
            var tmpValue = '%';

            var tmpColor1 = '#fe3392';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2);
        };

        //////////////////////////////// 표준 앱 STOREGE  ajax sg0730 2018.10.15     ///////////////////////////////////
        ct.paasStorgeChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();
            ser1.data = 0;
            ser1.data = ser1.data.toFixed(1);
            ser2.data = 100;
            ser1.name = "사용율";
            ser2.name = "미사용율";
            if (tmpCode == '0000') {
                ser1.data = chartData.disk.percentUsed.toFixed(1);
                ser2.data = parseInt(100 - parseInt(ser1.data));
            }
            reqJsonArray.push(ser1);
            reqJsonArray.push(ser2);
            serJsonList.series = reqJsonArray;

            ct.dataReq9 = ser1.data;
            var chartArea = 'chart-area9';
            var tmpValue = '%';
            var tmpColor1 = '#fe3392';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// GPU 인스턴스 CPU    ///////////////////////////////////
        ct.gpuCpuChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                //ct.dataReq4 = { };
                ser1.name = "사용율";
                ser1.data = chartData.cpuTotUsed.toFixed(1);
                ser1.cpuMax = chartData.cpuMax;
                ser1.cpuUsed = chartData.cpuUsed;
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.gpuDataReq4 = serJsonList  ;
            var chartArea = 'chart-area-gpu3';
            var tmpValue = '%';

            //CPU Chart Color
            var tmpColor1 = "#0a88bd";
            var tmpColor2 = "#ebebeb";

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// GPU 인스턴스 MEMORY     ///////////////////////////////////
        ct.gpuMemChartFunc = function (chartData) {
            var tmpCode = chartData.code ;
            var reqJsonArray = new Array();
            var ser1 = new Object();
            var ser2 = new Object();
            var serJsonList = new Object();

            if (tmpCode == '0000') {
                ser1.name = "사용율";
                ser1.data = chartData.ramSizeTot.toFixed(1);
                ser1.ramSizeMax = chartData.ramSizeMax;
                ser1.ramSizeUsed = chartData.ramSizeUsed;
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.gpuDataReq5 = serJsonList;
            var chartArea = 'chart-area-gpu4';
            var tmpValue = '%';
            //Memory Chart Color
            var tmpColor1 = '#fe3392';
            var tmpColor2 = '#ebebeb';

            ct.pieChart (chartArea, serJsonList, tmpValue, tmpColor1, tmpColor2) ;
        };

        //////////////////////////////// GPU 인스턴스 STORAGE      ///////////////////////////////////
        ct.gpuStorgeChartFunc = function (chartData) {
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
                ser1.data = chartData.objectStorageGigaByteTot.toFixed(1); // volume
                ser1.objectStorageGigaByteMax = chartData.objectStorageGigaByteMax;
                ser1.objectStorageGigaByteUsed = chartData.objectStorageGigaByteUsed;
                reqJsonArray.push(ser1);

                ser2.name = "미사용율";
                ser2.data = parseInt(100 - parseInt(ser1.data));
                reqJsonArray.push(ser2);
                serJsonList.series = reqJsonArray;
            }

            ct.gpuDataReq6 = serJsonList;
            var chartArea = 'chart-area-gpu5';
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

        //////////////////////////////// 데이터 카탈로그 이용현황  ///////////////////////////////////
        ct.ctlgDashboardInfo = {
            ctlgTotalCnt : 0,
            ctlgApproveCnt : 0,
            ctlgWaitCnt : 0,
            ctlgRejectCnt : 0
        };

        ct.getCtlgDashboardInfo = function (projectId) {
            var promise = portal.dashboard.getCtlgDashboardInfo(projectId);
            promise.success(function (data, status, headers) {
                if (data.code == '200' && data.ctlgTotalCnt > 0 ) {
                    ct.ctlgDashboardInfo = data;
                    // Semi Chart
                    ct.ctlgChartFunc(ct.ctlgDashboardInfo) ;
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

        ct.getApipDashBoardInfo = function (projectId) {
            var promise = portal.dashboard.getApipDashBoardInfo(projectId);
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

        // IAAS 가상 서버 정보 - 2020.08.19 (DB 조회로 속도개선)
        ct.iaasInstances = [];
        ct.getIaasInstanceVmsView = function (tenantId) {
            ct.iaasInstanceStateCountInit();
            ct.iaasInstances = [];
            var promise = portal.dashboard.getIaasInstanceVmsView(tenantId);
            promise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0) {
                    ct.iaasInstances = data.content;
                    angular.forEach(ct.iaasInstances, function (instance, instanceKey) {
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

        // IAAS 가상 서버 할당 정보  리소스 사용 현황 - 2020.08.18 (DB 조회로 속도개선)
        ct.iaasResourceUsed = {};
        ct.getIaasResourceUsedLookup = function (tenantId) {
            ct.iaasInstanceUsageInit();
            ct.iaasResourceUsed = {};
            var promise = portal.dashboard.getIaasResourceUsedLookup(tenantId);
            promise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.iaasResourceUsed = data.content;
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
                            cpuMax : ct.iaasInstanceUsage.cpu.maxQuota,
                            cpuUsed : ct.iaasInstanceUsage.cpu.usedQuota,
                            ramSizeTot : ct.iaasInstanceUsage.mem.percentUsedQuota,
                            ramSizeMax : ct.iaasInstanceUsage.mem.maxQuota,
                            ramSizeUsed : ct.iaasInstanceUsage.mem.usedQuota,
                            instanceDiskGigabytesTot : ct.iaasInstanceUsage.disk.percentUsedQuota,
                            objectStorageGigaByteTot : ct.iaasInstanceUsage.volume.percentUsedQuota,
                            objectStorageGigaByteMax : ct.iaasInstanceUsage.volume.maxQuota,
                            objectStorageGigaByteUsed : ct.iaasInstanceUsage.volume.usedQuota
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
                categories: ['2018.01', '2018.06', '2018.12'],
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
                        if (instance.usage) {
                            if (instance.usage.cpu) {
                                sumPercentUsed += instance.usage.cpu;
                            }
                            if (instance.usage.mem) {
                                memUsed += instance.usage.mem;
                            }
                            if (instance.usage.disk) {
                                diskUsed += instance.usage.disk;
                            }
                        }
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

        //////////////////////////////// CPU 상태  ///////////////////////////////////
        // GPU 인스턴스 CPU 상태
        ct.gpuCpuStatusChart = function () {
            var container = document.getElementById('chart-area-gpu2');
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

        // GPU 대시보드 시작
        ct.gpuInstanceStateCountInit = function () {
            // 카운트
            ct.gpuInstanceStateCount = {
                TOTAL: 0,
                STARTED: 0,
                STOPPED: 0,
                ERROR: 0
            };
        };

        ct.gpuInstanceUsageInit = function () {
            ct.gpuInstanceUsage = {
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

        ct.gpuInstanceStateCountInit();
        ct.gpuInstanceUsageInit();

        ct.gpuInstances = [];
        ct.getGpuInstanceVmsView = function (tenantId) {
            ct.gpuInstanceStateCountInit();
            ct.gpuInstances = [];
            var promise = portal.dashboard.getGpuInstanceVmsView(tenantId);
            promise.success(function (data, status, headers) {
                if (data && data.content && data.content.length > 0) {
                    ct.gpuInstances = data.content;
                    angular.forEach(ct.gpuInstances, function (instance, instanceKey) {
                        ct.gpuInstanceStateCount.TOTAL++;
                        if (instance.vmState == "active") {
                            ct.gpuInstanceStateCount.STARTED++;
                        } else if (instance.vmState == "error") {
                            ct.gpuInstanceStateCount.ERROR++;
                        } else {
                            ct.gpuInstanceStateCount.STOPPED++;
                        }
                    });
                }
            });
            promise.error(function (data, status, headers) {
            });
        };

        ct.gpuResourceUsed = {};
        ct.getGpuResourceUsedLookup = function (tenantId) {
            ct.gpuInstanceUsageInit();
            ct.gpuResourceUsed = {};
            var promise = portal.dashboard.getGpuResourceUsedLookup(tenantId);
            promise.success(function (data, status, headers) {
                if (data && data.content) {
                    ct.gpuResourceUsed = data.content;
                    if (ct.gpuResourceUsed.maxResource && ct.gpuResourceUsed.usedResource) {
                        // 할당 코어수
                        ct.gpuInstanceUsage.cpu.maxQuota = ct.gpuResourceUsed.maxResource.cores;
                        ct.gpuInstanceUsage.cpu.usedQuota = ct.gpuResourceUsed.usedResource.cores;
                        ct.gpuInstanceUsage.cpu.percentUsedQuota = (ct.gpuInstanceUsage.cpu.usedQuota/ct.gpuInstanceUsage.cpu.maxQuota) * 100;

                        // 할당 메모리 Byte
                        ct.gpuInstanceUsage.mem.maxQuota = ct.gpuResourceUsed.maxResource.ramSize;
                        ct.gpuInstanceUsage.mem.usedQuota = ct.gpuResourceUsed.usedResource.ramSize;
                        ct.gpuInstanceUsage.mem.percentUsedQuota = (ct.gpuInstanceUsage.mem.usedQuota/ct.gpuInstanceUsage.mem.maxQuota) * 100;

                        // 할당 인스트턴스 용량 Giga Byte
                        ct.gpuInstanceUsage.disk.maxQuota = ct.gpuResourceUsed.maxResource.instanceDiskGigabytes;
                        ct.gpuInstanceUsage.disk.usedQuota = ct.gpuResourceUsed.usedResource.instanceDiskGigabytes;
                        ct.gpuInstanceUsage.disk.percentUsedQuota = (ct.gpuInstanceUsage.disk.usedQuota/ct.gpuInstanceUsage.disk.maxQuota) * 100;
                        
                        // 할당 디스크 용량 Giga Byte
                        ct.gpuInstanceUsage.volume.maxQuota = ct.gpuResourceUsed.maxResource.volumeGigabytes;
                        ct.gpuInstanceUsage.volume.usedQuota = ct.gpuResourceUsed.usedResource.volumeGigabytes;
                        ct.gpuInstanceUsage.volume.percentUsedQuota = (ct.gpuInstanceUsage.volume.usedQuota/ct.gpuInstanceUsage.volume.maxQuota) * 100;

                        if (ct.gpuInstanceUsage.volume.maxQuota == 0) {
                            ct.gpuInstanceUsage.volume.maxQuota = ct.gpuInstanceUsage.disk.maxQuota;
                            ct.gpuInstanceUsage.volume.usedQuota = ct.gpuInstanceUsage.disk.usedQuota;
                            ct.gpuInstanceUsage.volume.percentUsedQuota = ct.gpuInstanceUsage.disk.percentUsedQuota;
                        }

                        var chartData = {
                            code: "0000",
                            cpuTotUsed : ct.gpuInstanceUsage.cpu.percentUsedQuota,
                            cpuMax : ct.gpuInstanceUsage.cpu.maxQuota,
                            cpuUsed : ct.gpuInstanceUsage.cpu.usedQuota,
                            ramSizeTot : ct.gpuInstanceUsage.mem.percentUsedQuota,
                            ramSizeMax : ct.gpuInstanceUsage.mem.maxQuota,
                            ramSizeUsed : ct.gpuInstanceUsage.mem.usedQuota,
                            instanceDiskGigabytesTot : ct.gpuInstanceUsage.disk.percentUsedQuota,
                            objectStorageGigaByteTot : ct.gpuInstanceUsage.volume.percentUsedQuota,
                            objectStorageGigaByteMax : ct.gpuInstanceUsage.volume.maxQuota,
                            objectStorageGigaByteUsed : ct.gpuInstanceUsage.volume.usedQuota
                        };

                        ct.gpuCpuChartFunc(chartData);
                        ct.gpuMemChartFunc(chartData);
                        ct.gpuStorgeChartFunc(chartData);
                    }
                }

            });
            promise.error(function (data, status, headers) {
            });
        };

        ct.getGpuCardList = function () {
            ct.gpuCardList = [];
            var rp = portal.dashboard.getGpuCardList($scope.main.userTenantGpuId);
            rp.success(function (data) {
                if (data && data.content) {
                    ct.gpuCardList = data.content;
                }
            });
            rp.error(function (data) {
                console.log(data);
            });
        };
        // gpu 대시보드 끝

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

        // GIS 서비스 요약
        ct.gisDashBoardInfo = {
            prjcLayGroupCnt: 0,
            prjcLayCnt: 0,
            prjcStyCnt: 0
        };

        ct.getGisDashBoardInfo = function (projectId) {
            var promise = portal.dashboard.getGisDashBoardInfo(projectId);
            promise.success(function (data, status, headers) {
                ct.gisDashBoardInfo = data;
            });
            promise.error(function (data, status, headers) {
            });
        };

        // DBaas 신청 현황
        ct.dbaasDashBoardInfo = {
            totalCnt : 0,
            totalSize : 0
        };

        ct.getDBaasDashBoardInfo = function (projectId) {
            var promise = portal.dashboard.getDBaasDashBoardInfo(projectId);
            promise.success(function (data, status, headers) {
                ct.dbaasDashBoardInfo = data;
            });
            promise.error(function (data, status, headers) {
            });
        };

        // 쿠버네티스 사용 현황
        ct.kuberDashBoardInfo = {
            nsUseCnt : 0,
            wlUseCnt : 0,
            podUseCnt : 0,
            volUseSize : 0
        };

        ct.getKuberDashBoardInfo = function (projectId) {
            var promise = portal.dashboard.getKuberDashBoardInfo(projectId);
            promise.success(function (data, status, headers) {
                ct.kuberDashBoardInfo = data;
            });
            promise.error(function (data, status, headers) {
            });
        };

        // 마이크로서비스 사용현황
        ct.msDashBoardInfo = {
            msAppFileTotalCnt : 0,
            msAppAddrTotalCnt : 0
        };

        ct.getMsDashBoardInfo = function (projectId) {
            var promise = portal.dashboard.getMsDashBoardInfo(projectId);
            promise.success(function (data, status, headers) {
                ct.msDashBoardInfo = data;
            });
            promise.error(function (data, status, headers) {
            });
        };

        // 프로젝트 데이터 분석현황
        ct.pdaDashBoardInfo = {
            algorithmCnt : 0,
            dataCnt : 0,
            dataUsage : 0
        };

        ct.getPdaDashBoardInfo = function () {
            var promise = portal.dashboard.getPdaDashBoardInfo();
            promise.success(function (data, status, headers) {
                ct.pdaDashBoardInfo = data.dataList[0];
            });
            promise.error(function (data, status, headers) {
            });
        };

        // 분석 App. 실행
        ct.appDashBoardInfo = {
            START_CNT : 0,
            STOP_CNT : 0,
            FAIL_CNT : 0
        };

        ct.getAppDashBoardInfo = function () {
            var u_token = common.getAccessToken();
            var d = new Date();
            var vt = d.getTime();
            var org_guid = common.getTeamCode();
            var promise = portal.dashboard.getAppDashBoardInfo(u_token, org_guid, vt);
            promise.success(function (data, status, headers) {
                ct.appDashBoardInfo = data;
            });
            promise.error(function (data, status, headers) {
            });
        };

        ct.loadDashBoard = function () {
            // Dcp 정보
            ct.getDcpDashboardInfo(ct.paramId);
            // 데이터 카탈로그 이용 현황 정보
            ct.getCtlgDashboardInfo(ct.paramId);
            // Apip 정보
            ct.getApipDashBoardInfo(ct.paramId);

            // IaaS 정보
            if ($scope.main.userTenantId) {
                ct.iaasCpuStatusChart();
                ct.getIaasInstanceVmsView($scope.main.userTenantId);
                ct.getIaasResourceUsedLookup($scope.main.userTenantId);
            }

            // PaaS 정보
            if ($scope.main.sltPortalOrg && $scope.main.sltOrganizationGuid) {
                ct.paasCpuStatusChart();
                ct.getPaasAppInfosAndInstanceInfos($scope.main.sltOrganizationGuid);
            }
            
            // GPU 정보
            if ($scope.main.userTenantGpuId) {
                ct.gpuCpuStatusChart();
                ct.getGpuCardList();
                ct.getGpuInstanceVmsView($scope.main.userTenantGpuId);
                ct.getGpuResourceUsedLookup($scope.main.userTenantGpuId);
            }
            
            // Pipeline 정보
            ct.getPipelineDashBoardInfo(ct.paramId);
            // Gis 정보
            ct.getGisDashBoardInfo(ct.paramId);
            // DBaas 신청 현황 정보
            ct.getDBaasDashBoardInfo(ct.paramId);
            // 쿠버네티스 사용현황 정보
            ct.getKuberDashBoardInfo(ct.paramId);
            // 마이크로서비스 사용현황 정보
            ct.getMsDashBoardInfo(ct.paramId);
            // 프로젝트 데이터 분석현황 정보
            ct.getPdaDashBoardInfo(ct.paramId);
            // 분석 App. 실행 정보
            ct.getAppDashBoardInfo(ct.paramId);
        };

        /**************************************************************************/

        // 이미지 변경
        ct.createOrgProjectIcon = function($event) {
            var dialogOptions = {
                title : '프로젝트 이미지 변경',
                formName : 'popThumModifyForm',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgIcon.html' + _VersionTail(),
                okName : '업로드'
            };
            common.showDialog($scope, $event, dialogOptions);

            ct.uploader = common.setDefaultFileUploader($scope);
            ct.uploader.onAfterAddingFile = function(fileItem) {
                $('#userfile').val(fileItem._file.name);
                ct.uploadedNoticeFile = null;
                $timeout(function () {
                    ct.uploadedNoticeFile = fileItem;
                }, 0);
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
            if (!ct.uploadedNoticeFile || !ct.uploadedNoticeFile._file) {
                common.showAlertWarning('프로젝트 로고를 선택하십시오.');
                return;
            }

            var body = {};
            body.iconFile = ct.uploadedNoticeFile._file;

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

        // 프로젝트 삭제전 체크
        ct.checkDeleteOrgProject = function ($event) {
            var id = ct.selOrgProject.id;
            var orgId = ct.selOrgProject.orgId;
            if (!id || !orgId) {
                common.showAlertWarning("조직 정보를 찾을 수 없습니다.");
                return;
            }
            // 프로젝트 서비스 조회
            var serviceList = ct.checkOrgProjectService(id, orgId);
            if (!serviceList) {
                return;
            }

            // 프로젝트 서비스 api promise 세팅
            var promiseArr = new Array();
            angular.forEach(serviceList, function (service) {
                if (service.promise)
                    promiseArr.push(service.promise);
            });

            $scope.main.loadingMainBody = true;
            $q.all(promiseArr).then(function() {
                var showAlertBoolean = false;
                for (var i = 0; i < serviceList.length; i++) {
                    if (serviceList[i].useYn != 'N') {
                        showAlertBoolean = true;
                        break;
                    }
                }
                if (showAlertBoolean) {
                    // 프로젝트 서비스 사용중 알람창
                    common.showDialogAlertHtml('알림', setDialogAlertHtml('success', serviceList), 'warning');
                } else {
                    // 프로젝트 삭제전 이름체크 및 삭제
                    $scope.main.popDeleteCheckName($event, '프로젝트', ct.selOrgProject.orgName, ct.deleteOrgProjectAction);
                }
            }).catch(function() {
                // 프로젝트 서비스 호출 오류 알림창
                common.showDialogAlertHtml('알림', setDialogAlertHtml('error', serviceList), 'warning');
            }).finally(function () {
                $scope.main.loadingMainBody = false;
            });

            // 알람 팝업창 html 세팅
            var setDialogAlertHtml = function (functionSuccess, serviceList) {
                var dialogAlertHtml = "";
                if (functionSuccess == 'success') {
                    dialogAlertHtml += '아래와 같이 사용 중인 서비스가 있습니다.';
                    dialogAlertHtml += '<br>사용중인 서비스 항목 삭제 후 프로젝트 삭제를 진행해 주세요.<br><br>';
                } else {
                    dialogAlertHtml = '아래 서비스 확인 중 에러가 있습니다.';
                    dialogAlertHtml += '<br>확인 후 진행해 주세요.<br><br>';
                }
                var serviceNameArr = new Array();
                angular.forEach(serviceList, function (service) {
                    if (functionSuccess == 'success' && service.useYn == 'Y') {
                        serviceNameArr.push(service.serviceName);
                    } else if (functionSuccess == 'error' && service.useYn == 'E') {
                        serviceNameArr.push(service.serviceName);
                    }
                });
                if (serviceNameArr.length > 0) {
                    for (let i = 0; i < serviceNameArr.length; i++) {
                        dialogAlertHtml += '<b>' + serviceNameArr[i] + '</b>';
                        if (i != serviceNameArr.length - 1) {
                            dialogAlertHtml += ', ';
                        }
                    }
                }
                return dialogAlertHtml;
            };
        };

        // 프로젝트 서비스 조회
        ct.checkOrgProjectService = function (id, orgId) {
            var serviceList = [
                {serviceCode : 'iaas', serviceName : '서버 가상화', useYn : 'N'},
                {serviceCode : 'gpu', serviceName : 'GPU 서버 가상화', useYn : 'N'},
                {serviceCode : 'paas', serviceName : 'App 실행 서비스', useYn : 'N'},
                {serviceCode : 'gis', serviceName : 'HUB-PoP GIS', useYn : 'N'},
                {serviceCode : 'vru', serviceName : 'AR/VR 공유서비스', useYn : 'N'},
                {serviceCode : 'hwu', serviceName : 'HiveBroker 서비스', useYn : 'N'},
                {serviceCode : 'aau', serviceName : 'AI-API 서비스', useYn : 'N'}
            ];

            // 서비스 항목에 usedYn, promise 세팅
            var setServiceUseYn = function(serviceCode, promise) {
                var service = common.objectsFindByField(serviceList, 'serviceCode', serviceCode);
                if (!promise || !service) {
                    return;
                }
                service.promise = promise;
                promise.success(function (data) {
                    if (serviceCode == 'iaas' || serviceCode == 'gpu') {    // 서버가상화, GPU 서버가상화
                        if (data && data.content && data.content.pk && data.content.pk.teamCode) {
                            service.useYn = 'Y';
                        }
                    } else if (serviceCode == 'paas') { // App 실행 서비스
                        if (data && data.guid) {
                            service.useYn = 'Y';
                        }
                    } else {    // 타사업자 서비스
                        if (data == 'Y') {
                            service.useYn = 'Y';
                        }
                    }
                });
                promise.error(function () {
                    service.useYn = 'E';
                });
            };

            // 서버 가상화
            var iaasAndGpuParams = {
                "orgCode" : $scope.main.sltProjectId.toString(),
                "teamCode" : orgId
            };
            setServiceUseYn('iaas', common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/org/one', 'GET', iaasAndGpuParams, 'application/x-www-form-urlencoded')));

            // Gpu 서버 가상화
            setServiceUseYn('gpu', common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/org/one', 'GET', iaasAndGpuParams, 'application/x-www-form-urlencoded')));

            // App 실행 서비스
            var paasParams = {
                urlPaths : {"name" : orgId},
                "depth" : 0
            };
            setServiceUseYn('paas', common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/name/{name}', 'GET', paasParams)));

            // 타사업자 파라미터
            var otherParam = {
                "PROJECT-ID" : id
            };
            // HUB-PoP GIS
            // setServiceUseYn('gis', common.retrieveResource(common.resourcePromise('/gis/confirmDeleteOrNot.do', 'GET', otherParam)));

            // AR/VR 공유서비스
            // setServiceUseYn('vru', common.retrieveResource(common.resourcePromise('/vru/confirmDeleteOrNot.do', 'GET', otherParam)));

            // HiveBroker 서비스
            // setServiceUseYn('hwu', common.retrieveResource(common.resourcePromise('/hwu/confirmDeleteOrNot.do', 'GET', otherParam)));

            // AI-API 서비스
            // setServiceUseYn('aau', common.retrieveResource(common.resourcePromise('/aau/confirmDeleteOrNot.do', 'GET', otherParam)));

            return serviceList;
        };

        // 조직 삭제 액션
        ct.deleteOrgProjectAction = function (orgItem) {
            $scope.main.loadingMainBody = true;
            var promise = orgService.deleteOrg(orgItem.id);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.org_del') + '(' + orgItem.orgName + ')', '해당 프로젝트를 삭제 처리 중 입니다.');
                ct.listOrgProjects();   //조직 목록 조회
            });
            promise.error(function (data, status) {
                $scope.main.loadingMainBody = false;
                if (status == 406) {
                    common.showAlertError($translate.instant('label.org_del') + '(' + orgItem.orgName + ')', '삭제 권한이 없습니다.');
                } else if (status == 403) {
                    common.showAlertErrorHtml($translate.instant('label.org_del') + '(' + orgItem.orgName + ')', '아래 시스템에서 사용중 입니다.');
                } else {
                    common.showAlertError('', data);
                }
            });
        };

        // 조직 삭제 액션
        ct.deleteOrgProjectAction = function () {
            $scope.main.loadingMainBody = true;
            var promise = orgService.deleteOrg(ct.paramId);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '해당 프로젝트를 삭제 처리 중 입니다.');
                $scope.main.goToPage('/comm/projects/');
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
                angular.forEach(ct.orgUsers, function (userItem, key) {
                    if (!!userItem.usersInfo) {
                        userItem.isCommonOrg = userItem.usersInfo.isCommonOrg;
                    }
                });
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
            var showConfirm = common.showConfirm('비밀번호 초기화', user.name + '(' + user.email + ')의 비밀번호를 초기화(kepco12345) 하시겠습니까?');
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

        // 쿼터변경요청 내역 조회
        ct.listQuotaHistories = function () {
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listQuotaHistory(ct.selOrgProject.id);
            promise.success(function (data) {
                ct.quotaHistories = data;
                ct.isQuotaChange = true;    //쿼터변경요청 가능 여부, 첫건이 '요청'상태일 때 요청불가
                angular.forEach(ct.quotaHistories, function(value, key) {
                    if (key == 0 && value.treatCodeNm == "요청") {
                        ct.isQuotaChange = false;    //쿼터변경요청 가능 여부, 첫건이 '요청'상태일 때 요청불가
                    }
                });
                //이전값/변경값에 paas 항목 추가
                setQuotaHistoriesPaaS();
                //이전값/변경값에 같은 항목 체크
                setQuotaHistoriesSameValueDetails();
                ct.loadQuotaHistory = true;    //쿼터변경요청 조회여부
                getCheckLoadQuotas();   //프로젝트 자원탭 조회여부에 따라 loading bar false 처리
            });
            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        //쿼터변경요청 내역 이전값/변경값에 paas 항목 추가
        function setQuotaHistoriesPaaS() {
            angular.forEach(ct.quotaHistories, function(value, key) {
                if (value.oldPaasQuotaGuid != value.changePaasQuotaGuid) {
                    if (!!value.oldPaasQuotaGuid) {
                        if (value.oldValueDetails == null) {
                            value.oldValueDetails = [];
                        }
                        var obj = common.objectsFindByField(ct.paasQuotas, 'guid', value.oldPaasQuotaGuid);
                        if (obj != null) {
                            value.oldValueDetail = {};
                            value.oldValueDetail.orgQuotaItemGroupName = "PaaS";
                            value.oldValueDetail.orgQuotaItemCode = "000";
                            value.oldValueDetail.orgQuotaItemName = "용량";
                            value.oldValueDetail.value = obj.name;
                            value.oldValueDetails.push(value.oldValueDetail);
                        }
                    }
                    if (!!value.changePaasQuotaGuid) {
                        if (value.changeValueDetails == null) {
                            value.changeValueDetails = [];
                        }
                        obj = common.objectsFindByField(ct.paasQuotas, 'guid', value.changePaasQuotaGuid);
                        if (obj != null) {
                            value.changeValueDetail = {};
                            value.changeValueDetail.orgQuotaItemGroupName = "PaaS";
                            value.changeValueDetail.orgQuotaItemCode = "000";
                            value.changeValueDetail.orgQuotaItemName = "용량";
                            value.changeValueDetail.value = obj.name;
                            value.changeValueDetails.push(value.changeValueDetail);
                        }
                    }
                }
            });
        }

        //이전값/변경값에 같은 항목 체크
        function setQuotaHistoriesSameValueDetails() {
            angular.forEach(ct.quotaHistories, function(item) {
                angular.forEach(item.oldValueDetails, function(detail) {
                    detail.isSame = false;
                });
                angular.forEach(item.changeValueDetails, function(detail) {
                    detail.isSame = false;
                });
                angular.forEach(item.oldValueDetails, function(detail) {
                    angular.forEach(item.changeValueDetails, function(detail2) {
                        if (detail.orgQuotaItemId == detail2.orgQuotaItemId && detail.value == detail2.value) {
                            detail.isSame = true;
                            detail2.isSame = true;
                        }
                    });
                });
            });
            //console.log("ct.quotaHistories : ", ct.quotaHistories);
        }

        //프로젝트 자원탭 조회여부에 따라 loading bar false 처리
        function getCheckLoadQuotas () {
            if (ct.loadQuotaHistory && ct.loadOrgQuotas) {
                $scope.main.loadingMainBody = false;
            }
        }

        /*책임자 변경 화면 오픈*/
        ct.changeManagerForm = function ($event) {
            $scope.dialogOptions = {
                controller: "commChangeManagerFormCtrl",
                callBackFunction: ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*권한 변경 화면 오픈*/
        ct.changeRoleForm = function ($event) {
            $scope.dialogOptions = {
                controller: "commChangeRoleFormCtrl",
                test1 : $event,
                callBackFunction: ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*프로젝트 쿼터변경 요청 화면 오픈*/
        ct.requestQuotaForm = function ($event) {
            $scope.dialogOptions = {
                controller: "commRequestQuotaFormCtrl",
                callBackFunction: ct.listQuotaHistories,
                selOrgProject : ct.selOrgProject,
                paasQuotas : ct.paasQuotas
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*org_quota_value 조회 : 사용하지 않음*/
        /*ct.listOrgQuotaValues = function () {
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listOrgQuotaValues(ct.selOrgProject.id);
            promise.success(function (data) {
                ct.orgQuotaValues = data;
                //console.log("ct.orgQuotaValues : ", ct.orgQuotaValues);
                setOrgQuotaItemGroups();    //orgQuotaItemGroup 발췌
                setOrgQuotaValuePaas();     //orgQuotaValue 에 paas 추가
            });
            promise.error(function (data) {
                ct.orgQuotaValues = [];
            });
            promise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };*/

        /*orgQuotaItemGroup 발췌*/
        function setOrgQuotaItemGroups() {
            ct.orgQuotaGroups = [];
            angular.forEach(ct.orgQuotas, function(value, key) {
                if (value.item_group_code) {
                    if (common.objectsFindCopyByField(ct.orgQuotaGroups, "item_group_code", value.item_group_code) == null) {
                        ct.orgQuotaGroups.push(value);
                    }
                }
            });
            //console.log("ct.orgQuotaGroups : ", ct.orgQuotaGroups);
            //console.log("ct.selOrgProject : ", ct.selOrgProject);
        }

        /*orgQuotaValue 에 paas 추가 : 사용하지 않음*/
        /*function setOrgQuotaValuePaas() {
            if (ct.selOrgProject && !!ct.selOrgProject.paasQuotaGuid) {
                getPaasQuota(ct.selOrgProject.paasQuotaGuid);
            } else {
                setOrgQuotaValues(ct.orgQuotaValues);
            }
        }*/

        /*paas 프로젝트 쿼터 조회 : 사용하지 않음*/
        /*function getPaasQuota(guid) {
            ct.paasQuota = {};
            ct.paasQuota = common.objectsFindByField(ct.paasQuotas, 'guid', guid);
            //if (!ct.paasQuota) return;

            /!*console.log("ct.paasQuota : ", ct.paasQuota);
            console.log("ct.orgQuotaValues : ", ct.orgQuotaValues);
            console.log("ct.orgQuotaItemGroups : ", ct.orgQuotaItemGroups);*!/
            ct.orgQuotaItemGroup = {};
            ct.orgQuotaItemGroup.code = "000";
            ct.orgQuotaItemGroup.name = "PaaS";
            ct.orgQuotaItemGroups.push(ct.orgQuotaItemGroup);

            /!*ct.orgQuotaValue = {};
            ct.orgQuotaValue.orgQuotaItem = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.code = "000";
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.name = "PaaS";
            ct.orgQuotaValue.orgQuotaItem.name = "서비스";
            ct.orgQuotaValue.orgQuotaItem.unit = "";
            ct.orgQuotaValue.value = (ct.paasQuota && ct.paasQuota.totalServices) ? ct.paasQuota.totalServices : 0;
            ct.orgQuotaValues.push(ct.orgQuotaValue);

            ct.orgQuotaValue = {};
            ct.orgQuotaValue.orgQuotaItem = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.code = "000";
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.name = "PaaS";
            ct.orgQuotaValue.orgQuotaItem.name = "라우트";
            ct.orgQuotaValue.orgQuotaItem.unit = "";
            ct.orgQuotaValue.value = (ct.paasQuota && ct.paasQuota.totalRoutes) ? ct.paasQuota.totalRoutes : 0;
            ct.orgQuotaValues.push(ct.orgQuotaValue);*!/

            ct.orgQuotaValue = {};
            ct.orgQuotaValue.orgQuotaItem = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.code = "000";
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.name = "PaaS";
            ct.orgQuotaValue.orgQuotaItem.name = "인스턴스 개수";
            ct.orgQuotaValue.orgQuotaItem.unit = "";
            ct.orgQuotaValue.value = (ct.paasQuota && ct.paasQuota.appInstanceLimit) ? ct.paasQuota.appInstanceLimit : 0;
            ct.orgQuotaValues.push(ct.orgQuotaValue);

            ct.orgQuotaValue = {};
            ct.orgQuotaValue.orgQuotaItem = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup = {};
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.code = "000";
            ct.orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.name = "PaaS";
            ct.orgQuotaValue.orgQuotaItem.name = "메모리";
            ct.orgQuotaValue.orgQuotaItem.unit = "GB";
            ct.orgQuotaValue.value = (ct.paasQuota && ct.paasQuota.instanceMemoryLimit) ? ct.paasQuota.instanceMemoryLimit/1024 : 0;
            ct.orgQuotaValues.push(ct.orgQuotaValue);
            setOrgQuotaValues(ct.orgQuotaValues);
            //console.log("ct.orgQuotaValues222 : ", ct.orgQuotaValues);
        }
        
        function setOrgQuotaValues(orgQuotaValues) {
            angular.forEach(orgQuotaValues, function (orgQuotaValue, key) {
                orgQuotaValue.orgQuotaItemGroupCode = orgQuotaValue.orgQuotaItem.orgQuotaItemGroup.code;
            });
            //console.log("orgQuotaValues : ", orgQuotaValues);
        }*/

        /*org_quotas 조회 : 쿼터/미터링값 함께 조회*/
        ct.listOrgQuotas = function () {
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listOrgQuotas(ct.selOrgProject.id);
            promise.success(function (data) {
                ct.orgQuotas = data.result.orgQuotas;
                //console.log("ct.orgQuotas : ", ct.orgQuotas);
                setOrgQuotaItemGroups();
                ct.loadOrgQuotas = true;       //쿼터값(미터링포함) 조회여부
                getCheckLoadQuotas();   //프로젝트 자원탭 조회여부에 따라 loading bar false 처리
            });
            promise.error(function (data) {
                ct.orgQuotaValues = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /*paas 프로젝트 쿼터 조회*/
        ct.listPaasQuotas = function (currentPage) {
            ct.paasQuotas = [];
            $scope.main.loadingMainBody = true;
            if (!currentPage) {
                currentPage = 1;
            }
            var returnPromise = quotaService.listPaasQuotas(10, currentPage, null);
            returnPromise.success(function (data) {
                //ct.paasQuotas = data.content;
                angular.forEach(data.content, function(paasQuota) {
                    if (paasQuota.name.indexOf("prj-") > -1) {
                        ct.paasQuotas.push(paasQuota);
                    }
                });
            });
            returnPromise.error(function (data) {
                ct.paasQuotas = [];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                //$scope.main.loadingMainBody = true;
                ct.listQuotaHistories();
                //ct.listOrgQuotaValues();
                ct.listOrgQuotas(); //org_quotas 조회 : 쿼터/미터링값 함께 조회
            });
        };

        // 쿼터변경요청 삭제
        ct.deleteQuotaHistory = function (quotaHistory) {
            var showConfirm = common.showConfirm($translate.instant('label.del'), "쿼터변경요청 건" + $translate.instant('message.mq_delete'));
            showConfirm.then(function() {
                ct.deleteQuotaHistoryAction(quotaHistory);
            });
        };

        // 쿼터변경요청 삭제 액션
        ct.deleteQuotaHistoryAction = function (quotaHistory) {
            $scope.main.loadingMain = true;
            var promise = quotaService.deleteQuotaHistory(quotaHistory.id);
            promise.success(function (data) {
                common.showAlertSuccess("쿼터변경요청 건이 삭제되었습니다.");
                ct.listQuotaHistories();
            });
            promise.error(function (data) {
            });
            promise.finally(function (data, status, headers) {
                $scope.main.loadingMain = false;
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
        $scope.dialogOptions.okName = "등록";
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
                        /* 2020.03.23 - 사용자 조회등록시 등록된 사용자도 목록에 나오게끔 로직 수정 by ksw */
                    } else {
                        /* 검색어가 있는 경우 */
                        if (pop.schText) {
                            /* user의 email이나 name값이 검색어와 일치하는 경우 */
                            if (user.email.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1 || user.name.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1) {
                                /* 조회 목록 화면 배열에 push */
                                pop.orgNotUsers.push(angular.copy(user));
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
                    /* 2020.03.23 - 등록된 사용자 추가시 팝업 추가 by ksw */
                    if (user.checked && (pop.orgUserEmails.indexOf(user.email)) > -1) {
                        common.showAlertError('이미 등록된 사용자 (' + user.email + ')입니다.');
                        pop.schAddOrgUsers = [];
                    } else if (user.checked) {
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
                /* 2020.01.22 - 관리자 다수 등록 가능 요청으로 인해 수정 */
                /*if(orgUser.roleName == "ADMIN"){
                    checkAdminCnt++;
                }*/
            });

            /* 2020.01.22 - 관리자 다수 등록 가능 요청으로 인해 수정 */
            /*if (checkAdminCnt >= 2) {
                common.showAlertError("사용자 등록시 관리자 역할은 한 명만 지정할 수 있습니다.");
                pop.btnClickCheck = false;
                return;
            }*/

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
        $scope.dialogOptions.okName = "등록";
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
                /* 2020.01.28 - 관리자 다수 등록 가능 요청으로 인해 수정 */
                /*if(pop.newOrgUsers[i].roleName == "ADMIN"){
                    checkAdminCnt++;
                }*/
            }

            /* 2020.01.28 - 관리자 다수 등록 가능 요청으로 인해 수정 */
            /*if (checkAdminCnt >= 2) {
                common.showAlertError("사용자 등록시 관리자 역할은 한 명만 지정할 수 있습니다.");
                pop.btnClickCheck = false;
                return;
            }*/

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
    .controller('commRequestQuotaFormCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $translate, $q ,ValidationService, common, quotaService) {
        _DebugConsoleLog("orgDetailController.js : commRequestQuotaFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = {};
        pop.formName = "requestQuotaForm";
        pop.selOrgProject = angular.copy($scope.dialogOptions.selOrgProject);
        pop.paasQuotas = angular.copy($scope.dialogOptions.paasQuotas);
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popRequestQuotaForm.html" + _VersionTail();
        $scope.dialogOptions.title = "프로젝트 쿼터변경요청";
        pop.method = "POST";
        pop.data.paasQuotaGuid = pop.selOrgProject.paasQuotaGuid;
        //console.log("pop.selOrgProject : ", pop.selOrgProject);

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            var params = {};
            params.orgId = pop.selOrgProject.id;
            params.requestReason = pop.data.requestReason;
            params.paasQuotaGuid = pop.data.paasQuotaGuid;
            var orgQuotaValues = [];
            angular.forEach(pop.quotaItems, function (quotaItem, key) {
                if (quotaItem.value) {
                    var orgQuotaValue = {};
                    orgQuotaValue.org = {};
                    orgQuotaValue.org.id = pop.selOrgProject.id;
                    orgQuotaValue.orgQuotaItem = {};
                    orgQuotaValue.orgQuotaItem.id = quotaItem.id;
                    orgQuotaValue.value = quotaItem.value;
                    orgQuotaValues.push(orgQuotaValue);
                }
            });
            params.orgQuotaValues = orgQuotaValues;
            // 쿼터값 범위 체크
            for (var i = 0; i < pop.quotaItems.length; i++) {
                if (pop.quotaItems[i].value < pop.quotaItems[i].min || pop.quotaItems[i].value > pop.quotaItems[i].max) {
                    common.showAlertWarning("쿼터범위를 초과했습니다.");
                    $scope.actionBtnHied = false;
                    return;
                }
            }
            if (!params.requestReason) {
                common.showAlertWarning("변경요청사유는 필수사항입니다.");
                $scope.actionBtnHied = false;
                return;
            }
            if (!params.paasQuotaGuid && params.orgQuotaValues.length == 0) {
                common.showAlertWarning("상세 쿼터 설정은 필수사항입니다.");
                $scope.actionBtnHied = false;
                return;
            }
            //변경사항이 없는지 확인
            if (pop.selOrgProject.paasQuotaGuid == params.paasQuotaGuid) {
                if (!checkChangeQuota()) {
                    common.showAlertWarning("쿼터 변경사항이 없습니다.");
                    $scope.actionBtnHied = false;
                    return;
                }
            }
            pop.fn.okFunction(params);
        };

        //쿼터 초기값과 신청값 변경 체크 : 변경 있으면 true
        function checkChangeQuota() {
            var bReturn = false;
            angular.forEach(pop.quotaItems, function (item) {
                var obj = common.objectsFindByField(pop.quotaItemsAgo, 'id', item.id);
                if (item.value != obj.value) {
                    bReturn = true;
                    return bReturn;
                }
            });
            return bReturn;
        }

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.okFunction = function(params) {
            //console.log("pop.fn.okFunction params : ", params);
            var returnPromise = quotaService.quotaHistoryCreate(params);
            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess("프로젝트 쿼터변경요청", "프로젝트 쿼터변경요청을 완료했습니다.");
                $scope.dialogOptions.callBackFunction();
                $scope.popHide();
            });
            returnPromise.error(function (data) {
                common.showAlert("message",data.message);
            });
        };

        /*상세쿼타조정 조회*/
        pop.fn.listQuotaItems = function() {
            var params = {
                schGroupId : 0,
                schType : "name",
                schText : ""
            };
            pop.quotaItems = [];
            var returnPromise = quotaService.listQuotaItem(params);
            returnPromise.success(function (data) {
                pop.quotaItems = data;
            });
            returnPromise.error(function (data) {
                pop.quotaItems = [];
                common.showAlert("message", data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                pop.fn.listQuotaValues();
            });
        };

        /*상세쿼타 값 조회*/
        pop.fn.listQuotaValues = function() {
            pop.quotaValues = [];
            var returnPromise = quotaService.listOrgQuotaValues(pop.selOrgProject.id);
            returnPromise.success(function (data) {
                pop.quotaValues = data;

                //console.log("pop.quotaItems : ", pop.quotaItems);
                //console.log("pop.quotaValues : ", pop.quotaValues);
                angular.forEach(pop.quotaItems, function (quotaItem) {
                    angular.forEach(pop.quotaValues, function (quotaValue) {
                        if (quotaItem.id == quotaValue.orgQuotaItem.id) {
                            quotaItem.value = quotaValue.value;
                        }
                    });
                });
                pop.quotaItemsAgo = angular.copy(pop.quotaItems);   //초기값
            });
            returnPromise.error(function (data) {
                pop.quotaValues = [];
                common.showAlert("message",data.message);
            });
        };

        pop.fn.listQuotaItems();
        //pop.fn.listQuotaValues();

    })
    .controller('commChangeRoleFormCtrl', function ($scope, $location, $state, $stateParams,$mdDialog,$translate, $q,ValidationService, orgService, common, CONSTANTS) {
        _DebugConsoleLog("orgDetailController.js : commChangeRoleFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = {};

        pop.formName = "changeRoleForm";
        pop.test = $scope.dialogOptions.test1;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-dialog";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popChangeRoleForm.html" + _VersionTail();
        $scope.dialogOptions.title = "권한 변경";

        pop.orgRoleNames = CONSTANTS.roleName;
        pop.paramId = $stateParams.orgId;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            pop.fn.okFunction();
        };

        pop.listOrgUser = function () {
            pop.isAdmin = false;
            var promise = orgService.listOrgUsers(pop.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                angular.forEach(orgUsers, function (orgUser, key) {
                    if (orgUser.usersInfo.email == pop.test.email) {
                        pop.orgUser = orgUser;
                        if (orgUser.isAdmin) {
                            pop.isAdmin = true;
                        }
                        return false;
                    }
                });
            });
            promise.error(function (data) {
            });
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.okFunction = function() {
            var orgUserRequest = {
                email: pop.orgUser.usersInfo.email,
                userRole: pop.orgUser.roleName
            };
            $scope.main.loadingMain = true;
            common.mdDialogHide();
            var promise = orgService.changeOrgAdmin(pop.paramId, orgUserRequest);
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

        pop.listOrgUser();
    })
    .controller('commChangeManagerFormCtrl', function ($scope, $location, $state, $stateParams,$mdDialog,$translate, $q,ValidationService, orgService, $filter, user,paging, common, CONSTANTS) {
        _DebugConsoleLog("orgDetailController.js : commChangeManagerFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = {};
        pop.roles = [];
        pop.isOrgManager = false;

        pop.formName = "changeManagerForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-dialog";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popChangeManagerForm.html" + _VersionTail();
        $scope.dialogOptions.title = "책임자 변경";
        $scope.dialogOptions.okName = "변경";

        // 책임자 변경 팝업에서 변경 버튼 클릭시 액션
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if(pop.data.orgUser == undefined ) {
                $scope.popCancel();
                return;
            }
            pop.fn.userPush();
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.checkOne = function($event,image) {
            console.log(pop.roles);
            if($event.currentTarget.checked) {
                console.log("roles len : " + pop.roles.length);
                if(pop.roles.length == $("#mainList tbody").find("input[type='checkbox']").length) {
                    $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);

            }
        };

        // 팝업창에서 조직 구성원들 조회
        pop.fn.listAllOrgMembers = function(currentPage) {
            var param = {};
            if(currentPage != undefined) {
                param.number = currentPage
            }
            var orgPromise = orgService.listOrgUsers($scope.contents.paramId);
            orgPromise.success(function (data) {
                pop.pageOptions = paging.makePagingOptions(data);
                pop.orgUsers = data.items;
                if (pop.orgUsers.roleName == 'OWNER') {
                    pop.isOrgManager = true;
                }
            });
            orgPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            orgPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.userPush = function() {
            $scope.main.loadingMainBody = true;
            var id = pop.data.orgUser.org.id;
            var param = {
                orgId : pop.data.orgUser.org.orgId,
                orgManager : {
                    email : pop.data.orgUser.usersInfo.email
                }
            };
            var orgPromise = orgService.changeOrgManager(id, param);
            orgPromise.success(function (data, status, headers) {
                $scope.contents.listOrgUsers();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess('책임자 변경 성공','책임자가 변경되었습니다.');
                $scope.main.replacePage();
                $scope.popCancel();
            });
            orgPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            orgPromise.finally(function() {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.listAllOrgMembers();
    });
