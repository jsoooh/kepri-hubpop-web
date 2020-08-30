'use strict';

angular.module('gpu.services')
    .factory('vmCatalogService', function ($ocLazyLoad, $translate, common, cache, cookies, CONSTANTS) {

        var vmCatalogService = {};

        // VM 카탈로그 목록 조회
        vmCatalogService.listAllVmCatalogs = function() {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/catalogs', 'GET'));
        };

        // VM 카탈로그 조회
        vmCatalogService.getVmCatalog = function(catalogId) {
            var params = {
                urlPaths : {
                    "id" : catalogId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/catalogs/{id}', 'GET', params));
        };

        // VM 카탈로그 템플릿 조회
        vmCatalogService.getVmCatalogDeployTemplateInfo = function(templatePath) {
            return common.retrieveResource(common.resourcePromiseJson(_GPU_VM_CATALOG_TEMPLATE_ + templatePath + "/index.json", 'GET'));
        };

        // VM 카탈로그 템플릿 컨트롤 로드
        vmCatalogService.loadVmCatalogDeployController = function(controllerFilePath) {
            return common.ocLazyLoad("gpu.controllers", [_GPU_VM_CATALOG_TEMPLATE_ + controllerFilePath + _VERSION_TAIL_]);
        };

        // VM 카탈로그 템플릿 HTML 가져오기
        vmCatalogService.getVmCatalogDeployTemplateFile = function(templateHtmlPath) {
            return common.retrieveResource(common.resourcePromiseJson(_GPU_VM_CATALOG_TEMPLATE_ + templateHtmlPath + _VERSION_TAIL_, 'GET'));
        };

        // VM 카탈로그 배포 하기
        vmCatalogService.createVmCatalogDeploy = function(tenantId, vmCatalogDeploy) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId
                },
                body: vmCatalogDeploy
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy', 'POST', params));
        };

        // VM 카탈로그 배포 하기
        vmCatalogService.templateVmCatalogDeploy = function(tenantId, vmCatalogDeploy) {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/deploy/template', 'POST', vmCatalogDeploy));
        };

        // VM 카탈로그 배포 정보 목록 조회
        vmCatalogService.listAllVmCatalogDeploy = function(tenantId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy', 'GET', params));
        };

        // VM 카탈로그 배포 정보 목록 조회
        vmCatalogService.listAllVmCatalogDeployNames = function(tenantId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy/names', 'GET', params));
        };

        // VM 카탈로그 배포 정보 목록 조회(stack 포함)
        vmCatalogService.listAllVmCatalogDeployStackDetails = function(tenantId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy/stacks', 'GET', params));
        };

        // VM 카탈로그 배포 정보 조회
        vmCatalogService.getVmCatalogDeploy = function(tenantId, deployId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId,
                    "id" : deployId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy/{id}', 'GET', params));
        };

        // VM 카탈로그 배포 정보 조회(stack 포함)
        vmCatalogService.getVmCatalogDeployStackDetail = function(tenantId, deployId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId,
                    "id" : deployId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy/stacks/{id}', 'GET', params));
        };

        // VM 카탈로그 배포 상태 정보 UPDATE
        vmCatalogService.setVmCatalogDeployStatus = function(tenantId, stackName, stackId, deployStatus) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId,
                    "stackName" : stackName,
                    "stackId" : stackId
                },
                deployStatus : deployStatus
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/external/{tenantId}/deploy/{stackName}/{stackId}/status', 'PUT', params));
        };

        // VM 카탈로그 서비스 이름 변경
        vmCatalogService.renameVmCatalogDeploy = function(tenantId, deployId, deployName) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId,
                    "id" : deployId
                },
                deployName: deployName
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy/{id}/rename', 'PUT', params));
        };

        // VM 카탈로그 배포 삭제
        vmCatalogService.deleteVmCatalogDeploy = function(tenantId, deployId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId,
                    "id" : deployId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy/{id}', 'DELETE', params));
        };

        // 테넌트 리소스 조회
        vmCatalogService.getTenantResource = function(tenantId)  {
            var params = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/usedLookup', 'GET', params));
        };

        // 가용존 목록 조회
        vmCatalogService.listAllAvailabilityZones = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/availabilityZones', 'GET'));
        };

        // 네트워크 목록 조회
        vmCatalogService.listAllNetwork = function(tenantId) {
            var params = {
                tenantId : tenantId,
                isExternal : true
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/networks', 'GET', params));
        };

        // keypair 목록 조회
        vmCatalogService.getKeypairList = function(tenantId) {
            var params = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/keypair', 'GET', params));
        };

        // default keypair 등록
        vmCatalogService.addDefaultKeypair = function(createKeypair) {
            var params = {
                keypair : createKeypair
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/keypair', 'POST', params));
        };

        // 보안정책 목록 조회
        vmCatalogService.listAllSecurityPolicy = function(tenantId) {
            var params = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/securityPolicy', 'GET', params));
        };

        // 스펙 리스트 조회
        vmCatalogService.listAllSpec = function() {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/spec', 'GET'));
        };

        // 서비스 배포 time out 체크
        vmCatalogService.checkDeployTimeOutStatus = function(vmCatalogDeployInfo) {
            if(vmCatalogDeployInfo.stackStatus.indexOf("PROGRESS") >= 0) {
                return;
            }
            if((new Date()).getTime() - vmCatalogDeployInfo.updated > vmCatalogDeployInfo.vmCatalogInfo.deployTimeOut * 60000) {
                vmCatalogDeployInfo.deployStatus = "DEPLOY_TIME_OUT";
            }
        };

        // VM 카탈로그 서비스 하둡에서 사용하는 버킷 생성
        vmCatalogService.createBucket = function(tenantId,bucketName) {
            var params = {
                    tenantId : tenantId,
                    bucket : bucketName
            };
            console.log(CONSTANTS.gpuApiContextUrl);
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket?tenantId='+tenantId+"&bucketName="+bucketName, 'POST', params));
        };

        return vmCatalogService;
    })

;
