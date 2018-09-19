'use strict';

angular.module('paas.controllers')
    .controller('paasSpacesCtrl', function ($scope, $location, $route, $state, $stateParams, $translate, $timeout, spaceService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("spaceControllers.js : paasSpacesCtrl", 1);

        var ct = this;
        var vs = new ValidationService();
        ct.spaces = {};
        ct.spaces.totalElements = 0;

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        }

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.spaceData = {};
        pop.organizations = [];
        pop.sltOrganization = {};
        pop.spaceQuotas = [];
        pop.sltSpaceQuota = {};

        ct.listSpaces = function (currentPage) {
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            $scope.main.loadingMainBody = true;
            var spacePromise = spaceService.listSpaces($scope.main.sltOrganizationGuid, ct.pageOptions.pageSize, ct.pageOptions.currentPage);
            spacePromise.success(function (data) {
                ct.spaces = data;
                ct.pageOptions.total = data.totalElements;
                $scope.main.loadingMainBody = false;
            });
            spacePromise.error(function (data) {
                ct.spaces = [];
                $scope.main.loadingMainBody = false;
            });
        };

        // main changeOrganization 와 연결
        $scope.$on('organizationChanged', function(event, orgItem) {
            ct.listSpaces();
        });

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.createSpace = function ($event) {
            $scope.dialogOptions = {
                title : $translate.instant("label.space_add"),
                formName: "createSpaceForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/space/popSpaceForm.html" + _VersionTail(),
                okName : $translate.instant("label.add")
            };
            pop.organizations = angular.copy($scope.main.organizations);
            pop.sltOrganization = {};
            pop.sltSpaceQuota = {};
            pop.spaceQuotas = [];
            pop.spaceData	= {
                organizationGuid : $scope.main.sltOrganizationGuid,
                spaceQuotaGuid : ""
            };
            common.showDialog($scope, $event, $scope.dialogOptions);
            if (pop.spaceData.organizationGuid) {
                $scope.actionLoading = true; // action loading
                pop.getOrganization(pop.spaceData.organizationGuid);
            } else {
                $scope.actionLoading = false; // action loading
            }
            $scope.actionBtnHied = false;
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createSpaceAction(pop.spaceData);
            }
        };

        ct.updateSpace = function ($event, space) {
            var spaceData = angular.copy(space);
            $scope.dialogOptions = {
                title : $translate.instant("label.space_edit"),
                formName: "updateSpaceForm",
                templateUrl: _PAAS_VIEWS_ + "/space/popSpaceForm.html" + _VersionTail(),
                dialogClassName : "modal-dialog",
                okName : $translate.instant("label.edit")
            };
            pop.organizations = angular.copy($scope.main.organizations);
            pop.sltOrganization = {};
            pop.sltSpaceQuota = {};
            pop.spaceQuotas = [];
            pop.getOrganization(spaceData.organizationGuid);
            pop.spaceData	= spaceData;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
            $scope.actionBtnHied = false;
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updateSpaceAction(pop.spaceData);
            }
        };

        ct.deleteSpace = function (guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_space'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.deleteSpaceAction(guid);
            });
        };

        ct.moveToSpacePage = function (spaceItem) {
            $scope.main.detialOrgName = spaceItem.organizationName;
            $scope.main.spaceName = spaceItem.name;
            $scope.main.goToPage("/paas/spaces/" + spaceItem.guid);
        };

        ct.moveToSpaceUserRole = function (spaceItem) {
            $scope.main.detialOrgName = spaceItem.organizationName;
            $scope.main.spaceName = spaceItem.name;
            $scope.main.goToPage("/paas/spaces/" + spaceItem.guid + "/user_roles");
        };

        pop.changeOrganization = function () {
            pop.spaceData.spaceQuotaGuid = "";
            pop.sltOrganization = {};
            pop.sltSpaceQuota = {};
            pop.spaceQuotas = [];
            if (pop.spaceData.organizationGuid) {
                pop.getOrganization(pop.spaceData.organizationGuid);
            }
        };

        pop.getOrganization = function (guid) {
            var spacePromise = spaceService.getOrganization(guid);
            spacePromise.success(function (data) {
                pop.sltOrganization = data;
	            pop.spaceQuotas = angular.copy(data.spaceQuotaDefinitions);
	            pop.changeSpaceQuota();
                $scope.actionLoading = false;
            });
            spacePromise.error(function (data) {
                pop.sltOrganization = {};
                $scope.actionLoading = false;
            });
        };

        pop.changeSpaceQuota = function () {
            if (pop.spaceData.spaceQuotaDefinitionGuid) {
                for (var key in pop.spaceQuotas) {
                    if (pop.spaceQuotas[key].guid == pop.spaceData.spaceQuotaDefinitionGuid) {
                        pop.sltSpaceQuota = pop.spaceQuotas[key];
                        break;
                    }
                }
            } else {
                pop.sltSpaceQuota = {};
            }
        };

        pop.createSpaceAction = function (spaceData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            var spaceBody = {};
            spaceBody.organizationGuid = spaceData.organizationGuid;
            spaceBody.name = spaceData.name;
            spaceBody.spaceQuotaDefinitionGuid = spaceData.spaceQuotaDefinitionGuid;

            $scope.actionLoading = true;
            var spacePromise = spaceService.createSpace(spaceBody);
            spacePromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listSpaces();
                pop.sltOrganization = {};
                pop.sltSpaceQuota = {};
                pop.spaceQuotas = [];
                pop.organizations = [];
                $scope.popHide();
            });
            spacePromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        pop.updateSpaceAction = function (spaceData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var spaceBody = {};
            spaceBody.guid = spaceData.guid;
            spaceBody.organizationGuid = spaceData.organizationGuid;
            spaceBody.name = spaceData.name;
            spaceBody.spaceQuotaDefinitionGuid = spaceData.spaceQuotaDefinitionGuid;

            var spacePromise = spaceService.updateSpace(spaceData.guid, spaceBody);
            spacePromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listSpaces();
                pop.sltOrganization = {};
                pop.sltSpaceQuota = {};
                pop.spaceQuotas = [];
                pop.organizations = [];
                $scope.popHide();
            });
            spacePromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        ct.deleteSpaceAction = function (guid) {
            $scope.main.loadingMainBody = true;
            var spacePromise = spaceService.deleteSpace(guid);
            spacePromise.success(function (data) {
                ct.listSpaces();
            });
            spacePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listSpaces();
    })
    .controller('paasSpaceDetailCtrl', function ($scope, $location, $route, $state, $stateParams, $translate, $timeout, spaceService, serviceInstanceService, organizationService, common, CONSTANTS) {
        _DebugConsoleLog("spaceControllers.js : paasSpaceDetailCtrl", 1);

        var ct = this;
        var app = $scope.app = {};
        var serviceInstance = $scope.serviceInstance = {};
        var userServiceInstance = $scope.userServiceInstance = {};

        ct.spaceGuid = $stateParams.guid;
        ct.space = {};

        // paging
        app.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

        app.apps = null;

        // paging
        serviceInstance.pageOptions = {
            currentPage : 1,
            pageSize : 5,
            total : 1
        };

        serviceInstance.serviceInstances = null;

        // paging
        userServiceInstance.pageOptions = {
            currentPage : 1,
            pageSize : 5,
            total : 1
        };

        userServiceInstance.serviceInstances = null;

        ct.getSpace = function () {
            $scope.main.loadingMainBody = true;
            var spacePromise = spaceService.getSpace(ct.spaceGuid, 2);
            spacePromise.success(function (data) {
                ct.setApps(data);
                app.listApps(1);
	            serviceInstance.serviceInstances = angular.copy(data.serviceInstances);
	            userServiceInstance.userServiceInstances = angular.copy(data.userServiceInstances);
                serviceInstance.listServiceInstances(1);
                userServiceInstance.listUserServiceInstances(1);
                ct.space = data;
                if (data.organizationGuid) {
                    var organization = common.objectsFindCopyByField($scope.main.organizations, "guid", data.organizationGuid);
                    if (organization && angular.isDefined(organization.name)) {
	                    $scope.main.detailOrgName = organization.name + "(" + organization.orgName + ")";
                    }
                }
                $scope.main.spaceName = ct.space.name;
                $scope.main.loadingMainBody = false;
            });
            spacePromise.error(function (data) {
                ct.space = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.setApps = function (space) {
            var routes = angular.copy(space.routes);
            var apps = angular.copy(space.apps);
            for (var i=0; i<apps.length; i++) {
                apps[i].uris = [];
                for (var j=0; j<routes.length; j++) {
                    for (var k=0; k<routes[j].apps.length; k++) {
                        if (apps[i].guid == routes[j].apps[k].guid) {
                            apps[i].uris.push(routes[j].url);
                        }
                    }
                }
            }
            app.apps = apps;
            app.pageOptions.total = apps.length;
        };

        app.listApps = function (currentPage) {
            if (angular.isDefined(currentPage) && currentPage != null) {
                app.pageOptions.currentPage = currentPage;
            }
            app.pageOptions.total = app.apps.length;
            app.pageOptions.start = app.pageOptions.pageSize * (app.pageOptions.currentPage - 1);
        };

        serviceInstance.listServiceInstances = function (currentPage) {
            if (angular.isDefined(currentPage) && currentPage != null) {
                serviceInstance.pageOptions.currentPage = currentPage;
            }
            serviceInstance.pageOptions.total = serviceInstance.serviceInstances.length;
            serviceInstance.pageOptions.start = serviceInstance.pageOptions.pageSize * (serviceInstance.pageOptions.currentPage - 1);
        };

        userServiceInstance.listUserServiceInstances = function (currentPage) {
            if (angular.isDefined(currentPage) && currentPage != null) {
                userServiceInstance.pageOptions.currentPage = currentPage;
            }
            userServiceInstance.pageOptions.total = userServiceInstance.userServiceInstances.length;
            userServiceInstance.pageOptions.start = userServiceInstance.pageOptions.pageSize * (userServiceInstance.pageOptions.currentPage - 1);
        };

        ct.replaceServiceInstance = function () {
            ct.getSpace();
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled
        ct.createServiceInstance = function ($event) {
            ct.serviceInstanceData = {};
            $scope.dialogOptions = {
                controller : "serviceInstanceFormCtrl",
                callBackFunction : ct.replaceServiceInstance
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
        };

        ct.updateServiceInstance = function ($event, serviceInstance) {
            ct.serviceInstanceData	= angular.copy(serviceInstance);
            $scope.dialogOptions = {
                controller : "serviceInstanceFormCtrl",
                callBackFunction : ct.replaceServiceInstance
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
        };

        ct.deleteServiceInstance = function (guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_service_instance'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.deleteServiceInstanceAction(guid);
            });
        };

        ct.deleteServiceInstanceAction = function (guid) {
            $scope.main.loadingMainBody = true;
            var servicePromise = serviceInstanceService.deleteServiceInstance(guid);
            servicePromise.success(function (data) {
                ct.replaceServiceInstance();
            });
            servicePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.createUserServiceInstance = function ($event) {
            ct.userServiceInstanceData = {};
            $scope.dialogOptions = {
                controller : "userServiceInstanceFormCtrl",
                callBackFunction : ct.replaceServiceInstance
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
        };

        ct.updateUserServiceInstance = function ($event, serviceInstance) {
            ct.userServiceInstanceData	= angular.copy(serviceInstance);
            $scope.dialogOptions = {
                controller : "userServiceInstanceFormCtrl",
                callBackFunction : ct.replaceServiceInstance
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
        };

        ct.deleteUserServiceInstance = function (guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_service_instance'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.deleteUserServiceInstanceAction(guid);
            });
        };

        ct.deleteUserServiceInstanceAction = function (guid) {
            $scope.main.loadingMainBody = true;
            var servicePromise = serviceInstanceService.deleteUserServiceInstance(guid);
            servicePromise.success(function (data) {
                ct.replaceServiceInstance();
            });
            servicePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.replaceServiceInstance();
    })
    .controller('paasSpaceUserRolesCtrl', function ($scope, $location, $route, $state, $stateParams, $translate, $timeout, spaceService, serviceInstanceService, common, CONSTANTS) {
        _DebugConsoleLog("spaceControllers.js : paasSpaceUserRolesCtrl", 1);

        var ct = this;
        ct.spaceGuid = $stateParams.guid;

        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 1
        };

	    ct.organizationUserRoles = {};
        ct.spaceUserRoles = [];
	    ct.orgSpaceUsers = [];
	    ct.spaceUsers = [];
        ct.spaces = {};

        ct.getSpace = function () {
            $scope.main.loadingMainBody = true;
            var spacePromise = spaceService.getSpace(ct.spaceGuid, 1);
            spacePromise.success(function (data) {
                if (data.organizationGuid) {
                    var organization = common.objectsFindCopyByField($scope.main.organizations, "guid", data.organizationGuid);
	                if (organization && angular.isDefined(organization.name)) {
		                $scope.main.detailOrgName = organization.name + "(" + organization.orgName + ")";
	                }
                }
                $scope.main.spaceName = data.name;
                ct.space = data;
                ct.listSpaceUserRoles(1);
            });
            spacePromise.error(function (data) {
                ct.space = {};
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listSpaceUserRoles = function (currentPage) {
            $scope.main.loadingMainBody = true;
            ct.isOrganizationUserRoleData = false;
            ct.isSpaceUserRoleData = false;
            ct.listOrganizationUserRoles(currentPage);
            ct.listAllSpaceUserRoles();
        };

        ct.listOrganizationUserRoles = function (currentPage) {
            if (angular.isDefined(currentPage) && currentPage != null) {
                ct.pageOptions.currentPage = currentPage;
            }
            var authorityPromise = spaceService.listOrganizationUserRoles(ct.space.organizationGuid, ct.pageOptions.pageSize, ct.pageOptions.currentPage);
            authorityPromise.success(function (data) {
                ct.organizationUserRoles = data;
                ct.pageOptions.total = data.totalElements;
                ct.isOrganizationUserRoleData = true;
                if (ct.isSpaceUserRoleData) {
                    ct.setListSpaceUserRoles();
                }
            });
            authorityPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllSpaceUserRoles = function () {
            var authorityPromise = spaceService.listAllSpaceUserRoles(ct.spaceGuid);
            authorityPromise.success(function (data) {
                ct.spaceUserRoles = data;
                ct.isSpaceUserRoleData = true;
                if (ct.isOrganizationUserRoleData) {
                    ct.setListSpaceUserRoles();
                }
            });
            authorityPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.setListSpaceUserRoles = function () {
            var organizationUsers = ct.organizationUserRoles.content;
            ct.pageOptions.total = ct.organizationUserRoles.totalElements;
            var spaceUsers = [];
            for (var i = 0; i < organizationUsers.length; i++) {
                var spaceUserRole = {};
                for (var j = 0; j < ct.spaceUserRoles.length; j++) {
                    if (angular.equals(organizationUsers[i].guid, ct.spaceUserRoles[j].guid)) {
                        spaceUserRole = angular.copy(ct.spaceUserRoles[j]);
                        break;
                    }
                }
	            spaceUserRole.guid = organizationUsers[i].guid;
	            spaceUserRole.username = organizationUsers[i].username;
	            spaceUserRole.portalUserName = organizationUsers[i].portalUserName;
	            spaceUserRole.displayUserName = spaceUserRole.username ? (spaceUserRole.portalUserName ? (spaceUserRole.portalUserName + "(" + spaceUserRole.username + ")") : spaceUserRole.username ) : "";
	            spaceUserRole.roleType = "";
				if (angular.isUndefined(spaceUserRole.guid)) {
				    spaceUserRole.manager = false;
				    spaceUserRole.developer = false;
				    spaceUserRole.auditor = false;
				}
				if (spaceUserRole.username) {
				    spaceUserRole.disabled = false;
				} else {
				    spaceUserRole.disabled = true;
				}
				spaceUsers.push(spaceUserRole);
            }
	        ct.orgSpaceUsers = angular.copy(spaceUsers);
            ct.spaceUsers = spaceUsers;
            $scope.main.loadingMainBody = false;
        };

	    ct.changeSpaceUserRole = function (key) {
		    ct.spaceUsers[key].roleType = "";
	    	if (ct.spaceUsers[key].manager !=  ct.orgSpaceUsers[key].manager) {
			    ct.spaceUsers[key].roleType = "manager";
		    }
		    if (ct.spaceUsers[key].developer !=  ct.orgSpaceUsers[key].developer) {
			    ct.spaceUsers[key].roleType = (ct.spaceUsers[key].roleType != '') ? ct.spaceUsers[key].roleType + ",developer" : "developer";
		    }
		    if (ct.spaceUsers[key].auditor !=  ct.orgSpaceUsers[key].auditor) {
			    ct.spaceUsers[key].roleType = (ct.spaceUsers[key].roleType != '') ? ct.spaceUsers[key].roleType + ",auditor" : "auditor";
		    }
	    };

		ct.cancelChangeSpaceUserRole = function (key) {
			ct.spaceUsers[key].manager =  ct.orgSpaceUsers[key].manager;
			ct.spaceUsers[key].developer =  ct.orgSpaceUsers[key].developer;
			ct.spaceUsers[key].auditor =  ct.orgSpaceUsers[key].auditor;
			ct.spaceUsers[key].roleType = "";
		};

	    ct.updateSpaceUserRole = function (key) {
		    var userRole = ct.spaceUsers[key];
		    var showConfirm = common.showConfirm($translate.instant('label.role'), $translate.instant('message.mq_change_space_role', { user : userRole.username, space : ct.space.name }));
		    showConfirm.then(function () {
			    common.mdDialogHide();
			    ct.updateSpaceUserRoleAction(key);
		    });
	    };

        ct.updateSpaceUserRoleAction = function (key) {
	        $scope.main.loadingMainBody = true;
	        var userRole = ct.spaceUsers[key];
	        var spaceUserRole = {};
	        spaceUserRole.guid = userRole.guid;
	        spaceUserRole.roleType = userRole.roleType;
	        spaceUserRole.manager = userRole.manager;
	        spaceUserRole.developer = userRole.developer;
	        spaceUserRole.auditor = userRole.auditor;

	        var authorityPromise = spaceService.updateSpaceUserRole(ct.space.guid, spaceUserRole);
            authorityPromise.success(function (data) {
	            ct.orgSpaceUsers[key].manager = ct.spaceUsers[key].manager;
	            ct.orgSpaceUsers[key].developer = ct.spaceUsers[key].developer;
	            ct.orgSpaceUsers[key].auditor = ct.spaceUsers[key].auditor;
	            ct.spaceUsers[key].roleType = "";
	            var showConfirm = common.showAlert($translate.instant('label.role'), $translate.instant('message.mi_change_space_role', { user : userRole.username, space : ct.space.name }));
	            showConfirm.then(function () {
		            common.mdDialogHide();
	            });
                $scope.main.loadingMainBody = false;
            });
            authorityPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.getSpace();
    })
;
