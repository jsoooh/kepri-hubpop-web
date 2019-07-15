//'use strict';

angular.module('portal.services', [])
    .factory('portal', function (common, CONSTANTS) {
    	var portal = {};

        portal.sso = {};

        portal.sso.decode = function(params) {
            var pathUrl = '/sso/decode';
            var method = 'GET';

            var promise = common.resourcePromise(pathUrl, method, params);
            var finallyFn = function() {
                //_DebugConsoleLog('finallyFn', 3);
            };

            return common.retrieveResource(promise, finallyFn);
        };

        portal.sso.createProjectResponsiblePersonSso = function(params) {
            var pathUrl = CONSTANTS.uaaContextUrl + '/users2/projectResponsiblePersonSso';
            var method = 'POST';

            var promise = common.resourcePromise(pathUrl, method, params);
            var finallyFn = function() {
                //_DebugConsoleLog('finallyFn', 3);
            };

            return common.retrieveResource(promise, finallyFn);
        };

        portal.menu = {};

        /* 메뉴 목록 */
        portal.menu.getMenuList = function() {
            return common.syncHttpResponseJson(CONSTANTS.uaaContextUrl + '/menus', 'GET');
        };

        //Left Menu 구조 생성
        portal.menu.setListMenu = function(mc, myRoleName) {
            var menuList = mc.dbMenuList;
            var repeatData = [];
            if (!angular.isArray(menuList)) return;
            for (var i = 0; i < menuList.length; i++) {
                if (myRoleName == 'Manager') {
                    if (menuList[i].isManager) {
                        repeatData.push(menuList[i]);
                    }
                } else if (myRoleName == 'UserPM') {
                    if (menuList[i].isUserPm) {
                        repeatData.push(menuList[i]);
                    }
                } else if (myRoleName == 'User'){
                    if (menuList[i].isUser) {
                        repeatData.push(menuList[i]);
                    }
                } else {
                    repeatData.push(menuList[i]);
                }
            }

            var leftMenu = "\n	<!-- depth1 START -->\n";
            leftMenu += "	<ul class='gnb-menu dept1 depth1'>\n";
            var parentId1 = '';
            var parentId2 = '';

            for (var i = 0; i < repeatData.length; i++) {
                // Depth 1
                if (repeatData[i].level == '1') {
                    //var icoId = repeatData[i].id.toString().substr(2,1);
                    var icoId = !repeatData[i].iconId ? "" : repeatData[i].iconId.toString();
                    if (repeatData[i].childCnt == 0) {
                        leftMenu += "		<li class='dept1'>\n";
                        if (repeatData[i].urlPath) {
                            leftMenu += "			<a class='dept1' href='" + repeatData[i].urlPath + "'><span class='ico-bul " + icoId + "'></span>" + repeatData[i].depth1 + "</a>\n";
                        } else {
                            leftMenu += "			<a class='dept1' href='javascript:void(0);'><span class='ico-bul " + icoId + "'></span>" + repeatData[i].depth1 + "</a>\n";
                        }
                        leftMenu += "		</li>\n";
                    } else {
                        parentId1 = repeatData[i].id;
                        leftMenu += "		<li class='dept1'>\n";
                        leftMenu += "			<a class='dept1' href='javascript:void(0);' onclick='depth1Click(event);'><span class='ico-bul " + icoId + "'></span>" + repeatData[i].depth1 + "<span class='ico ico-arr'></span></a>\n";
                        leftMenu += "			<ul class='dept2' style='display:none' onmouseleave='depth3Leave();'>\n";
                    }
                }
                // Depth 2
                if (repeatData[i].level == '2' && repeatData[i].parentId == parentId1) {
                    if (repeatData[i].childCnt == 0) {
                        leftMenu += "				<li class='dept2' onmouseover='depth2LiHover(event,\"no\");'>\n";
                        if (repeatData[i].urlPath) {
                            leftMenu += "					<a class='dept2' href='" + repeatData[i].urlPath + "' onmouseover='depth2Hover(event,\"no\");' onclick='depth2Click(event);'>" + repeatData[i].depth2 + "</a>\n";
                        } else {
                            leftMenu += "					<a class='dept2' href='javascript:void(0);' onmouseover='depth2Hover(event,\"no\");' onclick='depth2Click(event);'>" + repeatData[i].depth2 + "</a>\n";
                        }
                        leftMenu += "				</li>\n";
                     } else {
                        parentId2 = repeatData[i].id;
                        leftMenu += "				<li class='dept2' onmouseover='depth2LiHover(event);'>\n";
                        leftMenu += "					<a class='dept2' href='javascript:void(0);' onmouseover='depth2Hover(event);' onclick='depth2Click(event);'>" + repeatData[i].depth2 + "<span class='ico ico-arr'></span></a>\n";
                        leftMenu += "					<ul class='dept3' style='display:none' >\n";
                    }
                }
                // Depth 3
                if (repeatData[i].level == '3' && repeatData[i].parentId == parentId2) {
                    leftMenu += "						<li class='dept3'>\n";
                    leftMenu += "							<a class='dept3' href='" + repeatData[i].urlPath + "' onclick='depth3Click(event);' onclick='depth2Click(event);'>" + repeatData[i].depth3 + "</a>\n";
                    leftMenu += "						</li>\n";
                }
                if (i == repeatData.length-1) {
                    if (repeatData[i].level == '3') {
                        leftMenu += "					</ul>\n";
                        leftMenu += "					<!-- dept3 END -->\n";
                        leftMenu += "				</li>\n";
                    }
                    if (repeatData[i].level == '2' || repeatData[i].level == '3') {
                        leftMenu += "			</ul>\n";
                        leftMenu += "			<!-- dept2 END -->\n";
                        leftMenu += "		</li>\n";
                    }
                } else if (i+1 < repeatData.length) {
                    if ((repeatData[i+1].level == '1' || repeatData[i+1].level == '2') && repeatData[i].level == '3' && repeatData[i+1].parentId != parentId2 && repeatData[i].parentId) {
                        leftMenu += "					</ul>\n";
                        leftMenu += "					<!-- dept3 END -->\n";
                        leftMenu += "				</li>\n";
                    }
                    if (repeatData[i+1].level == '1' && repeatData[i+1].parentId != parentId1 && repeatData[i].parentId) {
                        leftMenu += "			</ul>\n";
                        leftMenu += "			<!-- dept2 END -->\n";
                        leftMenu += "		</li>\n";
                    }
                }
            }

            leftMenu += "	</ul>\n";
            leftMenu += "	<!-- depth1 END -->\n";

            $("#leftMenu").html(leftMenu);
        };

        //url정보 체크하여 메뉴 위치 확인
        portal.menu.urlCheck = function(){
            var nowHost = $(location).attr('host');
            var nowPage = $(location).attr('href');
            var nowHref = nowPage.split(nowHost);

            $("#leftMenu").find('a').each(function(){
                var thisHref = $(this).attr("href");

                if (nowHref[1].match(thisHref)) {
                    if ($(this).hasClass("on")) {

                    } else {
                        $("#leftMenu").find('a').removeClass("on");
                        $("#leftMenu").find('ul.dept2').hide(0);
                        $("#leftMenu").find('ul.dept3').hide(0);
                        $(this).toggleClass("on");

                        if ($(this).hasClass("dept3")) {
                            $(this).closest("li.dept2").find("a.dept2").toggleClass("on");
                            $(this).closest("li.dept1").find("ul.dept2").toggle(0);
                            $(this).closest("li.dept1").find("a.dept1").toggleClass("on open");
                        }
                        if ($(this).hasClass("dept2")) {
                            $(this).closest("li.dept1").find("ul.dept2").toggle(0);
                            $(this).closest("li.dept1").find("a.dept1").toggleClass("on open");
                        }
                        if ($(this).hasClass("dept1")) {
                            $(this).closest("li.dept1").find("ul.dept2").toggle(0);
                        }
                    }
                }
            })
        };

        //////////////////////////////// 대시보드 관련 API 호출 2018.10.16   Start  ///////////////////////////////////
        portal.dashboard = {};

        portal.dashboard.getTenantInfoByName = function (orgCode, teamCode) {
            var getParams = {
                orgCode : orgCode,
                teamCode : teamCode
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/org/one', 'GET', getParams));
        };

        portal.dashboard.getIaasInseanceInfos = function (tenantId) {
            var getParams = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', getParams));
        };

        portal.dashboard.getIaasResourceUsed = function (tenantId) {
            var getParams = {
                tenantId : tenantId
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/tenant/resource/used', 'GET', getParams));
        };

        portal.dashboard.getOrganizationByName = function (name) {
            var getParams = {
                urlPaths : {
                    "name" : name
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/organizations/name/{name}', 'GET', getParams));
        };

        portal.dashboard.getPaasAppInfos = function (organization_guid) {
            var getParams = {
                condition : "organization_guid:" + organization_guid,
                depth: 2
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/all', 'GET', getParams));
        };

        portal.dashboard.getPaasAppInstanceStatsInfos = function (app_guid) {
            var getParams = {
                urlPaths : {
                    "guid" : app_guid
                }
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.paasApiCfContextUrl + '/apps/{guid}/instance_stats/all', 'GET', getParams));
        };

        portal.dashboard.getDcpDashboardInfo = function (prjcCd) {
            var getParams = {
                prjcCd : prjcCd
            };
            /*return common.retrieveResource(common.resourcePromise('http://168.78.82.189:8086/dcp/api/userConsoleDashboard.do', 'GET', getParams));*/
            return common.retrieveResource(common.resourcePromise('/dcp/api/userConsoleDashboard/'+prjcCd, 'GET'));
        };

        portal.dashboard.getPipelineDashBoardInfo = function (p_proj_id) {
            var getParams = {
                p_proj_id : p_proj_id
            };
            return common.retrieveResource(common.resourcePromise('/dpl/pipeline/pipelineDashBoardApi.json', 'GET', getParams));
        };

        portal.dashboard.getApipDashBoardInfo = function () {
            return common.retrieveResource(common.resourcePromise('/apip/com/dashboard.json', 'GET'));
        };

        portal.dashboard.getGisDashBoardInfo = function (prjcCd) {
            var getParams = {
                prjcCd : prjcCd
            };
            /*return common.retrieveResource(common.resourcePromise('http://168.78.82.183:58080/gis/api/projectInfo.do', 'GET', getParams));*/
            return common.retrieveResource(common.resourcePromise('/gis/api/projectInfo.do', 'GET', getParams));
        };
        //////////////////////////////// 대시보드 관련 API 호출 2018.10.16   End  ///////////////////////////////////

        portal.portalOrgs = {};

        portal.portalOrgs.listAllProjects = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/projects', 'GET'));
        };

        portal.portalOrgs.syncListAllProjects = function () {
            return common.syncHttpResponseJson(CONSTANTS.uaaContextUrl + '/projects', 'GET');
        };

		portal.portalOrgs.syncListAllProjectsByAdmin = function () {
			return common.syncHttpResponseJson(CONSTANTS.uaaContextUrl + '/projects/all', 'GET');
		};

        portal.portalOrgs.listAllPortalOrgs = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.uaaContextUrl + '/orgs/my', 'GET'));
        };

        portal.portalOrgs.syncListAllPortalOrgs = function (projectId) {
            var getParams = null;
            if (projectId) {
                getParams = {
                    "projectId": projectId
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

        portal.portalOrgs.syncGetOrganizationByName = function (name, depth) {
            var getParams = {
                urlPaths : {
                    "name" : name
                },
				"depth" : depth ? depth : 0
			};
            return common.syncHttpResponseJson(CONSTANTS.paasApiCfContextUrl + '/organizations/name/{name}', 'GET', getParams);
        };

        portal.portalOrgs.syncListTenantByName = function (orgCode) {
            var getParams = {
                "orgCode" : orgCode
            };
            return common.syncHttpResponse(CONSTANTS.iaasApiContextUrl + '/tenant/org/all', 'GET', getParams, 'application/x-www-form-urlencoded');
        };

        portal.portalOrgs.syncGetTenantByName = function (orgCode, teamCode) {
            var getParams = {
				"orgCode" : orgCode,
				"teamCode" : teamCode
            };
            return common.syncHttpResponse(CONSTANTS.iaasApiContextUrl + '/tenant/org/one', 'GET', getParams, 'application/x-www-form-urlencoded');
        };

        portal.portalOrgs.getNotices = function () {
            return common.retrieveResource(common.resourcePromise('/hsvc/api/noti/info/v1.0', 'GET'));
        };

        portal.users = {};

        portal.users.getAccessToken = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.paasApiCoreContextUrl + '/users/access_token', 'GET'));
        };

        portal.users.getUserCount = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.paasApiCoreContextUrl + '/users/count', 'GET'));
        };

        portal.regions = {};

        portal.regions.syncListAllRegions = function () {
            return common.syncHttpResponseJson(CONSTANTS.paasApiCoreContextUrl + '/regions/all', 'GET');
        };

        portal.regions.listAllRegions = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.paasApiCoreContextUrl + '/regions/all', 'GET'));
        };

        portal.regions.syncListAllMyRegions = function () {
            return common.syncHttpResponseJson(CONSTANTS.paasApiCoreContextUrl + '/regions/my/all', 'GET');
        };

        portal.regions.listAllMyRegions = function () {
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.paasApiCoreContextUrl + '/regions/my/all', 'GET'));
        };

        portal.regions.syncListAllPaaSMyRegions = function (email) {
            var getParams = {
                urlPaths : {
                    "email" : email
                }
            };
            return common.syncHttpResponseJson(CONSTANTS.paasApiMarketContextUrl + '/regions/my/{email}/all', 'GET', getParams);
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
            return common.retrieveResource(common.resourcePromiseJson(CONSTANTS.paasApiCfContextUrl + '/organizations/all', 'GET', getParams));
        };

        portal.marketCategorys = {};

        portal.marketCategorys.syncListAllMarketCategoriesByParentIdAndOpenStatus = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.syncHttpResponseJson(CONSTANTS.paasApiMarketContextUrl + '/market_categories/parent/{id}/all', 'GET', getParams);
        };

        portal.marketCategorys.syncListAllMarketCategoriesByParentId = function (id) {
            var getParams = {
                urlPaths : {
                    "id" : id
                }
            };
            return common.syncHttpResponseJson(CONSTANTS.paasApiMarketContextUrl + '/admin/market_categories/parent/{id}/all', 'GET', getParams);
        };

        portal.alarms = {};
        portal.alarms.listAlarms = function (email, size, page, schText) {
            var getParams = {
                "size"    : size ? size : 4,
                "page"    : page ? page : 0,
                "userId"  : email ? email : "",
                "schText" : schText ? schText : ""
            };

            return common.retrieveResource(common.resourcePromise(CONSTANTS.monitApiContextUrl + '/event_histories/user/page', 'GET', getParams));
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
				if (seperator) {
					return fullDate.toDate(seperator);
				} else {
					return fullDate;
				}
			}catch(e){
				return "Date.getToday : "  + e.message;
			}
		};

		String.prototype.toDate = function(seperator){
			seperator = seperator || "-";
			if (this.length != 8) {
				return "";
			} else {
				return (this.substring(0,4) + seperator + this.substring( 4,6 ) + seperator + this.substring( 6,8 ));
			}
		};

		return portaldate;
	})
	.factory('commonUtil', function ($http, $q, $location) {

		var commonUtil = {};

		commonUtil.getMemoryLimit = function(memoryLimit) {
			if (memoryLimit >= 1024) {
				return (memoryLimit/1024).toFixed(1)+'GB';
			}
			return memoryLimit+'MB';
		};

		commonUtil.getBuildpackInfoOld = function(buildpackName, isSmall) {
			var name = '';
			var image = '';
			var version = [];
			var url = '';
			var appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/hello-spring.war';
			var prefix = 'prog';
			if (isSmall == 'small') prefix = 'srog';
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
		};

		commonUtil.getBuildpackInfo = function(buildpackName, isSmall) {
			var name = '';
			var image = '';
			var version = [];
			var url = '';
			var appFilePath = 'https://s3.ap-northeast-2.amazonaws.com/basic-app-dev/hello-spring.war';
			var prefix = 'prog';
			if (isSmall == 'small') prefix = 'srog';
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
		};

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
		};

		commonUtil.go = function(path) {
			$location.path(path);
		};

		return commonUtil;
	})
    .factory('paging', function ($translate,common, cache, cookies, CONSTANTS) {

        var paging = {};

        paging.makePagingOptions = function(data,fn) {
            var opt = {};
            opt.currentPage = data.number;
            opt.pageSize = data.size == null ? 10 : data.size;
            opt.total = data.totalElements;
            return opt;
        };

        return paging;
    })
;

angular.module('iaas.services', []);
angular.module('product.services', []);
angular.module('paas.services', []);
angular.module('market.services', []);
angular.module('monit.services', []);

