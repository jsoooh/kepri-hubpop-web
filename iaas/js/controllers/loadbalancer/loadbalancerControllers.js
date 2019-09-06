'use strict';

angular.module('iaas.controllers')
    .controller('iaasLoadbalancerCreateCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, CONSTANTS) {
        _DebugConsoleLog("loadbalancerControllers.js : iaasLoadbalancerCreateCtrl start", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct               = this;
        ct.data              = {};
        ct.fn                = {};

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.id;
            ct.data.tenantName = status.korName;
            //ct.fn.networkListSearch();
        });

        // 네트워크 셀렉트박스 조회
        ct.fn.networkListSearch = function() {
            var param = {
                tenantId : ct.data.tenantId,
                isExternal : false
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
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

        if (ct.data.tenantId) {
            //ct.fn.networkListSearch();
        }

    })

;
