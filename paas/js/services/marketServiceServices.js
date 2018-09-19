//'use strict';

angular.module('paas.services')
    .factory('marketServiceService', function (common, CONSTANTS) {

        var marketServiceService = {};

        marketServiceService.listAllMarketServicesByOpenStatus = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiMarketContextUrl + '/market_services/all', 'GET'));
        };

        marketServiceService.listMarketServicesByOpenStatus = function (size, page) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiMarketContextUrl + '/market_services', 'GET', getParams));
        };

        marketServiceService.getMarketService = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiMarketContextUrl + '/market_services/{id}', 'GET', getParams));
        };

        return marketServiceService;
    })
;
