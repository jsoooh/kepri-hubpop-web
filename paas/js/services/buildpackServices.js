//'use strict';

angular.module('paas.services')
	.factory('buildpackService', function (common, cloudFoundry, CONSTANTS) {

		var buildpackService = {};

        buildpackService.listPortalBuildpacks = function (size, page) {
            return cloudFoundry.portalBuildpacks.listPortalBuildpacks(size, page);
        };

        buildpackService.getPortalBuildpack = function (id) {
            return cloudFoundry.portalBuildpacks.getPortalBuildpack(id);
        };

        buildpackService.deletePortalBuildpack = function (id) {
            return cloudFoundry.portalBuildpacks.deletePortalBuildpack(id);
        };

        buildpackService.createPortalBuildpack = function (portalBuildpackBody) {
            return cloudFoundry.portalBuildpacks.createPortalBuildpack(portalBuildpackBody);
        };

        buildpackService.updatePortalBuildpack = function (id, portalBuildpackBody) {
            return cloudFoundry.portalBuildpacks.updatePortalBuildpack(id, portalBuildpackBody);
        };

        buildpackService.listAllBuildpacks = function () {
            return cloudFoundry.buildpacks.listAllBuildpacks(null);
        };

        buildpackService.listAllPortalBuildpackVersions = function () {
            return cloudFoundry.portalBuildpackVersions.listAllPortalBuildpackVersions();
        };

        buildpackService.listPortalBuildpackVersions = function (id, size, page) {
            return cloudFoundry.portalBuildpacks.listPortalBuildpackVersions(id, size, page);
        };

        buildpackService.createBuildpack = function (pid, body) {
            return cloudFoundry.buildpacks.createBuildpack(pid, body);
        };

        buildpackService.getBuildpack = function (guid) {
            return cloudFoundry.buildpacks.getBuildpack(guid);
        };

        buildpackService.updateBuildpack = function (guid, body) {
            return cloudFoundry.buildpacks.updateBuildpack(guid, body);
        };

        buildpackService.deleteBuildpack = function (guid) {
            return cloudFoundry.buildpacks.deleteBuildpack(guid);
        };

		return buildpackService;
	})
;
