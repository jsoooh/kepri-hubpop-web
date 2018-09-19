'use strict';

angular.module('app')
	.constant('PAASSITEMAP', {
		pages : {
        },
        leftMenus: {
            paasPotal: {
                pageStage : "paas",
                name : "paas_portal",
                notPAuth : "U",
                notEdPAuth : "UV",
                mainTop : true,
                orgNameView: true,
                menus : {
                    application: {
                        name: 'applications',
                        stateKey: 'paasApplications',
                        url: '/paas',
                        controller: 'paasApplicationsCtrl',
                        templateUrl: _PAAS_VIEWS_ + '/application/apps.html',
                    }, // application
                    applicationDetail: {
                        title: "<li>{{ main.detailOrgName }}</li><li>{{ main.spaceName }}</li><li>{{ main.applicationName }}</li>",
                        name: 'application_details',
                        stateKey: 'paasApplicationDetail',
                        menuDisplayNo : true,
                        url: '/paas/apps/:guid',
                        controller: 'paasApplicationDetailCtrl',
                        templateUrl: _PAAS_VIEWS_ + '/application/appDetail.html',
                        ngClick: "main.moveToAppPage('/paas/apps/' + main.stateParams.guid);",
                    },
                }, // menus
            }, // paasPotal
        } // leftMenus
    }) // PAASSITEMAP
;