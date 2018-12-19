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
            if(ct.sltOrganizationGuid) {
                conditions.push("organization_guid:" + ct.sltOrganizationGuid);
            }
            if(ct.sltSpaceGuid) {
                conditions.push("space_guid:" + ct.sltSpaceGuid);
            }
            if(ct.sltAppNames && ct.sltAppNames.length > 0) {
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
                }

                angular.forEach(ct.apps, function(option, mainKey) {
                    if (option.spaceQuota && option.spaceQuota.guid) {
                        option["memoryMax"] = option.spaceQuota.instanceMemoryLimit;
                    } else if (option.organization && option.organization.guid && option.organization.quotaDefinition && option.organization.quotaDefinition.guid) {
                        if (option.organization.quotaDefinition.instanceMemoryLimit > 0) {
                            option["memoryMax"] = option.organization.quotaDefinition.instanceMemoryLimit;
                        }else{
                            option["memoryMax"] = 4096;
                        }
                    }else{
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

                        var instanceStatsUsageCpu = 0;
                        var instanceStatsUsageMemory = 0;
                        var instanceStatsUsageDisk = 0;

                        for (var i=0; i<option["instanceStats"].length; i++) {
                            if (option["instanceStats"][i].usage != null) {
                                instanceStatsUsageCpu += option["instanceStats"][i].usage.cpu * 100;
                                instanceStatsUsageMemory += (parseInt(option["instanceStats"][i].usage.mem, 10) * 100) / parseInt(option["instanceStats"][i].memQuota, 10);
                                instanceStatsUsageDisk += (parseInt(option["instanceStats"][i].usage.disk, 10) * 100) / parseInt(option["instanceStats"][i].diskQuota, 10);
                            }

                            if(option["instanceStats"][i].state == "CRASHED"){
                                ct.appStateCnt++;
                            }else if(option["instanceStats"][i].state == "STOPPED"){
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

                        $scope.main.loadingMainBody = false;
                        $scope.main.loadingMain = false;
                    });
                });

/*
                if (ct.pageFirstLoad && (!ct.apps || ct.apps.length == 0)) {
                    ct.firstAppCreatePop();
                }
*/

                ct.pageFirstLoad = false;
                $scope.main.loadingMainBody = false;
                $scope.main.loadingMain = false;
            });
            appPromise.error(function (data) {
                ct.apps = [];
                ct.pageFirstLoad = false;
                $scope.main.loadingMainBody = false;
                $scope.main.loadingMain = false;
            });
        };

        ct.getAppState = function (guid) {
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
        };

        $scope.fieldTable = [{
            field: "선택",
            method: ""
        }, {
            field: "시작",
            method: "startAppState"
        }, {
            field: "중지",
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

        ct.controllAppState = function(selected, guid, name, $event){
            if(selected.field == "시작"){
                ct.startAppState(guid, name);
            }else if(selected.field == "재시작"){
                ct.startAppState(guid, name, 'restart');
            }else if(selected.field == "중지"){
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
        };

        ct.deleteApp = function(guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.deleteAppAction(guid);
            });
        };

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
                ct.listAllApps();
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };


        ct.startAppState = function(guid, name, type) {
            if (type == 'restart') {
                var showConfirm = common.showConfirm($translate.instant('label.restart') + "(" + name + ")", $translate.instant('message.mq_start_app'));
            } else {
                var showConfirm = common.showConfirm($translate.instant('label.start') + "(" + name + ")", $translate.instant('message.mq_start_app'));
            }
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.updateAppStateAction(guid, "STARTED");
            });
        };

        ct.stopAppState = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.stop2') + "(" + name + ")", $translate.instant('message.mq_stop_app'));
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

            $scope.main.loadingMainBody = true;
            if(guid == null) {
                var inputName = document.getElementById('inputAppName-'+inputName);
                var guid = inputName.dataset.guid;
            }

            var appPromise = applicationService.updateAppNameAction(guid, inputName);
            appPromise.success(function (data) {
                ct.listAllApps();
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
    .controller('paasApplicationPushCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, user, applicationService, ValidationService, FileUploader, common, CONSTANTS, $cookies) {
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
            ct.appFileItem.localFullFileName = ($('#appFileInput').length > 0) ? $('#appFileInput').val() : "";
        };

        // 언어 선택 스크롤 생성
        ct.scrollPane = function (){
            setTimeout(function() {
                var scrollPane = $('.scroll-pane').jScrollPane({});
            }, 250);
        };

        ct.appPushData.pushType   		 = "GENERAL";
        ct.appPushData.appName   		 ='app-01' ; 
        ct.appPushData.domainFirstName   ='app-01' ; 
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
        
       /* ct.toggle = function () {
            ct.visible = !ct.visible;
            if (ct.visible)
              ct.refreshSlider();
        };*/
          
      /*  ct.refreshSlider = function () {
            $timeout(function () {
              $scope.$broadcast('rzSliderForceRender');
            });
          };
        */
        
        
        
        ct.defaultSet = {
					            instances: 1,
					            memory: 768,
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
		        			                    return value + 'M';
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
			        			                    return value + 'M';
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

        //Insert
        ct.appPush = function () {
            
        	if ($scope.actionBtnHied) return;
            
        	$scope.actionBtnHied = true;
            
            if (!new ValidationService().checkFormValidity($scope[ct.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            $scope.main.loadingMain 	= true;
            $scope.main.loadingMainBody = true;
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
            appBody.withStart 	= false;

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
            
           // console.log("appBody====>"+ JSON.stringify(appBody));

            if (ct.appFileItem) {
                appBody.file 	   = ct.appFileItem._file;
                var appPushPromise = applicationService.appFilePush(appBody);
                
                appPushPromise.success(function (data) {
                    $scope.actionBtnHied 		= false;
                    $scope.main.loadingMain 	= false;
                    $scope.main.loadingMainBody = false;
                    
                    common.showAlertSuccessHtml($translate.instant("label.app") + "(" + data.name + ")", $translate.instant("message.mi_register_success"));
                    
                    $scope.main.startAppGuid = data.guid;
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
        ct.sltInfoTab = 'service';

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
            console.log($scope.main.layerTemplateUrl);

            $(".aside").stop().animate({"right":"-360px"}, 400);
            $("#aside-aside1").stop().animate({"right":"0"}, 500);
        };

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
                },
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
                },
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
                },
            });
        };

        $scope.moveDashboard = function (index, systemId, name) {
          $scope.main.hubpop.orgSelected = $scope.main.hubpop.projectSelected.orgs[index];
          $location.path("/paas");
        };

        var originName = "";

        //자바 상세 인스턴스 이름 변경
        ct.renameInst = function () {
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
                common.showAlert("", "최소 3자 이상이어야 합니다.");
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
            console.log(name01);
            var el = "<h4 class='c-tit'></h4>";
            var compiledElement = $compile(el)($scope);
            nameP.contents().unwrap().wrap(compiledElement);
            $(".updateName").remove();
        };


        // 인스턴스 재시작
        ct.instanceRestart = function (guid, index) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.restartAppInstance(guid, index);
            appPromise.success(function (data) {
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

        ct.listAllAppInstanceStats = function () {
            if (ct.app.state != "STARTED") {
                $scope.main.reloadTimmerStop();
                return;
            }
            var appPromise = applicationService.listAllAppInstanceStats(ct.appGuid);
            appPromise.success(function (data) {
                common.objectOrArrayMergeData(ct.instanceStats, data);
                ct.setRoundProgressData();
                ct.reloadAppInstanceStats();
            });
            appPromise.error(function (data) {
                ct.app = {};
                ct.instanceStats = [];
            });
        };

        ct.createReloadTimmer = function () {
            $scope.main.reloadTimmerStart('reloadListAllAppInstanceStats', function () {
                ct.listAllAppInstanceStats();
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
            }
            if (reLoad) {
                ct.createReloadTimmer();
            }
        };

        // 처음에 로딩하는 경우만 매인 로딩바 표시
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

        ct.restageApp = function(guid, name) {
            var showConfirm = common.showConfirm($translate.instant('label.redeploy') + "(" + name + ")", $translate.instant('message.mq_redeploy_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                ct.restageAppAction(guid);
            });
        };

        ct.restageAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.restageApp(guid);
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

        ct.deleteApp = function(guid, name) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + name + ")", $translate.instant('message.mq_delete_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                $scope.main.refreshIntervalStop();
                ct.deleteAppAction(guid);
            });
        };

        ct.deleteAppAction = function(guid) {
            $scope.main.loadingMainBody = true;
            var appPromise = applicationService.deleteApp(guid);
            appPromise.success(function (data) {
                common.showAlertSuccess("삭제 되었습니다.");
                $scope.main.goToPage("/paas/apps");
            });
            appPromise.error(function (data) {
                $scope.main.loadingMainBody = false;
            });
        };

        ct.changeSltInfoTab = function (sltInfoTab) {
            ct.sltInfoTab = sltInfoTab;
        };

        $scope.main.refreshIntervalStart('appStats', function () {
            ct.getAppStats(false);
        }, 60000);

        ct.getAppStats(true);
        ct.getAppSummary();
        ct.changeSltInfoTab('service'); //20181126 sg0730 kepri 통합 요청으로 인한 Applog 제일 상단 배치
    })
    .controller('paasApplicationRePushFormCtrl', function ($scope, $location, $state, $stateParams, $timeout, $translate, user, applicationService, common, CONSTANTS) {
        _DebugConsoleLog("applicationControllers.js : paasApplicationRePushFormCtrl", 1);

        var pop = this;
        var ct = $scope.contents;

        pop.formName = $scope.dialogOptions.formName;
        pop.callBackFunction = $scope.dialogOptions.callBackFunction;
        $scope.dialogOptions.dialogClassName = "modal-md";
        $scope.dialogOptions.title = $translate.instant("label.redeploy");
        $scope.dialogOptions.okName =  $translate.instant("label.redeploy");
        $scope.dialogOptions.templateUrl = _PAAS_VIEWS_ + "/application/popAppRePushForm.html" + _VersionTail();

        pop.checkClick = false;
        pop.updateAppScale = function(guid, name) {
            if (pop.checkClick) return;
            pop.checkClick = true;
            if (ct.originalInstances == ct.instancesSlider.value && ct.originalMemory == ct.memorySlider.value && ct.originalDisk == ct.diskQuotaSlider.value) {
                common.showAlertWarning("변경된 사항이 없습니다.");
                pop.checkClick = false;
                return;
            }
            var message = $translate.instant('message.mi_memory_or_disk_changed_restage_info') + " ";
            var showConfirm = common.showConfirm($translate.instant('label.save') + "(" + name + ")", message + $translate.instant('message.mq_save_app'));
            showConfirm.then(function () {
                common.mdDialogHide();
                pop.updateAppScaleAction(guid, ct.instancesSlider.value, ct.memorySlider.value, ct.diskQuotaSlider.value);
            });
        };

        pop.updateAppScaleAction = function(guid, instances, memory, diskQuota) {
            $scope.main.loadingMainBody = true;
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
        tab.appGuid = $scope.contents.appGuid
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


        tab.deleteAppRoute = function (routeGuid, host) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + host + ")", $translate.instant('message.mq_delete_route'));
            showConfirm.then(function () {
                common.mdDialogHide();
                tab.deleteAppRouteAction(tab.appGuid, routeGuid);
            });
        };

        tab.deleteAppRouteAction = function (guid, routeGuid) {
            $scope.main.loadingMainBody = true;
            var appRoutePromise = applicationService.removeAppRoute(guid, routeGuid);
            appRoutePromise.success(function (appRoutData) {
                var routePromise = applicationService.deleteRoute(routeGuid);
                routePromise.success(function (data) {
                    $scope.main.loadingMainBody = false;
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
            pop.domains = [];
            pop.route = { spaceGuid : tab.app.space.guid };

            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.createAppRouteAction(pop.route);
            };
            $scope.actionBtnHied = false;
            $scope.actionLoading = true;
            pop.listAllDomains(tab.app.space.organizationGuid);
        };

        pop.listAllDomains = function (guid) {
            var domainPromise = applicationService.listAllDomains(guid);
            domainPromise.success(function (data) {
                pop.domains = data;
                if (data.length > 0) {
                    pop.route.domainGuid = data[0].guid;
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
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
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


        tab.deleteAppEnvironment = function (envItem) {
            var showConfirm = common.showConfirmWarning($translate.instant('label.del') + "(" + envItem.key + ")", $translate.instant('message.mq_delete_environment_variable'));
            showConfirm.then(function () {
                common.mdDialogHide();
                tab.deleteAppEnvironmentAction(envItem.key);
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
            pop.appUserEvnKey = "";
            pop.appUserEvnVal = "";
            pop.appUserEvnKeyDisabled = false;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updateAppEnvironmentAction(pop.appUserEvnKey, pop.appUserEvnVal);
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
            pop.appUserEvnKey = envItem.key;
            pop.appUserEvnVal = envItem.val;
            pop.appUserEvnKeyDisabled = true;
            common.showDialog($scope, $event, $scope.dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.updateAppEnvironmentAction(pop.appUserEvnKey, pop.appUserEvnVal);
            };
            $scope.actionBtnHied = false;
        };

        pop.updateAppEnvironmentAction = function (key, val) {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;
            if (!vs.checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                common.showAlert("", $translate.instant("message.mi_check_input"));
                return;
            }
            $scope.actionLoading = true;
            var appUserEnvVar = {};
            var envUpdate = false;
            for(var i=0; i<tab.appUserEnvVars.length; i++) {
                if (key == tab.appUserEnvVars[i].key) {
                    appUserEnvVar[tab.appUserEnvVars[i].key] = val;
                    envUpdate = true;
                } else {
                    appUserEnvVar[tab.appUserEnvVars[i].key] = tab.appUserEnvVars[i].val;
                }
            }
            if (!envUpdate) {
                appUserEnvVar[key] = val;
            }
            var routesPromise = applicationService.updateAppUserEnvironment(tab.appGuid, appUserEnvVar);
            routesPromise.success(function (data) {
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                $scope.popHide();
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

        tab.iframeHeight = 400;
        tab.tailLogAction = false;

        tab.tailLog = function (action) {
            if (action == 'start') {
                $scope.main.loadingMainBody = true;
                var accessTokenPromise = portal.users.getAccessToken();
                accessTokenPromise.success(function (data) {
                    var appWebLogIframeSrc = $scope.main.sltRegion.webLogXpertUrl + "?access_token=" + data.access_token + "&app=" + tab.appGuid;
                    tab.appWebLogIframe = '<iframe style="width: 100%; height: 100%; border: 0;" src="' + appWebLogIframeSrc + '"></iframe>';
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
