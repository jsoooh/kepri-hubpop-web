'use strict';

angular.module('portal.controllers')
    .controller('commDashboardsCtrl', function ($scope, $location, $state, $stateParams, $translate, $timeout, userSettingService, projectService, orgService, boardService, common, cache, CONSTANTS) {
        _DebugConsoleLog("dashboardControllers.js : commDashboardsCtrl", 1);
        var ct           = this;

        /** 임시 **/
        var myQuickMenusKey = "MY_QUICK_MENUS_"+$scope.main.userInfo.user_id;

        ct.bgtypes = angular.copy(CONSTANTS.itemBoxBgTypes);

        ct.reductAsides = {
            alarm: {label: "comm.label.alarm", checked: true}
            , document: {label: "comm.label.document", checked: true}
            , notice: {label: "comm.label.notice", checked: true}
            //, usage_trend: {label: "comm.label.usage_trend", checked: true}
            //, usage: {label: "comm.label.usage", checked: true}
        };

        ct.totalJobCount = 0;
        ct.quickMenus = [];
        ct.projectItems = [];
        ct.projects     = [];
        ct.jobItems     = [];
        ct.jobs         = [];
        ct.documents    = [];   //document View : tutorial

        /*우측 대시보드 보여질 항목 조회*/
        ct.defaultMyReductAsidesSet = function () {
            var userSettingPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.reductAsidesKey);
            userSettingPromise.success(function(data, status, headers) {
                data = userSettingService.userSettingParse(data);
                if (data && angular.isObject(data.contents)) {
                    for (var key in ct.reductAsides) {
                        if (data.contents[key] && data.contents[key].checked === false) {
                            ct.reductAsides[key].checked = false;
                        }
                    }
                }
            });
            userSettingPromise.error(function(data, status, headers) {
            });
        };

        ct.defaultMyQuickMenusSet = function () {
            /** 구체적인 부분이 정해지면 다시 작업
            var userSettingPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.myQuickMenusKey);
            userSettingPromise.success(function(data, status, headers) {
                ct.quickMenus = [];
                data = userSettingService.userSettingParse(data);
                if (data && angular.isArray(data.contents) {
                    ct.quickMenus = data.contents;
                }
            });
            userSettingPromise.error(function(data, status, headers) {
                if (!ct.quickMenus) ct.quickMenus = [];
            });
            **/
            /** 임시 **/
            var myQuickMenus = cache.getStorageJson(myQuickMenusKey);
            if (!angular.isArray(myQuickMenus) || myQuickMenus.length == 0) {
                myQuickMenus = [
                    {
                        id: 1,
                        name: "Notice Info",
                        hide: false,
                        bgColorType: 'color-no',
                        bgImage: 'images/im_sample_pic.jpg',
                        count: 0
                    }
                    , {id: 2, name: "Tutorial", hide: false, bgColorType: 'color-type1', bgImage: '', count: 5}
                    , {id: 3, name: "Alarm Setting", hide: false, bgColorType: 'color-type2', bgImage: '', count: 7}
                ];
                cache.setStorageJson(myQuickMenusKey, myQuickMenus);
            }
            ct.quickMenus = myQuickMenus;
            /** 임시 **/
        };

        /*우측 대시보드 보여질 항목 조회*/
        ct.defaultMyReductAsidesSet();
        ct.defaultMyQuickMenusSet();

        ct.myProjectsLoad = "no";
        ct.getMyProjects = function () {
            var userSettingPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.myProjectsKey);
            userSettingPromise.success(function (data, status, headers) {
                ct.myProjects = [];
                data = userSettingService.userSettingParse(data);
                if (data && angular.isArray(data.contents)) {
                    ct.myProjects = data.contents;
                }
                if (ct.listProjectsLoad == "success") {
                    ct.listProjectsSetting();
                }
                ct.myProjectsLoad = "success";
            });
            userSettingPromise.error(function (data, status, headers) {
                if (!ct.myProjects) ct.myProjects = [];
                ct.myProjectsLoad = "error";
            });
        };

        ct.myJobsLoad = "no";
        ct.getMyJobs = function () {
            var userSettingPromise = userSettingService.getUserSetting(CONSTANTS.userSettingKeys.myJobsKey);
            userSettingPromise.success(function (data, status, headers) {
                ct.myJobs = [];
                data = userSettingService.userSettingParse(data);
                if (data && angular.isArray(data.contents)) {
                    ct.myJobs = data.contents;
                }
                if (ct.listJobsLoad == "success") {
                    ct.listJobsSetting();
                }
                ct.myJobsLoad = "success";
            });
            userSettingPromise.error(function (data, status, headers) {
                if (!ct.myJobs) ct.myJobs = [];
                ct.myJobsLoad = "error";
            });
        };

        ct.tempReductAsides = {};

        ct.saveMyProjectSetting = function () {
            var myProjects = [];
            for (var i=0; i<ct.projects.length; i++) {
                var myProject         = {};
                myProject.id          = ct.projects[i].id;
                myProject.hide        = ct.projects[i].hide;
                myProject.bgColorType = ct.projects[i].bgColorType;
                myProject.bgImage     = ct.projects[i].bgImage;
                myProjects.push(myProject);
            }
            var userSettingPromise = userSettingService.saveUserSetting(CONSTANTS.userSettingKeys.myProjectsKey, myProjects);
            userSettingPromise.success(function (data, status, headers) {
            });
            userSettingPromise.error(function (data, status, headers) {
            });
        };

        ct.projectItemBgChange = function (item, dmitem) {
            item.bgColorType   = dmitem.bgColorType;
            item.bgImage       = dmitem.bgImage;
            ct.saveMyProjectSetting();
        };

        ct.projectItemSetHide = function (item) {
            item.hide = true;
            ct.saveMyProjectSetting();
        };

        ct.saveMyJobSetting = function () {
            var myJobs            = [];
            for (var i=0; i<ct.jobs.length; i++) {
                var myJob         = {};
                myJob.id          = ct.jobs[i].id;
                myJob.hide        = ct.jobs[i].hide;
                myJob.bgColorType = ct.jobs[i].bgColorType;
                myJob.bgImage     = ct.jobs[i].bgImage;
                myJobs.push(myJob);
            }
            var userSettingPromise = userSettingService.saveUserSetting(CONSTANTS.userSettingKeys.myJobsKey, myJobs);
            userSettingPromise.success(function (data, status, headers) {
             });
            userSettingPromise.error(function (data, status, headers) {
            });
        };

        ct.jobItemBgChange = function (item, dmitem) {
            item.bgColorType = dmitem.bgColorType;
            item.bgImage     = dmitem.bgImage;
            ct.saveMyJobSetting();
        };

        ct.jobItemSetHide = function (item) {
            item.hide = true;
            ct.saveMyJobSetting();
        };

        ct.quickMenuItemBgChange = function (item, dmitem) {
            item.bgColorType = dmitem.bgColorType;
            item.bgImage = dmitem.bgImage;
            cache.setStorageJson(myQuickMenusKey, ct.quickMenus);
        };

        ct.quickMenuItemSetHide = function (item) {
            item.hide = true;
            cache.setStorageJson(myQuickMenusKey, ct.quickMenus);
        };

        /*프로젝트 조회*/
        ct.totalJobCount = 0;
        ct.listProjectsLoad = "no";
        ct.listProjects = function () {
            ct.projects = [];
            ct.projectItems = [];
            ct.totalJobCount = 0;
            var projectsPromise = projectService.listProjects("", "");
            projectsPromise.success(function(data, status, headers) {
                ct.projects = data.items;
                ct.totalJobCount = 0;
                for (var i = 0, l = data.items.length; i < l; i++) {
                    var item = data.items[i];
                    ct.totalJobCount += item.orgCount;
                }
                if (data && data.items) {
                    ct.projectItems = data.items;
                    if (ct.myProjectsLoad == "success") {
                        ct.listProjectsSetting();
                    }
                }
                ct.listProjectsLoad = "success";
                $scope.main.loadingMainBody = false;
            });
            projectsPromise.error(function(data, status, headers) {
                ct.listProjectsLoad = "error";
                $scope.main.loadingMainBody = false;
            });
        };

        /*프로젝트 목록 : 배경색 등 세팅*/
        ct.listProjectsSetting = function () {
            ct.projects = [];
            var isMyProjectArr = [];
            if (angular.isArray(ct.myProjects)) {
                for (var i=0; i<ct.myProjects.length; i++) {
                    var project = common.objectsFindCopyByField(ct.projectItems, "id", ct.myProjects[i].id);
                    if (project && project.id) {
                        project.sortKey     = i;
                        project.hide        = ct.myProjects[i].hide;
                        project.bgColorType = ct.myProjects[i].bgColorType;
                        project.bgImage     = ct.myProjects[i].bgImage;
                        isMyProjectArr.push(project.id);
                        ct.projects.push(project);
                    }
                }
            } else {
                ct.myProjects = [];
            }
            for (var i=0; i<ct.projectItems.length; i++) {
                //ct.totalJobCount += ct.projectItems[i].orgCount;
                if (isMyProjectArr.indexOf(ct.projectItems[i].id) == -1) {
                    var project = angular.copy(ct.projectItems[i]);
                    var myProject = {};
                    myProject.id = project.id;
                    myProject.hide = false;
                    if ((i+1)%4 == 0) {
                        myProject.bgColorType = 'color-no';
                        myProject.bgImage = 'images/im_sample_pic.jpg';
                    } else {
                        myProject.bgColorType = "color-type"+(i+1)%4;
                        myProject.bgImage = "";
                    }
                    project.hide        = myProject.hide;
                    project.bgColorType = myProject.bgColorType;
                    project.bgImage     = myProject.bgImage;
                    ct.projects.push(project);
                    ct.myProjects.push(myProject);
                }
            }
            ct.projectData = [];
        };

        /*작업목록 조회*/
        ct.listJobsLoad = "no";
        ct.listJobs = function () {
            ct.jobs = [];
            ct.jobItems = [];
            var jobsPromise = orgService.getMyOrgList("", "");
            jobsPromise.success(function(data, status, headers) {
                if (data && data.items) {
                    ct.jobItems = data.items;
                    if (ct.myJobsLoad == "success") {
                        ct.listJobsSetting();
                    }
                }
                ct.listJobsLoad = "success";
                $scope.main.loadingMainBody = false;
            });
            jobsPromise.error(function(data, status, headers) {
                ct.listJobsLoad = "error";
                $scope.main.loadingMainBody = false;
            });
        };

        /*작업 목록 : 배경색 등 세팅*/
        ct.listJobsSetting = function () {
            ct.jobs = [];
            var isMyJobArr = [];
            if (angular.isArray(ct.myJobs)) {
                for (var i=0; i<ct.myJobs.length; i++) {
                    var job = common.objectsFindCopyByField(ct.jobItems, "id", ct.myJobs[i].id);
                    if (job && job.id) {
                        job.sortKey     = i;
                        job.hide        = ct.myJobs[i].hide;
                        job.bgColorType = ct.myJobs[i].bgColorType;
                        job.bgImage     = ct.myJobs[i].bgImage;
                        isMyJobArr.push(job.id);
                        ct.jobs.push(job);
                    }
                }
            } else {
                ct.myJobs = [];
            }
            for (var i=0; i<ct.jobItems.length; i++) {
                //ct.totalJobCount += ct.jobItems[i].orgCount;
                if (isMyJobArr.indexOf(ct.jobItems[i].id) == -1) {
                    var job = angular.copy(ct.jobItems[i]);
                    var myJob = {};
                    myJob.id = job.id;
                    myJob.hide = false;
                    if ((i+1)%4 == 0) {
                        myJob.bgColorType = 'color-no';
                        myJob.bgImage = 'images/im_sample_pic.jpg';
                    } else {
                        myJob.bgColorType = "color-type"+(i+1)%4;
                        myJob.bgImage = "";
                    }
                    job.hide        = myJob.hide;
                    job.bgColorType = myJob.bgColorType;
                    job.bgImage     = myJob.bgImage;
                    ct.jobs.push(job);
                    ct.myJobs.push(myJob);
                }
            }
            ct.jobItems = [];
        };

        ct.projectDragend = function (dropEffect) {
            ct.saveMyProjectSetting();
        };

        ct.jobDragend = function (dropEffect) {
            ct.saveMyJobSetting();
        };

        ct.quickMenuDragend = function (dropEffect) {
            cache.setStorageJson(myQuickMenusKey, ct.quickMenus);
        };

        ct.goProjectDetail = function(item) {
            $scope.main.goToPage('/comm/projects/projectDetail/' + item.id);
        };

        ct.goJobDetail = function(item) {
            $scope.main.goToPage('/comm/orgs/orgForm/R/' + item.id);
        };

        ct.asideReductAsideClick = function (evt) {
            if ($(evt.currentTarget).closest(".aside.reductAside").css("right") == "-400px") {
                ct.asideReductAsideOpen(evt);
            } else {
                ct.asideReductAsideClose(evt);
            }
        };

        ct.asideReductAsideOpen = function (evt) {
            ct.tempReductAsides = angular.copy(ct.reductAsides);
            $(evt.currentTarget).closest(".aside.reductAside").stop().animate({"right":"-40px"}, 500);
        };

        ct.asideReductAsideClose = function (evt) {
            $(evt.currentTarget).closest(".aside.reductAside").stop().animate({"right":"-400px"}, 600);
        };

        ct.asideReductAsideSave = function (evt) {
            ct.reductAsides = angular.copy(ct.tempReductAsides);
            var myReductAsides = {};
            for (var key in ct.reductAsides) {
                myReductAsides[key] = {};
                myReductAsides[key].checked = ct.reductAsides[key].checked;
            }
            var userSettingPromise = userSettingService.saveUserSetting(CONSTANTS.userSettingKeys.reductAsidesKey, myReductAsides);
            userSettingPromise.success(function (data, status, headers) {
                $(evt.currentTarget).closest(".aside.reductAside").stop().animate({"right":"-400px"}, 600);
            });
            userSettingPromise.error(function (data, status, headers) {
            });
        };

        /** 공지 목록 조회 **/
        ct.listNotices = function () {
            ct.notices = [];
            var noticePromise = boardService.listBoard(5, 0, "notice", "all", "");
            noticePromise.success(function (data) {
                ct.notices = data.items;
                ct.quickMenus[0].count = ct.notices.length;     //notice count
                ct.quickMenus[2].count = $scope.main.alarms?$scope.main.alarms.totalElements:0;     //alarm count
            });
            noticePromise.error(function (data, status, headers) {
            });
        };

        /** Document View 목록 조회 : tutorial **/
        ct.listDocuments = function () {
            ct.documents = [];
            var documentPromise = boardService.listBoard(5, 0, "qna", "", $scope.main.sltProjectId);
            documentPromise.success(function (data) {
                ct.documents = data.items;
            });
            documentPromise.error(function (data, status, headers) {
            });
        };

        ct.documents = [
              {id: 1, title: "가상 서버 활용하기"}
            , {id: 2, title: "SW 개발하기"}
            , {id: 3, title: "회원가입 및 작업 관리하기"}
            , {id: 4, title: "모니터링 하기"}
            /*, {id: 5, title: "데이터 연계 신청하기"}*/
        ];
        ct.quickMenus[1].count = ct.documents.length;     //tutorial count


        $scope.main.loadingMainBody = true;

        ct.useRecurseCpu = 35;
        ct.useRecurseDisk = 65;
        ct.useRecurseMemory = 78;

        ct.useRecurse = {
            cpu: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(183,93,218,1)","rgba(199,143,220,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]},
            disk: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(22,87,218,1)","rgba(143,171,234,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]},
            memory: {labels: [$translate.instant('label.usage'), $translate.instant('label.available_capacity')], colors: ["rgba(1,160,206,1)","rgba(145,191,206,.5)"], options: {cutoutPercentage: 65}, data: [0, 0]}
        };

        ct.usageTrend = {};
        ct.usageTrend.series = ['Cpu', 'Disk', 'Memory'];
        ct.usageTrend.colors = [
            {
                borderColor: "rgba(183,93,218,1)",
                backgroundColor: "rgba(183,93,218,0.2)",
                fill: true
            },
            {
                borderColor: "rgba(22,87,218,1)",
                backgroundColor: "rgba(22,87,218,0.2)",
                fill: true
            },
            {
                borderColor: "rgba(1,160,206,1)",
                backgroundColor: "rgba(1,160,206,0.2)",
                fill: true
            }
         ];
        ct.usageTrend.options = {
            elements: {
                line: {
                    tension: 0, // 꺾은 선형
                },
                point: {
                    radius: 0, // 점 없음
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        min : 0, // y축 min
                        max : 100, // y축 max
                        stepSize: 50 // y축 step
                    }
                }],
                xAxes: [{
                    type: 'time',
                    distribution: 'series',
                    ticks: {
                        callback: function(value, index, values) {
                            if (values[index]) {
                                var time = new Date(values[index].value);
                                return time.getHours() + $translate.instant("label.hour");
                            } else {
                                return value;
                            }
                        },
                        time: {
                            unit: 'minute'
                        },
                    },
                }]
            },
        };

        ct.usageTrend.labels = [];
        var now = new Date();
        var nowYear = now.getFullYear();
        var nowMonth = (now.getMonth() + 1);
        nowMonth = (nowMonth < 10) ? "0" + nowMonth : nowMonth;
        var nowDay = now.getDay();
        nowDay = (nowDay < 10) ? "0" + nowDay : nowDay;
        var setDate = new Date(nowYear + '-' + nowMonth + '-'+nowDay+'T00:00:00');
        for (var i=0; i<24*6; i++) {
            ct.usageTrend.labels.push(new Date(setDate.getTime() + i*10*60000));
        }
        var nowHours = now.getHours();
        var nowMinutes = now.getMinutes();
        var data = [[], [], []];
        for (var i=0; i<=nowHours; i++) {
            if (i == nowHours-1) {
                for (var j=0; j<nowMinutes; j=j+10) {
                    data[0].push(Math.round((Math.random() * 40) + 10));
                    data[1].push(Math.round((Math.random() * 30) + 60));
                    data[2].push(Math.round((Math.random() * 10) + 30));
                }
            } else {
                for (var j=0; j<60; j=j+10) {
                    data[0].push(Math.round((Math.random() * 40) + 10));
                    data[1].push(Math.round((Math.random() * 30) + 60));
                    data[2].push(Math.round((Math.random() * 10) + 30));
                }
            }
        }

        $timeout(function () {
            ct.useRecurse.cpu.data    = [ct.useRecurseCpu, (100-ct.useRecurseCpu)];
            ct.useRecurse.disk.data   = [ct.useRecurseDisk, (100-ct.useRecurseDisk)];
            ct.useRecurse.memory.data = [ct.useRecurseMemory, (100-ct.useRecurseMemory)];
            ct.usageTrend.data = data;
        }, 500);

        //if ($scope.main.userAuth == 'M') {
            ct.listProjects();
            ct.getMyProjects();
        //} else {
            ct.listJobs();
            ct.getMyJobs();
        //}

        /*
        * 타시스템으로 넘어가기
        *   gb : project/job
        *   sSystem : iaas/paas/monit
        *   obj : projectObj/jobObj
        * */
        ct.goSystemLink = function(gb, sSystem, obj){
            if (!obj) return;
            if (gb=='project'){
                //프로젝트 상세에 따라 공통 현프로젝트 변경
                $scope.main.changeProject(obj);
                if (obj.orgCount == 0){
                    //하위 작업 없음
                    common.showAlertWarning(2000, $translate.instant('message.mi_dont_exist_low_org'));
                    return;
                } else {
                    var bTrue = false;  //obj.orgs[i].statusCode : done, change_done 있을 때 true
                    for (var i=0; i < obj.orgs.length; i++){
                        if (obj.orgs[i].statusCode=='done' || obj.orgs[i].statusCode=='change_done'){
                            if ($scope.main.sltPortalOrgId != obj.orgs[i].id) {
                                /*$scope.main.setPortalOrg(obj.orgs[i]);
                            } else {*/
                                obj.orgs[i].orgId = obj.orgs[i].systemId;
                                $scope.main.changePortalOrg(obj.orgs[i]);
                            }
                            bTrue = true;
                            break;
                        }
                    }
                    if (!bTrue){
                        //정상 작업 없음
                        common.showAlertWarning(2000, $translate.instant('message.mi_dont_exist_normal_org'));
                        return;
                    }
                }
            } else if (gb=='job'){
                var thisProject = {'id':obj.projectId, 'name':obj.projectName};
                obj.orgId = obj.systemId;
                //프로젝트 상세에 따라 공통 현프로젝트 변경
                $scope.main.changeProject(thisProject);
                if (obj.statusCode=='done' || obj.statusCode=='change_done') {
                    if ($scope.main.sltPortalOrgId != obj.id) {
                        /*$scope.main.setPortalOrg(obj);
                    } else {*/
                        $scope.main.changePortalOrg(obj);
                    }
                } else {
                    //정상 작업 없음
                    common.showAlertWarning(2000, $translate.instant('message.mi_dont_exist_normal_org'));
                    return;
                }
            }
            common.locationPath(sSystem);
        };

        ct.listNotices();
        //ct.listDocuments();

    })
;
