'use strict';

angular.module('gpu.controllers')
    .controller('hadoopDeployCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("hadoop deployControllers.js : hadoopDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.masterSpecList = [];
        ct.workerSpecList = [];
        ct.types = [
            {key: "core", value: "Core Hadoop : HDFS(2.7.3), YARN(2.7.3), HIVE(1.2.1)"},
            {key: "hbase", value: "HBase : HDFS(2.7.3), YARN(2.7.3), HIVE(1.2.1), HBase(1.1.2)"},
            {key: "spark", value: "Spark : HDFS(2.7.3), YARN(2.7.3), HIVE(1.2.1), spark(1.6.3)"}
        ];
        ct.masterCnts = [{key: 1, value: "단일 구성(1)"}, {key: 2, value: "이중화 구성(2)"}];
        ct.workerCnts = [{key: 1, value: "1개"}, {key: 2, value: "2개"},{key: 3, value: "3개"}, {key: 4, value: "4개"},{key: 5, value: "5개"}, {key: 6, value: "6개"},{key: 7, value: "7개"}, {key: 8, value: "8개"},{key: 9, value: "9개"}, {key: 10, value: "10개"},
                         {key: 11, value: "11개"}, {key: 12, value: "12개"},{key: 13, value: "13개"}, {key: 14, value: "14개"},{key: 15, value: "15개"}, {key: 16, value: "16개"},{key: 17, value: "17개"}, {key: 18, value: "18개"},{key: 19, value: "19개"}, {key: 20, value: "20개"},];
        ct.data.bucketType = "defined";
        //ct.data.deployType = "sMaster";
        //ct.data.nodeType = "single";
        //ct.data.masterCnt = 1;
        //ct.data.workerCnt = 2;
        ct.data.type = "core";

        // 테스트
        ct.testInput = true;
        if (ct.testInput) {
            ct.data.deployName = "하둡";
            ct.data.stackName = "hadoop";
            ct.data.mysqlRootPassword = "Crossent!234";
            ct.data.mysqlRootConfirmPassword = "Crossent!234";
            ct.data.mysqlHivePassword = "Hive!234";
            ct.data.mysqlHiveConfirmPassword = "Hive!234";
            //ct.data.endPoint = ct.endPoint;
            //ct.data.accessKey = ct.accessKey;
            //ct.data.secretKey = ct.secretKey;
            //ct.data.bucketName = "bucketName";
        }


        //스펙그룹의 스펙 리스트 조회
        ct.fn.getSpecList = function(specListDefer) {
            var returnPromise = vmCatalogService.listAllSpec();
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.specs && data.content.specs.length > 0) {
                    var masterSpecList = [];
                    var workerSpecList = [];
                    angular.forEach(data.content.specs, function(val, key) {
                        if (val.name[0] == 'm' &&  val.type == "general") {
                            masterSpecList.push(val);
                            workerSpecList.push(val);
                        }
/*
                        if (val.name[0] == 'p' &&  val.type == "GPU") {
                            masterSpecList.push(val);
                            workerSpecList.push(val);
                        }
*/
                    });
                    ct.masterSpecList = masterSpecList;
                    ct.workerSpecList = workerSpecList;
                }
                ct.isMasterSpecLoad = true;
                ct.isWorkerSpecLoad = true;
                ct.fn.setMasterSpecMinDisabled();
                ct.fn.setWorkerSpecMinDisabled();
                ct.fn.chackSpecMaxOver();
                if (specListDefer) specListDefer.resolve(data);
            });
            returnPromise.error(function (data, status, headers) {
                ct.isSpecLoad = true;
                if (specListDefer) specListDefer.reject(data);
            });
        };

        ct.isMasterMinSpecDisabled = false;
        // spec loading 체크
        ct.masterSpecMinDisabledSetting = false;
        ct.fn.setMasterSpecMinDisabled = function () {
            ct.isMasterMinSpecDisabled = false;
            if (ct.isMasterSpecLoad) {
                angular.forEach(ct.masterSpecList, function (spec) {
                    if (spec.disk < 4 || spec.ram < 512) {
                        spec.disabled = true;
                        ct.isMasterMinSpecDisabled = true;
                    }
                });
                ct.masterSpecMinDisabledSetting = true;
                if (ct.sltMasterSpec && ct.sltMasterSpec.uuid) {
                    if (ct.sltMasterSpec.disk < 4 || ct.sltMasterSpec.ram < 512) {
                        ct.fn.defaultSelectMasterSpec();
                    }
                } else {
                    ct.fn.defaultSelectMasterSpec();
                }
            }
        };

        ct.isMaxSpecOver = false;
        ct.fn.chackSpecMaxOver = function () {
            if (ct.isMasterSpecLoad && ct.isWorkerSpecLoad && ct.tenantResource && ct.tenantResource.maxResource && ct.tenantResource.usedResource) {
                if ((ct.sltMasterSpec.vcpus * ct.data.masterCnt + ct.sltWorkerSpec.vcpus * ct.data.workerCnt) > ct.tenantResource.available.cores
                    || (ct.sltMasterSpec.ram * ct.data.masterCnt + ct.sltWorkerSpec.ram * ct.data.workerCnt) > ct.tenantResource.available.ramSize
                    || (ct.sltMasterSpec.disk * ct.data.masterCnt + ct.sltWorkerSpec.disk * ct.data.workerCnt) > ct.tenantResource.available.instanceDiskGigabytes) {
                    ct.isMaxSpecOver = true;
                }
            }
        };

        // spec loading 체크
        ct.masterSpecDisabledAllSetting = false;
        ct.fn.defaultSelectMasterSpec = function() {
            if (ct.masterSpecMinDisabledSetting) {
                ct.masterSpecDisabledAllSetting = true;
                var sltSpec = null;
                for (var i=0; i<ct.masterSpecList.length; i++) {
                    if (!ct.masterSpecList[i].disabled) {
                        sltSpec = ct.masterSpecList[i];
                        break;
                    }
                }
                if (sltSpec) {
                    ct.fn.selectMasterSpec(sltSpec);
                }
            }
        };

        ct.fn.selectMasterSpec = function(sltSpec) {
            if (!ct.masterSpecDisabledAllSetting || sltSpec.disabled) return;
            if (sltSpec && sltSpec.uuid) {
                ct.sltMasterSpec = angular.copy(sltSpec);
                ct.data.masterFlavor = ct.sltMasterSpec.name;
                ct.sltMasterSpecUuid = ct.sltMasterSpec.uuid;
                ct.fn.setWorkerSpecMinDisabled();
            } else {
                ct.sltMasterSpec = {};
                ct.data.masterFlavor = "";
                ct.sltMasterSpecUuid = "";
            }
        };

        ct.fn.changeMasterCnt = function() {
            if (!ct.masterSpecDisabledAllSetting) return;
            ct.fn.chackSpecMaxOver();
        };

        ct.isWorkerMinSpecDisabled = false;
        // spec loading 체크
        ct.workerSpecMinDisabledSetting = false;
        ct.fn.setWorkerSpecMinDisabled = function () {
            ct.isWorkerMinSpecDisabled = false;
            if (ct.isWorkerSpecLoad) {
                angular.forEach(ct.workerSpecList, function (spec) {
                    if (spec.disk < 4 || spec.ram < 512) {
                        spec.disabled = true;
                        ct.isWorkerMinSpecDisabled = true;
                    }
                });
                ct.workerSpecMinDisabledSetting = true;
                if (ct.sltWorkerSpec && ct.sltWorkerSpec.uuid) {
                    if (ct.sltWorkerSpec.disk < 4 || ct.sltWorkerSpec.ram < 512) {
                        ct.fn.defaultSelectWorkerSpec();
                    }
                } else {
                    ct.fn.defaultSelectWorkerSpec();
                }
            }
        };

        // spec loading 체크
        ct.workerSpecDisabledAllSetting = false;
        ct.fn.defaultSelectWorkerSpec = function() {
            if (ct.workerSpecMinDisabledSetting) {
                ct.workerSpecDisabledAllSetting = true;
                var sltSpec = null;
                for (var i=0; i<ct.workerSpecList.length; i++) {
                    if (!ct.workerSpecList[i].disabled) {
                        sltSpec = ct.workerSpecList[i];
                        break;
                    }
                }
                if (sltSpec) {
                    ct.fn.selectWorkerSpec(sltSpec);
                }
            }
        };

        ct.fn.selectWorkerSpec = function(sltSpec) {
            if (!ct.workerSpecDisabledAllSetting || sltSpec.disabled) return;
            if (sltSpec && sltSpec.uuid) {
                ct.sltWorkerSpec = angular.copy(sltSpec);
                ct.data.workerFlavor = ct.sltWorkerSpec.name;
                ct.sltWorkerSpecUuid = ct.sltWorkerSpec.uuid;
                ct.fn.setWorkerSpecMinDisabled();
            } else {
                ct.sltWorkerSpec = {};
                ct.data.workerFlavor = "";
                ct.sltWorkerSpecUuid = "";
            }
        };

        ct.fn.changeMasterCnt = function(masterCnt) {
            ct.data.masterCnt = masterCnt;
            if (!ct.masterSpecDisabledAllSetting) return;
            ct.fn.chackSpecMaxOver();
        };

        ct.fn.changeWorkerCnt = function(workerCnt) {
            ct.data.workerCnt = workerCnt;
            if (!ct.workerSpecDisabledAllSetting) return;
            ct.fn.chackSpecMaxOver();
        };

        ct.fn.changeNodeType = function (nodeType) {
            console.log(nodeType);
            ct.data.nodeType = nodeType;
        };

        ct.fn.changeBucketType = function(bucketType) {

        };

        // 하둡 오브젝트 스토리지 버킷 생성
        ct.fn.createBucket = function(bucketName) {
           console.log('create Bucket start!!! ');
            // 페이지 로드

            let promise2;
            promise2 = vmCatalogService.createBucket(ct.tenantId,bucketName);
            promise2.success(function () {
                //callBackFuncion(data);
                console.log('create Bucket success  !!! ');
                common.showAlertSuccessHtml("버킷 생성 완료!");
            });
            promise2.error(function (data, status, headers) {
                console.log('create Bucket error  !!! ');
                $scope.main.loadingMainBody = false;
            });
        };

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            // vmCatalogDeploy.parameters.master_cnt = ct.data.masterCnt;
            if(ct.data.type == 'core') { // core 선택 경우
                vmCatalogDeploy.context.hbaseUse = false;
                vmCatalogDeploy.context.sparkUse = false;
            } else if (ct.data.type == 'hbase') { // hbase 선택 경우
                vmCatalogDeploy.context.hbaseUse = true;
                vmCatalogDeploy.context.sparkUse = false;
            } else { // spark 선택 경우
                vmCatalogDeploy.context.sparkUse = true;
                vmCatalogDeploy.context.hbaseUse = false;
            }

            vmCatalogDeploy.parameters.master_flavor = ct.data.masterFlavor;
            vmCatalogDeploy.workerUse = false;
            vmCatalogDeploy.parameters.root_password = ct.data.mysqlRootPassword;
            vmCatalogDeploy.parameters.hive_password = ct.data.mysqlHivePassword;

            if(ct.data.nodeType == 'single') {
                vmCatalogDeploy.workerUse = false;
                vmCatalogDeploy.deployTemplates = "standalone";
                vmCatalogDeploy.parameters.master_flavor = ct.data.workerFlavor;

            }else if(ct.data.nodeType == 'cluster') {
                vmCatalogDeploy.workerUse = true;
                vmCatalogDeploy.parameters.worker_cnt = ct.data.workerCnt;
                vmCatalogDeploy.parameters.worker_flavor = ct.data.workerFlavor;
                vmCatalogDeploy.parameters.master_cnt = ct.data.masterCnt;
                vmCatalogDeploy.parameters.master_flavor = ct.data.masterFlavor;
                vmCatalogDeploy.context.workerCnt = ct.data.workerCnt;
                vmCatalogDeploy.context.masterCnt = ct.data.masterCnt;
                vmCatalogDeploy.parameters.private_key = "set"; // keypair private_key api에서 추가 하라는 의미
            }


            return vmCatalogDeploy;
        };

        subPage.fn.setTocDeployAction = function (deployTemplate) {
            ct.fn.createVmCatalogDeployAction(deployTemplate, subPage.fn.appendSetVmCatalogDeploy, false);
        };

        ct.fn.createVmCatalogDeploy = function () {

            if (!ct.fn.commCheckFormValidity(subPage)) return;
            console.log(" commCheckFormValidity 111>>>>>>>>>>>>>>>>!"+ct.data.deployType);
            if(ct.data.nodeType == 'single') {
                console.log(" standalone !!!!!!!!!!");
                vmCatalogDeploy.deployTemplates = "standalone";
                ct.data.deployType = "standalone";
            }else if(ct.data.nodeType == 'cluster') {
                // 마스터 구성 (단일노드 마스터)
                if (ct.masterCnts == 1) {
                    console.log(" singleMaster !!!!!!!!!!");
                    vmCatalogDeploy.deployTemplates = "sMaster";
                    ct.data.deployType = "sMaster";
                    // 마스터 구성 (이중노드 마스터)
                } else if (ct.masterCnts == 2) {
                    console.log(" multiMaster !!!!!!!!!!");
                    vmCatalogDeploy.deployTemplates = "dMaster";
                    ct.data.deployType = "dMaster";
                }
            }

            console.log(" commCheckFormValidity >>>>>>>>>>>>>>>>!"+ct.data.deployType);
            ct.fn.loadTemplateAndCallAction(ct.data.deployType, subPage.fn.setTocDeployAction);
        };

        // objectStorage 접속정보 조회 추가
        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.fn.getSendSecretInfoList = function() {
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/sendSecretInfo', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/sendSecretInfo', 'GET', {tenantId:ct.data.tenantId}, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    ct.sendSecretInfoList = data.content.secret
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };
        ct.fn.getSendSecretInfoList();

        ct.fn.loadPage();
    })
;
