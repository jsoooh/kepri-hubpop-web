'use strict';

angular.module('common.services')
    .factory('userSettingService', function (common, cache, cookies, CONSTANTS) {

        var userSettingService = {};

        userSettingService.userSettingParse = function (data) {
            if (data && angular.isObject(data) && data.contents) {
                data.contents = JSON.parse(data.contents);
            }
            return data;
        };

        userSettingService.listAllUserSetting = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/user_setting/all', 'GET'));
        };

        userSettingService.getUserSetting = function (setKey) {
            var getParams = {
                urlPaths : {
                    "setKey" : setKey
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/user_setting/{setKey}/one', 'GET', getParams));
        };

        userSettingService.saveUserSetting = function (setKey, contents) {
            var getParams = {
                body : {
                    setKey: setKey,
                    contents: JSON.stringify(contents)
                }
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/user_setting', 'POST', getParams));
        };

        return userSettingService;
    })
;