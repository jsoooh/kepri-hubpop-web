'use strict';

angular.module('portal.controllers')
    .controller('commOrgQuotaCtrl', function ($scope, $location, $state, $stateParams, $translate, orgQuotaService, common) {
        _DebugConsoleLog("orgQuotaControllers.js : commOrgQuotaCtrl", 1);

        var ct = this;

        ct.paramOrgId = $stateParams.orgId;
        ct.paramOrgId = ct.paramOrgId.replace(":orgId","");

        ct.orgQuotas = [];
        ct.orgQuotaTotal = {
            vcpus : 0,
            ram : 0,
            disk : 0
        };

        // searchParams
        ct.searchParams = {
            orgId: ct.paramOrgId,
            service: 'IaaS'
        };

        /*OrgQuota 목록 조회*/
        ct.listOrgQuotas = function (service) {
            $scope.main.loadingMainBody = true;
            if (service != undefined) ct.searchParams.service = service;
            var promise = orgQuotaService.listOrgQuotas(ct.searchParams);
            promise.success(function (data) {
                ct.orgQuotas = data;
                if (data.itemCount > 0) {
                    ct.setQuotaTotal();
                }
                ct.getAuthService(); // 서비스별 버튼 권한
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data) {
                ct.orgQuotas = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /* 총제공사양값 셋팅 */
        ct.setQuotaTotal = function () {
            var vcpusTotal = 0;
            var ramTotal = 0;
            var diskTotal = 0;
            if (ct.orgQuotas.items.length > 0) {
                angular.forEach(ct.orgQuotas.items, function(data) {
                    if (data.product.productName == 'computing') {
                        vcpusTotal = vcpusTotal + parseInt(data.product.vcpus * data.productAmount);
                        ramTotal = ramTotal + parseInt(data.product.ram * data.productAmount);
                        diskTotal = diskTotal + parseInt(data.product.disk * data.productAmount);
                    }
                });
                ct.orgQuotaTotal = {vcpus : vcpusTotal, ram : ramTotal, disk : diskTotal};
            }
        };

        ct.isIaaS = true;
        ct.isPaaS = true;
        ct.isDevOps = true;
        ct.isMonit = true;
        /* orgServe 목록조회(사용중인 서비스) */
        ct.getAuthService = function () {
            if (ct.paramOrgId) {
                var promise = orgQuotaService.listOrgServes(ct.paramOrgId);
                promise.success(function (data) {
                    // orgServe에 등록된 서비스는 disabled=false처리(화면에서 기능버튼들 활성화)
                    angular.forEach(data.items, function(serve) {
                        if (serve == 'IaaS') {
                            ct.isIaaS = false;
                        } else if (serve == 'PaaS') {
                            ct.isPaaS = false;
                        } else if (serve == 'DevOps') {
                            ct.isDevOps = false;
                        } else if (serve == 'Monit') {
                            ct.isMonit = false;
                        }
                    });

                    // 기업관리자가 아닌경우는 요청,변경요청시 수정불가
                    if ($scope.orgMain.userAuth == 'U' && ($scope.orgMain.statusCode == 'call' || $scope.orgMain.statusCode == 'change_call')) {
                        ct.isIaaS = true;
                        ct.isPaaS = true;
                        ct.isDevOps = true;
                        ct.isMonit = true;
                    }
                });
            }
        };

        /* 상품추가시에 저장 */
        ct.saveOrgQuota = function (addDatas) {
            $scope.main.loadingMainBody = true;
            var quotaPromise = orgQuotaService.saveOrgQuota(addDatas);
            quotaPromise.success(function (data) {
                //common.showAlert("", $translate.instant("message.mi_create_success"));
                addDatas = [];
                ct.listOrgQuotas();
                $scope.main.loadingMainBody = false;
            });
            quotaPromise.error(function (data) {
                //common.showAlert("상품 추가 오류", data);
                addDatas = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /* storage Disk값 변경 */
        ct.plusDisk = function (quota){
            if (quota.useLimit >= quota.product.endUseSection) {
                common.showAlert("", "최대용량[" + quota.product.endUseSection + "]을 초과할수 없습니다.");
                return false;
            }
            quota.useLimit = parseInt(quota.useLimit) + parseInt(quota.product.disk);
            ct.updateOrgQuota(quota);
        };
        /* storage Disk값 변경 */
        ct.minusDisk = function (quota){
            if (quota.useLimit <= quota.product.disk) {
                return;
            }
            quota.useLimit = parseInt(quota.useLimit) - parseInt(quota.product.disk);
            ct.updateOrgQuota(quota);
        };

        /* 신청수량 변경 */
        ct.plusAmount = function (quota) {
            quota.productAmount++;
            ct.updateOrgQuota(quota);
            if (quota.product.productName == 'computing') ct.setQuotaTotal();
        };

        /* 신청수량 변경 */
        ct.minusAmount = function (quota) {
            if (quota.productAmount <= 1) {
                common.showAlert("", "수량은 최소 1개 이상 신청 가능합니다.");
                return;
            }
            quota.productAmount--;
            ct.updateOrgQuota(quota);
            if (quota.product.productName == 'computing') ct.setQuotaTotal();
        };

        /* 신청수량 변경시 DB데이터 수정 */
        ct.updateOrgQuota = function (quota) {
            $scope.main.loadingMainBody = true;
            var quotaPromise = orgQuotaService.updateOrgQuota(quota);
            quotaPromise.success(function (data) {
                //common.showAlert("", $translate.instant("message.mi_update"));
                $scope.main.loadingMainBody = false;
            });
            quotaPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        /* 상품 삭제 */
        ct.removeProduct = function (quota) {
            $scope.main.loadingMainBody = true;
            var quotaPromise;
            if (typeof quota == 'object') {
                quotaPromise = orgQuotaService.removeOrgQuotaDevOps(quota);
            } else {
                quotaPromise = orgQuotaService.removeOrgQuota(quota);
            }
            quotaPromise.success(function (data) {
                common.showAlert("상품 삭제", $translate.instant("message.mi_delete"));
                ct.listOrgQuotas();
                $scope.main.loadingMainBody = false;
            });
            quotaPromise.error(function (data) {
                common.showAlertError("상품 삭제 오류", $translate.instant(data.resultMsg));
                $scope.main.loadingMainBody = false;
            });
        };

        /* Quota 적용 API Call */
        ct.apiCall = function (service) {
            $scope.main.loadingMainBody = true;
            var quotaPromise = orgQuotaService.orgQuotaApi(ct.paramOrgId, service);
            quotaPromise.success(function (data) {
                common.showAlert("", $translate.instant("message.mi_update"));
                $scope.main.loadingMainBody = false;
                $scope.main.goToPage('/orgs');
            });
            quotaPromise.error(function (data) {
                common.showAlertError("조직 생성 오류", $translate.instant(data));
                $scope.main.loadingMainBody = false;
            });
        };

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.iaasDivision = 'computing';
        pop.paasDivision = 'public';
        pop.products = [];

    })
    .filter('getProduct', function() {
        return function (items, division) {
            if (items != undefined) {
                var filtered = [];
                var isNetwork = true;
                for (var i=0; i<items.length; i++) {
                    var item = items[i];
                    if (item.product != undefined && item.product.division == division) {
                        filtered.push(item);
                    }
                }
                return filtered;
            }
        }
    })
;