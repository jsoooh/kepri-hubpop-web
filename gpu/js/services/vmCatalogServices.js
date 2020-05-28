'use strict';

angular.module('gpu.services')
    .factory('vmCatalogService', function ($ocLazyLoad, $translate, common, cache, cookies, CONSTANTS) {

        var vmCatalogService = {};

        // VM 카탈로그 목록 조회
        vmCatalogService.listAllVmCatalogs = function() {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/catalogs', 'GET'));
        };

        // VM 카탈로그 조회
        vmCatalogService.getVmCatalogInfo = function(catalogId) {
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
            return common.ocLazyLoad("gpu.controllers", [_GPU_VM_CATALOG_TEMPLATE_ + controllerFilePath]);
        };

        // VM 카탈로그 템플릿 HTML 가져오기
        vmCatalogService.getVmCatalogDeployTemplateHtml = function(templateHtmlPath) {
            return common.retrieveResource(common.resourcePromiseJson(_GPU_VM_CATALOG_TEMPLATE_ + templateHtmlPath, 'GET'));
        };

        // VM 카탈로그 배포 하기
        vmCatalogService.createVmCatalogDeploy = function(tenantId, vmCatalogDeploy) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId
                },
                body: vmCatalogDeploy
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/{tenantId}/deploy', 'POST', params));
        };

        // VM 카탈로그 배포 정보 목록 조회
        vmCatalogService.listAllVmCatalogDeploy = function(tenantId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog//{tenantId}/deploy', 'GET'));
        };

        // VM 카탈로그 배포 정보 목록 조회(stack 포함)
        vmCatalogService.listAllVmCatalogDeployStackDetails = function(tenantId) {
            var params = {
                urlPaths : {
                    "tenantId" : tenantId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/{tenantId}/deploy/stacks', 'GET'));
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

        // 네트워크 목록 조회
        vmCatalogService.listAllNetwork = function(tenantId) {
            var params = {
                tenantId : tenantId,
                isExternal : true
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/network/networks', 'GET', params));
        };

        // 보안정책 목록 조회
        vmCatalogService.listAllSecurityPolicy = function(tenantId) {
            var params = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/securityPolicy', 'GET', params));
        };

        //키페어 목록 조회
        vmCatalogService.listAllSecurityPolicy = function(tenantId) {
            var params = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/keypair', 'GET', params));
        };

        // 스펙 리스트 조회
        vmCatalogService.listAllSpec = function(specGroupName) {
            var params = {
                specGroupName : specGroupName
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/server/spec', 'GET', params));
        };

        // 테넌트 리소스 조회
        vmCatalogService.getTenantResource = function(tenantId)  {
            var params = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/tenant/resource/usedLookup', 'GET', params));
        };

        return vmCatalogService;
    })

;
