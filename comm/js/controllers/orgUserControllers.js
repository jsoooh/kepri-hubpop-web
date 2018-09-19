'use strict';

angular.module('portal.controllers')
    .controller('commOrgUsersCtrl', function ($scope, $location, $state, $stateParams, $translate, ValidationService, orgService, common, cache) {
        _DebugConsoleLog("orgControllers.js : commOrgUsersCtrl", 1);

        var ct = this;

        ct.paramId = $stateParams.orgId;
        if (ct.paramId) ct.paramId = ct.paramId.replace(":orgId","");

        ct.orgs = [];

        //시스템관리자/기업관리자
        ct.isAdmin          = false;            //시스템관리자
        ct.isManager        = false;            //기업관리자
        ct.isThisOrgManager = false;            //현 조직관리자
        ct.userAuth = common.getUserAuth();     //권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자
        if(ct.userAuth == "A"){
            ct.isAdmin = true;
        }else if(ct.userAuth == "M"){
            ct.isManager = true;
        }
        ct.userEmail = common.getUser().email;
        ct.isBtnShow = false;                   //버튼 show 여부 : [관리자변경]/[사용자추가]/[사용자초대]

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.orgData        = {};
        pop.companyUsers   = [];
        pop.selCompanyUser = {};

        ct.selOrg = {};

        //관리자변경 팝업에서 사용할 user목록
        $scope.orgUserList0 = [];

        /*조직 콤보 조회:로그인 사용자 관련*/
        ct.getOrgList = function () {
            var orgPromise = orgService.getOrgList(cache.getUser().user_id);
            orgPromise.success(function(data, status, headers) {
                ct.orgs = data.items;
                if(!ct.paramId) {
                    ct.selOrg = ct.orgs[0];
                }else{
                    for(var i=0; i<ct.orgs.length; i++){
                        if(ct.paramId == ct.orgs[i].id){
                            ct.selOrg = ct.orgs[i];
                            break;
                        }
                    }
                }

                if(data.itemCount > 0) {
                    ct.getUserList();
                }else{
                    ct.pageOptions.total = 0;
                }
            });
            orgPromise.error(function (data, status, headers) {
                common.showAlertError("",data);
            });
        };

        /*조직 콤보 조회:로그인 사용자 관련*/
        ct.getOrgList();

        ct.getOrg = function () {
            var orgPromise = orgService.getOrg(ct.paramId);
            orgPromise.success(function(data, status, headers) {
                ct.selOrg = data;
                if(ct.selOrg.orgId) {
                    ct.getUserList();
                }else{
                    ct.pageOptions.total = 0;
                }
            });
            orgPromise.error(function (data, status, headers) {
                common.showAlertError("",data);
            });
        };

        /*조직 사용자 목록 조회*/
        ct.getUserList = function () {
            if(!ct.selOrg.id) return;
            $scope.main.loadingMainBody = true;
            ct.isThisOrgManager = false;            //현 조직관리자
            ct.isBtnShow        = false;            //버튼 show 여부 : [관리자변경]/[사용자추가]/[사용자초대]

            var orgPromise = orgService.listOrgUsers(ct.selOrg.id);
            orgPromise.success(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                angular.forEach(data.items, function(userItem) {
                    //조직관리자이고 org.statusCode : done/change_done 일 때 버튼 활성화
                    if (userItem.email == ct.userEmail && userItem.isAdmin && userItem.orgStatusCode.indexOf("done")>-1) {
                        ct.isThisOrgManager = true;     //현 조직관리자
                        return;
                    }
                });

                /*기능버튼 활성화 여부*/
                if (ct.isManager || ct.isAdmin || ct.isThisOrgManager) {
                    ct.isBtnShow        = true;         //버튼 show 여부 : [관리자변경]/[사용자추가]/[사용자초대]
                }

                ct.orgUsers = data.items;
                angular.copy(ct.orgUsers, $scope.orgUserList0);
                ct.pageOptions.total = data.counts;
            });
            orgPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError("조직 사용자 목록 조회", data);
            });
        };

        /*[관리자변경]클릭 시 이벤트*/
        ct.clickChgMgr = function ($event) {

            var dialogOptions = {
                title : $translate.instant("label.mngr_change"),
                form : {
                    name: "changeManagerForm",
                    options: ""
                },
                dialogClassName : "modal-dialog",
                templateUrl: _COMM_VIEWS_ + "/org/popOrgManagerForm.html" + _VersionTail(),
                okName : $translate.instant("label.change")
            };
            pop.orgUserList0 = angular.copy($scope.orgUserList0);
            pop.orgUserData = {};

            for(var i=0; i<pop.orgUserList0.length; i++){
                if(pop.orgUserList0[i].isAdmin){
                    pop.orgUserData.userSelected   = pop.orgUserList0[i];
                    pop.orgUserData.adminUserEmail = pop.orgUserList0[i].email;
                }
            }
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.changeManager(pop.orgUserData);
            };
        };

        /*관리자 변경 팝업 [확인]*/
        pop.changeManager = function(popData) {
            if (!popData.userSelected) {
                alert($translate.instant("message.mi_dont_select_mngr"));
                angular.element("changeManagerForm.user").focus();
                return;
            }
            if(popData.adminUserEmail == popData.userSelected.email){
                alert("기존 관리자와 동일합니다.");
                return;
            }

            var param = {};
            var orgManager      = {'email':popData.userSelected.email};
            var company         = {'companyId':ct.selOrg.company.companyId};
            param['orgManager'] = orgManager;
            param['company']    = company;
            param['id']         = ct.selOrg.id;
            param['orgId']      = ct.selOrg.orgId;
            param['mode']       = "U";

            $scope.actionLoading = true;
            var orgPromise = orgService.changeOrgManager(ct.selOrg.id, param);
            orgPromise.success(function (data, status, headers) {
                $scope.actionLoading = false;
                $scope.popHide();

                /*조직 사용자 목록 조회*/
                ct.getUserList();
            });
            orgPromise.error(function (data, status, headers) {
                $scope.actionLoading = false;
                if(status == 404) {
                    data = $translate.instant('message.mi_dont_register_user');
                }
                if(status == 406) {
                    data = $translate.instant('message.mi_wrong_user_company');
                }
                common.showAlertError($translate.instant("label.mngr_change"), data);
            });
        };

        /*
         * 사용자 [추가]/[초대] 클릭 시 이벤트
         *   add/invite
         * */
        ct.clickBtn = function ($event, btnId) {
            pop.chgEmail = "";
            pop.chgName  = "";
            pop.btnId    = btnId;

            var sTitle = $translate.instant("label.user_add");

            var dialogOptions = {
                title : sTitle,
                form : {
                    name: "orgUserAddForm",
                    options: ""
                },
                dialogClassName : "modal-dialog",
                templateUrl: _COMM_VIEWS_ + "/org/popOrgUserAddForm.html" + _VersionTail(),
                okName : $translate.instant("label.confirm")
            };
            pop.orgUserList0 = angular.copy($scope.orgUserList0);
            pop.orgUserData = {};

            //[사용자 추가] 일 때 조회 후 목록 나타내기
            if (btnId == "add"){    //[사용자 추가]

                var orgPromise = orgService.listCompUsers();
                orgPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;

                    pop.selCompanyUser = {};
                    pop.companyUsers = data.items;

                    //showPopUp($event, dialogOptions);
                    common.showDialog($scope, $event, dialogOptions);
                    $scope.popDialogOk = function () {
                        pop.userAdd(pop.selCompanyUser);
                    };
                });
                orgPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError("조직 사용자 목록 조회", data);
                });

            }else {                 //[사용자 초대]
                //showPopUp(btnId, $event, dialogOptions);
                common.showDialog($scope, $event, dialogOptions);
                $scope.popDialogOk = function () {
                    pop.userAdd(pop.orgUserData);
                };
            }
        };

        function showPopUp(sGb, $event, dialogOptions){
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            if(sGb == "add") {       //추가
                $scope.popDialogOk = function () {
                    pop.userAdd(pop.selCompanyUser);
                };
            }else{                 //초대
                $scope.popDialogOk = function () {
                    pop.userAdd(pop.orgUserData);
                };
            }
        }

        /*
         * 사용자 추가 팝업 [확인]
         * */
        pop.userAdd = function(popData) {
            var sTitle = $translate.instant("label.user_add");

            popData.chgEmail = popData.email;

            if(!popData || !popData.chgEmail){
                return;
            }

            //기존 사용자와 비교
            for(var i=0; i<$scope.orgUserList0.length; i++){
                if($scope.orgUserList0[i].email == popData.chgEmail){
                    common.showAlert(sTitle, "해당 사용자는 추가된 상태입니다.");
                    return;
                }
            }

            var param = {'orgId': ct.selOrg.orgId
                ,'email': popData.chgEmail
                ,'name': popData.chgName
                ,'type':""};


            param.type = "add"; //[추가]

            $scope.actionLoading = true;
            var orgPromise = orgService.orgUserAdd(ct.selOrg.id, param);
            orgPromise.success(function (data, status, headers) {
                $scope.actionLoading = false;
                common.showAlert(sTitle, "사용자 추가 되었습니다.");

                /*조직 사용자 목록 조회*/
                ct.getUserList();
            });
            orgPromise.error(function (data, status, headers) {
                $scope.actionLoading = false;
                if (status == 404) {
                    common.showAlertError(sTitle, $translate.instant('message.mi_dont_register_user'));
                }
                if (status == 406) {
                    common.showAlertError(sTitle, $translate.instant('message.mi_wrong_user_company'));
                }
            });
        };

        /*사용자 삭제*/
        ct.deleteUser = function (delUser) {
            if(delUser.isAdmin){
                common.showAlert($translate.instant('label.user_del') + "(" + delUser.orgId + " : " + delUser.email + ")", "관리자는 삭제 불가합니다.");
                return;
            }
            var showConfirm = common.showConfirm($translate.instant('label.user_del') + "(" + delUser.orgId + " : " + delUser.email + ")", $translate.instant('message.mq_delete_user'));
            showConfirm.then(function () {

                $scope.main.loadingMainBody = true;
                var orgPromise = orgService.deleteOrgUser(delUser.id, delUser.email);
                orgPromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlert($translate.instant('label.user_del') + "(" + delUser.orgId + " : " + delUser.email + ")", $translate.instant('message.mi_delete'));
                    /*조직 사용자 목록 조회*/
                    ct.getUserList();
                });
                orgPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if(status == 404) {
                        data = $translate.instant('message.mi_dont_register_user');
                    }
                    if(status == 406) {
                        data = $translate.instant('message.mi_wrong_user_company');
                    }
                    common.showAlertError($translate.instant("label.user_del"), data);
                });
            });
        };

    })
;
