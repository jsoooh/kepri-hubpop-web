'use strict';

angular.module('iaas.controllers')
    .controller('iaasDeployLbServicePortFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, popType, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployLbServicePortFormCtrl", 1);

        var portPop = this;

        portPop.validationService = new ValidationService({controllerAs : portPop});
        portPop.fn = {};

        var dialogOptions = popType == "child" ? $scope.childDialogOptions : $scope.dialogOptions;

        portPop.selector = dialogOptions.selector;
        portPop.callBackFunction = dialogOptions.callBackFunction;
        portPop.formMode = dialogOptions.formMode;
        portPop.deployServer = dialogOptions.deployServer;
        portPop.usingPorts = {};

        if (portPop.deployServer.servicePorts && portPop.deployServer.servicePorts.length > 0) {
            angular.forEach(portPop.deployServer.servicePorts, function (servicePort, key) {
                portPop.usingPorts[servicePort.sourcePort] = true;
                if (servicePort.protocolType == "http" && servicePort.sslUsed && servicePort.sslSourcePort) {
                    portPop.usingPorts[servicePort.sslSourcePort] = true;
                }
            });
        }

        portPop.serviceType = "LB";
        portPop.sltProtocolDiabled = false;
        if (portPop.formMode == "mod") {
            portPop.orgServicePort = angular.copy(dialogOptions.servicePort);
            if (portPop.orgServicePort.serviceInstance && portPop.orgServicePort.serviceInstance.id) {
                portPop.serviceType = portPop.orgServicePort.serviceInstance.serviceType;
            }
            portPop.servicePort = angular.copy(portPop.orgServicePort);
            delete portPop.usingPorts[portPop.orgServicePort.sourcePort];
            if (portPop.servicePort.protocolType == "http" && portPop.servicePort.sslUsed) {
                delete portPop.usingPorts[portPop.servicePort.sslSourcePort];
            } else {
                portPop.sltProtocol = portPop.servicePort.protocolType;
            }
            if (portPop.servicePort.protocolType == "http") {
                if (portPop.servicePort.sslUsed) {
                    portPop.sltProtocol = "https";
                } else {
                    portPop.sltProtocol = "http";
                }
            } else if (portPop.servicePort.protocolType == "mysql") {
                portPop.sltProtocolDiabled = true;
                portPop.sltProtocol = "mysql";
            }
            portPop.servicePort.sslCertType = portPop.servicePort.sslCertType ? portPop.servicePort.sslCertType : 'user_input';
            portPop.servicePort.balance = portPop.servicePort.balance ? portPop.servicePort.balance : 'source';
            portPop.servicePort.checkInter = portPop.servicePort.sslCertType ? portPop.servicePort.checkInter : 3;
            portPop.servicePort.monitorUrl = portPop.servicePort.sslCertType ? portPop.servicePort.monitorUrl : '/';

            dialogOptions.title = "LB 포트 수정";
            dialogOptions.okName =  "포트 수정";
        } else {
            portPop.servicePort = {};
            if (dialogOptions.serviceType) {
                if (dialogOptions.serviceType == "WEB") {
                    portPop.sltProtocol = "https";
                } else if (dialogOptions.serviceType == "WAS") {
                    portPop.sltProtocol = "http";
                } else if (dialogOptions.serviceType == "MYSQL") {
                    portPop.sltProtocolDiabled = true;
                    portPop.sltProtocol = "mysql";
                } else {
                    portPop.sltProtocol = "https";
                }
                portPop.serviceType = dialogOptions.serviceType;
            } else {
                portPop.sltProtocol = "https";
            }
            portPop.oldSltProtocol = portPop.sltProtocol;
            var defaultHttpPort = 8080;
            while (portPop.usingPorts[defaultHttpPort]) {
                defaultHttpPort++;
            }
            var defaultHttpsPort = 8444;
            while (portPop.usingPorts[defaultHttpsPort]) {
                defaultHttpsPort++;
            }
            var defaultMysqlPort = 3307;
            while (portPop.usingPorts[defaultMysqlPort]) {
                defaultMysqlPort++;
            }
            if (portPop.sltProtocol == "mysql") {
                portPop.servicePort.sourcePort = defaultMysqlPort;
            } else {
                portPop.servicePort.sourcePort = defaultHttpPort;
            }
            portPop.servicePort.sslSourcePort = defaultHttpsPort;
            portPop.servicePort.servicePortName =  portPop.deployServer.deployName + "-service-port-" + defaultHttpPort;
            portPop.servicePort.sslCertType = "user_input";
            portPop.servicePort.balance = "source";
            portPop.servicePort.checkInter = 3;
            portPop.servicePort.monitorUrl = "/";

            portPop.addDefaultSourcePort = portPop.servicePort.sourcePort;

            dialogOptions.title = "LB 포트 추가";
            dialogOptions.okName =  "포트 추가";
        }

        portPop.formName = "deployLbServicePortForm";

        dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeployLbServicePortForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        dialogOptions.popDialogOk = function () {
            portPop.fn.pushLbServicePort();
        };

        portPop.changeProtocol = function (protocol) {
            if (portPop.formMode == "add") {
                if (protocol == "http") {
                    if (portPop.oldSltProtocol == "mysql" && defaultMysqlPort == portPop.servicePort.sourcePort) {
                        portPop.servicePort.sourcePort = defaultHttpPort;
                    }
                } else if (protocol == "https") {
                    if (portPop.oldSltProtocol == "mysql" && defaultMysqlPort == portPop.servicePort.sourcePort) {
                        portPop.servicePort.sourcePort = defaultHttpPort;
                    }
                    portPop.servicePort.sslSourcePort = defaultHttpsPort;
                } else if (protocol == "mysql") {
                    if (defaultHttpPort == portPop.servicePort.sourcePort) {
                        portPop.servicePort.sourcePort = defaultMysqlPort;
                    }
                }
                portPop.oldSltProtocol = protocol;
            }
        };

        portPop.fn.systemPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
                return {isValid : true};
            } else {
                return {isValid : false, message: "포트범위는 [80, 443, 1024~65535] 입니다."};
            }
        };

        portPop.fn.systemLbPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (portPop.usingPorts[port]) {
                return {isValid : false, message: "이미 사용중인 포트 입니다."};
            } else {
                if (portPop.sltProtocol == "https" && portPop.servicePort.sslSourcePort == port) {
                    return {isValid : false, message: "HTTPS 포트와 같은 포트 입니다."};
                } else {
                    return portPop.fn.systemPortCustomValidationCheck(port);
                }
            }
        };

        portPop.fn.systemLbSslPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (portPop.usingPorts[port]) {
                return {isValid : false, message: "이미 사용중인 포트 입니다."};
            } else {
                if (portPop.servicePort.sourcePort == port) {
                    return {isValid : false, message: "HTTP 포트와 같은 포트 입니다."};
                } else {
                    return portPop.fn.systemPortCustomValidationCheck(port);
                }
            }
        };

        portPop.fn.pushLbServicePort = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!portPop.validationService.checkFormValidity(portPop[portPop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            if (portPop.sltProtocol == "https") {
                portPop.servicePort.protocolType = "http";
                portPop.servicePort.sslUsed = true;
            } else {
                portPop.servicePort.protocolType = portPop.sltProtocol;
                portPop.servicePort.sslUsed = false;
                portPop.servicePort.sslSourcePort = null;
                portPop.servicePort.httpsOnly = false;
            }

            var param = {};
            var method = "POST";
            if (portPop.formMode == "mod") {
                method = "PUT";
                var isUpdate = false;
                if (portPop.servicePort.servicePortName != portPop.orgServicePort.servicePortName) {
                    isUpdate = true;
                }
                if (portPop.servicePort.protocolType != portPop.orgServicePort.protocolType) {
                    isUpdate = true;
                }
                if (portPop.servicePort.sourcePort != portPop.orgServicePort.sourcePort) {
                    isUpdate = true;
                }
                if (portPop.servicePort.protocolType == "http") {
                    if (portPop.servicePort.sslUsed != portPop.orgServicePort.sslUsed) {
                        isUpdate = true;
                    }
                    if (portPop.servicePort.sslUsed) {
                        if (portPop.servicePort.sslSourcePort == portPop.orgServicePort.sslSourcePort) {
                            isUpdate = true;
                        }
                        if (portPop.servicePort.httpsOnly != portPop.orgServicePort.httpsOnly) {
                            isUpdate = true;
                        }
                    }
                } else {
                    portPop.servicePort.sslUsed = false;
                    portPop.servicePort.sslSourcePort = null;
                    portPop.servicePort.httpsOnly = false;
                }
                if (portPop.servicePort.sslCertType != portPop.orgServicePort.sslCertType) {
                    isUpdate = true;
                }
                if (portPop.servicePort.balance != portPop.orgServicePort.balance) {
                    isUpdate = true;
                }
                if (portPop.servicePort.checkInter != portPop.orgServicePort.checkInter) {
                    isUpdate = true;
                }
                if (portPop.servicePort.monitorUrl != portPop.orgServicePort.monitorUrl) {
                    isUpdate = true;
                }
                if (!isUpdate) {
                    common.showAlertWarning('변경된 사항이 없습니다.');
                    $scope.actionBtnHied = false;
                    return;
                }

                portPop.servicePort.servicePortName = portPop.servicePort.servicePortName.replace(portPop.orgServicePort.sourcePort, portPop.servicePort.sourcePort);

                param = {
                    id : portPop.servicePort.id,
                    tenantId : portPop.servicePort.tenantId,
                    deployId : portPop.servicePort.deployId,
                    floatingIp : portPop.deployServer.floatingIp,
                    servicePortName : portPop.servicePort.servicePortName,
                    name : portPop.deployServer.deployName + '-service-port-' + portPop.servicePort.sourcePort,
                    protocolType : portPop.servicePort.protocolType,
                    sourcePort : portPop.servicePort.sourcePort,
                    sslUsed : portPop.servicePort.sslUsed,
                    sslSourcePort : portPop.servicePort.sslSourcePort,
                    httpsOnly : portPop.servicePort.httpsOnly,
                    sslCertType : portPop.servicePort.sslCertType,
                    balance : portPop.servicePort.balance,
                    checkInter : portPop.servicePort.checkInter,
                    monitorUrl : portPop.servicePort.monitorUrl
                };

            } else {
                portPop.servicePort.tenantId = portPop.deployServer.tenantId;
                portPop.servicePort.deployId = portPop.deployServer.deployId;
                portPop.floatingIp = portPop.deployServer.floatingIp;
                portPop.servicePort.name = portPop.deployServer.deployName + '-service-port-' + portPop.servicePort.sourcePort;
                portPop.servicePort.servicePortName = portPop.servicePort.servicePortName.replace(portPop.addDefaultSourcePort, portPop.servicePort.sourcePort);
                param = portPop.servicePort;
            }

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/port', method, param);
            returnPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (data && angular.isDefined(data.content)) {
                    if (portPop.formMode == "mod") {
                        common.showAlertSuccess('LB 포트가 수정 되었습니다.');
                    } else {
                        common.showAlertSuccess('LB 포트가 추가 되었습니다.');
                    }
                    if (angular.isFunction(portPop.callBackFunction)) {
                        portPop.callBackFunction(data.content);
                    }
                    dialogOptions.popHide();
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlertError('오류가 발생하였습니다.');
            });
        };
    })
    .controller('iaasDeployLbServicePortLinkFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployLbServicePortLinkFormCtrl", 1);
        var pop = this;

        pop.validationService = new ValidationService({controllerAs : pop});
        pop.fn = {};
        pop.useProtocols = [];
        pop.unusingServiceInstances = [];
        pop.unusingServicePorts = [];
        pop.sltServiceInstanceId = null;
        $scope.actionBtnHied = false;

        pop.fn.changeServiceInstance = function (serviceInstanceId) {
            pop.protocolUnusingDomains = [];
            if (serviceInstanceId) {
                pop.sltServiceInstance = common.objectsFindCopyByField(pop.unusingServiceInstances, "id", serviceInstanceId);
            }
        };

        pop.fn.changeServicePort = function (lbServicePortId) {
            pop.protocolUnusingDomains = [];
            if (lbServicePortId) {
                pop.sltLbServicePort = common.objectsFindCopyByField(pop.unusingServicePorts, "id", lbServicePortId);
            }
            if (!pop.sltLbServicePort || !pop.sltLbServicePort.id) {
                pop.sltLbServicePort = {};
                pop.lbServicePortId = '';
            }
        };

        pop.fn.addLbServicePortFormOpen = function () {
            var dialogOptions = {
                controller : "iaasDeployLbServicePortFormCtrl",
                callBackFunction : pop.fn.addLbServicePortCallBackFun,
                deployServer : angular.copy(pop.lbDeployServer),
                controllerAs : "portPop",
                formMode : "add",
                serviceType : "web"
            };
            pop.addDomainDialog = common.showRightChildDialog($scope, dialogOptions);
        };

        pop.fn.addLbServicePortCallBackFun = function(servicePort) {
            if (!angular.isArray(pop.lbDeployServer.servicePorts)) {
                pop.lbDeployServer.servicePorts = [];
            }
            pop.lbDeployServer.servicePorts.push(servicePort);
            if (!angular.isArray(pop.unusingServicePorts)) {
                pop.unusingServicePorts = [];
            }
            pop.unusingServicePorts.push(servicePort);
            pop.sltLbServicePortId = '' + servicePort.id;
            pop.fn.changeServicePort(pop.sltLbServicePortId);
        };

        // Lb DeployServer 조회
        pop.fn.getLbDeployServer = function(deployServer) {
            var params = {
                tenantId : deployServer.tenantId,
                deployId : deployServer.lbDeployId
            };
            pop.lbDeployServer = {};
            pop.unusingServicePorts = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    pop.lbDeployServer = data.content[0];
                    if (pop.lbDeployServer.servicePorts && angular.isArray(pop.lbDeployServer.servicePorts) && pop.lbDeployServer.servicePorts.length > 0) {
                        angular.forEach(pop.lbDeployServer.servicePorts, function (svcPort, key) {
                            if (!svcPort.serviceInstanceId && pop.useProtocols.indexOf(svcPort.protocolType) >= 0) {
                                pop.unusingServicePorts.push(svcPort);
                            }
                        });
                        if (pop.unusingServicePorts.length > 0) {
                            pop.sltLbServicePortId = ''+pop.unusingServicePorts[0].id;
                            pop.fn.changeServicePort(pop.sltLbServicePortId);
                        }
                    }
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlertError(data.message);
            });
        };

        pop.fn.setUnusingServiceInstances = function(deployServer) {
            if (deployServer.serviceDeployments && deployServer.serviceDeployments.length > 0) {
                angular.forEach(deployServer.serviceDeployments, function (serviceDeployment, key1) {
                    if (serviceDeployment.serviceInstances && serviceDeployment.serviceInstances.length > 0) {
                        angular.forEach(serviceDeployment.serviceInstances, function (serviceInstance, key2) {
                            if (!serviceInstance.lbServicePorts || serviceInstance.lbServicePorts.length == 0) {
                                if (pop.servicePort.protocolType == "mysql") {
                                    if (serviceDeployment.deployType == "DB") {
                                        var unusingserviceInstance = angular.copy(serviceInstance);
                                        serviceInstance.deployType = serviceDeployment.deployType;
                                        serviceInstance.deployName = serviceDeployment.deployName;
                                        serviceInstance.deployType = serviceDeployment.deployType;
                                        if (serviceInstance.deployType == "DB") {
                                            pop.unusingServiceInstances.push(unusingserviceInstance);
                                        } else {
                                            pop.unusingServiceInstances.push(unusingserviceInstance);
                                        }
                                    }
                                } else {
                                    if (serviceDeployment.deployType != "DB") {
                                        var unusingserviceInstance = angular.copy(serviceInstance);
                                        serviceInstance.deployType = serviceDeployment.deployType;
                                        serviceInstance.deployName = serviceDeployment.deployName;
                                        serviceInstance.deployType = serviceDeployment.deployType;
                                        if (serviceInstance.deployType == "DB") {
                                            pop.unusingServiceInstances.push(unusingserviceInstance);
                                        } else {
                                            pop.unusingServiceInstances.push(unusingserviceInstance);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                if (pop.unusingServiceInstances && pop.unusingServiceInstances.length > 0) {
                    pop.sltServiceInstanceId = '' + pop.unusingServiceInstances[0].id;
                    pop.fn.changeServiceInstance(pop.sltServiceInstanceId);
                }
            }
        };

        pop.serviceType = $scope.dialogOptions.serviceType;

        pop.formMode = "add";
        pop.callbackfn = $scope.dialogOptions.callBackFunction;
        pop.selector = $scope.dialogOptions.selector;

        pop.deployServer = $scope.dialogOptions.deployServer;

        if (pop.deployServer.deployType == 'LB') {
            pop.servicePort = $scope.dialogOptions.servicePort;
            pop.fn.setUnusingServiceInstances(pop.deployServer);

            $scope.dialogOptions.title = "서비스 연결";
            $scope.dialogOptions.okName =  "서비스 연결";
        } else {
            if (pop.deployServer.deployType == "mysql") {
                pop.useProtocols.push("mysql");
            } else {
                pop.useProtocols.push("http");
            }
            pop.serviceInstance = $scope.dialogOptions.serviceInstance;
            pop.fn.getLbDeployServer(pop.deployServer);

            $scope.dialogOptions.title = "LB 포트 연결";
            $scope.dialogOptions.okName =  "LB 포트 연결";
        }

        pop.formName = "deployLbServicePortLinkForm";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeployLbServicePortLinkForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.addDeployLbServicePortLink();
        };

        /*LB 포트 연결 추가*/
        pop.fn.addDeployLbServicePortLink = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var param = {};

            if (pop.deployServer.deployType == 'LB') {
                param.tenantId = pop.deployServer.tenantId;
                param.deployId = pop.deployServer.deployId;
                param.floatingIp = pop.deployServer.floatingIp;
                param.protocolType = pop.servicePort.protocolType;
                param.servicePortId = pop.servicePort.id;
                param.svcDeployId = pop.sltServiceInstance.deployId;
                param.serviceInstanceId = pop.sltServiceInstance.id;
            } else {
                param.tenantId = pop.lbDeployServer.tenantId;
                param.deployId = pop.lbDeployServer.deployId;
                param.floatingIp = pop.lbDeployServer.floatingIp;
                param.protocolType = pop.sltLbServicePort.protocolType;
                param.servicePortId = pop.sltLbServicePort.id;
                param.svcDeployId = pop.serviceInstance.deployId;
                param.serviceInstanceId = pop.serviceInstance.id;
            }

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/port/service', 'POST', param);
            returnPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (data && angular.isDefined(data.content)) {
                    common.showAlertSuccess('서비스가 연결 되었습니다.');
                    if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                        $scope.dialogOptions.callBackFunction(data.content);
                    }
                    $scope.main.asideClose(pop.selector);
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlertError('오류가 발생하였습니다.');
            });
        };

    })
    .controller('iaasDeployDomainLinkFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployDomainLinkFormCtrl", 1);
        var pop = this;

        pop.validationService = new ValidationService({controllerAs : pop});
        pop.fn = {};
        pop.unusingDomains = [];
        pop.protocolUnusingDomains = [];
        pop.unusingDomainLoad = false;
        pop.sltDomainId = null;

        pop.deployServer = $scope.dialogOptions.deployServer;
        pop.servicePort = $scope.dialogOptions.servicePort;
        pop.useProtocols = [];
        if (pop.deployServer.deployType == "mysql") {
            pop.useProtocols.push("mysql");
        } else {
            pop.useProtocols.push("http");
        }
        pop.serviceInstance = $scope.dialogOptions.serviceInstance;

        pop.formMode = "add";
        pop.callbackfn = $scope.dialogOptions.callBackFunction;
        pop.selector = $scope.dialogOptions.selector;

        $scope.dialogOptions.title = "도메인 연결 추가";
        $scope.dialogOptions.okName =  "연결 추가";

        pop.formName = "deployLbServicePortDomainLinkForm";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeployDomainLinkForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.addDomainLink();
        };


        pop.fn.getUnusingDomainList = function() {
            var params = {
                tenantId : pop.deployServer.tenantId
            };
            pop.unusingDomains = [];
            pop.protocolUnusingDomains = [];
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/domain/tenant/unusing', 'GET', params);
            returnPromise.success(function (data, status, headers) {
                if (data && angular.isObject(data.content) && data.content.length > 0) {
                    pop.unusingDomains = data.content;
                    var unusingProtocol = "unusing";
                    if (pop.servicePort.protocolType == "mysql") {
                        unusingProtocol += "Mysql";
                    } else if (pop.servicePort.protocolType == "rdp") {
                        unusingProtocol += "Rdp";
                    } else {
                        unusingProtocol += "Http";
                    }
                    angular.forEach(pop.unusingDomains, function (item, key) {
                        if (item[unusingProtocol]) {
                            pop.protocolUnusingDomains.push(angular.copy(item));
                        }
                    });
                    if (pop.protocolUnusingDomains.length > 0) {
                        var sltDomain = common.objectsFindCopyByField(pop.protocolUnusingDomains, "id", pop.domainId);
                        if (!sltDomain || !sltDomain.id) {
                            pop.sltDomainId = ''+pop.protocolUnusingDomains[0].id;
                        }
                    } else {
                        pop.sltDomainId = "";
                    }
                    pop.unusingDomainLoad = true;
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
            });
            returnPromise.finally(function (data, status, headers) {
            });
        };

        pop.fn.addDomainFormOpen = function () {
            var dialogOptions = {
                controller : "iaasDomainFormCtrl",
                callBackFunction : pop.fn.addDomainCallBackFun,
                tenantId : pop.deployServer.tenantId,
                controllerAs : "domainPop",
                formMode : "add"
            };
            pop.addDomainDialog = common.showRightChildDialog($scope, dialogOptions);
        };

        pop.fn.addDomainCallBackFun = function(domain) {
            domain.unusingHttp = true;
            domain.unusingHttp = true;
            domain.unusingHttp = true;
            if (!angular.isArray(pop.unusingDomains)) {
                pop.unusingDomains = [];
            }
            pop.unusingDomains.push(domain);
            if (!angular.isArray(pop.protocolUnusingDomains)) {
                pop.protocolUnusingDomains = [];
            }
            pop.protocolUnusingDomains.push(domain);
            pop.sltDomainId = '' + domain.id;
        };

        pop.fn.addDomainLink = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var params = {
                tenantId : pop.deployServer.tenantId,
                deployId : pop.deployServer.deployId,
                servicePortId : pop.servicePort.id,
                floatingIp : pop.deployServer.floatingIp,
                domainId : pop.sltDomainId
            };

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/port/domain', 'POST', params);
            returnPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (data && angular.isDefined(data.content)) {
                    common.showAlertSuccess('LB 포트 연결이 추가 되었습니다.');
                    if (angular.isFunction($scope.dialogOptions.callBackFunction)) {
                        $scope.dialogOptions.callBackFunction(data.content);
                    }
                    $scope.dialogOptions.popHide();
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlertError('LB 포트 연결 추가 : 오류가 발생하였습니다.');
            });
        };

        pop.fn.getUnusingDomainList();
    })
    .controller('iaasDeployWebServiceConfigFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployWebServiceConfigFormCtrl", 1);

        var pop = this;

        pop.validationService = new ValidationService({controllerAs : pop});
        pop.fn = {};

        pop.selector = $scope.dialogOptions.selector;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        pop.formMode = $scope.dialogOptions.formMode;
        pop.deployServer = $scope.dialogOptions.deployServer;
        pop.usingPorts = {};
        pop.lbDeployServer = {};
        pop.sltLbServicePort = {};

        angular.forEach(pop.deployServer.serviceInstances, function (serviceInstance) {
            pop.usingPorts[serviceInstance.servicePort] = true;
        });

        if (pop.formMode == "mod") {
            pop.orgServiceInstance = angular.copy($scope.dialogOptions.serviceInstance);
            delete pop.usingPorts[pop.orgServiceInstance.servicePort];

            pop.serviceInstance = {};
            pop.serviceInstance.id = pop.orgServiceInstance.id;
            pop.serviceInstance.tenantId = pop.orgServiceInstance.tenantId;
            pop.serviceInstance.deployId = pop.orgServiceInstance.deployId;
            pop.serviceInstance.serviceInstanceName = pop.orgServiceInstance.serviceInstanceName;
            pop.serviceInstance.name = pop.orgServiceInstance.name;
            pop.serviceInstance.serviceType = pop.orgServiceInstance.serviceType;
            pop.serviceInstance.servicePort = pop.orgServiceInstance.servicePort;
            pop.serviceInstance.webConfig = angular.copy(pop.orgServiceInstance.webServiceInstance);

            $scope.dialogOptions.title = "WEB 서비스 인스턴스 수정";
            $scope.dialogOptions.okName =  "서비스 수정";
        } else {
            pop.serviceInstance = {};
            pop.serviceInstance.tenantId = pop.deployServer.tenantId;
            pop.serviceInstance.deployId = pop.deployServer.deployId;
            pop.serviceInstance.serviceType = "WEB";
            var defaultServicePort = 8080;
            while (pop.usingPorts[defaultServicePort]) {
                defaultServicePort++;
            }
            pop.serviceInstance.servicePort = defaultServicePort;
            pop.serviceInstance.serviceInstanceName = pop.deployServer.deployName + "-" + defaultServicePort;

            pop.serviceInstance.webConfig = {};
            pop.serviceInstance.webConfig.tenantId = pop.deployServer.tenantId;
            pop.serviceInstance.webConfig.deployId = pop.deployServer.deployId;
            pop.serviceInstance.webConfig.serverName = "_";
            pop.serviceInstance.webConfig.clientMaxBodySize = 100;
            pop.serviceInstance.webConfig.indexPage = "index.html index.htm";
            pop.serviceInstance.webConfig.notFoundErrorPage = "/404.html";
            pop.serviceInstance.webConfig.serverErrorPage = "/50x.html";

            pop.addDefaultServicePort = pop.serviceInstance.servicePort;

            var resource = {};
            resource.tenantId = pop.deployServer.tenantId;
            resource.locationType = "res";
            resource.name = "default";
            resource.location = "/";
            resource.targetType = "url";
            resource.url = "http://101.55.126.196:7480/cx-upload/paasxpert.zip";
            pop.serviceInstance.resources = [];
            pop.serviceInstance.resources.push(resource);

            $scope.dialogOptions.title = "WEB 서비스 인스턴스 추가";
            $scope.dialogOptions.okName =  "서비스 추가";
        }

        pop.formName = "deployWebConfigForm";

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeployWebServiceConfigForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.pushWebServiceInstanceConfig();
        };

        pop.fn.systemPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
                return {isValid : true};
            } else {
                return {isValid : false, message: "포트범위는 [80, 443, 1024~65535] 입니다."};
            }
        };

        pop.fn.systemServicePortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (pop.usingPorts[port]) {
                return {isValid : false, message: "이미 사용중인 포트 입니다."};
            } else {
                return pop.fn.systemPortCustomValidationCheck(port);
            }
        };

        pop.fn.pushWebServiceInstanceConfig = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var method = "POST";
            if (pop.formMode == "mod") {
                method = "PUT";
                var isUpdate = false;
                if (pop.serviceInstance.serviceInstanceName != pop.orgServiceInstance.serviceInstanceName) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.servicePort != pop.orgServiceInstance.servicePort) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.webConfig.clientMaxBodySize != pop.orgServiceInstance.webServiceInstance.clientMaxBodySize) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.webConfig.indexPage != pop.orgServiceInstance.webServiceInstance.indexPage) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.webConfig.notFoundErrorPage != pop.orgServiceInstance.webServiceInstance.notFoundErrorPage) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.webConfig.serverErrorPage != pop.orgServiceInstance.webServiceInstance.serverErrorPage) {
                    isUpdate = true;
                }
                if (!isUpdate) {
                    common.showAlertWarning('변경된 사항이 없습니다.');
                    $scope.actionBtnHied = false;
                    return;
                }
                pop.serviceInstance.serviceInstanceName = pop.serviceInstance.serviceInstanceName.replace(pop.orgServiceInstance.servicePort, pop.serviceInstance.servicePort);
            } else {
                pop.serviceInstance.serviceInstanceName = pop.serviceInstance.serviceInstanceName.replace(pop.addDefaultServicePort, pop.serviceInstance.servicePort);
            }

            pop.serviceInstance.tenantId = pop.deployServer.tenantId;
            pop.serviceInstance.deployId = pop.deployServer.deployId;
            pop.serviceInstance.name = pop.deployServer.deployName + "-service-" + pop.serviceInstance.servicePort;

            var param = angular.copy(pop.serviceInstance);

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance', method, param);
            returnPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (data && angular.isDefined(data.content)) {
                    if (pop.formMode == "mod") {
                        common.showAlertSuccess('서비스 설정이 수정 되었습니다.');
                    } else {
                        common.showAlertSuccess('서비스가 추가 되었습니다.');
                    }
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction(data.content);
                    }
                    $scope.main.asideClose(pop.selector);
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlertError('오류가 발생하였습니다.');
            });
        };

    })
    .controller('iaasDeployWebServicePathFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployWebServicePathFormCtrl", 1);

        var pop = this;

        pop.validationService = new ValidationService({controllerAs : pop});
        pop.fn = {};

        pop.selector = $scope.dialogOptions.selector;
        pop.formMode = $scope.dialogOptions.formMode;
        pop.formName = "deployWebServicePathForm";
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        pop.deployServer = $scope.dialogOptions.deployServer;
        pop.serviceInstance = $scope.dialogOptions.serviceInstance;
        $scope.dialogOptions.title = "WEB 경로 추가";
        $scope.dialogOptions.okName =  "경로 추가";

        pop.serviceLocation = {};
        pop.serviceLocation.locationType = "path";
        pop.vtargetType = "ins";
        pop.inChildPath = "/";
        pop.outChildPath = "/";
        pop.lbDeployServerLoad = false;

        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeployWebServicePathForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.addWebServicePath();
        };

        pop.fn.getLbDeployServerList = function() {
            var params = {
                tenantId : pop.serviceInstance.tenantId,
                deployType : "LB"
            };
            pop.lbDeployServers = [];
            pop.lbServicePorts = [];
            var serverStatsPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/type', 'GET', params);
            serverStatsPromise.success(function (data, status, headers) {
                if (data && angular.isArray(data.content) && data.content.length > 0) {
                    pop.lbDeployServers = data.content;
                    angular.forEach(pop.lbDeployServers, function (lbDeployServer, key1) {
                        angular.forEach(lbDeployServer.serviceDeployments, function (serviceDeployment, key2) {
                            if (serviceDeployment.deployType == "WAS" && serviceDeployment.serviceInstances && serviceDeployment.serviceInstances.length > 0) {
                                angular.forEach(serviceDeployment.serviceInstances, function (serviceInstance, key3) {
                                    if (serviceInstance.lbServicePorts && serviceInstance.lbServicePorts.length > 0) {
                                        angular.forEach(serviceInstance.lbServicePorts, function (servicePort, key4) {
                                            var lbServicePort = angular.copy(servicePort);
                                            lbServicePort.deployName = lbDeployServer.deployName;
                                            lbServicePort.vip = lbDeployServer.vip;
                                            lbServicePort.floatingIp = lbDeployServer.floatingIp;
                                            lbServicePort.svcDeployId = serviceDeployment.deployId;
                                            lbServicePort.svcDeployName = serviceDeployment.deployName;
                                            lbServicePort.serviceInstanceId = serviceInstance.serviceInstanceId;
                                            lbServicePort.svcServicePort = serviceInstance.servicePort;
                                            lbServicePort.svcName = serviceInstance.name;
                                            lbServicePort.serviceInstanceName = serviceInstance.serviceInstanceName;
                                            pop.lbServicePorts.push(lbServicePort);
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
                pop.lbDeployServerLoad = true;
            });
            serverStatsPromise.error(function (data, status, headers) {
            });
            serverStatsPromise.finally(function (data, status, headers) {
                pop.wasDeployServerLoad = true;
            });
        };

        pop.fn.InputLocationNameCustomValidationCheck = function (name) {
            if (name == undefined || name == null || name == "") return;
            pop.serviceLocation.name = name;
            pop.serviceLocation.location = "/" + name + "/";
            if (pop.serviceLocationNames[name]) {
                return {isValid : false, message: "이미 사용중인 경로명 입니다."};
            } else {
                return {isValid : true};
            }
        };

        pop.fn.inputLocationFilTypeCustomValidationCheck = function (type) {
            if (type == undefined || type == null || type == "") return;
            var name = "ftype_" + type;
            pop.serviceLocation.name = name;
            pop.serviceLocation.location = "~ \\\\." + type + "$";
            if (pop.serviceLocationNames[name]) {
                return {isValid : false, message: "이미 사용중인 실행 확장자 입니다."};
            } else {
                return {isValid : true};
            }
        };

        pop.fn.changeLocationType = function () {
            if (pop.serviceLocation.locationType == "ftype") {
                if (pop.inputLocationFilType == undefined || pop.inputLocationFilType == null || pop.inputLocationFilType == "") {
                    pop.serviceLocation.name = "";
                    pop.serviceLocation.location = "";
                } else {
                    pop.serviceLocation.name = "ftype_" + pop.inputLocationFilType;
                    pop.serviceLocation.location = "~ \\\\." + pop.inputLocationFilType + "$";
                }
            } else {
                if (pop.inputLocationName == undefined || pop.inputLocationName == null || pop.inputLocationName == "") {
                    pop.serviceLocation.name = "";
                    pop.serviceLocation.location = "";
                } else {
                    pop.serviceLocation.name = pop.inputLocationName;
                    pop.serviceLocation.location = "/" + pop.inputLocationName + "/";
                }
            }
        };

        pop.sltLbServicePortId = "";
        pop.sltLbServicePort = {};

        pop.sltServiceInstanceId = "";
        pop.sltServiceInstance = {};

        pop.fn.changeServiceInstance = function(serviceInstanceId) {
            pop.sltServiceInstance = common.objectsFindCopyByField(pop.deployServer.serviceInstances, "id", serviceInstanceId);
            if (!pop.sltServiceInstance || !pop.sltServiceInstance.id) {
                pop.sltServiceInstanceId = "";
                pop.sltServiceInstance = {};
            }
        };

        pop.fn.changeAppDeployServer = function (sltLbServicePortId) {
            if (sltLbServicePortId) {
                pop.sltLbServicePort = common.objectsFindCopyByField(pop.lbServicePorts, "id", sltLbServicePortId);
                if (!pop.sltLbServicePort || !pop.sltLbServicePort.id) {
                    pop.sltLbServicePortId = "";
                    pop.sltLbServicePort = {};
                }
            } else {
                pop.sltLbServicePortId = "";
                pop.sltLbServicePort = {};
            }
        };

        pop.fn.addWebServicePath = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var param = {
                tenantId : pop.serviceInstance.tenantId,
                deployId : pop.serviceInstance.deployId,
                serviceInstanceId : pop.serviceInstance.id,
                name : pop.serviceLocation.name,
                locationType : pop.serviceLocation.locationType,
                location : pop.serviceLocation.location
            };

            param.targetType = (pop.vtargetType == "app") ? "out" : pop.vtargetType;
            if (pop.vtargetType == "ins") {
                param.alias = "/home/ubuntu/nginx/" + pop.sltServiceInstance.name + "/default";
                if (pop.inChildPath != '/') {
                    if (pop.inChildPath.substring(1) != "/") {
                        param.alias += "/";
                    }
                    if (pop.inChildPath.substring(pop.inChildPath-1) != "/") {
                        param.alias += pop.inChildPath + "/";
                    } else {
                        param.alias += pop.inChildPath;
                    }
                } else {
                    param.alias += pop.inChildPath;
                }
                param.alias = param.alias.replace(/\/\//gi, "/");
            } else if (param.targetType == "out") {
                if (pop.vtargetType == "app") {
                    var tailPass = "";
                    if (pop.outChildPath != '/') {
                        if (pop.outChildPath.substring(1) != "/") {
                            tailPass += "/";
                        }
                        if (pop.outChildPath.substring(pop.outChildPath-1) != "/") {
                            tailPass += pop.outChildPath + "/";
                        } else {
                            tailPass += pop.outChildPath;
                        }
                    } else {
                        tailPass += pop.outChildPath;
                    }
                    tailPass = tailPass.replace(/\/\//gi, "/");
                    param.proxyPass = "http://" + pop.sltLbServicePort.vip + ":" +  pop.sltLbServicePort.sourcePort +  tailPass;
                } else {
                    if (pop.outProxyPass.substring(pop.outProxyPass.length-1) == "/") {
                        param.proxyPass = pop.outProxyPass;
                    } else {
                        param.proxyPass = pop.outProxyPass + "/";
                    }
                }
                if (pop.serviceLocation.locationType == "path") {
                    param.rewriteExpression = "^" + pop.serviceLocation.location + "(.*)$ /$1 break";
                }
            }

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance/path', 'POST', param);
            returnPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (data && angular.isDefined(data.content)) {
                    common.showAlertSuccess('WEB 경로가 추가 되었습니다.');
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction(data.content);
                    }
                    $scope.main.asideClose(pop.selector);
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlertError('오류가 발생하였습니다.');
            });
        };

        pop.fn.getLbDeployServerList();

        pop.serviceLocationNames = {};
        if (pop.serviceInstance && angular.isArray(pop.serviceInstance.serviceLocations) && pop.serviceInstance.serviceLocations.length > 0) {
            angular.forEach(pop.serviceInstance.serviceLocations, function (serviceLocation, idx) {
                pop.serviceLocationNames[serviceLocation.name] = true;
            });
        }

        if (pop.deployServer && angular.isArray(pop.deployServer.serviceInstances) && pop.deployServer.serviceInstances.length > 0) {
            pop.sltServiceInstanceId = ''+pop.deployServer.serviceInstances[0].id;
            pop.fn.changeServiceInstance(pop.sltServiceInstanceId);
        }

    })
    .controller('iaasDeployWasServiceConfigFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployWasServiceConfigFormCtrl", 1);
        var pop = this;
        pop.validationService = new ValidationService({controllerAs : pop});
        pop.fn = {};

        pop.selector = $scope.dialogOptions.selector;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        pop.formMode = $scope.dialogOptions.formMode;
        pop.deployServer = $scope.dialogOptions.deployServer;
        pop.usingPorts = {};
        pop.isDefaultServiceInstance = false;

        angular.forEach(pop.deployServer.serviceInstances, function (serviceInstance) {
            pop.usingPorts[serviceInstance.servicePort] = true;
            if (serviceInstance.name == pop.deployServer.deployName + "-service") {
                pop.defaultServiceInstance = serviceInstance;
            }
        });

        if (pop.formMode == "mod") {
            pop.orgServiceInstance = angular.copy($scope.dialogOptions.serviceInstance);
            delete pop.usingPorts[pop.orgServiceInstance.servicePort];

            if (pop.orgServiceInstance.name == pop.deployServer.deployName + "-service") {
                pop.isDefaultServiceInstance = true;
            }
            pop.serviceInstance = {};
            pop.serviceInstance.id = pop.orgServiceInstance.id;
            pop.serviceInstance.tenantId = pop.orgServiceInstance.tenantId;
            pop.serviceInstance.deployId = pop.orgServiceInstance.deployId;
            pop.serviceInstance.serviceInstanceName = pop.orgServiceInstance.serviceInstanceName;
            pop.serviceInstance.name = pop.orgServiceInstance.name;
            pop.serviceInstance.serviceType = pop.orgServiceInstance.serviceType;
            pop.serviceInstance.servicePort = pop.orgServiceInstance.servicePort;
            pop.serviceInstance.wasConfig = angular.copy(pop.orgServiceInstance.wasServiceInstance);

            $scope.dialogOptions.title = "WAS 서비스 인스턴스 수정";
            $scope.dialogOptions.okName =  "서비스 수정";
        } else {
            pop.serviceInstance = {};
            pop.serviceInstance.tenantId = pop.deployServer.tenantId;
            pop.serviceInstance.deployId = pop.deployServer.deployId;
            pop.serviceInstance.serviceType = "WAS";
            var defaultServicePort = 8080;
            while (pop.usingPorts[defaultServicePort]) {
                defaultServicePort++;
            }
            pop.serviceInstance.servicePort = defaultServicePort;
            pop.serviceInstance.serviceInstanceName = pop.deployServer.deployName + "-" + defaultServicePort;

            pop.addDefaultServicePort = pop.serviceInstance.servicePort;

            pop.serviceInstance.wasConfig = {};
            pop.serviceInstance.wasConfig.tenantId = pop.deployServer.tenantId;
            pop.serviceInstance.wasConfig.deployId = pop.deployServer.deployId;
            pop.serviceInstance.wasConfig.javaPackage = pop.defaultServiceInstance.wasServiceInstance.javaPackage;
            pop.serviceInstance.wasConfig.tomcatVersion = pop.defaultServiceInstance.wasServiceInstance.tomcatVersion;
            pop.serviceInstance.wasConfig.tomcatMemoryMs = pop.defaultServiceInstance.wasServiceInstance.tomcatMemoryMs;
            pop.serviceInstance.wasConfig.tomcatMemoryMx = pop.defaultServiceInstance.wasServiceInstance.tomcatMemoryMx;

            var resource = {};
            resource.tenantId = pop.userTenantId;
            resource.locationType = "res";
            resource.name = "ROOT";
            resource.location = "/";
            resource.targetType = "url";
            resource.url = "http://101.55.126.196:7480/iaas-deploy-admin-bucket/examples.war";
            pop.serviceInstance.resources = [];
            pop.serviceInstance.resources.push(resource);

            $scope.dialogOptions.title = "WAS 서비스 인스턴스 추가";
            $scope.dialogOptions.okName =  "서비스 추가";
        }

        pop.formName = "deployWasConfigForm";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeployWasServiceConfigForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.pushWasServiceInstanceConfig();
        };

        pop.fn.systemPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
                return {isValid : true};
            } else {
                return {isValid : false, message: "포트범위는 [80, 443, 1024~65535] 입니다."};
            }
        };

        pop.fn.systemServicePortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (pop.usingPorts[port]) {
                return {isValid : false, message: "이미 사용중인 포트 입니다."};
            } else {
                return pop.fn.systemPortCustomValidationCheck(port);
            }
        };

        /*WAS 서비스 인스턴스 수정*/
        pop.fn.pushWasServiceInstanceConfig = function (serviceInstance) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var method = "POST";
            if (pop.formMode == "mod") {
                method = "PUT";
                var isUpdate = false;
                if (pop.serviceInstance.servicePort != pop.orgServiceInstance.servicePort) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.serviceInstanceName != pop.orgServiceInstance.serviceInstanceName) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.wasConfig.javaPackage != pop.orgServiceInstance.wasServiceInstance.javaPackage) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.wasConfig.tomcatVersion != pop.orgServiceInstance.wasServiceInstance.tomcatVersion) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.wasConfig.tomcatMemoryMs != pop.orgServiceInstance.wasServiceInstance.tomcatMemoryMs) {
                    isUpdate = true;
                }
                if (pop.serviceInstance.wasConfig.tomcatMemoryMx != pop.orgServiceInstance.wasServiceInstance.tomcatMemoryMx) {
                    isUpdate = true;
                }
                if (!isUpdate) {
                    common.showAlertWarning('변경된 사항이 없습니다.');
                    $scope.actionBtnHied = false;
                    return;
                }
                pop.serviceInstance.serviceInstanceName = pop.serviceInstance.serviceInstanceName.replace(pop.orgServiceInstance.servicePort, pop.serviceInstance.servicePort);
            } else {
                pop.serviceInstance.serviceInstanceName = pop.serviceInstance.serviceInstanceName.replace(pop.addDefaultServicePort, pop.serviceInstance.servicePort);
            }

            pop.serviceInstance.tenantId = pop.deployServer.tenantId;
            pop.serviceInstance.deployId = pop.deployServer.deployId;
            pop.serviceInstance.name = pop.deployServer.deployName + "-service-" + pop.serviceInstance.servicePort;

            var param = angular.copy(pop.serviceInstance);

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance', method, param);
            returnPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (data && angular.isDefined(data.content)) {
                    if (pop.formMode == "mod") {
                        common.showAlertSuccess('서비스 설정이 수정 되었습니다.');
                    } else {
                        common.showAlertSuccess('서비스가 추가 되었습니다.');
                    }
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction(data.content);
                    }
                    $scope.main.asideClose(pop.selector);
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlertError('오류가 발생하였습니다.');
            });
        };

    })
    .controller('iaasDeploySocuceFilePushFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerControllers.js : iaasDeploySocuceFilePushFormCtrl", 1);

        var pop = this;

        pop.validationService = new ValidationService({controllerAs : pop});
        pop.fn = {};

        pop.serviceInstance = angular.copy($scope.dialogOptions.serviceInstance);
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title = "리소스 재배포";
        $scope.dialogOptions.okName =  "리소스 재배포";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeploySocuceFilePushForm.html" + _VersionTail();
        pop.deployServer = angular.copy($scope.dialogOptions.deployServer);

        pop.formName = "deploySocuceFilePushForm";

        pop.pushType = "upload";

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.deploySourceFilePush();
        };

        var uploadFilters = [];
        uploadFilters.push({
            name: 'syncFilter',
            fn: function (item, options) {
                pop.uploader.clearQueue();
                var contentTypes =  item.type.split("/");
                var fileNames =  item.name.split(".");
                var ftype = '|' + fileNames[fileNames.length - 1].toLowerCase() + '|';
                var ctype = '';
                if (contentTypes.length == 2) {
                    ctype =  '|' + contentTypes[1].toLowerCase() + '|';
                }
                if (pop.deployServer.deployType == "WEB") {
                    if ((ctype && '|zip|'.indexOf(ctype) !== -1)
                        || ('|zip|'.indexOf(ftype) !== -1)) {
                        return true;
                    } else {
                        item.error = "error";
                        item.message = "mi_only_zip_file";
                        return false;
                    }
                } else if (pop.deployServer.deployType == "WAS") {
                    if ((ctype && '|x-webarchive|'.indexOf(ctype) !== -1)
                        || ('|war|'.indexOf(ftype) !== -1)) {
                        return true;
                    } else {
                        item.error = "error";
                        item.message = "mi_only_war_file";
                        return false;
                    }
                } else {
                    return false;
                }
            }
        });

        pop.uploader = common.setDefaultFileUploader($scope, { filters : uploadFilters });

        pop.uploader.onWhenAddingFileFailed = function (item) {
            _DebugConsoleInfo('onWhenAddingFileFailed', item);
            if (item.error && item.message) {
                var errMessage = "{{ 'message." + item.message + "' | translate }}";
                pop.appFileItem = null;
                item.error = null;
                item.message = null;
                pop.appFileErrorMessage = errMessage;
            }
        };

        pop.uploader.onAfterAddingFile = function (fileItem) {
            _DebugConsoleInfo('onAfterAddingFile', fileItem);
            pop.appFileErrorMessage = "";
            pop.appFileItem = fileItem;
        };

        pop.fn.deploySourceFilePush = function() {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            $scope.main.loadingMainBody = true;
            var param = {
                urlParams: {
                    "serviceInstanceLocId" : pop.serviceInstance.defaultServiceLocation.id,
                    "serviceInstanceId" : pop.serviceInstance.defaultServiceLocation.serviceInstanceId
                }
            };
            var contentType = "";
            if (pop.pushType == "upload") {
                param.file = pop.appFileItem._file;
                contentType = "multipart/form-data";
            } else {
                param.urlParams.url = pop.deployFilePath;
            }

            var returnPromise = common.noMsgRetrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance/resource', 'PUT', param, contentType));
            returnPromise.success(function (response) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (response && response.status == 200) {
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction();
                    }
                    common.showAlertSuccess('소스가 배포 되었습니다.');
                    $scope.main.asideClose(pop.selector);
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (response) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (response && response.data && response.data.message) {
                    common.showAlertError(response.data.message);
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
        };
    })
    .controller('iaasDeployDbServiceConfigFormCtrl', function ($scope, $location, $state, $translate, $filter, $mdDialog, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("deployServerConfigFormControllers.js : iaasDeployDbServiceConfigFormCtrl", 1);
        var pop = this;
        pop.validationService = new ValidationService({controllerAs : pop});
        pop.fn = {};

        pop.selector = $scope.dialogOptions.selector;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        pop.formMode = $scope.dialogOptions.formMode;
        pop.deployServer = $scope.dialogOptions.deployServer;

        pop.orgServiceInstance = angular.copy($scope.dialogOptions.serviceInstance);
        pop.serviceInstance = {};
        pop.serviceInstance.id = pop.orgServiceInstance.id;
        pop.serviceInstance.tenantId = pop.orgServiceInstance.tenantId;
        pop.serviceInstance.deployId = pop.orgServiceInstance.deployId;
        pop.serviceInstance.serviceInstanceName = pop.orgServiceInstance.serviceInstanceName;
        pop.serviceInstance.name = pop.orgServiceInstance.name;
        pop.serviceInstance.serviceType = pop.orgServiceInstance.serviceType;
        pop.serviceInstance.servicePort = pop.orgServiceInstance.servicePort;
        pop.serviceInstance.dbConfig = angular.copy(pop.orgServiceInstance.dbServiceInstance);

        $scope.dialogOptions.title = "DB 서비스 인스턴스 수정";
        $scope.dialogOptions.okName =  "서비스 수정";

        pop.formName = "deployDbConfigForm";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/compute/config/popDeployDbServiceConfigForm.html" + _VersionTail();

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.dialogOptions.popDialogOk = function () {
            pop.fn.pushDbServiceInstanceConfig(pop.serviceInstance);
        };

        pop.fn.systemPortCustomValidationCheck = function(port) {
            if (port == undefined || port == null || port == "") return;
            if (port == 80 || port == 443 || (port >= 1024 && port <= 65535)) {
                return {isValid : true};
            } else {
                return {isValid : false, message: "포트범위는 [80, 443, 1024~65535] 입니다."};
            }
        };

        /*DB 서비스 수정*/
        pop.fn.pushDbServiceInstanceConfig = function (serviceInstance) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!pop.validationService.checkFormValidity(pop[pop.formName])) {
                $scope.actionBtnHied = false;
                return;
            }
            var method = "PUT";

            var isUpdate = false;
            if (pop.serviceInstance.servicePort != pop.orgServiceInstance.servicePort) {
                isUpdate = true;
            }
            if (pop.serviceInstance.dbConfig.maxConnections != pop.orgServiceInstance.dbServiceInstance.maxConnections) {
                isUpdate = true;
            }
            if (pop.serviceInstance.dbConfig.maxAllowedPacket != pop.orgServiceInstance.dbServiceInstance.maxAllowedPacket) {
                isUpdate = true;
            }
            if (pop.serviceInstance.dbConfig.maxBinlogSize != pop.orgServiceInstance.dbServiceInstance.maxBinlogSize) {
                isUpdate = true;
            }
            if (!isUpdate) {
                common.showAlertWarning('변경된 사항이 없습니다.');
                $scope.actionBtnHied = false;
                return;
            }

            pop.serviceInstance.tenantId = pop.deployServer.tenantId;
            pop.serviceInstance.deployId = pop.deployServer.deployId;
            pop.serviceInstance.name = pop.deployServer.deployName + "-service-" + pop.serviceInstance.servicePort;

            var param = angular.copy(pop.serviceInstance);

            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/deploy/deploy/service_instance', method, param);
            returnPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                if (data && angular.isDefined(data.content)) {
                    common.showAlertSuccess('서비스 설정이 수정 되었습니다.');
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction(data.content);
                    }
                    $scope.main.asideClose(pop.selector);
                } else {
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                $scope.actionBtnHied = false;
                common.showAlertError('오류가 발생하였습니다.');
            });
        };

    })
;
