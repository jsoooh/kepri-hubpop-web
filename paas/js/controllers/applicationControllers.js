'use strict';

angular.module('paas.controllers')
    .controller('paasApplicationsCtrl', function ($scope, $location, $state, $stateParams, $translate, user, applicationService, common, CONSTANTS, $cookies) {
        _DebugConsoleLog("applicationControllers.js : paasApplicationsCtrl", 1);
        var ct = this;
        $scope.image=true;

        ct.searchSpaces = [];

        ct.searchSpaces = [];
        ct.sltSpaceGuid = "";
        ct.searchAppNames = [];
        ct.sltAppNames = [];
        ct.apps = [];
        ct.checkedApps = [];

        ct.sltOrganizationGuid = "";
        ct.sltSpaceGuid = "";

        ct.old_orgSelected = [];
        ct.pageFirstLoad = true;
        ct.appStateCnt = 0;

        ct.schFilterText = "";
        /* 20.05.08 - 리스트 타입에서 이름변경시 리스트 타입 화면으로 재조회.
         * 기본은 이미지 타입 by ksw */
        if (applicationService.listType != 'list') {
            ct.listType = "image";          //이미지 타입
        } else {
            ct.listType = "list";          //리스트 타입
        }
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        /* 20.06.03 - 대표 도메인 설정 후 리스트 화면 변경시 라우트 탭 선택되어 있는 상태를 초기화 by ksw */
        applicationService.sltInfoTab = '';

        // main changeOrganization 와 연결
        $scope.$on('organizationChanged', function(event, orgItem) {
            ct.pageLoadData();
        });

        ct.listSpaces = function () {
            var spacePromise = applicationService.listAllSpaces(ct.sltOrganizationGuid);
            spacePromise.success(function (data) {
                ct.isSpacesLoad = true;
                $scope.main.loadingMainBody = !ct.isAppsLoad;
                ct.searchSpaces = [];
                if (data && data.length > 0) {
                    for (var i=0; i<data.length; i++) {
                        if (data[i].apps && data[i].apps.length > 0) {
                            ct.searchSpaces.push(data[i]);
                        }
                    }
                }
                ct.searchSpaces.sort(function (a, b) { return (a.name > b.name) ? 1 : -1;});
                ct.changeSpace();
            });
            spacePromise.error(function (data) {
                ct.searchSpaces = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.changeSpace = function (orgItem) {
            $scope.main.setPortalOrg(orgItem);
            ct.listAllApps();
        };

        ct.firstAppCreatePop = function() {
            var dialogOptions = {
                controllerAs: "pop",
                templateUrl : _PAAS_VIEWS_ + "/application/firstAppPushPop.html" + _VersionTail(),
            };
            common.showCustomDialog($scope, null, dialogOptions);
        };

         ct.listAllApps = function () {
            $scope.main.loadingMainBody = true;
            var conditions = [];
            if (ct.sltOrganizationGuid) {
                conditions.push("organization_guid:" + ct.sltOrganizationGuid);
            }
            if (ct.sltSpaceGuid) {
                conditions.push("space_guid:" + ct.sltSpaceGuid);
            }
            if (ct.sltAppNames && ct.sltAppNames.length > 0) {
                conditions.push("name:" + ct.sltAppNames.join(","));
            }
            var appPromise = applicationService.listAllApps(conditions);
            appPromise.success(function (data) {
                ct.isAppsLoad = true;
                $scope.main.loadingMainBody = !ct.isSpacesLoad;
                var apps = [];
                if (data && angular.isArray(data)) {
                    apps = data;
                }
                common.objectOrArrayMergeData(ct.apps, apps);

                // 좌측 메뉴가 바뀌어서 추가한 구문 앱런타임 바로 볼 수 있도록 수정
                if (ct.apps.length != 0) {
                  $scope.main.appGuid = ct.apps[0].guid;
                    $scope.main.checkUseYnPaas = "Y";
                } else {
                    $scope.main.checkUseYnPaas = "N";
                }
                angular.forEach(ct.apps, function(option, mainKey) {
                    if (option.spaceQuota && option.spaceQuota.guid) {
                        option["memoryMax"] = option.spaceQuota.instanceMemoryLimit;
                    } else if (option.organization && option.organization.guid && option.organization.quotaDefinition && option.organization.quotaDefinition.guid) {
                        if (option.organization.quotaDefinition.instanceMemoryLimit > 0) {
                            option["memoryMax"] = option.organization.quotaDefinition.instanceMemoryLimit;
                        } else {
                            option["memoryMax"] = 4096;
                        }
                    } else {
                        option["memoryMax"] = 4096;
                    }
                    option["diskMax"] = 2048;
                    option["memoryPercent"] = (option.memory / option.memoryMax) * 100;
                    option["diskPercent"] = (option.diskQuota / 2048) * 100;

                    if (option.buildpack) {
                        var buildpackSplit = option.buildpack.split('_buildpack-');
                        option["buildpackName"] = buildpackSplit[0].toUpperCase();
                        if (option["buildpackName"] == 'STATICFILE') {
                            option["buildpackName"] = 'NGINX';
                        }
                        option["buildpackVersion"] = buildpackSplit[1].replace('-', '.');
                    } else {
                        option["buildpackName"] = "DOCKER";
                        option["buildpackVersion"] = "-";
                    }

                    ct.instanceStats = [];
                    ct.cpuRoundProgressPercentage = 0;
                    var appPromise2 = applicationService.listAllAppInstanceStats(option.guid);
                    appPromise2.success(function (data2) {
                        option["instanceStats"] = angular.copy(data2);
                        /* 20.04.14 by ksw - 인스턴스 상태가 하나라도 시작이면 앱 상태도 시작일수 있게 변경 */
                        option["instanceGroupStats"] = false;
                        angular.forEach(option.instanceStats, function(item) {
                            if (item.state == 'RUNNING') {
                                option["instanceGroupStats"] = true;
                                return false;
                            }
                        });
                        ct.isAppsLoad = false;
                        var instanceStatsUsageCpu = 0;
                        var instanceStatsUsageMemory = 0;
                        var instanceStatsUsageDisk = 0;

                        for (var i=0; i<option["instanceStats"].length; i++) {
                            if (option["instanceStats"][i].usage != null) {
                                instanceStatsUsageCpu += option["instanceStats"][i].usage.cpu * 100;
                                instanceStatsUsageMemory += (parseInt(option["instanceStats"][i].usage.mem, 10) * 100) / parseInt(option["instanceStats"][i].memQuota, 10);
                                instanceStatsUsageDisk += (parseInt(option["instanceStats"][i].usage.disk, 10) * 100) / parseInt(option["instanceStats"][i].diskQuota, 10);
                            }

                            if (option["instanceStats"][i].state == "CRASHED") {
                                ct.appStateCnt++;
                            } else if(option["instanceStats"][i].state == "STOPPED") {
                                ct.appStateCnt = 0;
                            }
                        }

                        option["cpuRoundProgressPercentage"] = (instanceStatsUsageCpu / option["instances"]).toFixed(1);
                        option["memoryRoundProgressPercentage"] = (instanceStatsUsageMemory / option["instances"]).toFixed(1);
                        option["diskRoundProgressPercentage"] = (instanceStatsUsageDisk / option["instances"]).toFixed(1);
                    });
                    appPromise.error(function (data) {
                        option["instanceStats"] = [];
                        option["cpuRoundProgressPercentage"] = 0;
                    });
                });

                /*if (ct.pageFirstLoad && (!ct.apps || ct.apps.length == 0)) {
                    ct.firstAppCreatePop();
                }*/

                ct.pageFirstLoad = false;
            });
            appPromise.error(function (data) {
                ct.apps = [];
                ct.pageFirstLoad = false;
            });
            appPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $scope.main.loadingMain = false;
            });
        };

        //사용하지 않는 듯함. 2020.02.06
        /*ct.getAppState = function (guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.getApp(guid, 0);
            appPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                var updateApp = common.objectsFindByField(ct.apps, "guid", data.guid);
                if (updateApp && updateApp.guid) {
                    updateApp.state = data.state;
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };*/

        $scope.fieldTable = [{
            field: "선택",
            method: ""
        }, {
            field: "시작",
            method: "startAppState"
        }, {
            field: "정지",
            method: "stopAppState"
        },{
            field: "재시작",
            method: "startAppState"
        },{
            field: "삭제",
            method: "deleteApp"
        },{
            field: "이름변경",
            method: "renameAppList"
        }];

        $scope.selected = $scope.fieldTable[0];

        //사용하지 않는 듯함. 2020.02.06
        /*ct.controllAppState = function(selected, guid, name, $event){
            if(selected.field == "시작"){
                ct.startAppState(guid, name);
            }else if(selected.field == "재시작"){
                ct.startAppState(guid, name, 'restart');
            }else if(selected.field == "정지"){
                ct.stopAppState(guid, name);
            }else if(selected.field == "삭제"){
                ct.deleteApp(guid, name);
            }else if(selected.field == "이름변경"){
                ct.renameAppList(guid, name, $event);
            }
        };

        ct.checkStartApp = function () {
            var startApps = [];
            for (var i=0; i<ct.checkedApps.length; i++) {
                var updateApp = common.objectsFindCopyByField(ct.apps, "guid", ct.checkedApps[i]);
                if (updateApp && updateApp.guid && updateApp.state == "STOPPED") {
                    startApps.push(ct.checkedApps[i]);
                }
            }
            if (startApps.length > 0) {
                var showConfirm = common.showConfirm($translate.instant('label.start') + "(" + startApps.length + ")", $translate.instant('message.mq_start_app'));
                showConfirm.then(function () {
                    common.mdDialogHide();
                    for (var i=0; i<startApps.length; i++) {
                        ct.updateAppStateAction(startApps[i], "STARTED");
                    }
                });
            } else {
                common.showAlertWarning($translate.instant('label.start'), $translate.instant('message.mi_select_stopped_apps'));
            }
        };

        ct.checkStopApp = function () {
            var stopApps = [];
            for (var i=0; i<ct.checkedApps.length; i++) {
                var updateApp = common.objectsFindCopyByField(ct.apps, "guid", ct.checkedApps[i]);
                if (updateApp && updateApp.guid && updateApp.state == "STARTED") {
                    stopApps.push(ct.checkedApps[i]);
                }
            }
            if (stopApps.length > 0) {
                var showConfirm = common.showConfirm($translate.instant('label.stop') + "(" + stopApps.length + ")", $translate.instant('message.mq_stop_app'));
                showConfirm.then(function () {
                    common.mdDialogHide();
                    for (var i=0; i<stopApps.length; i++) {
                        ct.updateAppStateAction(stopApps[i], "STOPPED");
                    }
                });
            } else {
                common.showAlertWarning($translate.instant('label.stop'), $translate.instant('message.mi_select_started_apps'));
            }
        };

        ct.startApp = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.start') + "(" + name + ")", $translate.instant('message.mq_start_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.startAppAction(guid);
            });
        };

        ct.stopApp = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.stop') + "(" + name + ")", $translate.instant('message.mq_stop_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.stopAppAction(guid);
            });
        };*/

        ct.startAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.startApp(guid);
            appPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                var updateApp = common.objectsFindByField(ct.apps, "guid", data.guid);
                if (updateApp && updateApp.guid) {
                    updateApp.state = data.state;
                    updateApp.packageState = data.packageState;
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.stopAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.stopApp(guid);
            appPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                var updateApp = common.objectsFindByField(ct.apps, "guid", data.guid);
                if (updateApp && updateApp.guid) {
                    updateApp.state = data.state;
                    updateApp.packageState = data.packageState;
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.deleteAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.deleteApp(guid);
            appPromise.success(function (data) {
                common.showAlertSuccess("삭제가 완료 되었습니다.");
                ct.listAllApps();
                //앱 삭제 후 main organization 정보 재조회. 삭제 후 앱 이름 중복 에러 관련. 2019.07.12
                $scope.main.loadSltOrganization();
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.startAppState = function(guid, name, type) {
            if (type == 'restart') {
                var showConfirm = common.showConfirm($translate.instant('label.restart') + "(" + name + ")", $translate.instant('message.mq_restart_app'));
            } else {
                var showConfirm = common.showConfirm($translate.instant('label.start') + "(" + name + ")", $translate.instant('message.mq_start_app'));
            }
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.updateAppStateAction(guid, "STARTED");
            });
        };

        ct.stopAppState = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.stop') + "(" + name + ")", $translate.instant('message.mq_stop_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.updateAppStateAction(guid, "STOPPED");
            });
        };

        ct.updateAppStateAction = function(guid, state) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.updateAppState(guid, state);
            appPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                var updateApp = common.objectsFindByField(ct.apps, "guid", data.guid);
                if (updateApp && updateApp.guid) {
                    updateApp.state = data.state;
                    updateApp.packageState = data.packageState;
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.restartApp = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.restart') + "(" + name + ")", $translate.instant('message.mq_restart_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.restartAppAction(guid);
            });
        };

        ct.restartAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.restartApp(guid);
            appPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                var updateApp = common.objectsFindByField(ct.apps, "guid", data.guid);
                if (updateApp && updateApp.guid) {
                    updateApp.state = data.state;
                    updateApp.packageState = data.packageState;
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.moveToApplicationPage = function (appItem) {
            $scope.main.datailOrgName = appItem.organizationName;
            $scope.main.spaceName = appItem.spaceName;
            $scope.main.applicationName = appItem.name;
            $scope.main.goToPage("/paas/apps/" + appItem.guid);
        };

        ct.pageLoadData = function () {
            if ($scope.main.sltOrganizationGuid) {
                $scope.main.loadingMainBody = true;
                ct.sltOrganizationGuid = $scope.main.sltOrganizationGuid;
                ct.listAllApps();
            } else {
                ct.sltOrganizationGuid = "";
            }
        };

        ct.renameApp = function (appName, type)  {
            var appNameTxt = document.getElementById('txt-renameApp-'+appName);
            var buttonDiv = document.getElementById('renameAppButton-'+appName);

            if(appNameTxt.style.display=='none') {
                appNameTxt.style.display = 'block';
                buttonDiv.style.display ='none';
            } else {
                appNameTxt.style.display = 'none';
                buttonDiv.style.display ='block';
            }
        };

        ct.updateAppName = function(inputName, guid) {
            if (inputName.length < 3) {
                common.showAlert("", "최소 3자 이상이어야 합니다.");
                return;
            }

            var inputName = document.getElementById('inputAppName-'+inputName);
            var newName = inputName.name;
            var guid = inputName.dataset.guid;

            if(guid == null) {
                var inputName = document.getElementById('inputAppName-'+inputName);
                var newName = inputName.name;
                var guid = inputName.dataset.guid;
            }

            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.updateAppNameAction(guid, newName);
            appPromise.success(function (data) {
                /* 20.05.08 - 리스트 타입에서 이름변경시 리스트 타입 화면으로 재조회.
                * 기본은 이미지 타입 by ksw */
                if (ct.listType == 'list') {
                    applicationService.listType = 'list'
                } else {
                    applicationService.listType = 'image'
                }
                ct.listAllApps();
                $state.go($state.current, {}, {reload: true});
                $scope.main.loadingMainBody = false;
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.renameAppList = function (guid, name, $event) {
            var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
            $scope.dialogOptions = {
                title : "이름변경",
                formName : "renameForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/application/renameApp.html" + _VersionTail(),
                okName : $translate.instant("label.edit")
            };

            $scope.pop.newName = name;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                ct.updateAppName(pop.newName, guid);
                $scope.popHide();
            };
        };

        ct.pageLoadData();
    })
    .controller('paasApplicationPushCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, user, applicationService, routeService, cloudFoundry, ValidationService, FileUploader, common, CONSTANTS, $cookies) {
        _DebugConsoleLog("applicationControllers.js : paasApplicationPushCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct 					= this;
        ct.formName 			= "appPushForm01";
        ct.organizations 		= [];
        ct.sltOrganization 		= {};
        ct.spaces 				= [];
        ct.sltSpace  			= {};
        ct.domains 				= [];
        ct.sltDomainName        = "";
        ct.buildpacks 			= [];
        ct.portalBuildpacks 	= [];
        ct.portalBuildpackVersions = [];
        ct.sltPortalBuildpack  	= {};
        ct.appPushData   		= {};
        ct.sltDeployOption 		= "U";
        ct.fn   		= {};
        ct.subDomainList        = [];
        
        // 호스트 중복 체크 확인
        ct.hostDup 				= false;

        /*
         *  1. 빌드팩 정보 필요. (화면 맵핑 필요)
         *  2. 앱 파일 업로드의 실행파일 / 소스코드의 VALUE값 정의후 구현 추가.
         *  3. 실행환경 사양설정 : 차후 퍼블리싱 후에 다시 재작업필요.
         *  4. 우측 빌드팩정보 및 실행소스 및 실행환경 사양 맵핑 필요.
         *  
         * */
        
        var uploadFilters = [];
        uploadFilters.push({
            name: 'syncFilter',
            fn: function (item, options) {
                ct.uploader.clearQueue();
                var contentTypes =  item.type.split("/");
                var fileNames =  item.name.split(".");
                var ftype = '|' + fileNames[fileNames.length - 1].toLowerCase() + '|';
                var ctype = '';
                
                if (contentTypes.length == 2) {
                    ctype =  '|' + contentTypes[1].toLowerCase() + '|';
                }
                
                if ((ctype && '|x-webarchive|x-java-archive|zip|'.indexOf(ctype) !== -1)
                    || ('|war|jar|zip|'.indexOf(ftype) !== -1)) {
                    return true;
                } else {
                    item.error = "error";
                    item.message = "mi_only_app_file";
                    return false;
                }
            }
        });

        ct.uploader = common.setDefaultFileUploader($scope, { filters : uploadFilters });

        ct.uploader.onWhenAddingFileFailed = function (item) {
            _DebugConsoleInfo('onWhenAddingFileFailed', item);
            
            if (item.error && item.message) {
                var errMessage = "{{ 'message." + item.message + "' | translate }}";
                ct.appFileItem = null;
                item.error     = null;
                item.message   = null;
                ct.appFileErrorMessage = errMessage;
            }
        };

        ct.uploader.onAfterAddingFile = function (fileItem) {
            _DebugConsoleInfo('onAfterAddingFile', fileItem);
            
            ct.appFileErrorMessage = "";
            ct.appFileItem = fileItem;
            var localFullFileName = "";
            if($('#appFileInput').length > 0){
                localFullFileName = $('#appFileInput').val().substring($('#appFileInput').val().lastIndexOf('\\')+1);
            }
            ct.appFileItem.localFullFileName = localFullFileName;
        };

        // 언어 선택 스크롤 생성
        ct.scrollPane = function (){
            setTimeout(function() {
                var scrollPane = $('.scroll-pane').jScrollPane({});
            }, 250);
        };

        ct.appPushData.pushType   		 = "GENERAL";
        ct.appPushData.appName   		 ='app-01';
        ct.appPushData.domainFirstName   ='app-01';
        ct.appPushData.withStart 		 = "true";
        
        //감소버튼 클릭시 이벤트 sg0730
        ct.minValCheck = function (val) {
        	
        	if (val == 1) {
        		if(ct.defaultSet.instances > ct.insSlider.options.minLimit) {
    				ct.defaultSet.instances = (ct.defaultSet.instances - ct.insSlider.options.step);
    			} else {
        			return false;
        		}		
			} else if (val == 2) {
        		if(ct.defaultSet.memory > ct.memorySlider.options.minLimit) {
    				ct.defaultSet.memory = (ct.defaultSet.memory - ct.memorySlider.options.step);
    			} else {
        			return false;
        		}	
        			
			} else if (val == 3) {
        		if(ct.defaultSet.diskQuota > ct.diskQuotaSlider.options.minLimit) {
    				ct.defaultSet.diskQuota = (ct.defaultSet.diskQuota - ct.diskQuotaSlider.options.step);
    			} else {
        			return false;
        		}	
			} 
        };

        //증가 버튼 클릭시 이벤트 sg0730
        ct.maxValCheck = function (val) {
        	if (val == 1) {
        		if(ct.defaultSet.instances <= ct.insSlider.options.ceil)
    			{
    				ct.defaultSet.instances = (ct.defaultSet.instances + ct.insSlider.options.step);
    				
    				if (ct.defaultSet.instances > ct.insSlider.options.ceil) {
    					ct.defaultSet.instances = ct.insSlider.options.ceil ;
					}
    			} else {
        			return false;
        		}		
			} else if (val == 2) {
        		if(ct.defaultSet.memory <= ct.memorySlider.options.ceil) {
    				ct.defaultSet.memory = (ct.defaultSet.memory + ct.memorySlider.options.step);
    				
    				if (ct.defaultSet.memory > ct.memorySlider.options.ceil) {
    					ct.defaultSet.memory = ct.memorySlider.options.ceil ;
					}
    				
    			} else {
        			return false;
        		}	
			} else if (val == 3) {
        		if(ct.defaultSet.diskQuota <= ct.diskQuotaSlider.options.ceil) {
    				ct.defaultSet.diskQuota = (ct.defaultSet.diskQuota + ct.diskQuotaSlider.options.step);
    				
    				if (ct.defaultSet.diskQuota > ct.diskQuotaSlider.options.ceil) {
    					ct.defaultSet.diskQuota = ct.diskQuotaSlider.options.ceil ;
					}
    			} else {
        			return false;
        		}	
			} 
        };
        
        // ct.visible 				= false; 
        
        /*ct.toggle = function () {
            ct.visible = !ct.visible;
            if (ct.visible)
              ct.refreshSlider();
        };*/
          
        /*ct.refreshSlider = function () {
            $timeout(function () {
              $scope.$broadcast('rzSliderForceRender');
            });
          };
        */

        ct.defaultSet = {
					            instances: 1,
					            memory: 1024,
					            diskQuota: 512
					        };
        
       // ct.insVal = 1;
        
        ct.insSlider = {
        			        	options: {
        			        		showSelectionBar : true,
        			                floor: 0,
        			                ceil: 20,
        			                step: 1,
        			                minLimit: 1,
        			                translate: function(value) {
        			                    return value + '개';
        			                }
        			        	}
					        };

        ct.memorySlider = {
					            options: {
							                floor: 0,
							                ceil: 4096,
							                step: 128,
							                minLimit: 128,
							                maxLimit: 4096,
							                showSelectionBar: true,
		        			                translate: function(value) {
		        			                    return value + 'MB';
		        			                }
							            }
					        };

        ct.diskQuotaSlider = {
						            options: {
									            floor: 0,
									            ceil: 2048,
									            step: 128,
									            minLimit: 128,
									            showSelectionBar: true,
			        			                translate: function(value) {
			        			                    return value + 'MB';
			        			                }
									         }
						      };

     
        ct.listAllOrganizations = function () {
        	
            var organizationPromise = applicationService.listAllOrganizations();
            
            organizationPromise.success(function (data) {
                var organizations = [];
                if (data && angular.isArray(data)) {
                    organizations = data;
                }

                $scope.main.organizations = angular.copy(organizations);
                $scope.main.syncListAllPortalOrgs();
                ct.organizations = $scope.main.sinkPotalOrgsName(organizations);

                ct.changeOrganization();
                
                ct.isOrganizationData 	  = true;
                
                if (ct.isBuildpackData && ct.isPortalBuildpackData) {
                    $scope.main.loadingMainBody = false;
                }
            });
            organizationPromise.error(function (data) {
                ct.organizations 			= [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.portalBuildpacksLoad = false;
        ct.setPortalBuildpacks = function () {
        	
            ct.portalBuildpacks = [];
            
            for (var i=0; i<ct.portalBuildpackVersions.length; i++)  {
                var buildpackName = ct.portalBuildpackVersions[i].portalBuildpack.name + "_buildpack-" + ct.portalBuildpackVersions[i].version;
                var sltBuildpack  = common.objectsFindCopyByField(ct.buildpacks, "name", buildpackName);
                
                if (sltBuildpack != null && sltBuildpack.enabled) {
                    var portalBuildpackId   = ct.portalBuildpackVersions[i].portalBuildpack.id;
                    var addVersion 		  = false;
                    var version = {
				                        id          : ct.portalBuildpackVersions[i].id,
				                        version     : ct.portalBuildpackVersions[i].version,
				                        versionName : ct.portalBuildpackVersions[i].version.replace(/-/g, '.'),
				                        description : ct.portalBuildpackVersions[i].description,
				                        url         : ct.portalBuildpackVersions[i].url
				                   };
                    
                    for (var j = 0; j < ct.portalBuildpacks.length; j++) {
                        if (ct.portalBuildpacks[j].id == portalBuildpackId) 
                        {
                            ct.portalBuildpacks[j].versions.push(version);
                           
                            addVersion = true;
                            break;
                        }
                    }
                    
                    
                    if (!addVersion) {
                        var portalBuildpack 	 = angular.copy(ct.portalBuildpackVersions[i].portalBuildpack);
                        portalBuildpack.versions = [];
                        portalBuildpack.versions.push(version);
                        ct.portalBuildpacks.push(portalBuildpack);
                    }
                }
            } 
            
            ct.sltBuildpackId = null;
            ct.changePortalBuildpack();
            ct.portalBuildpacksLoad = true;
            $scope.main.loadingMainBody = false;
        };

        ct.listAllBuildpacks = function () {
            ct.buildpacks = [];
            var buildpackPromise = applicationService.listAllBuildpacks();
            
            buildpackPromise.success(function (data) {
                ct.buildpacks 		= data;
                ct.isBuildpackData  = true;
                
                if (ct.isPortalBuildpackData) {
                    ct.setPortalBuildpacks();
                }
            });
            buildpackPromise.error(function (data) {
                ct.portalBuildpacksLoad = true;
                $scope.main.loadingMainBody = false;
            });
        };

        ct.listAllPortalBuildpackVersions = function () {
            
        	var portalBuildpackPromise = applicationService.listAllPortalBuildpackVersions();
            
            portalBuildpackPromise.success(function (data) {
                ct.portalBuildpackVersions  = data;
                ct.isPortalBuildpackData 	= true;
                
                if (ct.isBuildpackData) {
                    ct.setPortalBuildpacks();
                }
            });
            portalBuildpackPromise.error(function (data) {
                ct.portalBuildpacks 		= [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.changePortalBuildpack = function () {
        	
            ct.sltPortalBuildpack = ct.sltBuildpackId ? common.objectsFindCopyByField(ct.portalBuildpacks, "id", ct.sltBuildpackId) : null;
            
            if (ct.sltPortalBuildpack == null) 
            {
                ct.sltPortalBuildpack = ct.portalBuildpacks[0];
                ct.sltBuildpackId 	  = ct.sltPortalBuildpack.id;
            }
                        
            if (ct.sltPortalBuildpack.versions.length > 0) 
            {
                ct.sltBuildpackVersionId = ct.sltPortalBuildpack.versions[0].id;
                ct.changePortalBuildpackVersion();
            } else {
                ct.sltBuildpackVersionId = "";
                ct.sltBuildpackVersion   = {};
            }
                        
            if (!ct.sltPortalBuildpack.appFilePath) {
                ct.sltDeployOption = "U";
            }
        };

        ct.changePortalBuildpackVersion = function () {
            ct.sltBuildpackVersion = common.objectsFindCopyByField(ct.sltPortalBuildpack.versions, "id", ct.sltBuildpackVersionId);
        };

        ct.changeSpace = function () {
        	
            if (ct.appPushData.spaceGuid) {
                ct.sltSpace = common.objectsFindCopyByField(ct.spaces, "guid", ct.appPushData.spaceGuid);
                
                if (!ct.sltSpace || !ct.sltSpace.guid)  {
                    ct.appPushData.spaceGuid = "";
                } else {
                    if (ct.sltSpace.serviceInstances && ct.sltSpace.serviceInstances.length > 0) {
                        ct.serviceInstances 			   = angular.copy(ct.sltSpace.serviceInstances);
                        ct.appPushData.serviceInstanceGuid = "";
                    } else {
                        ct.serviceInstances 			   = [];
                        ct.appPushData.serviceInstanceGuid = "";
                    }
                }
            }
        };

        ct.changeOrganization = function () {
            if (ct.appPushData.organizationGuid) {
                ct.sltOrganization = common.objectsFindCopyByField(ct.organizations, "guid", ct.appPushData.organizationGuid);
                ct.spaces 		   = angular.copy(ct.sltOrganization.spaces);
                
                ct.changeSpace();
                
                if (ct.sltOrganization.domains && ct.sltOrganization.domains.length > 0) {
                    ct.domains 		 = angular.copy(ct.sltOrganization.domains);
                    ct.sltDomainName = ct.domains[0].name;
                } else {
                    ct.domains 		 = [];
                    ct.sltDomainName = "";
                }
            } else {
                ct.sltOrganization 		 = {};
                ct.spaces 				 = [];
                ct.sltSpace 			 = {};
                ct.appPushData.spaceGuid = "";
                ct.domains 				 = [];
                ct.sltDomainName 		 = "";
            }
        };

        // 이미 사용하고 있는 호스트인지 확인
        ct.checkDuplRoute = function () {
            ct.hostDup = false;
            for (var i = 0; i < ct.domains.length; i++) {
                if (ct.domains[i].name == ct.sltDomainName) {
                    $scope.main.loadingMainBody = true;
                    var routePromise = routeService.checkDuplRoute(ct.domains[i].guid, ct.appPushData.domainFirstName);
                    routePromise.success(function (data) {
                        $scope.main.loadingMainBody = false;
                        if (!data) {
                            ct.appPush();
                        } else if (ct.appPushData.appName == ct.appPushData.domainFirstName) {
                            ct.hostDup = true;
                            common.showAlertError("이미 사용중인 APP 이름입니다.");
                        } else {
                            ct.hostDup = true;
                            common.showAlertError("이미 사용중인 APP 도메인입니다.");
                        }
                    });
                    routePromise.error(function (data) {
                        $scope.main.loadingMainBody = false;
                    });
                    break;
                }
            }
        };

        //Insert
        ct.appPush = function () {
            
        	if ($scope.actionBtnHied) return;
            
        	$scope.actionBtnHied = true;
            
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                $scope.actionBtnHied = false;
                common.showAlertError("이미 사용중인 APP 이름입니다.");
                return;
            }

            //$scope.main.loadingMain 	= true;
            //$scope.main.loadingMainBody = true;
            var appBody 				= {};
            appBody.organizationGuid 	= ct.appPushData.organizationGuid;
            appBody.spaceGuid 			= ct.appPushData.spaceGuid;
            appBody.pushType 			= ct.appPushData.pushType;
            
            if (ct.appPushData.pushType == "DOCKER") {
                appBody.dockerImage = ct.appPushData.dockerImage;
            } else {
                appBody.buildpack 	= ct.sltPortalBuildpack.name + '_buildpack-' + ct.sltBuildpackVersion.version;
            }

            appBody.appName 	= ct.appPushData.appName;
            appBody.hostName 	= ct.appPushData.domainFirstName + "." + ct.sltDomainName;
            //2020.01.22 수정. 생성 즉시 start로 배포 시간 단축
            appBody.withStart 	= true;

            //배포옵션 기본 하드코딩
            if (ct.sltDeployOption == "B") {
                appBody.appFilePath = ct.sltPortalBuildpack.appFilePath;
                appBody.instances 	= ct.defaultSet.instances;
                appBody.memory 		= ct.defaultSet.memory;
                appBody.diskQuota 	= ct.defaultSet.diskQuota;
            } else {
                if (ct.appPushData.serviceInstanceGuid) {
                    appBody.serviceInstanceGuid = ct.appPushData.serviceInstanceGuid;
                }
                appBody.instances = ct.defaultSet.instances;
                appBody.memory 	  = ct.defaultSet.memory;
                appBody.diskQuota = ct.defaultSet.diskQuota;
            }
            
            if (ct.appFileItem) {
                appBody.file 	   = ct.appFileItem._file;
                $scope.main.loadingMainBody = true;
                var appPushPromise = applicationService.appFilePush(appBody);
                appPushPromise.success(function (data) {
                    $scope.actionBtnHied 		= false;
                    $scope.main.loadingMain 	= false;
                    $scope.main.loadingMainBody = false;

                    common.showAlertSuccessHtml($translate.instant("label.app") + "(" + data.name + ")", $translate.instant("message.mi_register_success"));

                    //2020.01.22 수정. 생성 즉시 start로 화면단에서 start 할 필요 없음
                    //$scope.main.startAppGuid = data.guid;
                    $scope.main.goToPage('/paas/apps/' + data.guid);
                });
                appPushPromise.error(function (data) {
                    $scope.actionBtnHied = false;
                    $scope.main.loadingMainBody = false;
                });
                appPushPromise.progress(function (progress) {
                    _DebugConsoleInfo('progress', progress);
                });
            } else {
                var appPushPromise 				= applicationService.appPush(appBody);
                
                appPushPromise.success(function (data) {
                    $scope.actionBtnHied 		= false;
                    $scope.main.loadingMain 	= false;
                    $scope.main.loadingMainBody = false;

                    common.showAlertSuccess($translate.instant("message.mi_register_success"));
                    $scope.main.startAppGuid = data.guid;
                    $scope.main.goToPage('/paas/apps/' + data.guid);

                });
                
                appPushPromise.error(function (data) {
                    $scope.actionBtnHied = false;
                    $scope.main.loadingMain = false;
                    $scope.main.loadingMainBody = false;
                });
            }
        };

        ct.pageLoadData = function () {
            $scope.main.loadingMainBody 		= true;
            ct.isOrganizationData 				= false;
            ct.isBuildpackData 					= false;
            ct.isPortalBuildpackData 			= false;
            ct.sltOrganization 					= $scope.main.sltOrganization;
            ct.sltOrganizationGuid 				= $scope.main.sltOrganization.guid;
            ct.appPushData.organizationGuid 	= $scope.main.sltOrganization.guid;
            ct.appPushData.spaceGuid 			= $scope.main.sltOrganization.spaces[0].guid;

            if ($scope.main.sltOrganization.domains && $scope.main.sltOrganization.domains.length > 0) {
                ct.domains 		 = angular.copy($scope.main.sltOrganization.domains);
                ct.sltDomainName = ct.domains[0].name;
            }
            
            ct.listAllBuildpacks();
            ct.listAllPortalBuildpackVersions();
            ct.getSubDomainList();
        };

        ct.getSubDomainList = function () {
            var condition = '';
            if (ct.domains[0].guid) {
                condition = "domain_guid:" + ct.domains[0].guid;
            }

            var routePromise = cloudFoundry.routes.listRoutes(10, 1, condition, 1);
            routePromise.success(function (data) {
                ct.subDomainList = data;
                $scope.main.loadingMainBody = false;
            });
            routePromise.error(function (data) {
                ct.domainList = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.fn.appNameValidationCheck = function(appName) {
            if (appName) {
                for (var i = 0; i < ct.sltOrganization.spaces[0].apps.length; i++) {
                    if (appName == ct.sltOrganization.spaces[0].apps[i].name) {
                        return {isValid : false, message: "이미 사용중인 APP 이름입니다."};
                    }
                }
                return {isValid : true};
            }
        };

        ct.fn.subDomainValidationCheck = function(subDomainName) {
            if(subDomainName){
                if(ct.subDomainList.content){
                    for(var i = 0; i < ct.subDomainList.content.length; i++) {
                        if (subDomainName == ct.subDomainList.content[i].host) {
                            return {isValid : false, message: "이미 사용중인 APP 도메인입니다."};
                        }
                    }
                }
                return {isValid : true};
            }
        };

        ct.pageLoadData();
    })
    .controller('paasApplicationDetailCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, user, portal, applicationService, ValidationService, common, CONSTANTS, $compile, $interval) {
        _DebugConsoleLog("applicationControllers.js : paasApplicationDetailCtrl", 1);

        // 뒤로 가기 버튼 활성화
        $scope.main.displayHistoryBtn = true;

        var ct = this;
        ct.sltOrganizationGuid = "";
        ct.sltSpaceGuid = "";
        ct.appGuid = $stateParams.guid;
        ct.app = {};
        ct.appStateCnt = 0;

        /* 20.06.03 - 기본은 appLog, 대표 도메인 설정시 route로 설정 by ksw */
        if (applicationService.sltInfoTab == 'route') {
            ct.sltInfoTab = 'route';
        } else {
            ct.sltInfoTab = 'appLog';
        }

        ct.cpuRoundProgress = {
            label : "{percentage}%",
            percentage : 0,
            value : ""
        };

        ct.memoryRoundProgress = {
            label : "{percentage}%",
            percentage : 0,
            value : "",
            value2 : ""
        };

        ct.diskRoundProgress = {
            label : "{percentage}%",
            percentage : 0,
            value : ""
        };

        ct.cpuSlider = {
            value : 1,
            tooltip_position: 'bottom',
            options: {
                floor: 0,
                ceil: 100,
                step: 1,
                minLimit: 1,
                value : 1,
                showSelectionBar: true
            },
            formatter: function(){
                return ct.cpuSlider.options.value + '%';
            }
        };

        ct.defaultSetting = {
            instances: 1,
            memory: 768,
            diskQuota: 512
        };

        ct.instancesSlider = {
            value : ct.defaultSetting.instances,
            options: {
                floor: 0,
                ceil: 20,
                step: 1,
                minLimit: 1,
                showSelectionBar: true
            }
        };

        ct.memorySlider = {
            value : ct.defaultSetting.memory,
            options: {
                floor: 0,
                ceil: 4096,
                step: 128,
                minLimit: 128,
                showSelectionBar: true
            }
        };

        ct.diskQuotaSlider = {
            value : ct.defaultSetting.diskQuota,
            options: {
                floor: 0,
                ceil: 2048,
                step: 128,
                minLimit: 128,
                showSelectionBar: true
            }
        };

        //감소버튼 클릭시 이벤트 sg0730
        ct.minValCheck = function (val) {
            if (val == 1) {
                if(ct.instancesSlider.value > ct.instancesSlider.options.minLimit) {
                    ct.instancesSlider.value = (ct.instancesSlider.value - ct.instancesSlider.options.step);
                } else {
                    return false;
                }
            } else if (val == 2) {
                if(ct.memorySlider.value > ct.memorySlider.options.minLimit) {
                    ct.memorySlider.value = (ct.memorySlider.value - ct.memorySlider.options.step);
                } else {
                    return false;
                }

            } else if (val == 3) {
                if(ct.diskQuotaSlider.value > ct.diskQuotaSlider.options.minLimit) {
                    ct.diskQuotaSlider.value = (ct.diskQuotaSlider.value - ct.diskQuotaSlider.options.step);
                } else {
                    return false;
                }
            }
        };

        //증가 버튼 클릭시 이벤트 sg0730
        ct.maxValCheck = function (val) {
            if (val == 1) {
                if(ct.instancesSlider.value <= ct.instancesSlider.options.ceil) {
                    ct.instancesSlider.value = (ct.instancesSlider.value + ct.instancesSlider.options.step);

                    if (ct.instancesSlider.value > ct.instancesSlider.options.ceil) {
                        ct.instancesSlider.value = ct.instancesSlider.options.ceil ;
                    }
                } else {
                    return false;
                }
            } else if (val == 2) {
                if(ct.memorySlider.value <= ct.memorySlider.options.ceil) {
                    ct.memorySlider.value = (ct.memorySlider.value + ct.memorySlider.options.step);

                    if (ct.memorySlider.value > ct.memorySlider.options.ceil) {
                        ct.memorySlider.value = ct.memorySlider.options.ceil ;
                    }

                } else {
                    return false;
                }
            } else if (val == 3) {
                if(ct.diskQuotaSlider.value <= ct.diskQuotaSlider.options.ceil) {
                    ct.diskQuotaSlider.value = (ct.diskQuotaSlider.value + ct.diskQuotaSlider.options.step);

                    if (ct.diskQuotaSlider.value > ct.diskQuotaSlider.options.ceil) {
                        ct.diskQuotaSlider.value = ct.diskQuotaSlider.options.ceil ;
                    }
                } else {
                    return false;
                }
            }
        };

        ct.originalInstances = 0;
        ct.originalMemory = 0;
        ct.originalDisk = 0;

        ct.defaultAutoScalingInstancesSlider = {
            minValue : 1,
            maxValue : 20,
            options: {
                floor: 0,
                ceil: 20,
                step: 1,
                minLimit: 1,
                minRange: 1,
                pushRange: true,
                noSwitching: true,
                showSelectionBar : true,
                disabled : true
            }
        };

        ct.defaultAutoScalingMemorySlider = {
            minValue : 10,
            maxValue : 100,
            options: {
                floor: 10,
                ceil: 100,
                step: 10,
                minRange: 10,
                pushRange: true,
                noSwitching: true,
                showSelectionBar: true,
                disabled : true
            }
        };

        $scope.main.loadingMainBody = false;

        ct.changeViewType = function (type) {
            document.getElementsByClassName('btn btn-list')[1].classList.remove('on');
            document.getElementsByClassName('btn btn-list')[2].classList.remove('on');
            if (type == 'image') {
                $scope.image = true;
                document.getElementsByClassName('btn btn-list type1')[0].classList.add('on');
            } else {
                $scope.image = false;
                document.getElementsByClassName('btn btn-list type2')[0].classList.add('on');
            }
        };

        ct.showRightFormRePush = function ($event) {
            $scope.main.layerTemplateUrl = _PAAS_VIEWS_ + "/application/appRePush.html" + _VersionTail();
            //console.log($scope.main.layerTemplateUrl);

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

        //재배포
        ct.showFormRePush = function ($event) {

            ct.instancesSlider.value = ct.app.instances;
            ct.memorySlider.value = ct.app.memory;
            ct.diskQuotaSlider.value = ct.app.diskQuota;

            var dialogOptions = {
                controller : "paasApplicationRePushFormCtrl" ,
                formName   : 'paasApplicationRePushForm',
                callBackFunction : ct.rePushCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = false; // action loading
        };

        ct.rePushCallBackFunction = function () {
            ct.getAppStats(false);
        };

        ct.closeFormRePush = function (evt) {
            $(".aside").stop().animate({"right":"-360px"}, 600);
        };

        ct.resourceForm = function (evt) {
            $(evt.target).next(".instBox").slideToggle();

            /* range - 오른쪽 영역 범례 */
            $("#ex1Slider1").remove();
            var slider1 = new Slider('.eff-report1', {
                tooltip_position: "bottom",
                formatter: function formatter(val) {
                    var txt = $('.eff-report1').attr("data-slider-tool");
                    if (Array.isArray(val)) {
                        return val[0] + " : " + val[1];
                    } else {
                        return val + " " + txt;
                    }
                }
            });

            $("#ex1Slider2").remove();
            var slider2 = new Slider('.eff-report2', {
                tooltip_position: "bottom",
                formatter: function formatter(val) {
                    var txt = $('.eff-report2').attr("data-slider-tool");
                    if (Array.isArray(val)) {
                        return val[0] + " : " + val[1];
                    } else {
                        return val + " " + txt;
                    }
                }
            });

            $("#ex1Slider3").remove();
            var slider3 = new Slider('.eff-report3', {
                tooltip_position: "bottom",
                formatter: function formatter(val) {
                    var txt = $('.eff-report3').attr("data-slider-tool");
                    if (Array.isArray(val)) {
                        return val[0] + " : " + val[1];
                    } else {
                        return val + " " + txt;
                    }
                }
            });
        };

        $scope.moveDashboard = function (index, systemId, name) {
          $scope.main.hubpop.orgSelected = $scope.main.hubpop.projectSelected.orgs[index];
          $location.path("/paas");
        };

        var originName = "";

        //자바 상세 인스턴스 이름 변경(변경 소스: 200902 howkiki0623)
        ct.renameInst = function () {
            var nameP = $(".renameInst").parents('.panel-heading').find('.panel-title');
            originName = nameP.text();//현재 앱 이름 저장
            var el = "<div class='renameWrap'><div class='sdBtnWrap'><button type='button' name='button' class='btn btn-ico-saveName-s only-ico updateName' title='이름저장' ng-click='saveReName();'><i class='xi-save'></i></button><button type='button' name='button' class='btn btn-ico-delName-s only-ico updateName' title='변경취소' ng-click='cancelReName();'><i class='xi-close'></i></button></div></div>";
            var compiledElement = $compile(el)($scope);
            nameP.contents().unwrap().wrap("<input type='text' name='renameInst' value='"+originName+"' class='form-control'/>");
            $(".renameInst").parents(".panel-heading").append(compiledElement);
        };

        $scope.saveReName = function () {
            var newName = $('input[name=renameInst]').val();

            if (newName.length < 3) {
                common.showAlert("", "최소 3자 이상이어야 합니다.0 < contents.app.routes.length");
                return;
            }

            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.updateAppNameAction(ct.appGuid, newName);
            appPromise.success(function (data) {
                $state.go($state.current, {}, {reload: true});
                $scope.main.loadingMainBody = false;
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.cancelReName = function () {
            var nameP = $(".sdBtnWrap").parents('.panel-heading').find('.form-control');
            var name01 = nameP.text();//현재 앱 이름 저장
            //console.log(name01);
            var el = "<h3 class='panel-title'></h3>";
            var compiledElement = $compile(el)($scope);
            nameP.contents().unwrap().wrap(compiledElement);
            $(".updateName").remove();
        };
        
      //자바 상세 인스턴스 이름 변경(기존 소스)
      /*  ct.renameInst = function () {
            var nameP = $(".renameInst").parents('.cBox-hd').find('.c-tit');
            originName = nameP.text();//현재 앱 이름 저장
            var el = "<div class='sdBtnWrap'><button type='button' name='button' class='btn btn-ico-saveName-s only-ico updateName' ng-click='saveReName();' title='이름저장' style='width: 32px;'><span class='ico'>이름저장</span></button><button type='button' name='button' class='btn btn-ico-delName-s only-ico updateName' ng-click='cancelReName();' title='변경취소' style='width: 32px;'><span class='ico'>변경취소</span></button></div>";
            var compiledElement = $compile(el)($scope);
            nameP.contents().unwrap().wrap("<input type='text' name='renameInst' value='"+originName+"' class='form-control' style='position: relative;' />");
            $(".renameInst").parents(".cBox-hd").append(compiledElement);
        };

        $scope.saveReName = function () {
            var newName = $('input[name=renameInst]').val();

            if (newName.length < 3) {
                common.showAlert("", "최소 3자 이상이어야 합니다.0 < contents.app.routes.length");
                return;
            }

            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.updateAppNameAction(ct.appGuid, newName);
            appPromise.success(function (data) {
                $state.go($state.current, {}, {reload: true});
                $scope.main.loadingMainBody = false;
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.cancelReName = function () {
            var nameP = $(".sdBtnWrap").parents('.cBox-hd').find('.form-control');
            var name01 = nameP.text();//현재 앱 이름 저장
            //console.log(name01);
            var el = "<h4 class='c-tit'></h4>";
            var compiledElement = $compile(el)($scope);
            nameP.contents().unwrap().wrap(compiledElement);
            $(".updateName").remove();
        };*/

        // 인스턴스 재시작
        ct.instanceRestart = function (guid, index) {
            $scope.main.loadingMainBody = true;
            /* 2020.02.19 - 인스턴스 재시작 버튼 오류 관련 추가 */
            angular.forEach(ct.instanceStats, function(item) {
                 if(item.id == index) {
                     item.isRestart = true;
                 }
            });
            var appPromise = applicationService.restartAppInstance(guid, index);
            appPromise.success(function (data) {
                /* 2020.02.19 - 인스턴스 재시작 버튼 오류 관련 추가 : 5초 후 재시작 버튼 활성화 */
                $timeout(function () {
                    angular.forEach(ct.instanceStats, function(item) {
                        item.isRestart = false;
                    });
                }, 5000);
                $scope.main.loadingMainBody = false;
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        var panelTop;

        ct.zoomPanel = function(type){
            if(type == 'monitoring'){
                var _this = $("#monitoring");
                if(_this.hasClass("on")){
                    $('.visualizeItem').css("width", "465px");
                    $("#instance_monitoring_panel").css('width', '1585px');
                    $(window).scrollTop(panelTop);
                    _this.removeClass("on").closest(".panel").removeClass("zoom").resize();
                }else{
                    $('.visualizeItem').css("width", "750px");
                    $("#instance_monitoring_panel").css('width', '');
                    $('.panel_body').css("height", "90%");
                    var panelTopTemp = $(window).scrollTop();
                    panelTop = panelTopTemp;
                    _this.addClass("on").closest(".panel").addClass("zoom").resize();
                    var scrollPane = $('.panel.type2 .scroll-pane').jScrollPane({});
                    $(window).scrollTop(0);
                }
            }else if(type == 'event'){
                var _this = $("#event");
                if(_this.hasClass("on")){
                    $("#tabAppEventsTable").css('width', '1585px');
                    $(window).scrollTop(panelTop);
                    _this.removeClass("on").closest(".panel").removeClass("zoom").resize();
                }else{
                    $("#tabAppEventsTable").css('width', '');
                    var panelTopTemp = $(window).scrollTop();
                    panelTop = panelTopTemp;
                    _this.addClass("on").closest(".panel").addClass("zoom").resize();
                    var scrollPane = $('.panel.type2 .scroll-pane').jScrollPane({});
                    $(window).scrollTop(0);
                }
            }else if(type == 'set'){
                var _this = $("#set");
                if(_this.hasClass("on")){
                    $("#tabAppEnvVarTable").css('width', '1585px');
                    _this.removeClass("on").closest(".panel").removeClass("zoom").resize();
                }else{
                    $("#tabAppEnvVarTable").css('width', '');
                    _this.addClass("on").closest(".panel").addClass("zoom").resize();
                    var scrollPane = $('.panel.type2 .scroll-pane').jScrollPane({});
                    $(window).scrollTop(0);
                }
            }else if(type == 'route'){
                var _this = $("#route");
                if(_this.hasClass("on")){
                    $("#tabAppRoutesTable").css('width', '1585px');
                    _this.removeClass("on").closest(".panel").removeClass("zoom").resize();
                }else{
                    $("#tabAppRoutesTable").css('width', '');
                    _this.addClass("on").closest(".panel").addClass("zoom").resize();
                    var scrollPane = $('.panel.type2 .scroll-pane').jScrollPane({});
                    $(window).scrollTop(0);
                }
            }else if(type == 'log'){
                var _this = $("#log");
                if(_this.hasClass("on")){
                    _this.removeClass("on").closest(".panel").removeClass("zoom").resize();
                }else{
                    _this.addClass("on").closest(".panel").addClass("zoom").resize();
                    var scrollPane = $('.panel.type2 .scroll-pane').jScrollPane({});
                    $(window).scrollTop(0);
                }
            }else{
                var _this = $("#ssh");
                if(_this.hasClass("on")){
                    _this.removeClass("on").closest(".panel").removeClass("zoom").resize();
                }else{
                    _this.addClass("on").closest(".panel").addClass("zoom").resize();
                    var scrollPane = $('.panel.type2 .scroll-pane').jScrollPane({});
                    $(window).scrollTop(0);
                }
            }
            $(".jspPane").css("top", 0);
            $('.scroll-pane').jScrollPane({}).resize();
        };

        ct.setRoundProgressData = function () {
            if (ct.instanceStats && ct.instanceStats.length > 0) {
                var instaceState = "RUNNING";
                var instanceStatsUsageCpu = 0;
                var instanceStatsUsageMemory = 0;
                var instanceStatsUsageDisk = 0;

                var instanceStatsUsageMemoryValue = 0;
                var instanceStatsUsageDiskValue = 0;
                var instanceStatsUsageCpuValue = 0;

                var instanceStatsMemQuotaValue = 0;
                var instanceStatsDiskQuotaValue = 0;

                for (var i=0; i<ct.instanceStats.length; i++) {
                    if (ct.instanceStats[i].state == "DOWN") {
                        instaceState = ct.instanceStats[i].state;
                    } else if (ct.instanceStats[i].state == "STARTING") {
                        if (instaceState == "RUNNING") {
                            instaceState = ct.instanceStats[i].state;
                        }
                    } else {
                        if (instaceState != "DOWN") {
                            instaceState = ct.instanceStats[i].state;
                        }
                    }
                    if (ct.instanceStats[i].usage != null) {
                        instanceStatsUsageCpu += ct.instanceStats[i].usage.cpu * 100;
                        instanceStatsUsageCpuValue += ct.instanceStats[i].usage.cpu;
                    }
                    if (parseInt(ct.instanceStats[i].memQuota, 10) > 0) {
                        instanceStatsUsageMemory += (parseInt(ct.instanceStats[i].usage.mem, 10) * 100) / parseInt(ct.instanceStats[i].memQuota, 10);
                        instanceStatsUsageMemoryValue += ct.instanceStats[i].usage.mem;

                        instanceStatsMemQuotaValue += parseInt(ct.instanceStats[i].memQuota, 10);
                    }
                    if (parseInt(ct.instanceStats[i].diskQuota, 10) > 0) {
                        instanceStatsUsageDisk += (parseInt(ct.instanceStats[i].usage.disk, 10) * 100) / parseInt(ct.instanceStats[i].diskQuota, 10);
                        instanceStatsUsageDiskValue += ct.instanceStats[i].usage.disk;

                        instanceStatsDiskQuotaValue += parseInt(ct.instanceStats[i].diskQuota, 10);
                    }
                }

                ct.app.insState = instaceState;
                //console.log("ct.setRoundProgressData > ct.app : ", ct.app);

                ct.originalInstances = ct.app.instances;
                ct.originalMemory = ct.app.memory;
                ct.originalDisk = ct.app.diskQuota;

                var memoryByte = (instanceStatsUsageMemoryValue / ct.instanceStats.length);
                var diskByte = (instanceStatsUsageDiskValue / ct.instanceStats.length);
                var cpuByte = (instanceStatsUsageCpuValue / ct.instanceStats.length);
                var memoryValue = "";
                var diskValue = "";
                var cpuValue = "";

                var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
                var e = Math.floor(Math.log(memoryByte)/Math.log(1024));
                var d = Math.floor(Math.log(diskByte)/Math.log(1024));
                var c = Math.floor(Math.log(cpuByte)/Math.log(1024));

                var mq = Math.floor(Math.log(instanceStatsMemQuotaValue)/Math.log(1024));
                var dq = Math.floor(Math.log(instanceStatsDiskQuotaValue)/Math.log(1024));

                if(mq == "-Infinity") {
                    ct.instanceStatsMemQuotaValue = "0 "+s[0];
                }else{
                    ct.instanceStatsMemQuotaValue = (instanceStatsMemQuotaValue/Math.pow(1024, Math.floor(mq))).toFixed(1)+" "+s[mq];
                }

                if(dq == "-Infinity") {
                    ct.instanceStatsDiskQuotaValue = "0 "+s[0];
                }else{
                    ct.instanceStatsDiskQuotaValue = (instanceStatsDiskQuotaValue/Math.pow(1024, Math.floor(dq))).toFixed(1)+" "+s[dq];
                }

                for(var i = 0; i < ct.instanceStats.length; i++){
                    if (ct.instanceStats[i].usage != null) {
                        var mem = Math.floor(Math.log(ct.instanceStats[i].usage.mem)/Math.log(1024));
                        var disk = Math.floor(Math.log(ct.instanceStats[i].usage.disk)/Math.log(1024));

                        if(mem == "-Infinity") {
                            ct.instanceStats[i].memUse = "0 "+s[0];
                        }else{
                            ct.instanceStats[i].memUse = (ct.instanceStats[i].usage.mem/Math.pow(1024, Math.floor(mem))).toFixed(1)+" "+s[mem];
                        }

                        if(disk == "-Infinity") {
                            ct.instanceStats[i].diskUse = "0 "+s[0];
                        }else{
                            ct.instanceStats[i].diskUse = (ct.instanceStats[i].usage.disk/Math.pow(1024, Math.floor(disk))).toFixed(1)+" "+s[mem];
                        }
                    }
                }

                $scope.nowDate = new Date();	// 인스턴스 최종 시작일 계산을 위한 현재 시간
                
                if(e == "-Infinity") {
                    memoryValue = "0 "+s[0];
                } else {
                    memoryValue = (memoryByte/Math.pow(1024, Math.floor(e))).toFixed(1)+" "+s[e];
                }

                if(d == "-Infinity") {
                    diskValue = "0 "+s[0];
                } else {
                    diskValue = (diskByte/Math.pow(1024, Math.floor(d))).toFixed(1)+" "+s[d];
                }

                ct.cpuRoundProgress.value = cpuValue;
                ct.cpuRoundProgress.percentage = (instanceStatsUsageCpu / ct.instanceStats.length).toFixed(1);
                ct.cpuRoundProgress.percentage = ct.cpuRoundProgress.percentage > 100 ? 100 : ct.cpuRoundProgress.percentage;   // CPU 이용률 100% 이상일때 100% 고정
                ct.memoryRoundProgress.value = memoryValue;
                ct.memoryRoundProgress.value2 = (instanceStatsUsageMemory / ct.instanceStats.length).toFixed(1)+ " %";
                ct.memoryRoundProgress.percentage = (instanceStatsUsageMemory / ct.instanceStats.length).toFixed(1);
                ct.diskRoundProgress.percentage = (instanceStatsUsageDisk / ct.instanceStats.length).toFixed(1);
                ct.diskRoundProgress.value = diskValue;

                ct.useRecurseCpu = ct.cpuRoundProgress.percentage;
                ct.useRecurseDisk = ct.diskRoundProgress.percentage;
                ct.useRecurseMemory = ct.memoryRoundProgress.percentage;

                ct.useRecurse = {
                    cpu: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(183,93,218,1)","rgba(199,143,220,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]},
                    disk: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(22,87,218,1)","rgba(143,171,234,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]},
                    memory: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(1,160,206,1)","rgba(145,191,206,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]}
                };

                $timeout(function () {
                    ct.useRecurse.cpu.data = [ct.useRecurseCpu, (100-ct.useRecurseCpu)];
                    ct.useRecurse.disk.data = [ct.useRecurseDisk, (100-ct.useRecurseDisk)];
                    ct.useRecurse.memory.data = [ct.useRecurseMemory, (100-ct.useRecurseMemory)];
                }, 500);


            } else {
                ct.cpuRoundProgress.percentage = 0;
                ct.memoryRoundProgress.percentage = 0;
                ct.diskRoundProgress.percentage = 0;

                ct.useRecurseCpu = ct.cpuRoundProgress.percentage;
                ct.useRecurseDisk = ct.diskRoundProgress.percentage;
                ct.useRecurseMemory = ct.memoryRoundProgress.percentage;

                ct.useRecurse = {
                    cpu: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(183,93,218,1)","rgba(199,143,220,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]},
                    disk: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(22,87,218,1)","rgba(143,171,234,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]},
                    memory: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(1,160,206,1)","rgba(145,191,206,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]}
                };

                $timeout(function () {
                    ct.useRecurse.cpu.data = [ct.useRecurseCpu, (100-ct.useRecurseCpu)];
                    ct.useRecurse.disk.data = [ct.useRecurseDisk, (100-ct.useRecurseDisk)];
                    ct.useRecurse.memory.data = [ct.useRecurseMemory, (100-ct.useRecurseMemory)];
                }, 500);

            }
        };

        ct.getApp = function () {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.getApp(ct.appGuid);
            appPromise.success(function (data) {
                common.objectOrArrayMergeData(ct.app, data);
                ct.serviceBindingsLength = data.serviceBindings.length;
                ct.routesLength = data.routes.length;
                if (data.organizationGuid) {
                    var organization = common.objectsFindCopyByField($scope.main.organizations, "guid", data.organizationGuid);
                    if (organization && angular.isDefined(organization.name)) {
                        $scope.main.detailOrgName = organization.name + "(" + organization.orgName + ")";
                    }
                }
                $scope.main.spaceName = data.space.name;
                $scope.main.applicationName = data.name;
                $scope.main.loadingMainBody = false;
            });
            appPromise.error(function (data) {
                ct.app = {};
                $scope.main.loadingMainBody = false;
            });
        };

        //앱별 전체 인스턴스 상태조회
        ct.listAllAppInstanceStats = function () {
            if (ct.app.state != "STARTED") {
                $scope.main.reloadTimmerStop();
                return;
            }
            var appPromise = applicationService.listAllAppInstanceStats(ct.appGuid);
            appPromise.success(function (data) {
                common.objectOrArrayMergeData(ct.instanceStats, data);
                ct.reloadAppInstanceStats();
                ct.setRoundProgressData();
            });
            appPromise.error(function (data) {
                ct.app = {};
                ct.instanceStats = [];
            });
        };

        ct.createReloadTimmer = function () {
            $scope.main.reloadTimmerStart('reloadListAllAppInstanceStats', function () {
                //조회 함수 변경. 2020.01.22
                //   인스턴스 목록의 상태 뿐 아니라 app.packageState 상태도 STAGED 상태가 되어야 함.
                //ct.listAllAppInstanceStats();
                ct.getAppStats(false);
            }, 5000);
        };

        ct.reloadAppInstanceStats = function () {
            var reLoad = false;
            if (ct.app.state == "STARTED" && ct.instanceStats && ct.instanceStats.length > 0) {
                for (var i = 0; i < ct.instanceStats.length; i++) {
                    if (ct.instanceStats[i].state != "RUNNING") {
                        reLoad = true;
                        break;
                    }
                }
                //2020.01.22 추가
                if (ct.app.packageState != 'STAGED') {
                    reLoad = true;
                }
            }
            if (reLoad) {
                ct.createReloadTimmer();
            }
        };

        // 처음에 로딩하는 경우만 메인 로딩바 표시
        ct.getAppStats = function (init) {
            $scope.main.reloadTimmerStop();
            if (init) {
                $scope.main.loadingMainBody = true;
            }
            var appPromise = applicationService.getAppStats(ct.appGuid);
            appPromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.objectOrArrayMergeData(ct.app, data);
                ct.sltOrganizationGuid = ct.app.organizationGuid;
                ct.sltSpaceGuid = ct.app.spaceGuid;
                /* 20.04.14 by ksw - 인스턴스 상태가 하나라도 시작이면 앱 상태도 시작일수 있게 변경 */
                ct.instanceGroupStats = false;
                angular.forEach(ct.app.instanceStats, function(item) {
                    if (item.state == 'RUNNING') {
                        ct.instanceGroupStats = true;
                        return false;
                    }
                });


                ct.app.createdTime = new Date(ct.app.created).getTime();

                if (data.serviceBindings && angular.isArray(data.serviceBindings)) {
                    ct.serviceBindingsLength = data.serviceBindings.length;
                } else {
                    ct.serviceBindingsLength = 0;
                }
                if (data.routes && angular.isArray(data.routes)) {
                    ct.routesLength = data.routes.length;
                } else {
                    ct.routesLength = 0;
                }

                if (data.instanceStats && angular.isArray(data.instanceStats)) {
                    if (angular.isUndefined(ct.instanceStats)) {
                        ct.instanceStats = [];
                    }
                    common.objectOrArrayMergeData(ct.instanceStats, ct.app.instanceStats);
                    /* 2020.02.18 - 인스턴스 재시작 버튼 오류 관련 : isRestart 속성 추가 */
                    angular.forEach(ct.instanceStats, function(item) {
                        item.isRestart = false;
                    });
                    //console.log("ct.getAppStats > ct.instanceStats ; ", ct.instanceStats);
                } else {
                    ct.instanceStats = [];
                }

                ct.setRoundProgressData();
                $scope.main.spaceName = data.space.name;
                $scope.main.applicationName = data.name;
                if (init) {
                    $scope.main.loadingMainBody = false;
                }
                if ($scope.main.startAppGuid && $scope.main.startAppGuid == ct.appGuid) {
                    $scope.main.startAppGuid = null;
                    ct.updateAppStateAction(ct.appGuid, "STARTED");
                } else {
                    ct.reloadAppInstanceStats();
                }

                if (ct.app.buildpack) {
                    var buildpackSplit = ct.app.buildpack.split('_buildpack-');
                    ct.app.buildpackName = buildpackSplit[0].toUpperCase();
                    if (ct.app.buildpackName == 'STATICFILE') {
                        ct.app.buildpackName = 'NGINX';
                    }
                    ct.app.buildpackVersion = buildpackSplit[1].replace('-', '.');
                } else {
                    ct.app.buildpackName = "DOCKER";
                    ct.app.buildpackVersion = "-";
                }

                for(var i = 0; i < ct.instanceStats.length; i++){
                    if(ct.instanceStats[i].state == "CRASHED"){
                        ct.appStateCnt++;
                    }else if(ct.instanceStats[i].state == "STOPPED"){
                        ct.appStateCnt = 0;
                    }
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
                ct.app = {};
                ct.instanceStats = [];
            });
        };

        ct.getAppSummary = function () {
            var appPromise = applicationService.getAppSummary(ct.appGuid);
            appPromise.success(function (data) {
                ct.detected_start_command = data.detected_start_command;

                if (data.docker_image == null && ct.detected_start_command.indexOf("tomcat/bin/catalina.sh run") > 0) {
                    ct.framework = "Spring";
                } else if(data.docker_image != null){
                    ct.framework = "Docker";
                    ct.dockerImage = data.docker_image;
                } else {
                    ct.framework = "Spring Boot";
                }

            });
        };

        ct.startApp = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.start') + "(" + name + ")", $translate.instant('message.mq_start_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.startAppAction(guid);
            });
        };

        ct.stopApp = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.stop') + "(" + name + ")", $translate.instant('message.mq_stop_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.stopAppAction(guid);
            });
        };

        ct.startAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.startApp(guid);
            appPromise.success(function (data) {
                ct.getAppStats(false);
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.stopAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.stopApp(guid);
            appPromise.success(function (data) {
                ct.getAppStats(false);
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.startAppState = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.start') + "(" + name + ")", $translate.instant('message.mq_start_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.updateAppStateAction(guid, "STARTED");
            });
        };

        ct.stopAppState = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.stop') + "(" + name + ")", $translate.instant('message.mq_stop_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.updateAppStateAction(guid, "STOPPED");
            });
        };

        ct.refreshApp = function () {
            $state.go($state.current, {}, {reload: true});
        };

        ct.updateAppStateAction = function(guid, state) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.updateAppState(guid, state);
            appPromise.success(function (data) {
                if (data && data.guid) {
                    ct.app.state = data.state;
                    ct.app.packageState = data.packageState;
                }
                ct.getAppStats(false);
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.updateAppScale = function(guid, name) {
            var message = (ct.originalMemory != ct.memorySlider.value || ct.originalDisk != ct.diskQuotaSlider.value) ? $translate.instant('message.mi_memory_or_disk_changed_restage_info') + " " : "";
            var showConfirm = common.showConfirm($translate.instant('label.save') + "(" + name + ")", message + $translate.instant('message.mq_save_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.updateAppScaleAction(guid, ct.instancesSlider.value, ct.memorySlider.value, ct.diskQuotaSlider.value);
            });
        };

        ct.updateAppScaleAction = function(guid, instances, memory, diskQuota) {
            $scope.main.loadingMainBody = true;
            $(".aside").stop().animate({"right":"-360px"}, 600);
            var appPromise = applicationService.updateAppScale(guid, instances, memory, diskQuota);
            appPromise.success(function (data) {
                $state.go($state.current, {}, {reload: true});
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.restartApp = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.restart') + "(" + name + ")", $translate.instant('message.mq_restart_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.restartAppAction(guid);
            });
        };

        ct.restartAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.restartApp(guid);
            appPromise.success(function (data) {
                if (data && data.guid) {
                    ct.app.state = data.state;
                    ct.app.packageState = data.packageState;
                }
                ct.getAppStats(false);
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.redeployApp = function($event) {
            $scope.dialogOptions = {
                controller : "applicationRePushFormCtrl",
                sltApp : angular.copy(ct.app),
                callBackFunction : ct.redeployCallBackFunction
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.redeployCallBackFunction = function() {
            common.showAlertSuccessHtml($translate.instant("label.redeploy") + "(" + ct.app.name + ")", $translate.instant("message.mi_redeploy_app")).then(function () {
                ct.getAppStats(false);
            });
        };

        ct.deleteAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.deleteApp(guid);
            appPromise.success(function (data) {
                common.showAlertSuccess("삭제가 완료 되었습니다.");
                $scope.main.goToPage("/paas/apps");
                //앱 삭제 후 main organization 정보 재조회. 삭제 후 앱 이름 중복 에러 관련. 2019.07.12
                $scope.main.loadSltOrganization();
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.changeSltInfoTab = function (sltInfoTab) {
            ct.sltInfoTab = sltInfoTab;
        };

        //이유를 알 수 없음. 막음. 2020.01.22
        /*$scope.main.refreshIntervalStart('appStats', function () {
            ct.getAppStats(false);
        }, 20000);  //60000*/

        ct.getAppStats(true);
        ct.getAppSummary();
        //ct.changeSltInfoTab('service'); //20181126 sg0730 kepri 통합 요청으로 인한 Applog 제일 상단 배치
        //ct.changeSltInfoTab('appLog');  //2020.02.03 수정 - 2020.06.03 대표도메인 설정 버튼 추가에 따라 block 처리
    })
    .controller('paasApplicationRePushFormCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, user, applicationService, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : paasApplicationRePushFormCtrl", 1);

        var pop = this;
        var ct = $scope.contents;
        pop.isChangeScale = false;  //scale 변경
        pop.isChangeFile = false;   //file 추가
        
        // 20.3.31 by hrit, 슬라이드 로딩 이상현상 수정
        pop.pageLoad = false;
        $timeout(function () {
            pop.pageLoad = true;
        }, 300);

        //파일 관련 추가. 시작
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

                if ((ctype && '|x-webarchive|x-java-archive|zip|'.indexOf(ctype) !== -1)
                    || ('|war|jar|zip|'.indexOf(ftype) !== -1)) {
                    return true;
                } else {
                    item.error = "error";
                    item.message = "mi_only_app_file";
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
                item.error     = null;
                item.message   = null;
                pop.appFileErrorMessage = errMessage;
            }
        };

        pop.uploader.onAfterAddingFile = function (fileItem) {
            _DebugConsoleInfo('onAfterAddingFile', fileItem);

            pop.appFileErrorMessage = "";
            pop.appFileItem = fileItem;
            var localFullFileName = "";
            if ($('#appFileInput').length > 0) {
                localFullFileName = $('#appFileInput').val().substring($('#appFileInput').val().lastIndexOf('\\')+1);
            }
            pop.appFileItem.localFullFileName = localFullFileName;
        };
        //파일 관련 추가. 끝

        pop.formName = $scope.dialogOptions.formName;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.dialogClassName = "modal-md";
        $scope.dialogOptions.title = $translate.instant("label.redeploy");
        $scope.dialogOptions.okName =  $translate.instant("label.redeploy");
        $scope.dialogOptions.templateUrl = _PAAS_VIEWS_ + "/application/popAppRePushForm.html" + _VersionTail();

        pop.checkClick = false;
        pop.updateAppScale = function(guid, name) {
            pop.checkClick = false;
            if (pop.checkClick) return;
            pop.checkClick = true;
            if (ct.originalInstances == ct.instancesSlider.value && ct.originalMemory == ct.memorySlider.value && ct.originalDisk == ct.diskQuotaSlider.value && !pop.appFileItem) {
                common.showAlertWarning("변경된 사항이 없습니다.");
                pop.checkClick = false;
                return;
            } else {
                if (pop.appFileItem) {
                    pop.isChangeFile = true;    //file 추가
                }
                if (ct.originalInstances != ct.instancesSlider.value || ct.originalMemory != ct.memorySlider.value || ct.originalDisk != ct.diskQuotaSlider.value) {
                    pop.isChangeScale = true;  //scale 변경
                }
            }
            var message = $translate.instant('message.mi_memory_or_disk_changed_restage_info') + " ";
            var showConfirm = common.showConfirm($translate.instant('label.save') + "(" + name + ")", message + $translate.instant('message.mq_save_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                if (pop.isChangeFile) {
                    pop.updateAppFileAction(guid);
                } else if (pop.isChangeScale) {
                    pop.updateAppScaleAction(guid, ct.instancesSlider.value, ct.memorySlider.value, ct.diskQuotaSlider.value);
                } else {
                    pop.checkClick = false;
                }
            });
        };

        pop.updateAppFileAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appBody         = {};
            appBody.pushType    = "GENERAL";
            appBody.appGuid     = guid;
            appBody.file        = pop.appFileItem._file;
            var appPromise = applicationService.appFileRePush(appBody);
            appPromise.success(function (data) {
                $scope.main.startAppGuid = data.guid;
                if (pop.isChangeScale) {
                    pop.updateAppScaleAction(guid, ct.instancesSlider.value, ct.memorySlider.value, ct.diskQuotaSlider.value);
                } else {
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction();
                    }
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        //사양 변경
        pop.updateAppScaleAction = function(guid, instances, memory, diskQuota) {
            if (!pop.isChangeFile) {
                $scope.main.loadingMainBody = true;
            }
            var appPromise = applicationService.updateAppScale(guid, instances, memory, diskQuota);
            appPromise.success(function (data) {
                if (angular.isFunction(pop.callBackFunction)) {
                    pop.callBackFunction();
                }
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            pop.updateAppScale(ct.app.guid, ct.app.name);
        };

    })
    .controller('paasApplicationReUploadPushFormCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, user, applicationService, ValidationService, FileUploader, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : paasApplicationReUploadPushFormCtrl", 1);

        var pop = this;
        var vs = new ValidationService();

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
                if ((ctype && '|x-webarchive|x-java-archive|zip|'.indexOf(ctype) !== -1)
                    || ('|war|jar|zip|'.indexOf(ftype) !== -1)) {
                    return true;
                } else {
                    item.error = "error";
                    item.message = "mi_only_app_file";
                    return false;
                }
            }
        });

        pop.uploader = common.setDefaultFileUploader($scope, { filters : uploadFilters });

        pop.uploader.onWhenAddingFileFailed = function (item) {
            _DebugConsoleInfo('onWhenAddingFileFailed', item);
            if (item.error && item.message) {
                var errMessage = "{{ 'message." + item.message + "' | translate }}";
                item.error = null;
                item.message = null;
                pop.appFileItem = null;
                pop.appFileErrorMessage = errMessage;
            }
        };

        pop.uploader.onAfterAddingFile = function (fileItem) {
            _DebugConsoleInfo('onAfterAddingFile', fileItem);
            pop.appFileItem = fileItem;
            pop.appFileErrorMessage = "";
        };

        pop.appPushData   = {};

        pop.formName = "appRePushForm";
        pop.app = $scope.dialogOptions.sltApp;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.formName = pop.formName;
        $scope.dialogOptions.dialogClassName = "modal-lg";
        $scope.dialogOptions.title = $translate.instant("label.redeploy");
        $scope.dialogOptions.okName =  $translate.instant("label.redeploy");
        $scope.dialogOptions.templateUrl = _PAAS_VIEWS_ + "/application/popAppReUploadPushForm.html" + _VersionTail();
        if (angular.isObject(pop.app.marketAppPush) && angular.isObject(pop.app.marketAppPush.marketApp)
            && angular.isNumber(pop.app.marketAppPush.marketApp.id) && pop.app.marketAppPush.marketApp.id > 0) {
            pop.appPushData.pushType = "MARKET";
        } else if (angular.isString(pop.app.dockerImage) && pop.app.dockerImage != "") {
            pop.appPushData.pushType = "DOCKER";
            pop.appPushData.dockerImage = pop.app.dockerImage;
        } else {
            pop.appPushData.pushType = "GENERAL";
        }
        if (pop.appPushData.pushType == "GENERAL" || pop.appPushData.pushType == "MARKET") {
            if (angular.isString(pop.app.buildpack) && pop.app.buildpack != "") {
                var buildpacks = pop.app.buildpack.split("_buildpack-");
                pop.app.buildpackName = buildpacks[0];
                if (buildpacks.length == 2) {
                    pop.app.buildpackVersionName = buildpacks[1].replace(/-/g, '.');
                }
            } else if (angular.isString(pop.app.detectedBuildpack) && pop.app.detectedBuildpack != "") {
                var buildpacks = pop.app.detectedBuildpack.split(" ");
                pop.app.buildpackName = buildpacks[0];
                if (buildpacks.length == 2) {
                    pop.app.buildpackVersionName = "v" +buildpacks[1];
                }
            }
        }
        pop.appRePush = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[pop.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var appBody = {};
            appBody.pushType = pop.appPushData.pushType;
            appBody.appGuid = pop.app.guid;
            if (pop.appPushData.pushType == "GENERAL") {
                appBody.file = pop.appFileItem._file;
                var appPushPromise = applicationService.appFileRePush(appBody);
                appPushPromise.success(function (data) {
                    $scope.actionLoading = false;
                    $scope.actionBtnHied = false;
                    $scope.popHide();
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction(data);
                    }
                });
                appPushPromise.error(function (data) {
                    $scope.actionLoading = false;
                    $scope.actionBtnHied = false;
                });
                appPushPromise.progress(function (progress) {
                    _DebugConsoleInfo('progress', progress);
                });
            } else {
                if (pop.appPushData.pushType == "DOCKER") {
                    appBody.dockerImage = pop.appPushData.dockerImage;
                } else if (pop.appPushData.pushType == "MARKET") {
                    appBody.marketAppId = pop.app.marketAppPush.marketApp.id;
                }
                var appPushPromise = applicationService.appRePush(appBody);
                appPushPromise.success(function (data) {
                    $scope.actionLoading = false;
                    $scope.actionBtnHied = false;
                    $scope.popHide();
                    if (angular.isFunction(pop.callBackFunction)) {
                        pop.callBackFunction(data);
                    }
                });
                appPushPromise.error(function (data) {
                    $scope.actionLoading = false;
                    $scope.actionBtnHied = false;
                });
            }
        };

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            pop.appRePush();
        };

        pop.pageLoadData = function () {
            $scope.actionLoading = false;
        };

        pop.pageLoadData();

    })
    .controller('tabAppServiceBindingsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, user, applicationService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : tabAppServiceBindingsCtrl", 1);

        var tab = this;
        var vs = new ValidationService();
        tab.app = angular.copy($scope.contents.app);
        tab.appGuid = $scope.contents.appGuid;
        tab.appServiceBindings = null;

        tab.tabBodytemplateUri = _PAAS_VIEWS_ + "/application/tabAppServiceBindings.html" + _VersionTail();

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언

        tab.listAllAppServiceBindings = function () {
            tab.loadingAppServiceBindings = true;
            var serviceBindingPromise = applicationService.listAllAppServiceBindings(tab.appGuid);
            serviceBindingPromise.success(function (data) {
                for (var i=0; i<data.length; i++) {
                    if(data[i].credentials.uri != null && data[i].credentials.uri.toLowerCase().indexOf('mysql') > -1) {
                        data[i].dbWebxpertUrl = $scope.main.sltRegion.mysqlDbWebXpertUrl;
                    }
                }
                $scope.contents.serviceBindingsLength = data.length;
                tab.appServiceBindings = data;
                tab.loadingAppServiceBindings = false;
            });
            serviceBindingPromise.error(function (data) {
                tab.appServiceBindings = [];
                tab.loadingAppServiceBindings = false;
            });
        };

        tab.credentialsToggle = function (serviceBinding_credentials_id) {
            $(".serviceBinding_credentials:not(#" + serviceBinding_credentials_id + ")").hide();
            $("#" + serviceBinding_credentials_id).toggle('fast');
        };

        tab.createAppServiceBinding = function (appGuid, serviceInstanceGuid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.service_binding') + "(" + name + ")", $translate.instant('message.mq_binding'));
            showConfirm.then(function () {
                common.mdDialogHide();
                tab.createAppServiceBindingAction(appGuid, serviceInstanceGuid);
            });
        };

        tab.createAppServiceBindingAction = function (appGuid, serviceInstanceGuid) {
            $scope.main.loadingMainBody = true;
            var appServiceBindingsPromise = applicationService.createServiceBinding(appGuid, serviceInstanceGuid);
            appServiceBindingsPromise.success(function (data) {
                tab.listAllAppServiceBindings();
                $state.go($state.current, {}, {reload: true});
            });
            appServiceBindingsPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        tab.deleteAppServiceBinding = function (bindings, appName, name) {
            var guid = null;

            for(var i = 0; i<bindings.length; i++){
                if(bindings[i].appName == appName){
                    guid = bindings[i].guid;
                    break;
                }
            }

            var showConfirm = common.showConfirmWarning($translate.instant('label.unbinding') + "(" + name + ")", $translate.instant('message.mq_unbind_service'));
            showConfirm.then(function () {
                common.mdDialogHide();
                tab.deleteAppServiceBindingAction(guid);
            });
        };

        tab.deleteAppServiceBindingAction = function (guid) {
            $scope.main.loadingMainBody = true;
            var spaceQuotaPromise = applicationService.deleteServiceBinding(guid);
            spaceQuotaPromise.success(function (data) {
                tab.listAllAppServiceBindings();
                $state.go($state.current, {}, {reload: true});
            });
            spaceQuotaPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.authenticating = false;
        $scope.actionLoading = false;
        tab.createAppServiceBindings = function ($event) {
            $scope.dialogOptions = {
                title : $translate.instant("label.service_connect_add"),
                formName : "createAppServiceBindingForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/application/popAppServiceBindingForm.html" + _VersionTail(),
                okName : $translate.instant("label.add")
            };
            pop.spaceServiceInstances = [];
            pop.spaceUserServiceInstances = [];
            pop.appServiceBindings = angular.copy(tab.appServiceBindings);
            pop.sltServiceInstanceGuid = "";
            pop.appName = tab.app.name;

            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createAppServiceBindingsAction(pop.sltServiceInstanceGuid);
            };
            $scope.actionBtnHied = false;
            $scope.actionLoading = true;
            pop.onSpaceServiceInstance = false;
            pop.onSpaceUserServiceInstance = false;
            pop.listAllSpaceServiceInstances(tab.app.spaceGuid);
            pop.listAllSpaceUserServiceInstances(tab.app.spaceGuid);

        };

        pop.listAllSpaceServiceInstances = function (guid) {
            var serviceInstancePromise = applicationService.listAllSpaceServiceInstances(guid);
            serviceInstancePromise.success(function (data) {
                for (var i=0; i<data.length; i++) {
                    var isCheck = false;
                    for (var j=0; j<pop.appServiceBindings.length; j++) {
                        if (data[i].guid == pop.appServiceBindings[j].serviceInstanceGuid) {
                            isCheck = true;
                            break;
                        }
                    }
                    if (!isCheck) {
                        pop.spaceServiceInstances.push(data[i]);
                    }
                }
                pop.onSpaceServiceInstance = true;
                if (pop.onSpaceUserServiceInstance) {
                    $scope.authenticating = false;
                    $scope.actionLoading = false;
                }
            });
            serviceInstancePromise.error(function (data) {
                $scope.authenticating = false;
                $scope.actionLoading = false;
            });
        };

        pop.listAllSpaceUserServiceInstances = function (guid) {
            var serviceInstancePromise = applicationService.listAllSpaceUserServiceInstances(guid);
            serviceInstancePromise.success(function (data) {
                for (var i=0; i<data.length; i++) {
                    var isCheck = false;
                    for (var j=0; j<pop.appServiceBindings.length; j++) {
                        if (data[i].guid == pop.appServiceBindings[i].serviceInstanceGuid) {
                            isCheck = true;
                            break;
                        }
                    }
                    if (!isCheck) {
                        pop.spaceUserServiceInstances.push(data[i]);
                    }
                }
                pop.onSpaceUserServiceInstance = true;
                if (pop.onSpaceServiceInstance) {
                    $scope.authenticating = false;
                    $scope.actionLoading = false;
                }
            });
            serviceInstancePromise.error(function (data) {
                $scope.authenticating = false;
                $scope.actionLoading = false;
            });
        };

        pop.createAppServiceBindingsAction = function (serviceInstanceGuid) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var appServiceBindingsPromise = applicationService.createServiceBinding(tab.appGuid, serviceInstanceGuid);
            appServiceBindingsPromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.popHide();
                tab.listAllAppServiceBindings();
                $state.go($state.current, {}, {reload: true});
            });
            appServiceBindingsPromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        tab.listAllAppServiceBindings();
    })
    .controller('tabAppRoutesCtrl', function ($scope, $location, $state, $translate, $stateParams, $timeout, user, applicationService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : tabAppRoutesCtrl", 1);

        $timeout(function () {
            $('.scroll-pane').jScrollPane({}).resize();
        }, 100);

        var tab = this;
        var vs = new ValidationService();
        tab.app = angular.copy($scope.contents.app);
        tab.appGuid = tab.app.guid;
        tab.appRoutes = null;
        tab.domains = [];
        tab.route = { spaceGuid : tab.app.space.guid };

        tab.tabBodytemplateUri = _PAAS_VIEWS_ + "/application/tabAppRoutes.html" + _VersionTail();

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언

        tab.listAllAppRoutes = function () {
            tab.loadingAppRoutes = true;
            var routePromise = applicationService.listAllAppRoutes(tab.appGuid);
            routePromise.success(function (data) {
                tab.appRoutes = data;
                tab.loadingAppRoutes = false;

            });
            routePromise.error(function (data) {
                tab.appRoutes = [];
                tab.loadingAppRoutes = false;
            });
        };

        tab.deleteAppRouteAction = function (guid, routeGuid) {
            $scope.main.loadingMainBody = true;
            var appRoutePromise = applicationService.removeAppRoute(guid, routeGuid);
            appRoutePromise.success(function (appRoutData) {
                var routePromise = applicationService.deleteRoute(routeGuid);
                routePromise.success(function (data) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertSuccess('삭제 되었습니다.');
                    tab.listAllAppRoutes();
                });
                routePromise.error(function (data) {
                    $scope.main.loadingMainBody = false;
                });
            });
            appRoutePromise.error(function (appRoutData) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.authenticating = false;
        $scope.actionLoading = false;
        tab.createAppRoute = function ($event) {
            $scope.dialogOptions = {
                title : $translate.instant("label.route_add"),
                formName : "createAppRouteForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/application/popAppRouteForm.html" + _VersionTail(),
                okName : $translate.instant("label.confirm"),
                cancelName : $translate.instant("label.cancel")
            };

            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createAppRouteAction(tab.route);
            };
            $scope.actionBtnHied = false;
            $scope.actionLoading = true;
            pop.listAllDomains(tab.app.space.organizationGuid);
        };

        pop.listAllDomains = function (guid) {
            var domainPromise = applicationService.listAllDomains(guid);
            domainPromise.success(function (data) {
                tab.domains = data;
                if (data.length > 0) {
                    tab.route.domainGuid = data[0].guid;
                }
                $scope.actionLoading = false;
            });
            domainPromise.error(function (data) {
                $scope.actionLoading = false;
            });
        };

        pop.createAppRouteAction = function (route) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope.pop[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var routesPromise = applicationService.createRoute(route);
            routesPromise.success(function (data) {
                var appRoutesPromise = applicationService.associateAppRoute(tab.appGuid, data.guid);
                appRoutesPromise.success(function (appRouteData) {
                    $scope.actionLoading = false;
                    $scope.actionBtnHied = false;
                    $scope.popHide();
                    common.showAlertSuccess('추가 되었습니다.');
                    tab.listAllAppRoutes();
                });
                appRoutesPromise.error(function (appRouteData) {
                    $scope.actionLoading = false;
                    $scope.actionBtnHied = false;
                });
            });
            routesPromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        /* 20.06.02 - 앱 대표 도메인 설정 api 생성 by ksw */
        tab.repAppRoute = function (host) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.set') + "(" + host + ")", $translate.instant('message.mq_representative_domain'));
            showConfirm.then(function () {
                common.mdDialogHide();
                tab.repAppRouteAction(tab.appGuid, host);
            });
        };

        tab.repAppRouteAction = function (guid, host) {
            $scope.main.loadingMainBody = true;
            var appRoutePromise = applicationService.representativeAppRoute(guid, host);
            appRoutePromise.success(function () {
                /* 20.06.03 - 대표 도메인 설정 후 화면 변동 없게끔 탭 값을 route로 설정 by ksw */
                applicationService.sltInfoTab = 'route';
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess('설정 되었습니다.');
                $scope.main.replacePage();
            });
            appRoutePromise.error(function () {
                $scope.main.loadingMainBody = false;
            });
        };

        tab.listAllAppRoutes();
    })
    .controller('tabAppEnvVarCtrl', function ($scope, $location, $state, $translate, $stateParams, $timeout, user, applicationService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : tabAppEnvVarCtrl", 1);

        $timeout(function () {
            $('.scroll-pane').jScrollPane({}).resize();
        }, 100);

        var tab = this;
        var vs = new ValidationService();
        tab.app = angular.copy($scope.contents.app);
        tab.appGuid = tab.app.guid;
        tab.appEnvVar = {};
        tab.appUserEnvVars = null;

        tab.tabBodytemplateUri = _PAAS_VIEWS_ + "/application/tabAppEnvVar.html" + _VersionTail();

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언

        tab.getAppEnvironment = function () {
            tab.loadingAppEnvVar = true;
            var routePromise = applicationService.getAppEnvironment(tab.appGuid);
            routePromise.success(function (data) {
                tab.appEnvVar.staging_env_json = data.staging_env_json;
                tab.appEnvVar.running_env_json = data.running_env_json;
                tab.appEnvVar.system_env_json = data.system_env_json;
                tab.appEnvVar.application_env_json = data.application_env_json;
                tab.appEnvVar.environment_json = data.environment_json;
                tab.appUserEnvVars = [];
                for (var key in data.environment_json) {
                    tab.appUserEnvVars.push({ "key" : key, val : data.environment_json[key]});
                }
                tab.loadingAppEnvVar = false;
            });
            routePromise.error(function (data) {
                tab.appEnvVar = {};
                tab.loadingAppEnvVar = false;
            });
        };

        tab.deleteAppEnvironmentAction = function (key) {
            $scope.main.loadingMainBody = true;
            var appUserEnvVar = {};
            for(var i=0; i<tab.appUserEnvVars.length; i++) {
                if (key != tab.appUserEnvVars[i].key) {
                    appUserEnvVar[tab.appUserEnvVars[i].key] = tab.appUserEnvVars[i].val;
                }
            }
            var appRoutePromise = applicationService.updateAppUserEnvironment(tab.appGuid, appUserEnvVar);
            appRoutePromise.success(function (data) {
                $scope.main.loadingMainBody = false;
                common.showAlertSuccess("삭제 되었습니다.");
                tab.getAppEnvironment();
            });
            appRoutePromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.authenticating = false;
        $scope.actionLoading = false;
        tab.createAppEnvironment = function ($event) {
            $scope.dialogOptions = {
                title : $translate.instant("label.env_var_add"),
                formName : "createAppUserEnvVarForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/application/popAppUserEnvVarForm.html" + _VersionTail(),
                okName : $translate.instant("label.confirm"),
                cancelName : $translate.instant("label.cancel")
            };
            tab.appUserEvnKey = "";
            tab.appUserEvnVal = "";
            tab.appUserEvnKeyDisabled = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                for(var i=0; i<tab.appUserEnvVars.length; i++) {
                    if ($scope.tab.appUserEvnKey == tab.appUserEnvVars[i].key) {
                        common.showAlertError('동일한 변수 이름이 존재 합니다.');
                        return;
                    }
                }
                pop.updateAppEnvironmentAction($scope.tab.appUserEvnKey, $scope.tab.appUserEvnVal, tab.appUserEvnKeyDisabled);
            };
            $scope.actionBtnHied = false;
        };

        tab.updateAppEnvironment = function ($event, envItem) {
            $scope.dialogOptions = {
                title : $translate.instant("label.env_var_edit"),
                formName : "updateAppUserEnvVarForm",
                dialogClassName : "modal-dialog",
                templateUrl: _PAAS_VIEWS_ + "/application/popAppUserEnvVarForm.html" + _VersionTail(),
                okName : $translate.instant("label.confirm"),
                cancelName : $translate.instant("label.cancel")
            };
            tab.appUserEvnKey = envItem.key;
            tab.appUserEvnVal = envItem.val;
            tab.appUserEvnKeyDisabled = true;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updateAppEnvironmentAction(tab.appUserEvnKey, tab.appUserEvnVal, tab.appUserEvnKeyDisabled);
            };
            $scope.actionBtnHied = false;
        };

        pop.updateAppEnvironmentAction = function (key, val, updateFlg) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope.pop[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var appUserEnvVar = {};
            for(var i=0; i<tab.appUserEnvVars.length; i++) {
                if (key == tab.appUserEnvVars[i].key) {
                    appUserEnvVar[tab.appUserEnvVars[i].key] = val;
                } else {
                    appUserEnvVar[tab.appUserEnvVars[i].key] = tab.appUserEnvVars[i].val;
                }
            }
            if (!updateFlg) {
                appUserEnvVar[key] = val;
            }
            var routesPromise = applicationService.updateAppUserEnvironment(tab.appGuid, appUserEnvVar);
            routesPromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.popHide();
                if(updateFlg){
                    common.showAlertSuccess("수정 되었습니다.");
                }else{
                    common.showAlertSuccess("추가 되었습니다.");
                }
                tab.getAppEnvironment();
            });
            routesPromise.error(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
            });
        };

        tab.getAppEnvironment();
    })
    .controller('tabAppEventsCtrl', function ($scope, $location, $state, $translate, $stateParams, $timeout, user, applicationService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : tabAppEventsCtrl", 1);

        $timeout(function () {
            $('.scroll-pane').jScrollPane({}).resize();
        }, 3000);

        var tab = this;
        tab.app = angular.copy($scope.contents.app);
        tab.appGuid = tab.app.guid;
        tab.appEvents = [];

        tab.tabBodytemplateUri = _PAAS_VIEWS_ + "/application/tabAppEvents.html" + _VersionTail();

        tab.listAppEvents = function (currentPage) {
            tab.loadingAppEvents = true;
            var eventsPromise = applicationService.listAppEvents(tab.appGuid, 100);
            eventsPromise.success(function (data) {
                tab.appEvents = data;
                tab.loadingAppEvents = false;
            });
            eventsPromise.error(function (data) {
                tab.appEvents = {};
                tab.loadingAppEvents = false;
            });
        };

        tab.listAppEvents();
    })
    .controller('tabAppWebLogCtrl', function ($scope, $location, $state, $translate, $stateParams, $timeout, user, portal, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : tabAppWebLogCtrl", 1);

        var tab = this;
        tab.app = angular.copy($scope.contents.app);
        tab.appGuid = tab.app.guid;

        tab.appWebLogIframe = '';
        tab.tabBodytemplateUri = _PAAS_VIEWS_ + "/application/tabAppWebLog.html" + _VersionTail();

        tab.iframeHeight = 250;
        tab.tailLogAction = false;

        tab.tailLog = function (action) {
            if (action == 'start') {
                $scope.main.loadingMainBody = true;
                var accessTokenPromise = portal.users.getAccessToken();
                accessTokenPromise.success(function (data) {
                    var appWebLogIframeSrc = $scope.main.sltRegion.webLogXpertUrl + "?access_token=" + data.access_token + "&app=" + tab.appGuid;
                    tab.appWebLogIframe = '<iframe style="width: 100%; height: 250px; border: 0;" src="' + appWebLogIframeSrc + '"></iframe>';
                    $scope.main.loadingMainBody = false;
                    tab.tailLogAction = true;
                });
                accessTokenPromise.error(function (data) {
                    $scope.main.loadingMainBody = false;
                    tab.tailLogAction = false;
                    tab.appWebLogIframe = '';
                });
            } else {
                tab.tailLogAction = false;
                tab.appWebLogIframe = '';
            }
        };
        tab.tailLog('start');
    })
    .controller('tabAppWebSshCtrl', function ($scope, $location, $state, $translate, $stateParams, $timeout, user, portal, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : tabAppWebSshCtrl", 1);

        $timeout(function () {
            $('.scroll-pane').jScrollPane({}).resize();
        }, 100);

        var tab = this;
        tab.app = angular.copy($scope.contents.app);
        tab.appGuid = tab.app.guid;
        tab.iframeHeight = 400;

        tab.appWebSshIframe = '';
        tab.tabBodytemplateUri = _PAAS_VIEWS_ + "/application/tabAppWebSsh.html" + _VersionTail();

        tab.sltInstanceStatsId = "";

        tab.changeInstanceStats = function () {
            if (tab.app.instanceStats.length > 0) {
                if (tab.sltInstanceStatsId != "") {
                    var appWebSshIframeSrc = $scope.main.sltRegion.terminalXpertUrl + "?app=" + tab.appGuid + "&index=" + tab.sltInstanceStatsId;
                    tab.appWebSshIframe = '<iframe style="width: 100%; height: 100%; border: 0;" src="' + appWebSshIframeSrc + '"></iframe>';
                }else{
                    tab.sltInstanceStatsId = "";
                    tab.appWebSshIframe = "";
                }
            }
        };

        tab.changeInstanceStats();
        $scope.main.loadingMainBody = false;
    })
    .controller('tabAppMonitCtrl', function ($scope, $location, $state, $translate, $stateParams, $timeout, $interval, $rootScope, $filter, user, applicationService) {
        _DebugConsoleLog("applicationControllers.js : tabAppMonitCtrl", 1);

        var tab = this;
        tab.app = angular.copy($scope.contents.app);
        tab.appGuid = tab.app.guid;

        tab.tabBodytemplateUri = _PAAS_VIEWS_ + "/application/tabAppMonit.html" + _VersionTail();

        tab.lineChartLabels = [];
        tab.lineChartDayLabels = [];

        tab.timeRanges = ["1", "2", "6", "24", "48"];
        tab.periods = ["1", "10", "60"];

        tab.selTimeRange = tab.timeRanges[0];
        tab.selPeriod = tab.periods[0];
        
        tab.getStepRang = function (rangeType) {
            var range = 60000;
            if (rangeType == "s") {
                range = 1000;
            } else if (rangeType == "h") {
                range = 3600000;
            } else if (rangeType == "d") {
                range = 86400000;
            }
            return range;
        };

        tab.getChartTimeLabels = function(time_step, start_time) {
            var setDate = new Date();
            var stepRangeType = time_step.substring(time_step.length - 1);
            var stepRangeTime = time_step.substring(0, time_step.length - 1);
            var stepRange = tab.getStepRang(stepRangeType);
            stepRangeTime *= stepRange;

            var startRangeType = start_time.substring(start_time.length - 1);
            var startRangeTime = start_time.substring(0, start_time.length - 1);
            startRangeTime *= tab.getStepRang(startRangeType);

            var end = Math.round(setDate.getTime()/stepRange)*stepRange;
            var start = end - startRangeTime;
            var lineChartLabels = [];
            for (var time = start; time < end; time += stepRangeTime) {
                lineChartLabels.push(new Date(time));
            }
            return lineChartLabels;
        };

        tab.getTimeColumnSeries = function(data) {
            var series = [];
            if (angular.isArray(data) && data.length > 0 && angular.isArray(data[0].series)  && data[0].series.length > 0) {
                angular.forEach(data[0].series, function (appData) {
                    appData.columnData = [];
                    if (angular.isArray(appData.values) &&  appData.values.length > 0) {
                        var valuesLen = appData.values.length;
                        angular.forEach(appData.values, function (value, key) {
                            var itemObj = {};
                            angular.forEach(appData.columns, function (column, k) {
                                itemObj[column] = value[k];
                            });
                            if (key == valuesLen - 1 && itemObj["total"]) {
                                appData.total = itemObj["total"];
                            }
                            appData.columnData.push(itemObj);
                        });
                    }
                    series.push(appData)
                });
            }
            return series;
        };

        tab.data = {};
        tab.lineChartCpu = {};
        tab.lineChartMem = {};
        tab.lineChartDisk = {};

        tab.lineChartLabels = tab.getChartTimeLabels(tab.selPeriod + "m", tab.selTimeRange + "h");
        tab.lineChartCpu.options = tab.lineChartMem.options = tab.lineChartDisk.options = {
            elements: { line: { tension: 0 }, point: { radius: 0 } },
            scales: {
                xAxes: [{ type: 'time', distribution: 'series', ticks: {
                    callback: function(value, index, values) {
                        if (values[index]) {
                            return $filter('date')(values[index].value, 'HH:mm');
                        } else {
                            return value;
                        }
                    },
                    time: { unit: 'minute' },
                },
                }]
            },
        };

        tab.lineChartCpu.series = ['CPU'];
        tab.lineChartMem.series = ['Memory'];
        tab.lineChartDisk.series = ['Disk'];

        tab.lineChartCpu.colors = [{ borderColor: "rgba(183,93,218,1)", backgroundColor: "rgba(183,93,218,0.2)", fill: true }];
        tab.lineChartMem.colors = [{ borderColor: "rgba(1,160,206,1)", backgroundColor: "rgba(1,160,206,0.2)", fill: true }];
        tab.lineChartDisk.colors = [{ borderColor: "rgba(22,87,218,1)", backgroundColor: "rgba(22,87,218,0.2)", fill: true }];

        tab.getAppMonitoring = function() {
            tab.loadingAppMonit = true;
            var monitoringPromise = applicationService.getAppMonitoring(tab.appGuid, tab.selPeriod + "m", tab.selTimeRange + "h");
            monitoringPromise.success(function (data) {
                tab.loadingAppMonit = false;
                var series = tab.getTimeColumnSeries(data);
                if (series && series.length > 0) {
                    tab.data = series[0];
                    tab.monitoringGraphs = true;
                } else {
                    tab.data = {};
                    tab.monitoringGraphs = false;
                }
                var cpuData = [[]];
                var memData = [[]];
                var diskData = [[]];
                if (angular.isArray(tab.data.columnData)) {
                    var labels = [];
                    angular.forEach(tab.data.columnData, function (item, key) {
                        labels.push(new Date(item['time']));
                        cpuData[0].push(item['cpu_percentage']);
                        memData[0].push(item['memory_bytes'] / item['memory_bytes_quota'] * 100);
                        diskData[0].push(item['disk_bytes'] / item['disk_bytes_quota'] * 100);
                    });
                    tab.lineChartCpu.labels = tab.lineChartMem.labels = tab.lineChartDisk.labels = labels;
                    delete(tab.lineChartCpu.options.scales.yAxes);
                    delete(tab.lineChartMem.options.scales.yAxes);
                    delete(tab.lineChartDisk.options.scales.yAxes);
                } else {
                    tab.lineChartCpu.labels = tab.lineChartMem.labels = tab.lineChartDisk.labels = angular.copy(tab.lineChartLabels);
                    tab.lineChartCpu.options.scales.yAxes = [{ ticks: { min : 0 } }];
                    angular.forEach(tab.lineChartCpu.labels, function (time, key) {
                        cpuData.push(null);
                        memData.push(null);
                        diskData.push(null);
                    });
                }
                $timeout(function () {
                    tab.lineChartCpu.data = cpuData;
                    tab.lineChartMem.data = memData;
                    tab.lineChartDisk.data = diskData;
                }, 100);
            });
            monitoringPromise.error(function (data) {
                tab.loadingAppMonit = false;
            });
        };

        tab.changeTimestamp = function () {
            tab.lineChartLabels = tab.getChartTimeLabels(tab.selPeriod + "m", tab.selTimeRange + "h");
            tab.getAppMonitoring();
        };
        
        tab.getAppMonitoring();
    })
;
