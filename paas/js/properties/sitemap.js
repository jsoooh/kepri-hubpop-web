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
                            loadMyServices: [_PAAS_JS_+'/services/cloudFoundryServices.js',
                                             _PAAS_JS_+'/services/applicationServices.js'],
                            loadMyControllers: [_PAAS_JS_+'/controllers/applicationControllers.js'],
                            loadMyDirectives: [],
                        },
                        subPages: {
                            applicationPush: {
                                name: 'applications',
                                stateKey: 'paasApplicationPush',
                                url: '/paas/appsPush',
                                controller: 'paasApplicationPushCtrl',
                                templateUrl: _PAAS_VIEWS_+'/application/applicationPush.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_PAAS_JS_+'/services/cloudFoundryServices.js',
                                                     _PAAS_JS_+'/services/applicationServices.js',
                                                     _PAAS_JS_+'/services/routeServices.js'],
                                    loadMyControllers: [],
                                    loadMyDirectives: [],
                                },
                            },
                            applicationDetail: {
                                name: 'applications',
                                stateKey: 'paasApplicationDetail',
                                url: '/paas/apps/:guid',
                                controller: 'paasApplicationDetailCtrl',
                                templateUrl: _PAAS_VIEWS_ + '/application/appDetail.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_PAAS_JS_+'/services/applicationServices.js'],
                                    loadMyControllers: [],
                                    loadMyDirectives: [],
                                },
                            }
                        }
                    }, // services
                    service: {
                        name: 'service_instances',
                        stateKey: 'paasServiceInstances',
                        url: '/paas/serviceInstances',
                        controller: 'paasServiceInstancesCtrl',
                        templateUrl: _PAAS_VIEWS_ + '/serviceInstance/serviceInstances.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_PAAS_JS_+'/services/cloudFoundryServices.js',
                                             _PAAS_JS_+'/services/serviceInstanceServices.js'],
                            loadMyControllers: [_PAAS_JS_+'/controllers/serviceInstanceControllers.js'],
                            loadMyDirectives: [],
                        },
                        subPages: {
                            serviceInstanceCreate: {
                                name: 'service_instance_create',
                                stateKey: 'paasServiceInstanceCreate',
                                url: '/paas/serviceInstanceCreate',
                                controller: 'paasServiceInstanceCreateCtrl',
                                templateUrl: _PAAS_VIEWS_+'/serviceInstance/serviceInstanceCreate.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_PAAS_JS_+'/services/serviceInstanceServices.js'],
                                    loadMyControllers: [],
                                    loadMyDirectives: [],
                                },
                            }
                        }
                    } // application
                } // menus
            } // paasPotal
        } // leftMenus
    }) // PAASSITEMAP
;