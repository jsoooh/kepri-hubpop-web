//'use strict';

angular.module('portal.services')
	.factory('serviceService', function (common, CONSTANTS) {

		var serviceService = {};

		/*service 목록조회*/
        serviceService.listServices = function (size, page, sort, useYn) {
            var getParams = {
                "size" : size ? size : 20,
                "page" : page ? page : 0,
                "sort" : sort ? sort : "createdDate,asc",
                "useYn": useYn ? useYn : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/serves', 'GET', getParams));
        };

		/*service 등록*/
        serviceService.createService = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/serves', 'POST', param));
        };

		/*service 수정*/
        serviceService.updateService = function (serveId, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/serves/'+serveId, 'PUT', param));
        };

        /*service 활성화/중지*/
        serviceService.updateServiceUseYn = function (serveId, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/serves/'+serveId+'/useYn', 'PUT', param));
        };

		/*service 삭제*/
        serviceService.deleteService = function (serveId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/serves/'+serveId, 'DELETE'));
        };

		return serviceService;
	})
;
