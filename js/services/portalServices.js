//'use strict';

angular.module('portal.services', [])
    .factory('portal', function (common, CONSTANTS) {
    	var portal = {};

        portal.portalOrgs = {};

        portal.portalOrgs.listAllProjects = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/projects', 'GET'));
        };

        portal.portalOrgs.syncListAllProjects = function () {
            return common.syncHttpResponseJson(CONSTANTS.uaaContextUrl + '/projects', 'GET');
        };

        portal.portalOrgs.listAllPortalOrgs = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/orgs/my', 'GET'));
        };

        portal.portalOrgs.syncListAllPortalOrgs = function (projectId) {
            var getParams = null;
            if (projectId) {
                getParams = {
                    "schType": "projectId",
                    "schText": projectId
                };
            }
            return common.syncHttpResponseJson(CONSTANTS.uaaContextUrl + '/orgs/my', 'GET', getParams);
        };

        portal.portalOrgs.listPortalOrgsByProjectId = function (projectId) {
            var getParams = {
                "schType": "projectId",
                "schText": projectId
            };
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/orgs/my', 'GET', getParams));
        };

        portal.users = {};

        portal.users.getAccessToken = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCoreContextUrl + '/users/access_token', 'GET'));
        };

        portal.users.getUserCount = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCoreContextUrl + '/users/count', 'GET'));
        };

        portal.regions = {};

        portal.regions.syncListAllMyRegions = function () {
            return common.syncHttpResponseJson(CONSTANTS.paasApiCoreContextUrl + '/regions/my/all', 'GET');
        };

        portal.regions.listAllMyRegions = function () {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCoreContextUrl + '/regions/my/all', 'GET'));
        };

        portal.organizations = {};
        // 동기 방식
        portal.organizations.syncListAllOrganizations = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.syncHttpResponseJson(CONSTANTS.paasApiCfContextUrl + '/organizations/all', 'GET', getParams);
        };

        portal.organizations.listAllOrganizations = function (condition, depth) {
            var getParams = {
                "condition" : condition ? condition : "",
                "depth" : depth ? depth : 0
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/all', 'GET', getParams));
        };

		return portal;
    })
    .factory('portaldate', function () {

		function portaldate (date) {
			this.date = date;
		}

		portaldate.prototype.getToday = function(seperator){
			try{
				var obj = this.date;
				var year = obj.getFullYear().toString();
				var tempDate = obj.getDate();
				var date = tempDate < 10 ? "0".concat(tempDate.toString()) : tempDate.toString();
				var tempMonth = obj.getMonth() + 1;
				var month = tempMonth < 10 ? "0".concat(tempMonth.toString()) : tempMonth.toString();
				var fullDate = year.concat(month).concat(date);
				if(seperator){
					return fullDate.toDate(seperator);
				}else{
					return fullDate;
				}
			}catch(e){
				return "Date.getToday : "  + e.message;
			}
		};

		String.prototype.toDate = function(seperator){
			seperator = seperator || "-";
			if(this.length != 8){
				return "";
			}else{
				return (this.substring(0,4) + seperator + this.substring( 4,6 ) + seperator + this.substring( 6,8 ));
			}
		};

		return portaldate;
	})
	.factory('commonUtil', function ($http, $q, $location) {

		var commonUtil = {};

		commonUtil.getMemoryLimit = function(memoryLimit) {
			if(memoryLimit >= 1024) {
				return (memoryLimit/1024).toFixed(1)+'GB';
			}
			return memoryLimit+'MB';
		}

		commonUtil.getBuildpackInfoOld = function(buildpackName, isSmall) {
			var name = '';
			var image = '';
			var version = [];
			var url = '';
			var appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/hello-spring.war';
			var prefix = 'prog';
			if(isSmall == 'small') prefix = 'srog';
			switch(buildpackName) {
				case 'staticfile_buildpack':
					name = 'STATIC';
					image = 'images/' + prefix + '_img1.png';
					version = ['Nginx 1.11.1'];
					url = 'https://github.com/cloudfoundry/staticfile-buildpack/releases/tag/v1.3.9';
					break;
				case 'java_buildpack':
					name = 'JAVA';
					image = 'images/' + prefix + '_img7.png';
					appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/hello-spring.war';
					version = ['Log4j API 2.1.0', 'MariaDB JDBC	1.4.4', 'PostgreSQL JDBC 9.4.1208', 'RedisStore	1.2.0_RELEASE', 'OpenJDK JRE 1.8.0_91', 'Tomcat 8.0.33', 'Spring Boot CLI 1.3.5'];
					url = 'https://github.com/cloudfoundry/java-buildpack/releases/tag/v3.7.1';
					break;
				case 'ruby_buildpack':
					name = 'RUBY';
					image = 'images/' + prefix + '_img4.png';
					version = ['Ruby 2.3.1', 'JRuby	Ruby-2.3.0-JRuby-9.1.2.0', 'OpenJDK 1.8-latest 1.8.0_91'];
					url = 'https://github.com/cloudfoundry/ruby-buildpack/releases/tag/v1.6.19';
					break;
				case 'nodejs_buildpack':
					name = 'NODE.JS';
					image = 'images/' + prefix + '_img6.png';
					version = ['Node 6.2.1'];
					url = 'https://github.com/cloudfoundry/nodejs-buildpack/releases/tag/v1.5.15';
					break;
				case 'go_buildpack':
					name = 'GO';
					image = 'images/' + prefix + '_img5.png';
					version = ['Go 1.6.2', 'Godep v65'];
					url = 'https://github.com/cloudfoundry/go-buildpack/releases/tag/v1.7.8';
					break;
				case 'python_buildpack':
					name = 'PYTHON';
					image = 'images/' + prefix + '_img9.png';
					version = ['Python 3.5.0'];
					url = 'https://github.com/cloudfoundry/python-buildpack/releases/tag/v1.5.6';
					break;
				case 'php_buildpack':
					name = 'PHP';
					image = 'images/' + prefix + '_img3.png';
					version = ['PHP 7.0.7', 'Newrelic 6.3.0.161', 'Nginx 1.9.15'];
					url = 'https://github.com/cloudfoundry/php-buildpack/releases/tag/v4.3.14';
					break;
				case 'binary_buildpack':
					name = 'BINARY';
					image = 'images/' + prefix + '_img2.png';
					version = ['Binary 1.0.2'];
					url = 'https://github.com/cloudfoundry/binary-buildpack/releases/tag/v1.0.2';
					break;
				case 'egov_buildpack':
					name = 'eGovFramework';
					image = 'images/' + prefix + '_img10.png';
					version = ['eGov 3.0'];
					break;
				default:
					name = String(buildpackName).toUpperCase();
					image = 'images/' + prefix + '_img8.png';
			}
			return {'name': name, 'img': image, 'appFilePath': appFilePath, 'version': version, 'url':url};
		}

		commonUtil.getBuildpackInfo = function(buildpackName, isSmall) {
			var name = '';
			var image = '';
			var version = [];
			var url = '';
			var appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/hello-spring.war';
			var prefix = 'prog';
			if(isSmall == 'small') prefix = 'srog';
			switch(buildpackName) {
				case 'staticfile_buildpack':
					name = 'STATIC';
					image = 'images/' + prefix + '_img1.png';
					appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/sampleApp-static.zip';
					version = ['Nginx 1.11.1'];
					url = 'https://github.com/cloudfoundry/staticfile-buildpack/releases/tag/v1.3.9';
					break;
				case 'java_buildpack':
					name = 'JAVA';
					image = 'images/' + prefix + '_img7.png';
					appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/hello-spring.war';
					version = ['Log4j API 2.1.0', 'MariaDB JDBC	1.4.4', 'PostgreSQL JDBC 9.4.1208', 'RedisStore	1.2.0_RELEASE', 'OpenJDK JRE 1.8.0_91', 'Tomcat 8.0.33', 'Spring Boot CLI 1.3.5'];
					url = 'https://github.com/cloudfoundry/java-buildpack/releases/tag/v3.7.1';
					break;
				case 'ruby_buildpack':
					name = 'RUBY';
					image = 'images/' + prefix + '_img4.png';
					appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/sampleApp-ruby.zip';
					version = ['Ruby 2.3.1', 'JRuby	Ruby-2.3.0-JRuby-9.1.2.0', 'OpenJDK 1.8-latest 1.8.0_91'];
					url = 'https://github.com/cloudfoundry/ruby-buildpack/releases/tag/v1.6.19';
					break;
				case 'nodejs_buildpack':
					name = 'NODE.JS';
					image = 'images/' + prefix + '_img6.png';
					appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/sampleApp-nodejs.zip';
					version = ['Node 6.2.1'];
					url = 'https://github.com/cloudfoundry/nodejs-buildpack/releases/tag/v1.5.15';
					break;
				case 'go_buildpack':
					name = 'GO';
					image = 'images/' + prefix + '_img5.png';
					appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/sampleApp-go.zip';
					version = ['Go 1.6.2', 'Godep v65'];
					url = 'https://github.com/cloudfoundry/go-buildpack/releases/tag/v1.7.8';
					break;
				case 'python_buildpack':
					name = 'PYTHON';
					image = 'images/' + prefix + '_img9.png';
					version = ['Python 3.5.0'];
					url = 'https://github.com/cloudfoundry/python-buildpack/releases/tag/v1.5.6';
					break;
				case 'php_buildpack':
					name = 'PHP';
					image = 'images/' + prefix + '_img3.png';
					appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/sampleApp-php.zip';
					version = ['PHP 7.0.7', 'Newrelic 6.3.0.161', 'Nginx 1.9.15'];
					url = 'https://github.com/cloudfoundry/php-buildpack/releases/tag/v4.3.14';
					break;
				case 'binary_buildpack':
					name = 'BINARY';
					image = 'images/' + prefix + '_img2.png';
					version = ['Binary 1.0.2'];
					url = 'https://github.com/cloudfoundry/binary-buildpack/releases/tag/v1.0.2';
					break;
				case 'egov_buildpack':
					name = 'eGovFramework';
					image = 'images/' + prefix + '_img10.png';
					version = ['eGov 3.0'];
					break;
				default:
					name = String(buildpackName).toUpperCase();
					image = 'images/' + prefix + '_img8.png';
			}
			return {'name': name, 'img': image, 'appFilePath': appFilePath, 'version': version, 'url':url};
		}

		commonUtil.getEnvByBuildpack = function(buildpackName) {
			var _vs = [];
			var _sv = [];
			var _fw = [];
			switch(buildpackName) {
				case 'staticfile_buildpack':
					_sv = [{name: 'Nginx', disabled: false}];
					break;
				case 'java_buildpack':
					_vs = [{name: 'OpenJDK-1.8.0_91', disabled: false}];
					_sv = [{name: 'Tomcat', disabled: false},{name: 'JBoss', disabled: true},{name: 'Jeus', disabled: true},{name: 'Weblogic', disabled: true}];
					_fw = [{name: 'Spring Boot', disabled: false},{name: 'eGovFramework-v2.5', disabled: false},{name: 'eGovFramework-v3.5', disabled: false}];
					break;
				case 'ruby_buildpack':
					_vs = [{name: 'ruby-2.3.1', disabled: false},{name: 'ruby-2.1.8', disabled: true},{name: 'ruby-2.1.9', disabled: true},{name: 'ruby-2.2.4', disabled: true},{name: 'ruby-2.2.5', disabled: true},{name: 'ruby-2.3.0', disabled: true}];
					_fw = [{name: 'Rails', disabled: false}];
					break;
				case 'nodejs_buildpack':
					_vs = [{name: 'node-6.2.1', disabled: false},{name: 'node-0.10.44', disabled: true},{name: 'node-0.10.45', disabled: true},{name: 'node-0.12.13', disabled: true},{name: 'node-0.12.14', disabled: true},{name: 'node-4.4.4', disabled: true},{name: 'node-4.4.5', disabled: true},{name: 'node-5.10.1', disabled: true},{name: 'node-5.11.1', disabled: true},{name: 'node-6.2.0', disabled: true}];
					break;
				case 'go_buildpack':
					_vs = [{name: 'go-1.6.2', disabled: false},{name: 'go-1.5.3', disabled: true},{name: 'go-1.5.4', disabled: true},{name: 'go-1.6.1', disabled: true}];
					break;
				case 'python_buildpack':
					_vs = [{name: 'python-3.5.0', disabled: false},{name: 'python-2.7.10', disabled: true},{name: 'python-2.7.11', disabled: true},{name: 'python-3.3.5', disabled: true},{name: 'python-3.3.6', disabled: true},{name: 'python-3.4.3', disabled: true},{name: 'python-3.4.4', disabled: true},{name: 'python-3.5.1', disabled: true}];
					break;
				case 'php_buildpack':
					_vs = [{name: 'php-7.0.7', disabled: false},{name: 'php-5.5.35', disabled: true},{name: 'php-5.5.36', disabled: true},{name: 'php-5.6.21', disabled: true},{name: 'php-5.6.22', disabled: true},{name: 'php-7.0.6', disabled: true}];
					_sv = [{name: 'httpd', disabled: false},{name: 'Nginx', disabled: true}];
					break;
				case 'binary_buildpack':
					break;
				case 'egov_buildpack':
					_sv = [{name: 'Tomcat', disabled: false},{name: 'JBoss', disabled: true},{name: 'Jeus', disabled: true},{name: 'Weblogic', disabled: true}];
					_fw = [{name: 'eGovFramework', disabled: false},{name: 'Spring Boot', disabled: true}];
					break;
			}
			var envs = (_sv == '' && _fw == '') ? null : {servers: _sv, frameworks: _fw};
			return {versions: _vs, servers: _sv, frameworks: _fw};
		}

		commonUtil.go = function(path) {
			$location.path(path);
		};

		return commonUtil;
	})
;
