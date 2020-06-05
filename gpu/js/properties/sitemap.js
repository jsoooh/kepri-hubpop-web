'use strict';

angular.module('app')
	.constant('GPUSITEMAP', {
		pages : {
        },
        leftMenus: {
            gpuPotal: {
                pageStage : "gpu",
                name: "gpu_portal",
                notPAuth: "UV",
                notEdPAuth: "UV",
                mainTop: true,
                menus: {
                    serverMain: {
                        name: "server_main",
                        icon: "serverMain",
                        stateKey: 'gpuCompute',
                        url: '/gpu/compute',
                        controller: 'gpuComputeCtrl',
                        templateUrl: _GPU_VIEWS_+'/compute/compute.html',
                        subPages: {	// 메뉴에서는 상세 페이지로 표현
                            serverDetail: {
                                name: 'server_main',
                                stateKey: 'gpuComputeDetail',
                                url: '/gpu/compute/detail/:instanceId',
                                controller: 'gpuComputeDetailCtrl',
                                templateUrl: _GPU_VIEWS_+'/compute/computeDetail.html'
                            },
                            serverCreate: {
                                name: 'server_main',
                                stateKey: 'gpuComputeCreate',
                                url: '/gpu/compute/create',
                                controller: 'gpuComputeCreateCtrl',
                                templateUrl: _GPU_VIEWS_+'/compute/computeCreateForm.html'
                            },
                            serverCopy: {
                                name: 'server_main',
                                stateKey: 'gpuComputeCopy',
                                url: '/gpu/compute/copy',
                                controller: 'gpuComputeCopyCtrl',
                                templateUrl: _GPU_VIEWS_+'/compute/computeCopyList.html'
                            },
                            serverAlarm: {
                                name: 'server_main',
                                stateKey: 'gpuComputeAlarm',
                                url: '/gpu/compute/alarm',
                                controller: 'gpuComputeAlarmCtrl',
                                templateUrl: _GPU_VIEWS_+'/compute/computeAlarm.html'
                            },
                            lbCreate: {
                                name: 'loadbalancer_main',
                                stateKey: 'gpuLoadbalancerCreate',
                                url: '/gpu/loadbalancer/create',
                                controller: 'gpuLoadbalancerCreateCtrl',
                                templateUrl: _GPU_VIEWS_+'/loadbalancer/loadbalancerCreateForm.html'
                            },
                            lbDetail: {
                                name: 'loadbalancer_main',
                                stateKey: 'gpuLoadbalancerDetail',
                                url: '/gpu/loadbalancer/detail/:lbInfoId',
                                controller: 'gpuLoadbalancerDetailCtrl',
                                templateUrl: _GPU_VIEWS_+'/loadbalancer/loadbalancerDetail.html'
                            }
                        }
                    },
                    vmCatalog: {
                        name: "vm_catalog",
                        icon: "vmCatalog",
                        stateKey: 'gpuVmCatalog',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_GPU_JS_+'/services/vmCatalogServices.js'],
                            loadMyControllers: [],
                            loadMyDirectives: [],
                        },
                        subMenus: {
                            vmCatalog: {
                                name: "vm_catalog_list",
                                icon: "vmCatalog",
                                stateKey: 'gpuVmCatalogList',
                                url: '/gpu/vmCatalog/list',
                                controller: 'gpuVmCatalogListCtrl',
                                templateUrl: _GPU_VIEWS_+'/vmCatalog/vmCatalogList.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [],
                                    loadMyControllers: [_GPU_JS_+'/controllers/vmCatalog/vmCatalogControllers.js'],
                                    loadMyDirectives: [],
                                },
                                subPages: {
                                    vmCatalogDeploy: {
                                        name: 'vm_catalog_deploy',
                                        stateKey: 'gpuVmCatalogDeploy',
                                        url: '/gpu/vmCatalog/deploy/:id',
                                        controller: 'gpuVmCatalogDeployFormCtrl',
                                        templateUrl: _GPU_VIEWS_+'/vmCatalog/vmCatalogDeployForm.html'
                                    }
                                }
                            },
                            vmCatalogDeploy: {
                                name: "vm_catalog_deploy_list",
                                icon: "vmCatalogDeploy",
                                stateKey: 'gpuVmCatalogDeployList',
                                url: '/gpu/vmCatalogDeploy/list',
                                controller: 'gpuVmCatalogDeployListCtrl',
                                templateUrl: _GPU_VIEWS_+'/vmCatalog/vmCatalogDeployList.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [],
                                    loadMyControllers: [_GPU_JS_+'/controllers/vmCatalog/vmCatalogDeployControllers.js'],
                                    loadMyDirectives: [],
                                },
                                subPages: {
                                    serverDetail: {
                                        name: 'vm_catalog_deploy_view',
                                        stateKey: 'gpuVmCatalogDeployView',
                                        url: '/gpu/vmCatalogDeploy/view/:id',
                                        controller: 'gpuVmCatalogDeployViewCtrl',
                                        templateUrl: _GPU_VIEWS_+'/vmCatalog/vmCatalogDeployView.html'
                                    }
                                }
                            }
                        }
                    },
                    storageMain: {
                        name: "storage_main",
                        icon: "storageMain",
                        stateKey: 'gpuStorageMain',
                        url: '/gpu/storage',
                        controller: 'gpuStorageCtrl',
                        templateUrl: _GPU_VIEWS_+'/storage/storage.html',
                        subPages: {
                        }
                    },
                    storageCreate: {
                        name: 'storage_create',
                        stateKey: 'gpuStorgeCreate',
                        url: '/gpu/storage/create',
                        controller: 'gpuStorageFormCtrl',
                        templateUrl: _GPU_VIEWS_+'/storage/storageForm.html'
                    },
                    object_storage: {
                        name: "object_storage",
                        icon: "object_storage",
                        stateKey: 'gpuObjectStorage',
                        url: '/gpu/storage/object',
                        controller: 'gpuObjectStorageCtrl',
                        templateUrl: _GPU_VIEWS_+'/storage/objectStorage.html'
                    },
                    server_snapshot: {
                        name: "server_snapshot",
                        icon: "server_snapshot",
                        stateKey: 'gpuServiceSnapshot',
                        url: '/gpu/snapshot',
                        controller: 'gpuServerSnapshotCtrl',
                        templateUrl: _GPU_VIEWS_+'/compute/serverSnapshot.html',
                        subPages: {
                            instanceSnashotCreate: {
                                name: 'server_snapshot_create',
                                stateKey: 'gpuServerSnapshotCreate',
                                url: '/gpu/snapshot/serverCreate/:snapshotId/:tenantId',
                                controller: 'gpuServerSnapshotCreateCtrl',
                                templateUrl: _GPU_VIEWS_+'/compute/serverSnapshotCreate.html'
                            },
                            storageSnashotCreate: {
                                name: 'storage_snapshot_create',
                                stateKey: 'gpuStorageSnapshotCreate',
                                url: '/gpu/snapshot/storageCreate/:snapshotId',
                                controller: 'gpuStorageSnapshotCreateCtrl',
                                templateUrl: _GPU_VIEWS_+'/storage/storageSnapshotCreate.html'
                            }
                        }
                    }
                }
            }
        }
    })
;