//'use strict';

angular.module('product.services')
	.factory('productService', function (common, cache, cookies, CONSTANTS) {

		var productService = {};

		/* 상품검색 */
        productService.listProduct = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/product', 'GET', param));
        };

        /* 상품저장 */
        productService.saveProduct = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/product', 'PUT', param));
        };

        /* 상품삭제 */
        productService.removeProduct = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/product', 'POST', param));
        };

        /* 서버스펙검색 */
        productService.searchServerSpec = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/product/specs', 'POST', param));
        };

        /* PaaS용량계획검색 */
        productService.searchPaasQuota = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/product/quotas', 'POST', param));
        };

        return productService;
	})
;
