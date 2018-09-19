'use strict';

angular.module('portal.controllers')
    .controller('commServicesCtrl', function ($scope, $location, $state, $stateParams, $translate, serviceService, common, CONSTANTS) {
        _DebugConsoleLog("serviceControllers.js : commServicesCtrl", 1);

        var ct = this;

        $scope.createServiceData = {};
        ct.services = [];

        // paging
        ct.pageOption = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.serviceData = {};

        /*Service 목록 조회*/
        ct.listServices = function (currentPage) {
            $scope.main.loadingMainBody = true;
            if (currentPage == undefined) currentPage = 1;
            ct.pageOption.currentPage = currentPage;
            var domainPromise = serviceService.listServices(ct.pageOption.pageSize, currentPage-1);
            domainPromise.success(function (data) {

                ct.services = data.items;
                ct.pageOption.total = data.counts;

                $scope.main.loadingMainBody = false;
            });
            domainPromise.error(function (data, status, headers) {
                ct.services = [];
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.actionBtnHied = false; // btn enabled

        /*[Service 추가] 클릭*/
        ct.createService = function ($event) {
            var dialogOptions = {
                title : $translate.instant("label.service_add"),
                form : {
                    name: "createServiceForm",
                    options: "",
                },
                dialogClassName : "modal-dialog",
                templateUrl: "views/service/popServiceForm.html" + _VersionTail(),
                okName : $translate.instant("label.save")
            };
            pop.serviceData = {};
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createServiceAction(pop.serviceData);
            };
        };

        /*Service 수정*/
        ct.updateService = function ($event, service) {
            var dialogOptions = {
                title : "Service 수정",
                form : {
                    name: "updateServiceForm",
                    options: "",
                },
                dialogClassName : "modal-dialog",
                templateUrl: "views/service/popServiceForm.html" + _VersionTail(),
                //okName : $translate.instant("label.edit")
                btnTemplateUrl: "views/service/popServiceFormButton.html"
            };
            pop.serviceData	= service;
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updateServiceAction(pop.serviceData);
            }
        };

        /*Service 활성화/중지*/
        ct.updateServiceUseYn = function ($event, service){
            var str = "활성화";
            if(service.useYn == "Y") str = "중지";

            var showConfirm = common.showConfirm("서비스 " + str + "(" + service.serveId + ")", "Service를 "+str+"하시겠습니까?");
            showConfirm.then(function () {
                common.mdDialogHide();
                pop.updateServiceUseYnAction(service);
            });
        };

        /*ID focus-out 시 Secret 에 값 세팅*/
        pop.setSecret = function (serviceData){
            if(serviceData.serveId != undefined && serviceData.serveId != "" && (serviceData.secret == undefined || serviceData.secret == "")){
                serviceData.secret = serviceData.serveId + "secret";
            }
        };


        /*[Service 추가] 팝업 [확인]*/
        pop.createServiceAction = function (serviceData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!serviceData.serveId) {
                alert("Service ID가 입력되지 않았습니다.");
                angular.element("createServiceForm.serveId").focus();
                $scope.actionBtnHied = false;
                return;
            }
            if (!serviceData.serveName) {
                alert("Service명이 입력되지 않았습니다.");
                angular.element("createServiceForm.serveName").focus();
                $scope.actionBtnHied = false;
                return;
            }
            if (!serviceData.secret) {
                alert("Secret이 입력되지 않았습니다.");
                angular.element("createServiceForm.secret").focus();
                $scope.actionBtnHied = false;
                return;
            }
            var param = {};
            param["serveId"]              = serviceData.serveId;
            param["serveName"]            = serviceData.serveName;
            param["secret"]               = serviceData.secret;
            param["url"]                  = serviceData.url;

            $scope.actionLoading = true;
            var domainPromise = serviceService.createService(param);
            domainPromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listServices();
                $scope.popHide();
            });
            domainPromise.error(function (data, status, headers) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.error = $translate.instant("label.error");
            });
        };

        /*[Service 수정] 팝업 [수정]*/
        pop.updateServiceAction = function (serviceData) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!serviceData.serveId) {
                alert("Service ID가 입력되지 않았습니다.");
                angular.element("createServiceForm.serveId").focus();
                $scope.actionBtnHied = false;
                return;
            }
            if (!serviceData.serveName) {
                alert("Service명이 입력되지 않았습니다.");
                angular.element("createServiceForm.serveName").focus();
                $scope.actionBtnHied = false;
                return;
            }
            if (!serviceData.secret) {
                alert("Secret이 입력되지 않았습니다.");
                angular.element("createServiceForm.secret").focus();
                $scope.actionBtnHied = false;
                return;
            }
            var param = {};
            param["serveId"]              = serviceData.serveId;
            param["serveName"]            = serviceData.serveName;
            param["secret"]               = serviceData.secret;
            param["url"]                  = serviceData.url;

            $scope.actionLoading = true;
            var domainPromise = serviceService.updateService(serviceData.serveId, param);
            domainPromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                ct.listServices();
                $scope.popHide();
            });
            domainPromise.error(function (data, status, headers) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.error = $translate.instant("label.error");
            });
        };

        /*Service 활성화/중지*/
        pop.updateServiceUseYnAction = function (serviceData) {

            var strUseYn = "Y";
            if(serviceData.useYn == 'Y') strUseYn = "N";

            var param = {};
            param["serveId"]              = serviceData.serveId;
            param["useYn"]                = strUseYn;

            $scope.main.loadingMainBody = true;
            var domainPromise = serviceService.updateServiceUseYn(serviceData.serveId, param);
            domainPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                ct.listServices();
            });
            domainPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        /*[Service 수정] 팝업 [삭제] 클릭*/
        pop.deleteService = function (serviceData) {
            var showConfirm = common.showConfirm($translate.instant('label.service_del') + "(" + serviceData.serveId + ")", $translate.instant('message.mq_delete_service'));
            showConfirm.then(function () {
                common.mdDialogHide();
                pop.deleteServiceAction(serviceData.serveId);
            });
        };

        /*[Service 수정] 팝업 [삭제] Action*/
        pop.deleteServiceAction = function(serveId){
            $scope.main.loadingMainBody=true;
            var promise = serviceService.deleteService(serveId);
            promise.success(function (data) {
                $scope.main.loadingMainBody=false;

                common.showAlert($translate.instant('label.service_del'), $translate.instant('message.mi_delete')).then(function () {
                    ct.listServices();
                });

                $scope.popHide();
            });
            promise.error(function (data, status, headers) {
                $scope.main.loadingMainBody=false;
                if (status == 406) {
                    common.showAlertHtml($translate.instant('label.service_del') + "(" + serveId + ")", "서비스가 사용중입니다.<br>삭제 불가합니다.");
                } else {
                    common.showAlert($translate.instant('label.service_del') + "(" + serveId + ")", data);
                }
            });
        };

        ct.listServices();

    })
;
