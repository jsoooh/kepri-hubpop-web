'use strict';

angular.module('app')
	.constant('PERFSITEMAP', {
		pages : {
        },
        leftMenus: {
            perfPotal: {
                pageStage : "perf",
                name : "perf_portal",
                notPAuth : "U",
                notEdPAuth : "UV",
                mainTop : true,
                orgNameView: true,
                loadMyFile: {
                    loadMyScripts: [],
                    loadMyServices: [_PERF_JS_+'/services/perfCommonService.js'],
                    loadMyControllers: [],
                    loadMyDirectives: [],
                },
                menus : {
                    perfDashboard: {
                        name: 'perf_dashboard',
                        stateKey: 'perfDashboard',
                        url: '/perf/dashboard',
                        controller: 'perfDashboardCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfDashboard.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_PERF_JS_+'/services/perfAnlsServices.js', _PERF_JS_+'/services/perfMeteringServices.js'],
                            loadMyControllers: [_PERF_JS_+'/controllers/perfDashboardControllers.js'],
                            loadMyDirectives: [],
                        },
                    },
                    perfAnls: {
                        name: 'perf_anls',
                        stateKey: 'perfAnls',
                        url: '/perf/perfAnls',
                        controller: 'perfAnlsCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfAnls.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_PERF_JS_+'/services/perfAnlsServices.js', _PERF_JS_+'/services/perfMeteringServices.js'],
                            loadMyControllers: [_PERF_JS_+'/controllers/perfAnlsControllers.js'],
                            loadMyDirectives: [],
                        },
                    },
                    perfMonthlyMetering: {
                        name: 'perf_monthly_metering',
                        stateKey: 'perfMonthlyMetering',
                        url: '/perf/perfMonthlyMetering',
                        controller: 'perfMonthlyMeteringCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfMonthlyMetering.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_PERF_JS_+'/services/perfMeteringServices.js'],
                            loadMyControllers: [_PERF_JS_+'/controllers/perfMeteringControllers.js'],
                            loadMyDirectives: [],
                        },
                    },
                    perfItemsMetering: {
                        name: 'perf_items_metering',
                        stateKey: 'perfItemsMetering',
                        url: '/perf/perfItemsMetering',
                        controller: 'perfItemsMeteringCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfItemsMetering.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_PERF_JS_+'/services/perfMeteringServices.js'],
                            loadMyControllers: [_PERF_JS_+'/controllers/perfMeteringControllers.js'],
                            loadMyDirectives: [],
                        },
                    },
                    perfRefAmt: {
                        name: 'perf_ref_amt',
                        stateKey: 'perfRefAmt',
                        url: '/perf/perfRefAmt',
                        controller: 'perfRefAmtCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfRefAmt.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_PERF_JS_+'/services/perfMeteringServices.js', _PERF_JS_+'/services/perfRefAmtServices.js'],
                            loadMyControllers: [_PERF_JS_+'/controllers/perfRefAmtControllers.js'],
                            loadMyDirectives: [],
                        },
                    }
                }
            }
        }
    })
;