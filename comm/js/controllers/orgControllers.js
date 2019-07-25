'use strict';

angular.module('portal.controllers')
    .controller('commOrgProjectsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $cookies, $mdDialog, orgService, quotaService, common, portal) {
        _DebugConsoleLog("orgControllers.js : commOrgProjectsCtrl", 1);

        var ct = this;
        ct.orgProjects = [];
        ct.notices = [];
        ct.tempNotices = [];
        ct.selectItemKey = 0;
        ct.userAuth = $scope.main.userAuth;
        ct.popup = $stateParams.popup;      //프로젝트 생성 팝업 여부
        ct.schFilterText = "";
        ct.popNoticeCnt = 0;
        ct.noticeItem = {};     //현 팝업 공지사항
        ct.tempData = {
            "data":[
                {
                    "NOTICE_NO":6,
                    "TITLE":"공지사항111111111",
                    "POP_YN":"Y",
                    "START_DT":"2019-05-30",
                    "END_DT":"2019-08-06",
                    "CONTENTS":"<p>테스트입니다.111111111111</p>\r\n",
                    "ATTACH_FILE":"206|RTU속성2.txt",
                    "COMMON_CD":"CD0021",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2019-05-30",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2019-05-30",
                    "DELETE_YN":"N"
                },
                {
                    "NOTICE_NO":7,
                    "TITLE":"공지사항2222222222",
                    "POP_YN":"Y",
                    "START_DT":"2019-05-30",
                    "END_DT":"2019-08-06",
                    "CONTENTS":"<p dmcf-pid='NnQZ4VLour' dmcf-ptype='general' style='margin:35px 0px 19px;padding:0px;color:rgb(51, 51, 51);font-family:AppleSDGothicNeo-Regular, &quot;font-size:17px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;font-weight:400;letter-spacing:-0.34px;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;background-color:rgb(255, 255, 255);text-decoration-style:initial;text-decoration-color:initial;'>(서울=연합뉴스) 이상헌 임형섭 박경준 기자 = 청와대는 24일 러시아 군용기의 독도 영공 침범과 관련해 일본 정부가 자위대 군용기를 긴급 발진하면서 독도를 일본 땅이라는 억지를 부린 데 대해 '일본은 &quot;일본방공식별구역(JADIZ)&quot;에 대한 부분만 갖고 입장을 내면 될 것 같다'는 반박 입장을 밝혔다.</p>\n<p dmcf-pid='N9Zsf0ny0S' dmcf-ptype='general' style='margin:0px 0px 19px;padding:0px;color:rgb(51, 51, 51);font-family:AppleSDGothicNeo-Regular, &quot;font-size:17px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;font-weight:400;letter-spacing:-0.34px;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;background-color:rgb(255, 255, 255);text-decoration-style:initial;text-decoration-color:initial;'>청와대 관계자는 이날 기자들을 만나 이같이 언급한 뒤 '우리 영공에 대한 문제는 우리가 답할 부분'이라고 말했다.</p><p dmcf-pid='NnQZ4VLour' dmcf-ptype='general' style='margin:35px 0px 19px;padding:0px;color:rgb(51, 51, 51);font-family:AppleSDGothicNeo-Regular, &quot;font-size:17px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;font-weight:400;letter-spacing:-0.34px;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;background-color:rgb(255, 255, 255);text-decoration-style:initial;text-decoration-color:initial;'>(서울=연합뉴스) 이상헌 임형섭 박경준 기자 = 청와대는 24일 러시아 군용기의 독도 영공 침범과 관련해 일본 정부가 자위대 군용기를 긴급 발진하면서 독도를 일본 땅이라는 억지를 부린 데 대해 '일본은 일본방공식별구역(JADIZ)에 대한 부분만 갖고 입장을 내면 될 것 같다'는 반박 입장을 밝혔다.</p>\n<p dmcf-pid='N9Zsf0ny0S' dmcf-ptype='general' style='margin:0px 0px 19px;padding:0px;color:rgb(51, 51, 51);font-family:AppleSDGothicNeo-Regular, &quot;font-size:17px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;font-weight:400;letter-spacing:-0.34px;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;background-color:rgb(255, 255, 255);text-decoration-style:initial;text-decoration-color:initial;'>청와대 관계자는 이날 기자들을 만나 이같이 언급한 뒤 '우리 영공에 대한 문제는 우리가 답할 부분'이라고 말했다.</p>",
                    "ATTACH_FILE":"206|RTU속성1111.txt,210|RTU속성22222.txt,212|RTU속성3333.txt",
                    "COMMON_CD":"CD0021",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2019-05-30",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2019-05-30",
                    "DELETE_YN":"N"
                },
                {
                    "NOTICE_NO":9,
                    "TITLE":"공지사항333333333",
                    "POP_YN":"Y",
                    "START_DT":"2019-05-30",
                    "END_DT":"2019-08-06",
                    "CONTENTS":"<p><strong data-translation='' style='display:block;position:relative;padding-left:14px;margin:-4px 0px 29px;font-weight:normal;line-height:1.5;color:rgb(51, 51, 51);font-family:AppleSDGothicNeo-Regular, &quot;font-size:17px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;letter-spacing:-0.7px;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;background-color:rgb(255, 255, 255);text-decoration-style:initial;text-decoration-color:initial;'>'군용기 발진' 日 독도영유권 주장에 반박..'우리 영공 문제는 우리가 답해'<br>시간별 靑 조치 상세소개..NSC 미개최 지적엔 '실효조치 중요, 본질 정확히 봐야'<br>러시아 차석무관 '기기 오작동, 침범의도 없었다'..한국에 위치좌표 등 자료요청</strong></p><div data-translation-body='' style='margin:0px;padding:0px 0px 0px 14px;overflow:hidden;line-height:1.625;letter-spacing:-0.02em;color:rgb(51, 51, 51);font-family:AppleSDGothicNeo-Regular, &quot;font-size:17px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;font-weight:400;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;background-color:rgb(255, 255, 255);text-decoration-style:initial;text-decoration-color:initial;'><section dmcf-sid='NbJ7TC07fN'><figure dmcf-pid='N500st49KD' dmcf-ptype='figure' style='position:relative;margin:0px auto 30px;display:table;padding:0px;clear:left;max-width:100%;'><p style='margin:0px;padding:0px;display:block;position:relative;'><img alt='러시아 군용기, 한국방공식별구역(KADIZ) 침범 (PG) [정연주 제작] 일러스트' dmcf-mid='NnFZAq8SAy' dmcf-mtype='image' height='262' src='https://t1.daumcdn.net/news/201907/24/yonhap/20190724140019985rrea.jpg' width='500' style='border:0px none;display:block;max-width:100%;height:auto;margin:0px auto;'></p><figcaption style='margin:11px auto 0px;font-size:13px;line-height:18px;color:rgb(145, 145, 145);max-width:100%;display:table-caption;caption-side:bottom;word-break:break-word;'>러시아 군용기, 한국방공식별구역(KADIZ) 침범 (PG) [정연주 제작] 일러스트</figcaption></figure></section></div>",
                    "ATTACH_FILE":"",
                    "COMMON_CD":"CD0021",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2019-05-30",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2019-05-30",
                    "DELETE_YN":"N"
                }
            ],
            "status":{
                "code":200,
                "name":"OK"
            }
        };

        ct.extendItem = function(evt) {
            console.log('extendItem', evt);
            if($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.changeItem = function(evt, itemKey) {
            console.log('changeItem', evt);
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

        ct.orgProjects = [];

        /*Org 목록 조회*/
        ct.listOrgProjects = function () {
            ct.orgProjects = [];
            $scope.main.loadingMainBody = true;
            var promise = orgService.getMyProjectOrgList($scope.main.sltProjectId, "", "");
            promise.success(function (data) {
                if (data && data.items && angular.isArray(data.items)) {
                    common.objectOrArrayMergeData(ct.orgProjects, angular.copy(data.items));
                    $scope.main.setListAllPortalOrgs(data.items);
                } else {
                    $scope.main.setListAllPortalOrgs();
                }
                $scope.main.loadingMainBody = false;

                //좌측메뉴 [프로젝트 생성] 클릭으로 넘어온 경우 바로 팝업 띄움. 2019.06.25
                if ($scope.main.userAuth == 'M' && ct.popup == 'popup') {
                    ct.addOrgProjectFormOpen();
                }
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.detailNgClick = function(orgItem) {
            $location.path('/comm/projects/projectDetail/' + orgItem.id);
        };

        ct.addOrgProjectFormOpen = function($event) {
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

        /*공지 목록 조회*/
        ct.listNotices = function () {
            ct.notices = [];
            ct.tempNotices = [];
            ct.popNoticeCnt = 0;
            $scope.main.loadingMainBody = true;
            var promise = portal.portalOrgs.getNotices();
            promise.success(function (data) {
                ct.tempNotices = data;
            });
            promise.error(function (data, status, headers) {
            });
            promise.finally(function() {
                ct.tempNotices = ct.tempData.data;
                if (ct.tempNotices.length > 0) {
                    setPopNoties();
                }
                $scope.main.loadingMainBody = false;
            });
        };

        /*팝업 공지사항 목록 세팅 : 팝업여부체크/날짜체크/팝업위치등 설정*/
        function setPopNoties() {
            var toDay = moment(new Date()).format('YYYY-MM-DD');    //2019-07-11
            var i = 0;
            angular.forEach(ct.tempNotices, function (noticeItem) {
                i++;
                var attachFiles = [];
                var attachFile = {};
                if (noticeItem.DELETE_YN == "N" && noticeItem.POP_YN == "Y" && noticeItem.START_DT <= toDay && noticeItem.END_DT >= toDay && $cookies.get('notice_' + noticeItem.NOTICE_NO) != 'valid') {
                    noticeItem["isView"] = true;
                    noticeItem["top"] = 100 * i - 50;
                    noticeItem["left"] = 200 * i + 100;
                    if (!!noticeItem.ATTACH_FILE) {
                        var arrFiles = noticeItem.ATTACH_FILE.split(",");   //"ATTACH_FILE":"206|RTU속성2.txt,210|RTU속성33.txt"
                        if (!!arrFiles && arrFiles.length > 0) {
                            angular.forEach(arrFiles, function (file) {
                                var arrFileInfo = file.split("|");      //206|RTU속성2.txt
                                attachFile["FILE_NO"] = arrFileInfo[0];      //206
                                attachFile["FILE_NAME"] = arrFileInfo[1];    //RTU속성2.txt
                                attachFiles.push(attachFile);
                            });
                            noticeItem["ATTACH_FILES"] = attachFiles;
                        }
                    }
                    //CONTENTS 중 ", ' 를 문자 치환
                    noticeItem.CONTENTS = noticeItem.CONTENTS.replace(/\"/g,"&quot;");
                    //noticeItem.CONTENTS = noticeItem.CONTENTS.replace(/\'/g,"&#39;");
                    ct.notices.push(noticeItem);
                }
            });
            ct.popNoticeCnt = ct.notices.length;
            /*console.log("toDay : ", toDay);
            console.log("ct.popNoticeCnt : ", ct.popNoticeCnt);
            console.log("ct.tempNotices : ", ct.tempNotices);
            console.log("ct.notices : ", ct.notices);*/
            $scope.main.noticeList = [];
            if (ct.popNoticeCnt > 0) {
                $scope.main.desplayNoticeList(ct.notices);
            }
        }

        ct.listOrgProjects();   //조직 목록 조회
        ct.listNotices();       //공지 목록 조회
    })
    .controller('commFirstOrgProjectMainCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, orgService, quotaService, common) {
        _DebugConsoleLog("orgControllers.js : commFirstOrgProjectMainCtrl", 1);

        var ct = this;
        ct.fn = {};

        ct.selectItemKey = 0;

        ct.userAuth  = $scope.main.userAuth;

        ct.fn.extendItem = function(evt) {
            console.log('extendItem', evt);
            if($(evt.target).closest('.NotCloseFirstOrgProjecItem').length == 0) {
                ct.selectItemKey = 0;
            }
        };

        ct.fn.changeItem = function(evt, itemKey) {
            console.log('changeItem', evt);
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
;
