'use strict';

angular.module('iaas.controllers')
    .controller('iaasLoadBalancerCtrl', function ($scope, $location, $state, $stateParams, $timeout, $filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("loadBalancerControllers.js : iaasLoadBalancerCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.urlType = $stateParams.type;


        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getLbServiceList();
        });

        ct.fn.checkAll = function($event) {
            ct.roles = [];
            if($event.currentTarget.checked) {
                for(var i=0; i < ct.lbList.length; i++) {
                    ct.roles.push(ct.lbList[i]);
                }
            }

        }

        ct.fn.checkOne = function($event,id) {
            if($event.currentTarget.checked) {
                if(ct.roles.length == $("#mainList tbody").find("input[type='checkbox']").length) {
                    $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);
            }
        }

        ct.fn.getLbServiceList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/listLbService', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.lbServiceList = data.content.lbNetworkServices;
                ct.lbList = null;
                if($stateParams.type !== 'base') {
                    ct.nsId = $stateParams.type;
                    for(var i=0; i<ct.lbServiceList.length; i++) {
                        if(ct.nsId == ct.lbServiceList[i].nsId) {
                            ct.fn.getLbList(ct.nsId,ct.lbServiceList[i].nfId)
                        }
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getLbList = function(nsId,nfId) {
            ct.roles = [];
            $scope.main.loadingMainBody = true;
            var param = {
                nsId : nsId,
                nfId : nfId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/ListLb', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.lbList = data.content.loadbalancers;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        ct.fn.deleteLbService = function(lb) {
            common.showConfirm('Load Balance 서비스 삭제','※' + lb.name + '을 삭제 하시겠습니까?').then(function(){
                var param = {
                    tenantId : ct.data.tenantId,
                    nsId : lb.nsId
                };
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbService', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getLbServiceList();
                    ct.lbList = null;
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }


        ct.fn.deleteLbBtn = function() {
            if(ct.roles.length == 0) {
                common.showAlert('메세지','선택된 로드 밸런스가 없습니다.');
            } else {
                common.showConfirm('로드 밸런스 삭제','선택된 로드 밸런스를 삭제 하시겠습니까?').then(function(){
                    ct.fn.deleteLbs();
                });
            }
        }

        // 서버삭제
        ct.fn.deleteLbs = function() {
            $scope.main.loadingMainBody = true;
            var prom = [];
            for(var i=0; i< ct.roles.length; i++) {
                prom.push(ct.fn.deleteLbJob(ct.roles[i]));
            }
            $q.all(prom).then(function(results){
                ct.fn.getLbList(ct.roles[0].nsId,ct.roles[0].nfId);
            },function(error){
                common.showAlert("message",error);
                ct.fn.getLbList(ct.roles[0].nsId,ct.roles[0].nfId);
            });
        }

        // 서버삭제
        ct.fn.deleteLbJob = function(lb) {
            var deferred = $q.defer();
            if(typeof name !== 'string') {
                return;
            }
            var param = {
                tenantId : ct.data.tenantId,
                lbId : lb.lbId,
                nsId : lb.nsId,
                nfId : lb.nfId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lb', 'DELETE', param)
            returnPromise.success(function (data, status, headers) {
                deferred.resolve('success');
            });
            returnPromise.error(function (data, status, headers) {
                deferred.reject(data.message);
            });

            return deferred.promise;
        };

        ct.fn.lbServiceStatusAction = function(type,lb) {
            var path = "lbServiceStart";
            if(type == 'start') {
                common.showConfirm('LB 서비스','※' + lb.name + '을 시작 하시겠습니까?').then(function(){
                    path = "lbServiceStart";
                    ct.fn.lbServiceStatusActionJob(path,lb);
                });
            } else {
                common.showConfirm('LB 서비스','※' + lb.name + '을 종료 하시겠습니까?').then(function(){
                    path = "lbServiceStop";
                    ct.fn.lbServiceStatusActionJob(path,lb);
                });
            }
        }

        ct.fn.lbServiceStatusActionJob = function(path,lb) {
            var param = {
                tenantId : ct.data.tenantId,
                nsId : lb.nsId
            };
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/'+path, 'PUT', param,'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if(path == 'lbServiceStart') {
                    $timeout(ct.fn.getLbServiceList,3000,false);
                } else {
                   // ct.fn.getLbServiceList();
                    $timeout(ct.fn.getLbServiceList,3000,false);
                }
                ct.lbList = null;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }




        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.lbServiceAction = function($event,network) {
            $scope.dialogOptions = {
                controller : "lbServiceActionFormCtrl",
                callBackFunction : ct.fn.getLbServiceList,
                network : network
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        }

        if(ct.data.tenantId) {
            ct.fn.getLbServiceList();
        }
    })
    .controller('lbServiceActionFormCtrl', function ($scope, $location, $state,$translate, $stateParams, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadBalancerControllers.js : lbServiceActionFormCtrl", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.roles = [];
        pop.data = {};
        pop.params = {};
        pop.data.type = 'public';
        pop.params.status = 'A';
        pop.params.tenantId = $scope.contents.data.tenantId;
        pop.formName = "lbServiceActionForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "LB 서비스 추가";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/network/popLbServiceActionForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            //alert(pop.data.specId);
            if (pop.data.specId==""||!pop.data.specId)
            {
                $scope.actionBtnHied = false;
              //  common.showAlert("message","서비스 스펙을 선택하십시오");
                return;
            }
            if(!pop.vipcheck) {
                $scope.actionBtnHied = false;
                return;
            } else {
                $scope.actionBtnHied = true;
                pop.fn.lbServiceAction();
            }
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.getVipPoolList = function() {
            $scope.main.loadingMainBody = true;
            pop.params.type = pop.data.type;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vip/vipList', 'GET', pop.params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.networkVipInfos = data.content.networkVipInfos;

                if(!pop.networkVipInfos || pop.networkVipInfos.length == 0) {
                    pop.vipcheck = false;
                    pop.networkVipInfos = [{vip:'조회된 vip가 없습니다.'}];
                } else {
                    pop.vipcheck = true;
                }
                pop.data.vip = pop.networkVipInfos[0].vip;
                pop.fn.getSpecList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.getSpecList = function() {
            $scope.main.loadingMainBody = true;
            pop.params.type = pop.data.type;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/specList', 'GET', pop.params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.lBServiceSpecs = data.content.lBServiceSpecs;
               // pop.data.specId = pop.lBServiceSpecs[0].specId;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.poolAssign = function() {
            $scope.main.loadingMainBody = true;
            pop.params.type = pop.data.type;
            pop.params.vip = pop.data.vip;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vip/vip', 'POST',{networkVipInfo:pop.params});
            returnPromise.success(function (data, status, headers) {
                pop.fn.getVipPoolList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
        }

        pop.fn.resetVipPool = function() {
            pop.fn.getVipPoolList();
        }


        pop.fn.lbServiceAction = function() {
            pop.data.status = 'A'
            pop.data.tenantId = pop.params.tenantId;
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbService', 'POST', {lbNetworkService:pop.data});
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.popCancel();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        pop.fn.getVipPoolList();

    })
;
