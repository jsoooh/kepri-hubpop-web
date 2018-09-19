//'use strict';

angular.module('portal.services')
	.factory('regionService', function (common, CONSTANTS) {

		var regionService = {};

		/*region 목록조회*/
		regionService.listRegions = function (size, page, sort) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "sort" : sort ? sort : "createdDate,asc"
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/regions', 'GET', getParams));
		};

		/*region 등록*/
		regionService.createRegion = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/regions', 'POST', param));
		};

		/*region 수정*/
		regionService.updateRegion = function (regionId, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/regions/'+regionId, 'PUT', param));
		};

		/*region 삭제*/
		regionService.deleteRegion = function (regionId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/regions/'+regionId, 'DELETE'));
		};
		
		return regionService;
	})
;
