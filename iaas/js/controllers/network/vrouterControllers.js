'use strict';

angular.module('iaas.controllers')
    .controller('iaasVrouterCtrl', function ($scope, $location, $state, $stateParams, $timeout, $filter, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("vrouterControllers.js : iaasVrouterCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];


        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;
        ct.userInfo = $scope.main.userInfo;
        ct.actionBtn = false;
        ct.testBtn = false;

      //  common.showAlert("message",'vrouter');


        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
          //  common.showAlert("message",'vrouter');
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
            ct.fn.getRouterList();
        });

        ct.fn.getRouterList = function() {
           // alert("go");
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/vRouterService', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {

                ct.vrouterList = data.content.vrouters;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }
        ct.fn.routerServiceStatusAction = function(type,vrouter)
        {
            if(type == 'start') {
                var path='ActionStart';
                common.showConfirm('vRouter 서비스','※' + vrouter.name + '을 시작 하시겠습니까?').then(function(){
                    ct.fn.routerServiceStatusActionJob(path,vrouter);
                });
            } else {
                var path='ActionStop';
                common.showConfirm('vRouter 서비스','※' + vrouter.name + '을 종료 하시겠습니까?').then(function(){
                    ct.fn.routerServiceStatusActionJob(path,vrouter);
                });
            }

        }
        ct.fn.routerServiceDeleteAction = function(vrouter)
        {
            common.showConfirm('vRouter 서비스','※' + vrouter.name + '을 삭제 하시겠습니까?').then(function(){
               // common.showAlert("message",'delete'+vrouter.nsid);
                var param = {
                    tenantId : vrouter.srcTenantId,
                    nsId:vrouter.nsid

                }
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/vRouterService', 'DELETE', param,'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {

                  // ct.vrouterList = data.content.vrouters;
                    ct.fn.getRouterList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });

            });


        }
        ct.fn.changeRouter= function(vrouter)
        {
            alert(vrouter.name);
            $scope.main.goToPage('/network/vpn'+ vrouter.nsid)

        }
        ct.fn.routerServiceStatusActionJob= function(path,vrouter)
        {

            var param = {
                tenantId : ct.data.tenantId,
                nsId:vrouter.nsid

            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/'+path, 'PUT', param,'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if(path == 'ActionStart') {
                    //ct.vrouterList = null;
                    $timeout(ct.fn.getRouterList,3000,false);
                } else {
                    // ct.fn.getLbServiceList();
                    //ct.vrouterList = null;
                    $timeout(ct.fn.getRouterList,3000,false);
                }


            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });

        }

        if(ct.data.tenantId) {
            ct.fn.getRouterList();
        }
        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.vrouterServiceAction = function($event,network) {
            $scope.dialogOptions = {
                controller : "vrouterServiceActionFormCtrl",
                callBackFunction : ct.fn.getRouterList
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        }

    })
    .controller('vrouterServiceActionFormCtrl', function ($scope, $location, $state,$translate, $stateParams, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("vrouterServiceActionFormCtrl.js : vrouterServiceActionFormCtrl", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.roles = [];
        pop.data = {};
        pop.params = {};
        pop.rolescheck=false;
      //  pop.data.type = 'public';
       // pop.params.status = 'A';
        pop.routerParam={};
        pop.params.tenantId = $scope.contents.data.tenantId;
        pop.formName = "vrouterServiceActionForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "vRouter 서비스 추가";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/network/popVrouterServiceActionForm.html" + _VersionTail();
       // common.showAlert("message11",pop.params.tenantId);

       // common.showAlert("message",'TEST1');
        $scope.popCancel = function () {
           // common.showAlert("message",'HIDE');
            $scope.popHide();
        }
        $scope.popDialogOk = function () {


            pop.chekenabled=false;
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!new ValidationService().checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }


            if (pop.roles.length==0)
            {
                //common.showAlert("이름: 필수 입력 항목입니다.");
                pop.rolescheck=true;
                $scope.actionBtnHied = false;
                return;
            }
            pop.fn.makeVrouterService();
            $scope.popHide();
        };
        pop.fn.getTenant= function(tenantid)
        {
            var tenant={};
            tenant.id=tenantid;
            tenant.name=tenantid;
            return tenant;
        }
        pop.fn.makeVrouterService= function()
        {
            var prom = [];

            //if (pop.roles.length==0)
           // {
           //     alert("타켓 조직을 선택하셔야 합니다");
           //     return;
           // }

           for(var i=0;i<pop.roles.length;i++)
            {
                prom.push(pop.fn.getTenant(pop.roles[i]));
            }
            var param = {
                srcTenantId : pop.data.srcTenantId,
                name:pop.data.name,
                trgTenants : prom
            }




            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/vRouterService', 'POST', {vRouterInfo:param});
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
       // common.showAlert("message",'TEST2');

        pop.fn.getTargetTenantList = function() {
            //common.showAlert("message",pop.params.tenantId);
            $scope.main.loadingMainBody = true;
            var param = {
                srcTenantId : pop.params.tenantId,
                limit : 5,
                curlPage : 1
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/userTenant', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.targettenant = data.content.userTenants;
            //    pop.srctenant = data.content.userTenants;
            //    pop.data.srcTenantId=pop.params.tenantId;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });

        }
        pop.fn.getSrcTenantList = function() {
            //common.showAlert("message",pop.params.tenantId);
            $scope.main.loadingMainBody = true;
            var param = {
                srcTenantId : pop.params.tenantId,
                limit : 5,
                curlPage : 1
            }

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/user/userTenant', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
          //      pop.targettenant = data.content.userTenants;
                pop.srctenant = data.content.userTenants;
                pop.data.srcTenantId=pop.params.tenantId;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });

        }

        //common.showAlert("message",'TEST3');
       // pop.fn.getSrcNetworkList();
        pop.fn.getTargetTenantList();
        pop.fn.getSrcTenantList();

    })
;
