//'use strict';

angular.module('paas.services')
    .factory('marketAppService', function (common, cloudFoundry, CONSTANTS) {

        var marketAppService = {};

        marketAppService.listAllMarketAppsByOpenStatus = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiMarketContextUrl + '/market_apps/all', 'GET'));
        };

        marketAppService.listMarketAppsByOpenStatus = function (size, page) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 1
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiMarketContextUrl + '/market_apps', 'GET', getParams));
        };

        marketAppService.getAuthMarketApp = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiMarketContextUrl + '/market_apps/{id}', 'GET', getParams));
        };

        marketAppService.marketAppPush = function (formData) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/market_push', 'POST', formData));
        };

        marketAppService.listAllOrganizations = function () {
            return cloudFoundry.organizations.listAllOrganizations(null, 2);
        };

        marketAppService.listAllServices = function (condition) {
            return cloudFoundry.services.listAllServices(condition, 1);
        };

        return marketAppService;
    })
;
