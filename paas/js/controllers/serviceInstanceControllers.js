'use strict';

angular.module('paas.controllers')
    .controller('paasServiceInstancesCtrl', function ($scope, $location, $state, $stateParams, $translate, user, common, serviceInstanceService, CONSTANTS) {
        _DebugConsoleLog("serviceInstanceControllers.js : paasServiceInstancesCtrl", 1);

        var ct = this;
        var serviceInstance = $scope.serviceInstance = {};
        ct.serviceInstanceData  = {};

        ct.serviceInstances = [];

        // main changeOrganization 와 연결
        $scope.$on('organizationChanged', function(event, orgItem) {
            ct.listServiceInstances();
        });

        $scope.serviceInfo = {
          connection : '',
          description : '',
          planName : '',
          planDes : ''
        };

        $scope.bindingInfos = {
            credential : [],
            serviceLabel : ''
        };

        ct.listAllServiceInstances = function () {
            $scope.main.loadingMainBody = true;
            ct.loadingServiceInstances = false;
            var serviceInstancePromise = serviceInstanceService.listAllServiceInstances($scope.main.sltOrganizationGuid, '');
            serviceInstancePromise.success(function (data) {
                var serviceInstances = [];
                if (data && angular.isArray(data)) {
                    serviceInstances = data;
                    if(data.length != 0){
                        ct.loadingServiceInstances = true;
                    }

                }
                if($scope.contents && $scope.contents.app && $scope.contents.app.name) {
                    angular.forEach(serviceInstances, function (serviceInstance, key) {
                        serviceInstance.serviceNameEqIdx = "";
                        if(serviceInstance.serviceBindings.length > 0) {
                            for (var j = 0; j < serviceInstance.serviceBindings.length; j++) {
                                if(serviceInstance.serviceBindings[j].appName == $scope.contents.app.name){
                                    serviceInstance.serviceNameEqIdx = "" + j + "";
                                }
                                break;
                            }
                        }
                    });
                }
                common.objectOrArrayMergeData(ct.serviceInstances, serviceInstances);
                $scope.main.loadingMainBody = false;
            });
            serviceInstancePromise.error(function (data) {
                ct.serviceInstances = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.replaceServiceInstance = function (data) {
            ct.listAllServiceInstances();
        };

        $scope.actionLoading = false; // action loading
        $scope.authenticating = false; // action loading massage contents
        $scope.actionBtnHied = false; // btn enabled

        ct.showForm = function ( test ) {
            $scope.main.layerTemplateUrl = _PAAS_VIEWS_ + "/serviceInstance/serviceInstances_aside-database.html" + _VersionTail();
            ct.serviceInstanceData = test;
            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        ct.updateServiceInstance = function ($event, serviceInstance) {
            ct.serviceInstanceData	= angular.copy(serviceInstance);
            $scope.dialogOptions = {
                controller : "serviceInstanceFormCtrl",
                callBackFunction : ct.replaceServiceInstance
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
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
            var serviceInstancePromise = serviceInstanceService.deleteServiceInstance(guid);
            serviceInstancePromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.replaceServiceInstance(data);
            });
            serviceInstancePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        //arrow function
        ct.getImageUriBinding = function (serviceObject, appGuid) {
            var serviceInstances = serviceObject;
            var binding = serviceObject.serviceBindings;
            var services = ["mysql", "redis", "postgres", "mongo", "oracle"];
            var result;
            var uri='';

            for(var i = 0; i < services.length; i++){
                var regExp = new RegExp(services[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
                result = regExp.test(serviceInstances.serviceLabel);
                if(result == true){
                    break;
                }
            }

            if(result){
                if (binding.length > 0) {
                    for (var i = 0; i < binding.length; i++) {
                        if (binding[i].appGuid == appGuid) {
                            return 'images/thum/im_app_' + serviceInstances.serviceLabel + '_on.png';
                        }
                    }
                    return 'images/thum/im_app_' + serviceInstances.serviceLabel + '_off.png';
                } else {
                    return 'images/thum/im_app_' + serviceInstances.serviceLabel + '_off.png';
                }
            }
        };

        $scope.serviceInfo = function ($event, serviceItem) {
            $scope.serviceInfo.connection = serviceItem.serviceBindings.length;
            $scope.serviceInfo.description = serviceItem.servicePlan.service.description;
            $scope.serviceInfo.planName = serviceItem.servicePlan.name;
            $scope.serviceInfo.planDes = serviceItem.servicePlan.description;
            $scope.dialogOptions = {
                title : "서비스 정보",
                formName : "serviceInfoForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/serviceInstance/serviceInfoForm.html" + _VersionTail(),
                okBtnHide : true
            };
            common.showDialog($scope, $event, $scope.dialogOptions);
       };

       $scope.bindingInfo = function ($event, serviceItem, appGuid) {
           var serviceInstances = serviceItem;
           var services = ["mysql", "redis", "postgres", "mongo", "oracle"];
           var result;

           for (var i = 0; i < services.length; i++) {
               var regExp = new RegExp(services[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
               result = regExp.test(serviceInstances.serviceLabel);

               if (result == true) {
                   break;
               }
           }

           for (var j = 0; j < serviceItem.serviceBindings.length; j++) {
               if (serviceItem.serviceBindings[j].appGuid == appGuid) {
                   var binding = serviceItem.serviceBindings[j];
                   if (result) {
                       $scope.bindingInfos.credential = binding.credentials;
                       $scope.bindingInfos.serviceLabel = binding.serviceLabel;
                       result = false;
                   }
               }
           }

            $scope.dialogOptions = {
                title : "연결 정보",
                formName : "bindingInfoForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/serviceInstance/bindingInfoForm.html" + _VersionTail(),
                okBtnHide : true
            };
            common.showDialog($scope, $event, $scope.dialogOptions);
       };

        //연결 서비스 이름 변경
        ct.renameInst = function (serviceName) {
            var serviceNameTxt = document.getElementById('renameService-'+serviceName);
            var buttonDiv = document.getElementById('txt-'+serviceName);
            if (serviceNameTxt.style.display=='none') {
                serviceNameTxt.style.display = 'block';
                buttonDiv.style.display ='none';
            } else {
                serviceNameTxt.style.display = 'none';
                buttonDiv.style.display ='block';
            }
        };

        $scope.updateName = function (serviceName) {
            if (serviceName.length < 3) {
                common.showAlert("", "최소 3자 이상이어야 합니다.");
                return;
            }

            var newName = document.getElementsByName('renameService-'+serviceName)[0];
            var serviceGuid = newName.dataset.guid;
            var servicePlanGuid = newName.dataset.planGuid;
            $scope.main.loadingMainBody = true;
            
            var serviceInstanceBody = {};
            serviceInstanceBody.name = newName.value;
            serviceInstanceBody.servicePlanGuid = servicePlanGuid;
            serviceInstanceBody.serviceInstanceUpdate = true;
            serviceInstanceBody.serviceBindingUpdate = false;

            var serviceInstancePromise = serviceInstanceService.updateServiceInstance(serviceGuid, serviceInstanceBody);
            serviceInstancePromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_update_service_instance"));
                ct.listAllServiceInstances();
            });
            serviceInstancePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
            });
        };

        ct.listAllServiceInstances();
    })
    .controller('paasServiceInstanceCreateCtrl', function ($scope, $location, $state, $stateParams, $translate, user, common, serviceInstanceService, ValidationService, CONSTANTS) {
        _DebugConsoleLog("serviceInstanceControllers.js : paasServiceInstanceCreateCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct = this;

        ct.sltSpace 			= $scope.main.sltOrganization.spaces[0];
        ct.services 			= [];
        ct.servicePlans 		= [];
        ct.spaceApps 			= [];
        ct.sltService 			= {};
        ct.sltServiceGuid 		= "";
        ct.sltServicePlan 		= {};
        ct.sltServicePlanGuid 	= "";
        ct.sltBindingApp 		= {};
        ct.sltBindingAppGuid 	= "null";
        ct.serviceInstances 	= [];
        ct.serviceInstanceName 	= "";
        ct.actionBtnHied 		= false; // btn enabled
        ct.spaceAppsLoad 		= false;
        ct.serviceInstanceName ='service-001';
        ct.servicesLoad         = false;

        ct.sltServiceChange = function (serviceGuid) {
            var sltService = common.objectsFindCopyByField(ct.services, "guid", serviceGuid);
            ct.sltService = {};
            ct.servicePlans = [];
            ct.sltServicePlan = {};
            ct.sltServicePlanGuid = "";
            if (sltService && sltService.guid) {
                ct.sltService = sltService;
                ct.sltServiceGuid = sltService.guid;
                if (sltService.servicePlans && sltService.servicePlans.length && sltService.servicePlans.length > 0) {
                    ct.servicePlans = angular.copy(sltService.servicePlans);
                    ct.sltServicePlanChange(ct.servicePlans[0].guid);
                }
            } else {
                ct.sltService = {};
                ct.sltServiceGuid = "";
                ct.servicePlans = [];
                ct.sltServicePlan = {};
                ct.sltServicePlanGuid = "";
            }
        };

        ct.sltServicePlanChange = function (servicePlanGuid) {
            var sltServicePlan = common.objectsFindCopyByField(ct.servicePlans, "guid", servicePlanGuid);
            if (sltServicePlan && sltServicePlan.guid) {
                ct.sltServicePlan = sltServicePlan;
                ct.sltServicePlanGuid = sltServicePlan.guid;
            } else {
                ct.sltServicePlan = {};
                ct.sltServicePlanGuid = "";
            }
        };
        
        ct.listAllSpaceApps = function (spaceGuid) {
            ct.spaceApps    = [];
            var resultPromise = serviceInstanceService.listAllSpaceApps(spaceGuid);
            resultPromise.success(function (data) {
                ct.spaceApps = data;
                ct.spaceAppsLoad = true;
            });
            resultPromise.error(function (data, status, headers) {
                ct.spaceApps = [];
                ct.spaceAppsLoad = true;
            });
        };

        /*Service 목록 조회*/
        ct.listAllServices = function () {
            $scope.main.loadingMainBody = true;
            var resultPromise = serviceInstanceService.listAllServices();
            resultPromise.success(function (data) {
                //ct.services = data;
                angular.forEach(data, function (service) {
                    angular.forEach(service.servicePlans, function (servicePlan) {
                        servicePlan.quota = servicePlan.name.replace("mb", ' Megabyte');
                    });
                    //서비스브로커 : oracle 제외. 2019.06.27
                    if (service.label.toLowerCase().indexOf("oracle") == -1) {
                        ct.services.push(service);
                    }
                });
                ct.sltServiceChange(ct.services[0].guid);
                ct.servicesLoad = true;
                $scope.main.loadingMainBody = false;
            });
            resultPromise.error(function (data, status, headers) {
                ct.services = [];
                ct.servicesLoad = true;
                $scope.main.loadingMainBody = false;
            });
        };

        ct.actionCheck = false;
        ct.serviceInstanceCreate = function () {
            if (ct.actionCheck) return;
            ct.actionCheck = true;

            if (ct.serviceInstanceName.length < 3) {
                common.showAlert("", "최소 3자 이상이어야 합니다.");
                ct.actionCheck = false;
                return;
            }

            var serviceInstanceBody = {};
            serviceInstanceBody.name = ct.serviceInstanceName;
            serviceInstanceBody.spaceGuid = ct.sltSpace.guid;
            serviceInstanceBody.servicePlanGuid = ct.sltServicePlanGuid;

            if (ct.sltBindingAppGuid && ct.sltBindingAppGuid != "null") {
                var serviceBindings = [];
                serviceBindings.push({ "appGuid" : ct.sltBindingAppGuid });
                serviceInstanceBody.serviceBindings = serviceBindings;
            }

            $scope.main.loadingMainBody = true;
            var serviceInstancePromise = serviceInstanceService.createServiceInstance(serviceInstanceBody);
            serviceInstancePromise.success(function (data) {
                ct.actionCheck = false;
                $scope.main.loadingMainBody = false;
                common.showAlert("", $translate.instant("message.mi_create_service_instance"));
                $scope.main.goToPage("/paas/serviceInstances");
            });
            serviceInstancePromise.error(function (data) {
                ct.actionCheck = false;
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllServices();
        ct.listAllSpaceApps(ct.sltSpace.guid);

    })
    .controller('serviceInstanceFormCtrl', function ($scope, $location, $state, $stateParams, $translate, user, common, serviceInstanceService, ValidationService, CONSTANTS) {
        _DebugConsoleLog("serviceInstanceControllers.js : serviceInstanceFormCtrl", 1);

        var pop = this;
        var vs = new ValidationService();
        $scope.actionLoading = true;

        pop.organizations = angular.copy($scope.main.organizations);
        if (angular.isObject($scope.contents.serviceInstanceData)) {
            pop.serviceInstanceData = angular.copy($scope.contents.serviceInstanceData);
        } else {
            pop.serviceInstanceData = {};
        }
        pop.serviceInstance = {};
        pop.sltOrganizationGuid = "";
        pop.sltOrganization = {};
        pop.spaces = [];
        pop.sltSpace = {};
        pop.sltSpaceGuid = "";
        pop.services = [];
        pop.sltServiceInstanceName = "";
        pop.sltServiceGuid = "";
        pop.sltServiceLabel = "";
        pop.sltService = {};
        pop.servicePlans = [];
        pop.sltServicePlan = {};
        pop.sltServicePlanGuid = "";
        pop.apps = [];
        pop.sltAppGuids = [];
        pop.serviceBindings = [];

        pop.formName = "serviceInstanceForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        if (pop.serviceInstanceData.guid) {
            $scope.dialogOptions.title = $translate.instant("label.paas_service_edit");
            $scope.dialogOptions.okName =  $translate.instant("label.edit");
            pop.serviceInstance = angular.copy(pop.serviceInstanceData);
            pop.sltOrganizationGuid = pop.serviceInstance.organizationGuid;
            $scope.dialogOptions.templateUrl = _PAAS_VIEWS_ + "/serviceInstance/popServiceInstanceUpdateForm.html" + _VersionTail();
        } else {
            if ($scope.main.sltOrganizationGuid) {
                pop.sltOrganizationGuid = $scope.main.sltOrganizationGuid;
            }
            if ($scope.dialogOptions.serviceMarket) {
                pop.serviceMarket = $scope.dialogOptions.serviceMarket;
            }
            if ($scope.dialogOptions.sltServiceMarket) {
                pop.sltServiceGuid = $scope.dialogOptions.sltServiceMarket.serviceGuid;
                pop.sltServiceLabel = $scope.dialogOptions.sltServiceMarket.serviceLabel;
                pop.sltServicePlanGuid  = $scope.dialogOptions.sltServiceMarket.servicePlanGuid;
                pop.sltServicePlanName = $scope.dialogOptions.sltServiceMarket.servicePlanName;
                pop.serviceInstance = angular.copy($scope.dialogOptions.sltServiceMarket);
            }
            $scope.dialogOptions.title = $translate.instant("label.paas_service_add");
            $scope.dialogOptions.okName =  $translate.instant("label.add");
            $scope.dialogOptions.templateUrl = _PAAS_VIEWS_ + "/serviceInstance/popServiceInstanceCreateForm.html" + _VersionTail();
        }

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if (!pop.serviceInstanceData.guid) {
                pop.createServiceInstanceAction(pop.serviceInstanceData);
            } else {
                pop.updateServiceInstanceAction(pop.serviceInstanceData);
            }
        };

        $scope.popCancel = function () {
            $scope.main.sltService = {};
            $scope.main.serviceMarket = false;
            $scope.popHide();
        };

        pop.getServiceInstance = function (guid) {
            var servicePromise = serviceInstanceService.getServiceInstance(guid);
            servicePromise.success(function (data) {
                pop.sltServiceInstanceName = data.name;
                pop.sltOrganizationGuid = data.organizationGuid;
                pop.sltOrganizationName = data.organizationName;
                pop.sltSpaceGuid = data.spaceGuid;
                pop.sltSpaceName = data.spaceName;
                pop.sltServiceGuid = data.serviceGuid;
                pop.sltServiceLabel = data.serviceLabel;
                pop.sltServicePlanGuid = data.servicePlanGuid;
                pop.sltServicePlanName = data.servicePlanName;
                pop.serviceInstanceData = angular.copy(data);
                pop.serviceInstance = angular.copy(data);
                pop.changeSpace();
                $scope.actionLoading = false;
            });
            servicePromise.error(function (data) {
                pop.sltOrganization = {};
                $scope.actionLoading = false;
            });
        };

        pop.getOrganization = function (guid) {
            var organizationPromise = serviceInstanceService.getOrganization(guid);
            organizationPromise.success(function (data) {
                pop.sltOrganization = data;
                pop.sltOrganizationGuid = data.guid;
                pop.sltOrganizationName = data.name;
                pop.spaces = angular.copy(data.spaces);
                $scope.actionLoading = false;
            });
            organizationPromise.error(function (data) {
                pop.sltOrganization = {};
                $scope.actionLoading = false;
            });
        };

        pop.changeOrganization = function () {
            if (pop.sltOrganizationGuid) {
                pop.sltOrganization = common.objectsFindCopyByField(pop.organizations, "guid", pop.sltOrganizationGuid);
                pop.spaces = angular.copy(pop.sltOrganization.spaces);
                if (pop.serviceInstance.spaceGuid) {
                    pop.sltSpace = common.objectsFindCopyByField(pop.spaces, "guid", pop.serviceInstanceData.spaceGuid);
                    if (!pop.sltSpace || !pop.sltSpace.guid) {
                        pop.sltSpaceGuid = "";
                    } else {
                        pop.sltSpaceGuid = pop.serviceInstance.spaceGuid;
                    }
                } else {
                    pop.sltSpace = {};
                    pop.sltSpaceGuid = "";
                }
            } else {
                pop.sltOrganization = {};
                pop.spaces = [];
                pop.sltSpace = {};
                pop.sltSpaceGuid = "";
            }
            pop.changeSpace();
        };

        pop.changeSpace = function () {
            if (pop.sltSpaceGuid) {
                if (pop.serviceInstance.spaceGuid) {
                    pop.sltSpace = angular.copy(pop.serviceInstance.space);
                    pop.serviceBindings = angular.copy(pop.serviceInstance.serviceBindings);
                } else {
                    pop.sltSpace = common.objectsFindCopyByField(pop.spaces, "guid", pop.sltSpaceGuid);
                    pop.serviceBindings = [];
                }
                pop.sltSpaceName = pop.sltSpace.name;
                pop.resetDataApps();
                pop.sltAppGuids = [];
            } else {
                pop.sltSpace = {};
                pop.servicePlans = [];
                pop.sltSpacePlan = {};
                pop.serviceInstanceData.servicePlanGuid = "";
                pop.apps = [];
                pop.sltAppGuids = [];
                pop.serviceBindings = [];
            }
        };

        pop.resetDataApps = function () {
            pop.apps    = [];
            for (var i=0; i<pop.sltSpace.apps.length; i++) {
                var isBindingApp = false;
                for (var j=0; j<pop.serviceBindings.length; j++) {
                    if (pop.serviceBindings[j].appGuid == pop.sltSpace.apps[i].guid) {
                        isBindingApp = true;
                        break;
                    }
                }
                if (!isBindingApp) {
                    pop.apps.push(angular.copy(pop.sltSpace.apps[i]));
                }
            }
        };

        pop.listAllOrganizations = function () {
            var organizationPromise = serviceInstanceService.listAllOrganizations();
            organizationPromise.success(function (data) {
                $scope.main.organizations = angular.copy(data);
                $scope.main.syncListAllPortalOrgs();
                pop.organizations = $scope.main.sinkPotalOrgsName(data);
                pop.changeOrganization();
                $scope.actionLoading = false;
            });
            organizationPromise.error(function (data) {
                pop.organizations = [];
                $scope.actionLoading = false;
            });
        };

        pop.getService = function (guid) {
            var servicePromise = serviceInstanceService.getService(guid);
            servicePromise.success(function (data) {
                pop.sltService = data;
                pop.sltServicePlanGuid = pop.serviceInstance.servicePlanGuid;
                pop.servicePlans = angular.copy(pop.sltService.servicePlans);
                if (pop.sltServicePlanGuid) {
                    pop.sltServicePlan = common.objectsFindCopyByField(pop.servicePlans, "guid", pop.sltServicePlanGuid);
                }
            });
            servicePromise.error(function (data) {
                pop.sltService = {};
                $scope.actionLoading = false;
            });
        };

        pop.listAllServices = function (guid) {
            var servicePromise = serviceInstanceService.listAllServices(guid);
            servicePromise.success(function (data) {
                pop.services = data;
            });
            servicePromise.error(function (data) {
                pop.services = [];
                $scope.actionLoading = false;
            });
        };

        pop.changeService = function () {
            if (pop.sltServiceGuid) {
                pop.sltService = common.objectsFindCopyByField(pop.services, "guid", pop.sltServiceGuid);
                if (pop.sltService && pop.sltService.servicePlans) {
                    pop.servicePlans = angular.copy(pop.sltService.servicePlans);
                } else {
                    pop.servicePlans = [];
                }
                pop.sltServicePlanGuid = "";
                pop.sltServicePlan = {};
            } else {
                pop.sltService = {};
                pop.servicePlans = [];
                pop.sltServicePlan = {};
                pop.sltServicePlanGuid = "";
            }
        };

        pop.createServiceInstanceAction = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var serviceInstanceBody = {};
            serviceInstanceBody.name = pop.sltServiceInstanceName;
            serviceInstanceBody.spaceGuid = pop.sltSpaceGuid;
            serviceInstanceBody.servicePlanGuid = pop.sltServicePlanGuid;
            var serviceBindings = [];
            if (pop.serviceBindings && pop.serviceBindings.length > 0) {
                serviceBindings = angular.copy(pop.serviceBindings);
            }
            if (pop.sltAppGuids && pop.sltAppGuids.length > 0) {
                for (var i=0; i<pop.sltAppGuids.length; i++) {
                    serviceBindings.push({ "appGuid" : pop.sltAppGuids[i] });
                }
            }
            if (serviceBindings && serviceBindings.length > 0) {
                serviceInstanceBody.serviceBindings = serviceBindings;
            }
            $scope.main.sltService = {};
            $scope.main.serviceMarket = false;
            var serviceInstancePromise = serviceInstanceService.createServiceInstance(serviceInstanceBody);
            serviceInstancePromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.popHide();
                if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                    $scope.dialogOptions.callBackFunction(data);
                }
                if ($scope.main.sltService) {
                    $location.path('/service_instances');
                }
            });
            serviceInstancePromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        pop.updateServiceInstanceAction = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (!vs.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }

            var changed = false;
            var bindingChanged = false;
            if (pop.sltServiceInstanceName != pop.serviceInstance.name
                || pop.sltServicePlanGuid != pop.serviceInstance.servicePlanGuid ) {
                changed = true;
            }
            var serviceBindings = [];
            if (pop.serviceBindings && pop.serviceBindings.length > 0) {
                for (var i=0; i<pop.serviceBindings.length; i++) {
                    if (pop.serviceBindings[i].delCheck) {
                        bindingChanged = true;
                    } else {
                        serviceBindings.push(pop.serviceBindings[i]);
                    }
                }
            }
            if (pop.sltAppGuids && pop.sltAppGuids.length > 0) {
                for (var i=0; i<pop.sltAppGuids.length; i++) {
                    serviceBindings.push({ "appGuid" : pop.sltAppGuids[i] });
                }
                bindingChanged = true;
            }

            $scope.actionLoading = true;
            var serviceInstanceBody = {};
            serviceInstanceBody.name = pop.sltServiceInstanceName;
            serviceInstanceBody.servicePlanGuid = pop.sltServicePlanGuid;
            serviceInstanceBody.serviceInstanceUpdate = changed;
            if (bindingChanged) {
                serviceInstanceBody.serviceBindings = serviceBindings;
                serviceInstanceBody.serviceBindingUpdate = true;
            }
            var serviceInstancePromise = serviceInstanceService.updateServiceInstance(pop.serviceInstance.guid, serviceInstanceBody);
            serviceInstancePromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.popHide();
                if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                    $scope.dialogOptions.callBackFunction(data);
                }
            });
            serviceInstancePromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        if (pop.serviceInstance && pop.serviceInstance.guid) {
            pop.getService(pop.serviceInstance.serviceGuid);
            pop.getServiceInstance(pop.serviceInstance.guid);
        } else {
            if (!$scope.main.serviceMarket) {
                pop.listAllServices();
            }
            pop.listAllOrganizations();
        }
    })
    .controller('userServiceInstanceFormCtrl', function ($scope, $location, $state, $stateParams, $translate, user, common, serviceInstanceService, ValidationService, CONSTANTS) {
        _DebugConsoleLog("userServiceInstanceControllers.js : userServiceInstanceFormCtrl", 1);

        var pop = this;
        var vs = new ValidationService();
        $scope.actionLoading = true;

        pop.organizations = angular.copy($scope.main.organizations);
        if (angular.isObject($scope.contents.userServiceInstanceData)) {
            pop.userServiceInstanceData = angular.copy($scope.contents.userServiceInstanceData);
        } else {
            pop.userServiceInstanceData = {};
        }
        pop.userServiceInstance = {};
        pop.sltOrganizationGuid = "";
        pop.sltOrganization = {};
        pop.spaces = [];
        pop.sltSpace = {};
        pop.sltSpaceGuid = "";
        pop.sltUserServiceInstanceName = "";
        pop.servicePlans = [];
        pop.apps = [];
        pop.sltAppGuids = [];
        pop.serviceBindings = [];
        pop.credentials = [];

        pop.formName = "userServiceInstanceForm";
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        if (pop.userServiceInstanceData.guid) {
            $scope.dialogOptions.title = $translate.instant("label.user_service_edit");
            $scope.dialogOptions.okName =  $translate.instant("label.edit");
            pop.userServiceInstance = angular.copy(pop.userServiceInstanceData);
            pop.sltOrganizationGuid = pop.userServiceInstance.organizationGuid;
            if (angular.isObject(pop.userServiceInstance.credentials)) {
                for (var key = 0; key < pop.userServiceInstance.credentials.length; key++) {
                    pop.credentials.push({ "key" : key, value : pop.userServiceInstance.credentials[key] });
                }
            }
            $scope.dialogOptions.templateUrl = _PAAS_VIEWS_ + "/serviceInstance/popUserServiceInstanceUpdateForm.html" + _VersionTail();
        } else {
            if ($scope.main.sltOrganizationGuid) {
                pop.sltOrganizationGuid = $scope.main.sltOrganizationGuid;
            }
            $scope.dialogOptions.title = $translate.instant("label.user_service_add");
            $scope.dialogOptions.okName =  $translate.instant("label.add");
            $scope.dialogOptions.templateUrl = _PAAS_VIEWS_ + "/serviceInstance/popUserServiceInstanceCreateForm.html" + _VersionTail();
        }
        if (pop.credentials.length == 0) {
            pop.credentials.push({ "key" : "", value : "" });
        }

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if (!pop.userServiceInstanceData.guid) {
                pop.createUserServiceInstanceAction(pop.userServiceInstanceData);
            } else {
                pop.updateUserServiceInstanceAction(pop.userServiceInstanceData);
            }
        };

        pop.getUserServiceInstance = function (guid) {
            var serviceInstancePromise = serviceInstanceService.getUserServiceInstance(guid);
            serviceInstancePromise.success(function (data) {
                pop.sltUserServiceInstanceName = data.name;
                pop.sltOrganizationGuid = data.organizationGuid;
                pop.sltOrganizationName = data.organizationName;
                pop.sltSpaceGuid = data.spaceGuid;
                pop.sltSpaceName = data.spaceName;
                pop.userServiceInstanceData = angular.copy(data)
                pop.userServiceInstance = angular.copy(data);
                pop.changeSpace();
                pop.credentials = [];
                if (angular.isObject(pop.userServiceInstance.credentials)) {
                    for (var key = 0; key < pop.userServiceInstance.credentials.length; key++) {
                        pop.credentials.push({ "key" : key, value : pop.userServiceInstance.credentials[key] });
                    }
                }
                if (pop.credentials.length == 0) {
                    pop.credentials.push({ "key" : "", value : "" });
                }
                $scope.actionLoading = false;
            });
            serviceInstancePromise.error(function (data) {
                pop.sltOrganization = {};
                pop.credentials = [];
                $scope.actionLoading = false;
            });
        };

        pop.getOrganization = function (guid) {
            var organizationPromise = serviceInstanceService.getOrganization(guid);
            organizationPromise.success(function (data) {
                pop.sltOrganization = data;
                pop.sltOrganizationGuid = data.guid;
                pop.sltOrganizationName = data.name;
                pop.spaces = angular.copy(data.spaces);
                $scope.actionLoading = false;
            });
            organizationPromise.error(function (data) {
                pop.sltOrganization = {};
                $scope.actionLoading = false;
            });
        };

        pop.changeOrganization = function () {
            if (pop.sltOrganizationGuid) {
                pop.sltOrganization = common.objectsFindCopyByField(pop.organizations, "guid", pop.sltOrganizationGuid);
                pop.spaces = angular.copy(pop.sltOrganization.spaces);
                if (pop.userServiceInstance.spaceGuid) {
                    pop.sltSpace = common.objectsFindCopyByField(pop.spaces, "guid", pop.userServiceInstanceData.spaceGuid);
                    if (!pop.sltSpace || !pop.sltSpace.guid) {
                        pop.sltSpaceGuid = "";
                    } else {
                        pop.sltSpaceGuid = pop.userServiceInstance.spaceGuid;
                    }
                }
            } else {
                pop.sltOrganization = {};
                pop.spaces = [];
                pop.sltSpace = {};
                pop.sltSpaceGuid = "";
            }
            pop.changeSpace();
        };

        pop.changeSpace = function () {
            if (pop.sltSpaceGuid) {
                if (pop.userServiceInstance.spaceGuid) {
                    pop.sltSpace = angular.copy(pop.userServiceInstance.space);
                    pop.serviceBindings = angular.copy(pop.userServiceInstance.serviceBindings);
                } else {
                    pop.sltSpace = common.objectsFindCopyByField(pop.spaces, "guid", pop.sltSpaceGuid);
                    pop.serviceBindings = [];
                }
                pop.sltSpaceName = pop.sltSpace.name;
                pop.resetDataApps();
                pop.sltAppGuids = [];
            } else {
                pop.sltSpace = {};
                pop.servicePlans = [];
                pop.sltSpacePlan = {};
                pop.userServiceInstanceData.servicePlanGuid = "";
                pop.apps = [];
                pop.sltAppGuids = [];
                pop.serviceBindings = [];
            }
        };

        pop.resetDataApps = function () {
            pop.apps    = [];
            for (var i=0; i<pop.sltSpace.apps.length; i++) {
                var isBindingApp = false;
                for (var j=0; j<pop.serviceBindings.length; j++) {
                    if (pop.serviceBindings[j].appGuid == pop.sltSpace.apps[i].guid) {
                        isBindingApp = true;
                        break;
                    }
                }
                if (!isBindingApp) {
                    pop.apps.push(angular.copy(pop.sltSpace.apps[i]));
                }
            }
        };

        pop.listAllOrganizations = function () {
            var organizationPromise = serviceInstanceService.listAllOrganizations();
            organizationPromise.success(function (data) {
                $scope.main.organizations = angular.copy(data);
                $scope.main.syncListAllPortalOrgs();
                pop.organizations = $scope.main.sinkPotalOrgsName(data);
                pop.changeOrganization();
                $scope.actionLoading = false;
            });
            organizationPromise.error(function (data) {
                pop.organizations = [];
                $scope.actionLoading = false;
            });
        };

        pop.addCredential = function () {
            pop.credentials.push({ "key" : "", value : "" });
        };

        pop.delCredential = function (idx) {
	        if (pop.credentials.length == 1) {
		        pop.credentials[idx].key = "";
		        pop.credentials[idx].value = "";
	        } else {
		        pop.credentials.splice(idx, 1);
	        }
        };

        pop.createUserServiceInstanceAction = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var userServiceInstanceBody = {};
            userServiceInstanceBody.name = pop.sltUserServiceInstanceName;
            userServiceInstanceBody.spaceGuid = pop.sltSpaceGuid;
            userServiceInstanceBody.credentials = {};
            if (angular.isArray(pop.credentials) && pop.credentials.length > 0) {
                for (var i=0; i<pop.credentials.length; i++) {
                    if (pop.credentials[i].key) {
                        if (userServiceInstanceBody.credentials[pop.credentials[i].key]) {
                            if (pop.credentials[i].value) {
                                userServiceInstanceBody.credentials[pop.credentials[i].key] = pop.credentials[i].value;
                            }
                        } else {
                            userServiceInstanceBody.credentials[pop.credentials[i].key] = pop.credentials[i].value;
                        }
                    }
                }
            }
            var serviceBindings = [];
            if (pop.serviceBindings && pop.serviceBindings.length > 0) {
                serviceBindings = angular.copy(pop.serviceBindings);
            }
            if (pop.sltAppGuids && pop.sltAppGuids.length > 0) {
                for (var i=0; i<pop.sltAppGuids.length; i++) {
                    serviceBindings.push({ "appGuid" : pop.sltAppGuids[i] });
                }
            }
            if (serviceBindings && serviceBindings.length > 0) {
                userServiceInstanceBody.serviceBindings = serviceBindings;
            }
            var servicePromise = serviceInstanceService.createUserServiceInstance(userServiceInstanceBody);
            servicePromise.success(function (data) {
                $scope.contents.listUserServiceInstances();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.popHide();
            });
            servicePromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        pop.updateUserServiceInstanceAction = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (!vs.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }

            var changed = false;
            var bindingChanged = false;
            if (pop.sltUserServiceInstanceName != pop.userServiceInstance.name) {
                changed = true;
            }
            var credentials = {};
            if (angular.isArray(pop.credentials) && pop.credentials.length > 0) {
                for (var i=0; i<pop.credentials.length; i++) {
                    if (pop.credentials[i].key) {
                        if (credentials[pop.credentials[i].key]) {
                            if (pop.credentials[i].key.value) {
                                credentials[pop.credentials[i].key] = pop.credentials[i].value;
                            }
                        } else {
                            credentials[pop.credentials[i].key] = pop.credentials[i].value;
                        }
                    }
                }
            }
            for (var key = 0; key < pop.userServiceInstance.credentials.length; key++) {
                if (angular.isUndefined(credentials[key]) || credentials[key] != pop.userServiceInstance.credentials[key]) {
                    changed = true;
                }
            }
            for (var key = 0; key < credentials.length; key++) {
                if (angular.isUndefined(pop.userServiceInstance.credentials[key]) || credentials[key] != pop.userServiceInstance.credentials[key]) {
                    changed = true;
                }
            }
            var serviceBindings = [];
            if (pop.serviceBindings && pop.serviceBindings.length > 0) {
                for (var i=0; i<pop.serviceBindings.length; i++) {
                    if (pop.serviceBindings[i].delCheck) {
                        bindingChanged = true;
                    } else {
                        serviceBindings.push(pop.serviceBindings[i]);
                    }
                }
            }
            if (pop.sltAppGuids && pop.sltAppGuids.length > 0) {
                for (var i=0; i<pop.sltAppGuids.length; i++) {
                    serviceBindings.push({ "appGuid" : pop.sltAppGuids[i] });
                }
                bindingChanged = true;
            }

            $scope.actionLoading = true;
            var userServiceInstanceBody = {};
            userServiceInstanceBody.name = pop.sltUserServiceInstanceName;
            userServiceInstanceBody.credentials = credentials;
            userServiceInstanceBody.serviceInstanceUpdate = changed;
            if (bindingChanged) {
                userServiceInstanceBody.serviceBindings = serviceBindings;
                userServiceInstanceBody.serviceBindingUpdate = true;
            }
            var serviceInstance = serviceInstanceService.updateUserServiceInstance(pop.userServiceInstance.guid, userServiceInstanceBody);
            serviceInstance.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.contents.listUserServiceInstances();
                $scope.popHide();
            });
            serviceInstance.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };
        if (pop.userServiceInstance && pop.userServiceInstance.guid) {
            pop.getUserServiceInstance(pop.userServiceInstance.guid);
        } else {
            pop.listAllOrganizations();
        }
    })
    .controller('paasServiceInstancesPushCtrl', function ($scope, $location, $state, $stateParams, $translate, $cookies, $route, user, common, serviceInstanceService, serviceService, CONSTANTS, $timeout) {
            _DebugConsoleLog("serviceInstanceControllers.js : paasServiceInstancesPushCtrl", 1);

            var ct = this;
            var serviceInstance = $scope.serviceInstance = {};

            $scope.serviceInstance.serviceInstances = [];

            $scope.actionLoading = false; // action loading
            $scope.authenticating = false; // action loading massage contents
            $scope.actionBtnHied = false; // btn enabled

            $scope.services = {

            };

            $scope.plans = {

            };

            $scope.radio = {
              name: '',
              description : '',
              inputName : '',
              planName : '',
              planId : '',
              serviceId : '',
            };

            // 서비스 선택 스크롤 생성
            ct.scrollPane = function (){
            	setTimeout(function() {
            		var scrollPane = $('.scroll-pane').jScrollPane({});
            	}, 250);
            }
            
            
            $scope.showDescript = function (test) {
              var contentList = $scope.services;
              for (var content in contentList) {
                  //문자열 포함하는지 확인, 나중에 정규식으로 바꾸던가 하셈
                  if(contentList[content].label.match(test)) {
                      $scope.radio.description = contentList[content].description;
                      $scope.plans = angular.copy(contentList[content].servicePlans);
                      $scope.radio.planId = $scope.plans[0].guid;
                      break;
                  }
              }
                $timeout(function () {
                    $('input:radio[name=radioSev]:eq(0)').click();
                }, 10);

          }

          $scope.planChange = function (planId, serviceGuid) {
            $scope.radio.planId = planId;
            $scope.radio.serviceId = serviceGuid;
          }

            ct.servicePageOptions = {
                currentPage : 1,
                pageSize : 10,
                total : 1
            };

            /*Service 목록 조회*/
            ct.listServices = function (currentPage) {
                $scope.main.loadingMainBody = true;
                if (currentPage == undefined || null) currentPage = 1;
                ct.servicePageOptions.currentPage = currentPage;
                var domainPromise = serviceInstanceService.listServices(ct.servicePageOptions.pageSize, currentPage-1, "");
                domainPromise.success(function (data) {
                    $scope.services = data.content;
                    ct.servicePageOptions.total = data.totalElements;
                    $scope.main.loadingMainBody = false;

                    $timeout(function () {
                        //참고용
                        $('#serviceInstancesThumList').jScrollPane({});
                        $('input:radio[name=sevSel-radio]:eq(0)').click();
                        $scope.showDescript(data.content[0].label);
                    }, 10);
                });
                domainPromise.error(function (data, status, headers) {
                    $scope.services = [];
                    $scope.main.loadingMainBody = false;
                });
            };

            ct.servicePush = function () {
                if ($scope.radio.inputName.length < 3) {
                    common.showAlert("", "최소 3자 이상이어야 합니다.");
                    return;
                }

              $scope.main.loadingMainBody = true;
              var serviceInstanceBody = {};
              serviceInstanceBody.name = $scope.radio.inputName;
              serviceInstanceBody.spaceGuid = $scope.main.sltOrganization.spaces[0].guid;
              serviceInstanceBody.servicePlanGuid = $scope.radio.planId;

              var serviceInstancePromise = serviceInstanceService.createServiceInstance(serviceInstanceBody);
                serviceInstancePromise.success(function (data) {
                    $scope.main.loadingMainBody = false;
                    $scope.actionBtnHied = false;
                    common.showAlert("", $translate.instant("message.mi_create_service_instance"));
                    $state.go($state.current, {}, {reload: true});
                });
                serviceInstancePromise.error(function (data) {
                    $scope.main.loadingMainBody = false;
                    $scope.actionBtnHied = false;
                });
            }
            ct.listServices();
        })
    ;

