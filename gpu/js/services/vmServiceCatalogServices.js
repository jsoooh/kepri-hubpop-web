'use strict';

angular.module('gpu.services')
    .factory('vmServiceCatalogService', function ($translate, common, cache, cookies, CONSTANTS) {

        var vmServiceCatalogService = {};

        vmServiceCatalogService = {};
        vmServiceCatalogService.listAllVmServiceCatalog = function(param) {
            return common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/vmServiceCatalog/all', 'GET', param, 'application/x-www-form-urlencoded');
        };

        return vmServiceCatalogService;
    })
;
