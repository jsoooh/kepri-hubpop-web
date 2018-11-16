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
                        subPages: {
                            applicationDetail: {
                                name: 'application_details',
                                stateKey: 'paasApplicationDetail',
                                url: '/paas/apps/:guid',
                                controller: 'paasApplicationDetailCtrl',
                                templateUrl: _PAAS_VIEWS_ + '/application/appDetail.html',
                                ngClick: "main.moveToAppPage('/paas/apps/' + main.stateParams.guid);",
                            },
                            applicationPush: {
                                name: 'applications_create',
                                stateKey: 'paasApplicationPush',
                                url: '/paas/appsPush',
                                controller: 'paasApplicationPushCtrl',
                                templateUrl: _PAAS_VIEWS_+'/application/applicationPush.html',
                            },
                            serviceInstanceCreate: {
                                name: 'service_instance_create',
                                stateKey: 'paasServiceInstanceCreate',
                                url: '/paas/serviceInstanceCreate',
                                controller: 'paasServiceInstanceCreateCtrl',
                                templateUrl: _PAAS_VIEWS_+'/application/serviceInstanceCreate.html',
                            }
                        }
                    }, // application
                }, // menus
            }, // paasPotal
        } // leftMenus
    }) // PAASSITEMAP
;