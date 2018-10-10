'use strict';

angular.module('common.controllers', [])
// 최초 접속 혹은 새로고침 시 as main
    .controller('mainCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, $interval, $cookies, cache, cookies, user, common, portal, userSettingService, CONSTANTS, FileUploader) {
        _DebugConsoleLog('commonControllers.js : mainCtrl Start, path : ' + $location.path(), 1);

        var mc = this;

        mc.topLogoIcon = "images/top_logo.png";

        mc.projectType = _PROJECT_TYPE_;

		mc.pageLoadCount = 0;
        // 기본 셋팅
        if (common.getLanguageKey() != "en") {
            common.setLanguageKey("ko");
        }

        mc.bodyLayout = common.getLanguageKey();
        mc.sltDataTimePickerOptions = CONSTANTS.dataTimePickerLanguages[common.getLanguageKey()];

        mc.uploader = new FileUploader();
        mc.loadingMain = true;
        mc.loadingMainBody = false;
        //	mainContentsLayout Resize 이벤트 셋팅 여부
        mc.contentsLayoutResizeEvent	= true;
        mc.loadingProgressBar = CONSTANTS.loadingProgressBar;

        mc.languages = [];
        mc.sltLanguage = {};
        mc.sltRegion = {};

        mc.regions = [];
        mc.commLeftFav = { setMode: false, dataLoad: false  };

        mc.reloadTimmer = {};
        mc.reloadCommTimmer = {};
        mc.refreshInterval = {};
        mc.mainBodyLoaded = false;
        mc.isLoginPage = false;

        mc.mainLoadTime = new Date().getTime();

        mc.connectType = _CONNECT_SITE_;

        if (_MENU_TYPE_ == 'part') {
            mc.commLayerMenuTempeUrl = _COMM_VIEWS_ + '/menu/commLayerMenu.html' + _VERSION_TAIL_;
            mc.commMenuContentTempeUrl = _COMM_VIEWS_ + '/menu/commMenuContent.html' + _VERSION_TAIL_;
        } else {
            mc.commLayerMenuTempeUrl = _COMM_VIEWS_ + '/menu/commLayerAllMenu.html' + _VERSION_TAIL_;
            mc.commMenuContentTempeUrl = _COMM_VIEWS_ + '/menu/commAllMenuContent.html' + _VERSION_TAIL_;
        }
        mc.portalOrgDropdownTempeUrl = _COMM_VIEWS_+'/portalOrgDropdown.html'+_VERSION_TAIL_;

        mc.commLeftFav.sortableOptions = {
            stop: function(event, ui) {
                if (!mc.commLeftFav.setMode) {
                    mc.commLeftFav.linkIcons = angular.copy(mc.commLeftFav.linkIconMenus);
                    mc.saveCommLeftFavLinkIcons();
                }
            }
        };

        // 로그 아웃
        mc.logout = function () {
            user.logoutAction();
            $scope.main.isLoginPage = false;
            $scope.main.mainLayoutClass = "one_page";
        };

        // 페이지 이동
        mc.goToPage = function (path) {
            common.locationPath(path);
		};

        // 페이지 이동 (state)
        mc.goToState = function (stateKey) {
            common.goToState(stateKey);
        };

        mc.moveToAppPage = function(path, title) {
            if(title) {
                mc.sltOrganizationName = title;
            } else {
                mc.sltOrganizationName = "";
            }
            common.locationPath(path);
        };

        // 페이지 resize
        mc.windowTriggerResize  = function(e) {
            $(window).trigger('resize');
        };

        // left 메뉴 토글
        mc.leftMenuDefaultSet = function () {
            common.leftMenuDefaultSet();
        };

        mc.leftMenuToggle = function () {
            if (_MENU_TYPE_ == 'part') {
                if (mc.pageStage == 'comm') {
                    if (common.isLeftMenuShow()) {
                        common.leftMenuHide();
                    } else {
                        common.leftMenuShow();
                    }
                } else {
                    common.commMenuTogle();
                }
            } else {
                if (mc.pageStage == 'comm' || mc.pageStage == 'iaas'  || mc.pageStage == 'paas'  || mc.pageStage == 'monit') {
                    if (common.isLeftMenuShow()) {
                        common.leftMenuHide();
                    } else {
                        common.leftMenuShow();
                    }
                } else {
                    common.commAllMenuTogle();
                }
            }
        };

        mc.commMenuHide = function () {
            common.commMenuHide();
        };

        // left 메뉴 클릭 이벤트 처리
        mc.partLeftMenuClick = function (evt, mainKey, id) {
            if ($(evt.currentTarget).parent().find("div").length > 0) {
                var target = $(evt.currentTarget).find("a");
                if (target.hasClass("on")) {
                    common.setLeftMenusOpen(mainKey, id, false);
                } else {
                    common.setLeftMenusOpen(mainKey, id, true);
                }
                target.toggleClass("on");
                $(evt.currentTarget).parent().find("div").toggle(200);
            }
        };

        // left 메뉴 클릭 이벤트 처리
        mc.commPartTopLeftMenuClick = function (evt, pageStage) {
            if (pageStage == 'home') {
                common.goHomePath();
            } else {
                if ((pageStage == 'iaas' || pageStage == 'paas' || pageStage == 'monit') && (!mc.sltProject || !mc.sltProject.orgs || mc.sltProject.orgs.length == 0 || !mc.userTenantId || !mc.sltOrganizationGuid)) {
                    common.showAlertWarning("작업 정복가 존재하지 않습니다. 작업을 선택 하십시오.");
                }
                var target = $(evt.currentTarget);
                var il_items = target.parent().parent().find("> il");

                angular.forEach(il_items, function (item, key) {
                    if (item != target.parent()[0]) {
                        $(item).find("> a").removeClass("on");
                        $(item).find("> ul").css({display: 'none'});
                    }
                });

                target.toggleClass("on");
                if (target.parent().find("> ul").length > 0) {
                    target.parent().find("> ul").toggle(200);
                }
            }
        };

        // left 메뉴 클릭 이벤트 처리
        mc.commPartLeftMenuClick = function (evt, menuItem) {
            if ((menuItem.pageStage == 'iaas' || menuItem.pageStage == 'paas' || menuItem.pageStage == 'monit') && (!mc.sltProject || !mc.sltProject.orgs || mc.sltProject.orgs.length == 0 || !mc.userTenantId || !mc.sltOrganizationGuid)) {
                common.showAlertWarning("작업 정복가 존재하지 않습니다. 작업을 선택 하십시오.");
            }
            var target = $(evt.currentTarget);
            var il_items = target.parent().parent().find("> li");
            angular.forEach(il_items, function (item, key) {
                if (item != target.parent()[0]) {
                    $(item).find("> p > a").removeClass("on");
                    $(item).find("> ul").css({display: 'none'});
                }
            });
            target.find("> a").toggleClass("on");
            if (target.parent().find("> ul").length > 0) {
                target.parent().find("> ul").toggle(200);
            }
        };

        // left 메뉴 클릭 이벤트 처리
        mc.commLeftMenuClick = function (evt, menuItem) {
            if (menuItem.key == 'platform_service' && (!mc.sltProject || !mc.sltProject.orgs || mc.sltProject.orgs.length == 0 || !mc.userTenantId || !mc.sltOrganizationGuid)) {
                common.showAlertWarning("작업 정복가 존재하지 않습니다. 작업을 선택 하십시오.");
            }
            if ($(evt.currentTarget).parent().find("ul").length > 0) {
                var target = $(evt.currentTarget).find("a");
                if (target.hasClass("on")) {
                    common.setLeftMenusOpen(menuItem.mainKey, menuItem.id, false);
                } else {
                    common.setLeftMenusOpen(menuItem.mainKey, menuItem.id, true);
                }
                target.toggleClass("on");
                $(evt.currentTarget).parent().find("ul").toggle(200);
            }
        };

        // left Fav Icon 메뉴 토글
        mc.leftIconFavMenuToggle = function (evt) {
            if(mc.commLeftFav.favIconMenuClass == "on") {
                mc.commLeftFav.favIconMenuClass = "";
                if ($scope.main.leftMenuLayoutClass == "leftMenu on" || $scope.main.leftMenuLayoutClass == "leftMenu pageLoad on") {
                    $scope.main.leftMenuLayoutClass = "leftMenu";
                }
            } else {
                if ($scope.main.leftMenuLayoutClass == "leftMenu") {
                    $scope.main.leftMenuLayoutClass = "leftMenu on";
                }
                mc.commLeftFav.favIconMenuClass = "on";
            }
        };

        // left Icon 즐겨찾기 토글
        mc.leftIconFavToggle = function (evt) {
            if (mc.commLeftFav.favClass != "on") {
                mc.commLeftFav.favClass = "on";
                var linkIcon = {
                    name: mc.selectSiteMap.pageStage + 'Menu.menu.'+mc.selectSiteMap.name,
                    pageStage: mc.selectSiteMap.pageStage,
                    path: $location.path(), link: "",
                    icon: "ico" + (mc.commLeftFav.linkIcons.length%8 + 1)
                };
                mc.commLeftFav.linkIcons.push(linkIcon);
                mc.commLeftFav.linkIconMenus.push(angular.copy(linkIcon));
                mc.saveCommLeftFavLinkIcons();
            }
        };

        mc.setLeftIconFavToggle = function (path) {
            if (common.objectsFindCopyByField(mc.commLeftFav.linkIcons, "path", path)) {
                mc.commLeftFav.favClass = "on";
            } else {
                mc.commLeftFav.favClass = "";
            }
        };

        // left Icon click
        mc.leftLinkIconClick = function (evt, item) {
            if (mc.commLeftFav.setMode) return;
            if (item.link) {
                common.locationHref(item.link);
            } else {
                common.locationPath(item.path);
            }
        };

        mc.leftLinkIconRemoveClick= function (evt, key, item) {
            if (!mc.commLeftFav.setMode) return;
            mc.commLeftFav.linkIconMenus.splice(key, 1);
        };

        // left Icon 설정 토글
        mc.leftIconSetToggle = function (evt) {
            if (!mc.commLeftFav.setMode) {
                mc.commLeftFav.favSetClass = "on";
                mc.commLeftFav.favSetlmmClass = "modicon";
                mc.commLeftFav.setMode = true;
            } else {
                mc.commLeftFav.favSetClass = "";
                mc.commLeftFav.favSetlmmClass = "";
                mc.commLeftFav.setMode = false;
                mc.commLeftFav.linkIcons = angular.copy(mc.commLeftFav.linkIconMenus);
                mc.saveCommLeftFavLinkIcons();
            }
        };

        // 언어 선택에 따른 값 세팅
        mc.setMainLanguage = function (languageKey) {
            mc.languages = CONSTANTS.languages[languageKey];
            mc.sltLanguage = common.objectsFindCopyByField(mc.languages, "key", languageKey);
            mc.sltDataTimePickerOptions = CONSTANTS.dataTimePickerLanguages[languageKey];
            mc.admDtpCalTypeOptions = { gregorianDic : mc.sltDataTimePickerOptions };
            mc.bodyLayout = languageKey;
        };

        // 언어 변경 처리
        mc.changeLanguage = function (languageKey) {
            // 언어 변경
            $translate.use(languageKey);
            // 언어 key 캐쉬 저장
            common.changeLanguageKey(languageKey);
            // 언어 값 셋팅
            mc.setMainLanguage(languageKey);
        };

        // Organization 값 셋팅
        mc.setCategory = function(category) {
            if (category && category.id) {
                mc.sltCategory = category;
                mc.sltCategoryId = category.id;
                mc.sltCategoryDisplayName = category.name;
            } else {
                mc.sltCategory = null;
                mc.sltCategoryId = 0;
                mc.sltCategoryDisplayName = $translate.instant("label.all");
            }
        };

        // 카테고리 변경 처리
        mc.changeCategory = function (category) {
            // Categgory 값 셋팅
            mc.setCategory(category);
            // Main Top Navigation 처리
            //mc.setNavigationTreeTitle();

            $scope.$broadcast('categoryChanged', mc.sltCategory);
        };

        // 카테고리 리스트 셋팅(동기 방식) 현재 사용
        mc.syncListAllCategories = function () {
            var response = portal.marketCategorys.syncListAllMarketCategoriesByParentIdAndOpenStatus(0);
            if (response && response.status == 200) {
                mc.categories = response.data;
            } else {
                mc.categories = [];
            }
        };

        mc.syncSetPassRegionSet = function () {
            var response = portal.regions.syncListAllRegions();
            if (response && response.status == 200 && angular.isArray(response.data)) {
                mc.regions = response.data;
                if (mc.regions.length > 0) {
                    mc.sltRegion = mc.regions[0];
                    if(mc.sltRegion && $scope.main.sltRegion.url) {
                        var regionUrl = $scope.main.sltRegion.url;
                        var regionTailUrl = regionUrl.substring(regionUrl.indexOf('.'), regionUrl.length);
                        mc.sltRegion.mysqlDbWebXpertUrl = $location.protocol() + "://" + CONSTANTS.xpertHosts.mysqlDB + regionTailUrl;
                        mc.sltRegion.webLogXpertUrl = $location.protocol() + "://" + CONSTANTS.xpertHosts.webLog + regionTailUrl;
                        mc.sltRegion.terminalXpertUrl = $location.protocol() + "://" + CONSTANTS.xpertHosts.terminal + regionTailUrl;
                        mc.sltRegion.autoScalerXpertUrl = $location.protocol() + "://" +  _DOMAIN_ + ":" + $location.port() + "/" + CONSTANTS.xpertHosts.autoScaler;
                        mc.sltRegion.autoScalerEnabled = false;
                    }
                }
            } else {
                mc.regions = [];
            }
        };

        //Left Menu 구조 생성
        mc.setDbMenuList = function() {
            mc.dbMenuList = [];
            var response = portal.menu.getMenuList();
            if (response && response.status == 200 && angular.isObject(response.data) && angular.isArray(response.data.items)) {
                mc.dbMenuList = response.data.items;
            }
        };

        //url정보 체크하여 메뉴 위치 확인
        mc.desplayDbMenuList = function(myRoleName) {
            portal.menu.setListMenu(mc.dbMenuList, myRoleName);
        };

        //url정보 체크하여 메뉴 위치 확인
        mc.urlCheck = function(){
            portal.menu.urlCheck();
        };

        // PortalOrg 변경 처리
        mc.changePortalOrg = function(portalOrg) {
            mc.setPortalOrg(portalOrg);
            if (angular.isObject(portalOrg) && portalOrg.id) {
                mc.asideClose();
                $scope.$broadcast('portalOrgChanged', mc.sltPortalOrg);
                $scope.$broadcast('userTenantChanged', mc.userTenant);
                $scope.$broadcast('organizationChanged', mc.sltOrganization);
            } else {
                common.goHomePath();
            }
        };

        // Organization 값 셋팅
        mc.setPortalOrg = function(portalOrg) {
            if (angular.isObject(portalOrg) && portalOrg.id) {
                $timeout(function () {
                    mc.desplayDbMenuList(portalOrg.myRoleName);
                    $scope.main.urlCheck();
                }, 100);
                common.setPortalOrgKey(portalOrg.id);
                mc.sltPortalOrg = portalOrg;
                mc.sltPortalOrgId = portalOrg.id;
                mc.sltPortalOrgDisplayName = portalOrg.orgName;
                mc.loadUserTenant();
                mc.loadSltOrganization();
            } else {
                $timeout(function () {
                    mc.desplayDbMenuList("none");
                    $scope.main.urlCheck();
                }, 100);
                if (mc.sltPortalOrgId) {
                    common.clearPortalOrgKey();
                    mc.sltPortalOrg = {};
                    mc.sltPortalOrgId = "";
                    mc.sltPortalOrgDisplayName = "";
                    mc.setUserTenant(null);
                    mc.setOrganization(null);
                }
            }
        };

        mc.syncListTenants = function (projectId) {
            mc.userTenants = [];
            if (projectId) {
                var response = portal.portalOrgs.syncListTenantByName(projectId);
                if (response && response.status == 200 && angular.isArray(response.data.content)) {
                    mc.userTenants = response.data.content;
                    for (var i=0; i<mc.userTenants.length; i++) {
                        if (mc.userTenants[i]) {
                            mc.userTenants[i].orgCode = mc.userTenants[i].pk.orgCode;
                            mc.userTenants[i].teamCode = mc.userTenants[i].pk.teamCode;
                        }
                    }
                }
            }
        };

        mc.syncGetTenantByName = function (orgCode, teamCode) {
            var response = portal.portalOrgs.syncGetTenantByName(orgCode, teamCode);
            if (response && response.status == 200 && angular.isObject(response.data.content)) {
                return response.data.content;
            } else {
                return null;
            }
        };

        mc.loadUserTenant = function () {
            if (angular.isObject(mc.sltProject) && mc.sltProjectId && angular.isObject(mc.sltPortalOrg) && mc.sltPortalOrg.orgId) {
                var userTenant = mc.syncGetTenantByName(mc.sltProjectId, mc.sltPortalOrg.orgId);
                if (userTenant) {
                    userTenant.orgCode = userTenant.pk.orgCode;
                    userTenant.teamCode = userTenant.pk.teamCode;
                }
                mc.setUserTenant(userTenant);
            } else {
                mc.setUserTenant(null);
            }
        };

        // UserTenant 값 셋팅
        mc.setUserTenant = function(userTenant) {
            if (angular.isObject(userTenant) && userTenant.tenantId) {
                mc.userTenant = userTenant;
                mc.userTenantId = userTenant.tenantId;
                mc.userTenant.id = userTenant.tenantId;
                mc.userTenant.korName = mc.sltPortalOrg.orgName;
                mc.uaerTenantDisplayName = mc.userTenant.korName;
            } else {
                mc.userTenant = {};
                mc.userTenantId = "";
                mc.uaerTenantDisplayName = "";
            }
        };

        mc.syncGetOrganizationByName = function (name) {
            var response = portal.portalOrgs.syncGetOrganizationByName(name, 2);
            if (response && response.status == 200) {
                return response.data;
            } else {
                return null;
            }
        };

        mc.loadSltOrganization = function () {
            if ($scope.main.sltPortalOrg && $scope.main.sltPortalOrg.orgId) {
                mc.setOrganization(mc.syncGetOrganizationByName($scope.main.sltPortalOrg.orgId));
            } else {
                mc.setOrganization(null);
            }
        };

        // Organization 값 셋팅
        mc.setOrganization = function(organization) {
            if (organization && organization.guid) {
                mc.sltOrganization = organization;
                mc.sltOrganizationGuid = organization.guid;
                mc.sltOrganizationDisplayName = organization.orgName;
            } else {
                mc.sltOrganization = {};
                mc.sltOrganizationGuid = "";
                mc.sltOrganizationDisplayName = "";
            }
        };

        mc.syncListAllProjects = function () {
            var response = portal.portalOrgs.syncListAllProjects();
            if (response && response.status == 200 && angular.isObject(response.data) && angular.isArray(response.data.items)) {
                mc.projects = response.data.items;
                if (mc.sltProjectId) {
                    mc.setProject(common.objectsFindCopyByField(mc.projects, "id", mc.sltProjectId));
                } else {
                    if (mc.projects.length > 0) {
                        mc.setProject(mc.projects[0]);
                    }
                }
            } else {
                mc.projects = [];
            }
        };

        mc.setListAllPortalOrgs = function (portalOrgs) {
            var sltPortOrg;
            var sltPortOrgId = "";
            if (angular.isArray(portalOrgs)) {
                mc.portalOrgs = portalOrgs;
                if (mc.portalOrgs.length > 0) {
                    sltPortOrg = common.objectsFindCopyByField(mc.portalOrgs, "id", mc.sltPortalOrgId);
                    if (!angular.isObject(sltPortOrg) || !sltPortOrg.id) {
                        sltPortOrg = mc.portalOrgs[0];
                    }
                    sltPortOrgId = sltPortOrg.id;
                } else {
                    mc.portalOrgs = [];
                }
            } else {
                mc.portalOrgs = [];
            }
            if (mc.sltPortalOrgId == sltPortOrgId) {
                mc.setPortalOrg(sltPortOrg);
            } else {
                mc.changePortalOrg(sltPortOrg);
            }
        };

        mc.syncListAllPortalOrgs = function () {
            var response = portal.portalOrgs.syncListAllPortalOrgs(mc.sltProjectId);
            if (response && response.status == 200 && angular.isObject(response.data) && angular.isArray(response.data.items)) {
                mc.setListAllPortalOrgs(response.data.items);
            } else {
                mc.setListAllPortalOrgs();
            }
        };

        // Organization 리스트 한글명 매핑
        mc.sinkPotalOrgsName = function (organizations) {
            if (organizations && angular.isArray(organizations)) {
                for (var i=0;i<organizations.length; i++) {
                    organizations[i] = mc.sinkPotalOrgName(organizations[i]);
                }
                organizations.sort(function (a, b) { return (a.projectId+'_'+a.orgName > b.projectId+'_'+b.orgName) ? 1 : -1; });
            }
            return organizations;
        };

        // Organization 리스트 한글명 매핑
        mc.getProjects = function (organizations) {
            var projects = [];
            var projectObjs = {};
            for (var i=0;i<organizations.length; i++) {
                // projectObjs 셋팅
                if (!projectObjs[organizations[i].projectId]) {
                    projectObjs[organizations[i].projectId] = {
                        id : organizations[i].projectId,
                        name : organizations[i].projectId
                    };
                    projectObjs[organizations[i].projectId].organizationGuids = [];
                    projectObjs[organizations[i].projectId].organizationNames = [];
                    projectObjs[organizations[i].projectId].organizations = [];
                }
                var organization = {
                    guid : organizations[i].guid,
                    name : organizations[i].name,
                    orgName : organizations[i].orgName
                };
                projectObjs[organizations[i].projectId].organizationGuids.push(organizations[i].guid);
                projectObjs[organizations[i].projectId].organizationNames.push(organizations[i].name);
                projectObjs[organizations[i].projectId].organizations.push(organization);
            }
            // projects 셋팅
            for (var projectId in projectObjs) {
                projects.push(projectObjs[projectId]);
            }
            return projects;
        };

        // Organization 한글명 매핑
        mc.sinkPotalOrgName = function (organization) {
			if (angular.isObject(organization)) {
	            for (var i=0;i<mc.portalOrgs.length; i++) {
	                if (organization.name == mc.portalOrgs[i].orgId) {
	                    organization.orgName = mc.portalOrgs[i].orgName;
	                    organization.projectId = mc.portalOrgs[i].projectId;
	                    break;
	                }
	            }
	            if (!organization.orgName) {
	                organization.orgName = organization.name;
	                organization.projectId = organization.name;
	            }
			}
            return organization;
        };

        // Organization 리스트 셋팅(동기 방식)
        mc.syncListAllOrganizations = function () {
            var response = portal.organizations.syncListAllOrganizations(null, 1);
            if (response && response.status == 200) {
                // Organization 한글명 매핑
                mc.organizations = mc.sinkPotalOrgsName(response.data);
                mc.projects = mc.getProjects(mc.organizations);
                if (mc.sltProjectId) {
                    mc.setProject(common.objectsFindCopyByField(mc.projects, "id", mc.sltProjectId));
                }
                if (mc.sltOrganizationGuid) {
                    mc.setOrganization(common.objectsFindCopyByField(mc.organizations, "guid", mc.sltOrganizationGuid));
                }
            } else {
                mc.organizations = [];
                mc.sltOrganizationGuid = null;
            }
        };

        // Organization 리스트 셋팅(비동기 방식)
        mc.listAllOrganizations = function () {
            var organizationPromise = portal.organizations.listAllOrganizations(null, 1);
            organizationPromise.success(function (data) {
                // Organization 한글명 매핑
                mc.organizations = mc.sinkPotalOrgsName(data);
                mc.projects = mc.getProjects(mc.organizations);
                if (mc.sltProjectId) {
                    mc.setProject(common.objectsFindCopyByField(mc.projects, "id", mc.sltProjectId));
                }
                if (mc.sltOrganizationGuid) {
                    mc.setOrganization(common.objectsFindCopyByField(mc.organizations, "guid", mc.sltOrganizationGuid));
                }
            });
            organizationPromise.error(function (data) {
                mc.sltOrganizationGuid = null;
                mc.organizations = [];
            });
        };

        //Alarm 조회
        mc.listAlarms = function () {
            if (!mc.userInfo || !mc.userInfo.email){
                mc.alarms = {};
                return;
            }

            var response = portal.alarms.listAlarms(mc.userInfo.email);
            response.success(function (data) {
                mc.alarms = data;
                for (var i=0; i<mc.alarms.content.length; i++){
                    mc.alarms.content[i].registDttm = cmm.convertStringToDate(mc.alarms.content[i].registDttm);
                    mc.alarms.content[i].updateDttm = cmm.convertStringToDate(mc.alarms.content[i].updateDttm);
                }
            });
/*
            response.error(function (data) {
                mc.alarms = {};
            });
*/
        };

        // Project 값 셋팅
        mc.setProject = function(project) {
            if (project && project.id) {
                mc.sltProject = project;
                mc.sltProjectId = project.id;
                common.setProjectKey(mc.sltProjectId);
                mc.sltProjectDisplayName = project.name;
            } else {
                mc.sltProject = null;
                mc.sltProjectId = "";
                mc.sltProjectDisplayName = $translate.instant("label.all");
            }
            //mc.syncListTenants(mc.sltProjectId);
            mc.syncListAllPortalOrgs();
        };

        // Project 변경 처리
        mc.changeProject = function(project) {
            // Project 캐쉬 처리
            if (angular.isObject(project) && project.id) {
                common.setProjectKey(project.id);
                mc.setProject(project);
            }
        };

        mc.mainTopChangeProject = function () {
            mc.changeProject(common.objectsFindCopyByField(mc.projects, "id", mc.sltProjectId));
        };

        // Organization 셋팅 후 페이지 이동
        mc.setOrganizationAndGoToPath = function (organizationGuid, path) {
            mc.setOrganization(common.objectsFindCopyByField(mc.organizations, "guid", organizationGuid));
            mc.goToPage(path);
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
            mc.commLeftMenuParams       = null;
            mc.commLeftFav              = { setMode: false, dataLoad: false  };
            mc.leftCateMenuParams       = null;
            mc.selectSiteMap			= {};

            // 사용자 정보
            mc.userInfo = {};

            mc.sltPortalOrg = {};
            mc.sltPortalOrgId = "";
            mc.sltPortalOrgDisplayName = "";

            mc.sltOrganization = {};
            mc.sltOrganizationGuid = "";
            mc.sltOrganizationName = "";
            mc.sltOrganizationDisplayName = "";

            mc.sltProject = {};
            mc.sltProjectId = "";
            mc.sltProjectDisplayName = "";
            mc.sltSpaceGuid = "";
            mc.moveParentUrl = "";
            mc.detailOrgName = "";

            mc.userTenant = {};
            mc.userTenantId = "";
            mc.userTenantName = "";
            mc.userTenantDisplayName = "";

            mc.projects = [];
            mc.portalOrgs = [];
            mc.userTenants = [];
            mc.organizations = [];
            mc.alarms = {};     //alarm.list : mc.alarms.content

            $scope.main.mainBodyLoaded = false;
        };

        // 로그인 후 초기화
        mc.loginSetingInit = function () {
            mc.isAuthenticated	= true;
            // 사용자 정보
            mc.userInfo = common.getUser();
            mc.userAuth = common.getUserAuth();
        };

        // 초기화
        mc.replaceSeting = function () {
            // file Uploader 초기화
            common.initFileUploader(mc.uploader);
        };

        mc.getCategoryMemuList = function (selectSiteMap, cate_id) {
            var leftCateMenus = [];
            for (var i=0; i< mc.categories.length ;i++) {
                var categoryItem = mc.categories[i];
                var leftCateMenu = {};
                leftCateMenu.mainKey = "marketPortal";
                leftCateMenu.id = i;
                leftCateMenu.name = categoryItem.name;
                leftCateMenu.iconClassName = "marketCateSearch";
                leftCateMenu.className = "";
                leftCateMenu.templateHtml = "";
                if (selectSiteMap && selectSiteMap.key == "marketCateSearch" && cate_id && cate_id == categoryItem.id) {
                    leftCateMenu.className	= "active";
                }
                leftCateMenu.templateHtml = '<a href="#/market_cate_search/' + categoryItem.id + '/cate">';
                leftCateMenu.templateHtml += leftCateMenu.name;
                leftCateMenu.templateHtml += '</a>';
                leftCateMenus.push(leftCateMenu);
            }
            return leftCateMenus;
        };

        // left 메뉴 객체 셋팅
        mc.setSelectSiteMap = function (stateKey) {
            mc.selectSiteMap = common.getStateKeyBySelectSietMap(stateKey);
        };

        mc.setLeftAllMunuParams = function () {
            mc.leftMenuParams = [];
            if (mc.selectSiteMap && mc.selectSiteMap.mainKey) {
                mc.commLeftMenuParams = common.getLeftMenuAllList(mc.selectSiteMap, "A", "A");
                if (mc.selectSiteMap.pageStage == 'tutorial') {
                    mc.leftMenuParams = common.getLeftMenuList(mc.selectSiteMap, "A", "A");
                }
            }
        };

        mc.setLeftMunuParams = function () {
            mc.leftMenuParams = [];
            if (mc.selectSiteMap && mc.selectSiteMap.mainKey) {
                if (mc.selectSiteMap.pageStage == 'comm') {
                    mc.commLeftMenuParams = common.getLeftMenuList(mc.selectSiteMap, "A", "A");
                } else {
                    mc.leftMenuParams = common.getLeftMenuList(mc.selectSiteMap, "A", "A");
                    mc.commLeftMenuParams = common.getLeftMenuList({mainKey: 'common', pageStage: 'comm'}, "A", "A");
                    if(!mc.commLeftFav.dataLoad) {
                        mc.setCommLeftIconMenuParams();
                    }
                }
            }
        };

        mc.saveCommLeftFavLinkIcons = function () {
            if (!mc.commLeftFav.dataLoad) return;
            var userSettingPromise = userSettingService.saveUserSetting(CONSTANTS.userSettingKeys.commLeftLinkIconsKey, mc.commLeftFav.linkIcons);
            userSettingPromise.success(function (data, status, headers) {
            });
            userSettingPromise.error(function (data, status, headers) {
            });
        };

        mc.setCommLeftIconMenuParams = function () {
            var userSettingPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.commLeftLinkIconsKey);
            userSettingPromise.success(function (data, status, headers) {
                mc.commLeftFav.linkIcons = [];
                mc.commLeftFav.linkIconMenus = [];
                data = userSettingService.userSettingParse(data);
                if (data && angular.isArray(data.contents)) {
                    mc.commLeftFav.linkIcons = data.contents;
                    mc.commLeftFav.linkIconMenus = angular.copy(data.contents);
                }
                mc.commLeftFav.dataLoad = true;
            });
            userSettingPromise.error(function (data, status, headers) {
                if (!mc.commLeftFav.linkIcons) {
                    mc.commLeftFav.linkIcons = [];
                    mc.commLeftFav.linkIconMenus = [];
                }
                mc.commLeftFav.dataLoad = false;
            });
        };


        mc.setLeftCateMenuParams = function (cate_id) {
            mc.leftCateMenuParams = [];
            if (mc.selectSiteMap && mc.selectSiteMap.mainKey) {
                mc.leftCateMenuParams   = mc.getCategoryMemuList(mc.selectSiteMap, cate_id);
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
                    if (mc.sltProject && mc.sltProject.id) {
                        organizationDisplayName = mc.sltProjectDisplayName;
                    }
                }
                mc.navigationTreeTitle = common.getNavigationTree(mc.selectSiteMap, organizationDisplayName);
            } else {
                mc.navigationTreeTitle = "";
            }
        };

        // LayOut TemplateUrl 셋팅
        mc.setLayout = function () {
            if (common.isAuthenticated()) {
                if (mc.leftMenuTemplateUrl == "") {
                    mc.leftMenuTemplateUrl = _COMM_VIEWS_ + "/menu/consoleLeftMenu.html";
                }
                if (mc.selectSiteMap && mc.selectSiteMap.mainTop) {
                    if (mc.topTemplateUrl == "") {
                        mc.topTemplateUrl = CONSTANTS.layoutTemplateUrl.mainTop + _VERSION_TAIL_;
                    }
                } else {
                    mc.topTemplateUrl = "";
                }
            } else {
                mc.leftMenuTemplateUrl = "";
                mc.topTemplateUrl = "";
            }
        };

        mc.toggleAccordion = function (accordionGroup, targetAccordion) {
            var accordionGroup = $('#' +accordionGroup);
            accordionGroup.find('.panel-collapse.collapse:not(#'+targetAccordion+')').collapse('hide');
            accordionGroup.find('#' + targetAccordion).collapse('toggle');
        };

        mc.reloadTimmerStop = function () {
            if (angular.isObject(mc.reloadTimmer)) {
                angular.forEach(mc.reloadTimmer, function (timmer, key) {
                    try {
                        if (timmer) {
                            $timeout.cancel(timmer);
                        }
                    } catch (e) {
                    } finally {
                        mc.reloadTimmer[key] = null;
                    }
                });
            }
        };

        /*화면 refresh stop*/
        mc.reloadCommTimmerStop = function () {
            if (angular.isObject(mc.reloadCommTimmer)) {
                angular.forEach(mc.reloadCommTimmer, function (timmer, key) {
                    try {
                        if (timmer) {
                            $timeout.cancel(timmer);
                        }
                    } catch (e) {
                    } finally {
                        mc.reloadCommTimmer[key] = null;
                    }
                });
            }
        };

        mc.refreshIntervalStop = function () {
            if (angular.isObject(mc.refreshInterval)) {
                angular.forEach(mc.refreshInterval, function (interval, key) {
                    try {
                        if (interval) {
                            $interval.cancel(interval);
                        }
                    } catch (e) {
                    } finally {
                        mc.refreshInterval[key] = null;
                    }
                });
            }
        };
        
        mc.replacePage = function () {
            $state.reload();
        };

        mc.showDialogAlert = function(title, subject){
            common.showDialogAlert(title, subject);
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

        /*[IaaS]/[PaaS]/[DevOps]/[Community] 클릭 시 처리*/
        mc.systemLink = function(systemCode){
            switch (systemCode){
                case "IaaS" :
                    if (mc.userInfo.isIaaS) {
                        common.goToState("iaas");
                    } else {
                        common.showAlert("", $translate.instant("message.mi_company_manager_contact"));
                    }
                    break;
                case "PaaS" :
                    if(mc.userInfo.isPaaS) {
                        common.goToState("paas");
                    } else {
                        common.showAlert("", $translate.instant("message.mi_company_manager_contact"));
                    }
                    break;
                case "Market" :
                    common.goToState("market");
                    break;
                case "Monit" :
                    common.goToState("monitDashboard");
                    break;
                case "Community" :
                    common.goToState("commBoard_notice");
                    break;
            }
        };

        mc.marketSearchTxt = "";

        mc.marketSearch = function () {
            if (mc.marketSearchTxt.trim() != "") {
                if ($stateParams.txt == mc.marketSearchTxt) {
                    mc.replacePage();
                } else {
                    var searchPath = "/market_search/" + encodeURI(mc.marketSearchTxt) + "/txt";
                    common.locationPath(searchPath);
                }
                mc.marketSearchTxt = "";
            }
        };

        mc.marketSearchKeypress = function (evt) {
            if (evt.keyCode == 13 || evt.key == "Enter") {
                mc.marketSearch();
            }
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

        mc.isPopCreateUserKey = false;

        mc.createUserKey = function ($event) {
            pop.userKeyData = {};
            $scope.dialogOptions = {
                title : $translate.instant("label.create_key"),
                formName : "popUserKeyForm",
                dialogClassName : "modal-dialog",
                templateUrl: _COMM_VIEWS_ + "/user/popUserKeyForm.html" + _VersionTail(),
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

        mc.addOrgProjectCallBackFun = function() {
            mc.syncListAllProjects();
            common.moveCommHomePage();
        };

        mc.addOrgProjectFormOpen = function($event) {
            var orgProject = {};
            orgProject.managerId    = mc.userInfo.user_id;
            orgProject.managerName  = mc.userInfo.user_name;
            orgProject.managerEmail = mc.userInfo.email;

            orgProject.projectId = mc.sltProjectId;

            var dialogOptions = {
                controller : "commAddOrgProjecFormCtrl",
                controllerAs: "pop",
                formName : "popOrgProjectForm",
                orgProject : orgProject,
                callBackFunction : mc.addOrgProjectCallBackFun
            };
            $scope.actionBtnHied = false;
            $scope.actionLoading = false;
            common.showDialog($scope, $event, dialogOptions);
        };

        // get 으로 token이 넘어온 경우
        if ($stateParams.token) {
            common.setAccessToken($stateParams.token);
        }

        if (common.isAuthenticated()) {
            if (!user.checkAccessToken(common.getAccessToken())) {
                common.clearAccessToken();
                common.logout();
            }
        } else {
            // TODO : SSO 연계 추가 작성
            if (common.getPgsecuid()) {
                if (!user.checkPgsecuid(common.getPgsecuid())) {
                    common.clearAccessToken();
                    common.logout();
                } else {
                    common.moveHomePage();
                }
            } else {
                common.moveLoginPage();
            }
        }

        mc.cBoxToggleChange = function (evt) {
            var _this = $(evt.currentTarget).closest(".cBox.cToggle");
            if (!_this.hasClass("cToggle-open")) {
                _this.addClass("cToggle-open").find(".cBox-cnt").slideDown();
            } else {
                _this.removeClass("cToggle-open").find(".cBox-cnt").slideUp();
            }
        };

        mc.contentsViewType = "thum";
        // IaaS 추가 2018.04.11 S
        mc.changeType = function (type) {
            mc.contentsViewType = type;
        };

        mc.thisAsideClose = function(selector) {
            if (selector) {
                var asideLayer = null;
                if (angular.isString(selector)) {
                    asideLayer = $(selector)
                } else if (angular.isObject(selector)) {
                    if (selector.currentTarget) {
                        asideLayer = $(selector.currentTarget).closest(".aside");
                    } else {
                        asideLayer = selector;
                    }
                }
                if (asideLayer) {
                    asideLayer.find("> div").remove();
                    asideLayer.stop().animate({"right":"-360px"}, 400);
                }
            }
        };

        mc.asideClose = function(selector) {
            if (selector) {
                mc.thisAsideClose(selector);
            } else {
                $(".aside > div").remove();
                $(".aside").stop().animate({"right":"-360px"}, 400);
            }
        };

        mc.asideView = function(selector) {
            $(selector).stop().animate({'right' : '0px'}, 500);
        };

        mc.asideHidden = function(selector) {
            $(selector).stop().animate({'right' : '-360px'}, 400);
        };

        mc.asideRemove = function(selector) {
            $(selector + ' > dev').find("div").remove();
        };

        mc.asideShow = function (param) {
            var selectors = param.selectors;
            mc.asideClose();
            $(selectors).stop().animate({'right' : '0px'}, 500);
        };

        mc.asideHide = function (param) {
            var selectors = param.selectors;
            $(selectors).find('> dev').remove();
            $(selectors).stop().animate({'right' : '-360px'}, 400);
        };

        mc.resetInit();
        mc.setMainLanguage(common.getLanguageKey());
        mc.sltProjectId = common.getProjectKey();
        mc.sltPortalOrgId = common.getPortalOrgKey();

        mc.setDbMenuList();

        // PassRegion
        mc.syncSetPassRegionSet();

        _DebugConsoleLog('commonControllers.js : mainCtrl End, path : ' + $location.path(), 1);
    })
    // 매인 BODY Conroller
    .controller('mainBodyCtrl', function ($scope, $location, $templateCache, $state, $stateParams, $timeout, $window, $translate, user, common, CONSTANTS) {
        _DebugConsoleLog("commonControllers.js : mainBodyCtrl Start, path : " + $location.path(), 1);

        var mb = this;

        // timmer 중지
        $scope.main.reloadTimmerStop();

        // comm timmer 중지
        $scope.main.reloadCommTimmerStop();

        // interval 중지
        $scope.main.refreshIntervalStop();

        $scope.main.stateKey = $state.current.name;
        $scope.main.stateParams = $stateParams;

        $scope.main.uploadProgress = null;
        $scope.main.loadingMain = false;
        $scope.main.loadingMainBody = false;

        $scope.main.pageLoadCount++;

        $scope.main.pageStage = $scope.$resolve.pageStage ? $scope.$resolve.pageStage : "comm";

        $scope.main.replaceSeting();

        // 로그인 여부 체크
        if (!common.isAuthenticated()) {

            $scope.main.isLoginPage = false;
            $scope.main.mainLayoutClass = "one_page";

            common.clearUserAll();
            $scope.main.resetInit();
            if (common.isLoginAcceptPage($location.path())) {
                common.moveLoginPage();
                return false;
            }

            $scope.main.setSelectSiteMap($scope.main.stateKey);
            // 페이지 로드 처리
            if ($scope.main.selectSiteMap && $scope.main.selectSiteMap.contentsView) {
                // 페이지 로드
                var contentsTemplateUrl = "mainContentsTemplate";
                var controllerHtml = "";
                if ($scope.main.selectSiteMap.contentsView.controller) {
                    controllerHtml = ' ng-controller="' + $scope.main.selectSiteMap.contentsView.controller + ' as ' + $scope.main.selectSiteMap.contentsView.controllerAs + '"';
                }
                if ($scope.main.selectSiteMap.contentsView.templateUrl) {
                    common.getTemplateHtml($scope.main.selectSiteMap.contentsView.templateUrl + _VersionTail(), function (templateHtml) {
                        var contentsTemplateHtml = '<div class="memWrap" id="mainContents"' + controllerHtml + '>\n' + templateHtml + '\n</div>';
                        $templateCache.put(contentsTemplateUrl, contentsTemplateHtml);
                        mb.mainContentsTemplateUrl = contentsTemplateUrl;
                    }, function (res) {
                        contentsTemplateHtml += '<div class="memWrap" id="mainContents"' + controllerHtml + '>\nNot Found: ' + $scope.main.selectSiteMap.contentsView.templateUrl + '\n</div>';
                        $templateCache.put(contentsTemplateUrl, contentsTemplateHtml);
                        mb.mainContentsTemplateUrl = contentsTemplateUrl;
                    });
                }
            } else {
                mb.mainContentsTemplateUrl = "";
            }
        } else {
            $scope.main.isLoginPage = true;
            $scope.main.mainLayoutClass = "main";

            if (common.isNotLoginAcceptPage($location.path())) {
                common.goHomePath();
            }
            if (!$scope.main.mainBodyLoaded) {
                $scope.main.mainBodyLoaded = true;
                $scope.main.loginSetingInit();
                $scope.main.syncListAllProjects();
                //$scope.main.listAlarms();
            }

            // paas menu 처리
            if ($scope.main.pageStage == "paas") {
                if (!$scope.main.sltOrganizationGuid) {
                    common.goHomePath();
                    return false;
                }
                if (!mb.paasApplicationDetailSiteMap) {
                    mb.paasApplicationDetailSiteMap = common.getStateKeyBySelectSietMap('paasApplicationDetail');
                }
                if (!mb.paasApplicationLogSiteMap) {
                    mb.paasApplicationLogSiteMap = common.getStateKeyBySelectSietMap('paasApplication_log');
                }
                if ($state.current.name == 'paasApplicationDetail' || $state.current.name == 'paasApplication_log') {
                    if (mb.paasApplicationDetailSiteMap) {
                        mb.paasApplicationDetailSiteMap.menuDisplayNo = false;
                    }
                    if (mb.paasApplicationLogSiteMap) {
                        mb.paasApplicationLogSiteMap.menuDisplayNo = false;
                    }
                } else {
                    if (mb.paasApplicationDetailSiteMap) {
                        mb.paasApplicationDetailSiteMap.menuDisplayNo = true;
                    }
                    if (mb.paasApplicationLogSiteMap) {
                        mb.paasApplicationLogSiteMap.menuDisplayNo = true;
                    }
                }
            } else if ($scope.main.pageStage == "iaas") {
                if (!$scope.main.userTenantId) {
                    common.showAlertWarning("정보가 존재 하지 않습니다. 작업을 선택 하십시오.");
                    common.goHomePath();
                    return false;
                }
            } else if ($scope.main.pageStage == "monit") {
                if (!$scope.main.userTenantId) {
                    common.showAlertWarning("정보가 존재 하지 않습니다. 작업을 선택 하십시오.");
                    common.goHomePath();
                    return false;
                }
            }

            $scope.main.setSelectSiteMap($state.current.name);

            //$scope.main.syncListAllOrganizations();
            /* market
            $scope.main.syncListAllCategories();
            $scope.main.setLeftCateMenuParams($stateParams.cate_id);
            */
            if ($scope.main.navigationTemplateUrl == "") {
                $scope.main.navigationTemplateUrl = CONSTANTS.layoutTemplateUrl.navigation + _VERSION_TAIL_;
            }

            if (_MENU_TYPE_ == 'db') {
            } else if (_MENU_TYPE_ == 'part') {
                $scope.main.setLeftMunuParams();
            } else {
                $scope.main.setLeftAllMunuParams();
            }

            $scope.main.setLeftIconFavToggle($location.path());

            $scope.main.setNavigationTreeTitle();
            if ($scope.main.selectSiteMap && $scope.main.selectSiteMap.parentSiteMap && $scope.main.selectSiteMap.parentSiteMap.defaultUrl) {
                $scope.main.parentMenuName = $scope.main.selectSiteMap.parentSiteMap.name;
                $scope.main.moveParentUrl = $scope.main.selectSiteMap.parentSiteMap.defaultUrl;
            } else {
                $scope.main.moveParentUrl = "";
                $scope.main.parentMenuName = "";
            }

            $scope.main.rightCntId = 'not-tutorial';
            if (_MENU_TYPE_ == 'db') {
                $scope.main.urlCheck();
                if ($scope.main.pageStage == 'tutorial') {
                    $scope.main.rightCntId = 'tutorial';
                }
            } else {
                if ($scope.main.pageStage == 'tutorial') {
                    $scope.main.containerLayoutClass ="fixed";
                    $scope.main.rightCntId = 'tutorial';
                    $scope.main.leftMenuLayoutClass = "leftMenu type2";
                    if ($scope.main.commLeftFav.favIconMenuClass == "on") {
                        $scope.main.leftMenuLayoutClass = "leftMenu type2 pageLoad on";
                    }
                    $scope.main.leftMenuTemplateUrl = _COMM_VIEWS_+"/menu/tutorialLeftMenu.html"+_VERSION_TAIL_; // leftCnt, leftMenu
                } else {
                    if (_MENU_TYPE_ == 'part') {
                        if ($scope.main.pageStage == 'comm') {
                            $scope.main.containerLayoutClass = "";
                            $scope.main.leftMenuLayoutClass = "leftCnt"; // leftCnt, leftMenu
                            if (common.isLeftMenuShow()) {
                                $scope.main.leftMenuLayoutClass += " on";
                            }
                            $scope.main.leftMenuTemplateUrl = _COMM_VIEWS_ + "/menu/commLeftMenu.html" + _VERSION_TAIL_; // leftCnt, leftMenu
                        } else {
                            $scope.main.containerLayoutClass = "fixed";
                            $scope.main.leftMenuLayoutClass = "leftMenu";
                            if ($scope.main.commLeftFav.favIconMenuClass == "on") {
                                $scope.main.leftMenuLayoutClass = "leftMenu pageLoad on";
                            }
                            $scope.main.leftMenuTemplateUrl = _COMM_VIEWS_ + "/menu/partLeftMenu.html" + _VERSION_TAIL_; // leftCnt, leftMenu
                        }
                    } else {
                        $scope.main.containerLayoutClass = "";
                        $scope.main.leftMenuLayoutClass = "leftCnt depth-3"; // leftCnt, leftMenu
                        if (common.isLeftMenuShow()) {
                            $scope.main.leftMenuLayoutClass += " on";
                        }
                        $scope.main.leftMenuTemplateUrl = _COMM_VIEWS_ + "/menu/commAllLeftMenu.html" + _VERSION_TAIL_; // leftCnt, leftMenu
                    }
                }
            }
            $scope.main.setLayout();
            $scope.main.commMenuHide();

            if (_MENU_TYPE_ == 'part') {
                common.leftMenuShow();
            } else if (_MENU_TYPE_ == 'part') {
                if ($scope.main.pageStage == 'comm') {
                    $scope.main.leftMenuDefaultSet();
                }
            } else {
                if ($scope.main.pageStage != 'tutorial') {
                    $scope.main.leftMenuDefaultSet();
                }
            }

            // 페이지 로드 처리
            if ($scope.main.selectSiteMap && $scope.main.selectSiteMap.contentsView) {
                // 페이지 로드
                var contentsTemplateUrl = "mainContentsTemplate";
                var controllerHtml = "";
                if ($scope.main.selectSiteMap.contentsView.controller) {
                    controllerHtml = ' ng-controller="' + $scope.main.selectSiteMap.contentsView.controller + ' as ' + $scope.main.selectSiteMap.contentsView.controllerAs + '"';
                }
                var contentsTemplateHtml = '';
                if ($scope.main.selectSiteMap.contentsView.templateUrl) {
                    common.getTemplateHtml($scope.main.selectSiteMap.contentsView.templateUrl + _VersionTail(), function (templateHtml) {
                        contentsTemplateHtml += '<div class="content" id="mainContents"' + controllerHtml + '>\n' + templateHtml + '\n</div>';
                        $templateCache.put(contentsTemplateUrl, contentsTemplateHtml);
                        mb.mainContentsTemplateUrl = contentsTemplateUrl;
                    }, function (res) {
                        contentsTemplateHtml += '<div class="content" id="mainContents"' + controllerHtml + '>\nNot Found: ' + $scope.main.selectSiteMap.contentsView.templateUrl + '\n</div>';
                        $templateCache.put(contentsTemplateUrl, contentsTemplateHtml);
                        mb.mainContentsTemplateUrl = contentsTemplateUrl;
                    });
                } else {
                    contentsTemplateHtml += '<div class="content" id="mainContents"' + controllerHtml + '></div>';
                    $templateCache.put(contentsTemplateUrl, contentsTemplateHtml);
                    mb.mainContentsTemplateUrl = contentsTemplateUrl;
                }
            } else {
                mb.mainContentsTemplateUrl = "";
            }
        }

		if (!$scope.main.contentsLayoutResizeEvent) {
			document.getElementById("container").addEventListener("transitionend", function(e) {
				$scope.main.windowTriggerResize(e);
			});
			$scope.main.contentsLayoutResizeEvent	= true;
		}

        $scope.main.asideClose();
        $scope.main.isLoadPageBody = true;

        _DebugConsoleLog("commonControllers.js : mainBodyCtrl End, path : " + $location.path(), 1);

    })
;