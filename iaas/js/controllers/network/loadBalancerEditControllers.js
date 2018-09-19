'use strict';

angular.module('iaas.controllers')
    .controller('iaasLoadBalancerEditCtrl', function ($scope, $location, $state, $stateParams, $filter, ValidationService, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("loadBalancerEditControllers.js : iaasLoadBalancerEditCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.nsId = $stateParams.nsId;
        ct.nfId = $stateParams.nfId;
        ct.lbId = $stateParams.lbId;

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            $scope.main.moveToAppPage("/network/loadBalancer/base");
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
        });

        ct.fn.validationLB = function() {
            if (!ct.data.name) {
                common.showAlert("이름: 필수 입력 항목입니다.");
                return false;
            }
            if (!ct.data.listnerPort) {
                common.showAlert("접속 정보: 필수 입력 항목입니다.");
                return false;
            }

            if (ct.data.healthProtocol == 'HTTP' ||ct.data.healthProtocol == 'HTTPS') {
                if(!ct.data.healthUrl){
                    common.showAlert("상태확인 URL: 상태확인 프로토콜이 HTTP 혹은 HTTPS일 경우 필수 입력 항목입니다.");
                    return false;
                }
            }

            if(ct.data.sessionPersitenceType != 'APP_COOKIE') {
                ct.data.cookieName = '';
            } else {
                if(!ct.data.cookieName){
                    common.showAlert("쿠키 변수명: 세션유지타입이 APP_COOKIE일 경우 필수 입력 항목입니다.");
                    return false;
                }
            }
            return true;
        }

        ct.fn.getLBServiceInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                nsId : ct.nsId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbService', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.lbService = data.content.lbNetworkService;
                if(!ct.lbService) {
                    $scope.main.moveToAppPage('/network/loadBalancer/base');
                } else {
                    ct.fn.getLBInfo();
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getLBInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                nsId : ct.nsId,
                nfId : ct.nfId,
                lbId : ct.lbId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lb', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.data = data.content.loadbalancer;
                if(!ct.data) {
                    $scope.main.moveToAppPage('/network/loadBalancer/base');
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.editLoadBalance = function() {
            if(ct.fn.validationLB()) {
                common.showConfirm('Load Balance 변경','※ 로드밸런스를 변경 하시겠습니까?').then(function(){
                    $scope.main.loadingMainBody = true;
                    ct.data.nsId = ct.nsId;
                    ct.data.nfId = ct.nfId;

                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lb', 'PUT', {loadbalancer : ct.data,tenantId : ct.data.tenantId});
                    returnPromise.success(function (data, status, headers) {
                        $scope.main.moveToAppPage('/network/loadBalancer/'+ct.nsId);
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlert("message",data.message);
                    });
                    returnPromise.finally(function (data, status, headers) {
                        $scope.main.loadingMainBody = false;
                    });
                });
            }
        }

        if(ct.data.tenantId) {
            ct.fn.getLBServiceInfo();
        }
    })
    .controller('iaasLoadBalancerCertificateCtrl', function ($scope, $location, $state, $stateParams, $filter, ValidationService, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("loadBalancerEditControllers.js : iaasLoadBalancerCertificateCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.nsId = $stateParams.nsId;
        ct.nfId = $stateParams.nfId;
        ct.lbId = $stateParams.lbId;

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            $scope.main.moveToAppPage("/network/loadBalancer/base");
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
        });

        ct.fn.getLBServiceInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                nsId : ct.nsId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbService', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.lbService = data.content.lbNetworkService;
                if(!ct.lbService) {
                    $scope.main.moveToAppPage('/network/loadBalancer/base');
                } else {
                    ct.fn.getLBInfo();
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getLBInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                nsId : ct.nsId,
                nfId : ct.nfId,
                lbId : ct.lbId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lb', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.data = data.content.loadbalancer;
                if(!ct.data) {
                    $scope.main.moveToAppPage('/network/loadBalancer/base');
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.editLoadBalance = function() {
            common.showConfirm('Load Balance 변경','※ 로드밸런스 인증서를 변경 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                ct.data.nsId = ct.nsId;
                ct.data.nfId = ct.nfId;

                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbSslCert', 'PUT', {loadbalancer : ct.data,tenantId : ct.data.tenantId});
                returnPromise.success(function (data, status, headers) {
                    $scope.main.moveToAppPage('/network/loadBalancer/'+ct.nsId);
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }

        if(ct.data.tenantId) {
            ct.fn.getLBServiceInfo();
        }
    })
    .controller('iaasLoadBalancerServerCtrl', function ($scope, $location, $state, $stateParams, $filter, ValidationService, $translate, $q, user, common, CONSTANTS) {
        _DebugConsoleLog("loadBalancerEditControllers.js : iaasLoadBalancerServerCtrl", 1);

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.roles = [];
        ct.nsId = $stateParams.nsId;
        ct.nfId = $stateParams.nfId;
        ct.lbId = $stateParams.lbId;

        // 공통 레프트 메뉴의 userTenantId
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            $scope.main.moveToAppPage("/network/loadBalancer/base");
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;
        });
        ct.fn.checkOne = function($event,id) {


            if($event.currentTarget.checked) {
                if(ct.roles.length == $("#mainList tbody").find("input[type='checkbox']").length) {
                    $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);
            }

        };
        ct.fn.checkAll = function($event) {
            ct.roles = [];
            if($event.currentTarget.checked) {
                for(var i=0; i < ct.lbMemberList.length; i++) {
                    ct.roles.push(ct.lbMemberList[i]);
                }
            }

        };

        ct.fn.getLBInfo = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                nsId : ct.nsId,
                nfId : ct.nfId,
                lbId : ct.lbId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lb', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.lb = data.content.loadbalancer;
                if(!ct.lb) {
                    $scope.main.moveToAppPage('/network/loadBalancer/base');
                }
                ct.fn.getLBServerList();
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getLBServerList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                nsId : ct.nsId,
                nfId : ct.nfId,
                lbId : ct.lbId
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/listLbMember', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                ct.roles=[];
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);
                ct.lbMemberList = data.content.lbMembers;
                if(!ct.lbMemberList) {
                    $scope.main.moveToAppPage('/network/loadBalancer/base');
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.fn.lbMemberAdd = function ($event) {
            $scope.dialogOptions = {
                controller : "lbMemberAddFormCtrl",
                callBackFunction : ct.fn.getLBServerList
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        }

        ct.fn.lbMemberEdit = function ($event,member) {
            $scope.dialogOptions = {
                controller : "lbMemberEditFormCtrl",
                callBackFunction : ct.fn.getLBServerList,
                member:member
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        }



        ct.fn.deleteLbMember = function(member) {
            common.showConfirm('멤버삭제','※ 멤버를 삭제 하시겠습니까?').then(function(){
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbMember', 'DELETE', member);
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getLBServerList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }
        ct.fn.deleteLbMemberChecked = function(member) {
            if (ct.roles.length==0)
            {
                common.showAlert("멤버삭제","선택된 멤버가 없습니다");
                return;
            }
            common.showConfirm('멤버삭제','※ 선택된'+ ct.roles.length+ '개 멤버를 삭제 하시겠습니까?').then(function(){

               var members=[];
               for(var i=0;i<ct.roles.length;i++)
               {
                   members.push(ct.roles[i]);
               }
                $scope.main.loadingMainBody = true;
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbMembersDelete', 'POST', {lbMembers:members});
                returnPromise.success(function (data, status, headers) {
                    ct.fn.getLBServerList();
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlert("message",data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        }

        if(ct.data.tenantId) {
            ct.fn.getLBInfo();
        }
    })
    .controller('lbMemberAddFormCtrl', function ($scope, $location, $state,$translate, $stateParams, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadBalancerEditControllers.js : lbMemberAddFormCtr ljm 수정중", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.userTenant = angular.copy($scope.main.userTenant);

        pop.fn = {};
        pop.roles = [];

        pop.formName = "lbMemberAddForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "대상 서버 선택";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/network/subMenus/popLbMemberAddForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            if (pop.roles.length==0)
            {
                return;
            }
            pop.fn.addLbMember();
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };
        pop.fn.checkAll = function($event) {
            pop.roles = [];
            if($event.currentTarget.checked) {
                for(var i=0; i < pop.memberServers.length; i++) {
                    pop.roles.push(pop.memberServers[i]);
                }
            }

        };
        pop.fn.checkOne = function($event,id) {


            if($event.currentTarget.checked) {
                if(pop.roles.length == $("#mainListAddMember tbody").find("input[type='checkbox']").length) {
                    $($("#mainListAddMember").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainListAddMember").find("input[type='checkbox']")[0]).prop("checked",false);
            }
           // alert("end");
        };

        pop.fn.getNetworkList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : $scope.contents.data.tenantId,
                isExternal : false,
                limit : 0
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/networks', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                pop.networks = data.content;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.getLbMemberServerList = function() {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : $scope.contents.data.tenantId,
                networkName : pop.networkName,
                instanceName : pop.instanceName
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbMemberServer', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.roles=[];
                $($("#mainListAddMember").find("input[type='checkbox']")[0]).prop("checked",false);
                pop.memberServers = data.content.memberServers;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };
        pop.fn.addLbMembersub=function(lbdatas) {
            //alert(lbdatas.length);
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbMembers', 'POST', {lbMembers:lbdatas});
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
        };
        pop.fn.addLbMember = function()
        {
          //  alert("addLbMember");
           // alert(pop.roles.length);
            var params=[];
            for(var i=0;i<pop.roles.length;i++)
            {
                var member=pop.roles[i];
               // alert(member.instanceName);
               // pop.fn.addLbMembersub(member.ip,member.instanceName);
                 var param = {
                    node : member.ip,
                    description : member.instanceName,
                      port : $scope.contents.lb.listnerPort,
                      weight: 1,
                      nsId : $scope.contents.nsId,
                      nfId : $scope.contents.nfId,
                      lbId : $scope.contents.lbId
                 }
                params.push(param);

            }
            pop.fn.addLbMembersub(params);


        }



        pop.fn.getNetworkList();

    })
    .controller('lbMemberEditFormCtrl', function ($scope, $location, $state,$translate, $stateParams, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("loadBalancerEditControllers.js :===> lbMemberAddFormCtrl!!!!", 1);

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.roles = [];
        pop.member = angular.copy($scope.dialogOptions.member);

        pop.formName = "lbMemberEditForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = "대상 서버 정보 변경";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/network/subMenus/popLbMemberEditForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;

            pop.fn.editLbMember();
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.getlbMemberInfo = function(member) {
            $scope.main.loadingMainBody = true;
            var param = {
                nsId : $scope.contents.nsId,
                nfId : $scope.contents.nfId,
                lbId : $scope.contents.lbId,
                id : member.id
            }
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbMember', 'GET', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                pop.lbMemberInfo = data.content.lbMember;
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };


        pop.fn.editLbMember = function() {
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbMember', 'PUT', {lbMember:pop.lbMemberInfo});
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

        pop.fn.getlbMemberInfo(pop.member);

    })
;
