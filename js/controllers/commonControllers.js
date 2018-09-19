'use strict';

angular.module('common.controllers', [])
	// 최초 접속 혹은 새로고침 시 as main
	.controller('mainCtrl', function ($scope, $location, $state, $translate, $window, CONSTANTS, cache, cookies, common, user, login, portal, FileUploader, projectService, orgService) {

        _DebugConsoleLog('commonControllers.js : mainCtrl Start, path : ' + $location.path(), 1);
        var mc = this;
		mc.pageLoadCount = 0;
        mc.bodyLayout = common.getLanguageKey();

        mc.uploader = new FileUploader();
        mc.loadingMain = true;
        mc.loadingMainBody = true;
		//	mainContentsLayout Resize 이벤트 셋팅 여부
		mc.contentsLayoutResizeEvent	= true;
        mc.loadingProgressBar = CONSTANTS.loadingProgressBar;

        mc.childWindow = null;

        mc.languages = [];
        mc.sltLanguage = {};
        mc.sltDataTimePickerOptions = [];

        mc.mainLoadTime = new Date().getTime();

        mc.reloadTimmer = null;
        mc.mainBodyLoaded = false;

        mc.userTenants = [];
        mc.userTenant = {};
        mc.userTenantChange = function() {
            $scope.$broadcast('userTenantChanged', mc.userTenant);
        };

        mc.logout = function () {
            common.logoutAction();
        };

        // 페이지 이동
        mc.goToPage = function (path) {
            common.locationPath(path);
		};

        // 페이지 resize
		mc.windowTriggerResize  = function(e) {
			$(window).trigger('resize');
		};

		// 언어 선택에 따른 값 세팅
        mc.setMainLanguage = function (languageKey) {
            mc.languages = CONSTANTS.languages[languageKey];
            mc.sltLanguage = common.objectsFindCopyByField(mc.languages, "key", languageKey);
            mc.sltDataTimePickerOptions = CONSTANTS.dataTimePickerLanguages[languageKey];
            mc.bodyLayout = languageKey;
        };

        // 기본 셋팅
        if (common.getLanguageKey() != "en") {
            common.setLanguageKey("ko");
        }
        mc.setMainLanguage(common.getLanguageKey());

        // 언어 변경 처리
        mc.changeLanguage = function (languageKey) {
            // 언어 변경
            $translate.use(languageKey);
            // 언어 key 캐쉬 저장
            common.changeLanguageKey(languageKey);
            // 언어 값 셋팅
            mc.setMainLanguage(languageKey);
        };

        // 로그 아웃 초기화
		mc.resetInit = function () {

			// 로그인 여부
			mc.isAuthenticated	= false;

            mc.navigationTreeTitle	= "";

            mc.leftMenuOn	= false;
			mc.mainTopOn	= false;

			mc.navigationTemplateUrl	= "";
			mc.leftMenuTemplateUrl		= "";
			mc.topTemplateUrl		= "";

			mc.leftMenuParams			= {};
			mc.selectSiteMap			= {};
            mc.companyLogoPath          = "";    //기업로고 경로

            mc.mainBodyLoaded = false;

			// 사용자 정보
			mc.userInfo = {};

		};

        // 로그인 후 초기화
		mc.loginSetingInit = function () {
			mc.isAuthenticated	= true;
			// 사용자 정보
			mc.userInfo = common.getUser();
            mc.is_manager = mc.userInfo.manager;
            mc.companyLogoPath = common.getCompanyLogo();   //기업로고 경로
		};

        // 로그인 후 초기화
		mc.replaceSeting = function () {
            if (mc.navigationTemplateUrl == "") {
                mc.navigationTemplateUrl	= CONSTANTS.layoutTemplateUrl.navigation + _VERSION_TAIL_;
			}
			// file Uploader 초기화
            common.initFileUploader(mc.uploader);
		};

		mc.resetInit();

        // left 메뉴 객체 셋팅
        mc.setSelectSiteMap = function (stateKey) {
            mc.selectSiteMap			= common.getStateKeyBySelectSietMap(stateKey);
            mc.leftMenuParams = [];
            if (mc.selectSiteMap && mc.selectSiteMap.mainKey) {
                mc.leftMenuParams = common.getLeftMenuList(mc.selectSiteMap, "A", "A");
            }
        };

        // left 메뉴 클릭 이벤트 처리
        mc.leftMenuClick = function (evt, mainKey, id) {
            var target = $(evt.currentTarget);
            if (!target.hasClass("active")) {
                if (target.hasClass("open")) {
                    common.setLeftMenusOpen(mainKey, id, false);
                } else {
                    common.setLeftMenusOpen(mainKey, id, true);
                }
                target.toggleClass("open");
                target.find("ul").toggle(200);
            } else {
                common.setLeftMenusOpen(mainKey, id, true);
            }
        };

        // file 찾기 버튼 클릭 처리(공통)
        mc.fileSelectBtnClick = function (evt) {
            var targetInput = $(evt.currentTarget.parentNode).find('input[type="file"]');
            if (targetInput.attr("name")) {
                mc.uploader.alias = targetInput.attr("name");
            }
            mc.uploader.input = true;
            targetInput.trigger("click");
        };

        // NavigationTreeTitle 생성
        mc.setNavigationTreeTitle = function () {
            if (mc.selectSiteMap && mc.selectSiteMap.key) {
                var organizationDisplayName = "";
                if (mc.sltOrganization && mc.sltOrganization.guid) {
                    organizationDisplayName = mc.sltOrganizationDisplayName + "(" + mc.sltOrganization.name +  ")";
                } else {
                    if (mc.sltCompany && mc.sltCompany.id) {
                        organizationDisplayName = mc.sltCompanyDisplayName;
                    }
                }
                mc.navigationTreeTitle = common.getNavigationTree(mc.selectSiteMap, organizationDisplayName);
            } else {
                mc.navigationTreeTitle = "";
            }
        }

        // LayOut TemplateUrl 셋팅
        mc.setLayout = function () {
            if (common.isAuthenticated()) {
            } else {
            }
        };

        mc.toggleAccordion = function (accordionGroup, targetAccordion) {
            var accordionGroup = $('#' +accordionGroup);
            accordionGroup.find('.panel-collapse.collapse:not(#'+targetAccordion+')').collapse('hide');
            accordionGroup.find('#' + targetAccordion).collapse('toggle');
        };

        mc.reloadTimmerStop = function () {
            if (mc.reloadTimmer != null) {
                if (angular.isArray(mc.reloadTimmer)) {
                    for (var i=0; i<mc.reloadTimmer.length; i++) {
                        if ($timeout.cancel(mc.reloadTimmer[i])) {
                            delete mc.reloadTimmer[i];
                        }
                    }
                    if (mc.reloadTimmer.length) {
                        mc.reloadTimmer = null;
                    }
                } else {
                    if ($timeout.cancel(mc.reloadTimmer)) {
                        mc.reloadTimmer = null;
                    }
                }
            }
        };

		mc.replacePage = function () {
            $state.reload();
        };

        mc.memberInfo = function () {
            mc.goToPage("/member");
        };

        // Console New Tab
        mc.goConsole = function () {
            // Logout Check
            if (!common.isAuthenticated())
            {
                common.moveLoginPage();
                common.clearUser();
                return;
            }

            $scope.main.childWindow = $window.open(CONSTANTS.consoleUrl, 'cloudConsoleTab');
        };

        /*[IaaS]/[PaaS]/[DevOps]/[Community] 클릭 시 처리*/
        mc.systemLink = function(systemCode){
            switch (systemCode){
                case "IaaS" :
                    if (mc.userInfo.isIaaS) {
                        common.locationHref("/iaas/");
                    } else {
                        common.showAlert("", $translate.instant("message.mi_company_manager_contact"));
                    }
                    break;
                case "PaaS" :
                    if(mc.userInfo.isPaaS) {
                        common.locationHref("/paas/");
                    } else {
                        common.showAlert("", $translate.instant("message.mi_company_manager_contact"));
                    }
                    break;
                case "Monit" :
                    if(mc.userInfo.isMonit) {
                        common.locationHref("/monit/");
                    } else {
                        common.showAlert("", $translate.instant("message.mi_company_manager_contact"));
                    }
                    break;
                case "DevOps" :
                    if (mc.userInfo.isDevOps) {
                        common.locationHref("/#/comm/devops");
                    } else {
                        common.showAlert("", $translate.instant("message.mi_company_manager_contact"));
                    }
                    break;
                case "Market" :
                    common.locationHref("/market/");
                    break;
                case "Community" :
                    common.locationHref("/#/comm/boards/notice");
                    break;
            }
        };

        // select2 사용자 정의 옵션(html 사용)
        mc.usSelectTwoOptions = {
            templateResult: function (state) {
                var option = $(state.element);
                var optionHtml = option.attr("option-html");
                if (!state.id || !optionHtml) {
                    return state.text;
                }
                if (optionHtml) {
                    optionHtml = optionHtml.replace(new RegExp("{value}", "gim"), state.id);
                    optionHtml = optionHtml.replace(new RegExp("{text}", "gim"), state.text);
                    return $(optionHtml);
                }
            },
            minimumResultsForSearch: Infinity,
            allowClear : true
        };

        mc.isPopCreateUserKey = false;

        mc.createUserKey = function ($event) {
			pop.userKeyData = {};
            $scope.dialogOptions = {
				title : $translate.instant("label.create_key"),
                formName : "popUserKeyForm",
                dialogClassName : "modal-dialog",
				templateUrl: _VIEWS_ + "/user/popUserKeyForm.html" + _VersionTail(),
				okName : $translate.instant("label.create_key")
			};
            $scope.actionBtnHied = false;
			common.showDialog($scope, $event, $scope.dialogOptions);
			// Dialog ok 버튼 클릭 시 액션 정의
			$scope.popDialogOk = function () {
				pop.createUserKey(pop.userKeyData);
			};
	        $scope.popCancel = function () {
		        common.isPopCreateUserKey = false;
		        $scope.dialogClose	= true;
		        common.mdDialogCancel();
	        };
	        $scope.popHide = function () {
		        common.isPopCreateUserKey = false;
		        $scope.dialogClose	= true;
		        common.mdDialogHide();
	        };
		};

        var pop = $scope.pop = {};

        pop.createUserKey = function (userKeyData) {
			if ($scope.actionBtnHied) return;
			$scope.actionBtnHied = true;
			if (!userKeyData.password) {
				alert($translate.instant("message.mi_type_pwd"));
				document.getElementById("popUserKeyForm.password").focus();
                $scope.actionBtnHied = false;
				return;
			}
			$scope.actionLoading = true;
			var body = {'password': userKeyData.password};

			var userPromise = user.refreshAccessToken(body);
			userPromise.success(function (data) {
				common.isPopCreateUserKey = false;
				common.mdDialogHide();
				common.showAlert($translate.instant("label.create_cmplt"), $translate.instant("message.mi_register_success"));
				$state.reload();
				$scope.actionLoading = false;
				$scope.actionBtnHied = false;
			});
			userPromise.error(function (data) {
				$scope.actionLoading = false;
				$scope.actionBtnHied = false;
			});
		};

		if (common.isAuthenticated()) {
			if (!common.isNotLoginAcceptPage($location.path())) {
                // 로그인 토큰 체크 (처음 로드 할 때만)
				// 동기식 체크
				if (!user.checkAccessToken(common.getAccessToken())) {
                    common.clearAccessToken();
                    common.logout();
                }
			}
		}
commonControllers_mainCtrl({
	$scope : $scope,
	$location : $location,
	common : common,
	CONSTANTS : CONSTANTS,
	projectService : projectService,
	orgService : orgService,
	mc : mc
});
        _DebugConsoleLog('commonControllers.js : mainCtrl End', 1);
	})
	.controller('mainBodyCtrl', function ($scope, $location, $templateCache, $state, $stateParams, $timeout, $window, $translate, common, CONSTANTS) {

		_DebugConsoleLog("commonControllers.js : mainBodyCtrl Start, path : " + $location.path(), 1);

        var mb = this;

        // 로그인 여부 체크
        if (!common.isAuthenticated()) {
            common.clearUserAll();
            $scope.main.resetInit();
/*
            if (common.isLoginAcceptPage($location.path())) {
                common.moveLoginPage();
            }
*/
        } else {
            if (common.isNotLoginAcceptPage($location.path())) {
                common.goHomePath();
            }
            if (!$scope.main.mainBodyLoaded) {
                $scope.main.mainBodyLoaded = true;
                $scope.main.loginSetingInit();
            }
        }

        $scope.main.replaceSeting();

        // timmer 중지
		$scope.main.reloadTimmerStop();

        $scope.main.loadingMain = false;
        $scope.main.loadingMainBody = false;

		$scope.main.pageLoadCount++;

        $scope.main.setSelectSiteMap($state.current.name);

        $scope.main.setNavigationTreeTitle();

        $scope.main.setLayout();

        if ($scope.main.selectSiteMap && $scope.main.selectSiteMap.parentSiteMap && $scope.main.selectSiteMap.parentSiteMap.url) {
            $scope.main.moveParentUrl = $scope.main.selectSiteMap.parentSiteMap.url;
            $scope.main.parentMenuName = $scope.main.selectSiteMap.parentSiteMap.name;
        } else {
            $scope.main.moveParentUrl = "";
            $scope.main.parentMenuName = "";
        }

        $scope.main.uploadProgress = null;

		// 권한 체크
/*
		if ($scope.main.userInfo.user_auth != "A") {

			// 프로젝트 선택 후 접근 가능한 페이지 체크
			if (($scope.main.selectSiteMap.orgType) && !$scope.main.selectProject.authority) {
				common.showAlert("접근오류", "해당 페이지는 프로젝트 선택 후 접근이 가능 합니다.");
				$window.history.back();
				return;
			}

			// 접근 권한 체크
			var isPageView = true;
			if ($scope.main.selectSiteMap.notAuth) {
				if ($scope.main.selectSiteMap.notAuth.indexOf($scope.main.userInfo.user_auth) >= 0) {
					isPageView = false;
				}
			}
			if ($scope.main.selectSiteMap.notPAuth) {
				if ($scope.main.selectProject.authority && $scope.main.selectSiteMap.notPAuth.indexOf($scope.main.selectProject.authority) >= 0) {
					isPageView = false;
				}
			}

			if (!isPageView) {
				common.showAlert("접근오류", "해당 페이지에 대한 접근 권한이 없습이다.");
				$window.history.back();
				return;
			}

			// Edit 권한 체크 설정
			if ($scope.main.selectSiteMap.notEdAuth) {
				if ($scope.main.selectSiteMap.notAuth.indexOf($scope.main.selectProject.user_auth) >= 0) {
					$scope.main.isPageEdit = false;
				}
			}
			if ($scope.main.selectSiteMap.notEdPAuth) {
				if (!$scope.main.selectProject.authority && $scope.main.selectSiteMap.notPAuth.indexOf($scope.main.selectProject.authority) >= 0) {
					$scope.main.isPageEdit = false;
				}
			}
		}
*/

        // 페이지 로드 처리
		if ($scope.main.selectSiteMap && $scope.main.selectSiteMap.contentsView) {
            var contentsTemplateUrl = "mainContentsTemplate";
            var controllerHtml = "";
            if ($scope.main.selectSiteMap.contentsView.controller) {
                controllerHtml = ' ng-controller="' + $scope.main.selectSiteMap.contentsView.controller + ' as ' + $scope.main.selectSiteMap.contentsView.controllerAs + '"';
            } else {
                $scope.main.loadingMainBody = false;
            }
		    if ($scope.main.selectSiteMap.contentsView.templateUrl) {
                common.getTemplateHtml($scope.main.selectSiteMap.contentsView.templateUrl + _VersionTail(), function (templateHtml) {
                    var contentsTemplateHtml = '<div id="mainContents"'+ controllerHtml + ' style="height: 100%;">\n' + templateHtml + '\n</div>';
                    $templateCache.put(contentsTemplateUrl, contentsTemplateHtml);
                    mb.mainContentsTemplateUrl = contentsTemplateUrl;
                });
            } else {
                var contentsTemplateHtml = '<div id="mainContents"'+ controllerHtml + ' ng-include="mainContentsTemplateHtml"></div>';
                $templateCache.put(contentsTemplateUrl, contentsTemplateHtml);
                mb.mainContentsTemplateUrl = contentsTemplateUrl;
            }
		} else {
            mb.mainContentsTemplateUrl = "";
		}

		if (!$scope.main.contentsLayoutResizeEvent) {
			document.getElementById("mainContentsLayout").addEventListener("transitionend", function(e) {
				$scope.main.windowTriggerResize(e);
			});
			$scope.main.contentsLayoutResizeEvent	= true;
		}
commonControllers_mainBodyCtrl({
	$scope : $scope,
	$location : $location,
	mb : mb
});
        _DebugConsoleLog("commonControllers.js : mainBodyCtrl End", 1);
    })
;