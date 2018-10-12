'use strict';

angular.module('portal.controllers')
	.controller('commProjectsCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, ValidationService, common, cache, projectService, quotaService) {
		_DebugConsoleLog('projectControllers.js : projectsCtrl Start, path : ' + $location.path(), 1);

		var ct = this;
		ct.schType = 'projectName';
		ct.projects = [];

		ct.pop = {};
        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.project = {
            id : 0,
            name : '',
            description : '',
            quota : {}
        };

		// 기업관리자
		ct.isManager = cache.getUser().manager;
		ct.isAdmin   = cache.getUser().uaaAdmin;

		// 권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자
		ct.userAuth = common.getUserAuth();
		ct.user     = common.getUser();

		ct.listProjects = function() {
			$scope.main.loadingMainBody = true;

			var schType = ct.schType;
			var schText = ct.schText;

			var promise = projectService.listProjects(schType, schText);
			promise.success(function(data, status, headers) {
				ct.projects = data.items;

				$scope.main.loadingMainBody = false;
			});
			promise.error(function(data, status, headers) {

				ct.projects = [];
				$scope.main.loadingMainBody = false;
			});
		};

		ct.listProjects_click = function(project) {
			$location.path('/comm/projects/projectDetail/' + project.id);
		};

		/*프로젝트 등록 팝업 오픈*/
		ct.callAddProject = function($event) {
			// reset
            pop.project = {};
            pop.project.useStartDate = moment().format('YYYY-MM-DD');
            pop.project.useEndDate   = moment().add(364, 'days').format('YYYY-MM-DD');
            pop.project.quota = {};

			if (!!$scope.main.loadingMainBody) {
				return;
			}

			//팝업 오픈
			var dialogOptions = {
                title: $translate.instant("label.project_register"),
                formName: "projectsAsideAddForm",
                controllerAs: "projectPop",
                templateUrl: _COMM_VIEWS_ + "/project/popProjectForm.html" + _VersionTail(),
				btnTemplate : '<div class="sideBtmWrap two">' +
							  '<button type="button" name="button" class="btn" data-user="aside-close" ng-click="pop.saveProject();" ng-disabled="projectsAsideAddForm.$invalid">{{ "label.save" | translate }}</button>' +
							  '<button type="button" name="button" class="btn btn-color5" data-user="aside-close" ng-click="contents.closeAddProject();">{{ "label.cancel" | translate }}</button>' +
							  '</div>'
			};
			ct.rightDialog = common.showRightDialog($scope, dialogOptions);

			//project 쿼터 조회
			$scope.main.loadingMainBody = true;
			var promise = quotaService.listProjectQuotas({});
			promise.success(function(data, status, headers) {
                pop.projectQuotas = data;
				for (var i = 0, l = data.items.length; i < l; i++) {
					if (data.items[i].defaultQuota == true) {
						pop.project.quota.id = data.items[i].id;
						break;
					}
				}
				$scope.main.loadingMainBody = false;
			});
			promise.error(function(data, status, headers) {
                pop.projectQuotas = {};
				$scope.main.loadingMainBody = false;
			});
		};

        ct.closeAddProject = function() {
            pop.project = {};
            pop.project.quota = {};
			common.mdDialogCancel();
		};

		/*프로젝트 등록*/
		pop.saveProject = function() {
            if (! $scope.projectPop.validationService.checkFormValidity($scope.projectPop.projectsAsideAddForm)) {
                return;
            }
            if (!pop.project.name) {
                common.showAlert($translate.instant('label.save'), '1. 프로젝트명을 입력해 주세요.');
                return;
            }

            if (!pop.project.quota.id) {
                common.showAlert($translate.instant('label.save'), '4. 프로젝트 쿼터를 선택해 주세요.');
                return;
            }

            $scope.main.loadingMainBody = true;

            var params = {
                name : pop.project.name,
                quota : {
                    id : pop.project.quota.id
                }
            };

			/*프로젝트명 중복확인*/
            var promise = projectService.existsProject(params);
            promise.success(function(data, status, headers) {

                $scope.main.loadingMainBody = false;

                if (!data.name) {
                    projectSaveAction();
                } else {
                    common.showAlert($translate.instant('label.save'), $translate.instant('message.mi_exist_duplicate_project_name'));
                }
            });
            promise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
		};

		// 배경색설정
        ct.backgroundColorSettingNgClick = function(param) {
            var $index = param.$index;
            var className = param.className;

            $('#panelWrapColorType' + $index).removeClass('color-type1 color-type2 color-type3 color-type4 color-type5').addClass(className);

        };

		/*프로젝트 등록*/
		function projectSaveAction() {

			$scope.main.loadingMainBody = true;
			var promise = projectService.saveProject(pop.project);
			promise.success(function(data, status, headers) {
				$scope.main.syncListAllProjects();	//프로젝트 전체 조회
				ct.closeAddProject();
				ct.listProjects();

				common.showAlertInfo("등록 되었습니다.");

				$scope.main.loadingMainBody = false;
			});
			promise.error(function(data, status, headers) {
				$scope.main.loadingMainBody = false;

				common.showAlertError($translate.instant('label.error'), $translate.instant('message.mi_error'));
			});
		}

        ct.listProjects();

	})
	.filter('orgRoleName', function(CONSTANTS) {
		return function(input) {

			var json = {};
			json[CONSTANTS.roleName.owner] = '프로젝트 책임자';
			json[CONSTANTS.roleName.admin] = '프로젝트 관리자';
			json[CONSTANTS.roleName.user] = '프로젝트 사용자';

			return json[input];
		}
	})
    .filter('roleName2', function(CONSTANTS) {
        return function(input) {

            var json = {};
            json[CONSTANTS.roleName.owner] = '책임자';
            json[CONSTANTS.roleName.admin] = '관리자';
            json[CONSTANTS.roleName.user] = '사용자';

            return json[input];
        }
    })
;
