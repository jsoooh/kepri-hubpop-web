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
                	/*dashboard: {
						name: "dashboard",
						icon: "fa-th-large",
						stateKey: 'iaasComputeDashboard',
						url: '/iaas',
						controller: 'iaasComputeDashboardCtrl',
						templateUrl: _IAAS_VIEWS_+'/dashboard/computeDashboard.html',
					},*/
                    serverMain: {
                        name: "server_main",
                        icon: "serverMain",
                        stateKey: 'iaasCompute',
                        url: '/iaas/compute',
                        controller: 'iaasComputeCtrl',
                        templateUrl: _IAAS_VIEWS_+'/compute/compute.html',
                        subPages: {	// 메뉴에서는 상세 페이지로 표현
                            serverDetail: {
                                name: 'server_main',
                                stateKey: 'iaasComputeDetail',
                                url: '/iaas/compute/detail/:instanceId',
                                controller: 'iaasComputeDetailCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/computeDetail.html'
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
                                templateUrl: _IAAS_VIEWS_+'/compute/computeAlarm.html'
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
                        subPages: {
                            storageCreate: {
                                name: 'storage_create',
                                stateKey: 'iaasStorgeCreate',
                                url: '/iaas/storage/create',
                                controller: 'iaasStorageFormCtrl',
                                templateUrl: _IAAS_VIEWS_+'/storage/storageForm.html'
                            }
                        }
                    },
                    server_snapshot: {
                        name: "server_snapshot",
                        icon: "server_snapshot",
                        stateKey: 'iaasServiceSnapshot',
                        url: '/iaas/snapshot',
                        controller: 'iaasServerSnapshotCtrl',
                        templateUrl: _IAAS_VIEWS_+'/compute/serverSnapshot.html',
                        subPages: {
                            instanceSnashotCreate: {
                                name: 'server_snapshot_create',
                                stateKey: 'iaasServerSnapshotCreate',
                                url: '/iaas/snapshot/serverCreate/:snapshotId',
                                controller: 'iaasServerSnapshotCreateCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/serverSnapshotCreate.html'
                            },
                            storageSnashotCreate: {
                                name: 'storage_snapshot_create',
                                stateKey: 'iaasStorageSnapshotCreate',
                                url: '/iaas/snapshot/storageCreate/:snapshotId',
                                controller: 'iaasStorageSnapshotCreateCtrl',
                                templateUrl: _IAAS_VIEWS_+'/storage/storageSnapshotCreate.html'
                            }
                        }
                    }
                    /*storage_snapshot: {
                        name: "storage_snapshot",
                        icon: "storage_snapshot",
                        stateKey: 'iaasStorageSnapshot',
                        url: '/iaas/compute/storageSnapshot',
                        controller: 'iaasStorageSnapshotCtrl',
                        templateUrl: _IAAS_VIEWS_+'/storage/storageSnapshot.html',
                    },*/
                    /*deployServer: {
                        name: "deploy_server",
                        icon: "deployServer",
                        stateKey: 'iaasDeployServer',
                        url: '/iaas/deploy_server',
                        controller: 'iaasDeployServerCtrl',
                        templateUrl: _IAAS_VIEWS_+'/compute/deployServer.html',
                        subPages: {
                            deployServerDetail: {
                                name: 'deploy_server_details',
                                stateKey: 'iaasDeployServerDetail',
                                url: '/iaas/deploy_server/detail/:deployId',
                                controller: 'iaasDeployServerDetailCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/deployServerDetail.html',
                            },
                            serverDetail: {
                                name: 'server_details',
                                stateKey: 'iaasComputeDetail',
                                url: '/iaas/compute/detail/:instanceId',
                                controller: 'iaasComputeDetailCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/computeDetail.html',
                            },
                            deployServerComputeDetail: {
                                name: 'server_details',
                                stateKey: 'iaasDeployServerComputeDetail',
                                url: '/iaas/deploy_server/compute/detail/:instanceId',
                                controller: 'iaasComputeDetailCtrl',
                                templateUrl: _IAAS_VIEWS_+'/compute/computeDetail.html',
                            }
                        }
                    },*/
                    /*initScript: {
                        name: "server_init_script",
                        icon: "server_init_script",
                        stateKey: 'iaasInitScript',
                        url: '/iaas/compute/initScript',
                        controller: 'iaasComputeIntitScriptCtrl',
                        templateUrl: _IAAS_VIEWS_+'/compute/computeInitScript.html'
                    },
                    securityPolicy: {
                        name: "server_security_policy",
                        icon: "server_security_policy",
                        stateKey: 'iaasSecurityPolicy',
                        url: '/iaas/securityPolicy/securityPolicy',
                        controller: 'iaasSecurityPolicyCtrl',
                        templateUrl: _IAAS_VIEWS_+'/securityPolicy/securityPolicy.html',
                        subPages: {	// 메뉴에서는 상세 페이지로 표현
                            security_policy_rule: {
                                name: 'security_policy_rule',
                                icon: "iaasSecurityPolicyRule",
                                stateKey: 'iaasSecurityPolicyRule',
                                url: '/iaas/securityPolicy/securityPolicyRule/:policyid',
                                controller: 'iaasSecurityPolicyRuleCtrl',
                                templateUrl: _IAAS_VIEWS_+'/securityPolicy/securityPolicyRule.html',
                            }
                        }
                    },
                    keypair: {
                        name: "server_keypair",
                        icon: "server_keypair",
                        stateKey: 'iaasKeypair',
                        url: '/iaas/keypair/keypair',
                        controller: 'iaasKeypairCtrl',
                        templateUrl: _IAAS_VIEWS_+'/keypair/keypair.html',
                        subPages: {	// 메뉴에서는 상세 페이지로 표현
                            keypair_instance: {
                                name: 'server_keypair_instance',
                                icon: "iaasKeypairInstance",
                                stateKey: 'iaasKeypairInstance',
                                url: '/iaas/keypair/keypair/:keypairName',
                                controller: 'iaasKeypairInstanceCtrl',
                                templateUrl: _IAAS_VIEWS_+'/keypair/keypairInstance.html',
                            }
                        }
                    },*/
                    /*storage: {
                        name: "storage",
                        icon: "iaasStorage",
                        stateKey: 'iaasStorage',
                        subMenus:{
                            storageMain: {
                                name: "storage_main",
                                icon: "storageMain",
                                stateKey: 'iaasStorageMain',
                                url: '/iaas/storage',
                                controller: 'iaasStorageCtrl',
                                templateUrl: _IAAS_VIEWS_+'/storage/storage.html',
                                subPages: {
                                    storageDetail: {
                                        name: 'storage_details',
                                        icon: "paasApp",
                                        stateKey: 'iaasStorageDetail',
                                        url: '/iaas/storage/detail/:volumeid',
                                        controller: 'iaasStorageDetailCtrl',
                                        templateUrl: _IAAS_VIEWS_+'/storage/subMenus/storageDetail.html',
                                    },
                                    storageCreate: {
				                        name: 'storage_create',
				                        stateKey: 'iaasStorgeCreate',
				                        url: '/iaas/storage/create',
				                        controller: 'iaasStorageFormCtrl',
				                        templateUrl: _IAAS_VIEWS_+'/storage/storageForm.html',
				                    }
                                }
                            },
                            object_storage: {
                                name: "object_storage",
                                icon: "object_storage",
                                stateKey: 'iaasObjectStorage',
                                url: '/iaas/storage/object',
                                controller: 'iaasObjectStorageCtrl',
                                templateUrl: _IAAS_VIEWS_+'/storage/objectStorage.html',
                            }
                        }
                    },*/
                    /*network: {
                        name: "network",
                        icon: "iaasNetwork",
                        stateKey: 'iaasNetwork',
                        subMenus:{
                            netWorkMain: {
                                name: "network_main",
                                icon: "networkMain",
                                stateKey: 'iaasNetworkMain',
                                url: '/iaas/network',
                                controller: 'iaasNetworkCtrl',
                                templateUrl: _IAAS_VIEWS_+'/network/network.html',
                                subPages: {	// 메뉴에서는 상세 페이지로 표현
                                    serverPush: {
                                        name: 'network_detail',
                                        icon: "paasApp",
                                        stateKey: 'iaasNetworkDetail',
                                        url: '/iaas/network/detail/:networkId',
                                        controller: 'iaasNetworkDetailCtrl',
                                        templateUrl: _IAAS_VIEWS_+'/network/subMenus/networkDetail.html',
                                    }
                                }
                            },
                            domain: {
                                name: "network_domain",
                                icon: "network_domain",
                                stateKey: 'iaasNetworkDomain',
                                url: '/iaas/network/domain',
                                controller: 'iaasDomainCtrl',
                                templateUrl: _IAAS_VIEWS_+'/network/domain.html'
                            },
                            publicIp: {
								name: "network_domain_router",
								icon: "network_domain_router",
								stateKey: 'iaasNetworkDomainRouter',
								url: '/iaas/network/domainRouter',
								controller: 'iaasDomainRouterCtrl',
								templateUrl: _IAAS_VIEWS_+'/network/domainRouter.html'
                            }
                        }
                    }*/
                }
            }
        }
    })
;