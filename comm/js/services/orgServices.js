//'use strict';

angular.module('portal.services')
	.factory('orgService', function (common, CONSTANTS) {

		var orgService = {};
		/* 20.04.24 - 프로젝트 목록 : 우측 메뉴 기능 by ksw */
        /* 사용자 변경을 누르면 true로 변경 */
		orgService.changeUser = false;

		/*org 목록조회*/
        orgService.listOrgs = function (size, page, email, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "sort" : "createdDate,desc",
                "email": email,
                "schText" : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs', 'GET', getParams));
        };

        /*조직 추가*/
        orgService.requestOrgCreate = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs', 'POST', param, "multipart/form-data"));
        };

        /*개인 프로젝트 생성*/
        orgService.createPersonalProject = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs', 'POST', param));
        };

        /*조직 목록 조회 : 로그인 사용자 관련*/
        orgService.getOrgList = function (userId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/'+userId+'/orgList', 'GET'));
        };

        /*조직 목록 조회 - 소속 조직 : 로그인 사용자 관련 : 사용안함*/
        /*orgService.getMyOrgList = function (schType, schText) {
            var getParams = {
                'schType' : schType,
                'schText' : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/my', 'GET', getParams));
        };*/

        /*조직 목록 조회 - 소속 조직 : 로그인 사용자 관련*/
        orgService.getMyProjectOrgList = function (projectId) {
            var getParams = {
                'projectId' : projectId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/my', 'GET', getParams));
        };

        /*조직 사용자 조회*/
        orgService.listOrgUsers = function (id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/users', 'GET'));
        };

        /*조직 정보 조회*/
        orgService.getOrg = function (id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id, 'GET'));
        };

        /*조직 수정*/
        orgService.updateOrg = function (id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id, 'PUT', param));
        };

        /*조직 설명 수정*/
        orgService.updateOrgDescription = function (id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/description', 'PUT', param));
        };

        /*조직 이름 수정*/
        orgService.updateOrgName = function (id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/orgName', 'PUT', param));
        };

        /*조직 사용자 추가/초대*/
        orgService.orgUserAdd = function (id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/orgUserAdd', 'POST', param, 'application/x-www-form-urlencoded'));
        };

        /*조직 사용자 추가/초대-일괄*/
        orgService.orgUserAdds = function (id, param) {
        	return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/orgUserAdd/multi', 'POST', param));
        };

        /*[조직삭제] 실행*/
        orgService.deleteOrg = function (id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id, 'DELETE'));
        };

        /*조직 책임자 수정*/
        orgService.changeOrgManager = function (id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/changeOwner', 'PUT', param));
        };

        /* 20.05.07 - 조직 관리자 수정 추가 by ksw */
        orgService.changeOrgAdmin = function (id, params) {
            var param = {
                urlParams: {
                    "email": params.email,
                    "roleName": params.userRole
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/changeAdmin', 'PUT', param));
        };

        /*사용자 삭제*/
        orgService.deleteOrgUser = function(id, email){
            var param = {
                "email" : email
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + id + '/orgUser', 'DELETE', param));
        };

        /*기업 사용자 조회 : 사용안함*/
        /*orgService.listCompUsers = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/getCompanyUsers', 'GET'));
        };*/

        /*PaaS 앱 인스턴스 조회*/
        orgService.listPaasApps = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/paasAll', 'GET'));
        };

        /*IaaS 인스턴스 조회*/
        orgService.listIaasInstances = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/iaasAll', 'GET'));
        };

        /*IaaS 필수 Products 조회:사용안함*/
        /*orgService.getIaasDefaults = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/getIaasDefaults', 'GET'));
        };*/

        /*Wide 조회:사용안함*/
        /*orgService.listWide = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/wideAll', 'GET'));
        };

        /!*Ci 조회*!/
        orgService.listCi = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/ciAll', 'GET'));
        };

        /!*Git 조회*!/
        orgService.listGit = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/gitAll', 'GET'));
        };*/

        /*paas 조직정보 조회*/
        orgService.getOrganizationByName = function (name, depth) {
            var getParams = {
                urlPaths : {
                    "name" : name
                },
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/name/{name}', 'GET', getParams));
        };
        
        orgService.createOrgIcon = function (ordId, body) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + ordId + '/icon', 'POST', body, "multipart/form-data"));
        };

        /*사용자가 생성한 개인프로젝트 건수*/
        orgService.getMyPersonalCnt = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/myPersonal/cnt', 'GET'));
        };

        /*조직코드로 조직조회*/
        orgService.orgIdValidationCheck = function (param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/check/orgId', 'GET', param));
        };

        /* 즐겨찾기 추가 */
        orgService.orgBookmarkAdd = function (id) {
            var param = {
                urlParams : {
                    "orgId" : id
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/org_bookmark', 'POST', param));
        };

        /* 즐겨찾기 삭제 */
        orgService.orgBookmarkDelete = function (id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/org_bookmark/' + id, 'DELETE'));
        };

        /*사용자포탈 프로젝트 대시보드 미터링값*/
        orgService.getMeteringHourlys = function (orgId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/orgs/' + orgId + '/meteringHourly', 'GET'));
        };

		return orgService;
	})
;
