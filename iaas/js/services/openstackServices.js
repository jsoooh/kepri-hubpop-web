'use strict';

angular.module('iaas.services')
    .factory('openstack', function ($translate,common, cache, cookies, CONSTANTS) {

        var openstack = {};

        openstack.server = {};
        openstack.server.listSecurityPolicy = function(param) {
            return common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/securityPolicy', 'GET', param, 'application/x-www-form-urlencoded');
        };

        return openstack;
    })
;
