//'use strict';

angular.module('portal.services')
	.factory('mailService', function (common, CONSTANTS) {

		var mailServices = {};

        //전체 사용자에 메일 전달 [보내기]
        mailServices.sendMail = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/users/sendMail', 'POST', param, 'application/x-www-form-urlencoded'));
        };

        return mailServices;

	})
;
