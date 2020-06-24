'use strict';

angular.module('gpu.controllers')
    .controller('hadoopDeployCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("hadoop deployControllers.js : hadoopDeployCtrl", 1);
        var subPage = this;
        subPage.fn = {};

        var ct = $scope.$parent.$parent.contents;

        ct.masterSpecList = [];
        ct.workerSpecList = [];

        ct.data.masterCnt = "1";
        ct.data.workerCnt = "2";


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
                ct.fn.setMasterSpecMaxDisabled();
                ct.fn.setWorkerSpecMinDisabled();
                ct.fn.setWorkerSpecMaxDisabled();
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
                if (ct.sltMasterSpac && ct.sltMasterSpac.uuid) {
                    if (ct.sltMasterSpac.disk < 4 || ct.sltMasterSpac.ram < 512) {
                        ct.fn.defaultSelectMasterSpec();
                    }
                } else {
                    ct.fn.defaultSelectMasterSpec();
                }
            }
        };

        // max spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        ct.isMasterMaxSpecDisabled = false;
        // spec loading 체크
        ct.masterSpecMaxDisabledSetting = false;
        ct.fn.setMasterSpecMaxDisabled = function () {
            ct.isMasterMaxSpecDisabled = false;
            if (ct.isMasterSpecLoad && ct.tenantResource && ct.tenantResource.maxResource && ct.tenantResource.usedResource) {
                angular.forEach(ct.masterSpecList, function (spec) {
                    if (spec.vcpus > ct.tenantResource.available.cores || spec.ram > ct.tenantResource.available.ramSize || spec.disk > ct.tenantResource.available.instanceDiskGigabytes) {
                        spec.disabled = true;
                        ct.isMasterMaxSpecDisabled = true;
                    }
                });
                ct.masterSpecMaxDisabledSetting = true;
                ct.fn.defaultSelectMasterSpec();
            }
        };

        ct.fn.setMasterSpecAllEnabled = function () {
            if (ct.masterSpecList && ct.masterSpecList.length && ct.masterSpecList.length > 0) {
                angular.forEach(ct.masterSpecList, function (spec) {
                    spec.disabled = false;
                });
            }
        };

        // spec loading 체크
        ct.masterSpecDisabledAllSetting = false;
        ct.fn.defaultSelectMasterSpec = function() {
            if (ct.masterSpecMinDisabledSetting && ct.masterSpecMaxDisabledSetting) {
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

        //사양선택 이벤트 2018.11.13 sg0730 add
        ct.fn.selectMasterSpec = function(sltSpec) {
            if (!ct.masterSpecDisabledAllSetting || sltSpec.disabled) return;
            if (sltSpec && sltSpec.uuid) {
                ct.sltMasterSpac = angular.copy(sltSpec);
                ct.data.masterflavor = ct.sltMasterSpac.name;
                ct.sltMasterSpacUuid = ct.sltMasterSpac.uuid;
            } else {
                ct.sltMasterSpac = {};
                ct.data.masterflavor = "";
                ct.sltMasterSpacUuid = "";
            }
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
                if (ct.sltWorkerSpac && ct.sltWorkerSpac.uuid) {
                    if (ct.sltWorkerSpac.disk < 4 || ct.sltWorkerSpac.ram < 512) {
                        ct.fn.defaultSelectWorkerSpec();
                    }
                } else {
                    ct.fn.defaultSelectWorkerSpec();
                }
            }
        };

        // max spac disabled 존재 여부 (안내 문구 출력 여부로 사용 예정)
        ct.isWorkerMaxSpecDisabled = false;
        // spec loading 체크
        ct.workerSpecMaxDisabledSetting = false;
        ct.fn.setWorkerSpecMaxDisabled = function () {
            ct.isWorkerMaxSpecDisabled = false;
            if (ct.isWorkerSpecLoad && ct.tenantResource && ct.tenantResource.maxResource && ct.tenantResource.usedResource) {
                angular.forEach(ct.workerSpecList, function (spec) {
                    if (spec.vcpus > ct.tenantResource.available.cores || spec.ram > ct.tenantResource.available.ramSize || spec.disk > ct.tenantResource.available.instanceDiskGigabytes) {
                        spec.disabled = true;
                        ct.isWorkerMaxSpecDisabled = true;
                    }
                });
                ct.workerSpecMaxDisabledSetting = true;
                ct.fn.defaultSelectWorkerSpec();
            }
        };

        ct.fn.setWorkerSpecAllEnabled = function () {
            if (ct.workerSpecList && ct.workerSpecList.length && ct.workerSpecList.length > 0) {
                angular.forEach(ct.workerSpecList, function (spec) {
                    spec.disabled = false;
                });
            }
        };

        // spec loading 체크
        ct.workerSpecDisabledAllSetting = false;
        ct.fn.defaultSelectWorkerSpec = function() {
            if (ct.workerSpecMinDisabledSetting && ct.workerSpecMaxDisabledSetting) {
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
                ct.sltWorkerSpac = angular.copy(sltSpec);
                ct.data.workerFlavor = ct.sltWorkerSpac.name;
                ct.sltWorkerSpacUuid = ct.sltWorkerSpac.uuid;
            } else {
                ct.sltWorkerSpac = {};
                ct.data.workerFlavor = "";
                ct.sltWorkerSpacUuid = "";
            }
        };

        ct.fn.loadPage();

    })
;
