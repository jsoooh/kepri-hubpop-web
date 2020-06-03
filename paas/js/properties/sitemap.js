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
                        url: '/paas/apps',
                        controller: 'paasApplicationsCtrl',
                        templateUrl: _PAAS_VIEWS_ + '/application/apps.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_PAAS_JS_+'/services/applicationServices.js'],
                            loadMyControllers: [],
                            loadMyDirectives: [],
                        },
                        subPages: {
                            applicationPush: {
                                name: 'applications',
                                stateKey: 'paasApplicationPush',
                                url: '/paas/appsPush',
                                controller: 'paasApplicationPushCtrl',
                                templateUrl: _PAAS_VIEWS_+'/application/applicationPush.html'
                            },
                            applicationDetail: {
                                name: 'applications',
                                stateKey: 'paasApplicationDetail',
                                url: '/paas/apps/:guid',
                                controller: 'paasApplicationDetailCtrl',
                                templateUrl: _PAAS_VIEWS_ + '/application/appDetail.html'
                            }
                        }
                    }, // services
                    service: {
                        name: 'service_instances',
                        stateKey: 'paasServiceInstances',
                        url: '/paas/serviceInstances',
                        controller: 'paasServiceInstancesCtrl',
                        templateUrl: _PAAS_VIEWS_ + '/serviceInstance/serviceInstances.html',
                        subPages: {
                            serviceInstanceCreate: {
                                name: 'service_instance_create',
                                stateKey: 'paasServiceInstanceCreate',
                                url: '/paas/serviceInstanceCreate',
                                controller: 'paasServiceInstanceCreateCtrl',
                                templateUrl: _PAAS_VIEWS_+'/serviceInstance/serviceInstanceCreate.html'
                            }
                        }
                    } // application
                } // menus
            } // paasPotal
        } // leftMenus
    }) // PAASSITEMAP
;