'use strict';

angular.module('portal.controllers')
    .controller('commRegionsCtrl', function ($scope, $location, $state, $stateParams, $translate, regionService, common, CONSTANTS) {
        _DebugConsoleLog("regionControllers.js : commRegionsCtrl", 1);

        var ct = this;

        $scope.main.loadingMainBody = true;
        $scope.createRegionData = {};
        ct.regions = [];

        // paging
        ct.pageOption = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.regionData = {};
        ct.regionData  = {};

        ct.showDetail = false;
        ct.mode = "";

        /*Region 목록 조회*/
        ct.listRegions = function (currentPage) {
            ct.showDetail = false;
            $scope.main.loadingMainBody = true;
            if (currentPage == undefined) currentPage = 1;
            ct.pageOption.currentPage = currentPage;
            var domainPromise = regionService.listRegions(ct.pageOption.pageSize, currentPage-1);
            domainPromise.success(function (data) {
                ct.regions = data.items;
                ct.pageOption.total = data.counts;

                $scope.main.loadingMainBody = false;
            });
            domainPromise.error(function (data, status, headers) {
                ct.regions = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /*그리드 클릭으로 상세 조회*/
        ct.viewDetail = function (regionItem){
            ct.regionData = regionItem;
            ct.mode = "R";
            ct.showDetail = true;
        };

        $scope.actionLoading = false; // action loading

        /*[Region 추가] 클릭*/
        ct.createRegion = function ($event) {
            var dialogOptions = {
                title : $translate.instant("label.region_add"),
                form : {
                    name: "createRegionForm",
                    options: "",
                },
                dialogClassName : "modal-lg",
                templateUrl: _COMM_ADMIN_VIEWS_+"/region/popRegionForm.html" + _VersionTail(),
                okName : $translate.instant("label.save")
            };
            pop.regionData = {};
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createRegionAction(pop.regionData);
            };
        };

        /*Region 수정*/
        ct.updateRegion = function ($event, region) {
            var dialogOptions = {
                title : "Region 수정",
                form : {
                    name: "updateRegionForm",
                    options: "",
                },
                dialogClassName : "modal-lg",
                templateUrl: _COMM_ADMIN_VIEWS_+"/region/popRegionForm.html" + _VersionTail(),
                okName : $translate.instant("label.edit")
            };
            pop.regionData	= region;
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updateRegionAction(pop.regionData);
            }
        };

        /*Region 삭제*/
        ct.deleteRegion = function (regionId, regionName) {
            var showConfirm = common.showConfirm($translate.instant('label.del') + "(" + regionName + ")", "Region을 삭제하시겠습니까?");
            showConfirm.then(function () {
                common.mdDialogHide();
                pop.deleteRegionAction(regionId);
            });
        };

        /*[Region 추가] 팝업 [확인]*/
        pop.createRegionAction = function (regionData) {
            if (!regionData.regionId) {
                alert("Region ID가 입력되지 않았습니다.");
                angular.element("createRegionForm.regionId").focus();
                return;
            }
            if (!regionData.regionName) {
                alert("Region 명이 입력되지 않았습니다.");
                angular.element("createRegionForm.regionName").focus();
                return;
            }
            $scope.actionLoading = true;
            var param = {};
            param["regionId"]             = regionData.regionId;
            param["regionName"]           = regionData.regionName;
            param["paasCcUrl"]            = regionData.paasCcUrl;
            param["paasUaaUrl"]           = regionData.paasUaaUrl;
            param["paasClientId"]         = regionData.paasClientId;
            param["paasClientSecret"]     = regionData.paasClientSecret;
            param["paasDirectorHost"]     = regionData.paasDirectorHost;
            param["paasDirectorPort"]     = regionData.paasDirectorPort;
            param["paasDirectorUserId"]   = regionData.paasDirectorUserId;
            param["paasDirectorSecret"]   = regionData.paasDirectorSecret;

            var domainPromise = regionService.createRegion(param);
            domainPromise.success(function (data) {
                $scope.actionLoading = false;

                common.showAlertHtml($translate.instant("label.region_add"), $translate.instant("message.mi_add_region")).then(function () {
                    ct.listRegions();
                });
            });
            domainPromise.error(function (data, status, headers) {
                $scope.actionLoading = false;
                $scope.error = $translate.instant("label.error");
                if(status == 401){          //Not Admin
                    common.showAlertErrorHtml($translate.instant("label.region_add"), $translate.instant("message.mi_no_admin_role"));
                }else if(status == 406){    //Dup
                    common.showAlertErrorHtml($translate.instant("label.region_add"), $translate.instant("message.mi_exist_duplicate_region_id"));
                }
            });
        };

        /*[Region 수정] 팝업 [수정]*/
        pop.updateRegionAction = function (regionData) {
            if (!regionData.regionId) {
                alert("Region ID가 입력되지 않았습니다.");
                angular.element("createRegionForm.regionId").focus();
                return;
            }
            if (!regionData.regionName) {
                alert("Region 명이 입력되지 않았습니다.");
                angular.element("createRegionForm.regionName").focus();
                return;
            }
            $scope.actionLoading = true;
            var param = {};
            param["regionId"]             = regionData.regionId;
            param["regionName"]           = regionData.regionName;
            param["paasCcUrl"]            = regionData.paasCcUrl;
            param["paasUaaUrl"]           = regionData.paasUaaUrl;
            param["paasClientId"]         = regionData.paasClientId;
            param["paasClientSecret"]     = regionData.paasClientSecret;
            param["paasDirectorHost"]     = regionData.paasDirectorHost;
            param["paasDirectorPort"]     = regionData.paasDirectorPort;
            param["paasDirectorUserId"]   = regionData.paasDirectorUserId;
            param["paasDirectorSecret"]   = regionData.paasDirectorSecret;

            var domainPromise = regionService.updateRegion(regionData.regionId, param);
            domainPromise.success(function (data) {
                $scope.actionLoading = false;

                common.showAlertHtml($translate.instant("label.region_edit"), $translate.instant("message.mi_edit_region")).then(function () {
                    ct.listRegions();
                });
            });
            domainPromise.error(function (data, status, headers) {
                $scope.actionLoading = false;
                $scope.error = $translate.instant("label.error");
            });
        };

        /*[Region 삭제]*/
        pop.deleteRegionAction = function (regionId) {
            $scope.main.loadingMainBody = true;
            var domainPromise = regionService.deleteRegion(regionId);
            domainPromise.success(function (data) {

                common.showAlertHtml($translate.instant("label.region_del"), $translate.instant("message.mi_delete_region")).then(function () {
                    ct.listRegions();
                    ct.regionData  = {};
                });
            });
            domainPromise.error(function (data, status, headers) {
                $scope.error = $translate.instant("label.error");
            });
        };

        ct.listRegions();
    })
;
