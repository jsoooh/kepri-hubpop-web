'use strict';

// angular.module('iaas.controllers')
angular.module('gpu.controllers')
    // .controller('iaasLoadbalancerCreateCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
    .controller('gpuLoadbalancerCreateCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        // _DebugConsoleLog("loadbalancerControllers.js : iaasLoadbalancerCreateCtrl start", 1);
        _DebugConsoleLog("loadbalancerControllers.js : gpuLoadbalancerCreateCtrl start", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct               = this;
        ct.data              = {};
        ct.fn                = {};
        ct.formName          = "loadbalancerCreateForm";
        ct.data.iaasLbInfo   = {};
        ct.data.iaasLbPort   = {};
        ct.data.iaasLbPortMembers = [];
        ct.sltConnType = '';
        ct.serverMainList = [];
        ct.instanceSnapshots = [];
        ct.data.iaasLbInfo.name = "lb-server-01";
        ct.serverMainListCnt = 0;   //선택된 서버목록 갯수

        // 공통 레프트 메뉴의 userTenantId
        // ct.data.tenantId = $scope.main.userTenant.id;
        // ct.data.tenantName = $scope.main.userTenant.korName;
        ct.data.tenantId = $scope.main.gpuUserTenant.id;
        ct.data.tenantName = $scope.main.gpuUserTenant.korName;


        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
        });

        ct.fn.createLoadBalancer = function() {
            if (ct.data.iaasLbPort.connType == 'server') {
                ct.fn.loadBalancerCreateServer();
            } else {
                ct.fn.loadBalancerCreateImage();
            }
        };

        // 연결서버 유형: 서버 선택 시 서버 목록 불러옴
        ct.fn.GetServerMainList = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : ct.data.tenantId,
                queryType : 'list'
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/instance', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.serverMainList = data.content.instances;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                console.debug("serverMainList: ", ct.serverMainList);
            });
        };

        // 연결서버 유형: 이미지 선택시 백업 이미지 목록 불러옴
        ct.fn.getInstanceSnapshotList = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : ct.data.tenantId
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/snapshotList', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                ct.instanceSnapshots = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                if (status != 307) {
                    common.showAlertError(data.message);
                }
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 부하분산 기본정보 - 연결서버 유형(이미지)선택시 대상 백업 이미지 이름을 동적으로 변화시킴
        ct.fn.sltInstanceSnapshotChange = function (sltInstanceSnapshotId) {
            var sltInstanceSnapshot = null;
            if (sltInstanceSnapshotId) {
                sltInstanceSnapshot = common.objectsFindCopyByField(ct.instanceSnapshots, "id", sltInstanceSnapshotId);
            }
            if (sltInstanceSnapshot && sltInstanceSnapshot.id) {
                ct.sltInstanceSnapshot = sltInstanceSnapshot;
                ct.sltInstanceSnapshotId = sltInstanceSnapshotId;
            } else {
                ct.sltInstanceSnapshot = {};
                ct.sltInstanceSnapshotId = "";
            }
        };

        // 연결서버 유형 선택 버튼
        ct.fn.choiceConnType = function(sltConnType) {
            if (sltConnType == "server") {
                ct.data.iaasLbPort.connType = sltConnType;
                ct.fn.GetServerMainList();
            } else {
                ct.data.iaasLbPort.connType = sltConnType;
                ct.fn.getInstanceSnapshotList();
            }
        };

        // LB생성(서버)
        ct.fn.loadBalancerCreateServer = function() {
            var param = {};
            param.iaasLbInfo = {
                description: ct.data.iaasLbInfo.description,
                name: ct.data.iaasLbInfo.name,
                tenantId: ct.data.tenantId
            };
            param.iaasLbPort = {
                connType: ct.data.iaasLbPort.connType,
                name: ct.data.iaasLbPort.name,
                protocol: ct.data.iaasLbPort.protocol,
                protocolPort: ct.data.iaasLbPort.protocolPort
            };
            param.iaasLbPortMembers = [];
            angular.forEach(ct.serverMainList, function(server) {
                if (server.checked) {
                    param.iaasLbPortMembers.push({
                        instanceId: server.id,
                        name: server.name,
                        ipAddress: server.fixedIp.trim()
                    })
                }
            });
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'POST', param, "application/json");
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer', 'POST', param, "application/json");
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("부하분산 설정이 시작되었습니다.");
                // common.locationHref('/#/iaas/compute?tabIndex=1');
                common.locationHref('/#/gpu/compute?tabIndex=1');
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        // LB생성(이미지)
        ct.fn.loadBalancerCreateImage = function() {
            var param = {
                iaasLbInfo: {
                    description: ct.data.iaasLbInfo.description,
                    name: ct.data.iaasLbInfo.name,
                    tenantId: ct.data.tenantId
                },
                iaasLbPort: {
                    connType: ct.data.iaasLbPort.connType,
                    name: ct.data.iaasLbPort.name,
                    protocol: ct.data.iaasLbPort.protocol,
                    protocolPort: ct.data.iaasLbPort.protocolPort,
                    connImageId: ct.data.iaasLbPort.connImageId,
                    connImageName: ct.data.iaasLbPort.connImageName,
                    connImageCount: ct.data.iaasLbPort.connImageCount
                }
            };
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'POST', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer', 'POST', param);
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("부하분산 설정이 시작되었습니다.");
                // common.locationHref('/#/iaas/compute?tabIndex=1');
                common.locationHref('/#/gpu/compute?tabIndex=1');
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
        };

        //연결서버 유형 : 서버인 목록 체크 갯수
        ct.fn.changeCheckCnt = function() {
            var cnt = 0;
            angular.forEach(ct.serverMainList, function(serverItem){
                if (serverItem.checked) {
                    cnt ++;
                }
            });
            ct.serverMainListCnt = cnt;   //선택된 서버목록 갯수
        };

        // 이름 체크
        ct.fn.lbCheckName = function (lbName) {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : ct.data.tenantId,
                loadBalancerId : 'null',
                name : lbName
            };
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer/check_name', 'GET', param));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/loadbalancer/check_name', 'GET', param));
            returnPromise.success(function (data, status, headers) {
                return {isValid : true};
            });
            returnPromise.error(function (data, status, headers) {
                return {isValid: false, message: "이미 사용중인 이름 입니다."};
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.subDomainCustomValidationCheck = function(subDomain) {
            if (subDomain && angular.isArray(ct.usingDomainNames) && ct.usingDomainNames.length > 0) {
                var domainName = subDomain + "." + ct.data.baseDomainName;
                if ((ct.formMode != "mod" || ct.orgDomain.domain != domainName) && ct.usingDomainNames.indexOf(domainName) >= 0) {
                    return {isValid: false, message: "이미 사용중인 서브도메인 입니다."};
                }
            }
            return {isValid : true};
        };

        ct.fn.GetServerMainList();
    })
;
