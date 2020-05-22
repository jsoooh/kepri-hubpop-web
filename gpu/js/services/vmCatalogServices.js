'use strict';

angular.module('gpu.services')
    .factory('vmCatalogService', function ($ocLazyLoad, $translate, common, cache, cookies, CONSTANTS) {

        var vmCatalogService = {};

        vmCatalogService.listAllVmCatalogs = function() {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/catalogs', 'GET'));
        };

        vmCatalogService.getVmCatalogInfo = function(catalogId) {
            var getParams = {
                urlPaths : {
                    "id" : catalogId
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.gpuApiContextUrl + '/vm_catalog/catalogs/{id}', 'GET', getParams));
        };

        vmCatalogService.getVmCatalogDeployTemplateInfo = function(templatePath) {
            return common.retrieveResource(common.resourcePromiseJson(_GPU_VM_CATALOG_TEMPLATE_ + templatePath + "/index.json", 'GET'));
        };

        vmCatalogService.loadVmCatalogDeployService = function(serviceFilePath) {
            return $ocLazyLoad.load({name: "gpu.services", files: [_GPU_VM_CATALOG_TEMPLATE_ + serviceFilePath], cache: ((_DEBUG_LEVEL_ >= 3) ? false : true)});
        };

        vmCatalogService.loadVmCatalogDeployController = function(controllerFilePath) {
            return $ocLazyLoad.load({name: "gpu.controllers", files: [_GPU_VM_CATALOG_TEMPLATE_ + controllerFilePath], cache: ((_DEBUG_LEVEL_ >= 3) ? false : true)});
        };

        vmCatalogService.getVmCatalogDeployTemplateHtml = function(templateHtmlPath) {
            return common.retrieveResource(common.resourcePromiseJson(_GPU_VM_CATALOG_TEMPLATE_ + templateHtmlPath, 'GET'));
        };

        return vmCatalogService;
    })
;
