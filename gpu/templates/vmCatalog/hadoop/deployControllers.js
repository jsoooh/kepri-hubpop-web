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

        ct.data.masterCnt = "1";
        ct.data.workerCnt = "2";

        // 테스트
        if (ct.testInput) {
            ct.data.deployName = "로드밸런스";
            ct.data.stackName = "haproxy";
        }


        //스펙그룹의 스펙 리스트 조회
        ct.fn.getSpecList = function(specListDefer) {
            var returnPromise = vmCatalogService.listAllSpec();
            returnPromise.success(function (data, status, headers) {
                if (data && data.content && data.content.specs && data.content.specs.length > 0) {
                    var specList = [];
                    angular.forEach(data.content.specs, function(val, key) {
                        if (val.name[0] == 'm' &&  val.type == "general") {
                            specList.push(val);
                        }
                    });
                    ct.masterSpecList = angular.copy(specList);
                    ct.workerSpecList = angular.copy(specList);
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

        ct.fn.changeWorkerCnt = function() {
            if (!ct.workerSpecDisabledAllSetting) return;
            ct.fn.chackSpecMaxOver();
        };

        // 추가 셋팅
        subPage.fn.appendSetVmCatalogDeploy = function (vmCatalogDeploy) {
            vmCatalogDeploy.parameters.master_cnt = ct.data.masterCnt;
            vmCatalogDeploy.parameters.master_flavor = ct.data.masterFlavor;
            vmCatalogDeploy.parameters.worker_cnt = ct.data.workerCnt;
            vmCatalogDeploy.parameters.worker_flavor = ct.data.workerFlavor;
            return vmCatalogDeploy;
        };

        subPage.fn.setTocDeployAction = function (deployTemplate) {
            ct.fn.createVmCatalogDeployAction(deployTemplate, subPage.fn.appendSetVmCatalogDeploy, false);
        };

        ct.fn.createVmCatalogDeploy = function () {
            if (!ct.fn.commCheckFormValidity(subPage)) return;

            ct.fn.loadTemplateAndCallAction(ct.data.deployType, subPage.fn.setTocDeployAction);
        };

        ct.fn.loadPage();

    })
;
