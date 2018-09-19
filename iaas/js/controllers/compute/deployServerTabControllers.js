'use strict';

angular.module('iaas.controllers')
    .controller('iaasDeployLbServicePortTabCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, common, CONSTANTS) {
        _DebugConsoleLog("deployServerTabControllers.js : iaasDeployLbServicePortTabCtrl", 1);

        var tab = this;
        tab.fn = {};

        $scope.$on('deployReloadChanged',function(event, deployServer) {

        });

        tab.fn.addLbServicePortFormOpen = function () {
            var dialogOptions = {
                controller : "iaasDeployLbServicePortFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                controllerAs : "portPop",
                serviceType: "LB",
                formMode : "add"
            };
            tab.addServicePortDialog = common.showRightDialog($scope, dialogOptions);
        };

        // 서비스 삭제
        tab.fn.deleteLbServicePort = function(servicePort) {
            if (servicePort.serviceInstance && servicePort.serviceInstance.deployId) {
                common.showAlertWarning("연결 서비스가 존재 하는 포트는 삭제할 수 없습니다.");
                return;
            }
            common.showConfirm('LB 포트 삭제', 'LB 포트('+servicePort.servicePortName+')를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : $scope.contents.deployServer.deployId,
                    servicePortId : servicePort.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/port', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        if ($scope.contents.configDetailView) {
                            $scope.contents.fn.zoomPanelConfigDetailClose();
                        }
                        $scope.contents.fn.onlyDataReLoad();
                        common.showAlertSuccess('삭제되었습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        tab.fn.actionCallBackFun = function() {
            $scope.contents.fn.onlyDataReLoad();
        };

    })
    .controller('iaasDeployWebServiceConfigTabCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, common, CONSTANTS) {
        _DebugConsoleLog("deployServerTabControllers.js : iaasDeployWebServiceConfigTabCtrl", 1);

        var tab = this;
        tab.fn = {};

        $scope.$on('deployReloadChanged',function(event, deployServer) {

        });

        tab.fn.addWebServiceInstanceFormOpen = function () {
            var dialogOptions = {
                controller : "iaasDeployWebServiceConfigFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                controllerAs : "pop",
                formMode : "add"
            };
            tab.addWebServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        tab.fn.modWebServiceInstanceConfigFormOpen = function (sltServiceInstance) {
            var dialogOptions = {
                controller : "iaasDeployWebServiceConfigFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                serviceInstance : angular.copy(sltServiceInstance),
                controllerAs : "pop",
                formMode : "mod"
            };
            tab.modWebServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        // 서비스 삭제
        tab.fn.delWebServiceInstance = function(serviceInstance) {
            if ($scope.contents.deployServer.serviceInstances.length < 2) {
                common.showAlertWarning("기본 서비스는 한개는 삭제할 수 없습니다.");
                return;
            }
            common.showConfirm('WEB 서비스 삭제', 'WEB 서비스('+serviceInstance.serviceInstanceName+')를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : $scope.contents.deployServer.deployId,
                    serviceInstanceId : serviceInstance.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        if ($scope.contents.configDetailView) {
                            $scope.contents.fn.zoomPanelConfigDetailClose();
                        }
                        $scope.contents.fn.onlyDataReLoad();
                        common.showAlertSuccess('서비스가 삭제되었습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        tab.fn.addWebServiceInstanceLocationForm = function (sltServiceInstance) {
            var dialogOptions = {
                controller : "iaasDeployWebServicePathFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                serviceInstance : angular.copy(sltServiceInstance),
                controllerAs : "pop",
                formMode : "add"
            };
            tab.addWebServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        // 서비스 삭제
        tab.fn.delWebServiceInstanceLocation = function(serviceLocation) {
            common.showConfirm('WEB 리소스 삭제', 'WEB 리소스 ('+serviceLocation.name+')를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : serviceLocation.deployId,
                    serviceInstanceId : serviceLocation.serviceInstanceId,
                    serviceInstanceLocId : serviceLocation.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance/path', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        common.showAlertSuccess('리소스가 삭제되었습니다.');
                        $scope.contents.fn.onlyDataReLoad();
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        tab.fn.actionCallBackFun = function(serviceInstance) {
            $scope.contents.fn.onlyDataReLoad();
        };

    })
    .controller('iaasDeployWebServicePathTabCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, common, CONSTANTS) {
        _DebugConsoleLog("deployServerTabControllers.js : iaasDeployWebServicePathTabCtrl", 1);

        var tab = this;
        tab.fn = {};

        $scope.$on('deployReloadChanged',function(event, deployServer) {

        });

        tab.fn.selectServiceInstance = function (sltServiceInstanceId) {
            $scope.contents.sltServiceInstance = common.objectsFindCopyByField($scope.contents.deployServer.serviceInstances, "id", sltServiceInstanceId);
            $scope.contents.fn.setDefaultServicePort($scope.contents.sltServiceInstance);
        };

        tab.fn.addWebServiceInstanceLocationForm = function (sltServiceInstance) {
            var dialogOptions = {
                controller : "iaasDeployWebServicePathFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                serviceInstance : angular.copy(sltServiceInstance),
                controllerAs : "pop",
                formMode : "add"
            };
            tab.addWebServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        // 서비스 삭제
        tab.fn.delWebServiceInstanceLocation = function(serviceLocation) {
            common.showConfirm('WEB 리소스 삭제', 'WEB 리소스 ('+serviceLocation.name+')를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : serviceLocation.deployId,
                    serviceInstanceId : serviceLocation.serviceInstanceId,
                    serviceInstanceLocId : serviceLocation.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance/path', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        common.showAlertSuccess('리소스가 삭제되었습니다.');
                        $scope.contents.fn.onlyDataReLoad();
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        tab.fn.actionCallBackFun = function(serviceInstanceLoc) {
            $scope.contents.fn.onlyDataReLoad();
        };

        if ($scope.contents.deployServer && $scope.contents.deployServer.serviceInstances && $scope.contents.deployServer.serviceInstances.length > 0) {
            if (!$scope.contents.sltServiceInstanceId) {
                $scope.contents.sltServiceInstanceId = '' + $scope.contents.deployServer.serviceInstances[0].id;
            }
            tab.fn.selectServiceInstance($scope.contents.sltServiceInstanceId);
        }

    })
    .controller('iaasDeployWasServiceConfigTabCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, common, CONSTANTS) {
        _DebugConsoleLog("deployServerTabControllers.js : iaasDeployWasServiceConfigTabCtrl", 1);

        var tab = this;
        tab.fn = {};

        $scope.$on('deployReloadChanged',function(event, deployServer) {

        });

        /*WAS 서비스 인스턴스 등록*/
        tab.fn.addWasServiceInstanceFormOpen = function () {
            var dialogOptions = {
                controller : "iaasDeployWasServiceConfigFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                controllerAs : "pop",
                formMode : "add"
            };
            tab.addDbServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        /*WAS 서비스 인스턴스 수정*/
        tab.fn.modWasServiceInstanceConfigFormOpen = function (sltServiceInstance) {
            var dialogOptions = {
                controller : "iaasDeployWasServiceConfigFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                serviceInstance : angular.copy(sltServiceInstance),
                controllerAs : "pop",
                formMode : "mod"
            };
            tab.modDbServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        // 서비스 삭제
        tab.fn.delWasServiceInstance = function(serviceInstance) {
            if ($scope.contents.deployServer.serviceInstances.length < 2) {
                common.showAlertWarning("기본 서비스는 한개는 삭제할 수 없습니다.");
                return;
            }
            common.showConfirm('WAS 서비스 삭제', 'WAS 서비스('+serviceInstance.serviceInstanceName+')를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : $scope.contents.deployServer.deployId,
                    serviceInstanceId : serviceInstance.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        if ($scope.contents.configDetailView) {
                            $scope.contents.fn.zoomPanelConfigDetailClose();
                        }
                        $scope.contents.fn.onlyDataReLoad();
                        common.showAlertSuccess('삭제되었습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        tab.fn.actionCallBackFun = function(serviceInstance) {
            $scope.contents.fn.onlyDataReLoad();
        };

    })
    .controller('iaasDeployWasServiceConfigDetailTabCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, common, CONSTANTS) {
        _DebugConsoleLog("deployServerTabControllers.js : iaasDeployWasServiceConfigDetailTabCtrl", 1);

        var tab = this;
        tab.fn = {};

        $scope.$on('deployReloadChanged',function(event, deployServer) {

        });

        /*WAS 서비스 인스턴스 수정*/
        tab.fn.modWasServiceInstanceConfigFormOpen = function (sltServiceInstance) {
            var dialogOptions = {
                controller : "iaasDeployWasServiceConfigFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                serviceInstance : angular.copy(sltServiceInstance),
                controllerAs : "pop",
                formMode : "mod"
            };
            tab.modDbServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        // 서비스 삭제
        tab.fn.delWasServiceInstance = function(serviceInstance) {
            if ($scope.contents.deployServer.serviceInstances.length < 2) {
                common.showAlertWarning("기본 서비스는 한개는 삭제할 수 없습니다.");
                return;
            }
            common.showConfirm('WAS 서비스 삭제', 'WAS 서비스('+serviceInstance.serviceInstanceName+')를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : $scope.contents.deployServer.deployId,
                    serviceInstanceId : serviceInstance.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        $scope.contents.fn.zoomPanelConfigDetailClose();
                        $scope.contents.fn.onlyDataReLoad();
                        common.showAlertSuccess('삭제되었습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        tab.fn.actionCallBackFun = function(serviceInstance) {
            $scope.contents.fn.onlyDataReLoad();
        };

    })
    .controller('iaasDeployDbServiceConfigTabCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, common, CONSTANTS) {
        _DebugConsoleLog("deployServerTabControllers.js : iaasDeployDbServiceConfigTabCtrl", 1);

        var tab = this;
        tab.fn = {};

        $scope.$on('deployReloadChanged',function(event, deployServer) {

        });

        tab.fn.selectServiceInstance = function (sltServiceInstanceId) {
            $scope.contents.sltServiceInstance = common.objectsFindCopyByField($scope.contents.deployServer.serviceInstances, "id", sltServiceInstanceId);
            $scope.contents.fn.setDefaultServicePort($scope.contents.sltServiceInstance);
        };

        /*DB 서비스 수정*/
        tab.fn.modDbServiceInstanceConfigFormOpen = function (sltServiceInstance) {
            var dialogOptions = {
                controller : "iaasDeployDbServiceConfigFormCtrl",
                callBackFunction : tab.fn.actionCallBackFun,
                deployServer : angular.copy($scope.contents.deployServer),
                serviceInstance : angular.copy(sltServiceInstance),
                controllerAs : "pop",
                formMode : "mod"
            };
            tab.modDbServiceInstanceDialog = common.showRightDialog($scope, dialogOptions);
        };

        tab.fn.actionCallBackFun = function(serviceInstance) {
            $scope.contents.fn.onlyDataReLoad();
        };

        if ($scope.contents.deployServer && $scope.contents.deployServer.serviceInstances && $scope.contents.deployServer.serviceInstances.length > 0) {
            if (!$scope.contents.sltServiceInstanceId) {
                $scope.contents.sltServiceInstanceId = '' + $scope.contents.deployServer.serviceInstances[0].id;
            }
            tab.fn.selectServiceInstance($scope.contents.sltServiceInstanceId);
        }
    })
    .controller('iaasDeploySWMontiTabCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, common, CONSTANTS) {
        _DebugConsoleLog("deployServerControllers.js : iaasDeploySWMontiTabCtrl", 1);

        var tab = this;
        var pct = $scope.contents;
        tab.fn = {};
        tab.data = {};
        tab.timeRanges = ["1", "2", "6", "24", "48"];
        tab.periods = ["1", "10", "60"];

        tab.selTimeRange = tab.timeRanges[0];
        tab.selPeriod = tab.periods[0];

        // 개수가 변동이 있는 차트에서 사용
        tab.lineChartColors = [
            { borderColor: "rgba(183,93,218,1)", backgroundColor: "rgba(183,93,218,0.2)", fill: true },
            { borderColor: "rgba(22,87,218,1)", backgroundColor: "rgba(22,87,218,0.2)", fill: true },
            { borderColor: "rgba(1,160,206,1)", backgroundColor: "rgba(1,160,206,0.2)", fill: true },
            { borderColor: "rgba(183,93,118,1)", backgroundColor: "rgba(183,93,118,0.2)", fill: true },
            { borderColor: "rgba(22,87,118,1)", backgroundColor: "rgba(22,87,118,0.2)", fill: true },
            { borderColor: "rgba(1,160,106,1)", backgroundColor: "rgba(1,160,106,0.2)", fill: true },
            { borderColor: "rgba(183,93,18,1)", backgroundColor: "rgba(183,93,18,0.2)", fill: true },
            { borderColor: "rgba(22,87,18,1)", backgroundColor: "rgba(22,87,18,0.2)", fill: true },
            { borderColor: "rgba(1,160,6,1)", backgroundColor: "rgba(1,160,6,0.2)", fill: true }
        ];

        tab.lineChartOptions = {
            elements: { line: { tension: 0 }, point: { radius: 0 } },
            scales: {
                //yAxes: [{ ticks: { min : 0, } }],
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                return $filter('date')(values[index].value, 'HH:mm');
                            } else {
                                return value;
                            }
                        },
                        time: { unit: 'minute' }
                    }
                }]
            }
        };

        tab.lineChartLabels = [];
        tab.lineChartDayLabels = [];

        $scope.$on('deployReloadChanged',function(event, deployServer) {

        });

        tab.fn.getStepRang = function (rangeType) {
            var range = 60000;
            if (rangeType == "s") {
                range = 1000;
            } else if (rangeType == "h") {
                range = 3600000;
            } else if (rangeType == "d") {
                range = 86400000;
            }
            return range;
        };

        tab.fn.getChartTimeLabels = function(time_step, start_time) {
            var setDate = new Date();
            var stepRangeType = time_step.substring(time_step.length - 1);
            var stepRangeTime = time_step.substring(0, time_step.length - 1);
            var stepRange = tab.fn.getStepRang(stepRangeType);
            stepRangeTime *= stepRange;

            var startRangeType = start_time.substring(start_time.length - 1);
            var startRangeTime = start_time.substring(0, start_time.length - 1);
            startRangeTime *= tab.fn.getStepRang(startRangeType);

            var end = Math.round(setDate.getTime()/stepRange)*stepRange;
            var start = end - startRangeTime;
            var lineChartLabels = [];
            for (var time = start; time < end; time += stepRangeTime) {
                lineChartLabels.push(new Date(time));
            }
            return lineChartLabels;
        };

        //1. WEB : active, writing, reading, accepts, handled, requests
        //1-1. active
        tab.lineChartActive = {};
        tab.lineChartActive.series = [];
        tab.lineChartActive.colors = [];
        tab.lineChartActive.labels = [];
        tab.lineChartActive.options = angular.copy(tab.lineChartOptions);
        tab.lineChartActive.data = [];

        //1. WEB : active, writing, reading, accepts, handled, requests
        //1-2. writing
        tab.lineChartWriting = {};
        tab.lineChartWriting.series = [];
        tab.lineChartWriting.colors = [];
        tab.lineChartWriting.labels = [];
        tab.lineChartWriting.options = angular.copy(tab.lineChartOptions);
        tab.lineChartWriting.data = [];

        //1. WEB : active, writing, reading, accepts, handled, requests
        //1-3. reading
        tab.lineChartReading = {};
        tab.lineChartReading.series = [];
        tab.lineChartReading.colors = [];
        tab.lineChartReading.labels = [];
        tab.lineChartReading.options = angular.copy(tab.lineChartOptions);
        tab.lineChartReading.data = [];

        //1. WEB : active, writing, reading, accepts, handled, requests
        //1-4. accepts
        tab.lineChartAccepts = {};
        tab.lineChartAccepts.series = [];
        tab.lineChartAccepts.colors = [];
        tab.lineChartAccepts.labels = [];
        tab.lineChartAccepts.options = angular.copy(tab.lineChartOptions);
        tab.lineChartAccepts.data = [];

        //1. WEB : active, writing, reading, accepts, handled, requests
        //1-5. handled
        tab.lineChartHandled = {};
        tab.lineChartHandled.series = [];
        tab.lineChartHandled.colors = [];
        tab.lineChartHandled.labels = [];
        tab.lineChartHandled.options = angular.copy(tab.lineChartOptions);
        tab.lineChartHandled.data = [];

        //1. WEB : active, writing, reading, accepts, handled, requests
        //1-6. requests
        tab.lineChartRequests = {};
        tab.lineChartRequests.series = [];
        tab.lineChartRequests.colors = [];
        tab.lineChartRequests.labels = [];
        tab.lineChartRequests.options = angular.copy(tab.lineChartOptions);
        tab.lineChartRequests.data = [];

        //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
        //2-1. lbtot(Lbtot)
        tab.lineChartLbtot = {};
        tab.lineChartLbtot.series = [];
        tab.lineChartLbtot.colors = [];
        tab.lineChartLbtot.labels = [];
        tab.lineChartLbtot.options = angular.copy(tab.lineChartOptions);
        tab.lineChartLbtot.data = [];

        //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
        //2-2. ereq(Ereq)
        tab.lineChartEreq = {};
        tab.lineChartEreq.series = [];
        tab.lineChartEreq.colors = [];
        tab.lineChartEreq.labels = [];
        tab.lineChartEreq.options = angular.copy(tab.lineChartOptions);
        tab.lineChartEreq.data = [];

        //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
        //2-3. eresp(Eresp)
        tab.lineChartEresp = {};
        tab.lineChartEresp.series = [];
        tab.lineChartEresp.colors = [];
        tab.lineChartEresp.labels = [];
        tab.lineChartEresp.options = angular.copy(tab.lineChartOptions);
        tab.lineChartEresp.data = [];

        //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
        //2-4. bin(Bin)
        tab.lineChartBin = {};
        tab.lineChartBin.series = [];
        tab.lineChartBin.colors = [];
        tab.lineChartBin.labels = [];
        tab.lineChartBin.options = angular.copy(tab.lineChartOptions);
        tab.lineChartBin.data = [];

        //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
        //2-5. bout(Bout)
        tab.lineChartBout = {};
        tab.lineChartBout.series = [];
        tab.lineChartBout.colors = [];
        tab.lineChartBout.labels = [];
        tab.lineChartBout.options = angular.copy(tab.lineChartOptions);
        tab.lineChartBout.data = [];

        //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
        //2-6. econ(Econ)
        tab.lineChartEcon = {};
        tab.lineChartEcon.series = [];
        tab.lineChartEcon.colors = [];
        tab.lineChartEcon.labels = [];
        tab.lineChartEcon.options = angular.copy(tab.lineChartOptions);
        tab.lineChartEcon.data = [];

        //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
        //2-7. stot(Stot)
        tab.lineChartStot = {};
        tab.lineChartStot.series = [];
        tab.lineChartStot.colors = [];
        tab.lineChartStot.labels = [];
        tab.lineChartStot.options = angular.copy(tab.lineChartOptions);
        tab.lineChartStot.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-1. bytes_received(Bytes_received)
        tab.lineChartBytes_received = {};
        tab.lineChartBytes_received.series = [];
        tab.lineChartBytes_received.colors = [];
        tab.lineChartBytes_received.labels = [];
        tab.lineChartBytes_received.options = angular.copy(tab.lineChartOptions);
        tab.lineChartBytes_received.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-2. bytes_sent
        tab.lineChartBytes_sent = {};
        tab.lineChartBytes_sent.series = [];
        tab.lineChartBytes_sent.colors = [];
        tab.lineChartBytes_sent.labels = [];
        tab.lineChartBytes_sent.options = angular.copy(tab.lineChartOptions);
        tab.lineChartBytes_sent.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-3. commands_commit
        tab.lineChartCommands_commit = {};
        tab.lineChartCommands_commit.series = [];
        tab.lineChartCommands_commit.colors = [];
        tab.lineChartCommands_commit.labels = [];
        tab.lineChartCommands_commit.options = angular.copy(tab.lineChartOptions);
        tab.lineChartCommands_commit.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-4. commands_delete
        tab.lineChartCommands_delete = {};
        tab.lineChartCommands_delete.series = [];
        tab.lineChartCommands_delete.colors = [];
        tab.lineChartCommands_delete.labels = [];
        tab.lineChartCommands_delete.options = angular.copy(tab.lineChartOptions);
        tab.lineChartCommands_delete.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-5. commands_insert
        tab.lineChartCommands_insert = {};
        tab.lineChartCommands_insert.series = [];
        tab.lineChartCommands_insert.colors = [];
        tab.lineChartCommands_insert.labels = [];
        tab.lineChartCommands_insert.options = angular.copy(tab.lineChartOptions);
        tab.lineChartCommands_insert.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-6. commands_select
        tab.lineChartCommands_select = {};
        tab.lineChartCommands_select.series = [];
        tab.lineChartCommands_select.colors = [];
        tab.lineChartCommands_select.labels = [];
        tab.lineChartCommands_select.options = angular.copy(tab.lineChartOptions);
        tab.lineChartCommands_select.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-7. commands_update
        tab.lineChartCommands_update = {};
        tab.lineChartCommands_update.series = [];
        tab.lineChartCommands_update.colors = [];
        tab.lineChartCommands_update.labels = [];
        tab.lineChartCommands_update.options = angular.copy(tab.lineChartOptions);
        tab.lineChartCommands_update.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-8. connections
        tab.lineChartConnections = {};
        tab.lineChartConnections.series = [];
        tab.lineChartConnections.colors = [];
        tab.lineChartConnections.labels = [];
        tab.lineChartConnections.options = angular.copy(tab.lineChartOptions);
        tab.lineChartConnections.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-9. innodb_data_read
        tab.lineChartInnodb_data_read = {};
        tab.lineChartInnodb_data_read.series = [];
        tab.lineChartInnodb_data_read.colors = [];
        tab.lineChartInnodb_data_read.labels = [];
        tab.lineChartInnodb_data_read.options = angular.copy(tab.lineChartOptions);
        tab.lineChartInnodb_data_read.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-10. innodb_data_reads
        tab.lineChartInnodb_data_reads = {};
        tab.lineChartInnodb_data_reads.series = [];
        tab.lineChartInnodb_data_reads.colors = [];
        tab.lineChartInnodb_data_reads.labels = [];
        tab.lineChartInnodb_data_reads.options = angular.copy(tab.lineChartOptions);
        tab.lineChartInnodb_data_reads.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-11. innodb_data_writes
        tab.lineChartInnodb_data_writes = {};
        tab.lineChartInnodb_data_writes.series = [];
        tab.lineChartInnodb_data_writes.colors = [];
        tab.lineChartInnodb_data_writes.labels = [];
        tab.lineChartInnodb_data_writes.options = angular.copy(tab.lineChartOptions);
        tab.lineChartInnodb_data_writes.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-12. innodb_data_written
        tab.lineChartInnodb_data_written = {};
        tab.lineChartInnodb_data_written.series = [];
        tab.lineChartInnodb_data_written.colors = [];
        tab.lineChartInnodb_data_written.labels = [];
        tab.lineChartInnodb_data_written.options = angular.copy(tab.lineChartOptions);
        tab.lineChartInnodb_data_written.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-13. queries
        tab.lineChartQueries = {};
        tab.lineChartQueries.series = [];
        tab.lineChartQueries.colors = [];
        tab.lineChartQueries.labels = [];
        tab.lineChartQueries.options = angular.copy(tab.lineChartOptions);
        tab.lineChartQueries.data = [];

        //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
        //3-14. memory_used
        tab.lineChartMemory_used = {};
        tab.lineChartMemory_used.series = [];
        tab.lineChartMemory_used.colors = [];
        tab.lineChartMemory_used.labels = [];
        tab.lineChartMemory_used.options = angular.copy(tab.lineChartOptions);
        tab.lineChartMemory_used.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-1. bytes_received
        tab.lineChartBytes_received = {};
        tab.lineChartBytes_received.series = [];
        tab.lineChartBytes_received.colors = [];
        tab.lineChartBytes_received.labels = [];
        tab.lineChartBytes_received.options = angular.copy(tab.lineChartOptions);
        tab.lineChartBytes_received.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-2. bytes_sent
        tab.lineChartBytes_sent = {};
        tab.lineChartBytes_sent.series = [];
        tab.lineChartBytes_sent.colors = [];
        tab.lineChartBytes_sent.labels = [];
        tab.lineChartBytes_sent.options = angular.copy(tab.lineChartOptions);
        tab.lineChartBytes_sent.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-3. current_thread_count
        tab.lineChartCurrent_thread_count = {};
        tab.lineChartCurrent_thread_count.series = [];
        tab.lineChartCurrent_thread_count.colors = [];
        tab.lineChartCurrent_thread_count.labels = [];
        tab.lineChartCurrent_thread_count.options = angular.copy(tab.lineChartOptions);
        tab.lineChartCurrent_thread_count.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-4. current_threads_busy
        tab.lineChartCurrent_threads_busy = {};
        tab.lineChartCurrent_threads_busy.series = [];
        tab.lineChartCurrent_threads_busy.colors = [];
        tab.lineChartCurrent_threads_busy.labels = [];
        tab.lineChartCurrent_threads_busy.options = angular.copy(tab.lineChartOptions);
        tab.lineChartCurrent_threads_busy.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-5. error_count
        tab.lineChartError_count = {};
        tab.lineChartError_count.series = [];
        tab.lineChartError_count.colors = [];
        tab.lineChartError_count.labels = [];
        tab.lineChartError_count.options = angular.copy(tab.lineChartOptions);
        tab.lineChartError_count.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-6. processing_time
        tab.lineChartProcessing_time = {};
        tab.lineChartProcessing_time.series = [];
        tab.lineChartProcessing_time.colors = [];
        tab.lineChartProcessing_time.labels = [];
        tab.lineChartProcessing_time.options = angular.copy(tab.lineChartOptions);
        tab.lineChartProcessing_time.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-7. request_count
        tab.lineChartRequest_count = {};
        tab.lineChartRequest_count.series = [];
        tab.lineChartRequest_count.colors = [];
        tab.lineChartRequest_count.labels = [];
        tab.lineChartRequest_count.options = angular.copy(tab.lineChartOptions);
        tab.lineChartRequest_count.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-8. free
        tab.lineChartFree = {};
        tab.lineChartFree.series = [];
        tab.lineChartFree.colors = [];
        tab.lineChartFree.labels = [];
        tab.lineChartFree.options = angular.copy(tab.lineChartOptions);
        tab.lineChartFree.data = [];

        //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
        //4-9. total
        tab.lineChartTotal = {};
        tab.lineChartTotal.series = [];
        tab.lineChartTotal.colors = [];
        tab.lineChartTotal.labels = [];
        tab.lineChartTotal.options = angular.copy(tab.lineChartOptions);
        tab.lineChartTotal.data = [];


        /*시스템소프트웨어 모니터링 조회*/
        tab.fn.getDeployData = function() {
            tab.loadingSsMonitoring = true;
            var uuids = "";
            for (var i=0; i<pct.deployServer.deployInstances.length; i++){
                if (i==0){
                    uuids = pct.deployServer.deployInstances[i].instanceId;
                } else {
                    uuids += "|" + pct.deployServer.deployInstances[i].instanceId;
                }
            }
            var params = {
                deploy_type: pct.deployServer.deployType,
                server_uuid: uuids,
                time_step: tab.selPeriod + "m",
                start_time: tab.selTimeRange + "h"
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/deploy/used_step', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                //tab.data.serverNetSeries = tab.fn.getTimeColumnSeries(data);
                tab.data.deploySeries = data[0].series;
                if (data[1]){
                    tab.data.deploySeries2 = data[1].series;
                }

                getDeployDataAfterLoad();
                tab.loadingSsMonitoring = false;
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
                tab.loadingSsMonitoring = false;
            });
            serverStatsPromise.finally(function (data, status, headers) {
                tab.deployDataLoad = true;
                tab.fn.deployMonitLoadCheck();
                tab.loadingSsMonitoring = false;
            });
        };

        /*시스템소프트웨어 모니터링 조회 후 데이터 로딩*/
        function getDeployDataAfterLoad() {
            var netSeries = [];
            var netColors = [];
            var netLabels = [];
            var netSeries2 = [];
            var netColors2 = [];
            var netLabels2 = [];

            if (pct.deployServer.deployType == "WEB") {
                //1. WEB : active, writing, reading, accepts, handled, requests
                var activeData = [];
                var writingData = [];
                var readingData = [];
                var acceptsData = [];
                var handledData = [];
                var requestsData = [];

                tab.lineChartReading.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartAccepts.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartHandled.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartRequests.options.scales.yAxes = [{ticks: {min: 0}}];

                if (tab.data.deploySeries && tab.data.deploySeries.length > 0) {
                    angular.forEach(tab.data.deploySeries, function (cData, ckey) {
                        netSeries[ckey] = cData.tags.server_name + ":" + cData.tags.port;
                        netColors[ckey] = angular.copy(tab.lineChartColors[ckey]);

                        activeData[ckey] = [];
                        writingData[ckey] = [];
                        readingData[ckey] = [];
                        acceptsData[ckey] = [];
                        handledData[ckey] = [];
                        requestsData[ckey] = [];

                        var iTime = cData.columns.indexOf("time");
                        var iActive = cData.columns.indexOf("active");
                        var iWriting = cData.columns.indexOf("writing");
                        var iReading = cData.columns.indexOf("reading");
                        var iAccepts = cData.columns.indexOf("accepts");
                        var iHandled = cData.columns.indexOf("handled");
                        var iRequests = cData.columns.indexOf("requests");

                        if (angular.isArray(cData.values)) {
                            angular.forEach(cData.values, function (item, key) {
                                if (key > 0) {
                                    if (ckey == 0) {
                                        netLabels.push(new Date(item[iTime]));
                                    }
                                    var prvKey = key - 1;
                                    var active = null;
                                    var writing = null;
                                    var reading = null;
                                    var accepts = null;
                                    var handled = null;
                                    var requests = null;
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iAccepts] != null && angular.isDefined(cData.values[prvKey][iAccepts])
                                            && cData.values[key][iAccepts] != null && angular.isDefined(cData.values[key][iAccepts])) {
                                            accepts = cData.values[key][iAccepts] - cData.values[prvKey][iAccepts];
                                        }
                                        if (cData.values[prvKey][iHandled] != null && angular.isDefined(cData.values[prvKey][iHandled])
                                            && cData.values[key][iHandled] != null && angular.isDefined(cData.values[key][iHandled])) {
                                            handled = cData.values[key][iHandled] - cData.values[prvKey][iHandled];
                                        }
                                        if (cData.values[prvKey][iRequests] != null && angular.isDefined(cData.values[prvKey][iRequests])
                                            && cData.values[key][iRequests] != null && angular.isDefined(cData.values[key][iRequests])) {
                                            requests = cData.values[key][iRequests] - cData.values[prvKey][iRequests];
                                        }
                                    }
                                    activeData[ckey].push(item[iActive]);
                                    writingData[ckey].push(item[iWriting]);
                                    readingData[ckey].push(item[iReading]);
                                    acceptsData[ckey].push(accepts);
                                    handledData[ckey].push(handled);
                                    requestsData[ckey].push(requests);
                                }
                            });
                        }
                    });
                    /*delete(tab.lineChartActive.options.scales.yAxes);
                     delete(tab.lineChartWriting.options.scales.yAxes);
                     delete(tab.lineChartReading.options.scales.yAxes);*/
                } else {
                    netSeries.push("Interface");
                    netColors.push(angular.copy(tab.lineChartColors));
                    netLabels = angular.copy(tab.lineChartLabels);
                    tab.lineChartActive.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartWriting.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartReading.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartAccepts.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartHandled.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartRequests.options.scales.yAxes = [{ticks: {min: 0}}];
                    activeData[0] = [];
                    writingData[0] = [];
                    readingData[0] = [];
                    acceptsData[0] = [];
                    handledData[0] = [];
                    requestsData[0] = [];
                    angular.forEach(netLabels, function (time, key) {
                        activeData[0].push(null);
                        writingData[0].push(null);
                        readingData[0].push(null);
                        acceptsData[0].push(null);
                        handledData[0].push(null);
                        requestsData[0].push(null);
                    });
                }

                $timeout(function () {
                    tab.lineChartActive.series = angular.copy(netSeries);
                    tab.lineChartWriting.series = angular.copy(netSeries);
                    tab.lineChartReading.series = angular.copy(netSeries);
                    tab.lineChartAccepts.series = angular.copy(netSeries);
                    tab.lineChartHandled.series = angular.copy(netSeries);
                    tab.lineChartRequests.series = angular.copy(netSeries);

                    tab.lineChartActive.colors = angular.copy(netColors);
                    tab.lineChartWriting.colors = angular.copy(netColors);
                    tab.lineChartReading.colors = angular.copy(netColors);
                    tab.lineChartAccepts.colors = angular.copy(netColors);
                    tab.lineChartHandled.colors = angular.copy(netColors);
                    tab.lineChartRequests.colors = angular.copy(netColors);

                    tab.lineChartActive.labels = angular.copy(netLabels);
                    tab.lineChartWriting.labels = angular.copy(netLabels);
                    tab.lineChartReading.labels = angular.copy(netLabels);
                    tab.lineChartAccepts.labels = angular.copy(netLabels);
                    tab.lineChartHandled.labels = angular.copy(netLabels);
                    tab.lineChartRequests.labels = angular.copy(netLabels);

                    tab.lineChartActive.data = activeData;
                    tab.lineChartWriting.data = writingData;
                    tab.lineChartReading.data = readingData;
                    tab.lineChartAccepts.data = acceptsData;
                    tab.lineChartHandled.data = handledData;
                    tab.lineChartRequests.data = requestsData;
                }, 100);
            }
            else if (pct.deployServer.deployType == "LB") {
                //2. LB : lbtot, ereq, eresp, bin, bout, econ, stot
                var lbtotData = [];
                var ereqData = [];
                var erespData = [];
                var binData = [];
                var boutData = [];
                var econData = [];
                var stotData = [];

                tab.lineChartLbtot.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartEreq.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartEresp.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartBin.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartBout.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartEcon.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartStot.options.scales.yAxes = [{ticks: {min: 0}}];

                if (tab.data.deploySeries && tab.data.deploySeries.length > 0) {
                    angular.forEach(tab.data.deploySeries, function (cData, ckey) {
                        netSeries[ckey] = cData.tags.proxy + "(" + cData.tags.server_name + ")";
                        netColors[ckey] = angular.copy(tab.lineChartColors[ckey]);

                        lbtotData[ckey] = [];
                        ereqData[ckey] = [];
                        erespData[ckey] = [];
                        binData[ckey] = [];
                        boutData[ckey] = [];
                        econData[ckey] = [];
                        stotData[ckey] = [];

                        var iTime = cData.columns.indexOf("time");
                        var iLbtot = cData.columns.indexOf("lbtot");
                        var iEreq = cData.columns.indexOf("ereq");
                        var iEresp = cData.columns.indexOf("eresp");
                        var iBin = cData.columns.indexOf("bin");
                        var iBout = cData.columns.indexOf("bout");
                        var iEcon = cData.columns.indexOf("econ");
                        var iStot = cData.columns.indexOf("stot");

                        if (angular.isArray(cData.values)) {
                            angular.forEach(cData.values, function (item, key) {
                                if (key > 0) {
                                    if (ckey == 0) {
                                        netLabels.push(new Date(item[iTime]));
                                    }
                                    var prvKey = key - 1;
                                    var lbtot = null;
                                    var ereq = null;
                                    var eresp = null;
                                    var bin = null;
                                    var bout = null;
                                    var econ = null;
                                    var stot = null;
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iLbtot] != null && angular.isDefined(cData.values[prvKey][iLbtot])
                                            && cData.values[key][iLbtot] != null && angular.isDefined(cData.values[key][iLbtot])) {
                                            lbtot = cData.values[key][iLbtot] - cData.values[prvKey][iLbtot];
                                        }
                                        if (cData.values[prvKey][iEreq] != null && angular.isDefined(cData.values[prvKey][iEreq])
                                            && cData.values[key][iEreq] != null && angular.isDefined(cData.values[key][iEreq])) {
                                            ereq = cData.values[key][iEreq] - cData.values[prvKey][iEreq];
                                        }
                                        if (cData.values[prvKey][iEresp] != null && angular.isDefined(cData.values[prvKey][iEresp])
                                            && cData.values[key][iEresp] != null && angular.isDefined(cData.values[key][iEresp])) {
                                            eresp = cData.values[key][iEresp] - cData.values[prvKey][iEresp];
                                        }
                                        if (cData.values[prvKey][iBin] != null && angular.isDefined(cData.values[prvKey][iBin])
                                            && cData.values[key][iBin] != null && angular.isDefined(cData.values[key][iBin])) {
                                            bin = cData.values[key][iBin] - cData.values[prvKey][iBin];
                                        }
                                        if (cData.values[prvKey][iBout] != null && angular.isDefined(cData.values[prvKey][iBout])
                                            && cData.values[key][iBout] != null && angular.isDefined(cData.values[key][iBout])) {
                                            bout = cData.values[key][iBout] - cData.values[prvKey][iBout];
                                        }
                                        if (cData.values[prvKey][iEcon] != null && angular.isDefined(cData.values[prvKey][iEcon])
                                            && cData.values[key][iEcon] != null && angular.isDefined(cData.values[key][iEcon])) {
                                            econ = cData.values[key][iEcon] - cData.values[prvKey][iEcon];
                                        }
                                        if (cData.values[prvKey][iStot] != null && angular.isDefined(cData.values[prvKey][iStot])
                                            && cData.values[key][iStot] != null && angular.isDefined(cData.values[key][iStot])) {
                                            stot = cData.values[key][iStot] - cData.values[prvKey][iStot];
                                        }
                                    }
                                    lbtotData[ckey].push(lbtot);
                                    ereqData[ckey].push(ereq);
                                    erespData[ckey].push(eresp);
                                    binData[ckey].push(bin);
                                    boutData[ckey].push(bout);
                                    econData[ckey].push(econ);
                                    stotData[ckey].push(stot);
                                }
                            });
                        }
                    });
                    /*delete(tab.lineChartActive.options.scales.yAxes);
                     delete(tab.lineChartWriting.options.scales.yAxes);
                     delete(tab.lineChartReading.options.scales.yAxes);*/
                } else {
                    netSeries.push("Interface");
                    netColors.push(angular.copy(tab.lineChartColors));
                    netLabels = angular.copy(tab.lineChartLabels);
                    tab.lineChartLbtot.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartEreq.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartEresp.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartBin.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartBout.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartEcon.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartStot.options.scales.yAxes = [{ticks: {min: 0}}];
                    lbtotData[0] = [];
                    ereqData[0] = [];
                    erespData[0] = [];
                    binData[0] = [];
                    boutData[0] = [];
                    econData[0] = [];
                    stotData[0] = [];
                    angular.forEach(netLabels, function (time, key) {
                        lbtotData[0].push(null);
                        ereqData[0].push(null);
                        erespData[0].push(null);
                        binData[0].push(null);
                        boutData[0].push(null);
                        econData[0].push(null);
                        stotData[0].push(null);
                    });
                }

                $timeout(function () {
                    tab.lineChartLbtot.series = angular.copy(netSeries);
                    tab.lineChartEreq.series = angular.copy(netSeries);
                    tab.lineChartEresp.series = angular.copy(netSeries);
                    tab.lineChartBin.series = angular.copy(netSeries);
                    tab.lineChartBout.series = angular.copy(netSeries);
                    tab.lineChartEcon.series = angular.copy(netSeries);
                    tab.lineChartStot.series = angular.copy(netSeries);

                    tab.lineChartLbtot.colors = angular.copy(netColors);
                    tab.lineChartEreq.colors = angular.copy(netColors);
                    tab.lineChartEresp.colors = angular.copy(netColors);
                    tab.lineChartBin.colors = angular.copy(netColors);
                    tab.lineChartBout.colors = angular.copy(netColors);
                    tab.lineChartEcon.colors = angular.copy(netColors);
                    tab.lineChartStot.colors = angular.copy(netColors);

                    tab.lineChartLbtot.labels = angular.copy(netLabels);
                    tab.lineChartEreq.labels = angular.copy(netLabels);
                    tab.lineChartEresp.labels = angular.copy(netLabels);
                    tab.lineChartBin.labels = angular.copy(netLabels);
                    tab.lineChartBout.labels = angular.copy(netLabels);
                    tab.lineChartEcon.labels = angular.copy(netLabels);
                    tab.lineChartStot.labels = angular.copy(netLabels);

                    tab.lineChartLbtot.data = lbtotData;
                    tab.lineChartEreq.data = ereqData;
                    tab.lineChartEresp.data = erespData;
                    tab.lineChartBin.data = binData;
                    tab.lineChartBout.data = boutData;
                    tab.lineChartEcon.data = econData;
                    tab.lineChartStot.data = stotData;
                }, 100);
            }
            else if (pct.deployServer.deployType == "DB") {
                //3. DB : bytes_received, bytes_sent, commands_commit, commands_delete, commands_insert, commands_select, commands_update, connections, innodb_data_read, innodb_data_reads, innodb_data_writes, innodb_data_written, queries, memory_used
                var bytes_receivedData = [];
                var bytes_sentData = [];
                var commands_commitData = [];
                var commands_deleteData = [];
                var commands_insertData = [];
                var commands_selectData = [];
                var commands_updateData = [];
                var connectionsData = [];
                var innodb_data_readData = [];
                var innodb_data_readsData = [];
                var innodb_data_writesData = [];
                var innodb_data_writtenData = [];
                var queriesData = [];
                var memory_usedData = [];

                tab.lineChartBytes_received.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartBytes_sent.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartCommands_commit.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartCommands_delete.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartCommands_insert.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartCommands_select.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartCommands_update.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartConnections.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartInnodb_data_read.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartInnodb_data_reads.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartInnodb_data_writes.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartInnodb_data_written.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartQueries.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartMemory_used.options.scales.yAxes = [{ticks: {min: 0}}];

                if (tab.data.deploySeries && tab.data.deploySeries.length > 0) {
                    angular.forEach(tab.data.deploySeries, function (cData, ckey) {
                        netSeries[ckey] = cData.tags.server_name;
                        netColors[ckey] = angular.copy(tab.lineChartColors[ckey]);

                        bytes_receivedData[ckey] = [];
                        bytes_sentData[ckey] = [];
                        commands_commitData[ckey] = [];
                        commands_deleteData[ckey] = [];
                        commands_insertData[ckey] = [];
                        commands_selectData[ckey] = [];
                        commands_updateData[ckey] = [];
                        connectionsData[ckey] = [];
                        innodb_data_readData[ckey] = [];
                        innodb_data_readsData[ckey] = [];
                        innodb_data_writesData[ckey] = [];
                        innodb_data_writtenData[ckey] = [];
                        queriesData[ckey] = [];
                        memory_usedData[ckey] = [];

                        var iTime = cData.columns.indexOf("time");
                        var iBytes_received = cData.columns.indexOf("bytes_received");
                        var iBytes_sent = cData.columns.indexOf("bytes_sent");
                        var iCommands_commit = cData.columns.indexOf("commands_commit");
                        var iCommands_delete = cData.columns.indexOf("commands_delete");
                        var iCommands_insert = cData.columns.indexOf("commands_insert");
                        var iCommands_select = cData.columns.indexOf("commands_select");
                        var iCommands_update = cData.columns.indexOf("commands_update");
                        var iConnections = cData.columns.indexOf("connections");
                        var iInnodb_data_read = cData.columns.indexOf("innodb_data_read");
                        var iInnodb_data_reads = cData.columns.indexOf("innodb_data_reads");
                        var iInnodb_data_writes = cData.columns.indexOf("innodb_data_writes");
                        var iInnodb_data_written = cData.columns.indexOf("innodb_data_written");
                        var iQueries = cData.columns.indexOf("queries");
                        var iMemory_used = cData.columns.indexOf("memory_used");

                        if (angular.isArray(cData.values)) {
                            angular.forEach(cData.values, function (item, key) {
                                if (key > 0) {
                                    if (ckey == 0) {
                                        netLabels.push(new Date(item[iTime]));
                                    }
                                    var prvKey = key - 1;
                                    var bytes_received = null;
                                    var bytes_sent = null;
                                    var commands_commit = null;
                                    var commands_delete = null;
                                    var commands_insert = null;
                                    var commands_select = null;
                                    var commands_update = null;
                                    var connections = null;
                                    var innodb_data_read = null;
                                    var innodb_data_reads = null;
                                    var innodb_data_writes = null;
                                    var innodb_data_written = null;
                                    var queries = null;
                                    var memory_used = null;
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iBytes_received] != null && angular.isDefined(cData.values[prvKey][iBytes_received])
                                            && cData.values[key][iBytes_received] != null && angular.isDefined(cData.values[key][iBytes_received])) {
                                            bytes_received = cData.values[key][iBytes_received] - cData.values[prvKey][iBytes_received];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iBytes_sent] != null && angular.isDefined(cData.values[prvKey][iBytes_sent])
                                            && cData.values[key][iBytes_sent] != null && angular.isDefined(cData.values[key][iBytes_sent])) {
                                            bytes_sent = cData.values[key][iBytes_sent] - cData.values[prvKey][iBytes_sent];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iCommands_commit] != null && angular.isDefined(cData.values[prvKey][iCommands_commit])
                                            && cData.values[key][iCommands_commit] != null && angular.isDefined(cData.values[key][iCommands_commit])) {
                                            commands_commit = cData.values[key][iCommands_commit] - cData.values[prvKey][iCommands_commit];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iCommands_delete] != null && angular.isDefined(cData.values[prvKey][iCommands_delete])
                                            && cData.values[key][iCommands_delete] != null && angular.isDefined(cData.values[key][iCommands_delete])) {
                                            commands_delete = cData.values[key][iCommands_delete] - cData.values[prvKey][iCommands_delete];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iCommands_insert] != null && angular.isDefined(cData.values[prvKey][iCommands_insert])
                                            && cData.values[key][iCommands_insert] != null && angular.isDefined(cData.values[key][iCommands_insert])) {
                                            commands_insert = cData.values[key][iCommands_insert] - cData.values[prvKey][iCommands_insert];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iCommands_select] != null && angular.isDefined(cData.values[prvKey][iCommands_select])
                                            && cData.values[key][iCommands_select] != null && angular.isDefined(cData.values[key][iCommands_select])) {
                                            commands_select = cData.values[key][iCommands_select] - cData.values[prvKey][iCommands_select];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iCommands_update] != null && angular.isDefined(cData.values[prvKey][iCommands_update])
                                            && cData.values[key][iCommands_update] != null && angular.isDefined(cData.values[key][iCommands_update])) {
                                            commands_update = cData.values[key][iCommands_update] - cData.values[prvKey][iCommands_update];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iConnections] != null && angular.isDefined(cData.values[prvKey][iConnections])
                                            && cData.values[key][iConnections] != null && angular.isDefined(cData.values[key][iConnections])) {
                                            connections = cData.values[key][iConnections] - cData.values[prvKey][iConnections];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iInnodb_data_read] != null && angular.isDefined(cData.values[prvKey][iInnodb_data_read])
                                            && cData.values[key][iInnodb_data_read] != null && angular.isDefined(cData.values[key][iInnodb_data_read])) {
                                            innodb_data_read = cData.values[key][iInnodb_data_read] - cData.values[prvKey][iInnodb_data_read];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iInnodb_data_reads] != null && angular.isDefined(cData.values[prvKey][iInnodb_data_reads])
                                            && cData.values[key][iInnodb_data_reads] != null && angular.isDefined(cData.values[key][iInnodb_data_reads])) {
                                            innodb_data_reads = cData.values[key][iInnodb_data_reads] - cData.values[prvKey][iInnodb_data_reads];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iInnodb_data_writes] != null && angular.isDefined(cData.values[prvKey][iInnodb_data_writes])
                                            && cData.values[key][iInnodb_data_writes] != null && angular.isDefined(cData.values[key][iInnodb_data_writes])) {
                                            innodb_data_writes = cData.values[key][iInnodb_data_writes] - cData.values[prvKey][iInnodb_data_writes];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iInnodb_data_written] != null && angular.isDefined(cData.values[prvKey][iInnodb_data_written])
                                            && cData.values[key][iInnodb_data_written] != null && angular.isDefined(cData.values[key][iInnodb_data_written])) {
                                            innodb_data_written = cData.values[key][iInnodb_data_written] - cData.values[prvKey][iInnodb_data_written];
                                        }
                                    }
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iQueries] != null && angular.isDefined(cData.values[prvKey][iQueries])
                                            && cData.values[key][iQueries] != null && angular.isDefined(cData.values[key][iQueries])) {
                                            queries = cData.values[key][iQueries] - cData.values[prvKey][iQueries];
                                        }
                                    }

                                    bytes_receivedData[ckey].push(bytes_received);
                                    bytes_sentData[ckey].push(bytes_sent);
                                    commands_commitData[ckey].push(commands_commit);
                                    commands_deleteData[ckey].push(commands_delete);
                                    commands_insertData[ckey].push(commands_insert);
                                    commands_selectData[ckey].push(commands_select);
                                    commands_updateData[ckey].push(commands_update);
                                    connectionsData[ckey].push(connections);
                                    innodb_data_readData[ckey].push(innodb_data_read);
                                    innodb_data_readsData[ckey].push(innodb_data_reads);
                                    innodb_data_writesData[ckey].push(innodb_data_writes);
                                    innodb_data_writtenData[ckey].push(innodb_data_written);
                                    queriesData[ckey].push(queries);
                                    memory_usedData[ckey].push(cData.values[key][iMemory_used]);
                                }
                            });
                        }
                    });
                    /*delete(tab.lineChartActive.options.scales.yAxes);
                     delete(tab.lineChartWriting.options.scales.yAxes);
                     delete(tab.lineChartReading.options.scales.yAxes);*/
                } else {
                    netSeries.push("Interface");
                    netColors.push(angular.copy(tab.lineChartColors));
                    netLabels = angular.copy(tab.lineChartLabels);
                    tab.lineChartBytes_received.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartBytes_sent.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartCommands_commit.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartCommands_delete.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartCommands_insert.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartCommands_select.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartCommands_update.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartConnections.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartInnodb_data_read.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartInnodb_data_reads.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartInnodb_data_writes.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartInnodb_data_written.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartQueries.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartMemory_used.options.scales.yAxes = [{ticks: {min: 0}}];
                    bytes_receivedData[0] = [];
                    bytes_sentData[0] = [];
                    commands_commitData[0] = [];
                    commands_deleteData[0] = [];
                    commands_insertData[0] = [];
                    commands_selectData[0] = [];
                    commands_updateData[0] = [];
                    connectionsData[0] = [];
                    innodb_data_readData[0] = [];
                    innodb_data_readsData[0] = [];
                    innodb_data_writesData[0] = [];
                    innodb_data_writtenData[0] = [];
                    queriesData[0] = [];
                    memory_usedData[0] = [];
                    angular.forEach(netLabels, function (time, key) {
                        bytes_receivedData[0].push(null);
                        bytes_sentData[0].push(null);
                        commands_commitData[0].push(null);
                        commands_deleteData[0].push(null);
                        commands_insertData[0].push(null);
                        commands_selectData[0].push(null);
                        commands_updateData[0].push(null);
                        connectionsData[0].push(null);
                        innodb_data_readData[0].push(null);
                        innodb_data_readsData[0].push(null);
                        innodb_data_writesData[0].push(null);
                        innodb_data_writtenData[0].push(null);
                        queriesData[0].push(null);
                        memory_usedData[0].push(null);
                    });
                }

                $timeout(function () {
                    tab.lineChartBytes_received.series = angular.copy(netSeries);
                    tab.lineChartBytes_sent.series = angular.copy(netSeries);
                    tab.lineChartCommands_commit.series = angular.copy(netSeries);
                    tab.lineChartCommands_delete.series = angular.copy(netSeries);
                    tab.lineChartCommands_insert.series = angular.copy(netSeries);
                    tab.lineChartCommands_select.series = angular.copy(netSeries);
                    tab.lineChartCommands_update.series = angular.copy(netSeries);
                    tab.lineChartConnections.series = angular.copy(netSeries);
                    tab.lineChartInnodb_data_read.series = angular.copy(netSeries);
                    tab.lineChartInnodb_data_reads.series = angular.copy(netSeries);
                    tab.lineChartInnodb_data_writes.series = angular.copy(netSeries);
                    tab.lineChartInnodb_data_written.series = angular.copy(netSeries);
                    tab.lineChartQueries.series = angular.copy(netSeries);
                    tab.lineChartMemory_used.series = angular.copy(netSeries);

                    tab.lineChartBytes_received.colors = angular.copy(netColors);
                    tab.lineChartBytes_sent.colors = angular.copy(netColors);
                    tab.lineChartCommands_commit.colors = angular.copy(netColors);
                    tab.lineChartCommands_delete.colors = angular.copy(netColors);
                    tab.lineChartCommands_insert.colors = angular.copy(netColors);
                    tab.lineChartCommands_select.colors = angular.copy(netColors);
                    tab.lineChartCommands_update.colors = angular.copy(netColors);
                    tab.lineChartConnections.colors = angular.copy(netColors);
                    tab.lineChartInnodb_data_read.colors = angular.copy(netColors);
                    tab.lineChartInnodb_data_reads.colors = angular.copy(netColors);
                    tab.lineChartInnodb_data_writes.colors = angular.copy(netColors);
                    tab.lineChartInnodb_data_written.colors = angular.copy(netColors);
                    tab.lineChartQueries.colors = angular.copy(netColors);
                    tab.lineChartMemory_used.colors = angular.copy(netColors);

                    tab.lineChartBytes_received.labels = angular.copy(netLabels);
                    tab.lineChartBytes_sent.labels = angular.copy(netLabels);
                    tab.lineChartCommands_commit.labels = angular.copy(netLabels);
                    tab.lineChartCommands_delete.labels = angular.copy(netLabels);
                    tab.lineChartCommands_insert.labels = angular.copy(netLabels);
                    tab.lineChartCommands_select.labels = angular.copy(netLabels);
                    tab.lineChartCommands_update.labels = angular.copy(netLabels);
                    tab.lineChartConnections.labels = angular.copy(netLabels);
                    tab.lineChartInnodb_data_read.labels = angular.copy(netLabels);
                    tab.lineChartInnodb_data_reads.labels = angular.copy(netLabels);
                    tab.lineChartInnodb_data_writes.labels = angular.copy(netLabels);
                    tab.lineChartInnodb_data_written.labels = angular.copy(netLabels);
                    tab.lineChartQueries.labels = angular.copy(netLabels);
                    tab.lineChartMemory_used.labels = angular.copy(netLabels);

                    tab.lineChartBytes_received.data = bytes_receivedData;
                    tab.lineChartBytes_sent.data = bytes_sentData;
                    tab.lineChartCommands_commit.data = commands_commitData;
                    tab.lineChartCommands_delete.data = commands_deleteData;
                    tab.lineChartCommands_insert.data = commands_insertData;
                    tab.lineChartCommands_select.data = commands_selectData;
                    tab.lineChartCommands_update.data = commands_updateData;
                    tab.lineChartConnections.data = connectionsData;
                    tab.lineChartInnodb_data_read.data = innodb_data_readData;
                    tab.lineChartInnodb_data_reads.data = innodb_data_readsData;
                    tab.lineChartInnodb_data_writes.data = innodb_data_writesData;
                    tab.lineChartInnodb_data_written.data = innodb_data_writtenData;
                    tab.lineChartQueries.data = queriesData;
                    tab.lineChartMemory_used.data = memory_usedData;
                }, 100);
            }
            else if (pct.deployServer.deployType == "WAS") {
                //4. WAS : bytes_received, bytes_sent, current_thread_count, current_threads_busy, error_count, processing_time, request_count, free, total
                var bytes_receivedData = [];
                var bytes_sentData = [];
                var current_thread_countData = [];
                var current_threads_busyData = [];
                var error_countData = [];
                var processing_timeData = [];
                var request_countData = [];
                var freeData = [];
                var totalData = [];

                tab.lineChartBytes_received.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartBytes_sent.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartProcessing_time.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartRequest_count.options.scales.yAxes = [{ticks: {min: 0}}];
                tab.lineChartError_count.options.scales.yAxes = [{ticks: {min: 0}}];

                if (tab.data.deploySeries && tab.data.deploySeries.length > 0) {
                    angular.forEach(tab.data.deploySeries, function (cData, ckey) {
                        netSeries[ckey] = cData.tags.server_name;
                        netColors[ckey] = angular.copy(tab.lineChartColors[ckey]);

                        bytes_receivedData[ckey] = [];
                        bytes_sentData[ckey] = [];
                        current_thread_countData[ckey] = [];
                        current_threads_busyData[ckey] = [];
                        error_countData[ckey] = [];
                        processing_timeData[ckey] = [];
                        request_countData[ckey] = [];

                        var iTime = cData.columns.indexOf("time");
                        var iBytes_received = cData.columns.indexOf("bytes_received");
                        var iBytes_sent = cData.columns.indexOf("bytes_sent");
                        var iCurrent_thread_count = cData.columns.indexOf("current_thread_count");
                        var iCurrent_threads_busy = cData.columns.indexOf("current_threads_busy");
                        var iError_count = cData.columns.indexOf("error_count");
                        var iProcessing_time = cData.columns.indexOf("processing_time");
                        var iRequest_count = cData.columns.indexOf("request_count");

                        if (angular.isArray(cData.values)) {
                            angular.forEach(cData.values, function (item, key) {
                                if (key > 0) {
                                    if (ckey == 0) {
                                        netLabels.push(new Date(item[iTime]));
                                    }
                                    var prvKey = key - 1;
                                    var bytes_received = null;
                                    var bytes_sent = null;
                                    var processing_time = null;
                                    var request_count = null;
                                    if (angular.isObject(cData.values[prvKey]) && angular.isObject(cData.values[key])) {
                                        if (cData.values[prvKey][iBytes_received] != null && angular.isDefined(cData.values[prvKey][iBytes_received])
                                            && cData.values[key][iBytes_received] != null && angular.isDefined(cData.values[key][iBytes_received])) {
                                            bytes_received = cData.values[key][iBytes_received] - cData.values[prvKey][iBytes_received];
                                        }
                                        if (cData.values[prvKey][iBytes_sent] != null && angular.isDefined(cData.values[prvKey][iBytes_sent])
                                            && cData.values[key][iBytes_sent] != null && angular.isDefined(cData.values[key][iBytes_sent])) {
                                            bytes_sent = cData.values[key][iBytes_sent] - cData.values[prvKey][iBytes_sent];
                                        }
                                        if (cData.values[prvKey][iProcessing_time] != null && angular.isDefined(cData.values[prvKey][iProcessing_time])
                                            && cData.values[key][iProcessing_time] != null && angular.isDefined(cData.values[key][iProcessing_time])) {
                                            processing_time = cData.values[key][iProcessing_time] - cData.values[prvKey][iProcessing_time];
                                        }
                                        if (cData.values[prvKey][iRequest_count] != null && angular.isDefined(cData.values[prvKey][iRequest_count])
                                            && cData.values[key][iRequest_count] != null && angular.isDefined(cData.values[key][iRequest_count])) {
                                            request_count = cData.values[key][iRequest_count] - cData.values[prvKey][iRequest_count];
                                        }
                                    }
                                    bytes_receivedData[ckey].push(bytes_received);
                                    bytes_sentData[ckey].push(bytes_sent);
                                    current_thread_countData[ckey].push(cData.values[key][iCurrent_thread_count]);
                                    current_threads_busyData[ckey].push(cData.values[key][iCurrent_threads_busy]);
                                    error_countData[ckey].push(cData.values[key][iError_count]);
                                    processing_timeData[ckey].push(processing_time);
                                    request_countData[ckey].push(request_count);
                                }
                            });
                        }
                    });
                } else {
                    netSeries.push("Interface");
                    netColors.push(angular.copy(tab.lineChartColors));
                    netLabels = angular.copy(tab.lineChartLabels);
                    tab.lineChartBytes_received.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartBytes_sent.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartCurrent_thread_count.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartCurrent_threads_busy.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartError_count.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartProcessing_time.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartRequest_count.options.scales.yAxes = [{ticks: {min: 0}}];
                    bytes_receivedData[0] = [];
                    bytes_sentData[0] = [];
                    current_thread_countData[0] = [];
                    current_threads_busyData[0] = [];
                    error_countData[0] = [];
                    processing_timeData[0] = [];
                    request_countData[0] = [];
                    angular.forEach(netLabels, function (time, key) {
                        bytes_receivedData[0].push(null);
                        bytes_sentData[0].push(null);
                        current_thread_countData[0].push(null);
                        current_threads_busyData[0].push(null);
                        error_countData[0].push(null);
                        processing_timeData[0].push(null);
                        request_countData[0].push(null);
                    });
                }
                if (tab.data.deploySeries2 && tab.data.deploySeries2.length > 0) {
                    angular.forEach(tab.data.deploySeries2, function (cData, ckey) {
                        netSeries2[ckey] = cData.tags.server_name;
                        netColors2[ckey] = angular.copy(tab.lineChartColors[ckey]);

                        freeData[ckey] = [];
                        totalData[ckey] = [];

                        var iTime = cData.columns.indexOf("time");
                        var iFree = cData.columns.indexOf("free");
                        var iTotal = cData.columns.indexOf("total");

                        if (angular.isArray(cData.values)) {
                            angular.forEach(cData.values, function (item, key) {
                                if (key > 0) {
                                    if (ckey == 0) {
                                        netLabels2.push(new Date(item[iTime]));
                                    }
                                    freeData[ckey].push(cData.values[key][iFree]);
                                    totalData[ckey].push(cData.values[key][iTotal]);
                                }
                            });
                        }
                    });
                } else {
                    netSeries2.push("Interface");
                    netColors2.push(angular.copy(tab.lineChartColors));
                    netLabels2 = angular.copy(tab.lineChartLabels);
                    tab.lineChartFree.options.scales.yAxes = [{ticks: {min: 0}}];
                    tab.lineChartTotal.options.scales.yAxes = [{ticks: {min: 0}}];
                    freeData[0] = [];
                    totalData[0] = [];
                    angular.forEach(netLabels, function (time, key) {
                        freeData[0].push(null);
                        totalData[0].push(null);
                    });
                }

                $timeout(function () {
                    tab.lineChartBytes_received.series = angular.copy(netSeries);
                    tab.lineChartBytes_sent.series = angular.copy(netSeries);
                    tab.lineChartCurrent_thread_count.series = angular.copy(netSeries);
                    tab.lineChartCurrent_threads_busy.series = angular.copy(netSeries);
                    tab.lineChartError_count.series = angular.copy(netSeries);
                    tab.lineChartProcessing_time.series = angular.copy(netSeries);
                    tab.lineChartRequest_count.series = angular.copy(netSeries);
                    tab.lineChartFree.series = angular.copy(netSeries2);
                    tab.lineChartTotal.series = angular.copy(netSeries2);

                    tab.lineChartBytes_received.colors = angular.copy(netColors);
                    tab.lineChartBytes_sent.colors = angular.copy(netColors);
                    tab.lineChartCurrent_thread_count.colors = angular.copy(netColors);
                    tab.lineChartCurrent_threads_busy.colors = angular.copy(netColors);
                    tab.lineChartError_count.colors = angular.copy(netColors);
                    tab.lineChartProcessing_time.colors = angular.copy(netColors);
                    tab.lineChartRequest_count.colors = angular.copy(netColors);
                    tab.lineChartFree.colors = angular.copy(netColors2);
                    tab.lineChartTotal.colors = angular.copy(netColors2);

                    tab.lineChartBytes_received.labels = angular.copy(netLabels);
                    tab.lineChartBytes_sent.labels = angular.copy(netLabels);
                    tab.lineChartCurrent_thread_count.labels = angular.copy(netLabels);
                    tab.lineChartCurrent_threads_busy.labels = angular.copy(netLabels);
                    tab.lineChartError_count.labels = angular.copy(netLabels);
                    tab.lineChartProcessing_time.labels = angular.copy(netLabels);
                    tab.lineChartRequest_count.labels = angular.copy(netLabels);
                    tab.lineChartFree.labels = angular.copy(netLabels2);
                    tab.lineChartTotal.labels = angular.copy(netLabels2);

                    tab.lineChartBytes_received.data = bytes_receivedData;
                    tab.lineChartBytes_sent.data = bytes_sentData;
                    tab.lineChartCurrent_thread_count.data = current_thread_countData;
                    tab.lineChartCurrent_threads_busy.data = current_threads_busyData;
                    tab.lineChartError_count.data = error_countData;
                    tab.lineChartProcessing_time.data = processing_timeData;
                    tab.lineChartRequest_count.data = request_countData;
                    tab.lineChartFree.data = freeData;
                    tab.lineChartTotal.data = totalData;
                }, 100);
            }
        }

        tab.fn.deployMonitLoadCheck = function () {
            if (tab.deployDataLoad) {
                $timeout(function () {
                    $('#instance_monitoring_panel.scroll-pane').jScrollPane({});
                }, 100);
            }
        };

        tab.changeTimestamp = function () {
            tab.lineChartLabels = tab.fn.getChartTimeLabels(tab.selPeriod + "m", tab.selTimeRange + "h");
            tab.fn.getDeployData();
        };

        tab.deployDataLoad = false;
        tab.lineChartLabels = tab.fn.getChartTimeLabels(tab.selPeriod + "m", tab.selTimeRange + "h");
        tab.fn.getDeployData();

    })
;
