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
                    vmServiceCatalog: {
                        name: "vm_service_catalog",
                        icon: "vmServiceCatalog",
                        stateKey: 'gpuVmServiceCatalog',
                        url: '/gpu/vmServiceCatalog/list',
                        controller: 'gpuVmServiceCatalogListCtrl',
                        templateUrl: _GPU_VIEWS_+'/vmServiceCatalog/vmServiceCatalogList.html',
                        subPages: {
                            vmServiceCatalogView: {
                                name: 'vm_service_catalog_view',
                                stateKey: 'gpuVmServiceCatalogView',
                                url: '/gpu/vmServiceCatalog/view/:id',
                                controller: 'gpuVmServiceCatalogViewCtrl',
                                templateUrl: _GPU_VIEWS_+'/vmServiceCatalog/vmServiceCatalogView.html'
                            },
                            vmServiceCatalogDeploy: {
                                name: 'vm_service_catalog_deploy',
                                stateKey: 'gpuVmServiceCatalogDeploy',
                                url: '/gpu/vmServiceCatalog/deploy/:id',
                                controller: 'gpuVmServiceCatalogDeployCtrl',
                                templateUrl: _GPU_VIEWS_+'/vmServiceCatalog/vmServiceCatalogDeploy.html'
                            }
                        }
                    },
                    vmServiceCatalogDeploy: {
                        name: "vm_service_catalog_deploy_list",
                        icon: "vmServiceCatalogDeploy",
                        stateKey: 'gpuVmServiceCatalogDeployList',
                        url: '/gpu/vmServiceCatalogDeploy/list',
                        controller: 'gpuVmServiceCatalogDeployListCtrl',
                        templateUrl: _GPU_VIEWS_+'/vmServiceCatalog/vmServiceCatalogDeployList.html',
                        subPages: {
                            serverDetail: {
                                name: 'vm_service_catalog_deploy_view',
                                stateKey: 'gpuVmServiceCatalogDeployView',
                                url: '/gpu/vmServiceCatalogDeploy/view/:id',
                                controller: 'gpuVmServiceCatalogDeployViewCtrl',
                                templateUrl: _GPU_VIEWS_+'/vmServiceCatalog/vmServiceCatalogDeployView.html'
                            }
                        }
                    }
                }
            }
        }
    })
;