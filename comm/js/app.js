'use strict';

angular.module('app', [
          'common.controllers'
        , 'common.services'
        , 'portal.controllers'
        , 'portal.services'
        //, 'product.controllers'
        //, 'product.services'
        , 'iaas.controllers'
        , 'iaas.services'
        , 'gpu.controllers'
        , 'gpu.services'
        , 'paas.controllers'
        , 'paas.services'
        , 'perf.controllers'
        , 'perf.services'
        // , 'market.controllers'
        // , 'market.services'
        //, 'monit.controllers'
        //, 'monit.services'
        , 'ngRoute'
        , 'oc.lazyLoad'
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
    .config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider', '$translateProvider', 'CONSTANTS', 'LOADFILES', 'SITEMAP', 'IAASSITEMAP', 'GPUSITEMAP', 'PAASSITEMAP', 'PERFSITEMAP'/*, 'MARKETSITEMAP', 'MONITSITEMAP'*/,
        function ($httpProvider, $stateProvider, $urlRouterProvider, $ocLazyLoadProvider, $translateProvider, CONSTANTS, LOADFILES, SITEMAP, IAASSITEMAP, GPUSITEMAP, PAASSITEMAP, PERFSITEMAP/*, MARKETSITEMAP, MONITSITEMAP*/) {

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

        var loadModuleNames = [];
        var modules = angular.copy(LOADFILES.modules);

        if (angular.isArray(LOADFILES.scriptFiles) && LOADFILES.scriptFiles.length > 0) {
            angular.forEach(LOADFILES.scriptFiles, function (scriptFile, key) {
                if (angular.isArray(scriptFile.files) && scriptFile.files.length > 0) {
                    angular.forEach(scriptFile.files, function (file, k) {
                        scriptFile.files[k] = file + _VERSION_TAIL_HEAD_;
                        scriptFile.cache = true;
                    });
                }
            });
        }

        if (angular.isArray(LOADFILES.customModules) && LOADFILES.customModules.length > 0) {
            angular.forEach(LOADFILES.customModules, function (customModule, key) {
                if (angular.isArray(customModule.files) && customModule.files.length > 0) {
                    angular.forEach(customModule.files, function (file, k) {
                        customModule.files[k] = file + _VERSION_TAIL_HEAD_;
                        customModule.cache = true;
                    });
                }
                modules.push(customModule);
            });
        }

        if (angular.isArray(modules) && modules.length > 0) {
            angular.forEach(modules, function (loadModule, key) {
                loadModuleNames.push(loadModule.name);
            });
        }


        $ocLazyLoadProvider.config({
            debug: (_MODE_ == "DEBUG") ? true : false,
            events: true,
            // 로드 할 모듈 정의
            modules: modules
        });

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
                resolve: {
                    pageStage: function () {
                        return pageStage
                    }
                }
            };

            if (angular.isObject(option.loadMyFile)) {
                if (angular.isArray(option.loadMyFile.loadMyScripts)) {
                    var loadMyFiles = [];
                    angular.forEach(option.loadMyFile.loadMyScripts, function (name, key) {
                        if (angular.isArray(LOADFILES.scriptFiles[name])) {
                            loadMyFiles.push(LOADFILES.scriptFiles[name]);
                        } else {
                            loadMyFiles.push(name);
                        }
                    });
                    mainBody.resolve.loadMyFile = ['$ocLazyLoad', function($ocLazyLoad) {
                        return $ocLazyLoad.load({files: loadMyFiles, cache: true});
                    }];
                }
                var pageStateName = "common";
                if (pageStage == "iaas" || pageStage == "paas" || pageStage == "gpu" || pageStage == "perf") {
                    pageStateName = pageStage;
                } else if (pageStage == "comm") {
                    pageStateName = "portal";
                }

                if (angular.isArray(option.loadMyFile.loadMyServices)) {
                    mainBody.resolve.loadMyService = ['$ocLazyLoad', function($ocLazyLoad) {
                        return $ocLazyLoad.load({name: pageStateName + '.services', files: option.loadMyFile.loadMyServices, cache: true});
                    }]
                }

                if (angular.isArray(option.loadMyFile.loadMyControllers)) {
                    mainBody.resolve.loadMyCtrl = ['$ocLazyLoad', function($ocLazyLoad) {
                        return $ocLazyLoad.load({name: pageStateName + '.controllers', files: option.loadMyFile.loadMyControllers, cache: true});
                    }]
                }

                if (angular.isArray(option.loadMyFile.loadMyDirectives)) {
                    mainBody.resolve.loadMyDirective = ['$ocLazyLoad', function($ocLazyLoad) {
                        var providerFiles = [];
                        angular.forEach(option.loadMyFile.loadMyDirectives, function (name, key) {
                            var moduleConfig = null;
                            if (angular.isString(name)) {
                                moduleConfig = $ocLazyLoad.getModuleConfig(name);
                                if (!moduleConfig || !moduleConfig.name) {
                                    moduleConfig = $ocLazyLoad.getModuleConfig('app');
                                    if (!moduleConfig || !moduleConfig.name) {
                                        moduleConfig = {name: 'app', files: [name]}
                                    } else {
                                        if (moduleConfig.files.indexOf(name) == -1) {
                                            moduleConfig.files.push(name);
                                        }
                                    }
                                    $ocLazyLoad.setModuleConfig(moduleConfig);
                                    option.loadMyFile.loadMyDirectives[key] = moduleConfig.name
                                }
                            } else if (angular.isObject(name)) {
                                moduleConfig = angular.copy(name);
                                if (!$ocLazyLoad.getModuleConfig(moduleConfig.name)) {
                                    $ocLazyLoad.setModuleConfig(moduleConfig);
                                    option.loadMyFile.loadMyDirectives[key] = moduleConfig.name
                                }
                            }
                            if (moduleConfig && moduleConfig.provider) {
                                providerFiles.push(moduleConfig.provider);
                            }
                        });
                        return $ocLazyLoad.load(option.loadMyFile.loadMyDirectives)
                        .then(function() {
                            if (providerFiles.length > 0) {
                                $ocLazyLoad.load({name: 'app', files: providerFiles}).then(function() {
                                });
                            }
                        });
                    }]
                }
            }

            if (option.mainBodyTemplateUrl) {
                mainBody.templateUrl = option.mainBodyTemplateUrl;
            }

            var views = { "mainBody" : mainBody };

            $stateProvider.state(option.stateKey, { url: option.url, views: views } );
            return mainContents;
        }

        function setParentMergeMyFiles (parentFiles, childrenFiles) {
            var loadMyFiles = [];
            if (angular.isArray(parentFiles)) {
                loadMyFiles = angular.copy(parentFiles);
            }
            if (angular.isArray(childrenFiles)) {
                angular.forEach(childrenFiles, function(loadFile, key) {
                    if (angular.isString(loadFile)) {
                        if (loadModuleNames.indexOf(loadFile) == -1) {
                            loadMyFiles.push(loadFile + _VERSION_TAIL_);
                        } else {
                            loadMyFiles.push(loadFile);
                        }
                    } else if (angular.isObject(loadFile) && angular.isArray(loadFile.files)) {
                        if (loadFile.files.length > 0) {
                            angular.forEach(loadFile.files, function (file, k) {
                                loadFile.files[k] = file + _VERSION_TAIL_;
                            });
                        }
                        loadMyFiles.push(loadFile);
                    }
                });
            }
            return loadMyFiles;
        }

        if (IAASSITEMAP.pages) {
            angular.forEach(IAASSITEMAP.pages, function(option, key) {
                if (!SITEMAP.pages[key])    SITEMAP.pages[key] = option;
            });
        }
        if (GPUSITEMAP.pages) {
            angular.forEach(GPUSITEMAP.pages, function(option, key) {
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
        /*if (MARKETSITEMAP.pages) {
            angular.forEach(MARKETSITEMAP.pages, function (option, key) {
                if (!SITEMAP.pages[key]) SITEMAP.pages[key] = option;
            });
        }
        if (MONITSITEMAP.pages) {
            angular.forEach(MONITSITEMAP.pages, function (option, key) {
                if (!SITEMAP.pages[key]) SITEMAP.pages[key] = option;
            });
        }*/

        if (IAASSITEMAP.leftMenus) {
            angular.forEach(IAASSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }
        if (GPUSITEMAP.leftMenus) {
            angular.forEach(GPUSITEMAP.leftMenus, function (option, key) {
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
        /*if (MARKETSITEMAP.leftMenus) {
            angular.forEach(MARKETSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }
        if (MONITSITEMAP.leftMenus) {
            angular.forEach(MONITSITEMAP.leftMenus, function (option, key) {
                if (!SITEMAP.leftMenus[key]) SITEMAP.leftMenus[key] = option;
            });
        }*/

        angular.forEach(SITEMAP.pages, function(option, key) {
            option.pageStage = (option.pageStage) ? option.pageStage : "comm";
            if (option.url && option.stateKey) {
                SITEMAP.pages[key].url = option.url;
                SITEMAP.pages[key].contentsView = setState(option);
            }
        });

        angular.forEach(SITEMAP.leftMenus, function(mainOption, mainKey) {
            mainOption.pageStage = (mainOption.pageStage) ? mainOption.pageStage : "comm";
            if(!angular.isObject(mainOption.loadMyFile)) mainOption.loadMyFile = {};
            mainOption.loadMyFile.loadMyFiles = setParentMergeMyFiles([], mainOption.loadMyFile.loadMyFiles);
            mainOption.loadMyFile.loadMyServices = setParentMergeMyFiles([], mainOption.loadMyFile.loadMyServices);
            mainOption.loadMyFile.loadMyControllers = setParentMergeMyFiles([], mainOption.loadMyFile.loadMyControllers);
            mainOption.loadMyFile.loadMyDirectives = setParentMergeMyFiles([], mainOption.loadMyFile.loadMyDirectives);
            angular.forEach(mainOption.menus, function(option, key) {
                option.pageStage = (option.pageStage) ? option.pageStage : mainOption.pageStage;
                if(!angular.isObject(option.loadMyFile)) option.loadMyFile = {};
                option.loadMyFile.loadMyFiles = setParentMergeMyFiles(mainOption.loadMyFile.loadMyFiles, option.loadMyFile.loadMyFiles);
                option.loadMyFile.loadMyServices = setParentMergeMyFiles(mainOption.loadMyFile.loadMyServices, option.loadMyFile.loadMyServices);
                option.loadMyFile.loadMyControllers = setParentMergeMyFiles(mainOption.loadMyFile.loadMyControllers, option.loadMyFile.loadMyControllers);
                option.loadMyFile.loadMyDirectives = setParentMergeMyFiles(mainOption.loadMyFile.loadMyDirectives, option.loadMyFile.loadMyDirectives);
                if (option.url && option.stateKey) {
                    SITEMAP.leftMenus[mainKey].menus[key].contentsView = setState(option);
                }
                angular.forEach(option.subPages, function(subPageOption, subPageKey) {
                    subPageOption.pageStage = (subPageOption.pageStage) ? subPageOption.pageStage : option.pageStage;
                    if(!angular.isObject(option.loadMyFile)) option.loadMyFile = {};
                    if(!angular.isObject(subPageOption.loadMyFile)) subPageOption.loadMyFile = {};
                    subPageOption.loadMyFile.loadMyFiles = setParentMergeMyFiles(option.loadMyFile.loadMyFiles, subPageOption.loadMyFile.loadMyFiles);
                    subPageOption.loadMyFile.loadMyServices = setParentMergeMyFiles(option.loadMyFile.loadMyServices, subPageOption.loadMyFile.loadMyServices);
                    subPageOption.loadMyFile.loadMyControllers = setParentMergeMyFiles(option.loadMyFile.loadMyControllers, subPageOption.loadMyFile.loadMyControllers);
                    subPageOption.loadMyFile.loadMyDirectives = setParentMergeMyFiles(option.loadMyFile.loadMyDirectives, subPageOption.loadMyFile.loadMyDirectives);
                    if (subPageOption.url && subPageOption.stateKey) {
                        SITEMAP.leftMenus[mainKey].menus[key].subPages[subPageKey].contentsView = setState(subPageOption);
                    }
                });
                angular.forEach(option.subMenus, function(subMenuOption, subMenuKey) {
                    subMenuOption.pageStage = (subMenuOption.pageStage) ? subMenuOption.pageStage : option.pageStage;
                    if(!angular.isObject(option.loadMyFile)) option.loadMyFile = {};
                    if(!angular.isObject(subMenuOption.loadMyFile)) subMenuOption.loadMyFile = {};
                    subMenuOption.loadMyFile.loadMyFiles = setParentMergeMyFiles(option.loadMyFile.loadMyFiles, subMenuOption.loadMyFile.loadMyFiles);
                    subMenuOption.loadMyFile.loadMyServices = setParentMergeMyFiles(option.loadMyFile.loadMyServices, subMenuOption.loadMyFile.loadMyServices);
                    subMenuOption.loadMyFile.loadMyControllers = setParentMergeMyFiles(option.loadMyFile.loadMyControllers, subMenuOption.loadMyFile.loadMyControllers);
                    subMenuOption.loadMyFile.loadMyDirectives = setParentMergeMyFiles(option.loadMyFile.loadMyDirectives, subMenuOption.loadMyFile.loadMyDirectives);
                    if (subMenuOption.url && subMenuOption.stateKey) {
                        SITEMAP.leftMenus[mainKey].menus[key].subMenus[subMenuKey].contentsView = setState(subMenuOption);
                    }
                    angular.forEach(subMenuOption.subPages, function(subPageOption, subPageKey) {
                        subPageOption.pageStage = (subPageOption.pageStage) ? subPageOption.pageStage : subMenuOption.pageStage;
                        if(!angular.isObject(subPageOption.loadMyFile)) subPageOption.loadMyFile = {};
                        subPageOption.loadMyFile.loadMyFiles = setParentMergeMyFiles(subMenuOption.loadMyFile.loadMyFiles, subPageOption.loadMyFile.loadMyFiles);
                        subPageOption.loadMyFile.loadMyServices = setParentMergeMyFiles(subMenuOption.loadMyFile.loadMyServices, subPageOption.loadMyFile.loadMyServices);
                        subPageOption.loadMyFile.loadMyControllers = setParentMergeMyFiles(subMenuOption.loadMyFile.loadMyControllers, subPageOption.loadMyFile.loadMyControllers);
                        subPageOption.loadMyFile.loadMyDirectives = setParentMergeMyFiles(subMenuOption.loadMyFile.loadMyDirectives, subPageOption.loadMyFile.loadMyDirectives);
                        if (subPageOption.url && subPageOption.stateKey) {
                            SITEMAP.leftMenus[mainKey].menus[key].subMenus[subMenuKey].subPages[subPageKey].contentsView = setState(subPageOption);
                        }
                    });
                });
            });
        });

        var pageStages = ['comm', 'iaas', 'gpu', 'paas', 'perf'/*, 'market', 'monit'*/];
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