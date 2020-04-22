'use strict';

angular.module('gpu.services')
    .factory('vmCatalogService', function ($translate, common, cache, cookies, CONSTANTS) {

        var vmCatalogService = {};

        vmCatalogService.listAllVmCatalog = function(param) {
            return common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/vmCatalog/all', 'GET', param, 'application/x-www-form-urlencoded');
        };

        return vmCatalogService;
    })
;
