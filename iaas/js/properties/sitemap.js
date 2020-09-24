'use strict';

angular.module('app')
    .constant('IAASSITEMAP', {
        pages : {
        },
        leftMenus: {
            iaasPotal: {
                pageStage : "iaas",
                name: "iaas_portal",
                notPAuth: "UV",
                notEdPAuth: "UV",
                mainTop: true,
                menus: {
                    serverMain: {
                        name: "server_main",
                        icon: "serverMain",
                        stateKey: 'iaasCompute',
                        url: '/iaas/compute',
                        controller: 'iaasComputeCtrl',
                        templateUrl: _IAAS_VIEWS_+'/compute/compute.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [],
                            loadMyControllers: [_IAAS_JS_+'/controllers/compute/computeControllers.js',
                                                _IAAS_JS_+'/controllers/compute/computeDetailControllers.js',
                                                _IAAS_JS_+'/controllers/loadbalancer/loadbalancerDetailControllers.js'],
                            loadMyDirectives: []
                        },
                        subPages: {	// 메뉴에서는 상세 페이지로 표현
                            serverDetail: {
                                name: 'server_main',
                                stateKey: 'iaasComputeDetail',
                                url: '/iaas/compute/detail/:instanceId',
                                controller: 'iaasComputeDetailCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/computeDetail.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_IAAS_JS_+'/services/computeDetailServices.js'],
                                    loadMyControllers: [],
                                    loadMyDirectives: []
                                }
                            },
                            serverCreate: {
                                name: 'server_main',
                                stateKey: 'iaasComputeCreate',
                                url: '/iaas/compute/create',
                                controller: 'iaasComputeCreateCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/computeCreateForm.html'
                            },
                            serverCopy: {
                                name: 'server_main',
                                stateKey: 'iaasComputeCopy',
                                url: '/iaas/compute/copy',
                                controller: 'iaasComputeCopyCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/computeCopyList.html'
                            },
                            serverAlarm: {
                                name: 'server_main',
                                stateKey: 'iaasComputeAlarm',
                                url: '/iaas/compute/alarm',
                                controller: 'iaasComputeAlarmCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/computeAlarm.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_IAAS_JS_+'/services/computeDetailServices.js'],
                                    loadMyControllers: [],
                                    loadMyDirectives: []
                                }
                            },
                            lbCreate: {
                                name: 'loadbalancer_main',
                                stateKey: 'iaasLoadbalancerCreate',
                                url: '/iaas/loadbalancer/create',
                                controller: 'iaasLoadbalancerCreateCtrl',
                                templateUrl: _IAAS_VIEWS_+'/loadbalancer/loadbalancerCreateForm.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [],
                                    loadMyControllers: [_IAAS_JS_+'/controllers/loadbalancer/loadbalancerControllers.js'],
                                    loadMyDirectives: []
                                }
                            },
                            lbDetail: {
                                name: 'loadbalancer_main',
                                stateKey: 'iaasLoadbalancerDetail',
                                url: '/iaas/loadbalancer/detail/:lbInfoId',
                                controller: 'iaasLoadbalancerDetailCtrl',
                                templateUrl: _IAAS_VIEWS_+'/loadbalancer/loadbalancerDetail.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_IAAS_JS_+'/services/computeDetailServices.js'],
                                    loadMyControllers: [_IAAS_JS_+'/controllers/loadbalancer/loadbalancerDetailControllers.js'],
                                    loadMyDirectives: []
                                }
                            }
                        }
                    },
                    storageMain: {
                        name: "storage_main",
                        icon: "storageMain",
                        stateKey: 'iaasStorageMain',
                        url: '/iaas/storage',
                        controller: 'iaasStorageCtrl',
                        templateUrl: _IAAS_VIEWS_+'/storage/storage.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [],
                            loadMyControllers: [_IAAS_JS_+'/controllers/storage/storageControllers.js'],
                            loadMyDirectives: []
                        }
                    },
                    storageCreate: {
                        name: 'storage_create',
                        stateKey: 'iaasStorgeCreate',
                        url: '/iaas/storage/create',
                        controller: 'iaasStorageFormCtrl',
                        templateUrl: _IAAS_VIEWS_+'/storage/storageForm.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [],
                            loadMyControllers: [_IAAS_JS_+'/controllers/storage/storageControllers.js'],
                            loadMyDirectives: []
                        }
                    },
                    object_storage: {
                        name: "object_storage",
                        icon: "object_storage",
                        stateKey: 'iaasObjectStorage',
                        url: '/iaas/storage/object',
                        controller: 'iaasObjectStorageCtrl',
                        templateUrl: _IAAS_VIEWS_+'/storage/objectStorage.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [],
                            loadMyControllers: [_IAAS_JS_+'/controllers/storage/objectStorageControllers.js'],
                            loadMyDirectives: []
                        }
                    },
                    server_snapshot: {
                        name: "server_snapshot",
                        icon: "server_snapshot",
                        stateKey: 'iaasServiceSnapshot',
                        url: '/iaas/snapshot',
                        controller: 'iaasServerSnapshotCtrl',
                        templateUrl: _IAAS_VIEWS_+'/compute/serverSnapshot.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [],
                            loadMyControllers: [_IAAS_JS_+'/controllers/compute/computeSnapshotControllers.js'],
                            loadMyDirectives: []
                        },
                        subPages: {
                            instanceSnapshotCreate: {
                                name: 'server_snapshot_create',
                                stateKey: 'iaasServerSnapshotCreate',
                                url: '/iaas/snapshot/serverCreate/:snapshotId/:tenantId',
                                controller: 'iaasServerSnapshotCreateCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/serverSnapshotCreate.html'
                            },
                            storageSnapshotCreate: {
                                name: 'storage_snapshot_create',
                                stateKey: 'iaasStorageSnapshotCreate',
                                url: '/iaas/snapshot/storageCreate/:snapshotId',
                                controller: 'iaasStorageSnapshotCreateCtrl',
                                templateUrl: _IAAS_VIEWS_+'/storage/storageSnapshotCreate.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [],
                                    loadMyControllers: [_IAAS_JS_+'/controllers/storage/storageSnapshotControllers.js'],
                                    loadMyDirectives: []
                                }
                            }
                        }
                    }
                }
            }
        }
    });
