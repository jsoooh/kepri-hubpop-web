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
                    vmCatalog: {
                        name: "vm_catalog",
                        icon: "vmCatalog",
                        stateKey: 'gpuVmCatalog',
                        subMenus: {
                            vmCatalog: {
                                name: "vm_catalog_list",
                                icon: "vmCatalog",
                                stateKey: 'gpuVmCatalogList',
                                url: '/gpu/vmCatalog/list',
                                controller: 'gpuVmCatalogListCtrl',
                                templateUrl: _GPU_VIEWS_+'/vmCatalog/vmCatalogList.html',
                                subPages: {
                                    vmCatalogView: {
                                        name: 'vm_catalog_view',
                                        stateKey: 'gpuVmCatalogView',
                                        url: '/gpu/vmCatalog/view/:id',
                                        controller: 'gpuVmCatalogViewCtrl',
                                        templateUrl: _GPU_VIEWS_+'/vmCatalog/vmCatalogView.html'
                                    },
                                    vmCatalogDeploy: {
                                        name: 'vm_catalog_deploy',
                                        stateKey: 'gpuVmCatalogDeploy',
                                        url: '/gpu/vmCatalog/deploy/:id',
                                        controller: 'gpuVmCatalogDeployCtrl',
                                        templateUrl: _GPU_VIEWS_+'/vmCatalog/vmCatalogDeploy.html'
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
                    }
                }
            }
        }
    })
;