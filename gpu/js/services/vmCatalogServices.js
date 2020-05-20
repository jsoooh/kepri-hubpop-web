'use strict';

angular.module('gpu.services')
    .factory('vmCatalogService', function ($translate, common, cache, cookies, CONSTANTS) {

        var vmCatalogService = {};

        vmCatalogService.listAllVmCatalogs = function() {
            return common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/vm_catalog/catalogs', 'GET');
        };

        return vmCatalogService;
    })
;
