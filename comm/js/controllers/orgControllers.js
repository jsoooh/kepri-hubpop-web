'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $cookies, $mdDialog, $q, orgService, userSettingService, common, CONSTANTS) {
        _DebugConsoleLog("orgControllers.js : commOrgProjectsCtrl", 1);

        var ct = this;
        ct.orgProjects = [];
        ct.selectItemKey = 0;
        ct.userAuth = $scope.main.userAuth;
        ct.popup = $stateParams.popup;      //프로젝트생성팝업여부/로그아웃
        ct.schFilterText = "";
        ct.listType = "image";          //프로젝트 리스트 타입

        if (ct.popup == "logout") {
            $scope.main.loadingMainBody = true;
            common.logout();
            $scope.main.loadingMainBody = false;
            return;
        }

        ct.extendItem = function(evt) {
            //console.log('extendItem', evt);
            if ($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.changeItem = function(evt, itemKey) {
            //console.log('changeItem', evt);
            ct.selectItemKey = itemKey;
        };

        // portalOrg 선택 제거
        $scope.main.setPortalOrg(null);
        $scope.main.loadingMainBody = true;
        ct.schType = 'orgName';

        // 조직추가 시 상단에 조직명, 조직아이디 기본 '' 출력
        $scope.main.detailOrgName = '';

        ct.isBtnOperationRegistration = false; // 작업 등록 버튼 권한

        if ($scope.main.userAuth == 'M') { // 기업관리자, 프로젝트 책임자
            ct.isBtnOperationRegistration = true; // 작업 등록 버튼 권한
        } else if ($scope.main.userAuth == 'O') { // 조직관리자, 프로젝트 관리자
            ct.isBtnOperationRegistration = true; // 작업 등록 버튼 권한
        }

        /*Org 목록 조회*/
        ct.listOrgProjects = function () {
            orgService.changeUser = false;
            ct.orgProjects = [];
            $scope.main.loadingMainBody = true;
            var promise = orgService.getMyProjectOrgList($scope.main.sltProjectId);
            promise.success(function (data) {
                if (data && data.items && angular.isArray(data.items)) {
                    common.objectOrArrayMergeData(ct.orgProjects, angular.copy(data.items));
                    //console.log("ct.orgProjects : ", ct.orgProjects);
                    $scope.main.setListAllPortalOrgs(data.items);
                } else {
                    $scope.main.setListAllPortalOrgs();
                }
                //좌측메뉴 [프로젝트 생성] 클릭으로 넘어온 경우 바로 팝업 띄움. 2019.06.25
                if ($scope.main.userAuth == 'M' && ct.popup == 'popup') {
                    ct.addOrgProjectFormOpen();
                }
            });
            promise.error(function (data, status, headers) {
            });
            promise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.detailNgClick = function(orgItem) {
            $location.path('/comm/projects/projectDetail/' + orgItem.id);
        };

        /*프로젝트 생성 팝업창 오픈*/
        ct.addOrgProjectFormOpen = function($event) {
            //임시 알림 설정 2020.02.03
            //common.showDialogAlert("알림", "플랫폼 정책 변경에 따라 신규 프로젝트와 가상머신 생성을 제한하고 있습니다.\n자세한 문의는 관리자(042-865-6786, 042-865-5236)으로 문의하여 주시기 바랍니다."); return;
            var orgProject = {};
            orgProject.managerId    = $scope.main.userInfo.user_id;
            orgProject.managerName  = $scope.main.userInfo.user_name;
            orgProject.managerEmail = $scope.main.userInfo.email;

            orgProject.projectId = $scope.main.sltProjectId;

            var dialogOptions = {
                controller : "commAddOrgProjecFormCtrl",
                controllerAs: "pop",
                templateUrl : _COMM_VIEWS_ + "/org/popOrgProjectForm.html" + _VersionTail(),
                formName : "popOrgProjectForm",
                orgProject : orgProject,
                callBackFunction : ct.listOrgProjects
            };
            $scope.actionBtnHied = false;
            $scope.actionLoading = false;
            common.showCustomDialog($scope, $event, dialogOptions);
        };

        /*프로젝트명 변경 팝업화면 오픈*/
        ct.changeNameOrgProject = function ($event, org) {
            $scope.dialogOptions = {
                controller: "commChangeNameFormCtrl",
                callBackFunction: ct.listOrgProjects,
                org : org
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /* 프로젝트 목록 : 우측 메뉴 기능 */
        ct.changeOrgUser = function (org) {
            /* 사용자 변경을 선택해서 Detail로 넘어가는 경우에 true로 변경 */
            orgService.changeUser = true;
            $location.path('/comm/projects/projectDetail/' + org.id);
        };

        /* 사용자 탈퇴 추가 */
        ct.withdrawOrgProjectUser = function (org) {
            //해당 프로젝트 책임자는 탈퇴 불가
            if (org.managerId == $scope.main.userInfo.email) {
                common.showAlertWarning("해당 프로젝트 책임자는 탈퇴 불가합니다.");
                return;
            }
            var showConfirm = common.showConfirm($translate.instant('label.del'), org.orgName + ' ' + $translate.instant('message.mq_delete_account'));
            showConfirm.then(function() {
                ct.withdrawOrgProjectUserAction(org);
            });
        };

        /* 사용자 탈퇴 액션 추가 */
        ct.withdrawOrgProjectUserAction = function (org) {
            $scope.main.loadingMain = true;
            var user = {};
            user.email = $scope.main.userInfo.email;
            var promise = orgService.deleteOrgUser(org.id, user.email);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                ct.listOrgProjects();
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_delete_account'));
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_delete_account'));
            });
        };

        /* 즐겨찾기 추가 */
        ct.orgBookmarkAdd = function (org) {
            var showConfirm = common.showConfirm($translate.instant('label.add'), org.orgName + '' + $translate.instant('message.mq_bookmark'));
            showConfirm.then(function () {
                $scope.main.loadingMain = true;
                var promise = orgService.orgBookmarkAdd(org.id);
                promise.success(function (data) {
                    $scope.main.loadingMain = false;
                    ct.listOrgProjects();
                    common.showAlertSuccess($translate.instant('message.mi_egov_success_org_bookmark'));

                });
                promise.error(function (data) {
                    $scope.main.loadingMain = false;
                    common.showAlertError($translate.instant('message.mi_egov_fail_org_bookmark'));
                });
            })
        };

        /* 즐겨찾기 삭제 */
        ct.orgBookmarkDelete = function (org) {
            var showConfirm = common.showConfirm($translate.instant('label.del'), org.orgName + '' + $translate.instant('message.mq_unbookmark'));
            showConfirm.then(function () {
                $scope.main.loadingMain = true;
                var promise = orgService.orgBookmarkDelete(org.id);
                promise.success(function (data) {
                    $scope.main.loadingMain = false;
                    ct.listOrgProjects();
                    common.showAlertSuccess($translate.instant('message.mi_egov_success_org_unbookmark'));
                });
                promise.error(function (data) {
                    $scope.main.loadingMain = false;
                    common.showAlertError($translate.instant('message.mi_egov_fail_org_unbookmark'));
                });
            })
        };

        // 프로젝트 삭제전 체크
        ct.checkDeleteOrgProject = function ($event, orgItem) {
            if (!orgItem || ! orgItem.id || !orgItem.orgId) {
                common.showAlertWarning("조직 정보를 찾을 수 없습니다.");
                return;
            }
            // 프로젝트 서비스 조회
            var serviceList = ct.checkOrgProjectService(orgItem.id, orgItem.orgId);
            if (!serviceList) {
                return;
            }

            // 프로젝트 서비스 api promise 세팅
            var promiseArr = new Array();
            angular.forEach(serviceList, function (service) {
                if (service.promise)
                    promiseArr.push(service.promise);
            });

            $scope.main.loadingMainBody = true;
            $q.all(promiseArr).then(function() {
                var showAlertBoolean = false;
                for (var i = 0; i < serviceList.length; i++) {
                    if (serviceList[i].useYn != 'N') {
                        showAlertBoolean = true;
                        break;
                    }
                }
                if (showAlertBoolean) {
                    // 프로젝트 서비스 사용중 알람창
                    common.showDialogAlertHtml('알림', setDialogAlertHtml('success', serviceList), 'warning');
                } else {
                    // 프로젝트 삭제전 이름체크 및 삭제
                    $scope.main.popDeleteCheckName($event, '프로젝트', orgItem.orgName, ct.deleteOrgProjectAction, orgItem);
                }
            }).catch(function() {
                // 프로젝트 서비스 호출 오류 알림창
                common.showDialogAlertHtml('알림', setDialogAlertHtml('error', serviceList), 'warning');
            }).finally(function () {
                $scope.main.loadingMainBody = false;
            });

            // 알람 팝업창 html 세팅
            var setDialogAlertHtml = function (functionSuccess, serviceList) {
                var dialogAlertHtml = "";
                if (functionSuccess == 'success') {
                    dialogAlertHtml += '아래와 같이 사용 중인 서비스가 있습니다.';
                    dialogAlertHtml += '<br>사용중인 서비스 항목 삭제 후 프로젝트 삭제를 진행해 주세요.<br><br>';
                } else {
                    dialogAlertHtml = '아래 서비스 확인 중 에러가 있습니다.';
                    dialogAlertHtml += '<br>확인 후 진행해 주세요.<br><br>';
                }
                var serviceNameArr = new Array();
                angular.forEach(serviceList, function (service) {
                   if (functionSuccess == 'success' && service.useYn == 'Y') {
                       serviceNameArr.push(service.serviceName);
                   } else if (functionSuccess == 'error' && service.useYn == 'E') {
                        serviceNameArr.push(service.serviceName);
                   }
                });
                if (serviceNameArr.length > 0) {
                    for (let i = 0; i < serviceNameArr.length; i++) {
                        dialogAlertHtml += '<b>' + serviceNameArr[i] + '</b>';
                        if (i != serviceNameArr.length - 1) {
                            dialogAlertHtml += ', ';
                        }
                    }
                }
                return dialogAlertHtml;
            };
        };

        // 프로젝트 서비스 조회
        ct.checkOrgProjectService = function (id, orgId) {
            var serviceList = [
                {serviceCode : 'iaas', serviceName : '서버 가상화', useYn : 'N'},
                {serviceCode : 'gpu', serviceName : 'GPU 서버 가상화', useYn : 'N'},
                {serviceCode : 'paas', serviceName : 'App 실행 서비스', useYn : 'N'},
                {serviceCode : 'gis', serviceName : 'HUB-PoP GIS', useYn : 'N'},
                {serviceCode : 'vru', serviceName : 'AR/VR 공유서비스', useYn : 'N'},
                {serviceCode : 'hwu', serviceName : 'HiveBroker 서비스', useYn : 'N'},
                {serviceCode : 'aau', serviceName : 'AI-API 서비스', useYn : 'N'}
            ];

            // 서비스 항목에 usedYn, promise 세팅
            var setServiceUseYn = function(serviceCode, promise) {
                var service = common.objectsFindByField(serviceList, 'serviceCode', serviceCode);
                if (!promise || !service) {
                    return;
                }
                service.promise = promise;
                promise.success(function (data) {
                    if (serviceCode == 'iaas' || serviceCode == 'gpu') {    // 서버가상화, GPU 서버가상화
                        if (data && data.content && data.content.pk && data.content.pk.teamCode) {
                            service.useYn = 'Y';
                        }
                    } else if (serviceCode == 'paas') { // App 실행 서비스
                        if (data && data.guid) {
                            service.useYn = 'Y';
                        }
                    } else {    // 타사업자 서비스
                        if (data == 'Y') {
                            service.useYn = 'Y';
                        }
                    }
                });
                promise.error(function () {
                    service.useYn = 'E';
                });
            };

            // 서버 가상화
            var iaasAndGpuParams = {
                "orgCode" : $scope.main.sltProjectId.toString(),
                "teamCode" : orgId
            };
            setServiceUseYn('iaas', common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/org/one', 'GET', iaasAndGpuParams, 'application/x-www-form-urlencoded')));

            // Gpu 서버 가상화
            setServiceUseYn('gpu', common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/org/one', 'GET', iaasAndGpuParams, 'application/x-www-form-urlencoded')));

            // App 실행 서비스
            var paasParams = {
                urlPaths : {"name" : orgId},
                "depth" : 0
            };
            setServiceUseYn('paas', common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/name/{name}', 'GET', paasParams)));

            // 타사업자 파라미터
            var otherParam = {
                "PROJECT-ID" : id
            };
            // HUB-PoP GIS
            // setServiceUseYn('gis', common.retrieveResource(common.resourcePromise('/gis/confirmDeleteOrNot.do', 'GET', otherParam)));

            // AR/VR 공유서비스
            // setServiceUseYn('vru', common.retrieveResource(common.resourcePromise('/vru/confirmDeleteOrNot.do', 'GET', otherParam)));

            // HiveBroker 서비스
            // setServiceUseYn('hwu', common.retrieveResource(common.resourcePromise('/hwu/confirmDeleteOrNot.do', 'GET', otherParam)));

            // AI-API 서비스
            // setServiceUseYn('aau', common.retrieveResource(common.resourcePromise('/aau/confirmDeleteOrNot.do', 'GET', otherParam)));

            return serviceList;
        };

        // 조직 삭제 액션
        ct.deleteOrgProjectAction = function (orgItem) {
            $scope.main.loadingMainBody = true;
            var promise = orgService.deleteOrg(orgItem.id);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.org_del') + '(' + orgItem.orgName + ')', '해당 프로젝트를 삭제 처리 중 입니다.');
                ct.listOrgProjects();   //조직 목록 조회
            });
            promise.error(function (data, status) {
                $scope.main.loadingMainBody = false;
                if (status == 406) {
                    common.showAlertError($translate.instant('label.org_del') + '(' + orgItem.orgName + ')', '삭제 권한이 없습니다.');
                } else if (status == 403) {
                    common.showAlertErrorHtml($translate.instant('label.org_del') + '(' + orgItem.orgName + ')', '아래 시스템에서 사용중 입니다.');
                } else {
                    common.showAlertError('', data);
                }
            });
        };

        ct.listOrgProjects();   //조직 목록 조회
    })
    .controller('commFirstOrgProjectMainCtrl', function ($scope) {
        _DebugConsoleLog("orgControllers.js : commFirstOrgProjectMainCtrl", 1);

        var ct = this;
        ct.fn = {};

        ct.selectItemKey = 0;

        ct.userAuth  = $scope.main.userAuth;

        ct.fn.extendItem = function(evt) {
            //console.log('extendItem', evt);
            if($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.fn.changeItem = function(evt, itemKey) {
            //console.log('changeItem', evt);
            ct.selectItemKey = itemKey;
        };

        $scope.main.loadingMainBody = false;

    })
    .controller('commAddOrgProjecFormCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, ValidationService, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commAddOrgProjecFormCtrl", 1);

        var pop = this;

        pop.validationService = new ValidationService();

        pop.formName = $scope.dialogOptions.formName;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.title = $translate.instant("label.project_register");
        $scope.dialogOptions.okName = "생성";
        $scope.dialogOptions.closeName = "취소";

        pop.orgProject = $scope.dialogOptions.orgProject;

        $scope.actionBtnHied = false;
        $scope.actionLoading = false;

        $scope.popDialogOk = function () {
            pop.addOrgProject();
        };

        pop.btnClickCheck = false;
        pop.orgProjectDefaultQuota = function(projectId) {
            if(!projectId) {
                return;
            }
            var param = {};
            param['projectId'] = projectId;
            var promise = quotaService.listOrgQuotas(param);
            promise.success(function(data, status, headers) {
                pop.orgQuotas = data.items;
                pop.orgProject.orgQuotaId = '';
                if (pop.orgQuotas && pop.orgQuotas.length > 0) {
                    for (var i = 0; i < pop.orgQuotas.length; i++) {
                        if (pop.orgQuotas[i].defaultQuota == true) {
                            pop.orgProject.orgQuotaId = pop.orgQuotas[i].id;
                            break;
                        }
                    }
                    if (!pop.orgProject.orgQuotaId){
                        pop.orgProject.orgQuotaId = pop.orgQuotas[0].orgQuotaId;
                    }
                }
                if (!pop.orgProject.orgQuotaId){
                    common.showAlert('프로젝트 쿼터가 없어 프로젝트를 등록할 수 없습니다.');
                    common.mdDialogHide();
                }
            });
            promise.error(function(data, status, headers) {
                pop.defaultOrgQuotaId = '';
            });
        };

        pop.addOrgProject = function() {
            if (pop.btnClickCheck) return;
            pop.btnClickCheck = true;

            if (!pop.validationService.checkFormValidity($scope[pop.formName])) {
                pop.btnClickCheck = false;
                return;
            }

            var param           = {};
            param.orgManager    = {'email':pop.orgProject.managerEmail, 'userId':pop.orgProject.managerId};
            param.project       = {'id':pop.orgProject.projectId};
            param.quota         = {'id':pop.orgProject.orgQuotaId};
            param.description   = pop.orgProject.orgName;
            param.usePublicIp   = true;
            param.orgName       = pop.orgProject.orgName;

            $scope.main.loadingMainBody= true;

            var applyPromise = orgService.requestOrgCreate(param);
            applyPromise.success(function (data) {
                $scope.main.loadingMainBody=false;
                pop.btnClickCheck = false;
                common.mdDialogHide();
                //common.showAlert($translate.instant('label.org_add'), $translate.instant('message.mi_apply_org_after_apprv'));
                common.showAlert($translate.instant('label.org_add'), $translate.instant('message.mi_egov_success_common_insert'));
                if (angular.isFunction(pop.callBackFunction)) {
                    pop.callBackFunction();
                }
            });
            applyPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                pop.btnClickCheck = false;
                //common.showAlertError($translate.instant('label.org_add') + "(" + param.orgName + ")", data);
            });
        };

        $scope.validationOrgProjectName = function (orgProjectName) {
            var regexp = /[ㄱ-ㅎ가-힣0-9a-zA-Z.\-_]/;    //한글,숫자,영문,특수문자(.-_)
            var bInValid = false;
            var text = orgProjectName;
            var orgNameErrorString = "";                //문제되는 문자
            if (!text) return;
            for (var i=0; i<text.length; i++) {
                if (text.charAt(i) != " " && regexp.test(text.charAt(i)) == false) {
                    bInValid = true;
                    orgNameErrorString += text.charAt(i);
                }
            }
            if (bInValid) {
                return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
            } else {
                return {isValid : true};
            }
        };

        pop.orgProjectDefaultQuota(pop.orgProject.projectId);
    })
    .controller('commOrgProjectCreateCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $cookies, $mdDialog, orgService, quotaService, userSettingService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("orgControllers.js : commOrgProjectCreateCtrl", 1);

        var ct = this;
        $scope.main.loadingMainBody = false;

        ct.fn = {};
        ct.orgData = {};

        ct.formName = "orgCreateForm";
        ct.orgData.personal = "team";
        ct.orgIdValidationResult = false;
        ct.quotaPlanGroups = [{id:"", name:"-- 유형 선택 --"}];
        ct.quotaPlans = [{id:"", code:"-- 세부 유형 선택 --"}];
        ct.orgData.quotaPlanGroup = ct.quotaPlanGroups[0];
        ct.orgData.quotaPlan = ct.quotaPlans[0];

        ct.attachFile = null;         // 과제계획서 파일
        ct.uploader = common.setDefaultFileUploader($scope);
        ct.uploader.onAfterAddingFile = function(fileItem) {
            $('#attachFile').val(fileItem._file.name);
            ct.attachFile = null;
            $timeout(function () {
                ct.attachFile = fileItem;
            }, 0);
        };

        // 프로젝트 개인 유형 상세 쿼터값
        ct.personQuotaItems = [
            {id : 3, value : 4},        // 서버 가상화 vCore 개수
            {id : 4, value : 8},        // 서버 가상화 메모리
            {id : 5, value : 100},      // 서버 가상화 OS 디스크(HDD)
            {id : 6, value : 100},      // 서버 가상화 데이터 디스크(HDD)
            {id : 12, value : 30},      // 쿠버네티스 공통 클러스터 POD 개수
            {id : 13, value : 100},     // 쿠버네티스 외부 볼륨 디스크(HDD)
            {id : 18, value : 20}       // 서버리스 컴퓨팅 Function 개수
        ];

        // 프로젝트 ID 유효성 검사 및 중복체크
        ct.orgIdCustomValidationCheck = function(orgId) {
            var regexp = /[0-9a-zA-Z\-_]/;    //숫자,영문,특수문자(-_)
            var bInValid = false;
            var text = orgId;
            var orgNameErrorString = "";      //문제되는 문자
            if (!text) return;
            for (var i=0; i<text.length; i++) {
                if (text.charAt(i) != "" && regexp.test(text.charAt(i)) == false) {
                    bInValid = true;
                    orgNameErrorString += text.charAt(i);
                }
            }
            if (bInValid) {
                return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
            } else {        //프로젝트 ID 중복체크
                var param = {
                    org_id : orgId.trim()
                };
                var returnPromise = orgService.orgIdValidationCheck(param);
                returnPromise.success(function (data) {
                    if (data) {
                        ct.orgIdValidationResult = true;
                    } else {
                        ct.orgIdValidationResult = false;
                    }
                });
                returnPromise.error(function (data) {
                    common.showAlert("message",data.message);
                });
                if (ct.orgIdValidationResult) {
                    return {isValid : false, message: "이미 사용하고 있는 프로젝트 ID 입니다."};
                } else {
                    return {isValid : true};
                }
            }
        };

        // 프로젝트 이름 유효성 검사
        ct.orgNameCustomValidationCheck = function (orgName) {
            var regexp = /[ㄱ-ㅎ가-힣0-9a-zA-Z.\-_]/;    //한글,숫자,영문
            var bInValid = false;
            var text = orgName;
            var orgNameErrorString = "";             //문제되는 문자
            if (!text) return;
            for (var i=0; i<text.length; i++) {
                if (text.charAt(i) != " " && regexp.test(text.charAt(i)) == false) {
                    bInValid = true;
                    orgNameErrorString += text.charAt(i);
                }
            }
            if (bInValid) {
                return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
            } else {
                return {isValid : true};
            }
        };

        // 프로젝트 쿼터 유형 조회
        ct.fn.getQuotaPlanGroups = function() {
            var params = {
                schType : "name",
                schText : ""
            };
            var returnPromise = quotaService.listQuotaPlanGroups(params);
            returnPromise.success(function (data) {
                ct.quotaPlanGroups.push.apply(ct.quotaPlanGroups, data);
            });
            returnPromise.error(function (data) {
                common.showAlertError("message", data.message);
            });
        };

        // 프로젝트 쿼터 세부 유형 조회
        ct.fn.getQuotaPlans = function() {
            ct.quotaPlansData = [];
            var params = {
                schGroupId : 0,
                schType : "name"
            };
            var returnPromise = quotaService.listQuotaPlan(params);
            returnPromise.success(function (data) {
                ct.quotaPlansData = data;
            });
            returnPromise.error(function (data) {
                common.showAlertError("message", data.message);
            });
        };

        // 상세 쿼터 조정 항목 조회
        ct.fn.getQuotaItems = function() {
            ct.quotaItems = [];
            var params = {
                schGroupId : 0,
                schType : "name",
                schText : ""
            };
            var returnPromise = quotaService.listQuotaItem(params);
            returnPromise.success(function (data) {
                ct.quotaItems = data;
            });
            returnPromise.error(function (data) {
                common.showAlertError("message",data.message);
            });
        };

        // 상세쿼타조정 값 조회
        ct.fn.getQuotaItemValues = function(quotaPlanId) {
            ct.quotaItemValues = [];
            if(!quotaPlanId) {
                return;
            }
            var returnPromise = quotaService.listQuotaItemValue(quotaPlanId);
            returnPromise.success(function (data) {
                ct.quotaItemValues = data;
                // 상세 쿼터 아이템 값 매칭
                angular.forEach(ct.quotaItems, function (quotaItem) {
                    quotaItem.value = "";
                    for (var i=0; i < ct.quotaItemValues.length; i++) {
                        if (quotaItem.id == ct.quotaItemValues[i].orgQuotaItem.id) {
                            quotaItem.value = ct.quotaItemValues[i].value;
                            break;
                        }
                    }
                });
            });
            returnPromise.error(function (data) {
                common.showAlertError("message",data.message);
            });
        };

        // 프로로젝트 유형 변경
        ct.fn.changeOrgCase = function() {
            var calendarButton = $('.datepickerWrap').find('.dtp-ig');

            // 쿼터 선택 및 값 초기화
            ct.orgData.quotaPlanGroup = ct.quotaPlanGroups[0];
            ct.fn.changeQuotaPlanGroup(ct.orgData.quotaPlanGroup);

            if(ct.orgData.personal == "personal") {
                ct.orgData.startDate = moment().format('YYYY-MM-DD');
                ct.orgData.endDate = moment('9999-12-31').format('YYYY-MM-DD');
                ct.orgData.cost = "";           // 개발비 항목 초기화
                ct.appFileItem = {};            // 과제계획서 첨부 초기화
                ct.orgData.description = "";    // 설명 초기화
                // 개인유형 상세 쿼터 아이템값 매칭
                angular.forEach(ct.quotaItems, function(item) {
                    for (var i=0; i<ct.personQuotaItems.length; i++) {
                        if (item.id == ct.personQuotaItems[i].id) {
                            item.value = ct.personQuotaItems[i].value;
                            break;
                        }
                    }
                });
                calendarButton.hide();
            } else {
                ct.orgData.startDate = moment().format('YYYY-MM-DD');
                ct.orgData.endDate = moment().subtract(1,'days').add(1,'month').format('YYYY-MM-DD');
                calendarButton.show();
            }
        };

        // 쿼터 유형선택 변경시 쿼터 세부 유형 리스트
        ct.fn.changeQuotaPlanGroup = function(quotaPlanGroup) {
            if (!quotaPlanGroup) {
                return;
            }
            // 쿼터 세부유형 선택 초기화
            ct.quotaPlans.length = 1;
            ct.orgData.quotaPlan = ct.quotaPlans[0];

            // 쿼터 세부유형 항목 재배치
            angular.forEach(ct.quotaPlansData, function (value) {
                if (value.orgQuotaPlanGroup != null && value.orgQuotaPlanGroup.id == quotaPlanGroup.id) {
                    ct.quotaPlans.push(value);
                }
            });
            // 쿼터 상세값 초기화
            ct.fn.changeQuotaPlan();
        };

        // 쿼터 세부 유형선택 변경시 쿼터 상세값 매칭
        ct.fn.changeQuotaPlan = function (orgQuotas) {
            if (orgQuotas && orgQuotas.id) {
                ct.orgData.paasQuotaGuid = orgQuotas.paasQuotaGuid;
                ct.fn.getQuotaItemValues(orgQuotas.id);
            } else {    // 쿼터 세부 유형선택 및 쿼터 상세값 초기화
                ct.orgData.paasQuotaGuid = "";
                angular.forEach(ct.quotaItems, function (value) {
                    value.value = "";
                });
            }
        };

        // 개인 프로젝트 설정 건수 조회
        ct.fn.getPersonalProjectCount = function () {
            ct.personalProjectCnt = 0;
            var returnPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.personalProjectCnt);
            returnPromise.success(function (data) {
                data = userSettingService.userSettingParse(data);
                if (data && data.contents && data.contents.projectCnt) {
                    ct.personalProjectCnt = data.contents.projectCnt;
                }
            });
            returnPromise.error(function (data) {
                common.showAlertError("message", data.message)
            });
        };

        // 사용자가 생성한 개인프로젝트 건수 조회
        ct.fn.getMyPersonalCnt = function () {
            ct.myPersonalCnt = 0;
            var returnPromise = orgService.getMyPersonalCnt();
            returnPromise.success(function (data) {
                if (data) {
                    ct.myPersonalCnt = data;
                }
            });
            returnPromise.error(function (data) {
                common.showAlertError("message", data.message);
            });
        };

        // paas 프로젝트 쿼터 조회
        ct.fn.getPaasQuotas = function (currentPage) {
            $scope.main.loadingMainBody = true;
            ct.paasQuotas = [];
            if (!currentPage) {
                currentPage = 1;
            }
            var returnPromise = quotaService.listPaasQuotas(10, currentPage, null);
            returnPromise.success(function (data) {
                //ct.paasQuotas = data.content;
                angular.forEach(data.content, function(paasQuota) {
                    if (paasQuota.name.indexOf("prj-") > -1) {
                        ct.paasQuotas.push(paasQuota);
                    }
                });
            });
            returnPromise.error(function (data) {
                common.showAlertError("message", data.message);
            });
            returnPromise.finally(function () {
                $scope.main.loadingMainBody = false;
            });
        };

        // 프로젝트 신청 유효성 검사
        ct.fn.createOrgValidationCheck = function() {
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                common.showAlertError("항목", "잘못된 값이 있거나 필수사항을 입력하지 않았습니다.");
                return false;
            }
            if (!ct.orgData.startDate || !ct.orgData.endDate) {
                common.showAlertError("날짜", "날짜 값이 없습니다.");
                return false;
            }
            var quotaItemList = ct.quotaItems.filter(function (value) {
                if (value.value) return value;
            });
            if (quotaItemList.length == 0) {
                common.showAlertError("쿼터", "상세 쿼터 설정은 필수사항입니다.");
                return false;
            }
            return true;
        };

        // 프로젝트 신청
        ct.fn.createOrg = function () {
            $scope.main.loadingMainBody = true;

            // 프로젝트 신청 유효성 검사
            if (!ct.fn.createOrgValidationCheck()) {
                $scope.main.loadingMainBody = false;
                return;
            }
            var params = {};
            params['orgId'] = ct.orgData.orgId.trim();
            params['orgName'] = ct.orgData.orgName.trim();
            params['personal'] = ct.orgData.personal == "personal" ? true : false;
            params['startDate'] = ct.orgData.startDate;
            params['endDate'] = ct.orgData.endDate;
            params['cost'] = !ct.orgData.cost ? 0 : ct.orgData.cost;
            params['description'] = !ct.orgData.description ? "" : ct.orgData.description;
            params['orgQuotaPlanId'] = (!ct.orgData.quotaPlan || !ct.orgData.quotaPlan.id) ? 0 : ct.orgData.quotaPlan.id;
            params['paasQuotaGuid'] = !ct.orgData.paasQuotaGuid ? "" : ct.orgData.paasQuotaGuid;
            var orgQuotaValues = [];
            angular.forEach(ct.quotaItems, function (value) {
                if (value.value)
                    orgQuotaValues.push(value.id + "/" + value.value);
            });
            params['orgQuotaValues'] = orgQuotaValues;
            if (ct.attachFile != null) {
                params['attachFile'] = ct.attachFile._file;
            }
            var returnPromise = orgService.requestOrgCreate(params);
            returnPromise.success(function () {
                common.showAlertSuccess("프로젝트 신청 성공", "프로젝트 신청을 완료했습니다.");
                $location.path('/comm/projects');
            });
            returnPromise.error(function (data) {
                common.showAlertError("message", data.message);
            });
            returnPromise.finally(function () {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.getQuotaPlanGroups();         // 쿼터 그룹 유형 조회
        ct.fn.getQuotaPlans();              // 쿼터 세부 유형 조회
        ct.fn.getQuotaItems();              // 쿼터 상세 항목 조회
        ct.fn.changeOrgCase();              // 프로젝트 유형 변경 기본설정
        ct.fn.getPaasQuotas();              // paas 프로젝트 쿼터 조회
        ct.fn.getPersonalProjectCount();    // 개인 프로젝트 설정 건수 조회
        ct.fn.getMyPersonalCnt();           // 사용자가 생성한 개인프로젝트 건수 조회
    })
    .controller('commChangeNameFormCtrl', function ($scope, $location, $state, $stateParams,$mdDialog,$translate, $q,ValidationService, orgService, common) {
        _DebugConsoleLog("orgControllers.js : commChangeNameFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = angular.copy($scope.dialogOptions.org);

        pop.formName = "changeNameForm";
        pop.validationService   = new ValidationService({controllerAs: pop});
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popOrgProjectChangeNameForm.html" + _VersionTail();
        $scope.dialogOptions.title = "프로젝트명 변경";
        pop.method = "PUT";

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if(!pop.validationService.checkFormValidity(pop[pop.formName])) {
                return common.showAlertWarning("잘못된 프로젝트 이름 형식입니다.");
            }
            pop.fn.createOrgProjectNameAction();
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        // 프로젝트 이름 유효성 검사
        pop.fn.orgNameCustomValidationCheck = function (orgName) {
            var regexp = /[ㄱ-ㅎ가-힣0-9a-zA-Z.\-_]/;    //한글,숫자,영문
            var bInValid = false;
            var text = orgName;
            var orgNameErrorString = "";             //문제되는 문자
            if (!text) return;
            for (var i=0; i<text.length; i++) {
                if (text.charAt(i) != " " && regexp.test(text.charAt(i)) == false) {
                    bInValid = true;
                    orgNameErrorString += text.charAt(i);
                }
            }
            if (bInValid) {
                return {isValid : false, message: orgNameErrorString + "는 입력 불가능한 문자입니다."};
            } else {
                return {isValid : true};
            }
        };

        /* 20.04.01 - 프로젝트명 변경 액션 by ksw */
        pop.fn.createOrgProjectNameAction = function () {
            var params = {
                orgName: pop.data.orgName
            };

            $scope.main.loadingMain = true;
            var promise = orgService.updateOrgName(pop.data.id, params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_update'));
                common.mdDialogHide();
                /* 성공후 리스트에 바로 적용 */
                $scope.dialogOptions.org.orgName = params.orgName;
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_update'));
            });
        };
    })
;
