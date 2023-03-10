'use strict';

angular.module('common.services', ['LocalStorageModule'])
    .factory('common', function ($http, $location, $route, $state, $window, $timeout, $q, $templateCache, $translate, $ocLazyLoad, cache, cookies, CONSTANTS, SITEMAP, $mdDialog, growl) {
        _DebugConsoleLog("common.services common", 1);

        var common = {};

        // language
        common.getLanguageKey = function () {
            return cache.getLanguageKey();
        };

        common.setLanguageKey = function (languageKey) {
            cache.setLanguageKey(languageKey);
        };

        common.changeLanguageKey = function (languageKey) {
            cache.setLanguageKey(languageKey);
        };

        // region
        common.getRegionKey = function () {
            return cache.getRegionKey();
        };

        common.setRegionKey = function (regionKey) {
            cache.setRegionKey(regionKey);
        };

        // organization
        common.getOrganizationKey = function () {
            return cache.getOrganizationKey();
        };

        common.setOrganizationKey = function (organizationGuid) {
            cache.setOrganizationKey(organizationGuid);
        };

        common.clearOrganizationKey = function () {
            cache.clearOrganizationKey();
        };

        // Project
        common.getProjectKey = function () {
            return cache.getProjectKey();
        };

        common.setProjectKey = function (projectId) {
            cache.setProjectKey(projectId);
        };

        common.clearProjectKey = function () {
            cache.clearProjectKey();
        };

        // PortalOrg
        common.getPortalOrgKey = function () {
            return cookies.getPortalOrgKey();
        };

        common.setPortalOrgKey = function (portalOrgId) {
            cookies.setPortalOrgKey(portalOrgId);
            //common.setTeamCode(portalOrgId);
        };

        common.clearPortalOrgKey = function () {
            cookies.clearPortalOrgKey();
            common.setTeamCode();
            common.clearUserTenantId();
        };

        // TeamCode
        common.getTeamCode = function () {
            return cookies.getTeamCode();
        };

        common.setTeamCode = function (teamCode) {
            cookies.setTeamCode(teamCode);
        };

        common.clearTeamCode = function () {
            cookies.clearTeamCode();
        };

        // userTenantId
        common.getUserTenantId = function () {
            return cookies.getUserTenantId();
        };

        common.setUserTenantId = function (userTenantId) {
            cookies.setUserTenantId(userTenantId);
        };

        common.clearUserTenantId = function () {
            cookies.clearUserTenantId();
        };

        // gpuUserTenantId
        common.getGpuUserTenantId = function () {
            return cookies.getGpuUserTenantId();
        };

        common.setGpuUserTenantId = function (gpuUserTenantId) {
            cookies.setGpuUserTenantId(gpuUserTenantId);
        };

        common.clearGpuUserTenantId = function () {
            cookies.clearGpuUserTenantId();
        };

        // company
        common.getRegionChangToPath = function () {
            return cache.getRegionChangToPath();
        };

        common.setRegionChangToPath = function (regionChangeToPath) {
            cache.setRegionChangToPath(regionChangeToPath);
        };

        common.clearRegionChangToPath = function () {
            cache.clearRegionChangToPath();
        };

        // leftMenus setting
        common.leftMenus		= {};
        common.siteMapList		= [];
        common.selectSiteMap	= null;
        var siteMapidx		= 0;
        angular.forEach(SITEMAP.pages, function (option, key) {
            common.siteMapList[siteMapidx++]	= {
                key : key,
                notAuth : option.notAuth,
                notPAuth : option.notPAuth,
                notEdAuth : option.notEdAuth,
                notEdPAuth : option.notEdPAuth,
                rootName : option.name,
                topName : option.name,
                name : option.name,
                orgNameView : option.orgNameView,
                categoryView : option.categoryView,
                menuNoLink : option.menuNoLink,
                regionChang : option.regionChang,
                stateKey : option.stateKey ? option.stateKey : key,
                url : option.url,
                defaultUrl : option.defaultUrl ? option.defaultUrl : option.url,
                mainTop : option.mainTop,
                title : option.title,
                pageStage : option.pageStage ? option.pageStage : "comm",
                mainContentsClass : option.mainContentsClass,
                contentsView : option.contentsView
            };
        });

        angular.forEach(SITEMAP.leftMenus, function (mainOption, mainKey) {
            common.leftMenus[mainKey]	= [];
            var cidx	= 0;
            angular.forEach(mainOption.menus, function (option, key) {
                if (_DOMAIN_ != "localhost" && key == "sample") return;
                option.mainTop	= angular.isUndefined(option.mainTop) ? mainOption.mainTop : option.mainTop;
                option.orgType	= angular.isUndefined(option.orgType) ? mainOption.orgType : option.orgType;
                option.orgNameView	= angular.isUndefined(option.orgNameView) ? mainOption.orgNameView : option.orgNameView;
                option.categoryView	= angular.isUndefined(option.categoryView) ? mainOption.categoryView : option.categoryView;
                option.pageStage	= angular.isUndefined(option.pageStage) ? mainOption.pageStage : option.pageStage;

                var notAuth		= (mainOption.notAuth) ? mainOption.notAuth : "";
                var notPAuth	= (mainOption.notPAuth) ? mainOption.notPAuth : "";
                var notEdAuth	= (mainOption.notEdAuth) ? mainOption.notEdAuth : "";
                var notEdPAuth	= (mainOption.notEdPAuth) ? mainOption.notEdPAuth : "";

                notAuth		+= (option.notAuth) ? option.notAuth : "";
                notPAuth	+= (option.notPAuth) ? option.notPAuth : "";
                notEdAuth	+= (option.notEdAuth) ? option.notEdAuth : "";
                notEdPAuth	+= (option.notEdPAuth) ? option.notEdPAuth : "";

                var topSiteMap = {
                    mainKey : mainKey,
                    parentSiteMap: mainOption,
                    middleMenu : true,
                    key : key,
                    orgType : option.orgType,
                    notAuth : notAuth,
                    notPAuth : notPAuth,
                    notEdAuth : notEdAuth,
                    notEdPAuth : notEdPAuth,
                    rootName : mainOption.name,
                    topName : option.name,
                    name : option.name,
                    orgNameView : option.orgNameView,
                    categoryView : option.categoryView,
                    menuDisplayNo : option.menuDisplayNo,
                    icon : option.icon,
                    menuNoLink : option.menuNoLink,
                    regionChang : option.regionChang,
                    stateKey : option.stateKey ? option.stateKey : key,
                    url : option.url,
                    defaultUrl : option.defaultUrl ? option.defaultUrl : option.url,
                    path : option.path,
                    target : option.target,
                    link : option.link,
                    mainTop : option.mainTop,
                    title : option.title,
                    pageStage : option.pageStage,
                    contentsView : option.contentsView,
                    mainContentsClass : option.mainContentsClass,
                    ngClick : option.ngClick
                };

                common.leftMenus[mainKey][cidx++]	= topSiteMap;
                common.siteMapList[siteMapidx++]	= topSiteMap;

                angular.forEach(option.subMenus, function (subMenuOption, subMenuKey) {
                    subMenuOption.mainTop	= angular.isUndefined(subMenuOption.mainTop) ? mainOption.mainTop : subMenuOption.mainTop;
                    subMenuOption.orgType	= angular.isUndefined(subMenuOption.orgType) ? option.orgType : subMenuOption.orgType;
                    subMenuOption.orgNameView	= angular.isUndefined(subMenuOption.orgNameView) ? option.orgNameView : subMenuOption.orgNameView;
                    subMenuOption.categoryView	= angular.isUndefined(subMenuOption.categoryView) ? option.categoryView : subMenuOption.categoryView;
                    subMenuOption.pageStage	= angular.isUndefined(subMenuOption.pageStage) ? option.pageStage : subMenuOption.pageStage;
                    subMenuOption.menuDisplayNo	= (option.menuDisplayNo == true) ? option.menuDisplayNo : subMenuOption.menuDisplayNo;

                    var subMenuNotAuth		= notAuth;
                    var subMenuNotPAuth		= notPAuth;
                    var subMenuNotEdAuth	= notEdAuth;
                    var subMenuNotEdPAuth	= notEdPAuth;

                    subMenuNotAuth		+= (subMenuOption.notAuth) ? subMenuOption.notAuth : "";
                    subMenuNotPAuth		+= (subMenuOption.notPAuth) ? subMenuOption.notPAuth : "";
                    subMenuNotEdAuth	+= (subMenuOption.notEdAuth) ? subMenuOption.notEdAuth : "";
                    subMenuNotEdPAuth	+= (subMenuOption.notEdPAuth) ? subMenuOption.notEdPAuth : "";

                    var subMenuSiteMap = {
                        mainKey : mainKey,
                        parentSiteMap: topSiteMap,
                        subMenu : true,
                        key : subMenuKey,
                        menuKey : key,
                        orgType: subMenuOption.orgType,
                        notAuth : subMenuNotAuth,
                        notPAuth : subMenuNotPAuth,
                        notEdAuth : subMenuNotEdAuth,
                        notEdPAuth : subMenuNotEdPAuth,
                        rootName : mainOption.name,
                        topName : option.name,
                        name : subMenuOption.name,
                        orgNameView : subMenuOption.orgNameView,
                        categoryView : subMenuOption.categoryView,
                        menuDisplayNo : subMenuOption.menuDisplayNo,
                        mainTop : subMenuOption.mainTop,
                        menuNoLink : subMenuOption.menuNoLink,
                        regionChang : subMenuOption.regionChang,
                        stateKey : subMenuOption.stateKey ? subMenuOption.stateKey : subMenuKey,
                        url : subMenuOption.url,
                        defaultUrl : subMenuOption.defaultUrl ? subMenuOption.defaultUrl : subMenuOption.url,
                        target : subMenuOption.target,
                        path : subMenuOption.path,
                        link : subMenuOption.link,
                        title : subMenuOption.title,
                        pageStage : subMenuOption.pageStage,
                        contentsView : subMenuOption.contentsView,
                        mainContentsClass : subMenuOption.mainContentsClass,
                        ngClick : subMenuOption.ngClick
                    };

                    common.leftMenus[mainKey][cidx++]	= subMenuSiteMap;
                    common.siteMapList[siteMapidx++] = subMenuSiteMap;

                    angular.forEach(subMenuOption.subPages, function (subPageOption, subPageKey) {
                        subPageOption.mainTop	= angular.isUndefined(subPageOption.mainTop) ? subMenuOption.mainTop : subPageOption.mainTop;
                        subPageOption.orgType	= angular.isUndefined(subPageOption.orgType) ? subMenuOption.orgType : subPageOption.orgType;
                        subPageOption.orgNameView	= angular.isUndefined(subPageOption.orgNameView) ? subMenuOption.orgNameView : subPageOption.orgNameView;
                        subPageOption.categoryView	= angular.isUndefined(subPageOption.categoryView) ? subMenuOption.categoryView : subPageOption.categoryView;
                        subPageOption.pageStage	= angular.isUndefined(subPageOption.pageStage) ? subMenuOption.pageStage : subPageOption.pageStage;

                        var subPageNotAuth		= notAuth;
                        var subPageNotPAuth		= notPAuth;
                        var subPageNotEdAuth	= notEdAuth;
                        var subPageNotEdPAuth	= notEdPAuth;

                        subPageNotAuth		+= (subPageOption.notAuth) ? subPageOption.notAuth : "";
                        subPageNotPAuth		+= (subPageOption.notPAuth) ? subPageOption.notPAuth : "";
                        subPageNotEdAuth	+= (subPageOption.notEdAuth) ? subPageOption.notEdAuth : "";
                        subPageNotEdPAuth	+= (subPageOption.notEdPAuth) ? subPageOption.notEdPAuth : "";

                        common.siteMapList[siteMapidx++] = {
                            mainKey : mainKey,
                            parentSiteMap: subMenuSiteMap,
                            subPage : true,
                            key : subPageKey,
                            menuKey : key,
                            subMenuKey : subMenuKey,
                            orgType: subPageOption.orgType,
                            notAuth : subPageNotAuth,
                            notPAuth : subPageNotPAuth,
                            notEdAuth : subPageNotEdAuth,
                            notEdPAuth : subPageNotEdPAuth,
                            rootName : mainOption.name,
                            topName : option.name,
                            name : subPageOption.name,
                            orgNameView : subPageOption.orgNameView,
                            categoryView : subPageOption.categoryView,
                            menuDisplayNo : subPageOption.menuDisplayNo,
                            mainTop : subPageOption.mainTop,
                            menuNoLink : subPageOption.menuNoLink,
                            regionChang : subPageOption.regionChang,
                            stateKey : subPageOption.stateKey ? subPageOption.stateKey : subPageKey,
                            url : subPageOption.url,
                            defaultUrl : subPageOption.defaultUrl ? subPageOption.defaultUrl : subPageOption.url,
                            title : subPageOption.title,
                            pageStage : subPageOption.pageStage,
                            contentsView : subPageOption.contentsView,
                            mainContentsClass : subPageOption.mainContentsClass,
                            ngClick : subPageOption.ngClick
                        };
                    });
                });
                angular.forEach(option.subPages, function (subPageOption, subPageKey) {
                    subPageOption.mainTop	= angular.isUndefined(subPageOption.mainTop) ? option.mainTop : subPageOption.mainTop;
                    subPageOption.orgType	= angular.isUndefined(subPageOption.orgType) ? option.orgType : subPageOption.orgType;
                    subPageOption.orgNameView	= angular.isUndefined(subPageOption.orgNameView) ? option.orgNameView : subPageOption.orgNameView;
                    subPageOption.categoryView	= angular.isUndefined(subPageOption.categoryView) ? option.categoryView : subPageOption.categoryView;
                    subPageOption.pageStage	= angular.isUndefined(subPageOption.pageStage) ? option.pageStage : subPageOption.pageStage;

                    var subPageNotAuth		= notAuth;
                    var subPageNotPAuth		= notPAuth;
                    var subPageNotEdAuth	= notEdAuth;
                    var subPageNotEdPAuth	= notEdPAuth;

                    subPageNotAuth		+= (subPageOption.notAuth) ? subPageOption.notAuth : "";
                    subPageNotPAuth		+= (subPageOption.notPAuth) ? subPageOption.notPAuth : "";
                    subPageNotEdAuth	+= (subPageOption.notEdAuth) ? subPageOption.notEdAuth : "";
                    subPageNotEdPAuth	+= (subPageOption.notEdPAuth) ? subPageOption.notEdPAuth : "";

                    common.siteMapList[siteMapidx++] = {
                        mainKey : mainKey,
                        parentSiteMap: topSiteMap,
                        subPage : true,
                        key : subPageKey,
                        menuKey : key,
                        orgType: subPageOption.orgType,
                        notAuth : subPageNotAuth,
                        notPAuth : subPageNotPAuth,
                        notEdAuth : subPageNotEdAuth,
                        notEdPAuth : subPageNotEdPAuth,
                        rootName : mainOption.name,
                        topName : option.name,
                        name : subPageOption.name,
                        orgNameView : subPageOption.orgNameView,
                        categoryView : subPageOption.categoryView,
                        menuDisplayNo : subPageOption.menuDisplayNo,
                        mainTop : subPageOption.mainTop,
                        menuNoLink : subPageOption.menuNoLink,
                        regionChang : subPageOption.regionChang,
                        stateKey : subPageOption.stateKey ? subPageOption.stateKey : subPageKey,
                        url : subPageOption.url,
                        defaultUrl : subPageOption.defaultUrl ? subPageOption.defaultUrl : subPageOption.url,
                        title : subPageOption.title,
                        pageStage : subPageOption.pageStage,
                        contentsView : subPageOption.contentsView,
                        mainContentsClass : subPageOption.mainContentsClass,
                        ngClick : subPageOption.ngClick
                    };
                });
            });
        });

        // StateName?????? siteMap ????????????
        common.getStateKeyBySelectSietMap = function (stateKey) {
            for (var i=0; i<common.siteMapList.length; i++) {
                if (common.siteMapList[i].stateKey == stateKey) {
                    return common.siteMapList[i];
                }
            }
            return null;
        };

        // url??? siteMap ????????????
        common.getPathUrlBySelectSietMap = function (pathUrl) {
            pathUrl	= pathUrl.trim();
            var pathUrls = pathUrl.split("/");
            var pSltLen = 0;
            var siteMap	= null;
            for (var i=0; i<common.siteMapList.length; i++) {
                if (common.siteMapList[i].url) {
                    var siteUrls	= common.siteMapList[i].url.trim().split("/");
                    if (pathUrls.length == siteUrls.length) {
                        var pSiteSlt = true;
                        var pSiteSltLen = 0;
                        var isSiteUrl 	= true;
                        for (var j=0;  j<siteUrls.length; j++) {
                            if (siteUrls[j].substring(0, 1) != ":") {
                                if (siteUrls[j] == pathUrls[j]) {
                                    if (pSiteSlt) {
                                        pSiteSltLen++;
                                    }
                                } else {
                                    isSiteUrl = false;
                                    break;
                                }
                            } else {
                                pSiteSlt = false;
                            }
                        }
                        if (isSiteUrl && pSiteSltLen > pSltLen) {
                            siteMap = common.siteMapList[i];
                            pSltLen = pSiteSltLen;
                        }
                    }
                }
            }
            return siteMap;
        };

        // ????????? leftMenus
        common.getLeftMenus = function () {
            return common.leftMenus;
        };

        // mainKey leftMenus
        common.getLeftMenusByKey = function (mainKey) {
            return common.leftMenus[mainKey];
        };

        // leftMenus open ?????? set
        common.setLeftMenusOpen = function (mainKey, id, open) {
            common.leftMenus[mainKey][id].open = open;
        };

        // leftMenu ????????????
        common.getLeftPartMenuList = function (leftMenus, pageStage, siteMap, auth, pAuth) {
            var leftMenuList	= [];
            for (var i=0; i<leftMenus.length; i++) {
                var menuItem = leftMenus[i];
                if (!menuItem.menuDisplayNo && !menuItem.subPage) {
                    var isMenuView	= true;
                    /*if (auth != "A") {
                        if ((menuItem.orgType || menuItem.notPAuth) && !pAuth) {
                            isMenuView	= false;
                        }
                        if (menuItem.notAuth) {
                            if (menuItem.notAuth.indexOf(auth) >= 0) {
                                isMenuView	= false;
                            }
                        }
                        if (menuItem.notPAuth) {
                            if (menuItem.notPAuth.indexOf(pAuth) >= 0) {
                                isMenuView	= false;
                            }
                        }
                    }*/
                    if (isMenuView) {
                        var templateHtml	= "";
                        var iconClassName	= "";
                        var className	= "";
                        var menuName = "";
                        if (menuItem.name == "sample" || menuItem.parentSiteMap.name == "sample") {
                            menuName = menuItem.name;
                        } else {
                            if (pageStage) {
                                menuName = "{{ '" + pageStage + "Menu.menu." + menuItem.name +"' | translate }}";
                            } else {
                                menuName = "{{ 'menu." + menuItem.name +"' | translate }}";
                            }
                        }

                        if (menuItem.icon)	iconClassName	= menuItem.icon;
                        if (menuItem.key == siteMap.key || menuItem.key == siteMap.menuKey || menuItem.key == siteMap.subMenuKey ) {
                            className	= "on";
                            menuItem.open = true;
                        } else {
                            menuItem.open = false;
                        }
                        if (menuItem.ngClick) {
                            templateHtml = '<a href="" ng-click="' + menuItem.ngClick + '"';
                        } else if (menuItem.link) {
                            var target = menuItem.target ? menuItem.target : '_self';
                            templateHtml = '<a target='+target+' href="'+menuItem.link+'"';
                        } else if (menuItem.path) {
                            templateHtml = '<a href="#' + menuItem.path + '"';
                        } else {
                            if (menuItem.menuNoLink) {
                                templateHtml	= '<a href="">';
                            } else {
                                if (menuItem.defaultUrl) {
                                    templateHtml = '<a href="#' + menuItem.defaultUrl + '"';
                                } else {
                                    templateHtml = '<a href=""';
                                }
                            }
                        }
                        var sltClassStr = (menuItem.open) ? " on" : "";
                        if (menuItem.subMenu) {
                            if (pageStage == 'comm') {
                                templateHtml += ' class="lms'+sltClassStr+'">';
                            } else {
                                templateHtml += ' class="sm'+sltClassStr+'">';
                            }
                        } else {
                            if (pageStage == 'comm') {
                                templateHtml += ' class="gm'+sltClassStr+'">';
                            } else {
                                templateHtml += ' class="lms'+sltClassStr+'">';
                            }
                        }
                        templateHtml += menuName;
                        templateHtml += '</a>';
                        var menuObj = { mainKey : siteMap.mainKey, key: menuItem.key, name: menuItem.name, id: i, templateHtml : templateHtml, open: menuItem.open, className :  className.trim() };
                        if (menuItem.middleMenu) {
                            leftMenuList.push(menuObj);
                        } else {
                            if (angular.isUndefined(leftMenuList[leftMenuList.length - 1].subMenus)) {
                                leftMenuList[leftMenuList.length - 1].subMenus = [];
                            }
                            leftMenuList[leftMenuList.length - 1].subMenus.push(menuObj);
                        }
                    }
                }
            }
            return leftMenuList;
        };

        // leftMenu ????????????
        common.getLeftMenuAllList = function (siteMap, auth, pAuth) {
            var leftMenuAlls	= {};
            angular.forEach(common.leftMenus, function(leftMenus, key) {
                if (key == 'common' || key == 'iaasPotal' || key == 'paasPotal' || key == 'monitPotal') {
                    var pageStage = 'comm';
                    if (key == 'iaasPotal') {
                        pageStage = 'iaas';
                    } else if (key == 'paasPotal') {
                        pageStage = 'paas';
                    } else if (key == 'monitPotal') {
                        pageStage = 'monit';
                    }
                    leftMenuAlls[key] = common.getLeftPartMenuList(leftMenus, pageStage, siteMap, auth, pAuth);
                }
            });
            return leftMenuAlls;
        };

        // leftMenu ????????????
        common.getLeftMenuList = function (siteMap, auth, pAuth) {
            var leftMenuList	= [];
            if (common.leftMenus[siteMap.mainKey]) {
                var leftMenus	= common.leftMenus[siteMap.mainKey];
                for (var i=0; i<leftMenus.length; i++) {
                    var menuItem = leftMenus[i];
                    if (!menuItem.menuDisplayNo && !menuItem.subPage) {
                        var isMenuView	= true;
                        /*if (auth != "A") {
                            if ((menuItem.orgType || menuItem.notPAuth) && !pAuth) {
                                isMenuView	= false;
                            }
                            if (menuItem.notAuth) {
                                if (menuItem.notAuth.indexOf(auth) >= 0) {
                                    isMenuView	= false;
                                }
                            }
                            if (menuItem.notPAuth) {
                                if (menuItem.notPAuth.indexOf(pAuth) >= 0) {
                                    isMenuView	= false;
                                }
                            }
                        }*/
                        if (isMenuView) {
                            var templateHtml	= "";
                            var iconClassName	= "";
                            var className	= "";
                            var menuName = "";
                            if (menuItem.name == "sample" || menuItem.parentSiteMap.name == "sample") {
                                menuName = menuItem.name;
                            } else {
                                if (siteMap.pageStage) {
                                    menuName = "{{ '" + siteMap.pageStage + "Menu.menu." + menuItem.name +"' | translate }}";
                                } else {
                                    menuName = "{{ 'menu." + menuItem.name +"' | translate }}";
                                }
                            }

                            if (menuItem.icon)	iconClassName	= menuItem.icon;
                            if (menuItem.key == siteMap.key || menuItem.key == siteMap.menuKey || menuItem.key == siteMap.subMenuKey ) {
                                className	= "on";
                                menuItem.open = true;
                            } else {
                                menuItem.open = false;
                            }
                            if (menuItem.ngClick) {
                                templateHtml = '<a href="" ng-click="' + menuItem.ngClick + '"';
                            } else if (menuItem.link) {
                                var target = menuItem.target ? menuItem.target : '_self';
                                templateHtml = '<a target='+target+' href="'+menuItem.link+'"';
                            } else if (menuItem.path) {
                                templateHtml = '<a href="#' + menuItem.path + '"';
                            } else {
                                if (menuItem.menuNoLink) {
                                    templateHtml	= '<a href="">';
                                } else {
                                    if (menuItem.defaultUrl) {
                                        templateHtml = '<a href="#' + menuItem.defaultUrl + '"';
                                    } else {
                                        templateHtml = '<a href=""';
                                    }
                                }
                            }
                            var sltClassStr = (menuItem.open) ? " on" : "";
                            if (menuItem.subMenu) {
                                if (menuItem.pageStage == 'comm') {
                                    templateHtml += ' class="mm'+sltClassStr+'">';
                                } else {
                                    templateHtml += ' class="sm'+sltClassStr+'">';
                                }
                            } else {
                                if (menuItem.pageStage == 'comm') {
                                    templateHtml += ' class="gm'+sltClassStr+'">';
                                } else {
                                    templateHtml += ' class="lms'+sltClassStr+'">';
                                }
                            }
                            templateHtml += menuName;
                            templateHtml += '</a>';
                            var menuObj = { mainKey : siteMap.mainKey, key: menuItem.key, name: menuItem.name, id: i, templateHtml : templateHtml, open: menuItem.open, className :  className.trim() };
                            if (menuItem.middleMenu) {
                                leftMenuList.push(menuObj);
                            } else {
                                if (angular.isUndefined(leftMenuList[leftMenuList.length - 1].subMenus)) {
                                    leftMenuList[leftMenuList.length - 1].subMenus = [];
                                }
                                leftMenuList[leftMenuList.length - 1].subMenus.push(menuObj);
                            }
                        }
                    }
                }
            }
            return leftMenuList;
        };

        common.getNavigationRootTree = function (sltSiteMap, navigationTree) {
            if (!navigationTree) {
                navigationTree = "";
            }
            if (angular.isObject(sltSiteMap.parentSiteMap) && sltSiteMap.parentSiteMap.name != sltSiteMap.rootName) {
                navigationTree += common.getNavigationRootTree(sltSiteMap.parentSiteMap, navigationTree);
                navigationTree += '<li class="active">';
            } else {
                navigationTree += '<li><a href="">';
            }
            if (sltSiteMap.topName == "sample") {
                navigationTree += sltSiteMap.name + "";
            } else if(sltSiteMap.subPage){
            	navigationTree += "{{ '" + sltSiteMap.pageStage + "Menu.menu." + sltSiteMap.name + "' | translate }}<span ng-if='main.sltOrganizationName'> : {{ main.sltOrganizationName }}</span>";
            } else {
                navigationTree += "{{ '" + sltSiteMap.pageStage + "Menu.menu." + sltSiteMap.name + "' | translate }}";
            }
            
            if (angular.isObject(sltSiteMap.parentSiteMap) && sltSiteMap.parentSiteMap.name != sltSiteMap.rootName) {
                if(sltSiteMap.mainTop){
                	navigationTree += "";
                }else {
                	navigationTree += '</li>';
                }
            } else {
                
        		navigationTree += '</a></li>';
            }
            // Ryu ?????? 2018.04.11 E
            return navigationTree;
        };

        // Contents Top NavigationTree
        common.getNavigationTree = function (sltSiteMap, displayName) {
            var navigationTree = '<ol class="breadcrumb">';
            //navigationTree += "<li><a href=''>{{ '" + sltSiteMap.pageStage + "Menu.menu." + sltSiteMap.pageStage + "_portal' | translate }}</a></li>";
            navigationTree += common.getNavigationRootTree(sltSiteMap);
            if (((sltSiteMap.orgNameView || sltSiteMap.categoryView) && displayName) || sltSiteMap.title) {
                if (sltSiteMap.title) {
                    navigationTree += sltSiteMap.title;
                } else {
                    if ((sltSiteMap.orgNameView || sltSiteMap.categoryView) && displayName) {
                        navigationTree += '	<li>' + displayName + '</li>';
                    }
                }
            }
            navigationTree += '</ol>';
            return navigationTree;
        };

        // leftMenu ????????? ??????
        common.isLeftMenuShow = function () {
            if (cookies.getLeftMenuShow() == "N") {
                return false;
            } else {
                return true;
            }
        };

        // leftMenu ?????????
        common.leftMenuDefaultSet = function () {
            var _this =$(".leftCnt");
            if (common.isLeftMenuShow()) {
                common.getMainCtrlScope().main.leftMenuOn = true;
                if(!_this.hasClass("on")) {
                    _this.addClass("on");
                }
            } else {
                common.getMainCtrlScope().main.leftMenuOn = false;
                if(_this.hasClass("on")) {
                    _this.removeClass("on");
                }
            }
        };

        // leftMenu ?????????
        common.leftMenuShow = function () {
            cookies.setLeftMenuShow(true);
            common.getMainCtrlScope().main.leftMenuOn = true;
            var _this =$(".leftCnt");
            if (!_this.hasClass("on")) {
                _this.toggleClass("on");
            }
        };

        // leftMenu ?????????
        common.leftMenuHide = function () {
            cookies.setLeftMenuShow(false);
            common.getMainCtrlScope().main.leftMenuOn = false;
            var _this =$(".leftCnt");
            if (_this.hasClass("on")) {
                _this.toggleClass("on");
            }
        };

        // commAllMenuTogle
        common.commAllMenuTogle = function () {
            var _this =$("#comm_layer_menu.gnbMenu");
            if (_this.hasClass("on")) {
                _this.stop().animate({"left":"-245px"}, 400, function() {
                });
            } else {
                _this.stop().animate({"left":"0"}, 400, function() {
                });
            }
        };

        // commMenuTogle
        common.commMenuTogle = function () {
            var _this =$("#comm_layer_menu.gnbMenu");
            if (_this.hasClass("on")) {
                _this.stop().animate({"left":"-245px"}, 400, function() {
                    _this.removeClass("on");
                    _this.find(".gm, .gnbMenu .mm").removeClass("on");
                    _this.find(".lnb, .gnbMenu .subm").slideUp();
                });
            } else {
                _this.stop().animate({"left":"0"}, 400, function() {
                    _this.addClass("on");
                });
            }
        };

        // commMenu ?????????
        common.commMenuHide = function () {
            var _this =$("#comm_layer_menu.gnbMenu");
            _this.stop().animate({"left":"-245px"}, 400);
            _this.removeClass("on");
        };

        common.replaceAll = function (source, targetStr, replaceStr, ignore) {
            var flags = "gm";
            if (ignore) flags = "gim";
            return source.replace(new RegExp(targetStr, flags), replaceStr);
        };

        common.getCfErrorMessage = function (error) {
            var cfErrTitleByMessage = "";
            var message_type = "CF_ERROR." + error.title + ".message_type";
            var cf_message_type = $translate.instant(message_type);
            if (message_type != cf_message_type) {
                var errDetail = error.detail;
                if (cf_message_type == "replace" || cf_message_type == "preserve") {
                    var msg_key = $translate.instant("CF_ERROR." + error.title + ".message_key");
                    var msg_str = $translate.instant("CF_ERROR." + error.title + ".message");
                    cfErrTitleByMessage = errDetail.replace(msg_key, msg_str);
                    if (cfErrTitleByMessage != errDetail) {
                        return cfErrTitleByMessage;
                    }
                } else if (cf_message_type == "middle_tail") {
                    var msg_key = $translate.instant("CF_ERROR." + error.title + ".message_key");
                    var msg_str = $translate.instant("CF_ERROR." + error.title + ".message");
                    var msg_keys = msg_key.split("%s");
                    if (msg_keys.length >= 2) {
                        cfErrTitleByMessage = errDetail.replace(msg_keys[0], "");
                        var msg_strs = cfErrTitleByMessage.split(msg_keys[1]);
                        if (msg_strs.length == 2) {
                            cfErrTitleByMessage = msg_str.replace("%s", msg_strs[0]);
                            cfErrTitleByMessage = cfErrTitleByMessage.replace("%s", msg_strs[1]);
                            return cfErrTitleByMessage;
                        }
                    }
                } else if (cf_message_type == "replace2") {
                    var msg_key1 = $translate.instant("CF_ERROR." + error.title + ".message_key1");
                    var msg_str1 = $translate.instant("CF_ERROR." + error.title + ".message1");
                    cfErrTitleByMessage = errDetail.replace(msg_key1, msg_str1);
                    var msg_key2 = $translate.instant("CF_ERROR." + error.title + ".message_key2");
                    var msg_str2 = $translate.instant("CF_ERROR." + error.title + ".message2");
                    cfErrTitleByMessage = cfErrTitleByMessage.replace(msg_key2, msg_str2);
                    if (cfErrTitleByMessage != errDetail) {
                        return cfErrTitleByMessage;
                    }
                } else if (cf_message_type == "replace_middle_tail") {
                    var msg_key1 = $translate.instant("CF_ERROR." + error.title + ".message_key1");
                    var msg_str1 = $translate.instant("CF_ERROR." + error.title + ".message1");
                    cfErrTitleByMessage = errDetail.replace(msg_key1, msg_str1);
                    var msg_key2 = $translate.instant("CF_ERROR." + error.title + ".message_key2");
                    var msg_str2 = $translate.instant("CF_ERROR." + error.title + ".message2");
                    var msg_keys = msg_key2.split("%s");
                    if (msg_keys.length >= 2) {
                        var msg_str = cfErrTitleByMessage.replace(msg_keys[0], "");
                        var msg_strs = msg_str.split(msg_keys[1]);
                        if (msg_strs.length == 2) {
                            cfErrTitleByMessage = msg_str2.replace("%s", msg_strs[0]);
                            cfErrTitleByMessage = cfErrTitleByMessage.replace("%s", msg_strs[1]);
                            return cfErrTitleByMessage;
                        }
                    }
                }
            }
            cfErrTitleByMessage = error.detail;
            cf_message_type = $translate.instant("CF_ERROR." + error.code + ".message_type");
            if (cf_message_type != "no") {
                var errDetail = error.detail;
                var cf_message_key = $translate.instant("CF_ERROR." + error.code + ".message_key");
                var errMessage = $translate.instant("CF_ERROR." + error.code + ".message");
                if (message_type == "replace" || message_type == "preserve") {
                    errMessage = errDetail.replace(cf_message_key, errMessage);
                } else if (cf_message_type == "tail" || cf_message_type == "head") {
                    var msg_key = cf_message_key.replace("%s", "");
                    var msg_str = errDetail.replace(msg_key, "");
                    if (msg_str != errDetail) {
                        errMessage = errMessage.replace("%s", msg_str);
                    } else {
                        errMessage = errDetail;
                    }
                } else if (cf_message_type == "one") {
                    var msg_keys = cf_message_key.split("%s");
                    if (msg_keys.length == 2) {
                        var msg_str = errDetail.replace(msg_keys[0], "");
                        msg_str = msg_str.replace(msg_keys[1], "");
                        if (msg_str != errDetail) {
                            errMessage = errMessage.replace("%s", msg_str);
                        } else {
                            errMessage = errDetail;
                        }
                    } else {
                        errMessage = errDetail;
                    }
                } else if (cf_message_type == "head_tail") {
                    var msg_key = cf_message_key.replace("%s", "");
                    msg_key = msg_key.replace("%s", "");
                    var msg_strs = errDetail.split(msg_key);
                    if (msg_strs.length == 2) {
                        errMessage = errMessage.replace("%s", msg_strs[0]);
                        errMessage = errMessage.replace("%s", msg_strs[1]);
                    } else {
                        errMessage = errDetail;
                    }
                } else if (cf_message_type == "middle_tail") {
                    var msg_keys = cf_message_key.split("%s");
                    if (msg_keys.length >= 2) {
                        var msg_str = errDetail.replace(msg_keys[0], "");
                        var msg_strs = msg_str.split(msg_keys[1]);
                        if (msg_strs.length == 2) {
                            errMessage = errMessage.replace("%s", msg_strs[0]);
                            errMessage = errMessage.replace("%s", msg_strs[1]);
                        } else {
                            errMessage = errDetail;
                        }
                    } else {
                        errMessage = errDetail;
                    }
                } else if (cf_message_type == "reverse") {
                    var msg_keys = cf_message_key.split("%s");
                    if (msg_keys.length == 3) {
                        var msg_str = errDetail.replace(msg_keys[0], "");
                        msg_str = msg_str.replace(msg_keys[2], "");
                        var msg_strs = msg_str.split(msg_keys[1]);
                        if (msg_strs.length == 2) {
                            errMessage = errMessage.replace("%s", msg_strs[1]);
                            errMessage = errMessage.replace("%s", msg_strs[0]);
                        } else {
                            errMessage = errDetail;
                        }
                    }
                }
                cfErrTitleByMessage = errMessage;
            }
            return cfErrTitleByMessage;
        };

        // csrf token
        common.xsrfToken = null;

        common.resourcePromise = function (pathUrl, method, paramsData, contentType, accept, authorization) {
            if (angular.isUndefined(method)) {
                method = "GET";
            }
            if (method.toUpperCase() != "GET") {
                if (pathUrl.indexOf(CONSTANTS.paasApiCfContextUrl) > -1
                    || pathUrl.indexOf(CONSTANTS.paasApiCoreContextUrl) > -1
                    || pathUrl.indexOf(CONSTANTS.paasApiMarketContextUrl)  > -1) {
                    common.syncHttpResponse(CONSTANTS.paasApiCoreContextUrl + "/checkServer", "GET");
                }
            }
            var params = {};
            if (paramsData) {
                //params = $.extend(true, {}, paramsData);
                params = angular.copy(paramsData);
                if (params.urlPaths) {
                    for (var key in params.urlPaths) {
                        pathUrl = common.replaceAll(pathUrl, "{" + key + "}", params.urlPaths[key]);
                    }
                    delete params.urlPaths;
                }
                if (params.urlParams) {
                    if (pathUrl.indexOf('?') > 0) {
                        pathUrl += "&" + $.param(params.urlParams);
                    } else {
                        pathUrl += "?" + $.param(params.urlParams);
                    }
                    delete params.urlParams;
                }
                if (params.body) {
                    params = params.body;
                }
            }
            if ((method.toUpperCase() == "GET" || method.toUpperCase() == "DELETE") && params && $.param(params)) {
                if (pathUrl.indexOf('?') > 0) {
                    pathUrl += "&" + $.param(params);
                } else {
                    pathUrl += "?" + $.param(params);
                }
            }

            if (pathUrl.indexOf('?') > 0) {
                pathUrl += "&vt=v" + new Date().getTime();
            } else {
                pathUrl += "?vt=v" + new Date().getTime();
            }

            var acceptString = "application/json;charset=UTF-8";
            var contentTypeString = "application/json;charset=UTF-8";
            if (accept != undefined) {
                acceptString = accept;
            }
            if (contentType != undefined) {
                contentTypeString = contentType;
            }

            var config = {
                method: method,
                url: pathUrl,
                headers: {
                    'Accept': acceptString,
                    'Content-Type': contentTypeString
                }
            };

            if (authorization != undefined) {
                config.headers['Authorization'] = authorization;
            }

            // csrf token
            if (pathUrl.indexOf(CONSTANTS.paasApiCfContextUrl) > -1
                || pathUrl.indexOf(CONSTANTS.paasApiCoreContextUrl) > -1
                || pathUrl.indexOf(CONSTANTS.paasApiMarketContextUrl)  > -1) {
                if (common.xsrfToken) {
                    config.headers[_CSRF_TOKEN_HEADER_NAME_] = common.xsrfToken;
                }
                /*$http.defaults.useXDomain = true;
                $http.defaults.withCredentials = true;
            } else {
                $http.defaults.useXDomain = false;
                $http.defaults.withCredentials = false;*/
            }
            $http.defaults.useXDomain = false;
            $http.defaults.withCredentials = false;
            if (common.getAccessToken()) {
                config.headers[_TOKEN_HEADER_NAME_] = common.getAccessToken();
            }
            /*if (common.getRegionKey()) {
                config.headers[_REGION_HEADER_NAME_] = common.getRegionKey();
            }*/

            if (params) {
                if (contentTypeString.indexOf("multipart/form-data") > -1) {
                    config.data = params;
                    config.headers["Content-Type"] = undefined;
                    config.transformRequest = function (data, headersGetter) {
                        var formData = new FormData();
                        var isFile = false;
                        var totalSize = 0;
                        angular.forEach(data, function (value, key) {
                            if (angular.isArray(value)) {
                                for (var i=0; i<value.length; i++) {
                                    if(angular.isObject(value[i]) && value[i] instanceof $window.File) {
                                        try {
                                            formData.append(key, value[i], value[i].name);
                                        } catch (e) {
                                            value = paramsData[key];
                                            if (value[i]) {
                                                formData.append(key, value[i], value[i].name);
                                            }
                                        }
                                        isFile = true;
                                        totalSize += value[i].size;
                                    } else {
                                        formData.append(key, value[i]);
                                    }
                                }
                            } else if(angular.isObject(value) && value instanceof $window.File) {
                                try {
                                    formData.append(key, value, value.name);
                                } catch (e) {
                                    value = paramsData[key];
                                    if (value) {
                                        formData.append(key, value, value.name);
                                    }
                                }
                                isFile = true;
                                totalSize += value.size;
                            } else {
                                formData.append(key, value);
                            }
                        });
                        if (isFile && totalSize >= _UPLOADING_VIEW_MIN_SIZE_ * 1024) {
                            var scope = common.getMainCtrlScope();
                            scope.main.uploadProgress = {loaded : 0, total: totalSize, percent : 0};
                        }
                        return formData;
                    };
                    var defer = $q.defer();
                    config.uploadEventHandlers = { progress: function(evt) {
                            evt.percent = ((evt.loaded * 100) / evt.total);
                            defer.notify(evt);
                        }};
                    $http(config).then(defer.resolve.bind(defer), defer.reject.bind(defer));
                    return defer.promise;
                } else if (contentTypeString.indexOf('application/json') > -1) {
                    config.data = JSON.stringify(params);
                } else if (contentTypeString.indexOf('application/x-www-form-urlencoded') > -1) {
                    config.data = $.param(params);
                } else {
                    config.data = params;
                }
            }
            return $http(config);
        };
        
        common.resourcePromiseJson = function (pathUrl, method, params, charset) {
            var contentType = "application/json";
            if (charset == undefined) {
                contentType += ";" + charset;
            }
            return common.resourcePromise(pathUrl, method, params, contentType);
        };

        // promise ?????? success, error
        common.retrieveResource = function (promise, finallyFn) {
            promise.success = function (fn) {
                promise.then(function (response) {
                    if(angular.isUndefined(response)) response = {data:null,status:null,headers:null};
                    var newToken = response.headers(_CSRF_TOKEN_HEADER_NAME_);
                    if (newToken) {
                        common.xsrfToken = newToken;
                    }
                    fn(response.data, response.status, response.headers);
                });
                return promise;
            };
            promise.error = function (fn) {
                promise.then(null, function (response) {
                    if(response == undefined || typeof response == "string") response = {data:{}, status:"", headers:""};
                    if (response.data && response.data.status == 307) response.status = 307;    //0423. iaas DOMAIN ?????? ?????? ?????? ?????? add
                    if (response.data && response.data.message && response.data.message == "Could not commit JPA transaction; nested exception is javax.persistence.RollbackException: Transaction marked as rollbackOnly") {
                        response.status = 307;  //0726. ?????? ?????? ????????? ?????? ?????? ??? ??????. api??? ????????? ???????????? ??????
                        response.data.message = "mi_no_login";
                    }
                    if (response.status == 307) {
                        if (response.data && response.data.message) {
                            if (response.data.message == "mi_no_login") {
                                common.showAlertError($translate.instant("label.login"), "????????? ?????? ?????? ????????????.");
                            } else {
                                common.showAlertError($translate.instant("label.login"), $translate.instant("message." + response.data.message));
                            }
                        } else {
                            response.statusText = response.statusText ? response.statusText : (response.status ? response.status : $translate.instant("message.mi_error"));
                            common.showAlertWarningHtml($translate.instant("label.error"), response.statusText);
                        }
                        if (response.data.message == "mi_no_login") {
                            common.clearUserAll();
                            common.moveLoginPage();
                        } else {
                            common.moveCommHomePage();
                        }
                    } else {
                        try {
                            if (response.data && response.data.message) {
                                if (response.data.status == 403 && response.data.message == "OAuth2 access denied.") {
                                    if (!common.isPopCreateUserKey) {
                                        common.isPopCreateUserKey = true;
                                        $timeout(function () {
                                            common.showAlertError("??????", "PaaS ???????????? ?????? ????????? ????????????.");
                                            //common.getMainCtrlScope().main.createUserKey();
                                        }, 100);
                                    }
                                } else {
                                    var errTitle = "";
                                    if (angular.isString(response.data.errors)) {
                                        errTitle = response.data.errors;
                                    } else if (angular.isObject(response.data.errors) && angular.isString(response.data.errors.title)) {
                                        errTitle = response.data.errors.title;
                                    } else {
                                        errTitle = response.data.error ? response.data.error : $translate.instant("label.error");
                                    }
                                    var errMessage = response.data.message;
                                    if (common.getLanguageKey() == "ko" && angular.isString(response.data.exception) && (response.data.exception == "PaaS Platform ClientV2Exception")) {
                                        try {
                                            if (angular.isObject(response.data.errors) && angular.isDefined(response.data.errors.code)
                                                && angular.isDefined(response.data.errors.title) && angular.isDefined(response.data.errors.detail)) {
                                                var cfErrMessage = common.getCfErrorMessage(response.data.errors);
                                                if (cfErrMessage) {
                                                    errMessage = cfErrMessage;
                                                }
                                            }
                                        } catch (e) {
                                        }
                                    }
                                    if (errMessage && CONSTANTS.errorMessageSkip.indexOf(errMessage) < 0) {
                                        $timeout(function () {
                                            common.showAlertWarningHtml(errTitle, errMessage);
                                        }, 100);
                                    }
                                }
                            } else {
                                response.statusText = response.statusText ? response.statusText : (response.status ? response.status : $translate.instant("message.mi_error"));
                                if (response.statusText && CONSTANTS.errorMessageSkip.indexOf(response.statusText) < 0) {
                                    $timeout(function () {
                                        common.showAlertWarningHtml($translate.instant("label.error"), response.statusText);
                                    }, 100);
                                }
                            }
                        } catch (e) {
                        }
                    }
                    var scope = common.getMainCtrlScope();
                    scope.main.uploadProgress = null;
                    fn(response.data, response.status, response.headers);
                });
                return promise;
            };
            promise.progress = function (fn) {
                promise.then(null, null, function (progress) {
                    if (!progress) return;
                    var scope = common.getMainCtrlScope();
                    if (progress.total >= _UPLOADING_VIEW_MIN_SIZE_ * 1024) {
                        $timeout( function () {
                            scope.main.uploadProgress = progress;
                        }, 10);
                        if(progress.percent >= 100) {
                            $timeout( function () {
                                scope.main.uploadProgress = null;
                            }, 500);
                        }
                    } else {
                        $timeout( function () {
                            scope.main.uploadProgress = null;
                        }, 10);
                    }
                    fn(progress);
                });
                return promise;
            };
            promise.finally(function () {
                if (angular.isFunction(finallyFn)) {
                    finallyFn();
                }
            });
            return promise;
        };

        // promise ?????? success, error
        common.noMsgRetrieveResource = function (promise, finallyFn) {
            promise.success = function (fn) {
                promise.then(function (response, status, headers) {
                    fn(response, status, headers);
                });
                return promise;
            };
            promise.error = function (fn) {
                promise.then(null, function (response, status, headers) {
                    fn(response, status, headers);
                });
                return promise;
            };
            promise.progress = function (fn) {
                promise.then(null, null, function (progress) {
                    if (!progress) return;
                    var scope = common.getMainCtrlScope();
                    if (progress.total >= _UPLOADING_VIEW_MIN_SIZE_ * 1024) {
                        $timeout( function () {
                            scope.main.uploadProgress = progress;
                        }, 10);
                        if(progress.percent >= 100) {
                            $timeout( function () {
                                scope.main.uploadProgress = null;
                            }, 500);
                        }
                    } else {
                        $timeout( function () {
                            scope.main.uploadProgress = null;
                        }, 10);
                    }
                    fn(progress);
                });
                return promise;
            };
            promise.finally(function () {
                if (angular.isFunction(finallyFn)) {
                    finallyFn();
                }
            });
            return promise;
        };

	    // ?????? ??????
	    common.noMsgSyncHttpResponseJson = function (pathUrl, method, params, contentType, charset) {
	        var contentType = "application/json";
	        if (charset == undefined) {
	            charset = "";
	        }
	        return common.noMsgSyncHttpResponse(pathUrl, method, params, contentType, charset);
		};
	
	    // ?????? ??????
	    common.noMsgSyncHttpResponse = function (pathUrl, method, params, contentType, charset) {
	        if (method.toUpperCase() != "GET" || method.toUpperCase() != "DELETE" && params) {
	            if (pathUrl.indexOf('?') > 0) {
	                pathUrl += "&" + $.param(params);
	            } else {
	                pathUrl += "?" + $.param(params);
	            }
	        }

            if (pathUrl.indexOf('?') > 0) {
                pathUrl += "&vt=v" + new Date().getTime();
            } else {
                pathUrl += "?vt=v" + new Date().getTime();
            }

	        var acceptString = "application/json";
	        var contentTypeString = "application/json";
	        if (contentType != undefined) {
	            contentTypeString = contentType;
	        }
	
	        if (charset != undefined && charset != "") {
	            acceptString += ";charset=" + charset;
	            contentTypeString += ";charset=" + charset;
	        }
	        var headers = {
				'Accept': acceptString,
				'Content-Type': contentTypeString
	        };
	
	        if (pathUrl.indexOf(CONSTANTS.uaaContextUrl) < 0  && common.xsrfToken) {
	            headers[_CSRF_TOKEN_HEADER_NAME_] = common.xsrfToken;
	        }
	        if (pathUrl.indexOf(CONSTANTS.uaaContextUrl) < 0  && common.getAccessToken()) {
	            headers[_TOKEN_HEADER_NAME_] = common.getAccessToken();
	        }
	        /*if (pathUrl.indexOf(CONSTANTS.uaaContextUrl) < 0  && common.getRegionKey()) {
	            headers[_REGION_HEADER_NAME_] = common.getRegionKey();
	        }*/

			var data = {};
	        if (method.toUpperCase() != "GET" && method.toUpperCase() != "DELETE" && params) {
	            if (contentType == 'application/json') {
	                data = JSON.stringify(params);
	            } else if (contentType == 'application/x-www-form-urlencoded') {
	                data = $.param(params);
	            } else {
	                data = params;
	            }
	        }
	
	        var rtnData	= null;
	        $.ajax({
	            type: method,
	            url: pathUrl,
	            data: data,
	            headers : headers,
	            async: false,
	            success: function (data, statusText, response) {
	                rtnData = response;
	                rtnData.data = data;
	            },
				error: function (data, statusText, response) {
	                rtnData = response;
					if(!response) {
						rtnData = {};
						rtnData.data = data;
					}
	                rtnData.data = data;
	            }
	        });
	        return rtnData;
	    };

        // ?????? ??????
        common.syncHttpResponseJson = function (pathUrl, method, params, accept) {
            var contentType = "application/json";
            return common.syncHttpResponse(pathUrl, method, params, contentType, accept);
        };

        // ?????? ??????
        common.syncHttpResponse = function (pathUrl, method, params, contentType, accept) {
            if (method.toUpperCase() != "GET" && method.toUpperCase() != "DELETE" && params) {
                if (pathUrl.indexOf('?') > 0) {
                    pathUrl += "&" + $.param(params);
                } else {
                    pathUrl += "?" + $.param(params);
                }
            }

            if (params && params.urlPaths) {
                for (var key in params.urlPaths) {
                    pathUrl = common.replaceAll(pathUrl, "{" + key + "}", params.urlPaths[key]);
                }
                delete params.urlPaths;
            }

            var rtnData = {};

            var acceptString = "application/json;charset=UTF-8";
            var contentTypeString = "application/json;charset=UTF-8";
            if (accept != undefined) {
                acceptString = accept;
            }
            if (contentType != undefined) {
                contentTypeString = contentType;
            }

            var config = {
                type: method,
                url: pathUrl,
                async: false,
                headers: {
                    'Accept': acceptString,
                    'Content-Type': contentTypeString
                },
                xhrFields : {
                    crossDomain: true,
                    withCredentials : true
                },
                success: function (data, statusText, response) {
                    if(response == undefined || typeof response == "string") {
                        response = (data ? data : {});
                        data = (response.data ? response.data : {});
                    }
                    if (pathUrl.indexOf(CONSTANTS.paasApiCfContextUrl) > -1
                        || pathUrl.indexOf(CONSTANTS.paasApiCoreContextUrl) > -1
                        || pathUrl.indexOf(CONSTANTS.paasApiMarketContextUrl)  > -1) {
                        var newToken = response.getResponseHeader(_CSRF_TOKEN_HEADER_NAME_);
                        if (newToken) {
                            common.xsrfToken = newToken;
                        }
                    }
                    rtnData = response;
                    rtnData.data = data;
                },
                error: function (data, statusText, response) {
                    try {
                        if (angular.isUndefined(response) || angular.isString(response)) {
                            response = (data ? data : {});
                            if (!response.data && response.responseText && angular.isString(response.responseText)) {
                                try {
                                    response.data = JSON.parse(response.responseText);
                                } catch (e) {
                                }
                            }
                        }
                        response.data = response.data ? response.data : (data ? data : {});
                        response.statusText = response.statusText ? response.statusText : (statusText ? statusText : "");
                        if (response.status == 307 || response.data.status == 307) {
                            if (!response.data.message) {
                                response.data.message = "mi_no_login";
                            }
                            var message = $translate.instant("message." + response.data.message);
                            if (errMessage) {
                                $timeout(function () {
                                    if (response.data.message == "mi_no_login") {
                                        common.showAlertError($translate.instant("label.login"), "????????? ?????? ?????? ????????????.");
                                    } else {
                                        common.showAlertError($translate.instant("label.login"), message);
                                    }
                                }, 100);
                            }
                            if (message == "mi_no_login") {
                                common.clearUserAll();
                                common.moveLoginPage();
                            } else {
                                common.moveCommHomePage();
                            }
                        } else {
                            if (response.data && response.data.message) {
                                if (response.data.status == 403 && response.data.message == "OAuth2 access denied.") {
                                    if (!common.isPopCreateUserKey) {
                                        common.isPopCreateUserKey = true;
                                        $timeout(function () {
                                            common.showAlertError("??????", "PaaS ???????????? ?????? ????????? ????????????.");
                                            //common.getMainCtrlScope().main.createUserKey();
                                        }, 100);
                                    }
                                } else {
                                    var errTitle = "";
                                    if (angular.isString(response.data.errors)) {
                                        errTitle = response.data.errors;
                                    } else if (angular.isObject(response.data.errors) && angular.isString(response.data.errors.title)) {
                                        errTitle = response.data.errors.title;
                                    } else {
                                        errTitle = response.data.error ? response.data.error : $translate.instant("label.error");
                                    }
                                    var errMessage = response.data.message;
                                    if (common.getLanguageKey() == "ko" && angular.isString(response.data.exception) && (response.data.exception == "PaaS Platform ClientV2Exception")) {
                                        try {
                                            if (angular.isObject(response.data.errors) && angular.isDefined(response.data.errors.code)
                                                && angular.isDefined(response.data.errors.title) && angular.isDefined(response.data.errors.detail)) {
                                                var cfErrMessage = common.getCfErrorMessage(response.data.errors);
                                                if (cfErrMessage) {
                                                    errMessage = cfErrMessage;
                                                }
                                            }
                                        } catch (e) {}
                                    }
                                    if (errMessage) {
                                        $timeout(function () {
                                            common.showAlertWarningHtml(errTitle, errMessage);
                                        }, 100);
                                    }
                                }
                            } else {
                                response.statusText = response.statusText ? response.statusText : (response.status ? response.status : $translate.instant("message.mi_error"));
                                var message = response.statusText;
                                if (message) {
                                    $timeout(function () {
                                        common.showAlertWarningHtml($translate.instant("label.error"), message);
                                    }, 100);
                                }
                            }
                        }
                    } catch (e) {
                    } finally {
                        if (angular.isUndefined(response)) response = {};
                        if (angular.isUndefined(data)) data = {};
                    }
                    rtnData = response;
                    rtnData.data = data;
                }
            };

            if (pathUrl.indexOf(CONSTANTS.paasApiCfContextUrl) > -1
                || pathUrl.indexOf(CONSTANTS.paasApiCoreContextUrl) > -1
                || pathUrl.indexOf(CONSTANTS.paasApiMarketContextUrl)  > -1) {
                if (common.xsrfToken) {
                    config.headers[_CSRF_TOKEN_HEADER_NAME_] = common.xsrfToken;
                }
                config.xhrFields.crossDomain = true;
                config.xhrFields.withCredentials = true;
            } else {
                config.xhrFields.crossDomain = false;
                config.xhrFields.withCredentials = false;
            }

            if (common.getAccessToken()) {
                config.headers[_TOKEN_HEADER_NAME_] = common.getAccessToken();
            }
            /*if (common.getRegionKey()) {
                config.headers[_REGION_HEADER_NAME_] = common.getRegionKey();
            }*/

            if (method.toUpperCase() != "GET" && method.toUpperCase() != "DELETE" && params) {
                if (contentTypeString.indexOf('application/json') > -1) {
                    config.data = JSON.stringify(params);
                } else if (contentTypeString.indexOf('application/x-www-form-urlencoded') > -1) {
                    config.data = $.param(params);
                } else {
                    config.data = params;
                }
            } else {
                config.data = params;
            }
            $.ajax(config);
            return rtnData;
        };

        common.ocLazyLoad = function(moduleName, files) {
            return $ocLazyLoad.load({name: moduleName, files: files, cache: true});
        };

        common.getElementById = function (id) {
            return document.getElementById(id);
        };

        common.querySelector = function (query) {
            return document.querySelector(query);
        };

        common.getElementByIdCtrlElement = function (id) {
            return angular.element(common.getElementById(id));
        };

        common.getQuerySelectorCtrlElement = function (query) {
            return angular.element(common.querySelector(query));
        };

        // id??? scope ????????????
        common.getElementByIdCtrlScope = function (id) {
            return common.getElementByIdCtrlElement(id).scope();
        };

        // querySelector??? scope ????????????
        common.getQuerySelectorCtrlScope = function (query) {
            return common.getQuerySelectorCtrlElement(query).scope();
        };

        // main scope ????????????
        common.getMainCtrlScope = function () {
            return common.getElementByIdCtrlScope("mainCtrl");
        };

        // mainBody scope ????????????
        common.getMainBodyCtrlScope = function () {
            return common.getElementByIdCtrlScope("mainBody");
        };

        // MainContents scope ????????????
        common.getMainContentsCtrlScope = function () {
            return common.getElementByIdCtrlScope("mainContents");
        };

        common.goHomePath = function () {
            common.locationPath(CONSTANTS.homePath);
        };

        common.moveCommHomePage = function () {
            common.goToState(CONSTANTS.commHomeState);
        };

        common.moveHomePage = function () {
            common.locationHref(CONSTANTS.homeUrl);
        };

        common.moveLoginPage = function () {
            common.locationHref(CONSTANTS.loginUrl);
        };

        common.locationUrl = function (pathUrl) {
            $location.url(pathUrl).replace();
        };

        common.stateReload = function () {
            $state.reload();
        };

        common.locationReload = function () {
            $window.location.reload();
        };

        common.locationHref = function (url) {
            $window.location.href = url;
        };

        common.locationPathReplace = function (pathUrl) {
            $location.path(pathUrl).replace();
        };

        common.locationPath = function (pathUrl) {
            $location.path(pathUrl);
        };

        common.goToState = function (stateKey) {
            if ($state.current.url && $state.current.url.indexOf("loadbalancer") > -1) {
                //$state.go(stateKey, {tabIndex: 1});
                //common.locationHref('/#/iaas/compute?tabIndex=1');
                common.locationHref('/#'+ $state.get(stateKey).url + '?tabIndex=1');
            } else {
                return $state.go(stateKey);
            }
        };

        common.getJSONParse = function (jsonStr) {
            var jsonData = jsonStr;
            try {
                jsonData = JSON.parse(jsonStr);
            } catch (e) {
            }
            return jsonData;
        };

        common.getJSONStringify = function (jsonData) {
            var jsonStr = jsonData;
            try {
                jsonStr = JSON.stringify(jsonData);
            } catch (e) {
            }
            return jsonStr;
        };

        common.isLoginAcceptPage = function (path) {
            return ($.inArray(path, CONSTANTS.notLoginAcceptPages) === -1);
        };

        common.isNotLoginAcceptPage = function (path) {
            return ($.inArray(path, CONSTANTS.loginAcceptPages) !== -1);
        };

        common.makeKeyAndValueMap = function (mapList, keyField, valueField) {
            var paramMap = {};
            $.each(mapList, function (idx, sMap) {
                if (sMap[keyField]) {
                    paramMap[sMap[keyField]] = sMap[valueField];
                }
            });
            return paramMap;
        };

        // alert
        common.showAlertSuccess = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("success");
                common.showAlertMessage(args);
            }
        };

        // alert
        common.showAlertError = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("error");
                common.showAlertMessage(args);
            }
        };

        // alert
        common.showAlertWarning = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("warn");
                common.showAlertMessage(args);
            }
        };

        // alert
        common.showAlertInfo = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("info");
                common.showAlertMessage(args);
            }
        };

        // alert
        common.showAlert = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                common.showAlertMessage(args);
            }
        };

        // alert
        common.showAlertMessage = function (args) {
            var time = 3000;
            var start = 0;
            if (args.length > 0 && angular.isNumber(args[0])) {
                time = args[0];
                start = 1;
            }
            if (args.length > start) {
                var alertType = "info";
                var textContent = "message";
                if (args.length == start + 1) {
                    textContent = args[start];
                } else if (args.length == start + 2) {
                    if ("|success|warn|error|info|".indexOf(args[start + 1]) >= 0) {
                        textContent = args[start];
                        alertType = args[start + 1];
                    } else {
                        textContent = args[start + 1];
                    }
                } else if (args.length >= start + 3) {
                    textContent = args[start + 1];
                    alertType = args[start + 2];
                }
                _DebugConsoleLog("showAlertMessageHtml : " + textContent, 1);
                if (_DOMAIN_ != 'localhost') {
                    if (!textContent) return;
                    if (textContent == "Unauthorized") return;
                    if (textContent == "Not Found") return;
                    if (textContent == "Bad Gateway") return;
                    if (textContent == "No message available") return;
                    if (textContent == "Error") return;
                    if (textContent == "307") return;
                    if (textContent == "-1") return;
                }
                console.log("showAlertMessage : " + textContent);
                $timeout(function () {
                    if (alertType == "success") {
                        growl.addSuccessMessage(textContent, {ttl: time, enableHtml: false});
                    } else if (alertType == "warn") {
                        growl.addWarnMessage(textContent, {ttl: time, enableHtml: false});
                    } else if (alertType == "error") {
                        growl.addErrorMessage(textContent, {ttl: time, enableHtml: false});
                    } else {
                        growl.addInfoMessage(textContent, {ttl: time, enableHtml: false});
                    }
                }, 10);
            }
        };

        // alert
        common.showAlertSuccessHtml = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("success");
                common.showAlertMessageHtml(args);
            }
        };

        // alert
        common.showAlertErrorHtml = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("error");
                common.showAlertMessageHtml(args);
            }
        };

        // alert
        common.showAlertWarningHtml = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("warn");
                common.showAlertMessageHtml(args);
            }
        };

        // alert
        common.showAlertInfoHtml = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                args.push("info");
                common.showAlertMessageHtml(args);
            }
        };

        // alert
        common.showAlertHtml = function () {
            if (arguments.length > 0) {
                var args = Array.prototype.slice.call(arguments);
                common.showAlertMessageHtml(args);
            }
        };

        // alert
        common.showAlertMessageHtml = function (args) {
            var time = 3000;
            var start = 0;
            if (args.length > 0 && angular.isNumber(args[0])) {
                time = args[0];
                start = 1;
            }
            if (args.length > start) {
                var alertType = "info";
                var htmlContent = "message";
                if (args.length == start + 1) {
                    htmlContent = args[start];
                } else if (args.length == start + 2) {
                    if ("|success|warn|error|info|".indexOf(args[start + 1]) >= 0) {
                        htmlContent = args[start];
                        alertType = args[start + 1];
                    } else {
                        htmlContent = args[start + 1];
                    }
                } else if (args.length >= start + 3) {
                    htmlContent = args[start + 1];
                    alertType = args[start + 2];
                }
                _DebugConsoleLog("showAlertMessageHtml : " + htmlContent, 1);
                if (_DOMAIN_ != 'localhost') {
                    if (!htmlContent) return;
                    if (htmlContent == "Unauthorized") return;
                    if (htmlContent == "Not Found") return;
                    if (htmlContent == "Bad Gateway") return;
                    if (htmlContent == "No message available") return;
                    if (htmlContent == "Error") return;
                    if (htmlContent == "307") return;
                    if (htmlContent == "-1") return;
                }
                $timeout(function () {
                    if (alertType == "success") {
                        growl.addSuccessMessage(htmlContent, {ttl: time, enableHtml: true});
                    } else if (alertType == "warn") {
                        growl.addWarnMessage(htmlContent, {ttl: time, enableHtml: true});
                    } else if (alertType == "error") {
                        growl.addErrorMessage(htmlContent, {ttl: time, enableHtml: true});
                    } else {
                        growl.addInfoMessage(htmlContent, {ttl: time, enableHtml: true});
                    }
                }, 10);
            }
        };

        // alert
        common.showDialogAlertError = function (title, textContent) {
            return common.showDialogAlert(title, textContent, "error");
        };

        // alert
        common.showDialogAlertWarning = function (title, textContent) {
            return common.showDialogAlert(title, textContent, "warning");
        };

        // alert
        common.showDialogAlert = function (title, textContent, alertType) {
            var rootScope = common.getMainCtrlScope();
            rootScope.main.loadingMain = false;
            rootScope.main.loadingMainBody = false;
            var optionsOrPreset = $mdDialog.alert({skipHide: true, clickOutsideToClose: true}).title(title).textContent(textContent).ok($translate.instant("label.confirm"));
            if (alertType != "info"){
                optionsOrPreset._options.templateUrl = CONSTANTS.popAlertFormUrl2 + _VersionTail();
            } else {
                optionsOrPreset._options.templateUrl = CONSTANTS.popAlertFormUrl + _VersionTail();
            }
            if (angular.isDefined(alertType) && alertType != "info") {
                optionsOrPreset._options.alertType = alertType;
                optionsOrPreset._options.ariaLabel = $translate.instant("label." + alertType);
            } else {
                optionsOrPreset._options.alertType = "info";
                optionsOrPreset._options.ariaLabel = $translate.instant("label.confirm");
            }
            optionsOrPreset.fullscreen = false;
            optionsOrPreset.multiple = true;
            return $mdDialog.show(optionsOrPreset);
        };

        // alert
        common.showDialogAlertErrorHtml = function (title, textContent) {
            return common.showDialogAlertHtml(title, textContent, "error");
        };

        // alert
        common.showDialogAlertWarningHtml = function (title, textContent) {
            return common.showDialogAlertHtml(title, textContent, "warning");
        };

        // alert
        common.showDialogAlertHtml = function (title, htmlContent, alertType) {
            var rootScope = common.getMainCtrlScope();
            rootScope.main.loadingMain = false;
            rootScope.main.loadingMainBody = false;
            var optionsOrPreset = $mdDialog.alert({skipHide: true, clickOutsideToClose: true}).title(title).htmlContent(htmlContent).ok($translate.instant("label.confirm"));
            if (alertType == "info" || alertType == "notice"){
                optionsOrPreset._options.templateUrl = CONSTANTS.popAlertFormUrl2 + _VersionTail();
            } else {
                optionsOrPreset._options.templateUrl = CONSTANTS.popAlertFormUrl + _VersionTail();
            }
            if (angular.isDefined(alertType) && alertType != "info" && alertType != "notice") {
                optionsOrPreset._options.alertType = alertType;
                optionsOrPreset._options.ariaLabel = $translate.instant("label." + alertType);
            } else {
                 optionsOrPreset._options.alertType = "info";
                 if(alertType == "notice"){
                    optionsOrPreset._options.ariaLabel = $translate.instant("label.board_notice");
                  }else{
                    optionsOrPreset._options.ariaLabel = $translate.instant("label.notice");
                 }
             }
            optionsOrPreset.fullscreen = false;
            optionsOrPreset.multiple = true;
            return $mdDialog.show(optionsOrPreset);
        };

        // confirm
        common.showConfirmWarning = function (title, textContent) {
            return common.showConfirm(title, textContent, "warning");
        };

        // confirm
        common.showConfirm = function (title, textContent, alertType) {
            var optionsOrPreset = $mdDialog.confirm({skipHide: true, clickOutsideToClose: true}).title(title).textContent(textContent).ok($translate.instant("label.ok")).cancel($translate.instant("label.cancel"));
            optionsOrPreset._options.templateUrl = CONSTANTS.popAlertFormUrl + _VersionTail();
            if (angular.isDefined(alertType) && alertType != "info") {
                optionsOrPreset._options.alertType = alertType;
                optionsOrPreset._options.ariaLabel = $translate.instant("label." + alertType);
            } else {
                optionsOrPreset._options.alertType = "info";
                optionsOrPreset._options.ariaLabel = $translate.instant("label.confirm");
            }
            optionsOrPreset.fullscreen = false;
            optionsOrPreset.multiple = true;
            return $mdDialog.show(optionsOrPreset);
        };

        // confirm
        common.showConfirmWarningHtml = function (title, textContent) {
            return common.showConfirmHtml(title, textContent, "warning");
        };

        // confirm
        common.showConfirmHtml = function (title, htmlContent, alertType) {
            var optionsOrPreset = $mdDialog.confirm({skipHide: true, clickOutsideToClose: true}).title(title).htmlContent(htmlContent).ok($translate.instant("label.ok")).cancel($translate.instant("label.cancel"))
            optionsOrPreset._options.templateUrl = CONSTANTS.popAlertFormUrl + _VersionTail();
            if (angular.isDefined(alertType) && alertType != "info") {
                optionsOrPreset._options.alertType = alertType;
                optionsOrPreset._options.ariaLabel = $translate.instant("label." + alertType);
            } else {
                optionsOrPreset._options.alertType = "info";
                optionsOrPreset._options.ariaLabel = $translate.instant("label.confirm");
            }
            optionsOrPreset.fullscreen = false;
            optionsOrPreset.multiple = true;
            return $mdDialog.show(optionsOrPreset);
        };

        common.mdDialogHide = function () {
            $mdDialog.hide();
        };

        common.mdDialogCancel = function () {
            $mdDialog.cancel();
        };

        common.showDialog = function ($scope, $event, dialogOptions) {

            if (!angular.isUndefined(dialogOptions)) {
                if (angular.isString(dialogOptions)) {
                    dialogOptions	= { controller : dialogOptions };
                }
                if (!dialogOptions.dialogClassName) {
                    dialogOptions.dialogClassName = "modal-dialog";
                }
                if (!dialogOptions.btnTemplateUrl) {
                    if (!dialogOptions.btnTemplate) {
                        if (dialogOptions.buttons) {
                            var btnTemplate	= '<p ng-show="dialogOptions.bottomLeftMessage" class="pull-left">{{ dialogOptions.bottomLeftMessage }}</p>\n';
                            angular.forEach(dialogOptions.buttons, function (value, key) {
                                var btnName		= (value.btnName) ? value.btnName : "Btn(" + key + ')';
                                var className	= (value.className) ? ' ' + value.className : "";
                                var extOption	= (value.extOption) ? ' ' + value.extOption : "";
                                if (btnTemplate)	btnTemplate	+= "\n";
                                btnTemplate += '<button ng-hide="actionBtnHied" class="btn'+ className +'"' + extOption + '>' + btnName + '</button>';
                            });
                            dialogOptions.btnTemplate= btnTemplate
                        } else {
                            dialogOptions.btnTemplate = '<p ng-show="dialogOptions.bottomLeftMessage" class="pull-left">{{ dialogOptions.bottomLeftMessage }}</p>\n';
                            if (dialogOptions.okBtnHide != true) {
                                dialogOptions.btnTemplate += '<button ng-hide="actionBtnHied" class="btn btn-primary" ng-click="popDialogOk()" ng-hide="error || success" ng-disabled="dialogOptions.authenticate">{{ dialogOptions.okName }}</button>\n';
                            }
                            if (dialogOptions.cancelBtnHide != true) {
                                dialogOptions.btnTemplate += '<button ng-hide="actionBtnHied" class="btn btn-default" data-dismiss="modal" ng-click="popCancel()">{{ dialogOptions.closeName }}</button>\n';
                            }
                        }
                    }
                }
                if (!dialogOptions.okName) {
                    dialogOptions.okName = $translate.instant("label.save");
                }
                if (!dialogOptions.closeName) {
                    dialogOptions.closeName = $translate.instant("label.close");
                }
                if (!dialogOptions.resultReturnName) {
                    dialogOptions.resultReturnName = $translate.instant("label.confirm");
                }
                $scope.dialogOptions = dialogOptions;
            }

            if (!dialogOptions.controller) {
                dialogOptions.controller = function ($scope, ValidationService) {
                    _DebugConsoleLog("popCommFormCtrl", 3);
                    var vm = this;
                    vm.validationService = new ValidationService({controllerAs: vm});
                };
            }
            if (!dialogOptions.controllerAs) {
                dialogOptions.controllerAs = "pop";
            }

            if (!dialogOptions.notForm && !dialogOptions.formName) {
                dialogOptions.formName = "dialogForm";
            }

            $scope.dialogOptions = dialogOptions;

            $scope.error	= null;
            $scope.success	= null;
            var optionsOrPreset = {
                controller: dialogOptions.controller,
                controllerAs: dialogOptions.controllerAs,
                templateUrl: CONSTANTS.popCommFormUrl + _VersionTimeTail(),
                parent: angular.element(document.body),
                autoWrap: true,
                targetEvent: $event,
                scope: $scope,
                preserveScope: true,
                clickOutsideToClose: false,
                escapeToClose: true,
                fullscreen: false,
                multiple: false,
                skipHide: true
            };

            var dialog	= $mdDialog.show(optionsOrPreset);
            $scope.actionLoading = false;
            $scope.dialogClose	= false;

            if (!$scope.popDialogOk) {
                $scope.popDialogOk = function () {
                    $mdDialog.hide();
                };
            }

            if (!$scope.popCancel) {
                $scope.popCancel = function () {
                    $scope.dialogClose	= true;
                    $scope.actionBtnHied = false;
                    $mdDialog.cancel();
                };
            }

            $scope.popHide = function () {
                $scope.dialogClose	= true;
                $scope.actionBtnHied = false;
                $mdDialog.hide();
            };

            $scope.popAnswer = function (answer) {
                $mdDialog.hide(answer);
            };
            $scope.popResultReturn = function () {
                $scope.error = null;
                $scope.success = null;
            };

            $scope.actionBtnHied = false;
            return dialog;
        };

        common.showSimpleDialog = function ($scope, $event, dialogOptions) {

            if (!angular.isUndefined(dialogOptions)) {
                if (angular.isString(dialogOptions)) {
                    dialogOptions	= { controller : dialogOptions };
                }
                if (!dialogOptions.dialogClassName) {
                    dialogOptions.dialogClassName = "modal-dialog";
                }
            }

            var scopePop = null;
            if ($scope.pop) {
                scopePop = $scope.pop;
            }

            if (!dialogOptions.controller) {
                dialogOptions.controller = function (ValidationService) {
                    _DebugConsoleLog("popMultipleCommFormCtrl", 3);
                    var vm = this;
                    vm.validationService = new ValidationService({controllerAs: vm});
                    if (scopePop) {
                       angular.forEach(scopePop, function (val, k) {
                          vm[k] = val;
                       });
                    }
                };
            }
            if (!dialogOptions.controllerAs) {
                dialogOptions.controllerAs = "pop";
            }

            $scope.dialogOptions = dialogOptions;

            var optionsOrPreset = {
                controller: dialogOptions.controller,
                controllerAs: dialogOptions.controllerAs,
                templateUrl: _COMM_VIEWS_+'/common/popSimpleCommForm.html' + _VersionTimeTail(),
                parent: angular.element(document.body),
                scope: $scope,
                preserveScope: true,
                autoWrap: true,
                targetEvent: $event,
                clickOutsideToClose: false,
                escapeToClose: true,
                fullscreen: false,
                multiple: true,
                skipHide: true
            };

            var dialog	= $mdDialog.show(optionsOrPreset);

            $scope.dialogOptions.popDialogOk = function () {
                $scope.actionBtnHied = false;
                $mdDialog.hide();
            };

            $scope.dialogOptions.popCancel = function () {
                $scope.actionBtnHied = false;
                $mdDialog.cancel();
            };

            $scope.dialogOptions.popHide = function () {
                $scope.actionBtnHied = false;
                $mdDialog.hide();
            };

            $scope.actionBtnHied = false;
            return dialog;
        };

        common.showRightSliderContents = function ($scope, title, templateUrl, data, options) {

            var dialogOptions	= {};
            if (options) {
                dialogOptions = options;
            }
            dialogOptions.title = title;
            if (!dialogOptions.dialogClassName) {
                dialogOptions.dialogClassName = "modal-right-dialog";
            }
            if (!dialogOptions.controllerAs) {
                dialogOptions.controllerAs = "spop";
            }
            dialogOptions.controller = function ($scope) {
                _DebugConsoleLog("rightSliderContentsCtrl", 3);
                var vm = this;
                vm.data = (data) ? data : {};
            };

            if (!dialogOptions.dialogId) {
                dialogOptions.dialogId = "slider-contents";
            }

            if (!dialogOptions.sliderWidth) {
                dialogOptions.sliderWidth = 1000;
            }

            $('#' + dialogOptions.dialogId).css('width', dialogOptions.sliderWidth);
            $('body').addClass('body_fixed');
            $('html').addClass('html_hidden_scroll');
            $("#slider-contents-container").css('display', 'block');
            if (!dialogOptions.dialogTemplateUrl) {
                dialogOptions.dialogTemplateUrl = _COMM_VIEWS_ + '/common/rightCommSliderContents.html' + _VersionTimeTail();
            }
            dialogOptions.templateUrl = templateUrl ? templateUrl + _VersionTimeTail() : "";

            return common.showRightDialog($scope, dialogOptions);
        };

        common.showRightDialog = function ($scope, dialogOptions) {
            if (!angular.isUndefined(dialogOptions)) {
                if (angular.isString(dialogOptions)) {
                    dialogOptions	= { controller : dialogOptions };
                }
                if (!dialogOptions.dialogClassName) {
                    dialogOptions.dialogClassName = "modal-right-dialog";
                }
            }

            if (!dialogOptions.controllerAs) {
                dialogOptions.controllerAs = "pop";
            }

            if (!dialogOptions.controller) {
                dialogOptions.controller = function ($scope, ValidationService) {
                    var vm = this;
                    vm.validationService = new ValidationService({controllerAs: vm});
                    _DebugConsoleLog("rightPopFormCtrl", 3);
                };
            }

            var dialogId = (dialogOptions.dialogId) ? "#" + dialogOptions.dialogId : "#aside-md";
            dialogOptions.sliderWidth = (dialogOptions.sliderWidth) ? dialogOptions.sliderWidth : 360;
            var onShowing = function($scope, element) {
                $(dialogId).stop().animate({"right": "-" + dialogOptions.sliderWidth + "px"}, 400);
                $(dialogId).stop().animate({"right": "0"}, 500);
            };
            var onRemoving = function($scope, element) {
                $(dialogId).stop().animate({"right":"-" + dialogOptions.sliderWidth + "px"}, 400);
                $timeout(function () {
                    $(dialogId).find('> dev').remove();
                    $("#slider-contents-container").css('display', 'none');
                    $('body').removeClass('body_fixed');
                    $('html').removeClass('html_hidden_scroll');
                }, 400);
            };

            dialogOptions.dialogTemplateUrl = (dialogOptions.dialogTemplateUrl) ? dialogOptions.dialogTemplateUrl : _COMM_VIEWS_+'/common/rightPopCommForm.html' + _VersionTimeTail();

            $scope.dialogOptions = dialogOptions;

            var optionsOrPreset = {
                controller: dialogOptions.controller,
                controllerAs: dialogOptions.controllerAs,
                templateUrl: dialogOptions.dialogTemplateUrl + _VersionTimeTail(),
                parent: $(dialogId),
                scope: $scope,
                locals: { popType: 'pop' },
                disableParentScroll: false,
                hasBackdrop: false,
                preserveScope: true,
                autoWrap: true,
                clickOutsideToClose: false,
                escapeToClose: true,
                fullscreen: false,
                focusOnOpen: false,
                multiple: true,
                onShowing: onShowing,
                onRemoving: onRemoving
            };

            var dialog	= $mdDialog.show(optionsOrPreset);

            $scope.dialogOptions.popHide = function () {
                $scope.actionBtnHied = false;
                $mdDialog.hide();
            };

            $scope.dialogOptions.popCancel = function () {
                $scope.actionBtnHied = false;
                $mdDialog.cancel();
            };

            $scope.dialogOptions.popDialogOk = function () {
                $scope.actionBtnHied = false;
                $mdDialog.hide();
            };

            $scope.actionBtnHied = false;
            return dialog;
        };

        common.showRightChildDialog = function ($scope, dialogOptions) {
            if (!angular.isUndefined(dialogOptions)) {
                if (angular.isString(dialogOptions)) {
                    dialogOptions	= { controller : dialogOptions };
                }
                if (!dialogOptions.dialogClassName) {
                    dialogOptions.dialogClassName = "modal-right-dialog";
                }
            }

            if (!dialogOptions.controllerAs) {
                dialogOptions.controllerAs = "pop";
            }

            if (!dialogOptions.controller) {
                dialogOptions.controller = function ($scope, ValidationService) {
                    var vm = this;
                    vm.validationService = new ValidationService({controllerAs: vm});
                    _DebugConsoleLog("rightPopFormCtrl", 3);
                };
            }

            var dialogId = "#aside-md-child";

            var onShowing = function($scope, element) {
                $(dialogId).stop().animate({"right":"-360px"}, 400);
                $(dialogId).stop().animate({"right":"0"}, 500);
            };

            var onRemoving = function($scope, element) {
                $(dialogId).find('> dev').remove();
                $(dialogId).stop().animate({"right":"-360px"}, 400);
            };

            $scope.childDialogOptions = dialogOptions;

            var optionsOrPreset = {
                controller: dialogOptions.controller,
                controllerAs: dialogOptions.controllerAs,
                templateUrl: _COMM_VIEWS_+'/common/rightChildPopCommForm.html' + _VersionTimeTail(),
                parent: $(dialogId),
                scope: $scope,
                locals: { popType: 'child' },
                disableParentScroll: false,
                hasBackdrop: false,
                preserveScope: true,
                autoWrap: true,
                clickOutsideToClose: false,
                escapeToClose: true,
                fullscreen: false,
                focusOnOpen: false,
                multiple: true,
                skipHide: true,
                onShowing: onShowing,
                onRemoving: onRemoving
            };

            var dialog	= $mdDialog.show(optionsOrPreset);

            $scope.childDialogOptions.popHide = function () {
                $scope.actionBtnHied = false;
                $mdDialog.hide();
            };

            $scope.childDialogOptions.popCancel = function () {
                $scope.actionBtnHied = false;
                $mdDialog.cancel();
            };

            $scope.childDialogOptions.popDialogOk = function () {
                $scope.actionBtnHied = false;
                $mdDialog.hide();
            };

            $scope.actionBtnHied = false;
            return dialog;
        };

        common.showCustomDialog = function ($scope, $event, dialogOptions) {
            $scope.error	= null;
            $scope.success	= null;

            if (!dialogOptions.dialogClassName) {
                dialogOptions.dialogClassName = "modal-dialog";
            }

            if (!dialogOptions.controller) {
                dialogOptions.controller = function ($scope, ValidationService) {
                    var vm = this;
                    vm.validationService = new ValidationService({controllerAs: vm});
                    _DebugConsoleLog("popCommFormCtrl", 3);
                };
            }

            if (!dialogOptions.controllerAs) {
                dialogOptions.controllerAs = "pop";
            }

            if (!dialogOptions.formName) {
                dialogOptions.formName = "dialogForm";
            }

            $scope.dialogOptions = dialogOptions;

            var optionsOrPreset = {
                controller: dialogOptions.controller,
                controllerAs: dialogOptions.controllerAs,
                templateUrl: dialogOptions.templateUrl + _VersionTimeTail(),
                parent: angular.element(document.body),
                autoWrap: true,
                targetEvent: $event,
                scope: $scope,
                preserveScope: true,
                clickOutsideToClose: false,
                escapeToClose: true,
                fullscreen: false,
                multiple: false,
                skipHide: true
            };

            var dialog	= $mdDialog.show(optionsOrPreset);

            if (!$scope.popDialogOk) {
                $scope.popDialogOk = function () {
                    $mdDialog.hide();
                };
            }

            if (!$scope.popCancel) {
                $scope.popCancel = function () {
                    $scope.actionBtnHied = false;
                    $mdDialog.cancel();
                };
            }

            if (!$scope.popHide) {
                $scope.popHide = function () {
                    $scope.actionBtnHied = false;
                    $mdDialog.hide();
                };
            }

            if (!$scope.popAnswer) {
                $scope.popAnswer = function (answer) {
                    $scope.actionBtnHied = false;
                    $mdDialog.hide(answer);
                };
            }

            $scope.actionBtnHied = false;
            return dialog;
        };

        common.showLocalsDialog = function ($event, dialogOptions) {
            var optionsOrPreset = {
                controller: dialogOptions.controller,
                templateUrl: dialogOptions.templateUrl,
                parent: angular.element(document.body),
                autoWrap: true,
                targetEvent: $event,
                clickOutsideToClose: false,
                escapeToClose: true,
                fullscreen: false,
                multiple: true
            };

            if (dialogOptions.locals) {
                optionsOrPreset.locals = dialogOptions.locals;
            }

            return $mdDialog.show(optionsOrPreset);
        };

        /*???????????? ?????? : ??????*/
        common.notice = function (obj, index){
            var noticeId = obj.id;
            var noticeTitle = obj.title;
            var noticeContent = obj.content.replace(/\n/g, "<br />");

            common.getTemplateHtml("views/common/popNotice.html" + _VersionTail(), function (templateHtml) {
                var width = 600;
                var height = 600;
                var left = screen.availLeft + index*40;    //(screen.width-width)/2;
                var top = screen.availTop + index*40;    //(screen.height-height)/2;
                var option = 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=no, top='+top+', left='+left+', width='+width+', height='+height;

                var objWin = window.open("", "notice"+noticeId, option);

                if(objWin == null){
                    if (!common.isLoginShowAlert) {
                        common.isLoginShowAlert	= true;
                        common.showAlertErrorHtml("????????????", "??????????????? ????????????. <br>??????????????? ????????? ????????? ????????????.").then(function () {
                            common.isLoginShowAlert = false;
                        });
                    }
                } else {
                    //?????? ????????? ????????? ?????? ?????? append ??????
                    if(objWin.document.body.innerText == "") {
                        templateHtml = templateHtml.replace("{{noticeTitle}}", noticeTitle);
                        templateHtml = templateHtml.replace("{{noticeContent}}", noticeContent);
                        templateHtml = templateHtml.replace(/{{noticeId}}/g, noticeId);
                        objWin.document.writeln(templateHtml);
                    }
                    objWin.focus();
                }
            });
        };

        // ?????? ????????? ?????? ??????
        common.initFileUploader = function (uploader) {

            uploader.alias = "file";
            uploader.url	= CONSTANTS.paasApiCoreContextUrl;
            uploader.withCredentials = true;

            uploader.filters	= [];
            // FILTERS
            // a sync filter
            uploader.filters.push({
                name: 'syncFilter',
                fn: function (item, options) {
                    return false;
                }
            });

            uploader.formData		= [];

            uploader.clearQueue();

            // CALLBACKS
            uploader.onWhenAddingFileFailed = function (item, filter, options) {
                _DebugConsoleInfo('onWhenAddingFileFailed', item, filter, options);
            };
            uploader.onAfterAddingFile = function (fileItem) {
                _DebugConsoleInfo('onAfterAddingFile', fileItem);
            };
            uploader.onAfterAddingAll = function (addedFileItems) {
                _DebugConsoleInfo('onAfterAddingAll', addedFileItems);
            };
            uploader.onBeforeUploadItem = function (item) {
                _DebugConsoleInfo('onBeforeUploadItem', item);
            };
            uploader.onProgressItem = function (fileItem, progress) {
                _DebugConsoleInfo('onProgressItem', fileItem, progress);
            };
            uploader.onProgressAll = function (progress) {
                _DebugConsoleInfo('onProgressAll', progress);
            };
            uploader.onSuccessItem = function (fileItem, response, status, headers) {
                _DebugConsoleInfo('onSuccessItem', fileItem, response, status, headers);
            };
            uploader.onErrorItem = function (fileItem, response, status, headers) {
                _DebugConsoleInfo('onErrorItem', fileItem, response, status, headers);
            };
            uploader.onCancelItem = function (fileItem, response, status, headers) {
                _DebugConsoleInfo('onCancelItem', fileItem, response, status, headers);
            };
            uploader.onCompleteItem = function (fileItem, response, status, headers) {
                _DebugConsoleInfo('onCompleteItem', fileItem, response, status, headers);
            };
            uploader.onCompleteAll = function () {
                _DebugConsoleInfo('onCompleteAll');
            };
        };

        common.setDefaultFileUploader = function ($scope, options) {
            var uploader = $scope.main.uploader;

            if (angular.isUndefined(options)) {
                options = {};
            }

            if (angular.isDefined(options.headers) && options.headers.length) {
                for(var key in options.headers) {
                    uploader.headers[key] = options.headers[key];
                }
            }
            if (angular.isDefined(options.formData)) {
                uploader.formData	= options.formData;
            }
            if (angular.isDefined(options.withCredentials)) {
                uploader.withCredentials = true;
            }
            uploader.filters    = [];
            if (options.filters && options.filters.length) {
                for (var i=0; i<options.filters.length; i++) {
                    uploader.filters.push(options.filters[i]);
                }
            }
            return uploader;
        };

        common.getSingleFileUploader = function ($scope, options) {
            var uploader = $scope.main.uploader;

            if (!angular.isUndefined(options)) {
                if (options.headers && options.headers.length) {
                    for(var key in options.headers) {
                        uploader.headers[key] = options.headers[key];
                    }
                }
                if (!angular.isUndefined(options.formData)) {
                    uploader.formData	= options.formData;
                }
                if (!angular.isUndefined(options.withCredentials)) {
                    uploader.withCredentials = true;
                }
            }

            angular.forEach(uploader.filters, function(filter, idx) {
                if (filter.name == "syncFilter") {
                    uploader.filters.splice(idx,1);
                }
            });

            // a sync filter
            uploader.filters.push({
                name: 'syncFilter',
                fn: function (item, options) {
                    uploader.clearQueue();
                    return true;
                }
            });

            return uploader;
        };

        common.singleFileUploading = function (uploader, options) {

            uploader.url = options.url;

            if (uploader.queue.length == 1) {

                if (common.getAccessToken()) {
                    uploader.headers[_TOKEN_HEADER_NAME_] = common.getAccessToken();
                }
                uploader.withCredentials = true;

                uploader.formData = [];
                if (!angular.isUndefined(options)) {
                    if (!angular.isUndefined(options.formData)) {
                        uploader.formData.push(options.formData);
                    }
                }

                uploader.onCompleteItem = function (fileItem, response, status, headers) {
                    if (angular.isFunction(options.callbackFun)) {
                        options.callbackFun(fileItem, response, status, headers);
                    }
                };
                var item = uploader.queue[0];
                item.url = uploader.url;
                item.headers = uploader.headers;
                item.formData = uploader.formData;
                item.withCredentials = uploader.withCredentials;
                item.upload();
            }
        };

        common.multipartFileUpload = function(uploadUrl, file){
            var fd = new FormData();
            fd.append('file', file);
            // var config = {
            // 	method: 'PUT',
            // 	url: uploadUrl,
            // 	headers: {
            // 		'Content-Type': undefined,
            // 		_TOKEN_HEADER_NAME_:common.getAccessToken()
            // 	},
            // 	transformRequest: angular.identity
            // }
            return $http.put(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined,
                    _TOKEN_HEADER_NAME_:common.getAccessToken()
                }
            });
            return $http(config);
        };

        // TemplateHtml ????????????
        common.getTemplateHtml = function (templateUrl, callBackFunc, errCallBackFunc) {
            $http.get(templateUrl).success(function (data, status, headers, config) {
                if (angular.isFunction(callBackFunc)) {
                    callBackFunc(data);
                }
            }).error(function (data, status, headers, config) {
                if (angular.isFunction(errCallBackFunc)) {
                    errCallBackFunc(data);
                }
            });
        };

        common.getFileMinType = function (type) {

            if (CONSTANTS.minTypes[type]) {
                return CONSTANTS.minTypes[type]
            } else {
                return CONSTANTS.defultMintype
            }
        };

        common.removeTag = function removeTag(str) {
            return str.replace(/(<([^>]+)>)/gi, "");
        };

        common.setUser = function (userInfo) {
            common.getMainCtrlScope().main.userInfo = userInfo;
            cache.setUser(userInfo);
        };

        common.clearUser = function () {
            common.getMainCtrlScope().main.userInfo = {};
            cache.clearUser();
        };

        common.getUser = function () {
            return cache.getUser();
        };

        /*????????????(A/B/M/O/U : ?????????/??????????????????/???????????????/???????????????/???????????????*/
        common.getUserAuth = function () {
            var sAuth = "U";
            var userInfo = common.getUser();
            if(userInfo){
                if (userInfo.manager) {
                    sAuth = "M";
                } else if (userInfo.uaaAdmin) {
                    sAuth = "A";
                }
                if (userInfo.scope) {
                    if (userInfo.scope.indexOf("company.manager") > -1) {
                        sAuth = "M";
                    } else if (userInfo.scope.indexOf("uaaXpert.admin") > -1) {
                        sAuth = "A";
                    }
                }
            } else {
                sAuth = "";
            }
            return sAuth;
        };

        common.getAccessToken = function () {
            return cookies.getAccessToken();
        };

        common.setAccessToken = function (access_token) {
            cookies.setAccessToken(access_token);
        };

        common.clearAccessToken = function () {
            cookies.clearAccessToken();
        };

        common.getOrgAuthToken = function () {
            return cookies.getOrgAuthToken();
        };

        common.setOrgAuthToken = function (access_token) {
            cookies.setOrgAuthToken(access_token);
        };

        common.clearOrgAuthToken = function () {
            cookies.clearOrgAuthToken();
        };

        common.isAuthenticated = function () {
            return (cookies.getAccessToken() != null && cookies.getAccessToken() != "");
        };

        common.getPgsecuid = function () {
            return cookies.getPgsecuid();
        };

        common.clearPgsecuid = function () {
            cookies.clearPgsecuid();
        };

        common.setPgsecuid = function (pgsecuid) {
            cookies.setPgsecuid(pgsecuid);
        };

        common.logoutAction = function () {
            var scope = common.getMainCtrlScope();
            scope.main.loadingMainBody = true;
            var logoutPromise = common.retrieveResource(common.resourcePromiseJson(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/logout', 'POST'));
            logoutPromise.success(function (data, status, headers) {
                scope.main.loadingMainBody = false;
                common.logout();
            });
            logoutPromise.error(function (data, status, headers) {
                scope.main.loadingMainBody = false;
                common.logout();
            });
        };

        common.logout = function () {
            common.clearUserAll();
            try {
                // ???????????? ????????? ????????? ?????????????????? ??? ??? ??????
                if ($window.opener && $window.opener.document
                    && $window.opener.document.domain
                    && $window.document.domain == $window.opener.document.domain ) {
                    $window.opener.location.href = "/#/login";
                    $window.close();
                } else {
                    common.moveLoginPage();
                }
            } catch (e) {
                // 2020.3.9 by hrit, cross-origin ?????? ??????. ????????? ???????????? ????????? ????????? ?????? ?????? ????????? ???????????? ??? ??????
                if (e.message.indexOf('cross-origin') > -1) {
                    common.moveLoginPage();
                }
            }
        };

        common.setCompanyLogo = function (filePath) {
            cache.setCompanyLogo(filePath);
        };

        common.clearCompanyLogo = function () {
            cache.clearCompanyLogo();
        };

        common.getCompanyLogo = function () {
            return cache.getCompanyLogo();
        };

        common.clearUserAll = function () {
            cookies.clearAll();
            common.clearUser();
        };

        common.clearAll = function () {
            cookies.clearAll();
            cache.clearAll();
        };

        common.objectsFindByField = function (objects, fieldName, value) {
            if (!angular.isArray(objects)) return null;
            for (var i=0; i<objects.length; i++) {
                if (objects[i][fieldName] == value) {
                    return objects[i];
                }
            }
            return null;
        };

        common.objectsFindCopyByField = function (objects, fieldName, value) {
            var obj = common.objectsFindByField(objects, fieldName, value);
            if (angular.isObject(obj)) {
                return angular.copy(obj);
            } else {
                return obj;
            }
        };

        common.objectOrArrayMergeData = function (target, source) {
            if (angular.isArray(target)) {
                if (angular.isArray(source)) {
                    if (target.length > source.length) {
                        target.splice(source.length, target.length - source.length);
                    }
                    for (var i=0; i<source.length; i++) {
                        if (angular.isArray(target[i]) || angular.isObject(target[i])) {
                            common.objectOrArrayMergeData(target[i], source[i]);
                        } else {
                            target[i] = source[i];
                        }
                    }
                } else {
                    target = source;
                }
            } else if (angular.isObject(target)) {
                if (angular.isObject(source)) {
                    angular.forEach(target, function (item, key) {
                        if (angular.isUndefined(source[key])) {
                            delete target[key];
                        }
                    });
                    angular.forEach(source, function (value, key) {
                        if (angular.isArray(target) || angular.isObject(source)[key]) {
                            if (angular.isArray(target[key]) && angular.isArray(target[target[key]])) {
                                common.objectOrArrayMergeData(target[key], value);
                            } else {
                                target[key] = value;
                            }
                        } else {
                            target[key] = value;
                        }
                    });
                } else {
                    target = source;
                }
            } else {
                target = source;
            }
        };

        common.getProcessBar = function (amt) {
            var obj = {};
            obj.countTo = amt;
            obj.countFrom = 0;
            obj.progressValue = amt;
            return obj;
        };

        common.getProcessPercentBar = function (total, usage) {
            var amt = 0;
            if (total > 0) {
                amt = parseInt(usage*100/total);
            }
            return common.getProcessBar(amt);
        };

        common.getPageDatas = function (datas, pageOptions) {
            var pageDatas = [];
            var start = pageOptions.pageSize * (pageOptions.currentPage - 1);
            var count = 0;
            for (var i=start; i<datas.length; i++) {
                pageDatas.push(datas[i]);
                count++;
                if (count >= pageOptions.pageSize) {
                    break;
                }
            }
            return pageDatas;
        };

        common.tooltip = function () {
            $timeout(function () {
                $(document).ready(function () {
                    $('[data-toggle="tooltip"]').tooltip();
                });
            }, 200);
        };
        
        common.compareForSort = function (first, second) {
            if (first.id == second.id)
                return 0;
            if (first.id < second.id)
                return -1;
            else
                return 1;
        };

        common.copyToClipboard = function (clipboard) {
            if (clipboard) {
                var $temp_input = $("<input>");
                $("body").append($temp_input);
                $temp_input.val(clipboard).select();
                document.execCommand("copy");
                $temp_input.remove();
            }
        };

        common.getAlarmType = function () {
            var nodeJson = CONSTANTS.resourceKey;
            
            var typeList = [];

            angular.forEach(Object.keys(nodeJson), function (el, k) {
                typeList.push({value: nodeJson[el], name: nodeJson[el]});
            });

            return typeList;
        };

        common.getAlarmLevel = function () {
            return angular.copy(CONSTANTS.alarmLevel.slice(0,4));
        };

        common.getResolveStatusCmb = function () {
            return angular.copy(CONSTANTS.resolveStatus);
        };
        
        common.getServiceType = function (tenantYn, stcallback) {
            var nodeJson = {};

            angular.copy(CONSTANTS.nodeKey, nodeJson);
            
            var nodeList = [];
            if (tenantYn === undefined) tenantYn = false;
            if (!tenantYn) delete nodeJson.TENANT;

            var serverStatsPromise = common.resourcePromise(CONSTANTS.monitNewApiContextUrl + '/info', 'GET');
            serverStatsPromise.success(function (data, status, headers) {
                if (!data.storageNodeEnabled) delete nodeJson.STORAGE;
                if (!data.networkNodeEnabled) delete nodeJson.NETWORK;

                angular.forEach(Object.keys(nodeJson), function (el, k) {
                    nodeList.push({value: nodeJson[el], name: el});
                });

                if (stcallback) {
                    stcallback(nodeList);
                } else {
                    return nodeList;
                }
            });
            serverStatsPromise.error(function (data, status, headers) {
                //common.showAlert(data.message);
            });
            serverStatsPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        common.getGroupingComboBox = function (timeRange, from, to) {
            var result = [];
            var hour = 1;
            var minTime;
            var maxTime;
            var intervalTime = 5;
            var intervalTimeType = 'h';
            var intervalTimeTypeName = '??????';
            
            if (timeRange == '30d') {
                minTime = 6;
                maxTime = 24;
                intervalTime = 3;
            } else if (timeRange == '7d') {
                minTime = 2;
                maxTime = 16;
                intervalTime = 2;
            } else if (timeRange == 'custom') {
                var fromm = moment(from, 'YY.MM.DD h:mm');
                var tom = moment(to, 'YY.MM.DD h:mm');
                hour = tom.diff(fromm, 'hour');

                if (hour <= 24) {
                    minTime = Math.ceil(hour * 60 / 100);
                    maxTime = intervalTime * Math.ceil(hour * 60 / 10 / intervalTime);
                    intervalTimeType = 'm';
                    intervalTimeTypeName = '???';
                } else if (hour > 24 && hour <= 168) {
                    minTime = 2;
                    maxTime = 16;
                    intervalTime = 2;
                } else if (hour > 168 && hour <= 720) {
                    minTime = 6;
                    maxTime = 24;
                    intervalTime = 3;
                } else if (hour > 720 && hour <= 1440) {
                    minTime = 12;
                    maxTime = 48;
                    intervalTime = 6;
                } else {
                    minTime = 24;
                    maxTime = 96;
                    intervalTime = 12;
                }
            } else {
                hour = timeRange.replace('h', '');
                if (timeRange.indexOf('d') > -1 ) hour = timeRange.replace('d', '') * 24;
                minTime = Math.ceil(hour * 60 / 100);
                maxTime = intervalTime * Math.ceil(hour * 60 / 10 / intervalTime);
                intervalTimeType = 'm';
                intervalTimeTypeName = '???';
            }

            // 24?????? ????????? ??? ?????? ?????? 5?????? ????????? ??????. ?????? ?????????
            if (intervalTimeType == 'm' && minTime < 5) {
                if (minTime <= 0) minTime = 1;
                for (var i = minTime; i < 5; i++) {
                    result.push({
                        value: (i + intervalTimeType),
                        name: (i + intervalTimeTypeName)
                    });
                }
                minTime = 5;
            }

            // 24?????? ????????? ??? ?????? ?????? 5??? ????????? ?????? ??????, ?????? ??? ????????????, ???????????? 5??? ????????? ??????
            if (intervalTimeType == 'm' && minTime % 5 != 0) {
                result.push({
                    value: (minTime + intervalTimeType),
                    name: (minTime + intervalTimeTypeName)
                });
                minTime = Math.ceil(minTime / 5) * 5
            }

            // ????????? ?????? ??????(???), ?????? ??????(???), ?????? ???????????? ??? ??????
            for (var i = minTime; i <= maxTime; i+=intervalTime) {
                result.push({
                    value: (i + intervalTimeType),
                    name: (i + intervalTimeTypeName)
                });
            }

            return result;
        };

        common.getGroupingByTimeRange = function (timeRange, from, to) {
            var minutes = 1;
            if (timeRange.indexOf('h') > -1) {
                minutes = timeRange.replace('h', '');
            } else if (timeRange.indexOf('d') > -1) {
                minutes = timeRange.replace('d', '') * 24;
            } else if (timeRange == 'custom') {
                var fromm = moment(from, 'YY.MM.DD h:mm');
                var tom = moment(to, 'YY.MM.DD h:mm');
                minutes = tom.diff(fromm, 'minutes');
            }

            if (minutes <= 30) return 'deny';

            var grouping = Math.ceil(minutes / 100 * 60);
            if (grouping % 60 == 0) grouping = grouping / 60 + 'm';
            else grouping += 's';

            return grouping;
        };

        common.selectGroupingByCustomTimeRange = function (from, to) {
            var fromm = moment(from, 'YYYY-MM-DD hh:mm');
            var tom = moment(to, 'YYYY-MM-DD hh:mm');
            var subtraction = tom.diff(fromm, 'minutes');
            var grouping = '';
            if (subtraction <= 15) {
                grouping = '1m';
            } else if (15 < subtraction && subtraction <= 30) {
                grouping = '2m';
            } else if (30 < subtraction && subtraction <= 60) {
                grouping = '4m';
            } else if (60 < subtraction && subtraction <= 180) {
                grouping = '12m';
            } else if (180 < subtraction && subtraction <= 360) {
                grouping = '24m';
            } else if (360 < subtraction && subtraction <= 720) {
                grouping = '48m';
            } else if (720 < subtraction && subtraction <= 1440) {
                grouping = '96m';
            } else if (1440 < subtraction && subtraction <= 10080) {
                grouping = '672m';
            } else if (10080 < subtraction) {
                grouping = '2880m';
            }
            return grouping;
        };

        common.getTimeRangeFlag = function (from, to) {
            if (!to) to = moment();
            var minuteDiff = to.diff(from, 'minutes');
            
            return minuteDiff + 'm';
        };

        common.replaceStrAll = function (source, org, dest) {
            return source.split(org).join(dest);
        };

        common.trustAsHtml = function (content) {
            content = common.replaceStrAll(content, '&lt;', '<', true);
            content = common.replaceStrAll(content, '&gt;', '>', true);
            content = common.replaceStrAll(content, '[&]', '&', true);
            return content;
        };

        return common;
    })
    .factory('cache', function (localStorageService) {

        var cache = {};

        cache.getStorage = function (key) {
            return localStorageService.get(key);
        };
        cache.setStorage = function (key, data) {
            localStorageService.add(key, data);
        };
        cache.removeStorage = function (key) {
            localStorageService.remove(key);
        };

        cache.getStorageJson = function (key) {
            return JSON.parse(localStorageService.get(key));
        };
        cache.setStorageJson = function (key, data) {
            localStorageService.add(key, JSON.stringify(data));
        };

        cache.getLanguageKey = function () {
            return localStorageService.get(_LANGUAGE_KEY_CASHE_NAME_);
        };

        cache.setLanguageKey = function (languageKey) {
            localStorageService.add(_LANGUAGE_KEY_CASHE_NAME_, languageKey);
        };

        cache.getRegionKey = function () {
            return localStorageService.get(_REGION_KEY_CASHE_NAME_);
        };

        cache.setRegionKey = function (regionKey) {
            localStorageService.add(_REGION_KEY_CASHE_NAME_, regionKey);
        };

        cache.getOrganizationKey = function () {
            return localStorageService.get("org");
        };

        cache.setOrganizationKey = function (organizationGuid) {
            localStorageService.add("org", organizationGuid);
        };

        cache.clearOrganizationKey = function () {
            localStorageService.remove("org");
        };

        cache.getProjectKey = function () {
            return localStorageService.get("project_key");
        };

        cache.setProjectKey = function (projectId) {
            localStorageService.add("project_key", projectId);
        };

        cache.clearProjectKey = function () {
            localStorageService.remove("project_key");
        };

        cache.getPortalOrgKey = function () {
            return localStorageService.get("portal_org_key");
        };

        cache.setPortalOrgKey = function (projectId) {
            localStorageService.add("portal_org_key", projectId);
        };

        cache.clearPortalOrgKey = function () {
            localStorageService.remove("portal_org_key");
        };

        cache.getRegionChangToPath = function () {
            return localStorageService.get("regionChangeToPath");
        };

        cache.setRegionChangToPath = function (regionChangeToPath) {
            localStorageService.add("regionChangeToPath", regionChangeToPath);
        };

        cache.clearRegionChangToPath = function () {
            localStorageService.remove("regionChangeToPath");
        };

        cache.setUser = function (userInfo) {
            localStorageService.add(_USER_INFO_CASHE_NAME_, JSON.stringify(userInfo));
        };

        cache.getUser = function () {
            return JSON.parse(localStorageService.get(_USER_INFO_CASHE_NAME_));
        };

        cache.clearUser = function () {
            localStorageService.remove(_USER_INFO_CASHE_NAME_);
        };

        cache.getAccessToken = function () {
            return localStorageService.get(_ACCESS_TOKEN_CASHE_NAME_);
        };

        cache.setAccessToken = function (access_token) {
            localStorageService.add(_ACCESS_TOKEN_CASHE_NAME_, access_token);
        };

        cache.clearAccessToken = function () {
            localStorageService.remove(_ACCESS_TOKEN_CASHE_NAME_);
        };

        cache.getLeftMenuShow = function () {
            return localStorageService.get(_LEFT_MENU_SHOW_CASHE_NAME_);
        };

        cache.setLeftMenuShow = function (show) {
            if (show)	{
                localStorageService.add(_LEFT_MENU_SHOW_CASHE_NAME_, "Y");
            } else {
                localStorageService.add(_LEFT_MENU_SHOW_CASHE_NAME_, "N");
            }
        };

        cache.setCompanyLogo = function (filePath) {
            localStorageService.add(_COMPANY_LOGO_CASHE_NAME_, filePath);
        };

        cache.getCompanyLogo = function () {
            return localStorageService.get(_COMPANY_LOGO_CASHE_NAME_);
        };

        cache.clearCompanyLogo = function () {
            localStorageService.remove(_COMPANY_LOGO_CASHE_NAME_);
        };

        cache.clearAll = function () {
            localStorageService.clearAll();
        };

        return cache;
    })
    .factory('cookies', function ($cookies) {
        var cookies = {};
        var cookiesOption = {path: _COOKIES_PATH_};
        if (_DOMAIN_) {
            if (_DOMAIN_.indexOf("kepco.co.kr") > -1) {
                cookiesOption.domain = ".kepco.co.kr";
            } else if (_DOMAIN_ == "www.kepri-demo.crossent.com" || _DOMAIN_ == "www.kepri2-demo.crossent.com" || _DOMAIN_ == "www.smp-icon-demo.crossent.com") {
                cookiesOption.domain = _DOMAIN_.substring(3);
            } else if (_DOMAIN_.indexOf('kr') > 0) {
                cookiesOption.domain = "." + _DOMAIN_;
            }
        }

        cookies.getLanguageKey = function () {
            return $cookies.get(_LANGUAGE_KEY_COOKIE_NAME_);
        };

        cookies.setLanguageKey = function (languageKey) {
            $cookies.put(_LANGUAGE_KEY_COOKIE_NAME_, languageKey, cookiesOption);
        };

        cookies.getRegionKey = function () {
            return $cookies.get(_REGION_KEY_COOKIE_NAME_);
        };

        cookies.setRegionKey = function (regionKey) {
            $cookies.put(_REGION_KEY_COOKIE_NAME_, regionKey, cookiesOption);
        };

        cookies.setUser = function (userInfo) {
            $cookies.put(_USER_INFO_COOKIE_NAME_, JSON.stringify(userInfo), cookiesOption);
        };

        cookies.getUser = function () {
            if ($cookies.get(_USER_INFO_COOKIE_NAME_)) {
                return JSON.parse($cookies.get(_USER_INFO_COOKIE_NAME_));
            } else {
                return null;
            }
        };

        cookies.clearUser = function () {
            $cookies.remove(_USER_INFO_COOKIE_NAME_, cookiesOption);
        };

        cookies.getPgsecuid = function () {
            return $cookies.get('pgsecuid');
        };

        cookies.clearPgsecuid = function () {
            $cookies.remove('pgsecuid', cookiesOption);
        };

        cookies.setPgsecuid = function (pgsecuid) {
            $cookies.put("pgsecuid", pgsecuid, cookiesOption);
        };

        cookies.getAccessToken = function () {
            return $cookies.get(_ACCESS_TOKEN_COOKIE_NAME_);
        };

        cookies.setAccessToken = function (accessToken) {
            $cookies.put(_ACCESS_TOKEN_COOKIE_NAME_, accessToken, cookiesOption);
        };

        cookies.clearAccessToken = function () {
            $cookies.remove(_ACCESS_TOKEN_COOKIE_NAME_, cookiesOption);
        };

        cookies.getOrgAuthToken = function () {
            return $cookies.get("ORG_AUTH_TOKEN");
        };

        cookies.setOrgAuthToken = function (orgAuthToken) {
            $cookies.put("ORG_AUTH_TOKEN", orgAuthToken, cookiesOption);
        };

        cookies.clearOrgAuthToken = function () {
            $cookies.remove("ORG_AUTH_TOKEN", cookiesOption);
        };

        cookies.getPortalOrgKey = function () {
            return $cookies.get(_PROJECT_ID_COOKIE_NAME_);
        };

        cookies.setPortalOrgKey = function (projectId) {
            $cookies.put(_PROJECT_ID_COOKIE_NAME_, projectId, cookiesOption);
        };

        cookies.clearPortalOrgKey = function () {
            $cookies.remove(_PROJECT_ID_COOKIE_NAME_, cookiesOption);
        };

        // TeamCode
        cookies.getTeamCode = function () {
            return $cookies.get(_PROJECT_CODE_COOKIE_NAME_);
        };

        cookies.setTeamCode = function (teamCode) {
            $cookies.put(_PROJECT_CODE_COOKIE_NAME_, teamCode, cookiesOption);
        };

        cookies.clearTeamCode = function () {
            $cookies.remove(_PROJECT_CODE_COOKIE_NAME_, cookiesOption);
        };

        // userTenantId
        cookies.getUserTenantId = function () {
            return $cookies.get(_USER_TENANT_ID_COOKIE_NAME_);
        };

        cookies.setUserTenantId = function (userTenantId) {
            $cookies.put(_USER_TENANT_ID_COOKIE_NAME_, userTenantId, cookiesOption);
        };

        cookies.clearUserTenantId = function () {
            $cookies.remove(_USER_TENANT_ID_COOKIE_NAME_, cookiesOption);
        };

        // gpuUserTenantId
        cookies.getGpuUserTenantId = function () {
            return $cookies.get(_GPU_TENANT_ID_COOKIE_NAME_);
        };

        cookies.setGpuUserTenantId = function (gpuUserTenantId) {
            $cookies.put(_GPU_TENANT_ID_COOKIE_NAME_, gpuUserTenantId, cookiesOption);
        };

        cookies.clearGpuUserTenantId = function () {
            $cookies.remove(_GPU_TENANT_ID_COOKIE_NAME_, cookiesOption);
        };

        cookies.getLeftMenuShow = function () {
            return $cookies.get(_LEFT_MENU_SHOW_COOKIE_NAME_);
        };

        cookies.setLeftMenuShow = function (show) {
            if (show)	{
                $cookies.put(_LEFT_MENU_SHOW_COOKIE_NAME_, "Y", cookiesOption);
            } else {
                $cookies.put(_LEFT_MENU_SHOW_COOKIE_NAME_, "N", cookiesOption);
            }
        };

        cookies.clearAll = function () {
            cookies.clearAccessToken();
            //cookies.clearPgsecuid();
            cookies.clearUser();
            cookies.clearPortalOrgKey();
            cookies.clearUserTenantId();
            cookies.clearTeamCode();
        };

        var dtFormat = 'YYYY-MM-DD HH:mm';
        cookies.putDefaultTimeRange = function (defaultTimeRange) {
            $cookies.put(_DEFAULT_TIMERANGE_, defaultTimeRange);
        };
        cookies.getDefaultTimeRange = function () {
            var r = $cookies.get(_DEFAULT_TIMERANGE_);
            if (!r) {
                r = angular.element('input:radio[name=radioTimeRange]:first').val();
                if (!r) r = '1h';
                $cookies.put(_DEFAULT_TIMERANGE_, r);
            }
            return $cookies.get(_DEFAULT_TIMERANGE_);
        };
        cookies.removeDefaultTimeRange = function () {
            $cookies.remove(_DEFAULT_TIMERANGE_);
        };

        cookies.putTimeRangeFrom = function (timeRangeFrom) {
            $cookies.put(_TIMERANGE_FROM_, timeRangeFrom, cookiesOption);
        };
        cookies.getTimeRangeFrom = function () {
            return $cookies.get(_TIMERANGE_FROM_);
        };
        cookies.removeTimeRangeFrom = function () {
            $cookies.remove(_TIMERANGE_FROM_);
        };

        cookies.getDefaultTimeRangeFrom = function () {
            var from = moment($cookies.get(_DEFAULT_TIMERANGE_FROM_), dtFormat);
            var to = moment($cookies.get(_DEFAULT_TIMERANGE_TO_), dtFormat);
            if (!to._isValid) to = moment();
            if (!from._isValid) from = moment(to.subtract(1, 'hours').format(dtFormat), dtFormat);
            return from;
        };
        cookies.putDefaultTimeRangeFrom = function (timeRangeFrom) {
            $cookies.put(_DEFAULT_TIMERANGE_FROM_, timeRangeFrom.format(dtFormat), cookiesOption);
        };
        cookies.removeDefaultTimeRangeFrom = function () {
            $cookies.remove(_DEFAULT_TIMERANGE_FROM_);
        };

        cookies.getDefaultTimeRangeTo = function () {
            var to = moment($cookies.get(_DEFAULT_TIMERANGE_TO_), dtFormat);
            if (!to._isValid) to = moment(moment().format(dtFormat), dtFormat);
            return to;
        };
        cookies.putDefaultTimeRangeTo = function (timeRangeTo) {
            $cookies.put(_DEFAULT_TIMERANGE_TO_, timeRangeTo.format(dtFormat), cookiesOption);
        };
        cookies.removeDefaultTimeRangeTo = function () {
            $cookies.remove(_DEFAULT_TIMERANGE_TO_);
        };

        cookies.putTimeRangeTo = function (timeRangeTo) {
            $cookies.put(_TIMERANGE_TO_, timeRangeTo, cookiesOption);
        };
        cookies.getTimeRangeTo = function () {
            return $cookies.get(_TIMERANGE_TO_);
        };
        cookies.removeTimeRangeTo = function () {
            $cookies.remove(_TIMERANGE_TO_);
        };

        cookies.putGroupBy = function (groupBy) {
            $cookies.put(_GROUPBY_, groupBy, cookiesOption);
        };
        cookies.getGroupBy = function () {
            var r = $cookies.get(_GROUPBY_);
            if (!r) $cookies.put(_GROUPBY_, '1m', cookiesOption);
            return $cookies.get(_GROUPBY_);
        };
        cookies.removeGroupBy = function () {
            $cookies.remove(_GROUPBY_);
        };

        return cookies;
    })
    .factory('HttpInterceptor', function ($q) {
        var HttpInterceptor = {
            request: function(config) {
                return config;
            },
            response: function(response) {
                return response;
            },
            progress: function(evt) {
                return evt;
            },
            responseError: function(rejection) {
                if (rejection) {
                    var main = angular.element(document.getElementById("mainCtrl")).scope().main;
                    //console.log(rejection);
                    if(rejection.status == 307 && rejection.config && rejection.config.url && rejection.config.url.indexOf('/paas-api/') == -1) {
                        if (angular.isDefined(main) && angular.isFunction(main.logout)) {
                            $(function () {
                                main.logout();
                            });
                        }
                    } else if (rejection.status == 500) {
                        if (angular.isDefined(main) && angular.isDefined(main.loadingMainBody)) {
                            $(function () {
                                main.loadingMainBody = false;
                            });
                        }
                    }
                }
                return $q.reject(rejection);
            }
        };
        return HttpInterceptor;
    })
/** ????????? ???????????? ????????? ?????? ?????? ?????? **/
/** ?????? ?????? ??? ?????? state ????????? ?????? ??????
 resolve: {
          auth: function (Auth) {
            return Auth.get({redirect: true});
          }
      }
 **/
/**
 .service('Auth', function ($q, $http, $state, $cacheFactory, common, user) {
        var Auth = {};
        function deferredReject(deferred, options) {
            // ???????????? ???????????? reject
            deferred.reject('Rejected');
            // options.redirect ???????????? ?????? ????????? ?????? /login ???????????? ???????????????
            if (options && options.redirect) {
                $state.go('login');
            }
        }

        // ????????? ?????? ??????
        Auth.get = function (options) {
            var deferred = $q.defer();
            var userInfo = common.getUser();
            if (userInfo) {
                // ????????? ??????????????? ????????? ???????????? ??????
                deferred.resolve(userInfo);
            } else {
                // ????????? ??????????????? ????????? ???????????? ?????????
                if (common.getAccessToken()) {
                    user.accessTokenCheck(common.getAccessToken())
                        .success(function (response) { // ????????? ??? ??????
                            if (response.status == 307) {
                                deferredReject(deferred, options);
                            } else if (response.data && response.data.resultCode == "0") {
                                var tokenUserInfo = response.data.tokenInfo;
                                if (userInfo && userInfo.email && (userInfo.email != userInfo.user_name)) {
                                    if (tokenUserInfo && tokenUserInfo.email && (tokenUserInfo.email == tokenUserInfo.user_name)) {
                                        tokenUserInfo.user_name = userInfo.user_name;
                                    }
                                }
                                common.setUser(tokenUserInfo); // ????????? ???????????? ??????
                                deferred.resolve(tokenUserInfo); // ???????????? ??????
                            }
                        })
                        .error(function () {
                            deferredReject(deferred, options);
                        });
                } else {
                    deferredReject(deferred, options);
                }
            }
        };
        return Auth
    })
 **/
;