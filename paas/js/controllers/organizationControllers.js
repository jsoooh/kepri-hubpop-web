'use strict';

angular.module('paas.controllers')
    .controller('paasOrganizationsCtrl', function ($scope, $location, $state, $stateParams, $timeout, user, common, organizationService,  CONSTANTS) {
        _DebugConsoleLog("organizationControllers.js : paasOrganizationsCtrl", 1);

        var ct = this;
        ct.organizations = [];

        ct.listAllOrganizations = function () {
            $scope.main.loadingMainBody = true;
	        var organizationPromise;
	        if ($scope.main.sltOrganizationGuid) {
		        organizationPromise = organizationService.getOrganization($scope.main.sltOrganizationGuid);
	        } else {
		        organizationPromise = organizationService.listAllOrganizations();
	        }
            organizationPromise.success(function (data) {
            	var orgs = [];
                if($scope.main.sltOrganizationGuid) {
	                orgs.push(data);
                } else {
	                $scope.main.organizations = angular.copy(data);
	                $scope.main.syncListAllPortalOrgs();
	                orgs = data;
                }
                ct.organizations = ct.setProcessBar($scope.main.sinkPotalOrgsName(orgs));
                $scope.main.loadingMainBody = false;
                //$scope.$broadcast("REFRESH");
            });
            organizationPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // main changeOrganization 와 연결
        $scope.$on('organizationChanged', function(event, orgItem) {
            ct.listAllOrganizations();
        });

        ct.setProcessBar = function(organizations) {
            for (var i=0; i<organizations.length; i++) {
                var totalServices = organizations[i].quotaDefinition.totalServices;
                var totalServicesUsage = organizations[i].quotaDefinition.totalServicesUsage;
                organizations[i].procssBar = common.getProcessPercentBar(totalServices, totalServicesUsage);
            }
            return organizations;
        };

        ct.listAllOrganizations();
    })
;
