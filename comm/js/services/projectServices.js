'use strict';

angular.module('portal.services')
.factory('projectService', function(common, CONSTANTS) {

	var projectService = {};

	/*프로젝트 목록*/
	projectService.listProjects = function(schType, schText) {

		var params = {
			"schType" : schType,
			"schText" : schText
		};

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects', 'GET', params));
	};

	/*프로젝트 저장*/
	projectService.saveProject = function(params) {

		if (!params) {
			params = {
				name : '',
				description : ''
			};
		}

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects', 'POST', params));
	};

	/*프로젝트 상세조회*/
	projectService.getProject = function(id) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects/' + id, 'GET'));
	};

	/*프로젝트 멤버 등록*/
	projectService.addUsers = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects/' + params.projectId + '/users/multi', 'POST', params.projectUsers));
	};

	/*프로젝트 멤버 삭제*/
	projectService.removeUser = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects/' + params.projectId + '/users/' + params.id, 'DELETE'));
	};

	/*프로젝트명 중복확인*/
	projectService.existsProject = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects/exists', 'GET', params));
	};

	/*프로젝트 수정*/
	projectService.updateProject = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects/' + params.id, 'PUT', params));
	};

	/*프로젝트 삭제*/
	projectService.deleteProject = function(params) {

		return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/projects/' + params.id, 'DELETE'));
	};

	/*프로젝트 aaaaaaaaaaaaaa*/
	projectService.updateUser = function(params) {

		var pathUrl = CONSTANTS.uaaContextUrl;
		pathUrl += '/projects/' + params.projectId;
		pathUrl += '/users/' + params.id;
		pathUrl += '/role/' + params.role;

		return common.retrieveResource(common.resourcePromise(pathUrl, 'PUT'));
	};

	return projectService;
});
