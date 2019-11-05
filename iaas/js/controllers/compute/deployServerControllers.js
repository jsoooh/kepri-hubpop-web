'use strict';

angular.module('iaas.controllers')
    .controller('iaasDeployServerCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("computeControllers.js : iaasDeployServerCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.serverMainList = [];
        ct.deployList = [];
        ct.deployServerList = [];
        ct.tenantMonitUsed = { cpu : {}, mem: {}, disk: {} };
        ct.cxAgengName = "cx_agent";

        ct.softwareIcons = {
            "haproxy" : "images/thum/im_logo_haproxy.png"
            , "nginx" : "images/thum/im_logo_nginx.png"
            , "tomcat" : "images/thum/im_thum_tomcat.png"
            , "mariadb" : "images/thum/im_logo_mysql.png"
        };

        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);

        ct.formOpen = function () {
            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeTypeCreateStepForm.html" + _VersionTail();

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getDeployServerList();
        });

        ct.moveToDetailPage = function(deployServer) {
            if (deployServer.viewType == "deploy") {
                $scope.main.goToPage('/iaas/deploy_server/detail/'+deployServer.deployId,deployServer.name)
            } else {
                $scope.main.goToPage('/iaas/compute/detail/'+deployServer.id,deployServer.name)
            }
        };

        ct.fn.getInstanceColumnDataBySeries = function(data) {
            var series = [];
            var instances = {};
            if (angular.isArray(data) && data.length > 0 && angular.isArray(data[0].series)  && data[0].series.length > 0) {
                angular.forEach(data[0].series, function (seryData, seryKey) {
                    seryData.columnData = [];
                    if (angular.isArray(seryData.values) &&  seryData.values.length > 0) {
                        var valuesLen = seryData.values.length;
                        angular.forEach(seryData.values, function (value, key) {
                            var itemObj = {};
                            angular.forEach(seryData.columns, function (column, k) {
                                itemObj[column] = value[k];
                            });
                            if (key == valuesLen - 1 && itemObj["total"]) {
                                seryData.total = itemObj["total"];
                            }
                            seryData.columnData.push(itemObj);
                        });
                    }
                    series.push(seryData)
                });
                angular.forEach(series, function (seryData, seryKey) {
                    if (seryData.columnData && seryData.columnData.length > 0) {
                        if (seryData.name == "disk") {
                            if (!instances[seryData.tags.server_uuid]) {
                                instances[seryData.tags.server_uuid] = [];
                            }
                            instances[seryData.tags.server_uuid].push(seryData.columnData[0]);
                        } else {
                            instances[seryData.tags.server_uuid] = seryData.columnData[0];
                        }
                    }
                });
            }
            return instances;
        };

        ct.fn.setInstanceMonitUsedMerge = function (tenantMonitUsed, monitUsed, instanceId) {
            if (tenantMonitUsed.cpu[instanceId]) {
                monitUsed.cpu.used += tenantMonitUsed.cpu[instanceId]['mean_usage_active'];
                monitUsed.cpu.count++;
            }
            if (ct.tenantMonitUsed.mem[instanceId]) {
                monitUsed.mem.total += tenantMonitUsed.mem[instanceId]['total'];
                monitUsed.mem.used += tenantMonitUsed.mem[instanceId]['mean_used'];
                monitUsed.mem.parsentUsed += tenantMonitUsed.mem[instanceId]['mean_used_percent'];
                monitUsed.mem.count++;
            }
            if (tenantMonitUsed.disk[instanceId] && tenantMonitUsed.disk[instanceId].length > 0) {
                angular.forEach(tenantMonitUsed.disk[instanceId], function (diskData, dk) {
                    monitUsed.disk.total += diskData['total'];
                    monitUsed.disk.used += diskData['used'];
                    monitUsed.disk.parsentUsed += diskData['used_percent'];
                    monitUsed.disk.count++;
                });
            }
            return monitUsed;
        };

        ct.fn.setServerInstanceUsedData = function () {
            if (ct.serverCpuDataLoad && ct.serverMemDataLoad && ct.serverDiskDataLoad) {
                angular.forEach(ct.deployServerList, function (deployServer, key) {
                    var monitUsed = {cpu: {count: 0, used: 0}, mem: {count: 0, total: 0, used: 0, parsentUsed: 0}, disk: {count: 0, total: 0, used: 0, parsentUsed: 0}};
                    if (deployServer.viewType == "deploy") {
                        angular.forEach(deployServer.instances, function (instance, k) {
                            monitUsed = ct.fn.setInstanceMonitUsedMerge(ct.tenantMonitUsed, monitUsed, instance.id);
                        });
                    } else {
                        monitUsed = ct.fn.setInstanceMonitUsedMerge(ct.tenantMonitUsed, monitUsed, deployServer.id);
                    }

                    if (monitUsed.cpu.count > 0) {
                        monitUsed.cpu.used = Math.round(monitUsed.cpu.used/monitUsed.cpu.count, 2);
                    }

                    if (monitUsed.mem.total > 0) {
                        monitUsed.mem.parsentUsed = Math.round(monitUsed.mem.used*100 / monitUsed.mem.total, 2);
                        monitUsed.mem.total = Math.round(monitUsed.mem.total / (1024 * 1024), 0);
                        monitUsed.mem.used = Math.round(monitUsed.mem.used / (1024 * 1024), 0);
                    }

                    if (monitUsed.disk.total > 0) {
                        monitUsed.disk.parsentUsed = Math.round(monitUsed.disk.used*100 / monitUsed.disk.total, 2);
                        monitUsed.disk.total = Math.round(monitUsed.disk.total / (1024 * 1024), 0);
                        monitUsed.disk.used = Math.round(monitUsed.disk.used / (1024 * 1024), 0);
                    }

                    $timeout(function () {
                        deployServer.cpu = monitUsed.cpu;
                        deployServer.mem = monitUsed.mem;
                        deployServer.disk = monitUsed.disk;
                    }, 100);
                });
            }
        };

        // 서버 CPU
        ct.fn.getTenantNowServerCpuUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    tenant_id: ct.data.tenantId
                },
                start_time: start_time
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_cpu/{server_type}/tenant/{tenant_id}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.tenantMonitUsed.cpu = ct.fn.getInstanceColumnDataBySeries(data);
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverCpuDataLoad = true;
                ct.fn.setServerInstanceUsedData();
            });
        };

        // 서버 Memory
        ct.fn.getTenantNowServerMemUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    tenant_id: ct.data.tenantId
                },
                start_time: start_time
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_mem/{server_type}/tenant/{tenant_id}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.tenantMonitUsed.mem = ct.fn.getInstanceColumnDataBySeries(data);
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverMemDataLoad = true;
                ct.fn.setServerInstanceUsedData();
            });
        };

        // 서버 Disk
        ct.fn.getTenantNowServerDiskUsedData = function(start_time) {
            var params = {
                urlPaths: {
                    server_type: "vm",
                    tenant_id: ct.data.tenantId
                },
                start_time: start_time
            };
            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitApiContextUrl + '/iaas/server_disk/{server_type}/tenant/{tenant_id}/used_now', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                ct.tenantMonitUsed.disk = ct.fn.getInstanceColumnDataBySeries(data);
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                ct.serverDiskDataLoad = true;
                ct.fn.setServerInstanceUsedData();
            });
        };

        ct.fn.onlyDataReLoad = function() {
            if ($scope.main.reloadTimmer['deployList'] != null) {
                if ($timeout.cancel($scope.main.reloadTimmer['deployList'])) {
                    $scope.main.reloadTimmer['deployList'] = null;
                }
            }
            ct.loadServerMainList = false;
            ct.loadDeployList = false;
            ct.fnGetServerMainList();
            ct.fn.getDeployList();
        };

        ct.fn.getDeployServerList = function() {
            $scope.main.loadingMainBody = true;
            ct.deployServerList = [];
            ct.fn.onlyDataReLoad();
        };

        ct.fn.setDeployServerList = function() {
            var deployServerList = [];
            angular.forEach(ct.serverMainList, function (instance, key) {
                instance.existDeploy = false;
                angular.forEach(ct.deployList, function (deploy, k) {
                    if (!angular.isArray(deploy.instances)) {
                        deploy.instances = [];
                    }
                    if (instance.deployId == deploy.deployId) {
                        instance.existDeploy = true;
                        deploy.instances.push(angular.copy(instance));
                    }
                });
            });

            angular.forEach(ct.deployList, function (deploy, k) {
                if (!deploy.instances ||  deploy.instances.length == 0) {
                    deploy.viewType = "deploy";
                    if (deploy.status == 'active') {
                        deploy.status = "deleted";
                    }
                    deployServerList.push(deploy);
                }
            });

            var checkDeployServers = [];
            angular.forEach(ct.serverMainList, function (instance, key) {
                if (instance.existDeploy) {
                    if (checkDeployServers.indexOf(instance.deployId) == -1) {
                        checkDeployServers.push(instance.deployId);
                        var deployServer = common.objectsFindCopyByField(ct.deployList, "deployId", instance.deployId);
                        deployServer.image = angular.copy(deployServer.instances[0].image);
                        deployServer.vmState = deployServer.instances[deployServer.instances.length - 1].vmState;
                        deployServer.taskState = deployServer.instances[deployServer.instances.length - 1].taskState;
                        deployServer.keypair = angular.copy(deployServer.instances[0].keypair);
                        deployServer.spec = {};
                        deployServer.spec.name = deployServer.instances[0].spec.name;
                        deployServer.spec.vcpus = 0;
                        deployServer.spec.ram = 0;
                        deployServer.spec.disk = 0;
                        deployServer.cpu = { used: 0 };
                        deployServer.mem = { total: 0, used: 0, parsentUsed: 0};
                        deployServer.disk = { total: 0, used: 0, parsentUsed: 0};
                        angular.forEach(deployServer.instances, function (item, k) {
                            deployServer.spec.vcpus += item.spec.vcpus;
                            deployServer.spec.ram += item.spec.ram;
                            deployServer.spec.disk += item.spec.disk;
                        });
                        deployServer.viewType = "deploy";
                        deployServerList.push(angular.copy(deployServer));
                    }
                } else {
                    if (instance.name != ct.cxAgengName) {
                        var deployServer = angular.copy(instance);
                        deployServer.viewType = "instance";
                        deployServerList.push(deployServer);
                    }
                }
            });

            if (ct.deployServerList.length > deployServerList.length) {
                ct.deployServerList.splice(deployServerList.length, ct.deployServerList.length - deployServerList.length);
            }

            var dataReLoadDeployServers = [];

            angular.forEach(deployServerList, function (deployServer, key) {
                if (deployServer.viewType == "deploy") {
                    switch (deployServer.uiStatus) {
                        case "initializing":
                            deployServer.statusIndex = 0;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        case "creating":
                            deployServer.statusIndex = 1;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push(ct.deployServerList[key]);
                            break;
                        case "preparing":
                            deployServer.statusIndex = 2;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        case "installing":
                            deployServer.statusIndex = 3;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        case "configuring":
                            deployServer.statusIndex = 4;
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ deployId : deployServer.deployId });
                            break;
                        default :
                            deployServer.statusIndex = 5;
                            if (deployServer.uiStatus == 'error' ) {
                                deployServer.deployStatus = "fail";
                            } else {
                                deployServer.deployStatus = "done";
                            }
                            break;
                    }

                    deployServer.instances.sort(function (a, b) {return a.name > b.name ? 1 : -1});

                } else if (deployServer.viewType == "instance") {
                    switch (deployServer.vmState) {
                        case "active":
                        case "stopped":
                        case "paused":
                            deployServer.deployStatus = "done";
                            break;
                        case "error":
                            deployServer.deployStatus = "fail";
                            break;
                        default :
                            deployServer.deployStatus = "ing";
                            dataReLoadDeployServers.push({ instanceId : deployServer.instanceId });
                            break;
                    }
                }

                if (ct.deployServerList[key]) {
                    angular.forEach(deployServer, function(value, skey) {
                        if (angular.isArray(value)) {
                            if (!angular.isArray(ct.deployServerList[key][skey])) {
                                ct.deployServerList[key][skey] = [];
                            }
                            if (ct.deployServerList[key][skey].length > value.length) {
                                ct.deployServerList[key][skey].splice(value.length, ct.deployServerList[key][skey].length - value.length);
                            }
                            angular.forEach(value, function(val, k) {
                                if (ct.deployServerList[key][skey][k]) {
                                    angular.forEach(val, function(v, sk) {
                                        if (ct.deployServerList[key][skey][k][sk] != v) {
                                            ct.deployServerList[key][skey][k][sk] = v;
                                        }
                                    });
                                } else {
                                    ct.deployServerList[key][skey].push(val)
                                }
                            });
                        } else {
                            ct.deployServerList[key][skey] = value;
                        }
                    });
                } else {
                    ct.deployServerList.push(deployServer);
                }
            });

            if (dataReLoadDeployServers.length > 0) {
                $scope.main.reloadTimmer['deployList'] = $timeout(function () {
                    ct.fn.onlyDataReLoad();
                }, 5000);
            }

            ct.serverCpuDataLoad = false;
            ct.serverMemDataLoad = false;
            ct.serverDiskDataLoad = false;
            ct.fn.getTenantNowServerCpuUsedData("10m");
            ct.fn.getTenantNowServerMemUsedData("10m");
            ct.fn.getTenantNowServerDiskUsedData("10m");

        };

        // Lb DeployList 리스트 조회
        ct.fn.getDeployList = function() {
            var params = {
                tenantId : ct.data.tenantId
            };
            ct.deployList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.deployList = [];
                    angular.forEach(data.content, function (item, key) {
                        item.vmType = item.deployType;
                        item.name = item.deployName;
                        item.softwareIconUrl = ct.softwareIcons[item.software];
                        var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", item.vmType);
                        if (angular.isObject(vmDeployType) && vmDeployType.id) {
                            item.vmDeployType = vmDeployType;
                        } else {
                            item.vmDeployType = angular.copy(ct.deployTypes[0]);
                        }
                        ct.deployList.push(item);
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                if (ct.loadServerMainList && ct.loadDeployList) {
                    $scope.main.loadingMainBody = false;
                }
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                ct.loadDeployList = true;
                if (ct.loadServerMainList && ct.loadDeployList) {
                    $scope.main.loadingMainBody = false;
                    ct.fn.setDeployServerList();
                }
            });
        };

        // 서버메인 tenant list 함수
        ct.fnGetServerMainList = function() {
            var param = {
                tenantId : ct.data.tenantId,
                conditionKey : ct.conditionKey,
                conditionValue : ct.conditionValue,
                queryType : 'list',
                size : 0
            };

            ct.serverMainList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (status == 200 && data) {
                    ct.pageOptions = paging.makePagingOptions(data);
                    var isCxAgent = false;
                    angular.forEach(data.content.instances, function (item, key) {
                        var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", item.vmType);
                        if (angular.isObject(vmDeployType) && vmDeployType.id) {
                            item.vmDeployType = vmDeployType;
                        } else {
                            item.vmDeployType = angular.copy(ct.deployTypes[0]);
                        }
                        if (item.name == ct.cxAgengName) {
                            isCxAgent = false;
                        }
                    });
                    ct.serverMainList = data.content.instances;
                    if ($scope.$parent.contents) {
                        $scope.$parent.$broadcast('setIaaSInstanceCount', (isCxAgent ? (ct.serverMainList.length - 1) : ct.serverMainList.length));
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                ct.loadServerMainList = true;
                if (ct.loadServerMainList && ct.loadDeployList) {
                    $scope.main.loadingMainBody = false;
                    ct.fn.setDeployServerList();
                }
            });
        };

        // 서비스 삭제
        ct.fn.deleteDeployServer = function(deployServer, index) {
            if (deployServer.deployType == "LB" && angular.isArray(deployServer.serviceDeployments) && deployServer.serviceDeployments.length > 0) {
                common.showAlertSuccess('LB ('+deployServer.name+')에 연결되어 있는 서비스('+deployServer.serviceDeployments.length+')가 존재하여 삭제 하실 수 없습니다.');
                return;
            }
            common.showConfirm('서비스 삭제', '선택한 서비스('+deployServer.name+') 및 서버를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : deployServer.deployId
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        ct.deployServerList.splice(index, 1);
                        setTimeout(function() {
                            $scope.main.loadingMainBody = false;
                            common.showAlertSuccess('삭제되었습니다.');
                        }, 1000);
                    } else {
                        $scope.main.loadingMainBody = false;
                        common.showAlertError('오류가 발생하였습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        //추가 E
        // 서버삭제
        ct.deleteInstanceJob = function(instance, index) {
            common.showConfirm('서버 삭제', '선택한 서버('+instance.name+')를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    instanceId : instance.id
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        ct.deployServerList.splice(index, 1);
                        setTimeout(function () {
                            $scope.main.loadingMainBody = false;
                            if (status == 200 && data) {
                                common.showAlertSuccess('삭제되었습니다.');
                            } else {
                                common.showAlertError('오류가 발생하였습니다.');
                            }
                        }, 1000);
                    } else {
                        $scope.main.loadingMainBody = false;
                        common.showAlertError('오류가 발생하였습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.addDeployServerInstance = function(deployServer, index, count) {
            var title = '인스턴스 증가';
            var message = '선택한 서비스('+deployServer.name+')의 인스턴스를 증가하시겠습니까?';
            if (deployServer.deployType == "LB" || deployServer.deployType == "DB") {
                title = '클러스터 구성';
                message = '선택한 서비스('+deployServer.name+')의 클러스터 구성하시겠습니까?';
            }
            common.showConfirm(title, message).then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams : {
                        deployId: deployServer.deployId,
                        count: count
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/instance/scale', 'POST', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.onlyDataReLoad();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.delDeployServerInstance = function(deployServer, index, count) {
            var title = '인스턴스 감소';
            var message = '선택한 서비스('+deployServer.name+')의 인스턴스를 감소하시겠습니까?';
            if (deployServer.deployType == "LB" || deployServer.deployType == "DB") {
                title = '단일 구성';
                message = '선택한 서비스('+deployServer.name+')의 단일 구성하시겠습니까?';
            }
            common.showConfirm(title, message).then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams : {
                        deployId: deployServer.deployId,
                        count: count
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/instance/scale', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.onlyDataReLoad();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.deployServerInstanceCountFormOpen = function (deployServer, index) {
            var dialogOptions = {
                controller : "iaasDeployInstanceCountFormOpenCtrl",
                callBackFunction : ct.fn.actionSebCallBackFun,
                deployServer : angular.copy(deployServer),
                controllerAs : "pop",
                formMode : "mod"
            };
            ct.servicePortFormDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.fn.deployServerActionConfirm = function(action, deployServer, index) {
            if(action == "START") {
                common.showConfirm('메세지', deployServer.deployName +' 서비스를 시작 하시겠습니까?').then(function(){
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            } else if(action == "STOP") {
                common.showConfirm('메세지', deployServer.deployName +' 서비스를 정지 하시겠습니까?').then(function(){
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            } else if(action == "RESTART") {
                common.showConfirm('메세지', deployServer.deployName + ' 서버를 재시작 하시겠습니까?').then(function () {
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            } else if(action == "INSTALL") {
                common.showConfirm('메세지', deployServer.deployName + ' 서버를 재배포 하시겠습니까?').then(function () {
                    ct.fn.deployServerAction(action, deployServer, index);
                });
            } else if(action == "DELETE") {
                ct.fn.deleteDeployServer(deployServer,index);
            } else if(action == "SCALE") {
                ct.fn.deployServerInstanceCountFormOpen(deployServer, index);
            }
        };

        ct.fn.deployServerAction = function(action, deployServer, index) {
            var param = {
                deployId : deployServer.deployId,
                command : action.toLowerCase()
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/action?' + $.param(param), 'POST');
            returnPromise.success(function (data, status, headers) {
                if (action == "START") {
                    common.showAlertError("서비스가 시작 되었습니다.");
                } else if(action == "STOP") {
                    common.showAlertError("서비스가 정지 되었습니다.");
                } else if(action == "RESTART") {
                    common.showAlertError("서비스가 재시작 되었습니다.");
                } else if(action == "INSTALL") {
                    common.showAlertError("서비스가 재배포 중 입니다.");
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        ct.fn.serverActionConfirm = function(action,instance,index) {
            if(action == "START") {
                common.showConfirm('시작', instance.name +' 서버를 시작 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "STOP") {
                common.showConfirm('정지', instance.name +' 서버를 정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "PAUSE") {
                common.showConfirm('일시정지', instance.name +' 서버를 일시정지 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "UNPAUSE") {
                common.showConfirm('정지해제', instance.name +' 서버를 정지해제 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "REBOOT") {
                common.showConfirm('재시작',instance.name +' 서버를 재시작 하시겠습니까?').then(function(){
                    ct.fnSingleInstanceAction(action, instance, index);
                });
            } else if(action == "DELETE") {
                ct.deleteInstanceJob(instance, index);
            } else if(action == "SNAPSHOT") {
                ct.fn.createSnapshot(instance);
            } else if(action == "IPCONNECT"){
                ct.fn.IpConnectPop(instance,index);
            } else if(action == "IPDISCONNECT"){
                common.showConfirm('접속 IP를 해제',instance.name +' 서버의 접속 IP를 해제 하시겠습니까?').then(function(){
                    ct.fn.ipConnectionSet(instance, "detach",index);
                });
            }
        };


        ct.fnSingleInstanceAction = function(action, instance, index) {
            var param = {
                instanceId : instance.id,
                action : action,
                tenantId : ct.data.tenantId
            };
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/power', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {

                var vmStateChange = "";
                if(action == "START"){
                    vmStateChange = "starting";
                }else if(action == "STOP"){
                    vmStateChange = "stopping";
                }else if(action == "PAUSE"){
                    vmStateChange = "pausing";
                }else if(action == "UNPAUSE"){
                    vmStateChange = "unpausing";
                }else if(action == "REBOOT"){
                    vmStateChange = "rebooting";
                }
                ct.serverMainList[index].vmState = vmStateChange;
                ct.serverMainList[index].observeAction = action;
                $timeout(function () {
                    ct.fn.getDeployServerList();
                }, 1000);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        // SnapShot 생성
        ct.fn.createSnapshot = function(instance) {
            if(instance.vmState != 'stopped') {
                common.showAlertWarning('서버를 정지 후 생성가능합니다.');
                return;
            } else {
                ct.selectInstance = instance;
                $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computeSnapshotForm.html" + _VersionTail();
                $(".aside").stop().animate({"right":"-360px"}, 400);
                $("#aside-aside1").stop().animate({"right":"0"}, 500);
            }
        };

        // 접속 IP 설정 팝업
        ct.fn.IpConnectPop = function(instance,index) {
            ct.selectInstance = instance;
            ct.selectInstanceIndex = index;

            $scope.main.layerTemplateUrl = _IAAS_VIEWS_ + "/compute/computePublicIpForm.html" + _VersionTail();
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        // 공인 IP 연결 해제 펑션
        ct.fn.ipConnectionSet = function(instance,type,index) {
            var param = {
                tenantId : ct.data.tenantId,
                instanceId : instance.id
            };
            if(instance.floatingIp) {
                param.floatingIp = instance.floatingIp;
                param.action = type;
            } else {
                return false;
            }
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance/network/floatingIp', 'POST', param,'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess('접속 IP가 해제되었습니다.');
                ct.deployServerList[index].floatingIp = "";
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlert("message",data.message);
            });
        };

        ct.fn.actionSebCallBackFun = function() {
            ct.fn.onlyDataReLoad();
        };

        if(ct.data.tenantId) {
            ct.fn.getDeployServerList();
        }

    })
    .controller('iaasDeployServerDetailCtrl', function ($scope, $location, $state, $sce, $q, $stateParams, $timeout, $window, $mdDialog, $filter, $bytes, $translate, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("deployServerControllers.js : iaasDeployServerDetailCtrl", 1);

        var ct = this;

        ct.fn = {};
        ct.data = {};
        ct.deployServer = {};

        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
        ct.data.deployId = $stateParams.deployId;

        ct.sltInfoTab = 'configSetting';
        ct.deployTypes = angular.copy(CONSTANTS.deployTypes);

        ct.deployStatusList = [
            { "step": "초기화", "status": "" },
            { "step": "가상머신 생성", "status": "" },
            { "step": "설치 준비", "status": "" },
            { "step": "설치", "status": "" },
            { "step": "설치 완료", "status": "" }
        ];

        ct.tabPathSettingTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployWebServicePath.html" + _VersionTail();
        ct.tabDeployMonitTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeploySWMonit.html" + _VersionTail();

        $scope.$on('userTenantChanged',function(event,status) {
            $scope.main.goToPage("/iaas");
        });

        ct.configSettingZoom = false;
        ct.zoomPanel = function(evt, type){
            var panel = $(evt.currentTarget).closest(".panel");
            if(panel.hasClass("zoom")) {
                panel.removeClass("zoom").resize();
                ct.configSettingZoom = false;
                if (type == "deployHistory" || type == "configSetting" || type == "configDetail") {
                    panel.find('scrollable-table').removeClass("tableHeight650");
                    panel.find('scrollable-table').addClass("tableHeight420");
                } else if (type == "deployMonit") {
                    panel.find('.panel_body').css("height", "500px");
                    $timeout(function () {
                        panel.find('.scroll-pane').jScrollPane({contentWidth: '0px'});
                    }, 100);
                    panel.find('.visualizeItem').css("width", "465px");
                }
                $timeout(function () {
                    $(window).scrollTop(document.scrollingElement.scrollHeight);
                }, 100);
            } else {
                panel.addClass("zoom").resize();
                ct.configSettingZoom = true;
                if (type == "deployHistory" || type == "configSetting" || type == "pathSetting") {
                    panel.find('scrollable-table').removeClass("tableHeight420");
                    panel.find('scrollable-table').addClass("tableHeight650");
                } else if (type == "deployMonit") {
                    panel.find('.panel_body').css("height", "90%");
                    $timeout(function () {
                        panel.find('.scroll-pane').jScrollPane({contentWidth: '0px'});
                    }, 100);
                    panel.find('.visualizeItem').css("width", "750px");
                }
                $timeout(function () {
                    $(window).scrollTop(0);
                }, 100);
            }
        };

        ct.configDetailViewSltInfo = {};

        ct.fn.configDetailToggle = function (sltInfo) {
            if (sltInfo.configDetailView == true) {
                sltInfo.configDetailView = false;
                ct.configDetailViewSltInfo = {};
            } else {
                if (ct.configDetailViewSltInfo && ct.configDetailViewSltInfo.configDetailView == true) {
                    ct.configDetailViewSltInfo.configDetailView = false;
                    ct.configDetailViewSltInfo = {};
                }
                sltInfo.configDetailView = true;
                ct.configDetailViewSltInfo = sltInfo;
            }
        };

        ct.fn.zoomPanelConfigDetailShow = function (sltInfo) {
            if (ct.deployType == 'LB') {
                ct.sltLbServicePortId = sltInfo.id;
                ct.sltLbServicePort = sltInfo;
            } else {
                ct.sltServiceInstanceId = sltInfo.id;
                ct.sltServiceInstance = sltInfo;
            }
            ct.configDetailView = true;
            $timeout(function () {
                $(window).scrollTop(0);
            }, 100);
        };

        ct.fn.zoomPanelConfigDetailClose = function () {
            ct.configDetailView = false;
            if(!ct.configSettingZoom) {
                $timeout(function () {
                    $(window).scrollTop(document.scrollingElement.scrollHeight);
                }, 100);
            }
        };

        ct.fn.addDeployServerInstance = function(deployServer, index, count) {
            var title = '인스턴스 증가';
            var message = '선택한 서비스('+deployServer.name+')의 인스턴스를 증가하시겠습니까?';
            if (deployServer.deployType == "LB" || deployServer.deployType == "DB") {
                title = '클러스터 구성';
                message = '선택한 서비스('+deployServer.name+')의 클러스터 구성하시겠습니까?';
            }
            common.showConfirm(title, message).then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams : {
                        deployId: deployServer.deployId,
                        count: count
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/instance/scale', 'POST', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.onlyDataReLoad();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.delDeployServerInstance = function(deployServer, index, count) {
            var title = '인스턴스 감소';
            var message = '선택한 서비스('+deployServer.name+')의 인스턴스를 감소하시겠습니까?';
            if (deployServer.deployType == "LB" || deployServer.deployType == "DB") {
                title = '단일 구성';
                message = '선택한 서비스('+deployServer.name+')의 단일 구성하시겠습니까?';
            }
            common.showConfirm(title, message).then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams : {
                        deployId: deployServer.deployId,
                        count: count
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/instance/scale', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.onlyDataReLoad();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.deployDetailInstanceCountFormOpen = function (deployServer) {
            var dialogOptions = {
                controller : "iaasDeployInstanceCountFormOpenCtrl",
                callBackFunction : ct.fn.actionSebCallBackFun,
                deployServer : angular.copy(deployServer),
                controllerAs : "pop",
                formMode : "mod"
            };
            ct.servicePortFormDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.fn.deployServerDetailActionConfirm = function(action) {
            if(action == "START") {
                common.showConfirm('메세지', '서비스를 시작 하시겠습니까?').then(function(){
                    ct.fn.deployServerDetailAction(action);
                });
            } else if(action == "STOP") {
                common.showConfirm('메세지', '서비스를 정지 하시겠습니까?').then(function(){
                    ct.fn.deployServerDetailAction(action);
                });
            } else if(action == "RESTART") {
                common.showConfirm('메세지', '서버를 재시작 하시겠습니까?').then(function () {
                    ct.fn.deployServerDetailAction(action);
                });
            } else if(action == "INSTALL") {
                common.showConfirm('메세지', '서버를 재배포 하시겠습니까?').then(function () {
                    ct.fn.deployServerDetailAction(action);
                });
            } else if(action == "DELETE") {
                ct.fn.deleteDeployServerDetail(ct.deployServer);
            } else if(action == "SCALE") {
                ct.fn.deployDetailInstanceCountFormOpen(ct.deployServer);
            }
        };

        ct.fn.deployServerDetailAction = function(action) {
            var param = {
                urlParams : {
                    deployId: ct.deployServer.deployId,
                    command: action.toLowerCase()
                }
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/action', 'POST', param);
            returnPromise.success(function (data, status, headers) {
                if (action == "START") {
                    common.showAlertError("서비스가 시작 되었습니다.");
                } else if(action == "STOP") {
                    common.showAlertError("서비스가 정지 되었습니다.");
                } else if(action == "RESTART") {
                    common.showAlertError("서비스가 재시작 되었습니다.");
                } else if(action == "INSTALL") {
                    common.showAlertError("서비스가 재배포 중 입니다.");
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        // 서비스 삭제
        ct.fn.deleteDeployServerDetail = function(deployServer) {
            if (deployServer.deployType == "LB" && angular.isArray(deployServer.serviceDeployments) && deployServer.serviceDeployments.length > 0) {
                common.showAlertSuccess(''+deployServer.name+' 서비스에 연결되어 있는 서비스('+deployServer.serviceDeployments.length+')가 존재하여 삭제 하실 수 없습니다.');
                return;
            }
            common.showConfirm('서비스 삭제', '선택한 서비스('+deployServer.deployName+') 및 서버를 삭제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    deployId : deployServer.deployId
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    setTimeout(function() {
                        $scope.main.loadingMainBody = false;
                        if (status == 200 && data) {
                            common.showAlertSuccess('삭제되었습니다.');
                        } else {
                            common.showAlertError('오류가 발생하였습니다.');
                        }
                        $scope.main.goToPage("/iaas/deploy_server");
                    }, 1000);
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.getDeployServerInfoBinding = function(deployServer) {
            var vmDeployType = common.objectsFindCopyByField(ct.deployTypes, "type", deployServer.deployType);
            if (angular.isObject(vmDeployType) && vmDeployType.id) {
                deployServer.vmDeployType = vmDeployType;
            } else {
                deployServer.vmDeployType = angular.copy(ct.deployTypes[0]);
            }
            deployServer.fixedIps = [];
            if (deployServer.deployInstances && deployServer.deployInstances.length > 0) {
                angular.forEach(deployServer.deployInstances, function(instance, key) {
                    if (instance.fixedIp) {
                        deployServer.fixedIps.push(instance.fixedIp);
                    }
                });
            }
            deployServer.domainInfos = [];
            deployServer.domains = [];
            if (deployServer.deployType == 'LB') {
                var servicePortMappingServiceInstances = {};
                var servicePortMappingDeployments = {};
                if (angular.isArray(deployServer.serviceDeployments) && deployServer.serviceDeployments.length > 0) {
                    angular.forEach(deployServer.serviceDeployments, function(serviceDeployment, key1) {
                        if (angular.isArray(serviceDeployment.serviceInstances) && serviceDeployment.serviceInstances.length > 0) {
                            angular.forEach(serviceDeployment.serviceInstances, function(serviceInstance, key2) {
                                if (angular.isArray(serviceInstance.lbServicePorts) && serviceInstance.lbServicePorts.length > 0) {
                                    angular.forEach(serviceInstance.lbServicePorts, function(lbServicePort, key3) {
                                        servicePortMappingServiceInstances[lbServicePort.id] = serviceInstance;
                                    });
                                }
                            });
                        }
                        servicePortMappingDeployments[serviceDeployment.deployId] = serviceDeployment;
                    });
                }
                if (angular.isArray(deployServer.servicePorts) && deployServer.servicePorts.length > 0) {
                    angular.forEach(deployServer.servicePorts, function(servicePort, key1) {
                        if (servicePortMappingServiceInstances[servicePort.id]) {
                            servicePort.serviceInstance = servicePortMappingServiceInstances[servicePort.id];
                            if (servicePortMappingDeployments[servicePort.serviceInstance.deployId]) {
                                servicePort.serviceInstance.deployment = servicePortMappingDeployments[servicePort.serviceInstance.deployId];
                                servicePort.serviceInstance.fixedIps = [];
                                angular.forEach(servicePort.serviceInstance.deployment.deployInstances, function(deployInstance, key2) {
                                    servicePort.serviceInstance.fixedIps.push(deployInstance.fixedIp);
                                });
                            }
                        }
                        if (angular.isArray(servicePort.servicePortDomainLinks) && servicePort.servicePortDomainLinks.length > 0) {
                            angular.forEach(servicePort.servicePortDomainLinks, function(servicePortDomainLink, key2) {
                                if (servicePortDomainLink.domainInfo && servicePortDomainLink.domainInfo.domain && deployServer.domains.indexOf(servicePortDomainLink.domainInfo.domain) == -1) {
                                    deployServer.domains.push(servicePortDomainLink.domainInfo.domain);
                                    deployServer.domainInfos.push(servicePortDomainLink.domainInfo);
                                }
                            });
                        }
                    });
                }
            } else {
                if (angular.isArray(deployServer.serviceInstances) && deployServer.serviceInstances.length > 0) {
                    angular.forEach(deployServer.serviceInstances, function(serviceInstance, key1) {
                        if (angular.isArray(serviceInstance.lbServicePorts) && serviceInstance.lbServicePorts.length > 0) {
                            angular.forEach(serviceInstance.lbServicePorts, function(lbServicePort, key2) {
                                if (angular.isArray(lbServicePort.servicePortDomainLinks) && lbServicePort.servicePortDomainLinks.length > 0) {
                                    angular.forEach(lbServicePort.servicePortDomainLinks, function(servicePortDomainLink, key3) {
                                        if (servicePortDomainLink.domainInfo && servicePortDomainLink.domainInfo.domain && deployServer.domains.indexOf(servicePortDomainLink.domainInfo.domain) == -1) {
                                            deployServer.domains.push(servicePortDomainLink.domainInfo.domain);
                                            deployServer.domainInfos.push(servicePortDomainLink.domainInfo);
                                        }
                                    });
                                }
                            });
                        }
                        if (angular.isArray(serviceInstance.serviceLocations) && serviceInstance.serviceLocations.length > 0) {
                            angular.forEach(serviceInstance.serviceLocations, function(serviceLocation, key2) {
                                if ((deployServer.deployType == 'WEB' && serviceLocation.name == 'default') || (deployServer.deployType == 'WAS' && serviceLocation.name == 'ROOT')) {
                                    serviceInstance.defaultServiceLocation = serviceLocation;
                                }
                            });
                        }
                    });
                }
            }
            return deployServer;
        };

        // 배포 진행 상태
        ct.fn.getStatusInfo = function () {
            // 현재 어떤 배포 상태인지 구분
            ct.statusIndex = 0;
            // 기본적으로 생성 시간을 기준으로 배포 시간 측정
            var startTime = ct.deployServer.lastAction;
            var deployServerTimer = Math.round((new Date().getTime() - startTime) / 1000);
            var deployServerMinute = parseInt(deployServerTimer / 60);
            if (deployServerMinute > 0) {
                ct.deployServerMinute = deployServerMinute + '분';
            }
            ct.deployServerSecond = deployServerTimer % 60;

            if (ct.deployHistories != null && ct.deployHistories.length > 0) {
                switch (ct.deployHistories[0]["uiStatus"]) {
                    case "initializing": ct.statusIndex = 0; break;
                    case "creating": ct.statusIndex = 1; break;
                    case "preparing": ct.statusIndex = 2; break;
                    case "installing": ct.statusIndex = 3; break;
                    case "configuring":
                    case "error":
                    case "init_error":
                    case "run_error":
                    case "active": ct.statusIndex = 4; break;
                }

                for (var j = 0; j < ct.deployStatusList.length; j++) {
                    if (j < ct.statusIndex) {
                        ct.deployStatusList[j]["status"] = "completed";
                    } else if (j == ct.statusIndex) {
                        ct.deployStatusList[j]["status"] = "running";
                    } else {
                        ct.deployStatusList[j]["status"] = "";
                    }
                }
            }
        };

        ct.fn.setDeployServerInfo = function(deployServer) {
            deployServer = ct.fn.getDeployServerInfoBinding(deployServer);
            angular.forEach(deployServer, function(value, key) {
                if (angular.isArray(value)) {
                    if (!angular.isArray(ct.deployServer[key])) {
                        ct.deployServer[key] = [];
                    }
                    if (ct.deployServer[key].length > deployServer[key].length) {
                        ct.deployServer[key].splice(deployServer[key].length, ct.deployServer[key].length - deployServer[key].length);
                    }
                    angular.forEach(value, function(val, k) {
                        ct.deployServer[key][k] = val;
                    });
                } else if (angular.isObject(value)) {
                    if (!angular.isObject(ct.deployServer[key])) {
                        ct.deployServer[key] = {};
                    }
                    angular.forEach(ct.deployServer[key], function(val, k) {
                        if (!value[k]) {
                            delete ct.deployServer[key][k];
                        }
                    });
                    angular.forEach(value, function(val, k) {
                        ct.deployServer[key][k] = val;
                    });
                } else {
                    ct.deployServer[key] = value;
                }
            });
            if (!ct.deployType) {
                ct.deployType = ct.deployServer.deployType;
                ct.fn.changeSltInfoTabSettingTemplateUrl();
            }
            if (ct.sltServiceInstanceId) {
                ct.sltServiceInstance = common.objectsFindCopyByField(ct.deployServer.serviceInstances, "id", ct.sltServiceInstanceId);
                ct.fn.setDefaultServicePort(ct.sltServiceInstance);
            }
            if (ct.deployServer.status == 'run_done') {
                ct.deployServer.deployStatus = "done";
            } else if (ct.deployServer.status == 'run_fail' || ct.deployServer.status == 'init_fail') {
                ct.deployServer.deployStatus = "fail";
            } else {
                ct.deployServer.deployStatus = "ing";
                $scope.main.reloadTimmer['deployServerDetail'] = $timeout(function () {
                    ct.fn.onlyDataReLoad();
                }, 5000);
            }
            if (ct.deployServer.deployType != 'LB') {
                ct.fn.setDefaultServicePort();
                ct.fn.getLbDeployServerInfo(ct.deployServer.lbDeployId);
            } else {
                $scope.$broadcast('deployReloadChanged', ct.deployServer);
            }
        };

        ct.fn.getDeployServerInfo = function() {
            if ($scope.main.reloadTimmer['deployServerDetail']) {
                $scope.main.reloadTimmer['deployServerDetail'] == null;
            }
            var param = {
                tenantId : ct.data.tenantId,
                deployId : ct.data.deployId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.fn.setDeployServerInfo(data.content[0]);
                } else {
                    common.showAlertError("존재하지 않는 배포정보 입니다.");
                    $scope.main.goToPage("/iaas/deploy_server");
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
                $scope.main.goToPage("/iaas/deploy_server");
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.setWasServiceLocationPaths = function() {
            if (ct.lbDeployServer && ct.lbDeployServer.serviceDeployments && ct.lbDeployServer.serviceDeployments.length > 0
                && ct.deployServer.serviceInstances && ct.deployServer.serviceInstances.length > 0) {
                var webOutServiceLocations = [];
                angular.forEach(ct.lbDeployServer.serviceDeployments, function (serviceDeployment, key1) {
                    if (serviceDeployment.deployType == "WEB" && serviceDeployment.serviceInstances && serviceDeployment.serviceInstances.length > 0) {
                        angular.forEach(serviceDeployment.serviceInstances, function (serviceInstance, key2) {
                            var servicePortDomainLinks = [];
                            if (serviceInstance.lbServicePorts && serviceInstance.lbServicePorts.length > 0) {
                                angular.forEach(serviceInstance.lbServicePorts, function (lbServicePort, key3) {
                                    if (lbServicePort.servicePortDomainLinks && lbServicePort.servicePortDomainLinks.length > 0) {
                                        angular.forEach(lbServicePort.servicePortDomainLinks, function (servicePortDomainLink, key4) {
                                            var svcDomainLink = angular.copy(servicePortDomainLink);
                                            svcDomainLink.sourcePort = lbServicePort.sourcePort;
                                            servicePortDomainLinks.push(angular.copy(svcDomainLink))
                                        });
                                    }
                                });
                            }
                            if (serviceInstance.serviceLocations && serviceInstance.serviceLocations.length > 0) {
                                angular.forEach(serviceInstance.serviceLocations, function (serviceLocation, key3) {
                                    if (serviceLocation.targetType == "out" && serviceLocation.proxyPass && serviceLocation.proxyPass.indexOf("http://" + ct.lbDeployServer.vip) >= 0) {
                                        var webOutServiceLocation = angular.copy(serviceLocation);
                                        webOutServiceLocation.deployName = serviceDeployment.deployName;
                                        webOutServiceLocation.serviceInstanceName = serviceInstance.serviceInstanceName;
                                        webOutServiceLocation.servicePortDomainLinks = angular.copy(servicePortDomainLinks);
                                        webOutServiceLocations.push(webOutServiceLocation);
                                    }
                                });
                            }
                        });
                    }
                });
                if (webOutServiceLocations.length > 0) {
                    angular.forEach(ct.deployServer.serviceInstances, function (serviceInstance, key1) {
                        if (serviceInstance.lbServicePorts && serviceInstance.lbServicePorts.length > 0) {
                            angular.forEach(serviceInstance.lbServicePorts, function (lbServicePort, key2) {
                                angular.forEach(webOutServiceLocations, function (webOutServiceLocation, key3) {
                                    var checkUrl = "http://" + ct.lbDeployServer.vip;
                                    if (lbServicePort.sourcePort != 80) {
                                        checkUrl += ":" + lbServicePort.sourcePort + "/";
                                    } else {
                                        checkUrl += "/";
                                    }
                                    if (webOutServiceLocation.proxyPass.indexOf(checkUrl) >= 0) {
                                        if (!lbServicePort.serviceLocations) {
                                            lbServicePort.serviceLocations = [];
                                        }
                                        lbServicePort.serviceLocations.push(angular.copy(webOutServiceLocation));
                                    }
                                });
                            });
                        }
                        if (ct.sltServiceInstanceId == serviceInstance.id) {
                            ct.sltServiceInstance = serviceInstance;
                        }
                    });
                }
            }
        };

        ct.fn.getLbDeployServerInfo = function(lbDeployId) {
            var param = {
                tenantId : ct.data.tenantId,
                deployId : lbDeployId
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.lbDeployServer = ct.fn.getDeployServerInfoBinding(data.content[0]);
                    if (ct.deployServer.deployType == "WAS") {
                        ct.fn.setWasServiceLocationPaths();
                    }
                } else {
                    common.showAlertError("존재하지 않는 배포정보 입니다.");
                }
                $scope.$broadcast('deployReloadChanged', ct.deployServer);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        // 이력
        ct.fn.listDeployHistory = function() {
            var params = {
                deployId: ct.data.deployId
            };
            ct.deployHistories == [];
            var serverStatsPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/history', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.deployHistories = data.content;
                    ct.fn.getStatusInfo();
                }
            });
            serverStatsPromise.error(function (data, status, headers) {
            });
            serverStatsPromise.finally(function (data, status, headers) {
            });
        };

        // 액션 로그
        ct.fn.listActionLog = function() {
            var params = {
                deployId: ct.data.deployId
            };
            ct.actionLogs == [];
            var serverStatsPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/actionLog', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    ct.actionLogs = data.content;
                }
            });
            serverStatsPromise.error(function (data, status, headers) {
            });
            serverStatsPromise.finally(function (data, status, headers) {
            });
        };

        ct.fn.changeSltInfoTabSettingTemplateUrl = function () {
            if (ct.deployType == "LB") {
                ct.tabConfigSettingTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployLbServicePort.html" + _VersionTail();
                ct.tabConfigDetailTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployLbServicePortDetail.html" + _VersionTail();
            } else if (ct.deployType == "WEB") {
                ct.tabConfigSettingTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployWebServiceConfig.html" + _VersionTail();
                ct.tabConfigDetailTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployWebServiceConfigDetail.html" + _VersionTail();
            } else if (ct.deployType == "WAS") {
                ct.tabConfigSettingTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployWasServiceConfig.html" + _VersionTail();
                ct.tabConfigDetailTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployWasServiceConfigDetail.html" + _VersionTail();
            } else if (ct.deployType == "DB") {
                ct.tabConfigSettingTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployDbServiceConfig.html" + _VersionTail();
            }
        };

        /*탭 클릭 이벤트*/
        ct.fn.changeSltInfoTab = function (sltInfoTab) {
            if (!sltInfoTab) {
                sltInfoTab = 'configSetting';
                ct.sltInfoTab = sltInfoTab;
            } else {
                if (ct.sltInfoTab != sltInfoTab) {
                    ct.sltInfoTab = sltInfoTab;
                    if (sltInfoTab == "configSetting") {
                        ct.fn.changeSltInfoTabSettingTemplateUrl();
                    } else if (sltInfoTab == "pathSetting") {
                        if (ct.deployType == "WEB") {
                            ct.tabPathSettingTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeployWebServicePath.html" + _VersionTail();
                        }
                    } else if (sltInfoTab == "deployMonit") {
                        ct.tabDeployMonitTemplateUrl = _IAAS_VIEWS_ + "/compute/config/tabDeploySWMonit.html" + _VersionTail();
                    }
                }
            }
        };

        ct.fn.setDefaultServicePort = function (sltServiceInstance) {
            if (sltServiceInstance) {
                if (sltServiceInstance.lbServicePorts && sltServiceInstance.lbServicePorts.length > 0) {
                    sltServiceInstance.defaultLbServicePort = sltServiceInstance.lbServicePorts[0];
                }
            } else {
                if ($scope.contents.deployServer.serviceInstances && $scope.contents.deployServer.serviceInstances.length > 0) {
                    angular.forEach($scope.contents.deployServer.serviceInstances, function(serviceInstance, key1) {
                        if (serviceInstance.lbServicePorts && serviceInstance.lbServicePorts.length > 0) {
                            serviceInstance.defaultLbServicePort = serviceInstance.lbServicePorts[0];
                        }
                    });
                }
            }
        };

        /*LB 포트 도메인 연결*/
        ct.fn.addDomainLinkFormOpen = function (sltLbServicePort) {
            if (ct.deployServer.deployType)
                var dialogOptions = {
                    controller : "iaasDeployDomainLinkFormCtrl",
                    callBackFunction : ct.fn.actionSebCallBackFun,
                    deployServer : (ct.deployServer.deployType == "LB" ? angular.copy(ct.deployServer) : angular.copy(ct.lbDeployServer)),
                    servicePort : angular.copy(sltLbServicePort),
                    controllerAs : "pop",
                    formMode : "add"
                };
            ct.addLbServiceDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.fn.modLbServicePortFormOpen = function (lbDeployServer, servicePort) {
            var dialogOptions = {
                controller : "iaasDeployLbServicePortFormCtrl",
                callBackFunction : ct.fn.actionSebCallBackFun,
                deployServer : lbDeployServer,
                servicePort : angular.copy(servicePort),
                controllerAs : "portPop",
                formMode : "mod"
            };
            ct.servicePortFormDialog = common.showRightDialog($scope, dialogOptions);
        };

        ct.fn.openResourceUploadForm = function (sltServiceInstance) {
            var dialogOptions = {
                controller : "iaasDeploySocuceFilePushFormCtrl",
                callBackFunction : ct.fn.actionSebCallBackFun,
                deployServer : angular.copy(ct.deployServer),
                serviceInstance : angular.copy(sltServiceInstance),
                controllerAs : "pop",
                formMode : "mod"
            };
            ct.modFileDialog = common.showRightDialog($scope, dialogOptions);
        };

        /*LB 포트 연결*/
        ct.fn.addLbServicePortLinkFormOpen = function (sltObject) {
            var dialogOptions = {
                controller : "iaasDeployLbServicePortLinkFormCtrl",
                callBackFunction : ct.fn.actionSebCallBackFun,
                deployServer: ct.deployServer,
                controllerAs : "pop",
                formMode : "add"
            };
            if (ct.deployServer.deployType == "LB" ) {
                dialogOptions.servicePort = angular.copy(sltObject);
            } else {
                dialogOptions.serviceInstance = angular.copy(sltObject);
            }
            ct.addLbServiceDialog = common.showRightDialog($scope, dialogOptions);
        };

        /*서비스 포트 연결 해제*/
        ct.fn.delLbServerPortLink = function (lbServicePort) {
            common.showConfirm('서비스 포트 연결 해제','선택한 서비스 포트 연결을 해제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams: {
                        deployId: lbServicePort.deployId,
                        servicePortId: lbServicePort.id,
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/port/service', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        common.showAlertSuccess('서비스 포트 연결이 해제 되었습니다.');
                        ct.fn.actionSebCallBackFun();
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        /*도메인 연결 해제*/
        ct.fn.delDomainLink = function (servicePortDomainLink) {
            common.showConfirm('도메인 연결 해제','선택한 도메인 연결을 해제하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var param = {
                    urlParams : {
                        servicePortId: servicePortDomainLink.servicePortId,
                        domainId: servicePortDomainLink.domainId
                    }
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/port/domain', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if (status == 200) {
                        common.showAlertSuccess('서비스 도메인 연결이 해제 되었습니다.');
                        ct.fn.actionSebCallBackFun();
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.actionSebCallBackFun = function() {
            ct.fn.onlyDataReLoad();
        };

        ct.fn.actionCallBackFun = function(serviceInstance) {
            if (serviceInstance && serviceInstance.id)  {
                ct.sltServiceInstanceId = "" + serviceInstance.id;
                ct.sltServiceInstance = serviceInstance;
            }
            ct.fn.onlyDataReLoad();
        };

        /*초기 조회*/
        ct.fn.onlyDataReLoad = function () {
            ct.fn.getDeployServerInfo();
            ct.fn.listDeployHistory();
            ct.fn.listActionLog();
        };

        if(ct.data.deployId) {
            $scope.main.loadingMainBody = true;
            ct.fn.onlyDataReLoad();
        }

        ct.fn.changeSltInfoTabSettingTemplateUrl(ct.sltInfoTab);

    })
    .controller('iaasComputeTypeCreateCtrl', function ($scope, $location, $state, $sce, $http, $translate, $stateParams,$timeout,$filter, $mdDialog, user, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("deployServerControllers.js : iaasComputeTypeCreateCtrl start", 1);

        var pop = this;
        pop.validationService = new ValidationService({controllerAs : pop});

        pop.userTenantId = $scope.main.userTenantId;
        var scope = common.getMainContentsCtrlScope();
        if (scope && scope.contents) {
            pop.contents = scope.contents;
        }

        pop.fn = {};

        pop.deployTypes = angular.copy(CONSTANTS.deployTypes);

        pop.softwareImages = {
            "ha-proxy" : "im_logo_haproxy",
            "apache": "im_log_apache",
            "mariadb": "im_log_mariadb",
            "nginx": "im_logo_nginx",
            "tomcat": "im_thum_tomcat",
            "mysql": "im_logo_mysql",
            "mongodb": "im_logo_mongo"
        };

        pop.serviceProtocols = [
            {id: "tcp", name: "TCP", port: null},
            {id: "http", name: "HTTP", port: 80},
            {id: "https", name: "HTTPS", port: 443},
            {id: "rdp", name: "RDP", port: 3389},
            {id: "mysql", name: "MYSQL", port: 3306}
        ];

        pop.systemSwImageServiceName = "ubuntu-16-Server";

        pop.activeTab = "SLT";
        pop.deployData = {};
        pop.deployData.type = "CP";

        pop.imageList = [];
        pop.deployLbList = [];
        pop.softwares = {};
        pop.keypairList = [];
        pop.securityPolicyList = [];
        pop.publicIpList = [];
        pop.specList = [];
        pop.networks = [];
        pop.unUsingDomains = [];
        pop.sltLbDeployServer = {};

        pop.webSliderOptions = {
            floor: 1,
            ceil: 5,
            step: 1,
            minLimit: 1,
            showSelectionBar: true,
            showOuterSelectionBars: true,
            hidePointerLabels: true,
            hideLimitLabels: true,
        };

        pop.wasSliderOptions = {
            floor: 1,
            ceil: 5,
            step: 1,
            minLimit: 1,
            showSelectionBar: true,
            hidePointerLabels: true,
            hideLimitLabels: true,
        };

        pop.dbSliderOptions = {
            floor: 1,
            ceil: 5,
            step: 2,
            minLimit: 1,
            showSelectionBar: true,
            hidePointerLabels: true,
            hideLimitLabels: true,
        };

        // default 객체 정의
        angular.forEach(pop.deployTypes, function(item, key) {
            pop.deployData[item.type] = {};
            pop.deployData[item.type].instanceCount = 1;
            pop.deployData[item.type].securityPolicies = [];
            pop.deployData[item.type].spec = {};
            pop.deployData[item.type].spec.vcpus = 0;
            pop.deployData[item.type].spec.ram = 0;
            pop.deployData[item.type].spec.disk = 0;
            pop.deployData[item.type].software = "";
            pop.deployData[item.type].config = {};
            if (item.type == 'LB') {
                pop.deployData['LB'].defaultServicePortProtocol = "https";
                pop.deployData['LB'].webPortSeting = true;
                pop.deployData['LB'].wasPortSeting = true;
                pop.deployData['LB'].dbPortSeting = true;
            } else if (item.type == 'WEB') {
                pop.deployData[item.type].config.protocol = "https";
                pop.deployData[item.type].config.target_port = 80;
            } else if (item.type == 'DB') {
                pop.deployData[item.type].config.protocol = "mysql";
                pop.deployData[item.type].config.target_port = 3306;
            } else if (item.type == 'WAS') {
                pop.deployData[item.type].config.protocol = "http";
            }
        });

        //이미지 리스트 조회
        pop.fn.imageListSearch = function() {
            $scope.main.loadingMainBody = true;
            pop.imageList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/image', 'GET');
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && angular.isArray(data.content.images) && data.content.images.length) {
                    pop.imageList = data.content.images;
                    if (pop.imageList.length > 0) {
                        pop.deployData["CP"].osImageId = pop.imageList[0].id;
                        var systemSwImage = common.objectsFindCopyByField(pop.imageList, "serviceName", pop.systemSwImageServiceName);
                        if (systemSwImage && systemSwImage.id) {
                            angular.forEach(pop.deployTypes, function(item, key) {
                                if (item.type != "CP") {
                                    pop.deployData[item.type].osImageId = systemSwImage.id;
                                }
                            });
                        }
                    }
                }
                $scope.main.loadingMainBody = false;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        // Lb DeployList 리스트 조회
        pop.fn.getDeployLbList = function() {
            pop.deployLbList = [];
            var params = {
                tenantId : pop.userTenantId,
                deployType : "LB"
            };
            pop.deployLbList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/type', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    pop.deployLbList = data.content;
                    if (!pop.deployData.lbDeployId) {
                        pop.deployData.lbDeployId = pop.deployLbList[0].deployId;
                        pop.fn.changeDeployType(pop.deployData.type);
                    }
                    angular.forEach(pop.deployLbList, function (item, key) {
                        item.unusingServicePorts = [];
                        if (item.servicePorts && angular.isArray(item.servicePorts) && item.servicePorts.length > 0) {
                            angular.forEach(item.servicePorts, function (svcPort, key) {
                                if (!svcPort.serviceInstanceId) {
                                    item.unusingServicePorts.push(svcPort);
                                }
                            });
                        }
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        //소프트웨어 리스트 조회
        pop.fn.getSoftwareList = function() {
            pop.softwares = { LB: [], WEB: [], WAS: [], DB: [] };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/software', 'GET');
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    angular.forEach(data.content, function(item, key) {
                        if (pop.softwares[item.type.toUpperCase()]) {
                            pop.softwares[item.type.toUpperCase()].push(item);
                        }
                    });
                    angular.forEach(pop.softwares, function(item, key) {
                        pop.deployData[item[0].type].software = item[0].software;
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        //보안정책 조회
        pop.fn.getSecurityPolicyList = function() {
            var param = { tenantId: pop.userTenantId };
            pop.securityPolicyList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    angular.forEach(data.content, function(item, key) {
                        if (item.name != "default") {
                            pop.securityPolicyList.push(item);
                        }
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        //키페어 조회
        pop.fn.getKeypairList = function() {
            var params = { tenantId: pop.userTenantId };
            pop.keypairList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/keypair', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content)) {
                    pop.keypairList = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        //다음
        pop.fn.nextStep = function() {
            if (!pop.validationService.checkFormValidity(pop['POP_' + pop.activeTab + '_FORM'])) {
                return;
            } else {
                if (pop.activeTab == 'SLT') {
                    if (pop.deployData.type == 'WEB' || pop.deployData.type == 'WAS' || pop.deployData.type == 'DB') {
                        if (!pop.deployData[pop.deployData.type].name && pop.sltLbDeployServer && pop.sltLbDeployServer.deployName) {
                            var defPreName = pop.sltLbDeployServer.deployName + "-" + pop.deployData.type.toLowerCase();
                            var defTailName = "";
                            var nameIndex = 0;
                            while (pop.deployUsingNames.indexOf(defPreName + defTailName) > -1) {
                                nameIndex++;
                                defTailName = (nameIndex < 10) ? '0'+nameIndex : ''+nameIndex;
                            }
                            pop.deployData[pop.deployData.type].name = defPreName + defTailName;
                        }
                        if (!pop.deployData[pop.deployData.type].name && pop.sltLbDeployServer && pop.sltLbDeployServer.deployName) {

                        }
                    }
                    pop.activeTab = pop.deployData.type;
                } else if (pop.activeTab == 'CP' || pop.activeTab == 'LB' || pop.activeTab == 'WEB' || pop.activeTab == 'WAS' || pop.activeTab == 'DB') {
                    if (pop.activeTab == 'DB') {
                        if (pop['POP_' + pop.activeTab + '_FORM'].dbUserMasterPass.$viewValue != pop['POP_' + pop.activeTab + '_FORM'].dbUserMasterPassConfirm.$viewValue) {
                            $('.aside #db_user_password_confirm').focus();
                            return;
                        }
                    }
                    pop.activeTab = 'RES';
                }
            }
        };

        //이전
        pop.fn.preStep = function () {
            if (pop.activeTab == 'CP' || pop.activeTab == 'LB' || pop.activeTab == 'WEB' || pop.activeTab == 'WAS' || pop.activeTab == 'DB') {
                pop.activeTab = 'SLT';
            } else if (pop.activeTab == 'RES') {
                pop.activeTab = pop.deployData.type;
            }
        };

        pop.fn.changeDeployType = function (type) {
            pop.fn.selectedLbDeploy(type, pop.deployData.lbDeployId);
        };

        pop.fn.selectedLbDeploy = function (type, sltLbDeployId) {
            pop.sltLbDeployServer = {};
            pop.deployData[type].config.sltLbServicePort = {};
            pop.deployData[type].config.lbServicePortId = "";
            pop.unusingServicePorts = [];
            pop.deployData[type].config.sltLbServicePort = {};
            pop.protocolUnusingDomains = [];
            if (type == 'WEB' || type == 'WAS' || type == 'DB') {
                var sltLbDeployServer = {};
                if (sltLbDeployId) {
                    sltLbDeployServer = common.objectsFindCopyByField(pop.deployLbList, "deployId", sltLbDeployId);
                }
                if (sltLbDeployServer && sltLbDeployServer.deployId) {
                    if (sltLbDeployServer.unusingServicePorts && sltLbDeployServer.unusingServicePorts.length > 0) {
                        var protocolType = "http";
                        if (type == 'DB') {
                            protocolType = "mysql";
                        }
                        angular.forEach(sltLbDeployServer.unusingServicePorts, function (item, key) {
                            if (item.protocolType == protocolType) {
                                pop.unusingServicePorts.push(angular.copy(item));
                            }
                        });
/* default setting
                        if (pop.unusingServicePorts && pop.unusingServicePorts.length > 0) {
                            pop.deployData[type].config.lbServicePortId = '' + pop.unusingServicePorts[0].id;
                        }
*/
                    }
                    pop.sltLbDeployServer = sltLbDeployServer;
                }
                pop.fn.changeServicePort(type, pop.deployData[type].config.lbServicePortId);
            }
        };

        pop.fn.changeServicePort = function (type, lbServicePortId) {
            pop.deployData[type].config.sltLbServicePort = {};
            pop.protocolUnusingDomains = [];
            var sltLbServicePort = {};
            if (lbServicePortId) {
                sltLbServicePort = common.objectsFindCopyByField(pop.unusingServicePorts, "id", lbServicePortId);
            }
            if (sltLbServicePort && sltLbServicePort.id) {
                var unusingProtocol = "unusing";
                if (sltLbServicePort.protocolType == "mysql") {
                    unusingProtocol += "Mysql";
                } else if (sltLbServicePort.protocolType == "rdp") {
                    unusingProtocol += "Rdp";
                } else {
                    unusingProtocol += "Http";
                }
                angular.forEach(pop.unusingDomains, function (item, key) {
                    if (item[unusingProtocol]) {
                        pop.protocolUnusingDomains.push(angular.copy(item));
                    }
                });
                if (pop.protocolUnusingDomains.length > 0) {
                    var sltDomain = common.objectsFindCopyByField(pop.protocolUnusingDomains, "id", pop.deployData[type].config.domainId);
                    if (!sltDomain || !sltDomain.id) {
                        pop.deployData[type].config.domainId = '';
                        //pop.deployData[type].config.domainId = ''+pop.protocolUnusingDomains[0].id;
                    }
                } else {
                    pop.deployData[type].config.domainId = "";
                }
                pop.deployData[type].config.sltLbServicePort = sltLbServicePort;
            } else {
                pop.deployData[type].config.sltLbServicePort = {};
                pop.deployData[type].config.lbServicePortId = '';
                pop.deployData[type].config.domainId = "";
            }
        };

        pop.fn.createKeypair = function () {
            pop.nowMenu = "compute";
            pop.formType = "write";
            $scope.main.layerTemplateUrl2 = _IAAS_VIEWS_ + "/keypair/keypairForm.html" + _VersionTail();
            $("#aside-aside2").stop().animate({"right":"0"}, 500);
        };

        pop.fn.appendKeypair = function (keypair) {
            pop.keypairList.push(keypair);
            pop.deployData[pop.activeTab].keypairName = keypair.keypairName;
        };

        pop.fn.getKeyFile = function(keypair, type) {
            document.location.href = CONSTANTS.iaasApiContextUrl + '/server/keypair/'+type+"?tenantId="+pop.userTenantId+"&name="+keypair.name;
        };

        // 네트워크 셀렉트박스 조회
        pop.fn.networkListSearch = function() {
            var params = {
                tenantId : pop.userTenantId,
                isExternal : false
            };
            pop.networks = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    pop.networks = data.content;
                    angular.forEach(pop.deployTypes, function(item, key) {
                        pop.deployData[item.type].networkId = pop.networks[0].id;
                    });
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        pop.fn.getPublicIpList = function() {
            var params = {
                tenantId : pop.userTenantId,
                queryType : "list"
            };
            pop.loadPublicIp = false;
            pop.publicIpList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content)) {
                    pop.publicIpList = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                pop.loadPublicIp = true;
            });
        };

        pop.fn.publicIpAllotment = function(type) {
            common.showConfirm('공인IP 할당', '공인IP를 추가 할당 하시겠습니까?').then(function(){
                var params = {
                    urlParams: {
                        tenantId : pop.userTenantId,
                        action : "allocate"
                    }
                };
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/floatingIps', 'POST', params);
                returnPromise.success(function (data, status, headers) {
                    if (data && angular.isObject(data.content)) {
                        pop.publicIpList.push(data.content);
                        pop.deployData[type].floatingIp = data.content.floatingIp;
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("메세지", data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };

        pop.fn.getUnusingDomainList = function() {
            var params = {
                tenantId : pop.userTenantId
            };
            pop.unusingDomains = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/tenant/unusing', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isObject(data.content) && data.content.length > 0) {
                    pop.unusingDomains = data.content;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        pop.fn.addDomainFormOpen = function ($event) {
            var dialogOptions = {
                controller : "iaasDomainFormCtrl",
                callBackFunction : pop.fn.actionCallBackFun,
                tenantId : pop.userTenantId,
                controllerAs : "domainPop",
                formMode : "add"
            };
            pop.addDomainDialog = common.showRightDialog($scope, dialogOptions);
        };

        pop.fn.setAddUnusingDomain = function (domain) {
            domain.unusingHttp = true;
            domain.unusingMysql = true;
            domain.unusingRdp = true;
            pop.unusingDomains.push(domain);
            pop.deployData[pop.deployData.type].config.domainId = domain.id;
        };

        //스펙그룹의 스펙 리스트 조회
        pop.fn.getSpecList = function() {
            pop.specList = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/spec', 'GET');
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && angular.isArray(data.content.specs)) {
                    pop.specList = data.content.specs;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        pop.fn.selectSpec = function(type) {
            pop.deployData[type].spec = {};
            if (pop.deployData[type].specName) {
                pop.deployData[type].spec = common.objectsFindCopyByField(pop.specList, "name", pop.deployData[type].specName);
            }
            if(!pop.deployData[type].spec.name){
                pop.deployData[type].spec.vcpus = 0;
                pop.deployData[type].spec.ram = 0;
                pop.deployData[type].spec.disk = 0;
            }
        };

        pop.fn.deployNameCustomValidationCheck = function(name) {
            if (pop.deployUsingNames.indexOf(name) > -1) {
                return {isValid : false, message: "이미 사용중인 이름 입니다."};
            } else {
                return {isValid : true};
            }
        };

        pop.fn.customUserMasterPassConfirmCheck = function (password, passwordConfirm) {
            if (password !=  passwordConfirm) {
                return {isValid : false, message: "패스워드 확인 값이 일치하지 않습니다."};
            } else {
                return {isValid : true};
            }
        };

        pop.fn.onUserMasterPassBlur = function () {
            $('.aside #db_user_password_confirm').focus();
        };

        pop.fn.createTypeServerSuccessCallBack = function (evt, data) {
            $scope.main.thisAsideClose(evt);
            $timeout(function () {
                common.showAlertSuccess("생성 되었습니다.");
                var scope = common.getMainContentsCtrlScope();
                if (scope.contents.fn && angular.isFunction(scope.contents.fn.getDeployServerList)) {
                    pop.contents.fn.getDeployServerList();
                }
                $scope.main.loadingMainBody = false;
            }, 2000);
        };

        // Compute 서버 생성
        pop.fn.createCPServer = function(evt, instance) {
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'POST', {instance : instance});
            returnPromise.success(function (data, status, headers) {
                pop.fn.createTypeServerSuccessCallBack(evt, data);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
                pop.sendClickCheck = false;
            });
        };

        // Compute 서버 생성
        pop.fn.createSystemServer = function(evt, systemSwObject) {
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'POST', systemSwObject);
            returnPromise.success(function (data, status, headers) {
                pop.fn.createTypeServerSuccessCallBack(evt, data);
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function() {
                pop.sendClickCheck = false;
            });
        };

        pop.getInstanceObj = function (type) {
            var instance = {};
            instance.vmType = type;
            instance.name = pop.deployData[type].name;
            instance.tenantId = pop.userTenantId;
            instance.networks = [{id: pop.deployData[type].networkId}];
            instance.image = pop.deployData[type].image;
            instance.keypair = {keypairName: pop.deployData[type].keypairName};
            if (type == "CP") {
                if (pop.deployData[type].floatingIp) {
                    instance.floatingIp = pop.deployData[type].floatingIp;
                }
            }
            if (pop.deployData[type].securityPolicies && pop.deployData[type].securityPolicies.length > 0) {
                instance.securityPolicies = [];
                angular.forEach(pop.deployData[type].securityPolicies, function (item, key) {
                    instance.securityPolicies.push(item);
                });
            }
            instance.spec = pop.deployData[type].spec;
            return instance;
        };

        pop.fn.addLbServicePortFormOpen = function () {
            var dialogOptions = {
                controller : "iaasDeployLbServicePortFormCtrl",
                callBackFunction : pop.fn.addLbServicePortCallBackFun,
                deployServer : angular.copy(pop.sltLbDeployServer),
                controllerAs : "portPop",
                serviceType: "LB",
                formMode : "add"
            };
            pop.addServicePortDialog = common.showRightChildDialog($scope, dialogOptions);
        };

        pop.fn.addLbServicePortCallBackFun = function(servicePort) {
            if (!angular.isArray(pop.unusingServicePorts)) {
                pop.unusingServicePorts = [];
            }
            pop.unusingServicePorts.push(servicePort);
            pop.deployData[pop.deployData.type].config.lbServicePortId = '' + servicePort.id;
            pop.fn.changeServicePort(pop.deployData.type, servicePort.id);
        };

        pop.fn.addDomainFormOpen = function () {
            var dialogOptions = {
                controller : "iaasDomainFormCtrl",
                callBackFunction : pop.fn.addDomainCallBackFun,
                tenantId : pop.userTenantId,
                controllerAs : "domainPop",
                formMode : "add"
            };
            pop.addDomainDialog = common.showRightChildDialog($scope, dialogOptions);
        };

        pop.fn.addDomainCallBackFun = function(domain) {
            domain.unusingHttp = true;
            domain.unusingHttp = true;
            domain.unusingHttp = true;
            if (!angular.isArray(pop.unusingDomains)) {
                pop.unusingDomains = [];
            }
            pop.unusingDomains.push(domain);
            if (!angular.isArray(pop.protocolUnusingDomains)) {
                pop.protocolUnusingDomains = [];
            }
            pop.protocolUnusingDomains.push(domain);
            pop.deployData[pop.deployData.type].config.domainId = '' + domain.id;
        };

        pop.getSystemSwInfo = function (type) {
            var systemSwObject = {};
            systemSwObject.tenantId = pop.userTenantId;
            systemSwObject.deployName = pop.deployData[type].name;
            systemSwObject.type = type;
            if (type == "WEB" || type == "WAS" || type == "DB") {
                systemSwObject.lbDeployId = pop.deployData.lbDeployId;
            }
            systemSwObject.software = pop.deployData[type].software;
            systemSwObject.instanceCount = pop.deployData[type].instanceCount;
            if (type == "LB") {
                if (pop.deployData['LB'].webPortSeting || pop.deployData['LB'].wasPortSeting || pop.deployData['LB'].dbPortSeting) {
                    systemSwObject.servicePorts = [];
                    if (pop.deployData['LB'].webPortSeting) {
                        var webServicePort = {};
                        webServicePort.tenantId = pop.userTenantId;
                        webServicePort.servicePortName = systemSwObject.deployName + "-service-port-80";
                        webServicePort.name = "service-port-80";
                        if (pop.deployData[type].defaultServicePortProtocol == "https") {
                            webServicePort.protocolType = "http";
                            webServicePort.sslUsed = true;
                            webServicePort.httpsOnly = false;
                            webServicePort.sslSourcePort = 443;
                        } else {
                            webServicePort.protocolType = "http";
                            webServicePort.sslUsed = false;
                            webServicePort.httpsOnly = false;
                        }
                        webServicePort.sourcePort = 80;
                        webServicePort.sslCertType = "user_input";
                        webServicePort.balance = "source";
                        webServicePort.checkInter = 3;
                        webServicePort.monitorUrl = "/";
                        systemSwObject.servicePorts.push(webServicePort);
                    }

                    if (pop.deployData['LB'].wasPortSeting) {
                        var wasServicePort = {};
                        wasServicePort.tenantId = pop.userTenantId;
                        wasServicePort.servicePortName = systemSwObject.deployName + "-service-port-8080";
                        wasServicePort.name = "service-port-8080";
                        wasServicePort.protocolType = "http";
                        wasServicePort.sourcePort = 8080;
                        wasServicePort.sslUsed = false;
                        wasServicePort.httpsOnly = false;
                        wasServicePort.sslCertType = "user_input";
                        wasServicePort.balance = "source";
                        wasServicePort.checkInter = 3;
                        wasServicePort.monitorUrl = "/";
                        systemSwObject.servicePorts.push(wasServicePort);
                    }

                    if (pop.deployData['LB'].dbPortSeting) {
                        var dbServicePort = {};
                        dbServicePort.tenantId = pop.userTenantId;
                        dbServicePort.servicePortName = systemSwObject.deployName + "-service-port-3306";
                        dbServicePort.name = "service-port-3306";
                        dbServicePort.protocolType = "mysql";
                        dbServicePort.sourcePort = 3306;
                        dbServicePort.sslUsed = false;
                        dbServicePort.httpsOnly = false;
                        dbServicePort.sslCertType = "user_input";
                        dbServicePort.balance = "source";
                        dbServicePort.checkInter = 3;
                        dbServicePort.monitorUrl = "/";
                        systemSwObject.servicePorts.push(dbServicePort);
                    }
                }

            } else if (type == "WEB") {
                var serviceInstance = {};
                serviceInstance.tenantId = pop.userTenantId;
                serviceInstance.serviceInstanceName = systemSwObject.deployName + "-service";
                serviceInstance.name = pop.deployData[type].name + "-service";
                serviceInstance.serviceType = "WEB";
                serviceInstance.servicePort = 80;

                serviceInstance.webConfig = {};
                serviceInstance.webConfig.tenantId = pop.userTenantId;
                serviceInstance.webConfig.serverName = "_";
                serviceInstance.webConfig.clientMaxBodySize = 100;
                serviceInstance.webConfig.indexPage = "index.html index.htm";
                serviceInstance.webConfig.notFoundErrorPage = "/404.html";
                serviceInstance.webConfig.serverErrorPage = "/50x.html";

                if (pop.deployData['WEB'].config.lbServicePortId) {
                    var sltLbServicePort = pop.deployData['WEB'].config.sltLbServicePort;
                    var lbServicePort = {};
                    lbServicePort.id = pop.deployData['WEB'].config.lbServicePortId;
                    lbServicePort.tenantId = pop.userTenantId;
                    lbServicePort.deployId = sltLbServicePort.deployId;
                    lbServicePort.servicePortName = sltLbServicePort.servicePortName;
                    lbServicePort.name = sltLbServicePort.name;
                    lbServicePort.protocolType = sltLbServicePort.protocolType;
                    lbServicePort.sourcePort = sltLbServicePort.sourcePort;
                    if (sltLbServicePort.protocolType == "http" && sltLbServicePort.sslUsed) {
                        lbServicePort.sslUsed = sltLbServicePort.sslUsed;
                        lbServicePort.sslSourcePort = sltLbServicePort.sslSourcePort;
                        if (sltLbServicePort.httpsOnly) {
                            lbServicePort.httpsOnly = sltLbServicePort.httpsOnly;
                        }
                    }

                    if (pop.deployData['WEB'].config.domainId) {
                        var servicePortDomainLink = {};
                        servicePortDomainLink.tenantId = pop.userTenantId;
                        servicePortDomainLink.deployId = sltLbServicePort.deployId;
                        servicePortDomainLink.protocolType = sltLbServicePort.protocolType;
                        servicePortDomainLink.servicePortId = sltLbServicePort.servicePortId;
                        servicePortDomainLink.domainId = pop.deployData['WEB'].config.domainId;

                        lbServicePort.servicePortDomainLinks = [];
                        lbServicePort.servicePortDomainLinks.push(servicePortDomainLink);
                    }

                    serviceInstance.lbServicePorts = [];
                    serviceInstance.lbServicePorts.push(lbServicePort);
                }

                var resource = {};
                resource.tenantId = pop.userTenantId;
                resource.locationType = "res";
                resource.name = "default";
                resource.location = "/";
                resource.targetType = "url";
                resource.url = "http://101.55.126.196:7480/cx-upload/paasxpert.zip";
                serviceInstance.resources = [];
                serviceInstance.resources.push(resource);

                systemSwObject.serviceInstances = [];
                systemSwObject.serviceInstances.push(serviceInstance);

            } else if (type == "WAS") {
                var serviceInstance = {};
                serviceInstance.tenantId = pop.userTenantId;
                serviceInstance.serviceInstanceName = systemSwObject.deployName + "-service";
                serviceInstance.name = pop.deployData[type].name + "-service";
                serviceInstance.serviceType = "WAS";
                serviceInstance.servicePort = 8080;

                serviceInstance.wasConfig = {};
                serviceInstance.wasConfig.tenantId = pop.userTenantId;
                serviceInstance.wasConfig.javaPackage = "openjdk-8-jdk";
                serviceInstance.wasConfig.tomcatVersion = "7";
                serviceInstance.wasConfig.tomcatMemoryMs = 512;
                serviceInstance.wasConfig.tomcatMemoryMx = 1024;

                if (pop.deployData['WAS'].config.lbServicePortId) {
                    var sltLbServicePort = pop.deployData['WAS'].config.sltLbServicePort;
                    var lbServicePort = {};
                    lbServicePort.id = pop.deployData['WAS'].config.lbServicePortId;
                    lbServicePort.tenantId = pop.userTenantId;
                    lbServicePort.deployId = sltLbServicePort.deployId;
                    lbServicePort.servicePortName = sltLbServicePort.servicePortName;
                    lbServicePort.name = sltLbServicePort.name;
                    lbServicePort.protocolType = sltLbServicePort.protocolType;
                    lbServicePort.sourcePort = sltLbServicePort.sourcePort;
                    if (sltLbServicePort.protocolType == "http" && sltLbServicePort.sslUsed) {
                        lbServicePort.sslUsed = sltLbServicePort.sslUsed;
                        lbServicePort.sslSourcePort = sltLbServicePort.sslSourcePort;
                        if (sltLbServicePort.httpsOnly) {
                            lbServicePort.httpsOnly = sltLbServicePort.httpsOnly;
                        }
                    }

                    if (pop.deployData['WAS'].config.domainId) {
                        var servicePortDomainLink = {};
                        servicePortDomainLink.tenantId = pop.userTenantId;
                        servicePortDomainLink.deployId = lbServicePort.deployId;
                        servicePortDomainLink.protocolType = lbServicePort.protocolType;
                        servicePortDomainLink.servicePortId = lbServicePort.id;
                        servicePortDomainLink.domainId = pop.deployData['WAS'].config.domainId;

                        lbServicePort.servicePortDomainLinks = [];
                        lbServicePort.servicePortDomainLinks.push(servicePortDomainLink);
                    }

                    serviceInstance.lbServicePorts = [];
                    serviceInstance.lbServicePorts.push(lbServicePort);
                }

                var resource = {};
                resource.tenantId = pop.userTenantId;
                resource.locationType = "res";
                resource.name = "ROOT";
                resource.location = "/";
                resource.targetType = "url";
                resource.url = "http://101.55.126.196:7480/iaas-deploy-admin-bucket/examples.war";
                serviceInstance.resources = [];
                serviceInstance.resources.push(resource);

                systemSwObject.serviceInstances = [];
                systemSwObject.serviceInstances.push(serviceInstance);

            } else if (type == "DB") {
                var serviceInstance = {};
                serviceInstance.tenantId = pop.userTenantId;
                serviceInstance.serviceInstanceName = systemSwObject.deployName + "-service";
                serviceInstance.name = pop.deployData[type].name + "-service";
                serviceInstance.serviceType = "DB";
                serviceInstance.servicePort = 3306;

                serviceInstance.dbConfig = {};
                serviceInstance.dbConfig.tenantId = pop.userTenantId;
                serviceInstance.dbConfig.masterDb = pop.deployData['DB'].config.masterDb;
                serviceInstance.dbConfig.masterUserId = pop.deployData['DB'].config.masterUserId;
                serviceInstance.dbConfig.masterUserPass = pop.deployData['DB'].config.masterUserPass;
                serviceInstance.dbConfig.maxAllowedPacket = 128;
                serviceInstance.dbConfig.maxBinlogSize = 128;
                serviceInstance.dbConfig.maxConnections = 128;

                if (pop.deployData['DB'].config.lbServicePortId) {
                    var sltLbServicePort = pop.deployData['DB'].config.sltLbServicePort;
                    var lbServicePort = {};
                    lbServicePort.id = pop.deployData['DB'].config.lbServicePortId;
                    lbServicePort.tenantId = pop.userTenantId;
                    lbServicePort.deployId = sltLbServicePort.deployId;
                    lbServicePort.servicePortName = sltLbServicePort.servicePortName;
                    lbServicePort.name = sltLbServicePort.name;
                    lbServicePort.protocolType = sltLbServicePort.protocolType;
                    lbServicePort.sourcePort = sltLbServicePort.sourcePort;

                    if (pop.deployData['DB'].config.domainId) {
                        var servicePortDomainLink = {};
                        servicePortDomainLink.tenantId = pop.userTenantId;
                        servicePortDomainLink.deployId = lbServicePort.deployId;
                        servicePortDomainLink.protocolType = lbServicePort.protocolType;
                        servicePortDomainLink.servicePortId = lbServicePort.id;
                        servicePortDomainLink.domainId = pop.deployData['DB'].config.domainId;

                        lbServicePort.servicePortDomainLinks = [];
                        lbServicePort.servicePortDomainLinks.push(servicePortDomainLink);
                    }

                    serviceInstance.lbServicePorts = [];
                    serviceInstance.lbServicePorts.push(lbServicePort);
                }

                systemSwObject.serviceInstances = [];
                systemSwObject.serviceInstances.push(serviceInstance);
            }
            systemSwObject.instance = pop.getInstanceObj(type);
            return systemSwObject;
        };

        pop.sendClickCheck = false;
        pop.fn.createTypeServer = function(evt) {
            if(!pop.sendClickCheck){
                pop.sendClickCheck = true;
                if (!pop.validationService.checkFormValidity(pop['POP_' + pop.activeTab + '_FORM'])) {
                    pop.sendClickCheck = false;
                    return;
                }
                pop.deployData[pop.deployData.type].image = common.objectsFindCopyByField(pop.imageList, "id", pop.deployData[pop.deployData.type].pop.osImageId);
                if (pop.deployData.type == "CP") {
                    var instance = pop.getInstanceObj("CP");
                    pop.fn.createCPServer(evt, instance);
                } else {
                    var systemSwObject = pop.getSystemSwInfo(pop.deployData.type);
                    pop.fn.createSystemServer(evt, systemSwObject);
                }
            }
        };

        if(pop.userTenantId) {
            pop.fn.imageListSearch();
            pop.fn.getDeployLbList();
            pop.fn.getSoftwareList();
            pop.fn.getKeypairList();
            pop.fn.getSecurityPolicyList();
            pop.fn.getPublicIpList();
            pop.fn.getUnusingDomainList();
            pop.fn.getSpecList();
            pop.fn.networkListSearch();
            pop.deployUsingNames = [];
            if (angular.isArray(pop.contents.deployServerList) && pop.contents.deployServerList.length > 0) {
                angular.forEach(pop.contents.deployServerList, function (deployServer, key) {
                    if (deployServer.viewType == "deploy") {
                        pop.deployUsingNames.push(deployServer.deployName);
                        if (angular.isArray(deployServer.instances) && deployServer.instances.length > 0) {
                            angular.forEach(deployServer.instances, function (instance, k) {
                                pop.deployUsingNames.push(instance.name);
                            });
                        }
                    } else {
                        pop.deployUsingNames.push(deployServer.name);
                    }
                });
            }
        }
    })
    .controller('iaasDeployInstanceCountFormOpenCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, $timeout, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployInstanceCountFormOpenCtrl", 1);
        var pop = this;

        pop.fn = {};

        pop.deployServer = $scope.dialogOptions.deployServer;

        pop.instanceCountSliderOptions = {
            floor: 1,
            ceil: 5,
            step: 1,
            minLimit: 1,
            showSelectionBar: true,
            showOuterSelectionBars: true,
            hidePointerLabels: true,
            hideLimitLabels: true,
        };

        pop.orgInstanceCount = pop.deployServer.instanceCount;
        pop.instanceCount = pop.orgInstanceCount;

        pop.formMode = "mod";
        pop.callbackfn = $scope.dialogOptions.callBackFunction;
        pop.selector = $scope.dialogOptions.selector;

        $scope.dialogOptions.title = "인스턴스 증감";
        $scope.dialogOptions.okName =  "적용 하기";

        pop.formName = "deployInstanceCountForm";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/deployInstanceCountForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.setDeployInstanceCount();
        };

        pop.fn.setDeployInstanceCount = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (pop.instanceCount == pop.orgInstanceCount) {
                common.showAlertWarning('변경된 사항이 없습니다.');
                $scope.actionBtnHied = false;
                return;
            }

            var param = {
                urlParams : {
                    deployId : pop.deployServer.deployId,
                    instanceCount: pop.instanceCount
                }
            };
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/instance/scale', 'PUT', param);
            returnPromise.success(function (data, status, headers) {
                if (status == 200) {
                    $timeout(function () {
                        common.showAlertSuccess('적용 되었습니다.');
                        $scope.main.loadingMainBody = false;
                        if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                            $scope.dialogOptions.callBackFunction(data.content);
                        }
                        $scope.main.asideClose(pop.selector);
                    }, 1000);
                } else {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

    })
;
