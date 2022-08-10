'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $q, $interval, ValidationService, common, cache, orgService, portal, quotaService, memberService, CONSTANTS) {
        _DebugConsoleLog('orgDetailControllers.js : commOrgProjectDetailCtrl', 1);

        var ct = this;

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        ct.paramId = $stateParams.orgId;
        // ct.isOrgManager = false;     // 공통 컨트롤러 에서 처리
        /* 20.04.24 - 프로젝트 목록 : 우측 메뉴 기능 by ksw */
        /* 사용자 변경을 통해 DetailController로 넘어올 경우 구성원 탭 선택(기본은 대시보드) */
        if (orgService.changeUser) {
            ct.sltInfoTab = 'member';
        } else {
            ct.sltInfoTab = 'dashboard';
        }

        ct.isQuotaChange = true;        //쿼터변경요청 가능 여부, 첫건이 '요청'상태일 때 요청불가
        ct.loadQuotaHistory = false;    //쿼터변경요청 조회여부
        ct.loadOrgQuotas = false;       //쿼터값(미터링포함) 조회여부
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };
        ct.pageOptions2 = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        // 탭 변경
        ct.changeSltInfoTab = function (sltInfoTab) {
            ct.sltInfoTab = sltInfoTab;

            if (sltInfoTab == 'resource') {
                // ct.listPaasQuotas(); // PaaS 사용않함 2021.05.24
                //ct.listQuotaHistories();
                //ct.listOrgQuotaValues();
                ct.listQuotaHistories();
                ct.listOrgQuotas(); //org_quotas 조회 : 쿼터/미터링값 함께 조회
            }
        };

        ct.getDetailTenantByName = function(projectId, orgId, qDefer) {
            var tenantPromise = portal.portalOrgs.getTenantByName(projectId, orgId);
            tenantPromise.success(function (data) {
                if (data.content && data.content.pk && data.content.pk.orgCode) {
                    data.content.orgCode = data.content.pk.orgCode;
                    data.content.teamCode = data.content.pk.teamCode;
                }
                $scope.main.userTenant = {};
                $scope.main.userTenantId = "";
                $scope.main.uaerTenantDisplayName = "";
                if (angular.isObject(data.content) && data.content.tenantId) {
                    $scope.main.userTenant = data.content;
                    $scope.main.userTenantId = data.content.tenantId;
                    $scope.main.userTenant.id = data.content.tenantId;
                    $scope.main.userTenant.korName = $scope.main.sltPortalOrg.orgName;
                    $scope.main.uaerTenantDisplayName = $scope.main.userTenant.korName;
                    common.setUserTenantId($scope.main.userTenantId);
                } else {
                    common.clearUserTenantId();
                }
                qDefer.resolve(data.content);
            });
            tenantPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                qDefer.reject(data);
            });
        };

        ct.getGpuDetailTenantByName = function(projectId, orgId, qDefer) {
            var tenantPromise = portal.portalOrgs.getGpuTenantByName(projectId, orgId);
            tenantPromise.success(function (data) {
                $scope.main.userTenantGpu = {};
                $scope.main.userTenantGpuId = "";
                $scope.main.userTenantGpu.id = "";
                if (angular.isObject(data.content) && data.content.tenantId) {
                    $scope.main.userTenantGpu = data.content;
                    $scope.main.userTenantGpuId = data.content.tenantId;
                    $scope.main.userTenantGpu.id = data.content.tenantId;
                    common.setGpuUserTenantId($scope.main.userTenantGpuId);
                } else {
                    common.clearGpuUserTenantId();
                }
                qDefer.resolve(data.content);
            });
            tenantPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                qDefer.reject(data);
            });
        };

        ct.getDetailOrganizationByName = function(orgId, qDefer) {
            var organizationPromise = portal.portalOrgs.getOrganizationByName(orgId);
            organizationPromise.success(function (data) {
                if ($scope.main.sltPortalOrg && $scope.main.sltPortalOrg.orgId) {
                    $scope.main.setOrganization(data);
                } else {
                    $scope.main.setOrganization(null);
                }
                qDefer.resolve(data);
            });
            organizationPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                qDefer.reject(data);
            });
        };

        // Organization 값 셋팅
        ct.setDetailPortalOrg = function(portalOrg) {
            if (angular.isObject(portalOrg) && portalOrg.id) {
                common.setPortalOrgKey(portalOrg.id);
                common.setTeamCode(portalOrg.orgId);
                $scope.main.sltPortalOrg = portalOrg;
                $scope.main.sltPortalOrgId = portalOrg.id;
                $scope.main.sltPortalOrgIsActive = portalOrg.isActive;
                $scope.main.sltPortalOrgDisplayName = portalOrg.orgName;
                $scope.main.sltPortalOrgMyRoleName = portalOrg.myRoleName;
                $scope.main.setUserSltProjectOrg(portalOrg.id);

                var qDefers = [];

                if ($scope.main.sltPortalOrg.isUseIaas) {
                    qDefers.push($q.defer());
                    ct.getDetailTenantByName($scope.main.sltProjectId, $scope.main.sltPortalOrg.orgId, qDefers[qDefers.length-1]);
                }
                if ($scope.main.sltPortalOrg.isUseGpu) {
                    qDefers.push($q.defer());
                    ct.getGpuDetailTenantByName($scope.main.sltProjectId, $scope.main.sltPortalOrg.orgId, qDefers[qDefers.length-1]);
                }
                <!-- PaaS 사용않함 2021.05.24 -->
                /*if ($scope.main.sltPortalOrg.isUsePaas) {
                    qDefers.push($q.defer());
                    ct.getDetailOrganizationByName($scope.main.sltPortalOrg.orgId, qDefers[qDefers.length-1])
                }*/
                var allQDefer = $q.all(qDefers);
                allQDefer.then(function (datas) {
                    $scope.main.loadingMainBody = false;
                });
            } else {
                if ($scope.main.sltPortalOrgId) {
                    common.clearPortalOrgKey();
                    $scope.main.sltPortalOrg = {};
                    $scope.main.sltPortalOrgId = "";
                    $scope.main.sltPortalOrgIsActive = false;
                    $scope.main.sltPortalOrgDisplayName = "";
                    $scope.main.sltPortalOrgMyRoleName = "";
                    $scope.main.setUserTenants(null, null);
                    $scope.main.setOrganization(null);
                }
            }
        };

        ct.changeDetailPortalOrg = function (portalOrg) {
            ct.setDetailPortalOrg(portalOrg);
            if (angular.isObject(portalOrg) && portalOrg.id) {
            } else {
                common.goHomePath();
            }
        };

        // 조직 정보 조회
        ct.getOrgProject = function () {
            ct.searchFirst = false;
            if (!$scope.main.reloadTimmer['getOrgProject_' + ct.paramId]) {
                $scope.main.loadingMainBody = true;
                ct.searchFirst = true;
            }
            var orgPromise = orgService.getOrg(ct.paramId);
            orgPromise.success(function (data) {
                //생성 완료되지 않은 경우 재조회. 2019.07.29
                if (data.statusCode == "creating") {
                    if (ct.searchFirst) {
                        common.showAlertWarning("프로젝트 생성 중입니다.");
                    }
                    $scope.main.reloadTimmer['getOrgProject_' + ct.paramId] = $timeout(function () {
                        console.log("재조회 : getOrgProject_" + ct.paramId);
                        ct.getOrgProject();
                    }, 2000);
                } else {
                    //$scope.main.loadingMainBody = false;
                    if ($scope.main.reloadTimmer['getOrgProject_' + ct.paramId]) {
                        $timeout.cancel($scope.main.reloadTimmer['getOrgProject_' + ct.paramId]);
                        $scope.main.reloadTimmer['getOrgProject_' + ct.paramId] = null;
                    }
                    ct.selOrgProject = data;
                    // 공통 컨트롤러 에서 처리
                    /*if (ct.selOrgProject.myRoleName == 'OWNER' || ct.selOrgProject.myRoleName == 'ADMIN') {
                        ct.isOrgManager = true;
                    }*/
                    ct.changeDetailPortalOrg(data);
                    if (ct.sltOrgId == null) {
                        ct.sltOrgId = ct.selOrgProject.orgId;
                        ct.getMeteringHourlys(ct.sltOrgId);
                    }
                }
            });
            orgPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 이미지 변경
        ct.createOrgProjectIcon = function($event) {
            var dialogOptions = {
                title : '프로젝트 이미지 변경',
                formName : 'popThumModifyForm',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgIcon.html' + _VersionTail(),
                okName : '업로드'
            };
            common.showDialog($scope, $event, dialogOptions);

            ct.uploader = common.setDefaultFileUploader($scope);
            ct.uploader.onAfterAddingFile = function(fileItem) {
                $('#userfile').val(fileItem._file.name);
                ct.uploadedNoticeFile = null;
                $timeout(function () {
                    ct.uploadedNoticeFile = fileItem;
                }, 0);
            };

            $scope.popDialogOk = function() {
                ct.createOrgProjectIconAction();
            };
            
            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };
        };

        // 이미지 변경 액션
        ct.createOrgProjectIconAction = function () {
            if (!ct.uploadedNoticeFile || !ct.uploadedNoticeFile._file) {
                common.showAlertWarning('프로젝트 로고를 선택하십시오.');
                return;
            }

            var body = {};
            body.iconFile = ct.uploadedNoticeFile._file;

            $scope.main.loadingMain = true;
            var promise = orgService.createOrgIcon(ct.paramId, body);
            promise.success(function (data, status, headers) {
                $scope.main.loadingMain = false;
                ct.selOrgProject.iconImage = data;
                common.mdDialogHide();
                common.showAlertSuccess('업로드 되었습니다');
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMain = false;
                common.showAlertError('프로젝트 로고 업로드 실패하였습니다.');
            });
        };

        // 조직 설명 추가
        ct.createOrgProjectDesc = function($event) {
            ct.selOrgProject.updatedDescription = ct.selOrgProject.description;
            var dialogOptions = {
                title : '프로젝트 설명',
                formName : 'popOrgDescriptionForm',
                dialogClassName : 'modal-dialog-popOrgDescription',
                templateUrl : _COMM_VIEWS_ + '/org/popOrgDescription.html' + _VersionTail(),
                okName : '수정',
                closeName : '취소'
            };
            common.showDialog($scope, $event, dialogOptions);

            $scope.popDialogOk = function() {
                ct.createOrgProjectDescAction();
            };

            $scope.popCancel = function() {
                $scope.dialogClose = true;
                common.mdDialogCancel();
            };
        };

        // 조직 설명 추가 액션
        ct.createOrgProjectDescAction = function () {
            var params = {
                description : $('#description_toUpdate').val()
            };

            $scope.main.loadingMain = true;
            var promise = orgService.updateOrgDescription(ct.paramId, params);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_update'));
                common.mdDialogHide();
                ct.selOrgProject.description = params.description;
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_update'));
            });
        };

        // 프로젝트 삭제전 체크
        ct.checkDeleteOrgProject = function ($event) {
            var id = ct.selOrgProject.id;
            var orgId = ct.selOrgProject.orgId;
            if (!id || !orgId) {
                common.showAlertWarning("조직 정보를 찾을 수 없습니다.");
                return;
            }
            // 프로젝트 서비스 조회
            var serviceList = ct.checkOrgProjectService(id, orgId);
            if (!serviceList) return;

            // 프로젝트 서비스 api promise 세팅
            var promiseArr = [];
            angular.forEach(serviceList, function (service) {
                if (service.promise)
                    promiseArr.push(service.promise);
            });

            $scope.main.loadingMainBody = true;

            var bUse = false;     //서비스 사용 여부
            var bError = false;   //서비스 api 에러 여부
            $q.all(promiseArr).then(function() {
                for (var i = 0; i < serviceList.length; i++) {
                    if (serviceList[i].useYn != 'N') {
                        bUse = true;
                        break;
                    }
                }
                if (bUse) {
                    // 프로젝트 서비스 사용중 알람창
                    common.showDialogAlertHtml('알림', setDialogAlertHtml('success', serviceList), 'warning');
                } else {
                    // 프로젝트 삭제전 이름체크 및 삭제
                    $scope.main.popDeleteCheckName($event, '프로젝트', orgItem.orgName, ct.deleteOrgProjectAction, orgItem);
                }
            }).catch(function() {
                bError = true;
            }).finally(function () {
                $scope.main.loadingMainBody = false;
            });

            //오류 시 전체 서비스 보여주기 위해 $interval 이용
            var checkServiceCall = $interval(function () {
                var bCallDone = true;
                angular.forEach(serviceList, function (service) {
                    if (service.callYn == 'N') bCallDone = false;
                });
                if (bCallDone) {
                    $interval.cancel(checkServiceCall);
                    // 프로젝트 서비스 호출 오류 알림창
                    if (bError) {
                        common.showDialogAlertHtml('알림', setDialogAlertHtml('error', serviceList), 'warning');
                    }
                    $scope.main.loadingMainBody = false;
                }
            }, 100);

            // 알람 팝업창 html 세팅
            var setDialogAlertHtml = function (functionSuccess, serviceList) {
                var dialogAlertHtml = "";
                if (functionSuccess == 'success') {
                    dialogAlertHtml += '아래와 같이 사용 중인 서비스가 있습니다.';
                    dialogAlertHtml += '<br>사용중인 서비스 항목 삭제 후 프로젝트 삭제를 진행해 주세요.<br><br>';
                } else {
                    dialogAlertHtml = '아래 서비스 사용여부 확인 중 에러가 있습니다.';
                    dialogAlertHtml += '<br>확인 후 진행해 주세요.<br><br>';
                }
                var serviceNameArr = [];
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
                //{serviceCode : 'iaas', serviceName : '서버 가상화', useYn : 'N', callYn : 'N'},
                {serviceCode : 'gpu', serviceName : '서버 가상화', useYn : 'N', callYn : 'N'}//,
                // {serviceCode : 'paas', serviceName : 'App 실행 서비스', useYn : 'N', callYn : 'N'},
                //엘이테크
                /*삭제 전 체크에 타사업자 제외. 22.03.14
                {serviceCode : 'gis', serviceName : 'HUB-PoP GIS', useYn : 'N', callYn : 'N'},
                // {serviceCode : 'vru', serviceName : 'AR/VR 공유서비스', useYn : 'N', callYn : 'N'},
                {serviceCode : 'hwu', serviceName : 'HiveBroker 서비스', useYn : 'N', callYn : 'N'},
                {serviceCode : 'aau', serviceName : 'AI-API 서비스', useYn : 'N', callYn : 'N'},
                //와이즈테크놀로지
                {serviceCode : 'DeePoP', serviceName : '분석서비스', useYn : 'N', callYn : 'N'},
                //엔텔스
                {serviceCode : 'apip', serviceName : 'API 게이트웨이', useYn : 'N', callYn : 'N'},
                {serviceCode : 'dbp', serviceName : '실시간데이터브로커', useYn : 'N', callYn : 'N'},
                {serviceCode : 'dss', serviceName : 'DB 서비스', useYn : 'N', callYn : 'N'},
                {serviceCode : 'dpl', serviceName : '개발 파이프라인', useYn : 'N', callYn : 'N'},
                {serviceCode : 'faas', serviceName : 'FaaS', useYn : 'N', callYn : 'N'}*/
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
                        if (data && data.content && data.content.pk && data.content.pk.teamCode) service.useYn = 'Y';
                    } else if (serviceCode == 'paas') { // App 실행 서비스
                        if (data && data.guid) service.useYn = 'Y';
                    } else if (serviceCode == 'gis' || serviceCode == 'vru' || serviceCode == 'hwu' || serviceCode == 'aau') { //엘이테크 서비스
                        if (data && data.content) service.useYn = data.content;
                    } else if (serviceCode == 'DeePoP') { //와이즈테크놀로지 : 분석서비스
                        if (data && data.use_stat_yn) service.useYn = data.use_stat_yn;
                    } else if (serviceCode == 'apip' || serviceCode == 'dbp' || serviceCode == 'dss' || serviceCode == 'dpl' || serviceCode == 'faas') { //엔텔스 서비스
                        if (data && data.content) service.useYn = data.content;
                    }
                });
                promise.error(function () {
                    service.useYn = 'E';
                });
                promise.finally(function () {
                    service.callYn = 'Y';
                })
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
            // PaaS 사용않함
            // setServiceUseYn('paas', common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/name/{name}', 'GET', paasParams)));

            // 타사업자 파라미터 : 엘이테크
            var otherParam = { "PROJECT-ID" : orgId };
            // HUB-PoP GIS
            // setServiceUseYn('gis', common.retrieveResource(common.resourcePromise('/gis/confirmDeleteOrNot.do', 'GET', otherParam)));
            // AR/VR 공유서비스
            // setServiceUseYn('vru', common.retrieveResource(common.resourcePromise('/vru/confirmDeleteOrNot.do', 'GET', otherParam)));
            // HiveBroker 서비스
            setServiceUseYn('hwu', common.retrieveResource(common.resourcePromise('/hwu/confirmDeleteOrNot.do', 'GET', otherParam)));
            // AI-API 서비스
            setServiceUseYn('aau', common.retrieveResource(common.resourcePromise('/aau/confirmDeleteOrNot.do', 'GET', otherParam)));
            //와이즈테크놀로지 : 분석서비스
            var other2Param = { "prjc_id" : orgId };
            setServiceUseYn('DeePoP', common.retrieveResource(common.resourcePromise('/DeePoP/rest/projectUserCheck.do', 'GET', other2Param)));
            //엔텔스
            var other3Param = { "teamCode" : orgId };
            //API 게이트웨이
            setServiceUseYn('apip', common.retrieveResource(common.resourcePromise('/apip/api/common/service/useYn', 'GET', other3Param)));
            //실시간데이터브로커
            setServiceUseYn('dbp', common.retrieveResource(common.resourcePromise('/dbp/api/common/service/useYn', 'GET', other3Param)));
            //DB 서비스
            setServiceUseYn('dss', common.retrieveResource(common.resourcePromise('/dss/api/common/service/useYn', 'GET', other3Param)));
            //개발 파이프라인
            setServiceUseYn('dpl', common.retrieveResource(common.resourcePromise('/dpl/api/common/service/useYn', 'GET', other3Param)));
            //FaaS
            setServiceUseYn('faas', common.retrieveResource(common.resourcePromise('/faas/api/common/service/useYn', 'GET', other3Param)));
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

        // 조직 삭제 액션
        ct.deleteOrgProjectAction = function () {
            $scope.main.loadingMainBody = true;
            var promise = orgService.deleteOrg(ct.paramId);
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlert($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '해당 프로젝트를 삭제 처리 중 입니다.');
                $scope.main.goToPage('/comm/projects/');
            });
            promise.error(function (data, status) {
                $scope.main.loadingMainBody = false;
                if (status == 406) {
                    common.showAlertError($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '삭제 권한이 없습니다.');
                } else if (status == 403) {
                    common.showAlertErrorHtml($translate.instant('label.org_del') + '(' + ct.selOrgProject.orgName + ')', '아래 시스템에서 사용중 입니다.');
                } else {
                    common.showAlertError('', data);
                }
            });
        };

        // 사용자 목록 조회
        ct.listOrgUsers = function () {
            var promise = orgService.listOrgUsers(ct.paramId);
            promise.success(function (data) {
                ct.orgUsers = data.items;
                angular.forEach(ct.orgUsers, function (userItem, key) {
                    if (!!userItem.usersInfo) {
                        userItem.isCommonOrg = userItem.usersInfo.isCommonOrg;
                    }
                });
            });
            promise.error(function (data) {
            });
        };

        ct.replaceCallBackFunction = function () {
            ct.listOrgUsers();
        };

        // 사용자 검색 추가 버튼 클릭
        ct.popOrgProjectSchAddUsersOpen = function ($event) {
            $scope.dialogOptions = {
                controller : "commPopOrgProjectSchAddUsersCtrl",
                formName : 'popOrgProjectSchAddUsersForm',
                dialogClassName : "modal-xlg",
                orgProject : angular.copy(ct.selOrgProject),
                callBackFunction : ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // 사용자 신규 추가 버튼 클릭
        ct.popOrgProjectNewAddUsersOpen = function ($event) {
            $scope.dialogOptions = {
                controller : "commPopOrgProjectNewAddUsersCtrl",
                dialogClassName : "modal-xlg",
                formName : 'popOrgProjectNewAddUsersForm',
                orgProject : angular.copy(ct.selOrgProject),
                callBackFunction : ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        // 비밀번호 초기화
        ct.resetPassword = function (user) {
            var showConfirm = common.showConfirm('비밀번호 초기화', user.name + '(' + user.email + ')의 비밀번호를 초기화(kepco12345) 하시겠습니까?');
            showConfirm.then(function() {
                ct.resetPasswordAction(user);
            });
        };

        // 비밀번호 초기화 액션
        ct.resetPasswordAction = function (user) {
            var password = 'kepco12345';
            $scope.main.loadingMain = true;
            var promise = memberService.resetPassword(user.email, password);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertSuccess('비밀번호가 정상적으로 초기화되었습니다');
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError('비밀번호 초기화가 실패하였습니다.');
            });
        };

        // 사용자 삭제 액션
        ct.deleteOrgProjectUserAction = function (user) {
            $scope.main.loadingMain = true;
            var promise = orgService.deleteOrgUser(ct.paramId, user.email);
            promise.success(function (data) {
                $scope.main.loadingMain = false;
                ct.listOrgUsers();
                common.showAlertSuccess(user.name + ' ' + $translate.instant('message.mi_egov_success_common_delete'));
            });
            promise.error(function (data) {
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_delete'));
            });
        };

        // 쿼터변경요청 내역 조회
        ct.listQuotaHistories = function () {
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listQuotaHistory(ct.selOrgProject.id);
            promise.success(function (data) {
                ct.quotaHistories = data;
                ct.isQuotaChange = true;    //쿼터변경요청 가능 여부, 첫건이 '요청'상태일 때 요청불가
                angular.forEach(ct.quotaHistories, function(value, key) {
                    if (key == 0 && value.treatCodeNm == "요청") {
                        ct.isQuotaChange = false;    //쿼터변경요청 가능 여부, 첫건이 '요청'상태일 때 요청불가
                    }
                });
                //이전값/변경값에 paas 항목 추가
                setQuotaHistoriesPaaS();
                //이전값/변경값에 같은 항목 체크
                setQuotaHistoriesSameValueDetails();
                ct.loadQuotaHistory = true;    //쿼터변경요청 조회여부
                getCheckLoadQuotas();   //프로젝트 자원탭 조회여부에 따라 loading bar false 처리
            });
            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        //쿼터변경요청 내역 이전값/변경값에 paas 항목 추가
        function setQuotaHistoriesPaaS() {
            angular.forEach(ct.quotaHistories, function(value, key) {
                if (value.oldPaasQuotaGuid != value.changePaasQuotaGuid) {
                    if (!!value.oldPaasQuotaGuid) {
                        if (value.oldValueDetails == null) {
                            value.oldValueDetails = [];
                        }
                        var obj = common.objectsFindByField(ct.paasQuotas, 'guid', value.oldPaasQuotaGuid);
                        if (obj != null) {
                            value.oldValueDetail = {};
                            value.oldValueDetail.orgQuotaItemGroupName = "PaaS";
                            value.oldValueDetail.orgQuotaItemCode = "000";
                            value.oldValueDetail.orgQuotaItemName = "용량";
                            value.oldValueDetail.value = obj.name;
                            value.oldValueDetails.push(value.oldValueDetail);
                        }
                    }
                    if (!!value.changePaasQuotaGuid) {
                        if (value.changeValueDetails == null) {
                            value.changeValueDetails = [];
                        }
                        obj = common.objectsFindByField(ct.paasQuotas, 'guid', value.changePaasQuotaGuid);
                        if (obj != null) {
                            value.changeValueDetail = {};
                            value.changeValueDetail.orgQuotaItemGroupName = "PaaS";
                            value.changeValueDetail.orgQuotaItemCode = "000";
                            value.changeValueDetail.orgQuotaItemName = "용량";
                            value.changeValueDetail.value = obj.name;
                            value.changeValueDetails.push(value.changeValueDetail);
                        }
                    }
                }
            });
        }

        //이전값/변경값에 같은 항목 체크
        function setQuotaHistoriesSameValueDetails() {
            angular.forEach(ct.quotaHistories, function(item) {
                angular.forEach(item.oldValueDetails, function(detail) {
                    detail.isSame = false;
                });
                angular.forEach(item.changeValueDetails, function(detail) {
                    detail.isSame = false;
                });
                angular.forEach(item.oldValueDetails, function(detail) {
                    angular.forEach(item.changeValueDetails, function(detail2) {
                        if (detail.orgQuotaItemId == detail2.orgQuotaItemId && detail.value == detail2.value) {
                            detail.isSame = true;
                            detail2.isSame = true;
                        }
                    });
                });
            });
            //console.log("ct.quotaHistories : ", ct.quotaHistories);
        }

        //프로젝트 자원탭 조회여부에 따라 loading bar false 처리
        function getCheckLoadQuotas () {
            if (ct.loadQuotaHistory && ct.loadOrgQuotas) {
                $scope.main.loadingMainBody = false;
            }
        }

        /*책임자 변경 화면 오픈*/
        ct.changeManagerForm = function ($event) {
            $scope.dialogOptions = {
                controller: "commChangeManagerFormCtrl",
                callBackFunction: ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*권한 변경 화면 오픈*/
        ct.changeRoleForm = function ($event) {
            $scope.dialogOptions = {
                controller: "commChangeRoleFormCtrl",
                test1 : $event,
                callBackFunction: ct.replaceCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*프로젝트 쿼터변경 요청 화면 오픈*/
        ct.requestQuotaForm = function ($event) {
            $scope.dialogOptions = {
                controller: "commRequestQuotaFormCtrl",
                callBackFunction: ct.listQuotaHistories,
                selOrgProject : ct.selOrgProject
                /*paasQuotas : ct.paasQuotas*/  // PaaS 사용않함 2021.05.24
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        /*orgQuotaItemGroup 발췌*/
        function setOrgQuotaItemGroups() {
            ct.orgQuotaGroups = [];
            angular.forEach(ct.orgQuotas, function(value, key) {
                if (value.item_group_code) {
                    if (common.objectsFindCopyByField(ct.orgQuotaGroups, "item_group_code", value.item_group_code) == null) {
                        ct.orgQuotaGroups.push(value);
                    }
                }
            });
            //console.log("ct.orgQuotaGroups : ", ct.orgQuotaGroups);
            //console.log("ct.selOrgProject : ", ct.selOrgProject);
        }

        /*org_quotas 조회 : 쿼터/미터링값 함께 조회*/
        ct.listOrgQuotas = function () {
            $scope.main.loadingMainBody = true;
            var promise = quotaService.listOrgQuotas(ct.selOrgProject.id);
            promise.success(function (data) {
                ct.orgQuotas = data.result.orgQuotas;
                //console.log("ct.orgQuotas : ", ct.orgQuotas);
                setOrgQuotaItemGroups();
                ct.loadOrgQuotas = true;       //쿼터값(미터링포함) 조회여부
                getCheckLoadQuotas();   //프로젝트 자원탭 조회여부에 따라 loading bar false 처리
            });
            promise.error(function (data) {
                ct.orgQuotaValues = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /*paas 프로젝트 쿼터 조회*/
        ct.listPaasQuotas = function (currentPage) {
            ct.paasQuotas = [];
            $scope.main.loadingMainBody = true;
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
                ct.paasQuotas = [];
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                //$scope.main.loadingMainBody = true;
                ct.listQuotaHistories();
                //ct.listOrgQuotaValues();
                ct.listOrgQuotas(); //org_quotas 조회 : 쿼터/미터링값 함께 조회
            });
        };

        // 쿼터변경요청 삭제
        ct.deleteQuotaHistory = function (quotaHistory) {
            var showConfirm = common.showConfirm($translate.instant('label.del'), "쿼터변경요청 건" + $translate.instant('message.mq_delete'));
            showConfirm.then(function() {
                ct.deleteQuotaHistoryAction(quotaHistory);
            });
        };

        // 쿼터변경요청 삭제 액션
        ct.deleteQuotaHistoryAction = function (quotaHistory) {
            $scope.main.loadingMain = true;
            var promise = quotaService.deleteQuotaHistory(quotaHistory.id);
            promise.success(function (data) {
                common.showAlertSuccess("쿼터변경요청 건이 삭제되었습니다.");
                ct.listQuotaHistories();
            });
            promise.error(function (data) {
            });
            promise.finally(function (data, status, headers) {
                $scope.main.loadingMain = false;
            });
        };

        //사용자포탈 프로젝트 대시보드 미터링값
        ct.getMeteringHourlys = function (orgId) {
            ct.orgMeterings = [];
            var orgPromise = orgService.getMeteringHourlys(orgId);
            orgPromise.success(function (data) {
                if (data.result && data.result.orgMeteringHourly) {
                    ct.orgMeterings = data.result.orgMeteringHourly;
                    //console.log("ct.orgMeterings : ", ct.orgMeterings);
                }
            });
            orgPromise.error(function (data) {
            });
            orgPromise.finally(function (data, status, headers) {
            });
        };
        ct.sltOrgId = null;
        ct.pageLoadData = function () {
            if (ct.sltOrgId == null && $scope.main.portalOrgs && $scope.main.portalOrgs.length > 0) {
                for(var i=0; i<$scope.main.portalOrgs.length; i++) {
                    if (ct.paramId == $scope.main.portalOrgs[i].id) {
                        ct.sltOrgId = $scope.main.portalOrgs[i].orgId;
                        break;
                    }
                }
            }
            if (ct.sltOrgId != null) {
                ct.getMeteringHourlys(ct.sltOrgId);
            }
            ct.getOrgProject();
            ct.listOrgUsers();
        };

        ct.pageLoadData();
    })
    .controller('commPopOrgProjectSchAddUsersCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache, ValidationService, orgService, memberService, projectService, CONSTANTS, SITEMAP) {
        _DebugConsoleLog('orgDetailControllers.js : commPopOrgProjectSchAddUsersCtrl', 1);

        var pop = this;

        pop.validationService = new ValidationService();
        pop.formName = $scope.dialogOptions.formName;

        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.title = "조회 등록";
        $scope.dialogOptions.okName = "등록";
        $scope.dialogOptions.closeName = "취소";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popOrgProjectSchAddUsersForm.html" + _VersionTail();


        pop.orgProject = $scope.dialogOptions.orgProject;

        $scope.actionBtnHied = false;
        $scope.actionLoading = false;

        $scope.popDialogOk = function () {
            pop.addSchOrgUsersAction();
        };

        pop.btnClickCheck = false;

        pop.orgRoleNames = CONSTANTS.roleName;
        pop.paramId = $stateParams.orgId;

        pop.schKey = "";
        pop.schText = "";

        pop.schAddOrgUsers = [];
        pop.schAddOrgUserEmails = [];

        // paging
        pop.pageOptions = {
            currentPage : 1,
            pageSize : 5,
            total : 1
        };

        // 등록 사용자 목록 조회
        pop.listOrgUsers = function () {
            pop.orgUserEmails = [];
            pop.isAdmin = false;
            var promise = orgService.listOrgUsers(pop.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                if (orgUsers && orgUsers.length > 0) {
                    angular.forEach(orgUsers, function (orgUser, key) {
                        pop.orgUserEmails.push(orgUser.usersInfo.email);
                        if(orgUser.isAdmin){
                            pop.isAdmin = true;
                        }
                    });
                }
                pop.loadListOrgUsers = true;
                if (pop.loadListAllUsers) {
                    pop.setOrgNotUsers();
                }
            });
            promise.error(function (data) {
            });
        };

        // 전체 사용자 조회
        pop.listAllUsers = function () {
            $scope.main.loadingMainBody = true;
            var promise = memberService.listAllUsers();
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                pop.allUsers = data.items;
                pop.loadListAllUsers = true;
                if (pop.loadListOrgUsers) {
                    pop.setOrgNotUsers();
                }
            });

            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 조직 신규 사용자 등록을 위한 미동록 사용 목록 조회
        pop.setOrgNotUsers = function () {
            pop.orgNotUsers = [];
            if (pop.allUsers && pop.allUsers.length > 0) {
                angular.forEach(pop.allUsers, function (user, key) {
                    if (pop.orgUserEmails.indexOf(user.email) == -1 && pop.schAddOrgUserEmails.indexOf(user.email) == -1) {
                        if (pop.schText) {
                            if (pop.schKey == "email" || pop.schKey == "name") {
                                if (user[pop.schKey].toLowerCase().indexOf(pop.schText.toLowerCase()) > -1) {
                                    pop.orgNotUsers.push(angular.copy(user));
                                }
                            } else {
                                if (user.email.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1 || user.name.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1) {
                                    pop.orgNotUsers.push(angular.copy(user));
                                }
                            }
                        } else {
                            pop.orgNotUsers.push(angular.copy(user));
                        }
                        /* 2020.03.23 - 사용자 조회등록시 등록된 사용자도 목록에 나오게끔 로직 수정 by ksw */
                    } else {
                        /* 검색어가 있는 경우 */
                        if (pop.schText) {
                            /* user의 email이나 name값이 검색어와 일치하는 경우 */
                            if (user.email.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1 || user.name.toLowerCase().indexOf(pop.schText.toLowerCase()) > -1) {
                                /* 조회 목록 화면 배열에 push */
                                pop.orgNotUsers.push(angular.copy(user));
                            }
                        } else {
                            pop.orgNotUsers.push(angular.copy(user));
                        }
                    }
                });
            }
            pop.pageOptions.total = pop.orgNotUsers.length;
            var maxCurrentPage = parseInt(pop.pageOptions.total/pop.pageOptions.pageSize) + 1;
            if (pop.pageOptions.currentPage > maxCurrentPage) {
                pop.pageOptions.currentPage = maxCurrentPage;
            }
        };

        // 전체 선택
        pop.checkAll = function ($event) {
            for (var i = 0; i < pop.orgNotUsers.length; i++) {
                if ((i >= (pop.pageOptions.pageSize * (pop.pageOptions.currentPage-1))) && (i < (pop.pageOptions.pageSize * (pop.pageOptions.currentPage)))) {
                    pop.orgNotUsers[i].checked = $event.currentTarget.checked;
                }
            }
        };

        pop.sltUserMove = function () {
            if (pop.orgNotUsers && pop.orgNotUsers.length > 0) {
                angular.forEach(pop.orgNotUsers, function (user, key) {
                    /* 2020.03.23 - 등록된 사용자 추가시 팝업 추가 by ksw */
                    if (user.checked && (pop.orgUserEmails.indexOf(user.email)) > -1) {
                        common.showAlertError('이미 등록된 사용자 (' + user.email + ')입니다.');
                        pop.schAddOrgUsers = [];
                    } else if (user.checked) {
                        var addOrgUser = angular.copy(user);
                        addOrgUser.roleName = pop.orgRoleNames.user;
                        addOrgUser.checked = false;
                        pop.schAddOrgUserEmails.push(addOrgUser.email);
                        pop.schAddOrgUsers.push(addOrgUser);
                    }
                });
                pop.setOrgNotUsers();
            }
        };

        pop.sltOrgUserClear = function () {
            if (pop.schAddOrgUsers && pop.schAddOrgUsers.length > 0) {
                pop.schAddOrgUserEmails = [];
                for (var i=(pop.schAddOrgUsers.length-1); i>=0; i--) {
                    pop.schAddOrgUserEmails.splice(i, 1);
                    if (pop.schAddOrgUsers[i].checked) {
                        pop.schAddOrgUsers.splice(i, 1);
                    } else {
                        pop.schAddOrgUserEmails.push(pop.schAddOrgUsers[i].email);
                    }
                }
                angular.forEach(pop.schAddOrgUsers, function (orgUser, key) {
                });
                pop.setOrgNotUsers();
            }
        };

        // 사용자 조회 등록
        pop.addSchOrgUsersAction = function () {
            if (pop.btnClickCheck) {
                return;
            }
            pop.btnClickCheck = true;

            if (!pop.schAddOrgUsers || pop.schAddOrgUsers.length == 0) {
                common.showAlert($translate.instant('message.mi_dont_exist_checked'));
                pop.btnClickCheck = false;
                return;
            }

            var orgUserRequests = [];
            var checkAdminCnt = 0;
            angular.forEach(pop.schAddOrgUsers, function (orgUser) {
                orgUserRequests.push({
                    email : orgUser.email,
                    name : orgUser.name,
                    userRole : orgUser.roleName
                });
                /* 2020.01.22 - 관리자 다수 등록 가능 요청으로 인해 수정 */
                /*if(orgUser.roleName == "ADMIN"){
                    checkAdminCnt++;
                }*/
            });

            /* 2020.01.22 - 관리자 다수 등록 가능 요청으로 인해 수정 */
            /*if (checkAdminCnt >= 2) {
                common.showAlertError("사용자 등록시 관리자 역할은 한 명만 지정할 수 있습니다.");
                pop.btnClickCheck = false;
                return;
            }*/

            $scope.main.loadingMain = true;
            common.mdDialogHide();
            var promise = orgService.orgUserAdds(pop.paramId, orgUserRequests);
            promise.success(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
                if ( angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
            });
            promise.error(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };

        pop.pageListOrgUsersLoadData = function (page) {
            pop.pageOptions.currentPage = page;
            pop.loadListOrgUsers = false;
            pop.loadListAllUsers = false;
            pop.listOrgUsers();
            pop.listAllUsers();
        };

        pop.pageListOrgUsersLoadData(1);
    })
    .controller('commPopOrgProjectNewAddUsersCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache, ValidationService, orgService, memberService, projectService, CONSTANTS, SITEMAP) {
        _DebugConsoleLog('orgDetailControllers.js : commPopOrgProjectNewAddUsersCtrl', 1);

        var pop = this;

        pop.validationService = new ValidationService();
        pop.formName = $scope.dialogOptions.formName;

        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.title = "직접 등록";
        $scope.dialogOptions.okName = "등록";
        $scope.dialogOptions.closeName = "취소";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popOrgProjectNewAddUsersForm.html" + _VersionTail();

        pop.orgProject = $scope.dialogOptions.orgProject;

        $scope.actionBtnHied = false;
        $scope.actionLoading = false;

        pop.orgRoleNames = CONSTANTS.roleName;
        pop.paramId = $stateParams.orgId;

        pop.newOrgUsers = [];
        pop.orgUserEmails = [];
        pop.notOrgUserEmails = [];

        pop.addNewOrgUsers = function () {
            pop.newOrgUsers.push({
                roleName : pop.orgRoleNames.user,
                email : "",
                name : "",
                position : "",
                add : true,
                del : false
            });
        };

        // 등록 사용자 목록 조회
        pop.listOrgUsers = function () {
            pop.orgUserEmails = [];
            pop.isAdmin = false;
            var promise = orgService.listOrgUsers(pop.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                if (orgUsers && orgUsers.length > 0) {
                    angular.forEach(orgUsers, function (orgUser, key) {
                        pop.orgUserEmails.push(orgUser.usersInfo.email);
                        if(orgUser.isAdmin){
                            pop.isAdmin = true;
                        }
                    });
                }
                pop.loadListOrgUsers = true;
                if (pop.loadListAllUsers) {
                    pop.setOrgNotUsers();
                }
            });
            promise.error(function (data) {
            });
        };

        // 전체 사용자 조회
        pop.listAllUsers = function () {
            $scope.main.loadingMainBody = true;
            var promise = memberService.listAllUsers();
            promise.success(function (data) {
                $scope.main.loadingMainBody = false;
                pop.allUsers = data.items;
                pop.loadListAllUsers = true;
                if (pop.loadListOrgUsers) {
                    pop.setOrgNotUsers();
                }
            });

            promise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // 조직 신규 사용자 등록을 위한 미동록 사용 목록 조회
        pop.setOrgNotUsers = function () {
            pop.notOrgUserEmails = [];
            if (pop.allUsers && pop.allUsers.length > 0) {
                angular.forEach(pop.allUsers, function (user, key) {
                    if (pop.orgUserEmails.indexOf(user.email) == -1) {
                        pop.notOrgUserEmails.push(user.email);
                    }
                });
            }
        };

        // 사용자 아이디 중복 체크
        pop.checkOrgUserDup = function (email, key) {
            if (!email) {
                return;
            }
            if (pop.orgUserEmails.indexOf(email) > -1 ) {
                common.showAlertError('이미 회원가입/프로젝트 구성원 추가한 아이디(' + email + ')입니다.');
                return;
            }
            if (pop.notOrgUserEmails.indexOf(email) > -1 ) {
                common.showAlertError('이미 회원가입한 아이디(' + email + ')입니다.');
                return;
            }
            // 등록하려는 사용자 목록에서 조회
            for (var i = 0; i < pop.newOrgUsers.length; i++) {
                if (i != key && email.indexOf(pop.newOrgUsers[i].email) > -1) {
                    common.showAlertError('직접 등록 사용자 목록에 존재하는 아이디(' + email + ')입니다.');
                    return;
                }
            }

            common.showAlertSuccess('회원가입 가능한 아이디(' + email + ')입니다.');
        };

        pop.checkPasswordPattern = function (password) {
            var regex = /^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z]{10,20}$/;
            if(!regex.test(password)) {
                common.showAlertWarning('영문, 숫자를 포함한 10~20자의 비밀번호를 입력하십시오.');
                return false;
            }
            return true;
        };

        // 사용자 직접 등록
        pop.addCustomOrgUser = function (orgUser) {
            if (!orgUser.name) {
                common.showAlertWarning('이름을 입력하세요');
                return;
            }
            if (!orgUser.position) {
                common.showAlertWarning('소속을 입력하세요');
                return;
            }
            if (!orgUser.email) {
                common.showAlertWarning('아이디를 입력하세요');
                return;
            }
            if (!orgUser.password) {
                common.showAlertWarning('비밀번호를 입력하세요');
                return;
            }
            if (!pop.checkPasswordPattern(orgUser.password)) {
                return;
            }
            pop.addNewOrgUsers();
        };

        pop.deleteCustomOrgUser = function (key) {
            pop.newOrgUsers.splice(key, 1);
        };

        // 사용자 등록 액션
        pop.addOrgUsersAction = function (orgUserRequests) {
            $scope.main.loadingMain = true;
            var promise = orgService.orgUserAdds(pop.paramId, orgUserRequests);
            promise.success(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
                if (angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
            });
            promise.error(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };

        // 사용자 직접 등록 액션
        pop.btnClickCheck = false;
        pop.addCustomOrgUserAction = function () {
            if (pop.btnClickCheck) {
                return;
            }
            pop.btnClickCheck = true;
            pop.orgUserRequests = [];
            var checkAdminCnt = 0;
            for (var i = 0; i < pop.newOrgUsers.length; i++) {
                if (!pop.newOrgUsers[i].name) {
                    common.showAlertWarning('이름을 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.newOrgUsers[i].position) {
                    common.showAlertWarning('소속을 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.newOrgUsers[i].email) {
                    common.showAlertWarning('아이디를 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.newOrgUsers[i].password) {
                    common.showAlertWarning('비밀번호를 입력하세요');
                    pop.btnClickCheck = false;
                    return;
                } else if (!pop.checkPasswordPattern(pop.newOrgUsers[i].password)) {
                    pop.btnClickCheck = false;
                    return;
                }
                pop.orgUserRequests.push({
                    email : pop.newOrgUsers[i].email,
                    name : pop.newOrgUsers[i].name,
                    userRole : pop.newOrgUsers[i].roleName
                });
                /* 2020.01.28 - 관리자 다수 등록 가능 요청으로 인해 수정 */
                /*if(pop.newOrgUsers[i].roleName == "ADMIN"){
                    checkAdminCnt++;
                }*/
            }

            /* 2020.01.28 - 관리자 다수 등록 가능 요청으로 인해 수정 */
            /*if (checkAdminCnt >= 2) {
                common.showAlertError("사용자 등록시 관리자 역할은 한 명만 지정할 수 있습니다.");
                pop.btnClickCheck = false;
                return;
            }*/

            if (pop.newOrgUsers.length == 0) {
                common.showAlertWarning($translate.instant('message.mi_dont_exist_checked'));
                pop.btnClickCheck = false;
                return;
            }

            common.mdDialogHide();
            $scope.main.loadingMain = true;
            for (var i = 0; i < pop.newOrgUsers.length; i++) {
                var item = pop.newOrgUsers[i];
                // 모든 사용자 생성 이후 조직 등록
                var totalUsers = 0;

                var param = {};
                param.name = item.name;
                param.position = item.position;
                param.email = item.email;
                param.password = item.password;
                param.userType = 'normal';
                var promise = memberService.createUser(param);
                promise.success(function (data) {
                    totalUsers++;
                    if (totalUsers == pop.newOrgUsers.length) {
                        pop.addOrgUsersAction(pop.orgUserRequests);
                    }
                });
                promise.error(function (data) {
                    totalUsers++;
                    $scope.main.loadingMain = false;
                    if (totalUsers == pop.newOrgUsers.length) {
                        pop.addOrgUsersAction(pop.orgUserRequests);
                    }
                    common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
                });
            }
        };

        $scope.popDialogOk = function () {
            pop.addCustomOrgUserAction();
        };

        pop.pageListOrgUsersLoadData = function () {
            pop.loadListOrgUsers = false;
            pop.loadListAllUsers = false;
            pop.listOrgUsers(1);
            pop.listAllUsers();
        };

        pop.addNewOrgUsers();

        pop.pageListOrgUsersLoadData();
    })
    .controller('commRequestQuotaFormCtrl', function ($scope, $location, $state, $stateParams, $mdDialog, $translate, $q ,ValidationService, common, quotaService) {
        _DebugConsoleLog("orgDetailController.js : commRequestQuotaFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = {};
        pop.formName = "requestQuotaForm";
        pop.selOrgProject = angular.copy($scope.dialogOptions.selOrgProject);
        // pop.paasQuotas = angular.copy($scope.dialogOptions.paasQuotas); // PaaS 사용않함 2021.05.24
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popRequestQuotaForm.html" + _VersionTail();
        $scope.dialogOptions.title = "프로젝트 쿼터변경요청";
        pop.method = "POST";
        pop.data.paasQuotaGuid = pop.selOrgProject.paasQuotaGuid;
        //console.log("pop.selOrgProject : ", pop.selOrgProject);

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            var params = {};
            params.orgId = pop.selOrgProject.id;
            params.requestReason = pop.data.requestReason;
            params.paasQuotaGuid = pop.data.paasQuotaGuid;
            var orgQuotaValues = [];
            angular.forEach(pop.quotaItems, function (quotaItem, key) {
                if (quotaItem.value) {
                    var orgQuotaValue = {};
                    orgQuotaValue.org = {};
                    orgQuotaValue.org.id = pop.selOrgProject.id;
                    orgQuotaValue.orgQuotaItem = {};
                    orgQuotaValue.orgQuotaItem.id = quotaItem.id;
                    orgQuotaValue.value = quotaItem.value;
                    orgQuotaValues.push(orgQuotaValue);
                }
            });
            params.orgQuotaValues = orgQuotaValues;
            // 쿼터값 범위 체크
            for (var i = 0; i < pop.quotaItems.length; i++) {
                if (pop.quotaItems[i].value < pop.quotaItems[i].min || pop.quotaItems[i].value > pop.quotaItems[i].max) {
                    common.showAlertWarning("쿼터범위를 초과했습니다.");
                    $scope.actionBtnHied = false;
                    return;
                }
            }
            if (!params.requestReason) {
                common.showAlertWarning("변경요청사유는 필수사항입니다.");
                $scope.actionBtnHied = false;
                return;
            }
            if (!params.paasQuotaGuid && params.orgQuotaValues.length == 0) {
                common.showAlertWarning("상세 쿼터 설정은 필수사항입니다.");
                $scope.actionBtnHied = false;
                return;
            }
            //변경사항이 없는지 확인
            if (pop.selOrgProject.paasQuotaGuid == params.paasQuotaGuid) {
                if (!checkChangeQuota()) {
                    common.showAlertWarning("쿼터 변경사항이 없습니다.");
                    $scope.actionBtnHied = false;
                    return;
                }
            }
            pop.fn.okFunction(params);
        };

        //쿼터 초기값과 신청값 변경 체크 : 변경 있으면 true
        function checkChangeQuota() {
            var bReturn = false;
            angular.forEach(pop.quotaItems, function (item) {
                var obj = common.objectsFindByField(pop.quotaItemsAgo, 'id', item.id);
                if (item.value != obj.value) {
                    bReturn = true;
                    return bReturn;
                }
            });
            return bReturn;
        }

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.okFunction = function(params) {
            //console.log("pop.fn.okFunction params : ", params);
            var returnPromise = quotaService.quotaHistoryCreate(params);
            returnPromise.success(function (data, status, headers) {
                common.showAlertSuccess("프로젝트 쿼터변경요청", "프로젝트 쿼터변경요청을 완료했습니다.");
                $scope.dialogOptions.callBackFunction();
                $scope.popHide();
            });
            returnPromise.error(function (data) {
                common.showAlert("message",data.message);
            });
        };

        /*상세쿼타조정 조회*/
        pop.fn.listQuotaItems = function() {
            var params = {
                schGroupId : 0,
                schType : "name",
                schText : ""
            };
            pop.quotaItems = [];
            var returnPromise = quotaService.listQuotaItem(params);
            returnPromise.success(function (data) {
                pop.quotaItems = data;
            });
            returnPromise.error(function (data) {
                pop.quotaItems = [];
                common.showAlert("message", data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                pop.fn.listQuotaValues();
            });
        };

        /*상세쿼타 값 조회*/
        pop.fn.listQuotaValues = function() {
            pop.quotaValues = [];
            var returnPromise = quotaService.listOrgQuotaValues(pop.selOrgProject.id);
            returnPromise.success(function (data) {
                pop.quotaValues = data;

                //console.log("pop.quotaItems : ", pop.quotaItems);
                //console.log("pop.quotaValues : ", pop.quotaValues);
                angular.forEach(pop.quotaItems, function (quotaItem) {
                    angular.forEach(pop.quotaValues, function (quotaValue) {
                        if (quotaItem.id == quotaValue.orgQuotaItem.id) {
                            quotaItem.value = quotaValue.value;
                        }
                    });
                });
                pop.quotaItemsAgo = angular.copy(pop.quotaItems);   //초기값
            });
            returnPromise.error(function (data) {
                pop.quotaValues = [];
                common.showAlert("message",data.message);
            });
        };

        pop.fn.listQuotaItems();
        //pop.fn.listQuotaValues();

    })
    .controller('commChangeRoleFormCtrl', function ($scope, $location, $state, $stateParams,$mdDialog,$translate, $q,ValidationService, orgService, common, CONSTANTS) {
        _DebugConsoleLog("orgDetailController.js : commChangeRoleFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = {};

        pop.formName = "changeRoleForm";
        pop.test = $scope.dialogOptions.test1;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-dialog";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popChangeRoleForm.html" + _VersionTail();
        $scope.dialogOptions.title = "권한 변경";

        pop.orgRoleNames = CONSTANTS.roleName;
        pop.paramId = $stateParams.orgId;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            pop.fn.okFunction();
        };

        pop.listOrgUser = function () {
            pop.isAdmin = false;
            var promise = orgService.listOrgUsers(pop.paramId);
            promise.success(function (data) {
                var orgUsers = data.items;
                angular.forEach(orgUsers, function (orgUser, key) {
                    if (orgUser.usersInfo.email == pop.test.email) {
                        pop.orgUser = orgUser;
                        if (orgUser.isAdmin) {
                            pop.isAdmin = true;
                        }
                        return false;
                    }
                });
            });
            promise.error(function (data) {
            });
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.okFunction = function() {
            var orgUserRequest = {
                email: pop.orgUser.usersInfo.email,
                userRole: pop.orgUser.roleName
            };
            $scope.main.loadingMain = true;
            common.mdDialogHide();
            var promise = orgService.changeOrgAdmin(pop.paramId, orgUserRequest);
            promise.success(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertSuccess($translate.instant('message.mi_egov_success_common_insert'));
                if ( angular.isFunction(pop.callBackFunction) ) {
                    pop.callBackFunction();
                }
            });
            promise.error(function (data) {
                pop.btnClickCheck = false;
                $scope.main.loadingMain = false;
                common.showAlertError($translate.instant('message.mi_egov_fail_common_insert'));
            });
        };

        pop.listOrgUser();
    })
    .controller('commChangeManagerFormCtrl', function ($scope, $location, $state, $stateParams,$mdDialog,$translate, $q,ValidationService, orgService, $filter, user,paging, common, CONSTANTS) {
        _DebugConsoleLog("orgDetailController.js : commChangeManagerFormCtrl", 1);
        $scope.actionBtnHied = false;

        var pop = this;
        $scope.actionLoading = false;

        pop.fn = {};
        pop.data = {};
        pop.roles = [];
        pop.isOrgManager = false;

        pop.formName = "changeManagerForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.validDisabled = true;
        $scope.dialogOptions.dialogClassName = "modal-dialog";
        $scope.dialogOptions.templateUrl = _COMM_VIEWS_ + "/org/popChangeManagerForm.html" + _VersionTail();
        $scope.dialogOptions.title = "책임자 변경";
        $scope.dialogOptions.okName = "변경";

        // 책임자 변경 팝업에서 변경 버튼 클릭시 액션
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if(pop.data.orgUser == undefined ) {
                $scope.popCancel();
                return;
            }
            pop.fn.userPush();
        };

        $scope.popCancel = function () {
            $scope.popHide();
        };

        pop.fn.checkOne = function($event,image) {
            console.log(pop.roles);
            if($event.currentTarget.checked) {
                console.log("roles len : " + pop.roles.length);
                if(pop.roles.length == $("#mainList tbody").find("input[type='checkbox']").length) {
                    $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",true);
                }
            } else {
                $($("#mainList").find("input[type='checkbox']")[0]).prop("checked",false);

            }
        };

        // 팝업창에서 조직 구성원들 조회
        pop.fn.listAllOrgMembers = function(currentPage) {
            var param = {};
            if(currentPage != undefined) {
                param.number = currentPage
            }
            var orgPromise = orgService.listOrgUsers($scope.contents.paramId);
            orgPromise.success(function (data) {
                pop.pageOptions = paging.makePagingOptions(data);
                pop.orgUsers = data.items;
                if (pop.orgUsers.roleName == 'OWNER') {
                    pop.isOrgManager = true;
                }
            });
            orgPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            orgPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.userPush = function() {
            $scope.main.loadingMainBody = true;
            var id = pop.data.orgUser.org.id;
            var param = {
                orgId : pop.data.orgUser.org.orgId,
                orgManager : {
                    email : pop.data.orgUser.usersInfo.email
                }
            };
            var orgPromise = orgService.changeOrgManager(id, param);
            orgPromise.success(function (data, status, headers) {
                $scope.contents.listOrgUsers();
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess('책임자 변경 성공','책임자가 변경되었습니다.');
                $scope.main.replacePage();
                $scope.popCancel();
            });
            orgPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            orgPromise.finally(function() {
                $scope.main.loadingMainBody = false;
            });
        };

        pop.fn.listAllOrgMembers();
    });
