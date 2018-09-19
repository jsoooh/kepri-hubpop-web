'use strict';

angular.module('app', [
        , 'common.controllers'
        , 'common.services'
        , 'portal.controllers'
        , 'portal.services'
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
	])
    .config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$translateProvider', 'CONSTANTS', 'SITEMAP', function ($httpProvider, $stateProvider, $urlRouterProvider, $translateProvider, CONSTANTS, SITEMAP) {

	    _DebugConsoleLog("portalApp.js : commonApp", 1);

        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.defaults.xsrfCookieName = _CSRF_TOKEN_COOKIE_NAME_;
        $httpProvider.defaults.xsrfHeaderName = _CSRF_TOKEN_HEADER_NAME_;
        //$httpProvider.interceptors.push('XSRFInterceptor');

        /*
         var initInjector = angular.injector(["ng"]);

         var $http = initInjector.get("$http");
         $http.defaults.useXDomain = true;
         $http.defaults.withCredentials = true;
         $http.defaults.xsrfCookieName = _CSRF_TOKEN_COOKIE_NAME_;
         $http.defaults.xsrfHeaderName = _CSRF_TOKEN_HEADER_NAME_;

         */
        delete $httpProvider.defaults.headers.common['X-Requested-With'];

	    $urlRouterProvider.otherwise('/');

        function setState(option) {
            var mainContents	= {};
            if (option.controller) {
                mainContents.controller	= option.controller;
                mainContents.controllerAs	= (option.controllerAs) ? option.controllerAs : "contents";
            }
            if (option.templateUrl) {
                mainContents.templateUrl	= option.templateUrl;
            }
            var mainBody = {
                templateUrl: CONSTANTS.mainBody.templateUrl + _VersionTail(),
                controller: CONSTANTS.mainBody.controller,
                controllerAs: CONSTANTS.mainBody.controllerAs
            };
            $stateProvider.state(option.stateKey, { url: option.url, views: { "mainBody" : mainBody } });
            return mainContents;
        }

        angular.forEach(SITEMAP.pages, function(option, key) {
            option.stateKey	= (option.stateKey) ? option.stateKey : key;
            SITEMAP.pages[key].url	= option.url;
            SITEMAP.pages[key].contentsView = setState(option);
        });

        angular.forEach(SITEMAP.leftMenus, function(mainOption, mainKey) {
            angular.forEach(mainOption.menus, function(option, key) {
                if (!option.ngClick) {
                    option.stateKey	= (option.stateKey) ? option.stateKey : mainKey + key[0].toUpperCase() + key.substr(1);
                    if (option.url) {
                        SITEMAP.leftMenus[mainKey].menus[key].contentsView = setState(option);
                    }
                    angular.forEach(option.subPages, function(subPageOption, subPageKey) {
                        subPageOption.stateKey	= (subPageOption.stateKey) ? subPageOption.stateKey : option.stateKey + subKey[0].toUpperCase() + subKey.substr(1);
                        SITEMAP.leftMenus[mainKey].menus[key].subPages[subPageKey].contentsView = setState(subPageOption);
                    });
                    angular.forEach(option.subMenus, function(subMenuOption, subMenuKey) {
                        subMenuOption.stateKey	= (subMenuOption.stateKey) ? subMenuOption.stateKey : subMenuOption.stateKey + subKey[0].toUpperCase() + subKey.substr(1);
                        SITEMAP.leftMenus[mainKey].menus[key].subMenus[subMenuKey].contentsView = setState(subMenuOption);
                        angular.forEach(subMenuOption.subPages, function(subPageOption, subPageKey) {
                            subPageOption.stateKey	= (subPageOption.stateKey) ? subPageOption.stateKey : subMenuOption.stateKey + subKey[0].toUpperCase() + subKey.substr(1);
                            SITEMAP.leftMenus[mainKey].menus[key].subMenus[subMenuKey].subPages[subPageKey].contentsView = setState(subPageOption);
                        });
                    });
                }
            });
        });

        $translateProvider
            .useStaticFilesLoader({files : [
                {
                    prefix: 'js/locales/locale-menu-',
                    suffix: '.json' + _VERSION_TAIL_
                },
                {
                    prefix: 'js/locales/locale-',
                    suffix: '.json' + _VERSION_TAIL_
                },
            ]})
            .registerAvailableLanguageKeys(['ko','en'], {
                'ko-*': 'ko',
                'en-*': 'en'
            })
            .determinePreferredLanguage()
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
                //default: 'today',
            }
        );
    }])
    .config(function($httpProvider) {
        $httpProvider.interceptors.push('HttpInterceptor');
    })
    /**
     * Run -------------------------------------------------------------------------
     */
    .run(function (common, $translate, CONSTANTS) {

        _DebugConsoleLog("app run", 1);
        /********** default start **********/


        var languageKey = common.getLanguageKey();
        if(languageKey == null || languageKey == '') {
            languageKey = $translate.proposedLanguage() || $translate.use();
            common.setLanguageKey(languageKey);
        }
        $translate.use(languageKey);
    })
;