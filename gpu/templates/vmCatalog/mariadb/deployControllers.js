'use strict';

angular.module('gpu.controllers')
    .controller('mariadbDeployCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("mariadb deployControllers.js : mariadbDeployCtrl", 1);
        var ct = $scope.$parent.$parent.contents;

        ct.vs = new ValidationService({controllerAs : $scope.subPage});

        ct.deployTypeReplicaSuport = true;
        ct.deployTypeClusterSuport = true;
        ct.data.replicaCnt = 2;
        ct.data.servicePort = 3306;
        ct.data.deployType = 'single';
        ct.data.cerateUser = true;
        ct.data.octaviaLbUse = true;
        ct.data.volumeUse = true;
        ct.data.lbSvcPort = 3306;
        ct.data.lbAlgorithm = "ROUND_ROBIN";
        ct.data.volumeType = "RBD";
        ct.data.volumeMountPoint = "/dev/vdb";
        ct.data.volumeMountPath = "/mnt/data";

        ct.checkClickBtn = false;
        ct.fn.createVmCatalogDeploy = function () {
            if (ct.checkClickBtn) return;
            ct.checkClickBtn = true;
            if (!ct.vs.checkFormValidity($scope['subPage'])) {
                ct.checkClickBtn = false;
                return;
            }

            ct.fn.loadVmCatalogDeployTemplateAndAction(ct.vmCatalogInfo.templatePath, ct.vmCatalogTemplateInfo.deployTemplates[ct.data.deployType], function (deployTemplate) {

                var vmCatalogDeploy = {};

                vmCatalogDeploy.vmCatalogInfoId = ct.vmCatalogInfo.id;
                vmCatalogDeploy.version = ct.vmCatalogInfo.version;
                vmCatalogDeploy.deployName = ct.data.deployName;
                vmCatalogDeploy.deployType = ct.data.deployType;
                vmCatalogDeploy.deployTemplate = deployTemplate;
                vmCatalogDeploy.context = {};
                vmCatalogDeploy.context.volumeUse = ct.data.volumeUse;
                vmCatalogDeploy.context.createUser = ct.data.createUser;
                vmCatalogDeploy.parameters = {};
                vmCatalogDeploy.parameters.image = ct.vmCatalogTemplateInfo.images[ct.data.deployType];
                vmCatalogDeploy.parameters.availability_zone = ct.data.availabilityZone;
                vmCatalogDeploy.parameters.flavor = ct.data.flavor;
                vmCatalogDeploy.parameters.key_name = ct.data.keyName;
                vmCatalogDeploy.parameters.security_group = ct.data.securityGroup;
                vmCatalogDeploy.parameters.provider_net = ct.data.providerNet;
                vmCatalogDeploy.parameters.provider_subnet = ct.data.providerSubnet;
                vmCatalogDeploy.parameters.service_port = ct.data.servicePort;
                vmCatalogDeploy.parameters.root_password = ct.data.rootPassword;
                if (ct.data.cerateUser) {
                    vmCatalogDeploy.parameters.create_user_id = ct.data.createUserId;
                    vmCatalogDeploy.parameters.create_user_password = ct.data.createUserPassword;
                    vmCatalogDeploy.parameters.create_db_name = ct.data.createDbName;
                }
                if (ct.data.volumeUse) {
                    vmCatalogDeploy.parameters.volume_type = ct.data.volumeType;
                    vmCatalogDeploy.parameters.volume_size = ct.data.volumeSize;
                    vmCatalogDeploy.parameters.volume_mount_point = ct.data.volumeMountPoint;
                    vmCatalogDeploy.parameters.volume_mount_path = ct.data.volumeMountPath;
                }

                $scope.main.loadingMainBody = true;
                var promise = vmCatalogService.createVmCatalogDeploy(ct.tenantId, vmCatalogDeploy);
                promise.success(function (data) {
                    if (angular.isObject(data.content) && angular.isNumber(data.content.id) && data.content.id > 0) {
                        $scope.main.goToPage("/gpu/vmCatalogDeploy/view/" + data.content.id);
                    } else {
                        $scope.main.loadingMainBody = false;
                    }
                    ct.checkClickBtn = false;
                });
                promise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    ct.checkClickBtn = false;
                });
            });
        };

    })
;
