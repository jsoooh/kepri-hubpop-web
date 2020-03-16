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
                menus : {
                    perfDashboard: {
                        name: 'perf_dashboard',
                        stateKey: 'perfDashboard',
                        url: '/perf/dashboard',
                        controller: 'perfDashboardCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfDashboard.html',
                    },
                    perfAnls: {
                        name: 'perf_anls',
                        stateKey: 'perfAnls',
                        url: '/perf/perfAnls',
                        controller: 'perfAnlsCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfAnls.html',
                    },
                    perfMonthlyMetering: {
                        name: 'perf_monthly_metering',
                        stateKey: 'perfMonthlyMetering',
                        url: '/perf/perfMonthlyMetering',
                        controller: 'perfMonthlyMeteringCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfMonthlyMetering.html',
                    },
                    perfItemsMetering: {
                        name: 'perf_items_metering',
                        stateKey: 'perfItemsMetering',
                        url: '/perf/perfItemsMetering',
                        controller: 'perfItemsMeteringCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfItemsMetering.html',
                    },
                    perfRefAmt: {
                        name: 'perf_ref_amt',
                        stateKey: 'perfRefAmt',
                        url: '/perf/perfRefAmt',
                        controller: 'perfRefAmtCtrl',
                        templateUrl: _PERF_VIEWS_ + '/perfRefAmt.html',
                    }
                }
            }
        }
    })
;