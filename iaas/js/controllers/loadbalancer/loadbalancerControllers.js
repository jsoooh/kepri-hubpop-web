'use strict';

angular.module('iaas.controllers')
    .controller('iaasLoadbalancerCreateCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("loadbalancerControllers.js : iaasLoadbalancerCreateCtrl start", 1);

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

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenant.id;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
        });

        ct.fn.createLoadBalancer = function() {
            if (ct.sltConnType == 'server') {
                ct.fn.loadBalancerCreateServer();
            } else {
                ct.fn.loadBalancerCreateImage();
            }
        };

        // 연결서버 유형: 서버 선택시 서버 목록 불러옴
        ct.fn.GetServerMainList = function() {
            $scope.main.loadingMainBody = false;
            var param = {
                tenantId : ct.data.tenantId,
                queryType : 'list'
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param));
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
                tenantId : ct.data.tenantId,
            };
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshotList', 'GET', param));
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
                ct.sltConnType = sltConnType;
                ct.data.iaasLbPort.connType = ct.sltConnType;
                ct.fn.GetServerMainList();
            } else {
                ct.sltConnType = sltConnType;
                ct.data.iaasLbPort.connType = ct.sltConnType;
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'POST', param, "application/json");
            returnPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("생성 되었습니다.");
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
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/loadbalancer', 'POST', param);
            returnPromise.success(function (data, status, headers) {
                ct.networks = data.content;
                ct.networks.unshift({id:"",name:'',description:"네트워크 선택"});
                ct.network = ct.networks[0];
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.GetServerMainList();
    })
;
