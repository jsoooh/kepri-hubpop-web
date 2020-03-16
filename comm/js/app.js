'use strict';

angular.module('app', [
        , 'common.controllers'
        , 'common.services'
        , 'portal.controllers'
        , 'portal.services'
        , 'product.controllers'
        , 'product.services'
        , 'iaas.controllers'
        , 'iaas.services'
        , 'paas.controllers'
        , 'paas.services'
        // , 'market.controllers'
        // , 'market.services'
        //, 'monit.controllers'
        //, 'monit.services'
        , 'ngRoute'
        , 'ui.router'
        , 'ui.bootstrap'
        , 'ngCookies'
        , 'ngSanitize'
        , 'ngAnimate'
        , 'ngMaterial'
        , 'ghiscoding.validation'
        , 'pascalprecht.translate'
        , 'bw.paging'
        , 'ADM-dateTimePicker'
        , 'angularFileUpload'
        , 'ui.select2'
        , 'countTo'
        , 'rzModule'
        , 'chart.js'
        , 'slickCarousel'
        , 'nvd3'
        , 'scrollable-table'
        , 'dndLists'
        , 'angular-growl'
        , 'Tek.progressBar'
    	, 'bytes-validator'
        , 'ui.sortable'
        , 'ngJScrollPane'
        , 'checklist-model'
    ])
    .config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$translateProvider', 'CONSTANTS', 'SITEMAP', 'IAASSITEMAP', 'PAASSITEMAP', 'PERFSITEMAP'/*, 'MARKETSITEMAP', 'MONITSITEMAP'*/,
        function ($httpProvider, $stateProvider, $urlRouterProvider, $translateProvider, CONSTANTS, SITEMAP, IAASSITEMAP, PAASSITEMAP, PERFSITEMAP/*, MARKETSITEMAP, MONITSITEMAP*/) {

        _DebugConsoleLog('app.js : commonApp', 1);

        //$httpProvider.defaults.useXDomain = true;
        //$httpProvider.defaults.withCredentials = true;
        $httpProvider.defaults.xsrfCookieName = _CSRF_TOKEN_COOKIE_NAME_;
        $httpProvider.defaults.xsrfHeaderName = _CSRF_TOKEN_HEADER_NAME_;
        //$httpProvider.interceptors.push('XSRFInterceptor');
        $httpProvider.interceptors.push('HttpInterceptor');

        /*var initInjector = angular.injector(["ng"]);

        var $http = initInjector.get("$http");
        $http.defaults.useXDomain = true;
        $http.defaults.withCredentials = true;
        $http.defaults.xsrfCookieName = _CSRF_TOKEN_COOKIE_NAME_;
        $http.defaults.xsrfHeaderName = _CSRF_TOKEN_HEADER_NAME_;*/

		delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $urlRouterProvider.otherwise('/comm/projects/');

        function setState(option) {
            var mainContents	= {};
            if (option.controller) {
                mainContents.controller	    = option.controller;
                mainContents.controllerAs	= (option.controllerAs) ? option.controllerAs : "contents";
            }
            if (option.templateUrl) {
                mainContents.templateUrl	= option.templateUrl;
            }

            var pageStage = option.pageStage ? option.pageStage : "comm";
            var mainBody = {
                templateUrl: CONSTANTS.mainBody.templateUrl + _VersionTail(),
                controller: CONSTANTS.mainBody.controller,
                controllerAs: CONSTANTS.mainBody.controllerAs,
                resolve: { pageStage: function () { return pageStage } }
            };
            if (option.mainBodyTemplateUrl) {
                mainBody.templateUrl = option.mainBodyTemplateUrl;
            }
            $stateProvider.state(option.stateKey, { url: option.url, views: { "mainBody" : mainBody } });
            return mainContents;
        }

        if (IAASSITEMAP.pages) {
            angular.forEach(IAASSITEMAP.pages, function(option, key) {
                if (!SITEMAP.pages[key])    SITEMAP.pages[key] = option;
            });
        }
        if (PAASSITEMAP.pages) {
            angular.forEach(PAASSITEMAP.pages, function(option, key) {
                if (!SITEMAP.pages[key])    SITEMAP.pages[key] = option;
            });
        }
        if (PERFSITEMAP.pages) {
            angular.forEach(PERFSITEMAP.pages, function(option, key) {
                if (!SITEMAP.pages[key])    SITEMAP.pages[key] = option;
            });
        }
/*
        if (MARKETSITEMAP.pages) {
            angular.forEach(MARKETSITEMAP.pages, function (option, key) {
                if (!SITEMAP.pages[key]) SITEMAP.pages[key] = option;
            });
        }
*/
/*
        if (MONITSITEMAP.pages) {
            angular.forEach(MONITSITEMAP.pages, function (option, key) {
                if (!SITEMAP.pages[key]) SITEMAP.pages[key] = option;
            });
        }
*/

        if (IAASSITEMAP.leftMenus) {
            angular.forEach(IAASSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }
        if (PAASSITEMAP.leftMenus) {
            angular.forEach(PAASSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }
        if (PERFSITEMAP.leftMenus) {
            angular.forEach(PERFSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }
/*
        if (MARKETSITEMAP.leftMenus) {
            angular.forEach(MARKETSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }
*/
/*
        if (MONITSITEMAP.leftMenus) {
            angular.forEach(MONITSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }
*/

        angular.forEach(SITEMAP.pages, function(option, key) {
            option.pageStage = (option.pageStage) ? option.pageStage : "comm";
            if (option.url && option.stateKey) {
                SITEMAP.pages[key].url = option.url;
                SITEMAP.pages[key].contentsView = setState(option);
            }
        });

        angular.forEach(SITEMAP.leftMenus, function(mainOption, mainKey) {
            mainOption.pageStage = (mainOption.pageStage) ? mainOption.pageStage : "comm";
            angular.forEach(mainOption.menus, function(option, key) {
                option.pageStage = (option.pageStage) ? option.pageStage : mainOption.pageStage;
                if (option.url && option.stateKey) {
                    SITEMAP.leftMenus[mainKey].menus[key].contentsView = setState(option);
                }
                angular.forEach(option.subPages, function(subPageOption, subPageKey) {
                    subPageOption.pageStage = (subPageOption.pageStage) ? subPageOption.pageStage : option.pageStage;
                    if (subPageOption.url && subPageOption.stateKey) {
                        SITEMAP.leftMenus[mainKey].menus[key].subPages[subPageKey].contentsView = setState(subPageOption);
                    }
                });
                angular.forEach(option.subMenus, function(subMenuOption, subMenuKey) {
                    subMenuOption.pageStage = (subMenuOption.pageStage) ? subMenuOption.pageStage : option.pageStage;
                    if (subMenuOption.url && subMenuOption.stateKey) {
                        SITEMAP.leftMenus[mainKey].menus[key].subMenus[subMenuKey].contentsView = setState(subMenuOption);
                    }
                    angular.forEach(subMenuOption.subPages, function(subPageOption, subPageKey) {
                        subPageOption.pageStage = (subPageOption.pageStage) ? subPageOption.pageStage : subMenuOption.pageStage;
                        if (subPageOption.url && subPageOption.stateKey) {
                            SITEMAP.leftMenus[mainKey].menus[key].subMenus[subMenuKey].subPages[subPageKey].contentsView = setState(subPageOption);
                        }
                    });
                });
            });
        });

        var pageStages = ['comm', 'iaas', 'paas', 'perf'/*, 'market', 'monit'*/];
        var translateFiles = [];

        translateFiles.push({
            prefix: 'js/locales/locale-',
            suffix: '.json' + _VERSION_TAIL_
        });
        translateFiles.push({
            prefix: 'js/locales/validation/',
            suffix: '.json' + _VERSION_TAIL_
        });

        for (var i=0; i<pageStages.length; i++) {
            translateFiles.push({
                prefix: pageStages[i] + '/js/locales/locale-menu-',
                suffix: '.json' + _VERSION_TAIL_
            });
            translateFiles.push({
                prefix: pageStages[i] + '/js/locales/locale-',
                suffix: '.json' + _VERSION_TAIL_
            });
            if (pageStages[i] == 'paas') {
                translateFiles.push({
                    prefix: 'paas/js/locales/cloudfoundry/',
                    suffix: '.json' + _VERSION_TAIL_
                });
            }
        }

        $translateProvider
            .useStaticFilesLoader({ files: translateFiles })
            .registerAvailableLanguageKeys(['en','ko'], {
                'en-*': 'en',
                'ko-*': 'ko'
            })
            // .determinePreferredLanguage()
            .fallbackLanguage('ko');
        $translateProvider.useSanitizeValueStrategy(null);
        $translateProvider.test = "test";

    }])
    /**
     * Config -------------------------------------------------------------------------
     */
    .config(['ADMdtpProvider', function(ADMdtpProvider) {
        ADMdtpProvider.setOptions({
                calType: 'gregorian',
                format: 'YYYY-MM-DD',
                autoClose:true,
                multiple: false,
                smartDisabling: false,
                dtpType: "date",
                watchingOptions: true,
                zIndex: 200,
               //default: 'today',
                gregorianDic: {
                    title: 'korean',
                    monthsNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                    daysNames: ['일', '월', '화', '수', '목', '금', '토'],
                    todayBtn: "오늘"
                }
            }
        );
    }])
    .config(['ChartJsProvider', function(ChartJsProvider) {
        // Configure all charts
        ChartJsProvider.setOptions({ colors: ['#97BBCD', '#DCDCDC', '#F7464A', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360'] });
        // Configure all doughnut charts
        ChartJsProvider.setOptions('doughnut', {
            cutoutPercentage: 60
        });
        ChartJsProvider.setOptions('bubble', {
            tooltips: { enabled: false }
        });
    }])
    /**
     * Run -------------------------------------------------------------------------
     */
    .run(function (common, $location, $translate, CONSTANTS) {

        _DebugConsoleLog("app run", 1);

        // 2020.3.5 by hrit, Org 공용계정 로그인용
        if ($location.search().orgAuthToken) common.setOrgAuthToken($location.search().orgAuthToken);
        
        /********** default start **********/
        var languageKey = common.getLanguageKey();
        languageKey = 'ko';
        if(languageKey == null || languageKey == '') {
            languageKey = $translate.proposedLanguage() || $translate.use();
            common.setLanguageKey(languageKey);
        }
        $translate.use(languageKey);
    })
;